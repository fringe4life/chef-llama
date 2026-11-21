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
| `(site)` | `/` (top 5 Popular ingredients + HTML form → `/pantry?i=`), `/popular`, `/popular/[type=popularType]` (v2), `/recipes/[slug=slug]`, `/sitemap-popular.xml`, `/sitemap-index.xml` | edge SSR, `csr=false`, Workers Cache; `/` is not prerendered. Popular surfaces list **ingredient combinations**, not Recipes (see [Popular](#popular)). Sitemap / cron / cache behaviour for Popular is **PENDING** (see [seo.md](./seo.md), [caching.md](./caching.md)). |
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
  - Fields: `name` (default Home); `flags[]` from the closed list vegan | vegetarian | gluten_free (hard, empty OK); allergy chips via the chip canonicalizer (hard, max 16, empty OK); optional `kcal` (target → `kcal_over`); `servings` 1–12, default 2; optional `max_minutes` (target, no overtime kind); **`skill`** (closed three-level picklist — see below); **`method`** and optional **`devices`** (see below). No keto/halal/paleo in v1.
- **Skill level** is a v1 Diet field with **three levels**, plus a **this-run toggle** on `/pantry`. It steers the cook: technique choice, step detail, whether steps may run in parallel, and time estimates. Exact level labels are Open.
- **Cooking method and devices** (v1 Diet fields; Valibot shape, also in [data.md](./data.md) / [ai.md](./ai.md)):

  ```ts
  method: v.picklist(['fry-pan','saucepan','oven','air-fryer','slow-cooker','pressure-cooker','grill','no-cook'])
  devices: v.optional(v.pipe(v.array(methodEnum), v.maxLength(3)))
  ```

  Product intent: a **primary** `method`, plus optionally a **second** device for that cook. The schema allows up to three entries in `devices`; v1 UI aims at primary + one optional second. This-run toggles may change method / devices for one Generate.
- **Allergies always win.** A pantry Chip that conflicts with an allergy is **swapped** and highlighted, never used as-is. This-run toggles may tighten or loosen diet **flags** (for example drop vegetarian for one cook) and change servings, time, kcal, skill, method, and devices, but they can **never** remove or ignore an allergy.
- **Multi-Diet in v1:** `/pantry` has a Diet switcher that sets the active Diet before Generate. Cooks can add, rename, edit, and delete Diets (reuse the first-run dialog). Deleting the active Diet falls back to another remaining Diet. Each Recipe records which Diet it was cooked for.
- Storage is the per-user Diet DO with `getActive()` (see [data.md](./data.md#diet-lives-in-a-durable-object)).

### Popular
- Popular is **Popular ingredients**, not Popular recipes. It surfaces common pantry combinations so Cooks can start from what others generate with — not a leaderboard of saved Recipe pages.
- **Planned ranking (Decided direction):**
  1. Normalise each pantry Chip to a **canonical ingredient ID**.
  2. On each Generate, record the **sorted ID set** for that run (see [data.md](./data.md)).
  3. A weekly job counts the most common **pairs** and **triples** over the last **7 days**, with a **minimum distinct-user** threshold (exact threshold Open).
- `/` shows the top combinations (still "top 5" slots); `/popular` is the v1 list URL. Cards seed `/pantry?i=` (same shape as the landing form), not `/recipes/[slug]`.
- Popular is **SSR HTML**, not an island. An unknown `/popular/[type]` is a plain uncached 404.
- v2 `/popular/[type]`: a closed list; allergy tags fail closed.
- **PENDING** until the canonical ID set and edge cases are decided: weekly cron rewrite, KV snapshot shape, Workers Cache tags / purge, one-year recipe edge TTL tied to "on Popular", and `sitemap-popular.xml` contents. Do **not** change cron code until those land. See [caching.md](./caching.md#popular-snapshot-cron-not-per-save), [seo.md](./seo.md), [ops.md](./ops.md), [data.md](./data.md).

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
- No Lucide / Simple Icons / Tabler / Phosphor / Iconify. Chrome pictograms are custom animated SVG. OAuth marks come from official kits (see [theme.md](./theme.md#icons)). **Kombai owns icon artwork**; there is no separate icons topic file.

### Tools vs buttons
- `add_ingredients`, `remove_ingredients` and `topup` are free. `make_recipe` costs 1 Credit after the gift. The brochure chat composer is rejected.

### Automations
- **Three scheduled Cursor Automations**: architecture hunt, **agent-friction retro every 3 days** (the third Automation) on Grok 4.6 medium, and the monthly deps review. **No slop cron**; `eslint-plugin-slop` runs in lint instead (see [lint.md](./lint.md)). Details: [factory.md](./factory.md); ops summary: [ops.md](./ops.md).

## Open
- Generate do's and don'ts (proposed): a **collapsed** disclosure under the chip list, above the Generate button, titled "How to get the most out of Chef Llama" (not a dialog, not on `/`). Keep: Diet first; leftover chips; free cooks then Credits; one Recipe per Generate; ≥3 chips / max 16; Staples assumed; allergies always win (conflicting pantry Chips are swapped and highlighted); this-run toggles may change flags / servings / time / kcal / skill / method / devices but never drop an allergy; an AI-untested disclaimer; Save if you like it; metric and NZ names. Still to pick: always visible vs collapsed; whether a failed Generate refunds; a lawyer pass on the allergy wording.
- **Skill level labels:** the three closed levels (proposed: beginner | intermediate | advanced — not locked).
- **Popular ingredients:** canonical ingredient ID set; distinct-user threshold; pairs vs triples mix and caps; how Staples and `cooked: true` chips count; whether guest Generates contribute; edge cases for sets larger than three. Cron, cache, and sitemap stay **PENDING** until these are decided (see [caching.md](./caching.md#other-open-items)).
- Account page scope and usage bars (see [auth.md](./auth.md#open)).
- Pending art and the robot design (draft).
- Exact `/about` `/pricing` `/how-to` paths.
- Architecture hunt cadence (see [factory.md](./factory.md#open)).
