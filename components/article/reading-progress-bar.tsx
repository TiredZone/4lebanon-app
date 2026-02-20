'use client'

import { useEffect, useRef } from 'react'

export function ReadingProgressBar() {
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!barRef.current) return
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
      const progress = Math.min(100, Math.max(0, scrollPercent))
      barRef.current.style.transform = `scaleX(${progress / 100})`
      barRef.current.setAttribute('aria-valuenow', String(Math.round(progress)))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      ref={barRef}
      className="reading-progress-bar"
      style={{ transform: 'scaleX(0)' }}
      role="progressbar"
      aria-valuenow={0}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="تقدم القراءة"
    />
  )
}
