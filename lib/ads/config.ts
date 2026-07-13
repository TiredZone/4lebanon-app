import type { AdCreative } from './types'

/**
 * The single source of truth for ads. Edit this file (+ deploy) to change ads.
 * To go live with a real advertiser: replace the demo `src` with the advertiser
 * image (drop it in /public/ads/), set `href` to the advertiser URL, and update
 * width/height to the image's intrinsic dimensions.
 *
 * Any placement listed below renders the demo creative; any placement with no
 * entry here renders nothing (so wiring an <AdSlot> in a page is always safe).
 */
export const ADS: AdCreative[] = [
  {
    id: 'demo-home-top',
    placement: 'home-top',
    src: '/ads/placeholder-banner.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 1200,
    height: 200,
  },
  {
    id: 'demo-home-after-featured',
    placement: 'home-after-featured',
    src: '/ads/placeholder-banner.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 1200,
    height: 200,
  },
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
    id: 'demo-home-mid',
    placement: 'home-mid-sections',
    src: '/ads/placeholder-banner.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 1200,
    height: 200,
  },
  {
    id: 'demo-home-before-mostread',
    placement: 'home-before-mostread',
    src: '/ads/placeholder-banner.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 1200,
    height: 200,
  },
  {
    id: 'demo-article-top',
    placement: 'article-top',
    src: '/ads/placeholder-card.svg',
    href: 'https://www.4lebanon.com', // TODO: replace with advertiser URL
    alt: 'مساحة إعلانية',
    width: 728,
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
