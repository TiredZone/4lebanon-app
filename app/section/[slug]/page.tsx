import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION, SITE_CONFIG } from '@/lib/constants'
import { GlassEditorialCard } from '@/components/glass-editorial-card'
import type { ArticleListItem, Section } from '@/types/database'

export const revalidate = 180 // 3 minutes

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

async function getSection(slug: string): Promise<Section | null> {
  const supabase = await createClient()

  const { data } = await supabase.from('sections').select('*').eq('slug', slug).single()

  return data as Section | null
}

async function getSectionArticles(
  sectionId: number,
  page: number = 1
): Promise<{ articles: ArticleListItem[]; total: number }> {
  const supabase = await createClient()
  const perPage = PAGINATION.defaultPageSize
  const offset = (page - 1) * perPage
  const now = new Date().toISOString()

  const { data, count } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `,
      { count: 'exact' }
    )
    .eq('section_id', sectionId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  const articles = ((data || []) as Record<string, unknown>[]).map((article) => ({
    id: article.id as string,
    slug: article.slug as string,
    title_ar: article.title_ar as string,
    excerpt_ar: article.excerpt_ar as string | null,
    cover_image_path: article.cover_image_path as string | null,
    published_at: article.published_at as string | null,
    is_breaking: article.is_breaking as boolean,
    is_featured: article.is_featured as boolean,
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const section = await getSection(slug)

  if (!section) {
    return { title: 'القسم غير موجود' }
  }

  return {
    title: section.name_ar,
    description: section.description_ar || `أخبار ${section.name_ar} على ${SITE_CONFIG.nameAr}`,
    openGraph: {
      title: section.name_ar,
      description: section.description_ar || `أخبار ${section.name_ar}`,
    },
  }
}

export default async function SectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const section = await getSection(slug)

  if (!section) {
    notFound()
  }

  const { articles, total } = await getSectionArticles(section.id, page)
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
              />
            )}
          </>
        ) : (
          <div
            className={`glass-editorial-card mx-auto max-w-md p-8 text-center ${isDark ? 'glass-exclusive-card' : ''}`}
          >
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>
              لا توجد مقالات في هذا القسم حالياً.
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
}: {
  currentPage: number
  totalPages: number
  baseUrl: string
  isDark?: boolean
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

  const darkStyles = isDark
    ? 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-violet-600 hover:border-violet-600 hover:text-white'
    : ''

  return (
    <nav className="pagination-glass">
      {currentPage > 1 && (
        <Link href={`${baseUrl}?page=${currentPage - 1}`} className={darkStyles}>
          السابق
        </Link>
      )}

      {pages.map((pageNum) => (
        <Link
          key={pageNum}
          href={`${baseUrl}?page=${pageNum}`}
          className={`${pageNum === currentPage ? 'active' : ''} ${isDark && pageNum !== currentPage ? darkStyles : ''}`}
        >
          {pageNum}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link href={`${baseUrl}?page=${currentPage + 1}`} className={darkStyles}>
          التالي
        </Link>
      )}
    </nav>
  )
}
