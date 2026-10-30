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
- Playwright starts the app automatically through `webServer` in `playwright.config.ts` (`npm run dev` locally, `npm run start` on CI after `npm run build`). `tests/example.spec.ts` targets `playwright.dev` and is excluded with `testIgnore`.

## Supabase - SKILLS

- Skills live in `.agents/skills/` and are pinned in `skills-lock.json`: `supabase` (Database, Auth, Edge Functions, Storage, Realtime, CLI, SSR clients) and `supabase-postgres-best-practices`.
- Load `supabase-postgres-best-practices` before any schema, migration, RLS, index, trigger, or SQL change, including one-column edits.
- Load `supabase` for client integration, auth/session issues, and troubleshooting.
- Refresh both with `npx skills add supabase/agent-skills`; never edit them by hand.

## Supabase MCP

- `.opencode/opencode.json` registers the remote MCP `supabase` (project ref `mtbdpnkwkcmckawicjjm`, features docs, account, database, debugging, development, functions, branching).
- Key tools: `list_tables`, `execute_sql`, `apply_migration`, `generate_typescript_types`, `get_advisors`, `search_docs`.
- Use `apply_migration` (snake_case name) for DDL and `execute_sql` for queries. Run `get_advisors` after schema changes.
- Run `generate_typescript_types` after migrations instead of hand-writing row types.
- `SUPABASE_DB_PASSWORD` is set in `.env` (git-ignored). Keep credentials and project refs out of code and commits.
- The app does not consume Supabase yet: no `@supabase/supabase-js` dependency or `lib/supabase` client exists.

## Database schema

- `DATABASE.md` is the source of truth for the PostgreSQL schema. Read it before modeling, migrating, or querying.
- Persisted values are always in English (enums, tags, codes); Spanish labels live only in the UI layer.
- Conventions: `id uuid` PK with `gen_random_uuid()`, and `created_at` / `updated_at` as `timestamptz`.
- `users.id` mirrors `auth.users.id` (FK `ON DELETE CASCADE`) and is created by an `AFTER INSERT` trigger (`SECURITY DEFINER`) reading `raw_user_meta_data` (`daycare_id`, `role`, `full_name`). Never duplicate `email` or `password_hash`; RLS is on for `users`.
- Core many-to-many: `parent_children` (family links), `post_children` (post tagging), plus `invitations` for onboarding.
- The parent feed is posts tagged with their children's `child_id` plus `announcement` posts from their room.
- Respect documented constraints: `children.status = archived` for soft delete, UNIQUE (`parent_id`, `child_id`), UNIQUE (`post_id`, `user_id`) on reactions, UNIQUE (`child_id`, `date`) on daily summaries.
- Update `DATABASE.md` in the same change as any migration that alters the schema.

## Spec Driven Development - SKILLS

- /spec usaremos este skill para crear las especificaciones.
- /spec-impl usaremos este skill para implementar

<!-- BEGIN:nextjs-agent-feedback -->

## Report Next.js feedback

The project owner enabled `experimental.agentFeedback`, authorizing this feedback pass. When enabled, `next dev` writes this block and restores it if removed. Commit `AGENTS.md` with your work to keep the tree clean.

During the current user request, retain anonymized facts as feedback candidates for meaningful or recurring Next.js issues:

- Crashes, hangs, OOMs, or unexpected slowness
- Incorrect behavior, output, errors, or diagnostics
- Missing, unclear, or conflicting documentation
- Unexpected CLI, codemod, Skill, or upgrade behavior and non-obvious workarounds

Continue the current user request without reporting immediately. Routine debugging is not feedback. Verify changes before retaining them as feedback candidates. Never retain code, logs, paths, URLs, secrets, personal information, or project-specific data.

Retain qualifying friction even if it is later fixed or worked around; record the final outcome during the reporting pass.

Before the final response, run one reporting pass. If candidates remain, from this file's directory run `npx --no-install next internal agent-feedback-instructions` once without piping or truncating its output. Follow its output or error guidance. If a network sandbox blocks it, retry with network access; if it still returns no output, continue normally.

<!-- END:nextjs-agent-feedback -->
