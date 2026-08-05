# Custom Ad System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a custom, hardcoded image+click-redirect ad system to 4lebanon.com that blends into the design, is off by default, and is reviewable on a Vercel preview branch.

**Architecture:** A typed config array (`lib/ads/config.ts`) feeds pure selector functions (`lib/ads/select.ts`) consumed by a server component `<AdSlot>` rendered at named seams on the homepage and article pages. A build-time flag `NEXT_PUBLIC_ADS_ENABLED` (default `false`) gates all output. Demo placeholder SVGs ship in a tasteful subset of slots; the real advertiser creative replaces a config entry later.

**Tech Stack:** Next.js 16 (App Router, server components), React 19, TypeScript, Tailwind v4, Zod v4. Vitest added for the pure selector unit tests (repo's first tests).

**Branch:** `feat/custom-ads` (already created). Work happens here; `main`/production is never touched until merge.

**Conventions:** All rendered class names / data attributes use `promo-` (never `ad/ads/banner/sponsor`) to avoid ad-blockers hiding slots. RTL uses logical CSS only. Every image reserves an aspect-ratio box → zero CLS.

---

## File structure

**Create:**

- `lib/ads/types.ts` — `AdPlacement`/`AdVariant` types + `AdCreative` interface.
- `lib/ads/select.ts` — pure `getEligibleAds()` + `pickAd()`.
- `lib/ads/select.test.ts` — Vitest unit tests for the selectors.
- `lib/ads/flags.ts` — `adsEnabled()` flag reader.
- `lib/ads/config.ts` — the hardcoded `ADS[]` array (the file edited to change ads).
- `components/ads/ad-slot.tsx` — the `<AdSlot>` server component.
- `components/ads/index.ts` — barrel export.
- `public/ads/placeholder-banner.svg`, `public/ads/placeholder-card.svg`, `public/ads/placeholder-sidebar.svg` — neutral demo creatives.

**Modify:**

- `lib/env.ts` — add `NEXT_PUBLIC_ADS_ENABLED` to the Zod client schema and to `validateClientEnv()`.
- `app/globals.css` — `.promo-slot*` styles (3 variants) + `.article-right-rail`.
- `app/page.tsx` — 3 homepage slots.
- `app/article/[slug]/page.tsx` — 3 article slots (incl. sidebar rail).
- `app/privacy/page.tsx` — sponsored-content clause.

**Demo population:** `home-after-latest` (banner), `article-in-body` (card), `article-sidebar` (sidebar) get the placeholder. `home-mid-sections`, `home-before-mostread`, `article-after-recommended` are wired but unpopulated (AdSlot returns `null` → renders nothing).

---

## Task 1: Add Vitest for selector unit tests

**Files:**

- Modify: `package.json` (devDependency + scripts)

- [ ] **Step 1: Install Vitest as a dev dependency**

Run:

```bash
npm install -D vitest@^3
```

Expected: `vitest` added under devDependencies; lockfile updated.

- [ ] **Step 2: Add test scripts to package.json**

In `package.json`, add to the `"scripts"` object (after `"typecheck"`):

```json
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Verify the test runner works (no tests yet)**

Run:

```bash
npm test
```

Expected: Vitest runs and reports "No test files found" (exit non-zero is fine here) — confirms Vitest is installed and callable.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add vitest for unit tests"
```

---

## Task 2: Ad types + selectors (TDD)

**Files:**

- Create: `lib/ads/types.ts`
- Create: `lib/ads/select.ts`
- Test: `lib/ads/select.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `lib/ads/select.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { AdCreative } from './types'
import { getEligibleAds, pickAd } from './select'

const base: AdCreative = {
  id: 'a',
  placement: 'home-after-latest',
  src: '/ads/x.svg',
  href: 'https://example.com',
  alt: 'ad',
  width: 1200,
  height: 200,
}

describe('getEligibleAds', () => {
  it('returns only ads matching the placement', () => {
    const ads: AdCreative[] = [base, { ...base, id: 'b', placement: 'article-in-body' }]
    expect(getEligibleAds(ads, 'home-after-latest').map((a) => a.id)).toEqual(['a'])
  })

  it('excludes ads with active === false', () => {
    const ads: AdCreative[] = [{ ...base, active: false }]
    expect(getEligibleAds(ads, 'home-after-latest')).toEqual([])
  })

  it('excludes ads missing src or href', () => {
    const ads: AdCreative[] = [
      { ...base, id: 'no-src', src: '' },
      { ...base, id: 'no-href', href: '' },
    ]
    expect(getEligibleAds(ads, 'home-after-latest')).toEqual([])
  })

  it('respects startAt / endAt flight window', () => {
    const now = 1_000_000
    const future: AdCreative = {
      ...base,
      id: 'future',
      startAt: new Date(now + 1000).toISOString(),
    }
    const past: AdCreative = { ...base, id: 'past', endAt: new Date(now - 1000).toISOString() }
    const live: AdCreative = { ...base, id: 'live', startAt: new Date(now - 1000).toISOString() }
    expect(getEligibleAds([future, past, live], 'home-after-latest', now).map((a) => a.id)).toEqual(
      ['live']
    )
  })
})

describe('pickAd', () => {
  it('returns null for an empty list', () => {
    expect(pickAd([])).toBeNull()
  })

  it('returns the only ad deterministically', () => {
    expect(pickAd([base])?.id).toBe('a')
  })

  it('defaults to the first ad when no seed is given', () => {
    const ads: AdCreative[] = [base, { ...base, id: 'b' }]
    expect(pickAd(ads)?.id).toBe('a')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npx vitest run lib/ads/select.test.ts
```

Expected: FAIL — cannot resolve `./types` / `./select` (modules not created yet).

- [ ] **Step 3: Create the types**

Create `lib/ads/types.ts`:

```ts
export type AdPlacement =
  | 'home-after-latest'
  | 'home-mid-sections'
  | 'home-before-mostread'
  | 'article-sidebar'
  | 'article-in-body'
  | 'article-after-recommended'

export type AdVariant = 'wide' | 'card' | 'sidebar'

export interface AdCreative {
  /** Stable slug; used as React key and data-promo-id. */
  id: string
  placement: AdPlacement
  /** '/ads/foo.svg' (local) | full https URL | bare Supabase storage path. */
  src: string
  /** Advertiser destination URL. */
  href: string
  /** Arabic alt text (accessibility + SEO). */
  alt: string
  /** Optional label override; defaults to 'إعلان'. */
  label?: string
  /** Intrinsic px — REQUIRED. Drives the reserved aspect-ratio box (CLS defense). */
  width: number
  height: number
  /** Rotation weight (default 1). */
  weight?: number
  /** Default true. */
  active?: boolean
  /** Optional ISO flight window. */
  startAt?: string
  endAt?: string
}
```

- [ ] **Step 4: Implement the selectors**

Create `lib/ads/select.ts`:

```ts
import type { AdCreative, AdPlacement } from './types'

/**
 * Filter ads down to those eligible for a placement right now.
 * Pure — `now` is injectable for testing.
 */
export function getEligibleAds(
  ads: AdCreative[],
  placement: AdPlacement,
  now: number = Date.now()
): AdCreative[] {
  return ads.filter((ad) => {
    if (ad.placement !== placement) return false
    if (ad.active === false) return false
    if (!ad.src || !ad.href) return false
    if (ad.startAt && new Date(ad.startAt).getTime() > now) return false
    if (ad.endAt && new Date(ad.endAt).getTime() <= now) return false
    return true
  })
}

/**
 * Pick one ad by weight. Deterministic: with no seed it returns the first ad,
 * so server and client render identically (no hydration mismatch).
 */
export function pickAd(ads: AdCreative[], seed?: number): AdCreative | null {
  if (ads.length === 0) return null
  if (ads.length === 1) return ads[0]
  const totalWeight = ads.reduce((sum, ad) => sum + (ad.weight ?? 1), 0)
  const target = (((seed ?? 0) % totalWeight) + totalWeight) % totalWeight
  let acc = 0
  for (const ad of ads) {
    acc += ad.weight ?? 1
    if (target < acc) return ad
  }
  return ads[0]
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run:

```bash
npx vitest run lib/ads/select.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 6: Commit**

```bash
git add lib/ads/types.ts lib/ads/select.ts lib/ads/select.test.ts
git commit -m "feat: ad types and pure selector functions with tests"
```

---

## Task 3: Feature flag (env + helper)

**Files:**

- Modify: `lib/env.ts`
- Create: `lib/ads/flags.ts`

- [ ] **Step 1: Add the flag to the Zod client schema**

In `lib/env.ts`, inside `clientEnvSchema` (the `z.object({ ... })` starting at line 21), add after the `NEXT_PUBLIC_SITE_URL` field (before the closing `})` at line 36):

```ts
  // Custom ad system toggle (off by default; merge-safe)
  NEXT_PUBLIC_ADS_ENABLED: z.enum(['true', 'false']).default('false'),
```

- [ ] **Step 2: Add the flag to validateClientEnv()**

In `lib/env.ts`, inside the object passed to `clientEnvSchema.safeParse({ ... })` in `validateClientEnv()` (lines 67-71), add:

```ts
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_ADS_ENABLED: process.env.NEXT_PUBLIC_ADS_ENABLED,
  })
```

- [ ] **Step 3: Create the flag helper**

Create `lib/ads/flags.ts`:

```ts
/**
 * Whether the custom ad system is enabled. Reads the NEXT_PUBLIC_ flag, which
 * Next.js inlines at build time (works in server and client components).
 * Default off — production stays clean until this is set to 'true'.
 */
export function adsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED === 'true'
}
```

- [ ] **Step 4: Verify typecheck passes**

Run:

```bash
npm run typecheck
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/env.ts lib/ads/flags.ts
git commit -m "feat: NEXT_PUBLIC_ADS_ENABLED feature flag"
```

---

## Task 4: Demo placeholder creatives + config

**Files:**

- Create: `public/ads/placeholder-banner.svg`
- Create: `public/ads/placeholder-card.svg`
- Create: `public/ads/placeholder-sidebar.svg`
- Create: `lib/ads/config.ts`

- [ ] **Step 1: Create the banner placeholder (1200×200)**

Create `public/ads/placeholder-banner.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 200" width="1200" height="200" role="img" aria-label="مساحة إعلانية">
  <rect width="1200" height="200" fill="#f1f5f9"/>
  <rect x="3" y="3" width="1194" height="194" fill="none" stroke="#830005" stroke-width="2" stroke-dasharray="10 8" opacity="0.35"/>
  <text x="600" y="95" text-anchor="middle" font-family="system-ui, sans-serif" font-size="36" font-weight="700" fill="#830005">مساحة إعلانية</text>
  <text x="600" y="138" text-anchor="middle" font-family="system-ui, sans-serif" font-size="20" fill="#64748b">Your ad here</text>
</svg>
```

- [ ] **Step 2: Create the card placeholder (728×200)**

Create `public/ads/placeholder-card.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 728 200" width="728" height="200" role="img" aria-label="مساحة إعلانية">
  <rect width="728" height="200" fill="#f1f5f9"/>
  <rect x="3" y="3" width="722" height="194" fill="none" stroke="#830005" stroke-width="2" stroke-dasharray="10 8" opacity="0.35"/>
  <text x="364" y="95" text-anchor="middle" font-family="system-ui, sans-serif" font-size="32" font-weight="700" fill="#830005">مساحة إعلانية</text>
  <text x="364" y="135" text-anchor="middle" font-family="system-ui, sans-serif" font-size="18" fill="#64748b">Your ad here</text>
</svg>
```

- [ ] **Step 3: Create the sidebar placeholder (300×250)**

Create `public/ads/placeholder-sidebar.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 250" width="300" height="250" role="img" aria-label="مساحة إعلانية">
  <rect width="300" height="250" fill="#f1f5f9"/>
  <rect x="3" y="3" width="294" height="244" fill="none" stroke="#830005" stroke-width="2" stroke-dasharray="10 8" opacity="0.35"/>
  <text x="150" y="120" text-anchor="middle" font-family="system-ui, sans-serif" font-size="24" font-weight="700" fill="#830005">مساحة إعلانية</text>
  <text x="150" y="152" text-anchor="middle" font-family="system-ui, sans-serif" font-size="15" fill="#64748b">Your ad here</text>
</svg>
```

- [ ] **Step 4: Create the ad config**

Create `lib/ads/config.ts`:

```ts
import type { AdCreative } from './types'

/**
 * The single source of truth for ads. Edit this file (+ deploy) to change ads.
 * To go live with a real advertiser: replace the demo `src` with the advertiser
 * image (drop it in /public/ads/), set `href` to the advertiser URL, and update
 * width/height to the image's intrinsic dimensions.
 *
 * Demo build: only home-after-latest, article-in-body, and article-sidebar are
 * populated (a tasteful subset). The other three placements are wired in the
 * pages but intentionally have no creative, so <AdSlot> renders nothing there.
 */
export const ADS: AdCreative[] = [
  {
    id: 'demo-home-banner',
    placement: 'home-after-latest',
    src: '/ads/placeholder-banner.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 1200,
    height: 200,
  },
  {
    id: 'demo-article-card',
    placement: 'article-in-body',
    src: '/ads/placeholder-card.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 728,
    height: 200,
  },
  {
    id: 'demo-article-sidebar',
    placement: 'article-sidebar',
    src: '/ads/placeholder-sidebar.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 300,
    height: 250,
  },
]
```

- [ ] **Step 5: Commit**

```bash
git add public/ads lib/ads/config.ts
git commit -m "feat: demo ad creatives and hardcoded ad config"
```

---

## Task 5: AdSlot component + styles

**Files:**

- Create: `components/ads/ad-slot.tsx`
- Create: `components/ads/index.ts`
- Modify: `app/globals.css`

- [ ] **Step 1: Create the AdSlot server component**

Create `components/ads/ad-slot.tsx`:

```tsx
import Image from 'next/image'
import { sanitizeUrl } from '@/lib/security'
import { getStorageUrl } from '@/lib/utils'
import { ADS } from '@/lib/ads/config'
import { getEligibleAds, pickAd } from '@/lib/ads/select'
import { adsEnabled } from '@/lib/ads/flags'
import type { AdPlacement, AdVariant } from '@/lib/ads/types'

interface AdSlotProps {
  placement: AdPlacement
  variant?: AdVariant
  className?: string
}

/** Local ('/...') and absolute (http) srcs are used as-is; bare paths go through Supabase. */
function resolveSrc(src: string): string | null {
  if (src.startsWith('/') || src.startsWith('http://') || src.startsWith('https://')) {
    return src
  }
  return getStorageUrl(src)
}

export function AdSlot({ placement, variant = 'wide', className }: AdSlotProps) {
  if (!adsEnabled()) return null

  const ad = pickAd(getEligibleAds(ADS, placement))
  if (!ad) return null

  const safeHref = sanitizeUrl(ad.href)
  const resolvedSrc = resolveSrc(ad.src)
  if (!safeHref || !resolvedSrc) return null

  const label = ad.label ?? 'إعلان'
  const isSvg = resolvedSrc.toLowerCase().endsWith('.svg')
  const sizes =
    variant === 'sidebar'
      ? '320px'
      : variant === 'card'
        ? '(max-width: 850px) 100vw, 850px'
        : '(max-width: 1280px) 100vw, 1216px'

  return (
    <aside
      className={['promo-slot', `promo-slot--${variant}`, className].filter(Boolean).join(' ')}
      aria-label="محتوى مموّل"
    >
      <span className="promo-slot__label">{label}</span>
      <a
        href={safeHref}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="promo-slot__link"
        data-promo-id={ad.id}
      >
        <span className="promo-slot__frame" style={{ aspectRatio: `${ad.width} / ${ad.height}` }}>
          <Image
            src={resolvedSrc}
            alt={ad.alt}
            fill
            sizes={sizes}
            className="promo-slot__img"
            unoptimized={isSvg}
          />
        </span>
      </a>
    </aside>
  )
}
```

- [ ] **Step 2: Create the barrel export**

Create `components/ads/index.ts`:

```ts
export { AdSlot } from './ad-slot'
```

- [ ] **Step 3: Add the styles**

Append to the end of `app/globals.css`:

```css
/* ============================================
   PROMO / AD SLOTS  (neutral naming = ad-blocker safe)
   ============================================ */
.promo-slot {
  display: block;
  margin-block: 1.5rem;
}

.promo-slot__label {
  display: block;
  margin-block-end: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: start;
  color: var(--muted-foreground, #64748b);
}

.promo-slot__link {
  display: block;
  overflow: hidden;
  border-radius: 1rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: box-shadow var(--duration-slow, 350ms) var(--ease-out-expo, ease);
}

.promo-slot__link:hover {
  box-shadow: 0 8px 32px rgba(225, 29, 72, 0.12);
}

.promo-slot__frame {
  position: relative;
  display: block;
  width: 100%;
  background: var(--muted, #f1f5f9);
}

.promo-slot__img {
  object-fit: cover;
  object-position: center;
}

/* Wide: full-width promo centered within the page, matches max-w-7xl content width */
.promo-slot--wide {
  max-width: 80rem;
  margin-inline: auto;
  padding-inline: 1rem;
}

/* Card: fills its container (e.g. the 850px reading column) */
.promo-slot--card {
  width: 100%;
}

/* Sidebar: rounder glass-ish look to match the trending widget */
.promo-slot--sidebar .promo-slot__link {
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.06);
}

/* Right rail wraps trending + sidebar ad into the single 3rd grid column. */
.article-right-rail {
  display: none;
}

@media (min-width: 1500px) {
  .article-right-rail {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    position: sticky;
    top: 120px;
    height: fit-content;
  }
}
```

- [ ] **Step 4: Verify typecheck + lint**

Run:

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add components/ads app/globals.css
git commit -m "feat: AdSlot component and promo-slot styles"
```

---

## Task 6: Wire homepage slots

**Files:**

- Modify: `app/page.tsx`

- [ ] **Step 1: Add imports**

In `app/page.tsx`, add after line 8 (`import type { ArticleListItem } ...`):

```tsx
import { Fragment } from 'react'
import { AdSlot } from '@/components/ads'
```

- [ ] **Step 2: Insert the `home-after-latest` slot**

In `app/page.tsx`, find the end of the latest-news section (the `)}` closing `{data.latest.length > 0 && ( ... )}` at line ~497) and the `{/* ==================== DYNAMIC SECTIONS ... */}` comment that follows. Insert the slot between them:

```tsx
      )}

      {/* Promo slot — after latest news */}
      <AdSlot placement="home-after-latest" variant="wide" />

      {/* ==================== DYNAMIC SECTIONS - BENTO GRID ==================== */}
```

- [ ] **Step 3: Wrap the dynamic-sections map to inject the `home-mid-sections` slot**

In `app/page.tsx`, change the dynamic-sections map opening (line ~500) from:

```tsx
      {data.sectionsWithArticles.map((section, sectionIndex) => (
        <section
          key={section.slug}
          className={`py-12 sm:py-16 lg:py-20 ${sectionIndex % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
```

to:

```tsx
      {data.sectionsWithArticles.map((section, sectionIndex) => (
        <Fragment key={section.slug}>
        <section
          className={`py-12 sm:py-16 lg:py-20 ${sectionIndex % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
```

Then change the matching close of that `<section>` (the `</section>` immediately before the map's `))}` at line ~636) from:

```tsx
        </section>
      ))}
```

to:

```tsx
        </section>
        {sectionIndex === 1 && <AdSlot placement="home-mid-sections" variant="wide" />}
        </Fragment>
      ))}
```

- [ ] **Step 4: Insert the `home-before-mostread` slot**

In `app/page.tsx`, between the map's closing `))}` (line ~636) and the `{/* ==================== MOST READ ... */}` comment (line ~638), insert:

```tsx
      ))}

      {/* Promo slot — before most read */}
      <AdSlot placement="home-before-mostread" variant="wide" />

      {/* ==================== MOST READ (الأكثر قراءة) SECTION ==================== */}
```

- [ ] **Step 5: Verify typecheck + lint**

Run:

```bash
npm run typecheck && npm run lint
```

Expected: no errors (note `sectionIndex` is still referenced, so the unused-var lint rule stays satisfied).

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat: wire ad slots into the homepage"
```

---

## Task 7: Wire article-page slots (incl. sidebar rail)

**Files:**

- Modify: `app/article/[slug]/page.tsx`

- [ ] **Step 1: Add the import**

In `app/article/[slug]/page.tsx`, add after line 17 (`import { JsonLd, ... } from '@/components/json-ld'`):

```tsx
import { AdSlot } from '@/components/ads'
```

- [ ] **Step 2: Insert the `article-in-body` slot and the `article-after-recommended` slot**

In `app/article/[slug]/page.tsx`, change the block around `<RecommendedArticles>` (lines ~389-394) from:

```tsx
            {/* Mobile Social Bar */}
            <SocialShareBar url={articleUrl} title={article.title_ar} variant="mobile" />

            {/* Recommended Articles */}
            <RecommendedArticles articles={relatedArticles} />
          </div>
```

to:

```tsx
            {/* Mobile Social Bar */}
            <SocialShareBar url={articleUrl} title={article.title_ar} variant="mobile" />

            {/* Promo slot — in body */}
            <AdSlot placement="article-in-body" variant="card" />

            {/* Recommended Articles */}
            <RecommendedArticles articles={relatedArticles} />

            {/* Promo slot — after recommended */}
            <AdSlot placement="article-after-recommended" variant="card" />
          </div>
```

- [ ] **Step 3: Wrap the trending sidebar in a rail with the sidebar slot**

In `app/article/[slug]/page.tsx`, change (lines ~396-397):

```tsx
{
  /* Right Sidebar - Trending (Desktop only) */
}
;<TrendingSidebar />
```

to:

```tsx
{
  /* Right Sidebar - Trending + Promo (Desktop only, single grid column) */
}
;<div className="article-right-rail">
  <TrendingSidebar />
  <AdSlot placement="article-sidebar" variant="sidebar" />
</div>
```

- [ ] **Step 4: Verify typecheck + lint**

Run:

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add "app/article/[slug]/page.tsx"
git commit -m "feat: wire ad slots into the article page with sidebar rail"
```

---

## Task 8: Privacy clause

**Files:**

- Modify: `app/privacy/page.tsx`

- [ ] **Step 1: Add the sponsored-content section**

In `app/privacy/page.tsx`, add a new `<section>` after the cookies section (after line 29, before the "حماية البيانات" section at line 31):

```tsx
<section>
  <h2 className="mb-3 text-xl font-bold text-gray-800">الإعلانات والمحتوى المموّل</h2>
  <p className="leading-relaxed text-gray-600">
    قد يعرض الموقع صوراً إعلانية مموّلة موسومة بكلمة «إعلان». عند النقر عليها يتم تحويلكم إلى مواقع
    جهات خارجية تخضع لسياسات الخصوصية الخاصة بها. لا يستخدم الموقع نصوصاً برمجية إعلانية من جهات
    خارجية ولا ملفات تعريف ارتباط لاستهداف الإعلانات.
  </p>
</section>
```

- [ ] **Step 2: Verify typecheck + lint**

Run:

```bash
npm run typecheck && npm run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/privacy/page.tsx
git commit -m "docs: add sponsored-content clause to privacy policy"
```

---

## Task 9: Full verification + push for preview

**Files:** none (verification only)

- [ ] **Step 1: Run the unit tests, typecheck, lint**

Run:

```bash
npm test && npm run typecheck && npm run lint
```

Expected: tests PASS; no type/lint errors.

- [ ] **Step 2: Verify flag OFF (default) renders no ads**

Ensure `NEXT_PUBLIC_ADS_ENABLED` is unset (or `false`) in `.env.local`, then:

```bash
npm run dev
```

Open `http://localhost:3000` and an article. Expected: site looks identical to before; no "إعلان" labels; no `.promo-slot` elements in the DOM (check DevTools).

- [ ] **Step 3: Verify flag ON renders the demo ads**

Add `NEXT_PUBLIC_ADS_ENABLED=true` to `.env.local`, restart `npm run dev`. Expected:

- Homepage: a banner placeholder with an "إعلان" label appears after the "آخر الأخبار" section.
- Article page: a card placeholder before "Recommended"; on a ≥1500px-wide window, a sidebar placeholder under the trending widget.
- Clicking a placeholder opens `https://www.4lebanon.com` in a new tab.

- [ ] **Step 4: CLS / RTL / mobile checks**

- DevTools → Lighthouse (mobile + desktop) on `/` and an article → **CLS ≈ 0**. Watch the moment the SVG decodes — the reserved box must prevent any shift.
- Confirm the "إعلان" label sits on the **right (start)** side under `dir="rtl"`; no horizontal overflow.
- Device toolbar at ~360px: banner is full-width; the sidebar ad is **hidden** (rail is `display:none` below 1500px).

- [ ] **Step 5: Bad-href guard check**

Temporarily edit `lib/ads/config.ts` to set `demo-home-banner` `href: ''`, reload. Expected: that slot renders nothing (no broken link). Revert the edit afterward.

- [ ] **Step 6: Production CSP check**

Run:

```bash
npm run build && npm start
```

Open `/` with the flag on. Expected: build succeeds; ad images load; **no CSP errors** in the console (local `/ads/*.svg` is covered by `img-src 'self'`).

- [ ] **Step 7: Push the branch for a Vercel preview**

```bash
git push -u origin feat/custom-ads
```

Then in Vercel: set `NEXT_PUBLIC_ADS_ENABLED=true` **scoped to the Preview environment only** (Production stays unset/false), wait for the preview deploy, and open the preview URL to confirm ads show. Send that URL to the client. (Production/`main` remains unaffected.)

---

## Self-review notes

- **Spec coverage:** typed config (Task 4) ✓, pure selectors + tests (Task 2) ✓, `<AdSlot>` with flag/sanitize/CLS/label/neutral-naming (Task 5) ✓, feature flag in both schema + validateClientEnv (Task 3) ✓, 6 named slots wired across home (Task 6) + article incl. sidebar rail (Task 7) ✓, demo subset populated (Task 4) ✓, privacy clause (Task 8) ✓, preview workflow (Task 9 Step 7) ✓, Tier-0 tracking via `data-promo-id` (Task 5) ✓.
- **getStorageUrl caveat** handled by `resolveSrc()` (local `/ads/*` used as-is; never rewritten to Supabase). ✓
- **SVG via next/image** handled by `unoptimized` for `.svg` (no `next.config.ts`/CSP change). ✓
- **Grid integrity:** sidebar ad lives inside `.article-right-rail` (single 3rd column), not as a 4th grid child. ✓
- **Type consistency:** `getEligibleAds(ads, placement, now?)` and `pickAd(ads, seed?)` signatures match between `select.ts`, the tests, and `ad-slot.tsx`. ✓
