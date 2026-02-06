import { createClient } from '@/lib/supabase/server'
import { GlassEditorialCard } from '@/components/glass-editorial-card'
import Link from 'next/link'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 60

const PAGE_SIZE = 18

async function getImportantArticles(page: number) {
  const supabase = await createClient()
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

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
    .eq('status', 'published')
    .or('is_featured.eq.true,is_breaking.eq.true')
    .order('published_at', { ascending: false })
    .range(from, to)

  return {
    articles: ((data || []) as Record<string, unknown>[]).map((article) => ({
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
    })),
    total: count || 0,
  }
}

export default async function ImportantNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1)
  const { articles, total } = await getImportantArticles(page)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="category-page-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Category Header - Centered */}
        <header className="category-header">
          <h1>الأخبار المهمة</h1>
          <p>أهم الأخبار العاجلة والمميزة</p>
        </header>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <>
            <div className="category-grid">
              {articles.map((article, index) => (
                <GlassEditorialCard key={article.id} article={article} index={index} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                {page > 1 && (
                  <Link
                    href={`/important?page=${page - 1}`}
                    className="bg-muted hover:bg-muted/80 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    السابق
                  </Link>
                )}
                <span className="text-muted-foreground px-4 text-sm">
                  صفحة {page} من {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/important?page=${page + 1}`}
                    className="bg-primary rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                  >
                    التالي
                  </Link>
                )}
              </div>
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
