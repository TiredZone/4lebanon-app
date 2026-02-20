import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION, SITE_CONFIG } from '@/lib/constants'
import { getStorageUrl } from '@/lib/utils'
import { ArticleGrid } from '@/components/article'
import type { Profile, ArticleListItem } from '@/types/database'

export const revalidate = 300 // 5 minutes

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ page?: string }>
}

async function getAuthor(id: string): Promise<Profile | null> {
  const supabase = await createClient()

  const { data } = await supabase.from('profiles').select('*').eq('id', id).single()

  return data as Profile | null
}

async function getAuthorArticles(
  authorId: string,
  page: number = 1
): Promise<{ articles: ArticleListItem[]; total: number }> {
  const supabase = await createClient()
  const perPage = PAGINATION.defaultPageSize
  const offset = (page - 1) * perPage
  const now = new Date().toISOString()

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
    .eq('author_id', authorId)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const author = await getAuthor(id)

  if (!author) {
    return { title: 'الكاتب غير موجود' }
  }

  const avatarUrl = getStorageUrl(author.avatar_url)

  return {
    title: author.display_name_ar,
    description: author.bio_ar || `مقالات ${author.display_name_ar} على ${SITE_CONFIG.nameAr}`,
    openGraph: {
      title: author.display_name_ar,
      description: author.bio_ar || `مقالات ${author.display_name_ar}`,
      type: 'profile',
      images: avatarUrl ? [{ url: avatarUrl }] : undefined,
    },
  }
}

export default async function AuthorPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)

  const author = await getAuthor(id)

  if (!author) {
    notFound()
  }

  const { articles, total } = await getAuthorArticles(author.id, page)
  const totalPages = Math.ceil(total / PAGINATION.defaultPageSize)
  const avatarUrl = getStorageUrl(author.avatar_url)

  return (
    <div className="bg-muted py-8">
      <div className="mx-auto max-w-7xl px-4">
        {/* Author Header */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            {/* Avatar */}
            <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={author.display_name_ar}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : (
                <div className="bg-primary flex h-full w-full items-center justify-center text-4xl font-bold text-white">
                  {author.display_name_ar.charAt(0)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-right">
              <h1 className="text-foreground mb-2 text-3xl font-bold">{author.display_name_ar}</h1>
              {author.bio_ar && <p className="text-muted-foreground mb-4">{author.bio_ar}</p>}
              <p className="text-muted-foreground text-sm">
                <span className="text-foreground font-bold">{total}</span> مقال
              </p>
            </div>
          </div>
        </div>

        {/* Articles */}
        <div className="mb-6">
          <h2 className="text-foreground text-xl font-bold">مقالات الكاتب</h2>
        </div>

        {articles.length > 0 ? (
          <>
            <ArticleGrid articles={articles} columns={3} showExcerpt showSection />
            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination currentPage={page} totalPages={totalPages} baseUrl={`/author/${id}`} />
            )}
          </>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center">
            <p className="text-muted-foreground">لا توجد مقالات لهذا الكاتب حالياً.</p>
          </div>
        )}
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
        <Link
          href={`${baseUrl}?page=${currentPage - 1}`}
          className="text-foreground hover:bg-primary rounded-lg bg-white px-4 py-2 text-sm font-medium hover:text-white"
        >
          السابق
        </Link>
      )}

      {pages.map((pageNum) => (
        <Link
          key={pageNum}
          href={`${baseUrl}?page=${pageNum}`}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            pageNum === currentPage
              ? 'bg-primary text-white'
              : 'text-foreground hover:bg-primary bg-white hover:text-white'
          }`}
        >
          {pageNum}
        </Link>
      ))}

      {currentPage < totalPages && (
        <Link
          href={`${baseUrl}?page=${currentPage + 1}`}
          className="text-foreground hover:bg-primary rounded-lg bg-white px-4 py-2 text-sm font-medium hover:text-white"
        >
          التالي
        </Link>
      )}
    </nav>
  )
}
