# v2 `/popular/[type]` closed list; allergy tags fail closed

**Status:** accepted for v2 shape (14 Nov 2026, Coinnich). Exact closed type list **TBC**. v1 `/popular` (no type) is [ADR 0037](./0037-zero-js-public-cache-guardrails.md) · [ADR 0034](./0034-popular-cap-cache.md). Canonical ingredients: [ADR 0018](./0018-chip-canonicalizer.md).

## Closed type list (v2)

`/popular/[type]` is a **closed** list. Working set (exact list TBC):

`keto`, `vegan`, `breakfast`, `gluten-free`, `dairy-free`, `nut-free`

Unknown types: Kit 3 param matcher in `src/params.ts` (plain Node at build, no `#lib`; `POPULAR_TYPES` in a dependency-free module) → **plain 404**, **not** cached (`private, no-store` via the default-deny hook). Query strings on `/popular/*` **redirect** to the clean URL.

Each type is its own KV key `popular:{type}` + Cache-Tag `popular-{type}`. Cap **20**. No infinite scroll. Same cron snapshot as `/popular` ([ADR 0034](./0034-popular-cap-cache.md)): not per-save rebuilds.

## Allergy / free-from safeguards (v2)

Free-from tags come **only** from a **deterministic ingredient rule table** over canonical ingredients ([ADR 0018](./0018-chip-canonicalizer.md)) **plus** a deny-list of hidden sources (soy sauce → gluten, pesto → nuts). **Fail closed** on an unknown ingredient.

- **AI cannot add** allergy / free-from tags. AI may only **flag conflicts**.
- **Disclaimer** on every allergy-typed Popular page and every Recipe.
- **Report a problem** link on those pages.
- **Admin pull** of a recipe: clear `free_from`, purge `recipe-{ulid}` and affected `popular-{type}`, re-run the snapshot.
- **Aggregate counts only.** Never per-user data on Popular.

Parked URL in [ADR 0027](./0027-v1-urls-region-api.md) was `/popular/[diet]`; the segment is **`[type]`**, and locale prefixes stay a reserved BCP-47 list so they cannot steal type names.
