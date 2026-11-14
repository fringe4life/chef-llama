# Agent rules — Chef Llama

Product docs: [`docs/product.md`](./docs/product.md) · stack: [`docs/tech-stack.md`](./docs/tech-stack.md) · cache SSOT: [`docs/caching.md`](./docs/caching.md) · [ADR 0037](./docs/adr/0037-zero-js-public-cache-guardrails.md).

## Caching (Workers Cache is on)

Workers Cache is on (`Alchemy` `cache: { enabled: true }`). That is a **hard rule**, not an optimisation.

Cookie is **not** in the cache key. Workers Cache on + no `Cache-Control` ≈ 2 h of cache. A public page that runs `getSession` (or anything that `Set-Cookie`s / `Vary`s Cookie or Authorization) can leak a personalised response to the next anonymous HIT.

Default is **deny**: `private, no-store`. The **only** way to cache is `publicCache(event, { browser, edge, swr?, tags })` in `#lib/server/cache`.

- Throws unless the route is under `(static)` or `(site)` and the method is GET/HEAD.
- Integers only. `browser ≤ 3600`, `edge ≤ 1 year`, `swr ≤ 7 days`, `browser ≤ edge`.
- 1–10 tags matching `^(popular|popular-top|popular-<type>|recipe-[0-9a-z]{6,32})$` (`CacheTag` template-literal type).
- Emits `Cache-Control: public, max-age=B`, `Cloudflare-CDN-Cache-Control: max-age=E[, stale-while-revalidate=S]`, `Cache-Tag`. **Never** `s-maxage`.

Hook: if the response did not go through `publicCache` → `private, no-store`, strip CDN / Cache-Tag headers. Public routes: `Set-Cookie` or `Vary: Cookie` / `Authorization` is a violation (dev throws; prod strips, no-store, log `[cache-guard]`).

Do **not**:

- set `Cache-Control` / `Cache-Tag` / `Cloudflare-CDN-Cache-Control` by hand (`chef/no-raw-cache-headers`)
- import auth / `getSession` from a public layout or page (`chef/public-route-purity`)
- ship `csr=true` on `(static)` / `(site)` (`chef/public-csr-false`)
- render theme from cookies on the server for public pages (blocking inline script in `app.html` only)
- rebuild Popular on save; the Jobs Worker **cron** snapshots KV
- cache unknown `/popular/[type]` 404s
- add ogygia or `OGYGIA_SECRET`

Public bodies must be byte-identical with and without a session cookie. Cold cache on each deploy (per-version; no cross-version cache).

PR check **bundlewatch** on built client JS/CSS: index and `(static)`/`(site)` public pages **0 JS**; `/pantry` **~43 KB** brotli JS; CSS budget TBD by measurement. Type-check: `svelte-check --tsgo` (TS ~6; skip svelte-check-native).
