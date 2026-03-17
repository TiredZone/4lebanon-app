'use client'

import { useState, useRef, useEffect } from 'react'

interface Country {
  id: number
  name_ar: string
  region_id: number | null
}

interface Region {
  id: number
  name_ar: string
}

interface EditorCountriesProps {
  countries: Country[]
  regions: Region[]
  selectedCountries: number[]
  regionId: number | null
  onChange: (countryIds: number[]) => void
}

export function EditorCountries({
  countries,
  regions,
  selectedCountries,
  regionId,
  onChange,
}: EditorCountriesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  // Filter countries by region (if set) and search
  const filteredCountries = countries
    .filter((c) => !regionId || c.region_id === regionId)
    .filter(
      (c) => c.name_ar.toLowerCase().includes(search.toLowerCase()) || c.name_ar.includes(search)
    )

  // Get selected country objects (from all countries, not just filtered)
  const selectedCountryObjects = countries.filter((c) => selectedCountries.includes(c.id))

  // Get region name for a country
  const getRegionName = (country: Country) => {
    if (!country.region_id) return ''
    const region = regions.find((r) => r.id === country.region_id)
    return region?.name_ar || ''
  }

  const handleToggle = (countryId: number) => {
    if (selectedCountries.includes(countryId)) {
      onChange(selectedCountries.filter((id) => id !== countryId))
    } else {
      onChange([...selectedCountries, countryId])
    }
  }

  const handleRemove = (countryId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedCountries.filter((id) => id !== countryId))
  }

  return (
    <div ref={containerRef} className="editor-topics-container">
      <label className="editor-label">الدول</label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`editor-topics-trigger ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedCountryObjects.length > 0 ? (
          selectedCountryObjects.map((country) => (
            <span key={country.id} className="editor-topic-tag">
              {country.name_ar}
              <button
                type="button"
                onClick={(e) => handleRemove(country.id, e)}
                className="editor-topic-tag-remove"
                aria-label={`حذف ${country.name_ar}`}
              >
                <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </span>
          ))
        ) : (
          <span className="editor-topics-placeholder">اختر الدول...</span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="editor-topics-dropdown">
          {/* Search */}
          <div className="editor-select-search">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن دولة..."
                className="editor-select-search-input"
              />
              <svg
                className="absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Countries Grid */}
          <div className="editor-topics-grid">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => handleToggle(country.id)}
                  className={`editor-topic-option ${selectedCountries.includes(country.id) ? 'selected' : ''}`}
                  title={getRegionName(country)}
                >
                  {country.name_ar}
                </button>
              ))
            ) : (
              <div className="editor-select-empty col-span-full">لا توجد نتائج</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
