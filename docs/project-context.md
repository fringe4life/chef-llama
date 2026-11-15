# AI chef site — project context

Owner: Coinnich c. GitHub org/user: `fringe4life`.

## Product

Users enter a list of ingredients (later: photo → ingredient list). A non-frontier agent proposes recipes that fit those ingredients. Later: chat-to-recipe via a WebMCP polyfill.

## Must-haves (initial)

- SvelteKit **v3** app on **Cloudflare Workers**
- **Alchemy v2** for infra/bindings (pin latest v2 exactly when coding starts)
- **Effect v4** for errors (and payments flow)
- Cloudflare: Workers AI, RAG/KV for similar recipes after a recipe is created, cache for popular recipes, Queues, Durable Objects for user credits
- Auth: **Better Auth** on **AUTH_DB** (Workers + Drizzle; `userId`, not `clerkUserId`). Payments stay Stripe Checkout, not Clerk Billing.
- Styling: **StyleX**; custom components using native browser APIs (anchor positioning, Popover, Dialog) where possible
- Design: **Kombai** to produce UI; **paper.design** (HTML/CSS, npm package, MCP) preferred over Figma (limited MCP). Do as much design work locally. shadcn-compatible theming + light/dark
- GitHub repo (better name than `ai-chef-website`), issues, research tracking, GitHub roadmap/project so implementation stays on track

## Priority

1. Design
2. Tech stack + Cloudflare bindings decisions
3. Repo + GitHub project/roadmap

## Out of scope until later

Photo → ingredients, WebMCP chat, production payments scale.

## Design direction

See [`docs/design.md`](./design.md) and local mock [`docs/design-mock.html`](./design-mock.html). Working visual name **Larder** (product name still open).

- Pipeline: Kombai (free 300 credits/mo) generates UI; implement from HTML/CSS in-repo. Paper Desktop local MCP (`paper mcp`) is optional and still costs **100 MCP calls/week** on free — it does not bypass Paper’s meter. Skip Figma MCP. If Paper quota is too tight, use Pencil (`@pencil.dev/cli`) next.
- Theme: shadcn **named CSS tokens** (`--foreground`, `--primary`, `--background`, …) consumed by StyleX `defineVars` with `--` keys; resolve with `light-dark()` + `color-scheme`. Token set **Larder**: parchment/olive/paprika/cast-iron; native Dialog, Popover, CSS anchor. **No** shadcn / shadcn-svelte / bits-ui components.
- v1 IA: pantry chips → generate → detail → saved/similar → credits/account. Photo upload and chat-to-recipe are later slots on pantry and detail.

## Open decisions

- Product/repo name (research elsewhere proposes `larder`; not locked here)
- paper.design MCP vs other free-tier design tools
- ~~Whether `svelte-clerk` can be used on SvelteKit 3~~ **closed:** Clerk rejected; Better Auth ([ADR 0036](./adr/0036-better-auth-on-d1.md)).

## Decisions

Recorded 2026-10-21 in `docs/tech-stack.md`. Do not reopen without new evidence.

- **Runtime:** SvelteKit 3 on Cloudflare **Workers** (Static Assets), not Pages-legacy / Workers Sites. Alchemy `Cloudflare.Website.SvelteKit` is the default deploy; official `@sveltejs/adapter-cloudflare` 8.x + Wrangler ≥ 4.118 is the fallback.
- **IaC:** Alchemy **v2** is the source of truth for Workers and bindings. Pin the **latest v2 exactly when coding starts** (no floating `beta.83+`). Wrangler-only is fallback only.
- **Errors:** Effect **v4** (`Data.TaggedError` + `tryPromise`) wraps AI, Stripe, and binding calls on the server.
- **AI:** Workers AI `@cf/ibm-granite/granite-4.0-h-micro`. Backup `@cf/meta/llama-3.3-70b-instruct-fp8-fast` ([ADR 0031](./adr/0031-granite-valibot-llama-backup.md)). Embeddings `@cf/baai/bge-base-en-v1.5`.
- **Similar recipes:** Vectorize (primary) + D1 canonical rows. Not KV. R2 later for photos only.
- **Popular cache:** KV cron snapshot (`popular:all`). Not Cache API. Workers Cache **on** with default-deny `private, no-store`; only `publicCache` may opt in ([ADR 0037](./adr/0037-zero-js-public-cache-guardrails.md)).
- **Jobs:** one Queue (`generate_recipe`, `index_recipe`, later `ocr_photo`) consumed by a separate Jobs Worker.
- **Credits:** SQLite Durable Object per Better Auth `userId`; **hold, then settle or release**; Stripe webhook credits with idempotent ledger ids. DO class lives on the Jobs Worker.
- **Auth:** Better Auth on Workers via first-party SvelteKit (`svelteKitHandler`, Drizzle on **AUTH_DB**). Opaque D1 sessions. Not Clerk. Not OpenAuth as the session SDK. [ADR 0036](./adr/0036-better-auth-on-d1.md).
- **Payments:** Stripe Checkout hosted you-MoR → DO. Tax Basic alerts on, collection off until registered. Clerk Billing is not the generation ledger.
- **Style:** StyleX `defineVars` with **`--` shadcn token names**. Tokens **are** the theme. `light-dark()` **only**. `data-colorscheme` + `:has()`. Component pack **closed**.
- **Native UI:** `<dialog>` + Popover API; CSS anchor positioning with OddBird polyfill when unsupported.
- **WebMCP:** later (`@mcp-b/webmcp-polyfill`); not in initial build.
- **Lint:** ESLint **v10+** (flat config + Svelte/Kit, StyleX, Effect barrel plugins) for per-file rules; **Fallow** for the module graph; Cursor MCP for **both** (`@eslint/mcp` + `fallow-mcp`).

## Product decisions

Recorded 2026-10-21 in [`docs/product.md`](./product.md). Defaults for Coinnich to accept/reject; not a new visual pass.

- **v1 loop:** pantry chips + **visible** constraints → one recipe / one credit → detail route → save / regenerate / similar. Photo and chat-refine stay later (`#4`, `#14`).
- **Constraints are v1, not later-lite:** gluten-free, vegetarian, vegan, allergy chips (plus other text), optional kcal/serving cap, servings stepper, max-time chips. Diet/allergies are hard; kcal and time are targets with a visible miss.
- **No surprise chat:** refine-in-chat is specified for later, not unlabeled chrome on generate.
- **IA default:** app-only (pantry is `/`). Alternative: marketing `/` vs app `/app`. Cut long-scroll + ticket rail (rejected).
- **Looks:** all three Kombai directions rejected; night-service ticket rail especially out. Palette still open.
- **GitHub:** map onto `#3`–`#14`; new titles listed in `product.md` (not filed — `gh` unauthenticated).
