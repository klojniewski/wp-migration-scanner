import { describe, it, expect } from "vitest";
import { generateMigrationScope } from "./migration-scope";
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

describe("generateMigrationScope", () => {
  it("generates headline for minimal scan", () => {
    const result = generateMigrationScope(baseScanResult({
      contentTypes: [
        { name: "Posts", slug: "post", count: 10, isEstimate: false, samples: [], taxonomies: [], complexity: null },
      ],
    }));
    expect(result.headline).toContain("Small");
    expect(result.headline).toContain("1 content types");
  });

  it("includes multilingual info in headline", () => {
    const result = generateMigrationScope(baseScanResult({
      contentTypes: [
        { name: "Posts", slug: "post", count: 500, isEstimate: false, samples: [], taxonomies: [], complexity: null },
      ],
      urlStructure: {
        totalIndexedUrls: 500,
        patterns: [],
        multilingual: { type: "subdirectory", languages: ["en", "es", "fr"] },
      },
    }));
    expect(result.headline).toContain("multilingual");
    expect(result.headline).toContain("3 languages");
  });

  it("generates page builder consideration", () => {
    const result = generateMigrationScope(baseScanResult({
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
    }));
    const match = result.considerations.find((c) => c.title === "Page builder dependency");
    expect(match).toBeDefined();
    expect(match!.color).toBe("red");
    expect(match!.body).toContain("Elementor");
  });

  it("generates multilingual consideration", () => {
    const result = generateMigrationScope(baseScanResult({
      contentTypes: [
        { name: "Posts", slug: "post", count: 100, isEstimate: false, samples: [], taxonomies: [], complexity: null },
      ],
      urlStructure: {
        totalIndexedUrls: 500,
        patterns: [],
        multilingual: { type: "subdirectory", languages: ["en", "es", "fr", "de"] },
      },
    }));
    const match = result.considerations.find((c) => c.title.includes("Multilingual"));
    expect(match).toBeDefined();
    expect(match!.color).toBe("purple");
  });

  it("generates media consideration for high video count", () => {
    const result = generateMigrationScope(baseScanResult({
      contentTypes: [
        { name: "Videos", slug: "video", count: 731, isEstimate: false, samples: [], taxonomies: [], complexity: null },
      ],
    }));
    const match = result.considerations.find((c) => c.title === "Media-heavy content");
    expect(match).toBeDefined();
    expect(match!.body).toContain("731");
  });

  it("generates complex taxonomy consideration", () => {
    const result = generateMigrationScope(baseScanResult({
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
    }));
    const match = result.considerations.find((c) => c.title === "Complex taxonomy relationships");
    expect(match).toBeDefined();
    expect(match!.color).toBe("yellow");
  });

  it("generates dead weight consideration", () => {
    const result = generateMigrationScope(baseScanResult({
      contentTypes: [
        { name: "Posts", slug: "post", count: 10, isEstimate: false, samples: [], taxonomies: [], complexity: null },
      ],
      errors: ["Could not fetch Popups — HTTP 404", "Could not fetch CTAs — HTTP 404"],
    }));
    const match = result.considerations.find((c) => c.title === "Dead weight identified");
    expect(match).toBeDefined();
    expect(match!.color).toBe("green");
  });

  it("generates scale note for large sites", () => {
    const result = generateMigrationScope(baseScanResult({
      contentTypes: [
        { name: "Posts", slug: "post", count: 1500, isEstimate: false, samples: [], taxonomies: [], complexity: null },
      ],
    }));
    const match = result.considerations.find((c) => c.title === "Scale considerations");
    expect(match).toBeDefined();
    expect(match!.color).toBe("blue");
  });

  it("skips video consideration below threshold", () => {
    const result = generateMigrationScope(baseScanResult({
      contentTypes: [
        { name: "Videos", slug: "video", count: 10, isEstimate: false, samples: [], taxonomies: [], complexity: null },
      ],
    }));
    expect(result.considerations.find((c) => c.title === "Media-heavy content")).toBeUndefined();
  });
});
