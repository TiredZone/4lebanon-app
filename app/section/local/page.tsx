import { createClient } from '@/lib/supabase/server'
import { PAGINATION } from '@/lib/constants'
import { ArticleGrid } from '@/components/article'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 120

async function getLocalArticles(page: number = 1) {
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
    .eq('section.slug', 'local')
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGINATION.defaultPageSize - 1)

  const articles = (data || []) as unknown as ArticleListItem[]
  return { articles, total: count || 0 }
}

export default async function LocalPage() {
  const { articles } = await getLocalArticles()

  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-foreground text-4xl font-bold">المحليّة</h1>
          <p className="text-muted-foreground mt-2">الأخبار المحلية وشؤون الداخل</p>
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
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <h2 className="text-foreground mb-2 text-xl font-bold">لا توجد أخبار محلية حالياً</h2>
              <p className="text-muted-foreground">لم يتم نشر أي أخبار في هذا القسم بعد</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
