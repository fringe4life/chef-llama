# 0039 — IDs and recipe slugs

**Status:** accepted (15 Nov 2026, Coinnich), pending docs merge. The suffix-tolerant redirect is proposed, pending Coinnich.

## Context
SQLite (D1 and Durable Object SQLite) has no UUID column type. Better Auth's default generateId is a random 32-char base62 string, not cursor-sortable; generateId: "uuid" is UUIDv4. An earlier draft used UUIDv7 for user.id. Coinnich decided internal ids are ULID everywhere and public recipe URLs are slugs, not ids. Public /recipes/… pages are edge-cached (ADR 0037); Workers Cache keys on path and purges by tag, so purge must address a page independent of its slug.

## Decision
- All internal primary keys are ULID, TEXT, lowercase Crockford (`[0-9a-hjkmnp-tv-z]{26}`), including Better Auth user, session, account, verification via `advanced.database.generateId: () => newId()`. Session tokens stay Better Auth's default random string.
- `newId()` (src/lib/id.ts) wraps `ulid@3` `monotonicFactory()` (Web Crypto getRandomValues; ~1 KB brotli), always lowercased. Drizzle: `text("id").primaryKey().$defaultFn(() => newId())`. Monotonic per isolate only; production Date.now() does not advance between I/O, so the monotonic factory is required.
- Public recipe URLs: /recipes/[slug], slug = `{title-slug}-{8-char lowercase Crockford suffix}`; title part = NFKD, ASCII-fold, lowercase, non-alphanumerics to single hyphens, trimmed, max 50 chars; fallback `recipe-{suffix}` when empty. UNIQUE(slug) and UNIQUE(slug_suffix); on conflict retry the suffix only, never the ULID. Minted at creation; immutable in v1.
- Proposed (pending Coinnich): suffix-only or wrong title-part URLs 301 to the canonical slug with `private, no-store`; lookup by slug_suffix. Alternative: exact slug only, else 404.
- Unknown slug -> 404 no-store. Deleted -> 410 no-store.
- Cache tags use the internal id: `recipe-{ulid}`. Tag grammar: `^(popular|popular-top|popular-[a-z0-9-]+|recipe-[0-9a-hjkmnp-tv-z]{26})$` (33 chars max; well inside Cloudflare's 16 KB header / 1,024-char purge limits). Look up the slug, then tag the response.
- save_ledger stays (recipe_id, saver_hash), saver_hash = HMAC(secret, userId). Popular KV items store {id, slug, title}. Saved DO lists store ULIDs.
- Kit 3 param matchers in src/params.ts may import only dependency-free src/id-patterns.ts (no #lib).

## Consequences
- ADR 0036 amended (ULID, not UUIDv7); docs saying /recipes/[id] or recipe-[0-9a-z]{6,32} updated.
- One extra slug->row lookup on a cache miss; a cache HIT still skips the Worker.
- Keyset pagination can use id directly.
- Public URLs don't leak Generate time; the ULID still encodes time for operators and cursors.
- slug_suffix needs UNIQUE-conflict retry.
