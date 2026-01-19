import { createClient } from '@/lib/supabase/server'
import { getStorageUrl, toLatinNumbers } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import WritersCarousel from '@/components/writers-carousel'
import type { ArticleListItem } from '@/types/database'

export const revalidate = 120

export async function generateMetadata() {
  return {
    title: '4Lebanon News',
  }
}

async function getHomepageData() {
  const supabase = await createClient()

  const { data: recentArticles } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking,
      section:sections!articles_section_id_fkey(id, name_ar)
    `
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10)

  const { data: importantArticles } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar),
      section:sections!articles_section_id_fkey(id, name_ar)
    `
    )
    .eq('status', 'published')
    .or('is_featured.eq.true,is_breaking.eq.true')
    .not('cover_image_path', 'is', null)
    .order('published_at', { ascending: false })
    .limit(6)

  const sectionQueries = await Promise.all([
    getSectionArticles('radar', 6),
    getSectionArticles('investigation', 6),
    getSectionArticles('special', 8),
    getSectionArticles('local', 8),
    getSectionArticles('security', 10),
    getSectionArticles('regional', 8),
    getSectionArticles('economy', 6),
  ])

  // Fetch writers/authors
  const { data: writersData } = await supabase
    .from('profiles')
    .select('id, display_name_ar, avatar_url')
    .not('display_name_ar', 'is', null)
    .limit(10)

  return {
    recent: transformArticles((recentArticles || []) as Record<string, unknown>[]),
    important: transformArticles((importantArticles || []) as Record<string, unknown>[]),
    writers: writersData || [],
    sections: {
      radar: sectionQueries[0],
      investigation: sectionQueries[1],
      special: sectionQueries[2],
      local: sectionQueries[3],
      security: sectionQueries[4],
      regional: sectionQueries[5],
      economy: sectionQueries[6],
    },
  }
}

