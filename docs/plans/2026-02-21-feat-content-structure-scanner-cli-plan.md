---
title: "Content Structure Scanner - CLI v1"
type: feat
date: 2026-02-21
---

# Content Structure Scanner - CLI v1

Build a CLI tool that takes a WordPress site URL and returns a structured content map — types, counts, sample titles, taxonomies, and relationships. Next.js project scaffolding, but this phase is CLI-only.

## Acceptance Criteria

- [ ] Run `npx tsx src/cli.ts https://example.com` and get a formatted content report
- [ ] Probe WP REST API first (`/wp-json/wp/v2/types`, `/wp-json/wp/v2/taxonomies`)
- [ ] Fallback to sitemap + RSS parsing when REST API is blocked
- [ ] Partial results are still displayed (graceful degradation per the PRD)
- [ ] Output matches the PRD format (type name, count, sample titles, associated taxonomies)

## Context

From the PRD: Content Structure Map is the hero feature. REST API gives us the richest data. When blocked, sitemap URL patterns + RSS feed give us enough for useful estimates.

## MVP

### Project setup

```
wp-migration-scanner/
├── package.json          # next, typescript, tsx (for CLI dev)
├── tsconfig.json
├── next.config.ts
├── src/
│   ├── cli.ts            # CLI entry point — parse args, orchestrate, print
│   ├── scanner/
│   │   ├── index.ts      # orchestrator — probe API, choose strategy, merge results
│   │   ├── wp-api.ts     # REST API scanner — types, taxonomies, counts, samples
│   │   ├── sitemap.ts    # sitemap.xml parser — URL inventory + pattern detection
│   │   └── rss.ts        # RSS feed parser — post metadata fallback
│   └── types.ts          # shared TypeScript types (ScanResult, ContentType, Taxonomy)
```

### `src/types.ts`

```typescript
export interface ContentType {
  name: string;           // e.g. "Blog Posts", "Case Studies"
  slug: string;           // e.g. "post", "case-study"
  count: number;          // total items (exact from API, estimate from sitemap)
  isEstimate: boolean;    // true when count came from sitemap/RSS
  samples: string[];      // 3-5 example titles
  taxonomies: TaxonomyRef[];
}

export interface TaxonomyRef {
  name: string;           // e.g. "Categories"
  slug: string;
  count: number;          // number of terms
}

export interface ScanResult {
  url: string;
  scannedAt: string;
  apiAvailable: boolean;
  contentTypes: ContentType[];
  errors: string[];       // non-fatal warnings
}
```

### `src/scanner/wp-api.ts` — REST API strategy

1. `GET /wp-json/wp/v2/types` → list all public content types (filter out built-in non-content like `attachment`, `wp_block`)
2. For each type: `GET /wp-json/wp/v2/{rest_base}?per_page=5` → read `X-WP-Total` header for count, response body for sample titles
3. `GET /wp-json/wp/v2/taxonomies` → list all taxonomies with their `types` array (maps taxonomy → content type)
4. For each taxonomy: `GET /wp-json/wp/v2/{rest_base}?per_page=1` → read `X-WP-Total` for term count

### `src/scanner/sitemap.ts` — Sitemap fallback

1. Try `/sitemap.xml`, `/sitemap_index.xml`, `/wp-sitemap.xml`
2. Parse XML, extract all `<loc>` URLs
3. Group by URL pattern (e.g. `/blog/*`, `/case-studies/*`) to infer content types
4. Count URLs per pattern group = estimated item count

### `src/scanner/rss.ts` — RSS fallback

1. Try `/feed/`, `/rss/`
2. Parse XML, extract `<item>` titles and categories
3. Supplement sitemap data with actual titles and taxonomy terms

### `src/scanner/index.ts` — Orchestrator

```
1. Probe /wp-json/ — if 200, use wp-api strategy
2. If blocked/error — run sitemap + rss in parallel
3. Merge results into ScanResult
4. Return
```

### `src/cli.ts` — Output formatting

```
Scanning https://example.com ...

✓ WordPress REST API available

Content Structure Map
═══════════════════════════════════════

Blog Posts .............. 342 items
  → Categories (12) | Tags (87)
  Samples: "Getting Started with...", "How to...", ...

Case Studies ............ 28 items
  → Industries (6) | Services (4)
  Samples: "Acme Corp Migration", ...

Pages ................... 34 items
  Samples: "About Us", "Contact", ...

───────────────────────────────────────
3 content types | 4 taxonomies | 404 total items
```

When results are estimates (fallback):
```
Blog Posts .............. ~180 items (estimated from sitemap)
```

### Dependencies

```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19"
  },
  "devDependencies": {
    "typescript": "^5",
    "tsx": "^4",
    "@types/node": "^22",
    "fast-xml-parser": "^5"
  }
}
```

- `fast-xml-parser` — parse sitemap XML and RSS feeds (no native XML parser in Node)
- `tsx` — run TypeScript CLI directly during dev
- Native `fetch` — Node 18+ built-in, no axios needed

## References

- PRD: `docs/prd.md`
- WP REST API types endpoint: `GET /wp-json/wp/v2/types`
- WP REST API taxonomies endpoint: `GET /wp-json/wp/v2/taxonomies`
- Collection pagination headers: `X-WP-Total`, `X-WP-TotalPages`
