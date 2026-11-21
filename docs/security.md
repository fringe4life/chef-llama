# Security: rate limiting, WAF, zone hardening, secrets, supply chain

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Numbers marked "unverified" are starting points, not load-tested.

## Decided

### Baseline
- Bot Fight Mode **off** (Free plan). It cannot be skipped for the Stripe webhook.
- Login gate: Generate requires a session; no anonymous inference (see [auth.md](./auth.md)).
- Daily free-cook claims are exact on the **pool DO**. A failed free-cook lookup must not authorize a cook. Reset at 00:00 UTC.
- Public pages never import auth and never send `Set-Cookie` / `Vary: Cookie` (see [caching.md](./caching.md)).
- CI without secrets: lint, Fallow and typecheck jobs get no secrets. Actions are SHA-pinned (`actions.lock`), checked by zizmor + actionlint, with least-privilege `permissions` (see [ci.md](./ci.md)).
- Saver identity in the save ledger: `HMAC(secret, userId)`.
- The repo is public now and goes private when coding starts.

### Rate limiting
Better Auth's built-in limiter is **off**: `rateLimit: { enabled: false }`. In Better Auth 1.7.25 it defaults to **on in production** (`options.rateLimit?.enabled ?? isProduction`), so this must be set explicitly. All limiting comes from these Cloudflare layers instead:

