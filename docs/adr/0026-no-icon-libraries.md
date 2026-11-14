# No icon libraries except official OAuth marks; UI pictograms are custom SVG

**Status:** accepted (round 29 Q1 yes).

Do **not** add Lucide, Simple Icons, Tabler, Phosphor, or Iconify as a UI kit. Chrome pictograms (chips, Diet, Generate, credits) are **custom animated SVG** — in-file CSS, `light-dark()`, `prefers-reduced-motion` — same class as [cupboard.svg](../designs/cupboard.svg).

**OAuth exception (legal marks only):** Google, Apple, and Facebook (v1). Copy **official** Sign in with Google / Apple / Facebook assets into the Vite graph. Meta / X only if those extra OAuth rows exist. **Not** Lucide (v1 **removed** brand logos — [statement](https://github.com/lucide-icons/lucide/blob/main/BRAND_LOGOS_STATEMENT.md)). **Not** Simple Icons (package CC0 ≠ trademark; Google forbids a monochrome custom G — [branding](https://developers.google.com/identity/branding-guidelines)). Per-icon npm still installs **8–16 MB** unpacked (`@lucide/svelte` 8.0 MB, `simple-icons` 16.1 MB, 28 Oct 2026). Do **not** add `svelte-clerk` for logos.

[round 28](../../internal/research-round28-oauth-icons.md) · [#73](https://github.com/fringe4life/chef-llama/issues/73).
