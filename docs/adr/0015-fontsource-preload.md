# Fontsource + Kit preload; content-hash is stable

**Status:** **superseded** (14 Nov 2026). v1 ships the **system font stack** in [design.md](../design.md) only. No Fontsource pass, no Fraunces / Source Sans 3 pin, no later “Kombai picks Fontsource families” step. [#56](https://github.com/fringe4life/chef-llama/issues/56).

Previous lock (round 10 Q7 / round 12): import `@fontsource-variable/…` into the Vite graph so woff2 URLs hash from file bytes; pin the package; never Google Fonts CSS; do not copy fonts into `static/`/`public/`. That hashed-Fontsource path is **not v1**.

**Still true (unrelated to Fontsource):** do not put hashed Vite assets in `static/`/`public/` (unhashed). Never `@import` / `<link>` Google Fonts.
