# Product: job, routes, Diet, Popular, pending, errors

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Vocabulary is in `docs/GLOSSARY.md` (kept as is). Payments are in [payments.md](./payments.md), the cook and prompt in [ai.md](./ai.md), caching in [caching.md](./caching.md).

## Decided

### Name and operator
- Product, GitHub, UI, logo and wordmark are **Chef Llama**; the cook is **Llama**. The old working name is retired everywhere, including token and Stripe names. The operator is an individual.
- Domain: **`chefllama.nz`** (see [ops.md](./ops.md)). Production never ships on `*.workers.dev`.

### Job
- Pantry (≥3 chips, max 16) → **one Recipe tonight**. Similar cards after it exists. Photo later. Solo Cook, about 1–4 people.
- Constraints: Diet and allergies are **hard**; kcal and time are **targets**; servings 1–12, default 2; kcal stamped. Up to 2 Staples (water, salt, pepper, oil, butter) may be assumed.

### Site vs App
- The brochure Site is split from the App. Generate never lives on the brochure, and `/` has no generator and no chat.
- No `/chef`, no `/topup`, no `/kitchen`.

### Routes

| Group | Routes | Notes |
|---|---|---|
| `(static)` | `/about` `/pricing` `/how-to` `/terms` `/privacy` `/llms.txt` | prerender, `csr=false` |
| `(site)` | `/` (top 5 + HTML form → `/pantry?i=`), `/popular`, `/popular/[type=popularType]` (v2), `/recipes/[slug=slug]`, `/sitemap-popular.xml`, `/sitemap-index.xml` | edge SSR, `csr=false`, Workers Cache; `/` is not prerendered |
| — | `/sign-in`, `/api/auth/[...all]`, `robots.txt` | `/sitemap.xml` is a build-time static asset from svelte-sitemap, not a Kit route (see [seo.md](./seo.md#sitemaps)) |
| `(app)` | `/pantry` `/saved` `/account` `/account/usage` `/account/packs` | signed in, `csr=true`, `private, no-store` |
- Folder layout: [folder-organisation.md](./folder-organisation.md).

### Recipe view
- A Recipe has its own route; a sheet is the same route, narrow. It shows the recipe exactly as generated.
- Servings scaling is **v2** (see [v2.md](./v2.md)).

### Save
- The recipe page always shows a **Save** button (never "Saved"). It is a remote `form()` that posts to `/saved`, works without JS, and sends a signed-out Cook to sign in and back to a "Save this recipe?" card on `/saved`. Details: [caching.md](./caching.md#save-on-the-cached-recipe-page-a-remote-form-that-posts-to-saved); redirect rules: [auth.md](./auth.md#post-login-redirect-redirectto).

### Diet
- **Required** before the first Generate: a first-run **blocking dialog on `/pantry`** creates the first Diet.
  - Fields: `name` (default Home); `flags[]` from the closed list vegan | vegetarian | gluten_free (hard, empty OK); allergy chips via the chip canonicalizer (hard, max 16, empty OK); optional `kcal` (target → `kcal_over`); `servings` 1–12, default 2; optional `max_minutes` (target, no overtime kind). No keto/halal/paleo in v1.
- **Allergies always win.** A pantry Chip that conflicts with an allergy is **swapped** and highlighted, never used as-is. This-run toggles may tighten or loosen diet **flags** (for example drop vegetarian for one cook) and change servings, time, and kcal, but they can **never** remove or ignore an allergy.
- **Multi-Diet in v1:** `/pantry` has a Diet switcher that sets the active Diet before Generate. Cooks can add, rename, edit, and delete Diets (reuse the first-run dialog). Deleting the active Diet falls back to another remaining Diet. Each Recipe records which Diet it was cooked for.
- Storage is the per-user Diet DO with `getActive()` (see [data.md](./data.md#diet-lives-in-a-durable-object)).

### Popular
- Rank by **rolling 7-day saves of public-by-URL rows**, not views. Cap 20, at least 5 distinct savers, cron KV snapshot. When the 7-day window is thin, the rest is **filled from the all-time ranking**. `/` shows the top 5; `/popular` is a v1 URL. Details: [caching.md](./caching.md#popular-snapshot-cron-not-per-save).
- Popular is **SSR HTML**, not an island. An unknown `/popular/[type]` is a plain uncached 404.
- v2 `/popular/[type]`: a closed list; allergy tags fail closed.

### Generate pending
- Stay on `/pantry` while Generate runs, until the Valibot decode succeeds and the row has an id, then `goto('/recipes/{slug}')`. A Recipe URL is always a finished row; never land a live job there.
- v1 pending state is a hashed SVG `<img>` (cupboard drawing, still in draft) with CSS motion. No polling, no fake percentage, no partial Recipe JSON. The Recipe morph is kept. Chat `make_recipe()` uses the same pending.
- SSE / `query.live` phases are v2/v3.

### Errors
- `error()` + root `+error.svelte` + `(app)/+error.svelte`. `<svelte:boundary>` around Generate. Effect `catchTag` → `error(status, safeMessage)`.

### Old browsers / noscript
- Public pages work with 0 JS. Cooking, sign-in and buying need JS. A `noscript` notice in `app.html`.
- Living feature-detect (`light-dark`, `showModal`, `popover`, `sessionStorage`) before a Checkout Session (see [payments.md](./payments.md)).

### Icons
- No Lucide / Simple Icons / Tabler / Phosphor / Iconify. Chrome pictograms are custom animated SVG. OAuth marks come from official kits (see [theme.md](./theme.md#icons)).

### Tools vs buttons
- `add_ingredients`, `remove_ingredients` and `topup` are free. `make_recipe` costs 1 Credit after the gift. The brochure chat composer is rejected.

### Automations
- **Three scheduled Cursor Automations**: architecture hunt, **agent-friction retro every 3 days** (the third Automation) on Grok 4.6 medium, and the monthly deps review. **No slop cron**; `eslint-plugin-slop` runs in lint instead (see [lint.md](./lint.md)). Details: [factory.md](./factory.md); ops summary: [ops.md](./ops.md).

## Open
- Generate do's and don'ts (proposed): a **collapsed** disclosure under the chip list, above the Generate button, titled "How to get the most out of Chef Llama" (not a dialog, not on `/`). Keep: Diet first; leftover chips; free cooks then Credits; one Recipe per Generate; ≥3 chips / max 16; Staples assumed; allergies always win (conflicting pantry Chips are swapped and highlighted); this-run toggles may change flags / servings / time / kcal but never drop an allergy; an AI-untested disclaimer; Save if you like it; metric and NZ names. Still to pick: always visible vs collapsed; whether a failed Generate refunds; a lawyer pass on the allergy wording.
- Popular: does the author's own save count, and the counting mechanism (see [caching.md](./caching.md#other-open-items)).
- Account page scope and usage bars (see [auth.md](./auth.md#open)).
- Pending art and the robot design (draft).
- Exact `/about` `/pricing` `/how-to` paths.
- Architecture hunt cadence (see [factory.md](./factory.md#open)).
