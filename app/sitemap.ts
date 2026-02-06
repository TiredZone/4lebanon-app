import { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import { SITE_CONFIG } from '@/lib/constants'

export const revalidate = 3600 // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createServiceClient()
  const baseUrl = SITE_CONFIG.url

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/recent`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/important`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/writers`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ]

  // Sections
  const { data: sections } = await supabase.from('sections').select('slug, created_at')

  const sectionPages: MetadataRoute.Sitemap = (
    (sections || []) as { slug: string; created_at: string }[]
  ).map((section) => ({
    url: `${baseUrl}/section/${section.slug}`,
    lastModified: new Date(section.created_at),
    changeFrequency: 'hourly' as const,
    priority: 0.8,
  }))

  // Articles (published only - service client bypasses RLS)
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, updated_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(5000) // Google sitemaps support up to 50,000 URLs

  const articlePages: MetadataRoute.Sitemap = (
    (articles || []) as { slug: string; updated_at: string }[]
  ).map((article) => ({
    url: `${baseUrl}/article/${article.slug}`,
    lastModified: new Date(article.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Authors
  const { data: authors } = await supabase.from('profiles').select('id, created_at')

  const authorPages: MetadataRoute.Sitemap = (
    (authors || []) as { id: string; created_at: string }[]
  ).map((author) => ({
    url: `${baseUrl}/author/${author.id}`,
    lastModified: new Date(author.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticPages, ...sectionPages, ...articlePages, ...authorPages]
}
