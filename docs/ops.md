# Ops: observability, logging, warm Workers, Automations, deps ledger

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided
- **Observability v1**: Workers Paid **Logs + Issues + Analytics Engine** `writeDataPoint` per Generate. **No Sentry in v1.** No `@effect/opentelemetry` NodeSdk on workerd.
- **Workers are not always-on**: rely on cache + a small isolate, not min-instances or cron pings. No cron ping of `/`.
- **Production exceptions**: Cloudflare Workers Issues → Cursor Automation → draft fix PRs. An **event** path, not a fourth scheduled hunt. Don't poll Logs from GitHub Actions.
- **Three scheduled Cursor Automations** (the cap is 3). Premium is required. Spend cap. PR creation off unless a run is explicitly allowed to open one draft digest. Never the cook model or Workers AI (Neurons are account-wide and would eat the gift). Details and cost: [factory.md](./factory.md).
  1. **Architecture hunt**: Pocock `improve-codebase-architecture`, issues only. Composer 2.5 standard (Fast off) unless changed. Cadence is Open.
  2. **Agent-friction retro**, the third Automation: **every 3 days**, reviewer **Grok 4.6 medium**, Fast off. Agents attach a redacted transcript; this job does the `/retro`-style review. About 10 runs/month; estimated list-price overage about US$2.10–$4.60/month.
  3. **Deps review**: monthly. It also keeps the exact versions in `package.json` current (see [ci.md](./ci.md#dependencies)).
- **Secrets manager: Infisical**, with Varlock as schema and loader (see [security.md](./security.md#secrets-and-environment-variables)). CI deploy jobs use Infisical OIDC. It holds the synthetic-check cookie (`SYNTHETIC_CHECK_COOKIE`) and preview-only secrets.
- **Domain: `chefllama.nz`**, on Coinnich's main Cloudflare account.
- **Synthetic check schedule (v1.1): GitHub Actions.** GitHub Actions `schedule` (outside-in, off-the-hour minute) + the post-deploy run + `workflow_dispatch`, rather than a Cloudflare Cron Trigger. GitHub can delay or drop scheduled runs at busy times (especially on the hour), and on public repos it disables scheduled workflows after 60 days without activity ([GitHub Docs: `schedule`](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), fetched 16 Nov 2026). The post-deploy run is the guaranteed one, and a monthly check confirms the workflow is still enabled. Details in [tests.md](./tests.md#synthetic-check).

### Logging
- One sanctioned logger, `src/lib/server/log.hazardous.ts`; `console` only in `.hazardous.` files and `scripts/*.mjs` (lint rules in [lint.md](./lint.md)). Full write-up with citations: `/workspace/spikes/lint-guardrails/LOGGING.md`.
- **Mechanics.** One sanctioned **hazardous** module, `src/lib/server/log.hazardous.ts`, holds the Effect Logger (flat object per entry) plus a `log.*` helper. Console is allowed only in `*.hazardous.ts` / `*.hazardous.svelte` / `*.hazardous.svelte.ts` files (plus `scripts/*.mjs`), so the hazardous-files CI flag catches new logging modules. Request annotations: `requestId`, `rayId`, `route` (= `event.route.id`), `stage`, `appEnv`, `userHash` (an HMAC, never the raw id).
- **Levels (detailed-logs switch).** `LOG_LEVEL` = `Info` on prod and `Debug` on `pr-{n}` previews and locally. Redeploy a stage with `LOG_LEVEL=Debug` to switch detailed logs on temporarily.
- **Sampling.** Logs `head_sampling_rate` is 1 on previews and 1 on prod at launch.
- **Scope.** No Tail Worker or Logpush in v1.
- **Client logging: none in v1.** The `hooks.client` `handleError` beacon is a **v2-or-later** option ([v2.md](./v2.md)).
- **Recommendations** (not yet ruled on):
  - **Durations:** `Effect.withLogSpan` now (they're free, on the same log object).
  - **Traces:** real traces only on `pr-{n}` previews when chasing performance, via Alchemy `Cloudflare.Telemetry()` (needs compat date ≥ 2026-07-28) or `observability.traces`. Sources: [Workers tracing](https://developers.cloudflare.com/workers/observability/traces/), updated 12 Nov 2026 (early beta; counts toward the same GB allowance from 1 Dec).
- **Over- vs under-logging:**
  - **Always log:** errors with context, auth and credit state changes, AI calls (model, tokens, latency), cache-guard hits and Stripe webhooks.
  - **Never log:** PII, secrets, full prompts or recipes (log a length or hash), bodies, or per-item loop lines.
  - **Limits:** cut noise before sampling (sampling also drops errors). 256 KB per request is shared by all logs, so one big dump can hide an error.
- **Pricing.** Until 30 Nov 2026, Paid includes 20M log events/mo (+$0.60/M) with 7-day retention, and Free gets 200k/day with 3-day retention. From 1 Dec 2026 [Cloudflare Observability pricing](https://developers.cloudflare.com/observability/pricing/) (updated 11 Nov 2026) applies:
  - Paid: 50 GB ingestion/cycle (+$0.25/GB) plus 10 GB-month storage (+$0.10).
  - Free: 0.5 GB/day, then ingestion stops until 00:00 UTC.
  - So entry size matters.
- **Still to check on the first preview:** does `Website.SvelteKit` pass `observability` through, and is `cf-ray` on incoming requests?

### Agent skills
- Matt Pocock's skills, which ones and how they are installed: [skills.md](./skills.md). There is no deslop skill; ESLint does that job (see [lint.md](./lint.md#eslint-plugin-slop-kept)).

## Open
- **Domain spelling check:** confirm the exact registered spelling in the Cloudflare dashboard before anything is wired up (Custom Domains, Access, WAF, DNS/mail records, OAuth clients, Stripe webhook). The project Gmail's Cloudflare verification email (14 Nov) said `cheflamma.nz`.
- **Architecture hunt cadence:** fortnightly or weekly.
- Tracing: previews only, on demand (recommended above).
- Rotation owner for Infisical secrets, and how bots get Infisical-managed values.
- Confirm in the **web** Automations picker that Grok 4.6 + medium + Fast off is selectable for the retro.
- Monthly deps review format: keep, replace with a browser/Kit/Cloudflare built-in, or go leaner.
- Post-deploy `CF-Cache-Status: HIT` assert (later).
