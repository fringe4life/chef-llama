# Manual review — NZ pantry seed

Generated alongside `nz-pantry.json`. **245** items. Prefer editing the generator (`scripts/generate-nz-pantry.mjs`) then re-running it; do not invent allergen or diet certainty.

## Counts

| Kind | Count |
|---|---|
| allergen_uncertain | 92 |
| diet_uncertain | 138 |
| — keto | 71 |
| — halal | 44 |
| — paleo | 23 |
| diet_or_identity_ambiguous | 15 |
| alias_clash | 0 |

## Allergen uncertain (92)

| Slug | Detail |
|---|---|
| `bagel` | sesame: often topped with sesame |
| `biscuit` | eggs: often |
| `biscuit` | milk: often |
| `biscuit` | nuts: variants |
| `corn-tortilla` | gluten: usually GF corn; confirm brand |
| `croissant` | eggs: may contain egg |
| `muffin` | eggs: usually contains egg |
| `muffin` | milk: usually contains milk |
| `puff-pastry` | milk: butter pastry contains milk; margarine versions may not |
| `shortcrust` | milk: often contains butter |
| `shortcrust` | eggs: some recipes include egg |
| `beef-stock` | celery: commercial usually contains celery |
| `beef-stock` | gluten: check label |
| `chicken-stock` | celery: commercial usually contains celery |
| `chicken-stock` | gluten: check label |
| `stock` | celery: commercial stock usually contains celery |
| `stock` | gluten: check label |
| `stock` | fish: fish stock variant |
| `vegetable-stock` | celery: commercial usually contains celery |
| `vegetable-stock` | gluten: check label |
| `baking-powder` | gluten: most NZ baking powder is GF; rare wheat starch — check if coeliac |
| `chocolate` | milk: milk chocolate contains milk; dark may have traces |
| `chocolate` | soybeans: lecithin often soy |
| `chocolate` | nuts: may contain nuts |
| `harissa` | gluten: check brand |
| `hoisin` | gluten: often contains wheat |
| `hoisin` | sesame: some brands contain sesame |
| `mayonnaise` | mustard: many mayo recipes include mustard |
| `milk-chocolate` | soybeans: lecithin often soy |
| `milk-chocolate` | nuts: may contain nuts |
| `mirin` | gluten: hon-mirin usually GF; mirin-style seasoning may contain gluten |
| `miso` | gluten: some miso uses barley/wheat; rice/soy miso may be GF |
| `oyster-sauce` | gluten: often contains wheat |
| `oyster-sauce` | soybeans: often contains soy |
| `peanut-sauce` | soybeans: often contains soy |
| `peanut-sauce` | gluten: may contain wheat |
| `pesto` | nuts: classic basil pesto uses pine nuts |
| `pesto` | milk: classic includes parmesan |
| `pickled-ginger` | sulphites: may contain sulphites |
| `shaoxing` | gluten: some brands contain wheat |
| `soy-sauce` | gluten: tamari is often GF; standard soy sauce is wheat-based — fail closed gluten |
| `tamari` | gluten: most tamari is GF; confirm label |
| `wasabi` | mustard: imitation wasabi often horseradish; may include mustard — check |
| `white-chocolate` | soybeans: lecithin often soy |
| `worcestershire` | fish: classic recipe includes anchovy |
| `worcestershire` | gluten: some brands contain gluten |
| `worcestershire` | soybeans: some brands contain soy |
| `custard` | eggs: egg custard contains eggs; instant custard may not |
| `ice-cream` | eggs: some ice cream contains egg |
| `ice-cream` | nuts: flavour variants may contain nuts |
| `apricot` | sulphites: dried apricots often sulphured; fresh usually fine |
| `raisins` | sulphites: may be sulphured |
| `cereal` | gluten: many cereals contain wheat; some corn/rice are GF |
| `lasagna-sheet` | eggs: egg pasta variants |
| `noodles` | eggs: egg noodles contain eggs; rice noodles do not — prefer rice-noodles slug |
| `oats` | gluten: botanically GF but NZ coeliac advice: only certified GF oats; standard oats fail closed |
| `ramen-noodles` | soybeans: seasoning packs often soy |
| `ramen-noodles` | sesame: some flavour packs |
| `ramen-noodles` | crustaceans: seafood flavours |
| `ramen-noodles` | milk: some flavour packs |
| `soba` | gluten: 100% buckwheat soba can be GF; most soba is wheat+buckwheat — fail closed gluten |
| `vermicelli` | gluten: rice/mung vermicelli usually GF; wheat vermicelli is not — ambiguous name |
| `wonton-wrapper` | eggs: often contain egg |
| `wrap` | gluten: corn tortillas are usually GF; flour wraps are not — prefer corn-tortilla slug |
| `curry-powder` | mustard: many blends include mustard seed |
| `curry-powder` | gluten: rare fillers; check label |
| `dukkah` | gluten: some blends include wheat |
| `stock-powder` | celery: very common in stock powders |
| `stock-powder` | gluten: some cubes contain wheat |
| `stock-powder` | milk: some contain dairy |
| `stock-powder` | soybeans: some contain soy |
| `zaatar` | sesame: sesame-free blends exist; classic includes sesame |
| `baked-beans` | gluten: some sauces thicken with wheat; check label |
| `hummus` | sesame: sesame-free hummus exists; default assumes tahini |
| `beef-schnitzel` | eggs: crumb binding usually includes egg |
| `chicken-schnitzel` | eggs: crumb binding usually includes egg |
| `frankfurter` | gluten: check casing and fillers |
| `frankfurter` | milk: may contain dairy |
| `meatballs` | gluten: often contain breadcrumbs |
| `meatballs` | eggs: often bound with egg |
| `salami` | milk: some salami uses milk powder |
| `salami` | sulphites: may contain sulphites |
| `sausage` | gluten: some NZ sausages contain breadcrumbs; check label |
| `sausage` | sulphites: common preservative in sausages |
| `mixed-nuts` | peanuts: mixes sometimes include peanuts |
| `margarine` | milk: some spreads contain milk |
| `margarine` | soybeans: often contains soy |
| `corn-chips` | gluten: usually corn-based; check seasoning |
| `corn-chips` | milk: cheese flavours contain milk |
| `fish-stock` | celery: commercial stocks often contain celery |
| `kimchi` | fish: many commercial kimchi use fish sauce; check label |
| `kimchi` | crustaceans: some recipes use shrimp paste |

