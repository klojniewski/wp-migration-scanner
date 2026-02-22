---
title: "feat: Add third-party integration detection"
type: feat
date: 2026-02-22
---

# Add Third-Party Integration Detection

## Overview

Detect non-WordPress third-party services embedded in homepage HTML — analytics, chat widgets, heatmaps, tag managers, marketing tools, form embeds, and scheduling tools. A real client (pricelabs.co) listed 10 integrations; the scanner should catch most of them automatically from the public HTML source.

## Motivation

The current scanner detects WordPress plugins via `/wp-content/plugins/` asset paths and HTML signatures, but misses the broader integration landscape — services like Intercom, HubSpot, Google Analytics, Hotjar, etc. that are embedded directly as `<script>` or `<iframe>` tags. These integrations are critical migration context: each one requires equivalent implementation or replacement in the target platform.

## Proposed Solution

A new scanner module (`src/scanner/integrations.ts`) following the exact same pure-parser + thin-fetch pattern as the existing plugin detection. Refactor homepage HTML fetching to avoid a duplicate HTTP request.

## Technical Approach

### Phase 1: Refactor homepage HTML fetch (prep)

Currently `fetchPlugins` in `src/scanner/plugins.ts:214-228` fetches homepage HTML internally. Extract this into a shared utility so both plugin detection and integration detection use the same HTML without a duplicate request.

**Changes to `src/scanner/index.ts`:**

```typescript
// Before (two independent fetches):
const [apiAvailable, sitemapResult, pluginResult] = await Promise.all([
  probeApi(baseUrl, fetcher),
  fetchSitemap(baseUrl, fetcher),
  fetchPlugins(baseUrl, fetcher),   // fetches homepage HTML internally
]);

// After (one fetch, two parsers):
const [apiAvailable, sitemapResult, homepageHtml] = await Promise.all([
  probeApi(baseUrl, fetcher),
  fetchSitemap(baseUrl, fetcher),
  fetchHomepageHtml(baseUrl, fetcher),  // NEW: returns string | null
]);

const pluginResult = homepageHtml ? parsePluginSignatures(homepageHtml) : null;
const integrationResult = homepageHtml ? parseIntegrations(homepageHtml) : null;
```

**New function in `src/scanner/plugins.ts`:**

```typescript
export async function fetchHomepageHtml(
  baseUrl: string,
  fetcher: Fetcher = globalThis.fetch,
): Promise<string | null> {
  try {
    const res = await fetcher(baseUrl, {
      headers: DEFAULT_HEADERS,
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
```

Remove the internal fetch from `fetchPlugins` — it becomes unnecessary since `parsePluginSignatures` is already a pure function that accepts an HTML string.

### Phase 2: New types

**Add to `src/types.ts`:**

```typescript
export type IntegrationCategory =
  | "analytics"
  | "tag-manager"
  | "chat"
  | "heatmap"
  | "marketing"
  | "form-embed"
  | "scheduling"
  | "cookie-consent"
  | "other";

export interface DetectedIntegration {
  slug: string;
  name: string;
  category: IntegrationCategory;
}

export interface IntegrationScanResult {
  integrations: DetectedIntegration[];
  totalDetected: number;
}
```

**Extend `ScanResult`:**

```typescript
export interface ScanResult {
  // ... existing fields ...
  detectedIntegrations: IntegrationScanResult | null;
}
```

**Extend `AnnotationSection`:**

```typescript
export type AnnotationSection =
  | "content-types" | "plugins" | "url-structure"
  | "warnings" | "multilingual" | "integrations";
```

### Phase 3: Integration detection module

**New file: `src/scanner/integrations.ts`**

A `KNOWN_INTEGRATIONS` array of signature objects, each with a `test(html)` function checking for service-specific patterns in `<script src="...">` URLs, inline script content, and `<iframe src="...">` URLs.

**Target services (~25):**

| Service | Category | Detection Pattern |
|---------|----------|-------------------|
| Google Analytics | analytics | `google-analytics.com/analytics.js`, `googletagmanager.com/gtag/js` |
| Google Tag Manager | tag-manager | `googletagmanager.com/gtm.js` |
| Facebook Pixel | analytics | `connect.facebook.net/en_US/fbevents.js` |
| Hotjar | heatmap | `static.hotjar.com` |
| Microsoft Clarity | heatmap | `clarity.ms/tag` |
| HubSpot | marketing | `js.hs-scripts.com`, `js.hsforms.net` |
| Intercom | chat | `widget.intercom.io`, `js.intercomcdn.com` |
| Drift | chat | `js.driftt.com` |
| Crisp | chat | `client.crisp.chat` |
| Zendesk | chat | `static.zdassets.com`, `zopim.com` |
| LiveChat | chat | `cdn.livechatinc.com` |
| Tidio | chat | `code.tidio.co` |
| Freshdesk | chat | `wchat.freshchat.com` |
| Segment | analytics | `cdn.segment.com/analytics.js` |
| Mixpanel | analytics | `cdn.mxpnl.com`, `mixpanel.com/track` |
| Mailchimp | marketing | `chimpstatic.com`, `list-manage.com` |
| ConvertKit | marketing | `convertkit.com` |
| Typeform | form-embed | `embed.typeform.com` |
| Calendly | scheduling | `assets.calendly.com`, `calendly.com/` (iframe) |
| VWO | heatmap | `dev.visualwebsiteoptimizer.com` |
| CookieBot | cookie-consent | `consent.cookiebot.com` |
| CookieYes | cookie-consent | `cdn-cookieyes.com` |
| OneTrust | cookie-consent | `cdn.cookielaw.org`, `optanon.blob.core.windows.net` |
| Complianz | cookie-consent | `complianz-gdpr` (class/id), `cmplz-` prefix in scripts |
| Termly | cookie-consent | `app.termly.io` |

