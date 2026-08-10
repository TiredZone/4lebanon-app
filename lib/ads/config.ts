import type { AdCreative } from './types'

/**
 * The single source of truth for ads. Edit this file (+ deploy) to change ads.
 * To add a new advertiser: drop the image in /public/ads/, add an entry below
 * with the image's REAL intrinsic width/height, and set `href` to the
 * advertiser URL.
 *
 * Any placement listed below renders its creative; any placement with no entry
 * here renders nothing (so wiring an <AdSlot> in a page is always safe).
 *
 * Naming note: keep filenames in /ads/ free of the tokens `banner`, `image(s)`,
 * `leaderboard`, `square` and `rectangle` — EasyList blocks those specific
 * sub-paths (e.g. `/ads/banners/*$image`). A plain descriptive slug is fine.
 *
 * ROTATION: a placement with two or more entries rotates through them in a
 * carousel; a placement with one entry renders as a plain static ad. Every
 * entry sharing a placement MUST have the same width/height ratio — the slot
 * reserves one box, so a mismatch would shift the page when it advances. A unit
 * test in select.test.ts enforces this.
 *
 * `weight` only affects pickAd() (single-pick selection) and has no effect on a
 * rotating placement, where every eligible creative is shown in turn.
 */

/** Toyota Lebanon (BUMC) — Lite Ace / Dyna 200 commercial vehicles campaign. */
const TOYOTA_HREF = 'https://toyotalebanon.com/Vehicles/11/Dyna'
const TOYOTA_ALT = 'تويوتا لبنان — لايت إيس ودينا 200 للمركبات التجارية'

/** MDM Atelier — women's fashion. Banners recomposed from the supplied 1600x800 source. */
const MDM_HREF = 'https://mdm-atelier.com/'
const MDM_ALT = 'إم دي إم أتيليه — أزياء نسائية'

export const ADS: AdCreative[] = [
  {
    id: 'toyota-home-top',
    placement: 'home-top',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x250.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'toyota-home-after-featured',
    // Uses the 1200x250 creative like the other wide slots: every slot that
    // rotates has to reserve one shared box, so all wide creatives match 4.8:1.
    placement: 'home-after-featured',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x250.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'toyota-home-after-latest',
    placement: 'home-after-latest',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x250.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 250,
  },
  // NOTE: `home-mid-sections` is deliberately left empty. Its <AdSlot> repeats
  // after every section except the last, so a single creative there rendered
  // three more banners and made the homepage feel cluttered. The slot stays
  // wired in app/page.tsx — add an entry here to switch it back on.
  {
    id: 'toyota-home-before-mostread',
    placement: 'home-before-mostread',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x250.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'toyota-article-top',
    placement: 'article-top',
    src: '/ads/toyota-lite-ace-dyna-card-728x200.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'toyota-article-in-body',
    placement: 'article-in-body',
    src: '/ads/toyota-lite-ace-dyna-card-728x200.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 728,
    height: 200,
  },

  // MDM Atelier shares the four wide homepage slots with Toyota, so each of
  // those slots rotates between the two. The article slots stay single-advertiser
  // for now; adding `mdm-atelier-card-728x200.jpg` entries there would rotate
  // them too.
  {
    id: 'mdm-home-top',
    placement: 'home-top',
    src: '/ads/mdm-atelier-wide-1200x250.jpg',
    href: MDM_HREF,
    alt: MDM_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'mdm-home-after-featured',
    placement: 'home-after-featured',
    src: '/ads/mdm-atelier-wide-1200x250.jpg',
    href: MDM_HREF,
    alt: MDM_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'mdm-home-after-latest',
    placement: 'home-after-latest',
    src: '/ads/mdm-atelier-wide-1200x250.jpg',
    href: MDM_HREF,
    alt: MDM_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'mdm-home-before-mostread',
    placement: 'home-before-mostread',
    src: '/ads/mdm-atelier-wide-1200x250.jpg',
    href: MDM_HREF,
    alt: MDM_ALT,
    width: 1200,
    height: 250,
  },
  // NOTE: `article-sidebar` and `article-after-recommended` are deliberately
  // left empty. An unfilled slot renders nothing at all rather than a grey
  // placeholder. Add a 300x250 entry for the sidebar once the advertiser
  // supplies one.
]
