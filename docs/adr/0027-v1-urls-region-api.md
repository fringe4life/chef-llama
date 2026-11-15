# v1 URLs unprefixed (`en-NZ`); D1 Oceania hint; remotes not `/v1` HTML

**Status:** accepted (round 30 Q1–Q2 yes).

**v1 Site/App URLs stay the named Kit files** (`/`, `/pantry`, `/recipes/[id]`, …). Document language is **English for NZ**: `html lang="en-NZ"`. Optional `hreflang="en-NZ"` + `x-default` both on **`/`**. Do **not** add `/en` or country-only `/nz` / `/uk`. Google forbids country-only hreflang; `en` is a language, `NZ` is a region on `en-NZ`. ([Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions).)

**v2 i18n:** official Kit path is **Paraglide** (`npx sv add paraglide`, inlang project). Default URL strategy = **base locale unprefixed**. Kit has **no** builtin message catalog — only `lang` in `app.html`. Do not wrap v1 in `[[lang]]` (root `+page` already claims `/`). A later `/popular/[type]` feed uses the literal first segment `popular`; locale prefixes are a reserved BCP-47 list so they cannot steal type or nation codes. Closed type list + allergy fail-closed: [ADR 0038](./0038-popular-type-allergy-safeguards.md).

**v1 region NZ:** Workers **default closest PoP** (Oceania cities include Auckland, Christchurch, Wellington). Do **not** set Alchemy/Wrangler `placement.region` to `aws:ap-southeast-2` — that pulls NZ users toward Sydney. Both **`AUTH_DB`** and **`RECIPES_DB`** use D1 **`primaryLocationHint: "oc"`** (hint, not a lock). No NZ jurisdiction (`eu` / `us` / `fedramp` only).

**API:** v1 = Kit remotes. Do not prefix HTML with `/v1`. A public REST surface later is **`/api/v1`** because CF cache keys on **path** (not host). Additive Schema does not bump.

[round 29](../../internal/research-round29-i18n-urls-region.md).
