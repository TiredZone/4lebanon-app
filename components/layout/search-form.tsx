'use client'

import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'

interface SearchFormProps {
  onSearch?: () => void
  onFocus?: () => void
  onBlur?: () => void
}

interface SearchResult {
  id: string
  slug: string
  title_ar: string
  cover_image_path: string | null
  section: { name_ar: string; slug: string } | null
}

export function SearchForm({ onSearch, onFocus, onBlur }: SearchFormProps = {}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Real-time search
  useEffect(() => {
    const searchArticles = async () => {
      if (query.trim().length < 2) {
        setResults([])
        setShowResults(false)
        return
      }

      setIsSearching(true)
      setShowResults(true)

      const supabase = createClient()
      const { data } = await supabase
        .from('articles')
        .select(
          `
          id, slug, title_ar, cover_image_path,
          section:sections!articles_section_id_fkey(name_ar, slug)
        `
        )
        .ilike('title_ar', `%${query}%`)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5)

      setResults((data as unknown as SearchResult[]) || [])
      setIsSearching(false)
    }

    const debounce = setTimeout(searchArticles, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      onSearch?.()
      setQuery('')
      setShowResults(false)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim().length >= 2) setShowResults(true)
            onFocus?.()
          }}
          onBlur={() => {
            // Delay blur to allow click on results
            setTimeout(() => onBlur?.(), 150)
          }}
          placeholder="بحث"
          className="w-full rounded-xl border border-gray-200/80 bg-gray-50/80 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all focus:border-[var(--aura-red)]/30 focus:bg-white focus:ring-2 focus:ring-[var(--aura-red)]/10 focus:outline-none"
          aria-label="بحث في الموقع"
        />
        <button
          type="submit"
          className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-500 transition-colors hover:text-[#c61b23]"
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

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full right-0 left-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-2xl">
          {isSearching ? (
            <div className="p-4 text-center text-gray-500">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#c61b23] border-t-transparent"></div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  onClick={() => {
                    setShowResults(false)
                    setQuery('')
                    onSearch?.()
                  }}
                  className="flex gap-3 border-b border-gray-100 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50"
                >
                  {article.cover_image_path && (
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded">
                      <Image
                        src={getStorageUrl(article.cover_image_path)}
                        alt={article.title_ar}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    {article.section && (
                      <span className="text-xs font-medium text-[#c61b23]">
                        {article.section.name_ar}
                      </span>
                    )}
                    <h4 className="line-clamp-2 text-sm leading-tight font-bold text-gray-900">
                      {article.title_ar}
                    </h4>
                  </div>
                </Link>
              ))}
              <button
                onClick={() => {
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`)
                  setShowResults(false)
                  setQuery('')
                  onSearch?.()
                }}
                className="w-full px-4 py-2 text-center text-sm font-medium text-[#c61b23] transition-colors hover:bg-gray-50"
              >
                عرض جميع النتائج ←
              </button>
            </div>
          ) : query.trim().length >= 2 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              لا توجد نتائج لـ &ldquo;{query}&rdquo;
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
