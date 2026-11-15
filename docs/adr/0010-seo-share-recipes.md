# v1 SEO: index the Site, share Recipes, noindex the farm; search yes / train no

**Status:** accepted for index/share/`noindex` (round 8; no svelte-seo). **Accepted (round 20)** robots + Cloudflare AI policies + Workers Cache for crawlers.

SEO is v1. Prerender `/` `/terms` `/privacy`. Every v1 Generate writes a **public-by-URL** Recipe ([ADR 0032](./0032-public-by-url-recipes.md)); `/recipes/[id]` is **public unauthenticated SSR** so unfurlers read OG from `<svelte:head>` (`og:url` undecorated). Those URLs are **`noindex`** except Popular. No privacy picker — a private Recipe store is v2. v1 `og:image` is a **static meal SVG**. Do **not** add [`svelte-seo`](https://www.npmjs.com/package/svelte-seo). Do not add workers-og WASM. No share tokens. `/pantry` `/saved` stay session-gated. Deleted recipe URLs return **410** ([ADR 0036](./0036-better-auth-on-d1.md)).

<!-- Sources: round 8 + round 20 robots/cache; round 49 Q1 public-by-URL. -->

**robots.txt (origin `+server`):** Disallow `/pantry` `/saved` `/sign-in`. Disallow **training** tokens: `GPTBot`, `Google-Extended`, `CCBot`, `ClaudeBot`, `Applebot-Extended`. Do **not** `Disallow: /` for `*`. Search tokens stay allowed by default: `Googlebot`, `bingbot`, `OAI-SearchBot`, `Claude-SearchBot`, `Applebot`. Do not Disallow `ChatGPT-User` / `Claude-User` (user-triggered fetch; OpenAI: robots **may not apply**). Sitemap URL on the same file.

**Cloudflare:** AI bot policies — Search **Allow**, Agent **Allow**, Training **Disallow**, Bot Preference Sync **on** (prepends Content Signals `search=yes, ai-train=no, use=reference` + managed training Disallows). AI Crawl Control to enforce training blocks. **Bot Fight Mode off** on Free (cannot skip; can challenge crawlers). Super Bot Fight Mode is Pro+; if ever on, Verified bots **Allow**.

**Cache:** Site Worker [Workers Cache](https://developers.cloudflare.com/workers/cache/) Alchemy `cache: { enabled: true }`. HIT skips the Worker (no D1/KV/Vectorize). **Default deny** `private, no-store` — the only way to cache is `publicCache` ([ADR 0037](./0037-zero-js-public-cache-guardrails.md) · [caching.md](../caching.md)). Public HTML uses `Cache-Control: public, max-age=B` + `Cloudflare-CDN-Cache-Control` (edge + optional SWR) — **not** `s-maxage` together with SWR (`s-maxage` disables stale serving). Tags `popular` / `popular-top` / `popular-{type}` / `recipe-{id}`; Jobs Worker cron snapshot purges **changed** tags only. No `Set-Cookie` / `Vary: Cookie` on public GET. Zone purge does not clear Workers Cache. Cold cache on each deploy.

Sources: [round 20](../../internal/research-round20-robots-ai-crawl-cache.md) · [#22](https://github.com/fringe4life/chef-llama/issues/22) · [#88](https://github.com/fringe4life/chef-llama/issues/88).
