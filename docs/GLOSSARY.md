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
One canonical pantry ingredient. May carry `cooked: true` when already cooked; uncooked Chips omit the flag.
_Avoid_: token, tag, leftover as the Chip’s name

**Already-cooked**:
A Chip flag for food that is already cooked (leftover rice, cooked chicken). Leftover rice is `{ "name": "rice", "cooked": true }`. It changes the Recipe method and must be highlighted.
_Avoid_: Staple, Swap, leftover as a Recipe kind, a `cooked` boolean on uncooked Chips

**Staple**:
A closed list the Recipe may add if forgotten: water, salt, pepper, oil, butter. At most two. The list is in the prompt.
_Avoid_: Optional extra, shopping item, garnish, milk (when dairy is excluded)

**Diet**:
One named set of saved defaults: name, diet flags (vegan / vegetarian / gluten_free), allergies, optional kcal, servings (default 2), optional max minutes. A Cook may have many Diets in v1; one is **active** for Generate (Diet switcher on `/pantry`). First login creates Diet #1 before the first Generate. This-run toggles may change flags, servings, time, and kcal for one cook; **allergies always win** and cannot be removed or ignored. Each Recipe records which Diet it was cooked for.
_Avoid_: Kitchen, Profile, Pantry prefs, account settings, Better Auth user metadata, "chips override Diet"

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
One cookable dish for tonight that fits the Pantry (and constraints on that run). v1 Recipes are public-by-URL; a private Recipe store is later.
_Avoid_: Meal plan, candidate set, post, feed item, markdown blob, private document in v1

**Saved**:
The Cook’s private list of Recipe ids they kept (per-user Saved DO). Not a copy of the Recipe, not a private Recipe store, not a visibility picker, not a D1 saves list.
_Avoid_: bookmark blob, dual-write of the list, private recipe store, D1 saves table

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

**Popular**:
Public Recipes on `/` (top 5) and `/popular`. v1: rolling 7-day saves of public-by-URL rows, cap 20, ≥5 distinct savers, cron KV snapshot, not anonymous views. How those saves are counted (bare `save_count` vs a 7-day saver ledger) is **open**.
_Avoid_: HN gravity, view-count ranking, ogygia island, per-save rebuild, ranking private documents, assuming a bare `save_count` is enough

**Tool**:
A page tool that calls the same command as a Pantry control (`add_ingredients`, `remove_ingredients`, `make_recipe`, `topup`).
_Avoid_: Hidden API, second product, Llama tool-calling