## Diet uncertain (138)

| Slug | Detail |
|---|---|
| `beef-stock` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `chicken-stock` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `stock` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `wine` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `wine` | paleo: Paleo schools disagree; fail closed pending manual review |
| `balsamic` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `balsamic` | paleo: Paleo schools disagree; fail closed pending manual review |
| `chocolate` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `chocolate` | paleo: Paleo schools disagree; fail closed pending manual review |
| `gelatine` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `malt-vinegar` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `malt-vinegar` | paleo: Paleo schools disagree; fail closed pending manual review |
| `milk-chocolate` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `milk-chocolate` | paleo: Paleo schools disagree; fail closed pending manual review |
| `vinegar` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `vinegar` | paleo: Paleo schools disagree; fail closed pending manual review |
| `white-chocolate` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `white-chocolate` | paleo: Paleo schools disagree; fail closed pending manual review |
| `wine-vinegar` | paleo: Paleo schools disagree; fail closed pending manual review |
| `worcestershire` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `blue-cheese` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `brie` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `buttermilk` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `cheese` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `condensed-milk` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `cottage-cheese` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `cottage-cheese` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `cream` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `cream-cheese` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `custard` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `evaporated-milk` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `feta` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `halloumi` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `ice-cream` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `mascarpone` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `milk` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `mozzarella` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `parmesan` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `ricotta` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `ricotta` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `sour-cream` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `yoghurt` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `apricot` | keto: Most fruit is high-sugar; berry exceptions need review |
| `blackberry` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `blackcurrant` | keto: Most fruit is high-sugar; berry exceptions need review |
| `blueberry` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `boysenberry` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `cherry` | keto: Most fruit is high-sugar; berry exceptions need review |
| `coconut` | keto: Most fruit is high-sugar; berry exceptions need review |
| `coconut-cream` | keto: Most fruit is high-sugar; berry exceptions need review |
| `coconut-milk` | keto: Most fruit is high-sugar; berry exceptions need review |
| `cranberry` | keto: Most fruit is high-sugar; berry exceptions need review |
| `dragonfruit` | keto: Most fruit is high-sugar; berry exceptions need review |
| `feijoa` | keto: Most fruit is high-sugar; berry exceptions need review |
| `fig` | keto: Most fruit is high-sugar; berry exceptions need review |
| `goji` | keto: Most fruit is high-sugar; berry exceptions need review |
| `gooseberry` | keto: Most fruit is high-sugar; berry exceptions need review |
| `grapefruit` | keto: Most fruit is high-sugar; berry exceptions need review |
| `guava` | keto: Most fruit is high-sugar; berry exceptions need review |
| `jackfruit` | keto: Most fruit is high-sugar; berry exceptions need review |
| `kiwifruit` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `lemon` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `lemon-juice` | keto: Most fruit is high-sugar; berry exceptions need review |
| `lime` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `lime-juice` | keto: Most fruit is high-sugar; berry exceptions need review |
| `lychee` | keto: Most fruit is high-sugar; berry exceptions need review |
| `nectarine` | keto: Most fruit is high-sugar; berry exceptions need review |
| `papaya` | keto: Most fruit is high-sugar; berry exceptions need review |
| `passionfruit` | keto: Most fruit is high-sugar; berry exceptions need review |
| `peach` | keto: Most fruit is high-sugar; berry exceptions need review |
| `persimmon` | keto: Most fruit is high-sugar; berry exceptions need review |
| `plantain` | keto: Most fruit is high-sugar; berry exceptions need review |
| `plum` | keto: Most fruit is high-sugar; berry exceptions need review |
| `pomegranate` | keto: Most fruit is high-sugar; berry exceptions need review |
| `quince` | keto: Most fruit is high-sugar; berry exceptions need review |
| `raspberry` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `redcurrant` | keto: Most fruit is high-sugar; berry exceptions need review |
| `rhubarb` | keto: Most fruit is high-sugar; berry exceptions need review |
| `starfruit` | keto: Most fruit is high-sugar; berry exceptions need review |
| `strawberry` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `tamarillo` | keto: Most fruit is high-sugar; berry exceptions need review |
| `stock-powder` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `vanilla` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `vanilla` | paleo: Paleo schools disagree; fail closed pending manual review |
| `bacon` | paleo: Paleo schools disagree; fail closed pending manual review |
| `beef` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `beef-mince` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `beef-schnitzel` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `chicken` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `chicken-liver` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `chicken-mince` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `chicken-schnitzel` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `chorizo` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `chorizo` | paleo: Paleo schools disagree; fail closed pending manual review |
| `duck` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `frankfurter` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `frankfurter` | paleo: Paleo schools disagree; fail closed pending manual review |
| `ham` | paleo: Paleo schools disagree; fail closed pending manual review |
| `lamb` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `lamb-mince` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `lamb-shank` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `meatballs` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `meatballs` | paleo: Paleo schools disagree; fail closed pending manual review |
| `pastrami` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `salami` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `salami` | paleo: Paleo schools disagree; fail closed pending manual review |
| `sausage` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `sausage` | paleo: Paleo schools disagree; fail closed pending manual review |
| `turkey` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `venison` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `cashew` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `peanut` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `peanut-butter` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `dripping` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `ghee` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `ghee` | paleo: Paleo schools disagree; fail closed pending manual review |
| `margarine` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `butter` | halal: Needs halal certification, slaughter method, or enzyme/alcohol source check — never guess |
| `butter` | paleo: Paleo schools disagree; fail closed pending manual review |
| `salt` | paleo: Paleo schools disagree; fail closed pending manual review |
| `avocado` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `beetroot` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `butternut` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `carrot` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `corn` | paleo: Paleo schools disagree; fail closed pending manual review |
| `kumara` | paleo: Paleo schools disagree; fail closed pending manual review |
| `onion` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `parsnip` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `passata` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `peas` | paleo: Paleo schools disagree; fail closed pending manual review |
| `potato` | paleo: Paleo schools disagree; fail closed pending manual review |
| `pumpkin` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `red-onion` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `shallot` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `swede` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `tinned-tomato` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `tomato` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |
| `tomato-paste` | keto: Borderline carb load / portion-dependent; fail closed pending manual review |

## Diet / identity ambiguous (15)

| Slug | Detail |
|---|---|
| `chocolate` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `stock` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `vermicelli` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `ramen-noodles` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `sausage` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `hummus` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `oats` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `tamari` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `pesto` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `kimchi` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `worcestershire` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `wrap` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `cereal` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `noodles` | Ambiguous commercial product; diet/allergen flags need human confirm |
| `margarine` | Ambiguous commercial product; diet/allergen flags need human confirm |

## Alias clashes (0)

_None after last generate._
