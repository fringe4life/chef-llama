# Payments and Credits: Stripe packs, free-cook pool, tax, topup

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not.

## Decided

### Stripe
- Stripe with Chef Llama as merchant of record, **hosted Checkout** on the Jobs Worker, **`currency: nzd`**. No Stripe.js, no international storefront, no Customer Portal, no subscriptions. Webhook → Credit DO.
- Rejected: Polar, Paddle, Lemon Squeezy, Clerk Billing, Stripe Managed Payments.
- Packs are **locked**: NZ$8 / NZ$16 / NZ$32 → **20 / 50 / 120 Credits**. One Dashboard Product named **"Chef Llama Packs"** with three one-time NZD Prices, `lookup_key` `pack_a` / `pack_b` / `pack_c`. No `price_data`.
- Fees: 2.65% + NZ$0.30 domestic. Workers Paid US$5 ≈ NZ$8.79/mo.
- Webhook: served on the production Custom Domain `https://chefllama.nz/<stripe-webhook-path>` so WAF rule W1 applies; signature verified and idempotent on `event.id` (see [security.md](./security.md#stripe-webhook-delivery)).

### Credits and free cooks
- **No signup Credits.** Free cooks come first-come-first-served from the 10k Neurons/day gift via the **pool DO**, with a per-user free-cook cap of 3/day.
- **Publish:** free-tier recipes are **published to Recent by default**; Cooks who have bought Credits / packs may **opt out** (private). Explain on `/onboarding` and cook pages ([product.md](./product.md#publish-and-privacy)).
- **Daily limits reset at 00:00 UTC**: the gift, the per-user free-cook cap, and guest Generate if it is ever enabled. Pool DO day key and reset alarm at 00:00 UTC.
- Charge: Credits are **held, then settled or released** (see [data.md](./data.md#write-path-v1)). 1 Credit = 1 Recipe once the gift is gone. Viewing and saving are free.
- Credit DO ledger: idempotent on Stripe `event.id` / `jobId`, with materialized balances (see [data.md](./data.md#durable-objects)).

### Topup
- When Credits run out, a **dialog** offers the three packs and goes to Checkout, with the pantry kept in `sessionStorage`. No `/topup` page.
- Feature-detect before creating the Checkout Session (purchase is the only place we warn about an old browser; never UA-parse):
  - `CSS.supports('color', 'light-dark(red, blue)')`
  - `'showModal' in HTMLDialogElement.prototype`
  - `'popover' in HTMLElement.prototype`
  - `'sessionStorage' in window` (pantry restore)
- A failed detect creates **no Session** and shows: "This browser is too old for Chef Llama. Update Chrome, Safari, or Firefox, then buy Credits."
- Not gated: customizable select (`appearance: base-select`); packs are three buttons. Stripe.js browser support is irrelevant (no Stripe.js).
- The gate is a **living list**: add a check when a feature becomes load-bearing for a page that cannot degrade; remove one when it stops discriminating; prefer degradation to refusal; re-verify browser-support citations against MDN BCD after about 6 months.
- `noscript` in `src/app.html`: "JavaScript is off. You can still read this page. Cooking, signing in, and buying Credits need JavaScript."

### Free-cook status
- Two things, not one figure: **availability** (a boolean: is free cooking being given out right now?) and **the user's own count** (`3 − cooksToday`). No shared remaining figure is exposed in the API or copy.
- Read: `GET /free-cooks` → `{ available, resetsAt }`, unauthenticated with nothing user-specific, cached 30–60 s in Workers Cache. The personal count rides on the Credit DO read the account page already makes.
- Write: the pool DO claims a unit conditionally and atomically (`UPDATE … WHERE used < cap RETURNING used`) in the same transaction as the idempotency key; an empty result means the claim lost.
- **The cached boolean is display only** and never authorizes a charge. On a lost claim, show "free allowance unavailable" and let the user explicitly choose to spend a Credit.
- UI states: Available (**3** left today + 3-slot meter, `Cook free`), Few left (**1** left, `Cook free`), None ("No free cooks today", `Cook`), Lookup failed ("Couldn't check", `Try again` only, no cook action). Each shows the reset time: 00:00 UTC in the visitor's local time. No backend vocabulary in copy.
- Free cooks and pack Credits are separate allowances: a free cook never debits Credits, and buying a pack never changes the boolean.

### Tax
- Must GST-register at NZ$60k (past or expected 12 months) or if adding GST to prices. Stripe Tax Basic alerts on; Checkout `automatic_tax` off until registered. Not legal advice.

### Receipts and refunds
- Stripe automatic receipts carry the same Chef Llama mark. Packs are never refunded through product flows.

## Open
- Free-cook UI: the zero-balance state (no free cooks and 0 Credits means the action is top-up, not cook), and whether the "Use 1 Credit" confirmation after a lost claim lives in the Cook flow or the account page.
- **Starter pack** (proposed): NZ$4 → 10 Credits (same per-Credit price as `pack_a`), `lookup_key` `pack_starter`, once per `user.id`, tracked by a `starter_pack_granted_at` flag on the Credit DO written in the same SQL transaction as the ledger credit (not a D1 column). Checkout Session create is refused once the flag is set; webhook retries never grant twice or clear the flag. Shown first on the exhausted dialog and `/account/packs` until used. Still to pick: NZ$4/10 vs NZ$6/15; whether to show it while free cooks remain; whether a refund clears the flag.
- **Credit expiry and burn order.** Nothing says whether a pack expires. Neither Stripe's customer balance nor Billing credit grants (subscription-only) can hold a per-pack expiring wallet, so if packs expire, expiry and FIFO burn order live in the Credit DO and the account page needs an expiry horizon. If they don't, the ledger is just a receipt list.
- Stripe webhook path, and which Worker serves it (Jobs or Site). Before registering it in Stripe, confirm the exact registered domain spelling in the Cloudflare dashboard (see [ops.md](./ops.md#open)).
