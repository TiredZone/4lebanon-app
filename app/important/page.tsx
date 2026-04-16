import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION } from '@/lib/constants'
import { GlassEditorialCard } from '@/components/glass-editorial-card'
import { sortByTier } from '@/lib/utils'
import type { ArticleListItem } from '@/types/database'

export const metadata: Metadata = {
  title: 'الأخبار المهمة',
  description: 'أهم الأخبار العاجلة والمميزة',
}

export const revalidate = 60

interface PageProps {
  searchParams: Promise<{ page?: string }>
}

async function getImportantArticles(page: number = 1) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  const perPage = PAGINATION.defaultPageSize
  const offset = (page - 1) * perPage

  // Fetch more articles than needed so we can apply time-decay sorting in JS
  const fetchLimit = offset + perPage + 20
  const { data, count } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured, priority,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url, is_anonymous),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `,
      { count: 'exact' }
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .limit(fetchLimit)

  // Apply time-decay sorting then paginate
  const sorted = sortByTier(
    (data || []) as (Record<string, unknown> & { priority: number; published_at: string | null })[]
  )
  const paged = sorted.slice(offset, offset + perPage)

  const articles = (paged as Record<string, unknown>[]).map((article) => ({
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

export default async function ImportantNewsPage({ searchParams }: PageProps) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const { articles, total } = await getImportantArticles(page)
  const totalPages = Math.ceil(total / PAGINATION.defaultPageSize)

  return (
    <div className="category-page-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Category Header - Centered */}
        <header className="category-header">
          <h1>الأخبار المهمة</h1>
          <p>أهم الأخبار العاجلة والمميزة</p>
        </header>

        {/* Articles Grid - 3x3 Fluid */}
        {articles.length > 0 ? (
          <>
            <div className="category-grid">
              {articles.map((article, index) => (
                <GlassEditorialCard key={article.id} article={article} index={index} />
              ))}
            </div>

            {totalPages > 1 && (
              <GlassPagination currentPage={page} totalPages={totalPages} baseUrl="/important" />
            )}
          </>
        ) : (
          <div className="glass-editorial-card mx-auto max-w-md p-8 text-center">
            <p className="text-gray-500">لا توجد أخبار مهمة حالياً.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function GlassPagination({
  currentPage,
  totalPages,
  baseUrl,
}: {
  currentPage: number
  totalPages: number
  baseUrl: string
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

  return (
    <nav className="pagination-glass">
      {currentPage > 1 && <Link href={`${baseUrl}?page=${currentPage - 1}`}>السابق</Link>}

      {pages.map((pageNum) => (
        <Link
          key={pageNum}
          href={`${baseUrl}?page=${pageNum}`}
          className={pageNum === currentPage ? 'active' : ''}
        >
          {pageNum}
        </Link>
      ))}

      {currentPage < totalPages && <Link href={`${baseUrl}?page=${currentPage + 1}`}>التالي</Link>}
    </nav>
  )
}
