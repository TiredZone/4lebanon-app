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
 * on. NOTE: this is a DIFFERENT campaign from the live Land Cruiser FJ one below;
 * un-pausing it would run two Toyota creatives in the same slots at once.
 */
const TOYOTA_HREF = 'https://toyotalebanon.com/Vehicles/11/Dyna'
const TOYOTA_ALT = 'تويوتا لبنان — لايت إيس ودينا 200 للمركبات التجارية'

/**
 * Toyota Lebanon (BUMC) — Land Cruiser FJ 2027 campaign. LIVE.
 *
 * Replaced the Veloz 2026 campaign on 2026-09-10 (client request). Veloz held
 * exactly these seven placements and its creatives are gone from /public/ads/,
 * so this is a straight swap of one Toyota campaign for another — not a second
 * live Toyota running beside it.
 *
 * The advertiser supplied artwork already cut to the exact slot sizes, so these
 * are the originals, uncropped and unrecomposed. A supplied 1200x200 (6:1) cut
 * was dropped: no placement uses that ratio any more.
 *
 * This campaign is what keeps `article-sidebar` filled — the 300x250 slot that
 * had been wired but empty from phase 1 until Veloz took it on 2026-09-02.
 */
const FJ_HREF = 'https://toyotalebanon.com/Vehicles/3/land-cruiser-fj'
const FJ_ALT = 'تويوتا لاند كروزر إف جيه 2027 — الجيل الجديد من تويوتا لبنان'

/** MDM Atelier — women's fashion. Banners recomposed from the supplied 1600x800 source. */
const MDM_HREF = 'https://mdm-atelier.com/'
const MDM_ALT = 'إم دي إم أتيليه — أزياء نسائية'

/**
 * Sabitech — bakery equipment manufacturer.
 *
 * NO LANDING PAGE: the client asked for this one unlinked, so the entries have
 * no `href` and render as unlinked plates (same box, same 'إعلان' label,
 * nothing to click). Add `href: '...'` to each entry to make them links.
 *
 * Supplied as a 2-page vector Illustrator PDF ("Sabitech logo uplift"). Page 1
 * (the lockup without the vertical "CO.LTD", which is illegible at banner size)
 * was rasterised and centred on white at 82% of the box height. The logo is
 * ~3.1:1, so it fits both boxes without cropping. Transparent source kept as
 * sabitech-source-2229x735.png for future re-cuts. Not in `article-sidebar`: a
 * 3.1:1 logo in a 300x250 box would be too small to read, and FJ holds it.
 */
const SABITECH_ALT = 'سابيتك — مصنّع معدات المخابز'

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
  // shares each of them with Land Cruiser FJ below, so they rotate between
  // those two; un-pausing Toyota would make it three.
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
  // Land Cruiser FJ 2027 joins the six shared slots, so each rotates between
  // two advertisers, and takes `article-sidebar` on its own (a placement with
  // one creative renders as a plain static ad, no carousel).
  {
    id: 'fj-home-top',
    placement: 'home-top',
    src: '/ads/toyota-land-cruiser-fj-wide-1200x250.jpg',
    href: FJ_HREF,
    alt: FJ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'fj-home-after-featured',
    placement: 'home-after-featured',
    src: '/ads/toyota-land-cruiser-fj-wide-1200x250.jpg',
    href: FJ_HREF,
    alt: FJ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'fj-home-after-latest',
    placement: 'home-after-latest',
    src: '/ads/toyota-land-cruiser-fj-wide-1200x250.jpg',
    href: FJ_HREF,
    alt: FJ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'fj-home-before-mostread',
    placement: 'home-before-mostread',
    src: '/ads/toyota-land-cruiser-fj-wide-1200x250.jpg',
    href: FJ_HREF,
    alt: FJ_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'fj-article-top',
    placement: 'article-top',
    src: '/ads/toyota-land-cruiser-fj-card-728x200.jpg',
    href: FJ_HREF,
    alt: FJ_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'fj-article-in-body',
    placement: 'article-in-body',
    src: '/ads/toyota-land-cruiser-fj-card-728x200.jpg',
    href: FJ_HREF,
    alt: FJ_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'fj-article-sidebar',
    placement: 'article-sidebar',
    src: '/ads/toyota-land-cruiser-fj-sidebar-300x250.jpg',
    href: FJ_HREF,
    alt: FJ_ALT,
    width: 300,
    height: 250,
  },
  // Sabitech joins the six shared slots unlinked; each now rotates between
  // MDM Atelier, Toyota Land Cruiser FJ and Sabitech.
  {
    id: 'sabitech-home-top',
    placement: 'home-top',
    src: '/ads/sabitech-wide-1200x250.png',
    alt: SABITECH_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'sabitech-home-after-featured',
    placement: 'home-after-featured',
    src: '/ads/sabitech-wide-1200x250.png',
    alt: SABITECH_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'sabitech-home-after-latest',
    placement: 'home-after-latest',
    src: '/ads/sabitech-wide-1200x250.png',
    alt: SABITECH_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'sabitech-home-before-mostread',
    placement: 'home-before-mostread',
    src: '/ads/sabitech-wide-1200x250.png',
    alt: SABITECH_ALT,
    width: 1200,
    height: 250,
  },
  {
    id: 'sabitech-article-top',
    placement: 'article-top',
    src: '/ads/sabitech-card-728x200.png',
    alt: SABITECH_ALT,
    width: 728,
    height: 200,
  },
  {
    id: 'sabitech-article-in-body',
    placement: 'article-in-body',
    src: '/ads/sabitech-card-728x200.png',
    alt: SABITECH_ALT,
    width: 728,
    height: 200,
  },
  // NOTE: `article-after-recommended` is deliberately left empty. An unfilled
  // slot renders nothing at all rather than a grey placeholder.
]
