# AI chef site — design system

Working visual name for tokens and mock: **Larder**. Product/repo name is still open.

This file is the v1 design contract: toolchain, tokens, IA, native UI. **Working draft (not locked, not Code):** the 28 Oct 2026 Kombai `/` + sticker, better than `01`–`03` and [`design-mock.html`](./design-mock.html) — [04-landing.html](./designs/04-landing.html) · [04-landing-dark.html](./designs/04-landing-dark.html) · [05-token-sticker.html](./designs/05-token-sticker.html) · [05-token-sticker-dark.html](./designs/05-token-sticker-dark.html). Improve in place. No Figma.

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

1. **Lock Larder tokens** in CSS (this doc + mock). Kombai and Paper must reuse these names, not invent a purple system.
2. **Explore a screen in Kombai Design mode** (or Pencil). Export / copy HTML+CSS. Do not ask Kombai to invent a new palette.
3. **Optional Paper pass** only for a token sticker sheet or one selected frame (`get_computed_styles` / `get_jsx`). Budget ~5–15 MCP calls per screen. Stop before the weekly 100 is gone.
4. **Implement in SvelteKit** against native `<dialog>` and Popover API (no CSS anchor positioning; see [theme.md](./theme.md#native-overlays)). StyleX `stylex.attrs` for component styles; CSS variables for theme.
5. **Verify** in the browser (light, dark, empty pantry, one recipe, saved list).

Kombai is the UI-generation engine. Paper is optional. The **working draft** is the Kombai `/` + sticker HTML in [`docs/designs/`](./designs/README.md). [`design-mock.html`](./design-mock.html) is an earlier sketch. Do not Code-design until Coinnich accepts.

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

## Larder tokens (shadcn-compatible)

StyleX-on-Svelte is **viable**, not a poor fit: official SvelteKit install (`@stylexjs/unplugin`) and `stylex.attrs` (class, not `className`). Native `<dialog>` / `[popover]` still need **real CSS custom properties** for UA-drawn parts (backdrop, ::backdrop, form controls). So:

**Source of truth:** shadcn **named** CSS variables (`--foreground`, `--primary`, `--background`, …). Those names **are** the theme. **Not** the shadcn / shadcn-svelte / bits-ui component pack.

**StyleX:** `defineVars` with `--` keys so StyleX emits the **same** names (no hashed vars). Native Dialog/Popover consume the variables. Light/dark is **`light-dark()`** + `color-scheme` on `html`, not a StyleX `createTheme` subtree. **No** `.dark` fallback.

Token set name: **Larder**. Groups: `color`, `radius`, `type`, `spacing`.

### color

HSL channels (shadcn pattern: `hsl(var(--background))`).

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--background` | `38 42% 96%` parchment | `30 12% 8%` cast iron | Page |
| `--foreground` | `25 20% 14%` | `38 30% 94%` | Body text |
| `--card` | `40 45% 99%` flour | `30 10% 11%` | Surfaces |
| `--card-foreground` | same as foreground | same | |
| `--popover` / `--popover-foreground` | match card | match card | Popover/dialog |
| `--primary` | `82 28% 28%` olive oil | `82 22% 48%` | Actions |
| `--primary-foreground` | `40 45% 97%` | `30 12% 8%` | |
| `--secondary` | `32 38% 90%` linen | `30 10% 16%` | Quiet chrome |
| `--secondary-foreground` | `25 20% 18%` | `38 25% 90%` | |
| `--muted` | `36 24% 90%` | `30 8% 15%` | Wells, chips idle |
| `--muted-foreground` | `25 10% 38%` | `35 12% 68%` | Helper text |
| `--accent` | `14 58% 42%` paprika | `14 52% 52%` | Highlights, saved |
| `--accent-foreground` | `40 45% 97%` | `30 12% 8%` | |
| `--destructive` | `4 72% 42%` | `4 65% 55%` | Remove chip |
| `--border` | `32 22% 82%` | `30 8% 20%` | |
| `--input` | `32 22% 82%` | `30 8% 22%` | |
| `--ring` | `82 28% 28%` | `82 22% 55%` | Focus |
| `--larder-herb` | `150 25% 32%` | `150 22% 46%` | Vegetarian tag |
| `--larder-flame` | `22 70% 42%` | `22 62% 52%` | Time / heat |

Also map shadcn `--chart-1`…`--chart-5` to olive, paprika, herb, flame, linen so future usage graphs match.

### radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius` | `0.5rem` | Root (shadcn `--radius`) |
| `--radius-sm` | `calc(var(--radius) - 4px)` | Chips, icon buttons |
| `--radius-md` | `var(--radius)` | Inputs, menus |
| `--radius-lg` | `calc(var(--radius) + 4px)` | Cards |
| `--radius-xl` | `1rem` | Dialogs, detail sheet |

Slightly squared — enamelware, not iOS pills.

### type

| Token | Value |
| --- | --- |
| `--font-display` | `"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif` |
| `--font-sans` | `ui-sans-serif, system-ui, "Segoe UI", sans-serif` |
| `--font-mono` | `ui-monospace, "Cascadia Code", monospace` (credits, IDs) |
| `--text-xs` … `--text-2xl` | `0.75rem` / `0.875` / `1` / `1.125` / `1.5` / `1.875rem` |
| `--leading-tight` / `--leading-body` | `1.2` / `1.55` |
| `--tracking-display` | `-0.02em` |

Display only on wordmark, recipe titles, empty-state headlines. UI chrome stays sans. **This system stack is v1** — no later Fontsource / Fraunces pass (see [theme.md](./theme.md)).

### spacing

4px grid: `--space-1` `0.25rem` … `--space-16` `4rem`. Layout: `--space-page` `1.25rem` (mobile) / `2rem` (desktop). Chip gap `--space-2`. Card padding `--space-5`.

Light/dark override: see [theme.md § Light and dark](./theme.md#light-and-dark) (localStorage, `data-colorscheme` on `<body>`, no cookie).

---

## Native browser components

Prefer these over shadcn JS overlays. Style with Larder variables.

| Primitive | Where | Behavior |
| --- | --- | --- |
| **Popover API** (plain top-layer placement; no CSS anchor) | Ingredient **chips** | Click chip → popover: edit spelling, remove. Esc / light-dismiss. |
| Same | Recipe card **⋯** | Save, copy link, not interested. |
| Same | **Account** control | Menu: theme, credits, sign out. Top-end of header. |
| Same or compact control | **Diet switcher** on `/pantry` | Sets the active Diet before Generate (v1 multi-Diet). Not a separate `/diet` route. |
| **Route** | **`/onboarding`** first-run (Diet #1, devices owned, staples customise, publish defaults). Not a blocking dialog. | Signed-in `(app)` page. |
| **`<dialog>`** | Later add / rename / edit / delete Diets: name, flags, allergies, kcal, servings, max time, **skill**, **method** / **devices**. Also **credits exhausted**, **sign-in required**, and **unsaved leave** on a long detail edit. Skip empty-filter Generate confirm. | `showModal()`, `::backdrop` uses `--foreground` at 40% opacity. Delete-active falls back to another Diet. |
| **`<dialog>`** (non-modal, optional) | Recipe detail on small screens as a sheet | If Popover overlay is enough, skip. Prefer a route on desktop, `dialog` sheet on narrow. |
| **Invokers** (`commandfor` / `popovertarget`) | All of the above | No extra click JS when the browser supports it; small Svelte fallback. |

Do not polyfill custom dropdowns. Focus: `outline: 2px solid hsl(var(--ring)); outline-offset: 2px`.

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

**Working draft:** [`docs/designs/04-landing.html`](./designs/04-landing.html) (parchment) and [`04-landing-dark.html`](./designs/04-landing-dark.html) (cast iron), plus token stickers `05-*`. File preview: Tailwind CDN + `color-scheme` on the **same** `:root` rule as `light-dark()` tokens. Canvas: `.kombai/canvas/larder-site.canvas`. **Fonts: system stack only** (`--font-display` / `--font-sans` / `--font-mono` above). No Fontsource pass. **Not locked.**

Earlier sketch: [`design-mock.html`](./design-mock.html) (pantry/results/detail in one file). Keep for chip/dialog notes; do not treat as the current look.

---

## Implementation notes for the Svelte app (not done here)

- Put tokens in `src/lib/theme/larder.css` and `*.stylex.ts` with `--` keys.
- Components: `IngredientChip`, `RecipeCard`, `AccountMenu` wrapping native popover/dialog.
- Do not introduce Radix/shadcn JS. Compatible **tokens only**.
