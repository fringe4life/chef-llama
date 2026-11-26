# AI chef site — design system

Product, repo and token-set name: **Chef Llama**. **Larder** was the pre-rename repo and the old working name; nothing user-facing uses it.

This file is the v1 design contract: toolchain, IA, native UI. **Working draft (not locked, not Code):** the 28 Oct 2026 Kombai `/` + sticker round, improved in place on the canvases in [`.kombai/canvas/`](../.kombai/canvas/) — `index`, `landing`, `account`, `chart`, `type`. The `docs/designs/` HTML mocks and `design-mock.html` no longer exist; do not cite them. No Figma.

## Recommended toolchain

**Do most of the work in the repo.** Treat HTML/CSS (this mock, then Svelte) as the source of truth. Use canvases only to explore a screen, then copy structure into the app.

| Role | Tool | Cost that matters | Where it runs |
| --- | --- | --- | --- |
| Generate / iterate UI for implementers | **Kombai** (IDE extension + Design mode; later Code mode) | Free: 150 credits on signup, then 50/day up to **300/month**. Pro $20/mo. | Local IDE + Kombai account |
| HTML/CSS canvas + agent read/write | **Paper Desktop** + local MCP (`paper mcp`) | Free: **100 MCP tool calls / week**. Pro $20/editor/mo → 1M/week. Image gen limited on free. | Local desktop; still **metered by Paper’s cloud** |
| Fallback HTML/CSS canvas | **Pencil** (`pen.dev`, `@pencil.dev/cli`) | Free plan with **unlimited MCP while designing**; 5 agent-days/mo and 25 image/SVG gens. HTML+CSS export. `.pen` files can live in git. | Local app / CLI / Cursor extension |
| Tokens + components | Named CSS tokens via `light-dark()` consumed by StyleX `defineVars` | Free | Repo |
| Do not use | Figma MCP | Burns Cursor/Figma quota; Paper itself says Figma MCP is lossy | — |

### Practical pipeline (v1)

