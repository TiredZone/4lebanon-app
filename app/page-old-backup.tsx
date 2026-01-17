import { createClient } from '@/lib/supabase/server'
import { getTranslations } from 'next-intl/server'
import { formatTimeAr, formatDateAr, getStorageUrl } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 120

export async function generateMetadata() {
  return {
    title: '4Lebanon News'
  }
}

async function getHomepageData() {
  const supabase = await createClient()

  // Get recent articles with images and excerpts
  const { data: recentArticles } = await supabase
    .from('articles')
    .select(`
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking,
      section:sections!articles_section_id_fkey(id, name_ar)
    `)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  // Get important/featured articles with cover images
  const { data: importantArticles } = await supabase
    .from('articles')
    .select(`
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar),
      section:sections!articles_section_id_fkey(id, name_ar)
    `)
    .eq('status', 'published')
    .or('is_featured.eq.true,is_breaking.eq.true')
    .not('cover_image_path', 'is', null)
    .order('published_at', { ascending: false })
    .limit(6)

  // Get section articles
  const sectionQueries = await Promise.all([
    getSectionArticles('radar', 4),
    getSectionArticles('investigation', 4),
    getSectionArticles('local', 4),
    getSectionArticles('security', 4),
    getSectionArticles('regional', 4),
    getSectionArticles('economy', 4),
  ])

  return {
    recent: transformArticles((recentArticles || []) as Record<string, unknown>[]),
    important: transformArticles((importantArticles || []) as Record<string, unknown>[]),
    sections: {
      radar: sectionQueries[0],
      investigation: sectionQueries[1],
      local: sectionQueries[2],
      security: sectionQueries[3],
      regional: sectionQueries[4],
      economy: sectionQueries[5],
    },
  }
}

async function getSectionArticles(sectionSlug: string, limit: number = 4): Promise<ArticleListItem[]> {
  const supabase = await createClient()
  
  const { data: sectionData } = await supabase
    .from('sections')
    .select('id')
    .eq('slug', sectionSlug)
    .single()

  if (!sectionData) return []

  const { data } = await supabase
    .from('articles')
    .select(`
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `)
    .eq('section_id', sectionData.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false})
    .limit(limit)

  return transformArticles((data || []) as Record<string, unknown>[])
}