1. **Workers Rate Limiting binding** (approximate bursts). Period is 10 or 60 s only; counts are per Cloudflare location and eventually consistent, so a client can get roughly N × locations before counts converge. Keys are `HMAC-SHA256(RATE_LIMIT_IP_KEY, ip)`, `HMAC(email)` or `userId`. Never persist raw IPs in limit stores. Do **not** implement Better Auth `customStorage.consume` on the binding (it cannot meet the atomic worldwide contract).
2. **WAF: 5 custom rules (W1–W5) + 1 rate-limit rule (R1), Free plan.** Custom rules see cached hits, so every expression is path- and method-scoped. Free rate-limit expressions may use only Path and Verified Bot (not Method).

   | # | Kind | Expression (draft) | Action |
   |---|---|---|---|
   | W1 | Custom, **first** | `POST` + Stripe webhook path + `ip.src` in Stripe's published webhook IPs | **Skip** remaining custom rules, **all rate-limiting rules**, and the products Browser Integrity Check and Security Level |
   | W2 | Custom | Method not `GET`/`HEAD`/`OPTIONS` on `/`, `/popular`, `/popular/*`, `/recipes/*`, `/about`, `/pricing`, `/how-to`, `/terms`, `/privacy`. `/recipes/*` is **GET-only** now that Save posts to `/saved` (see [caching.md](./caching.md#save-on-the-cached-recipe-page-a-remote-form-that-posts-to-saved)). **Or** any method on `/__internal/*`: the cache-purge route is reached only over a service binding (account deletion; a ranking cron only if/when v2 Popular ingredients ships), which never passes through the zone, so every public request to it is blocked (see [caching.md](./caching.md#cache-purge-route)) | **Block** |
   | W3 | Custom | `POST` to the Generate form-action path with a missing or wrong `Origin` (allowed: `https://chefllama.nz` and `https://pr-*.preview.chefllama.nz`), or a `Content-Type` that is not `application/x-www-form-urlencoded` / `multipart/form-data`. Also `POST` to `/saved` or `/_app/remote/*` with a missing or wrong `Origin` (Origin only: enhanced remote calls use SvelteKit's own binary content type) | **Block** |
   | W4 | Custom | `/api/auth*` or `/sign-in*` and `ip.src.asnum` in a hand-maintained hosting/VPN ASN list (never broad cloud ASNs such as AWS 16509, GCP, Azure) | **Managed Challenge** |
   | W5 | Custom | Spare. Production `workers.dev` is disabled in Alchemy, so W5 stays unused | — |
   | R1 | Rate-limit | Path starts with `/api/auth`; characteristic IP; period 10 s; mitigation 10 s; **20 requests / 10 s / IP** (unverified) | **Block** |

   Do not key W1 on User-Agent (there is no official Stripe webhook UA). Free custom rules cannot use bot score; `cf.threat_score` is always 0, so never write rules on it.
3. **Durable Objects for exact worldwide counts.** The pool DO is the atomic claim for daily free Generate. A per-key **OTP-send DO** (one persisted object per `HMAC(email)`) gives an exact worldwide send cap; the binding stays in front as the 3 / 60 s burst layer. Counters are persisted in DO storage (in-memory buckets fail open on eviction).

- `emailOTP.allowedAttempts` stays at **3**. It is a separate per-code counter and still applies with the limiter off.
- Replacements for the lost Better Auth defaults:

  | Lost default | Replacement | Key | Number |
  |---|---|---|---|
  | 100 / 10 s on any `/api/auth/*` request | Binding + WAF R1 | HMAC(IP) | binding 30 / 10 s (unverified) |
  | Sign-in, sign-up, change-password, change-email: 3 / 10 s | Binding + R1 | HMAC(IP); change-* also `userId` | 3 / 10 s |
  | Email-send paths (OTP send, password reset, verification): 3 / 60 s | Binding on both keys + OTP-send DO | HMAC(IP) and HMAC(email) | 3 / 60 s per key; exact cap in the DO |
  | OTP verify / check / sign-in-email-otp: 3 / 60 s | Binding + `allowedAttempts` | HMAC(IP) and HMAC(email) | 3 / 60 s; 3 tries per code |
  | OAuth callbacks (only had the 100 / 10 s default) | Binding | HMAC(IP) | 20 / 10 s (unverified) |

- Route map (bursts unverified):

  | Route | Layer | Key | Starting point |
  |---|---|---|---|
  | Cache hits on `/`, `/popular(/[type])`, `/recipes/[slug]` | No Worker runs, so only WAF W2 | — | none |
  | `/`, `/popular(/[type])` miss | Binding | HMAC(IP) | 60 / 10 s |
  | `/recipes/[slug]` miss, 301, 404 | Binding | HMAC(IP) | 30 / 10 s |
  | `/pantry` GET | Binding | `userId` | 30 / 10 s |
  | Generate POST, free | Pool DO + binding + WAF W3 | `userId`; HMAC(IP) for burst | 3 / day signed-in; burst 5 / 10 s |
  | Generate POST, paid (Credits) | Binding + Credit DO hold; no daily cap | `userId` | 10 / 10 s |
  | Save / unsave (`POST /saved?/remote=…` without JS, `/_app/remote/…` with JS; the limit runs inside the remote function) | Binding + WAF W3 (Origin) | `userId` | 20 / 10 s |
  | Checkout session create (Jobs Worker) | Binding + Credit DO starter flag | `userId` | 5 / 60 s |
  | Account deletion | Binding | `userId` | 3 / 60 s |
  | Stripe webhook | **No IP rate limit** (retries would fail). Signature verify, idempotent on `event.id`, WAF W1 | — | — |

- **Fail closed** (429 or 503, no-store) for Generate claims, `/api/auth/*`, checkout and account deletion when the binding or a DO is unavailable. Treat a thrown `limit()` as unavailable.
- 429 responses carry `Retry-After` and `Cache-Control: private, no-store`. Never `publicCache` a 429/401/403.
- Workers Cache hits do not run the Worker, so the binding and DOs never see them (they are still billed as requests).

### Stripe webhook delivery
- Served on a proxied **Custom Domain in this zone** over `https://`, never `workers.dev` (Browser Integrity Check always runs there and cannot be skipped).
- Stripe retries live deliveries for up to three days and treats 3xx as failure. Signature verification stays mandatory in the Worker; the WAF IP list is an extra gate. Re-check https://docs.stripe.com/ips at implementation and subscribe to Stripe's API announce list (seven days' notice of IP changes).
- Never attach the binding to the webhook route. Leave Bot Fight Mode and Under Attack Mode off.

### Zone hardening (Free plan)
- Production on a proxied **Custom Domain `chefllama.nz`** (zone on Coinnich's main Cloudflare account); production `workers_dev = false`.
- DNSSEC on (DS record at the registrar unless Cloudflare Registrar). Optional CAA records.
- Always Use HTTPS on. HSTS only after HTTPS is proven, short max-age first, no `includeSubDomains`/preload until every subdomain is HTTPS. Minimum TLS 1.2.
- Browser Integrity Check on for the zone (W1 skips it for the webhook). Under Attack Mode off except as a last-resort incident toggle.
- SPF, DKIM and DMARC on the OTP From domain. Never a null MX on a domain used as From. Never flatten or proxy DKIM CNAMEs.
- Zone Cache Rules and Smart Tiered Cache do not apply to Workers Cache; cacheability stays in the Worker.
- Turnstile pre-clearance is optional and never replaces siteverify.
- Rejected: Better Auth `storage: "memory"` / `"database"` / KV / Redis, Better Auth `customStorage` on the binding or a DO, a Pro zone (US$25/mo), an account-wide IP Access Allow for Stripe.

### Session IP is hashed
- `session.ipAddress` stores `HMAC-SHA256(key, ip)`, never the raw IP. Keep `advanced.ipAddress.ipAddressHeaders: ["cf-connecting-ip"]` so Better Auth reads the client IP, and replace it with the HMAC in a `databaseHooks.session.create.before` hook before the row is written.

### Secrets and environment variables
- **Infisical** holds every value (production, preview, local). CI deploy jobs use Infisical OIDC (`id-token: write`). Alchemy passes secrets to the Worker as `Config.Redacted`. Never D1 plaintext for BYO keys (v2, `BYO_WRAP_KEY`).
- **Varlock** sits alongside Infisical as the schema, loader and validator (decided). How it fits next to SvelteKit 3's `defineEnvVars` is a recommendation, below under Open.

### Lint-enforced security
- `chef/no-raw-fetch`: global `fetch` is banned; use SvelteKit's `fetch` (exceptions in [lint.md](./lint.md)).
- `flag-hazardous-files.yml`: on `pull_request`, labels PRs that touch `*.hazardous.*` and writes a sticky comment (`contents: read`, `pull-requests: write`, `issues: write`). Fork and Dependabot PRs get a read-only token, so they only get the job summary. No `pull_request_target`. Set `permissions: {}` at the workflow level and grant per job (the example currently grants at the workflow level; align it when adopted).

## Open

### Varlock alongside SvelteKit 3 `defineEnvVars`: recommendation
Sources (fetched 16 Nov 2026): https://varlock.dev/integrations/sveltekit/, https://varlock.dev/plugins/infisical/, https://svelte.dev/docs/kit/environment-variables.

What the sources say:
- SvelteKit 3 declares variables once in `src/env.ts` with `defineEnvVars` (Valibot `schema`, `public`, `static`), and code imports them from `$app/env/private` / `$app/env/public`. `$env/*` and `$app/environment` are deprecated and removed in Kit 4.
- Varlock declares variables once in a committed `.env.schema` (types, `@sensitive`, `@required`). `@varlock/infisical-plugin` resolves values with `infisical()` / `infisicalBulk()` and supports OIDC in GitHub Actions (`identityId`, token auto-detected).
- Varlock's SvelteKit integration (`varlockVitePlugin()` before `sveltekit()`) replaces the four `$env/*` modules with one `ENV` object from `varlock/env`. The page does not mention `defineEnvVars` or `$app/env/*`. On Cloudflare it injects a runtime loader and deploys with `varlock-wrangler deploy`; we deploy with Alchemy, not wrangler.

Recommendation:
1. Infisical stores values. Varlock's `.env.schema` is the single list of names, types and sensitivity, and loads values from Infisical through the plugin: `varlock run -- <command>` locally and in CI, failing fast on a missing or invalid value and redacting `@sensitive` values from output.
2. Alchemy reads the loaded process env in `alchemy.run.ts` and binds values to the Worker (secrets as `Config.Redacted`).
3. App code reads env **only** through Kit 3: `src/env.ts` with `defineEnvVars` and imports from `$app/env/private|public`. Do **not** use `varlock/env`'s `ENV` or `varlockVitePlugin()` in v1, because that path targets the deprecated `$env/*` modules and a wrangler deploy.
4. Add a small CI check that the names in `.env.schema` and `src/env.ts` match, so the double declaration cannot drift.

Still uncertain:
- Whether `varlockVitePlugin()` and its Cloudflare runtime loader work with Alchemy's `Cloudflare.Website.SvelteKit` (if so, the double declaration could go).
- Whether Varlock will support `$app/env/*` before Kit 4 removes `$env/*`.
- How per-PR preview values flow (Infisical environment per preview vs one shared `preview` environment).
- Rotation owner, and how bots get Infisical-managed values.

### Other open items
- Guest Generate: (a) 1 per day with a signed cookie + Turnstile and no Guest DO, or (c) keep the login gate. The gate stays until this is picked. If (a): hashed IP is burst-only, Save stays login-walled; guest contribution to **v2** Popular ingredient counts is Open in [v2.md](./v2.md).
- Unverified burst numbers (binding 30 / 10 s, R1 20 / 10 s): accept, tighten or defer until traffic exists.
- Public cache-miss GETs: fail open when the binding is down?
- Generate form-action path (likely under `/pantry`) and the Stripe webhook path.
- Session IP HMAC key: reuse `RATE_LIMIT_IP_KEY` or a separate key.
- First hosting/VPN ASN list for W4.
- Before any WAF rule, Custom Domain, DNSSEC or SPF/DKIM/DMARC work: confirm the exact registered spelling in the Cloudflare dashboard (see [ops.md](./ops.md#open)).
- Branch protection rules.
