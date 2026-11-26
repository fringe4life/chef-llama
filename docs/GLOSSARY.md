# Chef Llama

Language for the cooking product. Chef Llama is the product, GitHub repo, UI name, logo, and wordmark. The cook is still called Llama.

## Language

**Chef Llama**:
The product Cooks see: name, logo, and wordmark. The cook persona is Llama even when the model is Granite.
_Avoid_: Larder as the product or chrome, Chef Lamma, the Cook, LLM, bot, Granite as the UI name

**Larder**:
Retired working name. Do not use for the product, repo, or chrome.
_Avoid_: treating Larder as what Cooks see

**Cook**:
A solo home cook feeding about one to four people from what is already on hand.
_Avoid_: User, customer, chef (the person is not Llama), account

**Pantry**:
The Cook’s current list of on-hand Chips for one Generate. Generate requires three or more Chips.
_Avoid_: Fridge, cupboard, inventory, shopping list

**Chip**:
One canonical pantry ingredient. May carry `cooked: true` when already cooked; uncooked Chips omit the flag. Canonical IDs / NZ names / aliases / allergen and v1 diet flags live in the pantry seed (`data/ingredients/`).
_Avoid_: token, tag, leftover as the Chip’s name

**Already-cooked**:
A Chip flag for food that is already cooked (leftover rice, cooked chicken). Leftover rice is `{ "name": "rice", "cooked": true }`. It changes the Recipe method and must be highlighted.
_Avoid_: Staple, Swap, leftover as a Recipe kind, a `cooked` boolean on uncooked Chips

**Staple**:
Defaults the Recipe may add if forgotten: water, salt, pepper, oil, butter. At most two per cook. Cooks can **customise staples** on onboarding / Diet settings. The active list is in the prompt.
_Avoid_: Optional extra, shopping item, garnish, milk (when dairy is excluded), treating customise as an unbounded shopping list

