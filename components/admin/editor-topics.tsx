'use client'

import { useState, useRef, useEffect } from 'react'

interface Topic {
  id: number
  name_ar: string
  slug: string
}

interface EditorTopicsProps {
  topics: Topic[]
  selectedTopics: number[]
  onChange: (topicIds: number[]) => void
}

export function EditorTopics({ topics, selectedTopics, onChange }: EditorTopicsProps) {
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

  // Filter topics based on search
  const filteredTopics = topics.filter(
    (topic) =>
      topic.name_ar.toLowerCase().includes(search.toLowerCase()) || topic.name_ar.includes(search)
  )

  // Get selected topics objects
  const selectedTopicObjects = topics.filter((t) => selectedTopics.includes(t.id))

  const handleToggle = (topicId: number) => {
    if (selectedTopics.includes(topicId)) {
      onChange(selectedTopics.filter((id) => id !== topicId))
    } else {
      onChange([...selectedTopics, topicId])
    }
  }

  const handleRemove = (topicId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(selectedTopics.filter((id) => id !== topicId))
  }

  return (
    <div ref={containerRef} className="editor-topics-container">
      {/* Trigger — uses div+role instead of button to allow nested remove buttons */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className={`editor-topics-trigger ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {selectedTopicObjects.length > 0 ? (
          selectedTopicObjects.map((topic) => (
            <span key={topic.id} className="editor-topic-tag">
              {topic.name_ar}
              <button
                type="button"
                onClick={(e) => handleRemove(topic.id, e)}
                className="editor-topic-tag-remove"
                aria-label={`حذف ${topic.name_ar}`}
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
          <span className="editor-topics-placeholder">اختر المواضيع...</span>
        )}
      </div>

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
                placeholder="ابحث عن موضوع..."
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

          {/* Topics Grid */}
          <div className="editor-topics-grid">
            {filteredTopics.length > 0 ? (
              filteredTopics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleToggle(topic.id)}
                  className={`editor-topic-option ${selectedTopics.includes(topic.id) ? 'selected' : ''}`}
                >
                  {topic.name_ar}
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
