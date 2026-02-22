# **PRD: WordPress Migration Scanner**

**Owner:** Chris / Jakub **Status:** Draft v0.4

---

## **Implementation Status**

### Done

**Scanner Core**
- REST API scanner: fetches types, taxonomies, counts, sample titles via `/wp-json/wp/v2/`
- Sitemap fallback: parses `sitemap.xml` / `sitemap_index.xml` / `wp-sitemap.xml`, groups URLs by pattern
- RSS fallback: extracts post titles and categories from `/feed/`
- Graceful degradation: each module fails independently, partial results still shown
- Content complexity analysis: classifies posts as simple / moderate / complex from sample post HTML (detects ACF blocks, shortcodes, page builder markup) — zero extra HTTP requests
- Content relationships: tracks which taxonomies belong to which content types, including 0-count taxonomies

**URL Structure (Section 3)**
- URL pattern detection from sitemap data (e.g. `/blog/{slug}/`, `/case-studies/{slug}/`)
- Total indexed URL count
- Multilingual detection (subdirectory, subdomain, hreflang patterns)

**Detected Plugins (Section 4)**
- Asset path extraction (`/wp-content/plugins/{slug}/`) from homepage HTML
- HTML signature matching (comments, CSS classes, meta tags) for ~17 signature patterns
- Known plugins database (~40 entries) covering page builders, SEO, forms, e-commerce, multilingual, cache, analytics, security
- Plugins grouped by category, page builders highlighted

**CLI Tool**
- `npx tsx src/cli.ts <url>` outputs formatted report with all sections including complexity indicators

**Web UI — Report**
- Dark-themed, data-dense professional migration report design (DM Sans + JetBrains Mono)
- Content types table with counts, taxonomies (clickable badges showing term names), sample titles, and complexity pill badges
- Content relationships diagram (SVG bezier curves linking types to taxonomies, shared taxonomy highlighting, orphaned taxonomy detection)
- URL structure card with patterns and multilingual info
- Multilingual coverage matrix
- Detected plugins grid with category grouping
- Annotations engine (10 rules generating contextual migration insights)
- Migration scope summary
- Stats row with key scan metrics
- CTA section ("Want a full audit?")
- Scan limitations notice
- Scan warnings display
- Global dark mode (homepage, form, progress states, report)

**Web UI — Homepage & UX**
- URL input form with validation
- Scan progress indicator
- Shareable report URLs via `?url=` query parameter with auto-scan and "Copy report link" button
- API route (`POST /api/scan`) with SSRF protection

**Infrastructure**
- Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- Vercel Analytics
- 86+ tests across 8 test files (Vitest)
- Redirect-following URL normalization
- Modular scanner architecture with pure parsers and centralized HTTP/utils

### Not Started

- **Website Architecture (Section 2)** — navigation structure extraction, page hierarchy detection, site sections/areas. Requires HTML crawling of homepage + inner pages to extract `<nav>` elements, menu structure, parent/child relationships
- **Inner page sampling** — scanning currently only fetches homepage HTML for plugin detection; PRD specifies "homepage + sampled inner pages" for richer plugin/architecture data
- **Deployment** — hosting on pagepro.co (or standalone), production configuration

---

## **What Is This**

A web tool where you paste a WordPress site URL and get back a structured overview of what's inside — content types, site architecture, URL patterns, and detected plugins. Everything a prospect (or we) need to understand "what are we actually migrating."

## **Objectives**

- Give prospects instant clarity on their WordPress content landscape  
- Replace manual discovery with automated content mapping  
- Create a natural entry point for migration conversations  
- Build the "Migration Readiness Assessment" lead magnet from GTM strategy

## **Target Users**

- **Prospects:** paste their own URL, see what they have, realize complexity  
- **Chris/Jakub:** run before or during discovery calls

## **How It Works**

1. User opens web page  
2. Pastes WordPress site URL  
3. Tool scans (30-90 seconds)  
4. Returns structured report

## **Output**

### **1\. Content Structure Map (hero feature)**

- Detected document/content types (posts, pages, CPTs)  
- Item count per type  
- Sample titles per type (3-5 examples)  
- Taxonomies (categories, tags, custom) with term counts  
- Content relationships (which taxonomies belong to which types)

Example:

```
Blog Posts .............. 342 items
  → Categories (12) | Tags (87)
Case Studies ............ 28 items
  → Industries (6) | Services (4)
Team Members ............ 15 items
Locations ............... 45 items
  → Regions (3)
Pages ................... 34 items
```

### **2\. Website Architecture**

- Main navigation structure (extracted from menus/HTML)  
- Page hierarchy (parent/child from URL patterns \+ sitemap)  
- Detected sections/areas of the site

### **3\. URL Structure**

- URL patterns per content type (e.g., `/blog/{slug}/`, `/case-studies/{slug}/`)  
- Total indexed URLs (from sitemap)  
- Multilingual URL patterns if detected (subdomains, subdirectories, hreflang)

### **4\. Detected Plugins**

- List of identified plugins (from HTML source, scripts, CSS, comments)  
- Grouped by function: page builder, SEO, forms, e-commerce, multilingual, other  
- Page builder highlighted (Elementor / Divi / WPBakery / Gutenberg)

## **Scanning Strategy**

```
URL Input
    │
    ▼
Probe REST API (/wp-json/wp/v2/)
    │
    ├── Available → fetch types, taxonomies, counts, samples
    │
    └── Blocked → fallback:
            ├── Parse sitemap(s) → URL inventory + pattern detection
            ├── Parse RSS feed → post metadata
            └── Crawl sample pages → HTML analysis
    │
    ▼
Scan HTML source (homepage + sampled inner pages)
    → plugin detection, navigation extraction, page builder identification
    │
    ▼
Structured Report
```

- Each module fails gracefully — partial results are still valuable  
- REST API open \= rich data; blocked \= still useful via sitemap \+ crawl

## **Architecture**

- **Frontend:** single page on pagepro.co (URL input \+ results display)  
- **Backend:** Node.js API endpoint (stateless, no database)  
- **No auth required** — all public data

## **Known Limitations (shown to user)**

- Only plugins with frontend footprint are detected  
- Content counts are estimates when REST API is restricted  
- Custom field structures (ACF) not visible from public access  
- "We found X — your actual site likely has more. Want a full audit?"

