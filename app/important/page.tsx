import { createClient } from '@/lib/supabase/server'
import { formatDateAr, getStorageUrl } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 60

async function getImportantArticles() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar),
      section:sections!articles_section_id_fkey(id, name_ar)
    `
    )
    .or('is_featured.eq.true,is_breaking.eq.true')
    .order('published_at', { ascending: false })
    .limit(20)

  return ((data || []) as Record<string, unknown>[]).map((article) => ({
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
}

export default async function ImportantNewsPage() {
  const articles = await getImportantArticles()

  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-primary text-4xl font-bold">الأخبار المهمة</h1>
          <p className="text-muted-foreground mt-2">أهم الأخبار العاجلة والمميزة</p>
        </header>

        {articles.length > 0 ? (
          <div className="space-y-6">
            {articles.map((article) => (
              <article
                key={article.id}
                className="group overflow-hidden rounded-lg bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <Link href={`/article/${article.slug}`} className="flex gap-4 p-4">
                  {/* Image */}
                  {article.cover_image_path && (
                    <div className="relative h-32 w-48 flex-shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={getStorageUrl(article.cover_image_path) || '/placeholder.png'}
                        alt={article.title_ar}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="192px"
                      />
                      {article.is_breaking && (
                        <span className="bg-primary absolute top-2 left-2 rounded px-2 py-1 text-xs font-bold text-white">
                          عاجل
                        </span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      {article.section && (
                        <span className="text-primary text-sm font-medium">
                          {article.section.name_ar}
                        </span>
                      )}
                      {article.published_at && (
                        <span className="text-muted-foreground text-xs">
                          {formatDateAr(new Date(article.published_at), 'dd MMMM yyyy')}
                        </span>
                      )}
                    </div>

                    <h2 className="text-foreground group-hover:text-primary mb-2 text-xl leading-tight font-bold transition-colors">
                      {article.title_ar}
                    </h2>

                    {article.excerpt_ar && (
                      <p className="text-muted-foreground mb-2 line-clamp-2 text-sm">
                        {article.excerpt_ar}
                      </p>
                    )}

                    {article.author && (
                      <p className="text-muted-foreground text-sm">
                        {article.author.display_name_ar}
                      </p>
                    )}
                  </div>
                </Link>
              </article>
            ))}

            <div className="py-6 text-center">
              <button className="hover:bg-primary-dark bg-primary rounded-lg px-8 py-3 font-medium text-white transition-colors">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-foreground mb-2 text-xl font-bold">لا توجد أخبار مهمة حالياً</h2>
              <p className="text-muted-foreground">لم يتم تمييز أي أخبار كأخبار مهمة بعد</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