**Pure parser signature:**

```typescript
export function parseIntegrations(html: string): IntegrationScanResult
```

- Iterates through signatures, tests each against the HTML
- Deduplicates by slug (same pattern as plugins)
- Sorts by category order, then alphabetically
- Returns `{ integrations, totalDetected }`

### Phase 4: Tests

**New file: `src/scanner/integrations.test.ts`**

Follow the pattern of `plugins.test.ts` — test only the pure parser with synthetic HTML snippets:

- One test per service (script tag containing the detection pattern)
- Test iframe detection (Calendly, Typeform)
- Test deduplication (same service matched by two patterns)
- Test empty HTML returns empty array
- Test sort order by category
- Test cookie consent detection (CookieBot, OneTrust, Complianz)
- ~30 test cases total

### Phase 5: Wire into orchestrator

**Update `src/scanner/index.ts`:**

- Import `parseIntegrations` and `fetchHomepageHtml`
- Fetch homepage HTML once in `Promise.all`
- Call both `parsePluginSignatures` and `parseIntegrations` with the shared HTML
- Attach `integrationResult` to the `ScanResult` object
- Add `.catch()` error handling

### Phase 6: UI — new card component

**New file: `src/components/detected-integrations-card.tsx`**

Follow the pattern of `detected-plugins-card.tsx`:
- Group integrations by category
- Render in a grid with category-colored headers
- Category labels: Analytics, Tag Manager, Chat, Heatmap, Marketing, Form Embed, Scheduling, Cookie Consent, Other

**Update `src/components/scan-results.tsx`:**

- Render `DetectedIntegrationsCard` after the plugins section
- Conditionally render only when `detectedIntegrations?.integrations.length > 0`
- Add `AnnotationBlock` for integrations section

### Phase 7: CLI output

**Update `src/cli.ts`:**

- Add "Third-party Integrations" section in `formatReport` after plugins
- Group by category, same format as plugins: `Category: Service1, Service2`

### Phase 8: Annotations

**Update `src/lib/annotations.ts`:**

Add 3-4 rules:
1. **GTM detected** → "Google Tag Manager detected. Additional analytics and tracking services may be loaded dynamically and are not visible in static HTML."
2. **5+ integrations** → "N third-party integrations detected. Each requires equivalent implementation or replacement in the target platform."
3. **Multiple analytics tools** → "Multiple analytics tools detected (list). Consider consolidation during migration."
4. **Cookie consent detected** → "Cookie consent solution detected (name). Ensure GDPR/CCPA compliance is maintained during migration — consent preferences and banner configuration will need reimplementation."

## Overlap: Plugins vs. Integrations

Keep as separate sections. When a service exists as both a WP plugin and a direct script embed, show both — this is meaningful migration context (the plugin manages the embed, but both need handling). No deduplication across sections.

## Scoping Decisions (v1)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Homepage only vs. inner pages | Homepage only | Inner page sampling is a separate feature (PRD "Not Started"). Add limitation text. |
| Parse GTM containers | No | Complex, unreliable. Detect GTM + add annotation about dynamic loading. |
| Confidence levels | No | Use specific URL-pattern matching to minimize false positives instead. |
| Stats row integration count | No | Less fundamental than existing 4 metrics. Count shown in section header. |
| Migration scope impact | Yes | Add consideration when 5+ integrations detected. |

## Acceptance Criteria

- [x] `parseIntegrations(html)` pure function detects all ~25 target services
- [x] Homepage HTML fetched once, shared between plugin and integration parsers
- [x] New `IntegrationScanResult` type on `ScanResult`
- [x] UI card groups integrations by category, renders after plugins section
- [x] CLI output includes "Third-party Integrations" section
- [x] Annotation rules for GTM, 5+ integrations, multiple analytics
- [x] Scan limitations updated to note homepage-only detection
- [x] Tests for each target service + edge cases (~30 tests)
- [x] `npm test` passes, `npm run build` compiles
- [x] Verify against pricelabs.co — should detect GTM, VWO, and other visible services

## Files to Create

- `src/scanner/integrations.ts` — detection module (pure parser + signatures)
- `src/scanner/integrations.test.ts` — tests
- `src/components/detected-integrations-card.tsx` — UI card

## Files to Modify

- `src/types.ts` — new types + extend `ScanResult` and `AnnotationSection`
- `src/scanner/plugins.ts` — extract `fetchHomepageHtml`, remove internal fetch from `fetchPlugins`
- `src/scanner/index.ts` — fetch HTML once, call both parsers, wire up result
- `src/components/scan-results.tsx` — render new card + annotations
- `src/cli.ts` — add CLI output section
- `src/lib/annotations.ts` — new annotation rules
- `src/lib/migration-scope.ts` — integration count consideration
- `src/components/scan-limitations.tsx` — add homepage-only integration note

## References

- Existing plugin detection pattern: `src/scanner/plugins.ts:75-228`
- Plugin tests pattern: `src/scanner/plugins.test.ts`
- Scanner orchestration: `src/scanner/index.ts:103-113`
- Type definitions: `src/types.ts:43-73`
- PriceLabs homepage (real client): `https://hello.pricelabs.co` — uses GTM, VWO, Gravity Forms, Yoast, and more
