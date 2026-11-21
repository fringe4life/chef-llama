# SEO: indexing, sharing, head tags, sitemaps, robots.txt, AI crawlers and agents

> Topic file (docs-restructure spike, 16 Nov 2026 NZDT). This file is the only place these decisions live. **Decided** is settled; **Open** is not. How public pages are cached (Workers Cache, `publicCache`, tags) is in [caching.md](./caching.md).

## Decided

### SEO is v1
- SEO is part of v1: people find the Site through search and shared links, and that matters for a paid product.
- Index the **Site**, share **Recipes**, and do **not** index the generated-recipe farm. Mass low-value AI pages count as scaled content abuse for Google, so generated recipes stay out of the index by default.

### What is indexed
| Route | Index | Notes |
|---|---|---|
| `/`, `/popular` | yes | Edge SSR + Workers Cache. Pages list **Popular ingredients** (pairs/triples), not Recipes (see [product.md](./product.md#popular); [caching.md](./caching.md#public-pages-are-0-js-sveltekit-ogygia-dropped)) |
| `/about` `/pricing` `/how-to` `/terms` `/privacy` | yes | Prerendered `(static)` pages |
| `/recipes/[slug]` formerly "on Popular" | **PENDING** | Old rule indexed recipes that were on a Popular *recipe* list via `sitemap-popular.xml`. Popular is now ingredient combinations, so recipe indexation / sitemap membership tied to Popular is **PENDING** until the ID set and sitemap shape are decided. Until then, treat generated recipes as **`noindex`** by default. |
| every other `/recipes/[slug]` | **`noindex`** | Public, unauthenticated SSR so links unfurl |
| `/pantry` `/saved` `/sign-in` | no | Session pages: `noindex` and `robots.txt` Disallow |

- **Every Generate is public by URL.** There is no privacy picker in v1 (a private recipe store is v2, see [v2.md](./v2.md)). `/recipes/[slug]` is never auth-gated: gating it would break link previews (Facebook's `facebookexternalhit`, Slack, iMessage fetch it anonymously).
- **`noindex` with a robots meta tag, not a `robots.txt` Disallow**, on recipe pages, so crawlers can fetch the page and see the `noindex`.
- **Weekly Popular purge / recipe robots flip — PENDING.** The previous plan purged `recipe-{ulid}` when a recipe joined or left a Popular *recipe* list (one-year edge TTL + robots meta). Popular ingredients do not put Recipes on that list, so that purge path, the one-year "on Popular" TTL, and any recipe listing in `sitemap-popular.xml` are **PENDING** until the canonical ingredient ID set and edge cases are decided. Do **not** change cron code yet. The service-binding purge route and guards remain as documented in [caching.md](./caching.md#popular-snapshot-cron-not-per-save) for whatever tags the eventual job needs.
- One canonical URL per recipe: `/recipes/{title}-{8-char suffix}`. A bare suffix or wrong title part gets a SvelteKit `redirect(301)` to the canonical slug; unknown is 404; deleted is 410. None of these are cached (see [data.md](./data.md) and [caching.md](./caching.md#headers-by-route)).

### Head tags
- **Kit's own `<svelte:head>`**, with values from `load`, not from remote functions. **No SEO library:** not `svelte-seo` (its 2.0 tests pin Kit 2, and its JSON-LD support would go unused), not `svelte-meta-tags`.
- **Open Graph is hand-rolled** in `<svelte:head>`:
  - `og:url` is the **undecorated** canonical URL (no tracking or share query);
  - no per-recipe image in v1, no `workers-og` / `sveltekit-og` WASM on the Site Worker, and no unlisted share tokens (a second URL space that unfurlers would still need public HTML for).
- **`og:image` is one static PNG**, the same on every page, rendered from the meal SVG (the SVG stays the source artwork):
  - 1200 × 630, well under 600 KB (a box test rendered a simple meal SVG to a 22 KB PNG with `@resvg/resvg-js`);
  - absolute `https://` URL, with `og:image:type` `image/png`, `og:image:width`, `og:image:height` and `og:image:alt`;
  - **made by a script and committed**: `scripts/og-image.mjs` renders `static/og-meal.svg` to `static/og-meal-v{N}.png` with `@resvg/resvg-js` (an exact-pinned devDependency, run locally, never in the deploy build). The PNG is committed;
  - **versioned file name**: bump `N` whenever the artwork changes (old files stay, so old shares keep their image), because Facebook, Slack and others cache images by URL. `<svelte:head>` reads the current name from one constant in `#lib`.
  - **Why not SVG:** X's card docs say SVG is not supported; Facebook's `og:image:type` allows only JPEG, GIF or PNG; LinkedIn lists JPG, PNG or GIF; Discord lists PNG, GIF, JPEG, WebP and AVIF. Slack has no format list and showed a grey placeholder for an SVG in a published test. PNG is the one format every platform that documents formats accepts.
- **No structured data (JSON-LD) in v1.** Recipe rich results want a real dish photo, and there isn't one.
- `<html lang="en-NZ">`. URLs are unprefixed: no `/en` or `/nz` segment.

### Sitemaps
- **Two sitemaps plus an index; `robots.txt` lists the index:**
  - **`/sitemap.xml`, built at build time by svelte-sitemap** (Vite plugin in `vite.config.ts`). It lists the prerendered `(static)` pages it finds, plus `/` and `/popular` through its `additional` option (they are edge SSR, so it can't find them). Settings: `outDir: '.svelte-kit/cloudflare'`, `ignore: ['404.html']`. That is the folder Alchemy's SvelteKit adapter writes and uploads as static assets, and the plugin runs after the adapter, so the file ships as a static asset. Box-tested with Kit 3.2 and both adapter-cloudflare and Alchemy's own adapter (16 Nov 2026 NZDT).
  - **`/sitemap-popular.xml` — PENDING rewrite.** Previously an edge route reading the Popular *recipe* snapshot from KV (`popular:all`) and listing `/recipes/{slug}`. Popular is now **ingredient combinations**, so what this sitemap lists (if anything beyond `/` and `/popular` themselves, which already sit in `sitemap.xml`) is **PENDING** until the ID set and edge cases are decided. Keep the route + `publicCache` tag `popular` skeleton; do not ship a new cron until then.
  - **`/sitemap-index.xml`, an edge route** that lists the two sitemaps above. Same `publicCache` and `popular` tag as the Popular sitemap.
- **`<lastmod>`:**
  - **PENDING** for entries inside `/sitemap-popular.xml` once its contents are decided. Google uses `<lastmod>` only when it is "consistently and verifiably" accurate for the page itself ([Google: build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)).
  - In `/sitemap-index.xml`, the `sitemap-popular.xml` entry's `<lastmod>` remains the **time the weekly snapshot was generated** (once that job exists again), and the `sitemap.xml` entry's is the build time.
- svelte-sitemap always writes `sitemap.xml` (no file-name option), which is why the build-time file keeps that name, the Popular one gets its own, and a separate index file ties them together.
- Account deletion still removes that Cook's Generate rows and ingredient-set contributions; any sitemap / Popular KV cleanup tied to the old recipe list is **PENDING** with the cron rewrite.

### robots.txt and AI crawlers
- Origin `robots.txt/+server.ts`:
  - Disallow `/pantry` `/saved` `/sign-in`.
  - Disallow the **training** crawlers: `GPTBot`, `Google-Extended`, `CCBot`, `ClaudeBot`, `Applebot-Extended`.
  - **Search** crawlers stay allowed (`Googlebot`, `bingbot`, `OAI-SearchBot`, `Claude-SearchBot`, `Applebot`), so search engines and people's chat agents can find the Site.
  - Do not Disallow the user-triggered fetchers `ChatGPT-User` / `Claude-User`. No `Disallow: /` for `*`.
  - One `Sitemap:` line for `/sitemap-index.xml`, and a comment pointing to `/llms.txt`.
- Cloudflare dashboard: AI bot policies Search **Allow**, Agent **Allow**, Training **Disallow**; Bot Preference Sync **on**; AI Crawl Control to enforce training blocks. **Bot Fight Mode off** (on the Free plan it can't be scoped and can challenge search crawlers).

### Agents and AI crawlers (agent-ready)
- **v1: `/llms.txt`.** A short, prerendered plain-text map (`(static)` `+server.ts` with `prerender = true`, served as `text/plain` from static assets): the site name, a one-line summary in a `>` blockquote, then link lists for `/about`, `/pricing`, `/how-to`, `/popular` and the sitemap index. Built from a short list in code at prerender time. It lists no individual recipes, so it can't leak `noindex` pages. Low value today (the big search and AI crawlers don't read it), but it costs one static file.
- **v1: content signals come from Cloudflare, not our code.** With Bot Preference Sync on and Training set to Disallow, Cloudflare prepends its managed block to our origin `robots.txt` (the Content Signals Policy, `search=yes, ai-train=no`). Don't write our own `Content-Signal:` line that could disagree with it.
- **v1: agents get the same 0-JS HTML as everyone.** Public pages are small server-rendered HTML with no client JS, so agents that fetch a URL can already read them. No separate agent API.

### Crawlers hit the cache, not the database
- Crawler GETs on public pages should be Workers Cache hits, so search traffic never touches D1, KV or Vectorize. Public pages send no `Set-Cookie` and no `Vary: Cookie`, and their bodies are the same for every visitor. Mechanism: [caching.md](./caching.md).

## Open
- **Popular ingredients sitemap / purge / recipe indexation:** what `/sitemap-popular.xml` contains; whether any `/recipes/[slug]` is ever indexable after Popular stopped being a recipe list; weekly purge tags once the KV snapshot is ingredient combinations. All **PENDING** on the canonical ID set (see [product.md](./product.md#open), [data.md](./data.md#open)).
- **v2 `/popular/[type]` lists in `/sitemap-popular.xml`.**
- **CI check** that the committed `og:image` PNG matches the SVG (optional).
- **Markdown copies of pages for agents** (later, not v1): `/recipes/{slug}.md` (and Site pages) with a canonical `Link` header and `X-Robots-Tag: noindex`, cache tag `recipe-{ulid}` so the same purge covers it, kept out of the sitemaps; plus `<link rel="alternate" type="text/markdown">` on the HTML page. Prefer a `.md` URL over `Accept: text/markdown` on the same URL, which would need `Vary: Accept` on cached pages. Cloudflare's Markdown for Agents does this conversion at the edge, but it needs the Pro plan, and it labels pages `ai-train=yes` unless the origin sends its own `Content-Signal` header.
- **`/llms-full.txt`** (full catalog) and `<link rel="describedby">` to `/llms.txt` on every page: skip for now; revisit with markdown copies.
- **WebMCP** (tools an agent can call on the page): v2 at the earliest. It needs client JS, and public pages are 0-JS.
- **Titles and descriptions:** no pattern decided (for example `{recipe title} · Chef Llama` and a description built from the recipe's summary or ingredients; fixed copy for Site pages). Length limits and who writes the Site copy.
- **`<link rel="canonical">`:** not decided. Option: a self-referencing canonical on every indexable page, matching `og:url`.
- **Other OG and social tags:** `og:title`, `og:description`, `og:type`, `og:site_name`, `twitter:card` (`summary_large_image`). Which set, and their values.
- **`/account` (and `/account/*`):** add to the `robots.txt` Disallow list and `noindex`, like the other session pages.
- **`hreflang="en-NZ"` + `x-default` on `/`:** was listed as optional. Add or skip.
- **Preview stages:** preview Custom Domains don't send `X-Robots-Tag: noindex` automatically. Add the header on non-production stages as a backstop behind Access (see [previews.md](./previews.md)).
- **v2 `/popular/[type]` pages:** indexable, and in the sitemap? See [v2.md](./v2.md).
- **Guest Generate (if adopted):** guest Generates never contribute to Popular ingredient counts; guest recipes stay `noindex` and out of any recipe sitemaps (see [auth.md](./auth.md#open)).
