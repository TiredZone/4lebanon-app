# Custom Ads — Session Handoff / Resume Here

> **Purpose:** pick up the custom ad work on a different machine. Read this top-to-bottom and you
> have the whole context — no prior chat needed.
>
> **On the new device:** `git fetch && git checkout main && git pull && npm install`

---

## 1. Where things stand right now

|                 |                                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| **Phase 1**     | ✅ **Shipped.** PR #1 merged to `main`; ads are **live on www.4lebanon.com** |
| **Phase 2**     | Rotating carousel for a 2nd advertiser — branch `feat/promo-carousel`        |
| **Advertisers** | MDM Atelier · ~~Toyota Lebanon (BUMC)~~ **paused**                           |
| **Flag**        | `NEXT_PUBLIC_ADS_ENABLED=true` on **Production and Preview**                 |

**Live today:** 4 wide homepage banners + 2 article banners, all MDM Atelier.

⚠️ **Toyota is paused** (client request, 2026-08-17). Every Toyota entry in `lib/ads/config.ts`
carries `active: false`, so `getEligibleAds()` filters them out and nothing Toyota renders. The
entries and the `/public/ads/toyota-*` creatives are untouched — delete the `active: false` lines
to switch the campaign back on. With one advertiser left, the shared slots each hold a single
creative and render as plain static ads; they resume rotating the moment Toyota comes back.

**Phase 2 (carousel):** the 4 wide homepage slots rotate between Toyota and MDM Atelier whenever
both are active. Built on `feat/promo-carousel`, reviewed on that branch's Vercel preview before
merge. Article slots stay single-advertiser.

⚠️ **The flag is now build-time-baked into Production too.** Changing it requires a redeploy, not
just an env edit.

Also shipped in the phase-1 merge, unrelated to ads: **`createStaticClient()`** in
`lib/supabase/server.ts`. `createClient()` awaits `cookies()` (a dynamic API), which combined with
`generateStaticParams` + `revalidate` made non-prerendered article/section pages return 500
(`DYNAMIC_SERVER_USAGE`). The 13 public read paths now use the cookie-free client; **admin, auth
callback, upload and search must keep `createClient()`**.

---

## 2. What was built

A **custom, hardcoded ad system** replacing the abandoned Google AdSense plan. An ad = an image
that opens an advertiser URL in a new tab, blended into the design, RTL-correct, zero layout shift.

**Why not AdSense:** ~1,200 visits/mo would earn a few dollars while adding third-party
scripts/cookies/approval friction. Custom = full design control, no third-party tracking, client
controls who advertises.

### Files

| File                                          | Role                                                                                 |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `lib/ads/types.ts`                            | `AdPlacement` union, `AdVariant` (`wide`\|`card`\|`sidebar`), `AdCreative` interface |
| `lib/ads/config.ts`                           | **THE file you edit to change ads** — the `ADS[]` array                              |
| `lib/ads/select.ts`                           | Pure `getEligibleAds()`, `pickAd()`, `startIndexFor()`                               |
| `lib/ads/select.test.ts`                      | Unit tests, incl. the per-placement aspect-ratio invariant over the real config      |
| `lib/ads/flags.ts`                            | `adsEnabled()`                                                                       |
| `components/ads/ad-slot.tsx`                  | `<AdSlot>` **server** component: validates creatives, static vs rotating             |
| `components/ads/promo-carousel.tsx`           | `'use client'` crossfade rotator (autoplay, swipe, dots)                             |
| `components/ads/index.ts`                     | Barrel export                                                                        |
| `public/ads/*.jpg`                            | Toyota + MDM Atelier creatives (`*-source-*` files are advertiser originals)         |
| `public/ads/*.svg`                            | 3 grey "مساحة إعلانية / Your ad here" demo placeholders (unreferenced)               |
| `lib/env.ts`                                  | `NEXT_PUBLIC_ADS_ENABLED` in Zod schema **and** `validateClientEnv()`                |
| `app/globals.css`                             | `.promo-slot*` styles (3 variants) + `.article-right-rail`                           |
| `app/page.tsx`, `app/article/[slug]/page.tsx` | `<AdSlot>` insertions                                                                |
| `app/privacy/page.tsx`                        | Arabic sponsored-content clause                                                      |

