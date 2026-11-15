# Chef Llama tech stack

**Default:** SvelteKit 3 on **Cloudflare Workers** (not Pages-legacy), provisioned with **Alchemy v2 beta** (`Cloudflare.Website.SvelteKit`, **`cache: { enabled: true }`**), domain logic in **Effect v4**, auth with **Better Auth** on D1 (first-party SvelteKit, Drizzle adapter, custom `/sign-in`), prepaid credits via **Stripe Checkout hosted NZD (you are MoR) → Durable Object ledger**, public pages **0-JS Kit** (`csr=false`; ogygia **dropped** — [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)), styling via **StyleX `--` shadcn token names** resolved with CSS `light-dark()` only (no `.dark`, no component pack, no `mode-watcher`; theme script in `app.html`), fonts via **Fontsource** + Kit `preload`.

**Fallback:** `@sveltejs/adapter-cloudflare` + `wrangler.jsonc` if Alchemy’s Kit adapter misbehaves. Auth fallbacks (not v1): WorkOS AuthKit, DIY Oslo+arctic — rejected in [ADR 0036](./adr/0036-better-auth-on-d1.md).

Evidence is as of **21 Oct 2026**. Svelte MCP was not available in this environment; SvelteKit facts are from [svelte.dev/docs/kit](https://svelte.dev/docs/kit/adapter-cloudflare) and [Migrating to SvelteKit v3](https://svelte.dev/docs/kit/migrating-to-sveltekit-3). Cloudflare facts are from [Cloudflare Docs](https://developers.cloudflare.com/).

---

## Recommended stack (pin these)

| Layer | Default | Fallback |
|---|---|---|
| App | SvelteKit **3** + Svelte 5, Vite 8 / Rolldown, Node ≥ 22.17, TypeScript 6 | Stay on latest Kit 2 only if Alchemy cannot follow Kit 3 (product requirement is v3 — treat Kit 2 as a temporary unblock, not the target) |
| Deploy | Alchemy **2.0.0-beta.83+** `Cloudflare.Website.SvelteKit` → Workers Static Assets | Official `@sveltejs/adapter-cloudflare` **8.x** + Wrangler **≥ 4.118** (`main`: `.svelte-kit/cloudflare/_worker.js`) |
| IaC | Alchemy v2 `Alchemy.Stack` + Effect generators | Wrangler-only `wrangler.jsonc` (lose typed bind/deploy of queues, DOs, Vectorize) |
| Errors / domain | Effect **v4** (`Data.TaggedError`, `Effect.tryPromise`, `catchTag`) | Typed `Result` unions only if Effect + Alchemy runtime coupling is too heavy in SvelteKit loaders |
| Auth | **Better Auth** first-party SvelteKit on **AUTH_DB** (Drizzle adapter, `svelteKitHandler`, `nodejs_compat`). Opaque D1 sessions, sliding 7-day, server-read. Custom `/sign-in`. v1: Google, Apple, email OTP, Facebook | Not Clerk (fees + 60s JWT). Not WorkOS AuthKit. Not DIY Oslo+arctic. Not Lucia. Not OpenAuth as the session SDK. Not Auth.js first. [ADR 0036](./adr/0036-better-auth-on-d1.md) |
| Payments | **v1:** Alchemy Stripe Checkout **hosted** `mode: payment` **NZD only** (you are MoR; NZ 2.65% + NZ$0.30 domestic) → Credit DO. **No Stripe.js**. Tax: Dashboard alerts on, Checkout `automatic_tax` **off** until GST-registered | Never Polar / Clerk Billing / Paddle.js / Managed Payments / intl storefront for v1 packs. Later Stripe `mode: subscription` → **same DO** |
| AI | Workers AI **`@cf/ibm-granite/granite-4.0-h-micro`** + IBM `<schema>` + **Valibot**. Backup **`@cf/meta/llama-3.3-70b-instruct-fp8-fast`**. `stream: true`. `max_tokens` **768**. fp8 410 **20 Nov 2026**. v2 BYO keys: empty `src/features/byo-ai/` | JSON Mode list names 70b-fast, **not** granite, and **forbids streaming**. Do **not** import `byo-ai` from v1 Generate. [ADR 0031](./adr/0031-granite-valibot-llama-backup.md) |
| Recipe parse | **Valibot** Standard Schema on the Worker (same lib as Kit remotes) | `JSON.parse` only is insufficient; tagged Valibot fail → no row, refund Credit. Not `effect/Schema` |
| Embeddings | `@cf/baai/bge-base-en-v1.5` (768-d) into Vectorize | `bge-small-en-v1.5` (384-d) if index cost bites |
| UI tokens | StyleX `defineVars` with **`--` prefixed shadcn token names**. Colors via `light-dark()` only + `html[data-colorscheme]` / `:has(#scheme-*:checked)` | Drop StyleX; keep the **same** `--` variables in CSS. **No** `.dark` fallback |
| Fonts | Fontsource **variable** packages **pinned** (Kombai picks families); Vite SHA-256 of woff2 **bytes**; Kit `preload` one body `.woff2`. Not Astro Fonts API | System stacks in `design.md` until families chosen |
| Overlays | Native `<dialog>`, Popover API; CSS anchor positioning with `@oddbird/css-anchor-positioning` when unsupported | floating-ui only if a11y gaps appear. **No** shadcn / shadcn-svelte / bits-ui components |
| Lint | **ESLint 10+** (flat `eslint.config.js`) + **Fallow** (project graph). Plugins: `eslint-plugin-svelte` (Svelte **and** Kit), `@stylexjs/eslint-plugin`, `@effect/eslint-plugin` (barrels only), **`eslint-plugin-slop`** `createSlopConfig()` (`*.{ts,js}` first), **local `chef/`** (`no-raw-cache-headers`, `public-route-purity`, `public-csr-false` — not Oxlint). MCP: `@eslint/mcp` + `fallow-mcp` | Do not swap ESLint for oxlint/Biome. Not `@antfu/eslint-config`. If `@effect/eslint-plugin` peers refuse ESLint 10, keep the plugin via override or drop it until peers bump — do **not** replace it with oxlint Effect plugins |

Do **not** use `adapter-cloudflare-workers` or Workers Sites. Cloudflare’s current SvelteKit guide deploys Workers + Static Assets ([docs, updated 10 Oct 2026](https://developers.cloudflare.com/workers/framework-guides/web-apps/sveltekit/)).

---

## SvelteKit v3 on Cloudflare Workers

**Default path:** Alchemy `Cloudflare.Website.SvelteKit` ([Alchemy SvelteKit](https://alchemy.run/cloudflare/frontend/sveltekit/)). It builds with Kit’s Vite pipeline, injects a wrangler-free Cloudflare adapter, deploys client/prerendered files as Worker static assets, and always adds `nodejs_compat`. Do **not** install `@sveltejs/adapter-cloudflare` or add `wrangler.jsonc` on this path — Alchemy replaces a declared adapter with a warning.

```ts
// alchemy.run.ts
import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Effect from "effect/Effect";

export const Cache = Cloudflare.KV.Namespace("Cache");
export const Website = Cloudflare.Website.SvelteKit("Website", {
  env: { CACHE: Cache },
  cache: { enabled: true },
});
export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>;

export default Alchemy.Stack(
  "ChefLlama",
  { providers: Cloudflare.providers(), state: Cloudflare.state() },
  Effect.gen(function* () {
    const site = yield* Website;
    return { url: site.url };
  }),
);
```

Install `@alchemy.run/frontend-frameworks` as a **dev** dependency (loaded at deploy). Deploy: `alchemy deploy`. Local: `alchemy dev` (Vite HMR + proxied bindings on `platform.env`).

**Wrangler fallback:** [`adapter-cloudflare`](https://svelte.dev/docs/kit/adapter-cloudflare) (v8 requires Kit 3, Wrangler ≥ 4.118 per [adapter changelog](https://github.com/sveltejs/kit/blob/main/packages/adapter-cloudflare/CHANGELOG.md)):

```jsonc
{
  "name": "chef-llama",
  "main": ".svelte-kit/cloudflare/_worker.js",
  "compatibility_flags": ["nodejs_compat"],
  "compatibility_date": "2026-10-21",
  "assets": { "binding": "ASSETS", "directory": ".svelte-kit/cloudflare" }
}
```

First Wrangler autoconfig deploy can fail with `Types file not found at worker-configuration.d.ts` — run `npx wrangler types` then deploy again ([CF SvelteKit guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/sveltekit/)).

### Kit 3 gotchas (do not skip)

- **No `svelte.config.js`.** Kit options live in `sveltekit({...})` inside `vite.config.ts` ([migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)).
- **Mins:** Node 22.17, TypeScript 6, Svelte 5.57.1, Vite 8.0.12, `@sveltejs/vite-plugin-svelte` v7.
- **Official adapter:** `platform.env` / `platform.context` are gone. Use `import { env, waitUntil } from 'cloudflare:workers'`; `cf` is on `Request`; `caches` is global ([migration · adapter-cloudflare](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)). Alchemy’s injected adapter still documents **`platform.env`** — type `App.Platform.env` from `Cloudflare.InferEnv` and stick to that on the Alchemy path.
- Adapter 8 **removed Cloudflare Cache API usage** in favor of [Workers Caching](https://developers.cloudflare.com/workers/cache/).
- Official adapter: **Durable Object / Workflow classes are not currently supported** from the SvelteKit worker in local emulation ([adapter docs](https://svelte.dev/docs/kit/adapter-cloudflare)). Put DO classes and queue consumers on a **second Worker**.
- No `fs`. Worker size after minify is a real limit — keep Better Auth/Stripe/Effect on the server graph, UI kits on the client. Better Auth ~140–170 KiB gzip; watch 1s startup.
- `/functions` at repo root is ignored; use SvelteKit server routes.

### Experimental remote functions + `<svelte:boundary>` (locked for this product)

**We will use** SvelteKit v3 **experimental remote functions**. They are **not stable** and **not semver** — “breaking changes or removal can happen in any release.” Opt in in `vite.config.ts` (no `svelte.config.js` in Kit 3):

- `compilerOptions.experimental.async: true`
- `experimental.remoteFunctions: true`

Sources: [Remote functions](https://svelte.dev/docs/kit/remote-functions), [Migrating to SvelteKit v3](https://svelte.dev/docs/kit/migrating-to-sveltekit-3), [SvelteKit 3 announcement](https://svelte.dev/blog/sveltekit-3-is-here) (“not quite ready”). `.remote.ts` modules always run on the server. Generate / debit / remaining Credits / Diet save should be `query` / `command` (or `form`) here, not ad-hoc `+server` unless a webhook (Stripe).

**`<svelte:boundary>`** ([Svelte 5.3+](https://svelte.dev/docs/svelte/svelte-boundary)): wall off `await`, show `{#snippet pending()}`, `{#snippet failed(error, reset)}`, optional `onerror`. Pending snippet is **SSR placeholder** for first resolve; later async uses `$effect.pending()`. Event-handler errors are **not** caught. Generate pending: pantry boundary + **SVG only** v1; [`query.live`](https://svelte.dev/docs/kit/remote-functions) / SSE phases **v2** ([ADR 0024](./adr/0024-cook-pending-pantry.md)).

**Optimistic UI:** remote `query.withOverride` passed into `command`/`form` `.updates(...)` ([`$app/server` RemoteQuery](https://svelte.dev/docs/kit/$app-server)). If the mutation fails, the override releases. Use this for Credits pill so Kombai can design pending / failed / optimistic, plus a **lazy WebMCP polyfill** boundary (pending while the chunk loads, failed if import throws).

Route groups [`(name)`](https://svelte.dev/docs/kit/advanced-routing) share a layout **without** appearing in the URL. Use `(app)` for the **signed-in** credits-pill layout (`/pantry` `/saved` `/account`). **`(static)`** (about, pricing, how-to, legal) and **`(site)`** (`/` `/popular` `/popular/[type]` `/recipes/[id]`) stay **outside** `(app)` so they never run `getSession` or `Set-Cookie`. Public layouts **never import auth**. Shared `Nav.svelte` is a plain Sign in link. Auth also on `/sign-in`, `/api/auth/*`, remotes that need a Cook. **No `/chef` prefix.** No Guest-tries remaining. Kit 3 param matchers: one `src/params.ts` loaded by **plain Node at build**, **no `#lib` imports**; `POPULAR_TYPES` in a dependency-free module ([ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)).

---

## Alchemy v2 beta vs wrangler-only

**Alchemy is the right IaC** for this product: one TypeScript/Effect program declares Workers, bindings, and (optionally) Effect-typed runtime clients. npm `alchemy@2.0.0-beta.83` (12 Oct 2026) is Cloudflare Birthday Week + Effect 4 (`@effect/sql-d1`, `@effect/sql-sqlite-do`) ([npm](https://www.npmjs.com/package/alchemy), [beta.83 notes](https://alchemy.run/blog/2026-10-12-beta-83/)). Wrangler remains the Cloudflare compiler; Alchemy **owns** resource graph and deploy. Wrangler-only is the fallback when Alchemy’s SvelteKit resource lags Kit 3.

**Declare / bind / deploy:**

1. Resources as module-level `Cloudflare.*` values (`KV.Namespace`, `R2.Bucket`, `D1`, Vectorize, Queue, Durable Object namespace, `Website.SvelteKit` / `Worker`).
2. Bind with `env: { Cache, AI, Recipes, … }` on the Worker **or** Effect-style `yield* Cloudflare.R2.ReadWriteBucket(Uploads)` + `Effect.provide(...Binding)` ([Workers](https://alchemy.run/cloudflare/compute/workers/), [v2 migration](https://v2.alchemy.run/guides/migrating-from-v1/)).
3. `export default Alchemy.Stack("ChefLlama", { providers: Cloudflare.providers(), state: Cloudflare.state() }, Effect.gen(...))`.
4. `alchemy deploy`. Adopt existing CF resources with `alchemy deploy --adopt` (v1 state is incompatible). Pin **≥ beta.82** everywhere before the first DO `exports` deploy — that switch is one-way ([beta.83](https://alchemy.run/blog/2026-10-12-beta-83/)).

v2 is **beta**: expect breaking changes. Do not mix v1 `await alchemy()` / `finalize()` with v2 stacks.

---

## Effect v4

Errors are a typed channel: `Effect<Success, Error, Requirements>`. Domain failures are `Data.TaggedError` classes; recover with `Effect.catchTag` / `catchTags` ([Expected errors](https://effect.website/docs/v4/error-management/expected-errors), [Yieldable errors](https://effect.website/docs/v4/error-management/yieldable-errors)).

```ts
import { Data, Effect } from "effect";

class InsufficientCredits extends Data.TaggedError("InsufficientCredits")<{
  readonly userId: string;
  readonly need: number;
}> {}
class AiInferenceError extends Data.TaggedError("AiInferenceError")<{
  readonly cause: string;
}> {}
class PaymentError extends Data.TaggedError("PaymentError")<{
  readonly cause: string;
}> {}

const runAi = (env: { AI: Ai }, prompt: string) =>
  Effect.tryPromise({
    try: () =>
      env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
        messages: [{ role: "user", content: prompt }],
      }),
    catch: (e) => new AiInferenceError({ cause: String(e) }),
  });

const charge = (credits: CreditStub, n: number) =>
  Effect.tryPromise({
    try: () => credits.debit(n),
    catch: (e) => new InsufficientCredits({ userId: "…", need: n }),
  });
```

Map HTTP in SvelteKit actions: `InsufficientCredits` → 402, `AiInferenceError` → 503, Stripe `PaymentError` → 502. Wrap **binding calls** (`env.AI.run`, `VECTORIZE.query`, `QUEUE.send`, DO RPC) with `tryPromise` so failures stay tagged — don’t `await` them raw in loaders. Alchemy’s Cloudflare clients already surface tags like `R2Error` ([Alchemy Workers](https://alchemy.run/cloudflare/compute/workers/)).

Keep Effect at the **server/domain** boundary (actions, remote functions, queue consumer, DO RPC wrappers). Don’t drag Effect into every `.svelte` file. **StyleX has no Effect integration** — tokens stay CSS/`defineVars`; do not wrap StyleX in Effect layers.

### Effect AI packages vs Workers (24 Oct 2026)

Effect is the IaC/runtime substrate (Alchemy v2) **and** a typed error channel — not “errors only.” AI-specific packages are a **separate** layer:

| Piece | What it is | Workers? |
|---|---|---|
| [`@effect/ai`](https://effect.website/docs/ai/introduction/) `LanguageModel` | Provider-agnostic generate/stream/tools | Runs anywhere you can provide `HttpClient`. Official adapters: OpenAI, Anthropic, Bedrock, Google. **No Workers AI adapter** in that list. |
| Effect v4 `LanguageModel` | Same idea at [`effect/unstable/ai/LanguageModel`](https://effect.website/docs/v4/api/effect/unstable/ai/LanguageModel) | Marked **unstable**. |
| [`@effect/ai-cloudflare`](https://effect.website/docs/v4/api/ai-cloudflare/CloudflareClient) | **Clef / Clef-flash `DecisionModel`** over **REST** (account id + API token). Not Llama chat. | Docs label **unstable**. No automatic retries. This is **not** `env.AI.run` for `@cf/meta/llama-3.1-8b-instruct-fp8`. |
| Alchemy [`Cloudflare.Workers.AI()`](https://alchemy.run/cloudflare/ai/workers-ai) | Binding + Effect `run` / `models` with `WorkersAIError` | **Yes — this is the Workers path.** Uses the native AI binding, not Node `HttpClient`. |

**Default for Generate:** Alchemy Workers AI binding (or `env.AI.run` + `Effect.tryPromise`). Do **not** route Llama through `@effect/ai-openai` or `@effect/ai-cloudflare`. v2 BYO lives in empty `src/features/byo-ai/` and **then** uses `@effect/ai` + official OpenAI / Anthropic / Google adapters (Groq unofficial). Rough edges: unstable Effect AI APIs; Clef package looks like “Effect on Cloudflare AI” but is the wrong product; `@effect/ai` samples use `NodeHttpClient` which is **not** workerd.

---

## Bindings map

| Need | Primary | Why | Fallback |
|---|---|---|---|
| Recipe agent (cheap, non-frontier) | Workers AI **`@cf/ibm-granite/granite-4.0-h-micro`** via `ai.binding = "AI"` then **Valibot** decode | **$0.017 / $0.112 per M**, 131k context, `stream: true` SSE ([model](https://developers.cloudflare.com/workers-ai/models/granite-4.0-h-micro/)). Default `max_tokens` **256** — set **768**. JSON Mode list **does not name granite**. fp8 8B 410 **20 Nov 2026**. | Backup **`@cf/meta/llama-3.3-70b-instruct-fp8-fast`** **$0.293 / $2.253** per M (capacity/fail only). Do not default-pay 70b-fast. |
| Diet prefs | Sibling **Diet DO** `getByName(userId)` + `getActive()` | One-row Generate RPC from the Site Worker; not JSON on the Cook row; not the Credit ledger; not Better Auth user metadata; not `RECIPES_DB`. Profiles are **not** D1-queued against recipe writes. | **Required** before first Generate; chips override that run only. Multi-Diet picker is v2 UI |
| Saved ids | Sibling **Saved DO** `getByName(userId)` | Private **id list** pointing at public `RECIPES_DB` rows. Not a blob copy, not a private Recipe store ([ADR 0030](./adr/0030-per-user-credit-dos.md) · [ADR 0032](./adr/0032-public-by-url-recipes.md)) | `/saved` signed-in list. Popular counts save events of those public rows, not the Cook’s list |
| Operator Generate cap | **KV** daily counter (UTC) | Bounds FCFS signups against the **10k Neurons/day** gift ([pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/)) | Fail Generate with a Site-wide exhausted copy when the cap hits |
| Similar recipes **after create** | **Vectorize** index `recipes` (768-d, cosine) + **D1** `recipes` table as source of truth | Vector search is Vectorize’s job ([storage options](https://developers.cloudflare.com/workers/platform/storage-options/), [embeddings tutorial](https://developers.cloudflare.com/vectorize/get-started/embeddings/)). KV cannot do ANN. D1 hydrates hits (title, ingredients, slug). | Skip Vectorize until >~hundreds of recipes: D1 `LIKE` / ingredient overlap. R2 only for blobs, not similarity |
| Popular-recipe cache | **KV** `POPULAR` (`popular:all`, `popular:{type}`, `popular:hashes`) | Cron snapshot, not per-save ([ADR 0034](./adr/0034-popular-cap-cache.md)). Rank **rolling 7-day saves of public-by-URL Recipe rows**, cap 20, ≥5 distinct savers ([ADR 0023](./adr/0023-popular-saves-window.md) · [ADR 0032](./adr/0032-public-by-url-recipes.md)). Min `cacheTtl` is 30s ([changelog](https://developers.cloudflare.com/changelog/post/2026-01-30-kv-reduced-minimum-cachettl/)). | [Workers Caching](https://developers.cloudflare.com/workers/cache/) via **`publicCache` only** — default `private, no-store` ([caching.md](./caching.md) · [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)). Do **not** use the old Cache API (adapter 8 dropped it; Cache API is colo-local/ephemeral) |
| Background jobs | **Queues** producer on the site Worker; **consumer on a Jobs Worker** | Guaranteed delivery, retries, batching ([Queues](https://developers.cloudflare.com/queues/get-started/)) | `waitUntil` for tiny fire-and-forget only; Workflows if a job needs multi-step durable orchestration |
| User credits | **SQLite Durable Object** `CreditAccount`, `getByName(userId)` + **sibling per-user DOs** | Strongly consistent ledger **plus materialized** remaining / pack_sum / history so `/account` never scans global D1 ([DO storage](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/), [rules](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/), [ADR 0030](./adr/0030-per-user-credit-dos.md)) | Never KV for balances. Public recipes stay D1. |
| Photos (later) | **R2** bucket `ingredients` | Object storage, no egress tax | Images binding + R2 |

Suggested binding names: `AI`, **`AUTH_DB`** (Better Auth D1), **`RECIPES_DB`** (recipes D1), `RECIPES_INDEX` (Vectorize), `POPULAR` (KV), `JOBS` (Queue), `CREDITS` (DO namespace), `DIET` (DO), `SAVED` (DO). No cross-DB FKs. Embeddings: `@cf/baai/bge-base-en-v1.5`. v2: Worker Secret `BYO_WRAP_KEY` (AES-GCM wrap; ciphertext in D1 `byo_keys` — never plaintext tokens).

### Queue jobs (one queue, typed payload)

| `type` | When | Worker |
|---|---|---|
| `generate_recipe` | User submit if inference may exceed request budget / `rejectIfBusy` | Jobs Worker calls Workers AI, writes D1, enqueues `index_recipe` |
| `index_recipe` | After a recipe row exists | Embed + `VECTORIZE.upsert`. **Do not** rebuild Popular here — cron snapshot owns KV ([ADR 0034](./adr/0034-popular-cap-cache.md)) |
| `ocr_photo` | **Later** | Photo → ingredient list (out of scope now) |

Synchronous generate on the request path is fine for v1 if 8B stays fast; still enqueue **index** so the user isn’t blocked on Vectorize.

### Write path (do not serialize Generate + index + debit)

D1 is **one Durable Object per database**, **single-threaded** — writes take several ms to replicate; throughput ≈ 1 / query duration; overload → `"overloaded"`. Cap **10 GB**. That is why write-heavy apps jump to **Postgres** (MVCC, concurrent writers, Hyperdrive). Chef Llama Generate is **one INSERT per cook** — stay on D1. ([D1 limits](https://developers.cloudflare.com/d1/platform/limits/).)

**Request:** Better Auth session (`userId`) → Diet DO `getActive()` (Site Worker attaches Diet on the granite request) → Credit DO `debit` (coalesced SQL + **materialized** remaining/pack_sum, **no** `await` AI/Stripe/D1 between writes) → Workers AI granite (`stream: true`) on the **Worker** → **Valibot** → D1 **`batch()`** insert a **public-by-URL** recipe (no privacy picker). Return the recipe.

**After:** Queue `index_recipe` (or `waitUntil` only if tiny): bge embed + Vectorize **upsert** (WAL then async index job; batch, never 1-vector insert — [Vectorize insert](https://developers.cloudflare.com/vectorize/best-practices/insert-vectors/)) + Analytics Engine datapoint. Refund Credit on AI/Valibot fail.

**Parked v2/v3 (ADR 0019):** Turso/libSQL over HTTP; Postgres + Hyperdrive; Basin Pipelines → R2 Iceberg. Not v1. [round 14](../internal/research-round14-tokens-byo-writes.md).

### Credits: consistency and charge

One SQLite-backed Credit DO per user (`new_sqlite_classes`) plus sibling per-user classes. Credit schema: `balance` **materialized**, `pack_sum` **materialized**, `ledger(id, delta, reason, created_at)` with unique `id` for Stripe `event.id` / generation `jobId`. Dashboard reads the materialized rows — never `SUM(delta)` the whole history. Drizzle on D1 + DO ([ADR 0029](./adr/0029-drizzle-valibot.md)); stub unused `drizzle-kit` / `node:fs` chunks like [dollar-holler#322](https://github.com/fringe4life/dollar-holler/pull/322).

**Charge:** RPC `debit(n, idempotencyKey)` **before** AI. Coalesce SQL writes with **no intervening `await`** so they commit atomically ([DO rules](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/)). Do **not** `await fetch(Stripe|AI)` inside the DO between reads and writes (input gates don’t cover non-storage I/O). On AI failure, `credit(n, sameKey)` refund. Stripe `checkout.session.completed` → `credit(packSize, event.id)` (idempotent).

Prefer `transaction()` / coalesced SQL over `blockConcurrencyWhile` on the hot path.

---

## Auth and payments

**Better Auth on D1 (14 Nov 2026, [ADR 0036](./adr/0036-better-auth-on-d1.md)).** First-party SvelteKit: [`svelteKitHandler`](https://www.better-auth.com/docs/integrations/svelte-kit) in `hooks` + `sveltekitCookies(getRequestEvent)` **last** in `plugins`. Drizzle adapter on **AUTH_DB**. Opaque **session rows** in D1 (not JWTs). Sliding **7-day** expiry (`expiresIn` 7d, `updateAge` 24h). Session is **server-read**. Public `csr=false` pages ship **0 KB** auth client JS and **never import auth** ([ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)). Generate remotes stay signed-in only — check **inside** the remote ([Kit remotes + auth](https://svelte.dev/docs/kit/remote-functions#Implications-for-authentication)).

**Bundle:** ~**140–170 KiB gzip** on the Worker (measured in fringe4life/dollar-holler and a scratch build). Well under CF **64 MiB**. Watch **1s** isolate startup. `nodejs_compat` (or `nodejs_als`). Copy DH isolate-cached `getAuth()` so the adapter does not construct at import.

**Where auth runs:** `(app)` (`/pantry` `/saved` `/account`…), `/sign-in`, `/api/auth/*`, remotes that need a Cook. **Never** on cached public pages (`/` `/popular` `/about` `/pricing` `/how-to` `/terms` `/privacy` `/recipes/[id]`). Public GET **must not** `Set-Cookie`. **`getSession` must never run on public cached routes** — it can set cookies.

**v1 methods:** Google, Apple, email OTP, Facebook. Passkeys later as **“add a passkey”** after first sign-in.

- **Apple:** US$99/yr. Client secret regenerate at least every **6 months**. Email only on **first** sign-in. Register sending domain with Apple **private email relay**.
- **Facebook:** `email` + `public_profile` need no app review; app must be **Live** (privacy policy URL + data-deletion URL). Meta may require **business verification**.
- **Email OTP sender: TODO** — Cloudflare Email Service vs Resend. From **must** be a project domain we own (`gmail.com` cannot be verified sending). Plan: `no-reply@mail.<domain>`, Reply-To `chefllamanz@gmail.com`; **domain not chosen yet**.

**Last-used badge:** Better Auth `lastLoginMethod` plugin, **cookie-only** (no DB column). Plugin **before** `sveltekitCookies()` (stays last). Cookie set **only** on successful sign-in from `/api/auth/*`. `/sign-in` reads it on the **server**.

**Two D1s:** `AUTH_DB` (Better Auth `user`/`session`/`account`/`verification`; CLI → Drizzle; `user.id` **UUIDv7** is the only identity) and `RECIPES_DB` (recipes; **read replicas here only**). No cross-DB FKs. **Nothing** written to `RECIPES_DB` at sign-up. Separate drizzle-kit configs and migration folders. Deploy: Time Travel bookmark **each** DB, migrate both, then deploy Workers. Backups: Time Travel **30 days** + weekly `AUTH_DB` export to R2. Weekly cron cleans orphaned rows. `AUTH_DB` is **extra**; recipes stay on `RECIPES_DB` (old “one Site D1”).

**Account deletion:** **deletes** that Cook’s recipes (not anonymise). `beforeDelete` queues a job: drop recipes + saves from `RECIPES_DB`; remove from Vectorize / Popular snapshot / sitemap; purge `recipe-{id}` cache tags; wipe per-user DOs. Deleted URLs return **410**. Other Cooks’ saves of those recipes disappear too. **TODO:** payment-record retention.

Rejected: Clerk (Hobby 50k MRU then ~**US$1,025/mo at 100k MRU**; 60s `__session`; `svelte-clerk` Kit 2 peers), WorkOS AuthKit, DIY Oslo+arctic, Lucia, OpenAuth-as-session, Auth.js first.

**Payments:** [Clerk Billing](https://clerk.com/docs/guides/billing/overview) uses **Stripe only for card processing**. Plans live in Clerk, **not** Stripe Billing. USD only, no Clerk-side refunds, no 3DS, several countries blocked. [Clerk account credits](https://clerk.com/docs/guides/billing/account-credits) discount **Clerk invoices**, not our DO generation ledger. Still rejected.

**v1 payments (round 9 Q1 accepted; round 12 NZD; round 16 SKUs locked):** **Alchemy Stripe Checkout hosted**, `mode: payment`, **`currency: nzd`**, **no Stripe.js**, **no intl storefront**. Operator is **MoR**. NZ [2.65% + NZ$0.30](https://stripe.com/nz/pricing). [Automatic receipts](https://docs.stripe.com/receipts) on. Polar / Managed Payments / Clerk Billing / Paddle / Lemon rejected. Webhook = raw-body on the Jobs Worker. **0 Credits on signup**; FCFS Neurons then Packs. **Locked SKUs NZ$8 / $16 / $32 → 20 / 50 / 120 Credits.** Line items use Dashboard Price ids via **`lookup_key` `pack_a`/`pack_b`/`pack_c`** — not `price_data`.

**Tax Basic (round 10 rec):** [Dashboard set-up](https://docs.stripe.com/tax/set-up) for **Locations / threshold alerts**. Checkout **`automatic_tax.enabled=false`** until a registration exists ([zero tax](https://docs.stripe.com/tax/zero-tax) is `not_collecting`). [0.5%](https://stripe.com/tax/pricing) only where registered. Tax Basic **does not file**. Not Tax Complete. [research-round10](../internal/research-round10-tax-theme-fonts.md).

**Email:** OTP **TODO** sender — Cloudflare Email Service vs Resend ([ADR 0036](./adr/0036-better-auth-on-d1.md)). From `no-reply@mail.<domain>` (must be a domain we own; `gmail.com` cannot be verified sending). Reply-To `chefllamanz@gmail.com`. Product mail: [CF Email Sending](https://developers.cloudflare.com/email-service/) (`send_email`, **Workers Paid**, Beta, [3k then $0.35/1k](https://developers.cloudflare.com/email-service/platform/pricing/)) **or** Resend if that TODO picks Resend. Routing for inbound. Domain **not chosen yet**.

**SEO (v1) + 0-JS public pages:** Stay **Kit 3**. **No ogygia** ([ADR 0011](./adr/0011-stay-kit-ogygia.md) superseded · [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)). `(static)` prerender `csr=false`; `(site)` edge SSR `csr=false` + Workers Cache via **`publicCache` only** ([caching.md](./caching.md)). Measured brotli: ~0.5–0.8 KB HTML + one shared hashed StyleX CSS ~0.6 KB, **0 JS** (theme inline script in `app.html` excepted). **Pantry: `csr = true`**, ~43 KB brotli Kit JS. Shared Site navbar = Kit layout + plain Sign in link, no session. Do **not** add [`svelte-seo`](https://www.npmjs.com/package/svelte-seo). Kit [SEO](https://svelte.dev/docs/kit/seo) — `<svelte:head>` from `load`. svelte-sitemap for Site; Popular in `sitemap.xml/+server.ts`. Recipe **`noindex`**. `og:image` = **static meal SVG**. No workers-og WASM. Remove `OGYGIA_SECRET`. dollar-holler may demo ogygia **without** Larder taking it.

**robots + AI crawl (round 20 rec, ADR 0010):** Origin `robots.txt` Disallow `/pantry` `/saved` `/sign-in` and training tokens `GPTBot` `Google-Extended` `CCBot` `ClaudeBot` `Applebot-Extended`. Search bots stay allowed (`Googlebot` `bingbot` `OAI-SearchBot` `Claude-SearchBot` `Applebot`). CF: Search **Allow**, Agent **Allow**, Training **Disallow**, Bot Preference Sync **on**. **Bot Fight Mode off** on Free. Site Worker [Workers Cache](https://developers.cloudflare.com/workers/cache/) `cache: { enabled: true }` so crawler HIT skips D1/KV/Vectorize — **only** via `publicCache`; default `private, no-store`. Tags `popular` / `popular-top` / `popular-{type}` / `recipe-{id}`; cron snapshot purges changed tags. No `Set-Cookie` / `Vary: Cookie` on public GET. [round 20](../internal/research-round20-robots-ai-crawl-cache.md) · [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md).

**Theme:** Do **not** install [`mode-watcher`](https://www.npmjs.com/package/mode-watcher). Tokens **are** the theme ([ADR 0014](./adr/0014-stylex-shadcn-tokens.md)). [`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) **only** — no `.dark` fallback. Override: small **blocking inline script** in `app.html` (cookie + `light-dark()`). **Never** render theme from cookies on the server for public pages. `html:has(#scheme-dark:checked) { color-scheme: dark }` still fine on `(app)`. `build.cssTarget` = browsers with `light-dark()`, or Vite polyfills `color-scheme`.

**Fonts:** Import Fontsource into the Vite graph so woff2 URLs are hashed from **file bytes** (SHA-256 prefix; [Vite assets](https://vite.dev/guide/assets), [getHash](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/utils.ts)). **Same Fontsource version → same hashed filename** on rebuild. Kit [`preload`](https://svelte.dev/docs/kit/hooks) matches source **`filename`**, not the hashed `path`. **Never** `@import` / `<link>` Google Fonts. Do not copy fonts into `static/` (unhashed). Pin; `?no-inline` if a face is near `assetsInlineLimit`. **Families left to Kombai.** Pattern: [dollar-holler `hooks.server.ts`](https://github.com/fringe4life/dollar-holler/blob/main/src/hooks.server.ts) — do not copy that app. Not [Astro Fonts](https://docs.astro.build/en/guides/fonts/).

---

## StyleX + shadcn named tokens (pack closed)

**StyleX is viable in SvelteKit** via `@stylexjs/unplugin`, `stylex.attrs` (emits `class`, not `className`), and a DEV virtual CSS link ([StyleX + SvelteKit](https://stylexjs.com/docs/learn/installation/vite/sveltekit), [v0.18](https://stylexjs.com/blog/v0.18)). StyleX **hashes** variable names unless keys start with `--`.

**The theme is the named CSS tokens** (`--foreground`, `--primary`, `--background`, … — the shadcn list). Not a component library. Native Dialog/Popover consume those variables. Ingest Kombai/paper HTML by mapping colors onto the same names. **Do not** install shadcn, shadcn-svelte, or bits-ui. That pack decision is **closed**.

**Resolution:** [`light-dark()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark) (**Baseline 2024**) on each color token, with `:root { color-scheme: light dark; }`. **No `.dark` fallback** (Coinnich: support is good). StyleX `defineVars` points at the `--` keys. Do **not** use StyleX `createTheme`.

**Override:** blocking inline script in `app.html` sets `data-colorscheme` from the cookie on public pages (no server `transformPageChunk` — that would `Vary` Cookie). `html:has(#scheme-dark:checked)` for in-page radios on `(app)`. Keep those radios **out of** the pantry chip tree ([MDN `:has` performance](https://developer.mozilla.org/en-US/docs/Web/CSS/:has#performance_considerations)).

**Fallback if the unplugin breaks on Vite 8 / Kit 3:** the same `--` variables in CSS, still `light-dark()`. **Do not** add `mode-watcher`. **Do not** copy a Tailwind shadcn pack.

---

## Native UI: Dialog, Popover, CSS anchor

| API | Status (Oct 2026) | Product default |
|---|---|---|
| `<dialog>` | Long-baseline; use `showModal()` for modal | Native. No polyfill. |
| [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) | **Baseline 2025** (Jan 2025+) | Native `popover` on menus/tooltips. `dialog` + popover if you need dialog semantics without modal lock. |
| [CSS anchor positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position-anchor) | **Baseline 2026** (Sep 2026) but [Can I Use](https://caniuse.com/css-anchor-positioning) still **partial** on Chromium/Firefox; Safari 27 full | Use `anchor-name` / `position-anchor` / `position-area`. Feature-detect; load [`@oddbird/css-anchor-positioning`](https://github.com/oddbird/css-anchor-positioning) when `"anchorName" not in document.documentElement.style`. Polyfill does not cover every later Chromium feature (`position-area` era, dynamic anchors). |

Skip Floating UI unless polyfill gaps show up in real Safari/Firefox QA.

---

## Lint: ESLint v10 + Fallow

**Decision (21 Oct 2026):** ESLint **≥ 10** is the per-file linter. **[Fallow](https://fallow.tools/)** is the project-graph analyzer. Run **both**. Agents get **both** MCP servers. Do not treat Fallow as an ESLint plugin, formatter, or typechecker.

**What Fallow is:** a real product (`fallow` on npm, currently **3.34.1**). Linters (ESLint, oxlint, Biome) inspect one file. Fallow builds the module graph and finds unused files/exports, circular imports, unused/unlisted deps, architecture-boundary violations, duplication, and complexity/health. Optional paid **Fallow Cloud** adds production usage evidence for dead-code decisions — skip Cloud for v1. Official comparison: [Fallow vs linters](https://fallow.tools/docs/explanations/fallow-vs-linters/). ESLint still owns StyleX validity, Svelte/Kit rules, Effect barrel imports, and TypeScript-aware locals.

**CI:** `eslint .` then `npx fallow audit` (changed-files gate). Do not run `eslint-plugin-import/no-cycle` or `no-unused-modules` — that is Fallow’s job.

### Packages (devDependencies)

Pin these; versions are npm latest as of 21 Oct 2026.

| Package | Role | Pin |
|---|---|---|
| `eslint` | Core. Flat config only (v10 dropped eslintrc). Node `^20.19 \|\| ^22.13 \|\| ≥24` — Kit already wants Node ≥ 22.17 | **^10.13.0** |
| `@eslint/js` | `js.configs.recommended` | **^10.0.1** |
| `typescript-eslint` | TS parser + `ts.configs.recommended` (umbrella; do not add `@typescript-eslint/*` separately) | **^8.72.0** |
| `eslint-plugin-svelte` | Official Svelte **and** SvelteKit rules (`svelte/no-navigation-without-resolve`, `valid-prop-names-in-kit-pages`, …). Detects Kit 1–3 from `@sveltejs/kit`. **There is no `eslint-plugin-sveltekit` package.** | **^3.23.1** (ESLint 10 peer since 3.15.0) |
| `globals` | `browser` + `node` for Kit SSR | latest |
| `@sveltejs/load-config` | Kit 3 has **no** `svelte.config.js`; load options from `vite.config.ts` for the Svelte parser | **^0.2.3** |
| `@stylexjs/eslint-plugin` | Official StyleX plugin. ESLint 10 from StyleX **0.19.0** | **^0.19.1** |
| `@effect/eslint-plugin` | Official Effect plugin. Real, but **thin**: `@effect/no-import-from-barrel-package` + a **dprint** formatter rule. Last publish **0.3.2** (Apr 2025, ESLint 9). Use **only** the barrel rule. Skip `configs.dprint` | **^0.3.2** |
| `fallow` | CLI + `fallow-mcp` / `fallow-lsp` launchers | **^3.34.1** |
| `@eslint/mcp` | Official ESLint MCP (bundles ESLint ^10.1). Optional if you only `npx @eslint/mcp@latest`; **install it** so Cursor uses the project binary | **^0.3.15** |

`svelte-eslint-parser` is a transitive dep of `eslint-plugin-svelte` — do not add it by hand.

**Do not install:** `eslint-plugin-svelte3` (dead), `@sveltejs/eslint-config` (Svelte **org** house style: stylistic + prettier + `eslint-plugin-n`, not an app preset), `@mpsuesser/oxlint-plugin-effect` / `@shekohex/oxc-effect` (oxlint only, not ESLint). There is **no** official Effect v4 ESLint rulepack.

If `@effect/eslint-plugin` peer-installs fail on ESLint 10, keep it with a package-manager peer override. Do not invent Effect rules.

### MCP (Cursor `.cursor/mcp.json`)

Commit project MCP so agents lint/graph the same way. Start Cursor from the repo root.

```json
{
  "mcpServers": {
    "eslint": {
      "command": "npx",
      "args": ["@eslint/mcp"]
    },
    "fallow": {
      "command": "npx",
      "args": ["--yes", "--package", "fallow", "fallow-mcp"]
    }
  }
}
```

- **ESLint:** official docs use `npx @eslint/mcp@latest` ([MCP setup](https://eslint.org/docs/latest/use/mcp)). With `@eslint/mcp` as a **local** devDep, drop `@latest` so `npx` hits `node_modules`. Keep config as **`eslint.config.js`** (not `.ts`) so the MCP server does not need `jiti`.
- **Fallow:** `"command": "fallow-mcp"` only works if the binary is on `PATH` (global install). DevDep install **must** go through the package runner ([Fallow MCP](https://fallow.tools/docs/integrations/mcp/)). Alternative: `npx fallow agent install` writes the Cursor entry after probing `npx --no fallow-mcp`.
- One-off without a local install: `npx @eslint/mcp@latest` and `npx --yes --package fallow fallow-mcp`. Prefer local pins.

### Recommended `eslint.config.js` shape

Repo root: **`eslint.config.js`**. Kit 3: load Svelte/Kit options from Vite, not `svelte.config.js`. Use `typescript-eslint` **recommended** (not `recommendedTypeChecked`) — typed linting is slow and noisy with Effect/`tryPromise`; Fallow + `tsc` cover graph/types. Keep `projectService` + `extraFileExtensions` on the **same** Svelte `parserOptions` object (typescript-eslint singleton).

```js
// eslint.config.js
import { loadConfig } from "@sveltejs/load-config";
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import ts from "typescript-eslint";
import svelte from "eslint-plugin-svelte";
import stylex from "@stylexjs/eslint-plugin";
import effect from "@effect/eslint-plugin";

const svelteConfig = (await loadConfig("./", { traverse: false }))?.config;

export default defineConfig(
  { ignores: [".svelte-kit/**", "build/**", "dist/**", "node_modules/**"] },
  js.configs.recommended,
  ts.configs.recommended,
  svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "@stylexjs": stylex,
      "@effect": effect,
    },
    rules: {
      "@stylexjs/valid-styles": "error",
      "@stylexjs/no-unused": "error",
      "@stylexjs/valid-shorthands": "warn",
      "@stylexjs/sort-keys": "warn",
      "@stylexjs/no-legacy-contextual-styles": "error",
      "@effect/no-import-from-barrel-package": [
        "error",
        { packageNames: ["effect"] },
      ],
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
);
```

If `@stylexjs/eslint-plugin` exports `configs.recommended` (landed for flat config around 0.19), you may replace the StyleX `plugins`/`rules` block with `stylex.configs.recommended`. Explicit rules above match current StyleX docs and do not depend on that export.

Custom Kit `files.routes`: set `settings.svelte.kit.files.routes` to the same path as `sveltekit({ files: { routes } })` in `vite.config.ts`.

---

## WebMCP (v1 on cook routes)

Chat-to-recipe via a page-level tool registry: [WebMCP](https://github.com/WebMCP-org/npm-packages/) (`document.modelContext.registerTool`). Chrome is flag-only; [`@mcp-b/webmcp-polyfill`](https://www.npmjs.com/package/@mcp-b/webmcp-polyfill) (v6) lazy-loads when native context is missing. Auth-only on cooking routes; **no Site icon**. **Site composer** = brochure chat without sign-in (rejected). Tools wrap the same remotes as buttons, **array arity**:

- `add_ingredients({ items: string[] })`
- `remove_ingredients({ items: string[] })`
- `make_recipe()`
- `topup({ pack?: string })`

---

## Open risks

1. **Alchemy v2 beta** — breaking changes; pin ≥ `2.0.0-beta.82` before first DO `exports` deploy; don’t roll back past it.
2. **Alchemy vs official Kit 3 `cloudflare:workers` env** — two documented access styles (`platform.env` vs `import { env }`). Pick Alchemy’s and don’t mix.
3. **DO classes + SvelteKit** — keep `CreditAccount` + queue consumer on a **Jobs Worker**; bind it into the site Worker.
4. **Better Auth Worker graph** — ~140–170 KiB gzip; isolate-cached `getAuth()`; stub `generate-drizzle-schema` / `node:fs` like [dollar-holler#322](https://github.com/fringe4life/dollar-holler/pull/322). Watch 1s startup.
5. **Workers AI model churn** — 8B-fast already vanished; pin the model id and watch the [catalog](https://developers.cloudflare.com/workers-ai/models/).
6. **Clerk Billing ≠ prepaid generation credits** — still rejected; mixing any vendor credits with the Credit DO will double-count or miss debits.
7. **StyleX unplugin on Vite 8 / Kit 3** — unproven. Fallback is the same `--` CSS tokens, not a shadcn component pack (pack is closed).
8. **SQLite DO storage billing** — in effect since Jan 2026 ([changelog](https://developers.cloudflare.com/changelog/post/2025-12-12-durable-objects-sqlite-storage-billing/)); keep ledgers tiny.
9. **Queue + AI capacity** — use `rejectIfBusy` / async `queueRequest` on Workers AI when the request path must not stall ([reject if busy](https://developers.cloudflare.com/workers-ai/features/reject-if-busy/)).
10. **Remote functions experimental** — Kit 3 flag; expect churn. Pair with `<svelte:boundary>` + `withOverride`; do not treat as a stable RPC contract.
11. **Effect AI ≠ Workers AI binding** — `@effect/ai-cloudflare` is unstable Clef REST; Llama Generate stays on Alchemy `Workers.AI()`. StyleX stays outside Effect.
12. **JSON Mode list is stale** — retired 8B ids still listed; granite cook is **not** named; 70b-fast **is** named; JSON Mode **no streaming**. Valibot decode is the contract ([prompt-payload](./prompt-payload.md), [ADR 0031](./adr/0031-granite-valibot-llama-backup.md)).
13. **Valibot on Workers** — Kit remotes document Valibot as Standard Schema. Do **not** import `effect/Schema` on Generate. Effect stays Alchemy + tagged errors. Query layer is **Drizzle**, not Effect SQL ([ADR 0029](./adr/0029-drizzle-valibot.md)).
14. **MoR tax** — Stripe Tax Basic **0.5%** where registered; **does not file**. Dashboard alerts on; Checkout `automatic_tax` off until IRD GST (NZ$60k must, or voluntary, or if adding GST to prices). Polar declined. Packs **NZD only**.
15. **svelte-sitemap vs Kit sitemap endpoint** — static Site vs Popular recipe ids; Alchemy output dir may not be `.svelte-kit/cloudflare`.
16. **0-JS public pages** — ogygia **dropped** (measured ~22 KB runtime, not ~8 KB). `(static)`/`(site)` `csr=false`; `/pantry` plain Kit ~43 KB. Workers Cache **default-deny**; only `publicCache` ([caching.md](./caching.md) · [AGENTS.md](../AGENTS.md) · [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)). Remove `OGYGIA_SECRET`. Five guardrail layers in v1 (hook, helper, Playwright vs wrangler prod build, local ESLint `chef/*`, canary).
17. **workers-og WASM** — keep off v1. No `svelte-seo`.
18. **mode-watcher** — skip. `light-dark()` only; **blocking inline script** in `app.html` for the cookie. Never server-render theme from cookies on public pages.
19. **Fonts** — Kit `preload` is build-time only; do not expect it in `alchemy dev`. Do not add Astro’s Font pipeline.
20. **OTP mail sender is TODO** (CF Email Sending vs Resend). CF Email is Beta + **Workers Paid**. Alchemy may not document `send_email`. From must be a domain we own.
21. **BYO keys (v2)** — empty `src/features/byo-ai/`. Never D1 plaintext. Wrap with Worker Secret `BYO_WRAP_KEY`. **Paste API keys**; cheap ids: `claude-haiku-5-5`, `gpt-6-luna`, `gemini-3.5-flash-lite`, Groq `openai/gpt-oss-20b`. **No Composer.** Anthropic forbids Claude.ai OAuth; OpenAI SIWC partner-gated; Gemini default is API key.
22. **Diet rows** — sibling Diet DO + `getActive()` RPC. Site Worker attaches Diet on Generate. Not JSON on the user row; not the Credit ledger; not global D1. Dashboard skips global D1. [ADR 0030](./adr/0030-per-user-credit-dos.md).
23. **Observe** — Workers Logs + Issues + Analytics Engine. **No Sentry v1.** No Effect `NodeSdk` OTel on workerd.
24. **Chip canonicalize** — `src/shared/` string pipeline; max 16; lists in-process **v1**. Leftover rice → `{ "name": "rice", "cooked": true }`; uncooked omit `cooked`. **Clairic parked v2/v3.** Not Jev/Clef/GLiNER. Sample I/O in ADR 0018.
25. **Cost floor** — Workers Paid **$5 USD** ≈ NZ$8.79 (RBNZ 23 Oct 2026). `max_tokens` **768**. Pack SKUs **locked** NZ$8/$16/$32 → 20/50/120 Credits.
26. **D1 write contention** — one DB = one DO, single-threaded. Generate stays one `batch()` INSERT; Vectorize off the request path. Turso/Postgres/Pipelines parked (ADR 0019).
27. **Secrets** — Varlock `.env.schema` + **Infisical Free** (accepted) OIDC + Alchemy `Config.Redacted`. Not a 4th Bitwarden SM project. Effect plugin needs **4.0.0-rc.113+**. No `varlock-wrangler` leak-detection on Alchemy until varlock#735.
28. **CI** — lint/Fallow/`tsc` **without** secrets. Preview = Better Auth secret + OAuth test apps on `workers.dev` (`allowedHosts` `*.workers.dev`). Dependabot for `bun` + Actions. husky + lint-staged. Cursor `.cursor/hooks.json`: ESLint after edit, Fallow on `stop`.
29. **Scale** — client conversion-factor on `/recipes/[id]`; no second Generate; no qty in v1 Valibot (ADR 0022) **accepted**.
30. **Popular** — rolling 7-day **saves of public-by-URL rows**, cap 20, ≥5 distinct savers, **cron snapshot** (ADR 0023 · ADR 0032 · ADR 0034) **accepted**. `/popular` is a v1 URL. v2 `/popular/[type]` ADR 0038 (list TBC).
31. **Visibility** — every v1 Generate is public-by-URL. No privacy picker. Saved = private id list. Private Recipes = v2 (ADR 0032) **accepted**.
