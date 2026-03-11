'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
import { useRef, useState, useEffect } from 'react'

interface Writer {
  id: string
  display_name_ar: string | null
  avatar_url: string | null
}

export default function WritersCarousel({ writers }: { writers: Writer[] }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [showArrows, setShowArrows] = useState(false)

  // Check if content overflows and arrows should be shown
  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        const hasOverflow = containerRef.current.scrollWidth > containerRef.current.clientWidth
        setShowArrows(hasOverflow && writers.length > 5)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [writers.length])

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      {/* Scrollable Container - Add horizontal padding when arrows are shown */}
      <div
        ref={containerRef}
        className={`flex gap-4 overflow-x-auto pb-4 [scrollbar-width:none] sm:gap-6 lg:gap-10 [&::-webkit-scrollbar]:hidden ${
          showArrows ? 'px-10 sm:px-12' : ''
        }`}
      >
        {writers.map((writer) => (
          <Link
            key={writer.id}
            href={`/author/${writer.id}`}
            className="group flex min-h-[80px] shrink-0 flex-col items-center"
          >
            <div className="relative mb-2 h-16 w-16 overflow-hidden rounded-full border-2 border-[#eeeeee] shadow-sm transition-all duration-300 group-hover:border-[#830005] group-hover:shadow-md sm:mb-3 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28">
              {writer.avatar_url ? (
                <Image
                  src={getStorageUrl(writer.avatar_url)!}
                  alt={writer.display_name_ar || 'كاتب'}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#830005] to-[#6b0004] text-lg font-bold text-white sm:text-xl md:text-2xl lg:text-3xl">
                  {writer.display_name_ar?.charAt(0) || 'ك'}
                </div>
              )}
            </div>
            <span className="w-16 text-center text-[10px] font-bold break-words text-black transition-colors group-hover:text-[#830005] sm:w-20 sm:text-xs md:w-24 md:text-sm lg:w-28">
              {writer.display_name_ar || 'كاتب'}
            </span>
          </Link>
        ))}
      </div>

      {/* Navigation Arrows - Only show when there are enough writers to scroll */}
      {showArrows && (
        <>
          <button
            aria-label="الكتّاب السابقون"
            className="absolute top-1/2 left-0 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-[#eeeeee] bg-white p-2 shadow-sm transition-all duration-300 hover:bg-[#830005] hover:text-white hover:shadow-md active:scale-95 sm:p-2.5"
            onClick={() => handleScroll('left')}
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            aria-label="الكتّاب التاليون"
            className="absolute top-1/2 right-0 flex min-h-[44px] min-w-[44px] -translate-y-1/2 items-center justify-center rounded-full border border-[#eeeeee] bg-white p-2 shadow-sm transition-all duration-300 hover:bg-[#830005] hover:text-white hover:shadow-md active:scale-95 sm:p-2.5"
            onClick={() => handleScroll('right')}
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
    </div>
  )
}
