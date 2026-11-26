# Folder organisation

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### One SvelteKit app, Fallow `bulletproof`
- **One SvelteKit app** under `src/`, with architecture enforced by Fallow's **`bulletproof`** preset: zones `app` / auto-discovered `features/*` / `shared` / `server`. The `app` zone is remapped to `src/routes/**`. Sibling features must not import each other.
  - Rejected presets: `layered`, `hexagonal`, `feature-sliced`.
- **No Turborepo in v1.** A single Alchemy + Vite project with the CI install cached (`actions/cache` on the bun store, see [ci.md](./ci.md)), and one Kit `check` script. Fallow `bulletproof` globs are flat `src/**` and would need custom zones across Turbo `packages/*`, which is one more reason to stay one app.
- **Sengi stays** as the PR CI runner (see [ci.md](./ci.md#runners)), independent of Turbo.
- **No empty folders.** A folder exists only when it has v1 code. No placeholder slots for v2 features (photo, chat, billing, BYO AI); v2 work creates its folder when it starts (see [v2.md](./v2.md)).

### Tree (paths not yet named anywhere are marked TBD)
```
src/
  routes/                       # Fallow "app" zone
    (static)/  about pricing how-to terms privacy  llms.txt/
    (site)/    +page  recent/  recipes/[slug=slug]/  sitemap-index.xml/
    (app)/     onboarding/  pantry/  saved/  account/{,usage,packs}/
    sign-in/  api/auth/[...all]/  robots.txt/
  features/
    diet/                       # v1 feature, Diet DO
  shared/                       # chip canonicalizer, string-only
  lib/
    id.ts                       # newId()
    schemas/                    # Valibot (#lib/schemas/*)
    server/cache                # publicCache (#lib/server/cache)
    server/http.ts              # the one raw-fetch exception
    server/log.hazardous.ts     # the sanctioned logger
    theme/tokens.css            # raw leftovers only: color-scheme, overlays (see theme.md)
    theme/tokens.stylex.ts      # defineVars token values (`--` keys)
    theme/stylex-dev-runtime.hazardous.svelte.ts  # StyleX dev $effect hatch
    auth/redirect.ts            # redirectTo helpers (see auth.md)
    saves.remote.ts             # Save remote form() (see caching.md)
  params.ts                     # all Kit 3.2 matchers
  env.ts                        # defineEnvVars, incl. APP_ENV
  app.html                      # blocking theme script + noscript
routes.manifest.ts              # route → group/cache/csr contract
.env.schema                     # Varlock schema (see security.md)
scripts/synthetic-check.mjs     # synthetic check
alchemy.run.ts                  # IaC
.cursor/hooks.json  .cursor/hooks/   # agent hooks (see cursor-hooks.md)
.husky/pre-commit  .husky/pre-push  # Git hooks (see lint.md)
.agents/skills/  skills-lock.json   # agent skills (see skills.md)
.github/workflows/  .github/workflows/actions.lock  .github/dependabot.yml
```
- `*.hazardous.svelte` / `*.hazardous.ts` / `*.hazardous.svelte.ts` are the only files where `$effect` and `console` are allowed, colocated with their feature (see [lint.md](./lint.md)).
- The **Jobs Worker** (DO classes Credit / Diet / Saved / pool, the queue consumer, Stripe Checkout + webhook) is a second Worker. Its folder is TBD.

## Open
- Where the Jobs Worker source lives in a single-app repo (for example a second entry beside `src/`).
- Should `/account` stay in the `app` zone?
- Fallow zones for public routes: later, not v1.
- Turborepo as a later option. If reconsidered, the earlier sketch was `apps/web` (the Kit app, `svelte-check --tsgo`) plus `packages/schema` (Valibot/Recipe schemas), `packages/queries` (Drizzle queries, Miniflare tests) and `packages/credit` (Credit DO), with `turbo run check`. Known costs: Fallow `bulletproof` would need custom zones; one Kit/Vite graph still bundles SQL into the Worker, so caching only helps if queries are a separate package with hashed outputs. No trigger for reconsidering is set (for example a second app).
