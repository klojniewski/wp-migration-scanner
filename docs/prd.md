# **PRD: WordPress Migration Scanner**

**Owner:** Chris / Jakub **Status:** Draft v0.2

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

