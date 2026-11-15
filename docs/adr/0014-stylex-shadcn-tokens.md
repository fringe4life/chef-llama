# Theme is shadcn named CSS tokens; StyleX `--` keys; `light-dark()` only

**Status:** accepted (round 8 Q5; round 9 Q4 no `.dark`; round 10 Q2 `data-colorscheme` + `:has()`). **Round 19 accepted:** lock the **CSS token file** + one landing before any Kombai Code pass.

The theme **is** the shadcn **named CSS variables** ([Theming](https://ui.shadcn.com/docs/theming): `background`/`foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `radius`, optional `chart-*` / `sidebar-*`). StyleX `defineVars` uses `--` keys so hashes stay stable. **`light-dark()` only** — no `.dark` fallback (shadcn’s own scaffold uses `.dark`; we do not), no `mode-watcher`, no `createTheme`.

Override: small **blocking inline script** in `app.html` (cookie + `light-dark()`). **Never** render theme from cookies on the server for public pages (`transformPageChunk` would `Vary`/cookie-poison Workers Cache — [ADR 0037](./0037-zero-js-public-cache-guardrails.md)). Radios outside the chip tree. Pack **closed**. `build.cssTarget` = browsers with `light-dark()`, or Vite polyfills `color-scheme`.

## Cheap loop (round 19 accepted)

Kombai credits track **LLM tokens on active tasks**; preview/view is free ([credits](https://docs.kombai.com/account/credits)). Generating every Kit route before the look is accepted burns the Free **300/month** cap.

1. One repo CSS file of the names above with Larder parchment/olive/paprika/cast-iron in `light-dark()`. Iterate here + [`design-mock.html`](../design-mock.html) with **no** Kombai.
2. Kombai **Design mode**, **one** `/` + sticker, Variants **1**, Passes **1**. Attach a project `.ds` from this CSS / `design.md` ([Design System](https://docs.kombai.com/design/design-system/overview)). Hand-edit on canvas (no prompt = no credits).
3. After Coinnich accepts: next canvas screen, then **Code design** / Kit. Paper MCP is **100 calls/week** on Free — skip until a selected frame.

[round 19](../../internal/research-round19-design-loop-skills.md).
