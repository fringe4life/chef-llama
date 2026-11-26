# NZ pantry ingredient seed — sources and licences

Short note for the canonical list in `nz-pantry.json`. Method and regeneration: `node scripts/generate-nz-pantry.mjs`, then `node scripts/validate-nz-pantry.mjs`.

## Method

1. Curate ~300–500 **everyday NZ pantry** items (supermarket + common kai), not a bulk taxonomy dump.
2. Prefer **NZ display names** and aliases (capsicum, kumara, courgette, coriander, mince, spring onion, silverbeet, kiwifruit, feijoa, pāua, tarakihi, …).
3. Store **names + aliases** only for matching. No curated allergen codes, no `may contain` rows.
4. Attach **intrinsic composition flags**: `meat` | `fish` | `dairy` | `egg` | `animal_derived`. Derive `diets.vegan` / `diets.vegetarian` from those (see below). Do **not** store per-item `gluten_free`, `keto`, `halal`, or `paleo`.
5. **Avoid model:** the Cook lists ingredients to avoid. Code blocks chips whose `slug` or alias matches, and expands a **small** set of parent links (e.g. butter / cheese / yoghurt → `dairy`; flour → `wheat`). The UI tells Cooks they are responsible for checking their own product labels — this seed is not a medical allergen database.
6. Hand-review list: `MANUAL_REVIEW.json` (+ summary in `MANUAL_REVIEW.md`) — identity / alias issues only.
7. Other Diet preferences (`gluten_free`, `keto`, `halal`, `paleo`) are **short rules given to the AI** plus the same label disclaimer — not pantry tags.

## Intrinsic flags → vegan / vegetarian

| Flag | Meaning |
|---|---|
| `meat` | Land-animal flesh (category `meat`) |
| `fish` | Seafood including crustaceans / molluscs (category `seafood`) |
| `dairy` | Milk and dairy products; also butter / ghee |
| `egg` | Eggs and egg parts |
| `animal_derived` | Animal origin beyond the four above (honey, gelatine, lard, dripping, anchovy-based sauces, …) |

- **`vegan`** = none of the five flags.
- **`vegetarian`** = no `meat`, no `fish`, and no vegetarian-blocking `animal_derived` (gelatine, lard, dripping, worcestershire, fish sauce, oyster sauce, …). **Honey** is `animal_derived` but vegetarian-OK. Dairy and egg remain vegetarian.

## Parent links (obvious only)

Parent group ids (not necessarily ingredient slugs): `dairy`, `wheat`.

Examples: butter, cheese, yoghurt, milk, cream, … → `dairy`; flour, self-raising flour → `wheat`. Avoiding a parent group blocks every chip that carries that `parent`.

## Sources used

| Source | Licence | How used |
|---|---|---|
| **Open Food Facts** ingredient taxonomies | [ODbL](https://opendatacommons.org/licenses/odbl/) | Seed for names and synonyms. Derived database is **share-alike**; keep this attribution. (Allergen taxonomy is **not** copied onto seed rows.) |
| **USDA FoodData Central** | Public domain (US government work) | Naming gaps only (e.g. less-common produce). |
| **FoodOn** | CC BY 4.0 | Naming gaps / NZ kai cross-checks (e.g. pāua, whitebait, feijoa). |

Each ingredient row lists `sources` from `{ off, usda, foodon, curated }`.

## NZ Food Composition Database — **not used**

Checked [foodcomposition.co.nz/terms](https://foodcomposition.co.nz/terms/) (FOODfiles™ Data Licensing):

- Worldwide, non-exclusive, royalty-free right to access and use.
- **Must not modify** any part of the FOODfiles™ Data.
- When reproduced in a product, data must be presented in its **original and unaltered** form, with acknowledgement, and third-party access subject to those terms.

A curated, aliased pantry list is a **modified / derived** product, so NZFCD / FOODfiles rows are **out of scope** for this seed. Do not import nutrient tables or food names from NZFCD into `nz-pantry.json`.

## Do not use

- TheMealDB
- Spoonacular

## Shape (fits planned D1 + Vectorize)

- **`slug`**: stable external key (kebab-case). Chip synonym map and Try me wire to this.
- **D1 `id`**: ULID primary key minted on load into `RECIPES_DB` (see data topic); `slug` stays `UNIQUE`.
- **Vectorize** (later): embed `name` + `aliases`; metadata carries `slug` (and ULID after D1 load). Recipe Vectorize index remains separate (`recipes` / bge).

Valibot field sketch (to land under `#lib/schemas/*` with app code):

```ts
ingredient: {
  slug, name, aliases[], category,
  parent?: 'dairy' | 'wheat',
  intrinsic: { meat, fish, dairy, egg, animal_derived },
  diets: { vegan, vegetarian }, // derived
  sources[]
}
```

Runtime check today: `scripts/validate-nz-pantry.mjs` (no Valibot dependency yet).
