'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDateAr, getStatusLabelAr } from '@/lib/utils'
import type { Article, Section } from '@/types/database'

interface ArticleWithSection extends Article {
  section: Section | null
}

interface ArticlesTableProps {
  articles: ArticleWithSection[]
}

export function ArticlesTable({ articles }: ArticlesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  // Extract unique sections for filter dropdown
  const sections = useMemo(() => {
    const sectionMap = new Map<number, string>()
    articles.forEach((article) => {
      if (article.section) {
        sectionMap.set(article.section.id, article.section.name_ar)
      }
    })
    return Array.from(sectionMap.entries()).map(([id, name]) => ({ id: String(id), name }))
  }, [articles])

  // Filter articles based on search and filters
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Search filter - works with single character for both Arabic and English
      const normalizedSearch = searchTerm.trim().toLowerCase()
      const matchesSearch =
        normalizedSearch === '' ||
        article.title_ar.includes(searchTerm.trim()) ||
        article.title_ar.toLowerCase().includes(normalizedSearch) ||
        article.excerpt_ar?.includes(searchTerm.trim()) ||
        article.excerpt_ar?.toLowerCase().includes(normalizedSearch)

      // Status filter
      const matchesStatus = filterStatus === 'all' || article.status === filterStatus

      // Section filter
      const matchesSection =
        filterSection === 'all' || String(article.section?.id) === filterSection

      // Type filter (breaking, featured, regular)
      const matchesType =
        filterType === 'all' ||
        (filterType === 'breaking' && article.is_breaking) ||
        (filterType === 'featured' && article.is_featured) ||
        (filterType === 'regular' && !article.is_breaking && !article.is_featured)

      return matchesSearch && matchesStatus && matchesSection && matchesType
    })
  }, [articles, searchTerm, filterStatus, filterSection, filterType])

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'draft':
        return 'bg-slate-50 text-slate-600 border-slate-200'
      case 'scheduled':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'archived':
        return 'bg-gray-50 text-gray-500 border-gray-200'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200'
    }
  }

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-4 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <input
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث بالعنوان..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm transition-all outline-none focus:border-[#c61b23] focus:ring-2 focus:ring-[#c61b23]/10"
          />
          <svg
            className="pointer-events-none absolute top-1/2 right-3.5 h-5 w-5 -translate-y-1/2 text-slate-400"
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

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="relative">
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-[#c61b23]"
              aria-label="فلتر الحالة"
            >
              <option value="all">كل الحالات</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="scheduled">مجدول</option>
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Section Filter */}
          <div className="relative">
            <select
              id="section"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-[#c61b23]"
              aria-label="فلتر القسم"
            >
              <option value="all">كل الأقسام</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              id="type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-[#c61b23]"
              aria-label="فلتر النوع"
            >
              <option value="all">كل الأنواع</option>
              <option value="breaking">عاجل</option>
              <option value="featured">مميز</option>
              <option value="regular">عادي</option>
            </select>
            <svg
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Clear filters button */}
          {(searchTerm ||
            filterStatus !== 'all' ||
            filterSection !== 'all' ||
            filterType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterSection('all')
                setFilterType('all')
              }}
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-slate-500">
        عرض <span className="font-semibold text-slate-800">{filteredArticles.length}</span> من{' '}
        <span className="font-semibold text-slate-800">{articles.length}</span> مقال
      </div>

      {/* Articles Cards */}
      {filteredArticles.length > 0 ? (
        <div className="space-y-3">
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              className="group rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-sm"
            >
              {/* Top Row: Title and Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="line-clamp-2 block text-base leading-relaxed font-bold text-slate-800 transition-colors hover:text-[#c61b23]"
                  >
                    {article.title_ar}
                  </Link>
                </div>

                {/* Action Buttons */}
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="admin-action-btn admin-action-btn-red"
                    title="تعديل"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </Link>
                  {article.status === 'published' && (
                    <Link
                      href={`/article/${article.slug}`}
                      className="admin-action-btn admin-action-btn-green"
                      target="_blank"
                      title="عرض"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>

              {/* Bottom Row: Badges and Meta */}
              <div className="mt-4 flex flex-wrap items-center gap-2.5">
                {/* Status Badge */}
                <span
                  className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusClass(article.status)}`}
                >
                  {getStatusLabelAr(article.status)}
                </span>

                {/* Section Badge */}
                {article.section && (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {article.section.name_ar}
                  </span>
                )}

                {/* Breaking Badge */}
                {article.is_breaking && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    عاجل
                  </span>
                )}

                {/* Featured Badge */}
                {article.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-purple-200 bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                    مميز
                  </span>
                )}

                {/* Date - pushed to the end */}
                <span className="mr-auto text-xs text-slate-400">
                  {formatDateAr(article.updated_at, 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-3 text-sm font-semibold text-slate-700">
            {searchTerm || filterStatus !== 'all' || filterSection !== 'all' || filterType !== 'all'
              ? 'لا توجد مقالات تطابق معايير البحث'
              : 'لا توجد مقالات بعد'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchTerm || filterStatus !== 'all' || filterSection !== 'all' || filterType !== 'all'
              ? 'حاول تغيير معايير البحث أو مسح الفلاتر'
              : 'ابدأ بإنشاء مقالك الأول'}
          </p>
          {!searchTerm &&
            filterStatus === 'all' &&
            filterSection === 'all' &&
            filterType === 'all' && (
              <Link
                href="/admin/articles/new"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#c61b23] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#a01820]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                إنشاء مقال جديد
              </Link>
            )}
        </div>
      )}
    </div>
  )
}
