'use client'

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { useInView } from 'react-intersection-observer'

/** How long each creative is shown before advancing. */
const AUTOPLAY_MS = 6000
/** Horizontal travel (px) required before a touch counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 40

export interface PromoSlide {
  id: string
  /** Already validated by the server component. */
  href: string
  src: string
  alt: string
  unoptimized: boolean
}

interface PromoCarouselProps {
  slides: PromoSlide[]
  /** e.g. "1200 / 250" — one shared box for every slide, so nothing shifts. */
  aspectRatio: string
  sizes: string
  /** Which slide to show first; computed deterministically on the server. */
  startIndex: number
}

const mediaQueryCache = new Map<string, MediaQueryList>()

function getMediaQueryList(query: string): MediaQueryList | null {
  if (typeof window === 'undefined') return null
  let mql = mediaQueryCache.get(query)
  if (!mql) {
    mql = window.matchMedia(query)
    mediaQueryCache.set(query, mql)
  }
  return mql
}

/**
 * Browser preferences are external stores, so they're read through
 * useSyncExternalStore rather than effect-plus-setState: no cascading render,
 * and the server snapshot keeps SSR and hydration in agreement.
 */
function useMediaQuery(query: string): boolean {
  const subscribe = useMemo(
    () => (onStoreChange: () => void) => {
      const mql = getMediaQueryList(query)
      if (!mql) return () => {}
      mql.addEventListener('change', onStoreChange)
      return () => mql.removeEventListener('change', onStoreChange)
    },
    [query]
  )
  return useSyncExternalStore(
    subscribe,
    () => getMediaQueryList(query)?.matches ?? false,
    () => false
  )
}

function subscribeToVisibility(onStoreChange: () => void) {
  document.addEventListener('visibilitychange', onStoreChange)
  return () => document.removeEventListener('visibilitychange', onStoreChange)
}

function useTabVisible(): boolean {
  return useSyncExternalStore(
    subscribeToVisibility,
    () => document.visibilityState === 'visible',
    () => true
  )
}

/**
 * Crossfading promo rotator.
 *
 * Every slide is rendered into the SSR HTML inside a single aspect-ratio box:
 * no layout shift when it advances, and visitors without JS still see one ad.
 * Crossfade rather than a scrolling track because programmatic autoplay in an
 * RTL container is unreliable (`scrollLeft` is 0-at-right and negative going
 * left per the CSSOM spec, and `scrollIntoView` can drag the page vertically).
 */
export function PromoCarousel({ slides, aspectRatio, sizes, startIndex }: PromoCarouselProps) {
  const count = slides.length
  const [active, setActive] = useState(() => (count > 0 ? startIndex % count : 0))
  const [interacting, setInteracting] = useState(false)
  const touchStartX = useRef<number | null>(null)

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const tabVisible = useTabVisible()
  // Only rotate while the slot is actually on screen.
  const { ref: inViewRef, inView } = useInView({ threshold: 0.25 })

  const go = useCallback(
    (delta: number) => setActive((current) => (current + delta + count) % count),
    [count]
  )

  const autoplay = count > 1 && inView && tabVisible && !interacting && !reducedMotion

  useEffect(() => {
    if (!autoplay) return
    const timer = window.setInterval(() => go(1), AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [autoplay, go])

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
    setInteracting(true)
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    setInteracting(false)
    if (start === null || count < 2) return
    const delta = (event.changedTouches[0]?.clientX ?? start) - start
    // Below the threshold this was a tap, so leave the link's click alone.
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    go(delta < 0 ? 1 : -1)
  }

  return (
    <div
      ref={inViewRef}
      className="promo-carousel"
      onMouseEnter={() => setInteracting(true)}
      onMouseLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={() => setInteracting(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <span className="promo-slot__frame" style={{ aspectRatio }}>
        {slides.map((slide, index) => {
          const isActive = index === active
          return (
            <a
              key={slide.id}
              href={slide.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="promo-carousel__slide"
              data-promo-id={slide.id}
              data-active={isActive || undefined}
              // Hidden slides stay out of the reading order and can't be clicked
              // through, so only the visible advertiser ever receives a click.
              aria-hidden={!isActive}
              tabIndex={isActive ? undefined : -1}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes={sizes}
                className="promo-slot__img"
                unoptimized={slide.unoptimized}
              />
            </a>
          )
        })}
      </span>

      {count > 1 && (
        <div className="promo-carousel__dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className="promo-carousel__dot"
              data-active={index === active || undefined}
              aria-label={`الإعلان ${index + 1} من ${count}`}
              aria-current={index === active}
              onClick={() => setActive(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
