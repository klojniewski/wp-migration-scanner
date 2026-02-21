import type { ContentType, PluginScanResult, ScanResult, TaxonomyRef, UrlStructure } from "../types";
import { probeApi, scanViaApi } from "./wp-api";
import { parseSitemap } from "./sitemap";
import { parseRss } from "./rss";
import { analyzeUrls } from "./urls";
import { detectPlugins } from "./plugins";

async function resolveRedirects(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    // Use the final URL after all redirects, stripped of path/query
    const final = new URL(res.url);
    return `${final.protocol}//${final.host}`;
  } catch {
    // If redirect resolution fails, use the original URL
    return url;
  }
}

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function scan(inputUrl: string): Promise<ScanResult> {
  // Normalize URL
  let baseUrl = inputUrl.trim().replace(/\/+$/, "");
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  // Follow redirects to find the actual site URL
  baseUrl = await resolveRedirects(baseUrl);

  const errors: string[] = [];

  // 1. Probe REST API + always fetch sitemap for URL structure + detect plugins
  const [apiAvailable, sitemapResult, pluginResult] = await Promise.all([
    probeApi(baseUrl),
    parseSitemap(baseUrl).catch((err) => {
      errors.push(`Sitemap parse error: ${err instanceof Error ? err.message : String(err)}`);
      return { groups: [], allUrls: [] as string[] };
    }),
    detectPlugins(baseUrl).catch((err) => {
      errors.push(`Plugin detection error: ${err instanceof Error ? err.message : String(err)}`);
      return null as PluginScanResult | null;
    }),
  ]);

  // Build URL structure from sitemap data
  let urlStructure: UrlStructure | null = null;
  if (sitemapResult.allUrls.length > 0) {
    urlStructure = analyzeUrls(baseUrl, sitemapResult.allUrls);
  }

  // 2. REST API path — use API for content, sitemap for URLs
  if (apiAvailable) {
    try {
      const apiResult = await scanViaApi(baseUrl);
      apiResult.urlStructure = urlStructure;
      apiResult.detectedPlugins = pluginResult;
      return apiResult;
    } catch (err) {
      errors.push(`REST API probe succeeded but scan failed: ${err instanceof Error ? err.message : String(err)}`);
      // Fall through to fallback
    }
  }

  // 3. Fallback: sitemap (already fetched) + RSS
  const rssItems = await parseRss(baseUrl).catch((err) => {
    errors.push(`RSS parse error: ${err instanceof Error ? err.message : String(err)}`);
    return [];
  });

  // 4. Merge sitemap groups into content types
  const contentTypes: ContentType[] = [];

  // Collect RSS categories for taxonomy info
  const allCategories = new Set<string>();
  for (const item of rssItems) {
    for (const cat of item.categories) {
      allCategories.add(cat);
    }
  }

  for (const group of sitemapResult.groups) {
    let samples: string[] = [];
    const taxonomies: TaxonomyRef[] = [];

    if (group.pattern === "blog" || group.pattern === "(pages)") {
      samples = rssItems.slice(0, 5).map((item) => item.title).filter(Boolean);
      if (allCategories.size > 0) {
        taxonomies.push({
          name: "Categories",
          slug: "category",
          count: allCategories.size,
        });
      }
    }

    if (samples.length === 0) {
      samples = group.urls.slice(0, 5).map((url) => {
        try {
          const path = new URL(url).pathname;
          const lastSegment = path.split("/").filter(Boolean).pop() || "";
          return titleCase(lastSegment);
        } catch {
          return "";
        }
      }).filter(Boolean);
    }

    contentTypes.push({
      name: titleCase(group.pattern),
      slug: group.pattern,
      count: group.urls.length,
      isEstimate: true,
      samples,
      taxonomies,
    });
  }

  return {
    url: baseUrl,
    scannedAt: new Date().toISOString(),
    apiAvailable: false,
    contentTypes,
    urlStructure,
    detectedPlugins: pluginResult,
    errors,
  };
}
