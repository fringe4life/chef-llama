# Product: job, routes, Diet, Recent, Try me, onboarding, pending, errors

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Vocabulary is in `docs/GLOSSARY.md` (kept as is). Payments are in [payments.md](./payments.md), the cook and prompt in [ai.md](./ai.md), caching in [caching.md](./caching.md). Ads exploration (not a decision): [ads.md](./ads.md).

## Decided

### Name and operator
- Product, GitHub, UI, logo and wordmark are **Chef Llama**; the cook is **Llama**. The old working name is retired everywhere, including token and Stripe names. The operator is an individual.
- Domain: **`chefllama.nz`** (see [ops.md](./ops.md)). Production never ships on `*.workers.dev`.

### Job
- Pantry (≥3 chips, max 16) → **one Recipe tonight**. Similar cards after it exists. Photo later. Solo Cook, about 1–4 people.
- Constraints: Diet flags and the avoid list are **hard**; kcal and time are **targets**; servings 1–12, default 2; kcal stamped. Up to 2 Staples (water, salt, pepper, oil, butter) may be assumed; Cooks can **customise staples** (see [Onboarding](#onboarding)).

### Site vs App
- The brochure Site is split from the App. Generate never lives on the brochure, and `/` has no generator and no chat.
- No `/chef`, no `/topup`, no `/kitchen`.

### Routes

| Group | Routes | Notes |
|---|---|---|
| `(static)` | `/about` `/pricing` `/how-to` `/terms` `/privacy` `/llms.txt` | prerender, `csr=false` |
| `(site)` | `/` (**Try me** starter pantries + HTML links → `/pantry?i=`), `/recent` (**Recent** — date-sorted published recipes), `/recipes/[slug=slug]`, `/sitemap-index.xml` | edge SSR, `csr=false`, Workers Cache. v1 public recipe list is **Recent**, not Popular ranking. Counted Popular ingredients stay **v2** ([v2.md](./v2.md)). |
| — | `/sign-in`, `/api/auth/[...all]`, `robots.txt` | `/sitemap.xml` is a build-time static asset from svelte-sitemap, not a Kit route (see [seo.md](./seo.md#sitemaps)) |
| `(app)` | `/onboarding` `/pantry` `/saved` `/account` `/account/usage` `/account/packs` | signed in, `csr=true`, `private, no-store` |
- Folder layout: [folder-organisation.md](./folder-organisation.md).
- **No `/popular` in v1.** Counted Popular ingredients and typed `/popular/[type]` lists are **v2** only. Old Popular *recipe* ranking is dropped (impractical); **Recent** replaces it for the public list.

### Recipe view
- A Recipe has its own route; a sheet is the same route, narrow. It shows the recipe exactly as generated.
- Servings scaling is **v2** (see [v2.md](./v2.md)).
- **Public privacy:** a published recipe page shows the **recipe only** — never the Cook’s profile, Diet name/flags, avoid list, or medical diets. `diet_id` stays internal for Generate / account history; it is not rendered on the public page. Details: [Publish and privacy](#publish-and-privacy).

### Save
- The recipe page always shows a **Save** button (never "Saved"). It is a remote `form()` that posts to `/saved`, works without JS, and sends a signed-out Cook to sign in and back to a "Save this recipe?" card on `/saved`. Details: [caching.md](./caching.md#save-on-the-cached-recipe-page-a-remote-form-that-posts-to-saved); redirect rules: [auth.md](./auth.md#post-login-redirect-redirectto).

### Onboarding
- First-run setup is an **`(app)` route `/onboarding`**, not a blocking dialog on `/pantry`. New Cooks land here after sign-in before the first Generate.
- Creates Diet #1 and explains **publish defaults** clearly (free-tier recipes go to **Recent** unless opted out later as a paid Cook — see [Publish and privacy](#publish-and-privacy)). The same explanation appears on cook / pantry pages.
- **Devices owned** drive time and feasibility: onboarding captures which cooking devices the Cook has; that informs Diet `method` / `devices`, time estimates, and whether a Generate’s steps fit the gear.
- Cooks can **customise staples** (beyond the closed default list of water, salt, pepper, oil, butter — exact customise UX is Open).
- Later Diet add / rename / edit / delete can reuse onboarding fields in a dialog or a short form on `/pantry` (not a second onboarding pass).

### Diet
- **Required** before the first Generate: completed via **`/onboarding`** (Diet #1).
  - Fields: `name` (default Home); **hard flags** `vegan` | `vegetarian` (empty OK) — matched via pantry intrinsic composition; optional preference flags `gluten_free` | `keto` | `halal` | `paleo` are **not** per-item pantry tags (short rules for the AI + label disclaimer); **avoid list** (ingredient chips via the chip canonicalizer, hard, max 16, empty OK); optional `kcal` (target → `kcal_over`); `servings` 1–12, default 2; optional `max_minutes` (target, no overtime kind); **`skill`** (closed three-level picklist — see below); **`method`** and optional **`devices`** (see below).

- **Skill level** is a v1 Diet field with **three levels**, plus a **this-run toggle** on `/pantry`. It steers the cook: technique choice, step detail, whether steps may run in parallel, and time estimates. Exact level labels are Open.
- **Cooking method and devices** (v1 Diet fields; Valibot shape, also in [data.md](./data.md) / [ai.md](./ai.md)):

  ```ts
  method: v.picklist(['fry-pan','saucepan','oven','air-fryer','slow-cooker','pressure-cooker','grill','no-cook'])
  devices: v.optional(v.pipe(v.array(methodEnum), v.maxLength(3)))
  ```

  Product intent: devices the Cook **owns** (from onboarding) constrain feasibility; a **primary** `method`, plus optionally a **second** device for that cook. The schema allows up to three entries in `devices`; v1 UI aims at primary + one optional second. This-run toggles may change method / devices for one Generate.
- **Avoid list (no curated allergen tags on pantry items).** The Cook lists ingredients to avoid. Code **blocks** pantry chips whose canonical slug or alias matches an avoid entry, and expands a **small** parent-link set for obvious cases only (e.g. butter / cheese / yoghurt → `dairy`; flour → `wheat`). Seed rows carry **no** `allergens[]` / `may contain` data. **UI must tell Cooks they are responsible for checking their own product labels** — the seed is not a medical allergen database. A blocked chip is **swapped** and highlighted, never used as-is. This-run toggles may tighten or loosen diet **flags** (for example drop vegetarian for one cook) and change servings, time, kcal, skill, method, and devices, but they can **never** remove or ignore an avoid-list entry.

- **Multi-Diet in v1:** `/pantry` has a Diet switcher that sets the active Diet before Generate. Cooks can add, rename, edit, and delete Diets. Deleting the active Diet falls back to another remaining Diet. Each Recipe records which Diet it was cooked for (internal only on public pages).
- Storage is the per-user Diet DO with `getActive()` (see [data.md](./data.md#diet-lives-in-a-durable-object)).

### Recent
- v1’s public recipe list is **Recent**: a **date-sorted** query of **published** recipes (newest first). It replaces the old Popular *recipe* ranking (impractical: no live ranking, no HN gravity, no save/view counts).
- **Short Workers Cache**, **no cron**, **no ranking snapshot**, **no KV Popular rebuild**. Cache TTLs: [caching.md](./caching.md#headers-by-route).
- Route: **`/recent`** under `(site)`, edge SSR, `csr=false`, 0 JS. Cards are SSR HTML linking to `/recipes/[slug]`.
- Counted **Popular ingredients** (canonical IDs, pairs/triples, cron, cache, sitemap) remains **v2** — see [v2.md](./v2.md).

### Try me
- Curated starter pantries on **`/`** so a Cook can tap once, land on `/pantry` with chips prefilled, and still **Generate with their own Diet**. Complementary to Recent (Recent lists published recipes; Try me seeds pantries).
- **Four meals**, one each for **breakfast**, **lunch**, **dinner**, and **dessert**. Each meal has **three tiered chip sets** — **common**, **moderately common**, and **uncommon** — each 3–5 chips (same `/pantry?i=` seed shape as before). Min chips on Generate stays **3**.
- **Static committed list** in the repo — no Generate counting, no canonical-ID ranking, no weekly cron, no KV snapshot. Chip strings below are display labels; canonical IDs / intrinsic flags / parent links come from the pantry seed when wired. Avoid-list matches still **swap conflicting pantry chips** as usual (see [Diet](#diet)).
- **Common** (Coinnich-approved; default brochure seed):

  | Meal | Dish | Chips | Source |
  |---|---|---|---|
  | Breakfast | scrambled eggs | eggs, bacon, mushrooms, tomatoes | [NZ Eggs — Kiwis in a scramble over eggs](https://eggs.org.nz/kiwis-in-a-scramble-over-eggs/) (scrambled #1 breakfast) |
  | Lunch | mince & cheese pie | beef mince, cheese, puff pastry, onion | [Z Energy pie data via Supermarket News](https://supermarketnews.co.nz/c-store/z-energy-weighs-in-on-mince-vs-steak-pie-debate/) (mince & cheese / steak & cheese lead) |
  | Dinner | roast lamb | lamb, kumara, potatoes, broccoli | [Retail Meat NZ Christmas survey 2025](https://www.rmnz.co.nz/news/2025/12/8/lamb-takes-out-ham-this-christmas) (lamb hero; potatoes / kumara / broccoli among top sides) |
  | Dessert | pavlova | eggs, cream, kiwifruit, strawberries | NZ Eggs dessert #1 pavlova; classic topping fruit ([eggs.org.nz pavlova](https://eggs.org.nz/recipes/pavlova/); RMNZ survey: pavlova 71% favourite dessert) |

- **Moderately common** (everyday NZ supermarket ingredients; 3–5 chips; avoid heavy chip reuse across sets):

  | Meal | Dish | Chips | Source |
  |---|---|---|---|
  | Breakfast | porridge | oats, milk, apple, yoghurt | [Diabetes NZ breakfast guidance](https://www.diabetes.org.nz/blog/2018/5/30/whats-for-breakfast-p644a); [KidsHealth NZ](https://www.kidshealth.org.nz/healthy-eating/healthy-snack-meal-ideas-for-children-young-people) (porridge + milk + fruit) |
  | Lunch | ham sandwich | ham, bread, lettuce, mayonnaise | Everyday NZ deli / supermarket lunch (e.g. FreshChoice ham / salad sandwich listings) |
  | Dinner | roast chicken | chicken, carrots, peas, pumpkin | [newzealand.com favourite foods](https://www.newzealand.com/nz/feature/favourite-new-zealand-foods/) (chicken in hāngī / BBQ); RMNZ sides include carrots and peas; pumpkin a hāngī staple |
  | Dessert | banana cake | banana, flour, butter, sugar | [Edmonds Cooking — banana cake](https://edmondscooking.co.nz/recipes/cakes/banana-cake) (classic Kiwi cookery-book cake) |

- **Uncommon** (still recognisably Kiwi / NZ-available, less everyday; pick ingredients sources support — pāua, feijoa, whitebait, kawakawa, horopito):

  | Meal | Dish | Chips | Source |
  |---|---|---|---|
  | Breakfast | whitebait fritters | whitebait, flour, egg | [Edmonds — whitebait fritters](https://edmondscooking.co.nz/recipes/fritters/whitebait-fritters); [newzealand.com — īnanga / whitebait](https://www.newzealand.com/nz/feature/traditional-maori-foods/) |
  | Lunch | pāua fritters | paua, flour, spring onion, parsley | [NZ Woman's Weekly Food — pāua fritters](https://www.nzwomansweeklyfood.co.nz/recipe/lunch/paua-fritters-2085/); [Te Pā Tū — kai moana](https://te-pa-tu.com/our-stories/traditional-foods-used-in-maori-culture/) |
  | Dinner | pan-fried fish with native herbs | tarakihi, kawakawa, horopito, lemon | Fish & chips fish (tarakihi) is common takeaway; **kawakawa** / **horopito** as seasoning ([Te Pā Tū herbs](https://te-pa-tu.com/our-stories/traditional-foods-used-in-maori-culture/); [newzealand.com kawakawa](https://www.newzealand.com/nz/feature/traditional-maori-foods/)) |
  | Dessert | feijoa & passionfruit | feijoa, passionfruit, yoghurt | [NZ Feijoa Growers recipes](https://www.feijoa.org.nz/feijoa-recipes); passionfruit a classic NZ pav / summer fruit pairing |

- Shape sketch (tiers explicit; strings are labels until canonical IDs land):

  ```ts
  export const tryMe = {
    breakfast: {
      common: ['eggs', 'bacon', 'mushrooms', 'tomatoes'], // scrambled eggs
      moderatelyCommon: ['oats', 'milk', 'apple', 'yoghurt'], // porridge
      uncommon: ['whitebait', 'flour', 'egg'], // whitebait fritters
    },
    lunch: {
      common: ['beef mince', 'cheese', 'puff pastry', 'onion'], // mince & cheese pie
      moderatelyCommon: ['ham', 'bread', 'lettuce', 'mayonnaise'], // ham sandwich
      uncommon: ['paua', 'flour', 'spring onion', 'parsley'], // pāua fritters
    },
    dinner: {
      common: ['lamb', 'kumara', 'potatoes', 'broccoli'], // roast lamb
      moderatelyCommon: ['chicken', 'carrots', 'peas', 'pumpkin'], // roast chicken
      uncommon: ['tarakihi', 'kawakawa', 'horopito', 'lemon'], // fish + native herbs
    },
    dessert: {
      common: ['eggs', 'cream', 'kiwifruit', 'strawberries'], // pavlova
      moderatelyCommon: ['banana', 'flour', 'butter', 'sugar'], // banana cake
      uncommon: ['feijoa', 'passionfruit', 'yoghurt'], // feijoa & passionfruit
    },
  } as const
  ```

- Surfaces: `/` shows the Try me section. Cards are **SSR HTML**, not an island.

### Publish and privacy
- **Free-tier** recipes are **published to Recent by default** (eligible after moderation / quality gates).
- **Paid** Cooks (Credits / packs) may **opt out** so a recipe stays **private** (not listed on Recent; not fetchable as a public brochure page for anonymous visitors — exact private URL behaviour Open).
- Explain publish defaults clearly on **`/onboarding`** and on cook / pantry pages.
- **Public page content:** recipe title, ingredients, steps, time, servings, kcal as on the Recipe JSON — **never** the Cook’s profile, Diet name, diet flags, avoid list, or medical diets.
- SEO / indexing of individual recipes stays `noindex` by default ([seo.md](./seo.md)); Recent itself is indexable.

### Moderation (approach)
Recorded as the **v1 approach** (thresholds and exact model IDs may tighten in Open):

1. **Canonical ingredient IDs only** for pantry input that can publish. Unmatched free text is **held for review**, not listed on Recent.
2. **Safety classifier** (e.g. Llama Guard on Workers AI) on title and any free text **before** publish.
3. **Blocklist** for slurs and URLs in title / free text.
4. **Report** button on public recipes: after **N** reports the listing **hides** until reviewed (exact N Open).
5. **Rate limits** on new accounts for Generate / publish (see [security.md](./security.md)).

### Quality (publish gates)
Publish to Recent only when:

- The Recipe is **complete** and **schema-valid** (Valibot).
- Steps **fit the Cook’s devices and time** (from Diet / onboarding / this-run).
- Skip **near-duplicate** canonical pantries (same sorted ingredient ID set already listed recently — exact window Open).
- **Optional:** require a **“cooked it”** confirmation or a **rating** before listing (whether required in v1 is Open).

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
- Generate do's and don'ts (proposed): a **collapsed** disclosure under the chip list, above the Generate button, titled "How to get the most out of Chef Llama" (not a dialog, not on `/`). Keep: Diet first; leftover chips; free cooks then Credits; one Recipe per Generate; ≥3 chips / max 16; Staples assumed (and customise); avoid list always wins; this-run toggles may change flags / servings / time / kcal / skill / method / devices but never drop an avoid entry; publish defaults; an AI-untested disclaimer; Save if you like it; metric and NZ names. Still to pick: always visible vs collapsed; whether a failed Generate refunds; a lawyer pass on the avoid-list / label-disclaimer wording.
- **Skill level labels:** the three closed levels (proposed: beginner | intermediate | advanced — not locked).
- **Try me surfaces:** which tier(s) show on `/` by default (common only vs all three); whether dessert is required on `/`; brochure card copy for moderately common / uncommon.
- **Staples customise:** how Cooks edit the staples list (onboarding only vs Diet settings); max length; whether custom staples can leave the closed set.
- **Private recipe URL:** 404 vs signed-in-only for opted-out / unpublished rows; whether Save of a private recipe works for the owner only.
- **Report threshold N** and reviewer workflow.
- **“Cooked it” / rating before Recent:** required in v1 or optional later.
- **Near-duplicate window** for canonical pantry skip.
- Exact Llama Guard (or successor) model id on Workers AI.
- Account page scope and usage bars (see [auth.md](./auth.md#open)).
- Pending art and the robot design (draft).
- Exact `/about` `/pricing` `/how-to` paths.
- Architecture hunt cadence (see [factory.md](./factory.md#open)).
- **Ads:** exploration only — [ads.md](./ads.md). Whether to ship any ads in v1 is Open; recommendation there is **none yet**.
