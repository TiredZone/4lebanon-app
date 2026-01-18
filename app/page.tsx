import { createClient } from '@/lib/supabase/server'
import { getStorageUrl } from '@/lib/utils'
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
        <div className="mx-auto max-w-7xl">
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
                      <div className="relative h-[450px] w-full lg:h-[550px]">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          priority
                        />

                        {/* Gradient Overlay for Text Readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                      </div>

                      {/* Text Overlay at Bottom Right */}
                      <div className="absolute right-0 bottom-0 left-0 p-8 lg:p-10">
                        {/* Category Badge */}
                        {article.section && (
                          <div className="mb-3">
                            <span className="inline-block rounded bg-[#c61b23] px-3 py-1 text-xs font-bold text-white">
                              {article.section.name_ar}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="mb-3 text-3xl leading-tight font-bold text-white transition-colors group-hover:text-gray-100 lg:text-4xl xl:text-5xl">
                          {article.title_ar}
                        </h2>

                        {/* Date */}
                        <p className="text-sm font-medium text-white/90 lg:text-base">
                          {article.published_at &&
                            new Date(article.published_at).toLocaleDateString('ar-EG', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
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
                        className="group relative block overflow-hidden border-t border-l border-gray-200 first:border-l-0 sm:first:border-l"
                      >
                        {/* Image */}
                        <div className="relative h-64 w-full lg:h-72">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
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
            {/* ========== RADAR SECTION ========== */}
            {data.sections.radar.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#c61b23] px-6 py-4">
                  <Link
                    href="/section/radar"
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
                  >
                    <span>المزيد</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  <h2 className="text-2xl font-bold text-[#c61b23]">رادار</h2>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                  {/* Right Side - Featured Card */}
                  {data.sections.radar[0] && (
                    <Link
                      href={`/article/${data.sections.radar[0].slug}`}
                      className="group space-y-3"
                    >
                      {data.sections.radar[0].cover_image_path && (
                        <div className="relative aspect-video overflow-hidden rounded-lg">
                          <Image
                            src={getStorageUrl(data.sections.radar[0].cover_image_path)}
                            alt={data.sections.radar[0].title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h3 className="line-clamp-2 text-base leading-snug font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                        {data.sections.radar[0].title_ar}
                      </h3>
                      {data.sections.radar[0].published_at && (
                        <time className="block text-xs text-gray-500">
                          {new Date(data.sections.radar[0].published_at).toLocaleDateString(
                            'ar-EG',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </time>
                      )}
                    </Link>
                  )}

                  {/* Left Side - List of Headlines */}
                  <div className="space-y-0">
                    {data.sections.radar.slice(1, 4).map((article, index) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className={`group block py-4 transition-colors hover:bg-gray-50 ${
                          index !== 0 ? 'border-t border-gray-100' : ''
                        }`}
                      >
                        <h4 className="mb-1.5 line-clamp-2 text-sm leading-snug font-semibold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                          {article.title_ar}
                        </h4>
                        {article.published_at && (
                          <time className="text-xs text-gray-500">
                            {new Date(article.published_at).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </time>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========== INVESTIGATION SECTION (بحث وتحرّي) ========== */}
            {data.sections.investigation.length > 0 && (
              <div className="rounded-xl bg-white shadow-sm">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#c61b23] px-6 py-4">
                  <Link
                    href="/section/investigation"
                    className="flex items-center gap-1.5 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
                  >
                    <span>المزيد</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                  <h2 className="text-2xl font-bold text-[#c61b23]">بحث وتحرّي</h2>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                  {/* Right Side - Featured Card */}
                  {data.sections.investigation[0] && (
                    <Link
                      href={`/article/${data.sections.investigation[0].slug}`}
                      className="group space-y-3"
                    >
                      {data.sections.investigation[0].cover_image_path && (
                        <div className="relative aspect-video overflow-hidden rounded-lg">
                          <Image
                            src={getStorageUrl(data.sections.investigation[0].cover_image_path)}
                            alt={data.sections.investigation[0].title_ar}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <h3 className="line-clamp-2 text-base leading-snug font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                        {data.sections.investigation[0].title_ar}
                      </h3>
                      {data.sections.investigation[0].published_at && (
                        <time className="block text-xs text-gray-500">
                          {new Date(data.sections.investigation[0].published_at).toLocaleDateString(
                            'ar-EG',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </time>
                      )}
                    </Link>
                  )}

                  {/* Left Side - List of Headlines */}
                  <div className="space-y-0">
                    {data.sections.investigation.slice(1, 4).map((article, index) => (
                      <Link
                        key={article.id}
                        href={`/article/${article.slug}`}
                        className={`group block py-4 transition-colors hover:bg-gray-50 ${
                          index !== 0 ? 'border-t border-gray-100' : ''
                        }`}
                      >
                        <h4 className="mb-1.5 line-clamp-2 text-sm leading-snug font-semibold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                          {article.title_ar}
                        </h4>
                        {article.published_at && (
                          <time className="text-xs text-gray-500">
                            {new Date(article.published_at).toLocaleDateString('ar-EG', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </time>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ==================== BOTTOM SECTION: KHAS (خاص) ==================== */}
      {data.sections.special && data.sections.special.length > 0 && (
        <section className="bg-[#f4f4f9] py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between border-b border-[#c61b23] pb-4">
              <Link
                href="/section/special"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
              >
                <span>المزيد</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <h2 className="text-3xl font-bold text-[#c61b23]">خاص</h2>
            </div>

            {/* Grid Layout: 60% Right (Hero) + 40% Left (List) */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[60%_40%]">
              {/* Right Side - The Hero */}
              {data.sections.special[0] && (
                <Link href={`/article/${data.sections.special[0].slug}`} className="group">
                  {/* Large Image */}
                  {data.sections.special[0].cover_image_path && (
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-xl shadow-lg transition-shadow duration-300 group-hover:shadow-2xl">
                      <Image
                        src={getStorageUrl(data.sections.special[0].cover_image_path)}
                        alt={data.sections.special[0].title_ar}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Headline and Date Below Image */}
                  <div className="space-y-2 text-right">
                    <h3 className="text-2xl leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                      {data.sections.special[0].title_ar}
                    </h3>
                    {data.sections.special[0].published_at && (
                      <time className="block text-sm text-gray-500">
                        {new Date(data.sections.special[0].published_at).toLocaleDateString(
                          'ar-EG',
                          {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          }
                        )}
                      </time>
                    )}
                  </div>
                </Link>
              )}

              {/* Left Side - The List */}
              <div className="space-y-6">
                {data.sections.special.slice(1, 5).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group flex gap-4 rounded-lg bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* Thumbnail on Left (RTL: appears on right visually) */}
                    {article.cover_image_path && (
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    )}

                    {/* Text on Right (RTL: appears on left visually) */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center space-y-1.5">
                      <h4 className="line-clamp-2 text-sm leading-snug font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                        {article.title_ar}
                      </h4>
                      {article.published_at && (
                        <time className="text-xs text-gray-500">
                          {new Date(article.published_at).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </time>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== MAHALIYA (المحلية) SECTION ==================== */}
      {data.sections.local.length > 0 && (
        <section className="bg-[#fafafa] py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between border-b border-[#c61b23] pb-4">
              <Link
                href="/section/local"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
              >
                <span>المزيد</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <h2 className="text-3xl font-bold text-[#c61b23]">المحلية</h2>
            </div>

            {/* Hero Asymmetric Grid: 60% Right (Featured) + 40% Left (Secondary) */}
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Right Side - Main Hero Feature */}
              {data.sections.local[0] && (
                <Link
                  href={`/article/${data.sections.local[0].slug}`}
                  className="group lg:col-span-3"
                >
                  {/* Hero Image */}
                  {data.sections.local[0].cover_image_path && (
                    <div className="relative mb-4 aspect-video overflow-hidden rounded-2xl border border-gray-100 bg-white">
                      <Image
                        src={getStorageUrl(data.sections.local[0].cover_image_path)}
                        alt={data.sections.local[0].title_ar}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Headline, Excerpt, Date */}
                  <div className="space-y-2">
                    <h3 className="text-2xl leading-tight font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                      {data.sections.local[0].title_ar}
                    </h3>
                    {data.sections.local[0].excerpt_ar && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-gray-600">
                        {data.sections.local[0].excerpt_ar}
                      </p>
                    )}
                    {data.sections.local[0].published_at && (
                      <time className="block text-xs text-gray-500">
                        {new Date(data.sections.local[0].published_at).toLocaleDateString('ar-EG', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </time>
                    )}
                  </div>
                </Link>
              )}

              {/* Left Side - Three Secondary Cards Stacked */}
              <div className="space-y-4 lg:col-span-2">
                {data.sections.local.slice(1, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group flex gap-4 rounded-xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    {/* Thumbnail on Right (RTL) */}
                    {article.cover_image_path && (
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                    )}

                    {/* Text on Left (RTL) */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center space-y-1.5">
                      <h4 className="line-clamp-2 text-sm leading-snug font-bold text-gray-900 transition-colors group-hover:text-[#c61b23]">
                        {article.title_ar}
                      </h4>
                      {article.excerpt_ar && (
                        <p className="line-clamp-1 text-xs leading-relaxed text-gray-600">
                          {article.excerpt_ar}
                        </p>
                      )}
                      {article.published_at && (
                        <time className="text-xs text-gray-500">
                          {new Date(article.published_at).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </time>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick News List - Text Only (3-Column Grid) */}
            <div className="rounded-2xl border border-[#eeeeee] bg-[#f9f9f9] p-6">
              <h3 className="mb-4 text-lg font-bold text-[#c61b23]">أخبار سريعة</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {data.sections.local.slice(4, 7).map((article, index) => (
                  <div key={article.id}>
                    {index > 0 && <div className="mb-4 border-t border-gray-300 md:hidden" />}
                    <Link href={`/article/${article.slug}`} className="group block">
                      <h4 className="mb-2 line-clamp-2 text-sm leading-[1.6] font-bold text-black transition-colors group-hover:text-[#c61b23]">
                        {article.title_ar}
                      </h4>
                      {article.excerpt_ar && (
                        <p className="mb-2 line-clamp-2 text-xs leading-[1.6] text-gray-600">
                          {article.excerpt_ar}
                        </p>
                      )}
                      {article.published_at && (
                        <time className="text-xs text-gray-500">
                          {new Date(article.published_at).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </time>
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== MOST READ (الأكثر قراءة) SECTION ==================== */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#c61b23]">الأكثر قراءة</h2>
          </div>

          {/* Asymmetric Grid: 65% Right (#1 Hero) + 35% Left (List 2-5) */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[65%_35%]">
            {/* Right Side - #1 Ranked Hero */}
            {data.recent[0] && (
              <Link href={`/article/${data.recent[0].slug}`} className="group relative">
                <div className="relative overflow-hidden rounded-3xl shadow-xl transition-shadow duration-300 group-hover:shadow-2xl">
                  {/* Large Hero Image */}
                  {data.recent[0].cover_image_path && (
                    <div className="relative aspect-square overflow-hidden lg:aspect-[4/5]">
                      <Image
                        src={getStorageUrl(data.recent[0].cover_image_path)}
                        alt={data.recent[0].title_ar}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Dark gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    </div>
                  )}

                  {/* Ranking Number - Large, Semi-Transparent */}
                  <div className="absolute top-6 left-6 text-8xl font-bold text-white/20 lg:text-9xl">
                    01
                  </div>

                  {/* Content at Bottom */}
                  <div className="absolute right-0 bottom-0 left-0 p-6 lg:p-8">
                    {/* Category Tag */}
                    {data.recent[0].section && (
                      <div className="mb-3">
                        <span className="inline-block rounded-full bg-[#c61b23] px-3 py-1 text-xs font-bold text-white">
                          {data.recent[0].section.name_ar}
                        </span>
                      </div>
                    )}

                    {/* Headline */}
                    <h3 className="mb-2 text-2xl leading-tight font-bold text-white lg:text-3xl">
                      {data.recent[0].title_ar}
                    </h3>

                    {/* Excerpt */}
                    {data.recent[0].excerpt_ar && (
                      <p className="line-clamp-2 text-sm text-white/80">
                        {data.recent[0].excerpt_ar}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )}

            {/* Left Side - Ranked List (02-05) */}
            <div className="space-y-4">
              {data.recent.slice(1, 5).map((article, index) => {
                const rankNumber = (index + 2).toString().padStart(2, '0')
                return (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group flex gap-4 rounded-xl bg-white p-4 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Thumbnail with Rank Badge */}
                    {article.cover_image_path && (
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
                    )}

                    {/* Text Content */}
                    <div className="flex min-w-0 flex-1 flex-col justify-center">
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

      {/* Security & Justice - 60/40 Hybrid Grid */}
      {data.sections.security.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between border-b border-[#c61b23] pb-4">
              <Link
                href="/section/security"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
              >
                <span>المزيد</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <h2 className="text-3xl font-bold text-[#c61b23]">أمن وقضاء</h2>
            </div>

            {/* 60/40 Hybrid Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              {/* Right: Large Featured Card (60%) */}
              {data.sections.security[0] && (
                <Link
                  href={`/article/${data.sections.security[0].slug}`}
                  className="group lg:col-span-3"
                >
                  <div className="overflow-hidden rounded-2xl border border-[#eeeeee] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                    {data.sections.security[0].cover_image_path && (
                      <div className="relative aspect-video overflow-hidden">
                        <Image
                          src={getStorageUrl(data.sections.security[0].cover_image_path)}
                          alt={data.sections.security[0].title_ar}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-6 leading-[1.6]">
                      <h3 className="mb-3 text-xl leading-snug font-bold text-black transition-colors group-hover:text-[#c61b23]">
                        {data.sections.security[0].title_ar}
                      </h3>
                      {data.sections.security[0].excerpt_ar && (
                        <p className="mb-3 line-clamp-2 text-sm leading-[1.6] text-gray-600">
                          {data.sections.security[0].excerpt_ar}
                        </p>
                      )}
                      {data.sections.security[0].published_at && (
                        <time className="text-xs text-gray-500">
                          {new Date(data.sections.security[0].published_at).toLocaleDateString(
                            'ar-EG',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Left: Three Horizontal Items (40%) */}
              <div className="space-y-4 lg:col-span-2">
                {data.sections.security.slice(1, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group flex gap-4 rounded-2xl border border-[#eeeeee] bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                  >
                    {article.cover_image_path && (
                      <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col justify-center leading-[1.6]">
                      <h4 className="mb-2 line-clamp-2 text-sm leading-snug font-bold text-black transition-colors group-hover:text-[#c61b23]">
                        {article.title_ar}
                      </h4>
                      {article.excerpt_ar && (
                        <p className="mb-1 line-clamp-1 text-xs leading-[1.6] text-gray-600">
                          {article.excerpt_ar}
                        </p>
                      )}
                      {article.published_at && (
                        <time className="text-xs text-gray-500">
                          {new Date(article.published_at).toLocaleDateString('ar-EG', {
                            day: 'numeric',
                            month: 'long',
                          })}
                        </time>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Regional & International - Premium 60/40 Power-Grid */}
      {data.sections.regional.length > 0 && (
        <section className="bg-[#f8f8f8] py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header with Gradient Underline */}
            <div className="mb-8 flex items-center justify-between border-b border-[#c61b23] pb-4">
              <Link
                href="/section/regional"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
              >
                <span>المزيد</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <h2 className="text-3xl font-bold text-[#c61b23]">إقليمي ودولي</h2>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-5">
              {/* Right: Hero Article (60%) */}
              {data.sections.regional[0] && (
                <Link
                  href={`/article/${data.sections.regional[0].slug}`}
                  className="group lg:col-span-3"
                >
                  <div className="relative h-full min-h-[500px] overflow-hidden rounded-3xl bg-white shadow-md transition-all duration-300 hover:shadow-2xl">
                    {data.sections.regional[0].cover_image_path && (
                      <>
                        <Image
                          src={getStorageUrl(data.sections.regional[0].cover_image_path)}
                          alt={data.sections.regional[0].title_ar}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent" />
                      </>
                    )}
                    <div className="absolute right-0 bottom-0 left-0 p-8">
                      <h3 className="mb-4 text-3xl leading-tight font-bold text-white">
                        {data.sections.regional[0].title_ar}
                      </h3>
                      {data.sections.regional[0].excerpt_ar && (
                        <p className="mb-3 line-clamp-2 text-base leading-relaxed text-white/90">
                          {data.sections.regional[0].excerpt_ar}
                        </p>
                      )}
                      {data.sections.regional[0].published_at && (
                        <time className="text-sm text-white/70">
                          {new Date(data.sections.regional[0].published_at).toLocaleDateString(
                            'ar-EG',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              )}

              {/* Left: Secondary Feed (40%) */}
              <div className="space-y-6 lg:col-span-2">
                {/* Top: Two Small Cards Side-by-Side */}
                <div className="grid grid-cols-2 gap-4">
                  {data.sections.regional.slice(1, 3).map((article) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      {article.cover_image_path && (
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h4 className="mb-1 line-clamp-2 text-xs leading-snug font-bold text-black transition-colors group-hover:text-[#c61b23]">
                          {article.title_ar}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Bottom: Quick Scan Text-Only List */}
                <div className="rounded-2xl bg-[#f8f8f8] p-6 shadow-sm">
                  <div className="space-y-4">
                    {data.sections.regional.slice(3, 6).map((article, index) => (
                      <div key={article.id}>
                        {index > 0 && <div className="my-4 border-t border-gray-300" />}
                        <Link href={`/article/${article.slug}`} className="group block">
                          <h5 className="mb-2 line-clamp-2 text-sm leading-snug font-bold text-black transition-colors group-hover:text-[#c61b23]">
                            {article.title_ar}
                          </h5>
                          {article.published_at && (
                            <time className="text-xs text-gray-500">
                              {new Date(article.published_at).toLocaleDateString('ar-EG', {
                                day: 'numeric',
                                month: 'long',
                              })}
                            </time>
                          )}
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Writers Carousel - Our Writers */}
      {data.writers && data.writers.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between border-b border-[#c61b23] pb-4">
              <Link
                href="/writers"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
              >
                <span>جميع الكتاب</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <h2 className="text-3xl font-bold text-[#c61b23]">كتابنا</h2>
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

      {/* Economy - 4-Column Card Grid */}
      {data.sections.economy.length > 0 && (
        <section className="bg-[#f9f9f9] py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between border-b border-[#c61b23] pb-4">
              <Link
                href="/section/economy"
                className="flex items-center gap-2 text-sm font-bold text-gray-700 transition-colors hover:text-[#c61b23]"
              >
                <span>المزيد</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-bold text-[#c61b23]">اقتصاد</h2>
                <div className="rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-2">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {data.sections.economy.map((article) => (
                <Link
                  key={article.id}
                  href={`/article/${article.slug}`}
                  className="group overflow-hidden rounded-2xl border border-[#eeeeee] bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  {article.cover_image_path && (
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={getStorageUrl(article.cover_image_path)}
                        alt={article.title_ar}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {/* Ticker Icon Overlay */}
                      <div className="absolute top-3 left-3 rounded-lg bg-amber-500/90 p-1.5">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                  <div className="p-5 leading-[1.6]">
                    <span className="mb-2 inline-block text-xs font-bold text-amber-600">
                      اقتصاد
                    </span>
                    <h3 className="mb-2 line-clamp-2 text-base leading-snug font-bold text-black transition-colors group-hover:text-[#c61b23]">
                      {article.title_ar}
                    </h3>
                    {article.excerpt_ar && (
                      <p className="mb-2 line-clamp-2 text-xs leading-[1.6] text-gray-600">
                        {article.excerpt_ar}
                      </p>
                    )}
                    {article.published_at && (
                      <time className="text-xs text-gray-500">
                        {new Date(article.published_at).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
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
    </div>
  )
}
