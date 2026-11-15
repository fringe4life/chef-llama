# Popular cap, cron snapshot, cache-hit index

**Status:** accepted (14 Nov 2026, Coinnich) for **cap 20**, **≥5 distinct savers**, **cron snapshot** (not per-save), **`/popular` as a v1 route**, index top 5 from `popular:all`. Ranking window stays rolling **7-day saves of public-by-URL rows** ([ADR 0023](./0023-popular-saves-window.md) · [ADR 0032](./0032-public-by-url-recipes.md)). Quiet-week all-time fill is **still open**. v2 types: [ADR 0038](./0038-popular-type-allergy-safeguards.md). Cache headers: [ADR 0037](./0037-zero-js-public-cache-guardrails.md) · [caching.md](../caching.md).

## Locked

- **Cap 20** snapshot items per list (`id` ULID + `slug` + `title`). No infinite scroll.
- **Appear only after ≥5 distinct savers** in the 7-day window.
- **Index `/` shows 5.** Edge SSR `csr=false`, KV `popular:all`, Cache-Tag `popular-top`. No generator on `/`. Plain HTML form/links to `/pantry` (`?i=` prefill).
- **`/popular` is a v1 URL** (not only an island on `/`). Same snapshot; tags `popular`.
- **Cache hit required.** `/` and `/popular` must not scan D1, Saved DOs, or rebuild rank on the request. KV miss → last-good or empty placeholder; never a live rank on the request.
- **Cron snapshot, not per-save rebuilds.** One D1 aggregate (7-day saves, distinct savers, public type tags), deterministic rank, cap 20, min 5 distinct savers. Hash visible `[id, slug, title]` order per list vs KV `popular:hashes`; write only changed `popular:{type}` / `popular:all`; purge only changed tags (`popular-top` iff the top 5 changed); hashes last. The feed into that aggregate is **OPEN**: `save_count` on the recipe row **or** queue events into a 7-day per-recipe saver ledger. If a ledger is used, PK is `save_ledger (recipe_id, saver_hash)`, `saver_hash` = HMAC(secret, userId). A bare `save_count` cannot enforce distinct savers + window. Do not pick.
- **Not** a Cron ping of `/` ([#81](https://github.com/fringe4life/chef-llama/issues/81) still holds).
- Headers: `/` and `/popular` browser **60**, edge **3600**, swr **86400**. Recipe pages: browser 300, edge 1 year, tag `recipe-{ulid}`. **Not** `s-maxage` + SWR.

This **replaces** the earlier rec of rebuild-on-save/unsave + daily cron, KV `popular:home`, and “no `/popular` feed in v1”.

## Quiet week (still open)

Earlier rec: a week is quiet when the 7-day window has **fewer than N recipes with at least M saves**, then fill remaining slots up to 20 from all-time most-saved. **N = 5, M = 2** was the rec; **M is now in tension** with the locked **≥5 distinct savers** bar. Do not guess a fill rule — Coinnich to confirm whether quiet-week fill still applies once a recipe must already have 5 distinct savers.

## v2

Closed `/popular/[type]` list, cap 20 per type, allergy fail-closed: [ADR 0038](./0038-popular-type-allergy-safeguards.md). Parked URL shape: [ADR 0027](./0027-v1-urls-region-api.md) (`[type]`, not `[diet]`).

## Open questions

- Quiet-week all-time fill: keep / drop / retune N and M now that min distinct savers is 5?
- Does the author’s own save count toward the 5?
- Guest Generates (if ADR 0035 ever allows them) — rec: still only **signed-in saves** count.
- **Counting mechanism:** counter vs queue events into a 7-day per-recipe saver ledger. A bare `save_count` cannot enforce 5 distinct savers or the window. **Do not pick.**

Issue [#90](https://github.com/fringe4life/chef-llama/issues/90).

Related: [#6](https://github.com/fringe4life/chef-llama/issues/6) cache, [#35](https://github.com/fringe4life/chef-llama/issues/35) ogygia (dropped — [ADR 0011](./0011-stay-kit-ogygia.md) superseded), [#60](https://github.com/fringe4life/chef-llama/issues/60) 7-day saves, [#68](https://github.com/fringe4life/chef-llama/issues/68).
