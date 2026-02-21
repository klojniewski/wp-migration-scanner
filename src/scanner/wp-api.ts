import type { ContentType, TaxonomyRef } from "../types";
import { type Fetcher, fetchJson, DEFAULT_HEADERS } from "./http";
import { decodeHtmlEntities, toErrorMessage } from "./utils";

const SKIP_TYPES = new Set([
  "attachment",
  "nav_menu_item",
  "wp_block",
  "wp_template",
  "wp_template_part",
  "wp_navigation",
  "wp_font_family",
  "wp_font_face",
  "wp_global_styles",
  "elementor_library",
  "e-landing-page",
]);

const SKIP_TAXONOMIES = new Set([
  "nav_menu",
  "wp_pattern_category",
  "link_category",
  "post_format",
  "wp_theme",
  "elementor_library_type",
  "elementor_library_category",
]);

export interface WpType {
  name: string;
  slug: string;
  rest_base: string;
  taxonomies: string[];
}

export interface WpTaxonomy {
  name: string;
  slug: string;
  rest_base: string;
  types: string[];
}

/** Pure parser — filters out internal WordPress types */
export function parseTypesResponse(json: Record<string, WpType>): WpType[] {
  return Object.values(json).filter((t) => !SKIP_TYPES.has(t.slug));
}

/** Pure parser — filters out internal WordPress taxonomies */
export function parseTaxonomiesResponse(json: Record<string, WpTaxonomy>): WpTaxonomy[] {
  return Object.values(json).filter((t) => !SKIP_TAXONOMIES.has(t.slug));
}

/** Pure parser — extracts count and sample titles from API content response */
export function parseContentItems(
  json: Array<{ title: { rendered: string } }>,
  totalHeader: string | null,
): { count: number; samples: string[] } {
  const count = parseInt(totalHeader || "0", 10);
  const samples = json
    .map((item) => decodeHtmlEntities(item.title?.rendered || ""))
    .filter(Boolean)
    .slice(0, 5);
  return { count, samples };
}

export async function probeApi(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch,
): Promise<boolean> {
  try {
    const res = await fetcher(`${baseUrl}/wp-json/`, {
      method: "HEAD",
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(5_000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export interface ApiScanResult {
  contentTypes: ContentType[];
  errors: string[];
}

/** Fetch wrapper — orchestrates multi-stage API scanning */
export async function scanViaApi(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch,
): Promise<ApiScanResult> {
  const errors: string[] = [];
  const api = `${baseUrl}/wp-json/wp/v2`;

  // Fetch types and taxonomies in parallel
  const [typesRes, taxRes] = await Promise.all([
    fetchJson(`${api}/types`, fetcher),
    fetchJson(`${api}/taxonomies`, fetcher),
  ]);

  if (!typesRes || !taxRes) {
    throw new Error("Failed to fetch types or taxonomies from REST API");
  }

  const typesData = (await typesRes.json()) as Record<string, WpType>;
  const taxData = (await taxRes.json()) as Record<string, WpTaxonomy>;

  const typeEntries = parseTypesResponse(typesData);
  const taxEntries = parseTaxonomiesResponse(taxData);

  // Build taxonomy lookup: slug → { name, slug, count }
  const taxLookup = new Map<string, { name: string; slug: string; rest_base: string; count: number }>();

  const taxCountResults = await Promise.allSettled(
    taxEntries.map(async (tax) => {
      const res = await fetcher(`${api}/${tax.rest_base}?per_page=1`, {
        headers: DEFAULT_HEADERS,
        signal: AbortSignal.timeout(10_000),
      });
      const total = res.ok ? parseInt(res.headers.get("X-WP-Total") || "0", 10) : 0;
      return { slug: tax.slug, name: tax.name, rest_base: tax.rest_base, count: total };
    })
  );

  for (const result of taxCountResults) {
    if (result.status === "fulfilled") {
      taxLookup.set(result.value.slug, result.value);
    }
  }

  // Fetch content for each type in parallel
  const contentResults = await Promise.allSettled(
    typeEntries.map(async (type) => {
      try {
        const res = await fetcher(`${api}/${type.rest_base}?per_page=5`, {
          headers: DEFAULT_HEADERS,
          signal: AbortSignal.timeout(10_000),
        });

        if (!res.ok) {
          errors.push(`Could not fetch ${type.name}: HTTP ${res.status}`);
          return null;
        }

        const json = (await res.json()) as Array<{ title: { rendered: string } }>;
        const { count, samples } = parseContentItems(json, res.headers.get("X-WP-Total"));

        const taxonomies: TaxonomyRef[] = type.taxonomies
          .map((taxSlug) => taxLookup.get(taxSlug))
          .filter((t): t is NonNullable<typeof t> => t != null && t.count > 0)
          .map((t) => ({ name: t.name, slug: t.slug, count: t.count }));

        const contentType: ContentType = {
          name: type.name,
          slug: type.slug,
          count,
          isEstimate: false,
          samples,
          taxonomies,
        };

        return contentType;
      } catch (err) {
        errors.push(`Error fetching ${type.name}: ${toErrorMessage(err)}`);
        return null;
      }
    })
  );

  const contentTypes = contentResults
    .filter((r): r is PromiseFulfilledResult<ContentType | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((ct): ct is ContentType => ct != null && ct.count > 0);

  return { contentTypes, errors };
}
