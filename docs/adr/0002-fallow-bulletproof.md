# Fallow `bulletproof` for v1 vs v2 features

We will enforce architecture with Fallow’s **`bulletproof`** preset (app / auto-discovered `features/*` / shared / server), with the `app` zone remapped to SvelteKit `src/routes/**`. Sibling features must not import each other. Rejected: `layered` and `hexagonal` (they don’t isolate product features), and `feature-sliced` (six UI layers we don’t have).

**Empty v2 folders now** so v1 screens cannot import them: `src/features/photo/`, `src/features/chat/`, `src/features/billing/`, **`src/features/byo-ai/`**. Each ships a `README.md` (or `.gitkeep` + README) stating “v2 — no v1 imports.” Generate / pantry remotes stay in `app` + `shared` + v1 features only.

**v1 feature:** `src/features/diet/` — create/read the **active** Diet on the per-user **Diet Durable Object** (`getByName(userId)`), not a D1 `diets` row and not `cooks.active_diet_id` on `RECIPES_DB`. Generate RPCs `getActive()` (Site Worker attaches that one row). Multi-Diet picker UI is later **in this same module**; v1 does not ship the picker. [#82](https://github.com/fringe4life/chef-llama/issues/82) round 48.

**v1 shared:** chip canonicalizer in `src/shared/` (string-only; no model). App/pantry remotes import it. `byo-ai` must not.

**v2 `byo-ai` (empty until then):** wrap-encrypted per-Cook keys; Effect `@effect/ai` + official OpenAI / Anthropic / Google adapters. v1 cook stays Alchemy `Workers.AI()` granite (llama-3.3-70b-fp8-fast backup) and **must not** import this folder. [ADR 0016](./0016-byo-ai-keys.md) · [ADR 0031](./0031-granite-valibot-llama-backup.md).

## Proposal (round 33 — not accepted until grill)

Stay **one Kit app** under `src/` with this preset. Fallow documents that **`bulletproof` globs are flat `src/**`** and **do not work** as a Turbo `packages/*` split without **custom zones** ([boundaries](https://fallow.tools/docs/configuration/boundaries/)). Do not introduce `packages/queries` + `packages/ui` for v1 CI cache. [round 33](../../internal/research-round33-reylo-userdo-turbo.md) · [#79](https://github.com/fringe4life/chef-llama/issues/79).

**Account page (round 33b — not accepted until grill):** a session-gated `/account` (spend + packs) lives in **`app`** (`src/routes/(app)/account`). Do **not** fill `src/features/billing/` for that — billing stays the empty v2 slot. [#84](https://github.com/fringe4life/chef-llama/issues/84) · [round 33b](../../internal/research-round33b-dashboard.md).
