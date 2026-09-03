import type { AdCreative } from './types'

/**
 * The single source of truth for ads. Edit this file (+ deploy) to change ads.
 * To add a new advertiser: drop the image in /public/ads/, add an entry below
 * with the image's REAL intrinsic width/height, and set `href` to the
 * advertiser URL. `href` is optional — omit it and the creative renders as an
 * unlinked plate, which is how an advertiser with no landing page runs.
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

/**
 * Toyota Lebanon (BUMC) — Lite Ace / Dyna 200 commercial vehicles campaign.
 *
 * PAUSED (2026-08-17, client request): every entry in this campaign carries
 * `active: false`, so none of them render. The creatives stay in /public/ads/
 * and the entries stay here — drop the `active: false` lines to switch it back
 * on. NOTE: this is a DIFFERENT campaign from the live Toyota Veloz one below;
 * un-pausing it would run two Toyota creatives in the same slots at once.
 */
const TOYOTA_HREF = 'https://toyotalebanon.com/Vehicles/11/Dyna'
const TOYOTA_ALT = 'تويوتا لبنان — لايت إيس ودينا 200 للمركبات التجارية'

/**
 * Toyota Lebanon (BUMC) — Veloz 2026 campaign. LIVE.
 *
 * The advertiser supplied artwork already cut to the exact slot sizes, so these
 * are the originals, uncropped and unrecomposed. A supplied 1200x200 (6:1) cut
 * was dropped: no placement uses that ratio any more.
 *
 * This campaign is also what finally fills `article-sidebar` — the 300x250 slot
 * that had been wired but empty since phase 1.
 */
const VELOZ_HREF = 'https://toyotalebanon.com/Vehicles/22/veloz'
const VELOZ_ALT = 'تويوتا فيلوز 2026 — سبعة مقاعد من تويوتا لبنان'

/** MDM Atelier — women's fashion. Banners recomposed from the supplied 1600x800 source. */
const MDM_HREF = 'https://mdm-atelier.com/'
const MDM_ALT = 'إم دي إم أتيليه — أزياء نسائية'

export const ADS: AdCreative[] = [
  {
    id: 'toyota-home-top',
    active: false,
    placement: 'home-top',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x250.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'toyota-home-after-featured',
    active: false,
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
    active: false,
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
    active: false,
    placement: 'home-before-mostread',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x250.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'toyota-article-top',
    active: false,
    placement: 'article-top',
    src: '/ads/toyota-lite-ace-dyna-card-728x200.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'toyota-article-in-body',
    active: false,
    placement: 'article-in-body',
    src: '/ads/toyota-lite-ace-dyna-card-728x200.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 728,
    height: 200,
  },

  // MDM Atelier fills the same six slots as Toyota. With Toyota paused, it
  // shares each of them with Toyota Veloz below, so they rotate between those
  // two; un-pausing Toyota would make it three.
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
  {
    id: 'mdm-article-top',
    placement: 'article-top',
    src: '/ads/mdm-atelier-card-728x200.jpg',
    href: MDM_HREF,
    alt: MDM_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'mdm-article-in-body',
    placement: 'article-in-body',
    src: '/ads/mdm-atelier-card-728x200.jpg',
    href: MDM_HREF,
    alt: MDM_ALT,
    width: 728,
    height: 200,
  },
  // Toyota Veloz 2026 joins the six shared slots, so each rotates between two
  // advertisers, and takes `article-sidebar` on its own (a placement with one
  // creative renders as a plain static ad, no carousel).
  {
    id: 'veloz-home-top',
    placement: 'home-top',
    src: '/ads/toyota-veloz-wide-1200x250.jpg',
    href: VELOZ_HREF,
    alt: VELOZ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'veloz-home-after-featured',
    placement: 'home-after-featured',
    src: '/ads/toyota-veloz-wide-1200x250.jpg',
    href: VELOZ_HREF,
    alt: VELOZ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'veloz-home-after-latest',
    placement: 'home-after-latest',
    src: '/ads/toyota-veloz-wide-1200x250.jpg',
    href: VELOZ_HREF,
    alt: VELOZ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'veloz-home-before-mostread',
    placement: 'home-before-mostread',
    src: '/ads/toyota-veloz-wide-1200x250.jpg',
    href: VELOZ_HREF,
    alt: VELOZ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'veloz-article-top',
    placement: 'article-top',
    src: '/ads/toyota-veloz-card-728x200.jpg',
    href: VELOZ_HREF,
    alt: VELOZ_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'veloz-article-in-body',
    placement: 'article-in-body',
    src: '/ads/toyota-veloz-card-728x200.jpg',
    href: VELOZ_HREF,
    alt: VELOZ_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'veloz-article-sidebar',
    placement: 'article-sidebar',
    src: '/ads/toyota-veloz-sidebar-300x250.jpg',
    href: VELOZ_HREF,
    alt: VELOZ_ALT,
    width: 300,
    height: 250,
  },
  // NOTE: `article-after-recommended` is deliberately left empty. An unfilled
  // slot renders nothing at all rather than a grey placeholder.
]
