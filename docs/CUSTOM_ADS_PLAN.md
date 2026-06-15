# Custom Ads — Plan, Client Questions & Build Prompt

> **What this is:** the plan for adding ads to 4lebanon.com using a **custom, in-house ad system**
> instead of Google AdSense. An ad is simply an **image that, when clicked, opens the advertiser's
> site** — built to blend tastefully into the design, mobile-friendly, correct for Arabic (RTL),
> with no "page jumping."
>
> **Two things you need from this doc:** (1) the **questions to ask the client** before building,
> and (2) the **build prompt** to paste into Claude Code on any machine to actually implement it.

---

## Why custom instead of Google AdSense

At current traffic (~1,200 visits/month), AdSense income would be only a few dollars/month, while
adding third-party scripts, cookies, an approval wait, and a payment-PIN process. A **custom system**
gives full control over design and which advertisers appear, runs **no third-party tracking**, and
lets the client place their own promos or sell space to local businesses directly. Revenue and effort
both stay in the client's hands.

The system is built **behind an off-switch**, so it can be merged safely now and turned on the moment
real ads are ready — nothing shows until then.

---

## Part 1 — Questions for the client

### Ad creatives & content

1. **Who supplies the ad images?** You design them, the client provides finished images, or each
   advertiser provides their own?
2. **Are any ads ready now, or are we building the capability** so it's ready when you have ads?
   (Determines whether we launch with real creatives or keep it dark behind the off-switch.)
3. **What should each ad link to** — a specific landing page, the advertiser's homepage, a
   WhatsApp/phone link?

### Placement & density

4. **Where should ads appear** — homepage, article pages, or both? (Recommended: both.) We'll fix the
   exact spots together; the system supports several tasteful positions.
5. **How many ads / what density** — minimal and tasteful (recommended), or more coverage?
6. **Any sections or topics where ads must never appear** — sensitive breaking news, obituaries,
   specific political content?

### Brand safety & behavior

7. **Who are the advertisers** (local businesses, your own cross-promotions, partners), and are there
   any **categories to avoid**?
8. **Should ads be labeled "إعلان" (advertisement)** for transparency? (Recommended yes — it builds
   reader trust and is standard practice.)
9. **Clicking opens the advertiser in a new tab** — is that the behavior you want?

### Reporting & commercial (mostly future)

10. **Do you need click/view numbers** to show advertisers? (This decides how much tracking we add —
    see note below.)
11. **Future phase — do you want to sell ad space to local businesses and manage ads yourself**
    (upload image + link + dates) from the admin panel? That's a separate project built on top of
    this one.
12. **If selling later — what pricing model** (flat monthly per slot, rotation, etc.)? Only relevant
    for the future phase.

### Legal

13. **OK to add a short "sponsored content" note to the privacy policy?** It's much lighter than
    AdSense — no third-party scripts or tracking cookies, so no cookie-consent banner is needed.

> **Most important to settle first:** #4 (where ads go) and #1 (who supplies creatives). Everything
> else has a sensible default. #10 is the real fork — if advertisers ever need click reports, that
> nudges us toward the admin-managed future phase, so it's worth deciding early.

---

## Part 2 — Build prompt (paste into Claude Code on any machine)

This prompt is **self-contained** — it re-establishes all the context and tells the AI to **plan
first, then build** (with your approval before any coding).

