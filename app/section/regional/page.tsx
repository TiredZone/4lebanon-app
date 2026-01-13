import { createClient } from '@/lib/supabase/server'
import { PAGINATION } from '@/lib/constants'
import { ArticleGrid } from '@/components/article'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 120

async function getRegionalArticles(page: number = 1) {
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
    .eq('section.slug', 'regional')
    .order('published_at', { ascending: false })
    .range(offset, offset + PAGINATION.defaultPageSize - 1)

  const articles = (data || []) as unknown as ArticleListItem[]
  return { articles, total: count || 0 }
}

export default async function RegionalPage() {
  const { articles } = await getRegionalArticles()

  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-foreground text-4xl font-bold">إقليمي ودولي</h1>
          <p className="text-muted-foreground mt-2">الشؤون الإقليمية والدولية</p>
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
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-foreground mb-2 text-xl font-bold">لا توجد أخبار دولية حالياً</h2>
              <p className="text-muted-foreground">لم يتم نشر أي أخبار في هذا القسم بعد</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
