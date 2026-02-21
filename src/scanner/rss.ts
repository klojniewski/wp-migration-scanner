import { XMLParser } from "fast-xml-parser";

export interface RssItem {
  title: string;
  categories: string[];
}

const RSS_PATHS = ["/feed/", "/feed", "/rss/", "/rss"];

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchXml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "WP-Migration-Scanner/0.1" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Quick sanity check — RSS feeds should contain XML-like content
    if (!text.includes("<")) return null;
    return text;
  } catch {
    return null;
  }
}

export async function parseRss(baseUrl: string): Promise<RssItem[]> {
  for (const path of RSS_PATHS) {
    const xml = await fetchXml(`${baseUrl}${path}`);
    if (!xml) continue;

    try {
      const parsed = parser.parse(xml) as Record<string, unknown>;

      // RSS 2.0: rss > channel > item
      const rss = parsed["rss"] as Record<string, unknown> | undefined;
      const channel = rss?.["channel"] as Record<string, unknown> | undefined;
      const items = channel?.["item"];

      if (!items) continue;

      const itemArray = Array.isArray(items) ? items : [items];

      return itemArray.map((item: Record<string, unknown>) => {
        const title = typeof item["title"] === "string" ? item["title"] : "";

        // Categories can be a string, array of strings, or array of objects
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
    } catch {
      continue;
    }
  }

  return [];
}
