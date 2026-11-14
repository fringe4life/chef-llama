# Warn on purchase if the browser cannot run Larder chrome; noscript in `app.html`

**Status:** accepted (round 26 Q1–Q2). **Living detect list** — add a `CSS.supports` / IDL check when Site CSS starts depending on a new API (anchor, container queries, …). Do not freeze a forever set.

We ship native **`<dialog>`**, **Popover**, **`light-dark()`** (no `.dark`), and later Popover+anchor. Customizable `<select>` (`appearance: base-select`) is **not Baseline** (Firefox flags; Safari 27 / Chrome 135) and MDN warns of SSR/hydration issues — **Packs are three buttons**, not a select.

**Purchase gate (exhausted dialog, before Checkout Session):** `CSS.supports('color', 'light-dark(red, blue)')` ∧ `showModal` on `HTMLDialogElement` ∧ `'popover' in HTMLElement.prototype` ∧ `sessionStorage`. **Warn** and **do not** create a Session if any fail. Do **not** UA-parse. Do **not** use the Stripe.js browser matrix (Chrome 38+) — we have **no Stripe.js**; hosted Checkout is Stripe’s page. Anchor and container queries are chrome, not this gate.

**noscript:** native `<noscript>` in Kit [`app.html`](https://svelte.dev/docs/kit/project-structure), not a `.svelte` file. Copy: Site remains readable; cooking, sign-in, and buying Credits need JS. `csr=false` Site ships no Kit client ([page options](https://svelte.dev/docs/kit/page-options)); Popular is SSR HTML so it still renders. `csr=true` App hydrates or it does not cook.

[round 26](../../internal/research-round26-checkout-detect-noscript.md).
