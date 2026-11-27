# Kombai pass — design brief (GO: one `/` + sticker)

**Token-cheap loop (round 19 accepted).** Coinnich **GO** 28 Oct 2026. Electron **2.0.160**. Design mode **only** landing `/` + token sticker. Variants/Passes **1**. **Do not** Code-design every route.

**Working draft (not locked, not Code):** the canvases in `.kombai/canvas/` — `index`, `landing`, `account`, `chart`, `type`, and `brand` for the mark; `index.canvas` lists what each holds. The `designs/` HTML mocks are gone; do not cite them. Improve in place. **No Code design, no extra routes** until Coinnich accepts. Fonts: three system families, no webfonts (see [theme.md](./theme.md#fonts)).

0. Repo CSS: shadcn **names** as `--` vars, `light-dark()` only, full oklch colours (see [theme.md](./theme.md)). Iterate the existing canvas nodes (`.kombai/canvas/`) with **no** Kombai.
1. Kombai **Design mode**, **one** `/` + token sticker. Settings: Variants **1**, Passes **1**. Attach a Chef Llama `.ds` from that CSS / `design.md`. **Edit Designs** by hand (no prompt). No **Code design**.
2. Coinnich accepts landing + tokens.
3. Next canvas screen (pantry or recipe), same `.ds`.
4. Then Code design / Kit implement.

Skip Paper MCP during exploration (**100 calls/week**). Do not Figma MCP. Do not Plan → Approve and Code of the whole app.

**Working draft, not Code.** Kit later against StyleX `--` tokens, native Dialog/Popover (no anchor positioning), **0-JS public pages** per [product.md](./product.md) and [caching.md](./caching.md). Wordmark **Chef Llama**. The cook is **Llama**.

## Closed

- Named CSS tokens **are** the theme. `light-dark()` only. No `.dark` fallback. No shadcn / shadcn-svelte / bits-ui components.
- Kit 3, not Astro. No Site composer. No Guest Generate. Public Site/recipe pages are **0 JS** (shared Nav, plain Sign in, no session). **Do not** design hydrating islands or a second SPA chrome layer — App chrome is Kit `(app)` layout.
- Credits: 0 on signup; FCFS Neurons then Packs; hosted Stripe Checkout (no Stripe.js).

## Screens this pass must cover (several have no URL yet)

| Surface | URL today | Design as |
|---|---|---|
| Site landing | `/` | Brochure + curated **Try me** starter pantries (breakfast / lunch / dinner / dessert; each meal has common / moderately common / uncommon tiers; SSR HTML, not an island). Tap → `/pantry?i=`. NZ chip lists in [product.md § Try me](./product.md#try-me). |
| **Recent** | `/recent` | Date-sorted published recipes (SSR HTML). Short cache; no cron; no ranking. Free-tier publish by default. Privacy: recipe only — no profile / Diet / avoid list. |
| Terms / privacy | `/terms` `/privacy` | Long legal. Minimal chrome. |
| Pantry | `/pantry` | Chips (≥3 non-staple), Diet switcher + this-run toggles (flags / servings / time / kcal / skill / method / devices; avoid list always wins), generate, credits pill. Pending **stays here** (a draft placeholder exists in `pantry.canvas`; the final loading design is still to come), then goto recipe. No extra routes. No Code. |
| Recipe | `/recipes/[slug]` | Method, `kcal` + `kcal_over`, swaps if `kind: "swap"` (avoid-list or flag conflict; highlighted), which Diet it was cooked for, save. Servings scaling is v2. Narrow = same route as sheet. |
| Saved | `/saved` | List. Empty state. |
| **Onboarding** | `/onboarding` route | First-run Diet #1, devices owned (time / feasibility), staples customise, explain free-tier → Recent publish. Replaces blocking Diet dialog. |
| **Diet** | switcher on `/pantry` (+ edit UI) | Name, flags, avoid list (ingredients + dairy/wheat group chips), optional kcal, servings default 2, optional max time, skill (three levels), method + optional devices. Not `/kitchen`. **v1 multi-Diet:** switcher sets active Diet before Generate; add / rename / edit / delete; delete-active falls back to another Diet. |
| **Sign-in** | `/sign-in` | Google + email OTP only. Last-used badge. Chef Llama chrome around Better Auth. Passkeys later. |
| **Exhausted / topup** | dialog then Checkout | Pack SKUs **NZD $8 / $16 / $32** → 20 / 50 / 120 Credits. No card fields. Return to `/pantry`. |
| **404** | `+error.svelte` | Site vs `(app)` chrome. Try me hole uses boundary, not this. |
| **Try me** | `/` | Four meals × three tiers (common / moderately common / uncommon). Cards → `/pantry?i=`. Static committed NZ lists in product.md. Counted Popular ingredients / `/popular/[type]` are v2 (no `/popular` in v1). |
| Account | popover | Theme radios, credits, sign out. |

Photo and chat: **slots only**, disabled.

## Visual

Parchment / olive / paprika / cast iron (palette still open: four on [`landing.canvas`](../.kombai/canvas/landing.canvas), no colour value in any doc — [theme.md § Colour tokens](./theme.md#colour-tokens-shadcn-style-semantic-names)). Light = kitchen daylight. Dark = closed cupboard. Display **serif** on wordmark + recipe titles; **sans** on chrome. **System font stack only** (`--font-display` / `--font-sans` / `--font-mono` in [theme.md § Fonts](./theme.md#fonts)). No Fontsource pass. Never Google Fonts CSS. Hairline borders, tape-label chips. No gradient mesh, no glow orbs, no 3D food.

## Motion — CSS only ([emilkowalski/skills](https://github.com/emilkowalski/skills) `emil-design-eng` + `animate`)

No JS animation libraries. No `transition: all`. No `scale(0)`. Enter/exit: `transform` + `opacity`, `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. UI under 300ms. Popovers scale from trigger; dialogs stay centered. `@starting-style` on dialog/popover. View transitions pantry ↔ recipe. Landing Try me / Recent: scroll-driven or `@property` trigger, not a JS observer. Chip add / Enter: **no** animation (high frequency). `prefers-reduced-motion`: keep opacity, drop translate. Hover scale only under `(hover: hover) and (pointer: fine)`.

| Moment | Animate? | How |
|---|---|---|
| Button press | yes, feedback | 100–160ms scale(0.97) |
| Chip popover | yes | 125–200ms `@starting-style`, origin at chip |
| Credits exhausted dialog | yes | 200–300ms centered |
| Diet first-run | yes, rare | short opacity |
| Try me into view | optional | scroll-driven opacity |
| Generate pending | cupboard → Recipe-card SVG on `/pantry` (not a URL). **Draft:** not drawn yet — metallic hover chef-bot + wrapping visor + smile; head = the brand mark (`.kombai/canvas/brand.canvas`) | CSS `@keyframes` in the SVG, not JS. `prefers-reduced-motion`. No SSE copy v1. No Code now |

## Theme toggle (inline script in `app.html`)

Radios `#scheme-system` `#scheme-light` `#scheme-dark`. The mechanism — blocking inline script, `localStorage` choice, `data-colorscheme` on `<body>`, **no cookies** — is [theme.md § Light and dark](./theme.md#light-and-dark) and is not restated here. Do not put radios inside the chip list.

## Copy / stress ([break-ui](https://github.com/emilkowalski/skills/tree/main/skills/break-ui))

Long avoid-list string, one-letter names, 12 chips, 0 Credits, `kcal_over: true`, `need` of 2 Staples, Try me uncommon tier (e.g. whitebait / pāua), 404 from a shared recipe URL.

## Out of scope this pass

App implementation, pantry/recipe/saved/sign-in canvases, Code design, payments Dashboard, OAuth production clients. Paper MCP while exploring.
