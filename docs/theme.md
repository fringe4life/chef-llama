# Theme: tokens, colour scheme, typography, z-index, motion, icons, design loop

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Working material: the StyleX tokens spike (`/workspace/spikes/stylex-tokens/PROPOSAL.md`).

## Decided

### Tokens are the theme
- The theme **is** the shadcn-style **named CSS custom properties**: `background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `radius`, optional `chart-*`. Every custom property in the app comes from this theme.
- The name is **Chef Llama**. Token **values** live in StyleX `defineVars` in `*.stylex.ts` (for example `src/lib/theme/tokens.stylex.ts`), using **`--` keys** so the emitted CSS custom properties keep those names (no hashes). Official StyleX docs: `defineVars` creates global CSS variables; `light-dark()` is a supported colour value (`primaryColor: 'light-dark(black, white)'` in the light/dark recipe). Native `<dialog>` / `[popover]` still read `var(--background)` and friends. There are no product-specific extra colour tokens.
- `src/lib/theme/tokens.css` is **not** the token value source. It holds only the raw CSS StyleX cannot express (see [Native overlays](#native-overlays)).
- Not the shadcn / bits-ui component pack. No StyleX `createTheme`.
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
- `package.json` `browserslist` is the machine-readable floor: `chrome >= 123`, `edge >= 123`, `and_chr >= 123`, `samsung >= 27`, `opera >= 109`, `ios_saf >= 18.3`, `safari >= 18.3`, `firefox >= 128`. The floor is set by `light-dark()` in Chromium, popover light dismiss in WebKit and `@property` in Gecko; WebKit is about 29% of NZ page views. Review 2027-05-06.
- **`and_chr` (Chrome for Android) is included**, at the same major as Chrome. `caniuse-lite` (1.0.30001826, 16 Nov 2026 NZDT) only lists the *current* `and_chr` (157 today); `bunx browserslist "and_chr >= 123"` still matches it. Android Chrome usage is counted under `and_chr`, not `chrome`: without it, `bunx browserslist --coverage` on the rest of the floor was **43.36%** global; with `and_chr >= 123` it was **87.38%**.
- **`samsung >= 27`.** Samsung Internet 26 is Chromium **122**, 27 is Chromium **125** (first version at or above Chrome 123). Source: [Samsung Internet release calendar](https://browsercalendar.com/browsers/samsung-internet) (26 → 122, 27 → 125, 28 → 130). Adding it to the floor + `and_chr` raised `--coverage` from 87.38% to **89.23%**.
- **`opera >= 109`** (desktop). Opera **109** is Chromium **123** ([Opera 109 blog](https://blogs.opera.com/desktop/2024/03/opera-109/), 27 Mar 2024); Opera 110 is Chromium 124 (offset ≈ 14). `bunx browserslist "opera >= 109"` starts at `opera 109`. The full decided floor measured **90.04%** global coverage (`bunx browserslist --coverage`, same caniuse-lite, 16 Nov 2026 NZDT).
- Features below the floor are not used as load-bearing CSS. CSS anchor positioning is one of them.
- **Floor linting:** `eslint-plugin-compat` for JS (reads `browserslist`) and `@eslint/css` `css/use-baseline` at `{ available: 2024 }` for raw CSS. Details and the Baseline-year mapping are in [lint.md](./lint.md#browser-floor-linting).

### Native overlays
- Popover API for chips, the card ⋯ menu and the account menu. `<dialog>.showModal()` for credits exhausted, sign-in required and unsaved leave. Invokers (`commandfor` / `popovertarget`). No Radix/shadcn JS, no polyfilled dropdowns.
- **No CSS anchor positioning**: the project's browserslist targets don't support it. Popovers use plain top-layer placement styled by the theme.
- Component `<style>` blocks are banned (see [lint.md](./lint.md)).
- **No `src/app.css`.** SvelteKit's default `app.css` is not used (the official StyleX SvelteKit example fills it with a raw `@layer resets` — the bypass we are stopping). Import `src/lib/theme/tokens.css` from `src/routes/+layout.svelte`:
  ```ts
  import '$lib/theme/tokens.css';
  ```
  `@stylexjs/unplugin` needs a Vite-emitted CSS asset to append compiled StyleX to ([unplugin docs](https://stylexjs.com/docs/api/configuration/unplugin/): "Provide a CSS entry so Vite emits an asset for the plugin to append to"; fallback is an unlinked `stylex.css`). `tokens.css` is that entry. If the append misses it, set `cssInjectionTarget` to that file. **Do not add an `@stylex;` at-rule.** That directive is only for `@stylexjs/postcss-plugin`, which *replaces* it with generated CSS ([PostCSS plugin README](https://github.com/facebook/stylex/blob/main/packages/@stylexjs/postcss-plugin/README.md)). The Vite/unplugin path never looks for it: `pickCssAssetFromRollupBundle` in the unplugin source appends to an emitted `index.css` / `style.css` (hashed or not) or the first `.css` asset. Official `examples/example-sveltekit/src/app.css` and `examples/example-vite/src/index.css` have no `@stylex;`. A box build with `@stylexjs/unplugin` 0.19.2 (16 Nov 2026 NZDT) still injected compiled styles when the entry had no directive; when `@stylex;` was present it was left behind in the production CSS, not consumed.
- **`tokens.css` is only what StyleX cannot express:** `:root { color-scheme: light dark; }` and the `:root:has(> body[data-colorscheme="…"])` rules (required for `light-dark()` to resolve, including values emitted by `defineVars`), `font-synthesis: none` on `:root`, `@property` if we use it, and overlay CSS (`::backdrop`, `@starting-style` entry motion, UA-drawn parts). Every overlay value is a theme custom property (`var(--…)`). Colour, radius, type and spacing **values** belong in `defineVars`, not here. No component or page layout, no unnamed grids, no box-sizing/reset layer. Enforcement: `chef/no-app-css` plus a `preToolUse` deny on `src/app.css`; a tighter `chef` rule for `tokens.css` contents can be added later (see [lint.md](./lint.md#stylex)).

### StyleX dev runtime
The official SvelteKit guide ([StyleX + SvelteKit](https://stylexjs.com/docs/learn/installation/vite/sveltekit), fetched 16 Nov 2026 NZDT) inlines `$effect` in the root layout:

```svelte
<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import "../app.css";
	if (import.meta.env.DEV) {
		// @ts-expect-error // Virtual modules are not typed
		$effect(() => import('virtual:stylex:runtime'))
	}

	let { children } = $props();
