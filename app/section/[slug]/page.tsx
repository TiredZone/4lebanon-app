import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION, SITE_CONFIG } from '@/lib/constants'
import { GlassEditorialCard } from '@/components/glass-editorial-card'
import { SectionFilters } from '@/components/section/section-filters'
import type { ArticleListItem, Section } from '@/types/database'

export const revalidate = 180 // 3 minutes

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    page?: string
    topic?: string
    region?: string
    country?: string
    sort?: string
    period?: string
  }>
}

async function getSection(slug: string): Promise<Section | null> {
  const supabase = await createClient()

  const { data } = await supabase.from('sections').select('*').eq('slug', slug).single()

  return data as Section | null
}

async function getSectionFilters() {
  const supabase = await createClient()

  const [regions, countries, topics] = await Promise.all([
    supabase.from('regions').select('id, slug, name_ar').order('sort_order'),
    supabase.from('countries').select('id, slug, name_ar, region_id').order('sort_order'),
    supabase.from('topics').select('id, slug, name_ar').order('sort_order'),
  ])

  return {
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

async function getSectionArticles(
  sectionId: number,
  page: number = 1,
  filterParams: {
    topic?: string
    region?: string
    country?: string
    sort?: string
    period?: string
  } = {}
): Promise<{ articles: ArticleListItem[]; total: number }> {
  const supabase = await createClient()
  const perPage = PAGINATION.defaultPageSize
  const offset = (page - 1) * perPage
  const now = new Date().toISOString()

  let query = supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured, priority,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url, is_anonymous),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `,
      { count: 'exact' }
    )
    .eq('section_id', sectionId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)

  // Region filter
  if (filterParams.region) {
    const { data: region } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', filterParams.region)
      .single()
    if (region) {
      query = query.eq('region_id', (region as { id: number }).id)
    }
  }

  // Country filter
  if (filterParams.country) {
    const { data: country } = await supabase
      .from('countries')
      .select('id')
      .eq('slug', filterParams.country)
      .single()
    if (country) {
      query = query.eq('country_id', (country as { id: number }).id)
    }
  }

  // Topic filter — join through article_topics
  if (filterParams.topic) {
    const { data: topic } = await supabase
      .from('topics')
      .select('id')
      .eq('slug', filterParams.topic)
      .single()
    if (topic) {
      const { data: articleTopics } = await supabase
        .from('article_topics')
        .select('article_id')
        .eq('topic_id', (topic as { id: number }).id)
      if (articleTopics && articleTopics.length > 0) {
        const articleIds = articleTopics.map((at) => (at as { article_id: string }).article_id)
        query = query.in('id', articleIds)
      } else {
        return { articles: [], total: 0 }
      }
    }
  }

  // Time period filter
  if (filterParams.period) {
    const nowDate = new Date()
    let threshold: Date
    switch (filterParams.period) {
      case 'today':
        threshold = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate())
        break
      case 'week':
        threshold = new Date(nowDate.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        threshold = new Date(nowDate.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      default:
        threshold = new Date(0)
    }
    if (filterParams.period !== 'all') {
      query = query.gte('published_at', threshold.toISOString())
    }
  }

  // Sort order
  switch (filterParams.sort) {
    case 'newest':
      query = query.order('published_at', { ascending: false })
      break
    case 'oldest':
      query = query.order('published_at', { ascending: true })
      break
    case 'most_read':
      query = query.order('view_count', { ascending: false })
      break
    default:
      // Editorial priority (default)
      query = query
        .order('priority', { ascending: true })
        .order('sort_position', { ascending: false })
      break
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

// Determine page variant based on slug
function getPageVariant(slug: string): 'default' | 'exclusive' | 'authors' {
  if (slug === 'exclusive' || slug === 'خاص') return 'exclusive'
  if (slug === 'authors' || slug === 'كتابنا') return 'authors'
  return 'default'
}

// Get background class based on variant
function getBackgroundClass(variant: 'default' | 'exclusive' | 'authors'): string {
  switch (variant) {
    case 'exclusive':
      return 'exclusive-page-bg'
    case 'authors':
      return 'authors-page-bg'
    default:
      return 'category-page-bg'
  }
}

export async function generateStaticParams() {
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = createServiceClient()
  const { data } = await supabase.from('sections').select('slug')
  return (data || []).map((s) => ({ slug: (s as { slug: string }).slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const section = await getSection(slug)

  if (!section) {
    return { title: 'القسم غير موجود' }
  }

  return {
    title: section.name_ar,
    description: section.description_ar || `أخبار ${section.name_ar} على ${SITE_CONFIG.nameAr}`,
    alternates: { canonical: '/section/' + slug },
    openGraph: {
      title: section.name_ar,
      description: section.description_ar || `أخبار ${section.name_ar}`,
    },
  }
}

export default async function SectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const resolvedParams = await searchParams
  const page = Math.max(1, parseInt(resolvedParams.page || '1', 10) || 1)

  const section = await getSection(slug)

  if (!section) {
    notFound()
  }

  const filterParams = {
    topic: resolvedParams.topic || '',
    region: resolvedParams.region || '',
    country: resolvedParams.country || '',
    sort: resolvedParams.sort || '',
    period: resolvedParams.period || '',
  }

  const hasActiveFilters = !!(
    filterParams.topic ||
    filterParams.region ||
    filterParams.country ||
    filterParams.sort ||
    filterParams.period
  )

  const [{ articles, total }, filters] = await Promise.all([
    getSectionArticles(section.id, page, filterParams),
    getSectionFilters(),
  ])

  const totalPages = Math.ceil(total / PAGINATION.defaultPageSize)

  // Determine page variant
  const variant = getPageVariant(slug)
  const bgClass = getBackgroundClass(variant)
  const isDark = variant === 'exclusive'

  return (
    <div className={bgClass}>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Category Header */}
        <header className={`category-header ${isDark ? 'category-header-dark' : ''}`}>
          <h1>{section.name_ar}</h1>
          {section.description_ar && <p>{section.description_ar}</p>}
        </header>

        {/* Filters */}
        <Suspense fallback={<div className="section-filters" style={{ minHeight: '8rem' }} />}>
          <SectionFilters
            filters={filters}
            currentParams={filterParams}
            sectionSlug={slug}
            total={total}
            hasActiveFilters={hasActiveFilters}
            isDark={isDark}
          />
        </Suspense>

        {/* Articles Grid - 3x3 Fluid */}
        {articles.length > 0 ? (
          <>
            <div className="category-grid">
              {articles.map((article, index) => (
                <GlassEditorialCard
                  key={article.id}
                  article={article}
                  index={index}
                  variant={variant === 'exclusive' ? 'exclusive' : 'default'}
                />
              ))}
            </div>

            {/* Glass Pagination */}
            {totalPages > 1 && (
              <GlassPagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl={`/section/${slug}`}
                isDark={isDark}
                filterParams={filterParams}
              />
            )}
          </>
        ) : (
          <div
            className={`glass-editorial-card mx-auto max-w-md p-8 text-center ${isDark ? 'glass-exclusive-card' : ''}`}
          >
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
              {hasActiveFilters
                ? 'لا توجد مقالات تطابق معايير البحث. حاول تغيير الفلاتر.'
                : 'لا توجد مقالات في هذا القسم حالياً.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Glass Pagination component
function GlassPagination({
  currentPage,
  totalPages,
  baseUrl,
  isDark = false,
  filterParams = {},
}: {
  currentPage: number
  totalPages: number
  baseUrl: string
  isDark?: boolean
  filterParams?: Record<string, string>
}) {
  const pages = []
  const maxVisible = 5

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  const buildUrl = (page: number) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(filterParams)) {
      if (value) params.set(key, value)
    }
    params.set('page', page.toString())
    return `${baseUrl}?${params.toString()}`
  }

  const darkStyles = isDark
    ? 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-violet-600 hover:border-violet-600 hover:text-white'
    : ''

  return (
    <nav className="pagination-glass">
      {currentPage > 1 && (
        <Link href={buildUrl(currentPage - 1)} className={darkStyles}>
          السابق
        </Link>
      )}

      {pages.map((pageNum) => (
        <Link
          key={pageNum}
          href={buildUrl(pageNum)}
          className={`${pageNum === currentPage ? 'active' : ''} ${isDark && pageNum !== currentPage ? darkStyles : ''}`}
        >
          {pageNum}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link href={buildUrl(currentPage + 1)} className={darkStyles}>
          التالي
        </Link>
      )}
    </nav>
  )
}
