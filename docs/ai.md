# AI Generate: model, prompt, Recipe JSON, chips, cancel

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### Model: granite first
- v1 cook = Workers AI **`@cf/ibm-granite/granite-4.0-h-micro`** with an IBM `<schema>` prompt + **Valibot** decode, **no `@effect/ai`**. `stream: true`. **`max_tokens` 768** is the hard cap (granite's default is 256, so set it explicitly).
- If granite's JSON-schema output proves unreliable, a backup model is needed. Which one is Open (below).
- **Why Valibot:** it is much smaller, and the same schemas run in remote-function args, the Recipe decode and `drizzle-orm/valibot`. Size matters for the Worker and the `/pantry` ~43 KB JS budget.
- **Likely future validator: ArkType v3.** Measured **26 Nov 2026** with `arktype@3.0.0-rc.8` and `@ark/aot@3.0.0-rc.8` (npm `next`; `latest` still `2.2.10`). `@ark/aot/unplugin`'s `precompile.vite()` emits standalone validators that import only `arktype/runtime`, avoid runtime `new Function`, and work in workerd. Same Recipe schema ≈ **1.7 KB brotli** (including the Standard Schema interface remote functions need) vs Valibot **1.9 KB** (about **0.3–0.6 KB smaller** per schema). **Why not yet:** still an RC with open compiler bugs; Drizzle ArkType schemas cannot be precompiled (would ship ~90 KB of the full lib, or need hand-written schemas). Revisit when 3.0 is stable and Drizzle schemas precompile. Remote functions take any Standard Schema validator, so a later switch stays contained to `#lib/schemas/*`. **Valibot stays for v1.**
- `@cf/meta/llama-3.1-8b-instruct` is gone; the fp8 8B is removed on **20 Nov 2026**. Nothing in v1 uses it or Effect Schema / Effect `LanguageModel`.
- Call the model through the Alchemy `Cloudflare.Workers.AI()` binding, or `env.AI.run` wrapped in `Effect.tryPromise`. **Do not** route the cook through `@effect/ai` / `@effect/ai-cloudflare`.

### Prompt
- JSON-only output (no markdown, so the App binds `have`/`need`/`steps` without parsing prose). One compact few-shot example. A **tiny staple list** in the prompt (the model has no product meaning for "staple").
- `max_tokens` truncates; it does not make steps short. Conciseness comes from the prompt and the schema: 6–8 one-clause steps of about 80 characters at most, with 768 as the safety net. Measured: a compact minified 8-step swap Recipe is about 120–160 tokens, a "fat" pretty one about 270–360 tokens, so 512 would truncate and 768 is the default.
- Chips with `cooked: true` are sent as cooked. The cook method reheats or assembles them (added late) and never prepares them from raw. Highlight them in have/steps.
- **Skill** (Diet field + this-run toggle) goes into the prompt: it steers **technique choice**, **step detail**, whether steps may run **in parallel**, and **time estimates**.
- **Method / devices** (Diet fields + this-run toggles; devices owned from `/onboarding`) constrain the cook gear and feasibility. Valibot (same as [product.md](./product.md#diet) / [data.md](./data.md)):

  ```ts
  method: v.picklist(['fry-pan','saucepan','oven','air-fryer','slow-cooker','pressure-cooker','grill','no-cook'])
  devices: v.optional(v.pipe(v.array(methodEnum), v.maxLength(3)))
  ```

  Primary `method`, plus optionally a second device (schema allows up to three in `devices`). Steps and `minutes` must fit those devices and the Cook’s time target (publish quality gate in [product.md](./product.md#quality-publish-gates)).
- **Staples** in the prompt come from the Cook’s active staples list (**user-chosen / customisable**, not a fixed app set — see [product.md](./product.md#staples)). The prompt lists each ingredient once (server dedupes pantry chips that resolve to a staple).

### Recipe JSON
- JSON + Valibot. A decode failure → tagged error, no Recipe row, and the Credit hold is **released**. Do not import `effect/Schema` on Generate.
- `kind: "plain" | "swap"` (a tagged union, not optional-key soup).
- Fields: `title` ≤80, `minutes`, `servings`, `kcal`, `kcal_over` (boolean: over the Diet or this run's kcal cap; it is **not** token overflow), `have` ≤16, `need` ≤2 (Staples only), `steps` 6–8, `flags` (≤8, omitted when empty).
- **Publish gates** (moderation / quality) run after a valid decode before a row is listed on Recent — see [product.md](./product.md#moderation-approach). Public HTML never includes Diet / avoid-list / profile fields.
- `swaps: { from, to }[]` is a sibling of `steps`, present **only** on `kind: "swap"`, where it must be non-empty. `kind: "plain"` has **no** `swaps` key (never an empty array). The prompt includes swaps only when a swap happened.
- `have` lists the replacement (`to`), never the forbidden chip. The UI lists swaps above the method and highlights them.
- **Avoid list always wins:** a pantry Chip that matches the Cook’s avoid list (slug/alias or parent expansion) must become a Swap; this-run toggles never drop or ignore avoid entries. Remaining diet-flag conflicts after this-run toggles also Swap. Preference flags such as gluten_free / keto / halal / paleo are short AI rules + label disclaimer, not seed tags. See [product.md](./product.md#diet).
- A Diet is not a `kind`; Diet restrictions show up as `flags`, skill, method/devices, and swaps (see [data.md](./data.md#diet-lives-in-a-durable-object)). Each Recipe records which Diet it was cooked for.

### Chips
- In-process string canonicalizer in `src/shared/`: split, NFKC + lowercase, strip quantities, units and prep adjectives, a tiny closed NZ synonym map, dedupe, max 16 chips. Leftovers become `{ "name": "rice", "cooked": true }`. Sentence-like paste is rejected.
- Synonym map target: the committed NZ pantry seed (`data/ingredients/nz-pantry.json` — slugs, aliases, intrinsic flags, parent links, derived vegan/vegetarian). Wiring the seed into the canonicalizer is still Open in [data.md](./data.md#open); until then the tiny map stands.
- **Dedupe vs staples:** after canonicalization (slug or alias via the NZ pantry seed), a chip that matches one of the Cook’s staples is **not** added to the pantry chip list. UI shows a short inline note (for example “Olive oil is already in your staples”) and clears the input — never blocks or scolds. Autocomplete hides staples or greys them with a **staple** tag. Server dedupes again so the prompt lists each ingredient only once. See [product.md](./product.md#staples).
- No model rewrite, no embedding and no CRF parser for chips in v1. Clairic for sentence-like paste is v2/v3 (see [v2.md](./v2.md)).

### Cancel and pending
- `stream: true` server-side + `request.signal`; a disconnect cancels. Workers AI bills GPU time with no Neuron rebate, and the AI binding's inference cancel needs upstream work, so if an abort lands at about the full 768 tokens there is no Credit/FCFS refund (to be measured).
- Pending UX: see [product.md](./product.md).

### Similar recipes
- After create: Vectorize `recipes` + bge-base (see [data.md](./data.md#kv-queues-vectorize)).

## Open

### Backup model if granite's JSON-schema output is unreliable (researched 16 Nov 2026)
Sources, all fetched **16 Nov 2026 (NZDT)**:
- [JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/) (page "Last updated Sep 14, 2026")
- [Pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) (page "Last updated Nov 12, 2026")
- Model pages and their raw `sync-input.json` schemas: [granite-4.0-h-micro](https://developers.cloudflare.com/workers-ai/models/granite-4.0-h-micro/), [gemma-4-26b-a4b-it](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/), [llama-3.3-70b-instruct-fp8-fast](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/), [glm-4.7-flash](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/), [gpt-oss-20b](https://developers.cloudflare.com/workers-ai/models/gpt-oss-20b/), [qwen3-30b-a3b-fp8](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/), [mistral-small-3.1-24b-instruct](https://developers.cloudflare.com/workers-ai/models/mistral-small-3.1-24b-instruct/)

What the docs say:
- JSON Mode = `response_format: { type: "json_object" | "json_schema", json_schema }`. The JSON Mode page's "Supported Models" list names `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (also llama-3-8b, llama-3.1-8b, hermes-2-pro, deepseek-coder-6.7b, deepseek-r1-distill-qwen-32b), **not granite**.
- Caveats on that page:
  - Workers AI "can't guarantee that the model responds according to the requested JSON Schema". On failure it returns the error `JSON Mode couldn't be met`.
  - "**JSON Mode currently doesn't support streaming.**"
- Granite's own input schema does accept `response_format` (`json_object` / `json_schema`), so JSON Mode is wired for it even though the list omits it. Granite's default `max_tokens` is 256, so set 768 explicitly.

Candidates (neurons per M tokens from the pricing page; per-Generate figure assumes the docs' 250 input / 768 output tokens):

| Model | `response_format` in input schema | Context | Neurons in / out per M | ≈ neurons per Generate | Notes |
|---|---|---|---|---|---|
| granite-4.0-h-micro (current) | `json_object`/`json_schema` | 131k | 1,542 / 10,158 | ≈ 8 | not on the JSON Mode list |
| **gemma-4-26b-a4b-it** | OpenAI-style `json_schema` with `name`, `schema`, **`strict`** | 256k | 9,091 / 27,273 | ≈ 23 | reasoning model; `chat_template_kwargs.enable_thinking` defaults **true**, so set it false or reasoning tokens eat the 768 cap |
| **llama-3.3-70b-instruct-fp8-fast** (earlier documented backup) | `json_object`/`json_schema` | 24k | 26,668 / 204,805 | ≈ 164 | the only candidate on the JSON Mode "Supported Models" list |
| glm-4.7-flash | `json_schema` + `strict` | 131k | 5,500 / 36,400 | ≈ 29 | reasoning on by default (same kwarg) |
| gpt-oss-20b | `json_object`/`json_schema` | 128k | 18,182 / 27,273 | ≈ 25 | reasoning low/medium/high |
| qwen3-30b-a3b-fp8 | `json_object`/`json_schema` | 32k | 4,625 / 30,475 | — | **planned deprecation 11/20/2026**, so rejected |
| mistral-small-3.1-24b-instruct | none in schema | 128k | 31,876 / 50,488 | — | rejected |

**Recommendation:** backup **`@cf/google/gemma-4-26b-a4b-it`**.
- Call it with `response_format: { type: "json_schema", json_schema: { name: "recipe", schema, strict: true } }` and `chat_template_kwargs: { enable_thinking: false }`, then decode with Valibot as usual.
- Why: its schema exposes `strict`, it has a 256k context and no deprecation notice, and it costs ≈ 23 neurons per Generate (about 3× granite, about 7× cheaper than the 70B).
- **Alternate:** keep **`@cf/meta/llama-3.3-70b-instruct-fp8-fast`** (the earlier documented backup). It's the only one on Cloudflare's JSON Mode supported list, but it costs ≈ 164 neurons per Generate and has a 24k context.
- Cost context: the free 10k neurons/day ≈ 1,200 granite Generates, ≈ 430 gemma-4, or ≈ 60 llama-3.3-70b (arithmetic from the table; not measured).
- Trigger (proposed): fall back once per request on a granite Valibot decode failure or `JSON Mode couldn't be met`. The Credit hold stays open until the fallback settles or releases.
- **Must be probed before it's locked.** gemma-4 is not on the JSON Mode list, so run a box probe of both models with the real Recipe schema.

### Other open items
- Pick the backup model: gemma-4-26b-a4b-it (recommended) or llama-3.3-70b-instruct-fp8-fast (alternate), after a JSON probe with the real Recipe schema. Only needed if granite's JSON-schema output is unreliable.
- **Streaming vs JSON Mode:** Cloudflare's JSON Mode page says JSON Mode doesn't support streaming. Options: prompt-only `<schema>` + stream + Valibot, or non-streamed JSON Mode (which loses the disconnect-cancel saving). Needs a probe and a decision.
- Cook test seam without `@effect/ai`: the shape of the port / fixture adapter around `env.AI.run` (see [tests.md](./tests.md)).
- Probe Neurons spent on abort before setting refund rules.
- `max_tokens` 768 truncation behaviour on fat 8-step JSON (1024 if the prompt cannot constrain step length).
