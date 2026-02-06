import { createClient } from '@/lib/supabase/server'
import { getStorageUrl, formatDateAr } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import WritersCarousel from '@/components/writers-carousel'
import { BreakingNewsTicker } from '@/components/breaking-news-ticker'
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
    .order('published_at', { ascending: false })
    .limit(6)

  // Fetch all sections from database ordered by sort_order
  const { data: allSections } = await supabase
    .from('sections')
    .select('id, slug, name_ar')
    .order('sort_order', { ascending: true })

  // Fetch articles for each section in parallel (avoids N+1)
  const sectionsWithArticles: { slug: string; name_ar: string; articles: ArticleListItem[] }[] = []

  if (allSections) {
    const sectionResults = await Promise.all(
      (allSections as { id: number; slug: string; name_ar: string }[]).map((section) =>
        getSectionArticlesById(section.id, 6).then((articles) => ({
          slug: section.slug,
          name_ar: section.name_ar,
          articles,
        }))
      )
    )
    for (const result of sectionResults) {
      if (result.articles.length > 0) {
        sectionsWithArticles.push(result)
      }
    }
  }

  // Fetch writers/authors
  const { data: writersData } = await supabase
    .from('profiles')
    .select('id, display_name_ar, avatar_url')
    .not('display_name_ar', 'is', null)
    .limit(10)

  // Fetch breaking news for ticker
  const { data: breakingNews } = await supabase
    .from('articles')
    .select('id, slug, title_ar')
    .eq('status', 'published')
    .eq('is_breaking', true)
    .order('published_at', { ascending: false })
    .limit(10)

  return {
    recent: transformArticles((recentArticles || []) as Record<string, unknown>[]),
    important: transformArticles((importantArticles || []) as Record<string, unknown>[]),
    writers: writersData || [],
    sectionsWithArticles,
    breakingNews: (breakingNews || []) as { id: string; slug: string; title_ar: string }[],
  }
}

