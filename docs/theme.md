# Theme: tokens, colour scheme, typography, z-index, motion, icons, design loop

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### Tokens are the theme
- The theme **is** the shadcn-style **named CSS custom properties**: `background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `radius`, and the two [chart marks](#chart-marks). Every custom property in the app comes from this theme.
- The name is **Chef Llama**. Token **values** live in StyleX `defineVars` in `*.stylex.ts` (for example `src/lib/theme/tokens.stylex.ts`), using **`--` keys** so the emitted CSS custom properties keep those names (no hashes). Official StyleX docs: `defineVars` creates global CSS variables; `light-dark()` is a supported colour value (`primaryColor: 'light-dark(black, white)'` in the light/dark recipe). Native `<dialog>` / `[popover]` still read `var(--background)` and friends. There are no product-specific extra colour tokens beyond the [chart marks](#chart-marks).
- `src/lib/theme/tokens.css` is **not** the token value source. It holds only the raw CSS StyleX cannot express (see [Native overlays](#native-overlays)).
- Not the shadcn / bits-ui component pack. No StyleX `createTheme`.
- Groups: colour, radius, type, spacing.

### Colour tokens: shadcn-style semantic names
- These are the **shadcn-style semantic theming tokens**: `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive` (each with a `-foreground` pair where text sits on it), `--border`, `--input`, `--ring`. The table gives each name its role; `--radius` is under [Radius and spacing](#radius-and-spacing).
- Each colour token is one full colour per scheme: `--x: light-dark(oklch(...), oklch(...))`. No HSL channel triples and no `hsl(var(--x))`.
- **Names and roles here, values elsewhere.** No palette is chosen: four exist on `.kombai/canvas/landing.canvas` (paprika, beet, saffron, moss) and more may come. A colour value lives in the canvas while it is being decided, and then in the file that declares and uses it (`*.stylex.ts` `defineVars`). This file carries no colour value.

| Token | Role |
|---|---|
| `--background` | Page |
| `--foreground` | Body text |
| `--card` | Surfaces |
| `--card-foreground` | Text on card |
| `--popover` / `--popover-foreground` | Popover, dialog |
| `--primary` | Actions |
| `--primary-foreground` | Text on primary |
| `--secondary` | Quiet chrome |
| `--secondary-foreground` | Text on secondary |
| `--muted` | Wells, idle chips |
| `--muted-foreground` | Helper text |
| `--accent` | Highlights, saved |
| `--accent-foreground` | Text on accent |
| `--destructive` | Remove chip |
| `--destructive-foreground` | Text on destructive |
| `--border` | Dividers |
| `--input` | Input borders |
| `--ring` | Focus |

### Chart marks
- **Two colours, five derivations, one register.** The usage chart's only colours are two `light-dark()` pairs; everything else it paints is a `color-mix()` derivation of them, per [`color-mix()`](#color-mix). There is no third chart colour and no `--chart-3` … `--chart-5`.
- Same value rule as the rest of the theme: the two marks take one `light-dark()` pair each from the palette, and the **ratios below are the decision**, not any colour. How the chart reads the tokens — which mark is current, why the rim cannot be dropped — is [chart.md](./chart.md).

| Token | Derivation | Role |
|---|---|---|
| `--chart-gift` | one `light-dark()` pair from the palette | Current period, gift (free) segment |
| `--chart-credit` | one `light-dark()` pair from the palette | Current period, credit (paid) segment |
| `--chart-gift-wash` | `color-mix(in oklab, var(--chart-gift) 45%, var(--background))` | Previous period, gift |
| `--chart-credit-wash` | `color-mix(in oklab, var(--chart-credit) 45%, var(--background))` | Previous period, credit |
| `--chart-gift-ink` | `color-mix(in oklab, var(--chart-gift) 70%, var(--foreground))` | Gift count figure |
| `--chart-credit-ink` | `color-mix(in oklab, var(--chart-credit) 70%, var(--foreground))` | Credit count figure |
| `--chart-rim` | `color-mix(in oklab, var(--foreground) 40%, var(--background))` | Rim on the previous-period bar |

### Radius and spacing
- **Three bases, not forty absolutes.** `--spacing` `0.25rem`, `--radius` `0.5rem` and `--font-base` `1rem` are the only values to edit; every step is derived from one of them with `calc()`, so density, corner tightness and text size each move on one number. The three sit above the shadcn set the way Tailwind's `--spacing` does, and they are the only names added beyond [Chart marks](#chart-marks).
- `--radius` is the radius base: `--radius-sm` `calc(var(--radius) * 0.5)` (chips, icon buttons); `--radius-md` `var(--radius)` (inputs, menus); `--radius-lg` `calc(var(--radius) * 1.5)` (cards); `--radius-xl` `calc(var(--radius) * 2)` (dialogs, detail sheet). Slightly squared. Multiples, not the earlier `± 4px` offsets: an offset tracks the base only while the base is 8 px, a multiple tracks it always.
- Spacing is integers of the base: `--space-N` `calc(var(--spacing) * N)` for `1`–`20`, so the ladder runs `0.25` … `5rem` and holds a 4px grid until `--spacing` moves. `--space-page` is the one exception — two values, `×5` / `×8` — and it is not a spacing step at all: it is the page gutter, so it belongs to [Page frame](#page-frame) rather than the ladder. Chip gap `--space-2`, card padding `--space-5`.
- **Off-grid spacing snaps, and the direction is decided.** `N = round(px / 4)` with halves rounding up: 6 → `--space-2`, 10 → `--space-3`, 14 → `--space-4`, 18 → `--space-5`, 22 → `--space-6`, 46 → `--space-12`. That is what the account page already did before the rule was written (its 6 px chip gap arrived at `--space-2`, its 18 px card padding at `--space-5`), so the rule follows the board rather than the other way round. The board is drawn on a 2 px rhythm, so 226 of 1032 declarations move by 2 px and every page grew 0.3–3%; that drift is the grid doing its job. 1–3 px stay literal: a 2 px chip padding is optical, not rhythm, and rounding it to 0 or 4 changes the control's shape. Negative spacing is `calc(var(--space-N) * -1)`, never a bare `-20px`.
- Type scale as multiples of `--font-base`: `--text-2xs` `×0.625` … `--text-4xl` `×2.5` (`0.625` / `0.75` / `0.875` / `1` / `1.125` / `1.5` / `1.875` / `2.125` / `2.5rem`). **Not a ratio ladder:** the current ratios run 1.125–1.33, so a single `--ratio` would redesign this scale rather than rescale it. Four leadings stay unitless, so they reflow with a moving base instead of double-scaling: `--leading-solid` `1`, `--leading-tight` `1.2`, `--leading-ui` `1.45`, `--leading-body` `1.55`. Three trackings stay relative: `--tracking-tight` `-0.01em`, `--tracking-display` `-0.02em`, `--tracking-caps` `0.14em`.
- **The counts are per axis, and they are not equal.** A size step is visible as an absolute length (about 1 px or 6%); a leading step only inside a multi-line block, where the error accumulates per line (about 3%); a tracking step only at the size it is used at, since em scales with it (0.02em at 10 px, 0.005em at 40 px). That is why the same compression that took 9.5 / 10 / 10.5 px to 10 px yields four leadings and three trackings from 18 and 21 observed values: the board's leadings fall into three bands, plus the split between `ui` 1.45 and `tight` 1.2, which are 21% apart and do different jobs. `solid` exists because 78 elements set exactly `1`, single-line figures where `tight` would loosen the line box.
- **Two ends were open and both are now closed.** `--text-2xs` at 10 px is the floor, so the 9–10.5 px chart ticks and specimen labels keep their size instead of growing 14–33% into `xs`. `--text-4xl` at 40 px is the ceiling, landing the 38 / 42 / 44 px display type within 9%. Neither step is a ratio: the ladder is 10 / 12 / 14 / 16 / 18 / 24 / 30 / 40, and 4xl continues the same 1.13–1.29 jumps as `xl` and `2xl`. The 34 px rung was retired on 19 Nov 2026: it carried three elements and no variant, and a rung nothing selects is an invitation.
- **There is still no 13 px rung between `xs` and `sm`, and that is the decision.** `--text-xs` takes everything at or below 13, `--text-sm` 13.5–15. A dense table separates a caps label from a cell with `--muted-foreground`, uppercase and `mono`, not with a pixel of size, so a rung there would buy hierarchy the surface does not need.
- **The bands, so nothing has to be re-derived.** Values snap to the nearest step:

| token | × | px | band | board values that land here |
|---|---|---|---|---|
| `--text-2xs` | 0.625 | 10 | up to 10.5 | 9, 9.5, 10, 10.5 |
| `--text-xs` | 0.75 | 12 | 10.5 – 13 | 11, 11.5, 12, 12.5, 13 |
| `--text-sm` | 0.875 | 14 | 13 – 15 | 13.5, 14, 14.5, 15 |
| `--text-base` | 1 | 16 | 15 – 17 | 15.5, 16, 16.5, 17 |
| `--text-lg` | 1.125 | 18 | 17 – 21 | 17.5, 18, 20 |
| `--text-xl` | 1.5 | 24 | 21 – 27 | 22, 23, 24, 25, 26, 27 |
| `--text-2xl` | 1.875 | 30 | 27 – 32 | 28, 30, 32 |
| ~~`--text-3xl`~~ | 2.125 | 34 | 32 – 36 | retired 19 Nov 2026, three uses and no variant |
| `--text-4xl` | 2.5 | 40 | above 36 | 38, 42, 44 |

- **Tracking has three names and one spelling.** `--tracking-tight` `-0.01em` for dense figures and sub-heads, `--tracking-display` `-0.02em` for display, `--tracking-caps` `0.14em` for uppercase labels. The board wrote one value two ways — `-0.02em` and `-.02em`, `0.14em` and `.14em` — so a leading zero is the only form allowed now. Odd values (`-0.012em`, `-0.015em`, `0.1em`, `0.12em`) stay literal until something needs a name for them.

### Page frame
- **The frame is one named style, not a spelling each surface repeats.** Four declarations:
  ```css
  inline-size: 100%;
  max-inline-size: calc(var(--page-measure) + var(--space-page) * 2);
  margin-inline: auto;
  padding-inline: var(--space-page);
  ```
  In code that is one StyleX style (`frame`, beside the theme tokens) composed with a per-surface block-padding style; in the canvases it is one rule, with every band's inner element in its selector list. Nothing else sets `padding-inline` on a page-level element.
- **Two roles, not one.** A **band** is full-bleed: it paints the background and owns the rules and borders, so it carries block padding only — never inline padding, never a measure. A **frame** is the content column, and there is exactly **one per band**. That resolves the five shapes the board had grown: account's header band + `.page` (24 px of header gutter plus 24 px of page gutter, 48 px total at every width, because the rules that were supposed to narrow it never matched) becomes header band + frame; brand's `.wrap` ⊃ `.sheet` becomes band ⊃ frame; `.sheet` and `.wrap` stop being band and frame at the same time.
- The divergence hid a real defect: the account header was never in the frame. At a 1584 px viewport its wordmark sat at x=24 while `.page__head` started at x=200.5, and the offset grew with the viewport. A chrome row that is not given the frame drifts arbitrarily far from the column it labels.
- **One measure: `--page-measure` `72rem`** — 1152 px of content. rem, not px, so it moves with `--font-base` and the user's font size the way the spacing ladder does; exempt from the `--spacing` multiplier because it is a box size, not rhythm ([Off-grid spacing snaps](#radius-and-spacing)). One measure and not two: the chart canvases' 1040 was a specimen width, and `/account` already holds the chart and the ledger in a single column, so a second frame would make the chart change width between its specimen and its page. A dense table that wants to be narrower caps itself — that is a table property.
- **The cap is `calc(var(--page-measure) + var(--space-page) * 2)`**, so the token means the column a designer sets, not a border box you subtract 64 px from at every use. Tailwind's `--container-6xl` is the same `72rem`, which is where the number is borrowed from — the name and the scale, not the utility.
- **Gutter: `--space-page` `×5` / `×8` (20 / 32), one switch at `@media (width >= 48rem)`.** Media and not container, for a structural reason: an element cannot query itself — `@container` and `cqi` resolve against the nearest *ancestor* container, so a frame can never switch its own padding. Hence the rule to hold: **the frame is a viewport fact (media query); content reflow inside a page is a container query**, with `container-type: inline-size` on the frame. Measured with this rule: 350 px of content at a 390 viewport, 704 at 768, 960 at 1024, 1152 from 1216 up, and the frame itself never overflows between 320 and 1600.
- **Three rejected shapes, with what they measured.** Tailwind's `container` (`width: 100%` plus `max-width` at 40 / 48 / 64 / 80 / 96 rem): a staircase that never lands on the measure — 1216 px at a 1280 viewport, 1472 at 1600. `padding-inline: max(var(--space-page), (100% - var(--page-measure)) / 2)`: identical content widths at every width tested, but the padded box is the band, so its `container-type` reports the viewport and content queries stop describing the column — and combined with a cap it collapses to 704 at 1600. The grid frame `minmax(gutter, 1fr) min(100% - 2 × gutter, measure) minmax(gutter, 1fr)`: full-bleed rows for free, but every child needs `grid-column`, StyleX has no `> *` selector, and a child without it auto-places into the gutter track — measured 32 px wide with 21 px of overflow.
- **Not the frame**: the `ch` measures on notes and body copy (`19ch` / `46ch` / `58ch` / `74ch` / `76ch`), and deliberate escape hatches such as `max-inline-size: 100%` on a narrow specimen. The frame token never swallows a text measure.
- **A pinned review board keeps its `inline-size` and takes only the gutter.** The three brand specimens (840 / 960 / 1000 px) and the canvas index (1440 px) are boards drawn at a fixed width for judgement; the cap never binds inside them, so the rule collapses to `padding-inline: var(--space-page)`. Everything that is a product surface is fluid.
- **A fixed-height board must be allowed to grow.** `index.canvas` moved `block-size` to `min-block-size` and gave its table wrapper `overflow-x: auto; min-inline-size: 0`: narrowing that board from 1440 px to the frame would otherwise have clipped a height-locked table, and a table inside a flex column will not shrink below its min-content width without the `min-inline-size: 0`.
- **The `@container` blocks that restyled `.page` and `.shell` themselves never matched.** Measured: `.page`'s `padding-inline` stayed 24 px at a 390 px viewport, and `.shell`'s stayed 24 px too. They read as breakpoints on the board and were dead code, so the five-gutter divergence was partly phantom. The same mistake survives as a real defect: `.nav` sits in the header band, not inside the page container, so the `@container (inline-size <= 780px)` rule that hides it never fires and the account header overflows at 390 (nav right edge 424 px against a 375 px viewport, avatar 480). **Header reflow is a media query**, for the same reason the gutter is.

### Border widths
- **Three widths, named, never multiplied.** `--border-width-thin` `1px`, `--border-width-medium` `2px`, `--border-width-thick` `3px`. The names carry `-width-` because `--border` is already the colour token, and a `--border-thin` one line away from it reads as either.
- These are **exempt from the [three bases](#radius-and-spacing).** A 1px border derived from a tight base becomes 0.88px, and browsers round sub-pixel hairlines differently per display density, so the same rule goes pale on one screen and fat on another. The hairlines in [design.md](./design.md) depend on staying exactly 1px at every density setting.
- `thin` is the default — the canvases use it 289 times against four uses of `2px`. `medium` is emphasis: focus ring, active tab, selected row. `thick` is held for a heavy rule and is **unused today**; it exists so the next one has a name rather than a bare `3px`.
- Set the width through the token in the shorthand: `border: var(--border-width-thin) solid var(--border)`, and the same inside a ring, `box-shadow: inset 0 0 0 var(--border-width-thin) var(--chart-rim)`.

### Logical properties
- **Layout is written in logical properties**: `inline-size` / `block-size`, `max-inline-size` / `min-block-size`, `inset-inline-start` / `inset-block-end`, `margin-inline-start` / `padding-inline-end`, `border-inline-start`, and `text-align: start` / `end`. There is no `writing-mode` switch in the product; the reason is that the horizontal and vertical axes are named everywhere, so a box that is rotated or narrowed later does not silently carry a stale `width`.
- Do not convert, because no logical form exists or none helps: the `width`/`height` **attributes** on the SVG marks and views (markup, not CSS), `transform: translateX(-50%)` centring (translate is physical by definition), the chart arrow's `rotate`, and logical corner radii (`border-start-start-radius`) which buy nothing at these radii.
- The floor covers all of it — `inset-inline-start` lands at Chrome 87 / Safari 14.1 / Firefox 63, well below [the browserslist floor](#browser-floor).
- Enforcement is the `propLimits` change below, not discipline: `width`, `height`, `top`, `left`, `right` and `bottom` are banned on chosen properties in favour of their logical forms.
- **Inline `style` attributes are in scope.** The first pass rewrote `<style>` blocks only, so the visually-hidden pattern (`inline-size: 1px; block-size: 1px`) and one `max-inline-size: 76ch` on a note survived in attributes until the scales rollout swept them. A check that reads only stylesheets will miss these.
- **At-rule queries use the range syntax**, never `min-width` / `max-width`: `@container account (inline-size >= 21rem)`, `@container (inline-size <= 800px)`, and `(width >= …)` in a `@media`. The feature is `inline-size` for a container and `width` for the viewport; a named container keeps its name before the parenthesis. Keep the boundary inclusive — `(max-width: 800px)` is `(inline-size <= 800px)`, not `<`.

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
- **System font stacks only.** No webfonts: no Fontsource, no Fraunces, no Google Fonts `@import`/`<link>`. Payload is zero bytes.
- **Three families, three jobs.** Chrome shares the reading face: nav, buttons, controls, section headings, labels and chips are all `sans`. There is no second sans, because `system-ui` and this humanist stack resolve to the same font on iOS, Android and most Linux desktops — the fourth family was only ever visible on macOS and Windows, and barely there.

| Token (variant) | Stack | Job |
| --- | --- | --- |
| `--font-display` (`display`) | `Georgia, "Times New Roman", serif` | Wordmark, dish names, empty-state headlines. Never body, never labels, **never a figure** (see [Type limits](#type-limits)). |
| `--font-sans` (`sans`) | `Seravek, "Gill Sans Nova", Ubuntu, Calibri, "Noto Sans", "DejaVu Sans", source-sans-pro, sans-serif` | Everything read or clicked: headnotes, method steps, ingredient names, nav, buttons, section headings, caps labels, chips, one-line status. |
| `--font-mono` (`mono`) | `ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, Consolas, "DejaVu Sans Mono", monospace` | Every figure that aligns with another figure: ingredient quantities, step numbers, kcal, cook times, Credits and money, chart values, timestamps, ledger columns. |

- Resolves to **Seravek or Gill Sans Nova** on Apple, **Calibri** on Windows, **Roboto or Noto Sans** on Android, **Ubuntu** on Linux. Georgia everywhere it exists; Noto Serif or DejaVu Serif only where it does not.
- `display` leads with Georgia rather than `ui-serif` or Iowan Old Style. `ui-serif` gives New York in Safari and Georgia in Chrome **on the same Mac**, and Iowan Old Style is Apple-only, so the wordmark would change face by browser. One consistent serif beats two finer ones.
- `sans` leads with a named humanist face rather than `system-ui`: on macOS `system-ui` is SF Pro, a neo-grotesque, and humanist letterforms are the entire reason for this reading face.
- **Never lead a stack with a `ui-*` family.** `ui-serif`, `ui-sans-serif`, `ui-monospace` and `ui-rounded` are WebKit-only — Chromium and Gecko treat them as unknown names and skip to the next candidate, so a stack that starts with one silently loses that family on two of the three engines.
- Navigational numbers (a page count, an unaligned badge) and digits inside prose do not need `mono`. The rule is alignment, not the presence of a number.

### Type limits
- **400 and 700 are the only weights, and 600 and 500 are gone.** Georgia, Calibri, Consolas, Menlo and DejaVu ship no semibold, so `font-weight: 600` is matched up to 700 by CSS font matching, which meant 600 rendered as 700 on Windows and as a real semibold on macOS. The product nodes carried 130 declarations at 600 (417 elements) and 24 at 500; both collapsed to 400 or 700 on 19 Nov 2026, in the direction most users already saw. Nothing in the theme sets 500 or 900; `<b>` and `<strong>` get an explicit 700 because their UA default is `bolder`, which turns 900 under a 700 parent.
- **There is no light weight.** Georgia 400 is the quietest display tone available; quiet copy is made with `--muted-foreground` and size, not `font-weight: 300`.
- `font-synthesis: none` on `:root` (see [Native overlays](#native-overlays)) stops faux bold and faux italic, but it does **not** stop the 600 → 700 match. Georgia and Calibri have true italics; most mono faces only an oblique, so do not set `font-style: italic` on `mono`.
- **The lint weight map is `sans 400/700`, `display 400/700`, `mono 400/700`**, with no third value in any of the three. That is what `chef/no-faux-font-weight` carries.
- **Georgia's figures are old-style** — varying heights and a short 3, 4, 5, 7, 9. Never put a figure, price or time in `display`.
- **Metrics differ between the humanist faces.** Seravek, Calibri, Ubuntu and Roboto differ in x-height and advance width, so long method text breaks into a different number of lines per platform. Leave slack in fixed-height containers and never design a method step to end exactly on its last line. `font-size-adjust` is the fallback if the line count proves unstable in practice.
- **Georgia has no optical-size axis and no small caps.** Set display tracking by hand (`--tracking-display`). Real small caps are unavailable everywhere in this set, so small type is uppercase plus letter-spacing, never `font-variant-caps`.
- **`tnum` is not verified** on the Android-shipped Roboto or on distro DejaVu/Liberation builds, so a sans figure can shift width. Anything that must line up goes in `mono`, which is fixed-width by design; `font-variant-numeric: tabular-nums` on `mono` is redundant but harmless.
- **Fallback serifs are wider than Georgia.** Cap the display measure by character count (about 19 characters at 44 px) so Georgia and Noto Serif both break at a sensible point.

### Typography variants
- Named StyleX typography variants lock **`fontSize`, `fontWeight`, `lineHeight` and `letterSpacing` together**. Components compose `stylex.attrs(typography.body, styles.root)`; agents add a new variant rather than setting those properties ad hoc. This is stricter than dollar-holler `money()`.
- `font-synthesis: none` on `:root` in `tokens.css`, repeated as `fontSynthesis: 'none'` on each variant.
- Lint: `chef/no-adhoc-typography` (the four properties are banned outside `typography.ts`) and `chef/no-faux-font-weight` (per-family shipped-weight map). See [lint.md](./lint.md).
- Family names are settled in [Fonts](#fonts), the weight map in [Type limits](#type-limits), and the values below are no longer stand-ins.
- **The vocabulary is closed at fourteen, and the face is inside the variant rather than beside it.** `ui` and `figure` are the same four numbers with a different face, so a family toggle would let two jobs trade places without a diff. Every cell is a rung, so the table can satisfy the rule it is subject to. Weights are 400 or 700, never 600.

  | Variant | Face | Size | Weight | Leading | Tracking | Job |
  |---|---|---|---|---|---|---|
  | `ui` | sans | `xs` 12 | 400 | `ui` | 0 | Label, nav item, meta line, table cell |
  | `uiStrong` | sans | `xs` 12 | 700 | `ui` | 0 | Row number or initials, the only emphasis in a dense table |
  | `prose` | sans | `sm` 14 | 400 | `body` | 0 | Body copy that runs past a line |
  | `chrome` | sans | `sm` 14 | 700 | `ui` | 0 | Button and link label |
  | `caps` | mono | `2xs` 10 | 400 | `ui` | `caps` | Uppercase label above a figure or a column |
  | `figure` | mono | `xs` 12 | 400 | `ui` | 0 | Any figure that aligns with another, dates included |
  | `figureMeta` | mono | `xs` 12 | 400 | `tight` | `display` | Figure inside a fixed card meta row |
  | `heading` | sans | `base` 16 | 700 | `body` | `tight` | Section heading inside a page |
  | `pageTitle` | sans | `xl` 24 | 700 | `tight` | `display` | The one title at the top of a page |
  | `wordmark` | display | `xl` 24 | 400 | `solid` | `display` | Chef Llama, once per surface |
  | `dishName` | display | `xl` 24, `2xl` 30 at card ≥ 780 | 700 | `tight` | `tight` | Recipe name on a card |
  | `rank` | mono | `xl` 24, `lg` 18 at card ≤ 379 | 400 | `solid` | 0 | Position in a ranked list |
  | `price` | mono | `2xl` 30 | 400 | `solid` | `display` | Largest figure on a surface: a price or a band total |
  | `hero` | display | `4xl` 40 | 700 | `tight` | `display` | Landing headline, one per page |
- **Two variants carry a conditional, and it is a container, not the viewport.** `dishName` and `rank` scale with the card: measured at 390 and 720 every card title is 24 px, and the 30 px belongs to the full-width lead card at the plate width. The manifest therefore records a tuple list per variant, not one tuple.
- **The vocabulary has the same gate as its own definition.** Four checks, none of which restates the ladder: values must be rung references, so a literal `'1.55'` or `13` fails; `typography.manifest.json` records each variant with a job and a budget, and a test fails when a variant or a distinct quintuple appears without that manifest changing in the same commit; the table above is asserted against the manifest both ways; and the emitted CSS is checked after `vite build` for any typography value that is not a theme `var()`, which is the only layer that sees inline styles, `tokens.css` and a component composing two variants.
- **Measured 19 Nov 2026** by `scripts/typography-census.mjs` over the 20 product nodes, `type.canvas` excluded as a specimen plate: 485 typography declarations at 100% named coverage on all five axes, 0 off-token values, 76 rule-level combinations. At element level the same board went from 11 sizes / 18 leadings / 21 trackings / 5 weights / 4 faces to 8 / 4 / 4 / 2 / 3.

### Token enforcement
- Stay on ESLint 10, not Oxlint (Oxlint JS plugins are alpha and don't run on `.svelte`). `@stylexjs/eslint-plugin` **0.19.2 exports only `rules`**: there is no `configs.recommended`, so list rules explicitly. Pin it exactly (see [ci.md](./ci.md#dependencies)).
- `@stylexjs/valid-styles` with **`propLimits`**: bans raw colours, lengths, durations, easings and z-index on chosen properties ([Motion](#motion) names which properties).
- Plus `chef/no-raw-stylex-values`: closes the `color-mix()` template hole and `import * as tokens`, and pins z-index to `zIndex.stylex.ts`.
- Plus the official `enforce-extension`, `no-nonstandard-styles` and `no-lookahead-selectors` (warn). `no-conflicting-props` stays off.
- `width`, `height`, `top`, `left`, `right` and `bottom` are **not** unrestricted: `propLimits` bans them in favour of the logical forms in [Logical properties](#logical-properties). `display` stays unrestricted, and `inline-size` / `block-size` are what a component should reach for.

### `color-mix()`
- Define mixed colours as **derived tokens** in `*.stylex.ts` (`defineVars` function values). Components use e.g. `colors.foregroundMuted`.

### z-index
- One `zIndex.stylex.ts` of `defineConsts` for **in-flow** UI only. **No `dialog`/`popover` keys**: top-layer surfaces (`showModal()`, Popover API) don't need z-index.
- `propLimits` `zIndex: [0, 'auto']` + `tokenModules`.
- **PLACEHOLDER** names `base`/`raised`/`sticky`/`header`/`toast` — not the Chef Llama scale.

### Motion
- **Six easings, one shape each, and `linear()` is the only form.** Every easing in the set is a `linear()` stop list: no `cubic-bezier()`, no keyword, no `steps()`, so the motion `propLimits` has one form to reject rather than four. `--ease-linear` is `linear(0, 1)` rather than the `linear` keyword, so the whole set reads the same way and the literal allowlist carries no easing at all. `linear()` lands at Chrome 113 / WebKit 17.2 / Gecko 112, under every engine in [the browser floor](#browser-floor), so the form costs nothing at the floor. The six values total 1,027 bytes of raw CSS — 408 brotli, 442 with the durations — measured, so the CSS budget has a number.
- **The shapes are orthogonal on purpose**: decelerate, its exact reverse, symmetric, overshoot, undershoot-then-overshoot, constant. Nothing in the set is a second way to say the same thing, which is the same test that retired the `chip` typography variant.

  | Token | Shape | Stops | Use it for | Not for |
  |---|---|---|---|---|
  | `--ease-arrive` | decelerate, never past 1 | 13 | anything entering or being revealed: dialog, popover, sheet, toast, a view transition arriving, a one-shot fill reaching its value | a thing leaving, or a press |
  | `--ease-depart` | accelerate, the exact reverse of `arrive` | 13 | anything leaving: dismissal, a collapse, a row being removed | a thing arriving |
  | `--ease-glide` | symmetric, in then out | 19 | a value that travels between two positions: an indicator or arrow into a new slot, an underline, a 180° rotation, a reorder | a surface appearing or disappearing |
  | `--ease-squish` | overshoot, peaking at 1.131 of the travel at 56% | 13 | a thing touched or landed as an object: press and release, scale up or down, a card settling into place | a dialog, a popover, page chrome, or a second time on one surface |
  | `--ease-anticipate` | winds back to −0.040, overshoots to 1.041 | 15 | a deliberate action that should wind up before it goes: the Generate transition, a saved chip landing | anything incidental, or more than once on a surface |
  | `--ease-linear` | constant | 2 | a rate, not a feel: spinners, indeterminate bars, scroll-driven reveals (scroll progress is already linear), a marquee | anything that starts and ends |

- **`depart` is `arrive` played backwards, exactly.** The value is `1 − f(1 − t)` of the `arrive` stop list, so a dialog leaves on the path it came in and the pair can never drift. The consequence is a maintenance rule: `depart` has no value of its own to tune. Reversing a stop list is mechanical — mirror each time, invert each value — so change `arrive` and regenerate it rather than eyeballing a curve that looks like an exit.
- **The values, until `src/` exists.** They go in `src/lib/theme/motion.stylex.ts` `defineVars` with the same `--` keys as the rest of the theme ([Tokens are the theme](#tokens-are-the-theme)); while the app is not there yet, this block and `.kombai/canvas/motion/motion-sheet.html` carry the identical strings, and the sheet is regenerated after a change rather than edited by hand.

  ```css
  --ease-arrive: linear(0, 0.264 6.25%, 0.38 9.375%, 0.482 12.5%, 0.571 15.625%, 0.647 18.75%, 0.765 25%, 0.829 29.688%, 0.876 34.375%, 0.937 43.75%, 0.98 57.813%, 0.998 78.906%, 1);
  --ease-depart: linear(0, 0.002 21.094%, 0.02 42.188%, 0.063 56.25%, 0.124 65.625%, 0.171 70.313%, 0.235 75%, 0.353 81.25%, 0.429 84.375%, 0.518 87.5%, 0.62 90.625%, 0.736 93.75%, 1);
  --ease-glide: linear(0, 0.002 3.125%, 0.01 6.25%, 0.022 9.375%, 0.039 12.5%, 0.085 18.75%, 0.148 25%, 0.211 30.273%, 0.282 35.547%, 0.368 41.479%, 0.643 59.277%, 0.756 67.188%, 0.843 74.219%, 0.881 77.734%, 0.915 81.25%, 0.951 85.938%, 0.978 90.625%, 0.994 95.313%, 1);
  --ease-squish: linear(0, 0.389 8.5%, 0.692 17.4%, 0.912 26.8%, 0.992 31.7%, 1.054 36.8%, 1.092 41.3%, 1.117 46%, 1.13 51%, 1.131 56.3%, 1.108 66%, 1.018 88.8%, 1);
  --ease-anticipate: linear(0, -0.006 5.6%, -0.038 17.6%, -0.04 22.9%, -0.016 29%, 0.042 34.5%, 0.131 39.3%, 0.254 43.8%, 0.654 53.6%, 0.803 58.1%, 0.92 63.2%, 0.996 68.6%, 1.03 73.4%, 1.041 78.7%, 1);
  --ease-linear: linear(0, 1);
  ```

- **Four durations, and none of them is the generator's.** Easing Wizard derives a duration from the curve's physics and its ranges run 250–3,125 ms. At those lengths a dialog spends most of what you watch on its last 2% of travel, so the range is ignored by decision and the set is used at 100–400 ms:

  | Token | Value | Use it for |
  |---|---|---|
  | `--duration-tick` | `100ms` | hover, focus, colour, opacity — anything with no travel |
  | `--duration-quick` | `160ms` | a small element arriving or leaving: chip popover, menu, toast, a press |
  | `--duration-base` | `250ms` | dialog, sheet, card menu, a view transition |
  | `--duration-slow` | `400ms` | a structural move: a panel collapsing, a large surface arriving |

- **An exit takes the step below its entry.** `arrive` at `--duration-base` leaves with `depart` at `--duration-quick`, and `arrive` at `quick` leaves at `tick`. Nothing in the UI exceeds 400 ms; anything longer is a keyframe sequence with its own timeline, not a token.
- **The pairing, not the token, is the register.** `arrive` + `depart` are the default for every surface; `glide` whenever a value changes position; `squish` only where a finger or a landing is involved; `anticipate` at most once per surface; `linear` only where the motion is reporting a rate. **Overshoot is the fastest way to date a product** — a dialog that springs in reads as a 2017 landing page — so the two non-monotone curves never touch chrome, and a dialog is `arrive`, not `squish`.
- **Where the values came from, and why not the tool's springs.** The set was chosen with the Easing Wizard MCP (`https://api.easingwizard.com/mcp`; `get_presets`, `create_*_curve`, `get_curve_by_id`). Its `SPRING` and `BOUNCE` families are sampled over their own settling time, so they cross 57% of the travel at 10% of the curve: at 250 ms that is a whip followed by a long crawl, which is precisely what the 600–3,150 ms durations exist to hide. The set is therefore drawn from its time-normalised families instead — the `OUT QUINT` and `IN_OUT SINE` beziers, adaptively sampled to stop lists at a 0.6% chord error (0.22% for `glide`), and its `OVERSHOOT` generator for the two non-monotone curves: `squish` is overshoot `OUT`, mass 2, damping 92, curve `0a4r1t2u92y21y`; `anticipate` is overshoot `IN_OUT`, mass 1, damping 90, curve `0a4r2t1u90y240`. A changed value is re-derived the same way, not nudged by eye.
- **The literal the canvases already carry migrates with no visible change.** Five nodes set `cubic-bezier(0.23, 1, 0.32, 1)`; `arrive`'s source is `OUT QUINT` at `(0.22, 1, 0.36, 1)`, so both `y` coordinates are identical and the two `x` coordinates differ by 0.01 and 0.04. Those declarations become `var(--ease-arrive)` rather than being re-tuned.
- **Reduced motion keeps the easing and drops the travel**: opacity survives, `transform` and `scale` resolve to their end state, and no specimen is allowed to oscillate.
- **Enforcement.** `propLimits` gains `transitionTimingFunction`, `animationTimingFunction`, `transitionDuration` and `animationDuration` against the token modules; a literal `0` is the only permitted duration and no easing literal is permitted, `linear` included. The compiled-CSS backstop ([lint.md](./lint.md)) extends to `transition-timing-function` and `animation-timing-function` the way it already reads the typography properties.
- **The sheet:** `.kombai/canvas/motion/motion-sheet.html` auditions all six — one square travelling the same 248 px in every row, every curve started in the same frame, so only the curve differs. Below it, the duration ladder and four groups of moments: a dialog arriving and leaving, an arrow gliding, a press and a 180° rotation, and a meter filling from empty. It is a specimen, not product UI.

