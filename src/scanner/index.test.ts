import { describe, it, expect } from "vitest";
import { buildFallbackContentTypes } from "./index";
import type { SitemapGroup } from "./sitemap";
import type { RssItem } from "./rss";

describe("buildFallbackContentTypes", () => {
  const BASE = "https://example.com";

  it("converts sitemap groups to content types", () => {
    const groups: SitemapGroup[] = [
      { pattern: "blog", urls: [`${BASE}/blog/a/`, `${BASE}/blog/b/`] },
      { pattern: "(pages)", urls: [`${BASE}/about/`] },
    ];
    const result = buildFallbackContentTypes(groups, [], BASE);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Blog");
    expect(result[0].slug).toBe("blog");
    expect(result[0].count).toBe(2);
    expect(result[0].isEstimate).toBe(true);
    expect(result[0].complexity).toBeNull();
    expect(result[1].name).toBe("(Pages)");
    expect(result[1].count).toBe(1);
  });

  it("attaches RSS titles as samples for blog pattern", () => {
    const groups: SitemapGroup[] = [
      { pattern: "blog", urls: [`${BASE}/blog/a/`, `${BASE}/blog/b/`] },
    ];
    const rssItems: RssItem[] = [
      { title: "First Post", link: `${BASE}/blog/a/`, categories: ["News"] },
      { title: "Second Post", link: `${BASE}/blog/b/`, categories: ["Tech"] },
    ];
    const result = buildFallbackContentTypes(groups, rssItems, BASE);
    expect(result[0].samples).toEqual([
      { title: "First Post", url: `${BASE}/blog/a/` },
      { title: "Second Post", url: `${BASE}/blog/b/` },
    ]);
  });

  it("attaches RSS categories as taxonomy for blog pattern", () => {
    const groups: SitemapGroup[] = [
      { pattern: "blog", urls: [`${BASE}/blog/a/`] },
    ];
    const rssItems: RssItem[] = [
      { title: "Post", link: `${BASE}/blog/a/`, categories: ["News", "Tech"] },
    ];
    const result = buildFallbackContentTypes(groups, rssItems, BASE);
    expect(result[0].taxonomies).toHaveLength(1);
    expect(result[0].taxonomies[0].name).toBe("Categories");
    expect(result[0].taxonomies[0].slug).toBe("category");
    expect(result[0].taxonomies[0].count).toBe(2);
  });

  it("attaches RSS data for (pages) pattern too", () => {
    const groups: SitemapGroup[] = [
      { pattern: "(pages)", urls: [`${BASE}/about/`] },
    ];
    const rssItems: RssItem[] = [
      { title: "Welcome", link: `${BASE}/about/`, categories: ["Uncategorized"] },
    ];
    const result = buildFallbackContentTypes(groups, rssItems, BASE);
    expect(result[0].samples).toEqual([{ title: "Welcome", url: `${BASE}/about/` }]);
    expect(result[0].taxonomies).toHaveLength(1);
  });

  it("derives samples from URL slugs for non-blog groups", () => {
    const groups: SitemapGroup[] = [
      {
        pattern: "services",
        urls: [
          `${BASE}/services/web-design/`,
          `${BASE}/services/seo-marketing/`,
        ],
      },
    ];
    const result = buildFallbackContentTypes(groups, [], BASE);
    expect(result[0].samples).toEqual([
      { title: "Web Design", url: `${BASE}/services/web-design/` },
      { title: "Seo Marketing", url: `${BASE}/services/seo-marketing/` },
    ]);
    expect(result[0].taxonomies).toEqual([]);
  });

  it("limits RSS samples to 5", () => {
    const groups: SitemapGroup[] = [
      { pattern: "blog", urls: Array.from({ length: 20 }, (_, i) => `${BASE}/blog/post-${i}/`) },
    ];
    const rssItems: RssItem[] = Array.from({ length: 10 }, (_, i) => ({
      title: `Post ${i}`,
      link: `${BASE}/blog/post-${i}/`,
      categories: [],
    }));
    const result = buildFallbackContentTypes(groups, rssItems, BASE);
    expect(result[0].samples).toHaveLength(5);
  });

  it("returns empty array for empty groups", () => {
    const result = buildFallbackContentTypes([], [], BASE);
    expect(result).toEqual([]);
  });

  it("deduplicates RSS categories across items", () => {
    const groups: SitemapGroup[] = [
      { pattern: "blog", urls: [`${BASE}/blog/a/`] },
    ];
    const rssItems: RssItem[] = [
      { title: "A", link: `${BASE}/blog/a/`, categories: ["News", "Tech"] },
      { title: "B", link: `${BASE}/blog/b/`, categories: ["News", "Sports"] },
    ];
    const result = buildFallbackContentTypes(groups, rssItems, BASE);
    expect(result[0].taxonomies[0].count).toBe(3); // News, Tech, Sports
  });
});
