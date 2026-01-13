import { createClient } from '@/lib/supabase/server'
import { PAGINATION } from '@/lib/constants'
import { ArticleGrid } from '@/components/article'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 120

async function getRadarArticles(page: number = 1) {
  const supabase = await createClient()
  const offset = (page - 1) * PAGINATION.defaultPageSize

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
    .eq('section.slug', 'radar')
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGINATION.defaultPageSize - 1)

  const articles = (data || []) as unknown as ArticleListItem[]
  return { articles, total: count || 0 }
}

export default async function RadarPage() {
  const { articles } = await getRadarArticles()

  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-foreground text-4xl font-bold">رادار</h1>
          <p className="text-muted-foreground mt-2">آخر الأخبار والتطورات العاجلة</p>
        </header>

        {articles.length > 0 ? (
          <ArticleGrid articles={articles} columns={3} showExcerpt />
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm">
            <div>
              <svg
                className="text-muted-foreground mx-auto mb-4 h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              <h2 className="text-foreground mb-2 text-xl font-bold">لا توجد مقالات حالياً</h2>
              <p className="text-muted-foreground">لم يتم نشر أي مقالات في هذا القسم بعد</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
