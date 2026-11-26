# NZ pantry ingredient seed — sources and licences

Short note for the canonical list in `nz-pantry.json`. Method and regeneration: `node scripts/generate-nz-pantry.mjs`, then `node scripts/validate-nz-pantry.mjs`.

## Method

1. Curate ~300–500 **everyday NZ pantry** items (supermarket + common kai), not a bulk taxonomy dump.
2. Prefer **NZ display names** and aliases (capsicum, kumara, courgette, coriander, mince, spring onion, silverbeet, kiwifruit, feijoa, pāua, tarakihi, …).
3. Attach **deterministic v1 Diet flags** for the closed list: `vegan` | `vegetarian` | `gluten_free` | `keto` | `halal` | `paleo` (see product Diet). Unclear flags → `diet_uncertain[]` and the manual review list — **never guess**.
4. Attach allergen codes aligned with Open Food Facts `en:*` tags. Definite contains → `allergens[]`. `may contain` / source disagreement / brand variance → `allergen_uncertain[]` with a note. **Never guess.**
5. Hand-review list: `MANUAL_REVIEW.json` (+ summary in `MANUAL_REVIEW.md`).
6. **Allergies always win** over diet flags (product precedence).

## Diet flag rules (ingredient heuristics)

These are **chip-level** compatibility flags for Swap / Diet matching — not certified claims, not per-recipe macros.

### vegan

- `false` for meat, seafood, dairy, egg, and known animal condiments (honey, gelatine, worcestershire with anchovy, oyster sauce, butter, ghee, lard, dripping, …).
- `true` otherwise (plants, oils that are not animal fat, staples water/salt/pepper/oil).

### vegetarian

- `false` for meat and seafood (and gelatine).
- `true` for dairy, egg, honey, and plants.
- Vegan implies vegetarian.

### gluten_free

- `false` when `gluten` is in `allergens[]` (fail closed; e.g. standard soy sauce, oats treated as gluten for NZ coeliac practice).
- `true` otherwise. Brand-level exceptions stay in `allergen_uncertain`.

### keto

- Ingredient heuristic (not grams of carb per serving).
- **`false`**: grains, bakery, flours, rice/pasta/noodles, most legumes, starchy veg (potato, kumara, corn, …), sugars/syrups/honey, most fruit juices, beer, high-sugar dried fruit / tropical fruit listed in the generator’s `KETO_FALSE` set.
- **`true`**: meat, seafood, egg, oils/fats, herbs/spices, non-starchy veg default, most cheese/butter, nut_seed default, water/salt/pepper.
- **Uncertain** (`diet_uncertain.keto`, flag stored `false` until review): milk, yoghurt, berries, tomato/onion/carrot and similar borderline veg, some nuts, chocolate, wine, cream — portion / brand dependent.

### halal

- Ingredient heuristic — **not** a halal certificate.
- **`false`**: pork and pork products (bacon, ham, lard, prosciutto, …); intoxicants (wine, beer, mirin, shaoxing, wine vinegar).
- **`true`**: plants; seafood (most schools: no land-animal slaughter issue).
- **Uncertain** (`diet_uncertain.halal`, flag stored `false` until review): non-pork meat (slaughter / certification unknown); gelatine; cheeses that may use animal rennet; stocks / stock powder; worcestershire; vanilla (alcohol carrier); balsamic / generic vinegar; butter/ghee/margarine when enzyme or wine-derived processing is unclear.

### paleo

- Ingredient heuristic across common paleo schools (they disagree at the edges).
- **`false`**: grains, legumes (incl. peanut/soy), dairy, bakery, refined sugars/syrups, many seed oils / margarine, soy sauces / tofu family.
- **`true`**: meat, seafood, egg, vegetables, fruit, tree nuts/seeds (non-peanut), herbs/spices, honey (commonly allowed), olive/avocado/coconut oils.
- **Uncertain** (`diet_uncertain.paleo`, flag stored `false` until review): butter/ghee, potato/kumara/corn/peas, processed meats (sausage, bacon, …), chocolate, wine, some vinegars, iodised salt additives.

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
  diets: { vegan, vegetarian, gluten_free, keto, halal, paleo },
  diet_uncertain: { flag, note }[],
  sources[]
}
```

Runtime check today: `scripts/validate-nz-pantry.mjs` (no Valibot dependency yet).
