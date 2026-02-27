import { SITE_CONFIG } from '@/lib/constants'

interface JsonLdProps {
  data: Record<string, unknown>
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: SITE_CONFIG.nameAr,
    alternateName: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    description: SITE_CONFIG.description,
    inLanguage: 'ar',
  }
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_CONFIG.nameAr,
    url: SITE_CONFIG.url,
    inLanguage: 'ar',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

export function newsArticleJsonLd(article: {
  title: string
  description?: string | null
  published_at?: string | null
  updated_at?: string | null
  imageUrl?: string | null
  authorName?: string | null
  slug: string
  sectionName?: string | null
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.description || article.title,
    datePublished: article.published_at || undefined,
    dateModified: article.updated_at || article.published_at || undefined,
    image: article.imageUrl || undefined,
    author: article.authorName ? { '@type': 'Person', name: article.authorName } : undefined,
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.nameAr,
      url: SITE_CONFIG.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_CONFIG.url}/article/${article.slug}`,
    },
    inLanguage: 'ar',
    isAccessibleForFree: true,
    articleSection: article.sectionName || undefined,
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}
