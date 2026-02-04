import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SITE_CONFIG, PAGINATION } from '@/lib/constants'
import { formatDateAr, calculateReadingTime, getStorageUrl } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/markdown-renderer'
import {
  ReadingProgressBar,
  SocialShareBar,
  TrendingSidebar,
  ArticleHeroImage,
  RecommendedArticles,
} from '@/components/article'
import type { ArticleWithRelations, ArticleListItem } from '@/types/database'

export const revalidate = 600 // 10 minutes

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getArticle(slug: string): Promise<ArticleWithRelations | null> {
  const supabase = await createClient()
  const decodedSlug = decodeURIComponent(slug)

  console.log('=== ARTICLE FETCH DEBUG ===')
  console.log('Raw slug:', slug)
  console.log('Decoded slug:', decodedSlug)

  // Use explicit foreign key names like homepage does
  const { data, error } = await supabase
    .from('articles')
    .select(
      `
      *,
      author:profiles!articles_author_id_fkey(id, display_name_ar, avatar_url, bio_ar),
      section:sections!articles_section_id_fkey(id, slug, name_ar, description_ar)
    `
    )
    .eq('slug', decodedSlug)
    .eq('status', 'published')
    .single()

  console.log('Query result - data:', data ? 'found' : 'null')
  console.log('Query result - error:', error ? JSON.stringify(error) : 'none')

  if (error) {
    console.error('Error fetching article:', error.message, error.details, error.hint)
    return null
  }

  if (!data) return null

  // Return with empty defaults for unused relations
  return {
    ...data,
    region: null,
    country: null,
    topics: [],
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
    .eq('status', 'published')
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
    const supabase = await createClient()
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
  const articleUrl = `${SITE_CONFIG.url}/article/${article.slug}`

  return (
    <>
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
              <Link
                href={`/author/${article.author.id}`}
                className="flex items-center gap-2 hover:opacity-80"
              >
                <div className="author-avatar">
                  {article.author.avatar_url ? (
                    <Image
                      src={getStorageUrl(article.author.avatar_url)!}
                      alt={article.author.display_name_ar}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#E11D48] to-[#BE123C] text-sm font-bold text-white">
                      {article.author.display_name_ar.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="author-name">{article.author.display_name_ar}</span>
              </Link>

              <span className="separator" />

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
            {imageUrl && imageUrl !== '/placeholder.png' && (
              <ArticleHeroImage src={imageUrl} alt={article.title_ar} />
            )}

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
                    {article.sources.map((source, index) => (
                      <li key={index}>
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                        </a>
                      </li>
                    ))}
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