**Diet**:
One named set of saved defaults: name, diet flags (vegan / vegetarian / gluten_free), allergies, optional kcal, servings (default 2), optional max minutes, **skill** (three levels), **method** (primary cooking method) and optional **devices** (from devices the Cook owns). A Cook may have many Diets in v1; one is **active** for Generate (Diet switcher on `/pantry`). First login completes **`/onboarding`** (creates Diet #1) before the first Generate. This-run toggles may change flags, servings, time, kcal, skill, method, and devices for one cook; **allergies always win** and cannot be removed or ignored. Each Recipe records which Diet it was cooked for (internal; never shown on public recipe pages).
_Avoid_: Kitchen, Profile, Pantry prefs, account settings, Better Auth user metadata, "chips override Diet", first-run Diet dialog on `/pantry`

**Skill**:
A v1 Diet field with three levels, plus a this-run toggle. It steers technique choice, step detail, parallel steps, and time estimates in Generate.
_Avoid_: difficulty as a Recipe kind, free-text skill, hiding skill only in the prompt with no Diet field

**Method / devices**:
Diet cooking gear. `method` is the primary pick from the closed list fry-pan | saucepan | oven | air-fryer | slow-cooker | pressure-cooker | grill | no-cook. `devices` is optional (same enum, max 3 in the schema); product intent is primary plus a second. See [product.md](./product.md#diet).
_Avoid_: free-text appliances, treating devices as the only method field, inventing gear outside the picklist

**Swap**:
A Chip Llama replaces because it conflicts with an **allergy** (always) or with remaining diet-flag hard constraints after this-run toggles. Swapped Chips are highlighted and never used as-is. Recorded only on Recipes with `kind: "swap"` as `{ from, to }[]`.
_Avoid_: Ignore, tell, required empty swaps array, BaseRecipe vs DietRecipe types, treating allergy conflicts as optional

**kind**:
Discriminant on the Recipe: `"plain"` or `"swap"`. Diet is not a kind. kcal miss is not a kind.
_Avoid_: `_tag`, DietRecipe, OverRecipe, `kind: "over"`

**kcal_over**:
True when estimated kcal per serving exceeds the active Diet or this-run kcal cap. Not token overflow.
_Avoid_: `over`, over budget, over tokens, over time

**Recipe**:
One cookable dish for tonight that fits the Pantry (and constraints on that run). Free-tier recipes **publish to Recent by default**; paid Cooks may opt out (private). Public pages show the recipe only — never profile, Diet, allergies, or medical diets.
_Avoid_: Meal plan, candidate set, post, feed item, markdown blob, “every Generate is always public with no opt-out”

**Saved**:
The Cook’s private list of Recipe ids they kept (per-user Saved DO). Not a copy of the Recipe, not Recent, not a D1 saves list.
_Avoid_: bookmark blob, dual-write of the list, D1 saves table, conflating Saved with publish/opt-out

**Site**:
Public marketing pages. Brochure, not the cooking loop.
_Avoid_: Landing (for the whole Site), home (for the Pantry), Site composer

**Credit**:
One prepaid Generate on a signed-in Cook after the operator Neuron gift is exhausted. Not granted on signup. Charge is **hold, then settle or release** — not debit-before-AI.
_Avoid_: Neuron, Clerk Billing credit, Clerk account credit, Guest try, signup bonus, debit-before-AI

**Cancel**:
The Cook leaves (or stops) Generate before a valid Recipe exists. Refunds Credit / the gift slot only when inference actually stops. Not a Stripe Pack refund. Not a Neuron rebate.
_Avoid_: GPU kill, Neuron refund, abort, resume-on-reconnect

**Pack**:
A one-shot hosted Checkout SKU, priced in NZD, that adds Credits. v1: NZ$8 / $16 / $32 → 20 / 50 / 120 Credits.
_Avoid_: Subscription, Clerk plan, Neuron top-up, USD pack, intl storefront

**Scale**:
On a Recipe detail page, change the person count without a new Generate. Servings and kcal total convert; minutes and steps stay; have/need names do not multiply.
_Avoid_: second Generate, spice-law in the model, scaling cook time

**Onboarding**:
Signed-in `(app)` route **`/onboarding`**. First-run Diet #1, devices owned (time / feasibility), staples customise, and clear copy that free-tier recipes publish to **Recent** by default. Replaces a blocking Diet dialog on `/pantry`.
_Avoid_: onboarding dialog, welcome modal as the only first-run path

**Recent**:
Public `(site)` route **`/recent`**: date-sorted list of **published** recipes (newest first). Short cache, no cron, no ranking. Replaces Popular *recipe* ranking in v1. See [product.md § Recent](./product.md#recent).
_Avoid_: Popular, HN gravity, view/save ranking, weekly snapshot cron, listing private or unpublished recipes

**Try me**:
Curated starter pantries on **`/`** in v1: breakfast, lunch, dinner, and dessert, each with three tiered chip sets (**common**, **moderately common**, **uncommon**; 3–5 NZ-food chips). Tap prefills `/pantry?i=`; the Cook still Generates with their Diet. Static committed list — no counting, no cron. Full lists: [product.md § Try me](./product.md#try-me).
_Avoid_: treating Try me as Recent, Popular recipes, live ingredient ranking in v1, inventing stats or unsupported NZ foods

**Popular** / **Popular ingredients** (v2):
Counted pantry **pairs** and **triples** from Generates over a rolling 7 days (canonical ingredient IDs, distinct-user threshold, weekly cron, KV snapshot, cache/sitemap). Parked for v2. v1 public list is **Recent**; brochure pantry seeds are **Try me** (see [v2.md](./v2.md), [product.md](./product.md#recent)).
_Avoid_: treating counted Popular as a v1 surface, HN gravity, view-count or save-count recipe ranking, ogygia island, per-save rebuild, ranking private documents

**Tool**:
A page tool that calls the same command as a Pantry control (`add_ingredients`, `remove_ingredients`, `make_recipe`, `topup`).
_Avoid_: Hidden API, second product, Llama tool-calling
