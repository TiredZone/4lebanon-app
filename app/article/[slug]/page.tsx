import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { SITE_CONFIG, PAGINATION } from '@/lib/constants'
import { formatDateAr, calculateReadingTime, getStorageUrl } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import { ArticleCard } from '@/components/article'
import type { ArticleWithRelations, ArticleListItem, Topic } from '@/types/database'

export const revalidate = 600 // 10 minutes

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string): Promise<ArticleWithRelations | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('articles')
    .select(
      `
      *,
      author:profiles!articles_author_id_fkey(*),
      section:sections!articles_section_id_fkey(*),
      region:regions!articles_region_id_fkey(*),
      country:countries!articles_country_id_fkey(*),
      article_topics(topic:topics(*))
    `
    )
    .eq('slug', slug)
    .single()

  if (!data) return null

  // Transform topics
  const articleData = data as Record<string, unknown>
  const articleTopics = (articleData.article_topics as Array<{ topic: Topic }>) || []
  const topics = articleTopics.map((at) => at.topic)

  return {
    ...articleData,
    topics,
  } as ArticleWithRelations
}

async function getRelatedArticles(
  articleId: string,
  sectionId: number | null
): Promise<ArticleListItem[]> {
  const supabase = await createClient()

  let query = supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `
    )
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(PAGINATION.relatedArticlesCount)

  if (sectionId) {
    query = query.eq('section_id', sectionId)
  }

  const { data } = await query

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

// Increment view count (fire and forget)
async function incrementViewCount(articleId: string) {
  try {
    const supabase = await createServiceClient()
    await supabase.rpc('increment_view_count', { article_id: articleId })
  } catch {
    // Silently fail - view count is not critical
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return { title: 'المقال غير موجود' }
  }

  const imageUrl = getStorageUrl(article.cover_image_path)

  return {
    title: article.title_ar,
    description: article.excerpt_ar || article.title_ar,
    openGraph: {
      title: article.title_ar,
      description: article.excerpt_ar || article.title_ar,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: [article.author.display_name_ar],
      images: imageUrl ? [{ url: imageUrl, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title_ar,
      description: article.excerpt_ar || article.title_ar,
      images: imageUrl ? [imageUrl] : undefined,
    },
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    notFound()
  }

  // Increment view count (non-blocking)
  incrementViewCount(article.id)

  const relatedArticles = await getRelatedArticles(article.id, article.section_id)
  const imageUrl = getStorageUrl(article.cover_image_path)
  const readingTime = calculateReadingTime(article.body_md)

  return (
    <article className="bg-muted pb-12">
      {/* Header */}
      <div className="bg-white py-6">
        <div className="mx-auto max-w-4xl px-4">
          {/* Breadcrumb */}
          <nav className="text-muted-foreground mb-4 flex items-center gap-2 text-sm">
            <Link href="/" className="hover:text-primary">
              الرئيسية
            </Link>
            {article.section && (
              <>
                <span>/</span>
                <Link href={`/section/${article.section.slug}`} className="hover:text-primary">
                  {article.section.name_ar}
                </Link>
              </>
            )}
          </nav>

          {/* Title */}
          <h1 className="text-foreground mb-4 text-3xl leading-tight font-bold md:text-4xl">
            {article.title_ar}
          </h1>

          {/* Breaking badge */}
          {article.is_breaking && (
            <span className="bg-primary mb-4 inline-block rounded px-3 py-1 text-sm font-bold text-white">
              عاجل
            </span>
          )}

          {/* Meta */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm">
            <Link
              href={`/author/${article.author.id}`}
              className="hover:text-primary flex items-center gap-2"
            >
              {article.author.avatar_url ? (
                <Image
                  src={getStorageUrl(article.author.avatar_url)!}
                  alt={article.author.display_name_ar}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              ) : (
                <span className="bg-primary flex h-8 w-8 items-center justify-center rounded-full text-white">
                  {article.author.display_name_ar.charAt(0)}
                </span>
              )}
              <span className="font-medium">{article.author.display_name_ar}</span>
            </Link>
            <span>•</span>
            {article.published_at && (
              <time>{formatDateAr(article.published_at, 'dd MMMM yyyy، HH:mm')}</time>
            )}
            <span>•</span>
            <span>{readingTime}</span>
          </div>

          {/* Topics/Tags */}
          {article.topics.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {article.topics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`/search?topic=${topic.slug}`}
                  className="bg-muted text-foreground hover:bg-primary rounded-full px-3 py-1 text-xs font-medium hover:text-white"
                >
                  {topic.name_ar}
                </Link>
              ))}
            </div>
          )}

          {/* Share buttons */}
          <div className="mt-6 flex items-center gap-3">
            <span className="text-muted-foreground text-sm font-medium">مشاركة:</span>
            <ShareButton platform="facebook" url={`${SITE_CONFIG.url}/article/${article.slug}`} />
            <ShareButton
              platform="twitter"
              url={`${SITE_CONFIG.url}/article/${article.slug}`}
              title={article.title_ar}
            />
            <ShareButton
              platform="whatsapp"
              url={`${SITE_CONFIG.url}/article/${article.slug}`}
              title={article.title_ar}
            />
            <ShareButton
              platform="telegram"
              url={`${SITE_CONFIG.url}/article/${article.slug}`}
              title={article.title_ar}
            />
          </div>
        </div>
      </div>

      {/* Cover Image */}
      {imageUrl && (
        <div className="mx-auto max-w-4xl px-4 py-6">
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={imageUrl}
              alt={article.title_ar}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 900px"
              priority
            />
          </div>
        </div>
      )}

      {/* Article Body */}
      <div className="mx-auto max-w-4xl px-4">
        <div className="rounded-lg bg-white p-6 shadow-sm md:p-8">
          <MarkdownRenderer content={article.body_md} />

          {/* Sources */}
          {article.sources && article.sources.length > 0 && (
            <div className="border-border mt-8 border-t pt-6">
              <h2 className="text-foreground mb-4 text-lg font-bold">المصادر</h2>
              <ul className="space-y-2">
                {article.sources.map((source, index) => (
                  <li key={index}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {source.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-foreground mb-6 text-xl font-bold">اخترنا لكم</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {relatedArticles.map((related) => (
              <ArticleCard key={related.id} article={related} />
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

// Share button component
function ShareButton({
  platform,
  url,
  title,
}: {
  platform: 'facebook' | 'twitter' | 'whatsapp' | 'telegram'
  url: string
  title?: string
}) {
  const shareUrls: Record<string, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || '')}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title || ''} ${url}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title || '')}`,
  }

  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    twitter: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    whatsapp: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    telegram: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  }

  return (
    <a
      href={shareUrls[platform]}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-muted text-muted-foreground hover:bg-primary flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:text-white"
      aria-label={`مشاركة على ${platform}`}
    >
      {icons[platform]}
    </a>
  )
}
