import { createClient } from '@/lib/supabase/server'
import { NewsletterForm } from '@/components/layout/newsletter-form'
import { formatTimeAr, formatDateAr, getStorageUrl } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 120 // 2 minutes

export async function generateMetadata() {
  return {
    title: '4Lebanon News'
  }
}

async function getHomepageData() {
  const supabase = await createClient()

  // Headline articles for المانشيت scroller
  const { data: headlineArticles } = await supabase
    .from('articles')
    .select('id, slug, title_ar, published_at')
    .eq('is_breaking', true)
    .order('published_at', { ascending: false })
    .limit(10)

  // Recent articles for على مدار الساعة (left sidebar) - with excerpt and images
  const { data: recentArticles } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking,
      section:sections!articles_section_id_fkey(id, name_ar)
    `
    )
    .order('published_at', { ascending: false })
    .limit(10)

  // Important/Featured articles (main area) - must have cover images
  const { data: importantArticles } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking,
      author:profiles!articles_author_id_fkey(id, display_name_ar),
      section:sections!articles_section_id_fkey(id, name_ar)
    `
    )
    .or('is_featured.eq.true,is_breaking.eq.true')
    .not('cover_image_path', 'is', null)
    .order('published_at', { ascending: false })
    .limit(6)

  // Get articles by specific sections for section blocks
  const sectionQueries = await Promise.all([
    getSectionArticles('radar', 4),
    getSectionArticles('investigation', 4),
    getSectionArticles('special', 5),
    getSectionArticles('local', 6),
    getSectionArticles('security', 8),
    getSectionArticles('regional', 6),
    getSectionArticles('economy', 8),
  ])

  // Get most read articles (we'll use recent popular ones as a fallback)
  const { data: mostReadArticles } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6)

  // Get writers/authors with avatars
  const { data: writers } = await supabase
    .from('profiles')
    .select('id, display_name_ar, avatar_url')
    .not('display_name_ar', 'is', null)
    .limit(6)

  return {
    headlines: ((headlineArticles || []) as Record<string, unknown>[]).map((item) => ({
      id: item.id as string,
      slug: item.slug as string,
      title_ar: item.title_ar as string,
      published_at: item.published_at as string,
    })),
    recent: ((recentArticles || []) as Record<string, unknown>[]).map((item) => ({
      id: item.id as string,
      slug: item.slug as string,
      title_ar: item.title_ar as string,
      excerpt_ar: item.excerpt_ar as string | null,
      cover_image_path: item.cover_image_path as string | null,
      published_at: item.published_at as string | null,
      is_breaking: item.is_breaking as boolean,
      section: item.section as { id: number; name_ar: string } | null,
    })),
    important: transformArticles((importantArticles || []) as Record<string, unknown>[]),
    mostRead: transformArticles((mostReadArticles || []) as Record<string, unknown>[]),
    sections: {
      radar: sectionQueries[0],
      investigation: sectionQueries[1],
      special: sectionQueries[2],
      local: sectionQueries[3],
      security: sectionQueries[4],
      regional: sectionQueries[5],
      economy: sectionQueries[6],
    },
    writers: writers || [],
  }
}

