# Data: IDs, slugs, Drizzle, D1, Durable Objects, KV, Queues, Vectorize

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### IDs (accepted 15 Nov 2026)
- Every internal primary key is a **ULID, TEXT, lowercase Crockford** `[0-9a-hjkmnp-tv-z]{26}`. That includes the Better Auth `user`/`session`/`account`/`verification` tables via `advanced.database.generateId: () => newId()`. Session tokens stay Better Auth's default random string.
- `newId()` (`src/lib/id.ts`) wraps `ulid@3` `monotonicFactory()`, always lowercased. Drizzle `text("id").primaryKey().$defaultFn(() => newId())`. It is monotonic per isolate only, and the monotonic factory is required.
- This replaces the earlier UUIDv7 draft and Better Auth's default base62 IDs.

### Recipe slugs
- `/recipes/[slug=slug]`, slug = `{title-slug}-{8-char lowercase Crockford suffix}`. Title part: NFKD, ASCII-fold, lowercase, non-alphanumerics → single hyphen, trimmed, max 50. Fallback `recipe-{suffix}`.
- `UNIQUE(slug)` and `UNIQUE(slug_suffix)`. On conflict, retry the suffix only, never the ULID. Minted at creation and immutable in v1.
- Lookup by `slug_suffix`. A non-canonical param (bare suffix, wrong or missing title) → `redirect(301, '/recipes/' + slug)` in SvelteKit, not Cloudflare Redirect Rules. Unknown → 404, deleted → 410. All `no-store` (see [caching.md](./caching.md#headers-by-route)).
- Cache tags use the ULID: `recipe-{ulid}`. Saved DO lists hold ULIDs. `save_ledger(recipe_id, saver_hash)` with `saver_hash = HMAC(secret, userId)` (Save still uses the ledger; v1 brochure seeding is **Try me**, not save-ranked Popular — see [product.md](./product.md#try-me)).
- Matchers: a single `src/params.ts` with `defineParams` and the Valibot brands `RecipeSlug` / `Ulid` (see [caching.md](./caching.md#kit-32-param-matchers)).

### Query layer and validation
- **Drizzle** on D1 (`Drizzle.D1`) and on SQLite DOs (`Drizzle.DurableObject`), copying dollar-holler's Worker stub pattern. **Valibot** (Standard Schema) for remote-function args, Recipe JSON, Diet fields and `drizzle-orm/valibot`.
- **Not** Effect SQL or `effect/Schema`. Effect is used for typed errors (see [lint.md](./lint.md#effect)). Reylo is parked.
- Diet cooking gear (shared with [product.md](./product.md#diet) / [ai.md](./ai.md)):

  ```ts
  method: v.picklist(['fry-pan','saucepan','oven','air-fryer','slow-cooker','pressure-cooker','grill','no-cook'])
  devices: v.optional(v.pipe(v.array(methodEnum), v.maxLength(3)))
  ```

  Intent: primary `method` plus an optional second device; schema `devices` max length is 3.

### Databases and region
- Two D1s: **`AUTH_DB`** (Better Auth tables only) and **`RECIPES_DB`** (public recipes, save ledger, Vectorize source of truth). No cross-DB foreign keys. Popular ingredient-set source rows are **v2** ([v2.md](./v2.md)).
- Both D1s `primaryLocationHint: "oc"`. Do **not** set `placement.region` to `aws:ap-southeast-2`.
- Binding names: `AI`, `AUTH_DB`, `RECIPES_DB`, `RECIPES_INDEX` (Vectorize), `JOBS` (Queue), `CREDITS`, `DIET`, `SAVED` (DO). KV `POPULAR` was for ranking snapshots; **natural to omit in v1** (Try me is committed code) — **needs Coinnich's confirmation** before dropping the binding from IaC sketches. v2 Popular ingredients bring it back.

### Durable Objects
- One DO per coordination atom; no kitchen-sink per-user DO.
- Per-user **Credit** SQLite DO, `getByName(userId)`: append-only ledger **plus materialized** `remaining`, `pack_sum`, recent debits and pack history, all updated in the same SQL write. `/account` never scans `RECIPES_DB` or SUMs the ledger. The ledger `id` is unique for the Stripe `event.id` and the generation `jobId`.
- Per-user **Saved** DO: a ULID list pointing at public rows. No D1 saves list, no dual-write.
- **Pool DO** for the shared daily free-cook cap (not a KV UTC counter). Day key and reset alarm at **00:00 UTC**.
- Per-email **OTP-send DO** for the exact send cap (see [security.md](./security.md#rate-limiting)).
- DO classes and the queue consumer live on a **Jobs Worker**. The adapter does not support DO classes in the Kit Worker locally.

### Diet lives in a Durable Object
- "Diet" is the canonical term (not Kitchen, not Profile, which collides with auth, and not Pantry prefs, since Pantry is the chips).
- Per-user **Diet** SQLite DO, `getByName(userId)`. It holds the Diet rows (name, flags, allergies, default kcal, servings, **skill**, **method**, optional **devices**) and `active_diet_id`. There is **no** D1 `kitchens`/`diets` table and **no** `cooks.active_diet_id`. Diet is not on the Credit DO.
- Generate calls `getActive()` and reads one row; it never refetches a whole profile list.
- **v1 supports multiple Diets.** A Diet is **required before the first Generate**: a blocking first-run dialog on `/pantry` creates Diet #1. `/pantry` then has a Diet switcher for the active Diet, plus add / rename / edit / delete (reuse that dialog). Deleting the active Diet falls back to another remaining Diet. The site itself stays public.
- **Skill** (three levels) and **method / devices** are v1 Diet columns; this-run toggles may override them for one Generate. Skill affects technique, step detail, parallel steps, and time estimates (see [ai.md](./ai.md)).
- **Allergies always win.** A pantry Chip that conflicts with an allergy is **swapped** and highlighted, never used as-is (recorded in `swaps`; see [ai.md](./ai.md#recipe-json)). This-run toggles may tighten or loosen diet **flags** and change servings, time, kcal, skill, method, and devices for that Generate only; they can **never** remove or ignore an allergy. Flag conflicts that remain after this-run toggles (for example vegan Diet + chicken chip with vegetarian still on) also produce a **Swap**, never a silent ignore.
- Each Recipe row records which Diet it was cooked for (`diet_id` on the public Recipe in `RECIPES_DB`).
- The Fallow module is `src/features/diet/`. (Multi-Diet was parked as v2; **superseded 21 Nov 2026** — see [product.md](./product.md#diet); the old park note remains in [v2.md](./v2.md).)

### Try me (v1) vs Popular ingredient sets (v2)
- **v1:** brochure seeding is curated **Try me** — a static committed module of starter chip lists (breakfast / lunch / dinner / dessert × common / moderately common / uncommon). No per-Generate ingredient-set persistence for ranking, no KV snapshot, no weekly aggregate. See [product.md](./product.md#try-me).
- **v2:** counted **Popular ingredients** — canonical IDs, sorted ID set per Generate, pairs/triples over 7 days, KV `POPULAR`, cron, cache, sitemap. See [v2.md](./v2.md).

### Write path (v1)
- Session → Diet DO `getActive()` → Credit DO **`hold(n, idempotencyKey)`** (coalesced SQL, no `await` between writes, no AI inside the DO) → Workers AI granite → Valibot → D1 `batch()` insert of the public-by-URL Recipe (including `diet_id` for the Diet it was cooked for) → **`settle`**. **`release`** if AI or Valibot fails, or on cancel. Then Queue `index_recipe` (bge embed + Vectorize upsert + Analytics Engine). Credits are always held first, then settled or released; never a one-shot debit before AI. (Persisting a sorted canonical ingredient ID set for Popular ranking is **v2**.)
- D1 stays the store: Generate is one INSERT. Turso/libSQL, Postgres + Hyperdrive (v2) and Basin Pipelines (v3) are parked.
- Every v1 Generate is **public-by-URL**. No `visibility` flag and no private picker; private recipes are v2.
- Account deletion **deletes** recipes and saves, removes them from Vectorize / sitemap as applicable, purges tags and wipes the per-user DOs. Old URLs → 410.

### KV, Queues, Vectorize
- KV `POPULAR` (ranking snapshots: formerly `popular:all`, `popular:{type}`, `popular:hashes`) is **not required for v1 Try me**. Natural to omit until v2 Popular ingredients — **needs Coinnich's confirmation**.
- One queue with a typed payload: `generate_recipe` (only if inference may exceed the request budget / `rejectIfBusy`) and `index_recipe`. Synchronous Generate on the request path is fine for v1.
- Vectorize `recipes`, 768-d cosine, `@cf/baai/bge-base-en-v1.5`. Batch upserts (never one-vector inserts). Fallback `bge-small` 384-d if cost bites.
- R2 `ingredients` for photos is v2.

### Runtime and IaC
- Alchemy v2 `Alchemy.Stack` + `Cloudflare.Website.SvelteKit` (`cache: { enabled: true }`). Fallback: adapter-cloudflare + `wrangler.jsonc`.
- Effect v4 runs only at server edges (see [lint.md](./lint.md#effect)); tagged errors map to 402/503/502.
- Alchemy, like every dependency, is pinned to an **exact version** in `package.json` (no `^`, `~` or `*`), picked as the latest v2 when coding starts and kept current by the deps review (see [ci.md](./ci.md#dependencies)).

## Open
- **KV `POPULAR` binding in v1:** omit vs keep unused — needs Coinnich confirmation (see Decided).
- **Skill level labels:** exact three-level picklist (see [product.md](./product.md#open)).
- Queue: when to move Generate off the request path (the `rejectIfBusy` threshold).
- Storage (v2 option): nightly near-duplicate merge + 301, and embed only saved recipes.
- Popular ingredients open detail (canonical IDs, thresholds, guest Generates, …) lives under [v2.md](./v2.md).
