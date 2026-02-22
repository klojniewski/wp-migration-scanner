# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/).

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
