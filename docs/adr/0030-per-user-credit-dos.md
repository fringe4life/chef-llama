# Per-user Credit DO plus sibling DOs; dashboard skips global D1

**Status:** accepted (round 45 Q11; round 48 leftover Q1 yes)

Dashboard (`/account`, usage, packs) must **not** scan `RECIPES_DB` and must **not** `SUM` the ledger from scratch. Each Better Auth user has a **Credit** SQLite DO (`getByName(userId)`): append-only ledger **and materialized** `remaining`, `pack_sum`, recent debit rows, pack-history rows, updated in the same SQL write as the ledger insert.

Additional **per-user** DO classes (not one kitchen sink). Cloudflare: one DO per coordination atom; parent stores ids; children hold content. Public Recipe rows, Popular, share, Vectorize stay **`RECIPES_DB`** (the old “one Site D1”) — do not dual-write blobs. **`AUTH_DB` is extra** for Better Auth tables only ([ADR 0036](./0036-better-auth-on-d1.md)). Gift pool stays a **separate** class (#76). Hibernate; no keepAlive. Generate **Worker** RPCs then `env.AI.run` on the Worker — AI does not run inside a DO. Diet is attached on that Generate request; the Site Worker coordinates.

Sibling **Diet** DO holds multiple Diet rows + `active_diet_id`; Generate calls `getActive()`. **Saved** = Recipe **ids** on a sibling DO, not blobs. Those Recipes are **public-by-URL** on `RECIPES_DB` ([ADR 0032](./0032-public-by-url-recipes.md)); Saved is the private list, not a private document. Profiles are **not** D1-queued against recipe writes. Site Worker coordinates: RPC Diet, attach the row on the cook request, `env.AI.run` on the Worker.

Two D1s **do** isolate write queues (each D1 is its own single-threaded Durable Object) even though `batch()` cannot span databases. A second global D1 for Diet is still not the scale-out: every Cook would share one diets-D1 thread. Diet left D1 for per-user DOs; that is why recipes stay on one `RECIPES_DB`, not because two D1s fail to isolate queues. Auth sessions live on a separate `AUTH_DB` ([ADR 0036](./0036-better-auth-on-d1.md)). [round 48](../../internal/research-round48-public-private.md) retracts the round-47 overstatement.

<!-- Sources: round 45 Q11; round 48 leftover Q1 yes; round 49 Q1 public-by-URL; CF Rules of DOs. -->

[#82](https://github.com/fringe4life/chef-llama/issues/82) · [#88](https://github.com/fringe4life/chef-llama/issues/88) · [round 48](../../internal/research-round48-public-private.md) · [round 47](../../internal/research-round47-d1-limits-leftover.md) · [round 45](../../internal/research-round45-valibot-drizzle-dos.md) · [Rules of DOs](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/).
