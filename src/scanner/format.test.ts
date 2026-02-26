import { describe, it, expect } from "vitest";
import { formatReport, padDots } from "../cli";
import type { ScanResult } from "../types";

describe("padDots", () => {
  it("pads with dots between label and count", () => {
    const result = padDots("Posts", "42 items", 30);
    expect(result).toContain("Posts");
    expect(result).toContain("42 items");
    expect(result).toContain("...");
  });

  it("uses minimum 2 dots even when content is wide", () => {
    const result = padDots("Very Long Label Name", "99999 items", 20);
    expect(result).toContain("..");
  });
});

describe("formatReport", () => {
  const baseScanResult: ScanResult = {
    url: "https://example.com",
    scannedAt: "2025-01-01T00:00:00.000Z",
    apiAvailable: true,
    contentTypes: [],
    urlStructure: null,
    detectedPlugins: null,
    errors: [],
  };

  it("shows API available message", () => {
    const report = formatReport(baseScanResult);
    expect(report).toContain("WordPress REST API available");
  });

  it("shows fallback message when API unavailable", () => {
    const report = formatReport({ ...baseScanResult, apiAvailable: false });
    expect(report).toContain("REST API not available");
    expect(report).toContain("sitemap/RSS fallback");
  });

  it("renders content types with counts", () => {
    const report = formatReport({
      ...baseScanResult,
      contentTypes: [
        {
          name: "Posts",
          slug: "post",
          count: 42,
          isEstimate: false,
          samples: [{ title: "Hello World" }],
          taxonomies: [],
          complexity: null,
        },
      ],
    });
    expect(report).toContain("Posts");
    expect(report).toContain("42 items");
    expect(report).toContain("Hello World");
  });

  it("shows estimated counts with tilde", () => {
    const report = formatReport({
      ...baseScanResult,
      contentTypes: [
        {
          name: "Blog",
          slug: "blog",
          count: 100,
          isEstimate: true,
          samples: [],
          taxonomies: [],
          complexity: null,
        },
      ],
    });
    expect(report).toContain("~100 items (estimated)");
  });

  it("renders taxonomy refs", () => {
    const report = formatReport({
      ...baseScanResult,
      contentTypes: [
        {
          name: "Posts",
          slug: "post",
          count: 10,
          isEstimate: false,
          samples: [],
          taxonomies: [
            { name: "Categories", slug: "category", count: 5 },
            { name: "Tags", slug: "post_tag", count: 12 },
          ],
          complexity: null,
        },
      ],
    });
    expect(report).toContain("Categories (5)");
    expect(report).toContain("Tags (12)");
  });

  it("renders URL structure section", () => {
    const report = formatReport({
      ...baseScanResult,
      urlStructure: {
        totalIndexedUrls: 150,
        patterns: [
          { pattern: "/blog/{slug}/", count: 100, example: "/blog/hello-world/" },
        ],
        multilingual: null,
      },
    });
    expect(report).toContain("URL Structure");
    expect(report).toContain("Total indexed URLs: 150");
    expect(report).toContain("/blog/{slug}/");
    expect(report).toContain("/blog/hello-world/");
  });

  it("renders multilingual info", () => {
    const report = formatReport({
      ...baseScanResult,
      urlStructure: {
        totalIndexedUrls: 50,
        patterns: [],
        multilingual: { type: "subdirectory", languages: ["en", "de"] },
      },
    });
    expect(report).toContain("Multilingual: subdirectory");
    expect(report).toContain("en, de");
  });

  it("renders detected plugins grouped by category", () => {
    const report = formatReport({
      ...baseScanResult,
      detectedPlugins: {
        plugins: [
          { slug: "elementor", name: "Elementor", category: "page-builder" },
          { slug: "wordpress-seo", name: "Yoast SEO", category: "seo" },
        ],
        totalDetected: 2,
      },
    });
    expect(report).toContain("Detected Plugins");
    expect(report).toContain("Page Builders");
    expect(report).toContain("Elementor");
    expect(report).toContain("SEO");
    expect(report).toContain("Yoast SEO");
    expect(report).toContain("2 plugins detected");
  });

  it("omits plugins section when null", () => {
    const report = formatReport(baseScanResult);
    expect(report).not.toContain("Detected Plugins");
  });

  it("omits plugins section when empty", () => {
    const report = formatReport({
      ...baseScanResult,
      detectedPlugins: { plugins: [], totalDetected: 0 },
    });
    expect(report).not.toContain("Detected Plugins");
  });

  it("renders warnings", () => {
    const report = formatReport({
      ...baseScanResult,
      errors: ["Sitemap parse error: timeout", "RSS parse error: 404"],
    });
    expect(report).toContain("Warnings:");
    expect(report).toContain("Sitemap parse error: timeout");
    expect(report).toContain("RSS parse error: 404");
  });

  it("shows summary line with type and taxonomy counts", () => {
    const report = formatReport({
      ...baseScanResult,
      contentTypes: [
        {
          name: "Posts",
          slug: "post",
          count: 10,
          isEstimate: false,
          samples: [],
          taxonomies: [{ name: "Categories", slug: "category", count: 3 }],
          complexity: null,
        },
        {
          name: "Pages",
          slug: "page",
          count: 5,
          isEstimate: false,
          samples: [],
          taxonomies: [],
          complexity: null,
        },
      ],
    });
    expect(report).toContain("2 content types");
    expect(report).toContain("1 taxonomy");
    expect(report).toContain("15 total items");
  });
});