function transformArticles(articles: Record<string, unknown>[]): ArticleListItem[] {
  return articles.map((article) => ({
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

export default async function Home() {
  const data = await getHomepageData()
  const t = await getTranslations('sections')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Important & Recent News with Beautiful Design */}
      <section className="relative bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
          {/* Section Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">أهم الأخبار</h2>
            <Link href="/important" className="text-sm font-semibold text-[#c61b23] hover:underline">
              عرض الكل ←
            </Link>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Featured Article - Takes 2 columns */}
            {data.important[0] && (
              <Link 
                href={`/article/${data.important[0].slug}`}
                className="group relative overflow-hidden rounded-2xl md:col-span-2 md:row-span-2"
              >
                {/* Background Image */}
                <div className="relative h-[400px] w-full md:h-full">
                  <Image
                    src={getStorageUrl(data.important[0].cover_image_path || '')}
                    alt={data.important[0].title_ar}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    priority
                  />
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  {data.important[0].is_breaking && (
                    <span className="mb-3 inline-block rounded-full bg-[#c61b23] px-3 py-1 text-xs font-bold text-white">
                      عاجل
                    </span>
                  )}
                  {data.important[0].section && (
                    <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                      {data.important[0].section.name_ar}
                    </span>
                  )}
                  <h3 className="mb-3 text-2xl font-bold leading-tight text-white md:text-3xl lg:text-4xl">
                    {data.important[0].title_ar}
                  </h3>
                  {data.important[0].excerpt_ar && (
                    <p className="mb-4 line-clamp-2 text-sm text-white/90 md:text-base">
                      {data.important[0].excerpt_ar}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    {data.important[0].published_at && (
                      <time>{formatDateAr(data.important[0].published_at)}</time>
                    )}
                    {data.important[0].author && (
                      <span>• {data.important[0].author.display_name_ar}</span>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* Smaller Articles */}
            {data.important.slice(1, 5).map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="group relative overflow-hidden rounded-2xl"
              >
                <div className="relative h-[300px] w-full">
                  <Image
                    src={getStorageUrl(article.cover_image_path || '')}
                    alt={article.title_ar}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {article.is_breaking && (
                    <span className="mb-2 inline-block rounded-full bg-[#c61b23] px-2.5 py-0.5 text-xs font-bold text-white">
                      عاجل
                    </span>
                  )}
                  {article.section && (
                    <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold text-white backdrop-blur-sm">
                      {article.section.name_ar}
                    </span>
                  )}
                  <h3 className="mb-2 line-clamp-2 text-lg font-bold leading-tight text-white md:text-xl">
                    {article.title_ar}
                  </h3>
                  {article.published_at && (
                    <time className="text-xs text-white/80">
                      {formatDateAr(article.published_at)}
                    </time>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent News Section - Clean List Design */}
      <section className="bg-white py-8 md:py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-6 flex items-center justify-between border-b-2 border-[#c61b23] pb-3">
            <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">على مدار الساعة</h2>
            <Link href="/recent" className="text-sm font-semibold text-[#c61b23] hover:underline">
              عرض الكل ←
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-[#c61b23] hover:shadow-lg"
              >
                {article.cover_image_path && (
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={getStorageUrl(article.cover_image_path)}
                      alt={article.title_ar}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center gap-2">
                    {article.is_breaking && (
                      <span className="inline-block rounded bg-[#c61b23] px-2 py-0.5 text-xs font-bold text-white">
                        عاجل
                      </span>
                    )}
                    {article.section && (
                      <span className="text-xs font-semibold text-[#c61b23]">
                        {article.section.name_ar}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-3 line-clamp-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                    {article.title_ar}
                  </h3>
                  {article.excerpt_ar && (
                    <p className="mb-4 line-clamp-3 flex-1 text-sm text-gray-600">
                      {article.excerpt_ar}
                    </p>
                  )}
                  {article.published_at && (
                    <time className="text-xs text-gray-500">
                      {formatTimeAr(article.published_at)} • {formatDateAr(article.published_at, 'dd/MM')}
                    </time>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section Blocks - Modern Card Design */}
      {Object.entries(data.sections).map(([sectionKey, articles]) => {
        if (articles.length === 0) return null
        
        const sectionNames: Record<string, string> = {
          radar: 'رادار',
          investigation: 'بحث وتحرّي',
          local: 'المحلية',
          security: 'أمن وقضاء',
          regional: 'إقليمي ودولي',
          economy: 'اقتصاد',
        }

        return (
          <section key={sectionKey} className="bg-gray-50 py-8 md:py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-6 flex items-center justify-between border-b-2 border-[#c61b23] pb-3">
                <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                  {sectionNames[sectionKey]}
                </h2>
                <Link 
                  href={`/section/${sectionKey}`} 
                  className="text-sm font-semibold text-[#c61b23] hover:underline"
                >
                  عرض الكل ←
                </Link>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {articles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-[#c61b23] hover:shadow-lg"
                  >
                    {article.cover_image_path && (
                      <div className="relative h-40 w-full overflow-hidden">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {article.is_breaking && (
                        <span className="mb-2 inline-block rounded bg-[#c61b23] px-2 py-0.5 text-xs font-bold text-white">
                          عاجل
                        </span>
                      )}
                      <h3 className="mb-2 line-clamp-3 text-base font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                        {article.title_ar}
                      </h3>
                      {article.published_at && (
                        <time className="text-xs text-gray-500">
                          {formatDateAr(article.published_at, 'dd/MM/yyyy')}
                        </time>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </div>
  )
}
