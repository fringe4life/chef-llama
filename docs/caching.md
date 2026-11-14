# Route caching (Workers Cache)

**Status:** accepted (14 Nov 2026, Coinnich). Decision: [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md). Agent hard rules: [AGENTS.md](../AGENTS.md).

Alchemy `Cloudflare.Website.SvelteKit` **`cache: { enabled: true }`**. Workers Cache on + no `Cache-Control` ≈ 2 h cache; cookie is **not** in the cache key. Default is therefore **deny**.

The **only** way to cache is `publicCache` in `#lib/server/cache`.

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
| `tags` | 1–10 | must match `^(popular\|popular-top\|popular-<type>\|recipe-[0-9a-z]{6,32})$` |

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
| `/recipes/[id]` | browser **300**, edge **31536000**, tag `recipe-{id}` (immutable recipe HTML) |
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

Hash visible `[id, title]` order per list vs KV `popular:hashes`. Write only **changed** `popular:{type}` (and `popular:all`). Purge **only** changed tags; also `popular-top` **iff** the top 5 changed. Write hashes **last**.

KV miss on `/` or `/popular`: last-good or empty placeholder — **never** a live rank on the request.

Query strings on `/popular/*` redirect to the clean URL.

## Cold cache

Each deploy gets a **new** cache (Cloudflare default per-version). No cross-version cache. Do not try to keep HIT across deploys.

## Playwright (layer 3)

Against **`wrangler dev` production build**, not `vitest-pool-workers`. Manifest: `routes.manifest.ts`. Fail if a route is missing or stale. Fetch anonymous **and** with a session cookie. Public/static: no `Set-Cookie`, no `Vary: Cookie`, no `<script>` / `modulepreload` (theme inline script in `app.html` excepted). Private exactly `private, no-store`. 404s and remote queries no-store. Public bodies **byte-identical** with/without cookie.
