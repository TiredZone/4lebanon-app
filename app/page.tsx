import { createClient } from '@/lib/supabase/server'
import { PAGINATION } from '@/lib/constants'
import { FeaturedGrid, SectionGrid } from '@/components/article'
import { LiveTickerStatic } from '@/components/layout'
import { MostReadStatic } from '@/components/sidebar'
import { WritersSectionStatic } from '@/components/sidebar'
import type { ArticleListItem, Profile } from '@/types/database'

export const revalidate = 120 // 2 minutes

async function getHomepageData() {
  const supabase = await createClient()

  // Featured/Breaking articles
  const { data: featuredArticles } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `
    )
    .or('is_featured.eq.true,is_breaking.eq.true')
    .order('published_at', { ascending: false })
    .limit(4)

  // Get featured IDs for exclusion
  const featuredData = (featuredArticles || []) as Record<string, unknown>[]
  const featuredIds = featuredData.map((a) => a.id as string)

  // Latest articles (excluding featured)
  const { data: latestArticles } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `
    )
    .not('id', 'in', `(${featuredIds.length > 0 ? featuredIds.join(',') : 'null'})`)
    .order('published_at', { ascending: false })
    .limit(PAGINATION.defaultPageSize)

  // Ticker items
  const { data: tickerItems } = await supabase
    .from('articles')
    .select('id, slug, title_ar, published_at')
    .order('published_at', { ascending: false })
    .limit(PAGINATION.tickerItemsCount)

  // Most read
  const { data: mostRead } = await supabase
    .from('articles')
    .select('id, slug, title_ar, view_count')
    .order('view_count', { ascending: false })
    .limit(PAGINATION.mostReadCount)

  // Authors
  const { data: authors } = await supabase.from('profiles').select('*').limit(6)

  return {
    featured: transformArticles(featuredData),
    latest: transformArticles((latestArticles || []) as Record<string, unknown>[]),
    ticker: ((tickerItems || []) as Record<string, unknown>[]).map((item) => ({
      id: item.id as string,
      slug: item.slug as string,
      title_ar: item.title_ar as string,
      published_at: item.published_at as string,
    })),
    mostRead: ((mostRead || []) as Record<string, unknown>[]).map((item) => ({
      id: item.id as string,
      slug: item.slug as string,
      title_ar: item.title_ar as string,
      view_count: item.view_count as number,
    })),
    authors: (authors || []) as Profile[],
  }
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

export default async function HomePage() {
  const { featured, latest, ticker, mostRead, authors } = await getHomepageData()

  const heroArticle = featured[0]
  const secondaryFeatured = featured.slice(1)

  return (
    <>
      {/* Live Ticker */}
      <LiveTickerStatic items={ticker} />

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Featured Section */}
            {heroArticle && (
              <section className="mb-10">
                <FeaturedGrid featured={heroArticle} articles={secondaryFeatured} />
              </section>
            )}

            {/* Latest Articles */}
            {latest.length > 0 && (
              <SectionGrid
                title="آخر الأخبار"
                titleHref="/section/news"
                articles={latest}
                columns={3}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <MostReadStatic articles={mostRead} />
            <WritersSectionStatic authors={authors} />
          </aside>
        </div>
      </div>
    </>
  )
}

// Loading skeleton for suspense
export function HomePageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <div className="bg-muted aspect-[16/9] animate-pulse rounded-lg"></div>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-muted animate-pulse rounded-lg">
                <div className="aspect-[16/10]"></div>
                <div className="space-y-2 p-4">
                  <div className="bg-border h-4 w-1/4 rounded"></div>
                  <div className="bg-border h-6 rounded"></div>
                  <div className="bg-border h-4 w-3/4 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="space-y-6">
          <div className="bg-muted h-64 animate-pulse rounded-lg"></div>
          <div className="bg-muted h-48 animate-pulse rounded-lg"></div>
        </aside>
      </div>
    </div>
  )
}
