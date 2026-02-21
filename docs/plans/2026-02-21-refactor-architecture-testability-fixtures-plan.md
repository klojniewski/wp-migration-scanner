---
title: "Architecture Restructure for Testability"
type: refactor
date: 2026-02-21
---

# Architecture Restructure for Testability

Thread an injectable `Fetcher` through all scanner modules, extract pure parsing functions, deduplicate shared code, set up Vitest, and write tests with inline fixtures.

## Problem Statement

Every scanner module calls `fetch()` directly — 9 call sites across 6 functions (`resolveRedirects`, `probeApi`, `scanViaApi`, `parseSitemap`, `parseRss`, `detectPlugins`). This means:

- **No tests exist** — scanner logic can't be tested without hitting live sites
- **Parsing is coupled to fetching** — XML/HTML analysis can't be tested independently
- **Shared code is duplicated** — `fetchXml()` in both `rss.ts` and `sitemap.ts`, `titleCase()` in both `index.ts` and `plugins.ts`, User-Agent string in 8 places
- **CLI formatting is untestable** — `formatReport()` isn't exported, `main()` runs on import
- **SSRF vulnerability** — the API route's URL validation only checks `hostname.includes(".")`, allowing internal IPs and cloud metadata endpoints

## Proposed Solution

### Core abstraction: `Fetcher` type

```typescript
// src/scanner/http.ts
export type Fetcher = typeof globalThis.fetch;
```

Use the native `fetch` signature. Mock fetchers return real `Response` objects via `new Response(body, {status, headers})`. Every scanner function gains an optional `fetcher` parameter defaulting to `globalThis.fetch`, so existing callers (CLI, API route) don't change.

### Separation pattern: fetch wrapper + pure parser

Each scanner module exposes two layers:

```
fetchPlugins(baseUrl, fetcher?)      ← fetch wrapper (thin I/O orchestrator)
  └─ parsePluginSignatures(html)     ← pure parser (all business logic, testable)
```

Consistent naming: `parse*` for all pure parsers, `fetch*` for all wrappers (except `probeApi` which is a HEAD check, not fetch-then-parse).

### Error handling contract

Pure parsers return their natural domain types and throw on genuinely malformed input. The orchestrator catches at the boundary with `.catch()` — the same pattern already in use. No `{data, errors}` tuples.

### Tests: inline fixtures

Pure parsing functions are tested with inline string/JSON literals directly in test files. The integration test for `scan()` uses a simple mock `Fetcher` defined inline. No recording infrastructure, no fixture JSON files, no helper modules.

## Acceptance Criteria

- [ ] `Fetcher` type defined in `src/scanner/http.ts` and threaded through all 6 fetch-calling functions including `resolveRedirects()`
- [ ] Every scanner module exports a pure parsing function alongside its fetch wrapper
- [ ] Fallback merge logic in `index.ts` extracted to a testable pure function
- [ ] `fetchXml()` deduplicated into `src/scanner/http.ts` with configurable timeout
- [ ] `titleCase()` and `decodeHtmlEntities()` deduplicated into `src/scanner/utils.ts`
- [ ] `formatReport()` exported from `cli.ts`, `main()` guarded against import-time execution
- [ ] SSRF protection: URL validation blocks private IPs, cloud metadata, loopback
- [ ] Vitest configured with `@/*` path alias, `test` + `test:watch` scripts in `package.json`
- [ ] Tests for all pure parsing functions using inline fixtures
- [ ] Integration test for `scan()` using inline mock `Fetcher`
- [ ] `npx next build` still compiles
- [ ] `npx tsx src/cli.ts <url>` still works
- [ ] Web UI still works via `npm run dev`

## MVP

Two phases. Each produces a compiling, working application.

### Phase 1: Refactor — Fetcher + parse extraction + dedup + Vitest setup

Everything in this phase is mechanical restructuring. No behavior changes.

**1.1 — Install Vitest**

```
npm install -D vitest
```

`vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

Add to `package.json`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**1.2 — Create `src/scanner/http.ts`**

Central home for the `Fetcher` type, shared fetch helpers, SSRF protection, and the User-Agent constant.

```typescript
export type Fetcher = typeof globalThis.fetch;

export const DEFAULT_HEADERS = { "User-Agent": "WP-Migration-Scanner/0.1" };

export function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    const h = parsed.hostname;
    if (/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|127\.|0\.|169\.254\.)/.test(h)) return false;
    if (h === "localhost" || h === "[::1]" || h.endsWith(".internal") || h.endsWith(".local")) return false;
    if (!h.includes(".")) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchXml(
  url: string,
  fetcher: Fetcher = globalThis.fetch,
  timeoutMs: number = 10_000
): Promise<string | null> {
  try {
    const res = await fetcher(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.includes("<")) return null;
    return text;
  } catch {
    return null;
  }
}

export async function fetchJson(
  url: string,
  fetcher: Fetcher = globalThis.fetch,
  timeoutMs: number = 10_000
): Promise<Response | null> {
  try {
    const res = await fetcher(url, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return res;
  } catch {
    return null;
  }
}
```

Key decisions vs. old plan:
- `fetchJson` returns `null` on failure instead of throwing — **symmetric with `fetchXml`**. Callers null-check consistently.
- Both accept `timeoutMs` — preserves `probeApi`'s 5s fast-fail and `detectPlugins`'s 15s extended timeout.
- `DEFAULT_HEADERS` exported so `probeApi` and `resolveRedirects` can use it directly.
- `isUrlAllowed()` for SSRF protection — used in the API route and optionally in the fetcher.

**1.3 — Create `src/scanner/utils.ts`**

```typescript
export function titleCase(slug: string): string {
  return slug.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&#8217;/g, "\u2019")
    .replace(/&#8216;/g, "\u2018").replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014").replace(/&#038;/g, "&");
}

export function toErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
```

Consolidates `titleCase()` (duplicated in `index.ts` + `plugins.ts`), `decodeHtmlEntities()` (isolated in `wp-api.ts`), and the error formatting pattern (repeated 4x in `index.ts`).

**1.4 — Extract pure parsers from each module + thread `Fetcher`**

All modules refactored in one pass. Each gets a pure parsing function exported alongside the updated fetch wrapper.

`src/scanner/plugins.ts`:
```typescript
import { type Fetcher, DEFAULT_HEADERS } from "./http";

// Pure parser — all regex + signature matching, no I/O
export function parsePluginSignatures(html: string): PluginScanResult { ... }

// Fetch wrapper
export async function fetchPlugins(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<PluginScanResult> {
  const res = await fetcher(baseUrl, {
    headers: DEFAULT_HEADERS,
    signal: AbortSignal.timeout(15_000),  // homepage can be slow
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching homepage`);
  return parsePluginSignatures(await res.text());
}
```

`src/scanner/rss.ts`:
```typescript
import { type Fetcher, fetchXml } from "./http";

// Pure parser
export function parseRssXml(xml: string): RssItem[] { ... }

// Fetch wrapper — tries multiple paths, returns first success
export async function fetchRss(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<RssItem[]> { ... }
```

`src/scanner/sitemap.ts`:
```typescript
import { type Fetcher, fetchXml } from "./http";

// Pure parser — returns discriminated union for index vs urlset
export function parseSitemapXml(xml: string):
  | { type: "index"; sitemapUrls: string[] }
  | { type: "urlset"; pageUrls: string[] } { ... }

// Already exists as private — just export
export function groupSitemapUrls(baseUrl: string, urls: string[]): SitemapGroup[] { ... }

// Fetch orchestrator — handles index → children recursion
export async function fetchSitemap(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<SitemapResult> { ... }
```

`src/scanner/wp-api.ts`:
```typescript
import { type Fetcher, fetchJson, DEFAULT_HEADERS } from "./http";

// Pure parsers
export function parseTypesResponse(json: Record<string, WpType>): WpType[] { ... }
export function parseTaxonomiesResponse(json: Record<string, WpTaxonomy>): WpTaxonomy[] { ... }
export function parseContentItems(
  json: Array<{ title: { rendered: string } }>,
  totalHeader: string | null
): { count: number; samples: string[] } { ... }

// Fetch wrappers
export async function probeApi(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<boolean> { ... }  // uses 5s timeout

// Note: scanViaApi remains a substantial function — it orchestrates 4 stages
// of parallel fetching (types, taxonomies, tax counts, content samples).
// The pure parsers handle response transformation; the wrapper handles
// the multi-stage fetch coordination. This is intentional — the complexity
// lives in the I/O orchestration, not the parsing.
export async function scanViaApi(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<{ contentTypes: ContentType[]; errors: string[] }> { ... }
```

Key change: `scanViaApi` returns `{ contentTypes, errors }` instead of a full `ScanResult`. The orchestrator composes the final `ScanResult` — no more mutating the sub-module's return value.

**1.5 — Update `src/scanner/index.ts` orchestrator**

```typescript
import { type Fetcher } from "./http";
import { toErrorMessage } from "./utils";

// Pure function — merges sitemap groups + RSS data into ContentType[]
// (extracted from the fallback path, lines 80-137 of current code)
export function buildFallbackContentTypes(
  sitemapGroups: SitemapGroup[],
  rssItems: RssItem[],
  baseUrl: string
): ContentType[] { ... }

// resolveRedirects now accepts Fetcher
async function resolveRedirects(
  url: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<string> { ... }

// Main orchestrator — threads fetcher to all sub-modules
export async function scan(
  inputUrl: string,
  fetcher: Fetcher = globalThis.fetch
): Promise<ScanResult> {
  // ... pass fetcher to resolveRedirects, probeApi, fetchSitemap,
  //     fetchPlugins, scanViaApi, fetchRss
  // Compose full ScanResult here instead of mutating sub-module returns
}
```

**1.6 — Export `formatReport()` from `cli.ts`, guard `main()`**

```typescript
// Export the pure formatting function directly
export function formatReport(result: ScanResult): string { ... }

// Guard main() to prevent execution on import
const isDirectRun = process.argv[1]?.replace(/\.ts$/, "").endsWith("cli");
if (isDirectRun) main();
```

No separate `format.ts` file — `formatReport` has exactly one consumer, so it stays in `cli.ts`.

**1.7 — Add SSRF protection to API route**

```typescript
// src/app/api/scan/route.ts
import { isUrlAllowed } from "@/scanner/http";

// Replace the current hostname.includes(".") check:
const fullUrl = url.startsWith("http") ? url : `https://${url}`;
if (!isUrlAllowed(fullUrl)) {
  return NextResponse.json({ error: "Invalid or blocked URL" }, { status: 400 });
}

// Sanitize error messages — don't leak internal URLs
} catch (err) {
  console.error("Scan error:", err);
  return NextResponse.json({ error: "Scan failed" }, { status: 500 });
}
```

### Phase 2: Tests

**2.1 — Pure parser tests (inline fixtures)**

Each test file uses inline string/JSON literals. No external fixture files.

`src/scanner/urls.test.ts` — already pure, test `analyzeUrls()` with URL arrays:
```typescript
import { describe, it, expect } from "vitest";
import { analyzeUrls } from "./urls";

describe("analyzeUrls", () => {
  it("groups URLs by path pattern", () => {
    const urls = [
      "https://example.com/blog/post-one/",
      "https://example.com/blog/post-two/",
      "https://example.com/about/",
    ];
    const result = analyzeUrls("https://example.com", urls);
    expect(result.totalIndexedUrls).toBe(3);
    expect(result.patterns).toContainEqual(
      expect.objectContaining({ pattern: "/blog/{slug}/", count: 2 })
    );
  });
});
```

`src/scanner/plugins.test.ts`:
```typescript
describe("parsePluginSignatures", () => {
  it("detects plugins from asset paths", () => {
    const html = `<link rel="stylesheet" href="/wp-content/plugins/elementor/css/frontend.css">`;
    const result = parsePluginSignatures(html);
    expect(result.plugins[0].slug).toBe("elementor");
    expect(result.plugins[0].category).toBe("page-builder");
  });

  it("detects plugins from HTML comments", () => {
    const html = `<!-- This site is optimized with the Yoast SEO plugin -->`;
    const result = parsePluginSignatures(html);
    expect(result.plugins[0].slug).toBe("wordpress-seo");
  });

  it("deduplicates asset-path and signature matches", () => {
    const html = `
      <link href="/wp-content/plugins/elementor/css/frontend.css">
      <div class="elementor-kit-123">
    `;
    const result = parsePluginSignatures(html);
    const elementorPlugins = result.plugins.filter(p => p.slug === "elementor");
    expect(elementorPlugins).toHaveLength(1);
  });

  it("title-cases unknown plugin slugs", () => {
    const html = `<script src="/wp-content/plugins/my-custom-thing/js/app.js">`;
    const result = parsePluginSignatures(html);
    expect(result.plugins[0]).toMatchObject({
      slug: "my-custom-thing", name: "My Custom Thing", category: "other"
    });
  });
});
```

`src/scanner/rss.test.ts`:
```typescript
describe("parseRssXml", () => {
  it("extracts items from RSS feed", () => {
    const xml = `<?xml version="1.0"?>
      <rss version="2.0"><channel>
        <item>
          <title>Hello World</title>
          <link>https://example.com/hello-world/</link>
          <category>News</category>
        </item>
      </channel></rss>`;
    const items = parseRssXml(xml);
    expect(items[0].title).toBe("Hello World");
    expect(items[0].categories).toContain("News");
  });
});
```

`src/scanner/sitemap.test.ts`:
```typescript
describe("parseSitemapXml", () => {
  it("parses a urlset sitemap", () => {
    const xml = `<?xml version="1.0"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url><loc>https://example.com/page-one/</loc></url>
        <url><loc>https://example.com/page-two/</loc></url>
      </urlset>`;
    const result = parseSitemapXml(xml);
    expect(result.type).toBe("urlset");
    if (result.type === "urlset") {
      expect(result.pageUrls).toHaveLength(2);
    }
  });

  it("parses a sitemap index", () => {
    const xml = `<?xml version="1.0"?>
      <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <sitemap><loc>https://example.com/sitemap-posts.xml</loc></sitemap>
      </sitemapindex>`;
    const result = parseSitemapXml(xml);
    expect(result.type).toBe("index");
    if (result.type === "index") {
      expect(result.sitemapUrls).toContain("https://example.com/sitemap-posts.xml");
    }
  });
});
```

`src/scanner/wp-api.test.ts`:
```typescript
describe("parseTypesResponse", () => {
  it("filters out internal types", () => {
    const json = {
      post: { name: "Posts", slug: "post", rest_base: "posts", taxonomies: ["category"] },
      attachment: { name: "Attachment", slug: "attachment", rest_base: "media", taxonomies: [] },
    };
    const types = parseTypesResponse(json);
    expect(types).toHaveLength(1);
    expect(types[0].slug).toBe("post");
  });
});

describe("parseContentItems", () => {
  it("extracts titles and count from API response", () => {
    const json = [
      { title: { rendered: "Hello &amp; World" } },
      { title: { rendered: "Second Post" } },
    ];
    const result = parseContentItems(json, "42");
    expect(result.count).toBe(42);
    expect(result.samples).toEqual(["Hello & World", "Second Post"]);
  });
});
```

`src/scanner/utils.test.ts` — trivial tests for `titleCase`, `decodeHtmlEntities`, `toErrorMessage`.

`src/scanner/format.test.ts` — tests for `formatReport()` with hand-crafted `ScanResult` objects. Import from `../cli`.

**2.2 — Integration test for `scan()`**

`src/scanner/index.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { scan, buildFallbackContentTypes } from "./index";

// Simple inline mock fetcher — maps URL patterns to canned responses
function createMockFetcher(responses: Record<string, { status: number; body: string; headers?: Record<string, string> }>): Fetcher {
  return async (input) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [pattern, response] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return new Response(response.body, {
          status: response.status,
          headers: response.headers,
        });
      }
    }
    return new Response("", { status: 404 });
  };
}

describe("scan", () => {
  it("uses API path when REST API is available", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));

    const fetcher = createMockFetcher({
      // resolveRedirects HEAD
      "https://example.com": { status: 200, body: "" },
      // probeApi HEAD
      "/wp-json/": { status: 200, body: "" },
      // ... canned API responses
    });

    const result = await scan("https://example.com", fetcher);
    expect(result.apiAvailable).toBe(true);
    expect(result.scannedAt).toBe("2026-01-15T12:00:00.000Z");

    vi.useRealTimers();
  });
});

