# GitHub setup — Chef Llama

**Status:** repo exists at [`fringe4life/chef-llama`](https://github.com/fringe4life/chef-llama) (renamed from `fringe4life/larder`). `gh` as **fringe4life** works for issues/labels/comments. **Public until coding starts.** Project **write** still needs `project` scope.

## Live URLs

- **Repo:** https://github.com/fringe4life/chef-llama (public, `main`; description: “ai chef recipe creator”)
- **Project/roadmap:** https://github.com/users/fringe4life/projects/3 (board: [views/1](https://github.com/users/fringe4life/projects/3/views/1)) — Status: Research / Design / Build / Later.

## Labels (14 Nov 2026)

**Created / present:** `research` `6F42C1`, `design` `D4C5F9`, `feature` `0E8A16`, `infra` `1D76DB`, `docs` `0075CA`, `proposal` `E9960A` (“Proposal — not locked; Coinnich to accept or reject”), plus GitHub defaults.

**`v2`** `#5319E7` — “Parked until after v1 ships.” Normal GitHub practice (filter label). Status **Later** on the Project is the board bucket. No extra Status option named v2. Milestone not created (label + Later is enough).

**v2-tagged issues:** [#4](https://github.com/fringe4life/chef-llama/issues/4) photo, [#14](https://github.com/fringe4life/chef-llama/issues/14) chat surface, [#45](https://github.com/fringe4life/chef-llama/issues/45) BYO, [#54](https://github.com/fringe4life/chef-llama/issues/54) Clairic slice, [#63](https://github.com/fringe4life/chef-llama/issues/63) Turso/Postgres/Pipelines, [#64](https://github.com/fringe4life/chef-llama/issues/64) qty+unit scale, [#65](https://github.com/fringe4life/chef-llama/issues/65) ogygia dropped (DH may demo), [#70](https://github.com/fringe4life/chef-llama/issues/70) SSE/`query.live` cook phases. (**Superseded 21 Nov 2026:** [#62](https://github.com/fringe4life/chef-llama/issues/62) multi-Diet picker is **v1** — see [product.md](./product.md#diet); retag the issue when implementing.)

## gh auth (this worker)

| Action | Result |
|---|---|
| `gh auth status` | **fringe4life**, `repo`, `read:project`, … |
| Create/edit issues, comments, `gh label create v2` | **OK** |
| `gh project item-add` / item-edit | **HTTP missing scope `project`**. Coinnich: `gh auth refresh -s project`, then add #62–#65 to project 3 as **Later**. |

Do not invent a production domain.

## Cloud Agent skills (not GitHub)

Matt Pocock / `grill-with-docs` already live on Fedora at `/home/cc/.agents/skills/`. Cursor **does not** copy that folder to Cloud Agents ([Skills](https://cursor.com/docs/skills)). **Accepted:** copy the grill set into **larder** `.agents/skills/` (not committed yet). `.cursor/environment.json` has **no** skills key.

## Issue index (workstreams)

Workstreams **#3–#14**. Later issues through **#92**. Round 31 filed **#79** cheap secure Actions (round 38: `svelte-check --tsgo` settled; bundlewatch added in review-corrections). Round 33 filed **#82** User DO vs Credit DO, **#83** Effect SQL vs Reylo/Drizzle (**superseded** by [data.md](./data.md)). Round 33b filed **#84** session-gated `/account` (spend/packs; GitHub title still says Clerk); **#78** stays CSS charts. Round 49 filed **#88** public-by-URL Recipes. Filed **#89–#92** as `proposal` (not locked; not a grill round). Do not duplicate **#52** / **#53** / **#79–#81**. Do not treat **#80** as Recipe visibility. Do not treat **#89–#92** as accepted.

| # | Title | Labels | Project Status (when set) | URL |
|---|---|---|---|---|
| 3 | Ingredients → recipes agent | intended `feature`, `research` | Research | https://github.com/fringe4life/chef-llama/issues/3 |
| 4 | Photo → ingredient list | `v2`, `feature` | Later | https://github.com/fringe4life/chef-llama/issues/4 |
| 14 | WebMCP chat-to-recipe (dedicated surface) | `v2`, `feature` | Later | https://github.com/fringe4life/chef-llama/issues/14 |
| 79 | Cheap cached secure GitHub Actions | `research`, `infra`, `docs` | — | https://github.com/fringe4life/chef-llama/issues/79 |
| 80 | Private vs public GitHub if the Site is paid (clone vs Actions minutes) | `research`, `infra`, `docs` | — | https://github.com/fringe4life/chef-llama/issues/80 |
| 81 | Workers not always-on | `research`, `infra` | — | https://github.com/fringe4life/chef-llama/issues/81 |
| 82 | Per-user Credit, Diet, Saved DOs; `RECIPES_DB` for public Recipes (`AUTH_DB` extra) | `research`, `infra`, `docs` | — | https://github.com/fringe4life/chef-llama/issues/82 |
| 83 | Query layer: Effect SQL, not Drizzle; Reylo parked | `research`, `infra`, `docs` | **superseded** by [data.md](./data.md) | https://github.com/fringe4life/chef-llama/issues/83 |
| 84 | Session-gated /account spend + packs (issue title still Clerk-gated) | `research`, `feature`, `docs` | — | https://github.com/fringe4life/chef-llama/issues/84 |
| 88 | v1 every Generate is public-by-URL; private Recipe store is v2 | `research`, `feature`, `docs` | — | https://github.com/fringe4life/chef-llama/issues/88 |
| 89 | Proposal: Starter pack (once-only NZD trial SKU) | `proposal`, `docs`, `research`, `feature` | — | https://github.com/fringe4life/chef-llama/issues/89 |
| 90 | Proposal: Popular cap, cache-hit index, quiet-week all-time | `proposal`, `docs`, `research` | **superseded** for ranking: Popular is ingredients (pairs/triples), not recipe saves — see [product.md](./product.md#popular) | https://github.com/fringe4life/chef-llama/issues/90 |
| 91 | Proposal: Generate do’s and don’ts near Generate | `proposal`, `docs`, `design` | — | https://github.com/fringe4life/chef-llama/issues/91 |
| 92 | Proposal: Reconsider guest Generate | `proposal`, `docs`, `research`, `feature` | — | https://github.com/fringe4life/chef-llama/issues/92 |

Probes #1–#2 are **closed**.

## README

Repo was **not empty** (`README.md` stub). Product README was **not** pushed. Do not copy this product into `firstroad` / `3dmodels` / `dollar-holler` / `van-life`.
