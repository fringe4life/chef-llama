# CI without secrets; Better Auth on CF preview; Dependabot; husky; Cursor hooks; cheap locked Actions

**Status:** recommended (round 15); **Actions cost + lockfile extended round 31**. **Type-check settled** (#79 round 38). Overall acceptance otherwise unchanged. **Branch protection (D10) still undecided** — do not treat required checks as locked.

## CI jobs

| Job | Secrets |
|---|---|
| ESLint + Fallow + `svelte-check --tsgo` | **none** (`contents: read`) |
| **bundlewatch** on built client JS/CSS | **none** |
| `bun audit --audit-level=high` + [OSV-Scanner](https://google.github.io/osv-scanner/) `--lockfile bun.lock` | **none** |
| Preview deploy | Infisical **OIDC** (`id-token: write`) → Better Auth secret + OAuth test apps |
| Production deploy | Infisical OIDC → production keys; protected environment |

Do not inject Infisical into lint. [Infisical GHA](https://infisical.com/docs/integrations/cicd/githubactions) only affects later steps **in that job**.

### Type-check (settled #79 round 38)

From first coding commit:

- Kit app: `svelte-kit sync && svelte-check --tsgo --tsconfig ./tsconfig.json --output machine`
- **TS ~6** for Kit compile (`typescript@~6`)
- `--tsgo` so svelte-check can talk to TS 7 native; **not** `--tsgo-experimental-api`
- **Skip `svelte-check-native`** as the PR brake
- **No Turbo v1** — one Kit app `check` script, not `turbo run check`

### bundlewatch (PR check)

After the production client build, [bundlewatch](https://bundlewatch.io/) compares hashed JS/CSS against budgets. Complements the 0-JS public-page guardrails ([caching.md](../caching.md) · [ADR 0037](./0037-zero-js-public-cache-guardrails.md)).

| Surface | JS budget |
|---|---|
| `/` (index) and `(static)` / public `(site)` pages | **0 JS** |
| `/pantry` | **~43 KB** brotli Kit JS |
| CSS | **TBD by measurement** — do not invent a number |

## Better Auth on Cloudflare preview

CF `workers.dev` / [Preview URLs](https://developers.cloudflare.com/workers/previews/) are a **host preview domain**. Rec: preview `BETTER_AUTH_SECRET` + OAuth **test** apps; Better Auth `allowedHosts` includes `*.workers.dev`. Production OAuth clients only on the **production root**. Optional Cloudflare Access. `workers.dev` previews already send `X-Robots-Tag: noindex`.

## Dependabot (not Renovate v1)

GitHub-native. `package-ecosystem: bun` (GA; `bun.lock`) + `github-actions`, weekly. ([ecosystems](https://docs.github.com/en/code-security/reference/supply-chain-security/supported-ecosystems-and-repositories).) Pair with `bun audit`/OSV — Dependabot bun **security** updates were still “future” on the Feb 2025 changelog. Renovate if grouping/dashboard is needed later ([comparison](https://docs.renovatebot.com/bot-comparison/)). Keep Dependabot **`cooldown`** (github.com default **3 days** on version updates) so lockfile bumps wait out short-lived malicious releases.

## husky + lint-staged

`pre-commit`: `bunx lint-staged` → `eslint --fix` on staged `*.{ts,js,svelte}`. `pre-push`: `bun audit --audit-level=high`. No Infisical, no full Fallow, no full tests on commit.

## Cursor hooks

Project `.cursor/hooks.json` ([docs](https://cursor.com/docs/hooks)). **Not** 3dmodels Ultracite. Larder is ESLint + Fallow:

- `afterFileEdit`: `.cursor/hooks/eslint-fix.sh` (stdin `file_path`; `--fix` ts/js/svelte only)
- `stop`: `npx fallow audit --quiet`

Keep `afterFileEdit` fast. Tests stay in CI.

## Cheap cache (round 31)

While the repo is **public**, standard GitHub-hosted runners are **free**. Private repos draw included compute (**$12** Free / **$18** Pro/Team per month) then **$0.006**/min Linux 2-core ([Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions)).

v1: `actions/cache` on `~/.bun/install/cache` keyed by `bun.lock` ([Bun example](https://github.com/actions/cache/blob/main/examples.md)). CI install: `bun install --frozen-lockfile` with **lifecycle scripts off**. **Not v1:** Turborepo (not a monorepo). **Not v1:** Blacksmith (Ubuntu **$0.004**/min, 3k free min, 25 GB colocated cache) until private **and** included minutes run out. [#79](https://github.com/fringe4life/chef-llama/issues/79).

### Turborepo (round 33 proposal — still not v1)

Turbo’s GHA guide: `turbo run` + either Vercel remote cache (**OIDC** `id-token: write` or `TURBO_TOKEN` PAT) or `actions/cache` on **`.turbo`**. A UI redesign skips query `tsc` only if queries are a **separate package with hashed outputs**. One Kit/Vite graph still bundles SQL into the Worker. Public runners are **$0** — remote cache does not save money. Keep bun cache + `actions.lock`. [Turbo GHA](https://turbo.build/docs/guides/ci-vendors/github-actions) · [round 33](../../internal/research-round33-reylo-userdo-turbo.md).

## Secure Actions (Socket 3 Nov 2026)

[Hardening GitHub Actions against outside threats](https://socket.dev/blog/hardening-github-actions-against-outside-threats):

- `gh actions-lock` → `.github/workflows/actions.lock` (readable `@vN` in YAML; lockfile holds commits, including nested step-level actions). SHA-pin **reusable workflow** calls. Impostor commits rejected by the lockfile.
- Workflow `permissions: {}`; grant per job. Anyone with **write** can dump secrets by pushing a workflow — keep deploy secrets off lint.
- Prefer `pull_request` (no secrets) over `pull_request_target`. Do not checkout PR **head** in a privileged job. GitHub **enforces** blocking `pull_request_target` on **public** repos **2 Dec 2026** (evaluate mode until then). Private repos unaffected.
- Never interpolate `${{ github.event.* }}` into `run:`; pass via `env:`.
- `cache-mode: read` on untrusted jobs; **`none`** on production deploy. Do not set `write` on low-trust triggers (Ultralytics / TanStack cache poison).
- No persistent self-hosted runners on a public repo. zizmor + actionlint on `.github/**`.
- Pin OSV-Scanner / Infisical **actions**; no `curl | bash`.

[#52](https://github.com/fringe4life/chef-llama/issues/52) · [#53](https://github.com/fringe4life/chef-llama/issues/53) · [#79](https://github.com/fringe4life/chef-llama/issues/79). [round 15](../../internal/research-round15-concise-secrets-ci.md) · [round 31](../../internal/research-round31-workers-repo-actions.md) · [round 38](../../internal/research-round38-mocks-tests-unsupported.md).
