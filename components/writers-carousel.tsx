'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
import { useRef } from 'react'

interface Writer {
  id: string
  display_name_ar: string | null
  avatar_url: string | null
}

export default function WritersCarousel({ writers }: { writers: Writer[] }) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleScroll = (direction: 'left' | 'right') => {
    if (containerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      containerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <div className="relative">
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex gap-12 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {writers.map((writer) => (
          <Link
            key={writer.id}
            href={`/author/${writer.id}`}
            className="group flex shrink-0 flex-col items-center transition-transform duration-300 hover:scale-110"
          >
            <div className="relative mb-3 h-32 w-32 overflow-hidden rounded-full border-2 border-[#eeeeee] shadow-sm transition-all duration-300 group-hover:border-[#c61b23] group-hover:shadow-md">
              {writer.avatar_url ? (
                <Image
                  src={getStorageUrl(writer.avatar_url)}
                  alt={writer.display_name_ar || 'كاتب'}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#c61b23] to-[#a01519] text-3xl font-bold text-white">
                  {writer.display_name_ar?.charAt(0) || 'ك'}
                </div>
              )}
            </div>
            <span className="text-center text-sm font-bold text-black transition-colors group-hover:text-[#c61b23]">
              {writer.display_name_ar || 'كاتب'}
            </span>
          </Link>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        aria-label="Previous writers"
        className="absolute top-1/2 left-0 -translate-y-1/2 rounded-full border border-[#eeeeee] bg-white p-2 shadow-sm transition-all hover:bg-[#c61b23] hover:text-white hover:shadow-md"
        onClick={() => handleScroll('left')}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        aria-label="Next writers"
        className="absolute top-1/2 right-0 -translate-y-1/2 rounded-full border border-[#eeeeee] bg-white p-2 shadow-sm transition-all hover:bg-[#c61b23] hover:text-white hover:shadow-md"
        onClick={() => handleScroll('right')}
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
