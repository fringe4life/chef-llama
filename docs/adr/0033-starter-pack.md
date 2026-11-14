# Once-only **Starter pack** (paid trial SKU)

**Status:** Proposed (not locked). Does **not** grant complimentary signup Credits.

A cheap first buy after sign-up, **once per Better Auth `user.id`**. Name it **Starter pack** everywhere (not “starter credit pack”).

## Why

Locked ladder is NZ$8 / 20, NZ$16 / 50, NZ$32 / 120 ([ADR 0007](./0007-v1-stripe-checkout.md)). A smaller cash outlay is a trial before those packs. NZ$4 for **4** Credits (~NZ$1/credit) is too steep next to pack_a (~NZ$0.40/credit). A tiny SKU that can be bought forever also burns Stripe’s **NZ$0.30** fixed fee.

Locked and unchanged: NZD, you-MoR, hosted Checkout, no Stripe.js, no Portal, no subscriptions. [ADR 0007](./0007-v1-stripe-checkout.md) · [#84](https://github.com/fringe4life/chef-llama/issues/84).

## Rec

| | |
|---|---|
| SKU | **NZ$4 → 10 Credits** (`lookup_key` `pack_starter`). Same $/credit as pack_a. |
| Who | Signed-in Cooks who have never been granted this SKU. |
| Once | Credit DO flag `starter_pack_granted_at` (or boolean) in the **same SQL tx** as the ledger credit. |
| Checkout | Jobs Worker refuses Session create if the flag is set. Webhook `checkout.session.completed` → `credit(10, event.id)` **idempotent** on Stripe `event.id` (same pattern as pack_a/b/c). Retry must not grant twice and must not clear the flag. |
| UI | First button on the exhausted dialog **and** `/account/packs` until granted. After grant, only pack_a/b/c. Not a fourth forever refill. |
| Flag store | **Credit DO**, not a D1 `users` column. Credits already live there; dashboard must not hit global D1 ([ADR 0030](./0030-per-user-credit-dos.md)). |

## Contrast — do not silently reverse

Locked preference: **no complimentary signup Credits**; FCFS Neuron cap only ([ADR 0005](./0005-clerk-gated-generate.md) · [#21](https://github.com/fringe4life/chef-llama/issues/21)). Starter pack is **paid**. An alternative Coinnich can still choose: N free Credits when Diet is completed. That **would** reverse #21 — ask, do not sneak it in.

## Open questions

- NZ$4 / 10 vs NZ$6 / 15?
- Show while FCFS Neurons still remain, or only once the gift is gone?
- Refund of Starter pack (locked today: Stripe Pack never refunded) — does a Dashboard refund clear the flag?

Issue [#89](https://github.com/fringe4life/chef-llama/issues/89).

Related: #18 Checkout, #21 no signup Credits, #41 topup, #58 lookup_key, #84 `/account/packs`. Polar issue #24 used the word “Starter” for **fees** — not this SKU.
