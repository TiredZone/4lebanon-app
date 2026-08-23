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
  /**
   * Already validated by the server component. `null` when the advertiser has
   * no landing page — that slide renders as an unlinked plate.
   */
  href: string | null
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

  // Three independent pause reasons. Sharing one flag let a mouseleave cancel a
  // pause that focus was still asserting, which advanced the slide out from
  // under a focused link.
  const [hovering, setHovering] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [touching, setTouching] = useState(false)

  const touchStartX = useRef<number | null>(null)
  /** Set once a touch passes the threshold, so the trailing click can be swallowed. */
  const swiped = useRef(false)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const tabVisible = useTabVisible()
  // Only rotate while the slot is actually on screen.
  const { ref: inViewRef, inView } = useInView({ threshold: 0.25 })

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      inViewRef(node)
    },
    [inViewRef]
  )

  const go = useCallback(
    (delta: number) => setActive((current) => (current + delta + count) % count),
    [count]
  )

  const autoplay =
    count > 1 && inView && tabVisible && !hovering && !focusWithin && !touching && !reducedMotion

  useEffect(() => {
    if (!autoplay) return
    const timer = window.setInterval(() => {
      // Never advance while something inside holds focus: the focused link would
      // become aria-hidden mid-keypress and Enter would open the wrong advertiser.
      const node = containerRef.current
      if (node && node.contains(document.activeElement)) return
      go(1)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(timer)
  }, [autoplay, go])

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
    swiped.current = false
    setTouching(true)
  }

  const onTouchMove = (event: React.TouchEvent) => {
    const start = touchStartX.current
    if (start === null) return
    const delta = (event.touches[0]?.clientX ?? start) - start
    if (Math.abs(delta) >= SWIPE_THRESHOLD) swiped.current = true
  }

  /** Runs for touchend AND touchcancel — a cancelled touch must not latch the pause. */
  const endTouch = () => {
    touchStartX.current = null
    setTouching(false)
  }

  const onTouchEnd = (event: React.TouchEvent) => {
    const start = touchStartX.current
    endTouch()
    if (start === null || count < 2) return
    const delta = (event.changedTouches[0]?.clientX ?? start) - start
    // Below the threshold this was a tap, so leave the link's click alone.
    if (Math.abs(delta) < SWIPE_THRESHOLD) return
    swiped.current = true
    go(delta < 0 ? 1 : -1)
  }

  // A swipe must never be treated as a tap on the advertiser.
  const onClickCapture = (event: React.MouseEvent) => {
    if (!swiped.current) return
    swiped.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      ref={setRefs}
      className="promo-carousel"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={() => setFocusWithin(true)}
      onBlur={() => setFocusWithin(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={endTouch}
      onClickCapture={onClickCapture}
    >
      <span className="promo-slot__frame" style={{ aspectRatio }}>
        {slides.map((slide, index) => {
          const isActive = index === active
          const image = (
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              sizes={sizes}
              className="promo-slot__img"
              unoptimized={slide.unoptimized}
            />
          )
          // Hidden slides stay out of the reading order and can't be clicked
          // through, so only the visible advertiser ever receives a click.
          const shared = {
            className: 'promo-carousel__slide',
            'data-promo-id': slide.id,
            'data-active': isActive || undefined,
            'aria-hidden': !isActive,
          }
          // An advertiser with no landing page still takes its turn in the
          // rotation; it just isn't a link, so it never enters the tab order.
          return slide.href ? (
            <a
              key={slide.id}
              {...shared}
              href={slide.href}
              target="_blank"
              rel="noopener noreferrer sponsored"
              tabIndex={isActive ? undefined : -1}
            >
              {image}
            </a>
          ) : (
            <span key={slide.id} {...shared}>
              {image}
            </span>
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
