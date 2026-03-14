'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface SectionFiltersProps {
  filters: {
    regions: { id: number; slug: string; name_ar: string }[]
    countries: { id: number; slug: string; name_ar: string; region_id: number }[]
    topics: { id: number; slug: string; name_ar: string }[]
  }
  currentParams: {
    topic: string
    region: string
    country: string
    sort: string
    period: string
  }
  sectionSlug: string
  total: number
  hasActiveFilters: boolean
  isDark?: boolean
}

const PERIOD_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
]

const SORT_OPTIONS = [
  { value: '', label: 'الترتيب التحريري' },
  { value: 'newest', label: 'الأحدث' },
  { value: 'oldest', label: 'الأقدم' },
  { value: 'most_read', label: 'الأكثر قراءة' },
]

export function SectionFilters({
  filters,
  currentParams,
  sectionSlug,
  total,
  hasActiveFilters,
  isDark = false,
}: SectionFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      if (key === 'region') {
        params.delete('country')
      }
      params.delete('page')
      const qs = params.toString()
      router.push(`/section/${sectionSlug}${qs ? `?${qs}` : ''}`)
    },
    [router, searchParams, sectionSlug]
  )

  const clearAll = useCallback(() => {
    router.push(`/section/${sectionSlug}`)
  }, [router, sectionSlug])

  const topicOptions = [
    { value: '', label: 'جميع المواضيع' },
    ...filters.topics.map((t) => ({ value: t.slug, label: t.name_ar })),
  ]

  const regionOptions = [
    { value: '', label: 'جميع المناطق' },
    ...filters.regions.map((r) => ({ value: r.slug, label: r.name_ar })),
  ]

  const selectedRegion = filters.regions.find((r) => r.slug === currentParams.region)
  const filteredCountries = selectedRegion
    ? filters.countries.filter((c) => c.region_id === selectedRegion.id)
    : filters.countries

  const countryOptions = [
    { value: '', label: 'جميع الدول' },
    ...filteredCountries.map((c) => ({ value: c.slug, label: c.name_ar })),
  ]

  const sortOptions = SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))

  // Build active filter labels for chips
  const activeChips: { key: string; label: string }[] = []
  if (currentParams.topic) {
    const t = filters.topics.find((t) => t.slug === currentParams.topic)
    if (t) activeChips.push({ key: 'topic', label: t.name_ar })
  }
  if (currentParams.region) {
    const r = filters.regions.find((r) => r.slug === currentParams.region)
    if (r) activeChips.push({ key: 'region', label: r.name_ar })
  }
  if (currentParams.country) {
    const c = filteredCountries.find((c) => c.slug === currentParams.country)
    if (c) activeChips.push({ key: 'country', label: c.name_ar })
  }
  if (currentParams.sort) {
    const s = SORT_OPTIONS.find((s) => s.value === currentParams.sort)
    if (s) activeChips.push({ key: 'sort', label: s.label })
  }
  if (currentParams.period) {
    const p = PERIOD_OPTIONS.find((p) => p.value === currentParams.period)
    if (p) activeChips.push({ key: 'period', label: p.label })
  }

  return (
    <>
      <div className={`section-filters ${isDark ? 'section-filters-dark' : ''}`}>
        {/* Period pills */}
        <div className="period-pills">
          {PERIOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`period-pill ${currentParams.period === option.value ? 'active' : ''}`}
              onClick={() => updateParams('period', option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* Filter dropdowns */}
        <div className="section-filters-grid">
          <SearchableSelect
            name="topic"
            label="الموضوع"
            options={topicOptions}
            defaultValue={currentParams.topic}
            placeholder="جميع المواضيع"
            searchPlaceholder="ابحث عن موضوع..."
            onChange={(value) => updateParams('topic', value)}
          />

          <SearchableSelect
            name="region"
            label="المنطقة"
            options={regionOptions}
            defaultValue={currentParams.region}
            placeholder="جميع المناطق"
            searchPlaceholder="ابحث عن منطقة..."
            onChange={(value) => updateParams('region', value)}
          />

          <SearchableSelect
            name="country"
            label="الدولة"
            options={countryOptions}
            defaultValue={currentParams.country}
            placeholder="جميع الدول"
            searchPlaceholder="ابحث عن دولة..."
            onChange={(value) => updateParams('country', value)}
          />

          <SearchableSelect
            name="sort"
            label="الترتيب"
            options={sortOptions}
            defaultValue={currentParams.sort}
            placeholder="الترتيب التحريري"
            searchPlaceholder="ابحث..."
            onChange={(value) => updateParams('sort', value)}
          />
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="active-filter-chips">
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className="active-filter-chip"
                onClick={() => updateParams(chip.key, '')}
              >
                {chip.label}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            ))}
            <button type="button" className="clear-filters-btn" onClick={clearAll}>
              مسح الكل
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      {hasActiveFilters && (
        <p className={`section-results-count ${isDark ? 'section-filters-dark' : ''}`}>
          <strong>{total}</strong> مقال
        </p>
      )}
    </>
  )
}
