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
