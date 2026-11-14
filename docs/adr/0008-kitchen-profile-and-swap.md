# Diet defaults plus Swap, not ignore

**Status:** accepted (round 6 Q3 yes; round 7 fold; **Kitchen renamed Diet** round 12)

Persist **Diet** rows (diet flags, allergies, default kcal, servings). **Required** before the first Generate: first login → Diet #1 + `active_diet_id`. Per-generate chips **override that run**. Scenario: active Diet vegan, chips include chicken — Generate still runs; Chef Llama **swaps** and may record `swaps` as `{ from, to }[]` **sibling of `steps`**. The key is **optional** in Schema (omit when none — not a required `[]`). `have` lists the replacement. Rejected: skippable Diet; ignore-and-tell; chips-only with no Diet; auth-provider user metadata; **Kitchen** as the name; **Profile** (auth collision); **Pantry prefs** (Pantry is chips).

**Storage (array-ready):** sibling per-user **Diet DO** (`getByName(userId)`), multiple Diet rows + `active_diet_id`. Generate Worker RPCs **`getActive()`** then attaches that row on the Workers AI request — not a JSON `profiles[]` on the Cook row, not the Credit DO, not global D1. Storage location supersedes the old D1 `diets` table ([ADR 0030](./0030-per-user-credit-dos.md)). v1 UI creates one Diet via a **blocking dialog/sheet on `/pantry`**. Multi-Diet picker is **v2 UI** in `src/features/diet/`. No `/kitchen`.

**Surface:** dialog **suffices** for v1 onboarding. Account popover can edit the active Diet. Bookmarkable `/diet` only if edit needs a URL later.

**First-run fields (round 17 Q1 yes):** `name` (default **"Home"**); `flags[]` closed `vegan` \| `vegetarian` \| `gluten_free` (hard; empty OK); `allergies` chips via the same canonicalizer, max 16 (hard; empty OK); optional `kcal` (target → `kcal_over`); `servings` 1–12 **default 2**; optional `max_minutes` (target, no overtime `kind`). No keto/halal/paleo in v1. [round 16](../../internal/research-round16-jev-secrets-fonts-diet-stripe.md).
