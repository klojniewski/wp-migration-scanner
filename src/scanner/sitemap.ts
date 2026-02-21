import { XMLParser } from "fast-xml-parser";

export interface SitemapEntry {
  loc: string;
}

export interface SitemapGroup {
  pattern: string;
  urls: string[];
}

const SITEMAP_PATHS = [
  "/wp-sitemap.xml",
  "/sitemap.xml",
  "/sitemap_index.xml",
];

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchXml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

function extractUrls(parsed: Record<string, unknown>): string[] {
  const urls: string[] = [];

  // Handle <urlset><url><loc>
  const urlset = parsed["urlset"] as Record<string, unknown> | undefined;
  if (urlset) {
    const urlEntries = urlset["url"];
    const entries = Array.isArray(urlEntries) ? urlEntries : urlEntries ? [urlEntries] : [];
    for (const entry of entries) {
      const loc = (entry as Record<string, unknown>)["loc"];
      if (typeof loc === "string") urls.push(loc);
    }
  }

  return urls;
}

function extractSitemapIndexUrls(parsed: Record<string, unknown>): string[] {
  const urls: string[] = [];

  // Handle <sitemapindex><sitemap><loc>
  const index = parsed["sitemapindex"] as Record<string, unknown> | undefined;
  if (index) {
    const sitemaps = index["sitemap"];
    const entries = Array.isArray(sitemaps) ? sitemaps : sitemaps ? [sitemaps] : [];
    for (const entry of entries) {
      const loc = (entry as Record<string, unknown>)["loc"];
      if (typeof loc === "string") urls.push(loc);
    }
  }

  return urls;
}

export interface SitemapResult {
  groups: SitemapGroup[];
  allUrls: string[];
}

export async function parseSitemap(baseUrl: string): Promise<SitemapResult> {
  let allUrls: string[] = [];

  // Try each sitemap path
  for (const path of SITEMAP_PATHS) {
    const xml = await fetchXml(`${baseUrl}${path}`);
    if (!xml) continue;

    const parsed = parser.parse(xml) as Record<string, unknown>;

    // Check if it's a sitemap index
    const childSitemapUrls = extractSitemapIndexUrls(parsed);
    if (childSitemapUrls.length > 0) {
      // Fetch child sitemaps in parallel
      const childResults = await Promise.allSettled(
        childSitemapUrls.map(async (url) => {
          const childXml = await fetchXml(url);
          if (!childXml) return [];
          const childParsed = parser.parse(childXml) as Record<string, unknown>;
          return extractUrls(childParsed);
        })
      );

      for (const result of childResults) {
        if (result.status === "fulfilled") {
          allUrls.push(...result.value);
        }
      }
      break;
    }

    // Direct urlset
    const directUrls = extractUrls(parsed);
    if (directUrls.length > 0) {
      allUrls.push(...directUrls);
      break;
    }
  }

  if (allUrls.length === 0) return { groups: [], allUrls: [] };

  // Group URLs by path pattern
  return { groups: groupUrlsByPattern(baseUrl, allUrls), allUrls };
}

function groupUrlsByPattern(baseUrl: string, urls: string[]): SitemapGroup[] {
  const groups = new Map<string, string[]>();
  const baseHost = new URL(baseUrl).origin;

  for (const url of urls) {
    try {
      const parsed = new URL(url);
      if (parsed.origin !== baseHost) continue;

      const pathParts = parsed.pathname.split("/").filter(Boolean);

      // Skip the homepage
      if (pathParts.length === 0) continue;

      // Use first path segment as the pattern
      // e.g. /blog/my-post → "blog", /case-studies/acme → "case-studies"
      const pattern = pathParts.length === 1 ? "(pages)" : pathParts[0];
      const existing = groups.get(pattern) || [];
      existing.push(url);
      groups.set(pattern, existing);
    } catch {
      // skip malformed URLs
    }
  }

  return Array.from(groups.entries())
    .map(([pattern, urls]) => ({ pattern, urls }))
    .sort((a, b) => b.urls.length - a.urls.length);
}
