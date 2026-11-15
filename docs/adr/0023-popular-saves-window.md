# Popular island ranks rolling saves, not views

**Status:** accepted (round 17 Q3 yes)

`/` and `/popular` read a **cron KV snapshot** (`popular:all`, [ADR 0034](./0034-popular-cap-cache.md)). Ranking is **not** HN gravity and **not** anonymous views.

## Typical rankings (cited)

- **HN:** `(points − 1) / (age_hours + 2)^G` with G historically **1.8** ([pg 2010](https://news.ycombinator.com/item?id=1781417)). Built so **yesterday’s story dies**.
- **Reddit `hot` (archived):** `log10(|ups−downs|)` plus recency (~12.5 h per log point) ([`_sorts.pyx`](https://github.com/reddit-archive/reddit/blob/master/r2/r2/lib/db/_sorts.pyx)).
- **Views-only:** GET counts. Inflated by bots, **OG unfurl** (recipes are shareable with OG SVG), and **edge/ISR cache** (we must not treat a KV hit as a view).
- **Saves:** signed-in persist. High intent, sparse, cold-start.

## v1 (locked)

Ranking is rolling **7-day saves of public-by-URL Recipe rows** (every v1 Generate writes one — [ADR 0032](./0032-public-by-url-recipes.md)). Jobs Worker **cron-snapshots** KV (not per-save rebuilds — [ADR 0034](./0034-popular-cap-cache.md)). Sort `saves_7d` desc, tie-break `created_at`. A recipe appears only after **≥5 distinct savers**. Cap **20**. **Do not** increment on anonymous `/recipes/[slug]` GET. **Do not** rank a private Recipe (none in v1; that would publish it).

Saved itself is a private **id list** on the per-user Saved DO ([ADR 0030](./0030-per-user-credit-dos.md)). **No D1 saves list. No dual-write of the list.** Popular **cross-user** counts come from `save_count` on the D1 recipe row (`RECIPES_DB`) **or** a queue event, updated on save/unsave by the Saved DO. A bare `save_count` **cannot** enforce 5 distinct savers or the 7-day window. Exact mechanism (counter vs queue events into a 7-day per-recipe saver ledger) is **OPEN**. Do not pick. If a ledger is used, PK is `save_ledger (recipe_id, saver_hash)`, `saver_hash` = HMAC(secret, userId). [#82](https://github.com/fringe4life/chef-llama/issues/82).

<!-- Sources: round 17 Q3 yes; round 49 Q1 public-by-URL; round 48 Saved = ids on a DO; 14 Nov 2026 cron snapshot + min 5 distinct savers. -->

v2: optional unique **signed-in** opens as a weak addend; optional decay if the catalog is large enough that last week should drop.

Production **domain** stays open — do not invent a hostname.

[round 17](../../internal/research-round17-scale-popular-lock.md) · [#60](https://github.com/fringe4life/chef-llama/issues/60) · [#88](https://github.com/fringe4life/chef-llama/issues/88).
