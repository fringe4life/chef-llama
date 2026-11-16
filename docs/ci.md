# CI, hooks, dependencies, GitHub Actions

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Previews are in [previews.md](./previews.md), security in [security.md](./security.md), lint rules in [lint.md](./lint.md), the software-factory and agent-friction jobs in [factory.md](./factory.md).

## Decided

### Jobs and secrets

| Job | Secrets |
|---|---|
| ESLint + Fallow + `svelte-check --tsgo` | none (`contents: read`) |
| Tests (unit + the single Playwright target, see [tests.md](./tests.md)) | none |
| bundlewatch on the built client | none |
| `bun audit --audit-level=high` + OSV-Scanner `--lockfile bun.lock` | none |
| Preview deploy | Infisical OIDC (`id-token: write`) |
| Production deploy | Infisical OIDC; protected environment |
- Do not inject Infisical into lint.

### Type-check
- `svelte-kit sync && svelte-check --tsgo --tsconfig ./tsconfig.json --output machine`. Use **TS ~6** for the Kit compile and `--tsgo`, not `--tsgo-experimental-api`. Skip `svelte-check-native`.

### bundlewatch
- Public pages **0 JS**; `/pantry` about **43 KB** brotli; CSS budget set by measurement (don't invent a number).

### Runners
- **Sengi** runs the PR brake jobs (lint, typecheck, Fallow, tests, zizmor/actionlint). Sengi works with personal repos and intercepts `actions/cache`. Not Blacksmith (organisations only).
- Visual and eval checks do not run on every PR.
- **No Turborepo** in v1: one Alchemy + Vite project and one `check` script (see [folder-organisation.md](./folder-organisation.md)).

### Cache
- `actions/cache` on `~/.bun/install/cache`, keyed by `bun.lock`. `bun install --frozen-lockfile` with lifecycle scripts off.
- Leave the 10 GB Actions cache default; a cache over 1 GB is treated as a bug.

### Secure Actions
- `gh actions-lock` → `.github/workflows/actions.lock`, and SHA-pin reusable workflows.
- `permissions: {}` at the workflow level, granted per job.
- `pull_request`, not `pull_request_target` (GitHub blocks it on public repos from 2 Dec 2026).
- Never put `${{ github.event.* }}` in `run:`.
- `cache-mode: read` on untrusted jobs, `none` on deploy.
- zizmor + actionlint. No self-hosted runners while the repo is public.

### Dependencies
- **Exact versions only** in `package.json`: no `^`, `~` or `*`. Set `[install] exact = true` in `bunfig.toml` so `bun add` writes exact versions. This includes Alchemy (latest v2 when coding starts) and Fallow (currently 3.43.1).
- Versions are kept current by the **monthly deps review** Automation (see [factory.md](./factory.md)) and **Dependabot** (`bun` + `github-actions`, weekly, keep `cooldown`), not Renovate. Dependabot raises the pinned version; it never introduces a range. Pair with `bun audit` / OSV.
- **Dependabot is not configured yet:** the repo has no `.github/` folder on any branch (checked 16 Nov 2026 NZDT), so there is no `dependabot.yml` and no workflow. Add `.github/dependabot.yml` when coding starts, with `package-ecosystem: "bun"` (Dependabot supports the text `bun.lock`, Bun ≥ 1.1.39) and `package-ecosystem: "github-actions"`, `schedule.interval: weekly`, and a `cooldown` (Dependabot's default is 3 days for version updates; security updates skip it).

### Hooks
- Git hooks: husky + lint-staged. `pre-commit` runs `eslint --fix --cache` on staged files; `pre-push` runs `bun audit --audit-level=high`. Details, speed rules and how they relate to CI: [lint.md](./lint.md#pre-commit-husky--lint-staged).
- Cursor agent hooks (`.cursor/hooks.json`): [cursor-hooks.md](./cursor-hooks.md).
- Neither replaces CI: the jobs above are the required checks.

### Workflows beyond the gate
- `flag-hazardous-files.yml`: labels PRs touching `*.hazardous.*` and writes a sticky comment (see [lint.md](./lint.md)).
- Preview pipeline: early CI → classify scope → `alchemy deploy --stage pr-{n}` → Playwright → R2 media; PR close → destroy; fortnightly sweep (see [previews.md](./previews.md)).
- Synthetic check: in CI in v1; in v1.1 on a GitHub Actions `schedule` plus after each deploy (see [tests.md](./tests.md#synthetic-check)).
- Optional `collect-friction.yml` (no model): an evidence pack for the agent-friction retro. The architecture hunt itself is a Cursor Automation, not a GitHub Actions cron (see [factory.md](./factory.md)).

### Repo
- Public until coding starts, then private. Private stops anonymous clones of the source; it does not hide deployed JS or a copied prompt, and it is not a secrets strategy (secrets are in Infisical either way).
- When flipping to private: Actions minutes become billed after the included amount; existing public forks stay public and detach; Dependabot version jobs still run without using minutes; stars and watchers are wiped.
- GitHub is for tasks only: decisions live in these topic files, and a task links to the section it implements.

## Open
- Branch protection and required checks.
- Sengi timing: from the first PR, or from when the repo goes private (GitHub-hosted runners are free while it is public). When private, the included Actions minutes are US$12 (Free) / US$18 (Pro) per billing account, shared across all private repos.
- A CI check that fails on any range specifier in `package.json` (a few lines in `scripts/`), so the exact-version rule cannot drift.
