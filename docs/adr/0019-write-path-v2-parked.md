# v1 write path stays D1 + Credit DO; Turso / Postgres / Pipelines parked

**Status:** accepted v1 (round 14 Q4). v2/v3 options parked (round 15).

**v1:** Better Auth session (`userId`) + Diet DO `getActive()` (Site Worker attaches Diet; no AI inside a DO) → Credit DO coalesced `debit` → Workers AI → **Valibot** → D1 `batch()` insert a **public-by-URL** Recipe → Queue `index_recipe` (embed + Vectorize upsert + Analytics Engine). Diet is not D1-queued against that INSERT ([ADR 0030](./0030-per-user-credit-dos.md) · [ADR 0032](./0032-public-by-url-recipes.md)).

**Parked (not v1):**

| When | Option | Cite |
|---|---|---|
| v2 | Turso / libSQL over HTTP (`@libsql/client/web`, `@tursodatabase/serverless`) | [CF Turso](https://developers.cloudflare.com/workers/databases/native-integrations/turso) |
| v2 | Postgres + Hyperdrive | concurrent writers / >10 GB; [storage options](https://developers.cloudflare.com/workers/platform/storage-options/) |
| v3 | Basin Pipelines → R2 Iceberg/Parquet | [Basin](https://developers.cloudflare.com/basin-pipelines/) — lakehouse, not recipe rows |

[round 14](../../internal/research-round14-tokens-byo-writes.md) · [round 15](../../internal/research-round15-concise-secrets-ci.md).

## Proposal (round 33 — not accepted until grill)

Do **not** replace Credit DO + D1 with a kitchen-sink **User DO** (credit + saved recipes + profile). CF: one DO per **coordination atom**; per-user storage is valid, but Popular / share `/recipes/[id]` / Vectorize need **cross-user** D1. Diet + Saved **ids** are sibling per-user DOs (supersedes “Diet stays D1”). DO name: `getByName(userId)` ≡ `idFromName` (Better Auth `user.id` UUIDv7). Gift pool remains a **separate** DO (#76). [#82](https://github.com/fringe4life/chef-llama/issues/82) · [round 33](../../internal/research-round33-reylo-userdo-turbo.md).
