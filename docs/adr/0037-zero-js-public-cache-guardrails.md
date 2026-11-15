# Public pages 0-JS Kit; Workers Cache default-deny; five guardrail layers

**Status:** accepted (14 Nov 2026, Coinnich). Supersedes ogygia on Chef Llama ([ADR 0011](./0011-stay-kit-ogygia.md)). Companion: [ADR 0034](./0034-popular-cap-cache.md) (cron snapshot) · [ADR 0038](./0038-popular-type-allergy-safeguards.md) (v2 types). Route/header SSOT: [caching.md](../caching.md). Agent hard rules: [AGENTS.md](../../AGENTS.md).

Numbering: **0036** is Better Auth on draft [PR 93](https://github.com/fringe4life/chef-llama/pull/93) (`docs/auth-better-auth`), not on `main`. This branch is off `main`, so new ADRs are **0037 / 0038** to avoid a merge clash on 0036.

## Drop ogygia

Measured brotli (not the ~8 KB docs claim):

| Payload | brotli |
|---|---|
| Ogygia runtime at page load | ~**22 KB** |
| Tiny island wake | ~**14.5 KB** |
| Remote-function island wake | ~**31 KB** |
| 0-JS Kit public page (HTML) | ~**0.5–0.8 KB** + one shared hashed StyleX CSS ~**0.6 KB**, **0 JS** |
| `/pantry` plain Kit | ~**43 KB** (Svelte ~16.4, router ~14.6, remote form ~5.6) |

0-JS Kit wins for public pages. Plain Kit is no worse for `/pantry`. **Do not** add ogygia. Remove `OGYGIA_SECRET` from Infisical, `.env.schema`, Alchemy secrets, and docs. dollar-holler may still demo ogygia; Larder does not.

## Public pages are 0-JS SvelteKit

Two public groups. Shared `Nav.svelte` with a **plain Sign in** link, **no session**. Public layouts **never import auth**. `getSession` never runs on public routes (it can `Set-Cookie`, which blocks and poisons Workers Cache).

| Group | Routes | Render | JS |
|---|---|---|---|
| `(static)` | `/about` `/pricing` `/how-to` `/terms` `/privacy` | prerender, `csr=false` | 0 `<script>`, 0 `modulepreload`; **only** the theme script in `app.html` |
| `(site)` | `/` `/popular` `/popular/[type]` `/recipes/[id]` | edge SSR, `csr=false`, Workers Cache | same 0-JS budget |

`/` **moves off `(static)` onto `(site)`**. Edge-rendered `csr=false`. Top 5 from cron KV snapshot `popular:all`, Cache-Tag `popular-top`. **No generator** on `/`. Plain HTML form / links to `/pantry` (prefill `?i=`; generate **only** on POST).

`/pantry` is plain SvelteKit **with JS** (~43 KB brotli), `csr=true`, `private, no-store`.

Unknown `/popular/[type]` values: Kit param matcher → plain **404**, **not** cached (`private, no-store` via the default-deny hook). [ADR 0038](./0038-popular-type-allergy-safeguards.md).

## Workers Cache is on — HARD RULE

Alchemy `Cloudflare.Website.SvelteKit` **`cache: { enabled: true }`**. Default-deny hook: every response that did not go through `publicCache` is `private, no-store`.

Why: Workers Cache on + no `Cache-Control` ≈ **2 h** cache; **cookie is not in the cache key** → a personalised `Set-Cookie` / session HTML leak. Never `getSession` on public HTML.

Cold cache on **each deploy** (default per-version cache; no cross-version cache).

## Five v1 guardrail layers (all ship in v1)

1. **Default-deny hook** — non-`publicCache` → `private, no-store`, strip `Cloudflare-CDN-Cache-Control` / `Cache-Tag`. Public routes: `Set-Cookie` or `Vary: Cookie` / `Authorization` = violation. Dev **throws**; prod **strips**, forces no-store, logs `[cache-guard]` to Workers Logs.
2. **`publicCache` helper** — only way to cache. See [caching.md](../caching.md).
3. **`routes.manifest.ts` + Playwright** against **`wrangler dev` production build** (not `vitest-pool-workers`): fail missing/stale route; fetch anon + with session cookie; public/static: no `Set-Cookie`, no `Vary: Cookie`, no script/modulepreload; private exactly `private, no-store`; 404s and remote queries no-store; public bodies **byte-identical** with/without cookie.
4. **Local ESLint v10 plugin** (not Oxlint): `chef/no-raw-cache-headers`, `chef/public-route-purity`, `chef/public-csr-false`.
5. **Canary** `scripts/canary.mjs`; CI v1; post-deploy + cron v1.1; canary cookie from Infisical.

Later (not v1): Fallow zone; post-deploy assert `CF-Cache-Status: HIT`.

## Theme

Small **blocking inline script** in `app.html` (cookie + `light-dark()`). **Never** render theme from cookies on the server for public pages (`transformPageChunk` / `Set-Cookie` / `Vary: Cookie` would violate the cache guard). Supersedes “no FOUC script” on public HTML ([ADR 0014](./0014-stylex-shadcn-tokens.md)).

`build.cssTarget` = browsers with `light-dark()`, or Vite polyfills `color-scheme`.

## Kit 3 matchers

One `src/params.ts` loaded by **plain Node at build**, **no `#lib` imports**. `POPULAR_TYPES` lives in a **dependency-free** module that `params.ts` may import.

## Open (do not guess)

- **Save** on `/recipes/[id]`: ADR 0036 (on [PR 93](https://github.com/fringe4life/chef-llama/pull/93)) still describes an ogygia island that reads session. That cannot ship on a 0-JS public page that never imports auth.
- **+/- servings** on `/recipes/[id]` ([ADR 0022](./0022-recipe-scale-client.md) is client math) vs 0 JS.
- Exact `/about` `/pricing` `/how-to` paths (legal = existing `/terms` `/privacy`).
- Quiet-week fill vs ≥5 distinct savers ([ADR 0034](./0034-popular-cap-cache.md)).
- Exact v2 type list ([ADR 0038](./0038-popular-type-allergy-safeguards.md)).

## Related

[#6](https://github.com/fringe4life/chef-llama/issues/6) cache · [#35](https://github.com/fringe4life/chef-llama/issues/35) ogygia (dropped) · [#61](https://github.com/fringe4life/chef-llama/issues/61) · [#65](https://github.com/fringe4life/chef-llama/issues/65) · [#68](https://github.com/fringe4life/chef-llama/issues/68) Workers Cache · [#90](https://github.com/fringe4life/chef-llama/issues/90).
