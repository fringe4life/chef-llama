# Better Auth on D1, not Clerk

**Status:** accepted (14 Nov 2026, Coinnich). Supersedes the Clerk provider in [0005](./0005-clerk-gated-generate.md) (login-gated Generate **stays**). OTP “Delivered by Clerk” in [0013](./0013-transactional-email.md) is superseded; one Site mark stays. Ids are lowercase ULID TEXT, not UUIDv7 ([ADR 0039](./0039-ids-and-recipe-slugs.md)).

v1 auth is **Better Auth** first-party SvelteKit (`svelteKitHandler`, `sveltekitCookies` **last**) on Cloudflare Workers with the **Drizzle adapter** on **AUTH_DB**. Sessions are **opaque D1 rows**, sliding **7-day** expiry, **server-read**. Public pages ship **0 KB** auth client JS. ogygia islands may read the session with **no redirect** and no 60s token refresh. Generate stays signed-in only.

Proven on this stack in [fringe4life/dollar-holler](https://github.com/fringe4life/dollar-holler). Worker cost ~**140–170 KiB gzip** (dollar-holler + a scratch build) — well under CF **64 MiB**; watch **1s** isolate startup. `nodejs_compat` (or `nodejs_als`) required.

## Why not the others

| Option | Why not |
|---|---|
| **Clerk** (`@clerk/backend`, `svelte-clerk`, hosted Account Portal) | Per-user fees at scale (~**US$1,025/mo at 100k MRU**). `__session` JWT ~**60s**, refreshed by client SDK — fights ogygia server islands and `csr=false` public pages. `svelte-clerk` 1.2.0 peers Kit **2** only. |
| **WorkOS AuthKit** | Per-user pricing; extra vendor; not on this Workers + D1 path. |
| **DIY Oslo + arctic** | We would own sessions, CSRF, OAuth, OTP, deletion. Better Auth already does that on D1 here. |
| Lucia | Deprecated. |
| OpenAuth | Self-hosted IdP, not the app session SDK. |
| Auth.js / `@auth/sveltekit` | Next-first; skip as first choice. |

**Costs we accept:** we send OTP mail ourselves; we keep up with Better Auth security updates.

## v1 sign-in methods

**Google, Apple, email OTP, Facebook.** Passkeys later as **“add a passkey”** after first sign-in — not a v1 button on `/sign-in`.

- **Apple:** paid Apple Developer **US$99/yr**. Client secret regenerate at least every **6 months**. Email only on **first** sign-in. Register the sending domain with Apple **private email relay**.
- **Facebook:** `email` + `public_profile` need no app review, but the app must be **Live** (privacy policy URL + **data-deletion URL**). Meta may require **business verification**.
- **Email OTP sender: TODO** — Cloudflare Email Service vs Resend. From **must** be a project domain we own (`gmail.com` cannot be verified sending). Plan: `no-reply@mail.<domain>`, Reply-To `chefllamanz@gmail.com` as project contact; **domain not chosen yet**.

Official OAuth marks only ([ADR 0026](./0026-no-icon-libraries.md)).

## Last-used badge

Better Auth **`lastLoginMethod`** plugin, **cookie-only** (no DB column). Plugin **before** `sveltekitCookies()` (which stays last). Cookie set **only** on successful sign-in from `/api/auth/*`. `/sign-in` reads it on the **server**. **`getSession` must never run on public cached routes** — it can set cookies.

## Two D1s

| Binding | Owns | Migrations |
|---|---|---|
| **AUTH_DB** | Better Auth `user` / `session` / `account` / `verification`. Ids are **lowercase ULID TEXT** via `advanced.database.generateId: () => newId()` ([ADR 0039](./0039-ids-and-recipe-slugs.md); Better Auth 1.7.x passes `{model,size}`; applies to all adapter-created core and plugin tables). `session.token` stays Better Auth’s default random string. `user.id` is the only identity source. | Own drizzle-kit config + folder. CLI → Drizzle. |
| **RECIPES_DB** | Public-by-URL recipes and related Site rows. **Read replicas here only.** | Own drizzle-kit config + folder. |

No cross-DB FKs. Credit / Diet / Saved DOs `getByName(userId)`. **Nothing** written to `RECIPES_DB` at sign-up. Diet/Saved still left global D1 for per-user DOs ([ADR 0030](./0030-per-user-credit-dos.md)); **AUTH_DB is extra**. Recipes stay on `RECIPES_DB` (the old “one Site D1”).

**Deploy:** Time Travel bookmark **each** DB → migrate both → deploy Workers. **Backups:** Time Travel **30 days** + weekly `AUTH_DB` export to R2. Weekly cron cleans orphaned rows.

## Account deletion

Deletion **deletes** that Cook’s recipes (**not** anonymise). Better Auth `beforeDelete` queues a job: drop recipes + saves from `RECIPES_DB`; remove from Vectorize / Popular snapshot / sitemap; purge cached recipe pages (`recipe-{ulid}` tags) on the Site Worker; wipe per-user Durable Objects. Deleted `/recipes/[slug]` returns **410**. Other Cooks’ saves of those recipes disappear too.

**TODO:** payment-record retention (undecided).

## Where auth runs

`(app)` signed-in group (`/pantry` `/saved` `/account`…), `/sign-in`, `/api/auth/*`, remote functions that need a Cook, ogygia `/__ogygia__`. **Never** on cached public pages (`/` `/terms` `/privacy` `/recipes/[slug]`). Public GET **must not** `Set-Cookie`. `/recipes/[slug]` is **not** under the `(app)` auth layout — optional Save is an island that reads session with no redirect.

Schema (AUTH_DB, Drizzle; dollar-holler-shaped):

```ts
user: id (lowercase ULID TEXT PK via generateId → newId()), name, email unique, emailVerified, image, createdAt, updatedAt
session: id (lowercase ULID TEXT PK), token unique (Better Auth default random string), userId → user, expiresAt, ipAddress, userAgent, createdAt, updatedAt
account: id (lowercase ULID TEXT PK), userId → user, providerId, accountId, tokens…, password?, createdAt, updatedAt
verification: id (lowercase ULID TEXT PK), identifier, value, expiresAt, createdAt, updatedAt
```
