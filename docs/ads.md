# Ads (exploration — not a decision)

> Topic file. **Exploration only.** Nothing here is Decided product policy. Placement constraints below are working assumptions for research. Marked **Open** in [product.md](./product.md#open). Sources fetched **25 Nov 2026** (NZDT). No invented figures — every number has a citation; where only ranges or third-party models exist, that is stated.

## Working assumptions (not decided)
- If ads ever ship, they sit **only on public brochure routes** such as **Recent** (`/recent`) and possibly `/` — **never** in the cook flow (`/pantry`, Generate, onboarding, Save, account).
- Goals to weigh: **low bundle cost** (public pages are **0 JS** today), **support the site**, **burnish the free tier**.
- Any third-party ad script on a `(site)` page fights the 0-JS / Core Web Vitals contract in [caching.md](./caching.md) and bundlewatch in [ci.md](./ci.md).

## Google AdSense

### Weight and third-party JS
- AdSense’s published snippet is a small loader (`adsbygoogle.js`) that then pulls a larger ad / consent / quality chain. Independent Lighthouse third-party summaries on a live site with the **standard** snippet measured roughly **440 KB** of Google scripts on mobile: about **333 KB** ad-serving, **81 KB** Funding Choices (consent), **27 KB** traffic-quality ([Sandeep Kumar Chaudhary, Oct 2026](https://sandeepkumarchaudhary.com/blog/defer-adsense-without-hurting-core-web-vitals)).
- A tracker-weight database reports a median of about **95 KB compressed** for AdSense in isolation (transfer size; sub-resources vary by config) ([Identity 2.0 Tracker Weight Database](https://www.identity20.com/tracker-weight-database/)).
- Another instrumented article page (AdSense alone, cold cache, throttled mid-tier Android) reported about **870 KB** main-thread third-party JS with **21** long tasks and lab INP **329 ms** / TBT **420 ms** ([Solangle, third-party INP notes](https://solangle.com/third-party-scripts-inp-optimization.html)). Treat as one site’s lab run, not a Google SLA.

### Core Web Vitals
- Same deferred-loader case study: mobile Lighthouse **Performance 94 → 42** with the standard snippet (LCP **2.8 s → 8.6 s**, TBT **30 ms → 580 ms**); deferred load recovered **89** ([Chaudhary](https://sandeepkumarchaudhary.com/blog/defer-adsense-without-hurting-core-web-vitals)).
- Chromium / web-vitals feedback threads report AdSense **CMP / Funding Choices** interactions as a common **INP** regression on Android (example thread: [web-vitals-feedback, Apr 2024–2025](https://groups.google.com/g/web-vitals-feedback/c/wiRgYt087qY)). Fixes are mostly on Google’s side; publishers can defer or remove ads.

### NZ cookie / consent
- New Zealand has **no PECR-style cookie opt-in law**. The **Privacy Act 2020** applies when tracking yields **personal information**: collect only what is needed (IPP 1), give **reasonable notice** of collection and purpose (IPP 3), collect fairly (IPP 4), protect it (IPP 5), and take care with overseas disclosure (IPP 11–12) ([Privacy Act 2020](https://www.legislation.govt.nz/act/public/2020/0031/latest/whole.html); plain-language guides: [uForge](https://uforge.build/nz/guides/privacy-act-2020-website-tracking/), [CookieHub NZ overview](https://www.cookiehub.com/new-zealand-privacy-act), [Sprintlaw NZ](https://sprintlaw.co.nz/articles/cookie-policy-for-new-zealand-businesses-what-you-need-and-when-its-required/)).
- A privacy / cookie **policy** and transparency are expected; a mandatory EU-style consent banner is **not** required for NZ-only visitors. If traffic includes **UK/EU** users, GDPR / PECR-style consent for non-essential advertising cookies may still apply for those visitors ([Sprintlaw](https://sprintlaw.co.nz/articles/cookie-policy-for-new-zealand-businesses-what-you-need-and-when-its-required/)).
- AdSense’s own Funding Choices CMP still loads where Google enables it — that is third-party weight even when NZ law does not force a banner.

### Revenue at low traffic
- Google defines **Page RPM** as `(estimated earnings / pageviews) × 1000` ([AdSense Help: Page RPM](https://support.google.com/adsense/answer/112030?hl=en)).
- **Third-party planning models** (not Google, not a promise): one NZ country model quotes a **US$14** “base” Page RPM for NZ traffic before niche adjustment, with Food/lifestyle niches typically **below** finance — treat as a model, not measured Chef Llama earnings ([Adstimate NZ RPM page](https://adstimate.com/blog/country/new-zealand-adsense-rpm.html)). Another 2025–26 niche compilation cites beginner blogs often in about **US$2–$8** Page RPM ([TechConda AdSense RPM benchmarks](https://www.techconda.com/2026/02/adsense-rpm-benchmarks.html)).
- Low-traffic arithmetic from those ranges: at **1,000** monthly pageviews, **US$1–$10**/month is the planning band used by low-traffic guides (e.g. [adsenseaudit.net low-traffic guide](https://adsenseaudit.net/guides/is-adsense-worth-it-for-low-traffic-sites) table at $1–$10 RPM). At **5,000** pageviews and **US$5** RPM ≈ **US$25**/month — side-income territory, easy to exceed with one affiliate sale or pack sale.
- Anecdote (not a benchmark): a Sep 2024 r/Adsense post targeting AU/NZ job seekers reported about **NZ$6–7** Page RPM ([reddit.com/r/Adsense](https://www.reddit.com/r/Adsense/comments/1fd7xo5/what_kind_of_page_rpm_are_you_getting_in_sept_2024/)).

**Fit for Chef Llama:** high third-party JS vs **0-JS public pages**; CWV risk on mobile; revenue at launch-scale traffic is likely **small**. Conflicts with bundlewatch / public-route purity unless ads are heavily deferred or isolated.

## EthicalAds
- Audience and advertiser topics are **developer** (AI/ML, backend, frontend, security, DevOps) — not food ([EthicalAds advertiser FAQ](https://www.ethicalads.io/advertisers/faq/)).
- Publisher bar: **≥ 50,000** monthly pageviews ([EthicalAds publisher FAQ](https://www.ethicalads.io/publishers/faq/)).
- Typical publisher earnings cited by EthicalAds: about **US$2.50 CPM** (≈ $2.25–$2.75 on their calculator), with AU/NZ “typically right around this same range” when most traffic is high-value geos ([publisher FAQ](https://www.ethicalads.io/publishers/faq/); [calculator](https://www.ethicalads.io/publishers/calculator/)).
- Privacy-oriented (contextual / geo, no behavioural tracking cookies for targeting) — still a **client script** and a poor **food** advertiser fit.

**Fit:** **Poor** for a NZ recipe site — wrong advertiser pool; traffic bar above early Chef Llama scale.

## Carbon Ads (BuySellAds)
- One small image + text unit; reviews describe **little page weight** and no pop-ups / autoplay ([BuySellAds vs Carbon comparison](https://faun.dev/toolbox/buysellads-vs-carbon-ads/); [Carbon vs AdSense](https://faun.dev/toolbox/carbon-ads-vs-google-adsense/)). No first-party KB figure published in those sources — do not invent one.
- **Developer / designer** audience; invitation-only; from **10,000** monthly pageviews; **exclusive** (only ad network on the site) ([pubsleuth BuySellAds / Carbon guide](https://pubsleuth.com/ad-networks/buysellads); [stack127 Carbon summary](https://stack127.com/ad-networks/buysellads-carbon-ads)).
- Food & recipes share of tracked BuySellAds sites: **0.1%** (1 site in that crawl) ([pubsleuth](https://pubsleuth.com/ad-networks/buysellads)).

**Fit:** Lightweight relative to AdSense, but **wrong niche** (same problem as EthicalAds). Unlikely to accept or fill a cook site.

## Food-oriented display networks
Among established food / recipe sites (≥ ~10k visits/month), the networks most used (by count, not by our RPM) are **Raptive**, **Mediavine**, **Ezoic**, **Journey by Mediavine**, **HB Agency**, etc. ([pubsleuth: best ad networks for food blogs](https://pubsleuth.com/best-ad-networks-for-food-blogs), data counted 24 Nov 2026). Published bars include e.g. Raptive **25,000** pageviews/month (with geo mix rules), Journey **1,000** sessions/30 days — still **heavy** script stacks aimed at long recipe blogs, not 0-JS brochure pages. Not a launch fit; revisit only if Recent traffic and a willingness to abandon 0-JS on ad routes appear.

## Self-served text / affiliate (NZ-relevant)
- **HelloFresh NZ** runs an affiliate program via Impact (commission on new/past subscriptions, **30-day** cookie, creatives) ([hellofresh.co.nz/about/affiliates](https://www.hellofresh.co.nz/about/affiliates)).
- **My Food Bag** (and related brands) launched NZ affiliate programmes on the local **S.L.I.C.E Digital** network ([slice.digital announcement](https://www.slice.digital/n/my-food-bag-affiliate-program-has-arrived)) — confirm current terms with the network before promising rates (no commission % cited here because the announcement page does not publish one).
- **Kitchen Warehouse** AU has a Commission Factory programme (**5%** headline on many SKUs, appliances often lower) ([Commission Factory listing](http://www.commission-cca.com/37610-3.html)) — that is **Australia**; do not assume the same for kitchenwarehouse.net.nz without a live NZ programme page.
- Self-served **static text links** or first-party promo blocks (no auction JS) keep public pages near **0 JS** and match “support the site / burnish free tier” better than AdSense at low traffic. Revenue is **sales-shaped**, not RPM-shaped — one conversion can beat a month of low-RPM display.

## Recommendation (exploration conclusion)
**None yet** for third-party display networks in v1.

| Option | Bundle / CWV | Food fit | Early traffic | Verdict |
|---|---|---|---|---|
| AdSense | Heavy (often 100 KB–440 KB+ chain; INP/LCP risk) | Generic | Tiny $ at low PV | Skip for now |
| EthicalAds | Lighter than AdSense; still client JS | **Poor** (dev advertisers) | Needs ~50k PV | Skip |
| Carbon | Small unit; exclusive | **Poor** (dev/design) | Needs ~10k PV + invite | Skip |
| Raptive / Mediavine / peers | Heavy recipe-blog stacks | Strong | High bars | Skip until scale + policy change |
| Self-served text / NZ affiliates | Can stay 0 JS | Good if copy is honest | One sale > low RPM | **Revisit later** if monetisation is needed |

Ship **Recent** and the free tier without ads. If monetisation is revisited, prefer **first-party or affiliate text** on `/recent` over AdSense, and treat any display network as a deliberate break of the 0-JS public contract that needs a Coinnich decision.

## Open
- Whether ads of any kind ship in v1 (default recommendation: **no**).
- If yes: which routes (`/recent` only vs `/` too); consent UX for overseas visitors; how ads interact with Workers Cache and `publicCache` (third-party cookies / `Vary` risk).
- Exact affiliate partners and disclosed commission copy (lawyer / FTC-style disclosure even for NZ readers).
