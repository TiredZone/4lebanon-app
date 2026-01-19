'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { formatDateAr, getStatusLabelAr, getStatusBadgeClass } from '@/lib/utils'
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
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        article.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.excerpt_ar?.toLowerCase().includes(searchTerm.toLowerCase())

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

  return (
    <div>
      {/* Search and Filter Bar */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Search Input */}
          <div className="lg:col-span-2">
            <label htmlFor="search" className="mb-1 block text-sm font-medium text-gray-700">
              بحث في المقالات
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ابحث بالعنوان أو المحتوى..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 text-sm focus:border-[#c61b23] focus:ring-1 focus:ring-[#c61b23] focus:outline-none"
              />
              <svg
                className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-gray-400"
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

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="mb-1 block text-sm font-medium text-gray-700">
              الحالة
            </label>
            <select
              id="status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#c61b23] focus:ring-1 focus:ring-[#c61b23] focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="published">منشور</option>
              <option value="draft">مسودة</option>
              <option value="scheduled">مجدول</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label htmlFor="section" className="mb-1 block text-sm font-medium text-gray-700">
              القسم
            </label>
            <select
              id="section"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#c61b23] focus:ring-1 focus:ring-[#c61b23] focus:outline-none"
            >
              <option value="all">الكل</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium text-gray-700">
              النوع
            </label>
            <select
              id="type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#c61b23] focus:ring-1 focus:ring-[#c61b23] focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="breaking">عاجل</option>
              <option value="featured">مميز</option>
              <option value="regular">عادي</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
          <p className="text-sm text-gray-600">
            عرض <span className="font-bold">{filteredArticles.length}</span> من{' '}
            <span className="font-bold">{articles.length}</span> مقال
          </p>
          {(searchTerm ||
            filterStatus !== 'all' ||
            filterSection !== 'all' ||
            filterType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setFilterStatus('all')
                setFilterSection('all')
                setFilterType('all')
              }}
              className="cursor-pointer text-sm text-[#c61b23] hover:underline"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Articles Table */}
      {filteredArticles.length > 0 ? (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                    العنوان
                  </th>
                  <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                    القسم
                  </th>
                  <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                    الحالة
                  </th>
                  <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                    آخر تحديث
                  </th>
                  <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-foreground hover:text-primary font-medium"
                      >
                        {article.title_ar}
                      </Link>
                      {article.is_breaking && (
                        <span className="bg-primary mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white">
                          عاجل
                        </span>
                      )}
                      {article.is_featured && (
                        <span className="mr-2 rounded bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                          مميز
                        </span>
                      )}
                    </td>
                    <td className="text-muted-foreground px-6 py-4 text-sm">
                      {article.section?.name_ar || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(article.status)}`}
                      >
                        {getStatusLabelAr(article.status)}
                      </span>
                    </td>
                    <td className="text-muted-foreground px-6 py-4 text-sm">
                      {formatDateAr(article.updated_at, 'dd/MM/yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/articles/${article.id}/edit`}
                          className="text-primary cursor-pointer text-sm hover:underline"
                        >
                          تعديل
                        </Link>
                        {article.status === 'published' && (
                          <Link
                            href={`/article/${article.slug}`}
                            className="text-muted-foreground hover:text-primary cursor-pointer text-sm"
                            target="_blank"
                          >
                            عرض
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center">
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterStatus !== 'all' || filterSection !== 'all' || filterType !== 'all'
              ? 'لا توجد مقالات تطابق معايير البحث.'
              : 'لا توجد مقالات بعد.'}
          </p>
          {!searchTerm &&
            filterStatus === 'all' &&
            filterSection === 'all' &&
            filterType === 'all' && (
              <Link
                href="/admin/articles/new"
                className="bg-primary hover:bg-primary-dark cursor-pointer rounded-lg px-6 py-2 font-medium text-white"
              >
                إنشاء مقال جديد
              </Link>
            )}
        </div>
      )}
    </div>
  )
}