### Browser floor
- `package.json` `browserslist` is the machine-readable floor: `chrome >= 123`, `edge >= 123`, `and_chr >= 123`, `and_ff >= 128`, `samsung >= 27`, `opera >= 109`, `ios_saf >= 18.3`, `safari >= 18.3`, `firefox >= 128`. The floor is set by `light-dark()` in Chromium (123, which is Opera Android 82, the first release on Blink 124), popover light dismiss on iOS in WebKit (18.3) and `@property` in Gecko (128); WebKit is about 29% of NZ page views. Review 2027-05-06.
- **`ios_saf >= 18.3` is a behaviour floor, not a feature floor, and it is iOS-only.** The `popover` attribute and its methods land in Safari 17 on both platforms (Chrome 114, Gecko 125), so the API is present on iOS from 17. What is missing in 17–18.2 is **light dismiss**: on iPhone and iPad a tap outside an open `popover="auto"` did not close it, and a touch device has no Esc ([WebKit bug 267688](https://bugs.webkit.org/show_bug.cgi?id=267688), reported Jan 2024, fixed in `285990@main` Oct 2024, shipped in Safari 18.3 per Apple's release notes). The compatibility data records iOS 17 as a *partial* implementation ending at 18.2, which is why the entry reads 18.3. A chip editor or card menu that opens and cannot be dismissed is a trap, so this behaviour alone carries the iOS floor. macOS Safari 17 was never affected, so the desktop entry at 18.3 is conservative rather than required: it is the same number as iOS so that one WebKit number covers the platform pair.
- **`and_chr` (Chrome for Android) is included**, at the same major as Chrome. `caniuse-lite` (1.0.30001826, 16 Nov 2026 NZDT) only lists the *current* `and_chr` (157 today); `bunx browserslist "and_chr >= 123"` still matches it. Android Chrome usage is counted under `and_chr`, not `chrome`: without it, `bunx browserslist --coverage` on the rest of the floor was **43.36%** global; with `and_chr >= 123` it was **87.38%**.
- **`samsung >= 27`.** Samsung Internet 26 is Chromium **122**, 27 is Chromium **125** (first version at or above Chrome 123). Source: [Samsung Internet release calendar](https://browsercalendar.com/browsers/samsung-internet) (26 → 122, 27 → 125, 28 → 130). Adding it to the floor + `and_chr` raised `--coverage` from 87.38% to **89.23%**.
- **`opera >= 109`** (desktop). Opera **109** is Chromium **123** ([Opera 109 blog](https://blogs.opera.com/desktop/2024/03/opera-109/), 27 Mar 2024); Opera 110 is Chromium 124 (offset ≈ 14). `bunx browserslist "opera >= 109"` starts at `opera 109`. The floor without `and_ff` measured **90.04%** global coverage; with it, **90.41%** (`bunx browserslist --coverage`, same caniuse-lite, 16 Nov 2026 NZDT).
- **`and_ff >= 128`, and the number is not an offset.** Firefox for Android releases carry the Gecko version, so 128 is Gecko 128 (`and_ff 128` → Gecko 128, 9 Jul 2024; `and_ff 160` → Gecko 160, 10 Nov 2026, BCD 8.1.9). Every load-bearing feature lands on the same version in `firefox_android` as in `firefox` — `light-dark()` 120, `color-mix()` / `oklch()` 113, `:has()` 121, popover 125, container queries 110, `@property` 128 — so the Gecko driver on Android is the same `@property` at 128 and there is no Android-only gap to audit. caniuse-lite lists only the current `and_ff` (160), so the entry matches one version worth **0.376%** global: `browserslist "and_ff >= 128"` returns `and_ff 160`.
- **Opera Android carries no `browserslist` entry, by decision.** It is Blink, so the Chromium floor is the whole question: Opera Android 80 is Blink **120** (25 Jan 2024), 81 is Blink **122** (14 Mar 2024) and **82 is Blink 124** (2 May 2024) — the first release at or above Chrome 123 (BCD 8.1.9). caniuse-lite 1.0.30001826 ships exactly one Chromium-era `op_mob`, **80** (Blink 120, 1.159% global), plus Presto 10–12.1, so `op_mob >= 82` matches **nothing** and `op_mob >= 80` would put Blink 120 inside the floor, where `light-dark()` is load-bearing in every colour token. The floor therefore states Opera Android **82** and omits the entry: a browser that cannot diverge from Blink at 82+ does not need `eslint-plugin-compat` to check it. Revisit only if caniuse-lite publishes an `op_mob` above 80 — a data trigger, not a date.
- **A feature the floor does not support is not load-bearing CSS. Four do sit above it today, and three of them stay progressive rather than raising the floor.** `@starting-style` (Chrome 117, Gecko 129, WebKit 17.5) is one Gecko major over, so overlay entry motion animates where it lands and appears instantly where it does not. `commandfor` / `command` invoker commands (Chrome 135, Gecko 144, WebKit 26.2, Opera Android 89) are above *every* engine, so `popovertarget` (Chrome 114, Gecko 125, WebKit 17) is the load-bearing form and the invoker path is only the enhancement [design.md](./design.md#native-browser-components) allows for. `font-size-adjust: from-font` (Chrome 127, Opera Android 84, Gecko 118, WebKit 17) is above the Blink floor, so adopting it as the method-line-count fallback ([Open](#open)) would move Chromium to 127 and Opera Android to 84 — the one open item that can move the floor. The fourth, CSS anchor positioning (Chrome 125, Firefox 147, WebKit 26, Opera Android 83), is not a progressive-enhancement candidate at all: it is above the floor in every engine, so using it is a floor decision ([Native overlays](#native-overlays)).
- **Floor linting:** `eslint-plugin-compat` for JS (reads `browserslist`) and `@eslint/css` `css/use-baseline` at `{ available: 2024 }` for raw CSS. Details and the Baseline-year mapping are in [lint.md](./lint.md#browser-floor-linting).

### Native overlays
- Popover API for chips, the card ⋯ menu and the account menu. `<dialog>.showModal()` for credits exhausted, sign-in required and unsaved leave. Invokers (`commandfor` / `popovertarget`). No Radix/shadcn JS, no polyfilled dropdowns.
- **No CSS anchor positioning**: it is above the floor in all three engines (Chrome 125, Firefox 147, WebKit 26), so it is a floor decision rather than a progressive enhancement — see [Browser floor](#browser-floor). Popovers use plain top-layer placement styled by the theme.
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
- No icon libraries, no icon package and no sprite dependency: custom SVG only, animated with in-file CSS, `light-dark()` and `prefers-reduced-motion`. The eight cooking-method glyphs, their five parts, the form states and the size cuts are [icons.md](./icons.md).

### Design loop
- Lock one repo CSS token file + one landing before any Kombai Code pass. Kombai Design mode, one `/` + token sticker, Variants 1, Passes 1. Paper MCP only after a frame is selected.
- The working drafts are the canvas nodes in `.kombai/canvas/` (not locked). `.kombai/` is untracked in git, so a canvas is not a backup.

### Usage chart on `/account`
- Usage chart on /account: see [chart.md](./chart.md).

## Open
- **Which palette.** Four oklch palettes are on `.kombai/canvas/landing.canvas` (paprika, beet, saffron, moss) and more may come. Until one is chosen, no doc carries a colour value — names and roles only ([Colour tokens](#colour-tokens-shadcn-style-semantic-names)), and the values that do exist live in the canvas nodes.
- **Where px is still allowed.** All 22 nodes now read the spacing and type scales: 516 `font-size` declarations moved onto `--text-*` and 1032 `padding`/`margin`/`gap` declarations onto `--space-*`, with the ladder declared in every node's `:root`. What remains in px, deliberately: box sizes (`inline-size`, `block-size`, `min-inline-size`), grid tracks, the chart's mark geometry, and the 1–3 px optical spacings from the [allowlist](#radius-and-spacing). `max-inline-size` has left that list: the frame's cap is the [Page frame](#page-frame) token. The undecided part is whether `propLimits` should carry that allowlist as `spacing: [1, 2, 3]` or whether a raw px length is a review question instead — the same shape of question as colours and durations, which are already limited.
- **Enforce the range syntax, and decide where.** Nothing stops the next node writing `@container (max-width: 800px)` again, and the two forms are indistinguishable on screen. `@stylexjs/valid-styles` only inspects StyleX props, so this needs a CSS-aware check: `@eslint/css` with a custom rule, or a `chef/` rule over at-rule preludes. Which one, and whether the logical-property ban is also enforced at the raw-CSS layer rather than only in `propLimits`, is undecided — the same question [lint.md](./lint.md) already faces for `tokens.css`.
- **Georgia at display size on the dark ground.** Only the light plate has been built; check 44 px / 400 / −0.015em against the cast-iron `--background` dark value before locking `display`.
- **Method line count across platforms.** If Calibri and Seravek break a long method into visibly different line counts, choose between extra slack, `font-size-adjust`, and a shorter measure — in that order.
- Literal allowlist table (colour `transparent`/`currentColor`; spacing `0`/`auto`; radius `0`; duration `0`; easing: **nothing** — `--ease-linear` is the token for a constant rate; z-index `0`/`auto`).
- Real z-index names and ranks; what to do if a non-modal `show()` sheet ships.
- Allow in-component `color-mix` via the custom rule, or derived tokens only?
- Ban `fontFamily` outside the typography file? Limit width/height later (recommendation: no)?
- **Typography enforcement is settled, and five edges around it are not.** The vocabulary, the budget and the four checks are decided in [Typography variants](#typography-variants). Still open: whether `--text-*` stays exported for components at all, since a component that can reach the ladder makes a variant optional; whether `chef/no-adhoc-typography` also covers `fontStyle`, `fontStretch`, `textTransform` and `fontVariant*`, which the same drift reaches next; whether `weight` becomes a token group or stays a literal in the 400/700 map; whether the manifest is written by the build or reviewed in, given `scripts/typography-census.mjs --write` owns only its `census` block today; and whether the compiled-CSS check reports a value or a quintuple, which decides whether composing two variants in a component is a failure or a warning. Kept from the proposal as the record of why: where the drift actually lives.
  1. **Values must be rung references.** Inside `typography.stylex.ts` each of the four properties takes a member expression on the token groups (`text.*`, `leading.*`, `tracking.*`, `weight.*`) and nothing else, so the file consumes the ladder instead of restating it. A literal `'1.55'`, `13` or `'0.875rem'` fails. `propLimits` cannot carry this: it compares literal constants only and does not resolve token or `var()` references ([#1893](https://github.com/meta/stylex/issues/1893)), and values under imported-constant media keys currently escape validation altogether ([#1762](https://github.com/meta/stylex/issues/1762)), which also tempers the `spacing: [1, 2, 3]` shape two bullets up.
  2. **A variant budget, checked as a count.** A committed `typography.manifest.json` (the bundlewatch shape, see [ci.md](./ci.md)) records the exported variant keys and the distinct `(family, size, weight, leading, tracking)` quintuples the theme emits. A test fails when either count rises without the manifest changing in the same commit, so growth arrives as a reviewed diff instead of a silent +1.
  3. **The doc table is the manifest.** [Typography variants](#typography-variants) gains a row per variant naming its job and not its size, and a test asserts parity both ways between the table and the exported keys. Naming by job is the rejection half: "which of these rows is this text?" has an answer, "do I need 15 px?" does not. Primer, Atlassian and Singapore GDS all name type by role; the count ratchet is rarer than token linting, and it is the novel part.
  4. **Compiled-CSS backstop.** StyleX objects are invisible to CSS linters once compiled, and two bypasses are already known (inline `style` attributes, `tokens.css`). After `vite build`, assert that every `font-family` / `font-size` / `font-weight` / `line-height` / `letter-spacing` value in the emitted CSS is a theme `var()` and that the quintuple count matches the manifest. That is what makes a bypass impossible rather than discouraged.
  5. **Agent-side, before the linter runs.** A `preToolUse` deny (same mechanism as the `src/app.css` deny, see [cursor-hooks.md](./cursor-hooks.md)) rejects a Write or Edit whose payload sets any of the four properties outside the theme file, and names the variants that already exist. Lint catches the pull request; the hook catches the turn, which is the difference between an agent fixing it and an agent routing around it.
  6. **One human gate.** `CODEOWNERS` on `src/lib/theme/typography.stylex.ts` plus a `type-scale` label. "Justified" is a judgement no rule can decide, so the place that needs judgement is one file and it is not touched in passing.
  Prior art sits at the use site and not at the vocabulary: Stylelint `declaration-property-value-allowed-list` and `stylelint-scales`, Tailwind `no-arbitrary-value`, Atlassian's `use-tokens-typography`, Polaris's typography `declaration-property-value-disallowed-list`, and Panda / Chakra `strictTokens` (a TypeScript error rather than a lint error). None of them gate the scale definition itself. The stack here is ESLint plus `@eslint/css`, so the only transferable piece is a `chef/` rule over `tokens.css`.
  **What the migration itself found**, and why the code will not repeat it: the four brand nodes referenced `var(--leading-body)` without ever defining it, so they rendered `line-height: normal`; three landing nodes used `.sr-only` with no rule behind it, so a heading meant to be hidden rendered at the UA 21 px; and `font-family: inherit` is not the UA default on `<button>`, so removing it dropped chrome to Arial. All three are fixed. The rule for code: an inherited default is not a token, so `body`, `button`, `b`/`strong` and `code` each need an explicit value or the census sees a value the theme never declared.
- **What the product nodes looked like before the migration, kept as the starting line.** 1,776 text elements across the five product canvases: sizes already closed (every element on a rung except 14, both accidents), but 18 leading ratios against two tokens, 21 tracking values against three names, and five weights against a map that allows two. The jobs recurred and the spellings did not: a page title was 24/600 at three different leadings and trackings, and 40 at two more. 104 distinct combinations, 67 of which appeared in a single node.
  Read the other way the board is a 10 / 12 / 14 / 16 / 24 board. 92% of text sits at or below 16 px and 12 px alone carries 929 elements. `--text-3xl` had three uses and no variant, so it was retired in the same pass: a rung with three uses is evidence about the ladder, not about the pages.
- **`chip` did not survive the move to variants**, and that is the mechanism working: it was `ui` with 1.55 instead of 1.45 at the same face, size and weight, which is 1.2 px of line box on a single-line 12 px chip, so the tuple check would have rejected it as a duplicate appearance. The variant table in [Typography variants](#typography-variants) is the current one; the row-by-row account of what each replaced is in the migration record rather than here.
- Build targets (proposed): keep Vite 8's default JS target (no `@vitejs/plugin-legacy`, no `browserslist-to-esbuild`); `build.cssTarget: ['chrome123', 'safari18.3', 'firefox128']`; `css.transformer: 'lightningcss'` with `exclude: Features.LightDark` (in Vite and in the StyleX plugin's `lightningcssOptions`) so `light-dark()` is never rewritten; `modulePreload: { polyfill: false }`. After `vite build`, fail on any legacy bundle or `nomodule`, on `--lightningcss-light` in the CSS, on missing `light-dark(`, or on a leftover `@stylex;`.
