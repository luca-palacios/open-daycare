<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MCPs

- Playwright MCP screenshots and output go in `.playwright-mcp/` (ignored by Git).

## Repository notes

- This is a single Next.js app. The home page is `app/page.tsx`; `app/layout.tsx` defines the root layout.
- Use `npm ci` to install dependencies. Available scripts: `npm run dev`, `npm run lint`, and `npm run build`; run typechecking with `npx tsc --noEmit`.
- Playwright tests are in `tests/`. Install browsers with `npx playwright install`; run one test in Chromium with `npx playwright test tests/seed.spec.ts --project=chromium`.
- Playwright does not start the app: `baseURL` and `webServer` are unset in `playwright.config.ts`. Start `npm run dev` separately for tests against this app. `tests/example.spec.ts` currently targets `playwright.dev`.

## Spec Driven Development - SKILLS

- /spec usaremos este skill para crear las especificaciones.
- /spec-impl usaremos este skill para implementar