async function getSectionArticlesById(
  sectionId: number,
  limit: number = 6
): Promise<ArticleListItem[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `
    )
    .eq('section_id', sectionId)
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
    <div className="min-h-screen">
      {/* Breaking News Ticker */}
      <BreakingNewsTicker articles={data.breakingNews} />

      {/* First Section: 35% Recent + 65% Featured */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-0">
          <div className="grid grid-cols-1 gap-0 md:grid-cols-[40%_60%] lg:grid-cols-[35%_65%]">
            {/* Right Sidebar - على مدار الساعة (Recent News) */}
            <div className="order-2 border-l border-slate-200/80 md:order-1">
              {/* Header */}
              <div className="border-b border-slate-200/60 bg-white px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 rounded-full bg-[#c61b23]"></div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-800 sm:text-base">
                    على مدار الساعة
                  </h2>
                </div>
              </div>

              {/* News List */}
              <div className="bg-white">
                {data.recent.slice(0, 7).map((article, index) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className={`group flex min-h-[56px] items-center gap-3 border-b border-slate-100 px-4 py-3 transition-all last:border-b-0 hover:bg-slate-50/60 sm:min-h-[64px] sm:gap-4 sm:px-5 sm:py-[18px] ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'
                    }`}
                  >
                    {/* Title and excerpt - RTL aligned */}
                    <div className="min-w-0 flex-1 text-right">
                      <h3 className="line-clamp-2 text-[11px] leading-[1.5] font-normal text-slate-600 transition-colors group-hover:text-[#c61b23] sm:text-[12px]">
                        {article.title_ar}
                      </h3>
                      {article.excerpt_ar && (
                        <p className="mt-0.5 line-clamp-1 text-[9px] leading-relaxed text-slate-400 sm:text-[10px]">
                          {article.excerpt_ar}
                        </p>
                      )}
                    </div>

                    {/* Time - aligned to left edge with icon */}
                    <div className="flex shrink-0 items-center gap-1 text-left sm:gap-1.5">
                      <svg
                        className="h-2.5 w-2.5 text-slate-300 sm:h-3 sm:w-3"
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
                      <span className="text-[10px] font-medium text-slate-400 tabular-nums sm:text-[11px]">
                        {article.published_at
                          ? new Date(article.published_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            })
                          : '00:00'}
                      </span>
                    </div>
                  </Link>
                ))}

                {/* More Button */}
                <Link
                  href="/recent"
                  className="flex min-h-[44px] items-center justify-center gap-1.5 border-t border-slate-200/60 bg-slate-50/50 px-4 py-3 text-center text-xs font-medium text-slate-500 transition-all hover:bg-slate-100/80 hover:text-[#c61b23] sm:px-5"
                >
                  <span>عرض المزيد</span>
                  <span className="text-[10px]">←</span>
                </Link>
              </div>
            </div>

            {/* Left Main Area - الأهم (Featured Articles) */}
            <div className="order-1 md:order-2">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 bg-white px-4 py-3 sm:px-5 sm:py-3.5">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-1 rounded-full bg-[#c61b23]"></div>
                  <h2 className="text-sm font-semibold tracking-tight text-slate-800 sm:text-base">
                    أهم الأخبار
                  </h2>
                </div>
                <Link href="/important" className="more-link min-h-[44px]">
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>

              <div className="bg-white">
                {/* Top Section - Hero Image (First Featured Article) */}
                {data.important.slice(0, 1).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group relative block overflow-hidden"
                  >
                    {/* Hero Image - Responsive heights */}
                    <div className="relative h-[250px] w-full sm:h-[350px] md:h-[400px] lg:h-[500px] xl:h-[550px]">
                      {article.cover_image_path ? (
                        <Image
                          src={getStorageUrl(article.cover_image_path)}
                          alt={article.title_ar}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 100vw, 65vw"
                          priority
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="h-20 w-20 text-white/10 sm:h-28 sm:w-28 lg:h-36 lg:w-36"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                              />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* Gradient Overlay for Text Readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
                    </div>

                    {/* Text Overlay at Bottom Right */}
                    <div className="absolute right-0 bottom-0 left-0 p-3 sm:p-5 md:p-6 lg:p-8 xl:p-10">
                      {/* Category Badge */}
                      {article.section && (
                        <div className="mb-2 sm:mb-3">
                          <span className="inline-block rounded bg-[#c61b23] px-2 py-0.5 text-[10px] font-bold text-white sm:px-3 sm:py-1 sm:text-xs">
                            {article.section.name_ar}
                          </span>
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="mb-2 text-lg leading-tight font-bold text-white text-shadow-lg sm:mb-3 sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl">
                        {article.title_ar}
                      </h2>

                      {/* Date */}
                      <p className="text-xs font-medium text-white/90 text-shadow-sm sm:text-sm lg:text-base">
                        {article.published_at && formatDateAr(article.published_at, 'weekday-full')}
                      </p>
                    </div>
                  </Link>
                ))}

                {/* Bottom Section - Two Side-by-Side Images (Next Two Featured Articles) */}
                <div className="grid grid-cols-1 gap-0 sm:grid-cols-2">
                  {data.important.slice(1, 3).map((article) => (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group relative block cursor-pointer overflow-hidden border-t border-l border-gray-200 first:border-l-0 sm:first:border-l"
                    >
                      {/* Image - Responsive heights */}
                      <div className="relative h-48 w-full sm:h-56 md:h-64 lg:h-72">
                        {article.cover_image_path ? (
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 640px) 100vw, 33vw"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg
                                className="h-12 w-12 text-white/10 sm:h-16 sm:w-16"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                />
                              </svg>
                            </div>
                          </div>
                        )}

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                      </div>

                      {/* Text Overlay */}
                      <div className="absolute right-0 bottom-0 left-0 p-3 sm:p-4 lg:p-6">
                        {/* Category Badge */}
                        {article.section && (
                          <div className="mb-1.5 sm:mb-2">
                            <span className="inline-block rounded bg-[#c61b23] px-2 py-0.5 text-[10px] font-bold text-white sm:text-xs">
                              {article.section.name_ar}
                            </span>
                          </div>
                        )}

                        {/* Title */}
                        <h3 className="line-clamp-2 text-base leading-snug font-bold text-white text-shadow-md sm:line-clamp-3 sm:text-lg lg:text-xl">
                          {article.title_ar}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== DYNAMIC SECTIONS - BENTO GRID ==================== */}
      {data.sectionsWithArticles.map((section, sectionIndex) => (
        <section
          key={section.slug}
          className={`py-12 sm:py-16 lg:py-20 ${sectionIndex % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}
        >
          <div className="mx-auto max-w-7xl px-3 sm:px-4">
            {/* Header */}
            <div className="mb-8 sm:mb-10 lg:mb-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-6 w-1 rounded-full bg-[#c61b23] sm:h-8 sm:w-1.5"></div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl xl:text-3xl">
                    {section.name_ar}
                  </h2>
                </div>
                <Link href={`/section/${section.slug}`} className="more-link min-h-[44px]">
                  <span>المزيد</span>
                  <span>←</span>
                </Link>
              </div>
            </div>

            {/* Bento Grid: 3 columns on desktop - Hero RIGHT (2 cols x 2 rows) + 3 cards LEFT */}
            <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
              {/* 3 Smaller Cards - LEFT side */}
              <div className="grid grid-cols-1 gap-5 sm:gap-6 md:col-span-1 lg:order-1 lg:col-span-1 lg:gap-8">
                {section.articles.slice(1, 4).map((article) => (
                  <Link
                    key={article.id}
                    href={`/article/${article.slug}`}
                    className="group relative cursor-pointer"
                  >
                    <div className="bento-card relative h-[180px] sm:h-[190px] lg:h-[200px]">
                      {article.cover_image_path ? (
                        <>
                          <Image
                            src={getStorageUrl(article.cover_image_path)}
                            alt={article.title_ar}
                            fill
                            className="object-cover object-center"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg
                              className="h-12 w-12 text-white/20 sm:h-16 sm:w-16"
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
                      <div className="absolute right-0 bottom-0 left-0 p-4 sm:p-5 lg:p-6">
                        <h3 className="mb-2 line-clamp-2 text-right text-sm leading-relaxed font-bold text-white text-shadow-md sm:mb-2.5 sm:line-clamp-3 sm:text-base sm:leading-relaxed lg:text-lg lg:leading-relaxed">
                          {article.title_ar}
                        </h3>
                        {article.published_at && (
                          <time className="block text-right text-[10px] text-white/70 text-shadow-sm sm:text-xs">
                            {formatDateAr(article.published_at, 'full')}
                          </time>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Hero Card - RIGHT side spanning 2 columns and 2 rows */}
              {section.articles[0] && (
                <Link
                  href={`/article/${section.articles[0].slug}`}
                  className="group cursor-pointer md:col-span-1 lg:order-2 lg:col-span-2 lg:row-span-2"
                >
                  <div className="bento-card relative h-[260px] sm:h-[320px] md:h-[400px] lg:h-full lg:min-h-[450px]">
                    {section.articles[0].cover_image_path ? (
                      <>
                        <Image
                          src={getStorageUrl(section.articles[0].cover_image_path)}
                          alt={section.articles[0].title_ar}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 66vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 via-50% to-transparent" />
                      </>
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="h-16 w-16 text-white/20 sm:h-24 sm:w-24 lg:h-32 lg:w-32"
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
                    <div className="absolute right-0 bottom-0 left-0 p-5 sm:p-7 lg:p-10 xl:p-12">
                      <h3 className="mb-3 text-right text-xl leading-relaxed font-bold text-white text-shadow-lg sm:mb-4 sm:text-2xl sm:leading-relaxed md:text-3xl lg:mb-5 lg:text-4xl lg:leading-relaxed xl:text-5xl">
                        {section.articles[0].title_ar}
                      </h3>
                      {section.articles[0].excerpt_ar && (
                        <p className="mb-3 line-clamp-2 text-right text-sm leading-loose text-white/90 text-shadow-md sm:mb-4 sm:text-base sm:leading-loose lg:mb-5 lg:text-lg lg:leading-loose">
                          {section.articles[0].excerpt_ar}
                        </p>
                      )}
                      {section.articles[0].published_at && (
                        <time className="block text-right text-xs text-white/70 text-shadow-sm sm:text-sm lg:text-base">
                          {formatDateAr(section.articles[0].published_at, 'full')}
                        </time>
                      )}
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>
      ))}

      {/* ==================== MOST READ (الأكثر قراءة) SECTION ==================== */}
      <section className="bg-slate-50 py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          {/* Header */}
          <div className="mb-8 sm:mb-10 lg:mb-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-6 w-1 rounded-full bg-[#c61b23] sm:h-8 sm:w-1.5"></div>
                <h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl xl:text-3xl">
                  الأكثر قراءة
                </h2>
              </div>
            </div>
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
                        sizes="(max-width: 1024px) 100vw, 40vw"
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
                    <h3 className="mb-3 text-lg leading-relaxed font-bold text-white lg:text-xl lg:leading-relaxed">
                      {data.recent[0].title_ar}
                    </h3>

                    {/* Excerpt */}
                    {data.recent[0].excerpt_ar && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-white/80 lg:text-base lg:leading-relaxed">
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
                          sizes="80px"
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

      {/* Writers Carousel - Our Writers */}
      {data.writers && data.writers.length > 0 && (
        <section className="bg-white py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-3 sm:px-4">
            {/* Header */}
            <div className="mb-8 sm:mb-10 lg:mb-12">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="h-6 w-1 rounded-full bg-[#c61b23] sm:h-8 sm:w-1.5"></div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl lg:text-2xl xl:text-3xl">
                    كتابنا
                  </h2>
                </div>
                <Link href="/writers" className="more-link min-h-[44px]">
                  <span>جميع الكتاب</span>
                  <span>←</span>
                </Link>
              </div>
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
    </div>
  )
}