### How it works

1. `<AdSlot placement="..." variant="..." />` is dropped at a seam in a page.
2. Flag off → renders `null`. No creative for that placement → renders `null`. Bad URL
   (`sanitizeUrl`) → renders `null`. **Wiring a slot is always safe.**
3. Otherwise it renders an `<aside>` with an "إعلان" label + `<a target="_blank"
rel="noopener noreferrer sponsored" data-promo-id="...">` wrapping a `next/image` inside an
   `aspect-ratio` box built from the creative's own `width`/`height` → **zero CLS**.
4. **One creative for that placement → static ad** (no JS). **Two or more → they rotate** in
   `<PromoCarousel>`: every slide is in the SSR HTML inside the one reserved box and crossfades, so
   advancing never moves the page and no-JS visitors still see an ad. Autoplays every 6s; pauses on
   hover/focus, on a hidden tab, and when scrolled out of view; honours `prefers-reduced-motion`;
   supports swipe and dots. Hidden slides get `aria-hidden` + `tabIndex={-1}` + `pointer-events:none`
   so only the visible advertiser can be tabbed to or clicked.

**Hard rule:** every creative sharing a placement must have the **same width/height ratio** — the
slot reserves one box. A unit test over the real `ADS` config enforces this, so a bad config edit
fails `npm test` rather than silently shipping layout shift.

`weight` only affects `pickAd()` and has **no effect** on a rotating placement (every eligible
creative is shown in turn).

### Live slots

Five `<AdSlot>`s are wired into the homepage and four into the article page, but **a slot only
renders if `lib/ads/config.ts` has an entry for it** — an unsold slot renders nothing at all, not
a placeholder.

**Homepage — 5 wired, 4 filled (MDM only while Toyota is paused; all four rotate once it returns):**
`home-top` → أهم الأخبار → `home-after-featured` → آخر الأخبار → `home-after-latest` →
[dynamic section] → `home-mid-sections` _(empty on purpose)_ → … → `home-before-mostread` →
الأكثر قراءة

All four filled wide slots use **1200×250** (4.8:1) so they can rotate. Each slot's lead slide is
offset deterministically by `startIndexFor(placement, count)`, so they don't all open with the same
advertiser.

`home-mid-sections` repeats after every section except the last, so filling it adds ~3 more
banners at once. It was deliberately left empty to keep the page from feeling cluttered — add an
entry to switch it back on.

**Article — 4 wired, 2 filled, single-advertiser:** `article-top` (above breadcrumbs) and
`article-in-body` (before recommended) run MDM Atelier's 728×200 (Toyota's matching 728×200 entries
are paused). `article-sidebar` (under trending, desktop ≥1500px only) and
`article-after-recommended` have no creative and render nothing; the sidebar needs a 300×250.

The grey `public/ads/placeholder-*.svg` demo files are no longer referenced. They're kept only in
case an unsold slot should ever advertise itself again — delete them freely.

---

## 3. Decisions already made (do not re-litigate)

- **Hardcoded, not admin/DB-managed.** Client keeps control; dev edits config + deploys.
  Admin self-service = separate future paid phase.
