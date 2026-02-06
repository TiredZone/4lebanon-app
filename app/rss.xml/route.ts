import { createServiceClient } from '@/lib/supabase/server'
import { SITE_CONFIG } from '@/lib/constants'
import { getStorageUrl } from '@/lib/utils'

export const revalidate = 300 // 5 minutes

export async function GET() {
  const supabase = await createServiceClient()
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
      author:profiles!articles_author_id_fkey(display_name_ar)
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
      const imageUrl = getStorageUrl(articleData.cover_image_path as string | null)
      const pubDate = new Date(articleData.published_at as string).toUTCString()
      const authorData = articleData.author as { display_name_ar: string } | null

      return `
    <item>
      <title><![CDATA[${articleData.title_ar}]]></title>
      <link>${baseUrl}/article/${articleData.slug}</link>
      <description><![CDATA[${articleData.excerpt_ar || articleData.title_ar}]]></description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${baseUrl}/article/${articleData.slug}</guid>
      <author>${authorData?.display_name_ar || SITE_CONFIG.nameAr}</author>
      <dc:creator><![CDATA[${authorData?.display_name_ar || SITE_CONFIG.nameAr}]]></dc:creator>
      ${imageUrl ? `<enclosure url="${imageUrl}" type="image/jpeg" />` : ''}
    </item>`
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
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
