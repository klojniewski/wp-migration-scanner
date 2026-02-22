# WordPress Migration Scanner

A web tool + CLI that scans WordPress sites and produces a structured migration report: content types, URL structure, detected plugins, content complexity, and relationships.

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Testing:** Vitest
- **CLI:** tsx
- **Hosting:** Vercel

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (`npx next build`)
- `npm test` — run all tests (`vitest run`)
- `npm run test:watch` — run tests in watch mode
- `npm run scan` — CLI scanner (`tsx src/cli.ts <url>`)

## Project Structure

- `src/scanner/` — core scanning modules (wp-api, sitemap, rss, plugins, complexity, urls, http)
- `src/lib/` — annotations engine, migration scope logic
- `src/components/` — React report components
- `src/app/` — Next.js app routes (homepage + API)
- `src/cli.ts` — CLI entry point
- `src/types.ts` — shared TypeScript types
- `docs/prd.md` — product requirements document
- `docs/plans/` — implementation plans

## Pre-commit Checklist

Before committing and pushing to main:

1. Bump `version` in `package.json` (semver: patch for fixes, minor for features, major for breaking changes)
2. Add entry to `CHANGELOG.md` with version number, date, and summary of changes
3. Update the "Implementation Status" section in `docs/prd.md` — move completed items to "Done", update "Not Started" / "In Progress"
4. Verify work aligns with the current implementation plan in `docs/plans/`
