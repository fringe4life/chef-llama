# Cursor hooks: Fallow, lint and other checks for agents

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Git hooks (husky + lint-staged) are in [lint.md](./lint.md#pre-commit-husky--lint-staged); CI is in [ci.md](./ci.md).

Source: Cursor docs, [Hooks](https://cursor.com/docs/agent/hooks) (read 16 Nov 2026 NZDT). Event names, fields and limits below are from that page, not from memory.

## Decided

### What Cursor hooks are
- Scripts that Cursor runs at fixed points of the agent loop. They are configured in a **project `.cursor/hooks.json`** (committed), get JSON on stdin and answer with JSON on stdout. Project hooks run from the repo root, so script paths are `.cursor/hooks/<name>.sh`. Cursor reloads `hooks.json` on save.
- Exit code `0` uses the JSON output; exit code `2` **blocks** the action (same as `permission: "deny"`); any other failure **fails open** unless the hook sets `failClosed: true`.
- Per-hook options used here: `command`, `timeout` (seconds), `matcher` (regex), `loop_limit` (for `stop`, default 5) and `failClosed`.
- **Cloud agents** run project command hooks from `.cursor/hooks.json`, including `afterFileEdit`, `beforeShellExecution`, `beforeReadFile`, `preToolUse`, `postToolUse` and `stop`. They do **not** run `sessionStart`/`sessionEnd`, the MCP hooks or user-level `~/.cursor/hooks.json`, and hooks don't run during a cloud agent's early read-only turns. So everything below lives in the project file and uses only those events.

### The hook set
Why: agents get lint and Fallow feedback **while they work**, instead of at commit or in CI. husky is the commit-time net and CI is the gate; the three layers run the same ESLint config. `afterFileEdit` must not delete imports the agent is mid-adding (the Ultracite-style loop); unused-import autofix runs only at `stop`.

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [
      { "command": ".cursor/hooks/eslint-fix.sh", "timeout": 30 }
    ],
    "postToolUse": [
      { "command": ".cursor/hooks/eslint-report.sh", "matcher": "Write", "timeout": 30 }
    ],
    "stop": [
      { "command": ".cursor/hooks/check.sh", "timeout": 240, "loop_limit": 3 }
    ],
    "beforeShellExecution": [
      {
        "command": ".cursor/hooks/guard-shell.sh",
        "matcher": "--no-verify|HUSKY=0|push (-f|--force)|\\bnpm\\b|\\bpnpm\\b|\\byarn\\b|bun add|bun i(nstall)?\\b|alchemy (deploy|destroy|dev|nuke)",
        "failClosed": true
      }
    ],
    "preToolUse": [
      { "command": ".cursor/hooks/guard-write.sh", "matcher": "Write|Delete", "failClosed": true, "timeout": 10 }
    ],
    "beforeReadFile": [
      { "command": ".cursor/hooks/guard-read.sh", "timeout": 10 }
    ]
  }
}
```

| Event | Script | What it does |
|---|---|---|
| `afterFileEdit` (input: `file_path`, `edits`) | `eslint-fix.sh` | If `file_path` is `.ts`/`.js`/`.svelte` (or `.md`/`.json`/`.css`), run `bunx eslint --fix --cache` on that file with unused-import autofix **off**: `--rule unused-imports/no-unused-imports:off --rule unused-imports/no-unused-vars:off --rule no-unused-vars:off --rule @typescript-eslint/no-unused-vars:off` (whichever of those are enabled). Box-tested 16 Nov 2026 NZDT: a full `--fix` deleted an unused `readFile` import mid-edit; `--fix` with those rules off, and `--fix --fix-type layout`, left it. This hook cannot message or block the agent (no documented output). Always exits `0`. |
| `postToolUse` (matcher `Write`; output: `additional_context`) | `eslint-report.sh` | Report-only: run ESLint **without** `--fix` on the written path and, if there are remaining errors (including unused imports), return them in `additional_context`. Confirm the Write tool's path field when wiring the script. |
| `stop` (input: `status`, `loop_count`) | `check.sh` | When the agent finishes (`status: "completed"`): full `bunx eslint --fix --cache --max-warnings=0` on changed files (`git diff --name-only HEAD` plus untracked), **including** unused-import fixes, then `bunx fallow audit --quiet` (new issues only, as in the PR gate). Optional: scan those files for secrets (gitleaks/trufflehog or the same denylist as the retro redaction) and include a hit in `followup_message`. If anything is still dirty, print `{"followup_message": "<trimmed errors>. Fix these, then stop."}`; otherwise `{}`. `loop_limit: 3` stops endless fix loops. |
| `beforeShellExecution` (input: `command`; matcher on the command text) | `guard-shell.sh` | Deny: `--no-verify`, `HUSKY=0`, `git commit --no-verify`, `push -f` / `--force`; `npm` / `pnpm` / `yarn`; `bun add` / `bun i` / `bun install` of a package **without an exact `@version`**; `bun add -g`. `bun install` with no package args (lockfile install) is allowed. Also deny **`alchemy deploy|destroy|dev` targeting stage `prod`** (and `production`) and **`alchemy nuke`**. Do not blanket-deny `alchemy destroy`: stages are isolated, so `destroy --stage pr-N` or `live_$USER` only removes that stage and is legitimate. Answer `{"permission": "deny", "agent_message": "…"}`. `failClosed` so a crashed guard blocks rather than allows. Reasoning: [below](#alchemy-prod-and-destroy). |
| `preToolUse` (matcher `Write` or `Delete`; output: `permission` / `agent_message`) | `guard-write.sh` | Deny writes/deletes under `docs/archive/**`, generated trees (`.svelte-kit/**`, `dist/**`), and secret files (`.env`, `*.pem`, Infisical dumps). **Do not** blanket-deny `bun.lock`: an exact-pinned `bun add pkg@1.2.3` must be able to update it. Belt for [theme.md](./theme.md#native-overlays): **deny any Write that creates or edits `src/app.css`** (that file is not part of the app; the CSS entry is `src/lib/theme/tokens.css` imported from the root layout). ESLint `chef/no-app-css` is the matching lint gate. |
| `beforeReadFile` (input: `file_path`, `content`, `attachments`; output: `permission`) | `guard-read.sh` | Deny or redact `.env`, private keys and credential files so they do not enter the model. Not a substitute for vault rules. |

- **Not in the Cursor hooks:** `svelte-check`, unit tests and Playwright. Those are too slow for every `stop`. While the codebase is small they run in the Git pre-commit hook instead; Playwright stays on the deployed preview (see [lint.md](./lint.md#pre-commit-husky--lint-staged) and [tests.md](./tests.md#playwright)).
- No Ultracite/Biome hooks copied from other projects: the hooks run this repo's ESLint and Fallow only.
- Scripts are small POSIX `sh` with `jq` for JSON, committed next to `hooks.json`, and made executable.
- Cursor's built-in `/create-hook` skill can scaffold changes, but the committed `hooks.json` above is the source of truth.

### Alchemy prod and destroy
`alchemy destroy` ([docs](https://alchemy.run/cli/destroy/)) deletes **every resource in one stack + stage** (Workers, R2 buckets, D1 databases, Durable Objects, unless a resource was declared with `RemovalPolicy.retain()`). `--yes` skips the approval prompt. Stages are isolated ([docs](https://alchemy.run/environments/stages/)): each has its own state file and physical names, so `alchemy destroy --stage pr-147` does not touch `prod`. A bare `alchemy destroy` defaults to `live_$USER`, not prod.

The danger is an agent with local Cloudflare / Infisical credentials running `alchemy deploy --stage prod` (ships unreviewed code, using whatever secrets the laptop has) or `alchemy destroy --stage prod --yes` (irreversibly deletes production D1 / R2 / Durable Object state). `alchemy dev --stage prod` is also a live ⇄ local replacement of that stage. `alchemy nuke` enumerates and deletes everything a provider can see in the account, across stages.

So the shell guard denies prod/production deploy, destroy and dev, and denies `nuke`. It does **not** deny preview or personal-sandbox destroy (`pr-*`, `live_$USER`, `dev_$USER`), which CI and developers need.

### Relation to the other layers
| Layer | When | Scope | Can be skipped? |
|---|---|---|---|
| Cursor hooks | during an agent session | edited/changed files + Fallow new-only | yes (non-Cursor tools, hook failure fails open unless `failClosed`) |
| husky + lint-staged | `git commit` / `git push` | staged ESLint, plus (while small) `bun dedupe --check`, `bun test`, `svelte-check --tsgo` on pre-commit; `bun audit --audit-level=high` on pre-push (same command as CI) | yes (`--no-verify`, which the shell guard denies for agents) |
| CI | every PR | whole project | no: required checks |

## Open
- `stop` timing: is `fallow audit` fast enough on every stop once the codebase grows, or should `check.sh` run it only when `.ts`/`.svelte` files changed?
- Confirm the `Write` tool's `tool_input` path field when wiring `eslint-report.sh`.