- **Off by default** via `NEXT_PUBLIC_ADS_ENABLED` so it merges safely.
- **Ad-blocker-safe naming:** rendered classes/attributes use `promo-` — **never**
  `ad`/`ads`/`banner`/`sponsor`. This is why the variant is `wide`, not `banner`.
  (`rel="...sponsored"` is fine — it's an attribute value, not a class.)
- **Images live in `public/ads/`** — no `next.config.ts` or CSP changes needed (`img-src 'self'`).
  Do **not** hot-link advertiser-hosted images.
- **Tracking = Tier 0**: plain links + `data-promo-id` for Clarity/Vercel Analytics segmentation.
  Real click reporting is a paid add-on later (would use a `/api/promo/[id]/go` redirect).
- **Ads labeled "إعلان"**, open in a new tab, allowed on every section (no exclusions).
- **No cookie-consent banner** needed — no third-party ad tech.

### Client answers on record

Client supplies the images · no real ad ready yet (capability build) · links to a specific
advertiser page (e.g. Toyota Lebanon) · homepage **and** articles · no excluded sections ·
labeled · new tab · no click reporting for now · hardcoded is fine, dev keeps control ·
privacy note OK.

---

## 4. Adding a REAL ad (the normal workflow)

1. Put the image in `public/ads/` (WebP/JPG/PNG, ideally < 200KB).
2. Add an entry to `ADS[]` in `lib/ads/config.ts`:

```ts
{
  id: 'toyota-home-top',            // stable slug, also the data-promo-id
  placement: 'home-top',            // must be a value from AdPlacement
  src: '/ads/toyota-banner.webp',
  href: 'https://toyota-lebanon.example/landing',
  alt: 'إعلان تويوتا لبنان',        // Arabic alt text
  width: 1200,                      // ← the image's REAL pixel dimensions
  height: 200,
},
```

3. Commit + push. Merge to `main` when it should go live.

**Fitting:** the slot conforms to the image — the reserved box is generated from the creative's
own `width`/`height`, so any image fits with no crop or squash. **The only rule: use the file's
true dimensions.** The image renders with `object-fit: cover`, so wrong dimensions = cropping.
If you ever need "show the whole image letterboxed instead of cropping," add an optional
`fit?: 'cover' | 'contain'` field to `AdCreative` and use it in `ad-slot.tsx` (~5 lines).

**Sizes to request from the client:**

| Slot                             | Suggested            | Note                                                 |
| -------------------------------- | -------------------- | ---------------------------------------------------- |
| Homepage wide (`variant="wide"`) | 1200×200 or 1200×250 | full content width                                   |
| Article top / in-body (`card`)   | 728×200              | article column ~850px max                            |
| Sidebar (`sidebar`)              | 300×250              | IAB medium rectangle — advertisers usually have this |

⚠️ **Mobile:** a 6:1 banner is only ~60px tall on a 360px phone. If traffic is mostly mobile,
request a squarer ratio (3:1/4:1) or add an optional separate mobile creative later.

---

## 5. Go-live checklist (when the client approves)

- [ ] Client signs off on the preview URL.
- [x] Replace demo creatives in `lib/ads/config.ts` with the real advertiser image + URL + dims.
      **Done** — the Toyota Lebanon (BUMC) Lite Ace / Dyna creative ran in 4 homepage slots and
      2 article slots, pointing at `https://toyotalebanon.com/Vehicles/11/Dyna`; MDM Atelier was
      added to the same slots in phase 2. Unsold slots render nothing. _(Toyota has since been
      paused — see §1.)_
- [ ] Get a **300×250** sidebar creative from the advertiser and add an `article-sidebar` entry.
- [ ] Merge PR #1 into `main`. _(Optionally squash the noisy commits —`17be41f` is an empty
      rebuild-trigger commit.)_
- [ ] In Vercel, add `NEXT_PUBLIC_ADS_ENABLED=true` to the **Production** environment.
- [ ] **Redeploy** — `NEXT_PUBLIC_*` vars are baked in at BUILD time; setting the var alone does
      nothing to an existing deployment.

---

## 6. Gotchas learned the hard way

- **`NEXT_PUBLIC_ADS_ENABLED` is build-time, not runtime.** Changing it in Vercel requires a
  redeploy (an empty commit works: `git commit --allow-empty -m "..." && git push`).
