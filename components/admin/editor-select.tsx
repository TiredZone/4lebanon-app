'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: number | string
  label: string
  parentId?: number
}

interface EditorSelectProps {
  label: string
  options: Option[]
  value: number | string | null
  onChange: (value: number | string | null) => void
  placeholder?: string
  searchPlaceholder?: string
  required?: boolean
  disabled?: boolean
  filteredByParent?: number | null
  parentField?: string
}

export function EditorSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'اختر...',
  searchPlaceholder = 'ابحث...',
  required = false,
  disabled = false,
}: EditorSelectProps) {
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

  // Filter options based on search
  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(search.toLowerCase()) || option.label.includes(search)
  )

  // Get selected option label
  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (optionValue: number | string | null) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearch('')
  }

  return (
    <div className="mb-4">
      <label className={`editor-label ${required ? 'editor-label-required' : ''}`}>{label}</label>
      <div ref={containerRef} className="editor-select-container">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`editor-select-trigger ${isOpen ? 'open' : ''} ${!selectedOption ? 'placeholder' : ''}`}
          disabled={disabled}
        >
          <span>{selectedOption?.label || placeholder}</span>
          <svg
            className="editor-select-arrow"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="editor-select-dropdown">
            <div className="editor-select-search">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={searchPlaceholder}
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
            <div className="editor-select-options">
              {/* Clear option */}
              <button
                type="button"
                onClick={() => handleSelect(null)}
                className={`editor-select-option ${value === null ? 'selected' : ''}`}
              >
                <span>{placeholder}</span>
                {value === null && (
                  <svg
                    className="editor-select-option-check"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>

              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`editor-select-option ${value === option.value ? 'selected' : ''}`}
                  >
                    <span>{option.label}</span>
                    {value === option.value && (
                      <svg
                        className="editor-select-option-check"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                ))
              ) : (
                <div className="editor-select-empty">لا توجد نتائج</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
