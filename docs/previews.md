# Branch previews

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided
- Mechanism: **Alchemy per-PR stages** `pr-{n}`, each with an isolated copy of every resource: Worker, both D1s, DO namespaces including the pool DO, and KV. Production bindings are never attached.
- **Not Version URLs**: they don't isolate data, and they are not generated for Workers that implement a DO. Workers Previews are not the primary path either.
- Gate: early CI (typecheck incl. `svelte-check --tsgo`, lint, tests, build, bundlewatch) must pass before a preview deploys.
- Hostname: a Workers **Custom Domain** `pr-{n}.preview.chefllama.nz`, with one Access app on `*.preview.chefllama.nz`. Production and preview `workers.dev` stay off. Never `*.workers.dev`. No ACM purchase. Confirm the exact registered domain spelling in the Cloudflare dashboard before wiring anything (see [ops.md](./ops.md#open)).
- Agents use one Access **service token per consumer class** (CI, Critiquito, Grok bots), Service Auth on preview hosts only, valid **8760 h**. The Expiring Access Service Token notification goes to chefllamanz@gmail.com.
- **At most 3 concurrent live previews.** A 4th is queued, not skipped or evicted. A synchronize on a PR that already holds a slot redeploys in place and does not take a second slot.
- PR close (main cleanup): safety check `STAGE != prod`, then `alchemy destroy --stage pr-{n}`, then delete `pr-{n}/` media (frees a queue slot). Safety net: a fortnightly sweep (cron `0 16 1,15 * *` + `workflow_dispatch`), with failures deduped into one issue labelled `preview-sweep-failure` (needs `issues: write`).
- Media go to a private R2 bucket on a separate account with a bucket-scoped token. Presigned GET links (TTL **7 days**, the R2 maximum) and the gated preview URL go in **one sticky PR comment**, updated in place on each run (re-run refreshes expired links). R2 lifecycle backstop: **30 days** after object creation.

### Not adding
- Previews get torn down more often than the fortnightly sweep because of the **3-slot cap**, not cost (cost is negligible). The 7-day idle check is optional. **Do not add a `preview:live` label or an idle check yet.**


## Open

### Proposed (not yet ruled on)
- `APP_ENV = dev | preview | prod` via SvelteKit 3 `defineEnvVars` (`$app/env/private`), set at **build** time. Do not overload `NODE_ENV`. `$env/*` and `$app/environment` are deprecated in Kit 3. Bindings come only from `platform.env`.
- Better Auth on previews:
  - `allowedHosts` includes `*.preview.chefllama.nz` only when `APP_ENV=preview`. Production `allowedHosts` is `chefllama.nz` only.
  - Cookies are host-only; never `crossSubDomainCookies` on `chefllama.nz` or `preview.chefllama.nz`.
  - A seeded fixture user is reused per stage.
  - The test-only OTP is guarded three ways: build-time `APP_ENV` guard + preview-only secret + fixed OTP only for the fixture. CI fails if the symbol appears in the prod bundle.
  - `testUtils()` is never in a deployed Worker.
  - OAuth is **off** on previews unless a PR uses separate OAuth test apps.
- Scope classification: `classify-preview-scope.mjs` path heuristic, overridable by labels `preview:ui` / `preview:backend` / `preview:both` / `preview:skip`.
- Media: screenshots at 390×844, 768×1024 and 1280×720, plus one short primary-flow clip when interaction matters.
- `Cloudflare.state()` as the CI state store. Workers Builds unused. (Alchemy is pinned to an exact version picked when coding starts, like every dependency; see [ci.md](./ci.md#dependencies).)

### Other open items
- Human IdP Allow policy on the Access app, or agents-only?
- Rotation owner for the Infisical-held preview secrets and service tokens, and how bots get them. Access modelled in the dashboard vs Alchemy. Inactive-token cleanup.
- Dummy user: seed per stage and log in via the test OTP, or a CI-minted cookie. Confirm OAuth stays off.
- 7-day idle teardown (parked, see above).
- Viewport matrix and duration caps 20 s / 45 s / 120 s. Classifier rules. State store. Queue timeout.
- Lighthouse budgets: gate or inform? Video bucket account and jurisdiction. WebSocket DOs → hostname-level Access.
- Access (Zero Trust) and the Custom Domains go on Coinnich's main Cloudflare account, after the dashboard spelling check.
