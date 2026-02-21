import { describe, it, expect } from "vitest";
import { parseSitemapXml, groupSitemapUrls } from "./sitemap";

describe("parseSitemapXml", () => {
  it("parses a sitemap index", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>https://example.com/post-sitemap.xml</loc></sitemap>
        <sitemap><loc>https://example.com/page-sitemap.xml</loc></sitemap>
      </sitemapindex>`;

    const result = parseSitemapXml(xml);
    expect(result.type).toBe("index");
    if (result.type === "index") {
      expect(result.sitemapUrls).toHaveLength(2);
      expect(result.sitemapUrls[0]).toBe("https://example.com/post-sitemap.xml");
      expect(result.sitemapUrls[1]).toBe("https://example.com/page-sitemap.xml");
    }
  });

  it("parses a urlset", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/about/</loc></url>
        <url><loc>https://example.com/contact/</loc></url>
        <url><loc>https://example.com/blog/hello/</loc></url>
      </urlset>`;

    const result = parseSitemapXml(xml);
    expect(result.type).toBe("urlset");
    if (result.type === "urlset") {
      expect(result.pageUrls).toHaveLength(3);
      expect(result.pageUrls[0]).toBe("https://example.com/about/");
    }
  });

  it("handles single sitemap entry (not array)", () => {
    const xml = `<?xml version="1.0"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>https://example.com/sitemap-1.xml</loc></sitemap>
      </sitemapindex>`;

    const result = parseSitemapXml(xml);
    expect(result.type).toBe("index");
    if (result.type === "index") {
      expect(result.sitemapUrls).toHaveLength(1);
    }
  });

  it("handles single URL entry (not array)", () => {
    const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/only-page/</loc></url>
      </urlset>`;

    const result = parseSitemapXml(xml);
    expect(result.type).toBe("urlset");
    if (result.type === "urlset") {
      expect(result.pageUrls).toHaveLength(1);
    }
  });

  it("returns empty urlset for unknown XML", () => {
    const xml = `<?xml version="1.0"?><root><item>test</item></root>`;
    const result = parseSitemapXml(xml);
    expect(result.type).toBe("urlset");
    if (result.type === "urlset") {
      expect(result.pageUrls).toEqual([]);
    }
  });
});

describe("groupSitemapUrls", () => {
  const BASE = "https://example.com";

  it("groups single-segment paths as (pages)", () => {
    const urls = [
      `${BASE}/about/`,
      `${BASE}/contact/`,
      `${BASE}/team/`,
    ];
    const groups = groupSitemapUrls(BASE, urls);
    expect(groups).toHaveLength(1);
    expect(groups[0].pattern).toBe("(pages)");
    expect(groups[0].urls).toHaveLength(3);
  });

  it("groups multi-segment paths by first segment", () => {
    const urls = [
      `${BASE}/blog/post-one/`,
      `${BASE}/blog/post-two/`,
      `${BASE}/services/consulting/`,
    ];
    const groups = groupSitemapUrls(BASE, urls);

    const blogGroup = groups.find((g) => g.pattern === "blog");
    expect(blogGroup).toBeDefined();
    expect(blogGroup!.urls).toHaveLength(2);

    const servicesGroup = groups.find((g) => g.pattern === "services");
    expect(servicesGroup).toBeDefined();
    expect(servicesGroup!.urls).toHaveLength(1);
  });

  it("sorts groups by URL count descending", () => {
    const urls = [
      `${BASE}/about/`,
      `${BASE}/blog/a/`,
      `${BASE}/blog/b/`,
      `${BASE}/blog/c/`,
    ];
    const groups = groupSitemapUrls(BASE, urls);
    expect(groups[0].pattern).toBe("blog");
    expect(groups[0].urls).toHaveLength(3);
  });

  it("skips URLs from different hosts", () => {
    const urls = [
      `${BASE}/about/`,
      "https://other.com/page/stuff/",
    ];
    const groups = groupSitemapUrls(BASE, urls);
    expect(groups).toHaveLength(1);
    expect(groups[0].pattern).toBe("(pages)");
  });

  it("skips root-only URLs (no path segments)", () => {
    const urls = [`${BASE}/`];
    const groups = groupSitemapUrls(BASE, urls);
    expect(groups).toEqual([]);
  });

  it("returns empty for empty input", () => {
    const groups = groupSitemapUrls(BASE, []);
    expect(groups).toEqual([]);
  });
});
