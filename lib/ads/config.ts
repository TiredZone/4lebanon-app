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
 */

/** Toyota Lebanon (BUMC) — Lite Ace / Dyna 200 commercial vehicles campaign. */
const TOYOTA_HREF = 'https://toyotalebanon.com/Vehicles/11/Dyna'
const TOYOTA_ALT = 'تويوتا لبنان — لايت إيس ودينا 200 للمركبات التجارية'

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
    placement: 'home-after-featured',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x200.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 200,
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
  {
    id: 'toyota-home-mid',
    placement: 'home-mid-sections',
    src: '/ads/toyota-lite-ace-dyna-wide-1200x200.jpg',
    href: TOYOTA_HREF,
    alt: TOYOTA_ALT,
    width: 1200,
    height: 200,
  },
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
  {
    // No 300x250 creative supplied yet — keeps the slot visible as unsold
    // inventory. Swap `src`/`href`/`alt` once the advertiser sends one.
    id: 'demo-article-sidebar',
    placement: 'article-sidebar',
    src: '/ads/placeholder-sidebar.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 300,
    height: 250,
  },
]
