# NZ pantry ingredient seed — sources and licences

Short note for the canonical list in `nz-pantry.json`. Method and regeneration: `node scripts/generate-nz-pantry.mjs`, then `node scripts/validate-nz-pantry.mjs`.

## Method

1. Curate ~300–500 **everyday NZ pantry** items (supermarket + common kai), not a bulk taxonomy dump.
2. Prefer **NZ display names** and aliases (capsicum, kumara, courgette, coriander, mince, spring onion, silverbeet, kiwifruit, feijoa, pāua, tarakihi, …).
3. Attach **deterministic v1 Diet flags** only: `vegan` | `vegetarian` | `gluten_free` (see product Diet closed list). Multi-Diet UI is v1; those three flags did **not** expand.
4. Attach allergen codes aligned with Open Food Facts `en:*` tags. Definite contains → `allergens[]`. `may contain` / source disagreement / brand variance → `allergen_uncertain[]` with a note. **Never guess.**
5. Hand-review list: `MANUAL_REVIEW.json` (+ summary in `MANUAL_REVIEW.md`).

## Sources used

| Source | Licence | How used |
|---|---|---|
| **Open Food Facts** ingredient + allergen taxonomies | [ODbL](https://opendatacommons.org/licenses/odbl/) | Seed for names, synonyms, allergen links. Derived database is **share-alike**; keep this attribution. |
| **USDA FoodData Central** | Public domain (US government work) | Naming gaps only (e.g. less-common produce). |
| **FoodOn** | CC BY 4.0 | Naming gaps / NZ kai cross-checks (e.g. pāua, whitebait, feijoa). |

Each ingredient row lists `sources` from `{ off, usda, foodon, curated }`.

## NZ Food Composition Database — **not used**

Checked [foodcomposition.co.nz/terms](https://foodcomposition.co.nz/terms/) (FOODfiles™ Data Licensing):

- Worldwide, non-exclusive, royalty-free right to access and use.
- **Must not modify** any part of the FOODfiles™ Data.
- When reproduced in a product, data must be presented in its **original and unaltered** form, with acknowledgement, and third-party access subject to those terms.

A curated, aliased, diet-flagged pantry list is a **modified / derived** product, so NZFCD / FOODfiles rows are **out of scope** for this seed. Do not import nutrient tables or food names from NZFCD into `nz-pantry.json`.

## Do not use

- TheMealDB
- Spoonacular

## Shape (fits planned D1 + Vectorize)

- **`slug`**: stable external key (kebab-case). Chip synonym map and Try me wire to this.
- **D1 `id`**: ULID primary key minted on load into `RECIPES_DB` (see data topic); `slug` stays `UNIQUE`.
- **Vectorize** (later): embed `name` + `aliases`; metadata carries `slug` (and ULID after D1 load). Recipe Vectorize index remains separate (`recipes` / bge).

Valibot field sketch (to land under `#lib/schemas/*` with app code):

```ts
// closed allergen / category / diet picklists match nz-pantry.json
ingredient: {
  slug, name, aliases[], category,
  allergens[], allergen_uncertain: { code, note }[],
  diets: { vegan, vegetarian, gluten_free },
  sources[]
}
```

Runtime check today: `scripts/validate-nz-pantry.mjs` (no Valibot dependency yet).
