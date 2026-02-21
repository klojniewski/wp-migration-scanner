import type { ContentType, TaxonomyRef, ScanResult } from "../types";

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

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#038;/g, "&");
}

interface WpType {
  name: string;
  slug: string;
  rest_base: string;
  taxonomies: string[];
}

interface WpTaxonomy {
  name: string;
  slug: string;
  rest_base: string;
  types: string[];
}

async function fetchJson(url: string): Promise<Response> {
  const res = await fetch(url, {
    headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res;
}

export async function probeApi(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/wp-json/`, {
      method: "HEAD",
      headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function scanViaApi(baseUrl: string): Promise<ScanResult> {
  const errors: string[] = [];
  const api = `${baseUrl}/wp-json/wp/v2`;

  // Fetch types and taxonomies in parallel
  const [typesRes, taxRes] = await Promise.all([
    fetchJson(`${api}/types`),
    fetchJson(`${api}/taxonomies`),
  ]);

  const typesData = (await typesRes.json()) as Record<string, WpType>;
  const taxData = (await taxRes.json()) as Record<string, WpTaxonomy>;

  // Build taxonomy lookup: slug → { name, rest_base, count }
  const taxLookup = new Map<string, { name: string; slug: string; rest_base: string; count: number }>();

  // Fetch term counts for all taxonomies in parallel (skip internal ones)
  const taxEntries = Object.values(taxData).filter((t) => !SKIP_TAXONOMIES.has(t.slug));
  const taxCountResults = await Promise.allSettled(
    taxEntries.map(async (tax) => {
      const res = await fetch(`${api}/${tax.rest_base}?per_page=1`, {
        headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
        signal: AbortSignal.timeout(10000),
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
  const typeEntries = Object.values(typesData).filter((t) => !SKIP_TYPES.has(t.slug));

  const contentResults = await Promise.allSettled(
    typeEntries.map(async (type) => {
      try {
        const res = await fetch(`${api}/${type.rest_base}?per_page=5`, {
          headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          errors.push(`Could not fetch ${type.name}: HTTP ${res.status}`);
          return null;
        }

        const total = parseInt(res.headers.get("X-WP-Total") || "0", 10);
        const items = (await res.json()) as Array<{ title: { rendered: string } }>;
        const samples = items
          .map((item) => decodeHtmlEntities(item.title?.rendered || ""))
          .filter(Boolean)
          .slice(0, 5);

        // Map taxonomy slugs to refs
        const taxonomies: TaxonomyRef[] = type.taxonomies
          .map((taxSlug) => taxLookup.get(taxSlug))
          .filter((t): t is NonNullable<typeof t> => t != null && t.count > 0)
          .map((t) => ({ name: t.name, slug: t.slug, count: t.count }));

        const contentType: ContentType = {
          name: type.name,
          slug: type.slug,
          count: total,
          isEstimate: false,
          samples,
          taxonomies,
        };

        return contentType;
      } catch (err) {
        errors.push(`Error fetching ${type.name}: ${err instanceof Error ? err.message : String(err)}`);
        return null;
      }
    })
  );

  const contentTypes = contentResults
    .filter((r): r is PromiseFulfilledResult<ContentType | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((ct): ct is ContentType => ct != null && ct.count > 0);

  return {
    url: baseUrl,
    scannedAt: new Date().toISOString(),
    apiAvailable: true,
    contentTypes,
    urlStructure: null,
    detectedPlugins: null,
    errors,
  };
}
