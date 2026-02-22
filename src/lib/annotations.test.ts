import { describe, it, expect } from "vitest";
import { generateAnnotations } from "./annotations";
import type { ScanResult } from "@/types";

function baseScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    url: "https://example.com",
    scannedAt: "2026-02-21T17:00:00Z",
    apiAvailable: true,
    contentTypes: [],
    urlStructure: null,
    detectedPlugins: null,
    errors: [],
    ...overrides,
  };
}

describe("generateAnnotations", () => {
  it("returns empty for minimal scan", () => {
    expect(generateAnnotations(baseScanResult())).toEqual([]);
  });

  it("rule 1: builder content extraction", () => {
    const data = baseScanResult({
      contentTypes: [
        {
          name: "Pages",
          slug: "page",
          count: 140,
          isEstimate: false,
          samples: [],
          taxonomies: [],
          complexity: { level: "complex", signals: ["Elementor"], builder: "Elementor" },
        },
      ],
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("Complex"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("content-types");
    expect(match!.body).toContain("Elementor");
  });

  it("rule 2: complex taxonomy schema", () => {
    const data = baseScanResult({
      contentTypes: [
        {
          name: "Customer Stories",
          slug: "customer-story",
          count: 88,
          isEstimate: false,
          samples: [],
          taxonomies: [
            { name: "Region", slug: "region", count: 5 },
            { name: "PMS", slug: "pms", count: 34 },
            { name: "Type", slug: "type", count: 4 },
            { name: "Tools", slug: "tools", count: 4 },
            { name: "Property", slug: "property", count: 5 },
          ],
          complexity: null,
        },
      ],
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("taxonomy dimensions"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("content-types");
  });

  it("rule 3: test content warning", () => {
    const data = baseScanResult({
      contentTypes: [
        {
          name: "Customer Story (new)",
          slug: "customer-story-new",
          count: 4,
          isEstimate: false,
          samples: ["Test post 5", "Test post 4"],
          taxonomies: [],
          complexity: null,
        },
      ],
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("test posts"));
    expect(match).toBeDefined();
    expect(match!.severity).toBe("info");
  });

  it("rule 4: multilingual gaps", () => {
    const data = baseScanResult({
      urlStructure: {
        totalIndexedUrls: 2849,
        patterns: [
          { pattern: "/{page}/", example: "/about/", count: 647 },
          { pattern: "/glossary/{slug}/", example: "/glossary/fire/", count: 270 },
          { pattern: "/es/{slug}/", example: "/es/about/", count: 245 },
        ],
        multilingual: { type: "subdirectory", languages: ["en", "es", "fr"] },
      },
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("translation gaps"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("multilingual");
  });

  it("rule 5: WPML workflow", () => {
    const data = baseScanResult({
      detectedPlugins: {
        plugins: [{ slug: "wpml", name: "WPML", category: "multilingual" }],
        totalDetected: 1,
      },
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("WPML"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("multilingual");
  });

  it("rule 6: Crocoblock rebuild", () => {
    const data = baseScanResult({
      detectedPlugins: {
        plugins: [
          { slug: "jetengine", name: "JetEngine", category: "other" },
          { slug: "jetmenu", name: "JetMenu", category: "other" },
          { slug: "jetsearch", name: "JetSearch", category: "other" },
        ],
        totalDetected: 3,
      },
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("JetEngine"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("plugins");
  });

  it("rule 7: high plugin count", () => {
    const data = baseScanResult({
      detectedPlugins: {
        plugins: [{ slug: "yoast", name: "Yoast SEO", category: "seo" }],
        totalDetected: 23,
      },
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("detected, likely"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("plugins");
  });

  it("rule 8: dead content (404)", () => {
    const data = baseScanResult({
      errors: [
        'Could not fetch Popups — HTTP 404',
        'Could not fetch CTAs — HTTP 404',
      ],
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("Dead content"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("warnings");
    expect(match!.severity).toBe("info");
  });

  it("rule 9: redirect mapping", () => {
    const data = baseScanResult({
      urlStructure: {
        totalIndexedUrls: 2849,
        patterns: [
          { pattern: "/blog/{slug}/", example: "/blog/test/", count: 137 },
        ],
        multilingual: null,
      },
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("redirect mapping"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("url-structure");
  });

  it("rule 10: flat structure review", () => {
    const data = baseScanResult({
      urlStructure: {
        totalIndexedUrls: 1000,
        patterns: [
          { pattern: "/{page}/", example: "/about/", count: 647 },
          { pattern: "/blog/{slug}/", example: "/blog/test/", count: 137 },
        ],
        multilingual: null,
      },
    });
    const annotations = generateAnnotations(data);
    const match = annotations.find((a) => a.title.includes("root-level"));
    expect(match).toBeDefined();
    expect(match!.section).toBe("url-structure");
  });

  it("does not fire rule 7 below 20 plugins", () => {
    const data = baseScanResult({
      detectedPlugins: {
        plugins: [{ slug: "yoast", name: "Yoast SEO", category: "seo" }],
        totalDetected: 5,
      },
    });
    const annotations = generateAnnotations(data);
    expect(annotations.find((a) => a.title.includes("detected, likely"))).toBeUndefined();
  });

  it("does not fire rule 9 for small URL counts", () => {
    const data = baseScanResult({
      urlStructure: {
        totalIndexedUrls: 50,
        patterns: [{ pattern: "/blog/{slug}/", example: "/blog/test/", count: 50 }],
        multilingual: null,
      },
    });
    const annotations = generateAnnotations(data);
    expect(annotations.find((a) => a.title.includes("redirect mapping"))).toBeUndefined();
  });
});
