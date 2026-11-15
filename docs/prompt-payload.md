# Chef Llama prompt + payload (research)

Primary sources. Pointer from [`product.md`](./product.md). Issues: [#15](https://github.com/fringe4life/chef-llama/issues/15), [#16](https://github.com/fringe4life/chef-llama/issues/16), leftover emit [#47](https://github.com/fringe4life/chef-llama/issues/47). Researched **24 Oct 2026**.

## Staple

Meta/Cloudflare docs do **not** define a cooking Staple. Pass `extras: water,salt,pepper,oil,butter` in the prompt (~10 tokens). Do not explain the word.

## JSON Mode vs live catalog

[Workers AI JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/) (14 Sep 2026): `response_format.type` = `json_object` | `json_schema`. Not streaming. Failure: `JSON Mode couldn't be met`. [CF docs #27786](https://github.com/cloudflare/cloudflare-docs/issues/27786): that page has listed models that **do not** support JSON Mode.

**Supported list vs catalog (this date):**

| JSON Mode page id | Catalog |
|---|---|
| `@cf/meta/llama-3.1-8b-instruct` | **Gone** (“deprecated, removed, or not found”) |
| `@cf/meta/llama-3-8b-instruct` | **Gone** |
| `@hf/nousresearch/hermes-2-pro-mistral-7b` | Not in live catalog fetch |
| `@hf/thebloke/deepseek-coder-6.7b-instruct-awq` | Not in live catalog fetch |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Live. **$0.293 / $2.253** per M. Default `max_tokens` **256**. |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | Live. **$0.497 / $4.881** per M. Default `max_tokens` **256**. Reasoning. |

**Cheap cook models (not on JSON Mode list):**

| Id | $ in / out per M | Notes |
|---|---|---|
| `@cf/meta/llama-3.1-8b-instruct-fp8` | **0.152 / 0.287** | Live 8B. `response_format` slot; **output `response` is string**. Default `max_tokens` **256**. |
| `@cf/meta/llama-3.2-3b-instruct` | **0.051 / 0.335** | Cheaper input, weaker cook, same 256 default, not JSON-listed. |
| `@cf/zai-org/glm-4.7-flash` | **0.060 / 0.40** | Function calling; `response_format` one-of; **not** on JSON Mode list. |

There is **no** cheap hosted Llama that Cloudflare currently documents as JSON Mode **and** keeps in the catalog. 70B-fast output is ~**8×** fp8; r1 output is ~**17×**. Stay on **fp8**.

Pricing and 10k Neurons/day (both Free and Paid; Paid is $0.011 / 1k Neurons after the gift): [Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) (20 Oct 2026).

## Contract: JSON + Valibot

Browser/Recipe row wants a **`kind` union**: shared `{ title, minutes, servings, kcal, kcal_over, have, need, steps }` plus `"plain"` (no `swaps`) or `"swap"` (required `swaps`). `flags` omitted if none. Markdown needs a parser. JSON Mode is **not** the enforcement on granite (list does not name it; JSON Mode **no streaming**). Backup `@cf/meta/llama-3.3-70b-instruct-fp8-fast` **is** on the JSON Mode list but the paid path still uses **`stream: true`** + Valibot ([ADR 0031](./adr/0031-granite-valibot-llama-backup.md)).

**Path:**

1. Tight prompt; IBM **`<schema>` in the system prompt** for granite ([round 43](../internal/research-round43-granite-slop-eslint.md)). “JSON only” on the user turn.
2. Worker consumes `stream: true` SSE, then `JSON.parse` (strip a fence if present).
3. **Valibot** `v.parse` / `v.safeParse` of `RecipePayload` (Standard Schema; same library as Kit remotes).
4. Optional **offline** CF `response_format: json_schema` spike on a **non-stream** probe only — do not turn off stream on the paid cook.

Decode fail → tagged error, no Recipe row, **release** the Credit hold. Do **not** import `effect/Schema` on Generate.

Do **not** route Llama through `@effect/ai-cloudflare` (Clef REST, not `env.AI.run`).

## Tight prompt

System (sketch):

```
Tonight from pantry. extras: water,salt,pepper,oil,butter. need≤2.
Already-cooked chips (rice, chicken, …) are leftover/cooked — do not treat as raw; highlight those have/steps.
JSON only, no preamble. kind=plain or kind=swap. Swap pantry that breaks diet/allergy; kind=swap only if you swapped.
steps: 6–8 items, one short clause each.
```

Few-shot: one **compact** 8-step object (round-14 compact sample). Meta: few-shot of the desired shape ([prompting](https://dev.meta.ai/llama/docs/how-to-guides/prompting)).

User: chips as objects + active Diet + this-run overrides (`veg` `gf` `kcal:500` `n:2` `t:30`) + “JSON only” if JSON Mode is off. Leftover rice is `{ "name": "rice", "cooked": true }`; leftover chicken the same; uncooked chips omit `cooked`. Already-cooked pantry changes the method (reheat/assemble, not boil raw rice / roast raw chicken) and must stay highlighted.

**Generate vs chat:** Meta: 8B cannot reliably mix conversation with tool-calling. `make_recipe` is a zero-shot JSON turn. WebMCP tools call **our** remotes; do not put Llama tool JSON on the same turn as pantry chat.

| Field | Meaning |
|---|---|
| `title` | Recipe name. **≤ 80** chars |
| `minutes` | Estimated minutes |
| `servings` | Scaled count |
| `kcal` | Estimated kcal / serving |
| `kcal_over` | true if over the active Diet/this-run **kcal** cap. Not `max_tokens`. |
| `have` | Pantry items used. **≤ 16** |
| `need` | Staples only, length ≤ 2 |
| `steps` | Method as string array. **min 6, max 8**; each step one short clause (~80 chars) |
| `flags` | Applied constraints. **≤ 8**. **Omit** if none (not `[]`). |
| `kind` | `"plain"` \| `"swap"`. Discriminant. Not `_tag`. |
| `swaps` | **Only** when `kind: "swap"`. Non-empty `{ from, to }[]`. `have` uses `to`. |

## `kind` union (not optionalKey soup)

Diet is the active Diet + `flags`, not a third variant. `kcal_over` is a boolean on the shared fields, not `kind: "over"`. Token overflow is Schema fail, not this flag.

```json
{ "kind": "plain", "title": "…", "steps": ["…"] }
{ "kind": "swap", "title": "…", "steps": ["…"], "swaps": [{ "from": "chicken", "to": "tofu" }] }
```

Valibot (Kit [remote functions](https://svelte.dev/docs/kit/remote-functions) Standard Schema samples):

```ts
import * as v from "valibot";

const SwapPair = v.object({ from: v.string(), to: v.string() });
const Base = {
  title: v.pipe(v.string(), v.maxLength(80)),
  minutes: v.number(),
  servings: v.number(),
  kcal: v.number(),
  kcal_over: v.boolean(),
  have: v.pipe(v.array(v.string()), v.maxLength(16)),
  need: v.pipe(v.array(v.string()), v.maxLength(2)),
  steps: v.pipe(
    v.array(v.pipe(v.string(), v.maxLength(80))),
    v.minLength(6),
    v.maxLength(8),
  ),
  flags: v.optional(v.pipe(v.array(v.string()), v.maxLength(8))),
};
const Plain = v.object({ kind: v.literal("plain"), ...Base });
const Swapped = v.object({
  kind: v.literal("swap"),
  ...Base,
  swaps: v.pipe(v.array(SwapPair), v.minLength(1)),
});
const RecipePayload = v.variant("kind", [Plain, Swapped]);
```

**Chips (input, not Recipe JSON):** leftover emit locked round 49 Q2. Uncooked omit `cooked`. Not a Staple, Swap, or Recipe `kind`. Same objects go in the user turn.

```json
[{ "name": "rice", "cooked": true }, { "name": "peas" }, { "name": "soy" }]
```

```ts
const Chip = v.object({
  name: v.string(),
  cooked: v.optional(v.literal(true)),
});
```

Prompt: `kind=plain or kind=swap. If you swapped, kind=swap and list swaps as {from,to}; never empty swaps.` UI `.match`s on `kind`. Do not ask Llama for `_tag`.

Set **`max_tokens` explicitly** to **768** (256 default truncates; 512 is tight on fat pretty). That number is a **hard cap** (truncation → Valibot fail → **release** the Credit hold), not a brevity dial. Shape length with the prompt + few-shot + Valibot bounds: **steps 6–8**, **title ≤ 80**, **have ≤ 16**, **flags ≤ 8**. [round 15](../internal/research-round15-concise-secrets-ci.md) · [round 45](../internal/research-round45-valibot-drizzle-dos.md) · [#50](https://github.com/fringe4life/chef-llama/issues/50). Keep readable keys until #15 measures minified names.
