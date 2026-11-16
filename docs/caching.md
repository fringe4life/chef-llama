# Caching, 0-JS public pages, robots.txt, sitemap.xml

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### Workers Cache is on (hard rule)
- Alchemy `Cloudflare.Website.SvelteKit` with `cache: { enabled: true }`. With Workers Cache on and no `Cache-Control`, responses are cached for about 2 h, and the cookie is **not** in the cache key. So the default must be **deny**.
- Default-deny hook (`hooks.server.ts`): any response not built by `publicCache` gets `private, no-store`, and `Cloudflare-CDN-Cache-Control` and `Cache-Tag` are stripped. On `(static)`/`(site)`, a `Set-Cookie` or `Vary: Cookie`/`Authorization` is a violation: dev throws; prod strips the header, sets no-store and logs `[cache-guard]`.
- The cache is cold on **each deploy** (per-version cache; nothing carries across versions). A zone purge does not clear Workers Cache.
- Do **not** use the old Cache API (adapter 8 dropped it).

### `publicCache(event, { browser, edge, swr?, tags })` is the only way to cache
- Lives in `#lib/server/cache`. Throws unless the route is under `(static)` or `(site)` and the method is GET/HEAD.
- Integers only: `browser ≤ 3600`, `edge ≤ 31536000`, `swr ≤ 604800`, `browser ≤ edge`. 1–10 tags matching `^(popular|popular-top|popular-[a-z0-9-]+|recipe-[0-9a-hjkmnp-tv-z]{26})$` (the `CacheTag` template-literal type).
- Emits `Cache-Control: public, max-age=B`, `Cloudflare-CDN-Cache-Control: max-age=E[, stale-while-revalidate=S]` and `Cache-Tag`. **Never** `s-maxage` (it disables stale serving with SWR).

### Headers by route

| Surface | Cache |
|---|---|
| Prerendered `(static)` HTML | Static Assets default `public, max-age=0, must-revalidate` + ETag |
| Hashed assets | immutable, 1 year |
| `/recipes/[slug=slug]` canonical 200 | browser 300, edge 31536000, tag `recipe-{ulid}` |
| `/recipes/...` 301 (wrong or missing title) and unknown-suffix 404 | `private, no-store`, never `publicCache` (otherwise the heuristic caches every typo path for 1200 s / 180 s) |
| Deleted recipe | 410, no-store |
| `/popular`, `/popular/[type]` | browser 60, edge 3600, swr 86400, tags `popular` / `popular-{type}` |
| `/` | same as Popular, tag `popular-top` |
| Unknown `/popular/[type]` 404 | `private, no-store` (hook) |
| Everything else (`(app)`, remotes, `/sign-in`) | `private, no-store` |

### Public pages are 0-JS SvelteKit (ogygia dropped)
- `(static)`: `/about` `/pricing` `/how-to` `/terms` `/privacy`. Prerendered, `csr = false`, 0 `<script>`, 0 `modulepreload`. The only script is the blocking theme script in `app.html` (see [theme.md](./theme.md#light-and-dark)).
- `(site)`: `/` `/popular` `/popular/[type]` `/recipes/[slug=slug]`. Edge SSR, `csr = false`, Workers Cache.
- **`/` is not prerendered.** It lives in `(site)` with edge SSR + Workers Cache (tag `popular-top`), so the home page shows the current Popular top without a redeploy. This replaces the older "prerender `/`" plan and the ogygia "stay kit" plan.
- Public layouts never import auth, and `getSession` never runs on public routes. The shared `Nav.svelte` has a plain Sign in link.
- Do not add ogygia or `OGYGIA_SECRET`. Measured: the ogygia runtime is about 22 KB brotli, against about 0.5–0.8 KB HTML + about 0.6 KB CSS for a 0-JS page.
- Public bodies are byte-identical with and without a session cookie.

### Popular snapshot (cron, not per-save)
- Jobs Worker cron runs one D1 aggregate (7-day saves, distinct savers, public type tags), ranks deterministically, caps at 20 and needs at least 5 distinct savers.
- **Thin window:** when the 7-day window has fewer qualifying recipes than the cap, the remaining slots are filled from the **all-time** ranking (same ordering rules, de-duplicated against the 7-day list).
- Change detection: hash the visible **`[id, slug, title]`** of each list and compare with KV `popular:hashes`. Write only the changed `popular:{type}` / `popular:all` keys, purge only the changed tags (`popular-top` only if the top 5 changed), and write the hashes last.
- `/` and `/popular` never scan D1 or DOs on the request. A KV miss serves the last good snapshot or an empty placeholder.
- No cron ping of `/` to keep it warm. Query strings on `/popular/*` redirect to the clean URL.
- Ranking rules: see [product.md § Popular](./product.md#popular).

### Kit 3.2 param matchers
- A single `src/params.ts` using `defineParams` from `@sveltejs/kit/params`, with Valibot schemas from `#lib/schemas/*` and the brands `RecipeSlug` and `Ulid`. Matchers run on the server **and** in the browser, so they never import `#lib/server/*`. A matcher miss is a 404 before load (no-store via the hook). No `src/id-patterns.ts`.

### robots.txt and AI crawlers
- Origin `robots.txt/+server.ts`: Disallow `/pantry` `/saved` `/sign-in`. Disallow the training crawlers `GPTBot` `Google-Extended` `CCBot` `ClaudeBot` `Applebot-Extended`. Search bots are allowed. Do not Disallow `ChatGPT-User`/`Claude-User`. No `Disallow: /` for `*`. The sitemap URL is in the same file.
- Cloudflare dashboard: Search Allow, Agent Allow, Training Disallow, Bot Preference Sync on, AI Crawl Control. Bot Fight Mode **off** (Free plan).

### SEO and sitemap.xml
- The site is indexable. `/recipes/[slug]` is public SSR with `noindex`, except recipes on Popular. `og:url` is undecorated, `og:image` is a static meal SVG. No `svelte-seo` and no workers-og WASM.
- `sitemap.xml/+server.ts` lists the Popular recipes (`/recipes/{slug}`); svelte-sitemap covers the prerendered `(static)` pages.
- `html lang="en-NZ"`, unprefixed URLs, no `/en` or `/nz`.

### Guardrail layers (all v1)
1. Default-deny hook.
2. `publicCache` helper.
3. `routes.manifest.ts` + the Playwright route-contract test against the PR preview deploy (see [tests.md](./tests.md#playwright)).
4. Local ESLint rules `chef/no-raw-cache-headers`, `chef/public-route-purity`, `chef/public-csr-false` (see [lint.md](./lint.md)).
5. Synthetic check `scripts/synthetic-check.mjs`: in CI in v1; post-deploy and on a schedule in v1.1 (see [tests.md](./tests.md)).
- bundlewatch: public pages 0 JS; `/pantry` about 43 KB brotli; CSS budget set by measurement.

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
- Account deletion purges the `recipe-{ulid}` tags and removes the recipes from the Popular snapshot and the sitemap.

## Open

### Other open items
- Popular counting: should the author's own save count towards the 5 distinct savers?
- Popular counting mechanism: a `save_count` column or the 7-day saver ledger (not picked).
- Exact `/about` `/pricing` `/how-to` paths.
- Post-deploy assert of `CF-Cache-Status: HIT`; a Fallow zone for public routes. Later, not v1.
- svelte-sitemap vs a Kit endpoint, and the Alchemy output dir.
- Storage (v2 option): a nightly near-duplicate merge with 301 + tag purge. See [v2.md](./v2.md).
