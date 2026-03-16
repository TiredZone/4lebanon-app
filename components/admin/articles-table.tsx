'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDateAr, getStatusLabelAr } from '@/lib/utils'
import { ARTICLE_PRIORITIES } from '@/lib/constants'
import type { Article, Section } from '@/types/database'

interface ArticleWithSection extends Article {
  section: Section | null
  author?: { id: string; display_name_ar: string } | null
}

interface ArticlesTableProps {
  articles: ArticleWithSection[]
  showAuthor?: boolean
}

export function ArticlesTable({ articles, showAuthor = false }: ArticlesTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterSection, setFilterSection] = useState<string>('all')
  const [filterPriority, setFilterPriority] = useState<string>('all')

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

      // Priority filter
      const matchesPriority =
        filterPriority === 'all' || String(article.priority) === filterPriority

      return matchesSearch && matchesStatus && matchesSection && matchesPriority
    })
  }, [articles, searchTerm, filterStatus, filterSection, filterPriority])

  // Get status badge class
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'draft':
        return 'bg-slate-50 text-slate-600 border-slate-200'
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
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-11 text-sm transition-all outline-none focus:border-[#830005] focus:ring-2 focus:ring-[#830005]/10"
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
              className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-[#830005]"
              aria-label="فلتر الحالة"
            >
              <option value="all">كل الحالات</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
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
              className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-[#830005]"
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

          {/* Priority Filter */}
          <div className="relative">
            <select
              id="priority"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pr-4 pl-9 text-sm transition-all outline-none focus:border-[#830005]"
              aria-label="فلتر الأولوية"
            >
              <option value="all">كل الأولويات</option>
              {ARTICLE_PRIORITIES.map((p) => (
                <option key={p.value} value={String(p.value)}>
                  {p.label}
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

          {/* Clear filters button */}
          {(searchTerm ||
            filterStatus !== 'all' ||
            filterSection !== 'all' ||
            filterPriority !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterSection('all')
                setFilterPriority('all')
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
                    className="line-clamp-2 block text-base leading-relaxed font-bold text-slate-800 transition-colors hover:text-[#830005]"
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

                {/* Author Badge (super admin only) */}
                {showAuthor && article.author && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    {article.author.display_name_ar}
                  </span>
                )}

                {/* Section Badge */}
                {article.section && (
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {article.section.name_ar}
                  </span>
                )}

                {/* Priority Badge */}
                {(() => {
                  const priorityInfo = ARTICLE_PRIORITIES.find((p) => p.value === article.priority)
                  if (!priorityInfo || article.priority === 4) return null // Don't show badge for "Normal"
                  return (
                    <span
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: priorityInfo.color,
                        borderColor: `${priorityInfo.color}33`,
                        backgroundColor: `${priorityInfo.color}0d`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: priorityInfo.color }}
                      />
                      {priorityInfo.label}
                    </span>
                  )
                })()}

                {/* Date - pushed to the end */}
                <span className="ml-auto text-xs text-slate-400">
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
            {searchTerm ||
            filterStatus !== 'all' ||
            filterSection !== 'all' ||
            filterPriority !== 'all'
              ? 'لا توجد مقالات تطابق معايير البحث'
              : 'لا توجد مقالات بعد'}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {searchTerm ||
            filterStatus !== 'all' ||
            filterSection !== 'all' ||
            filterPriority !== 'all'
              ? 'حاول تغيير معايير البحث أو مسح الفلاتر'
              : 'ابدأ بإنشاء مقالك الأول'}
          </p>
          {!searchTerm &&
            filterStatus === 'all' &&
            filterSection === 'all' &&
            filterPriority === 'all' && (
              <Link
                href="/admin/articles/new"
                className="admin-btn-primary mt-4 inline-flex items-center gap-2 rounded-lg bg-[#830005] px-4 py-2 text-sm font-medium text-white transition-colors"
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
