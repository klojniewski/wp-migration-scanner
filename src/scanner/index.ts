import type { ContentType, PluginScanResult, ScanResult, TaxonomyRef, UrlStructure } from "../types";
import { type Fetcher, DEFAULT_HEADERS } from "./http";
import { probeApi, scanViaApi } from "./wp-api";
import { fetchSitemap } from "./sitemap";
import type { SitemapGroup } from "./sitemap";
import { fetchRss } from "./rss";
import type { RssItem } from "./rss";
import { analyzeUrls } from "./urls";
import { fetchPlugins } from "./plugins";
import { titleCase, toErrorMessage } from "./utils";

async function resolveRedirects(
  url: string,
  fetcher: Fetcher = globalThis.fetch,
): Promise<string> {
  try {
    const res = await fetcher(url, {
      method: "HEAD",
      headers: DEFAULT_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    const final = new URL(res.url);
    return `${final.protocol}//${final.host}`;
  } catch {
    return url;
  }
}

/** Pure function — merges sitemap groups + RSS data into ContentType[] */
export function buildFallbackContentTypes(
  sitemapGroups: SitemapGroup[],
  rssItems: RssItem[],
  baseUrl: string,
): ContentType[] {
  const contentTypes: ContentType[] = [];

  const allCategories = new Set<string>();
  for (const item of rssItems) {
    for (const cat of item.categories) {
      allCategories.add(cat);
    }
  }

  for (const group of sitemapGroups) {
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

  return contentTypes;
}

export async function scan(
  inputUrl: string,
  fetcher: Fetcher = globalThis.fetch,
): Promise<ScanResult> {
  // Normalize URL
  let baseUrl = inputUrl.trim().replace(/\/+$/, "");
  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  // Follow redirects to find the actual site URL
  baseUrl = await resolveRedirects(baseUrl, fetcher);

  const errors: string[] = [];

  // 1. Probe REST API + fetch sitemap + detect plugins in parallel
  const [apiAvailable, sitemapResult, pluginResult] = await Promise.all([
    probeApi(baseUrl, fetcher),
    fetchSitemap(baseUrl, fetcher).catch((err) => {
      errors.push(`Sitemap parse error: ${toErrorMessage(err)}`);
      return { groups: [], allUrls: [] as string[] };
    }),
    fetchPlugins(baseUrl, fetcher).catch((err) => {
      errors.push(`Plugin detection error: ${toErrorMessage(err)}`);
      return null as PluginScanResult | null;
    }),
  ]);

  // Build URL structure from sitemap data
  let urlStructure: UrlStructure | null = null;
  if (sitemapResult.allUrls.length > 0) {
    urlStructure = analyzeUrls(baseUrl, sitemapResult.allUrls);
  }

  // 2. REST API path
  if (apiAvailable) {
    try {
      const apiResult = await scanViaApi(baseUrl, fetcher);
      return {
        url: baseUrl,
        scannedAt: new Date().toISOString(),
        apiAvailable: true,
        contentTypes: apiResult.contentTypes,
        urlStructure,
        detectedPlugins: pluginResult,
        errors: [...apiResult.errors, ...errors],
      };
    } catch (err) {
      errors.push(`REST API probe succeeded but scan failed: ${toErrorMessage(err)}`);
    }
  }

  // 3. Fallback: sitemap (already fetched) + RSS
  const rssItems = await fetchRss(baseUrl, fetcher).catch((err) => {
    errors.push(`RSS parse error: ${toErrorMessage(err)}`);
    return [] as RssItem[];
  });

  // 4. Build content types from fallback data
  const contentTypes = buildFallbackContentTypes(sitemapResult.groups, rssItems, baseUrl);

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
