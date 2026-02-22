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

## Visual / Mobile Testing

When modifying UI components — especially SVG diagrams, charts, or anything interactive — verify on mobile viewports before committing.

### Quick test with Playwright

```bash
# Start dev server on a free port
npx next dev -p 3001

# Run a Playwright script from /tmp (playwright must be installed there)
cd /tmp && node mobile-test.mjs
```

### Standard mobile test script pattern

```js
import { chromium, devices } from 'playwright';

const iPhone = devices['iPhone 13'];
const browser = await chromium.launch();
const context = await browser.newContext({ ...iPhone });
const page = await context.newPage();

await page.goto('http://localhost:3001/?url=<wordpress-site>', { timeout: 90000 });
await page.waitForSelector('text=<section heading>', { timeout: 90000 });

// Scroll to section, screenshot, interact, screenshot again
await page.screenshot({ path: '/tmp/mobile-test.png' });
await browser.close();
```

### What to check

- **Text legibility** — SVG viewBox scaling can shrink text below readable size on 375px screens. Prefer narrower viewBox widths (e.g. 420px not 600px) so content scales less aggressively.
- **Hover-dependent UI on touch** — anything using `onMouseEnter`/`group-hover:` is invisible on mobile. Add `onClick` tap handlers as fallback. Use `opacity-60 sm:opacity-0 group-hover:opacity-100` for elements that should be hover-revealed on desktop but visible on mobile.
- **Tap to dismiss** — if hover state highlights elements, add a tap-on-background handler to clear it.
- **Desktop-only hints** — hide "Press Esc" or keyboard shortcuts on mobile (`hidden sm:block`).
- **Viewport sizes** — test at iPhone 13 (390x844) or iPhone SE (375x667) minimum.

### Lessons learned

- `agent-browser` CLI cannot resize viewport after launch — use Playwright with `devices[...]` for mobile testing.
- Dev server on port 3000 may conflict with other local projects — use `-p 3001`.
- Always screenshot *after* interaction (tap/hover) to verify state changes actually render.

## Pre-commit Checklist

Before committing and pushing to main:

1. Bump `version` in `package.json` (semver: patch for fixes, minor for features, major for breaking changes)
2. Add entry to `CHANGELOG.md` with version number, date, and summary of changes
3. Update the "Implementation Status" section in `docs/prd.md` — move completed items to "Done", update "Not Started" / "In Progress"
4. Verify work aligns with the current implementation plan in `docs/plans/`
