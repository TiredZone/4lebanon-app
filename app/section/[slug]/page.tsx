import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION, SITE_CONFIG } from '@/lib/constants'
import { ArticleGrid } from '@/components/article'
import { MostReadStatic } from '@/components/sidebar'
import type { ArticleListItem, Section } from '@/types/database'

export const revalidate = 180 // 3 minutes

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

async function getSection(slug: string): Promise<Section | null> {
  const supabase = await createClient()

  const { data } = await supabase.from('sections').select('*').eq('slug', slug).single()

  return data as Section | null
}

async function getSectionArticles(
  sectionId: number,
  page: number = 1
): Promise<{ articles: ArticleListItem[]; total: number }> {
  const supabase = await createClient()
  const perPage = PAGINATION.defaultPageSize
  const offset = (page - 1) * perPage

  const { data, count } = await supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `,
      { count: 'exact' }
    )
    .eq('section_id', sectionId)
    .order('published_at', { ascending: false })
    .range(offset, offset + perPage - 1)

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

async function getMostRead() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('articles')
    .select('id, slug, title_ar, view_count')
    .order('view_count', { ascending: false })
    .limit(PAGINATION.mostReadCount)

  return (data || []) as { id: string; slug: string; title_ar: string; view_count: number }[]
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const section = await getSection(slug)

  if (!section) {
    return { title: 'القسم غير موجود' }
  }

  return {
    title: section.name_ar,
    description: section.description_ar || `أخبار ${section.name_ar} على ${SITE_CONFIG.nameAr}`,
    openGraph: {
      title: section.name_ar,
      description: section.description_ar || `أخبار ${section.name_ar}`,
    },
  }
}

export default async function SectionPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = parseInt(pageParam || '1', 10)

  const section = await getSection(slug)

  if (!section) {
    notFound()
  }

  const [{ articles, total }, mostRead] = await Promise.all([
    getSectionArticles(section.id, page),
    getMostRead(),
  ])

  const totalPages = Math.ceil(total / PAGINATION.defaultPageSize)

  return (
    <div className="bg-muted py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-8">
          <h1 className="text-foreground text-3xl font-bold">{section.name_ar}</h1>
          {section.description_ar && (
            <p className="text-muted-foreground mt-2">{section.description_ar}</p>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-4">
          {/* Articles Grid */}
          <div className="lg:col-span-3">
            {articles.length > 0 ? (
              <>
                <ArticleGrid articles={articles} columns={3} showExcerpt />
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    baseUrl={`/section/${slug}`}
                  />
                )}
              </>
            ) : (
              <div className="rounded-lg bg-white p-8 text-center">
                <p className="text-muted-foreground">لا توجد مقالات في هذا القسم حالياً.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <MostReadStatic articles={mostRead} />
          </aside>
        </div>
      </div>
    </div>
  )
}

// Pagination component
function Pagination({
  currentPage,
  totalPages,
  baseUrl,
}: {
  currentPage: number
  totalPages: number
  baseUrl: string
}) {
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
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="text-foreground hover:bg-primary rounded-lg bg-white px-4 py-2 text-sm font-medium hover:text-white"
        >
          السابق
        </a>
      )}

      {pages.map((pageNum) => (
        <a
          key={pageNum}
          href={`${baseUrl}?page=${pageNum}`}
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
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="text-foreground hover:bg-primary rounded-lg bg-white px-4 py-2 text-sm font-medium hover:text-white"
        >
          التالي
        </a>
      )}
    </nav>
  )
}
