# Icons: no libraries, custom SVG, the eight cooking methods

> Topic file (split out of [theme.md](./theme.md) and [product.md](./product.md) on 21 Nov 2026 NZDT, at the same time the cooking-method set was drawn). This file is the only place icon decisions live. Tokens, colour and type are [theme.md](./theme.md); vocabulary is [GLOSSARY.md](./GLOSSARY.md). The draft is four canvas nodes in [`.kombai/canvas/landing.canvas`](../.kombai/canvas/landing.canvas): `Methods A` (`var_802cd27b87cd`), `Methods B` (`var_c9383cec2a26`), `Methods C` (`var_93248c650a86`) and `Methods D` (`var_9771bab8f1a6`). **D is the motion reference**; A–C draw the same states as stills.

## Decided

### No icon library
- No Lucide, Simple Icons, Tabler, Phosphor or Iconify, and no icon package or sprite dependency. Every product pictogram is a custom SVG drawn in the file that uses it.
- Pictograms animate with in-file CSS, `light-dark()` and `prefers-reduced-motion`. Steam, blink and stir are the only animated parts the product has today.
- OAuth marks are the exception: they come from official brand kits only (Google in v1; any later provider likewise).
- The drawing grammar is the one the Saffron boards already use (Saffron 2–5): an outlined vessel with solid dark handles, saffron for what is being cooked, green for raw garnish, and steam that starts when a surface is hovered or focused.

### The eight cooking methods
- The `method` enum is `fry-pan`, `saucepan`, `oven`, `air-fryer`, `slow-cooker`, `pressure-cooker`, `grill`, `no-cook`. `devices` is an optional array of these with a maximum of three, in order.
- One glyph per method, and one only. Labels are **Fry pan** (not skillet — that is not the NZ word), **Saucepan**, **Oven**, **Air fryer**, **Slow cooker**, **Pressure cooker**, **Grill**, **No cook**.
- The control shows them in enum order, which is also the physical order of a kitchen: hob (`fry-pan`, `saucepan`), oven, appliance (`air-fryer`, `slow-cooker`, `pressure-cooker`), fire (`grill`), none (`no-cook`). Fry pan and saucepan are adjacent at the head of the hob group so the pair is compared where it is most likely to be confused.
- Every glyph is drawn on a 24-unit grid with a 1.9-unit outline at 24 px, and is built from the same five parts.

| Part | Paint | Job |
|---|---|---|
| Vessel / case | `--foreground` outline, no fill | The object itself: pan, pot, oven body, capsule, grate, bowl |
| Solid parts | `--foreground` fill | Handles, lugs, knobs, door handles, drawer pulls, clamps |
| Food / heat | gold fill | Contents in an open vessel, or the element behind a window. Mix `--primary` 68% with `--foreground` so the gold holds at 16 px in both schemes |
| Garnish | green fill (`--accent-text`) | One leaf or tick, never more |
| Steam | `--foreground` mixed 52% with `--background`, at 0.45 opacity | Two detached arcs, one at 20 px, none at 16 px |

- **The three codes are semantic, not decoration.** Gold means contents or heat. Green means raw. Steam means an opening: a lidded pot steams at the lid, a closed oven shows a gold element instead of steam, and **no-cook has no gold and no steam at all** — the absence is the message.
- **Fry pan and saucepan must not be confusable**, and the difference is carried by shape alone. Same family, same parts, nothing shared above the base line:

| | Fry pan | Saucepan |
|---|---|---|
| Body | 13.4 units wide, 5.2 deep, open bowl | 10 wide, 8.5 deep, straight wall with a rim lip |
| Handle | one long bar leaving the rim at −8°, 6.8 long | none. Two short lugs at mid-wall |
| Lid | none | domed, with a knob |
| Reads as | shallow and wide | tall and deep |

