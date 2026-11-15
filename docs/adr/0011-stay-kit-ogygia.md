# Stay Kit 3; ogygia per route — **superseded**

**Status:** superseded (14 Nov 2026, Coinnich) by [ADR 0037](./0037-zero-js-public-cache-guardrails.md). **Do not add ogygia.** Public pages are 0-JS SvelteKit (`csr=false`). `/pantry` is plain Kit with JS. Remove `OGYGIA_SECRET`.

Measured brotli: ogygia runtime ~**22 KB** at page load (docs claimed ~8 KB), plus ~14.5 KB tiny island wake and ~31 KB remote-function island wake. 0-JS Kit public HTML is ~0.5–0.8 KB + ~0.6 KB hashed StyleX CSS, **0 JS**.

Historical lock below (round 9 / 18) is obsolete for Chef Llama. dollar-holler may still demo ogygia.

---

## Historical (obsolete)

**Was:** accepted (round 9 Q2 per-route islands; **round 18 Q1 yes:** `ogygia({ router: false })`; no lakes; no `ogygia/router` table).

ogygia does **not** block ISR. Kit prerender = build-time static assets. “ISR” here was Workers Cache + `Cache-Control` and/or an ogygia **deferred** hole over KV.

**`/` was:** `csr=false`, `prerender=true` **shell**, Popular `render:'deferred'` `wake:'visible'`. **Now:** `/` is `(site)` edge SSR, `csr=false`, no islands ([ADR 0037](./0037-zero-js-public-cache-guardrails.md)).

`/pantry` `/saved`: `csr=true`, no ogygia — unchanged.

SPA router / lakes / `ogygia/router` were already not v1. They stay dollar-holler-only demos, not Chef Llama.
