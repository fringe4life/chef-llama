# Tests: seams, fixtures, Playwright, synthetic check

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live, and it **owns the Playwright setup**. **Decided** is settled; **Open** is not.

## Decided

### Test runner
- **Vitest for everything** (unit, integration, Miniflare / Cloudflare Workers pool). The `package.json` script is `"test": "vitest run"`. Hooks and CI call **`bun run test`**, never bare `bun test` (that starts Bun's own runner). Affected-file runs use `vitest run --changed`, not `bun test --changed`.

### Playwright
- This file owns the Playwright setup: config, target, fixtures and the CI job. Other topic files link here.
- **One target: the deployed PR preview.** Playwright runs against `https://pr-{n}.preview.chefllama.nz` after `alchemy deploy --stage pr-{n}`. That is the real Alchemy-built Worker on workerd, with Workers Cache, the `csr = false` output, the preview Custom Domain and the isolated per-PR bindings, so the cache/0-JS route contract and the cook/Durable Object flows run in one project.
  - Alchemy's `Cloudflare.Website.SvelteKit` builds the app itself at deploy time (SvelteKit's Vite pipeline plus its own wrangler-free adapter, no Wrangler file), so there is no separate "production build" to serve.
  - **Not** `alchemy dev` (the Vite dev server with HMR, so it can't prove 0 JS), **not** `vite preview` (Node, not workerd) and **not** `wrangler dev` on an adapter-cloudflare build (a different pipeline from Alchemy's).
- **CI order:** (1) unit and lint (typecheck, ESLint, Fallow, Vitest, bundlewatch) → (2) `alchemy deploy --stage pr-{n}` → (3) **one** Playwright job with `PLAYWRIGHT_BASE_URL=https://pr-{n}.preview.chefllama.nz` and the CI Access service-token headers (see [previews.md](./previews.md)).
- **Locally** (agents and humans): set `PLAYWRIGHT_BASE_URL` to the PR's preview URL and run the same config. Vitest with Miniflare stays the local in-process suite; it is not a second Playwright target. While the codebase is small, `bun run test` also runs in the Git pre-commit hook (see [lint.md](./lint.md#pre-commit-husky--lint-staged)); CI remains the gate. Playwright stays CI-only.
- **Production** is covered by the synthetic check below, not by Playwright.
- A fresh deploy starts with a cold, per-version cache, so cache-hit assertions request each route twice. The 3-preview cap can queue the e2e job.
- The route contract also asserts the Save form's `action` starts with `/saved?/remote=` (see [caching.md](./caching.md#save-on-the-cached-recipe-page-a-remote-form-that-posts-to-saved)).
- **Route contract** (`routes.manifest.ts` + Playwright):
  - Fail on a missing or stale route.
  - Fetch every route both anonymously and with a session cookie.
  - Public/static pages: no `Set-Cookie`, no `Vary: Cookie`, no `<script>` / `modulepreload` (the theme script excepted).
  - Private pages: exactly `private, no-store`.
  - Public bodies are **byte-identical** with and without a session cookie.
- Playwright never asserts on console output except through `page.on("console")` (see [lint.md](./lint.md)).
- Not `vitest-pool-workers` for these checks.

### Synthetic check
- **Synthetic check** `scripts/synthetic-check.mjs`: runs in CI in v1, post-deploy + scheduled in v1.1. The **synthetic-check cookie** (a dedicated test account's real session cookie, Infisical secret `SYNTHETIC_CHECK_COOKIE`) comes from Infisical.
- **v1.1 schedule: GitHub Actions (decided).** Run the synthetic check from **GitHub Actions** (`.github/workflows/synthetic-check.yml`), not from a Cloudflare Cron Trigger.
  - **Why GitHub Actions:**
    - It is an **outside-in** check. It hits `https://chefllama.nz` through public DNS, the Custom Domain and Workers Cache the way a visitor does.
    - It doesn't depend on the Worker it's checking. A cron inside the same Worker or account fails along with it.
    - The synthetic-check cookie stays in Infisical (CI already uses Infisical OIDC) rather than becoming a prod Worker secret.
    - Failures show up as red Actions runs with GitHub's notifications.
  - **Why not a Cron Trigger:** no strong reason for one. Its advantage is punctual timing, and this check isn't time-critical.
  - **Shape:**
    - `on: schedule` at an off-the-hour minute (e.g. `cron: "17 */6 * * *"`), plus `workflow_dispatch`.
    - It also runs as the last job of the production deploy workflow (post-deploy, which is event-driven and doesn't depend on the schedule).
    - It uses `node scripts/synthetic-check.mjs https://chefllama.nz` with `SYNTHETIC_CHECK_COOKIE` from Infisical.
  - **GitHub schedule caveats** (source: [GitHub Docs: Events that trigger workflows → `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) (fetched 16 Nov 2026; page shows no date)):
    - Runs "can be delayed during periods of high loads … High load times include the start of every hour", and "some queued jobs may be dropped".
    - Runs only from the default branch.
    - "In a public repository, scheduled workflows are automatically disabled when no repository activity has occurred in 60 days". chef-llama is public (it clones anonymously).
  - **Mitigation:**
    - Use an off-the-hour minute, and treat the schedule as best-effort. The post-deploy run is the guaranteed one.
    - Use `workflow_dispatch` for manual runs.
    - Add a monthly check that the workflow is still enabled and has a recent run, as part of the deps-ledger pass. Re-enable with `gh workflow enable synthetic-check.yml`.
- bundlewatch: public pages 0 JS, `/pantry` about 43 KB brotli.

### Seams

| Zone | Adapter / tests |
|---|---|
| Auth / session | Better Auth **`AUTH_DB`** fixtures (opaque D1 sessions). Playwright via the seeded fixture user and the preview-only OTP. Vitest against `getSession`, **never** on public cached routes. |
| Cache | `publicCache` helper + default-deny hook, checked by the Playwright route contract. |
| Route manifest | `routes.manifest.ts`: fail if a route is missing or stale. |
| Synthetic check | `scripts/synthetic-check.mjs` |
| Recipe schema | Valibot goldens: `plain` / `swap` / `kcal_over`. |
| Chips, checkout detect | Vitest in-process I/O; a failed detect creates **no** Checkout Session. |
| Queries | Miniflare D1. |
| Credit DO | Miniflare SQLite DO: hold → settle, and release on a decode failure. |
| Cook AI | A plain port around `env.AI.run` with a fixture adapter (scripted JSON, decode failure, abort). No `@effect/ai` / `LanguageModel`. |
- Schema goldens: tiny JSON, no Vitest recipe snapshots.

### Lint tests
- Each custom `chef/*` rule ships with RuleTester cases (see [lint.md](./lint.md)).

### Previews
- Preview click-through: seeded fixture user per `pr-{n}` stage; login via the test-only OTP (`APP_ENV=preview`) or a CI-minted session cookie (`context.addCookies`). `testUtils()` only in a CI/unit-test auth factory, never deployed. Screenshots at 390×844, 768×1024 and 1280×720 (see [previews.md](./previews.md)).
- CI fails if the preview-only OTP symbol appears in the production bundle.

## Open

### Other open items
- Whether the route contract should also run against production after deploy (the synthetic check already covers production).
- Keep the < 2 s suite budget (fail > 5 s) for schema goldens?
- Dummy user on previews: test OTP, minted cookie, or both.
- Lighthouse / web-perf budgets: gate or informational?
