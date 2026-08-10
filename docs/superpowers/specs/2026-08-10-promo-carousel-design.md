# Rotating Promo Carousel — Design Spec

**Date:** 2026-08-10
**Status:** Approved (design)
**Branch:** `feat/promo-carousel`

## Context & problem

The custom ad system shipped and is live on production (PR #1, merged): four wide homepage banners
and two article banners, all showing the same single advertiser (Toyota Lebanon).

A **second advertiser has now signed — MDM Atelier** (fashion, `https://mdm-atelier.com/`), so the
slots need to rotate between advertisers rather than being hardcoded to one. The client asked for a
"slider".

Two problems have to be solved together:

1. **No rotation exists.** `AdSlot` calls `pickAd()`, which deterministically narrows the eligible
   list to exactly one creative. The data layer already supports multiple creatives per placement;
   only the render path is single-ad.
2. **The new creative's aspect ratio clashes.** MDM supplied a 1600×800 (2.0:1) file — it reads as a
   print/social asset, not a web banner, with a mostly-empty white upper half. The wide slots are
   1200×250 (4.8:1). A carousel must reserve **one** box per slot or the page jumps on every advance,
   which is the exact CLS failure the ad system was built to avoid. Cropping MDM's 2.0:1 artwork to
   4.8:1 would cut off either the logo/tagline (upper middle) or the model photos (bottom strip).

## Goals

- Wide homepage slots rotate between all eligible advertisers.
- Auto-advance, with swipe and clickable dots.
- Zero layout shift, correct RTL behavior, ad-blocker-resistant naming — all preserved.
- Single-creative slots keep their current behavior exactly (no regression).
- The invariant that makes CLS-safety possible becomes machine-checked, not tribal knowledge.

## Non-goals

- Article-slot rotation (the 728×200 MDM creative is generated but not wired — one config entry
  switches it on later).
- Admin/DB-managed ads, click reporting, per-creative interval tuning (YAGNI).
- Finger-tracking drag animation (swipe-to-advance is enough).

## Decisions

| Question            | Decision                                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| MDM ratio clash     | **Recompose** MDM's artwork into proper banner sizes from their source                                         |
| Which slots rotate  | **All 4 wide homepage slots** (`home-top`, `home-after-featured`, `home-after-latest`, `home-before-mostread`) |
| Advance behavior    | **Auto-rotate** (~6s) + swipe + dots                                                                           |
| Animation mechanism | **Crossfade**, not a scrolling track (see rationale below)                                                     |
| Wide slot box       | Standardize on **1200×250** (4.8:1)                                                                            |

## Creative work

Rename the delivered file (`WhatsApp Image 2026-08-09 at 4.56.10 PM.jpeg`) to a real slug and keep
it as the untouched source of truth, then derive banners with `sharp` (already a dependency, v0.34.5):

| File                                         | Purpose                                                 |
| -------------------------------------------- | ------------------------------------------------------- |
| `public/ads/mdm-atelier-source-1600x800.jpg` | advertiser original, kept for future re-crops           |
| `public/ads/mdm-atelier-wide-1200x250.jpg`   | the 4 wide homepage slots                               |
| `public/ads/mdm-atelier-card-728x200.jpg`    | generated now, wired later if article rotation is added |

**Composition:** white background; logo + "Define your style" + `www.mdm-atelier.com` on the
**right** (natural leading position on an RTL page); a strip of model photos on the left, scaled to
the box height.

**Filenames must avoid** the tokens `banner`, `image`/`images`, `leaderboard`, `square`,
`rectangle` — EasyList blocks those sub-paths under `/ads/`. `wide` / `card` match the existing
Toyota naming and are safe.

**Human gate:** because this alters an advertiser's supplied artwork, the rendered result is shown
for approval before it is wired into the config.

## Architecture

`AdSlot` remains a **server** component and keeps every security responsibility (flag check,
`sanitizeUrl` per creative, src resolution). Its selection changes from "pick one" to "collect all
eligible, validate each, drop invalid":

- **0 valid creatives** → `null` (unchanged)
- **1 valid creative** → today's exact single-ad markup: no carousel chrome, no client JS. This is
  what keeps article and sidebar slots byte-for-byte unchanged.
- **2+ valid creatives** → renders `<PromoCarousel>` (a `'use client'` child) with only
  pre-sanitized slide data as props.

`components/ads/promo-carousel.tsx` renders **every slide into the SSR HTML** inside the single
aspect-ratio box, so there is no layout shift and no-JS visitors still see slide 1.

### Why crossfade instead of a CSS scroll-snap track

Programmatic autoplay inside an RTL container is a known bug farm: `scrollLeft` is 0-at-right and
negative going left per the CSSOM spec, browsers disagree historically, and `scrollIntoView` can drag
the whole page vertically when the slot is off-screen. Crossfade (absolutely-positioned slides,
opacity transition) has **zero scroll-direction math and zero page-scroll side effects**, and the
single reserved box falls out of the design for free. Trade-off accepted: swipe advances a slide
rather than tracking the finger.

### Behavior

- Auto-advance every ~6s (single shared constant, not per-creative config).
- **Pauses** on hover, on focus-within, when the tab is hidden (`visibilitychange`), and when the
  slot is off-screen (`react-intersection-observer`, already installed) — perf, and fairer
  impressions.
- `prefers-reduced-motion` → no autoplay and no transition; dots still work for manual control.
- Inactive slides get `aria-hidden` and `tabIndex={-1}` so keyboard users cannot tab into an
  invisible ad.
- Only the first slide loads eagerly; the rest lazy.
- **Per-slot start offset**, derived deterministically from the placement name, so different slots
  lead with different advertisers and both get prime position. Deterministic — never `Math.random()`
  in render (that would desync SSR and hydration).
- All rendered classes/attributes stay `promo-*`; every slide keeps its own `data-promo-id` so the
  existing Clarity / Vercel Analytics segmentation keeps working per advertiser.

## Slot ratio normalization

Three wide slots already use Toyota 1200×250. `home-after-featured` uses 1200×200 (6:1) and is the
one slot changing shape, moving to the 1200×250 creative so all four share one box.

## New invariant + tests

Mixed aspect ratios within a single placement is the one change that silently breaks CLS. A unit test
asserts that **every placement in the real `ADS` config has a single consistent aspect ratio**, so a
future config edit cannot regress it unnoticed. The deterministic start-offset helper is unit-tested
too (stable output for a given placement, always in range).

## Files

**Create:** `components/ads/promo-carousel.tsx`, the three MDM images.
**Modify:** `lib/ads/config.ts` (MDM entries + ratio normalization), `components/ads/ad-slot.tsx`,
`components/ads/index.ts`, `app/globals.css`, `lib/ads/select.test.ts`,
`docs/CUSTOM_ADS_HANDOFF.md` (stale — still describes the pre-merge, ads-off state).

## Verification

1. `npm test` (incl. the new ratio invariant), `npm run typecheck`, `npm run lint` clean.
2. `npm run build` succeeds.
3. Flag off → zero ad DOM (unchanged safety property).
4. Flag on locally → wide slots render 2 slides each; article slots render the single-ad path with
   no carousel markup.
5. Lighthouse on `/`: **CLS ≈ 0**, including across an auto-advance.
6. RTL: label on the start side, dots ordered correctly, no horizontal overflow.
7. Keyboard: cannot tab into a hidden slide; dots are focusable and operable.
8. Reduced-motion: no autoplay, no transition.
9. Push branch → Vercel preview (Preview already has `NEXT_PUBLIC_ADS_ENABLED=true`) → confirm both
   advertisers render and rotate. Production keeps serving the current single Toyota banners until
   merge.
