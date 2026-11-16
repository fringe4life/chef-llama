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
  - local `chef/*`
- No `recommendedTypeChecked` in v1 (slow and noisy with Effect).
- Fallow `bulletproof` (see [folder-organisation.md](./folder-organisation.md)). Fallow is currently `3.43.1`; pin it exactly when coding starts (see [ci.md](./ci.md#dependencies)).

### Cache / public-page rules
- `chef/no-raw-cache-headers`, `chef/public-route-purity`, `chef/public-csr-false`.
- Never: hand-write `Cache-Control`/`Cloudflare-CDN-Cache-Control`/`Cache-Tag`; import auth in public layouts; import `#lib/server/*` from `src/params.ts`.

### `$effect` banned; escape hatch is a file suffix
- `chef/no-effect-rune` (`error`): bans `$effect`, `$effect.pre` and `$effect.pending`. `$effect.tracking()` is allowed for now.
- Allowed **only** in files whose basename matches `*.hazardous.svelte`, `*.hazardous.ts` or `*.hazardous.svelte.ts`. There is no path allowlist.
- Use instead: `$derived`, event handlers / actions / invokers, `{@attach}`, `load` / remotes.
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
- `@stylexjs/valid-styles` + `propLimits`, `chef/no-raw-stylex-values`, `chef/no-adhoc-typography`, `chef/no-faux-font-weight`, `enforce-extension`, `no-nonstandard-styles`, `no-lookahead-selectors` (warn). Details in [theme.md](./theme.md).

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
- **husky** (v9) installs the Git hook; **lint-staged** runs it on staged files only. Both are exact-pinned dev dependencies; `package.json` has `"prepare": "husky"`, so `bun install` sets the hook up locally.
- **`.husky/pre-commit`:** `bunx lint-staged`.
- **lint-staged config** (in `package.json`):
  ```json
  "lint-staged": {
    "*.{js,mjs,cjs,ts,mts,svelte}": "eslint --fix --cache --max-warnings=0",
    "*.{md,json,css}": "eslint --fix --cache --max-warnings=0 --no-warn-ignored"
  }
  ```
  `eslint --fix` with the full merged config (slop included), so a commit can't add an em dash, a raw `fetch`, an ordinary comment or a raw StyleX value. Fixes are restaged automatically.
- **`.husky/pre-push`:** `bun audit --audit-level=high` (see [ci.md](./ci.md#hooks)).
- **Keep it fast** (target: a few seconds for a typical commit):
  - staged files only, `--cache` (cache file in `node_modules/.cache/`), no whole-project work;
  - **no** `svelte-check`, Fallow, Vitest or Playwright at pre-commit: those need the whole project graph or a deploy and stay in CI (Fallow also runs in the Cursor `stop` hook, see [cursor-hooks.md](./cursor-hooks.md));
  - if type-aware rules make a typical commit slow, move them to a CI-only config block rather than dropping them.
- **Relation to CI:** the hook is a fast local early warning, not the gate. It can be skipped (`git commit --no-verify`, `HUSKY=0`), and CI doesn't run it: CI installs with lifecycle scripts off, so `prepare` never runs there. CI runs the full ESLint (all files), Fallow, `svelte-check` and the tests (see [ci.md](./ci.md#jobs-and-secrets)), and those are the required checks. Agents are told not to skip the hook, and the Cursor shell hook denies `--no-verify` / `HUSKY=0` (see [cursor-hooks.md](./cursor-hooks.md)).

### Fallow defaults
- Leave the defaults on. `fallow audit` (new-only) is the PR gate. Don't rely on `css-token-drift` for StyleX (unverified). Don't add `import/no-cycle`.

## Open
- `$effect.tracking()` allowed? JSDoc on exports? `ban-ts-comment` minimum description 10 vs 3?
- `node:path` / `node:crypto` / `node:buffer` on Workers?
- Valibot `strict` / `stylistic`? Drizzle `0.2.3` vs `1.0.0-rc.5`; the client name for `drizzleObjectName`.
- Hazardous CI: fail vs flag; re-label on modify; remove the label; label name.
- `http.ts` wrapper name (`request` vs `httpFetch`).
- StyleX open items: see [theme.md](./theme.md#open).
- The user-hash secret name for logging.
