import { createClient } from '@/lib/supabase/server'
import { formatTimeAr, formatDateAr } from '@/lib/utils'
import Link from 'next/link'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 60 // Revalidate every minute for recent news

async function getRecentArticles() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, published_at, is_breaking,
      author:profiles!articles_author_id_fkey(id, display_name_ar),
      section:sections!articles_section_id_fkey(id, name_ar)
    `
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .limit(20)

  const articles = ((data || []) as Record<string, unknown>[]).map((article) => ({
    id: article.id as string,
    slug: article.slug as string,
    title_ar: article.title_ar as string,
    published_at: article.published_at as string | null,
    is_breaking: article.is_breaking as boolean,
    author: article.author as ArticleListItem['author'],
    section: article.section as ArticleListItem['section'],
  }))

  return articles
}

export default async function RecentNewsPage() {
  const articles = await getRecentArticles()

  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-primary text-4xl font-bold">على مدار الساعة</h1>
          <p className="text-muted-foreground mt-2">آخر الأخبار والتحديثات لحظة بلحظة</p>
        </header>

        {/* Articles List */}
        {articles.length > 0 ? (
          <div className="rounded-lg bg-white shadow-sm">
            <div className="divide-border divide-y">
              {articles.map((article) => (
                <article key={article.id} className="group">
                  <Link
                    href={`/article/${article.slug}`}
                    className="hover:bg-muted/50 block p-6 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Time */}
                      <div className="flex-shrink-0 text-center">
                        <time className="text-primary block text-lg font-bold">
                          {article.published_at ? formatTimeAr(article.published_at) : '--:--'}
                        </time>
                        <span className="text-muted-foreground text-xs">
                          {article.published_at
                            ? formatDateAr(new Date(article.published_at), 'dd/MM')
                            : ''}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          {article.is_breaking && (
                            <span className="bg-primary inline-block rounded px-2 py-0.5 text-xs font-bold text-white">
                              عاجل
                            </span>
                          )}
                          {article.section && (
                            <span className="text-muted-foreground text-xs">
                              {article.section.name_ar}
                            </span>
                          )}
                        </div>

                        <h2 className="text-foreground group-hover:text-primary mb-2 text-lg leading-tight font-bold transition-colors">
                          {article.title_ar}
                        </h2>

                        {article.author && (
                          <p className="text-muted-foreground text-sm">
                            {article.author.display_name_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Load More Button */}
            <div className="border-border border-t p-6 text-center">
              <button
                type="button"
                className="hover:bg-primary-dark bg-primary rounded-lg px-6 py-2 font-medium text-white transition-colors"
              >
                + المزيــــــد
              </button>
            </div>
          </div>
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-foreground mb-2 text-xl font-bold">لا توجد أخبار حالياً</h2>
              <p className="text-muted-foreground">لم يتم نشر أي أخبار بعد. تحقق مرة أخرى قريباً</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
