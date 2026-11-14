# Reconsider guest Generate (do not silently reverse the login gate)

**Status:** Proposed (not locked). **Current lock stays until Coinnich picks otherwise:** Generate is signed-in only; **no Guest ledger DO** ([ADR 0005](./0005-clerk-gated-generate.md) gate; [ADR 0036](./0036-better-auth-on-d1.md) provider). Preference: login-gated free tries over anonymous Guest DOs.

Anonymous inference was dropped in round 4 to keep the codebase simple (three Guest tries on a Guest DO, [ADR 0003](./0003-guest-tries.md), superseded). Competitors still ship a free first Recipe with no account: DishGen (1 guest generate then wall), FridgeToCook / Ingredient Leftover Chef (unsigned POST), Create & Cook (Coinnich note; not re-probed here).

## Options

| | What | Abuse | Diet | Cost |
|---|---|---|---|---|
| **(a)** | Capped guest Generate gated on the **daily Neuron budget** (same 10k gift / FCFS). Rec cap **1** then sign-in wall. Turnstile on Generate. **No Guest DO** — cookie + Turnstile + gift-pool DO (#76). | Turnstile + gift-pool + operator daily cap (#20). IP is not the cap. | Still **required** before first Generate: ephemeral Diet in `sessionStorage`, same fields as the blocking dialog. Hard constraints still swap. | granite is cheap per Recipe; abuse still drains the individual Neurons gift. |
| **(b)** | One free Recipe per **device or IP**. | Trivial to rotate. NAT shares punish libraries / offices. **Do not pick (b).** | Same Diet problem as (a). | Same drain, worse fairness. |
| **(c)** | **Keep sign-in required** (current lock). Google / Apple / email OTP / Facebook, then FCFS Neurons, Diet dialog, Generate. | Better Auth session. No anonymous AI. | Diet DO as locked. | No extra anonymous burn. |

## Rec

**(c) for v1.** Diet-before-Generate, public-by-URL writes, Credit/Diet/Saved DOs, and Turnstile-free cook path stay one signed-in pipeline. OTP/social is the free trial.

If Coinnich wants conversion parity with DishGen: pick **(a), not (b)**. Still no Guest ledger DO. Guest Recipes stay public-by-URL (ADR 0032) but **must not** fill Popular except via later signed-in saves ([ADR 0034](./0034-popular-cap-cache.md)). Save stays login-walled.

Do **not** grant complimentary signup Credits as a substitute for guest Generate ([#21](https://github.com/fringe4life/chef-llama/issues/21) stays).

## Open questions

- If (a): 1 vs 3 guest Recipes? Bind to Turnstile token, cookie, or both?
- Guest Diet: `sessionStorage` only, or a short-lived KV row keyed by Turnstile?
- Do guest Creates appear in sitemap / Latest, or `noindex` until Save-after-sign-in?
- Managed Turnstile siteverify on the Jobs/Site Worker — accept the extra binding?

Issue [#92](https://github.com/fringe4life/chef-llama/issues/92).

Related: #20 operator cap, #21 no signup Credits, #28 Diet before Generate, #40 `/sign-in`, #76 gift-pool DO.
