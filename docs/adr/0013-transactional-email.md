# OTP, Stripe receipts, product mail — one mark

**Status:** accepted (round 9 Q5). OTP **sender** superseded by [0036](./0036-better-auth-on-d1.md) (14 Nov 2026): no longer Clerk; **TODO** Cloudflare Email Service vs Resend.

Same **Site-hosted logo URL** in OTP HTML, Stripe Email-receipt branding + public details, and product-mail HTML. **Reply-To** / project contact = `chefllamanz@gmail.com`. From for OTP = `no-reply@mail.<domain>` once a domain we own is chosen (`gmail.com` cannot be verified sending). Pack receipts stay Stripe. Need-topup / cancel = same product-mail sender as the OTP TODO. Email clients ignore `light-dark()` — inline hex in HTML.
