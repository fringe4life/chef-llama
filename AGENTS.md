# Agent rules — Chef Llama

## Caching (Workers Cache is on)

Workers Cache is on (`Alchemy` `cache: { enabled: true }`). That is a **hard rule**, not an optimisation.

Cookie is **not** in the cache key. Workers Cache on + no `Cache-Control` ≈ 2 h of cache. A public page that runs `getSession` (or anything that `Set-Cookie`s / `Vary`s Cookie or Authorization) can leak a personalised response to the next anonymous HIT.

Default is **deny**: `private, no-store`. The **only** way to cache is `publicCache(event, { browser, edge, swr?, tags })` in `#lib/server/cache`.

- Throws unless the route is under `(static)` or `(site)` and the method is GET/HEAD.
- Integers only. `browser ≤ 3600`, `edge ≤ 1 year`, `swr ≤ 7 days`, `browser ≤ edge`.
- 1–10 tags matching `^(popular|popular-top|popular-[a-z0-9-]+|recipe-[0-9a-hjkmnp-tv-z]{26})$` (`CacheTag` template-literal type).
- Emits `Cache-Control: public, max-age=B`, `Cloudflare-CDN-Cache-Control: max-age=E[, stale-while-revalidate=S]`, `Cache-Tag`. **Never** `s-maxage`.

Hook: if the response did not go through `publicCache` → `private, no-store`, strip CDN / Cache-Tag headers. Public routes: `Set-Cookie` or `Vary: Cookie` / `Authorization` is a violation (dev throws; prod strips, no-store, log `[cache-guard]`).

Do **not**:

- set `Cache-Control` / `Cache-Tag` / `Cloudflare-CDN-Cache-Control` by hand (`chef/no-raw-cache-headers`)
- import auth / `getSession` from a public layout or page (`chef/public-route-purity`)
- ship `csr=true` on `(static)` / `(site)` (`chef/public-csr-false`)
- render theme from cookies on the server for public pages (blocking inline script in `app.html` only)
- rebuild Popular on save; the Jobs Worker **cron** snapshots KV
- cache unknown `/popular/[type]` 404s
- cache recipe 301s or 404s (Workers Cache heuristic 301 1200s / 404 180s per typo path)
- import `#lib/server/*` from `src/params.ts` (matchers run in the browser)
- add ogygia or `OGYGIA_SECRET`

Kit 3.2 matchers: single `src/params.ts` using `defineParams` from `@sveltejs/kit/params`, Valibot schemas from `#lib/schemas/*`. Routes `/recipes/[slug=slug]`. Brands `RecipeSlug` (canonical `{title}-{8 lowercase Crockford}` or bare 8-char suffix then load 301s) and `Ulid` (`^[0-9a-hjkmnp-tv-z]{26}$`). Never import `#lib/server/*`. Param matching neither → 404 before load (still no-store via the hook). No `src/id-patterns.ts`. Mirrors dollar-holler `src/params.ts` + `#lib/schemas/cursor-id.ts`.

Public bodies must be byte-identical with and without a session cookie. Cold cache on each deploy (per-version; no cross-version cache).

PR check **bundlewatch** on built client JS/CSS: index and `(static)`/`(site)` public pages **0 JS**; `/pantry` **~43 KB** brotli JS; CSS budget TBD by measurement. Type-check: `svelte-check --tsgo` (TS ~6; skip svelte-check-native).

## Where decisions live

Topic files in `docs/` are the **only** place decisions live. Each has a **Decided** and an **Open** section. There are no ADRs. GitHub issues are short tasks that link to a topic section and never carry decisions.

| Topic | File |
|---|---|
| Product: job, routes, Diet, Popular rules, pending, errors, icons | `docs/product.md` |
| Vocabulary (Cook, Recipe, Diet, Staples, Credits…) | `docs/GLOSSARY.md` |
| Auth: Better Auth, Google + email OTP, the `redirectTo` post-login redirect, sessions, guest Generate, mail | `docs/auth.md` |
| Data: ULID ids, recipe slugs, Drizzle, D1, DOs, KV, Queues, Vectorize, write path | `docs/data.md` |
| AI Generate: model, prompt, Recipe JSON, chips, cancel | `docs/ai.md` |
| Payments: Stripe packs, Credits, free-cook pool and status, 00:00 UTC reset, tax, topup | `docs/payments.md` |
| Caching, 0-JS public pages, Save on the cached recipe page | `docs/caching.md` |
| SEO: indexing and `noindex`, Popular purge, head tags and Open Graph (PNG `og:image`), sitemaps, robots.txt, AI crawlers, llms.txt | `docs/seo.md` |
| Security: rate limits, WAF, zone hardening, session IP, secrets + Varlock | `docs/security.md` |
| Theme: shadcn-style oklch tokens, light/dark, browser floor, typography, z-index, native overlays, design loop | `docs/theme.md` |
| Usage chart on `/account`: sideways CSS bars, full spec | `docs/chart.md` |
| Lint: ESLint 10 + Fallow + `svelte-check --tsgo`, `chef/*` rules, slop, pre-commit (husky + lint-staged) | `docs/lint.md` |
| Cursor hooks: `.cursor/hooks.json` running ESLint and Fallow for agents | `docs/cursor-hooks.md` |
| Agent skills: Matt Pocock's skills in `.agents/skills/` | `docs/skills.md` |
| Tests: seams, fixtures, Playwright (owner; one target, the PR preview), synthetic check | `docs/tests.md` |
| CI: jobs, Sengi runners, Actions hardening, exact-version deps, Dependabot, bundlewatch | `docs/ci.md` |
| Branch previews | `docs/previews.md` |
| Folder organisation (one Kit app, no empty folders) | `docs/folder-organisation.md` |
| Ops: observability, logging, Automations, deps review | `docs/ops.md` |
| Software factory: architecture hunt, agent retro, friction digest | `docs/factory.md` |
| v2 and later (parked) | `docs/v2.md` |

Rules for agents:
- Change a decision **only** by editing its topic file's Decided section in a PR Coinnich approves. Never decide in an issue or comment.
- When a task needs a decision, add it to the topic's **Open** section.
- Topic files never cite ADRs, issue numbers or working notes: write the actual content inline.
- Do not create ADRs or decision documents outside these files. Skills that write ADRs by default (`grill-with-docs`, `domain-modeling`) record decisions in the topic file instead.
- Don't skip the Git hooks (`--no-verify`, `HUSKY=0`); fix the lint error.
