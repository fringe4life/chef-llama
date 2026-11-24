# Caching and 0-JS public pages

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### Workers Cache is on (hard rule)
- Alchemy `Cloudflare.Website.SvelteKit` with `cache: { enabled: true }`. With Workers Cache on and no `Cache-Control`, responses are cached for about 2 h, and the cookie is **not** in the cache key. So the default must be **deny**.
- Default-deny hook (`hooks.server.ts`): any response not built by `publicCache` gets `private, no-store`, and `Cloudflare-CDN-Cache-Control` and `Cache-Tag` are stripped. On `(static)`/`(site)`, a `Set-Cookie` or `Vary: Cookie`/`Authorization` is a violation: dev throws; prod strips the header, sets no-store and logs `[cache-guard]`.
- The cache is cold on **each deploy** (per-version cache; nothing carries across versions). A zone purge does not clear Workers Cache.
- Do **not** use the old Cache API (adapter 8 dropped it).

### What the cache costs and how big it gets (Cloudflare docs, read 16 Nov 2026 NZDT)
- **No storage charge and no storage quota.** Workers Cache has no separate pricing; there is no documented per-zone or per-account cache storage limit. [Workers Cache: Pricing](https://developers.cloudflare.com/workers/cache/#pricing)
- **Every request is billed, hit or miss.** With Workers Cache on, every request to the Site Worker counts at the standard request rate, **including cache hits, static-asset requests and service-binding calls** (normally free). CPU time is billed only on a miss or bypass. Workers Paid: 10M requests/month included, then US$0.30 per million; 30M CPU-ms included. [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- **Eviction is LRU and not configurable.** Objects that aren't requested are evicted to make room; how long an object stays (retention) depends on its popularity and cache size, not on its TTL. The TTL only says how long a stored copy may be served without asking the Worker. [Retention vs freshness](https://developers.cloudflare.com/cache/concepts/retention-vs-freshness/)
- **Tiered by default**: a lower tier in each data centre that serves traffic plus a smaller upper tier that every lower tier asks on a miss. (The old Cache API, which we don't use, is per data centre and not tiered.) [Workers Cache: Tiered cache](https://developers.cloudflare.com/workers/cache/#tiered-cache)
- **Per Worker version**: each deploy starts cold, and the previous version's entries are never read again, so they age out by LRU. [Cache keys](https://developers.cloudflare.com/workers/cache/cache-keys/)
- **Size limit**: 512 MB per response (the Free-plan limit, applied to all Workers Cache responses at launch). A recipe page is a few KB. [Limitations](https://developers.cloudflare.com/workers/cache/limitations/)
- **So cache growth is not a cost risk.** Storage is free and self-limiting (LRU plus a fresh cache on every deploy). What costs money is request volume, which caching doesn't change, and misses (CPU plus a D1 read), which a longer TTL reduces.

### Edge TTL for recipes
- **v1 baseline for every public recipe:** **browser 300, edge 2592000 (30 days), no `swr`**, tag `recipe-{ulid}`.
- The old split (**Popular recipes: edge one year (31536000)** vs not-on-Popular 30 days) is **dropped**. v1 has **Recent** (date-sorted published list, short cache) and no Popular *recipe* ranking; counted Popular ingredients are **v2**.
- Not needed for cost (see above): the 30-day edge TTL is an explicit upper bound that still holds if deploys become rare or cross-version caching is ever turned on. A miss after 30 days costs one Worker run and one D1 read.
- Size estimate behind it: a measured stub recipe page was 1,426 B raw (610 B brotli); a full recipe is likely 5–10 KB raw. Even 1,000 new recipes a day for a year is about 365,000 pages × 10 KB ≈ 3.7 GB, at no storage cost.
- **Private / unpublished** recipes are never `publicCache`d (owner-only or 404 — see [product.md](./product.md#publish-and-privacy)).

### `publicCache(event, { browser, edge, swr?, tags })` is the only way to cache
- Lives in `#lib/server/cache`. Throws unless the route is under `(static)` or `(site)` and the method is GET/HEAD.
- Integers only: `browser ≤ 3600`, `edge ≤ 31536000`, `swr ≤ 604800`, `browser ≤ edge`. 1–10 tags matching `^(recent|try-me|popular|popular-top|popular-[a-z0-9-]+|recipe-[0-9a-hjkmnp-tv-z]{26})$` (the `CacheTag` template-literal type). `popular*` tags remain for **v2** Popular ingredients only.
- Emits `Cache-Control: public, max-age=B`, `Cloudflare-CDN-Cache-Control: max-age=E[, stale-while-revalidate=S]` and `Cache-Tag`. **Never** `s-maxage` (it disables stale serving with SWR).

### Headers by route

| Surface | Cache |
|---|---|
| Prerendered `(static)` HTML | Static Assets default `public, max-age=0, must-revalidate` + ETag |
| Hashed assets | immutable, 1 year |
| `/recipes/[slug=slug]` canonical 200 (published) | browser 300, edge 2592000 (30 days), no `swr`, tag `recipe-{ulid}` |
| `/recipes/...` 301 (wrong or missing title) and unknown-suffix 404 | `private, no-store`, never `publicCache` (otherwise the heuristic caches every typo path for 1200 s / 180 s) |
| Deleted or unpublished / private recipe | 410 or owner-only / 404, no-store (see [product.md](./product.md#open)) |
| `/recent` | **short cache:** browser 60, edge 300, swr 3600, tag `recent` (date-sorted D1 query; no cron snapshot) |
| `/` (Try me) | browser 60, edge 3600, swr 86400, tag `try-me` (static committed list; long edge OK) |
| `/sitemap-index.xml` | browser 60, edge 3600, swr 86400, tag `recent` (or static if only build-time sitemaps — see [seo.md](./seo.md#sitemaps)) |
| `/sitemap.xml`, `/llms.txt` | Static assets written at build (see [seo.md](./seo.md#sitemaps)) |
| Everything else (`(app)`, remotes, `/sign-in`, `/onboarding`) | `private, no-store` |

### Public pages are 0-JS SvelteKit (ogygia dropped)
- `(static)`: `/about` `/pricing` `/how-to` `/terms` `/privacy`. Prerendered, `csr = false`, 0 `<script>`, 0 `modulepreload`. The only script is the blocking theme script in `app.html` (see [theme.md](./theme.md#light-and-dark)).
- `(site)`: `/` `/recent` `/recipes/[slug=slug]`. Edge SSR, `csr = false`, Workers Cache. **No `/popular` in v1.**
- **`/` and Try me:** static committed list. Keeping `/` in `(site)` with Workers Cache still works; **prerendering `/` again is natural** — Open if Coinnich wants prerender vs edge SSR.
- **Recent** must stay edge SSR (D1 date query). Short TTL keeps new publishes visible without a purge cron; optional purge of tag `recent` on publish is Open.
- Public layouts never import auth, and `getSession` never runs on public routes. The shared `Nav.svelte` has a plain Sign in link.
- Do not add ogygia or `OGYGIA_SECRET`. Measured: the ogygia runtime is about 22 KB brotli, against about 0.5–0.8 KB HTML + about 0.6 KB CSS for a 0-JS page.
- Public bodies are byte-identical with and without a session cookie. Published recipe HTML never includes Diet / allergy / profile fields ([product.md](./product.md#publish-and-privacy)).

### Cache purge route
- **Why a service binding:** Workers Cache belongs to the Worker that filled it. Only code running in the **Site Worker's** default entrypoint can purge it; another Worker can't, and a zone purge (dashboard or API) doesn't touch it. The Site Worker runs `cache.purge({ tags })` (imported from `cloudflare:workers`) when called over a service binding. The cache is shared across every way the Worker is invoked, so a purge run inside a binding request clears what public requests cached.
- **Guard on the purge route** (`POST /__internal/cache-purge` in the Site Worker):
  - It is meant to be reached **only through the service binding** (from account deletion, publish/unpublish, report-hide, and from a cron Worker when one exists for **v2** Popular ingredients). No custom domain, route or `workers.dev` hostname exists for it, and it is not linked or listed anywhere.
  - The Site Worker's public hostname still serves every path, so the route also rejects anything that didn't come through the binding: a WAF condition blocks `/__internal/*` at the zone (binding calls don't pass through the zone; it is folded into the existing W2 block rule so W5 stays spare, see [security.md](./security.md#rate-limiting)), the handler requires a shared secret header (from Infisical, see [security.md](./security.md#secrets-and-environment-variables)), accepts only POST with a JSON list of tags matching the `CacheTag` pattern, and answers anything else with a plain 404. It never sets cache headers (the default-deny hook makes it `private, no-store`).
- Account deletion uses this route for `recipe-{ulid}` tags (and `recent` if that Cook’s publishes were listed).
- **No weekly Popular snapshot cron in v1.** Recent is a live (short-cached) query. Counted Popular ingredients (KV `POPULAR`, weekly rebuild, `sitemap-popular.xml`) are **v2** — see [v2.md](./v2.md). No cron ping of `/` to keep it warm. Query strings on `/recent` redirect to the clean URL.

### Kit 3.2 param matchers
- A single `src/params.ts` using `defineParams` from `@sveltejs/kit/params`, with Valibot schemas from `#lib/schemas/*` and the brands `RecipeSlug` and `Ulid`. Matchers run on the server **and** in the browser, so they never import `#lib/server/*`. A matcher miss is a 404 before load (no-store via the hook). No `src/id-patterns.ts`.

### SEO, robots.txt, sitemaps and llms.txt
- Indexing, head tags, Open Graph, the sitemaps, `robots.txt`, `llms.txt` and AI-crawler rules live in [seo.md](./seo.md).

### Guardrail layers (all v1)
1. Default-deny hook.
2. `publicCache` helper.
3. `routes.manifest.ts` + the Playwright route-contract test against the PR preview deploy (see [tests.md](./tests.md#playwright)).
4. Local ESLint rules `chef/no-raw-cache-headers`, `chef/public-route-purity`, `chef/public-csr-false` (see [lint.md](./lint.md)).
5. Synthetic check `scripts/synthetic-check.mjs`: in CI in v1; post-deploy and on a schedule in v1.1 (see [tests.md](./tests.md)).
- bundlewatch: public pages 0 JS; `/pantry` about 43 KB brotli; CSS budget set by measurement. Third-party ads on public routes are **not** decided — see [ads.md](./ads.md).

### Save on the cached recipe page: a remote `form()` that posts to `/saved`
- **Save is a SvelteKit remote function `form()`** (`saveRecipe` in `src/lib/saves.remote.ts`), not a plain form action. Remote functions are still behind `experimental.remoteFunctions: true` on the `sveltekit()` Vite plugin in Kit 3.2, so pin Kit exactly (see [ci.md](./ci.md#dependencies)).
- **Where `form()` POSTs** (read in the SvelteKit 3.2.0 source and checked with a box build on 16 Nov 2026 NZDT):
  - **Without JS** (our case, `csr = false`): the server renders `action="?/remote=<id>"`, a *relative* URL, so the browser POSTs to **the current page**, i.e. `/recipes/<slug>?/remote=<id>`. Any page route handles a `?/remote=` POST before its own actions.
  - **With JS** (enhanced, on `(app)` pages): the client `fetch`es the generated endpoint **`/_app/remote/<id>`**.
- **Keep the POST off `/recipes/*`:** the recipe page overrides the action with an absolute `(app)` path, `action={'/saved' + saveRecipe.action}`, which renders `action="/saved?/remote=<id>"`. `/saved` is a signed-in, `private, no-store` page route. The box build confirmed the rendered HTML, 0 `<script>` tags, a `303` from `/saved?/remote=…`, and a `403` for a cross-origin POST (Kit's form Origin check).
- **Markup on the cached page** (identical for every visitor, so cache-safe):
  ```svelte
  <form {...saveRecipe} action={`/saved${saveRecipe.action}`}>
    <input {...saveRecipe.fields.slug.as('hidden', recipe.slug)} />
    <input {...saveRecipe.fields.redirectTo.as('hidden', `/recipes/${recipe.slug}`)} />
    <button>Save</button>
  </form>
  ```
  In Kit 3 every field must come from `form.fields.<name>.as(...)`; a plain `<input name="slug">` is rejected (`form_field_unbound`). The rendered field names carry the remote id (for example `slug/<id>/saveRecipe`).
- **Cache safety:**
  - `csr = false` still ships 0 JS. The form is a plain progressive `<form method="POST">`; the enhancement attachment never runs.
  - The button always says **Save**, never "Saved". No session read, no `Vary: Cookie`, no per-user HTML. The synthetic check's "same body with and without a session cookie" rule still holds.
  - Workers Cache stores only GET responses, so a POST never writes to or reads from the cached page.
  - The remote id is a build hash. The cache is per Worker version (cold on each deploy), so cached HTML always carries the id of the build serving it. If a stale page ever posts an old id, Kit answers `405` (no remote found); the handler never runs.
- **What if the action fell back to the recipe URL** (the `action` override missing)? The no-JS POST would hit `/recipes/<slug>?/remote=<id>` and run the remote function inside the recipe route. That bypasses the cache (POST), so nothing cached is harmed, but it puts a POST on the public route, and if the function returned instead of redirecting, Kit would re-render the recipe page for that user. Two guards: the remote function **always ends in `redirect(303, …)`**, and WAF **W2** blocks every non-GET/HEAD/OPTIONS method on `/recipes/*` (see [security.md](./security.md#rate-limiting)), so the mistake fails closed with a 403. The route-contract test asserts the rendered action starts with `/saved?/remote=` (see [tests.md](./tests.md#playwright)).
- **Flow:**
  - Signed in: write the save (Saved DO plus save ledger, see [data.md](./data.md)), then `redirect(303, '/saved?added=<slug>')`. `/saved` (private) can say "Saved".
  - Signed out: `redirect(303, signInUrl('/saved?pending=<slug>'))`. After sign-in, `/saved?pending=<slug>` shows a "Save this recipe?" card with the same `saveRecipe` form (JS-enhanced there). No GET ever mutates.
  - Where the user came from is the hidden `redirectTo` field (static per recipe, so cache-safe; `redirectFromRequest` reads it, with a same-origin `Referer` only as a fallback). It travels as `/saved?added=<slug>&redirectTo=<path>` or inside the `pending` URL, so `/saved` can offer "Back to the recipe". Everything goes through the shared redirect helpers (see [auth.md](./auth.md#post-login-redirect-redirectto)).
- Rate limit: the Save binding is keyed on `userId` inside the remote function, so it applies whichever path the POST arrives on (`/saved?/remote=` or `/_app/remote/`). See [security.md](./security.md#rate-limiting).

### Edge cases
- 301/404/410 are never cached (typo-path heuristic).
- Rate-limit 429s: `Cache-Control: private, no-store`, never `publicCache` (see [security.md](./security.md#rate-limiting)).
- Account deletion purges the `recipe-{ulid}` tags and `recent` as needed. There is no v1 Popular ingredient-set source data to scrub.

## Open

### Other open items
- Purge tag `recent` on every publish / unpublish / report-hide vs rely on short TTL only.
- Prerender `/` again vs keep edge SSR for Try me.
- Exact `/about` `/pricing` `/how-to` paths.
- **Purge route checks on the first preview:** that the WAF rule blocks `/__internal/*` publicly while binding calls still arrive, and that a binding-triggered purge clears a page cached by a public request.
- Post-deploy assert of `CF-Cache-Status: HIT`; a Fallow zone for public routes. Later, not v1.
- Storage (v2 option): a nightly near-duplicate merge with 301 + tag purge. See [v2.md](./v2.md) and [product.md](./product.md#quality-publish-gates).
- Ads on cached public pages: [ads.md](./ads.md) (recommendation: none yet).
