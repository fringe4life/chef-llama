# Usage chart: sideways CSS bars on `/account`

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Tokens, colour and the browser floor are in [theme.md](./theme.md); the `/account` page itself is in [auth.md](./auth.md#open).

## Decided

**The usage chart is sideways CSS bars**: rows, one per bucket, with no chart library. An earlier design ("CSS marks + popover, no chart library") lost three premises: the popover, the always-visible table of exact numbers, and the column chart. The constraints that survived are restated here in full so the chart can be built from this file alone. Background and the rejected paths were in the research note `2026-11-06-bucket-composition-states.md` (not in this repo). Kombai canvas references: `var_rail_collect_1107` (final form, 390 and 720), `var_narrow_place_1107` (value placement comparison), `var_markcount_1107` (mark-count arithmetic), `var_bucketstates_1106` (state matrix).

### 1. Sideways, not columns
The chart is a list of rows, one per bucket, each row carrying the current period and the previous period as two bars on a shared scale. There is no column form.

A paired column slot needs two 24 px marks plus the gap, so the floor is **56 px per bucket**:

| Range | Buckets | Marks | Minimum width | 356 px phone | 560 px panel |
|---|---:|---:|---|---|---|
| Month | 4 | 8 | 224 px | fits | fits |
| Week | 7 | 14 | 392 px | does not fit | fits, nothing spare |
| Year | 12 | 24 | 672 px | no | no |

Horizontal scroll is not an escape: it hides the comparison pair behind a gesture, fights the page's own vertical scroll, and makes a pairwise comparison depend on scroll position. Rows have no width floor — bucket count becomes row count on an axis the page already scrolls. A second, independent reason: **the column form cannot label the ghost at all**, because the label band has one position per bucket and a slot holds two marks.

Cost accepted: a column chart shows the year's silhouette at a glance and a row list does not. If that silhouette is a real job it is a separate range-level summary, not a second orientation of this chart.

### 2. Marks
- **One element per bar**, split by a hard-stop gradient at the funding boundary with a 2 px gap; never two stacked divs.
- **The component derives the state** and exposes it as `data-shape` — `none | gift | credit | both`. CSS cannot compare counts to zero at the floor, so the component decides and the stylesheet renders.
- **A zero bucket keeps a 3 px tick**, not an empty space and not a floating `0`. Zero is measured; it is not absence. The tick must be present in the row form, not only in a column form.
- **An absent or short previous period draws nothing.** A comparison that cannot be made is not shown, rather than shown hatching a caveat.
- **A non-zero segment clamps to 3 px** so one cook is never invisible and the gap never swallows it.
- **Previous period is the same geometry, washed** (`color-mix(in oklab, …, 45%)`) with a faint ink rim (a derived theme token, called `--ink-faint` in the original design; it must come from the theme, see [theme.md § `color-mix()`](./theme.md#color-mix)) — the rim is load-bearing, since no wash of this hue reaches 3:1.
- **No hatch, no `data-incomplete`.** With no short-window ghost there is nothing for it to mark.

### 3. Values are text in the chart
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

### 4. The rail is a container query, not a second component
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

### 5. Delta
A **bare arrow aimed on an invisible clock face**: the tail is the pivot, the tip swings between the one and five o'clock positions, and no dial is drawn.

- one step either way: ±32°
- two or more: ±56°
- unchanged: horizontal
- no earlier period: an em dash, never a level arrow (a level arrow asserts a comparison that came out at zero)

A signed numeral was rejected: beside four figures in a rail it reads as a fifth figure. An arrow is a different shape class. The value goes in the SVG's `<title>`, so the arrow is not decoration-only.

### 6. Not in this design
Tooltip · popover · CSS anchor positioning · the always-visible data table · `data-incomplete` and the hatch · the column form · any chart library.

### 7. Accessibility
- The plot is a `<figure>`; the marks are `aria-hidden` decoration, and a `<figcaption>` carries the period.
- **The values are the accessible content**, because they are text — this replaces the "table as the SC 1.1.1 equivalent" arrangement. Two paths to one number was the redundancy cost of keeping both.
- Each bucket is a list item: the date, then the figures as text. No per-bucket control, so no tab stops inside the chart and no SC 2.5.8 question for marks.
- The funding split is stated in words (`free` / `paid`), so colour is never the only carrier.

### 8. Implementation notes
- StyleX, static classes only; per-mark numbers arrive as custom properties on the element (`--g`, `--t`, `--pg`, `--pt`, `--max`). A count must never share a property name with a colour token — that bug silently painted nothing once already.
- `font-variant-numeric: tabular-nums` on every figure. `font-weight: 600` is a no-op in the current mono stack (400/500/600 render identically; only 700 differs), so do not rely on weight for emphasis.
- The bar's `block-size` is cosmetic (fixed 11 px / 9 px); **length** encodes the value.

## Open
- The rail threshold is 560 px for a 4-bucket month. The week probably needs to switch later — the same rail takes the same 104 px and leaves seven buckets far less bar. One number to decide, not a structural question.
- A 3 px zero tick and a 3 px segment clamp are the same width for different reasons; confirm they do not read as the same thing at 9 px bar height.
- Whether the year silhouette deserves a separate range-level summary.
- The faint rim on the previous-period bar needs a named derived token in the theme (called `--ink-faint` in the original design); add it to theme.md's derived tokens when the chart is built.
- Optional `--chart-*` colour tokens (open in [theme.md](./theme.md#open)): does the chart use them, or existing semantic tokens for the gift and credit segments?
- The chart ships with `/account`, whose scope is still open (see [auth.md](./auth.md#open)). Proposed data source: the Credit DO debit rows, bucketed by period.
