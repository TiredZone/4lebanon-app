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

export function AdSlot({ placement, variant = 'banner', className }: AdSlotProps) {
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
