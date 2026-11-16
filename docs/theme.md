# Theme: tokens, colour scheme, typography, z-index, motion, icons, design loop

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Working material: the StyleX tokens spike (`/workspace/spikes/stylex-tokens/PROPOSAL.md`).

## Decided

### Tokens are the theme
- The theme **is** the shadcn-style **named CSS custom properties**: `background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `radius`, optional `chart-*`. Every custom property in the app comes from this theme.
- The name is **Chef Llama**. The token file is `src/lib/theme/tokens.css` plus `*.stylex.ts`. There are no product-specific extra colour tokens.
- StyleX `defineVars` uses **`--` keys**, so the emitted names are the same (no hashed vars).
- Not the shadcn / bits-ui component pack. No StyleX `createTheme`. Native `<dialog>` / `[popover]` read the same variables.
- Groups: colour, radius, type, spacing.

### Colour tokens: shadcn-style semantic names, full oklch colours inside `light-dark()`
- These are the **shadcn-style semantic theming tokens**: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive` (each with a `-foreground` pair where text sits on it), `--border`, `--input`, `--ring`, plus `--radius` (see [Radius and spacing](#radius-and-spacing)). The table maps each name to our oklch `light-dark()` value.
- Each colour token is one full colour per scheme: `--x: light-dark(oklch(...), oklch(...))`. No HSL channel triples and no `hsl(var(--x))`.
- Values below are the earlier HSL palette converted to oklch (box-computed 16 Nov 2026, sRGB → OKLab); they are a starting point for the design pass, not locked.

| Token | Value | Role |
|---|---|---|
| `--background` | `light-dark(oklch(97.4% 0.008 82), oklch(19.5% 0.006 67))` | Page (parchment / cast iron) |
| `--foreground` | `light-dark(oklch(26.2% 0.017 57), oklch(95.9% 0.009 82))` | Body text |
| `--card` | `light-dark(oklch(99.4% 0.002 85), oklch(22.9% 0.007 67))` | Surfaces (flour) |
| `--card-foreground` | same as `--foreground` | |
| `--popover` / `--popover-foreground` | same as card | Popover, dialog |
| `--primary` | `light-dark(oklch(44.9% 0.063 125), oklch(64.2% 0.079 125))` | Actions (olive oil) |
| `--primary-foreground` | `light-dark(oklch(98.1% 0.007 85), oklch(19.5% 0.006 67))` | |
| `--secondary` | `light-dark(oklch(93.0% 0.017 71), oklch(28.3% 0.009 67))` | Quiet chrome (linen) |
| `--secondary-foreground` | `light-dark(oklch(30.4% 0.021 57), oklch(93.0% 0.012 82))` | |
| `--muted` | `light-dark(oklch(92.9% 0.011 78), oklch(27.2% 0.007 68))` | Wells, idle chips |
| `--muted-foreground` | `light-dark(oklch(49.5% 0.019 58), oklch(75.8% 0.019 77))` | Helper text |
| `--accent` | `light-dark(oklch(52.8% 0.133 37), oklch(60.9% 0.132 38))` | Highlights, saved (paprika) |
| `--accent-foreground` | `light-dark(oklch(98.1% 0.007 85), oklch(19.5% 0.006 67))` | |
| `--destructive` | `light-dark(oklch(51.3% 0.182 29), oklch(60.5% 0.177 28))` | Remove chip |
| `--border` | `light-dark(oklch(86.8% 0.018 71), oklch(32.4% 0.009 67))` | |
| `--input` | `light-dark(oklch(86.8% 0.018 71), oklch(34.4% 0.010 67))` | |
| `--ring` | `light-dark(oklch(44.9% 0.063 125), oklch(69.6% 0.073 125))` | Focus |

### Radius and spacing
- `--radius` `0.5rem`; `--radius-sm` `calc(var(--radius) - 4px)` (chips, icon buttons); `--radius-md` `var(--radius)` (inputs, menus); `--radius-lg` `calc(var(--radius) + 4px)` (cards); `--radius-xl` `1rem` (dialogs, detail sheet). Slightly squared.
- 4px grid: `--space-1` `0.25rem` … `--space-16` `4rem`. `--space-page` `1.25rem` (mobile) / `2rem` (desktop). Chip gap `--space-2`, card padding `--space-5`.
- Type scale: `--text-xs` … `--text-2xl` (`0.75` / `0.875` / `1` / `1.125` / `1.5` / `1.875rem`), `--leading-tight` `1.2`, `--leading-body` `1.55`, `--tracking-display` `-0.02em`.

### Light and dark
- **`light-dark()` only** + `color-scheme`. No `.dark` class fallback, no `mode-watcher`.
- **No cookies.** The theme is never server-rendered (a cookie read would `Vary` or poison Workers Cache on public pages).
- A small **blocking inline script** is the first child of `<body>` in `app.html`. It reads the saved choice from `localStorage` and sets `data-colorscheme="light" | "dark"` on `<body>` (approved placement: `:has()` cannot match an attribute on `<html>` itself, so it lives on `<body>`), or leaves it unset for "system". Because it blocks parsing before any body content, there is no flash. It also wires the theme radios (`#scheme-system` / `#scheme-light` / `#scheme-dark`) to update the attribute and `localStorage`.
- CSS detects the choice with `:has()` on the data attribute:
  ```css
  :root { color-scheme: light dark; }                                   /* no attribute: follow the OS */
  :root:has(> body[data-colorscheme="light"]) { color-scheme: light; }
  :root:has(> body[data-colorscheme="dark"]) { color-scheme: dark; }
  ```
- This inline script is the only script on public pages (see [caching.md](./caching.md)).
- `build.cssTarget` = browsers with `light-dark()`, or Vite polyfills `color-scheme`.

### Fonts
- **System font stacks only.** No webfonts: no Fontsource, no Fraunces, no Google Fonts `@import`/`<link>`. The stacks themselves are Open.
- `tabular-nums` where figures line up (credits, kcal).

### Typography variants
- Named StyleX typography variants lock **`fontSize`, `fontWeight`, `lineHeight` and `letterSpacing` together**. Components compose `stylex.attrs(typography.body, styles.root)`; agents add a new variant rather than setting those properties ad hoc. This is stricter than dollar-holler `money()`.
- `font-synthesis: none` on `:root` in `tokens.css`, repeated as `fontSynthesis: 'none'` on each variant.
- Lint: `chef/no-adhoc-typography` (the four properties are banned outside `typography.ts`) and `chef/no-faux-font-weight` (per-family shipped-weight map). See [lint.md](./lint.md).
- **PLACEHOLDER:** the family names (`sans`/`display`/`mono`) and the weight map (`sans 400/500/600/700`, `display 400/700`, `mono 400/700`) are stand-ins until the real system faces are measured. Sketch values are also stand-ins.

### Token enforcement
- Stay on ESLint 10, not Oxlint (Oxlint JS plugins are alpha and don't run on `.svelte`). `@stylexjs/eslint-plugin` **0.19.2 exports only `rules`**: there is no `configs.recommended`, so list rules explicitly. Pin it exactly (see [ci.md](./ci.md#dependencies)).
- `@stylexjs/valid-styles` with **`propLimits`**: bans raw colours, lengths, durations and z-index on chosen properties.
- Plus `chef/no-raw-stylex-values`: closes the `color-mix()` template hole and `import * as tokens`, and pins z-index to `zIndex.stylex.ts`.
- Plus the official `enforce-extension`, `no-nonstandard-styles` and `no-lookahead-selectors` (warn). `no-conflicting-props` stays off.
- Width / height / display are unrestricted.

### `color-mix()`
- Define mixed colours as **derived tokens** in `*.stylex.ts` (`defineVars` function values). Components use e.g. `colors.foregroundMuted`.

### z-index
- One `zIndex.stylex.ts` of `defineConsts` for **in-flow** UI only. **No `dialog`/`popover` keys**: top-layer surfaces (`showModal()`, Popover API) don't need z-index.
- `propLimits` `zIndex: [0, 'auto']` + `tokenModules`.
- **PLACEHOLDER** names `base`/`raised`/`sticky`/`header`/`toast` — not the Chef Llama scale.

### Motion
- Only prose so far: 120–180 ms opacity/transform on popovers. The spike says to add shared duration/easing tokens before the motion `propLimits` are useful.

### Browser floor
- `package.json` `browserslist` is the machine-readable floor: `chrome >= 123`, `edge >= 123`, `ios_saf >= 18.3`, `safari >= 18.3`, `firefox >= 128` (≈91% global usage; set by `light-dark()` in Chromium, popover light dismiss in WebKit and `@property` in Gecko; WebKit is about 29% of NZ page views). Review 2027-05-06.
- Features below the floor are not used as load-bearing CSS. CSS anchor positioning is one of them.

### Native overlays
- Popover API for chips, the card ⋯ menu and the account menu. `<dialog>.showModal()` for credits exhausted, sign-in required and unsaved leave. Invokers (`commandfor` / `popovertarget`). No Radix/shadcn JS, no polyfilled dropdowns.
- **No CSS anchor positioning**: the project's browserslist targets don't support it. Popovers use plain top-layer placement styled by the theme.
- Component `<style>` blocks are banned (see [lint.md](./lint.md)). The overlay CSS that StyleX can't express (`::backdrop`, `@starting-style` entry motion, UA-drawn parts) lives in the global `tokens.css`, and every value it uses is a theme custom property.

### Icons
- No icon libraries. Chrome pictograms are custom animated SVG (in-file CSS, `light-dark()`, `prefers-reduced-motion`). OAuth marks come from official brand kits only (Google in v1; any later provider likewise).

### Design loop
- Lock one repo CSS token file + one landing before any Kombai Code pass. Kombai Design mode, one `/` + token sticker, Variants 1, Passes 1. Paper MCP only after a frame is selected.
- The working drafts live in `docs/designs/` (not locked); that folder is left as is.

### Usage chart on `/account`
The usage chart on `/account` is **sideways CSS bars** (rows, one per bucket), with no chart library. An earlier design ("CSS marks + popover, no chart library") lost three premises: the popover, the always-visible table of exact numbers, and the column chart. The constraints that survived are restated here in full so this can be built from this section alone. Background and the rejected paths were in the research note `2026-11-06-bucket-composition-states.md` (not in this repo). Kombai canvas references: `var_rail_collect_1107` (final form, 390 and 720), `var_narrow_place_1107` (value placement comparison), `var_markcount_1107` (mark-count arithmetic), `var_bucketstates_1106` (state matrix).

#### 1. Sideways, not columns
The chart is a list of rows, one per bucket, each row carrying the current period and the previous period as two bars on a shared scale. There is no column form.

A paired column slot needs two 24 px marks plus the gap, so the floor is **56 px per bucket**:

| Range | Buckets | Marks | Minimum width | 356 px phone | 560 px panel |
|---|---:|---:|---|---|---|
| Month | 4 | 8 | 224 px | fits | fits |
| Week | 7 | 14 | 392 px | does not fit | fits, nothing spare |
| Year | 12 | 24 | 672 px | no | no |

Horizontal scroll is not an escape: it hides the comparison pair behind a gesture, fights the page's own vertical scroll, and makes a pairwise comparison depend on scroll position. Rows have no width floor — bucket count becomes row count on an axis the page already scrolls. A second, independent reason: **the column form cannot label the ghost at all**, because the label band has one position per bucket and a slot holds two marks.

Cost accepted: a column chart shows the year's silhouette at a glance and a row list does not. If that silhouette is a real job it is a separate range-level summary, not a second orientation of this chart.

#### 2. Marks
- **One element per bar**, split by a hard-stop gradient at the funding boundary with a 2 px gap; never two stacked divs.
- **The component derives the state** and exposes it as `data-shape` — `none | gift | credit | both`. CSS cannot compare counts to zero at the floor, so the component decides and the stylesheet renders.
- **A zero bucket keeps a 3 px tick**, not an empty space and not a floating `0`. Zero is measured; it is not absence. The tick must be present in the row form, not only in a column form.
- **An absent or short previous period draws nothing.** A comparison that cannot be made is not shown, rather than shown hatching a caveat.
- **A non-zero segment clamps to 3 px** so one cook is never invisible and the gap never swallows it.
- **Previous period is the same geometry, washed** (`color-mix(in oklab, …, 45%)`) with a faint ink rim (a derived theme token, called `--ink-faint` in the original design; it must come from the theme, see [`color-mix()`](#color-mix)) — the rim is load-bearing, since no wash of this hue reaches 3:1.
- **No hatch, no `data-incomplete`.** With no short-window ghost there is nothing for it to mark.

#### 3. Values are text in the chart
Every funding count for every period is a **real text node** — not a tooltip, not a table, not generated content.

Each value is **its own grid item**: `<span class="v">{n}<i>{free|paid}</i></span>`. That is what lets one set of four numbers sit under two bars at narrow width and collect into a rail at wide width; a single wrapper cannot be in two places, and duplicating the values into a second block would put the same number in the DOM twice.

**Narrow (below the rail threshold):** each pair sits under its own bar, gathered at the bar's origin, words inline — `1 free` then `8 paid`. No Now/Prev headings, because position already says whose the values are.

**Wide:** all four collect into a rail at the right, with `free` / `paid` as row labels and `Now` / `Prev` as column headings; the words drop out of the values. The headings earn their place only here, because the values have left the bars' rows.

Placement decisions, with the numbers behind them:

| Placement | Verdict |
|---|---|
| Gathered at the bar's origin | **Chosen.** One fixed block, same x on every row; adjacent numbers compare with each other as well as down the list; stable at any bucket size. |
| Spread to the row edges | Rejected. Forms two columns, but 250 px apart on a phone, and the right-hand value sits at the row edge, asserting an attachment to the bar's end that is false on every row. |
| Tied to the bar's own end | Rejected. The strongest reading when it fits — `8 paid` lands under the credit segment's end — but the pair needs ~82 px of unbreakable text, so a bucket must reach ~27% of the axis to host its own labels. Below that it degenerates into the gathered form, which makes the position of a number a function of its own value. That is a conditional, not a placement. |

#### 4. The rail is a container query, not a second component
Same markup at both widths; the only difference is `grid-template-areas`. `container-type: inline-size` goes on the card (an element cannot query its own inline size), and the threshold is a **content-box** width, not a viewport width — the same chart in a sidebar and full-width must not share a breakpoint.

```css
.lane{                                    /* narrow */
  grid-template-columns:24px minmax(0,1fr) auto;
  grid-template-areas:
    "head head head"
    "tagN now  now"
    ".    fN   pN"
    "tagP prev prev"
    ".    fP   pP";
}

@container (min-width:560px){             /* rail */
  .lane{
    grid-template-columns:24px minmax(0,1fr) 1.9em 2.5em 2.5em;
    grid-template-areas:
      "head  head  hk    hnow  hprev"
      "tagN  now   kfree fN    fP"
      "tagP  prev  kpaid pN    pP";
  }
}
```

No `display` toggles beyond the rail's own labels. No `data-form`, no `data-timeline`: the form follows the container, and the window name cannot carry the mark count anyway (a year is 12 marks now, 24 once prior-year data exists).

#### 5. Delta
A **bare arrow aimed on an invisible clock face**: the tail is the pivot, the tip swings between the one and five o'clock positions, and no dial is drawn.

- one step either way: ±32°
- two or more: ±56°
- unchanged: horizontal
- no earlier period: an em dash, never a level arrow (a level arrow asserts a comparison that came out at zero)

A signed numeral was rejected: beside four figures in a rail it reads as a fifth figure. An arrow is a different shape class. The value goes in the SVG's `<title>`, so the arrow is not decoration-only.

#### 6. Not in this design
Tooltip · popover · CSS anchor positioning · the always-visible data table · `data-incomplete` and the hatch · the column form · any chart library.

#### 7. Accessibility
- The plot is a `<figure>`; the marks are `aria-hidden` decoration, and a `<figcaption>` carries the period.
- **The values are the accessible content**, because they are text — this replaces the "table as the SC 1.1.1 equivalent" arrangement. Two paths to one number was the redundancy cost of keeping both.
- Each bucket is a list item: the date, then the figures as text. No per-bucket control, so no tab stops inside the chart and no SC 2.5.8 question for marks.
- The funding split is stated in words (`free` / `paid`), so colour is never the only carrier.

#### 8. Implementation notes
- StyleX, static classes only; per-mark numbers arrive as custom properties on the element (`--g`, `--t`, `--pg`, `--pt`, `--max`). A count must never share a property name with a colour token — that bug silently painted nothing once already.
- `font-variant-numeric: tabular-nums` on every figure. `font-weight: 600` is a no-op in the current mono stack (400/500/600 render identically; only 700 differs), so do not rely on weight for emphasis.
- The bar's `block-size` is cosmetic (fixed 11 px / 9 px); **length** encodes the value.

## Open
- **Font stacks.** Candidates: (a) `--font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`; `--font-sans: ui-sans-serif, system-ui, "Segoe UI", sans-serif`; `--font-mono: ui-monospace, "Cascadia Code", monospace`. (b) `--font-sans: ui-sans-serif, system-ui, sans-serif`; `--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` (no display stack). Then the shipped-weight map for `chef/no-faux-font-weight`, after measuring the system faces. Does display stay a serif stack?
- Optional `--chart-1` … `--chart-5` values.
- Literal allowlist table (colour `transparent`/`currentColor`; spacing `0`/`auto`; radius `0`; duration `0`; easing: is `linear` allowed?; z-index `0`/`auto`).
- Real z-index names and ranks; what to do if a non-modal `show()` sheet ships.
- Allow in-component `color-mix` via the custom rule, or derived tokens only?
- Ban `fontFamily` outside the typography file? Limit width/height later (recommendation: no)?
- Floor tooling (proposed): `stylelint-no-unsupported-browser-features` for CSS and `eslint-plugin-compat` for JS, both reading `browserslist`. Confirm the Samsung Internet / Opera entries and whether to list `and_chr` / `and_ff` with `npx browserslist` before committing.
- Build targets (proposed): keep Vite 8's default JS target (no `@vitejs/plugin-legacy`, no `browserslist-to-esbuild`); `build.cssTarget: ['chrome123', 'safari18.3', 'firefox128']`; `css.transformer: 'lightningcss'` with `exclude: Features.LightDark` (in Vite and in the StyleX plugin's `lightningcssOptions`) so `light-dark()` is never rewritten; `modulePreload: { polyfill: false }`. After `vite build`, fail on any legacy bundle or `nomodule`, on `--lightningcss-light` in the CSS, on missing `light-dark(`, or on a leftover `@stylex;`.

### Usage chart
- The rail threshold is 560 px for a 4-bucket month. The week probably needs to switch later — the same rail takes the same 104 px and leaves seven buckets far less bar. One number to decide, not a structural question.
- A 3 px zero tick and a 3 px segment clamp are the same width for different reasons; confirm they do not read as the same thing at 9 px bar height.
- Whether the year silhouette deserves a separate range-level summary.