// Helper function to get articles by section slug
async function getSectionArticles(
  sectionSlug: string,
  limit: number = 6
): Promise<ArticleListItem[]> {
  const supabase = await createClient()

  // First get the section ID
  const { data: sectionData } = await supabase
    .from('sections')
    .select('id')
    .eq('slug', sectionSlug)
    .single()

  if (!sectionData) {
    return []
  }

  // Then get articles for that section
  const { data } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `
    )
    .eq('section_id', sectionData.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(limit)

  return transformArticles((data || []) as Record<string, unknown>[])
}

// Transform database response to ArticleListItem
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
  const tButtons = await getTranslations('buttons')
  const tCommon = await getTranslations('common')

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Two Column Layout: على مدار الساعة + الأخبار المهمة */}
        <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-[40%_60%]">
          {/* Left Sidebar: على مدار الساعة */}
          <aside className="border border-gray-200 bg-gray-50">
            <div className="bg-[#830005] px-4 py-3 text-white">
              <h2 className="text-xl font-bold">على مدار الساعة</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {data.recent.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="block px-4 py-4 transition-colors hover:bg-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <time className="shrink-0 pt-1 text-lg font-bold text-[#830005]">
                      {article.published_at ? formatTimeAr(article.published_at) : '--:--'}
                    </time>
                    <div className="min-w-0 flex-1 space-y-2">
                      {article.is_breaking && (
                        <span className="mb-2 inline-block bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                          عاجل
                        </span>
                      )}
                      <h3 className="line-clamp-2 text-sm leading-snug font-semibold text-gray-900">
                        {article.title_ar}
                      </h3>
                      {article.excerpt_ar && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
                          {article.excerpt_ar}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {article.section && (
                          <span className="text-[#830005]">{article.section.name_ar}</span>
                        )}
                        {article.published_at && (
                          <span>{formatDateAr(article.published_at, 'dd/MM')}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/recent"
              className="block bg-gray-100 py-3 text-center font-bold text-[#830005] transition-colors hover:bg-gray-200"
            >
              + المزيــــــد
            </Link>
          </aside>

          {/* Main Area: الأخبار المهمة */}
          <AnimatedSection>
            <div className="mb-6 flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#c61b23] md:text-3xl">{t('important')}</h2>
              <Link href="/important" className="text-sm font-bold text-[#c61b23] hover:underline whitespace-nowrap">
                {tButtons('more')} ←
              </Link>
            </div>
            <div className="mb-6 h-0.5 bg-[#c61b23]"></div>
            <div className="space-y-4">
              {data.important.length > 0 ? (
                data.important.map((article, index) => (
                  <AnimatedCard key={article.id} delay={index * 0.1}>
                    <Link
                      href={`/article/${article.slug}`}
                      className="group flex gap-4 rounded-lg border border-gray-100 bg-white p-4 transition-all duration-300 hover:border-[#c61b23] hover:shadow-xl"
                    >
                      <div className="relative h-28 w-40 shrink-0 overflow-hidden rounded-lg md:h-32 md:w-48">
                        <Image
                          src={getStorageUrl(article.cover_image_path || '')}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        {article.is_breaking && (
                          <span className="mb-2 inline-block rounded bg-[#c61b23] px-2 py-1 text-xs font-bold text-white">
                            عاجل
                          </span>
                        )}
                        {article.section && (
                          <span className="mb-2 inline-block text-xs font-semibold text-[#c61b23] md:text-sm">
                            {article.section.name_ar}
                          </span>
                        )}
                        <h3 className="mb-2 line-clamp-2 text-base leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-xl">
                          {article.title_ar}
                        </h3>
                        {article.excerpt_ar && (
                          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-600 md:text-sm">
                            {article.excerpt_ar}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          {article.published_at && (
                            <time>{formatDateAr(article.published_at)}</time>
                          )}
                          {article.author && <span>• {article.author.display_name_ar}</span>}
                        </div>
                      </div>
                    </Link>
                  </AnimatedCard>
                ))
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <svg
                    className="mx-auto mb-4 h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p>لا توجد أخبار مهمة حالياً</p>
                </div>
              )}
            </div>
            <Link
              href="/important"
              className="mt-6 block bg-gray-100 py-3 text-center font-bold text-[#830005] transition-colors hover:bg-gray-200"
            >
              + المزيــــــد
            </Link>
          </AnimatedSection>
        </div>

        {/* Section Blocks */}
        <div className="space-y-12 md:space-y-16">
          {/* رادار and بحث وتحرّي Section - Side by Side */}
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {/* رادار Section */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">{t('radar')}</h2>
                <Link
                  href="/section/radar"
                  className="text-xs font-bold text-[#c61b23] hover:underline md:text-sm whitespace-nowrap"
                >
                  {tButtons('more')} ←
                </Link>
              </div>
              <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
              {data.sections.radar.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {data.sections.radar.slice(0, 4).map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`} className="group">
                      {article.cover_image_path && (
                        <div className="relative mb-2 h-28 w-full overflow-hidden rounded md:h-32">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h3 className="line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                        {article.title_ar}
                      </h3>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-400">
                  <p>لا توجد مقالات في هذا القسم</p>
                </div>
              )}
            </div>

            {/* بحث وتحرّي Section */}
            <div>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">
                  {t('investigation')}
                </h2>
                <Link
                  href="/section/investigation"
                  className="text-xs font-bold text-[#c61b23] hover:underline md:text-sm whitespace-nowrap"
                >
                  {tButtons('more')} ←
                </Link>
              </div>
              <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
              {data.sections.investigation.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {data.sections.investigation.slice(0, 4).map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`} className="group">
                      {article.cover_image_path && (
                        <div className="relative mb-2 h-28 w-full overflow-hidden rounded md:h-32">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h3 className="line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                        {article.title_ar}
                      </h3>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-gray-400">
                  <p>لا توجد مقالات في هذا القسم</p>
                </div>
              )}
            </div>
          </section>

          {/* خاص Section - Pink Background List + Images */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">{t('special')}</h2>
              <Link
                href="/section/special"
                className="text-xs font-bold text-[#c61b23] hover:underline md:text-sm whitespace-nowrap"
              >
                {tButtons('more')} ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.sections.special.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
                {/* Article List on Left - Pink Background */}
                <div className="space-y-3 rounded-lg bg-[#f5e6e6] p-4 md:p-6">
                  {data.sections.special.slice(0, 5).map((article) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group flex items-start gap-3 border-b border-gray-300 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                          {article.title_ar}
                        </h3>
                      </div>
                      {article.cover_image_path && (
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded md:h-16 md:w-16">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
                {/* Featured Images on Right */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:col-span-2">
                  {data.sections.special.slice(0, 3).map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className={`group ${index === 0 ? 'col-span-2' : ''}`}
                    >
                      <div
                        className={`relative w-full ${index === 0 ? 'h-48 md:h-72' : 'h-32 md:h-44'} overflow-hidden rounded-lg`}
                      >
                        {article.cover_image_path && (
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <h4 className="mt-2 line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:mt-3 md:text-sm">
                        {article.title_ar}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا توجد مقالات في هذا القسم</p>
              </div>
            )}
          </section>

          {/* الأكثر قراءة - Most Read Section */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">
                {t('mostRead')}
              </h2>
              <Link
                href="/most-read"
                className="whitespace-nowrap text-xs font-bold text-[#c61b23] hover:underline md:text-sm"
              >
                {tButtons('more')} ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.mostRead.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:gap-8 lg:grid-cols-3">
                {/* Numbered List on Left */}
                <div className="space-y-4">
                  {data.mostRead.slice(1, 6).map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group flex items-start gap-3 md:gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-800 text-base font-bold text-white md:h-12 md:w-12 md:text-lg">
                          {String(index + 2).padStart(2, '0')}
                        </div>
                        {article.cover_image_path && (
                          <div className="relative h-11 w-14 shrink-0 overflow-hidden rounded md:h-12 md:w-16">
                            <Image
                              src={getStorageUrl(article.cover_image_path)}
                              alt={article.title_ar}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                          {article.title_ar}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* Large Featured Article on Right */}
                <div className="lg:col-span-2">
                  {data.mostRead[0] && (
                    <Link href={`/article/${data.mostRead[0].slug}`} className="group block">
                      <div className="relative">
                        <div className="relative h-56 w-full overflow-hidden rounded-lg md:h-80">
                          {data.mostRead[0].cover_image_path && (
                            <Image
                              src={getStorageUrl(data.mostRead[0].cover_image_path)}
                              alt={data.mostRead[0].title_ar}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          )}
                        </div>
                        <div className="absolute top-3 right-3 rounded bg-[#c61b23] px-3 py-1 text-2xl font-bold text-white md:top-4 md:right-4 md:px-4 md:py-2 md:text-3xl">
                          01
                        </div>
                      </div>
                      <h3 className="mt-3 line-clamp-2 text-base leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:mt-4 md:text-xl">
                        {data.mostRead[0].title_ar}
                      </h3>
                      {data.mostRead[0].excerpt_ar && (
                        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-gray-600 md:text-sm">
                          {data.mostRead[0].excerpt_ar}
                        </p>
                      )}
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا توجد مقالات</p>
              </div>
            )}
          </section>

          {/* SpotShot Section - Video Block */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">SpotShot</h2>
              <Link
                href="/section/spotshot"
                className="whitespace-nowrap text-xs font-bold text-[#c61b23] hover:underline md:text-sm"
              >
                المزيد ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.mostRead.length > 0 || data.important.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-4">
                {/* Article List on Left */}
                <div className="space-y-4">
                  {data.mostRead.slice(0, 4).map((article) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group flex items-start gap-3"
                    >
                      {article.cover_image_path && (
                        <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded md:h-14 md:w-20">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover"
                          />
                          <div className="bg-opacity-30 absolute inset-0 flex items-center justify-center bg-black">
                            <svg
                              className="h-5 w-5 text-white md:h-6 md:w-6"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                            </svg>
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="line-clamp-3 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                          {article.title_ar}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
                {/* Large Video on Right */}
                <div className="lg:col-span-3">
                  {data.important[0] && (
                    <div className="group relative h-56 w-full cursor-pointer overflow-hidden rounded-lg bg-gray-900 md:h-80">
                      {data.important[0].cover_image_path ? (
                        <Image
                          src={getStorageUrl(data.important[0].cover_image_path)}
                          alt={data.important[0].title_ar}
                          fill
                          className="object-cover opacity-80 transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full bg-gray-800"></div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-opacity-90 flex h-16 w-16 items-center justify-center rounded-full bg-white transition-colors group-hover:bg-[#c61b23] md:h-20 md:w-20">
                          <svg
                            className="mr-1 h-8 w-8 text-gray-900 transition-colors group-hover:text-white md:h-10 md:w-10"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4 md:p-6">
                        <p className="text-sm leading-tight font-bold text-white md:text-lg">
                          {data.important[0].title_ar}
                        </p>
                        {data.important[0].excerpt_ar && (
                          <p className="mt-1 line-clamp-2 text-xs text-white opacity-90 md:mt-2 md:text-sm">
                            {data.important[0].excerpt_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا توجد فيديوهات</p>
              </div>
            )}
          </section>

          {/* المحلية Section - Multiple Images Layout */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">المحلية</h2>
              <Link
                href="/section/local"
                className="whitespace-nowrap text-xs font-bold text-[#c61b23] hover:underline md:text-sm"
              >
                المزيد ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.sections.local.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3">
                  {/* Large Featured - spans 2 columns */}
                  {data.sections.local[0] && (
                    <Link
                      href={`/article/${data.sections.local[0].slug}`}
                      className="group md:col-span-2"
                    >
                      <div className="relative h-48 w-full overflow-hidden rounded-lg md:h-64 lg:h-80">
                        {data.sections.local[0].cover_image_path && (
                          <Image
                            src={getStorageUrl(data.sections.local[0].cover_image_path)}
                            alt={data.sections.local[0].title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:mt-3 md:text-base">
                        {data.sections.local[0].title_ar}
                      </h3>
                    </Link>
                  )}
                  {/* Side Images */}
                  {data.sections.local.slice(1, 3).map((article) => (
                    <Link key={article.id} href={`/article/${article.slug}`} className="group">
                      <div className="relative h-32 w-full overflow-hidden rounded-lg md:h-36">
                        {article.cover_image_path && (
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <h4 className="mt-2 line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                        {article.title_ar}
                      </h4>
                    </Link>
                  ))}
                </div>
                {/* Additional Text Links */}
                {data.sections.local.length > 3 && (
                  <div className="mt-4 space-y-3 md:mt-6">
                    {data.sections.local.slice(3, 6).map((article) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group block border-b border-gray-200 pb-3 last:border-0"
                      >
                        <h4 className="line-clamp-1 text-xs font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                          {article.title_ar}
                        </h4>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا توجد مقالات في هذا القسم</p>
              </div>
            )}
          </section>

          {/* أمن وقضاء Section */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">
                أمن وقضاء
              </h2>
              <Link
                href="/section/security"
                className="whitespace-nowrap text-xs font-bold text-[#c61b23] hover:underline md:text-sm"
              >
                المزيد ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.sections.security.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {data.sections.security.slice(0, 8).map((article) => (
                  <Link key={article.id} href={`/article/${article.slug}`} className="group">
                    {article.cover_image_path && (
                      <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg md:h-32">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <h3 className="line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                      {article.title_ar}
                    </h3>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا توجد مقالات في هذا القسم</p>
              </div>
            )}
          </section>

          {/* إقليمي ودولي Section */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">
                إقليمي ودولي
              </h2>
              <Link
                href="/section/regional"
                className="whitespace-nowrap text-xs font-bold text-[#c61b23] hover:underline md:text-sm"
              >
                المزيد ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.sections.regional.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
                {/* Large Image on Left */}
                <div className="lg:col-span-2">
                  {data.sections.regional[0] && (
                    <Link href={`/article/${data.sections.regional[0].slug}`} className="group">
                      <div className="relative h-56 w-full overflow-hidden rounded-lg md:h-80">
                        {data.sections.regional[0].cover_image_path && (
                          <Image
                            src={getStorageUrl(data.sections.regional[0].cover_image_path)}
                            alt={data.sections.regional[0].title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-base font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:mt-3 md:text-lg">
                        {data.sections.regional[0].title_ar}
                      </h3>
                    </Link>
                  )}
                </div>
                {/* Side Images */}
                <div className="space-y-4">
                  {data.sections.regional.slice(1, 3).map((article) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group block"
                    >
                      <div className="relative h-32 w-full overflow-hidden rounded-lg md:h-36">
                        {article.cover_image_path && (
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                      </div>
                      <h4 className="mt-2 line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                        {article.title_ar}
                      </h4>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا توجد مقالات في هذا القسم</p>
              </div>
            )}
          </section>

          {/* كتّابنا Section (Writers) */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">كتّابنا</h2>
              <Link
                href="/authors"
                className="text-xs font-bold text-[#c61b23] hover:underline md:text-sm whitespace-nowrap"
              >
                جميع كتّابنا ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.writers.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                {data.writers.slice(0, 5).map((writer) => (
                  <Link key={writer.id} href={`/author/${writer.id}`} className="group text-center">
                    <div className="mx-auto mb-2 h-20 w-20 overflow-hidden rounded-full border-3 border-gray-300 transition-colors group-hover:border-[#c61b23] md:h-24 md:w-24">
                      {writer.avatar_url ? (
                        <Image
                          src={writer.avatar_url}
                          alt={writer.display_name_ar || 'كاتب'}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gray-200">
                          <span className="text-xl font-bold text-gray-500 md:text-2xl">
                            {writer.display_name_ar?.[0] || 'ك'}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 transition-colors group-hover:text-[#c61b23] md:text-sm">
                      {writer.display_name_ar || 'كاتب'}
                    </h3>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا يوجد كتّاب حالياً</p>
              </div>
            )}
          </section>

          {/* اقتصاد Section */}
          <section>
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#c61b23] md:text-2xl lg:text-3xl">اقتصاد</h2>
              <Link
                href="/section/economy"
                className="whitespace-nowrap text-xs font-bold text-[#c61b23] hover:underline md:text-sm"
              >
                المزيد ←
              </Link>
            </div>
            <div className="mb-4 h-0.5 bg-[#c61b23] md:mb-6"></div>
            {data.sections.economy.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {data.sections.economy.slice(0, 8).map((article) => (
                  <Link key={article.id} href={`/article/${article.slug}`} className="group">
                    {article.cover_image_path && (
                      <div className="relative mb-2 h-28 w-full overflow-hidden rounded-lg md:h-32">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <h3 className="line-clamp-2 text-xs leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                      {article.title_ar}
                    </h3>
                    {article.published_at && (
                      <p className="mt-1 text-xs text-gray-400">
                        {formatDateAr(article.published_at, 'dd MMM')}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-gray-400">
                <p>لا توجد مقالات في هذا القسم</p>
              </div>
            )}
          </section>

          {/* Newsletter CTA Section */}
          <AnimatedSection>
            <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#c61b23] to-[#a01419] p-6 shadow-2xl md:p-10 lg:p-12">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                ></div>
              </div>

              <div className="relative z-10">
                {/* Icon */}
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <svg
                      className="h-8 w-8 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>

                <h2 className="mb-3 text-center text-xl font-bold text-white md:text-2xl lg:text-3xl">
                  تسجّل في النشرة اليومية
                </h2>
                <p className="mx-auto mb-6 max-w-2xl text-center text-sm text-white/90 md:text-base">
                  احصل على أحدث الأخبار والتحليلات مباشرة إلى بريدك الإلكتروني
                </p>

                {/* Email Form */}
                <NewsletterForm />

                {/* Social Media */}
                <div className="text-center">
                  <span className="mb-3 block text-sm text-white/80">تابعنا على</span>
                  <div className="flex flex-wrap justify-center gap-3">
                    <a
                      href="#facebook"
                      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white"
                      aria-label="Facebook"
                    >
                      <svg
                        className="h-5 w-5 text-white group-hover:text-[#c61b23]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </a>
                    <a
                      href="#twitter"
                      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white"
                      aria-label="Twitter"
                    >
                      <svg
                        className="h-5 w-5 text-white group-hover:text-[#c61b23]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </a>
                    <a
                      href="#instagram"
                      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white"
                      aria-label="Instagram"
                    >
                      <svg
                        className="h-5 w-5 text-white group-hover:text-[#c61b23]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                      </svg>
                    </a>
                    <a
                      href="#youtube"
                      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white"
                      aria-label="YouTube"
                    >
                      <svg
                        className="h-5 w-5 text-white group-hover:text-[#c61b23]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                    <a
                      href="#telegram"
                      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white"
                      aria-label="Telegram"
                    >
                      <svg
                        className="h-5 w-5 text-white group-hover:text-[#c61b23]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                      </svg>
                    </a>
                    <a
                      href="#whatsapp"
                      className="group flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-white"
                      aria-label="WhatsApp"
                    >
                      <svg
                        className="h-5 w-5 text-white group-hover:text-[#c61b23]"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </AnimatedSection>
        </div>
      </main>
    </div>
  )
}
