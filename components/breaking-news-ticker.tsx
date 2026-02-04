'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface BreakingNewsItem {
  id: string
  slug: string
  title_ar: string
}

interface BreakingNewsTickerProps {
  articles: BreakingNewsItem[]
}

export function BreakingNewsTicker({ articles }: BreakingNewsTickerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // If no breaking news, don't render
  if (!articles || articles.length === 0) {
    return null
  }

  // Duplicate articles for seamless infinite scroll
  const duplicatedArticles = [...articles, ...articles, ...articles]

  return (
    <div className="breaking-news-bar relative z-40 overflow-hidden bg-gradient-to-l from-[#c61b23] to-[#9a1419]">
      <div className="mx-auto flex max-w-7xl items-center">
        {/* Breaking News Label */}
        <div className="flex-shrink-0 bg-white/10 px-3 py-2.5 backdrop-blur-sm sm:px-4 sm:py-3">
          <div className="flex items-center gap-2">
            {/* Pulsing dot */}
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white sm:h-3 sm:w-3"></span>
            </span>
            <span className="text-xs font-bold tracking-wide text-white sm:text-sm">عاجل</span>
          </div>
        </div>

        {/* Scrolling News Container */}
        <div
          className="relative flex-1 overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Gradient Fade Left */}
          <div className="pointer-events-none absolute top-0 left-0 z-10 h-full w-8 bg-gradient-to-r from-[#9a1419] to-transparent sm:w-12"></div>

          {/* Scrolling Content */}
          <div
            ref={scrollRef}
            className={`ticker-scroll flex items-center gap-6 py-2.5 whitespace-nowrap sm:gap-8 sm:py-3 ${isPaused ? 'paused' : ''}`}
          >
            {duplicatedArticles.map((article, index) => (
              <Link
                key={`${article.id}-${index}`}
                href={`/article/${article.slug}`}
                className="group inline-flex items-center gap-3 text-sm text-white/95 transition-all hover:text-white sm:text-base"
              >
                {/* Separator dot */}
                <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/40 group-hover:bg-white/70"></span>
                {/* Title */}
                <span className="leading-relaxed font-medium">{article.title_ar}</span>
              </Link>
            ))}
          </div>

          {/* Gradient Fade Right */}
          <div className="pointer-events-none absolute top-0 right-0 z-10 h-full w-8 bg-gradient-to-l from-[#c61b23] to-transparent sm:w-12"></div>
        </div>
      </div>

      {/* CSS for ticker animation */}
      <style jsx>{`
        .ticker-scroll {
          animation: ticker 60s linear infinite;
        }

        .ticker-scroll.paused {
          animation-play-state: paused;
        }

        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
      `}</style>
    </div>
  )
}
