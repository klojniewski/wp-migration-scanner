# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

## [0.5.0] - 2026-02-26

### Added
- Clickable sample URLs in content types table — links open the actual WordPress post
- Info tooltips on all stats row metrics explaining data sources (REST API vs sitemap)
- Clickable example URLs in URL structure table
- RSS parser now extracts post links for URL mapping

### Changed
- Samples type changed from `string[]` to `{ title: string; url?: string }[]` across scanner and components
- Scan limitations section reformatted into structured bullet list
- Content relationships chart: larger inline nodes and fonts for better readability
- Languages stat shows "1 Language" instead of dash when no multilingual structure detected

## [0.4.1] - 2026-02-26

### Added
- Animated WebGL shader background on CTA section (FBM noise with ASCII dithering pattern)
- Shader reveals on button hover with 500ms opacity fade; text transitions to white
- Pure WebGL canvas (no three.js dependency) with prefers-reduced-motion support

## [0.4.0] - 2026-02-22

### Added
- Interactive content relationships diagram: hover-to-highlight paths and connected nodes
- Per-type color palette (10 colors) with colored accent bars on content type nodes
- Logarithmic line thickness proportional to taxonomy term count
- Fullscreen mode with expand button (hover-revealed) and Escape-to-close
- Smooth CSS transitions on all path and node state changes
- "Hover to trace connections" legend entry

### Changed
- Compact inline chart layout: smaller nodes (32px), tighter spacing, smaller fonts
- Fullscreen uses larger layout (44px nodes, 220px columns) to use the extra space
- Connection paths colored by source content type instead of shared/unshared binary

## [0.3.2] - 2026-02-22

### Changed
- Switch scan API from POST to GET for Vercel CDN edge caching (15-minute TTL per URL)

## [0.3.1] - 2026-02-22

### Added
- Clickable taxonomy badges that reveal term names in a popover (e.g., click "Categories (14)" to see "News", "Tutorials", etc.)
- Taxonomy term names fetched from REST API at zero additional HTTP cost (bumped per_page from 1 to 100)
- Fallback mode also populates terms from RSS categories

## [0.3.0] - 2026-02-22

### Added
- Dark-themed report UI overhaul replacing light shadcn card layout with data-dense professional design
- Annotations engine with 10 rules generating contextual migration insights
- Migration scope summary component
- Multilingual coverage matrix
- Stats row with key scan metrics
- CTA section and scan limitations notice
- DM Sans + JetBrains Mono typography
- Global dark mode applied to homepage, form, and progress states

## [0.2.1] - 2026-02-22

### Added
- Per-type content complexity indicators (simple / moderate / complex)
- Automatic classification from sample post HTML: detects ACF blocks, shortcodes, page builder markup
- Colored pill badges in content types table and CLI output
- Zero additional HTTP requests — analyzes the 5 sample posts already fetched per type

## [0.2.0] - 2026-02-21

### Added
- Content relationships diagram showing taxonomy connections across content types
- SVG-based visualization with bezier curves linking types to taxonomies
- Shared taxonomy highlighting (used by 2+ types)
- Orphaned taxonomy detection (0 terms) with dashed borders
- Scanner now includes 0-count taxonomies in scan data

## [0.1.2] - 2026-02-21

### Changed
- Upgraded to Next.js 16.1.6 and React 19.2.4

## [0.1.1] - 2026-02-21

### Added
- Vercel Analytics integration

## [0.1.0] - 2026-02-21

### Added
- WordPress migration scanner core: REST API scanner, sitemap parser, RSS fallback
- Content structure map: types, taxonomies, counts, sample titles
- URL structure detection: patterns, indexed URL count, multilingual detection
- Plugin detection: asset path extraction, HTML signature matching, ~40 known plugins
- CLI tool (`npx tsx src/cli.ts <url>`) with formatted report output
- Web UI: Next.js app with URL input, scan progress, and results display
- API route (`POST /api/scan`) powering the frontend
- Shareable report URLs via `?url=` query parameter with auto-scan
- SSRF protection on API route
- 86 tests across 8 test files (scanner modules + utilities)
- Redirect-following URL normalization

### Infrastructure
- Next.js 15, TypeScript, Tailwind CSS, shadcn/ui components
