# Custom Ad System — Design Spec

**Date:** 2026-06-15
**Status:** Approved (design)
**Branch:** `feat/custom-ads`

## Context & problem

4lebanon.com needs ad monetization. Google AdSense was rejected: at ~1,200 visits/month it would
earn a few dollars while adding third-party scripts, cookies, an approval wait, and a payment-PIN
process. Instead we build a **custom, in-house ad system**: an ad is an **image that, when clicked,
opens the advertiser's site in a new tab**. It must blend tastefully into the existing design, be
mobile-friendly, RTL-correct, and cause **zero layout shift**.

The developer keeps full control (no client self-service yet) and there are no live ads at launch —
this build delivers the **capability**, shipped behind an off-switch, ready to turn on when a real
advertiser (e.g. Toyota Lebanon) is signed.

## Goals

- A reusable, design-blending ad unit usable on the homepage and article pages.
- Ads defined in a **typed code config** (no DB, no admin UI). Editing an ad = edit config + deploy.
- **Off by default** via a feature flag, so it merges to `main`/production safely and shows nothing
  until explicitly enabled.
- A **branch-preview workflow** so the client can review a live, ads-on URL before it touches
  production.
- Zero CLS, correct RTL, mobile-friendly, ad-blocker resistant, accessible.

## Non-goals (future, paid phases)

- Admin-managed ads / client self-service upload.
- Selling ad space to local businesses; pricing/rotation management.
- Real click/impression reporting dashboards (Tier 0 tracking only — see below).

## Resolved decisions (from client answers)

| #   | Question                         | Answer                                                |
| --- | -------------------------------- | ----------------------------------------------------- |
| 1   | Who supplies images              | Client provides finished images                       |
| 2   | Ads ready now?                   | No — build the capability; ship a neutral placeholder |
| 3   | Link target                      | A specific advertiser URL (e.g. Toyota Lebanon)       |
| 4   | Where                            | Homepage **and** article pages                        |
| 5   | Density                          | Minimal / tasteful                                    |
| 6   | Excluded sections                | None — fine on every article                          |
| 7   | Advertisers / blocked categories | e.g. Toyota Lebanon; none blocked                     |
| 8   | Label ads                        | Yes — "إعلان"                                         |
| 9   | New tab                          | Yes                                                   |
| 10  | Click/view reporting             | Not now (Tier 0); a paid add-on if wanted later       |
| 11  | Admin self-management            | No — hardcoded, dev keeps control                     |
| 12  | Pricing model                    | N/A (dev is the contractor, not the owner)            |
| 13  | Privacy note                     | OK, as long as it doesn't disrupt flow                |

## Architecture

**Data:** a flat, typed array in `lib/ads/config.ts`. Each entry is an `AdCreative`:

```ts
type AdPlacement =
  | 'home-after-latest'
  | 'home-mid-sections'
  | 'home-before-mostread'
  | 'article-sidebar'
  | 'article-in-body'
  | 'article-after-recommended'

interface AdCreative {
  id: string // stable slug; React key + data-promo-id
  placement: AdPlacement
  src: string // '/ads/foo.webp' (local) | full https URL | bare storage path
  href: string // advertiser destination
  alt: string // Arabic alt text (a11y + SEO)
  label?: string // defaults to 'إعلان'
  width: number // REQUIRED — reserves the box (CLS defense)
  height: number // REQUIRED
  weight?: number // rotation weight (default 1)
  active?: boolean // default true
  startAt?: string // optional ISO flight window
  endAt?: string // optional ISO flight window
}
```

**Selection:** pure functions in `lib/ads/select.ts`:

- `getEligibleAds(placement, now?)` — filters by placement, `active`, flight window, and presence of
  `src`/`href`.
- `pickAd(ads, seed?)` — deterministic weighted pick (no rotation by default; one creative per slot).

**Component:** `components/ads/ad-slot.tsx` — a **server** component `<AdSlot placement variant
className />`:

1. Flag off → `return null`. No eligible ad → `return null`.
2. Validate `href` via `sanitizeUrl()` (`lib/security.ts`); invalid → render nothing.
3. Pick one creative server-side (deterministic — avoids hydration mismatch; **no `Math.random()`
   in render**).
4. Resolve `src`: if it starts with `/` or `http` use as-is; otherwise `getStorageUrl(src)`.
   _(Verified: `getStorageUrl` only passes through `http(s)`; a raw `/ads/…` path would be wrongly
   rewritten to a Supabase URL, so the component must guard this.)_
5. Render: `<aside aria-label="محتوى مموّل">` + a real-text "إعلان" label + `<a href target="_blank"
rel="noopener noreferrer sponsored" data-promo-id={id}>` wrapping a `next/image` inside a div with
   `style={{ aspectRatio: \`${width}/${height}\` }}`and`fill` → reserved box, **CLS ≈ 0**.