```
I'm adding a CUSTOM, HARDCODED ad system to the 4Lebanon website (Next.js 16 App Router,
React 19, TypeScript, Tailwind v4, Supabase, Vercel; full RTL Arabic site, brand red #830005,
gold #f5c518, glassmorphism design). We are NOT using Google AdSense and NOT building an
admin/DB-managed ad manager yet (that's a future phase).

GOAL
An "ad" is an image that, when clicked, opens the advertiser's URL in a new tab. Ads must blend
tastefully into the existing design, be mobile-friendly, RTL-correct, and cause ZERO layout shift.
Ad definitions live in a typed config file in code (editing an ad = code edit + deploy — that's
fine). The whole system must be behind an OFF-by-default feature flag so it can be merged safely
and turned on later.

WORKFLOW: Plan first, then build. Use the brainstorming skill to confirm the design with me,
write a short spec, then the writing-plans skill, and only then implement with review checkpoints.
Do not start coding until I approve the plan.

REQUIREMENTS / CONSTRAINTS
- Feature flag: add NEXT_PUBLIC_ADS_ENABLED (default false) to lib/env.ts — to BOTH the Zod client
  schema AND the explicit object in validateClientEnv(). When off, ad components render nothing.
- Config: lib/ads/types.ts (placement enum + AdCreative type) and lib/ads/config.ts (an ADS[]
  array). AdCreative fields: id, placement, src, href, alt, label?, width, height, weight?,
  active?, startAt?, endAt?. width/height are REQUIRED (used to reserve space).
- Selection: lib/ads/select.ts with pure getEligibleAds(placement) (filters placement/active/
  flight-window/valid src+href) and pickAd() (weighted, deterministic). Unit-test these if a test
  runner exists; otherwise it's fine to add a minimal Vitest test for them.
- Component: components/ads/ad-slot.tsx — a SERVER component <AdSlot placement variant rotate
  className />. It: reads the flag (off ⇒ return null), gets eligible ads (none ⇒ return null),
  validates href via sanitizeUrl() from lib/security.ts (fail ⇒ render nothing), picks ONE creative
  server-side (NO Math.random() in render — that breaks hydration; default to no rotation).
  Renders <aside aria-label="محتوى مموّل"> with a visible "إعلان" text label, then
  <a href target="_blank" rel="noopener noreferrer sponsored"> wrapping a next/image inside a
  div with style={{aspectRatio: `${width}/${height}`}} and fill — so the box is reserved and CLS
  is ~0. Use getStorageUrl() from lib/utils.ts for the src (handles local /ads/* and full URLs).
- ADBLOCKER-SAFE NAMING: rendered CSS classes, data attributes, and any API path must use "promo"
  (e.g. .promo-slot, data-promo-id), NEVER "ad/ads/banner/sponsor" — adblockers hide those.
  (Internal file/variable names are fine.)
- Images: store creatives in public/ads/ (pre-optimized webp/avif). This needs NO next.config.ts
  or CSP changes (covered by img-src 'self'). Do NOT use external advertiser image domains.
- Styling: add .promo-slot styles to app/globals.css reusing existing tokens, with 3 variants —
  banner (full-width), card (matches .bento-card/.glass-card), sidebar (matches .trending-widget).
  RTL: logical CSS only (inset-inline-start, ps-/pe-), never left/right.
- Placement: insert <AdSlot> at NAMED seams (so I can move them by editing one line each):
  homepage app/page.tsx → home-after-latest, home-mid-sections (use the dynamic-sections .map index,
  e.g. after the 2nd section), home-before-mostread; article app/article/[slug]/page.tsx →
  article-sidebar (inside the ≥1500px sticky trending aside), article-in-body (before
  <RecommendedArticles>), article-after-recommended. Wire them but keep the flag off.
- Tracking: TIER 0 for now — no redirect, plain <a href> straight to the advertiser, add
  data-promo-id={id} so Microsoft Clarity / Vercel Analytics (already installed) can segment.
  Structure it so swapping href to a future /api/promo/[id]/go redirect route is a one-line change.
- Privacy: add one Arabic <section> to app/privacy/page.tsx ("الإعلانات والمحتوى المموّل") stating
  the site shows labeled sponsored images, clicks go to third-party sites, no third-party ad scripts
  or ad-targeting cookies are used. No cookie-consent banner needed.

VERIFY before claiming done:
1) npm run typecheck && npm run lint clean.
2) Flag OFF (default): pages render with zero ad DOM, unchanged.
3) Flag ON (NEXT_PUBLIC_ADS_ENABLED=true, restart dev): ads appear at each slot.
4) Lighthouse on / and an article page: CLS ~0 (watch the moment the ad image decodes).
5) RTL: "إعلان" label on the correct side, no horizontal overflow, label is real text not baked
   into the image.
6) Mobile (~360px): banners full-width & tappable; sidebar ad hidden below 1500px.
7) A deliberately bad href (empty / javascript:) renders nothing.
8) Production CSP: npm run build && npm start → ad images load, no CSP console errors.

Start by exploring app/page.tsx, app/article/[slug]/page.tsx, lib/env.ts, lib/security.ts,
lib/utils.ts, app/globals.css, and next.config.ts, then propose the plan.
```

---

## Appendix — Technical decisions (developer reference)

The build prompt already encodes these; this is a quick checklist of the choices behind it.

| Decision      | Choice                                                     | Note                                               |
| ------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| Architecture  | Hardcoded typed config (`lib/ads/config.ts`)               | Admin/DB management is a future phase              |
| Image hosting | `public/ads/` (pre-optimized webp/avif)                    | Zero CSP changes; creatives versioned with code    |
| Feature flag  | `NEXT_PUBLIC_ADS_ENABLED` (default `false`)                | Wire into Zod schema **and** `validateClientEnv()` |
| Rotation      | One ad per slot, server-picked                             | No `Math.random()` in render (hydration safety)    |
| Tracking      | Tier 0 (Clarity + Vercel Analytics + `data-promo-id`)      | Upgrade to `/api/promo/[id]/go` redirect later     |
| Naming        | Neutral `promo-` (not `ad`/`banner`/`sponsor`)             | Avoids adblockers hiding the slots                 |
| Layout shift  | Reserve box via required `width`/`height` + `aspect-ratio` | Target CLS ≈ 0                                     |
| RTL           | Logical CSS only (`inset-inline-start`, `ps-/pe-`)         | Label "إعلان" sits on the correct side             |
| Privacy       | One Arabic clause; no cookie banner                        | No third-party ad scripts/cookies                  |

**Named placement slots** (insert/move by editing one JSX line each):
`home-after-latest`, `home-mid-sections`, `home-before-mostread` (homepage);
`article-sidebar`, `article-in-body`, `article-after-recommended` (article page).

**Files** — _create:_ `lib/ads/{types,config,select}.ts`, `components/ads/ad-slot.tsx`,
`components/ads/index.ts`, `public/ads/`. _Modify:_ `lib/env.ts`, `app/globals.css`, `app/page.tsx`,
`app/article/[slug]/page.tsx`, `app/privacy/page.tsx`.
