# v1 every Generate is public-by-URL; private Recipes are v2

**Status:** accepted (round 49 Q1 yes)

Every v1 Generate writes a **public-by-URL** Recipe row to **`RECIPES_DB`**. `/recipes/[slug]` stays unauthenticated SSR + OG SVG + `noindex` (Popular excepted). Cook does **not** pick private. No `visibility` flag, no Privacy Mode, no privacy picker on Generate.

**Saved** is a private **id list** on the per-user Saved DO — not a private document, not a blob copy of the Recipe. **Popular** ranks rolling 7-day **saves of those public rows** (KV); fill with newest public if the window is thin. Ranking a private Recipe on `/` would publish it; gating `/recipes/[slug]` would kill OG unfurl ([ADR 0010](./0010-seo-share-recipes.md)).

Private Recipe store = **v2**. Dual-write of Recipe blobs onto a user DO stays forbidden ([ADR 0030](./0030-per-user-credit-dos.md)). GitHub repo private-when-coding-starts ([#80](https://github.com/fringe4life/chef-llama/issues/80)) is **not** this lock.

Account deletion **deletes** those rows (410 on old URLs), not anonymise ([ADR 0036](./0036-better-auth-on-d1.md)).

<!-- Sources: round 48 public/private research; Coinnich round 49 Q1 yes; ADR 0010 share/OG; ADR 0023 Popular; ADR 0030 Saved ids + RECIPES_DB; DishGen default-public / Pro Privacy Mode analog. -->

[#88](https://github.com/fringe4life/chef-llama/issues/88) · [round 48](../../internal/research-round48-public-private.md) · [ADR 0010](./0010-seo-share-recipes.md) · [ADR 0023](./0023-popular-saves-window.md) · [ADR 0030](./0030-per-user-credit-dos.md).
