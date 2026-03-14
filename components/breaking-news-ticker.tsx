'use client'

import { useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import Link from 'next/link'

interface BreakingNewsItem {
  id: string
  slug: string
  title_ar: string
}

interface BreakingNewsTickerProps {
  articles: BreakingNewsItem[]
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export function BreakingNewsTicker({ articles }: BreakingNewsTickerProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const state = useRef({ offset: 0, paused: false, lastTime: 0, copyWidth: 0 })

  // Measure and position before first paint so content is visible immediately
  useIsomorphicLayoutEffect(() => {
    const track = trackRef.current
    const copy = copyRef.current
    if (!track || !copy) return
    state.current.copyWidth = copy.offsetWidth
    state.current.offset = 0
    // Shift left by one copy → Copy 2 is in the viewport
    track.style.transform = `translateX(${-copy.offsetWidth}px)`
  }, [articles])

  // rAF animation loop — no CSS keyframes needed
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const SPEED = 40 // px per second (user liked ~50-60s per cycle)
    let raf: number

    const tick = (time: number) => {
      const s = state.current
      if (s.lastTime === 0) s.lastTime = time
      const dt = Math.min((time - s.lastTime) / 1000, 0.1)
      s.lastTime = time

      if (!s.paused && s.copyWidth > 0) {
        s.offset += SPEED * dt
        if (s.offset >= s.copyWidth) s.offset -= s.copyWidth
        track.style.transform = `translateX(${s.offset - s.copyWidth}px)`
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    // Re-measure on resize
    const ro = new ResizeObserver(() => {
      if (copyRef.current) state.current.copyWidth = copyRef.current.offsetWidth
    })
    if (copyRef.current) ro.observe(copyRef.current)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [articles])

  const onMouseEnter = useCallback(() => {
    state.current.paused = true
  }, [])

  const onMouseLeave = useCallback(() => {
    state.current.paused = false
    state.current.lastTime = 0 // reset so next frame doesn't jump
  }, [])

  if (!articles || articles.length === 0) {
    return null
  }

  const renderItems = (keyPrefix: string) =>
    articles.map((article) => (
      <Link
        key={`${keyPrefix}-${article.id}`}
        href={`/article/${article.slug}`}
        className="group inline-flex items-center gap-3 text-sm text-white/95 transition-all hover:text-[#f5c518] sm:text-base"
      >
        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40 group-hover:bg-[#f5c518]" />
        <span className="leading-relaxed font-medium">{article.title_ar}</span>
      </Link>
    ))

  return (
    <div className="breaking-news-bar relative z-40 overflow-hidden bg-gradient-to-l from-[#830005] to-[#6b0004]">
      <div className="mx-auto flex max-w-7xl items-center">
        {/* Breaking News Label */}
        <div className="flex-shrink-0 bg-white/10 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white sm:h-3 sm:w-3"></span>
            </span>
            <span className="text-xs font-bold tracking-wide text-white sm:text-sm">عاجل</span>
          </div>
        </div>

        {/* Scrolling News Container — dir=ltr so overflow clips the RIGHT side,
            keeping the left edge (where our translateX positions content) visible */}
        <div
          dir="ltr"
          className="relative flex-1 overflow-hidden"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          {/* Gradient Fade Left */}
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-gradient-to-r from-[#6a0004] to-transparent sm:w-12" />

          {/* Track: dir=ltr forces left-to-right layout so translateX math is predictable */}
          <div
            ref={trackRef}
            dir="ltr"
            className="flex items-center whitespace-nowrap"
            style={{ width: 'max-content', willChange: 'transform' }}
          >
            {/* Copy 1 (measured) */}
            <div
              ref={copyRef}
              dir="rtl"
              className="flex shrink-0 items-center gap-6 py-2.5 pe-6 sm:gap-8 sm:py-3 sm:pe-8"
            >
              {renderItems('a')}
            </div>
            {/* Copy 2 */}
            <div
              dir="rtl"
              className="flex shrink-0 items-center gap-6 py-2.5 pe-6 sm:gap-8 sm:py-3 sm:pe-8"
            >
              {renderItems('b')}
            </div>
            {/* Copy 3 — buffer for wide viewports */}
            <div
              dir="rtl"
              className="flex shrink-0 items-center gap-6 py-2.5 pe-6 sm:gap-8 sm:py-3 sm:pe-8"
            >
              {renderItems('c')}
            </div>
          </div>

          {/* Gradient Fade Right */}
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l from-[#a50006] to-transparent sm:w-12" />
        </div>
      </div>
    </div>
  )
}
