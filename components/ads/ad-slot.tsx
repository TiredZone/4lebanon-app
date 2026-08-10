import Image from 'next/image'
import { sanitizeUrl } from '@/lib/security'
import { getStorageUrl } from '@/lib/utils'
import { ADS } from '@/lib/ads/config'
import { getEligibleAds, startIndexFor } from '@/lib/ads/select'
import { adsEnabled } from '@/lib/ads/flags'
import type { AdPlacement, AdVariant } from '@/lib/ads/types'
import { PromoCarousel, type PromoSlide } from './promo-carousel'

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

/** A slide that has passed URL sanitizing and src resolution. */
type ValidatedSlide = PromoSlide & { width: number; height: number; label?: string }

export function AdSlot({ placement, variant = 'wide', className }: AdSlotProps) {
  if (!adsEnabled()) return null

  // Every eligible creative becomes a slide. One creative renders as a plain
  // ad; two or more rotate. Validation happens here, on the server, so the
  // client component only ever receives hrefs that passed sanitizeUrl().
  const slides: ValidatedSlide[] = getEligibleAds(ADS, placement).flatMap((ad) => {
    const href = sanitizeUrl(ad.href)
    const src = resolveSrc(ad.src)
    if (!href || !src) return []
    return [
      {
        id: ad.id,
        href,
        src,
        alt: ad.alt,
        unoptimized: src.toLowerCase().endsWith('.svg'),
        width: ad.width,
        height: ad.height,
        label: ad.label,
      },
    ]
  })

  if (slides.length === 0) return null

  const first = slides[0]
  const label = first.label ?? 'إعلان'
  // One shared box for the whole slot, taken from the first creative. Every
  // creative in a placement must share this ratio — enforced by a unit test.
  const aspectRatio = `${first.width} / ${first.height}`
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
      {slides.length === 1 ? (
        <a
          href={first.href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="promo-slot__link"
          data-promo-id={first.id}
        >
          <span className="promo-slot__frame" style={{ aspectRatio }}>
            <Image
              src={first.src}
              alt={first.alt}
              fill
              sizes={sizes}
              className="promo-slot__img"
              unoptimized={first.unoptimized}
            />
          </span>
        </a>
      ) : (
        <PromoCarousel
          slides={slides}
          aspectRatio={aspectRatio}
          sizes={sizes}
          startIndex={startIndexFor(placement, slides.length)}
        />
      )}
    </aside>
  )
}
