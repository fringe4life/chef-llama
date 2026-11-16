# Cursor hooks: Fallow, lint and other checks for agents

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Git hooks (husky + lint-staged) are in [lint.md](./lint.md#pre-commit-husky--lint-staged); CI is in [ci.md](./ci.md).

Source: Cursor docs, [Hooks](https://cursor.com/docs/agent/hooks) (read 16 Nov 2026 NZDT). Event names, fields and limits below are from that page, not from memory.

## Decided

### What Cursor hooks are
- Scripts that Cursor runs at fixed points of the agent loop. They are configured in a **project `.cursor/hooks.json`** (committed), get JSON on stdin and answer with JSON on stdout. Project hooks run from the repo root, so script paths are `.cursor/hooks/<name>.sh`. Cursor reloads `hooks.json` on save.
- Exit code `0` uses the JSON output; exit code `2` **blocks** the action (same as `permission: "deny"`); any other failure **fails open** unless the hook sets `failClosed: true`.
- Per-hook options used here: `command`, `timeout` (seconds), `matcher` (regex), `loop_limit` (for `stop`, default 5) and `failClosed`.
- **Cloud agents** run project command hooks from `.cursor/hooks.json`, including `afterFileEdit`, `beforeShellExecution`, `postToolUse` and `stop`. They do **not** run `sessionStart`/`sessionEnd`, the MCP hooks or user-level `~/.cursor/hooks.json`, and hooks don't run during a cloud agent's early read-only turns. So everything below lives in the project file and uses only those events.

### The hook set
Why: agents get lint and Fallow feedback **while they work**, instead of at commit or in CI. husky is the commit-time net and CI is the gate; the three layers run the same ESLint config.

```json
{
  "version": 1,
  "hooks": {
    "afterFileEdit": [
      { "command": ".cursor/hooks/eslint-fix.sh", "timeout": 30 }
    ],
    "stop": [
      { "command": ".cursor/hooks/check.sh", "timeout": 240, "loop_limit": 3 }
    ],
    "beforeShellExecution": [
      {
        "command": ".cursor/hooks/guard-shell.sh",
        "matcher": "--no-verify|HUSKY=0|push (-f|--force)",
        "failClosed": true
      }
    ]
  }
}
```

| Event | Script | What it does |
|---|---|---|
| `afterFileEdit` (input: `file_path`, `edits`) | `eslint-fix.sh` | If `file_path` is `.ts`/`.js`/`.svelte` (or `.md`/`.json`/`.css`), run `bunx eslint --fix --cache "$file_path"`. Silent: it only applies safe autofixes; it cannot block or message the agent. Always exits `0`. |
| `stop` (input: `status`, `loop_count`) | `check.sh` | When the agent finishes (`status: "completed"`): `bunx eslint --cache --max-warnings=0` on changed files (`git diff --name-only HEAD` plus untracked), then `bunx fallow audit --quiet` (new issues only, as in the PR gate). If anything fails, print `{"followup_message": "<trimmed errors>. Fix these, then stop."}` so Cursor sends it as the next message; otherwise print `{}`. `loop_limit: 3` stops endless fix loops. |
| `beforeShellExecution` (input: `command`; matcher on the command text) | `guard-shell.sh` | Deny commands that skip the Git hooks or force-push: answer `{"permission": "deny", "agent_message": "Don't skip hooks or force-push; fix the lint error instead."}`. `failClosed` so a crashed guard blocks rather than allows. |

- **Not in the hooks:** `svelte-check`, Vitest and Playwright. `svelte-check` and Vitest are too slow for every stop and stay in CI (agents run them on demand); Playwright needs a deployed preview (see [tests.md](./tests.md#playwright)).
- No Ultracite/Biome hooks copied from other projects: the hooks run this repo's ESLint and Fallow only.
- Scripts are small POSIX `sh` with `jq` for JSON, committed next to `hooks.json`, and made executable.
- Cursor's built-in `/create-hook` skill can scaffold changes, but the committed `hooks.json` above is the source of truth.

### Relation to the other layers
| Layer | When | Scope | Can be skipped? |
|---|---|---|---|
| Cursor hooks | during an agent session | edited/changed files + Fallow new-only | yes (non-Cursor tools, hook failure fails open) |
| husky + lint-staged | `git commit` / `git push` | staged files | yes (`--no-verify`, which the shell guard denies for agents) |
| CI | every PR | whole project | no: required checks |

## Open
- `stop` timing: is `fallow audit` fast enough on every stop once the codebase grows, or should `check.sh` run it only when `.ts`/`.svelte` files changed?
- Use `postToolUse` with `additional_context` to report remaining ESLint errors right after each edit (the docs list `additional_context` as a `postToolUse` output) instead of waiting for `stop`? Needs the `Write` tool's input field for the path confirmed.
- Whether to add a `beforeShellExecution` guard for `alchemy deploy --stage prod` / `alchemy destroy` from agents.
