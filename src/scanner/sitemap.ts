import { XMLParser } from "fast-xml-parser";
import { type Fetcher, fetchXml } from "./http";

export interface SitemapGroup {
  pattern: string;
  urls: string[];
}

export interface SitemapResult {
  groups: SitemapGroup[];
  allUrls: string[];
}

const SITEMAP_PATHS = [
  "/wp-sitemap.xml",
  "/sitemap.xml",
  "/sitemap_index.xml",
];

const parser = new XMLParser({ ignoreAttributes: false });

/** Pure parser — determines if XML is a sitemap index or urlset */
export function parseSitemapXml(xml: string):
  | { type: "index"; sitemapUrls: string[] }
  | { type: "urlset"; pageUrls: string[] } {
  const parsed = parser.parse(xml) as Record<string, unknown>;

  // Check for sitemap index first
  const index = parsed["sitemapindex"] as Record<string, unknown> | undefined;
  if (index) {
    const sitemaps = index["sitemap"];
    const entries = Array.isArray(sitemaps) ? sitemaps : sitemaps ? [sitemaps] : [];
    const sitemapUrls: string[] = [];
    for (const entry of entries) {
      const loc = (entry as Record<string, unknown>)["loc"];
      if (typeof loc === "string") sitemapUrls.push(loc);
    }
    return { type: "index", sitemapUrls };
  }

  // Direct urlset
  const urlset = parsed["urlset"] as Record<string, unknown> | undefined;
  const pageUrls: string[] = [];
  if (urlset) {
    const urlEntries = urlset["url"];
    const entries = Array.isArray(urlEntries) ? urlEntries : urlEntries ? [urlEntries] : [];
    for (const entry of entries) {
      const loc = (entry as Record<string, unknown>)["loc"];
      if (typeof loc === "string") pageUrls.push(loc);
    }
  }
  return { type: "urlset", pageUrls };
}

/** Pure function — groups page URLs by first path segment */
export function groupSitemapUrls(baseUrl: string, urls: string[]): SitemapGroup[] {
  const groups = new Map<string, string[]>();
  const baseHost = new URL(baseUrl).origin;

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== baseHost) continue;

      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length === 0) continue;

      const pattern = pathParts.length === 1 ? "(pages)" : pathParts[0];
      const existing = groups.get(pattern) || [];
      existing.push(url);
      groups.set(pattern, existing);
    } catch {
      // skip malformed URLs
    }
  }

  return Array.from(groups.entries())
    .map(([pattern, groupUrls]) => ({ pattern, urls: groupUrls }))
    .sort((a, b) => b.urls.length - a.urls.length);
}

/** Fetch orchestrator — tries sitemap paths, handles index → children recursion */
export async function fetchSitemap(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch,
): Promise<SitemapResult> {
  let allUrls: string[] = [];

  for (const path of SITEMAP_PATHS) {
    const xml = await fetchXml(`${baseUrl}${path}`, fetcher);
    if (!xml) continue;

    const result = parseSitemapXml(xml);

    if (result.type === "index" && result.sitemapUrls.length > 0) {
      const childResults = await Promise.allSettled(
        result.sitemapUrls.map(async (url) => {
          const childXml = await fetchXml(url, fetcher);
          if (!childXml) return [];
          const childResult = parseSitemapXml(childXml);
          return childResult.type === "urlset" ? childResult.pageUrls : [];
        })
      );

      for (const childResult of childResults) {
        if (childResult.status === "fulfilled") {
          allUrls.push(...childResult.value);
        }
      }
      break;
    }

    if (result.type === "urlset" && result.pageUrls.length > 0) {
      allUrls = result.pageUrls;
      break;
    }
  }

  if (allUrls.length === 0) return { groups: [], allUrls: [] };

  return { groups: groupSitemapUrls(baseUrl, allUrls), allUrls };
}
