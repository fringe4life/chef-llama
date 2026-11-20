# Software factory: architecture hunt and agent-friction review

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. Lint outlets are in [lint.md](./lint.md); production observability stays in [ops.md](./ops.md); Actions hardening in [ci.md](./ci.md).

This is the recurring **outlet** for agent work. Comments and raw `$effect` are banned; agents instead attach a redacted transcript (or export/summary) at the end of each run, and a cron **reviewer** — not the implementer — turns repeated friction into lint rules, tests, skills, or architecture changes. Doc files stay few.

## Decided

- **There is no GitHub Actions “architecture cron” on `main` today.** The repo has no `.github/workflows` yet. The planned hunts are **Cursor Automations**.
- **Three scheduled Automations** (Coinnich, 16 Nov 2026; cap raised from 2). They are:
  1. **Architecture hunt** — skill = Pocock `improve-codebase-architecture`, **issues only**, **PR creation off**. Model still **Composer 2.5 standard** (Fast off) unless that is later changed. Cadence (fortnightly vs weekly) is Open.
  2. **Agent-friction retro** — the third, **separate** Automation, **every 3 days**, reviewer model **Grok 4.6 medium**, **Fast off**. (~10 runs a month.) Daily would be ideal but costs too much. Agents are the main code writers and need this built-in outlet. Folding retro into the architecture hunt is rejected (different model, prompt and cadence).
  3. **Deps review** — monthly; it also keeps the exact `package.json` versions current (see [ci.md](./ci.md#dependencies)).
- **No slop cron.** Prod exceptions (Workers Issues → Cursor → draft fix PR) stay a separate **event** path; do **not** poll Workers Logs from GitHub Actions (see [ops.md](./ops.md)). Hunts must not use the cook model or Workers AI (Neurons are account-wide). Premium is required. Hunts do not use a Site-Worker Cron Trigger.
- **Do not rely on self-review alone.** The implementer stores a **redacted transcript, export, or summary**. The 3-day reviewer applies `/retro`-style criteria to those sources plus CI / review / disable / revert signals. Self-review does not grade its own friction.
- **Transcript store:** redacted files under **`.agents/retros/` on the PR branch**. Layout: `.agents/retros/<date>-<pr-or-sha>-<agent_id>.jsonl` plus a matching `.meta.yml` (pointers, hashes, redaction status). Short pointer in the PR body only (GitHub’s practical body cap is about **65,536** characters — too small for a transcript). Do **not** merge `.agents/retros/` to `main` (keeps docs few; the reviewer reads the PR head ref). Optional Actions artifact backup (`retention-days: 30`; platform default is 90 days). Not a gist or a long-lived extra branch.
- **Redact first** (gitleaks and/or trufflehog patterns, plus generic email, token and key patterns; personal identifiers load at runtime from the `REDACT_DENYLIST` secret, never written in the repo) — the repo is public. Replace hits with `REDACTED-<kind>` and record `redacted: true` in `.meta.yml`. If redaction fails, do not store the file.
- **Export size:** default is a redacted full-enough export (user/assistant text, tool names, short tool results). Design cap ~**80,000 tokens** (~320 KB text); above that, keep a structured summary plus friction excerpts. Do not silently ship an unredacted dump over the cap.
- **Export paths** (verified against Cursor docs, 16 Nov 2026): prefer `CURSOR_TRANSCRIPT_PATH` in a `stop` hook when transcripts are enabled ([Hooks](https://cursor.com/docs/hooks)); else v0 `GET /v0/agents/{id}/conversation` if a Cursor API key is in the environment (do not commit a key; [v0 API](https://cursor.com/docs/cloud-agent/api/v0)); always-available fallback is an end-of-run structured export. v1 has no REST transcript route; the SSE stream expires.
- **Reviewer model availability:** official Automations docs say “You can select which model the cloud agent uses for your automation” ([Automations](https://cursor.com/docs/cloud-agent/automations)). The Grok 4.6 help page lists it as available in Automations ([help](https://cursor.com/help/models-and-usage/grok-4-6)). On Premium, **Fast is the default** speed tier and must be turned **off**. Effort **medium** must be set explicitly (named-model default is **high**). Confirm the **web** picker at cursor.com/automations when first wired; if medium is missing, pick Grok 4.6 standard at the lowest offered effort and record the gap — do not silently fall back to Composer 2.5 without OK.
- **Reviewer inputs:** `.agents/retros/` on PR heads in the window; optional artifact backup; CI failures/reruns; PR review threads; `eslint-disable` / `@ts-expect-error` / `*.hazardous.*` diffs; reverts; open issues for dedupe. Cap **five** proposals; stay silent if nothing clears the threshold. Output is one draft issue or one draft PR. Each proposal is a lint, test, skill, or architecture change — never a code comment and never a new sprawling doc.
- **No comment or doc sprawl.** Proposals become lints, tests, skills, or architecture changes. Topic files stay few. Nothing merges without Coinnich’s yes. Bot commits, if any, are co-authored `Coinnich <chefllamanz@gmail.com>` (never a personal address).
- Pocock `/retro` is a real, user-invoked skill (`disable-model-invocation: true`) at https://github.com/mattpocock/skills/blob/main/skills/engineering/retro/SKILL.md (fetched 16 Nov 2026). The factory job is closer to his in-progress **Retro task** than to the architecture survey.
- **Monthly retro cost (estimate, ~10 runs):** list price beyond the weekly Cursor-model pool, Grok 4.6 standard (Fast off, $2 / M input, $0.50 / M cached input, $6 / M output; Fast is $4 / $1 / $12 — do not use Fast): **~US$2.10–$4.60 / month** for tight (~80k in + 8k out, ~$0.21/run) to large (~200k in + 10k out, ~$0.46/run) packs. Inside the Premium weekly pool, cash overage may be $0, but these runs share the pool with the editor. Architecture-hunt cost is separate and depends on its cadence.

## Open

- **Architecture hunt cadence:** fortnightly or weekly (the retro is decided: every 3 days, as the third Automation).
- Whether the architecture hunt stays on Composer 2.5 now that retro is on Grok 4.6 medium.
- Confirm in the **web** Automations picker that **Grok 4.6 + medium + Fast off** is selectable.
- Digest shape: standing issue vs new draft issue vs one draft PR.
- Collector + webhook vs letting the Automation call `gh` itself. Optional GHA collector (no model) as an evidence pack for the retro.
- Whether hook transcripts are actually enabled on Chef Llama cloud agents (`CURSOR_TRANSCRIPT_PATH`).
- Exact pre-merge deletion of `.agents/retros/` (checklist vs CI), and the redaction tool pin (gitleaks vs trufflehog, or both).
- Write the `Co-authored-by: Coinnich <chefllamanz@gmail.com>` rule into a topic file so agents do not have to remember it.