</script>
```

**We do not leave `$effect` in `+layout.svelte`.** `$effect` belongs in the hazardous hatch, because it is almost always misused; this official snippet is the first real use of that hatch. It must live in a **rune module** (`*.svelte.ts` / `*.svelte` / `*.svelte.js`): a plain `.ts` file is not compiled by Svelte, so `$effect` would be a syntax error. It must be **called during component initialisation** (Svelte docs: `$effect` can be used outside the top level of a component only while a parent effect is running; the layout's `<script>` setup is that context). `$effect` runs in the browser only, not during SSR, which is why the guide uses it (a top-level `import()` would also run on the server). Do not put `$effect` at module top level, and do not wrap it in `onMount`.

`src/lib/theme/stylex-dev-runtime.hazardous.svelte.ts`:

```ts
export function stylexDevRuntime() {
  $effect(() => {
    void import('virtual:stylex:runtime');
  });
}
```

`src/routes/+layout.svelte` calls it synchronously in `<script>` (not in `onMount`, not after an `await`):

```svelte
<script lang="ts">
  import { stylexDevRuntime } from '$lib/theme/stylex-dev-runtime.hazardous.svelte';
  import '$lib/theme/tokens.css';

  if (import.meta.env.DEV) {
    stylexDevRuntime();
  }

  let { children } = $props();
</script>

<svelte:head>
  {#if import.meta.env.DEV}
    <link rel="stylesheet" href="/virtual:stylex.css" />
  {/if}
</svelte:head>
```

The `$effect` ban and the files-override are in [lint.md](./lint.md#effect-banned-escape-hatch-is-a-file-suffix). Keep the dev-only `<link rel="stylesheet" href="/virtual:stylex.css" />`.

### Named grid areas
Prefer `gridTemplateAreas` (for example `"header" "content" "footer"` on small containers and `"header header" "sidebar content" "footer footer"` at a container query around 768 px, or the usage-chart rail in [chart.md](./chart.md)) over anonymous track grids and numeric line placement. Lint: `chef/prefer-named-grid-areas` plus numeric-line `no-restricted-syntax`, with a built-in exception for `repeat(auto-fill|auto-fit)` and minmax-only tracks (see [lint.md](./lint.md#stylex)).

### Icons
- No icon libraries. Chrome pictograms are custom animated SVG (in-file CSS, `light-dark()`, `prefers-reduced-motion`). OAuth marks come from official brand kits only (Google in v1; any later provider likewise).

### Design loop
- Lock one repo CSS token file + one landing before any Kombai Code pass. Kombai Design mode, one `/` + token sticker, Variants 1, Passes 1. Paper MCP only after a frame is selected.
- The working drafts live in `docs/designs/` (not locked); that folder is left as is.

### Usage chart on `/account`
- Usage chart on /account: see [chart.md](./chart.md).

## Open
- **Font stacks.** Candidates: (a) `--font-display: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif`; `--font-sans: ui-sans-serif, system-ui, "Segoe UI", sans-serif`; `--font-mono: ui-monospace, "Cascadia Code", monospace`. (b) `--font-sans: ui-sans-serif, system-ui, sans-serif`; `--font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` (no display stack). Then the shipped-weight map for `chef/no-faux-font-weight`, after measuring the system faces. Does display stay a serif stack?
- Optional `--chart-1` … `--chart-5` values.
- Literal allowlist table (colour `transparent`/`currentColor`; spacing `0`/`auto`; radius `0`; duration `0`; easing: is `linear` allowed?; z-index `0`/`auto`).
- Real z-index names and ranks; what to do if a non-modal `show()` sheet ships.
- Allow in-component `color-mix` via the custom rule, or derived tokens only?
- Ban `fontFamily` outside the typography file? Limit width/height later (recommendation: no)?
- **Leave `op_mob` out of the floor.** `caniuse-lite` only lists `op_mob 80` and Presto 10–12.1. Opera for Android **80** is Chromium **120** ([Opera forums](https://forums.opera.com/topic/69468/opera-for-android-80)), **below** the Chrome 123 floor, so `op_mob >= 80` would weaken it. Later Opera Android versions exist in the wild (e.g. `OPR/100` ≈ Chromium 149) but are not in `caniuse-lite`. Revisit when the database has a version at Chromium 123+.
- **`and_ff`** (Firefox for Android) is still unreviewed.
- Build targets (proposed): keep Vite 8's default JS target (no `@vitejs/plugin-legacy`, no `browserslist-to-esbuild`); `build.cssTarget: ['chrome123', 'safari18.3', 'firefox128']`; `css.transformer: 'lightningcss'` with `exclude: Features.LightDark` (in Vite and in the StyleX plugin's `lightningcssOptions`) so `light-dark()` is never rewritten; `modulePreload: { polyfill: false }`. After `vite build`, fail on any legacy bundle or `nomodule`, on `--lightningcss-light` in the CSS, on missing `light-dark(`, or on a leftover `@stylex;`.
