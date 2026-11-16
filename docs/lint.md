# Lint and static guardrails

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Working material: the lint-guardrails spike (`/workspace/spikes/lint-guardrails/`, incl. `LOGGING.md`) and the StyleX spike.

## Decided

### Stack
- **ESLint 10+** flat `eslint.config.js` + **Fallow** (project graph) + **`svelte-check --tsgo`** (type gate). Not Oxlint/Biome, not `@antfu/eslint-config`. MCP: `@eslint/mcp` + `fallow-mcp`.
- Plugins:
  - `eslint-plugin-svelte` (recommended)
  - `@stylexjs/eslint-plugin`
  - `@effect/eslint-plugin` (barrels only)
  - `eslint-plugin-slop` (`createSlopConfig()`), **kept** (see § eslint-plugin-slop below)
  - `eslint-plugin-compat` (`compat/compat` at `error`, `lintAllEsApis: true`) on `*.{js,ts,svelte}` via `svelte-eslint-parser`
  - `@eslint/css` (`css/use-baseline` at `error` with `{ available: 2024 }` on `*.css`)
  - local `chef/*`
- No `recommendedTypeChecked` in v1 (slow and noisy with Effect).
- Fallow `bulletproof` (see [folder-organisation.md](./folder-organisation.md)). Fallow is currently `3.43.1`; pin it exactly when coding starts (see [ci.md](./ci.md#dependencies)).

### Cache / public-page rules
- `chef/no-raw-cache-headers`, `chef/public-route-purity`, `chef/public-csr-false`.
- Never: hand-write `Cache-Control`/`Cloudflare-CDN-Cache-Control`/`Cache-Tag`; import auth in public layouts; import `#lib/server/*` from `src/params.ts`.

### `$effect` banned; escape hatch is a file suffix
- `chef/no-effect-rune` (`error`): bans `$effect`, `$effect.pre` and `$effect.pending`. `$effect.tracking()` is allowed for now.
- Allowed **only** in files whose basename matches `*.hazardous.svelte`, `*.hazardous.ts` or `*.hazardous.svelte.ts`. There is no path allowlist.
- Use instead: `$derived`, event handlers / actions / invokers, `{@attach}`, `onMount`, `load` / remotes.
- The first real use of the hatch is the StyleX dev runtime: `$effect` lives in `src/lib/theme/stylex-dev-runtime.hazardous.svelte.ts` (a rune module; a plain `.hazardous.ts` would not be compiled by Svelte) and is called **synchronously during component init** from `src/routes/+layout.svelte` (see [theme.md](./theme.md#stylex-dev-runtime)). The rule itself already no-ops on a hazardous filename (`isHazardousFilename`). Belt: a files-override turns the rule off in the same hatch globs (not a path allowlist, and not only this one file — any future hatch file matches too):
  ```js
  // Ban (default). Selector: CallExpression where the callee is Identifier[name='$effect']
  // or MemberExpression $effect.pre / $effect.pending ($effect.tracking is allowed).
  { rules: { "chef/no-effect-rune": ["error", { allowTracking: true }] } },
  // Needed so *.svelte.ts rune modules parse (eslint-plugin-svelte docs).
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: { parserOptions: { parser: ts.parser, extraFileExtensions: [".svelte"] } },
  },
  {
    files: ["**/*.hazardous.ts", "**/*.hazardous.svelte", "**/*.hazardous.svelte.ts"],
    rules: { "chef/no-effect-rune": "off" },
  },
  ```
  Box-tested 16 Nov 2026 NZDT with the real `chef/no-effect-rune` and `svelte-eslint-parser` + `@typescript-eslint/parser`: `$effect` in `stylex-dev-runtime.hazardous.svelte.ts` is clean; a correct `+layout.svelte` that only calls `stylexDevRuntime()` is clean; the official inline `$effect` in a non-hatch layout fails; the same `$effect` in `not-hazardous.svelte.ts` fails.
- **Hazardous-file CI**: `flag-hazardous-files.yml` runs on `pull_request`.
  - It looks for added or renamed hatch files.
  - On a match: `hazardous` label + sticky comment, and a job summary on every run. It does not fail the job.
  - Permissions: `contents: read`, `pull-requests: write`, `issues: write`.
  - Never `pull_request_target` + head checkout.

### Comments banned except tool-required ones
- `@eslint-community/eslint-comments` `require-description` + `no-unused-disable` + `disable-enable-pair`, plus custom `chef/no-unapproved-comments`. The custom rule also catches HTML comments in `.svelte`; `eslint-plugin-no-comments` misses them.
- Allowed: eslint directives **with a description**, `@ts-expect-error` with a description (`@ts-ignore`/`@ts-nocheck` banned), `svelte-ignore`, license headers, and skill-required prefixes (empty for now). JSDoc is off by default.

### Raw `fetch` banned
- `chef/no-raw-fetch` (`error`), with scope analysis. Bans a free `fetch`, `globalThis`/`window`/`self`/`global.fetch`, and `import { fetch }` from any module.
- Allowed:
  - `fetch` from `load`/`event`/`handle`/action/`+server`/remote params
  - service bindings `env.X.fetch`
  - the one sanctioned module `src/lib/server/http.ts`, for event-less code: cron, queue, DOs, Stripe webhook-out, Effect `HttpClient` wrappers
  - tests / mocks / e2e / Playwright

### TypeScript, console, imports
- `@typescript-eslint/no-explicit-any`, `no-non-null-assertion` (enabled explicitly) and `ban-ts-comment`, all `error`.
- `no-console` (the logging design; full write-up in [ops.md § Logging](./ops.md#logging) and the spike's `LOGGING.md`):
  - `error` everywhere: app, **`hooks.server.ts`**, tests, Playwright, `alchemy.run.ts`.
  - Off only in **`*.hazardous.ts` / `*.hazardous.svelte` / `*.hazardous.svelte.ts`** (the `$effect` hatch names CI flags; deliberately not `*.hazardous.*`, which would include `.js`/`.md`) and `scripts/*.mjs` (the synthetic check, CI stdout).
  - The sanctioned logger is `src/lib/server/log.hazardous.ts`. New logging modules get the hazardous CI label.
  - Backed by:
    - `@eslint-community/eslint-comments/no-restricted-disable` for `no-console` / `no-restricted-properties`;
    - `no-restricted-properties` (`globalThis.console`, `self.console`, `Logger.layer`, `Logger.consoleJson`/`consoleStructured`/`consoleLogFmt`/`consolePretty`/`withConsole*`);
    - `no-restricted-imports` for Effect `Console`.
  - Box test: `tests/no-console-hazardous.test.mjs` against the real example config, 42/42 (including the import-scope cases).
- Imports: Fallow `boundary-violation` (error) owns the `#lib/server` boundaries. ESLint `no-restricted-imports` is a belt: Node-only built-ins everywhere, and `#lib/server` / `$lib/server` (a regex, because a leading `#` is a comment in `group` globs) **only in client/public/universal files** (`src/routes/**/*.svelte`, `+page.ts`, `+layout.ts`, `src/lib/**` minus `src/lib/server/**`, `src/params`, `src/hooks.ts`, `hooks.client.ts`). Server files can import `#lib/server/log.hazardous` (scoped 16 Nov 2026). Built-ins: (`node:fs`, `child_process`, `worker_threads`, `net`, …). `node:path` / `node:crypto` / `node:buffer` are still open.

### Effect
- Effect is **server-only**, and its main use is **typed error handling** (tagged errors mapped to HTTP status at the edge). No Effect in client code: `no-restricted-imports` bans `effect` and `effect/*` in the client/public/universal file set listed under Imports above.
- `chef/no-effect-run-outside-edges` bans `Effect.run*` except at these edges:
  - `src/hooks.server.ts`
  - remote functions `**/*.remote.ts`
  - `+page.server.ts` / `+layout.server.ts` (load and form actions)
  - `+server.ts` endpoints
  - the Jobs Worker queue consumer and cron handler
  - Durable Object classes (RPC methods)
  - `alchemy.run.ts`
  - `scripts/**`
- Official `@effect/no-import-from-barrel-package`. Skip dprint.
- Unofficial Effect lint packs are not adopted.

### Valibot, Drizzle, Svelte extras
- `eslint-plugin-valibot` **recommended** at `error`.
- `eslint-plugin-drizzle` `enforce-delete-with-where` + `enforce-update-with-where` at `error` with `drizzleObjectName`.
- Svelte extras:
  - `svelte/block-lang` (`script: ['ts']`)
  - component `<style>` blocks are **banned** with `no-restricted-syntax` on the `SvelteStyleElement` selector, scoped to `**/*.svelte`. StyleX and the global theme file own all CSS (see [theme.md](./theme.md#native-overlays)). `block-lang`'s `style: [null]` alone does not ban the block (box-tested 16 Nov 2026: it passes a plain `<style>`; the selector rule fails it).
  - `button-has-type`
  - `no-add-event-listener`
  - `no-top-level-browser-globals`
  - `no-inline-styles`

### StyleX
- `@stylexjs/valid-styles` + `propLimits`, `chef/no-raw-stylex-values`, `chef/no-adhoc-typography`, `chef/no-faux-font-weight`, `enforce-extension`, `no-nonstandard-styles`, `no-lookahead-selectors` (warn; treated as **discouraged** — with `--max-warnings=0` a warning still fails the hook and CI). Details in [theme.md](./theme.md).
- `chef/prefer-named-grid-areas` (`error`, **discouraged**): in `stylex.create` / `stylex.defineVars` objects, if `display` is `'grid'` or `'inline-grid'` and `gridTemplateColumns` or `gridTemplateRows` is set, `gridTemplateAreas` is required. Built-in exception (no disable needed): the columns/rows value is a `repeat(auto-fill|auto-fit, …)` or minmax-only track list. Belt: `no-restricted-syntax` flags numeric `gridColumn` / `gridRow` / `gridArea` / `gridColumnStart|End` / `gridRowStart|End` (number literals or strings starting with a digit). StyleX `valid-styles` does not enforce this.
  ```js
  {
    selector: "Property[key.name='gridColumn'][value.type='Literal'][value.value=/^\s*\d/]",
    message: "Use a named grid area (gridArea: 'content'), not a numeric grid-column line. See docs/theme.md. Disable only with a reason."
  }
  ```
  Same pattern for `gridRow`, `gridArea`, and `key.name=/^grid(Column|Row)(Start|End)$/`. Named areas and `span` with a name are allowed. Hatch: `eslint-disable-next-line chef/prefer-named-grid-areas -- <reason>` (`eslint-comments/require-description`). No `*.discouraged.*` suffix and no path allowlist.
- **No `src/app.css`.** Token *values* live in StyleX `defineVars` (`*.stylex.ts`, `--` keys, including `light-dark()` colour strings). The remaining raw CSS (`color-scheme` / `:has()` scheme switching, `font-synthesis`, `@property` if used, `::backdrop` / `@starting-style` / UA-drawn overlays) lives in `src/lib/theme/tokens.css`, imported from `src/routes/+layout.svelte` as `import '$lib/theme/tokens.css'`. That import is the Vite CSS asset `@stylexjs/unplugin` appends compiled StyleX to (docs: provide a CSS entry so Vite emits an asset; if none exists the plugin may emit an unlinked `stylex.css`). Do not add an `@stylex;` at-rule: it is only for `@stylexjs/postcss-plugin` (which replaces it); unplugin never looks for it and a box build with unplugin 0.19.2 left a leftover `@stylex;` in the production CSS ([theme.md](./theme.md#native-overlays)). Enforcement: `chef/no-app-css` (`error`) on `src/app.css` under `language: "css/css"` — if the file appears, report "do not add `src/app.css`; import `$lib/theme/tokens.css` from the root layout." Plus a `preToolUse` deny on Write/Delete of `src/app.css` (see [cursor-hooks.md](./cursor-hooks.md) and [theme.md](./theme.md#native-overlays)).

### Browser-floor linting
- The machine-readable floor stays the explicit `browserslist` in `package.json` (see [theme.md](./theme.md#browser-floor)). Do not replace it with a Baseline query.
- **JS:** `eslint-plugin-compat` as above. It honors browserslist and, with `svelte-eslint-parser`, sees Svelte `<script>`.
- **Raw CSS** (`tokens.css`): `@eslint/css` `css/use-baseline` at `{ available: 2024 }`. `"widely"` is too strict today (it flags load-bearing `light-dark()`). Do not use doiuse-based CSS browser checks: they missed both allowed modern features and below-floor `position-anchor` in the 16 Nov 2026 box test.
- **StyleX objects** are not visible to CSS linters. Backstop: lint compiled CSS in CI once the build exists, plus the LightningCSS `cssTarget` in [theme.md](./theme.md#open).
- Human mapping: the floor sits between Baseline 2023 and Baseline 2024, and is not equal to today's "widely available" (our Chrome 123 is one major older than today's widely-available Chrome 124; Firefox 128 and Safari 18.3 are newer than that query). `{ available: 2024 }` can allow a 2024 feature that Chrome 123 lacks; that is an accepted approximation until compiled-CSS linting is in place.

### Avoid tiers (discouraged / restricted / hazardous)
Agents use these three names. Each tier's **rule list will grow over time** (the 3-day agent-friction retro is one source of new rules; see [factory.md](./factory.md)). There is only one file-suffix hatch: **`.hazardous.`**, and only for tier *hazardous*.

| Tier | Name | Hatch | ESLint | CI | Retro / self-review |
|---|---|---|---|---|---|
| A — not preferred | **discouraged** | `eslint-disable-next-line <rule> -- <reason>` only (`require-description`) | **error** | Fails until fixed or disabled with a reason. Keep `--max-warnings=0` in lint-staged, the Cursor `stop` hook and CI (a `warn` would also fail under that flag). | The 3-day retro counts new disable comments in this set. A rising count means "improve the default or add a skill," not a new doc file. |
| B — moderately bad | **restricted** | Same disable-comment format | **error** | Same as A; a pull request that adds more than a small number of restricted disables can get a sticky comment (threshold Open). | Counted in a separate bucket from discouraged. |
| C — almost always misused | **hazardous** | File suffix `*.hazardous.svelte` / `*.hazardous.ts` / `*.hazardous.svelte.ts` only. `no-restricted-disable` on these rules so a one-line disable cannot bypass the hatch. | **error**, off only in the suffix files (and the existing `scripts/*.mjs` exception for `console`) | Existing `flag-hazardous-files.yml`: label + sticky comment; the job does not fail (lint already failed if the rune or `console` is used outside the hatch). | New or renamed `*.hazardous.*` files are a first-class retro input. |

Starting lists (will grow):
- **discouraged:** `chef/prefer-named-grid-areas` (and its numeric-line belt), `no-lookahead-selectors`.
- **restricted:** starts empty.
- **hazardous:** `chef/no-effect-rune`, `no-console` and the related `no-restricted-properties` / Effect `Console` bans.

Disable format for tiers that allow it: `eslint-disable-next-line <plugin>/<rule> -- <one-line reason>`. No file-level `eslint-disable` for `chef/*` (`no-restricted-disable` / disable-enable-pair). Do not invent `*.discouraged.*` or `*.restricted.*` suffixes.

### eslint-plugin-slop: kept

**Status:** decided. `eslint-plugin-slop` stays in the merged config (`createSlopConfig()`), with the overrides below.

**What it is.** Sources, read 16 Nov 2026 NZDT: npm registry metadata + the published 0.1.3 tarball README and `dist/index.mjs`; repo https://github.com/antfu/eslint-plugin-slop.
- `eslint-plugin-slop@0.1.3` (latest; published 3 Sep 2026; first release 2 Sep 2026). Author Anthony Fu, MIT. Peer `eslint ^10.0.0`; one dependency (`diff`). Self-description: "ESLint rules for guarding AI slops in code."
- `createSlopConfig()` turns **every rule on as `error`** and returns two flat-config entries:
  - a "universal" entry (`no-em-dash`) for every language in the surrounding config;
  - a "javascript" entry for `**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}` only. **`.svelte` is not in that glob**, so the syntax rules skip Svelte `<script>` unless we add a `files` override.
- By default it only reports on **recently changed lines**: `inspection: 'recent-changes'` diffs against `HEAD~5` via git. Other modes are `uncommitted` and `full`. Without git history (e.g. a shallow CI checkout) it inspects the whole file.

| Rule | Reports |
|---|---|
| `slop/no-em-dash` | every literal U+2014 em dash, in any parser-compatible language |
| `slop/no-trivial-functions` | low-use (default < 5 refs), non-exported property-access or pass-through wrapper functions |
| `slop/max-comment-length` | comment blocks over 50 words (JSDoc ignored by default) |
| `slop/no-jargon` | inflated vocabulary in comments ("utilize", "delve"…), with suggestions |
| `slop/prefer-jsdoc` | `//` comments above an export or member; autofixes them to `/** */` |
| `slop/no-trivial-type-aliases` | top-level TS aliases that resolve to `unknown` or a primitive |
| `slop/no-static-only-class` | classes with only static members (namespace classes) |
| `slop/no-chained-type-assertions` | two or more nested `as` assertions (except all-`as const`) |

**Compared with our custom rules:**

| Our rule | Slop overlap |
|---|---|
| `chef/no-effect-rune` + hazardous-file suffix/CI | none |
| `chef/no-raw-fetch` | none |
| `chef/no-unapproved-comments` (+ eslint-comments) | `max-comment-length`, `no-jargon` and `prefer-jsdoc` only act on comments, and ours already bans ordinary comments. Those three are mostly redundant. `prefer-jsdoc` **pulls the other way**: it autofixes a `//` into `/** */`, and our policy has JSDoc **off** by default. If adopted, turn `prefer-jsdoc` off (and probably the other two). |
| `chef/no-faux-font-weight`, `chef/no-adhoc-typography`, `chef/no-raw-stylex-values` | none (slop has no CSS/StyleX awareness) |

**What slop adds that ours don't:**
1. `no-em-dash`: a classic AI-text tell, and the only slop rule that also runs on non-JS files (Svelte markup text, Markdown if a Markdown language plugin is configured).
2. `no-trivial-functions`: pointless private wrappers.
3. `no-trivial-type-aliases`: `type Id = string`-style aliases. Note that our ID brands (`RecipeSlug`, `Ulid`) are Valibot brands, not bare primitives. Check they don't trip it.
4. `no-chained-type-assertions`: `x as unknown as T`.
5. `no-static-only-class`: largely covered by typescript-eslint's `no-extraneous-class` if we enable it (it's in `strict`, which we don't use wholesale).

Its diff-only default also suits agent PRs (noise only on new code).

**Costs and risks:** 0.x and two months old, with a single maintainer. TS/JS-only syntax rules need a manual `files` extension to cover `.svelte`. The git-diff inspection makes results depend on history depth (use `inspection: 'full'` in CI for determinism).

**Config:** `...createSlopConfig({ inspection: 'full', rules: { 'slop/prefer-jsdoc': 'off', 'slop/max-comment-length': 'off', 'slop/no-jargon': 'off' } })`, plus a `files` override adding `**/*.svelte` for the TS rules after a RuleTester check on `svelte-eslint-parser`.

**No "deslop" agent skill.** An agent skill that cleans up AI-style code after the fact is not needed: ESLint does that job on every run (slop plus `chef/no-unapproved-comments`, `chef/no-raw-fetch`, the `$effect` ban, the StyleX rules and the rest), in the editor, in the Cursor hooks, at pre-commit and in CI. A skill is a prompt and can be skipped; a lint rule cannot. (The upstream `deslop` skill is also no longer in Matt Pocock's skills repo.) See [skills.md](./skills.md).

### Pre-commit: husky + lint-staged
- **husky** (v9) installs the Git hook; **lint-staged** runs ESLint on staged files only. Both are exact-pinned dev dependencies; `package.json` has `"prepare": "husky"`, so `bun install` sets the hook up locally.
- While the codebase is small, pre-commit also runs whole-project unit tests and `svelte-check --tsgo`, and `bun dedupe --check`, so failures are caught before GitHub Actions (the free allowance is 3,000 minutes/month once the repo is private; hooks can be skipped, so CI is still the gate and still runs everything).
- **`package.json` scripts and lint-staged:**
  ```json
  {
    "scripts": {
      "prepare": "husky",
      "lint": "eslint --cache --cache-location node_modules/.cache/eslint/ --max-warnings=0 .",
      "check": "svelte-kit sync && svelte-check --tsgo --tsconfig ./tsconfig.json --output machine",
      "test": "bun test"
    },
    "lint-staged": {
      "*.{js,mjs,cjs,ts,mts,svelte}": "eslint --fix --cache --cache-location node_modules/.cache/eslint/ --max-warnings=0",
      "*.{md,json,css}": "eslint --fix --cache --cache-location node_modules/.cache/eslint/ --max-warnings=0 --no-warn-ignored"
    }
  }
  ```
  `eslint --fix` uses the full merged config (slop included). Fixes are restaged automatically. `svelte-check` is **whole-project** (no per-staged-file mode). Use **TS ~6** for `--tsgo`, not `--tsgo-experimental-api` (see [ci.md](./ci.md#type-check)).
- **`.husky/pre-commit`:**
  ```sh
  bunx lint-staged
  bun dedupe --check
  bun test
  bun run check
  ```
  Order is deliberate: autofix first, then the cheap lockfile check, then tests, then typecheck.
- **`.husky/pre-push`:**
  ```sh
  bun audit --audit-level=high
  ```
  The **same command** runs in CI. Decision: **full audit** (no `--prod` / `--production`) at `--audit-level=high`. Dev deps such as ESLint plugins and husky run on every dev and CI machine and are the supply-chain risk we care about. On the lint-floor spike (16 Nov 2026 NZDT, Bun 1.4.4) `bun audit --prod` checked **0 packages** (everything is a devDependency); a full `bun audit` found one **moderate** (`minimatch` via ESLint) and `bun audit --audit-level=high` filtered it (`1 below --audit-level=high`, exit 0). `--audit-level=high` is the noise control, not omitting devDeps. `--prod` remains a documented alias of `--production` if we ever need it; we do not use it.
- **`bun dedupe --check`** exists and is cheap (lockfile only; "Exit with code 1 if the lockfile has duplicate versions that can be removed, without changing anything"). It runs at **pre-commit**.
- **Playwright** and **Fallow** stay out of the Git hooks. Playwright needs a deployed preview ([tests.md](./tests.md#playwright)). Fallow runs in the Cursor `stop` hook and in CI ([cursor-hooks.md](./cursor-hooks.md)).
- **`svelte-check --tsgo` stays on pre-commit.** Do not move it to pre-push.
- **Timing caveats and move-later thresholds** (for other steps only). Measure a *typical* commit after a warm ESLint cache (second run, not a cold `bun install`) with `/usr/bin/time -f '%e'` (or `TIMEFORMAT='%R'; time …`) for each hook step, from a mid-size edit, and write the numbers down when proposing a move.
  - If a typical **pre-commit** exceeds **~10 seconds** because of **unit tests**, move `bun test` to pre-push or switch it to `bun test --changed` (exists in Bun 1.4.4). Leave `lint-staged`, `bun dedupe --check` and `bun run check` (`svelte-check --tsgo`) on pre-commit.
  - If a typical **pre-push** exceeds **~60 seconds**, drop the slow step from the hook (it stays in CI). Pre-push should still run `bun audit --audit-level=high` (fast).
  - If type-aware ESLint rules alone make a typical commit slow, move those rules to a CI-only config block rather than dropping them.
- **Relation to CI:** the hooks are a local early warning, not the gate. They can be skipped (`git commit --no-verify`, `HUSKY=0`), and CI does not run them: CI installs with lifecycle scripts off, so `prepare` never runs there. CI runs the full ESLint (all files), Fallow, `svelte-check --tsgo`, unit tests, Playwright on the preview, the same `bun audit --audit-level=high`, and `bun dedupe --check` (see [ci.md](./ci.md#jobs-and-secrets)), and those are the required checks. Agents are told not to skip the hook, and the Cursor shell hook denies `--no-verify` / `HUSKY=0` (see [cursor-hooks.md](./cursor-hooks.md)).

### Fallow defaults
- Leave the defaults on. `fallow audit` (new-only) is the PR gate. Don't rely on `css-token-drift` for StyleX (unverified). Don't add `import/no-cycle`.

## Open
- Sticky-comment threshold for a pull request that adds many **restricted** disables.
- `$effect.tracking()` allowed? JSDoc on exports? `ban-ts-comment` minimum description 10 vs 3?
- `node:path` / `node:crypto` / `node:buffer` on Workers?
- Valibot `strict` / `stylistic`? Drizzle `0.2.3` vs `1.0.0-rc.5`; the client name for `drizzleObjectName`.
- Hazardous CI: fail vs flag; re-label on modify; remove the label; label name.
- `http.ts` wrapper name (`request` vs `httpFetch`).
- StyleX open items: see [theme.md](./theme.md#open).
- The user-hash secret name for logging.
