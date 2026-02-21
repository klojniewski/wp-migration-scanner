import { XMLParser } from "fast-xml-parser";
import { type Fetcher, fetchXml } from "./http";

export interface RssItem {
  title: string;
  categories: string[];
}

const RSS_PATHS = ["/feed/", "/feed", "/rss/", "/rss"];

const parser = new XMLParser({ ignoreAttributes: false });

/** Pure parser — extracts items from RSS XML string */
export function parseRssXml(xml: string): RssItem[] {
  const parsed = parser.parse(xml) as Record<string, unknown>;

  const rss = parsed["rss"] as Record<string, unknown> | undefined;
  const channel = rss?.["channel"] as Record<string, unknown> | undefined;
  const items = channel?.["item"];

  if (!items) return [];

  const itemArray = Array.isArray(items) ? items : [items];

  return itemArray.map((item: Record<string, unknown>) => {
    const title = typeof item["title"] === "string" ? item["title"] : "";

    let categories: string[] = [];
    const rawCats = item["category"];
    if (typeof rawCats === "string") {
      categories = [rawCats];
    } else if (Array.isArray(rawCats)) {
      categories = rawCats.map((c) =>
        typeof c === "string" ? c : typeof c === "object" && c !== null ? String((c as Record<string, unknown>)["#text"] || "") : ""
      ).filter(Boolean);
    }

    return { title, categories };
  });
}

/** Fetch wrapper — tries multiple RSS paths, returns first success */
export async function fetchRss(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch,
): Promise<RssItem[]> {
  for (const path of RSS_PATHS) {
    const xml = await fetchXml(`${baseUrl}${path}`, fetcher);
    if (!xml) continue;

    try {
      const items = parseRssXml(xml);
      if (items.length > 0) return items;
    } catch {
      continue;
    }
  }

  return [];
}
