# Chef Llama — product spec (grill in progress)

**Status:** `grill-with-docs` **round 49**. Product / GitHub / UI / logo / wordmark **Chef Llama** (cook still **Llama**). Operator is an **individual**.

Pointers: [glossary](./GLOSSARY.md) · [prompt + payload](./prompt-payload.md) · [tech stack](./tech-stack.md) · [caching](./caching.md) · [Kombai brief](./kombai-brief.md) · [working draft](./designs/04-landing.html) · [cupboard.svg](./designs/cupboard.svg) (pending **draft**) · [mark.svg](./designs/mark.svg) (logo **draft**) · [round 48 public/private](../internal/research-round48-public-private.md) · [round 47 D1/Diet/leftover](../internal/research-round47-d1-limits-leftover.md) · [round 45 Valibot/Drizzle/DOs](../internal/research-round45-valibot-drizzle-dos.md) · [round 43 granite/slop](../internal/research-round43-granite-slop-eslint.md) · ADRs [`0001`](./adr/0001-marketing-site-and-app.md)–[`0038`](./adr/0038-popular-type-allergy-safeguards.md) (**0037 / 0038 / 0034 cron-snapshot / 0032 / 0030 / 0004 / 0029 / 0031 accepted**; **0011 ogygia superseded by 0037**; **0005 Clerk provider superseded by 0036** on [PR 93](https://github.com/fringe4life/chef-llama/pull/93); **0028 rejected**; **0033 / 0035 Proposed — not locked**). Repo [`fringe4life/chef-llama`](https://github.com/fringe4life/chef-llama) (renamed from `fringe4life/larder`). **Public until coding starts**. **Kombai `/` + sticker = working draft** (not locked, not Code). They iterate UI in Kombai separately.

---

## Settled

| | |
|---|---|
| Job | Pantry (≥3 chips) → **one Recipe tonight**. Similar cards after it exists. Photo later. |
| Cook | Solo, ~1–4. |
| Auth | **Better Auth** on D1. Generate signed-in. No Guest DO. v1: **Google, Apple, email OTP, Facebook.** Passkeys later (“add a passkey” after first sign-in). Custom `/sign-in`. [ADR 0036](./adr/0036-better-auth-on-d1.md) |
| Named routes | `(static)` `/about` `/pricing` `/how-to` `/terms` `/privacy`; `(site)` `/` `/popular` `/popular/[type]` `/recipes/[slug]`; `/sign-in`; `(app)` signed-in: `/pantry` `/saved` `/account` `/account/usage` `/account/packs`. **No `/chef`.** **No `/topup`.** |
| Constraints | Diet/allergy **hard**; kcal/time **targets**; servings 1–12 default 2. Stamp **kcal**. |
| Missing | ≤2 **Staples** in prompt: water, salt, pepper, oil, butter. |
| Recipe view | Own **route**; sheet = same route, narrow. +/- servings **client math** (ADR 0022). |
| Fallow | `bulletproof`; `src/routes/**` as `app`. v2 empty: `photo`, `chat`, `billing`, **`byo-ai`**, **`i18n`**. v1 **`diet`** module (one active row). |
| AI | v1: `@cf/ibm-granite/granite-4.0-h-micro` + IBM `<schema>` + **Valibot**. Backup `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. `stream: true`. `max_tokens` **768**. fp8 410 **20 Nov 2026**. v2 BYO: Effect AI adapters (not shipped). |
| Kit | Remote functions, `<svelte:boundary>`, `withOverride`. **Not Astro.** |
| Site | 0-JS Kit. `(static)` prerender; `(site)` edge SSR + Workers Cache. Popular = **cron KV snapshot** (not per-save), ranked **7-day saves of public-by-URL rows**, cap 20, ≥5 distinct savers; **no generate, no chat** on `/`. ogygia **dropped** (ADR 0011 superseded · ADR 0037). |
| Chat | v1 auth-only cook routes. **Array** tools. |
| Credits | **No signup Credits.** FCFS = 10k Neurons/day gift (pool DO, [#76](https://github.com/fringe4life/chef-llama/issues/76) — not a KV daily counter). Gift and per-user free-cook caps reset at **00:00 UTC** ([Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/): all limits reset daily at 00:00 UTC). **`max_tokens` 768** is the hard cap (truncates). Packs when gift is gone. Charge: **hold, then settle or release** (not debit-before-AI). |
| Diet | **Required** before first Generate. Chips override this run. **Swap** not ignore. First-run **blocking dialog on `/pantry`**: name Home; flags vegan/vegetarian/gluten_free; allergy chips; optional kcal; servings 1–12 default 2; optional max_minutes. Multi-Diet **picker is v2 UI**. Storage: sibling Diet DO (`getActive` RPC). |
| SEO | **v1.** Site indexable. Every Generate is **public-by-URL**; `/recipes/[slug]` unauthenticated SSR + OG SVG + **`noindex`** (Popular excepted). No privacy picker. Private Recipes = v2. **No** `svelte-seo`. Robots/CF/cache **accepted** (ADR 0010 · ADR 0032). |
| Design | **Working draft** [04-landing](./designs/04-landing.html) + [sticker](./designs/05-token-sticker.html) (and `*-dark.html`). Not locked. **No Code**, no extra routes until accept. |
| Skills | Matt grill set lives in **larder `.agents/skills/`** (not the Project store, not `environment.json`). Copy not committed yet. |
| Pay | **Stripe you-MoR.** Hosted Checkout. **No Stripe.js.** Not Polar. **NZD only.** Packs **NZ$8 / $16 / $32 → 20 / 50 / 120**. |
| Tax | **Must** GST-register at **NZ$60k** (past or expected 12 months) **or** if adding GST to prices; **may** register earlier. Tax Basic **alerts on, collection off** until then. |
| Topup | Exhausted **dialog** → Checkout. Pantry in **sessionStorage**. No `/topup` v1. **Living detect** before Session: `light-dark` + `showModal` + `popover` + `sessionStorage` (extend when Site CSS needs a new API). Packs = **three buttons**. |
| noscript | Public `(static)`/`(site)` work with **0 JS** (theme inline script only). Cooking, sign-in, buy need JS. |
| Errors | `error()` + root/(app) `+error.svelte`. Boundary on Generate. Popular is **SSR HTML** on `/` and `/popular`, not an island. Unknown `/popular/[type]` is a plain 404 (not cached). |
| `kind` | `"plain"` \| `"swap"`. Field **`kcal_over`**. Empty `flags` omitted. |
| Theme | Named CSS tokens **are** the theme. StyleX `--` keys. **`light-dark()` only**. Blocking **inline script** in `app.html` (cookie); **never** server-render theme from cookies on public pages. Pack closed. |
| Mail | One Site logo: OTP (sender **TODO**) · Stripe receipts · product mail. From `no-reply@mail.<domain>`; Reply-To `chefllamanz@gmail.com`. |
| Fonts | **System stack only** ([design.md](./design.md)). No Fontsource, no Fraunces, no later webfont pass. [ADR 0015](./adr/0015-fontsource-preload.md) superseded. |
| Icons | **No** Lucide / Simple Icons / Tabler. Chrome = **custom animated SVG**. OAuth marks = **official** Google + Apple kits only (Meta/X if those rows exist). [ADR 0026](./adr/0026-no-icon-libraries.md). |
| Observe | Workers Paid **Logs + Issues + Analytics Engine** `writeDataPoint` per Generate. Effect JSON `console.log`. **No Sentry v1.** No `@effect/opentelemetry` NodeSdk. |
| BYO v2 | Paste **API keys** (wrap ADR 0016). Cheap picker: `claude-haiku-5-5`, `gpt-6-luna`, `gemini-3.5-flash-lite`, Groq `openai/gpt-oss-20b`. **No Composer.** |
| Chips | In-process string canonicalizer; **max 16**. Lists **v1**. Leftover rice → `{ "name": "rice", "cooked": true }`; uncooked omit `cooked`. Highlight already-cooked. **Clairic v2/v3**. |
| Writes | **Drizzle** on Credit DO (materialized remaining / pack_sum / history) + sibling per-user DOs + `RECIPES_DB` `batch` for **public-by-URL** recipes + Queue Vectorize. **`AUTH_DB`** holds Better Auth tables only (no recipe writes at sign-up). Dashboard **does not** hit `RECIPES_DB`. Diet/Saved ids are **not** D1-queued against recipe writes. **No D1 saves list.** Turso / Postgres / Pipelines **parked** (ADR 0019). Storage v2 OPTION (not decided): nightly near-duplicate merge. [ADR 0029](./adr/0029-drizzle-valibot.md) · [ADR 0030](./adr/0030-per-user-credit-dos.md) · [ADR 0032](./adr/0032-public-by-url-recipes.md) · [ADR 0036](./adr/0036-better-auth-on-d1.md). |
| Pending Cook | **ADR 0024:** stay `/pantry` until Valibot-ok + id, then `goto /recipes/[slug]`. v1 = **SVG only** hashed `<img>` ([cupboard.svg](./designs/cupboard.svg) **draft**; robot looks odd; iterate in Kombai separately). Recipe morph **kept**. Chef = Copilot-inspired **hover body** + **bot face**; **head = Chef Llama mark**. Not equine. CSS `perspective` + wall shadow. Chat `make_recipe()` same pending. No poll. No Job-DO WS. **SSE / `query.live` phases = v2/v3**; hide scene when progress+scene cannot both fit. |
| Cancel | **`stream: true`** server-side + `request.signal`. Disconnect = cancel. Probe Neurons; if abort ≈ full 768, **no Credit/FCFS refund**. Cook copy = Credit ledger only. Stripe Pack never refunded. |

**Swap scenario:** Active Diet vegan. Chips: chicken, rice, soy. Generate runs. Tofu-rice. `kind: "swap"` with `swaps: [{ "from": "chicken", "to": "tofu" }]`. No swap → `kind: "plain"` (no `swaps` key).

---



## Proposed (not locked)

Coinnich ideas below. **Not v1 lock** except Popular cap/cron (accepted 14 Nov 2026 — [ADR 0034](./adr/0034-popular-cap-cache.md)). Settled table above still wins until a grill round accepts the rest. ADRs [0033](./adr/0033-starter-pack.md) · [0035](./adr/0035-guest-generate.md) are **Proposed**. Source for Generate tips: [prompting-dos-donts-competitors](../internal/prompting-dos-donts-competitors.md) (24 reworded competitor items + gaps). GitHub issues (label `proposal`): [Starter pack #89](https://github.com/fringe4life/chef-llama/issues/89) · [Popular cap #90](https://github.com/fringe4life/chef-llama/issues/90) (locks landed in ADR 0034/0037) · [Generate do’s and don’ts #91](https://github.com/fringe4life/chef-llama/issues/91) · [Guest Generate #92](https://github.com/fringe4life/chef-llama/issues/92).

### Starter pack (paid, once per account)

**Name:** **Starter pack** everywhere.

Cheap first buy so a Cook can try Credits before pack_a/b/c. **Once per Better Auth `user.id`** after sign-up so nobody farms a tiny SKU (Stripe **NZ$0.30** fixed fee). Hosted Checkout, NZD, you-MoR — same as locked packs. No Portal, no subscriptions.

| Rec | Detail |
|---|---|
| SKU | **NZ$4 → 10 Credits** (`lookup_key` `pack_starter`). Same ~NZ$0.40/credit as pack_a. **Not** NZ$4 / 4 Credits (~NZ$1/credit — too steep). |
| Once-only flag | **Credit DO** `starter_pack_granted_at` in the same SQL tx as the ledger credit. Not a D1 `users` column (dashboard must not hit global D1). |
| Webhook | `checkout.session.completed` → `credit(10, event.id)` idempotent on Stripe `event.id`. Session create refused if the flag is set. |
| UI | First button on exhausted dialog and `/account/packs` until granted; then only pack_a/b/c. |

**Contrast (do not silently reverse):** locked **no complimentary signup Credits**; FCFS Neuron cap only. Starter pack is **paid**. Alternative Coinnich can choose: N free Credits when Diet is completed — that would reverse [#21](https://github.com/fringe4life/chef-llama/issues/21); ask first.

Open questions: NZ$4/10 vs NZ$6/15; show while FCFS remains; refund clearing the flag.

### Popular cap, cache, quiet-week all-time

**Locked 14 Nov 2026** ([ADR 0034](./adr/0034-popular-cap-cache.md) · [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)): ranking stays **7-day saves of public-by-URL rows** (ADR 0023).

| Lock | Detail |
|---|---|
| v1 cap | **20** ids per list. No infinite scroll. |
| Inclusion | Recipe appears only after **≥5 distinct savers**. |
| Index | **Top 5** from cron KV `popular:all`, tag `popular-top`. `/` is `(site)` edge SSR, `csr=false`, **no generator**. |
| `/popular` | **v1 URL**. Same snapshot; tags `popular`. |
| Refresh | **Cron snapshot**, not per-save rebuilds. Hash `[id,title]` vs `popular:hashes`; purge only changed tags. **Not** a Cron ping of `/` (#81). |
| Cache | `publicCache` only. `/` and `/popular`: browser 60, edge 3600, swr 86400. Default-deny `private, no-store`. |
| v2 | Closed `/popular/[type]` list + allergy fail-closed ([ADR 0038](./adr/0038-popular-type-allergy-safeguards.md)). Exact list TBC. |

**Still open:** quiet-week all-time fill (earlier rec N=5/M=2 is in tension with min 5 distinct savers); author’s own save counting toward 5; **how to count** distinct savers in the 7-day window (a bare `save_count` cannot; counter vs queue events into a 7-day per-recipe saver ledger — **do not pick**).

### Guest Generate (reconsider; lock stands until chosen)

**Current lock:** signed-in Generate, no Guest DO ([ADR 0005](./adr/0005-clerk-gated-generate.md) login gate; provider [ADR 0036](./adr/0036-better-auth-on-d1.md)). Preference: login-gated free tries over anonymous Guest DOs.

Competitors ship a free first Recipe with no account (DishGen 1 then wall; FridgeToCook unsigned POST; Create & Cook per Coinnich). Earlier Chef Llama plan (three Guest DO tries) was dropped to keep the codebase simple.

| Option | Rec? |
|---|---|
| **(a)** Capped guest Generate on the daily Neuron budget; Turnstile; **1** then sign-in wall (resets **00:00 UTC**, same as Neurons gift); Diet still required (`sessionStorage`); **no Guest DO** | Alternative if Coinnich wants conversion parity |
| **(b)** One free Recipe per device or IP | **No** — spoofable, NAT-unfair |
| **(c)** Keep sign-in required | **Rec for v1** |

Diet, allergies, and public-by-URL writes still apply if (a) is chosen. Guest Creates must not flood Popular (saves stay signed-in). Do not grant complimentary signup Credits as a substitute (#21).

Open questions: if (a), 1 vs 3; Turnstile vs cookie bind; guest rows in sitemap?

### Generate do’s and don’ts (on-site, near Generate)

**Placement (proposed):** `/pantry`, **collapsed** `<details>` (or equivalent) **under the chip list, above the Generate button**. Title: **How to get the most out of Chef Llama**. Not a blocking dialog (Diet already is). Not on `/`. Not a second chat composer.

Picked from the 24 competitor items + gaps where they match Chef Llama: Diet first, leftover chips `{ "name", "cooked": true }`, FCFS then Credits, **one Recipe per Generate**, client scale not a new Generate, ≥3 chips / max 16, Staples assumed, chips override this run / Swap not ignore. Dropped competitor items that imply chat-prompt boxes, 3-recipe responses, expiry ranking, appliance pickers, All-In/Gourmet modes, or post-cook inventory.

**Proposed copy (draft):**

**Do**

- Finish **Diet** before the first Generate. Allergies and diet flags apply every run. This-run chips can add extra leave-outs; they do not silently drop a hard constraint (Chef Llama **swaps**).
- Add **at least 3** ingredients you actually have (max 16). Put the leftover that needs using first. Mark cooked leftovers as cooked (leftover rice → rice, cooked).
- Leave Staples off the list (water, salt, pepper, oil, butter) unless that really is all you have. The Recipe may use up to two.
- After the Recipe: **scale servings on the page** and **Save** if you want it again. Neither spends a Credit.

**Don’t**

- Don’t type a sentence or a mood (“dinner”, “something nice”). Chips, not a prompt. Sentence-like paste is rejected.
- Don’t skip Diet to “just try once”.
- Don’t Generate again to feed more people — use +/- servings.
- Don’t treat the Recipe as kitchen-tested. Read labels on stocks, sauces, and spice blends. Chef Llama cannot cover cross-contact or “may contain”.

**Credits (one line near Generate)**

- While the daily Neuron gift lasts, Generate is FCFS (no Credit hold). After that, **1 Credit = 1 Recipe**. Viewing, Save, and client scale do not spend. A second Generate is a new Credit (or another FCFS Recipe). Charge is **hold, then settle or release**. Failed/empty/cancelled Generate **releases** the hold unless the cancel lock says the GPU used ~768 tokens (then settle).

**NZ**

- Amounts and times in **metric**. Prefer NZ names in chips (mince, silverbeet, coriander, capsicum) — the canonicalizer maps synonyms; the Recipe should come back in the same register.

**Gaps called out on-site (short, not a lecture)**

- Cooked leftovers go in **late** and are reheated, not recooked from raw. How old / how often reheated is the cook’s call; we do not invent a safe-age checker in v1.
- This-run chips override Diet for extras; they do not disable allergies. Cooking for a guest who *has* an allergy the profile lacks: add it as a this-run chip / Diet edit **before** Generate.

Open questions: always-visible vs collapsed; tap-to-fill NZ example chip sets; whether a failed Generate refunds; lawyer pass on allergy/cross-contact wording; leftover safe-age copy vs “use your judgement” only.

## Recommended (round 49 — leftover: Popular save-count mechanism still **OPEN**)

Cites: [round 48](../internal/research-round48-public-private.md) · [round 47](../internal/research-round47-d1-limits-leftover.md) · [round 45](../internal/research-round45-valibot-drizzle-dos.md).

**Brand / repo:** product + GitHub **Chef Llama**. Slug [`fringe4life/chef-llama`](https://github.com/fringe4life/chef-llama) (already renamed). Cook persona stays **Llama** on granite. [ADR 0004 accepted](./adr/0004-larder-and-chef-llama.md).

**Domain:** ship `*.workers.dev` until they paste the bought hostname. Do not invent one.

**Workers:** Paid **$5 is not always-on**. No `min_instances`. Hibernate Credit/Diet DOs. No `keepAlive`. No Cron ping of `/`. [#81](https://github.com/fringe4life/chef-llama/issues/81).

**Diet / Saved:** sibling Diet DO (`getActive` RPC) + Saved **ids** on a sibling DO. Site Worker attaches Diet on the Generate request, then `env.AI.run` — AI stays in the Worker. Public Recipe rows stay on **`RECIPES_DB`** (the old “one Site D1”). **`AUTH_DB` is extra** for Better Auth tables — no cross-DB FKs, nothing written to `RECIPES_DB` at sign-up ([ADR 0036](./adr/0036-better-auth-on-d1.md)). Diet still left a global recipes D1 for per-user DOs. [ADR 0030 accepted](./adr/0030-per-user-credit-dos.md).

**Public vs private (locked round 49 Q1):** every Generate writes a **public-by-URL** Recipe. Cook does **not** pick private. Saved is a private id list. Popular = 7-day saves of those public rows. [ADR 0032](./adr/0032-public-by-url-recipes.md).

**Chips (locked round 49 Q2):** leftover jasmine rice → `{ "name": "rice", "cooked": true }`. Uncooked omit `cooked`. [ADR 0018](./adr/0018-chip-canonicalizer.md).

**Cook:** granite-4.0-h-micro (`$0.017 / $0.112` per M, `stream: true` SSE). JSON = IBM `<schema>` + **Valibot**. Backup **llama-3.3-70b-instruct-fp8-fast** (`$0.293 / $2.253` per M, **on** JSON Mode list, also streams). JSON Mode **no streaming** and **does not name granite**. fp8 8B 410 **20 Nov 2026**. [ADR 0031](./adr/0031-granite-valibot-llama-backup.md).

**Query / validation:** **Drizzle** + DH [PR 322](https://github.com/fringe4life/dollar-holler/pull/322) stubs. **Valibot** for remotes and Recipe JSON (Kit Standard Schema): **steps 6–8**, **title ≤ 80**, **have ≤ 16**, **flags ≤ 8**. Effect stays Alchemy + **tagged errors only**. **No Effect SQL. No Effect Schema.** Reylo parked. [ADR 0029](./adr/0029-drizzle-valibot.md) · [#83](https://github.com/fringe4life/chef-llama/issues/83) superseded.

**Credits / user data:** **more DOs per user.** Credit SQLite DO named by Better Auth `getByName(userId)`: ledger **plus materialized** remaining / pack_sum / history so dashboard never `SUM`s from scratch and **never hits `RECIPES_DB`**. Sibling per-user DOs (not a kitchen sink). Public recipes stay **`RECIPES_DB`**. Gift pool = **separate** class (#76). [ADR 0030](./adr/0030-per-user-credit-dos.md) · [#82](https://github.com/fringe4life/chef-llama/issues/82).

**CI / repo:** **No Turbo v1.** bun cache + `actions.lock` + zizmor. **No Blacksmith.** Type-check: `svelte-check --tsgo` (TS ~6; skip svelte-check-native). **bundlewatch** on built client JS/CSS (0 JS public; `/pantry` ~43 KB brotli). Branch protection (D10) undecided. **Private when coding starts** (not when Packs ship). Infisical stays. [#79](https://github.com/fringe4life/chef-llama/issues/79) · [#80](https://github.com/fringe4life/chef-llama/issues/80) · [ADR 0021](./adr/0021-ci-preview-deps-hooks.md).

**Account:** v1 session-gated **`/account`** plus **`/account/usage`** (credit usage) and **`/account/packs`** (packs history) from the Credit DO. Settled Credit rows with a recipe id link to `/recipes/[slug]`. #78 CSS bars on usage. Keep **account popover** (theme, remaining Credits, sign out). **Not** on `/`. **No** Stripe Customer Portal / Clerk Billing / subscriptions. Deleting the account **deletes** that Cook’s recipes (410 on old URLs) — [ADR 0036](./adr/0036-better-auth-on-d1.md). Fallow `billing/` stays empty v2. [#84](https://github.com/fringe4life/chef-llama/issues/84).

**Pending / SSE:** v1 cupboard scene. SSE progress later; hide scene when both cannot fit. Cupboard **draft**; they work UI in Kombai separately; robot looks odd. **No Kombai Code.**

**Automations / slop:** two Automations only (architecture fortnightly, deps monthly → #87 workerd). **No slop cron.** `eslint-plugin-slop` `createSlopConfig()` on ESLint 10. Not `@antfu/eslint-config`.

### Locked this round (round 45–49 — moved off Recommended)

**Valibot + Drizzle (round 45 Q10 + owner Valibot):** [ADR 0029](./adr/0029-drizzle-valibot.md).

**Granite cook + llama-3.3-70b-fast backup (L30 + round 45):** [ADR 0031](./adr/0031-granite-valibot-llama-backup.md).

**No Turbo v1 (Q12 yes).** [#79](https://github.com/fringe4life/chef-llama/issues/79).

**Private at coding start (Q9 yes).** [#80](https://github.com/fringe4life/chef-llama/issues/80).

**`/account` + usage + packs; no Portal/Billing/subscriptions (Q13–Q14 yes).** [#84](https://github.com/fringe4life/chef-llama/issues/84).

**Two Automations + eslint-plugin-slop (Q3 yes = L31+L32).**

**Chef Llama UI name (round 45 Q2 yes).** Logo/wordmark also Chef Llama. **Product + GitHub rename (round 47 Q1; done — `fringe4life/chef-llama`).** [ADR 0004 accepted](./adr/0004-larder-and-chef-llama.md).

**No always-on (round 47 Q2).** Hibernate DOs. [#81](https://github.com/fringe4life/chef-llama/issues/81).

**`*.workers.dev` until they paste a hostname (round 47 Q3).** Do not invent one.

**Diet + Saved on sibling DOs; recipes on `RECIPES_DB` (round 48 leftover Q1).** Generate Worker RPCs `getActive()` then `env.AI.run` on the Worker. No AI inside a DO. Saved = ids. [ADR 0030 accepted](./adr/0030-per-user-credit-dos.md). `AUTH_DB` is a second D1 for sessions only ([ADR 0036](./adr/0036-better-auth-on-d1.md)); Diet still left the recipes D1 because per-user DOs scale out.

**v1 every Generate is public-by-URL (round 49 Q1 yes).** No privacy picker. Saved is a private id list. Popular ranks 7-day saves of those public rows (KV). Private Recipes = v2. [ADR 0032 accepted](./adr/0032-public-by-url-recipes.md) · [#88](https://github.com/fringe4life/chef-llama/issues/88).

**Leftover rice emit (round 49 Q2 yes).** `{ "name": "rice", "cooked": true }`. Uncooked omit `cooked`. [ADR 0018](./adr/0018-chip-canonicalizer.md) · [#47](https://github.com/fringe4life/chef-llama/issues/47).

### Previously locked

**URLs + region + API (round 30 Q1 yes):** unprefixed named files. `html lang="en-NZ"`. No `/en`, no `/nz`. Worker anycast. D1 **`primaryLocationHint: "oc"`**. No Sydney `placement.region`. Remotes = v1. **No** HTML `/v1`. Later REST `/api/v1`. [ADR 0027](./adr/0027-v1-urls-region-api.md) · [round 29](../internal/research-round29-i18n-urls-region.md).

**i18n (round 30 Q2 yes):** v2 **Paraglide** (`npx sv add paraglide`), prefix non-default. **`/popular/[type]`** with reserved BCP-47 first segments ([ADR 0038](./adr/0038-popular-type-allergy-safeguards.md)).

**Icons (round 29 Q1 yes):** no Lucide / Simple Icons / Tabler. Chrome = custom animated SVG. OAuth = **official** Google + Apple kits only. [ADR 0026](./adr/0026-no-icon-libraries.md) · [#73](https://github.com/fringe4life/chef-llama/issues/73) · [round 28](../internal/research-round28-oauth-icons.md).

**Pending SVG (round 29 Q2):** **draft, not locked.** Keep iterating. Hashed `<img>` mechanism still accepted (round 24).

**Pending iterate (round 27 Q1 yes, character no):** keep ticks → Recipe card as v1 pending SVG. Character redo this round.

**Checkout detect (round 26 Q1 yes):** living list — today `light-dark` + `showModal` + `popover` + `sessionStorage`. **Extend when Site CSS adds an API.** Fail → warn, no Session. Packs = three buttons. Not customizable select. [ADR 0025](./adr/0025-checkout-feature-detect.md) · [#72](https://github.com/fringe4life/chef-llama/issues/72).

**noscript (round 26 Q2 yes):** `src/app.html` — “JavaScript is off. You can still read this page. Cooking, signing in, and buying Credits need JavaScript.”

**Cancel (round 25 Q1–Q2 yes):** `enable_request_signal`. `stream: true` in-Worker + `request.signal`. Disconnect = cancel. Probe Neurons; if abort ≈ 768, **no** Credit/FCFS refund. Cook copy Credit-only (pending / refunded / counted). [round 25](../internal/research-round25-gpu-cancel.md) · [ADR 0024](./adr/0024-cook-pending-pantry.md) · [#71](https://github.com/fringe4life/chef-llama/issues/71).

**Pending SVG (round 24 Q1 yes):** `import cupboardUrl from './cupboard.svg?no-inline'`. File: [cupboard.svg](./designs/cupboard.svg). **Not** `static/`, **not** `data:`. [ADR 0024](./adr/0024-cook-pending-pantry.md).

**robots/CF (round 20):** Origin `robots.txt/+server.ts` Disallow `/pantry` `/saved` `/sign-in`. Disallow training: `GPTBot`, `Google-Extended`, `CCBot`, `ClaudeBot`, `Applebot-Extended`. Allow search by default: `Googlebot`, `bingbot`, `OAI-SearchBot`, `Claude-SearchBot`, `Applebot`. Do not Disallow `ChatGPT-User` / `Claude-User`. No `Disallow: /` for `*`. CF: Search **Allow**, Agent **Allow**, Training **Disallow**, Bot Preference Sync **on**. AI Crawl Control to enforce training. **Bot Fight Mode off** on Free. [round 20](../internal/research-round20-robots-ai-crawl-cache.md) · [ADR 0010](./adr/0010-seo-share-recipes.md).

**Cache (round 20 + 14 Nov 2026):** Site Worker Alchemy `cache: { enabled: true }`. **Default deny** `private, no-store`. Only `publicCache` may cache ([caching.md](./caching.md) · [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)). Public HTML `Cache-Control: public, max-age=B` + `Cloudflare-CDN-Cache-Control` — **not** `s-maxage` with SWR. Tags `popular` / `popular-top` / `popular-{type}` / `recipe-{ulid}`; cron snapshot purges changed tags. No `Set-Cookie` / `Vary: Cookie` on public GET. Cold cache on each deploy.

**Pending IA (round 21):** Stay `/pantry` → `goto /recipes/[slug]` after insert. Chat same. No Job-DO WS. **SSE/`query.live` = v2/v3.** v1 SVG only. [ADR 0024](./adr/0024-cook-pending-pantry.md).

---

## Routes

```
src/routes/
  (static)/                       # prerender, csr=false, 0 JS
    about/+page.svelte
    pricing/+page.svelte
    how-to/+page.svelte
    terms/+page.svelte
    privacy/+page.svelte
  (site)/                         # edge SSR, csr=false, Workers Cache, 0 JS
    +layout.svelte                # shared Nav.svelte — plain Sign in, no session
    +page.svelte                  # /  top 5 from popular:all; HTML form → /pantry?i=
    popular/+page.svelte
    popular/[type=popularType]/+page.svelte   # v2; matcher 404 is not cached
    recipes/[slug=slug]/+page.svelte     # public SSR; noindex; 410 after delete
  sitemap.xml/+server.ts
  robots.txt/+server.ts
  sign-in/+page.svelte            # Better Auth; last-used cookie read on server
  api/auth/[...all]/+server.ts    # svelteKitHandler
  (app)/                          # signed-in only — session cookies OK
    +layout.svelte                # credits pill; session; csr=true
    pantry/+page.svelte          # Generate pending lives here (rec)
    saved/+page.svelte
    account/+page.svelte         # overview; Credit DO
    account/usage/+page.svelte   # credit usage + #78 bars
    account/packs/+page.svelte   # packs history
```

Auth runs on `(app)`, `/sign-in`, `/api/auth/*`, remotes that need a Cook. **Never** on cached public pages. Public layouts **never import auth**. Public GET **must not** `Set-Cookie` or `Vary: Cookie`. **`getSession` must never run on public cached routes.** `/recipes/[slug]` sits **outside** `(app)` so the public cache stays cookie-free. Save on a 0-JS public recipe page is **open** (ADR 0036’s optional island cannot ship if the page has 0 JS and no auth import).

Headers: [caching.md](./caching.md).

| Route | Group | `csr` | `prerender` | Cache |
|---|---|---|---|---|
| `/about` `/pricing` `/how-to` `/terms` `/privacy` | `(static)` | `false` | `true` | Static Assets default (`public, max-age=0, must-revalidate` + ETag) |
| `/` | `(site)` | `false` | `false` | `publicCache` browser 60 / edge 3600 / swr 86400, tag `popular-top` |
| `/popular` | `(site)` | `false` | `false` | same, tag `popular` |
| `/popular/[type]` | `(site)` v2 | `false` | `false` | same, tag `popular-{type}`. Unknown type: 404 `private, no-store` |
| `/recipes/[slug]` | `(site)` | `false` | `false` | browser 300 / edge 31536000, tag `recipe-{ulid}`; **`noindex`**; **410** after account deletion |
| `/sign-in` | — | **`true`** | `false` | `private, no-store` |
| `/pantry` | `(app)` | **`true`** | `false` | `private, no-store` (~43 KB brotli Kit JS) |
| `/saved` | `(app)` | **`true`** | `false` | `private, no-store` |
| `/account` `/account/usage` `/account/packs` | `(app)` | **`true`** | `false` | `private, no-store` |

`sitemap.xml` / `robots.txt` = `+server`. Else `private, no-store` via the default-deny hook. Hashed assets: immutable 1 year. Theme: blocking inline script in `app.html` only.

### Still unfleshed (after `/` draft; not this canvas)

| Surface | URL? | What is missing |
|---|---|---|
| **Diet** | dialog on `/pantry` | Fields **locked** ADR 0008. Edit later (popover / v2 picker). No `/kitchen`. |
| **Generate pending** | state on `/pantry` (not a URL) | Hashed SVG `<img>` locked; **drawing draft** — [cupboard.svg](./designs/cupboard.svg). SSE phases **v2**. |
| **Sign-in** | `/sign-in` | Better Auth. Google, Apple, email OTP, Facebook. Last-used badge from cookie. Passkeys later. |
| **Exhausted / topup** | dialog + Checkout | sessionStorage pantry. SKUs **locked**. Detect **accepted** (living list, ADR 0025). |
| **404** | root + `(app)` `+error.svelte` | Boundary for Generate. Unknown `/popular/[type]` is a matcher 404. |
| **Popular** | `/` top 5 + `/popular` | v1 locked (ADR 0034/0037). v2 `/popular/[type]` ADR 0038 (list TBC). |
| **About / pricing / how-to** | `(static)` | Brochure pages; 0 JS. |
| Account | `/account` + `/account/usage` + `/account/packs`; popover | Credit DO materialized ledger. Diet edit later. |

Brief: [kombai-brief.md](./kombai-brief.md).

---

## Tools vs buttons

**Site composer** = unauthenticated brochure chat (rejected).

| Tool | Spends Credit? |
|---|---|
| `add_ingredients({ items: string[] })` | no |
| `remove_ingredients({ items: string[] })` | no |
| `make_recipe()` | **1 Credit** only after gift is exhausted and a Pack landed; else Neuron-FCFS |
| `topup({ pack?: string })` | no — opens hosted Stripe Checkout |

---

## Pay (locked Stripe you-MoR, NZD)

Hosted Checkout, Jobs Worker, Credit DO. NZ **2.65% + NZ$0.30** domestic. Polar rejected. Packs priced **NZD only** — no intl storefront, no USD catalog.

**NZ GST (individual, not legal advice):** [IRD must-register](https://www.ird.govt.nz/gst/registering-for-gst) at **NZ$60,000** in 12 months (past **or** expected) **or** if you add GST to prices. [Voluntary under $60k](https://www.ird.govt.nz/gst/registering-for-gst/registering-for-gst-voluntarily) is a **choice**. **Tax:** alerts on, collection off until that GST number is in Stripe.

**Profit floor:** Workers Paid **USD $5** ≈ **NZ$8.79/mo** (RBNZ 23 Oct 2026). Better Auth **$0** (no per-user fees; Clerk would be ~US$1,025/mo at 100k MRU). fp8 after 10k Neurons/day ≈ **NZ$0.00045**/Generate at 250 in / **768** out. Stripe **2.65% + NZ$0.30** is the real per-pack cost. **Locked SKUs NZ$8 / $16 / $32 → 20 / 50 / 120 Credits.** Checkout uses Dashboard Price **lookup_key** `pack_a`/`pack_b`/`pack_c` — not `price_data`. [round 17](../internal/research-round17-scale-popular-lock.md).

---

## Recipe JSON (`kind`)

Shared: `title` (≤ 80), `minutes`, `servings`, `kcal`, `kcal_over`, `have` (≤ 16), `need`, `steps` (6–8). `flags` omitted if none (≤ 8 when present). See [prompt-payload.md](./prompt-payload.md).

```json
{
  "kind": "swap",
  "title": "Tofu fried rice",
  "minutes": 25,
  "servings": 2,
  "kcal": 480,
  "kcal_over": false,
  "have": ["tofu", "rice", "soy"],
  "need": ["oil"],
  "steps": ["…"],
  "flags": ["vegan"],
  "swaps": [{ "from": "chicken", "to": "tofu" }]
}
```

`kind: "plain"` — **no** `swaps` key. UI lists swaps only on `"swap"`. `have` uses `to`.

---

## Theme (tokens; `light-dark()` only)

Named variables **are** the theme. StyleX `defineVars` with `--` keys. Native overlays. **No** component pack. **No** `.dark` fallback.

```css
:root { color-scheme: light dark; }
html[data-colorscheme="dark"] { color-scheme: dark; }
html[data-colorscheme="light"] { color-scheme: light; }
html:has(#scheme-dark:checked) { color-scheme: dark; }
html:has(#scheme-light:checked) { color-scheme: light; }
```

Blocking inline script in `app.html` (cookie + `light-dark()`). **Never** stamp theme from cookies on the server for public pages. Radios `#scheme-system` `#scheme-light` `#scheme-dark`.

---

## Diet (saved defaults; array-ready)

A **Diet** is one named set of diet flags, allergies, typical kcal, servings, optional max time. Stored in the Cook’s sibling **Diet DO**, not Better Auth user metadata, not the pantry chip list, not the Credit DO, not `RECIPES_DB`.

**v1:** first-run **blocking dialog on `/pantry`** creates Diet #1 and sets `active_diet_id`. First Generate is blocked until that row exists. Fields: name (default Home), flags, allergies, optional kcal, servings (default 2), optional max_minutes. This-run chips **override** the active Diet; Chef Llama **swaps** pantry that breaks hard constraints. Site Worker RPCs `getActive()` and **attaches** that row on the Generate request to Workers AI.

**v2 UI (schema now):** many Diets; picker sets active; Generate still reads **one** `getActive()` row. Do not refetch the Cook blob or the whole Diet list on Generate.

---

## Errors + Popular

`error(404, 'Not found')` puts `message` on `+error.svelte`. Unknown throws stay `"Internal Error"`. Effect `catchTag` → `error(status, safeMessage)`. **One** root `+error.svelte` + **`(app)/+error.svelte`**. `<svelte:boundary>` `failed`+`reset` around Generate — not one error file per route.

Popular: **SSR HTML** on `/` (top 5) and **`/popular`**. Rank: rolling **7-day saves of public-by-URL rows**, cap 20, ≥5 distinct savers, cron snapshot ([ADR 0023](./adr/0023-popular-saves-window.md) · [ADR 0032](./adr/0032-public-by-url-recipes.md) · [ADR 0034](./adr/0034-popular-cap-cache.md)). Do not rank a private Recipe (none in v1). Unknown `/popular/[type]`: matcher 404, not cached.

---

## Observe (v1)

Workers Logs (`observability.enabled`) + Issues + Analytics Engine datapoint per Generate. Effect tagged errors → `error()`. **No Sentry.** No Effect NodeSdk OTel on workerd.

## Chips (prompt shrink)

Canonicalize in-process before the prompt: strip units/qty, closed synonyms, dedupe, **max 16**. Leftover rice emits `{ "name": "rice", "cooked": true }` (same for leftover chicken). Uncooked chips omit `cooked`. Already-cooked chips change the Recipe and **must be highlighted**. Messy **lists** never call a model. Sentence-like paste **rejects** in v1. **Clairic is v2/v3** ([ADR 0018](./adr/0018-chip-canonicalizer.md)). Pantry label: **Ingredients, not sentences.** WebMCP `add_ingredients` uses the same remote.

## Scale (recipe detail)

+/- people on `/recipes/[slug]`. Client `n / recipe.servings`, clamp 1–12, start at Diet servings. No Generate. kcal **per serving** stamp stays; show **total** `kcal * n`. Minutes and steps frozen. Names-only `have`/`need` do not multiply. [ADR 0022](./adr/0022-recipe-scale-client.md).

## Generate write path (v1)

Do **not** await Vectorize or embed on the cook request. Site Worker RPCs Diet `getActive()` and Credit DO **`hold`** (coalesce Credit SQL + materialized remaining/pack_sum, no `await` between writes, **no AI inside the DO**). Attach Diet on the granite request. After Valibot-ok JSON: D1 `batch()` insert a **public-by-URL** recipe (no privacy picker); Credit DO **`settle`** (materialized remaining/pack_sum in the same SQL tx); enqueue `index_recipe`. On AI/Valibot fail or cancel: **`release`** the hold (cancel lock still applies if the GPU used ~768 tokens). Keep the **HTTP request open** for the AI (unlimited wall while connected); do not finish granite in `waitUntil` (30 s after disconnect). Parked v2/v3 writes: [ADR 0019](./adr/0019-write-path-v2-parked.md). **Storage v2 OPTION (not decided):** nightly cron merges near-duplicate recipes, 301 the merged id, purge `recipe-{ulid}`; embed only saved recipes in Vectorize; never merge different ingredient sets or free-from/allergy tags. Pending UI: [ADR 0024](./adr/0024-cook-pending-pantry.md). Cancel **accepted** round 25. Checkout detect: [ADR 0025](./adr/0025-checkout-feature-detect.md). Visibility: [ADR 0032](./adr/0032-public-by-url-recipes.md). Credits (hold / settle / release) are also described in [tech-stack.md](./tech-stack.md) Credits.

## Fonts

**System stack only** (`--font-display` / `--font-sans` / `--font-mono` in [design.md](./design.md)). No Fontsource, no Fraunces / Source Sans 3, no later webfont pass. **Never** Google Fonts `@import`/`<link>`. [ADR 0015](./adr/0015-fontsource-preload.md) superseded · [#56](https://github.com/fringe4life/chef-llama/issues/56).

---

## SEO + mail (v1)

| URL | Index | Share / OG |
|---|---|---|
| `/` `/popular` `/about` `/pricing` `/how-to` `/terms` `/privacy` | **yes** (`/` `/popular` edge SSR; rest prerender) | `<svelte:head>` + static meal SVG |
| `/pantry` `/saved` `/sign-in` | **noindex** (session) | n/a |
| `/recipes/[slug]` | **noindex** | public SSR, undecorated `og:url`, same SVG |
| Popular ids | **yes** in sitemap | index only if Popular |

| Mail | Sender | Brand |
|---|---|---|
| OTP / verify | **TODO** CF Email vs Resend | Same Site logo; From `no-reply@mail.<domain>` |
| Pack receipt / refund | Stripe automatic receipts | Stripe Email-receipt logo + public details |
| Need topup / account cancelled | CF Email Sending | Same Site logo; **inline hex** |
| Inbound support | CF Email Routing | `cook@<domain>` Reply-To |

---

## Issue map

| Issue | Stance |
|---|---|
| [#18](https://github.com/fringe4life/chef-llama/issues/18) / [#33](https://github.com/fringe4life/chef-llama/issues/33) / [#36](https://github.com/fringe4life/chef-llama/issues/36) | **Stripe you-MoR.** GST **$60k** must / voluntary earlier. Tax Basic alerts on, collection off. Polar out. |
| [#24](https://github.com/fringe4life/chef-llama/issues/24) | Polar researched; **not chosen**. |
| [#34](https://github.com/fringe4life/chef-llama/issues/34) | **`kcal_over`**. |
| [#35](https://github.com/fringe4life/chef-llama/issues/35) | ogygia **dropped** (14 Nov 2026). 0-JS Kit. [ADR 0011](./adr/0011-stay-kit-ogygia.md) superseded · [ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md). |
| [#11](https://github.com/fringe4life/chef-llama/issues/11) / [#31](https://github.com/fringe4life/chef-llama/issues/31) / [#37](https://github.com/fringe4life/chef-llama/issues/37) | `light-dark()` only; **blocking inline script** in `app.html`; never server-render theme from cookies on public pages (ADR 0037). |
| [#28](https://github.com/fringe4life/chef-llama/issues/28) / [#38](https://github.com/fringe4life/chef-llama/issues/38) | **Diet** dialog rec; Kitchen name retired. |
| [#32](https://github.com/fringe4life/chef-llama/issues/32) | One logo; OTP / Stripe / product mail. |
| [#39](https://github.com/fringe4life/chef-llama/issues/39) | Fontsource pin **superseded**. System stack only. |
| [#40](https://github.com/fringe4life/chef-llama/issues/40) | **Better Auth** + `/sign-in` ([ADR 0036](./adr/0036-better-auth-on-d1.md)). Clerk rejected. |
| [#41](https://github.com/fringe4life/chef-llama/issues/41) | Topup dialog + Checkout + sessionStorage **accepted**. |
| [#42](https://github.com/fringe4life/chef-llama/issues/42) | `+error.svelte` + Generate boundary; Popular is SSR on `/` and `/popular` (ADR 0037). |
| [#43](https://github.com/fringe4life/chef-llama/issues/43) | **Diet** sibling DO + `getActive()` **accepted** (not D1). |
| [#44](https://github.com/fringe4life/chef-llama/issues/44) | Pack SKUs **locked** NZ$8/$16/$32 → 20/50/120. |
| [#45](https://github.com/fringe4life/chef-llama/issues/45) | Empty Fallow `byo-ai`; wrap keys; **paste key** + cheap ids. |
| [#46](https://github.com/fringe4life/chef-llama/issues/46) | Observe: Logs + Issues + Analytics Engine; **no Sentry** **accepted**. |
| [#47](https://github.com/fringe4life/chef-llama/issues/47) | Chip canonicalizer; leftover rice `{ "name": "rice", "cooked": true }` **accepted**. Lists v1; Clairic parked. |
| [#48](https://github.com/fringe4life/chef-llama/issues/48) | `max_tokens` **768** **accepted**; conciseness = prompt+Schema, not a smaller cap. |
| [#49](https://github.com/fringe4life/chef-llama/issues/49) | Write path **accepted**; Turso/Postgres/Pipelines parked ADR 0019. |
| [#50](https://github.com/fringe4life/chef-llama/issues/50) | Conciseness package; 768 is a cap. Valibot: steps **6–8**, title **≤ 80**, have **≤ 16**, flags **≤ 8**. |
| [#51](https://github.com/fringe4life/chef-llama/issues/51) | Varlock + **Infisical Free accepted**. |
| [#52](https://github.com/fringe4life/chef-llama/issues/52) | CI lint without secrets; Better Auth secret on workers.dev preview. |
| [#53](https://github.com/fringe4life/chef-llama/issues/53) | Dependabot + husky + Cursor ESLint/Fallow hooks. |
| [#54](https://github.com/fringe4life/chef-llama/issues/54) | Lists v1; Clairic **v2/v3**. |
| [#55](https://github.com/fringe4life/chef-llama/issues/55) | Infisical Free **accepted**. |
| [#56](https://github.com/fringe4life/chef-llama/issues/56) | Fontsource/Fraunces **superseded**. System stack only. |
| [#57](https://github.com/fringe4life/chef-llama/issues/57) | Diet first-run fields **accepted**. |
| [#58](https://github.com/fringe4life/chef-llama/issues/58) | lookup_key pack_a/b/c; SKUs **locked**. |
| [#59](https://github.com/fringe4life/chef-llama/issues/59) | Recipe scale client conversion-factor **accepted**. |
| [#60](https://github.com/fringe4life/chef-llama/issues/60) | Popular = 7-day saves of **public-by-URL** rows **accepted**. |
| [#61](https://github.com/fringe4life/chef-llama/issues/61) | ogygia **dropped**; 0-JS public pages (ADR 0037). |
| [#62](https://github.com/fringe4life/chef-llama/issues/62) | **v2** multi-Diet picker. |
| [#63](https://github.com/fringe4life/chef-llama/issues/63) | **v2/v3** Turso / Postgres / Pipelines. |
| [#64](https://github.com/fringe4life/chef-llama/issues/64) | **v2** qty+unit scale. |
| [#65](https://github.com/fringe4life/chef-llama/issues/65) | ogygia gone from Chef Llama. DH may still demo SPA/lakes. |
| [#66](https://github.com/fringe4life/chef-llama/issues/66) | Cheap loop **accepted**. `/` + sticker = **working draft** (not locked, not Code). |
| [#67](https://github.com/fringe4life/chef-llama/issues/67) | Copy Matt grill skills into larder `.agents/skills/` **accepted** (not committed). |
| [#68](https://github.com/fringe4life/chef-llama/issues/68) | **Accepted:** robots training Disallow; Search/Agent Allow; Workers Cache **default-deny** + `publicCache` (ADR 0037). |
| [#69](https://github.com/fringe4life/chef-llama/issues/69) | **Accepted:** pantry pending SVG; goto recipe after id; chat same. SSE **v2**. |
| [#70](https://github.com/fringe4life/chef-llama/issues/70) | **v2/v3** SSE / `query.live` job phases. |
| [#71](https://github.com/fringe4life/chef-llama/issues/71) | GPU abort **accepted** (round 25). |
| [#72](https://github.com/fringe4life/chef-llama/issues/72) | Checkout detect **accepted** (living list) + noscript. |
| [#73](https://github.com/fringe4life/chef-llama/issues/73) | **Accepted:** no Lucide/Simple Icons; official OAuth SVGs only. |
| [#79](https://github.com/fringe4life/chef-llama/issues/79) | Cheap cached **secure** Actions (lockfile, bun cache). Round 38: `svelte-check --tsgo` settled. bundlewatch added. Not Turbo/Blacksmith v1. Extends #52/#53. |
| [#80](https://github.com/fringe4life/chef-llama/issues/80) | **Accepted:** public until **coding starts**, then private. Infisical stays. Clone ≠ hide the live Worker. |
| [#81](https://github.com/fringe4life/chef-llama/issues/81) | Rec: not always-on. Paid $5 is not `min_instances`. Leftover grill Q8. |
| [#82](https://github.com/fringe4life/chef-llama/issues/82) | **More DOs per user.** Credit DO materialized aggregates; Diet + Saved sibling DOs; dashboard skips global D1. Popular counts: `save_count` on the D1 recipe row **or** a queue event — mechanism **OPEN**. ADR 0030 **accepted**. |
| [#83](https://github.com/fringe4life/chef-llama/issues/83) | **Superseded** by [ADR 0029](./adr/0029-drizzle-valibot.md). Drizzle + DH stubs. Effect SQL **rejected**. Effect tagged errors only. Reylo parked. |
| [#78](https://github.com/fringe4life/chef-llama/issues/78) | CSS sideways bars + rail **widget** on `/account/usage`. Not the spend/packs **page**. |
| [#84](https://github.com/fringe4life/chef-llama/issues/84) | **Accepted:** `/account` + usage + packs. No Portal/Billing/subscriptions. |
| [#88](https://github.com/fringe4life/chef-llama/issues/88) | **Accepted:** every v1 Generate is public-by-URL. No privacy picker. Private Recipes = v2. |
| [#89](https://github.com/fringe4life/chef-llama/issues/89) | **Proposed:** once-only **Starter pack** NZ$4 / 10 Credits. Paid; does not reverse no-signup-Credits. ADR 0033. |
| [#90](https://github.com/fringe4life/chef-llama/issues/90) | **Accepted** (14 Nov 2026): cap 20, ≥5 distinct savers, cron snapshot, `/popular` v1. Quiet-week fill still open. ADR 0034 · ADR 0037. |
| [#91](https://github.com/fringe4life/chef-llama/issues/91) | **Proposed:** on-site Generate do’s and don’ts (copy/IA). No extra ADR. |
| [#92](https://github.com/fringe4life/chef-llama/issues/92) | **Proposed:** reconsider guest Generate; rec keep sign-in (c). ADR 0035. Login gate stays ([ADR 0036](./adr/0036-better-auth-on-d1.md)). |
