'use client'

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
  // Convert to options format
  const sectionOptions = [
    { value: '', label: 'جميع الأقسام' },
    ...filters.sections.map((s) => ({ value: s.slug, label: s.name_ar })),
  ]

  const topicOptions = [
    { value: '', label: 'جميع المواضيع' },
    ...filters.topics.map((t) => ({ value: t.slug, label: t.name_ar })),
  ]

  const countryOptions = [
    { value: '', label: 'جميع الدول' },
    ...filters.countries.map((c) => ({ value: c.slug, label: c.name_ar })),
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
      />

      {/* Topic filter - Searchable */}
      <SearchableSelect
        name="topic"
        label="الموضوع"
        options={topicOptions}
        defaultValue={currentParams.topic}
        placeholder="جميع المواضيع"
        searchPlaceholder="ابحث عن موضوع..."
      />

      {/* Region filter - Regular select (no search) */}
      <div className="filter-group">
        <label htmlFor="region" className="filter-label">
          المنطقة
        </label>
        <select
          id="region"
          name="region"
          defaultValue={currentParams.region}
          className="filter-select"
        >
          <option value="">جميع المناطق</option>
          {filters.regions.map((r) => (
            <option key={r.id} value={r.slug}>
              {r.name_ar}
            </option>
          ))}
        </select>
      </div>

      {/* Country filter - Searchable */}
      <SearchableSelect
        name="country"
        label="الدولة"
        options={countryOptions}
        defaultValue={currentParams.country}
        placeholder="جميع الدول"
        searchPlaceholder="ابحث عن دولة..."
      />
    </div>
  )
}
