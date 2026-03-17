import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION, SITE_CONFIG } from '@/lib/constants'
import { formatDateAr, getStorageUrl, escapeIlike } from '@/lib/utils'
import { SearchFilters } from '@/components/search/search-filters'
import type { ArticleListItem } from '@/types/database'

// Search is dynamic - no caching
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    section?: string
    region?: string
    country?: string
    topic?: string
    page?: string
  }>
}

async function searchArticles(params: {
  q?: string
  section?: string
  region?: string
  country?: string
  topic?: string
  page?: number
}): Promise<{ articles: ArticleListItem[]; total: number }> {
  const supabase = await createClient()
  const perPage = PAGINATION.searchPageSize
  const offset = ((params.page || 1) - 1) * perPage
  const now = new Date().toISOString()

  let query = supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url, is_anonymous),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })

  // Search by title - using ilike for instant single-character search (works with Arabic and English)
  if (params.q && params.q.trim().length > 0) {
    query = query.ilike('title_ar', `%${escapeIlike(params.q.trim())}%`)
  }

  // Filters
  if (params.section) {
    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('slug', params.section)
      .single()
    if (section) {
      const sectionData = section as { id: number }
      query = query.eq('section_id', sectionData.id)
    }
  }

  if (params.region) {
    const { data: region } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', params.region)
      .single()
    if (region) {
      const regionData = region as { id: number }
      query = query.eq('region_id', regionData.id)
    }
  }

  if (params.country) {
    const { data: country } = await supabase
      .from('countries')
      .select('id')
      .eq('slug', params.country)
      .single()
    if (country) {
      const countryData = country as { id: number }
      const { data: articleCountries } = await supabase
        .from('article_countries')
        .select('article_id')
        .eq('country_id', countryData.id)
      if (articleCountries && articleCountries.length > 0) {
        const articleIds = articleCountries.map((ac) => (ac as { article_id: string }).article_id)
        query = query.in('id', articleIds)
      } else {
        return { articles: [], total: 0 }
      }
    }
  }

  // Topic filter - requires joining through article_topics
  if (params.topic) {
    const { data: topic } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', params.topic)
      .single()
    if (topic) {
      const topicData = topic as { id: number }
      // Get article IDs that have this topic
      const { data: articleTopics } = await supabase
        .from('article_topics')
        .select('article_id')
        .eq('topic_id', topicData.id)
      if (articleTopics && articleTopics.length > 0) {
        const articleIds = articleTopics.map((at) => (at as { article_id: string }).article_id)
        query = query.in('id', articleIds)
      } else {
        // No articles with this topic, return empty
        return { articles: [], total: 0 }
      }
    }
  }

  const { data, count } = await query.range(offset, offset + perPage - 1)

  const articles = ((data || []) as Record<string, unknown>[]).map((article) => ({
    id: article.id as string,
    slug: article.slug as string,
    title_ar: article.title_ar as string,
    excerpt_ar: article.excerpt_ar as string | null,
    cover_image_path: article.cover_image_path as string | null,
    published_at: article.published_at as string | null,
    is_breaking: article.is_breaking as boolean,
    is_featured: article.is_featured as boolean,
    priority: ((article.priority as number) ?? 4) as ArticleListItem['priority'],
    author: article.author as ArticleListItem['author'],
    section: article.section as ArticleListItem['section'],
  }))

  return { articles, total: count || 0 }
}