1. **Lock the tokens** in CSS, per [theme.md](./theme.md#tokens-are-the-theme). Kombai and Paper must reuse these names, not invent a purple system.
2. **Explore a screen in Kombai Design mode** (or Pencil). Export / copy HTML+CSS. Do not ask Kombai to invent a new palette.
3. **Optional Paper pass** only for a token sticker sheet or one selected frame (`get_computed_styles` / `get_jsx`). Budget ~5–15 MCP calls per screen. Stop before the weekly 100 is gone.
4. **Implement in SvelteKit** against native `<dialog>` and Popover API (no CSS anchor positioning; see [theme.md](./theme.md#native-overlays)). StyleX `stylex.attrs` for component styles; CSS variables for theme.
5. **Verify** in the browser (light, dark, empty pantry, one recipe, saved list).

Kombai is the UI-generation engine. Paper is optional. The **working draft** is the canvas nodes in [`.kombai/canvas/`](../.kombai/canvas/). Do not Code-design until Coinnich accepts.

---

## Paper.design: npm, MCP, local vs quota

### What is official

Paper does **not** publish an official npm MCP server. The MCP comes from **Paper Desktop**.

- Download: [paper.design](https://paper.design) → Desktop app (browser app has **no** MCP).
- Opening Desktop installs the **Paper CLI**. Copy the path from the in-app MCP panel.
- Canonical local server: `paper mcp` (stdio).
- Legacy HTTP (still works while a file is open): `http://127.0.0.1:29979/mcp`.
- Cursor: Marketplace plugin **or** `/add-plugin paper-desktop`. Docs: [paper.design/docs/mcp](https://paper.design/docs/mcp).
- Claude Code plugin: `claude plugin marketplace add paper-design/agent-plugins && claude plugin install paper-desktop@paper`.

Older remote URL `https://mcp.paper.design/sse` appears in third-party notes. **Do not use it.** Use Desktop + local stdio so you are not also burning a hosted MCP hop. Hosted vs local does **not** waive Paper’s weekly call cap.

### Local MCP does not waive Paper’s 100/week

Yes: Kombai or this agent can talk to Paper **locally** (stdio `paper mcp` or localhost HTTP). That avoids **Cursor’s Figma/cloud MCP quota**.

No: it does **not** give unlimited Paper tools. Paper meters MCP `tools/call` against the signed-in plan (community + [pricing](https://paper.design/pricing): **100/week free**, **1M/week Pro**). Reads count (`get_screenshot`, `get_jsx`, `get_computed_styles`, …). Users report burning the free cap in minutes. Desktop docs even mention “after upgrading, MCP limits aren’t reset” as a known bug — quota is product-side, not “Cursor cloud only.”

Do not use quota-bypass proxies. Treat 100/week as real.

### Exact package names

| Package | Official? | Use |
| --- | --- | --- |
| Paper Desktop CLI (`/path/to/paper mcp`) | **Yes** | Local MCP. Not on npm. |
| Cursor plugin `paper-desktop` | **Yes** | `/add-plugin paper-desktop` |
| Claude plugin `paper-desktop@paper` | **Yes** | Claude Code |
| `npx paper-mcp@latest` ([CuteMoment/Paper-Design-MCP](https://github.com/CuteMoment/Paper-Design-MCP)) | Community | stdio bridge to `127.0.0.1:29979/mcp` if a client cannot speak HTTP |
| `@try-works/pi-paper-design` | Community | Pi agent only |
| `paper-mono` / `npx paper-mono` | Unrelated CLI | Design-to-code specialist; **not** Paper’s MCP |
| `@pencil.dev/cli` | Pencil | Fallback canvas (`npm i -g @pencil.dev/cli`) |

### Coinnich setup (credentials this agent does not have)

**Kombai**

1. Create a free account at [kombai.com](https://kombai.com/pricing/).
2. In Cursor: install **Kombai - The AI Agent Built for Frontend** (marketplace / Open VSX). Cursor ≥ 0.44.
3. Sign in from the Kombai sidebar.
4. Optional desktop app: Settings → **Kombai MCP Server** → enable **Cursor**. That writes `~/.cursor/mcp.json` and installs skills such as `/design-with-kombai`, `/code-kombai-design`. Desktop must be running to start chats from Cursor.
5. To let **Kombai** drive Paper: the Cursor **paper-desktop** plugin does **not** appear inside Kombai. Point Kombai at the Desktop CLI instead. On this machine that file is `~/.kombai/mcp.json` (Kombai Desktop; restart Kombai after edits). Per-repo `.kombai/mcp.json` is the same shape. Do **not** expect the Cursor plugin to be shareable.

```json
{
  "mcpServers": {
    "paper": {
      "command": "/home/cc/.paper/bin/paper",
      "args": ["mcp"]
    }
  }
}
```

If `~/.paper/bin/paper` is missing, open Paper Desktop once (it installs the CLI). There is no official `npx paper mcp`. Do not use `https://mcp.paper.design/sse`.

Every Paper tool Kombai calls still spends the 100/week. Prefer handing Kombai this mock + token CSS instead of a live Paper session.

**Paper (Fedora, this machine — 2026-10-21)**

**RPM vs Kombai:** `kombai-2.0.153-1.x86_64` is installed. `paper-desktop-0.5.16` from `~/Downloads/paper-desktop-0.5.16x86_64.rpm` is **not**. `sudo rpm -i` fails because six `/usr/lib/.build-id/...` Electron debug symlinks collide with Kombai. Do **not** uninstall Kombai. Do **not** `rpm -i --replacefiles`.

Safe RPM (needs your sudo password; this agent could not):

```bash
sudo rpm -i --excludepath /usr/lib/.build-id ~/Downloads/paper-desktop-0.5.16x86_64.rpm
rpm -q paper-desktop kombai
# expect: paper-desktop-0.5.16-… and kombai-2.0.153-1.x86_64
```

`--test` of that excludepath was not run as root either (`sudo` asked for a password; user `rpm` cannot take the rpmdb lock). After a successful RPM install, switch the URL handler to the system desktop and drop the AppImage one:

```bash
xdg-mime default paper-desktop.desktop x-scheme-handler/paper
xdg-mime default paper-desktop.desktop x-scheme-handler/paper-dev
rm -f ~/.local/share/applications/paper-appimage.desktop
update-desktop-database ~/.local/share/applications
```

**Coexistence path in use now:** keep Kombai RPM + Paper **AppImage** at `~/Applications/paper.AppImage` (restored from Trash; login session was anonymous / not signed in). Handler file: `~/.local/share/applications/paper-appimage.desktop` (`Exec=…/paper.AppImage %U`, `MimeType=x-scheme-handler/paper;x-scheme-handler/paper-dev;`). Official RPM desktop uses the same schemes.

**Linux OAuth bounce:** Brave/xdg has no `paper://` handler unless a `.desktop` registers it. AppImage does not install `/usr/share/applications/paper-desktop.desktop`. Browser stays on the callback URL.

1. Keep Paper Desktop running (AppImage).
2. Sign in; if the browser does not bounce back, copy the address bar (`paper://…` or `paper-dev://…`).
3. Paste it into a terminal: `xdg-open 'paper://…'` or `/home/cc/Applications/paper.AppImage 'paper://…'`.
4. If `xdg-open` says no handler: `update-desktop-database ~/.local/share/applications` then `xdg-mime default paper-appimage.desktop x-scheme-handler/paper` (and `paper-dev`). Restart Brave.
5. Last resort: extract without installing — `cd /tmp && /home/cc/Applications/paper.AppImage --appimage-extract` then run `squashfs-root/paper-desktop %U` (same `--no-sandbox` fallback as the RPM desktop if user namespaces fail).

Do not install third-party login proxies. CLI `paper mcp` (stdio) is already on disk; Cursor plugin uses it. Kombai needs the snippet above, not the plugin.

**Paper usage (once signed in)**

1. Open a `.paper` file (MCP needs an open file for reads/writes).
2. MCP panel → Add to Cursor, or `/add-plugin paper-desktop`.
3. Confirm Paper in Cursor Settings → Tools & MCP.
4. Spend quota on a **token sticker** and **one** pantry frame. Export HTML/CSS. Close the session.

**If Paper MCP is too weak (it is, on free):** use **Pencil** next. Official npm: `@pencil.dev/cli`. MCP is local, git-friendly `.pen`, HTML+CSS export, unlimited MCP while designing on the free plan. Then keep Kombai as the implementer. Penpot is a more distant OSS option (tokens, MCP) but slower for HTML-native agent loops.

---

## Tokens

All tokens — colour, radius, type, spacing and the light/dark switch — are [theme.md](./theme.md#tokens-are-the-theme), including the two chart marks ([§ Chart marks](./theme.md#chart-marks)). That file owns the names, the roles, where values live and how the scheme is chosen; this file carries no token inventory, no values, and no theme override.

StyleX-on-Svelte is **viable**, not a poor fit: official SvelteKit install (`@stylexjs/unplugin`) and `stylex.attrs` (class, not `className`), per [theme.md § StyleX dev runtime](./theme.md#stylex-dev-runtime).

One design consequence worth keeping: neither the vegetarian tag nor the time / heat group has a colour token of its own — the tag takes the action colour, and heat is plain figures under a hairline divider.

---

## Native browser components

Prefer these over shadcn JS overlays. Style with the theme's named variables ([theme.md](./theme.md)).

| Primitive | Where | Behavior |
| --- | --- | --- |
| **Popover API** (plain top-layer placement; no CSS anchor) | Ingredient **chips** | Click chip → popover: edit spelling, remove. Esc / light-dismiss. |
| Same | Recipe card **⋯** | Save, copy link, not interested. |
| Same | **Account** control | Menu: theme, credits, sign out. Top-end of header. |
| **`<dialog>`** | Generate confirm when filters are empty? Skip. Use for **credits exhausted**, **sign-in required**, and **unsaved leave** on a long detail edit. | `showModal()`, `::backdrop` uses `--foreground` at 40% opacity. |
| **`<dialog>`** (non-modal, optional) | Recipe detail on small screens as a sheet | If Popover overlay is enough, skip. Prefer a route on desktop, `dialog` sheet on narrow. |
| **Invokers** (`commandfor` / `popovertarget`) | All of the above | No extra click JS when the browser supports it; small Svelte fallback. |

Do not polyfill custom dropdowns. Focus: `outline: 2px solid var(--ring); outline-offset: 2px`.

---

## Selection controls

One shell serves the Diet step's **Dietary requirements** and the devices field: eight marks, a name, a pocket, one wash. They differ only in what sits in the pocket. Board: `onboarding.canvas#var_9eb82776e647` (`Tile: one shell, tick and rank`). `Diet D` and `Diet D phone` on the same canvas and `Devices E` on `devices.canvas` carry it; the eight device glyphs and their states are [icons.md](./icons.md#the-eight-cooking-methods).

- **A `<label>` around a visually hidden `<input type="checkbox">`.** One real input per tile, so the field is a `role="group"` of checkboxes with no ARIA invented on top. The canvases read state from `:has(input:checked)`; in StyleX the same state arrives as a composed style on the label, because a StyleX style selects only the element it is applied to. Six states, all the shell's: rest, hover, focus-visible, filling, checked, at limit. No indication adds one.
- **One box, one wash.** `--card` on a hairline `--border`, `--radius-sm` 4px, `min-block-size: 92px` (96 at two across), `--space-3 --space-2` padding, content centred. The wash is a single `::before` filled `--primary`: `clip-path: circle(0% at var(--fill-x) var(--fill-y))` at rest, `circle(150% …)` checked, arriving on `--ease-arrive` at `--duration-base` and leaving on `--ease-depart` at `--duration-quick`.
- **The origin is the pocket, in both fields.** `--slot: 20px` at `--slot-inset: var(--space-2)` gives `--fill-x: calc(100% - var(--slot-inset) - var(--slot) / 2)` and the matching `--fill-y`, so moving the slot moves the fill and no second number exists to drift. From a corner the wash needs **150%**: at eight across the far corner is 141 px away against a 117 px reference radius, so the 110% that sufficed from the centre of the mark would stop 12 px short.
- **The pocket is drawn at rest, for the tick as well as the rank.** A keyline (`--input` 74% toward `--foreground`) with `--surface` inside, clipped to the same slightly-off polygon as the chip's. That empty slot is what says where the mark will land; without it the tick appears from nothing and the two fields stop reading as one control.
- **Checked is a fill, and each indication answers differently.** The tick is 11 px with no frame of its own: the pocket clears and the tick draws over it (`stroke-dasharray: 17`, `--ease-arrive` at `--duration-quick`, delayed `--duration-tick`). The rank inverts the pocket to `--primary-foreground` on `--ease-squish` and seals the numeral in on the same delayed `--ease-arrive`. Over the fill, text is `--primary-foreground` and the name goes 700.
- **The numeral is data.** It is the index of the app's own selected array, not a CSS counter over the DOM, because a Cook may pick in any order and removing one closes the gap, so the numbers always run 1..n.
- **The bank owns the cap and the order; a tile knows neither.** Diet passes no cap. The devices field caps at three, and the first is the primary method. At the cap the rest draw dashed with a cold mark ([icons.md](./icons.md#the-states-for-the-form-only)); whether a press there swaps rank 3 or does nothing is still open in that file, and the component forces neither.
- **The count gives way, never the tile.** Eight across at ≥64 rem of the bank's own width, four at ≥30 rem, two below, as container queries on a wrapper — a container cannot query itself, so the wrapper carries `container-type` and the bank reflows inside it. A tile keeps its shape and its 96 px block size at two across, and the mark steps 40 → 48 rather than the tile shrinking.
- **Paint is the shell's; the mark consumes it.** The shell publishes `--surface`, `--food`, `--leaf`, `--steam`, `--sw` and `--mark-size`; a mark declares no colour of its own, which is what lets sixteen glyphs share one shell with no per-glyph checked rules. Steam is a third layer of the mark, not a feature of the tile.
- **The chip is the same idea at thumb size.** 32 px tall, a 14 px slot, the same pocket, the same tick draw, the same clear-on-check and the same 4 px corner; only the slot and the label placement differ. That is why the pocket is drawn on the tile too — the smaller version already promised it.
- **Focus** is `outline: 2px solid var(--ring)` at `outline-offset: 2px`; **press** is `translateY(1px)` on `--ease-squish`; **hover** moves surface, border and pocket on `--ease-linear` at `--duration-tick`. Everything that travels collapses under `prefers-reduced-motion: reduce`; the colour change stays.

---

## Visual direction

One aesthetic: **working kitchen, not generative-AI purple.**

- Parchment / flour / olive oil / paprika / cast iron.
- Display serif for food names; practical sans for controls.
- Hairline borders, linen-tinted wells, chips like masking-tape labels.
- Photography: none required in v1. Optional later: real pantry grain, not 3D vegetables.
- Motion: 120–180ms opacity/transform on popovers. No gradient mesh, no glow orbs.
- Light is default (kitchen daylight). Dark is a closed cupboard: iron, oil-green, warm type — not neon.

---

## Local mock

The mock is the canvases in `.kombai/canvas/` — `index`, `landing`, `account`, `chart`, `type`, split on 2026-11-17 from the single `chef-llama.canvas` that came over from the old `larder` workspace, plus `onboarding` (added 2026-11-23) for the Diet step and the [selection control](#selection-controls), and `devices` for the eight device marks with their states and motion. `index.canvas` lists the surface canvases and the node ids the docs cite; it does not carry `onboarding` or `devices` yet. **Fonts: system stacks only** ([theme.md](./theme.md#fonts)). **Not locked.**

---

## Implementation notes for the Svelte app (not done here)

- Put tokens in `*.stylex.ts` `defineVars` with `--` keys, and the non-StyleX raw CSS in `src/lib/theme/tokens.css` ([theme.md](./theme.md#native-overlays)).
- Components: `IngredientChip`, `RecipeCard`, `AccountMenu` wrapping native popover/dialog, and `SelectionTile` / `SelectionBank` for the two fields ([§ Selection controls](#selection-controls)).
- The bank's reflow and the fill's origin are container queries and derived custom properties, neither of which StyleX can express against an ancestor, so they live in the raw-CSS companion beside the component ([theme.md](./theme.md#native-overlays)).
- Do not introduce Radix/shadcn JS. Compatible **tokens only**.

---

## Open

- **Whether the pocket carries a graphite underdrawing of the tick.** The chip was meant to hold a faint copy of the same path at about 18% ink, so a rest state reads as "a tick will be drawn here" rather than a plain box, with the ink tick tracing over it on check. Neither the chip nor the tile has that rule in its current CSS — the clear-on-check behaviour arrived without it. One decision covers both sizes, and the two must not diverge.
