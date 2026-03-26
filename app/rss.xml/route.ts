import { createClient } from '@/lib/supabase/server'
import { SITE_CONFIG } from '@/lib/constants'
import { getStorageUrl, resolveAuthor } from '@/lib/utils'

export const revalidate = 300 // 5 minutes

// Escape XML special characters to prevent XSS
function escapeXml(str: string | null | undefined): string {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Escape CDATA content to prevent CDATA injection
function escapeCData(str: string | null | undefined): string {
  if (!str) return ''
  // Replace ]]> with ]]]]><![CDATA[> to prevent CDATA breakout
  return str.replace(/]]>/g, ']]]]><![CDATA[>')
}

// Validate and sanitize URL for RSS feed
function sanitizeRssUrl(url: string | null): string | null {
  if (!url) return null
  // Only allow http/https URLs
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // It's a storage path, construct proper URL
    return url
  }
  // Validate it's a proper URL
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return null
    return parsed.href
  } catch {
    return null
  }
}

export async function GET() {
  const supabase = await createClient()
  const baseUrl = SITE_CONFIG.url

  // Get latest published articles
  const { data: articles } = await supabase
    .from('articles')
    .select(
      `
      slug,
      title_ar,
      excerpt_ar,
      cover_image_path,
      published_at,
      author:profiles!articles_author_id_fkey(display_name_ar, is_anonymous),
      section:sections!articles_section_id_fkey(slug)
    `
    )
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50)

  const items = (articles || [])
    .map((article) => {
      const articleData = article as Record<string, unknown>
      const rawImageUrl = getStorageUrl(articleData.cover_image_path as string | null)
      const imageUrl = rawImageUrl ? escapeXml(sanitizeRssUrl(rawImageUrl) || rawImageUrl) : null
      const pubDate = new Date(articleData.published_at as string).toUTCString()
      const sectionSlug = (articleData.section as { slug: string } | null)?.slug
      const authorData = resolveAuthor(
        articleData.author as { display_name_ar: string; is_anonymous?: boolean } | null,
        sectionSlug
      )
      const slug = escapeXml(articleData.slug as string)
      const authorName = escapeXml(authorData?.display_name_ar || SITE_CONFIG.nameAr)

      return `
    <item>
      <title><![CDATA[${escapeCData(articleData.title_ar as string)}]]></title>
      <link>${baseUrl}/article/${slug}</link>
      <description><![CDATA[${escapeCData((articleData.excerpt_ar || articleData.title_ar) as string)}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${baseUrl}/article/${slug}</guid>
      <author>${authorName}</author>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ''}
    </item>`
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_CONFIG.nameAr}</title>
    <link>${baseUrl}</link>
    <description>${SITE_CONFIG.description}</description>
    <language>ar</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate',
    },
  })
}
