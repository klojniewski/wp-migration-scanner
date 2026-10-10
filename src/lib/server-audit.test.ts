import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { ScanResult } from "@/types";
import { generateMigrationScope } from "./migration-scope";
import {
  AuditParseError,
  analyzeAudit,
  generateFullMigrationScope,
  mergeAuditContentTypes,
  parseServerAudit,
} from "./server-audit";

const raw = readFileSync(join(__dirname, "__fixtures__/nexity-audit-sample.json"), "utf8");

const scan: ScanResult = {
  url: "https://pagepro.co/blog",
  scannedAt: "2026-10-10T00:00:00Z",
  apiAvailable: true,
  contentTypes: [
    { name: "Posts", slug: "posts", count: 199, isEstimate: false, samples: [], taxonomies: [], complexity: null },
  ],
  urlStructure: null,
  detectedPlugins: {
    plugins: [{ slug: "yoast", name: "Yoast SEO", category: "seo" }],
    totalDetected: 1,
  },
  detectedIntegrations: null,
  errors: [],
};

describe("parseServerAudit", () => {
  it("rejects invalid JSON and wrong shape", () => {
    expect(() => parseServerAudit("{nope")).toThrow(AuditParseError);
    expect(() => parseServerAudit('{"foo":1}')).toThrow(AuditParseError);
  });
});

describe("mergeAuditContentTypes", () => {
  it("uses audit counts, keeps scan samples, and adds REST-hidden types", () => {
    const withSamples: ScanResult = {
      ...scan,
      contentTypes: [{ ...scan.contentTypes[0], samples: [{ title: "Hello" }] }],
    };
    const merged = mergeAuditContentTypes(withSamples, analyzeAudit(withSamples, parseServerAudit(raw)));
    const posts = merged.find((c) => c.slug === "posts");
    expect(posts?.samples).toEqual([{ title: "Hello" }]);
    expect(posts?.isEstimate).toBe(false);
    expect(merged.filter((c) => c.slug === "posts")).toHaveLength(1);
    expect(merged.some((c) => c.slug.startsWith("wp_"))).toBe(false);
    expect(merged.length).toBeGreaterThanOrEqual(withSamples.contentTypes.length);
  });
});

describe("analyzeAudit", () => {
  const a = analyzeAudit(scan, parseServerAudit(raw));

  it("reads environment and domain", () => {
    expect(a.environment.wordpress).toBe("7.1");
    expect(a.environment.phpOutdated).toBe(true);
    expect(a.domainMatches).toBe(true);
  });

  it("splits published and unpublished posts, ignoring trash", () => {
    const posts = a.content.find((r) => r.postType === "post")!;
    expect(posts.published).toBe(199);
    expect(posts.unpublished).toBe(31);
    expect(posts.scanCount).toBe(199);
  });

  it("excludes machinery and surfaces hidden content", () => {
    expect(a.content.some((r) => r.postType === "qmn_log")).toBe(false);
    expect(a.hiddenContent.map((r) => r.postType)).toContain("newsletter");
  });

  it("collects custom blocks, redirects and plugin visibility", () => {
    expect(a.customBlocks).toHaveLength(10);
    expect(a.carry.redirects).toBe(734);
    expect(a.plugins.find((p) => p.name === "Yoast SEO")!.seenByScan).toBe(true);
    expect(a.plugins.find((p) => p.name === "Redirection")!.seenByScan).toBe(false);
  });

  it("builds a full scope", () => {
    const scope = generateFullMigrationScope(scan, a, generateMigrationScope(scan));
    expect(scope.headline).toContain("PHP 7.4.32");
    const titles = scope.considerations.map((c) => c.title);
    expect(titles).toEqual(expect.arrayContaining(["Custom blocks to rebuild", "Redirects to preserve"]));
  });
});
