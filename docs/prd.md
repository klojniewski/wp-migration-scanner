# **PRD: WordPress Migration Scanner**

**Owner:** Chris / Jakub **Status:** Draft v0.3

---

## **Implementation Status**

### Done

- **Content Structure Map (Section 1)** — fully implemented
  - REST API scanner: fetches types, taxonomies, counts, sample titles via `/wp-json/wp/v2/`
  - Sitemap fallback: parses `sitemap.xml` / `sitemap_index.xml` / `wp-sitemap.xml`, groups URLs by pattern
  - RSS fallback: extracts post titles and categories from `/feed/`
  - Graceful degradation: each module fails independently, partial results still shown
- **URL Structure (Section 3)** — fully implemented
  - URL pattern detection from sitemap data (e.g. `/blog/{slug}/`, `/case-studies/{slug}/`)
  - Total indexed URL count
  - Multilingual detection (subdirectory, subdomain, hreflang patterns)
- **Detected Plugins (Section 4)** — fully implemented
  - Asset path extraction (`/wp-content/plugins/{slug}/`) from homepage HTML
  - HTML signature matching (comments, CSS classes, meta tags) for ~17 signature patterns
  - Known plugins database (~40 entries) covering page builders, SEO, forms, e-commerce, multilingual, cache, analytics, security
  - Plugins grouped by category, page builders highlighted
- **CLI tool** — `npx tsx src/cli.ts <url>` outputs formatted report with all sections
- **Web UI** — Next.js app with URL input, scan progress, and results display
  - Content types table with counts, taxonomies, sample titles
  - URL structure card with patterns and multilingual info
  - Detected plugins card with category-grouped badges
  - API route (`POST /api/scan`) powering the frontend
- **Infrastructure** — Next.js 15, TypeScript, shadcn/ui components, redirect-following URL normalization

### Not Started

- **Website Architecture (Section 2)** — navigation structure extraction, page hierarchy detection, site sections/areas
  - Requires HTML crawling of homepage + inner pages to extract `<nav>` elements, menu structure, parent/child relationships
  - Most complex remaining feature — needs a lightweight HTML crawler with DOM parsing
- **Inner page sampling** — scanning strategy currently only fetches homepage HTML for plugin detection; PRD specifies "homepage + sampled inner pages" for richer plugin/architecture data
- **Lead magnet CTA** — "We found X — your actual site likely has more. Want a full audit?" messaging
- **Deployment** — hosting on pagepro.co (or standalone), production configuration
- **Known limitations messaging** — showing users caveats about detection limits (Section "Known Limitations")

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