- A lidded vessel shows its contents as a short gold band **inside** the rim, not as a stripe across the body.
- Size ladder: **48 px** for a large tile, **40 px** in the field, **32 px** on documentation and in the state matrix, **20 px** and **16 px** for the inline recipe mark. 40 is confirmed for both fields — the Diet requirements bank and the `/pantry` devices — after 44 was drawn and dropped on 26 Nov 2026. 48 is what a field tile becomes at two across on a phone, so the field never draws 48 at rest. The 16 px cut drops the tendril layer entirely and widens the outline to 2.55 units; nothing else is removed.
- **`--sw` is in viewBox units, not pixels**, so the outline rides the box: `1.5` on the 24-unit grid renders 2.5 px at 40 and 3 px at 48, and the 32 px samples widen to `2.2` to hold the same visual weight. A size and its outline are one cut, never two decisions.

### The states, for the form only
- The field tiles are the only place the marks carry states — the devices field and the Diet requirements bank, which share one tile ([design.md § Selection controls](./design.md#selection-controls)). The inline recipe mark is one flat colour: no layers, no interaction.
- Six states, and each changes the surface, the vessel or both:

| State | Surface | Glyph | Rank |
|---|---|---|---|
| Rest | `--card`, hairline `--border` | cold: the part is closed, tendrils at 0.3 | — |
| Hover | `--secondary`, rim mixed 48% toward `--foreground` | the part moves to its hover pose, tendrils rise to full | — |
| Focus-visible | 2 px `--ring`, offset 2 px (as [design.md](./design.md#native-browser-components)) | same as hover, so a keyboard Cook sees the heat too | — |
| Pressed | `--muted`, 1 px down | the part returns to rest: the lid shuts, the drawer closes | — |
| Chosen | `--primary` fill, `--primary-foreground` ink | the part holds its open pose, tendrils rise once | 20 px pocket at the tile's top corner, inverted to `--primary-foreground`, digit `--primary` |
| At limit | dashed `--border`, transparent | cold again: no gold, no leaf, no tendrils, part at rest | — |

### Motion: each method moves its own part
- The glyph is **three stacked layers, not one drawing**, so a part can move without redrawing the mark: **body** (vessel, case, fixed handles), **part** (the one thing the method opens, lifts or throws) and **tendrils** (steam or heat). Each is its own `<symbol>` referenced from its own `<svg>` inside the tile, so a CSS transform on the layer moves the part alone and the body stays still.
- Rest is a cold kitchen. Hover and focus light it, chosen keeps it lit, pressed snaps it shut. The movement is what says "you could cook in this"; the surface change only confirms it.
- Only the part moves, and each method has its own:

| Method | Part | Hover and focus | Chosen |
|---|---|---|---|
| Fry pan | food and leaf | tossed 9% up, tipped 7° | settles 4° up, tendrils up |
| Saucepan | lid and knob | lifted 13%, tilted 8° | off: 21% up, 13° |
| Oven | door: window and handle | dropped 7%, foreshortened 10% | 11% and 17% |
| Air fryer | drawer | out 14% | out 22% |
| Slow cooker | lid and knob | lifted 8%, tilted 4° | 13% and 7° |
| Pressure cooker | regulator and weight | rocking ±11° | held at 10° |
| Grill | flame | 28% taller, flickering | 45% taller |
| No cook | leaves | lifted 11°, tipped 6° | 6% up, 3° |

- **Tendrils are the heat.** They rise from 0.3 to full on hover, focus and chosen, and a chosen tile emits them once rather than looping. The pressure cooker's two are jets that pulse sideways instead of rising. There is no tendril layer on the air fryer or no-cook: a closed box and a cold bowl do not steam.
- **Pressed is the physical inverse.** The lid closes and the drawer shuts on `:active`, so a click reads as a thing being pushed rather than a colour being swapped.
- Motion is `transform` and `opacity` only — no layout, no width animation — and it runs on the same custom properties that paint the parts, so a cold or at-limit tile needs no separate rules.
- **One timing set, the theme's, shared with the Diet bank.** The part moves on `--ease-glide` at `--duration-base` (250 ms) and the press returns it on the same transition; a hover changes surface, border and pocket on `--ease-linear` at `--duration-tick`. Below the tile, the wash arrives on `--ease-arrive` at `--duration-base` and leaves on `--ease-depart` at `--duration-quick`, the rank pocket seals on `--ease-squish`, and the numeral lands on `--ease-arrive` delayed `--duration-tick`. `--duration-slow` is unused by either field. The strokes that used to be literal — `cubic-bezier(0.23, 1, 0.32, 1)` at 320 ms on the Diet boards — are the `arrive`/`glide` pair now.
- **Steam is one emission, not a loop.** The tendril layer plays `rise` once per selection: 1500 ms, opacity 0 → 0.62 → 0, with a per-device `--sd` offset so eight tiles do not pulse in unison. It rises and fades and never comes back down. The canvases loop it only so the steam stays visible while a board is being reviewed; the product emits once, on the press that checks the tile.

- **Chosen is a fill, not a tint.** Gold is a fill and never words ([theme.md](./theme.md) and the four saffron tokens), so the chosen tile becomes gold and its text is `--primary-foreground`; the rank's pocket is the only inverted shape in the control.
- **At the limit the rest go cold, not dim.** Once three are chosen the other five draw as empty vessels — dashed tile, no gold, no leaf, no steam — so the set always reads as a kitchen rather than a disabled form. Nothing changes opacity in the form.
- **The rank is array order.** 1 is the primary method, 2 and 3 are fallbacks; removing one closes the gap, so the numbers always run 1..n. The boards number the tiles from the checked inputs in DOM order, which is correct only while the array order equals it; the app renders the index of its own array, because a Cook may pick in any order.

### Where they are used
- `/pantry`, the devices field: all eight, 40 px marks in 92 px tiles, states on. Selection is capped at three and the first is the primary method. The tile, its wash and its pocket are one control shared with the Diet requirements bank ([design.md § Selection controls](./design.md#selection-controls)).
- Recipe page and recipe card: the single chosen method as an inline mark, 16 or 20 px, no states. See the Open item below for which size.

## Open
- **Which of the three arrangements ships.** All three are drawn and use the same glyphs; they differ in where a chosen method lives.
  - **A, the rail** (`var_802cd27b87cd`): eight fixed slots, chosen stays in place, rank numeral on the tile, the at-limit state visible across the same row. One surface, one press per choice.
  - **B, the shelf** (`var_c9383cec2a26`): chosen methods leave the pool for three ranked rows; hover turns the line drawing into a solid ink glyph. Two surfaces, and the pool reflows as items move.
  - **C, the pegs** (`var_93248c650a86`): three numbered pegs assigned first, then a cell; each cell is a wide row. Two presses per choice, and the pegs show order before any method is picked.
  - Recommendation: **A, carrying the motion states from D**. It keeps the field to one surface, leaves all eight visible while choosing, shows the at-limit state in place, and D's layered glyphs drop straight into its tiles; B's shelf duplicates the chosen items above their own pool, and C's peg-first order costs a press without telling the Cook anything the numeral on the tile does not.
- **16 or 20 px inline on the recipe.** 20 reads at arm's length on the page and 16 fits the meta line; the glyphs are drawn to work at both, so this is a layout decision, not a drawing one.
- **Which mark the inline recipe shows** when three devices are stored: the primary (rank 1) only, or all three in order.
- **At the limit, does a fourth press swap the rank-3 method or do nothing?** Drawing the rest cold implies the press is available; blocking it would need the tiles to read as unavailable instead.
- **Recipe meta placement**: whether the method mark sits before or after the method name in the meta line.
- **How far the part travels at 24 and 20 px.** The poses hold at 40 px in the field; the same percentages move less than a pixel at the inline sizes, so that mark may want the chosen pose only, with no hover.
- **A 16 px check on oven, air fryer and pressure cooker.** They are the densest three at that size; if air fryer and pressure cooker still read alike, the drawer seam and the regulator weight need a pixel each.
