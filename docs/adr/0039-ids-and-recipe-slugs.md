# 0039 — IDs and recipe slugs

**Status:** accepted (15 Nov 2026, Coinnich), pending docs merge. Suffix-tolerant redirect accepted (Coinnich, 15 Nov 2026).

## Context
SQLite (D1 and Durable Object SQLite) has no UUID column type. Better Auth's default generateId is a random 32-char base62 string, not cursor-sortable; generateId: "uuid" is UUIDv4. An earlier draft used UUIDv7 for user.id. Coinnich decided internal ids are ULID everywhere and public recipe URLs are slugs, not ids. Public /recipes/… pages are edge-cached (ADR 0037); Workers Cache keys on path and purges by tag, so purge must address a page independent of its slug.

## Decision
- All internal primary keys are ULID, TEXT, lowercase Crockford (`[0-9a-hjkmnp-tv-z]{26}`), including Better Auth user, session, account, verification via `advanced.database.generateId: () => newId()`. Session tokens stay Better Auth's default random string.
- `newId()` (src/lib/id.ts) wraps `ulid@3` `monotonicFactory()` (Web Crypto getRandomValues; ~1 KB brotli), always lowercased. Drizzle: `text("id").primaryKey().$defaultFn(() => newId())`. Monotonic per isolate only; production Date.now() does not advance between I/O, so the monotonic factory is required.
- Public recipe URLs: /recipes/[slug=slug], slug = `{title-slug}-{8-char lowercase Crockford suffix}`; title part = NFKD, ASCII-fold, lowercase, non-alphanumerics to single hyphens, trimmed, max 50 chars; fallback `recipe-{suffix}` when empty. UNIQUE(slug) and UNIQUE(slug_suffix); on conflict retry the suffix only, never the ULID. Minted at creation; immutable in v1.
- Lookup by unique 8-char slug_suffix. If the param isn't the canonical slug (wrong or missing title, e.g. `/recipes/k3f9x2ab` or `/recipes/garlic-pasta-k3f9x2ab`), load `redirect(301, '/recipes/' + recipe.slug)`. Redirects in SvelteKit, not Cloudflare Redirect Rules / Bulk Redirects (those cannot look up D1). 301s and 404s never `publicCache`; default-deny → `private, no-store` (else Workers Cache heuristic caches 301 for 1200s / 404 for 180s per typo path). Only the canonical 200 is tagged `recipe-{ulid}`. No slug history table; slugs are immutable in v1; a future retitle is free because lookup is suffix-only.
- Unknown suffix -> 404 no-store. Deleted -> 410 no-store.
- Cache tags use the internal id: `recipe-{ulid}`. Tag grammar: `^(popular|popular-top|popular-[a-z0-9-]+|recipe-[0-9a-hjkmnp-tv-z]{26})$` (33 chars max; well inside Cloudflare's 16 KB header / 1,024-char purge limits). Look up the slug, then tag the response.
- save_ledger stays (recipe_id, saver_hash), saver_hash = HMAC(secret, userId). Popular KV items store {id, slug, title}. Saved DO lists store ULIDs.
- Kit 3.2 matchers are a single `src/params.ts` using `defineParams` from `@sveltejs/kit/params`, importing Valibot schemas from `#lib/schemas/*`. Routes `/recipes/[slug=slug]`. Brands: `RecipeSlug` (canonical `{title}-{8 lowercase Crockford}`, title part `[a-z0-9]+(?:-[a-z0-9]+)*` max 50, fallback title `recipe`, **or** a bare 8-char suffix then load 301s) and `Ulid` (`^[0-9a-hjkmnp-tv-z]{26}$`) for internal ids. Matchers run on the server **and** in the browser: never import `#lib/server/*`. Param matching neither → 404 before load (cheap, still no-store via the hook). Remove `src/id-patterns.ts`. Mirrors dollar-holler `src/params.ts` + `#lib/schemas/cursor-id.ts`.

## Consequences
- ADR 0036 amended (ULID, not UUIDv7); docs saying /recipes/[id] or recipe-[0-9a-z]{6,32} updated. Identity field is Better Auth `userId` (not `clerkUserId`).
- One extra slug->row lookup on a cache miss; a cache HIT still skips the Worker. A suffix/typo miss 301s or 404s without a cache entry.
- Keyset pagination can use id directly.
- Public URLs don't leak Generate time; the ULID still encodes time for operators and cursors.
- slug_suffix needs UNIQUE-conflict retry.
