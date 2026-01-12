'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function SearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="بحث..."
        className="w-48 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm text-white placeholder-white/70 transition-all focus:w-64 focus:border-white/50 focus:bg-white/20 focus:outline-none"
        aria-label="بحث في الموقع"
      />
      <button
        type="submit"
        className="absolute top-1/2 left-2 -translate-y-1/2 text-white/70 hover:text-white"
        aria-label="بحث"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>
    </form>
  )
}
