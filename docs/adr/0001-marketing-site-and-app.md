# Split static Site from App

v1 is not app-only. Public origin is a **Site** split into prerendered `(static)` marketing pages and edge-SSR `(site)` pages (`/` `/popular` `/recipes/[id]`, `csr=false`, 0 JS — [ADR 0037](./0037-zero-js-public-cache-guardrails.md)). The cooking **App** is a separate tree (`csr=true`). Popular recipes on the Site are a **cron KV snapshot** + Workers Cache, not a live rank. Generate never lives on the brochure. Considered and rejected: pantry as `/` with no marketing; marketing + pantry on one long scroll (design direction 01, including the ticket-rail look).

**Consequences:** Routes, prerender, and Fallow zones must keep Site pages from importing generate/credits. A marketing chat icon, if any, is auth-only and must not become an anonymous Agent on the brochure.
