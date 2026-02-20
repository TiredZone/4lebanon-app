'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
}

interface SearchableSelectProps {
  name: string
  label: string
  options: Option[]
  defaultValue?: string
  placeholder?: string
  searchPlaceholder?: string
  onChange?: (value: string) => void
}

export function SearchableSelect({
  name,
  label,
  options,
  defaultValue = '',
  placeholder = 'اختر...',
  searchPlaceholder = 'ابحث...',
  onChange,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedValue, setSelectedValue] = useState(defaultValue)

  // Sync with external defaultValue changes (e.g., filter reset)
  useEffect(() => {
    setSelectedValue(defaultValue)
  }, [defaultValue])
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === selectedValue)
  const displayLabel = selectedOption?.label || placeholder

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  )

  // Close dropdown when clicking outside
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

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearch('')
    }
  }

  const handleSelect = (value: string) => {
    setSelectedValue(value)
    setIsOpen(false)
    setSearch('')
    onChange?.(value)
  }

  return (
    <div ref={containerRef} className="searchable-select-container">
      <label className="filter-label">{label}</label>

      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={selectedValue} />

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`searchable-select-trigger ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedValue ? '' : 'placeholder'}>{displayLabel}</span>
        <svg
          className={`searchable-select-arrow ${isOpen ? 'rotated' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="searchable-select-dropdown" role="listbox">
          {/* Search input */}
          <div className="searchable-select-search-wrapper">
            <svg
              className="searchable-select-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="searchable-select-search"
              autoComplete="off"
            />
          </div>

          {/* Options list */}
          <div className="searchable-select-options">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`searchable-select-option ${selectedValue === option.value ? 'selected' : ''}`}
                  role="option"
                  aria-selected={selectedValue === option.value}
                >
                  {option.label}
                  {selectedValue === option.value && (
                    <svg
                      className="searchable-select-check"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              ))
            ) : (
              <div className="searchable-select-empty">لا توجد نتائج</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