describe("buildFallbackContentTypes", () => {
  it("merges sitemap groups with RSS categories", () => {
    // ... test the pure merge logic directly
  });
});
```

**2.3 — Verify everything works**

```bash
npm test               # All tests pass
npx next build         # Compiles
npx tsx src/cli.ts https://hello.pricelabs.co  # Still works
npm run dev            # Web UI still works
```

### File changes summary

| File | Action |
|------|--------|
| `vitest.config.ts` | **New** — Vitest config with `@/*` alias |
| `package.json` | Add `vitest` dev dep, `test` + `test:watch` scripts |
| `src/scanner/http.ts` | **New** — `Fetcher` type, `fetchXml()`, `fetchJson()`, `isUrlAllowed()`, `DEFAULT_HEADERS` |
| `src/scanner/utils.ts` | **New** — `titleCase()`, `decodeHtmlEntities()`, `toErrorMessage()` |
| `src/scanner/plugins.ts` | Export `parsePluginSignatures()`, rename wrapper to `fetchPlugins()`, accept `Fetcher`, remove local `titleCase` |
| `src/scanner/rss.ts` | Export `parseRssXml()`, rename wrapper to `fetchRss()`, accept `Fetcher`, remove local `fetchXml` |
| `src/scanner/sitemap.ts` | Export `parseSitemapXml()` + `groupSitemapUrls()`, rename wrapper to `fetchSitemap()`, accept `Fetcher`, remove local `fetchXml` |
| `src/scanner/wp-api.ts` | Export `parseTypesResponse()`, `parseTaxonomiesResponse()`, `parseContentItems()`, accept `Fetcher`, remove local `fetchJson`/`decodeHtmlEntities`, return `{contentTypes, errors}` instead of full `ScanResult` |
| `src/scanner/index.ts` | Export `buildFallbackContentTypes()`, accept `Fetcher` in `scan()` + `resolveRedirects()`, compose `ScanResult` instead of mutating, use `toErrorMessage()` |
| `src/cli.ts` | Export `formatReport()`, guard `main()` with `isDirectRun` check |
| `src/app/api/scan/route.ts` | Use `isUrlAllowed()` for SSRF protection, sanitize error messages |
| `src/scanner/urls.test.ts` | **New** — tests for `analyzeUrls()` |
| `src/scanner/plugins.test.ts` | **New** — tests for `parsePluginSignatures()` |
| `src/scanner/rss.test.ts` | **New** — tests for `parseRssXml()` |
| `src/scanner/sitemap.test.ts` | **New** — tests for `parseSitemapXml()` + `groupSitemapUrls()` |
| `src/scanner/wp-api.test.ts` | **New** — tests for API response parsers |
| `src/scanner/utils.test.ts` | **New** — tests for shared utilities |
| `src/scanner/format.test.ts` | **New** — tests for `formatReport()` (imported from `../cli`) |
| `src/scanner/index.test.ts` | **New** — integration tests with inline mock `Fetcher` + tests for `buildFallbackContentTypes()` |

## References

- Review findings: `resolveRedirects` gap, error handling asymmetry, timeout hardcoding, SSRF, naming inconsistency, over-engineering
- `src/scanner/urls.ts` — only existing pure module (immediately testable)
- `fast-xml-parser` — stateless per `parse()`, safe for module-level singleton
- `AbortSignal.timeout` + `vi.useFakeTimers` — use `{ shouldAdvanceTime: true }` if needed so abort signals still fire in tests
