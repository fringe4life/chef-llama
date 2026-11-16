# Agent skills: Matt Pocock's skills in the repo

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Automations that use these skills are in [factory.md](./factory.md) and [ops.md](./ops.md).

Sources (read 16 Nov 2026 NZDT): the [mattpocock/skills README](https://github.com/mattpocock/skills) at commit `5863806` (12 Nov 2026), the `skills` CLI 1.8.1 README and agent table, and Cursor's [Agent Skills](https://cursor.com/docs/context/skills) docs.

## Decided

### Where skills live
- Skills are committed to the repo in **`.agents/skills/`**. Cursor loads project skills from `.agents/skills/` and `.cursor/skills/`. It does **not** copy `~/.agents/skills/` (or unsynced `~/.cursor/skills/`) to Cloud Agents, so anything an agent on a cloud or self-hosted worker needs must be in the repo.
- Not in a Project Agent Store or a team marketplace.

### Install (the README's method)
- The README's install for Cursor ("any other agent, or editable files") is the `skills` CLI, which copies editable files into the project:
  ```bash
  npx skills@latest add mattpocock/skills@5863806dd4e15c63174bee4e7515a4256792ecfa -a cursor \
    --skill setup-matt-pocock-skills --skill grilling --skill grill-with-docs \
    --skill domain-modeling --skill writing-for-agents --skill research \
    --skill codebase-design --skill improve-codebase-architecture --skill tdd --skill retro
  ```
  For Cursor the CLI installs to `.agents/skills/<name>` and records each skill with a content hash in `skills-lock.json`. Commit both.
- Pin to a commit (as above), in line with exact versions everywhere (see [ci.md](./ci.md#dependencies)). Update deliberately: `npx skills@latest update`, review the diff, commit. The monthly deps review checks for upstream changes (see [factory.md](./factory.md)).
- Use the CLI only, not also a plugin; the README warns that installing both gives every skill twice.
- Then run **`/setup-matt-pocock-skills` once**. It asks for the issue tracker, triage labels and where docs live. Answers for this repo:
  - issue tracker: GitHub `fringe4life/chef-llama` (tasks only);
  - docs: **the topic files in `docs/`** plus `docs/GLOSSARY.md`. **No separate decision-record files or folder.** Two of these skills (`grill-with-docs`, `domain-modeling`) write numbered architecture decision records by default; in this repo they record a decision in the relevant topic file's **Decided** section instead, and `AGENTS.md` says so.

### Which skills
| Skill | Why |
|---|---|
| `setup-matt-pocock-skills` | One-time repo setup (above). |
| `grilling`, `grill-with-docs` | Align on a plan before building; `grill-with-docs` also sharpens the glossary. |
| `domain-modeling` | Keeps `GLOSSARY.md` terms tight (with topic files instead of decision records). |
| `writing-for-agents` | For editing `AGENTS.md`, skills and topic files. |
| `research` | Cited research notes from primary sources. |
| `codebase-design`, `improve-codebase-architecture` | Deep modules at clean seams; the architecture-hunt Automation runs `improve-codebase-architecture` (see [factory.md](./factory.md)). |
| `tdd` | Red-green-refactor at the test seams in [tests.md](./tests.md). |
| `retro` | The agent-friction retro Automation (user-invoked skill, see [factory.md](./factory.md)). |

- **Not installed:** the issue-process skills (`to-spec`, `to-tickets`, `triage`, `wayfinder`, `implement`, `implement-spec`), because tasks and decisions are handled by the topic-file model; `misc/setup-pre-commit` (it sets up Prettier, and this repo's pre-commit is ESLint via lint-staged, see [lint.md](./lint.md#pre-commit-husky--lint-staged)); `misc/git-guardrails-claude-code` (Claude Code only; the Cursor shell guard covers it, see [cursor-hooks.md](./cursor-hooks.md)).
- **No "deslop" skill.** Its job (cleaning up AI-style code) is done by **ESLint**: `eslint-plugin-slop` plus the `chef/*` rules and the rest of the config, enforced in the editor, the Cursor hooks, pre-commit and CI (see [lint.md](./lint.md#eslint-plugin-slop-kept)). It is also no longer in the upstream repo.

## Open
- Whether to add `diagnosing-bugs` and `prototype` now or when first needed.
- Whether `/setup-matt-pocock-skills` can be told "no decision records" cleanly, or whether its output (`docs/agents/*`) needs a hand edit after it runs.
