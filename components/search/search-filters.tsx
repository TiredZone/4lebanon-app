'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { SearchableSelect } from '@/components/ui/searchable-select'

interface SearchFiltersProps {
  filters: {
    sections: { id: number; slug: string; name_ar: string }[]
    regions: { id: number; slug: string; name_ar: string }[]
    countries: { id: number; slug: string; name_ar: string; region_id: number }[]
    topics: { id: number; slug: string; name_ar: string }[]
  }
  currentParams: {
    section: string
    region: string
    country: string
    topic: string
  }
}

export function SearchFilters({ filters, currentParams }: SearchFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      // Preserve the current search input value from the DOM (not yet in URL)
      const qInput = document.querySelector<HTMLInputElement>('input[name="q"]')
      if (qInput && qInput.value.trim()) {
        params.set('q', qInput.value.trim())
      }
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // When region changes, clear the country filter (it may no longer be valid)
      if (key === 'region') {
        params.delete('country')
      }
      // Reset to page 1 when filters change
      params.delete('page')
      router.push(`/search?${params.toString()}`)
    },
    [router, searchParams]
  )
  // Convert to options format
  const sectionOptions = [
    { value: '', label: 'جميع الأقسام' },
    ...filters.sections.map((s) => ({ value: s.slug, label: s.name_ar })),
  ]

  const topicOptions = [
    { value: '', label: 'جميع المواضيع' },
    ...filters.topics.map((t) => ({ value: t.slug, label: t.name_ar })),
  ]

  const regionOptions = [
    { value: '', label: 'جميع المناطق' },
    ...filters.regions.map((r) => ({ value: r.slug, label: r.name_ar })),
  ]

  // Filter countries by selected region
  const selectedRegion = filters.regions.find((r) => r.slug === currentParams.region)
  const filteredCountries = selectedRegion
    ? filters.countries.filter((c) => c.region_id === selectedRegion.id)
    : filters.countries

  const countryOptions = [
    { value: '', label: 'جميع الدول' },
    ...filteredCountries.map((c) => ({ value: c.slug, label: c.name_ar })),
  ]

  return (
    <div className="search-filters">
      {/* Section filter - Searchable */}
      <SearchableSelect
        name="section"
        label="القسم"
        options={sectionOptions}
        defaultValue={currentParams.section}
        placeholder="جميع الأقسام"
        searchPlaceholder="ابحث عن قسم..."
        onChange={(value) => handleFilterChange('section', value)}
      />

      {/* Topic filter - Searchable */}
      <SearchableSelect
        name="topic"
        label="الموضوع"
        options={topicOptions}
        defaultValue={currentParams.topic}
        placeholder="جميع المواضيع"
        searchPlaceholder="ابحث عن موضوع..."
        onChange={(value) => handleFilterChange('topic', value)}
      />

      {/* Region filter - Searchable */}
      <SearchableSelect
        name="region"
        label="المنطقة"
        options={regionOptions}
        defaultValue={currentParams.region}
        placeholder="جميع المناطق"
        searchPlaceholder="ابحث عن منطقة..."
        onChange={(value) => handleFilterChange('region', value)}
      />

      {/* Country filter - Searchable */}
      <SearchableSelect
        name="country"
        label="الدولة"
        options={countryOptions}
        defaultValue={currentParams.country}
        placeholder="جميع الدول"
        searchPlaceholder="ابحث عن دولة..."
        onChange={(value) => handleFilterChange('country', value)}
      />
    </div>
  )
}
