import { describe, it, expect } from "vitest";
import { analyzeUrls } from "./urls";

const BASE = "https://example.com";

describe("analyzeUrls", () => {
  it("returns total count", () => {
    const urls = [
      `${BASE}/about/`,
      `${BASE}/contact/`,
      `${BASE}/blog/hello-world/`,
    ];
    const result = analyzeUrls(BASE, urls);
    expect(result.totalIndexedUrls).toBe(3);
  });

  it("groups single-segment paths as /{page}/", () => {
    const urls = [`${BASE}/about/`, `${BASE}/contact/`, `${BASE}/team/`];
    const result = analyzeUrls(BASE, urls);
    const pagePattern = result.patterns.find((p) => p.pattern === "/{page}/");
    expect(pagePattern).toBeDefined();
    expect(pagePattern!.count).toBe(3);
  });

  it("groups two-segment paths by first segment", () => {
    const urls = [
      `${BASE}/blog/post-one/`,
      `${BASE}/blog/post-two/`,
      `${BASE}/blog/post-three/`,
      `${BASE}/services/consulting/`,
    ];
    const result = analyzeUrls(BASE, urls);

    const blogPattern = result.patterns.find((p) => p.pattern === "/blog/{slug}/");
    expect(blogPattern).toBeDefined();
    expect(blogPattern!.count).toBe(3);

    const servicesPattern = result.patterns.find((p) => p.pattern === "/services/{slug}/");
    expect(servicesPattern).toBeDefined();
    expect(servicesPattern!.count).toBe(1);
  });

  it("groups deep paths as /{first}/{...}/", () => {
    const urls = [
      `${BASE}/blog/2024/01/post-one/`,
      `${BASE}/blog/2024/02/post-two/`,
    ];
    const result = analyzeUrls(BASE, urls);
    const deepPattern = result.patterns.find((p) => p.pattern === "/blog/{...}/");
    expect(deepPattern).toBeDefined();
    expect(deepPattern!.count).toBe(2);
  });

  it("sorts patterns by count descending", () => {
    const urls = [
      `${BASE}/blog/a/`,
      `${BASE}/blog/b/`,
      `${BASE}/blog/c/`,
      `${BASE}/about/`,
    ];
    const result = analyzeUrls(BASE, urls);
    expect(result.patterns[0].pattern).toBe("/blog/{slug}/");
    expect(result.patterns[0].count).toBe(3);
  });

  it("skips URLs from different hosts", () => {
    const urls = [
      `${BASE}/about/`,
      "https://other.com/page/",
    ];
    const result = analyzeUrls(BASE, urls);
    expect(result.totalIndexedUrls).toBe(2);
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0].count).toBe(1);
  });

  it("returns null multilingual when no language prefixes", () => {
    const urls = [`${BASE}/about/`, `${BASE}/blog/hello/`];
    const result = analyzeUrls(BASE, urls);
    expect(result.multilingual).toBeNull();
  });

  it("detects subdirectory multilingual with 2+ language prefixes", () => {
    const urls = [
      `${BASE}/en/about/`,
      `${BASE}/en/contact/`,
      `${BASE}/de/about/`,
      `${BASE}/fr/about/`,
    ];
    const result = analyzeUrls(BASE, urls);
    expect(result.multilingual).not.toBeNull();
    expect(result.multilingual!.type).toBe("subdirectory");
    expect(result.multilingual!.languages).toContain("en");
    expect(result.multilingual!.languages).toContain("de");
    expect(result.multilingual!.languages).toContain("fr");
  });

  it("does not flag single language prefix as multilingual", () => {
    const urls = [
      `${BASE}/en/about/`,
      `${BASE}/en/contact/`,
      `${BASE}/blog/hello/`,
    ];
    const result = analyzeUrls(BASE, urls);
    expect(result.multilingual).toBeNull();
  });

  it("handles empty URL list", () => {
    const result = analyzeUrls(BASE, []);
    expect(result.totalIndexedUrls).toBe(0);
    expect(result.patterns).toEqual([]);
    expect(result.multilingual).toBeNull();
  });

  it("skips malformed URLs gracefully", () => {
    const urls = [`${BASE}/about/`, "not-a-url"];
    const result = analyzeUrls(BASE, urls);
    expect(result.patterns).toHaveLength(1);
  });
});
