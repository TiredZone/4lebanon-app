import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION, SITE_CONFIG } from '@/lib/constants'
import { ArticleGrid } from '@/components/article'
import type { ArticleListItem } from '@/types/database'

// Search is dynamic - no caching
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    section?: string
    region?: string
    country?: string
    topic?: string
    page?: string
  }>
}

async function searchArticles(params: {
  q?: string
  section?: string
  region?: string
  country?: string
  topic?: string
  page?: number
}): Promise<{ articles: ArticleListItem[]; total: number }> {
  const supabase = await createClient()
  const perPage = PAGINATION.searchPageSize
  const offset = ((params.page || 1) - 1) * perPage

  let query = supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `,
      { count: 'exact' }
    )
    .order('published_at', { ascending: false })

  // Full-text search
  if (params.q) {
    query = query.textSearch('search_vector', params.q.split(' ').join(' & '), {
      config: 'simple',
    })
  }

  // Filters
  if (params.section) {
    const { data: section } = await supabase
      .from('sections')
      .select('id')
      .eq('slug', params.section)
      .single()
    if (section) {
      const sectionData = section as { id: number }
      query = query.eq('section_id', sectionData.id)
    }
  }

  if (params.region) {
    const { data: region } = await supabase
      .from('regions')
      .select('id')
      .eq('slug', params.region)
      .single()
    if (region) {
      const regionData = region as { id: number }
      query = query.eq('region_id', regionData.id)
    }
  }

  if (params.country) {
    const { data: country } = await supabase
      .from('countries')
      .select('id')
      .eq('slug', params.country)
      .single()
    if (country) {
      const countryData = country as { id: number }
      query = query.eq('country_id', countryData.id)
    }
  }

  const { data, count } = await query.range(offset, offset + perPage - 1)

  const articles = ((data || []) as Record<string, unknown>[]).map((article) => ({
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

  return { articles, total: count || 0 }
}

async function getFilters() {
  const supabase = await createClient()

  const [sections, regions, countries] = await Promise.all([
    supabase.from('sections').select('id, slug, name_ar').order('sort_order'),
    supabase.from('regions').select('id, slug, name_ar').order('sort_order'),
    supabase.from('countries').select('id, slug, name_ar, region_id').order('sort_order'),
  ])

  return {
    sections: (sections.data || []) as { id: number; slug: string; name_ar: string }[],
    regions: (regions.data || []) as { id: number; slug: string; name_ar: string }[],
    countries: (countries.data || []) as {
      id: number
      slug: string
      name_ar: string
      region_id: number
    }[],
  }
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const query = params.q

  return {
    title: query ? `نتائج البحث: ${query}` : 'بحث',
    description: query
      ? `نتائج البحث عن "${query}" على ${SITE_CONFIG.nameAr}`
      : `البحث في أخبار ${SITE_CONFIG.nameAr}`,
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)

  const [{ articles, total }, filters] = await Promise.all([
    searchArticles({
      q: params.q,
      section: params.section,
      region: params.region,
      country: params.country,
      topic: params.topic,
      page,
    }),
    getFilters(),
  ])

  const totalPages = Math.ceil(total / PAGINATION.searchPageSize)

  return (
    <div className="bg-muted py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-foreground mb-4 text-3xl font-bold">بحث</h1>

          {/* Search Form */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <SearchPageForm
              filters={filters}
              currentParams={{
                q: params.q || '',
                section: params.section || '',
                region: params.region || '',
                country: params.country || '',
              }}
            />
          </div>
        </div>

        {/* Results */}
        {params.q || params.section || params.region || params.country ? (
          <>
            <div className="mb-6">
              <p className="text-muted-foreground">
                {total > 0 ? (
                  <>
                    تم العثور على <span className="text-foreground font-bold">{total}</span> نتيجة
                    {params.q && (
                      <>
                        {' '}
                        لـ &quot;<span className="text-foreground font-bold">{params.q}</span>&quot;
                      </>
                    )}
                  </>
                ) : (
                  'لم يتم العثور على نتائج'
                )}
              </p>
            </div>

            {articles.length > 0 ? (
              <>
                <ArticleGrid articles={articles} columns={3} showExcerpt />
                {/* Pagination */}
                {totalPages > 1 && (
                  <SearchPagination currentPage={page} totalPages={totalPages} params={params} />
                )}
              </>
            ) : (
              <div className="rounded-lg bg-white p-8 text-center">
                <p className="text-muted-foreground">
                  لم يتم العثور على نتائج. حاول تغيير معايير البحث.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-muted-foreground">
              أدخل كلمة البحث أو اختر فلتر للعثور على المقالات.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// Client search form component
function SearchPageForm({
  filters,
  currentParams,
}: {
  filters: {
    sections: { id: number; slug: string; name_ar: string }[]
    regions: { id: number; slug: string; name_ar: string }[]
    countries: { id: number; slug: string; name_ar: string; region_id: number }[]
  }
  currentParams: { q: string; section: string; region: string; country: string }
}) {
  return (
    <form method="get" className="space-y-4">
      {/* Search input */}
      <div>
        <label htmlFor="q" className="text-foreground mb-2 block text-sm font-medium">
          كلمة البحث
        </label>
        <input
          type="search"
          id="q"
          name="q"
          defaultValue={currentParams.q}
          placeholder="ابحث في المقالات..."
          className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Filters */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Section filter */}
        <div>
          <label htmlFor="section" className="text-foreground mb-2 block text-sm font-medium">
            القسم
          </label>
          <select
            id="section"
            name="section"
            defaultValue={currentParams.section}
            className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          >
            <option value="">جميع الأقسام</option>
            {filters.sections.map((s) => (
              <option key={s.id} value={s.slug}>
                {s.name_ar}
              </option>
            ))}
          </select>
        </div>

        {/* Region filter */}
        <div>
          <label htmlFor="region" className="text-foreground mb-2 block text-sm font-medium">
            المنطقة
          </label>
          <select
            id="region"
            name="region"
            defaultValue={currentParams.region}
            className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          >
            <option value="">جميع المناطق</option>
            {filters.regions.map((r) => (
              <option key={r.id} value={r.slug}>
                {r.name_ar}
              </option>
            ))}
          </select>
        </div>

        {/* Country filter */}
        <div>
          <label htmlFor="country" className="text-foreground mb-2 block text-sm font-medium">
            الدولة
          </label>
          <select
            id="country"
            name="country"
            defaultValue={currentParams.country}
            className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          >
            <option value="">جميع الدول</option>
            {filters.countries.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name_ar}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="bg-primary hover:bg-primary-dark rounded-lg px-6 py-2 font-medium text-white"
      >
        بحث
      </button>
    </form>
  )
}

// Pagination with params preservation
function SearchPagination({
  currentPage,
  totalPages,
  params,
}: {
  currentPage: number
  totalPages: number
  params: Record<string, string | undefined>
}) {
  const buildUrl = (page: number) => {
    const searchParams = new URLSearchParams()
    if (params.q) searchParams.set('q', params.q)
    if (params.section) searchParams.set('section', params.section)
    if (params.region) searchParams.set('region', params.region)
    if (params.country) searchParams.set('country', params.country)
    if (params.topic) searchParams.set('topic', params.topic)
    searchParams.set('page', page.toString())
    return `/search?${searchParams.toString()}`
  }

  const pages = []
  const maxVisible = 5

  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2))
  const end = Math.min(totalPages, start + maxVisible - 1)

  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return (
    <nav className="mt-8 flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <a
          href={buildUrl(currentPage - 1)}
          className="text-foreground hover:bg-primary rounded-lg bg-white px-4 py-2 text-sm font-medium hover:text-white"
        >
          السابق
        </a>
      )}

      {pages.map((pageNum) => (
        <a
          key={pageNum}
          href={buildUrl(pageNum)}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            pageNum === currentPage
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-primary bg-white hover:text-white'
          }`}
        >
          {pageNum}
        </a>
      ))}

      {currentPage < totalPages && (
        <a
          href={buildUrl(currentPage + 1)}
          className="text-foreground hover:bg-primary rounded-lg bg-white px-4 py-2 text-sm font-medium hover:text-white"
        >
          التالي
        </a>
      )}
    </nav>
  )
}
