import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { sanitizeUrl } from '@/lib/security'
import { SITE_CONFIG, PAGINATION } from '@/lib/constants'
import { formatDateAr, calculateReadingTime, getStorageUrl, resolveAuthor } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import {
  ReadingProgressBar,
  SocialShareBar,
  TrendingSidebar,
  ArticleHeroImage,
  RecommendedArticles,
} from '@/components/article'
import { JsonLd, newsArticleJsonLd, breadcrumbJsonLd } from '@/components/json-ld'
import type { ArticleWithRelations, ArticleListItem, Topic } from '@/types/database'

export const revalidate = 600 // 10 minutes

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string): Promise<ArticleWithRelations | null> {
  const supabase = await createClient()
  const decodedSlug = decodeURIComponent(slug)
  const now = new Date().toISOString()

  // Use explicit foreign key names like homepage does
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url, bio_ar, is_anonymous),
      section:sections!articles_section_id_fkey(id, slug, name_ar, description_ar)
    `
    )
    .eq('slug', decodedSlug)
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .single()

  if (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching article:', error.message, error.details, error.hint)
    }
    return null
  }

  if (!data) return null

  // Fetch topics through the article_topics join table
  const { data: topicRows } = await supabase
    .from('article_topics')
    .select('topic:topics(id, slug, name_ar, sort_order, created_at)')
    .eq('article_id', data.id)

  const topics: Topic[] = (topicRows || [])
    .map((row) => (row as unknown as { topic: Topic }).topic)
    .filter(Boolean)

  return {
    ...data,
    region: null,
    country: null,
    topics,
  } as ArticleWithRelations
}

async function getRelatedArticles(
  articleId: string,
  sectionId: number | null
): Promise<ArticleListItem[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  let query = supabase
    .from('articles')
    .select(
      `
      id, slug, title_ar, excerpt_ar, cover_image_path, published_at, is_breaking, is_featured,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url, is_anonymous),
      section:sections!articles_section_id_fkey(id, slug, name_ar)
    `
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .neq('id', articleId)
    .order('published_at', { ascending: false })
    .limit(PAGINATION.relatedArticlesCount)

  if (sectionId !== null) {
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
    priority: ((article.priority as number) ?? 4) as ArticleListItem['priority'],
    author: article.author as ArticleListItem['author'],
    section: article.section as ArticleListItem['section'],
  }))
}

// Increment view count (fire and forget)
async function incrementViewCount(articleId: string) {
  try {
    const supabase = await createClient()
    await supabase.rpc('increment_view_count', { article_id: articleId })
  } catch {
    // Silently fail - view count is not critical
  }
}

export async function generateStaticParams() {
  const { createServiceClient } = await import('@/lib/supabase/server')
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('articles')
    .select('slug')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100)
  return (data || []).map((a) => ({ slug: (a as { slug: string }).slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = await getArticle(slug)

  if (!article) {
    return { title: 'المقال غير موجود' }
  }

  const imageUrl = getStorageUrl(article.cover_image_path)
  const metaAuthor = resolveAuthor(article.author)

  return {
    title: article.title_ar,
    description: article.excerpt_ar || article.title_ar,
    alternates: { canonical: '/article/' + slug },
    openGraph: {
      title: article.title_ar,
      description: article.excerpt_ar || article.title_ar,
      type: 'article',
      publishedTime: article.published_at || undefined,
      authors: metaAuthor?.display_name_ar ? [metaAuthor.display_name_ar] : undefined,
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
  void incrementViewCount(article.id)

  const author = resolveAuthor(article.author)
  const relatedArticles = await getRelatedArticles(article.id, article.section_id)
  const imageUrl = getStorageUrl(article.cover_image_path)
  const readingTime = calculateReadingTime(article.body_md)
  const articleUrl = `${SITE_CONFIG.url}/article/${article.slug}`

  const breadcrumbItems = [
    { name: 'الرئيسية', url: SITE_CONFIG.url },
    ...(article.section
      ? [
          {
            name: article.section.name_ar,
            url: `${SITE_CONFIG.url}/section/${article.section.slug}`,
          },
        ]
      : []),
    { name: article.title_ar, url: articleUrl },
  ]

  return (
    <>
      <JsonLd
        data={newsArticleJsonLd({
          title: article.title_ar,
          description: article.excerpt_ar,
          published_at: article.published_at,
          updated_at: article.updated_at,
          imageUrl,
          authorName: author?.display_name_ar,
          slug: article.slug,
          sectionName: article.section?.name_ar,
        })}
      />
      <JsonLd data={breadcrumbJsonLd(breadcrumbItems)} />

      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      <article className="article-page-bg">
        <div className="article-layout py-8">
          {/* Left Sidebar - Social Share (Desktop only) */}
          <SocialShareBar url={articleUrl} title={article.title_ar} variant="sidebar" />

          {/* Main Reading Column */}
          <div className="article-reading-column">
            {/* Breadcrumbs */}
            <nav className="article-breadcrumbs">
              <Link href="/">الرئيسية</Link>
              {article.section && (
                <>
                  <span>/</span>
                  <Link href={`/section/${article.section.slug}`} className="category-link">
                    {article.section.name_ar}
                  </Link>
                </>
              )}
            </nav>

            {/* Breaking Badge */}
            {article.is_breaking && (
              <span className="article-breaking-badge">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                عاجل
              </span>
            )}

            {/* Headline */}
            <h1 className="article-headline">{article.title_ar}</h1>

            {/* Metadata Glass Pill */}
            <div className="article-meta-pill">
              {author && (
                <>
                  <Link
                    href={`/author/${author.id}`}
                    className="flex items-center gap-2 hover:opacity-80"
                  >
                    <div className="author-avatar">
                      {author.avatar_url ? (
                        <Image
                          src={getStorageUrl(author.avatar_url) || '/placeholder.png'}
                          alt={author.display_name_ar}
                          width={36}
                          height={36}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E11D48] to-[#BE123C] text-sm font-bold text-white">
                          {author.display_name_ar?.charAt(0) || 'ك'}
                        </div>
                      )}
                    </div>
                    <span className="author-name">{author.display_name_ar}</span>
                  </Link>
                  <span className="separator" />
                </>
              )}

              {article.published_at && (
                <time>{formatDateAr(article.published_at, 'dd MMMM yyyy')}</time>
              )}

              <span className="separator" />

              <span className="reading-time">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {readingTime}
              </span>
            </div>

            {/* Topics/Tags */}
            {article.topics.length > 0 && (
              <div className="article-topics">
                {article.topics.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/search?topic=${topic.slug}`}
                    className="article-topic-tag"
                  >
                    {topic.name_ar}
                  </Link>
                ))}
              </div>
            )}

            {/* Hero Image */}
            {imageUrl && <ArticleHeroImage src={imageUrl} alt={article.title_ar} />}

            {/* Article Glass Container */}
            <div className="article-glass-container">
              {/* Article Body */}
              <div className="article-content-body">
                <MarkdownRenderer content={article.body_md} />
              </div>

              {/* Sources */}
              {article.sources && article.sources.length > 0 && (
                <div className="article-sources">
                  <h2 className="article-sources-title">المصادر</h2>
                  <ul>
                    {article.sources.map((source, index) => {
                      const safeUrl = sanitizeUrl(source.url)
                      return (
                        <li key={index}>
                          {safeUrl ? (
                            <a href={safeUrl} target="_blank" rel="noopener noreferrer">
                              {source.title}
                            </a>
                          ) : (
                            <span>{source.title}</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Mobile Social Bar */}
            <SocialShareBar url={articleUrl} title={article.title_ar} variant="mobile" />

            {/* Recommended Articles */}
            <RecommendedArticles articles={relatedArticles} />
          </div>

          {/* Right Sidebar - Trending (Desktop only) */}
          <TrendingSidebar />
        </div>
      </article>
    </>
  )
}
