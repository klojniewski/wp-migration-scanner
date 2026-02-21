import { describe, it, expect } from "vitest";
import { parseRssXml } from "./rss";

describe("parseRssXml", () => {
  it("parses items with titles", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <rss version="2.0">
        <channel>
          <title>My Blog</title>
          <item>
            <title>First Post</title>
            <link>https://example.com/first-post/</link>
          </item>
          <item>
            <title>Second Post</title>
            <link>https://example.com/second-post/</link>
          </item>
        </channel>
      </rss>`;

    const items = parseRssXml(xml);
    expect(items).toHaveLength(2);
    expect(items[0].title).toBe("First Post");
    expect(items[1].title).toBe("Second Post");
  });

  it("extracts string categories", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Post</title>
            <category>Tech</category>
            <category>News</category>
          </item>
        </channel>
      </rss>`;

    const items = parseRssXml(xml);
    expect(items[0].categories).toEqual(["Tech", "News"]);
  });

  it("handles single category (not array)", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Post</title>
            <category>Solo</category>
          </item>
        </channel>
      </rss>`;

    const items = parseRssXml(xml);
    expect(items[0].categories).toEqual(["Solo"]);
  });

  it("returns empty array when no items", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <title>Empty Blog</title>
        </channel>
      </rss>`;

    const items = parseRssXml(xml);
    expect(items).toEqual([]);
  });

  it("handles single item (not wrapped in array)", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <title>Only Post</title>
          </item>
        </channel>
      </rss>`;

    const items = parseRssXml(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("Only Post");
    expect(items[0].categories).toEqual([]);
  });

  it("handles missing title gracefully", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0">
        <channel>
          <item>
            <link>https://example.com/no-title/</link>
          </item>
        </channel>
      </rss>`;

    const items = parseRssXml(xml);
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe("");
  });

  it("returns empty for non-RSS XML", () => {
    const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/</loc></url>
      </urlset>`;

    const items = parseRssXml(xml);
    expect(items).toEqual([]);
  });
});