- **Scope the Preview env var to Preview only** — that's what keeps production clean.
- The site's security middleware **403s scanner-like user agents**, so `curl` needs a real
  browser `-A "Mozilla/5.0 ..."` header when testing pages.
- When counting ads in HTML, `grep -oc` counts _lines_, not matches (SSR puts several ads on one
  line). Use `grep -o ... | wc -l`. Also each id appears twice in source — once in HTML, once in
  React's hydration payload.
- Article-page ads are **below the fold** — screenshots of the top of an article won't show them.
- The article page is a 3-column CSS grid; the sidebar ad lives inside `.article-right-rail`
  alongside `<TrendingSidebar />` so it doesn't become a 4th grid child and break the layout.
- **Never call `createClient()` (the cookie one) from a public page.** `cookies()` is a dynamic
  API, so it opts the route out of static rendering. On `article/[slug]` — which pairs
  `generateStaticParams` with `revalidate` — that made every slug _not_ prerendered at build time
  500 with `DYNAMIC_SERVER_USAGE`. Public reads use **`createStaticClient()`** (cookie-free anon).
  Only admin / auth-callback / upload / search keep `createClient()`.
- **A page that reads `searchParams` can never be SSG.** `section/[slug]` is filter-driven, so it
  is `force-dynamic` on purpose. Don't "optimise" it back to `revalidate`.
- **`generateStaticParams` fails silently on a bad service key.** An invalid
  `SUPABASE_SERVICE_ROLE_KEY` returns zero rows, not an error, so the build ships with nothing
  prerendered — which is exactly what used to trigger the 500 above. There is now a
  `console.warn` in the build log for this; check it if pages feel slow.

---

## 7. Next / planned (not built)

**Ad swiper (carousel).** Groundwork exists: `getEligibleAds()` already returns _all_ matching
creatives and `pickAd()` just narrows to one; `weight`, `active`, `startAt`/`endAt` are already in
the type. To build:

- Consider the **simpler alternative first**: server-side rotation (different advertiser per page
  load, zero JS) — advertisers often prefer undivided attention over sliding away.
- Keep `AdSlot` a server component (flag + sanitize + selection), pass the array to a small
  `'use client'` child for the sliding.
- All slides in a slot must share one aspect ratio or the page jumps between slides.
- RTL: prefer **CSS scroll-snap** over a JS swiper — correct RTL by default, no library, better perf.
- Autoplay: pause on hover/focus, respect `prefers-reduced-motion`, slow enough that clicks don't
  land on the wrong advertiser.

**Other future asks:** admin-managed ads / selling space to local businesses (separate phase),
real click reporting (paid add-on), optional per-slot mobile creatives.

---

## 8. Commands

```bash
npm run dev          # localhost:3000 (ads OFF unless .env.local has NEXT_PUBLIC_ADS_ENABLED=true)
npm test             # 9 selector unit tests
npm run typecheck    # tsc --noEmit
npm run lint         # 3 pre-existing warnings in unrelated files are expected
npm run build        # full production build
```

Pre-commit hooks auto-run prettier + eslint + typecheck; pre-push runs typecheck.

**Related docs:** `docs/CUSTOM_ADS_PLAN.md` (client questions + build prompt),
`docs/superpowers/specs/2026-06-15-custom-ad-system-design.md` (design spec),
`docs/superpowers/plans/2026-06-15-custom-ad-system.md` (implementation plan).

---

## 9. Prompt to paste on the other device

```
Continue work on the custom ad system for the 4Lebanon site.

Read docs/CUSTOM_ADS_HANDOFF.md first — it has the full context: what's built, the decisions
already made, the current branch/PR/preview state, and the gotchas.

I'm on branch feat/custom-ads (PR #1, not merged). Ads are behind NEXT_PUBLIC_ADS_ENABLED,
which is ON for the Vercel Preview environment only; production is clean.

Don't re-plan what's already built or re-litigate settled decisions. Tell me what you
understand the current state to be, then wait for my task.
```
