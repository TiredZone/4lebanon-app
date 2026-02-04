'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface HeadlineItem {
  id: string
  slug: string
  title_ar: string
  published_at: string
}

interface HeadlineScrollerProps {
  headlines: HeadlineItem[]
}

export function HeadlineScroller({ headlines }: HeadlineScrollerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (headlines.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % headlines.length)
    }, 5000) // Change headline every 5 seconds

    return () => clearInterval(interval)
  }, [headlines.length])

  if (!headlines.length) return null

  return (
    <div className="bg-primary border-primary-dark relative overflow-hidden border-b-4">
      <div className="mx-auto max-w-[1400px] px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Label */}
          <div className="flex-shrink-0">
            <span className="bg-primary-dark inline-block rounded px-4 py-2 text-sm font-bold text-white shadow-lg">
              المانشيت
            </span>
          </div>

          {/* Scrolling Headlines */}
          <div className="flex-1 overflow-hidden">
            <div className="relative h-10">
              {headlines.map((headline, index) => (
                <Link
                  key={headline.id}
                  href={`/article/${headline.slug}`}
                  className={`absolute inset-0 flex items-center transition-all duration-500 ${
                    index === currentIndex
                      ? 'translate-y-0 opacity-100'
                      : index < currentIndex
                        ? '-translate-y-full opacity-0'
                        : 'translate-y-full opacity-0'
                  }`}
                >
                  <p className="hover:text-accent line-clamp-1 text-lg font-medium text-white transition-colors">
                    {headline.title_ar}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Dots */}
          {headlines.length > 1 && (
            <div className="flex items-center gap-1.5">
              {headlines.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex ? 'bg-accent w-6' : 'bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`عنوان ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Arrow Indicators */}
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                setCurrentIndex((prev) => (prev === 0 ? headlines.length - 1 : prev - 1))
              }
              className="hover:bg-primary-dark rounded p-1 text-white transition-colors"
              aria-label="السابق"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % headlines.length)}
              className="hover:bg-primary-dark rounded p-1 text-white transition-colors"
              aria-label="التالي"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