async function getSectionArticles(
  sectionSlug: string,
  limit: number = 6
): Promise<ArticleListItem[]> {
  const supabase = await createClient()

  const { data: sectionData } = await supabase
    .from('sections')
    .select('id')
    .eq('slug', sectionSlug)
    .single()

  if (!sectionData) return []

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

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* First Section: 30% Recent + 70% Featured */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 md:px-0">
          <div className="grid grid-cols-1 gap-0 lg:grid-cols-[30%_70%]">
            {/* Right Sidebar - على مدار الساعة (Recent News) */}
            <div className="order-2 border-l border-gray-200 lg:order-1">
              {/* Header */}
              <div className="border-b-2 border-[#c61b23] bg-white px-5 py-3">
                <h2 className="text-lg font-bold text-[#c61b23]">على مدار الساعة</h2>
              </div>

              {/* News List */}
              <div className="bg-white">
                {data.recent.slice(0, 7).map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className={`group flex items-start gap-4 border-b border-gray-100 px-5 py-4 transition-colors last:border-b-0 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    {/* Time on the left (RTL, so it appears on the right visually) */}
                    <div className="shrink-0">
                      <div className="text-base font-bold text-[#c61b23]">
                        {article.published_at
                          ? new Date(article.published_at).toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })
                          : '00:00'}
                      </div>
                    </div>

                    {/* Title and excerpt on the right (RTL, so it appears on the left visually) */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h3 className="line-clamp-1 text-sm leading-tight font-semibold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                        {article.title_ar}
                      </h3>
                      {article.excerpt_ar && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-gray-600">
                          {article.excerpt_ar}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}

                {/* More Button */}
                <Link
                  href="/recent"
                  className="flex items-center justify-center gap-2 border-t-2 border-[#c61b23] bg-white px-5 py-3 text-center text-sm font-bold text-black transition-colors hover:bg-gray-50"
                >
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>
            </div>

            {/* Left Main Area - الأهم (Featured Articles) */}
            <div className="order-1 lg:order-2">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-[#c61b23] bg-white px-5 py-3">
                <h2 className="text-lg font-bold text-[#c61b23]">أهم الأخبار</h2>
                <Link
                  href="/important"
                  className="text-sm font-bold text-black transition-colors hover:text-[#c61b23]"
                >
                  المزيد ←
                </Link>
              </div>

              <div className="bg-white">
                {/* Top Section - Hero Image (First Featured Article) */}
                {data.important.slice(0, 1).map((article) => {
                  if (!article.cover_image_path) return null

                  return (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group relative block overflow-hidden"
                    >
                      {/* Hero Image */}
                      <div className="relative h-[300px] w-full sm:h-[400px] lg:h-[550px]">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          priority
                        />

                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      </div>

                      {/* Text Overlay at Bottom Right */}
                      <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-6 lg:p-10">
                        {/* Category Badge */}
                        {article.section && (
                          <div className="mb-2 sm:mb-3">
                            <span className="inline-block rounded bg-[#c61b23] px-2 py-0.5 text-xs font-bold text-white sm:px-3 sm:py-1">
                              {article.section.name_ar}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="mb-2 text-xl leading-tight font-bold text-white transition-colors group-hover:text-[#c61b23] sm:mb-3 sm:text-2xl lg:text-4xl xl:text-5xl">
                          {article.title_ar}
                        </h2>

                        {/* Date */}
                        <p className="text-sm font-medium text-white/90 lg:text-base">
                          {article.published_at &&
                            toLatinNumbers(
                              new Date(article.published_at).toLocaleDateString('ar-EG', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            )}
                        </p>
                      </div>
                    </Link>
                  )
                })}

                {/* Bottom Section - Two Side-by-Side Images (Next Two Featured Articles) */}
                <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
                  {data.important.slice(1, 3).map((article) => {
                    if (!article.cover_image_path) return null

                    return (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group relative block cursor-pointer overflow-hidden border-t border-l border-gray-200 first:border-l-0 sm:first:border-l"
                      >
                        {/* Image */}
                        <div className="relative h-64 w-full lg:h-72">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        </div>

                        {/* Text Overlay */}
                        <div className="absolute right-0 bottom-0 left-0 p-5 lg:p-6">
                          {/* Category Badge */}
                          {article.section && (
                            <div className="mb-2">
                              <span className="inline-block rounded bg-[#c61b23] px-2 py-0.5 text-xs font-bold text-white">
                                {article.section.name_ar}
                              </span>
                            </div>
                          )}

                          {/* Title */}
                          <h3 className="line-clamp-3 text-lg leading-snug font-bold text-white transition-colors group-hover:text-gray-100 lg:text-xl">
                            {article.title_ar}
                          </h3>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TOP GRID: RADAR & INVESTIGATION ==================== */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* ========== RADAR SECTION - PREMIUM MAGAZINE ========== */}
            {data.sections.radar.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm" dir="rtl">
                {/* Glass-Style Header */}
                <div className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">
                      رادار
                    </h2>
                    <Link
                      href="/section/radar"
                      className="flex min-h-[44px] items-center gap-1.5 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
                    >
                      <span>المزيد</span>
                      <span>←</span>
                    </Link>
                  </div>
                  {/* Gradient Line Accent */}
                  <div className="mt-3 h-0.5 w-full bg-gradient-to-l from-[#c61b23] to-transparent"></div>
                </div>

                {/* Premium Grid: 1.6fr / 1fr */}
                <div className="grid grid-cols-1 items-start gap-4 p-4 sm:gap-6 sm:p-6 lg:grid-cols-[1.6fr_1fr]">
                  {/* Left Column - Dual-Hero with Modern Gradients */}
                  <div className="flex flex-col gap-6">
                    {/* Hero Card 1 */}
                    {data.sections.radar[0] && (
                      <Link
                        href={`/article/${data.sections.radar[0].slug}`}
                        className="group relative aspect-video overflow-hidden rounded-[2rem] bg-gray-800"
                      >
                        {data.sections.radar[0].cover_image_path && (
                          <Image
                            src={getStorageUrl(data.sections.radar[0].cover_image_path)}
                            alt={data.sections.radar[0].title_ar}
                            fill
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        {/* Modern Smooth Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-50% to-transparent"></div>

                        {/* Content Box */}
                        <div className="absolute right-0 bottom-0 left-0 overflow-hidden p-6">
                          <h3 className="mb-2 line-clamp-2 text-2xl leading-tight font-bold break-words text-white drop-shadow-lg">
                            {data.sections.radar[0].title_ar}
                          </h3>
                          {data.sections.radar[0].excerpt_ar && (
                            <p className="line-clamp-2 text-sm leading-relaxed break-words text-white/90">
                              {data.sections.radar[0].excerpt_ar}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}

                    {/* Hero Card 2 */}
                    {data.sections.radar[1] && (
                      <Link
                        href={`/article/${data.sections.radar[1].slug}`}
                        className="group relative aspect-video overflow-hidden rounded-[2rem] bg-gray-800"
                      >
                        {data.sections.radar[1].cover_image_path && (
                          <Image
                            src={getStorageUrl(data.sections.radar[1].cover_image_path)}
                            alt={data.sections.radar[1].title_ar}
                            fill
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        {/* Modern Smooth Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-50% to-transparent"></div>

                        {/* Content Box */}
                        <div className="absolute right-0 bottom-0 left-0 overflow-hidden p-6">
                          <h3 className="mb-2 line-clamp-2 text-2xl leading-tight font-bold break-words text-white drop-shadow-lg">
                            {data.sections.radar[1].title_ar}
                          </h3>
                          {data.sections.radar[1].excerpt_ar && (
                            <p className="line-clamp-2 text-sm leading-relaxed break-words text-white/90">
                              {data.sections.radar[1].excerpt_ar}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Right Column - Desktop: Clean Feed | Mobile: Hero Cards */}
                  {/* Desktop View (lg+) */}
                  <div className="hidden flex-col space-y-6 overflow-hidden lg:flex">
                    {data.sections.radar.slice(2, 6).map((article) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group flex flex-row-reverse items-start gap-4 overflow-hidden"
                      >
                        {/* Thumbnail - 100px square */}
                        {article.cover_image_path && (
                          <div className="relative h-[100px] w-[100px] flex-shrink-0 overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
                            <Image
                              src={getStorageUrl(article.cover_image_path)}
                              alt={article.title_ar}
                              fill
                              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        {/* Text Area */}
                        <div className="min-w-0 flex-1 overflow-hidden text-right">
                          <h4 className="mb-2 line-clamp-2 leading-[1.6] font-bold break-words text-gray-900 transition-colors group-hover:text-[#c61b23]">
                            {article.title_ar}
                          </h4>
                          {article.excerpt_ar && (
                            <p className="line-clamp-2 text-sm break-words text-gray-500">
                              {article.excerpt_ar}
                            </p>
                          )}
                          {/* Red Bullet + Date */}
                          {article.published_at && (
                            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-gray-400">
                              <span className="truncate">
                                {toLatinNumbers(
                                  new Date(article.published_at).toLocaleDateString('ar-LB')
                                )}
                              </span>
                              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#c61b23]"></span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Mobile View (< lg) - Hero Cards */}
                  <div className="flex flex-col gap-6 lg:hidden">
                    {data.sections.radar.slice(2, 6).map((article) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group relative h-[240px] w-full cursor-pointer overflow-hidden rounded-2xl bg-gray-800"
                      >
                        {article.cover_image_path && (
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Content at bottom-right */}
                        <div className="absolute right-0 bottom-0 left-0 p-4 text-right">
                          <h4 className="mb-2 line-clamp-3 text-base leading-tight font-bold text-white">
                            {article.title_ar}
                          </h4>
                          {article.published_at && (
                            <time className="text-xs text-white/70">
                              {toLatinNumbers(
                                new Date(article.published_at).toLocaleDateString('ar-LB')
                              )}
                            </time>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========== INVESTIGATION SECTION - PREMIUM MAGAZINE ========== */}
            {data.sections.investigation.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm" dir="rtl">
                {/* Glass-Style Header */}
                <div className="px-4 py-3 sm:px-6 sm:py-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">
                      بحث وتحرّي
                    </h2>
                    <Link
                      href="/section/investigation"
                      className="flex items-center gap-1.5 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
                    >
                      <span>المزيد</span>
                      <span>←</span>
                    </Link>
                  </div>
                  {/* Gradient Line Accent */}
                  <div className="mt-3 h-0.5 w-full bg-gradient-to-l from-[#c61b23] to-transparent"></div>
                </div>

                {/* Premium Grid: 1.6fr / 1fr */}
                <div className="grid grid-cols-1 items-start gap-6 p-6 lg:grid-cols-[1.6fr_1fr]">
                  {/* Left Column - Dual-Hero with Modern Gradients */}
                  <div className="flex flex-col gap-6">
                    {/* Hero Card 1 */}
                    {data.sections.investigation[0] && (
                      <Link
                        href={`/article/${data.sections.investigation[0].slug}`}
                        className="group relative aspect-video overflow-hidden rounded-[2rem] bg-gray-800"
                      >
                        {data.sections.investigation[0].cover_image_path && (
                          <Image
                            src={getStorageUrl(data.sections.investigation[0].cover_image_path)}
                            alt={data.sections.investigation[0].title_ar}
                            fill
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        {/* Modern Smooth Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-50% to-transparent"></div>

                        {/* Content Box */}
                        <div className="absolute right-0 bottom-0 left-0 overflow-hidden p-6">
                          <h3 className="mb-2 line-clamp-2 text-2xl leading-tight font-bold break-words text-white drop-shadow-lg">
                            {data.sections.investigation[0].title_ar}
                          </h3>
                          {data.sections.investigation[0].excerpt_ar && (
                            <p className="line-clamp-2 text-sm leading-relaxed break-words text-white/90">
                              {data.sections.investigation[0].excerpt_ar}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}

                    {/* Hero Card 2 */}
                    {data.sections.investigation[1] && (
                      <Link
                        href={`/article/${data.sections.investigation[1].slug}`}
                        className="group relative aspect-video overflow-hidden rounded-[2rem] bg-gray-800"
                      >
                        {data.sections.investigation[1].cover_image_path && (
                          <Image
                            src={getStorageUrl(data.sections.investigation[1].cover_image_path)}
                            alt={data.sections.investigation[1].title_ar}
                            fill
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        {/* Modern Smooth Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 via-50% to-transparent"></div>

                        {/* Content Box */}
                        <div className="absolute right-0 bottom-0 left-0 overflow-hidden p-6">
                          <h3 className="mb-2 line-clamp-2 text-2xl leading-tight font-bold break-words text-white drop-shadow-lg">
                            {data.sections.investigation[1].title_ar}
                          </h3>
                          {data.sections.investigation[1].excerpt_ar && (
                            <p className="line-clamp-2 text-sm leading-relaxed break-words text-white/90">
                              {data.sections.investigation[1].excerpt_ar}
                            </p>
                          )}
                        </div>
                      </Link>
                    )}
                  </div>

                  {/* Right Column - Desktop: Clean Feed | Mobile: Hero Cards */}
                  {/* Desktop View (lg+) */}
                  <div className="hidden flex-col space-y-6 overflow-hidden lg:flex">
                    {data.sections.investigation.slice(2, 6).map((article) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group flex flex-row-reverse items-start gap-4 overflow-hidden"
                      >
                        {/* Thumbnail - 100px square */}
                        {article.cover_image_path && (
                          <div className="relative h-[100px] w-[100px] flex-shrink-0 overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
                            <Image
                              src={getStorageUrl(article.cover_image_path)}
                              alt={article.title_ar}
                              fill
                              className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                        )}
                        {/* Text Area */}
                        <div className="min-w-0 flex-1 overflow-hidden text-right">
                          <h4 className="mb-2 line-clamp-2 leading-[1.6] font-bold break-words text-gray-900 transition-colors group-hover:text-[#c61b23]">
                            {article.title_ar}
                          </h4>
                          {article.excerpt_ar && (
                            <p className="line-clamp-2 text-sm break-words text-gray-500">
                              {article.excerpt_ar}
                            </p>
                          )}
                          {/* Red Bullet + Date */}
                          {article.published_at && (
                            <div className="mt-2 flex items-center justify-end gap-1.5 text-xs text-gray-400">
                              <span className="truncate">
                                {toLatinNumbers(
                                  new Date(article.published_at).toLocaleDateString('ar-LB')
                                )}
                              </span>
                              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-[#c61b23]"></span>
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Mobile View (< lg) - Hero Cards */}
                  <div className="flex flex-col gap-6 lg:hidden">
                    {data.sections.investigation.slice(2, 6).map((article) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className="group relative h-[240px] w-full cursor-pointer overflow-hidden rounded-2xl bg-gray-800"
                      >
                        {article.cover_image_path && (
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          />
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Content at bottom-right */}
                        <div className="absolute right-0 bottom-0 left-0 p-4 text-right">
                          <h4 className="mb-2 line-clamp-3 text-base leading-tight font-bold text-white">
                            {article.title_ar}
                          </h4>
                          {article.published_at && (
                            <time className="text-xs text-white/70">
                              {toLatinNumbers(
                                new Date(article.published_at).toLocaleDateString('ar-LB')
                              )}
                            </time>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== BOTTOM SECTION: KHAS (خاص) - BENTO GRID ==================== */}
      {data.sections.special && data.sections.special.length > 0 && (
        <section className="bg-[#f4f4f9] py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between pb-3 sm:pb-4">
                <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">خاص</h2>
                <Link
                  href="/section/special"
                  className="flex min-h-[44px] items-center gap-2 text-sm font-bold text-black transition-colors hover:text-[#c61b23]"
                >
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>
              <div className="h-px w-full bg-[#c61b23]" />
            </div>

            {/* Bento Grid: 3 columns on desktop - Hero RIGHT (2 cols x 2 rows) + 3 cards LEFT */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6">
              {/* 3 Smaller Cards - LEFT side */}
              <div className="grid grid-cols-1 gap-6 lg:order-1 lg:col-span-1">
                {data.sections.special.slice(1, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group relative cursor-pointer"
                  >
                    <div className="relative h-[180px] overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl lg:h-[188px]">
                      {article.cover_image_path ? (
                        <>
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="h-16 w-16 text-white/20"
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
                        </div>
                      )}
                      <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-6">
                        <h3 className="mb-2 line-clamp-3 text-right text-base leading-tight font-bold text-white sm:text-lg">
                          {article.title_ar}
                        </h3>
                        {article.published_at && (
                          <time className="block text-right text-xs text-white/70 sm:text-sm">
                            {toLatinNumbers(
                              new Date(article.published_at).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            )}
                          </time>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Hero Card - RIGHT side spanning 2 columns and 2 rows */}
              {data.sections.special[0] && (
                <Link
                  href={`/article/${data.sections.special[0].slug}`}
                  className="group cursor-pointer lg:order-2 lg:col-span-2 lg:row-span-2"
                >
                  <div className="relative h-[180px] overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl lg:h-full lg:min-h-[387px]">
                    {data.sections.special[0].cover_image_path ? (
                      <>
                        <Image
                          src={getStorageUrl(data.sections.special[0].cover_image_path)}
                          alt={data.sections.special[0].title_ar}
                          fill
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-50% to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="h-24 w-24 text-white/20 lg:h-32 lg:w-32"
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
                      </div>
                    )}
                    <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8 lg:p-10">
                      <h3 className="mb-3 text-right text-2xl leading-tight font-bold text-white sm:text-3xl lg:mb-4 lg:text-4xl">
                        {data.sections.special[0].title_ar}
                      </h3>
                      {data.sections.special[0].excerpt_ar && (
                        <p className="mb-3 line-clamp-2 text-right text-sm leading-relaxed text-white/90 sm:text-base lg:mb-4 lg:text-lg">
                          {data.sections.special[0].excerpt_ar}
                        </p>
                      )}
                      {data.sections.special[0].published_at && (
                        <time className="block text-right text-sm text-white/70 lg:text-base">
                          {toLatinNumbers(
                            new Date(data.sections.special[0].published_at).toLocaleDateString(
                              'ar-EG',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )
                          )}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== MAHALIYA (المحلية) SECTION - BENTO GRID ==================== */}
      {data.sections.local.length > 0 && (
        <section className="bg-[#fafafa] py-12" dir="rtl">
          <div className="mx-auto max-w-7xl overflow-hidden px-4">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between pb-3 sm:pb-4">
                <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">
                  المحلية
                </h2>
                <Link
                  href="/section/local"
                  className="flex items-center gap-2 text-sm font-bold text-black transition-colors hover:text-[#c61b23]"
                >
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>
              <div className="h-px w-full bg-[#c61b23]" />
            </div>

            {/* Bento Grid: 3 columns on desktop - Hero RIGHT (2 cols x 2 rows) + 3 cards LEFT */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6">
              {/* 3 Smaller Cards - LEFT side */}
              <div className="grid grid-cols-1 gap-6 lg:order-1 lg:col-span-1">
                {data.sections.local.slice(1, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group relative cursor-pointer"
                  >
                    <div className="relative h-[180px] overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl lg:h-[188px]">
                      {article.cover_image_path ? (
                        <>
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="h-16 w-16 text-white/20"
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
                        </div>
                      )}
                      <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-6">
                        <h3 className="mb-2 line-clamp-3 text-right text-base leading-tight font-bold text-white sm:text-lg">
                          {article.title_ar}
                        </h3>
                        {article.published_at && (
                          <time className="block text-right text-xs text-white/70 sm:text-sm">
                            {toLatinNumbers(
                              new Date(article.published_at).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            )}
                          </time>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Hero Card - RIGHT side spanning 2 columns and 2 rows */}
              {data.sections.local[0] && (
                <Link
                  href={`/article/${data.sections.local[0].slug}`}
                  className="group cursor-pointer lg:order-2 lg:col-span-2 lg:row-span-2"
                >
                  <div className="relative h-[180px] overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl lg:h-full lg:min-h-[387px]">
                    {data.sections.local[0].cover_image_path ? (
                      <>
                        <Image
                          src={getStorageUrl(data.sections.local[0].cover_image_path)}
                          alt={data.sections.local[0].title_ar}
                          fill
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-50% to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="h-24 w-24 text-white/20 lg:h-32 lg:w-32"
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
                      </div>
                    )}
                    <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8 lg:p-10">
                      <h3 className="mb-3 text-right text-2xl leading-tight font-bold text-white sm:text-3xl lg:mb-4 lg:text-4xl">
                        {data.sections.local[0].title_ar}
                      </h3>
                      {data.sections.local[0].excerpt_ar && (
                        <p className="mb-3 line-clamp-2 text-right text-sm leading-relaxed text-white/90 sm:text-base lg:mb-4 lg:text-lg">
                          {data.sections.local[0].excerpt_ar}
                        </p>
                      )}
                      {data.sections.local[0].published_at && (
                        <time className="block text-right text-sm text-white/70 lg:text-base">
                          {toLatinNumbers(
                            new Date(data.sections.local[0].published_at).toLocaleDateString(
                              'ar-EG',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )
                          )}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ==================== MOST READ (الأكثر قراءة) SECTION ==================== */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">
              الأكثر قراءة
            </h2>
          </div>

          {/* Asymmetric Grid: 40% Right (#1 Hero) + 60% Left (List 2-5) */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[40%_60%] lg:gap-8">
            {/* Right Side - #1 Ranked Hero (Half Size) */}
            {data.recent[0] && (
              <Link href={`/article/${data.recent[0].slug}`} className="group relative">
                <div className="relative overflow-hidden rounded-3xl shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  {/* Hero Image - Reduced to Half Size */}
                  {data.recent[0].cover_image_path ? (
                    <div className="relative aspect-square overflow-hidden">
                      <Image
                        src={getStorageUrl(data.recent[0].cover_image_path)}
                        alt={data.recent[0].title_ar}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    </div>
                  ) : (
                    /* Fallback when no image */
                    <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg
                          className="h-16 w-16 text-white/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                          />
                        </svg>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    </div>
                  )}

                  {/* Ranking Number - Large, Semi-Transparent */}
                  <div className="absolute top-4 left-4 text-6xl font-bold text-white/20 lg:text-7xl">
                    01
                  </div>

                  {/* Content at Bottom */}
                  <div className="absolute right-0 bottom-0 left-0 p-4 lg:p-6">
                    {/* Category Tag */}
                    {data.recent[0].section && (
                      <div className="mb-2">
                        <span className="inline-block rounded-full bg-[#c61b23] px-3 py-1 text-xs font-bold text-white">
                          {data.recent[0].section.name_ar}
                        </span>
                      </div>
                    )}

                    {/* Headline */}
                    <h3 className="mb-2 text-lg leading-tight font-bold text-white lg:text-xl">
                      {data.recent[0].title_ar}
                    </h3>

                    {/* Excerpt */}
                    {data.recent[0].excerpt_ar && (
                      <p className="line-clamp-2 text-xs text-white/80 lg:text-sm">
                        {data.recent[0].excerpt_ar}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* Left Side - Ranked List (02-05) - Only Top 5 */}
            <div className="space-y-3 sm:space-y-4">
              {data.recent.slice(1, 5).map((article, index) => {
                const rankNumber = (index + 2).toString().padStart(2, '0')
                return (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group flex gap-4 rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Thumbnail with Rank Badge */}
                    {article.cover_image_path ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        {/* Glassmorphism Rank Badge */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                            <span className="text-lg font-bold text-[#c61b23] transition-colors group-hover:text-[#9a1519]">
                              {rankNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Fallback thumbnail */
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-gray-300 to-gray-400">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-sm">
                            <span className="text-lg font-bold text-[#c61b23] transition-colors group-hover:text-[#9a1519]">
                              {rankNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center space-y-1">
                      {/* Category */}
                      {article.section && (
                        <span className="mb-1 text-xs font-semibold text-gray-500">
                          {article.section.name_ar}
                        </span>
                      )}
                      {/* Headline */}
                      <h4 className="line-clamp-2 text-sm leading-snug font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                        {article.title_ar}
                      </h4>
                      {/* Excerpt */}
                      {article.excerpt_ar && (
                        <p className="line-clamp-1 text-xs leading-relaxed text-gray-600">
                          {article.excerpt_ar}
                        </p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Old Local Section - Grid Cards Design */}
      {data.sections.local.length > 0 && false && (
        <section className="bg-[#f8f8f8] py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="section-heading text-3xl font-bold text-black">المحلية</h2>
              <Link href="/section/local" className="text-sm font-bold text-black">
                المزيد ←
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {data.sections.local.map((article, index) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className={`group overflow-hidden rounded-2xl bg-white shadow-lg transition-all ${index === 0 ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : ''}`}
                >
                  {article.cover_image_path && (
                    <div
                      className={`relative overflow-hidden ${index === 0 ? 'h-64 lg:h-80' : 'h-48'}`}
                    >
                      <Image
                        src={getStorageUrl(article.cover_image_path)}
                        alt={article.title_ar}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute right-0 bottom-0 left-0 p-5">
                        <h3
                          className={`leading-tight font-bold text-white ${index === 0 ? 'text-xl lg:text-2xl' : 'line-clamp-2 text-lg'}`}
                        >
                          {article.title_ar}
                        </h3>
                      </div>
                    </div>
                  )}
                  <div className={index === 0 ? 'p-6' : 'p-4'}>
                    {article.published_at && (
                      <time className="text-xs text-gray-500">
                        {new Date(article.published_at).toLocaleDateString('ar-EG', {
                          day: '2-digit',
                          month: 'long',
                        })}
                      </time>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Security & Justice - Modern Bento Grid */}
      {data.sections.security.length > 0 && (
        <section className="bg-white py-12" dir="rtl">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between pb-3 sm:pb-4">
                <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">
                  أمن وقضاء
                </h2>
                <Link
                  href="/section/security"
                  className="flex items-center gap-2 text-sm font-bold text-black transition-colors hover:text-[#c61b23]"
                >
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>
              <div className="h-px w-full bg-[#c61b23]" />
            </div>

            {/* Bento Grid Layout - RTL: Hero on Right, 4 cards on Left */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {/* Left Side: 4 Smaller Cards in 2x2 Grid */}
              <div className="grid grid-cols-1 gap-6 md:col-span-2 md:grid-cols-2 lg:col-span-1">
                {data.sections.security.slice(1, 5).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl"
                  >
                    {article.cover_image_path && (
                      <>
                        {/* Full-bleed background image */}
                        <div className="relative h-[240px]">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Text overlay - bottom-right */}
                        <div className="absolute right-3 bottom-3 left-3 text-right">
                          <h4 className="mb-1 line-clamp-3 text-sm leading-tight font-bold text-white drop-shadow-lg">
                            {article.title_ar}
                          </h4>
                          {article.published_at && (
                            <time className="block text-xs text-white/70 drop-shadow-md">
                              {toLatinNumbers(
                                new Date(article.published_at).toLocaleDateString('ar-EG', {
                                  day: 'numeric',
                                  month: 'long',
                                })
                              )}
                            </time>
                          )}
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </div>

              {/* Right Side: Hero Card - Spans 2 columns x 2 rows */}
              {data.sections.security[0] && (
                <Link
                  href={`/article/${data.sections.security[0].slug}`}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl md:col-span-2 lg:col-span-2"
                >
                  {data.sections.security[0].cover_image_path && (
                    <>
                      {/* Full-bleed background image */}
                      <div className="relative h-[240px] md:h-[500px] lg:h-[500px]">
                        <Image
                          src={getStorageUrl(data.sections.security[0].cover_image_path)}
                          alt={data.sections.security[0].title_ar}
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      {/* Text overlay - bottom-right */}
                      <div className="absolute right-6 bottom-6 left-6 text-right">
                        <h3 className="mb-3 text-2xl leading-tight font-bold text-white drop-shadow-lg md:text-3xl lg:text-4xl">
                          {data.sections.security[0].title_ar}
                        </h3>
                        {data.sections.security[0].excerpt_ar && (
                          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/90 drop-shadow-md lg:text-base">
                            {data.sections.security[0].excerpt_ar}
                          </p>
                        )}
                        {data.sections.security[0].published_at && (
                          <time className="block text-sm text-white/70 drop-shadow-md">
                            {toLatinNumbers(
                              new Date(data.sections.security[0].published_at).toLocaleDateString(
                                'ar-EG',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )
                            )}
                          </time>
                        )}
                      </div>
                    </>
                  )}
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Regional & International (إقليمي ودولي) - BENTO GRID */}
      {data.sections.regional.length > 0 && (
        <section className="bg-[#f8f8f8] py-8 sm:py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between pb-3 sm:pb-4">
                <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">
                  إقليمي ودولي
                </h2>
                <Link
                  href="/section/regional"
                  className="flex min-h-[44px] items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
                >
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>
              <div className="h-px w-full bg-[#c61b23]" />
            </div>

            {/* Bento Grid: 3 columns on desktop - Hero RIGHT (2 cols x 2 rows) + 3 cards LEFT */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-6">
              {/* 3 Smaller Cards - LEFT side */}
              <div className="grid grid-cols-1 gap-6 lg:order-1 lg:col-span-1">
                {data.sections.regional.slice(1, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group relative cursor-pointer"
                  >
                    <div className="relative h-[180px] overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl lg:h-[188px]">
                      {article.cover_image_path ? (
                        <>
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="h-16 w-16 text-white/20"
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
                        </div>
                      )}
                      <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-6">
                        <h3 className="mb-2 line-clamp-3 text-right text-base leading-tight font-bold text-white sm:text-lg">
                          {article.title_ar}
                        </h3>
                        {article.published_at && (
                          <time className="block text-right text-xs text-white/70 sm:text-sm">
                            {toLatinNumbers(
                              new Date(article.published_at).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })
                            )}
                          </time>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Hero Card - RIGHT side spanning 2 columns and 2 rows */}
              {data.sections.regional[0] && (
                <Link
                  href={`/article/${data.sections.regional[0].slug}`}
                  className="group cursor-pointer lg:order-2 lg:col-span-2 lg:row-span-2"
                >
                  <div className="relative h-[180px] overflow-hidden rounded-2xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl lg:h-full lg:min-h-[387px]">
                    {data.sections.regional[0].cover_image_path ? (
                      <>
                        <Image
                          src={getStorageUrl(data.sections.regional[0].cover_image_path)}
                          alt={data.sections.regional[0].title_ar}
                          fill
                          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-50% to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="h-24 w-24 text-white/20 lg:h-32 lg:w-32"
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
                      </div>
                    )}
                    <div className="absolute right-0 bottom-0 left-0 p-6 sm:p-8 lg:p-10">
                      <h3 className="mb-3 text-right text-2xl leading-tight font-bold text-white sm:text-3xl lg:mb-4 lg:text-4xl">
                        {data.sections.regional[0].title_ar}
                      </h3>
                      {data.sections.regional[0].excerpt_ar && (
                        <p className="mb-3 line-clamp-2 text-right text-sm leading-relaxed text-white/90 sm:text-base lg:mb-4 lg:text-lg">
                          {data.sections.regional[0].excerpt_ar}
                        </p>
                      )}
                      {data.sections.regional[0].published_at && (
                        <time className="block text-right text-sm text-white/70 lg:text-base">
                          {toLatinNumbers(
                            new Date(data.sections.regional[0].published_at).toLocaleDateString(
                              'ar-EG',
                              {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              }
                            )
                          )}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Writers Carousel - Our Writers */}
      {data.writers && data.writers.length > 0 && (
        <section className="bg-white py-8 sm:py-10 lg:py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between border-b border-[#c61b23] pb-3 sm:mb-8 sm:pb-4">
              <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">كتابنا</h2>
              <Link
                href="/writers"
                className="flex min-h-[44px] items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
              >
                <span>جميع الكتاب</span>
                <span>←</span>
              </Link>
            </div>

            {/* Carousel Container */}
            <WritersCarousel
              writers={
                data.writers as {
                  id: string
                  display_name_ar: string | null
                  avatar_url: string | null
                }[]
              }
            />
          </div>
        </section>
      )}

      {/* Economy - Bento Grid Layout */}
      {data.sections.economy.length > 0 && (
        <section className="bg-[#f9f9f9] py-12" dir="rtl">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between pb-3 sm:pb-4">
                <h2 className="text-xl font-bold text-[#c61b23] sm:text-2xl lg:text-3xl">اقتصاد</h2>
                <Link
                  href="/section/economy"
                  className="flex items-center gap-2 text-sm font-bold text-black transition-colors hover:text-[#c61b23]"
                >
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>
              <div className="h-px w-full bg-[#c61b23]" />
            </div>

            {/* Bento Grid Layout - Hero on Left, 4 cards on Right */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
              {/* Left Side: Hero Card - Spans 2 columns */}
              {data.sections.economy[0] && (
                <Link
                  href={`/article/${data.sections.economy[0].slug}`}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl md:col-span-2 lg:order-1 lg:col-span-2"
                >
                  {data.sections.economy[0].cover_image_path && (
                    <>
                      {/* Full-bleed background image */}
                      <div className="relative h-[240px] md:h-[500px] lg:h-[500px]">
                        <Image
                          src={getStorageUrl(data.sections.economy[0].cover_image_path)}
                          alt={data.sections.economy[0].title_ar}
                          fill
                          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                      {/* Text overlay - bottom-right */}
                      <div className="absolute right-6 bottom-6 left-6 text-right">
                        <h3 className="mb-3 text-2xl leading-tight font-bold text-white drop-shadow-lg md:text-3xl lg:text-4xl">
                          {data.sections.economy[0].title_ar}
                        </h3>
                        {data.sections.economy[0].excerpt_ar && (
                          <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-white/90 drop-shadow-md lg:text-base">
                            {data.sections.economy[0].excerpt_ar}
                          </p>
                        )}
                        {data.sections.economy[0].published_at && (
                          <time className="block text-sm text-white/70 drop-shadow-md">
                            {toLatinNumbers(
                              new Date(data.sections.economy[0].published_at).toLocaleDateString(
                                'ar-EG',
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                }
                              )
                            )}
                          </time>
                        )}
                      </div>
                    </>
                  )}
                </Link>
              )}

              {/* Right Side: 4 Smaller Cards in 2x2 Grid */}
              <div className="grid grid-cols-1 gap-6 md:col-span-2 md:grid-cols-2 lg:order-2 lg:col-span-1">
                {data.sections.economy.slice(1, 5).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl"
                  >
                    {article.cover_image_path && (
                      <>
                        {/* Full-bleed background image */}
                        <div className="relative h-[240px]">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>

                        {/* Dark gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

                        {/* Text overlay - bottom-right */}
                        <div className="absolute right-3 bottom-3 left-3 text-right">
                          <h4 className="mb-1 line-clamp-3 text-sm leading-tight font-bold text-white drop-shadow-lg">
                            {article.title_ar}
                          </h4>
                          {article.published_at && (
                            <time className="block text-xs text-white/70 drop-shadow-md">
                              {toLatinNumbers(
                                new Date(article.published_at).toLocaleDateString('ar-EG', {
                                  day: 'numeric',
                                  month: 'long',
                                })
                              )}
                            </time>
                          )}
                        </div>
                      </>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
