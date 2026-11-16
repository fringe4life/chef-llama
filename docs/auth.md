# Auth: Better Auth, sign-in, sessions, guest Generate

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### Provider
- **Better Auth 1.7.x** first-party SvelteKit integration: `svelteKitHandler` in hooks, `sveltekitCookies(getRequestEvent)` **last** in `plugins`, Drizzle adapter on **`AUTH_DB`** (D1), `nodejs_compat`.
- Opaque D1 sessions, sliding 7 days, read on the server. Custom `/sign-in` page.
- **Not Clerk** (fees + 60 s JWT). Not WorkOS AuthKit, not DIY Oslo + arctic, not OpenAuth as the session SDK.
- Stay on 1.7.x (1.7.25 is the latest; 1.8 is beta), previews included.
- Better Auth's **built-in rate limiter is disabled** (`rateLimit: { enabled: false }`); limiting comes from the Cloudflare rules in [security.md](./security.md#rate-limiting). `emailOTP.allowedAttempts` stays at 3.

### Methods
- v1: **Google** and **email OTP** only. A last-used-method cookie on `/sign-in`.
- **Apple is out.** Sign in with Apple needs the paid Apple Developer Program (US$99/year, https://developer.apple.com/programs/enroll/).
- **Facebook is out for now** (see Open).
- OAuth marks: official brand kits only (Google), no icon libraries.

### Gate
- A signed-in session is **required to Generate**. Public pages never import auth. The header has a plain Sign in link.

### Post-login redirect (`redirectTo`)
- **One search param, `redirectTo`, everywhere a login is required:** `(app)` route guards in `hooks.server.ts`, the Save remote form (see [caching.md](./caching.md#save-on-the-cached-recipe-page-a-remote-form-that-posts-to-saved)), the Generate gate, topup and `/account`. No `next`, `returnTo` or `callbackUrl` aliases.
- **Helpers in `src/lib/auth/redirect.ts`** (sketch below; works on both server and client, no `#lib/server` import):
  - `safeRedirectPath(input, origin)` returns a same-origin relative path (`pathname + search + hash`) or the fallback `/pantry`. It rejects: non-strings, empty, over 512 chars; anything not starting with a single `/`; `//`; backslashes and control characters (raw or after one decode); encoded `/`, `\` and `%` (`%2f`, `%5c`, `%25`, which catches double encoding); malformed `%` sequences; anything `new URL(input, origin)` resolves to another origin; and loops or internal paths (`/sign-in`, `/api/auth/*`, `/_app/*`). Absolute URLs and schemes (`https:`, `javascript:`) fail the leading-`/` rule.
  - `signInUrl(redirectTo, origin)` builds `/sign-in?redirectTo=<encoded safe path>`. It is the only way code builds a sign-in link.
  - `redirectFromRequest(field, request, origin)` captures where the user came from: the hidden `redirectTo` form field first, then a same-origin `Referer` (path and query only), else the fallback. Both go through `safeRedirectPath`.
- **`/sign-in` reads `redirectTo` once, through `safeRedirectPath`, and feeds Better Auth:**
  - Google: `signIn.social({ provider: 'google', callbackURL: safe, newUserCallbackURL: safe, errorCallbackURL: '/sign-in?error=oauth&redirectTo=' + encodeURIComponent(safe) })`. The new-user path is the same, because the first-run Diet dialog appears at Generate, not on a separate welcome page.
  - Email OTP: Better Auth's email-OTP sign-in takes no `callbackURL` (none in its docs), so the `/sign-in` OTP form action verifies the code and then does `redirect(303, safe)` itself.
- **Better Auth's own check is the second layer.** Requests through `auth.handler` validate `callbackURL`, `errorCallbackURL`, `newUserCallbackURL` and `redirectTo` against `trustedOrigins`. Relative URLs must begin with a single `/`, and it rejects `//`, backslashes, control characters and encoded path separators. Each stage sets `baseURL` to its own origin and `trustedOrigins` to **that origin only** (`https://chefllama.nz` in production, `https://pr-{n}.preview.chefllama.nz` on a preview). No wildcard entry, no localhost in production, and never `advanced.disableOriginCheck` (it disables both URL validation and CSRF protection).
- **Direct `auth.api.*` calls skip those checks** (Better Auth security reference), so server code that calls `auth.api` (the Save remote function, the OTP form action) must use our helper for any URL and rely on SvelteKit's form Origin check for CSRF.
- Sources (read 16 Nov 2026 NZDT): Better Auth `basic-usage` and `reference/security` docs (1.7.25), https://www.better-auth.com/docs/reference/security.

```ts
// src/lib/auth/redirect.ts — shared by every login-required path (sketch)
export const REDIRECT_PARAM = 'redirectTo';
const FALLBACK = '/pantry';
const MAX_LEN = 512;
const BLOCKED_PREFIXES = ['/sign-in', '/api/auth', '/_app/']; // no loops, no auth or internal endpoints

/** Returns a same-origin relative path ("/x?y#z") or the fallback. Never throws. */
export function safeRedirectPath(input: unknown, origin: string, fallback = FALLBACK): string {
	if (typeof input !== 'string' || input.length === 0 || input.length > MAX_LEN) return fallback;
	if (!input.startsWith('/') || input.startsWith('//')) return fallback; // relative only, no protocol-relative
	if (/[\\\u0000-\u001f\u007f]/.test(input)) return fallback; // backslashes, control chars
	let decoded: string;
	try {
		decoded = decodeURIComponent(input);
	} catch {
		return fallback; // malformed %-encoding
	}
	// encoded tricks: %2f%2f, %5c, %0a, a second layer of encoding (%252f)
	if (decoded.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decoded) || /%(2f|5c|25)/i.test(input)) return fallback;
	let url: URL;
	try {
		url = new URL(input, origin);
	} catch {
		return fallback;
	}
	if (url.origin !== origin) return fallback; // belt: parser disagreement
	const path = url.pathname + url.search + url.hash;
	if (BLOCKED_PREFIXES.some((p) => url.pathname === p || url.pathname.startsWith(p.endsWith('/') ? p : p + '/'))) return fallback;
	return path;
}

/** Builds the one sign-in URL used everywhere a login is required. */
export function signInUrl(redirectTo: string, origin: string): string {
	const safe = safeRedirectPath(redirectTo, origin);
	return `/sign-in?${new URLSearchParams({ [REDIRECT_PARAM]: safe })}`;
}

/** Where the user came from: the hidden field first, then a same-origin Referer. */
export function redirectFromRequest(field: unknown, request: Request, origin: string): string {
	if (typeof field === 'string' && field) return safeRedirectPath(field, origin);
	const referer = request.headers.get('referer');
	if (referer) {
		try {
			const r = new URL(referer);
			if (r.origin === origin) return safeRedirectPath(r.pathname + r.search, origin);
		} catch {}
	}
	return FALLBACK;
}
```

### IDs and schema
- `user.id` is the only identity: a lowercase ULID via `generateId` (see [data.md](./data.md#ids-accepted-15-nov-2026)). `AUTH_DB` holds only `user`/`session`/`account`/`verification`. The Better Auth CLI generates the Drizzle schema.
- `session.ipAddress` is stored as an HMAC, never the raw IP (see [security.md](./security.md#session-ip-is-hashed)).

### Account deletion
- Deletes the Cook's recipes (does not anonymise them). `beforeDelete` queues a cleanup job. Old URLs return 410.

### Mail
- OTP, Stripe receipts and product mail share one brand mark. From `no-reply@mail.chefllama.nz`.
- **Reply-To and support: the existing Gmail address `chefllamanz@gmail.com` only, for now.** No `cook@` address and no Email Routing inbox in v1.
- Stripe sends its own automatic receipts and refunds from the Stripe Dashboard.

### Previews
- Preview stages use a seeded fixture user and a guarded test-only OTP, with OAuth off. Details in [previews.md](./previews.md).

## Open
- **Facebook Login (later or v2).** Out of v1 with Apple. If it comes back: creating a Meta app, Facebook Login, App Review and Business Verification showed no fee in Meta's developer docs, but **Business Verification is required for Advanced Access** (https://developers.facebook.com/docs/permissions/, updated 19 Oct 2026) and needs a registered business with an official phone number or address. Until then, only app admins and testers could sign in with it.
- Guest Generate: (a) a capped guest Generate (1, then a sign-in wall), Turnstile on Generate, no Guest DO (cookie + Turnstile + pool DO), an ephemeral Diet in `sessionStorage`, guest recipes never on Popular; or (c) keep sign-in required (the current gate). Never (b) one per device or IP. Rate-limit implications are in [security.md](./security.md#other-open-items).
- OTP mail sender: Cloudflare Email Service or Resend. SPF/DKIM/DMARC on `mail.chefllama.nz`.
- Account page scope. Proposal: a session-gated `/account` under `(app)` (`private, no-store`, noindex, robots Disallow) reading the Credit DO: remaining balance, spent (debit rows, linking to `/recipes/{slug}` when the job is a recipe) and packs bought (credit rows keyed by the Checkout `event.id`), with the usage chart on this page (see [product.md](./product.md)). The header popover keeps theme, balance and sign out. Not v1: Stripe Customer Portal, chart libraries, `/topup`.
