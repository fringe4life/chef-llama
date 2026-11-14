# Route caching (Workers Cache)

**Status:** accepted (14 Nov 2026, Coinnich). Decision: [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md). Agent hard rules: [AGENTS.md](../AGENTS.md).

Alchemy `Cloudflare.Website.SvelteKit` **`cache: { enabled: true }`**. Workers Cache on + no `Cache-Control` ≈ 2 h cache; cookie is **not** in the cache key. Default is therefore **deny**.

The **only** way to cache is `publicCache` in `#lib/server/cache`. 301s and 404s never go through `publicCache`; default-deny → `private, no-store`.

Kit 3.2 matchers: single `src/params.ts` using `defineParams` from `@sveltejs/kit/params`, Valibot schemas from `#lib/schemas/*`. Routes `/recipes/[slug=slug]`. Brands `RecipeSlug` and `Ulid`. Matchers run server **and** browser: never import `#lib/server/*`. Param matching neither → 404 before load (still no-store via the hook). No `src/id-patterns.ts`. Mirrors dollar-holler `src/params.ts` + `#lib/schemas/cursor-id.ts`.

## `publicCache(event, { browser, edge, swr?, tags })`

Throws unless:

- the route is under `(static)` or `(site)`
- method is `GET` or `HEAD`

Limits (integers):

| Field | Max | Other |
|---|---|---|
| `browser` | 3600 | `browser ≤ edge` |
| `edge` | 1 year (31536000) | |
| `swr` | 7 days (604800) | optional |
| `tags` | 1–10 | must match `^(popular\|popular-top\|popular-[a-z0-9-]+\|recipe-[0-9a-hjkmnp-tv-z]{26})$` |

`CacheTag` is a template-literal type of that pattern.

Emits:

- `Cache-Control: public, max-age=B`
- `Cloudflare-CDN-Cache-Control: max-age=E[, stale-while-revalidate=S]`
- `Cache-Tag: …`

**Never** `s-maxage` (`s-maxage` + SWR disables stale serving).

## Headers by route

| Surface | Cache |
|---|---|
| Prerendered `(static)` HTML | Static Assets default: `public, max-age=0, must-revalidate` + ETag |
| Hashed assets (CSS/fonts/JS chunks) | immutable 1 year |
| `/recipes/[slug=slug]` canonical 200 | browser **300**, edge **31536000**, tag `recipe-{ulid}` (immutable recipe HTML) |
| `/recipes/...` 301 (wrong/missing title, known suffix) | `private, no-store` — never `publicCache` (else heuristic 1200s per typo path) |
| Unknown recipe suffix / unmatched slug 404 | `private, no-store` — never `publicCache` (else heuristic 180s per typo path) |
| `/popular` `/popular/[type]` | browser **60**, edge **3600**, swr **86400**, tags `popular` / `popular-{type}` |
| `/` | same as Popular, tag `popular-top` |
| Unknown `/popular/[type]` 404 | `private, no-store` (hook) |
| Everything else (incl. `(app)`, remotes, `/sign-in`) | `private, no-store` |

## Default-deny hook

If the response did not come from `publicCache`: set `private, no-store`, strip `Cloudflare-CDN-Cache-Control` and `Cache-Tag`.

Public `(static)` / `(site)` routes: `Set-Cookie` or `Vary: Cookie` / `Authorization` is a **violation**. Dev **throws**. Prod **strips**, forces no-store, logs `[cache-guard]` to Workers Logs.

## Cron snapshot (not per-save)

Jobs Worker Cron, one D1 aggregate:

- 7-day saves, **distinct savers**, public type tags
- deterministic rank
- cap **20**
- min **5** distinct savers to appear

Hash visible `[id, slug, title]` order per list vs KV `popular:hashes`. KV items `{id (ULID), slug, title}`. Cards and sitemap link `/recipes/{slug}`. Write only **changed** `popular:{type}` (and `popular:all`). Purge **only** changed tags; also `popular-top` **iff** the top 5 changed. Write hashes **last**.

KV miss on `/` or `/popular`: last-good or empty placeholder — **never** a live rank on the request.

Query strings on `/popular/*` redirect to the clean URL.

## Cold cache

Each deploy gets a **new** cache (Cloudflare default per-version). No cross-version cache. Do not try to keep HIT across deploys.

## Playwright (layer 3)

Against **`wrangler dev` production build**, not `vitest-pool-workers`. Manifest: `routes.manifest.ts`. Fail if a route is missing or stale. Fetch anonymous **and** with a session cookie. Public/static: no `Set-Cookie`, no `Vary: Cookie`, no `<script>` / `modulepreload` (theme inline script in `app.html` excepted). Private exactly `private, no-store`. 404s and remote queries no-store. Public bodies **byte-identical** with/without cookie.

## bundlewatch (complements 0-JS guardrails)

PR check on the **built client** JS/CSS ([ADR 0021](./adr/0021-ci-preview-deps-hooks.md) · [tech-stack.md](./tech-stack.md) CI). Playwright already fails public pages that ship `<script>` / `modulepreload`. bundlewatch is the size brake after Vite emit.

| Surface | JS budget |
|---|---|
| `/` (index) and `(static)` / public `(site)` pages | **0 JS** |
| `/pantry` | **~43 KB** brotli Kit JS |
| CSS | **TBD by measurement** — do not invent a number |

Type-check sits next to this: `svelte-check --tsgo` (TS ~6 compile; skip `svelte-check-native`) — [#79](https://github.com/fringe4life/chef-llama/issues/79) round 38.
