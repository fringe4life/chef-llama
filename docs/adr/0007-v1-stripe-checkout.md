# v1 hosted Stripe Checkout packs into the Credit DO

**Status:** accepted (round 9 Q1 — Stripe you-MoR; round 12 — **NZD only**; round 16 Q5 — **SKU dollars locked**).

Packs are **hosted** Checkout on the **Jobs Worker**, **`currency: nzd`**. **No Stripe.js**. **No intl storefront.** Webhook → Credit DO. Polar / Paddle / Lemon / Clerk Billing / Managed Payments rejected.

**Tax Basic:** Dashboard Tax **on**. Checkout `automatic_tax` **off** until GST-registered. Individual **must** register at **NZ$60k** (past or expected 12 months) **or** if adding GST to prices; **may** register earlier ([IRD](https://www.ird.govt.nz/gst/registering-for-gst), [voluntary](https://www.ird.govt.nz/gst/registering-for-gst/registering-for-gst-voluntarily)). Pack copy has **no GST** until then.

**Profit floor (round 13–14):** Workers Paid **USD $5** ≈ **NZ$8.79** (RBNZ 23 Oct 2026 NZD/USD 0.56890). Better Auth **$0** (no per-user fees). Rec **`max_tokens` 768** (512 is tight on fat 8-step JSON). fp8 after gift ≈ **NZ$0.00045**/Generate at 250 in / 768 out. Stripe **2.65% + NZ$0.30** still dominates. Ladder **locked: NZ$8 / NZ$16 / NZ$32 → 20 / 50 / 120 Credits**. Stripe **2.65% + NZ$0.30** still dwarfs AI (~NZ$0.00045/Generate after gift). [round 14](../../internal/research-round14-tokens-byo-writes.md) · [round 17](../../internal/research-round17-scale-popular-lock.md).

**Old browser (round 26 accepted):** living feature-detect on the exhausted dialog **before** Session create — not Stripe.js’s Chrome 38+ list (we have **no Stripe.js**). [ADR 0025](./0025-checkout-feature-detect.md).

**Price IDs (round 16 rec):** Dashboard Product **Larder Packs** + three **one-time NZD** Prices with `lookup_key` `pack_a` / `pack_b` / `pack_c`. Checkout `line_items[0][price]` = Price id from `prices.list({ lookup_keys })` (or Infisical-cached `STRIPE_PRICE_PACK_*` per test/live mode). **No** `price_data` for SKUs (inline Prices are not reusable). Webhook maps lookup_key → Credit count. Do not commit `price_…` ids. [round 16](../../internal/research-round16-jev-secrets-fonts-diet-stripe.md) · [lookup keys](https://docs.stripe.com/products-prices/manage-prices).