async function getFilters() {
  const supabase = await createClient()

  const [sections, regions, countries, topics] = await Promise.all([
    supabase.from('sections').select('id, slug, name_ar').order('sort_order'),
    supabase.from('regions').select('id, slug, name_ar').order('sort_order'),
    supabase.from('countries').select('id, slug, name_ar, region_id').order('sort_order'),
    supabase.from('topics').select('id, slug, name_ar').order('sort_order'),
  ])

  return {
    sections: (sections.data || []) as { id: number; slug: string; name_ar: string }[],
    regions: (regions.data || []) as { id: number; slug: string; name_ar: string }[],
    countries: (countries.data || []) as {
      id: number
      slug: string
      name_ar: string
      region_id: number
    }[],
    topics: (topics.data || []) as { id: number; slug: string; name_ar: string }[],
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const query = params.q

  return {
    title: query ? `نتائج البحث: ${query}` : 'بحث',
    description: query
      ? `نتائج البحث عن "${query}" على ${SITE_CONFIG.nameAr}`
      : `البحث في أخبار ${SITE_CONFIG.nameAr}`,
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)

  const [{ articles, total }, filters] = await Promise.all([
    searchArticles({
      q: params.q,
      section: params.section,
      region: params.region,
      country: params.country,
      topic: params.topic,
      page,
    }),
    getFilters(),
  ])

  const totalPages = Math.ceil(total / PAGINATION.searchPageSize)
  const hasActiveFilters =
    params.q || params.section || params.region || params.country || params.topic

  return (
    <div className="search-page-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        {/* Search Header */}
        <header className="search-header">
          <h1 className="search-title">بحث</h1>
          <p className="search-subtitle">ابحث في آلاف المقالات والتقارير الإخبارية</p>
        </header>

        {/* Search Form */}
        <div className="search-form-container">
          <form method="get">
            {/* Main search input */}
            <div className="search-input-wrapper">
              <svg
                className="search-input-icon"
                width="24"
                height="24"
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
                type="search"
                name="q"
                defaultValue={params.q || ''}
                placeholder="ابحث عن المقالات، الكتّاب، المواضيع..."
                className="search-main-input"
                autoComplete="off"
              />
            </div>

            {/* Filters */}
            <Suspense fallback={<div className="search-filters" />}>
              <SearchFilters
                filters={filters}
                currentParams={{
                  section: params.section || '',
                  region: params.region || '',
                  country: params.country || '',
                  topic: params.topic || '',
                }}
              />
            </Suspense>

            {/* Submit button */}
            <button type="submit" className="search-submit-btn">
              <svg
                width="20"
                height="20"
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
              بحث
            </button>
          </form>
        </div>

        {/* Results */}
        {hasActiveFilters ? (
          <>
            {/* Results header */}
            <div className="search-results-header">
              <p className="search-results-count">
                {total > 0 ? (
                  <>
                    تم العثور على <strong>{total}</strong> نتيجة
                    {params.q && (
                      <>
                        {' '}
                        لـ &quot;<span className="search-results-query">{params.q}</span>&quot;
                      </>
                    )}
                  </>
                ) : (
                  'لم يتم العثور على نتائج'
                )}
              </p>
            </div>

            {articles.length > 0 ? (
              <>
                {/* Results grid */}
                <div className="search-results-grid">
                  {articles.map((article) => (
                    <SearchResultCard key={article.id} article={article} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <SearchPagination currentPage={page} totalPages={totalPages} params={params} />
                )}
              </>
            ) : (
              <SearchEmptyState query={params.q} />
            )}
          </>
        ) : (
          <SearchEmptyState />
        )}
      </div>
    </div>
  )
}

// Search result card component
function SearchResultCard({ article }: { article: ArticleListItem }) {
  const imageUrl = getStorageUrl(article.cover_image_path)

  return (
    <article className="search-result-card">
      {/* Image */}
      <Link href={`/article/${article.slug}`} className="search-card-image">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title_ar}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-100 to-slate-200" />
        )}
        {article.is_breaking && <span className="search-card-badge">عاجل</span>}
      </Link>

      {/* Content */}
      <div className="search-card-content">
        {article.section && (
          <Link href={`/section/${article.section.slug}`} className="search-card-section">
            {article.section.name_ar}
          </Link>
        )}

        <h3 className="search-card-title">
          <Link href={`/article/${article.slug}`}>{article.title_ar}</Link>
        </h3>

        {article.excerpt_ar && <p className="search-card-excerpt">{article.excerpt_ar}</p>}

        <div className="search-card-meta">
          {article.author && (
            <Link href={`/author/${article.author.id}`} className="search-card-author">
              {article.author.display_name_ar}
            </Link>
          )}
          {article.published_at && (
            <time>{formatDateAr(article.published_at, 'dd MMMM yyyy')}</time>
          )}
        </div>
      </div>
    </article>
  )
}

// Empty state component
function SearchEmptyState({ query }: { query?: string }) {
  return (
    <div className="search-empty-state">
      <svg
        className="search-empty-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
        <path d="M8 8h6" />
      </svg>
      <h2 className="search-empty-title">{query ? 'لم يتم العثور على نتائج' : 'ابدأ البحث'}</h2>
      <p className="search-empty-text">
        {query
          ? 'حاول تغيير كلمات البحث أو استخدام فلاتر مختلفة للحصول على نتائج أفضل.'
          : 'أدخل كلمة البحث أو اختر من الفلاتر أعلاه للعثور على المقالات.'}
      </p>
    </div>
  )
}

// Pagination component
function SearchPagination({
  currentPage,
  totalPages,
  params,
}: {
  currentPage: number
  totalPages: number
  params: Record<string, string | undefined>
}) {
  const buildUrl = (page: number) => {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.set('q', params.q)
    if (params.section) searchParams.set('section', params.section)
    if (params.region) searchParams.set('region', params.region)
    if (params.country) searchParams.set('country', params.country)
    if (params.topic) searchParams.set('topic', params.topic)
    searchParams.set('page', page.toString())
    return `/search?${searchParams.toString()}`
  }

  const pages: (number | 'dots')[] = []

  // Always show first page
  pages.push(1)

  // Calculate range around current page
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  // Add dots after first page if needed
  if (start > 2) {
    pages.push('dots')
  }

  // Add pages in range
  for (let i = start; i <= end; i++) {
    if (!pages.includes(i)) {
      pages.push(i)
    }
  }

  // Add dots before last page if needed
  if (end < totalPages - 1) {
    pages.push('dots')
  }

  // Always show last page if more than 1 page
  if (totalPages > 1 && !pages.includes(totalPages)) {
    pages.push(totalPages)
  }

  return (
    <nav className="search-pagination" aria-label="التنقل بين الصفحات">
      {/* Previous button */}
      {currentPage > 1 ? (
        <Link href={buildUrl(currentPage - 1)} className="pagination-btn">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          السابق
        </Link>
      ) : (
        <button type="button" className="pagination-btn" disabled>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
          السابق
        </button>
      )}

      {/* Page numbers */}
      {pages.map((pageNum, idx) =>
        pageNum === 'dots' ? (
          <span key={`dots-${idx}`} className="pagination-dots">
            ...
          </span>
        ) : (
          <Link
            key={pageNum}
            href={buildUrl(pageNum)}
            className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
            aria-current={pageNum === currentPage ? 'page' : undefined}
          >
            {pageNum}
          </Link>
        )
      )}

      {/* Next button */}
      {currentPage < totalPages ? (
        <Link href={buildUrl(currentPage + 1)} className="pagination-btn">
          التالي
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
      ) : (
        <button type="button" className="pagination-btn" disabled>
          التالي
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      )}
    </nav>
  )
}