**Feature flag:** `NEXT_PUBLIC_ADS_ENABLED` (`'true'|'false'`, default `'false'`), added to BOTH the
Zod `clientEnvSchema` and the explicit object in `validateClientEnv()` in `lib/env.ts` (verified the
function enumerates keys at lines 66–71). A helper `lib/ads/flags.ts#adsEnabled()` reads it. Because
it's `NEXT_PUBLIC_`, it inlines at build time and works in server + client components. Per-slot
disable = empty that placement in config (no extra flag surface).

## Placement & styling

Named slots are inserted as single JSX lines so positions can move/prune trivially:

- **Homepage** (`app/page.tsx`): `home-after-latest`, `home-mid-sections` (via the dynamic-sections
  `.map` index, after ~2nd section), `home-before-mostread`.
- **Article** (`app/article/[slug]/page.tsx`): `article-sidebar` (inside the ≥1500px sticky trending
  aside), `article-in-body` (before `<RecommendedArticles>`), `article-after-recommended`.

Three visual variants in `app/globals.css`, reusing existing tokens: `wide` (full-width, blends
with `.bento-card`), `card` (`.bento-card`/`.glass-card`), `sidebar` (`.trending-widget`). RTL via
**logical CSS only** (`inset-inline-start`, `ps-/pe-`), never `left/right`. **Ad-blocker-safe
naming:** rendered classes/attributes use `promo-` (e.g. `.promo-slot`, `data-promo-id`), never
`ad/ads/banner/sponsor`.

## Launch content (build #1)

- One **neutral demo creative** — a generic "مساحة إعلانية / Your ad here" image committed to
  `public/ads/` (no real Toyota assets → no trademark issue).
- Populated into a **tasteful subset**: `home-after-latest` (banner), `article-in-body` (card),
  `article-sidebar` (sidebar). All 6 slots are wired in code; populating the rest is a one-line config
  edit if the client wants to compare positions.
- The real advertiser image + URL replace the demo entry in config when signed.

## Preview → client → merge workflow

1. All work lands on branch **`feat/custom-ads`** — `main`/production untouched.
2. Pushing the branch triggers a **Vercel preview deployment** with a unique URL.
3. In Vercel, set `NEXT_PUBLIC_ADS_ENABLED=true` **scoped to the Preview environment** (NEXT_PUBLIC
   vars inline per-build, and preview/production build separately) → **ads visible in the preview
   link, production stays off**. Optional: Vercel Pro deployment protection (password) on the preview.
4. Client reviews the preview URL (or screenshots).
5. On approval → **merge to `main`**. Production deploys with ads still **off** until the Production
   env var is flipped when the real ad is ready.

## Tracking, privacy, security

- **Tracking — Tier 0:** plain `<a href>` straight to the advertiser; `data-promo-id` lets the
  already-installed Microsoft Clarity / Vercel Analytics segment clicks. Structured so a future
  `/api/promo/[id]/go` redirect route is a one-line `href` swap. No new infra, no perf/CLS cost.
- **Privacy:** add one Arabic `<section>` ("الإعلانات والمحتوى المموّل") to `app/privacy/page.tsx`
  matching the existing section pattern: site shows labeled sponsored images; clicks go to
  third-party sites under their own policies; no third-party ad scripts or ad-targeting cookies. **No
  cookie-consent banner needed.**
- **Security/CSP:** local `public/ads/` images need **no** `next.config.ts` or CSP change (covered by
  `img-src 'self'`; CSP applies in production only). External advertiser image domains are **not**
  used (would require both `remotePatterns` and an `img-src` edit). `X-Frame-Options`/`frame-src`
  unaffected (we render `<img>`, not iframes).

## Files

**Create:** `lib/ads/types.ts`, `lib/ads/config.ts`, `lib/ads/select.ts`, `lib/ads/flags.ts`,
`components/ads/ad-slot.tsx`, `components/ads/index.ts`, `public/ads/` (+ demo creative).
**Modify:** `lib/env.ts` (flag in schema + `validateClientEnv`), `app/globals.css` (`.promo-slot*`
styles, 3 variants), `app/page.tsx` (3 homepage slots), `app/article/[slug]/page.tsx` (3 article
slots), `app/privacy/page.tsx` (sponsored clause).

## Verification

Vitest was added with unit tests for the pure `getEligibleAds`/`pickAd` selectors; the rest is
verified manually:

1. `npm run typecheck` && `npm run lint` clean.
2. Flag **off** (default): pages render with **zero** ad DOM, identical to before.
3. Flag **on** (`NEXT_PUBLIC_ADS_ENABLED=true`, restart dev): demo ad appears in the populated slots.
4. Lighthouse on `/` and an article: **CLS ≈ 0** (watch the moment the ad image decodes).
5. RTL: "إعلان" label on the correct (start) side; no horizontal overflow; label is real text.
6. Mobile (~360px): banner full-width & tappable; sidebar ad hidden below 1500px.
7. Bad `href` (empty / `javascript:`) → renders nothing.
8. `npm run build && npm start` (prod CSP active) → ad image loads, no CSP console errors.
9. Push branch → confirm Vercel preview builds and (with Preview env flag on) shows the ad.
