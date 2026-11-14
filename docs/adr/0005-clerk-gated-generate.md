# Signed-in session required to Generate

**Status:** superseded by [0036](./0036-better-auth-on-d1.md) (14 Nov 2026). The **login gate stays**: Generate requires a signed-in session; no Guest ledger DO.

Kill the Guest ledger DO. Generate requires a signed-in session. Marketing may advertise limited free recipes/day (operator Neurons, FCFS) but must not offer anonymous inference. Operator is an individual: **no signup Credits**; FCFS is the 10k Neurons/day gift bounded by per-Generate `max_tokens`. Supersedes [0003](./0003-guest-tries.md).

Provider, methods, and session storage: [ADR 0036](./0036-better-auth-on-d1.md) (Better Auth on D1). Historical Clerk/`svelte-clerk` notes are obsolete.
