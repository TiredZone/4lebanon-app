import { createClient } from '@/lib/supabase/server'
import { getStorageUrl, formatLevantineDate } from '@/lib/utils'
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
    <div className="min-h-screen bg-[#f8f8f8]" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-[#c61b23]">الأخبار المهمة</h1>
          <p className="mt-2 text-gray-600">أهم الأخبار العاجلة والمميزة</p>
        </header>

        {articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="group cursor-pointer overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                {/* Top Half: Image (50%) */}
                <div className="relative aspect-video w-full overflow-hidden">
                  {article.cover_image_path ? (
                    <>
                      <Image
                        src={getStorageUrl(article.cover_image_path) || '/placeholder.png'}
                        alt={article.title_ar}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 600px"
                      />
                      {article.is_breaking && (
                        <span className="absolute top-3 right-3 rounded-md bg-[#c61b23] px-3 py-1 text-xs font-bold text-white shadow-lg">
                          عاجل
                        </span>
                      )}
                    </>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                      <svg
                        className="h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Bottom Half: Text Container (50%) */}
                <div className="flex min-h-[180px] flex-col justify-center bg-white p-4">
                  {/* Title - Bold, Max 2 lines, RTL */}
                  <h2 className="mb-2 line-clamp-2 text-right text-lg leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                    {article.title_ar}
                  </h2>

                  {/* Date - Levantine format with Latin numerals */}
                  {article.published_at && (
                    <time className="block text-right text-sm text-gray-500">
                      {formatLevantineDate(new Date(article.published_at))}
                    </time>
                  )}
                </div>
              </Link>
            ))}

            <div className="py-6 text-center">
              <button className="rounded-lg bg-[#c61b23] px-8 py-3 font-medium text-white transition-colors hover:bg-[#a01820]">
                المزيــــــد
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm">
            <div>
              <svg
                className="mx-auto mb-4 h-16 w-16 text-gray-400"
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
              <h2 className="mb-2 text-xl font-bold text-gray-900">لا توجد أخبار مهمة حالياً</h2>
              <p className="text-gray-600">لم يتم تمييز أي أخبار كأخبار مهمة بعد</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
