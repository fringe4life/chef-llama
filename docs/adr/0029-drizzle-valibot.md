# Drizzle + Valibot, not Effect SQL / Effect Schema

**Status:** accepted (round 45 Q10 + owner Valibot). Supersedes [ADR 0028](./0028-effect-sql-not-reylo.md). **[#83](https://github.com/fringe4life/chef-llama/issues/83) is superseded** (Effect SQL on D1/DO is not v1).

v1 query layer is **Drizzle** on D1 (`Drizzle.D1`) and on the Credit SQLite DO (`Drizzle.DurableObject`). Copy dollar-holler’s Worker stub pattern ([PR 322](https://github.com/fringe4life/dollar-holler/pull/322)): Vite aliases + `ssr.noExternal` so `drizzle-kit` / `generate-drizzle-schema` / `node:fs` never ship. Owner measured Drizzle smaller than Effect SQL in that graph.

v1 validation is **Valibot** (Standard Schema): Kit remote `query`/`form`/`command` args, Recipe JSON after cook SSE, `drizzle-orm/valibot` for insert/select. Not `effect/Schema`. Alchemy + `Data.TaggedError` stay. **Effect tagged errors only** — no Effect SQL. Reylo stays parked.

[#83](https://github.com/fringe4life/chef-llama/issues/83) · [round 45](../../internal/research-round45-valibot-drizzle-dos.md) · [Drizzle.D1](https://alchemy.run/sql/drizzle/d1/) · [Kit remotes](https://svelte.dev/docs/kit/remote-functions).
