# 4Lebanon Performance Strategy

## Overview

This document outlines the caching and performance strategy for the 4Lebanon news website.

## Caching Architecture

### ISR (Incremental Static Regeneration)

We use Next.js ISR to balance freshness with performance:

| Route                     | Revalidate Time | Rationale                             |
| ------------------------- | --------------- | ------------------------------------- |
| Homepage `/`              | 120s (2 min)    | Most visited, needs frequent updates  |
| Section `/section/[slug]` | 180s (3 min)    | Category listings, moderate freshness |
| Article `/article/[slug]` | 600s (10 min)   | Individual articles change rarely     |
| Author `/author/[id]`     | 300s (5 min)    | Author pages update with new articles |
| RSS `/rss.xml`            | 300s (5 min)    | Feed readers expect regular updates   |
| Sitemap `/sitemap.xml`    | 3600s (1 hr)    | SEO crawlers don't need real-time     |
| Search `/search`          | Dynamic         | Must show latest results              |
| Admin `/*`                | Dynamic         | No caching, always fresh              |

### On-Demand Revalidation

When articles are published/updated, we trigger immediate revalidation:

```typescript
// In server actions after save
revalidatePath('/')
revalidatePath(`/article/${slug}`)
revalidatePath('/rss.xml')
```

This ensures:

- Homepage shows new articles immediately
- Article pages reflect edits instantly
- RSS feed updates for subscribers

### Database Caching

Supabase handles connection pooling and query optimization. Key indexes:

```sql
-- Primary listing queries
CREATE INDEX idx_articles_published ON articles (published_at DESC)
  WHERE status IN ('published', 'scheduled');

-- Full-text search
CREATE INDEX idx_articles_fts ON articles USING GIN (search_vector);

-- Author dashboard
CREATE INDEX idx_articles_author ON articles (author_id, updated_at DESC);
```

## Performance Optimizations

### 1. Image Optimization

- Next.js `Image` component with automatic WebP/AVIF
- Responsive `sizes` attribute for correct image loading
- Supabase Storage CDN for image delivery
- 1-year cache headers for images

### 2. Font Loading

```tsx
// Optimized font loading with display: swap
const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  display: 'swap', // Prevents FOIT
})
```

### 3. Code Splitting

- Automatic route-based code splitting by Next.js
- Client components marked with `'use client'`
- Server Components for data fetching (zero JS shipped)

### 4. Data Fetching Patterns

```typescript
// Parallel data fetching
const [articles, sections, authors] = await Promise.all([
  getArticles(),
  getSections(),
  getAuthors(),
])
```

### 5. Pagination

- Server-side pagination with `LIMIT/OFFSET`
- Page size: 12-20 items per page
- No infinite scroll (better for SEO)

## Trade-offs

### Freshness vs Performance

| Decision             | Trade-off                                                       |
| -------------------- | --------------------------------------------------------------- |
| 2-min homepage cache | Slight delay in showing breaking news, but 30x fewer DB queries |
| 10-min article cache | Edits take up to 10 min to appear, but excellent performance    |
| Dynamic search       | Always fresh but no caching benefit                             |

### Scheduled Publishing

Instead of cron jobs (which add complexity), we use:

1. Store `published_at` timestamp in future
2. RLS policy filters by `published_at <= NOW()`
3. ISR revalidation naturally picks up newly-visible articles

**Trade-off**: Up to 2-3 minute delay when scheduled time arrives. For true instant publishing, use the revalidation webhook.

## Monitoring

### Key Metrics to Watch

1. **Time to First Byte (TTFB)**: Should be <200ms for cached pages
2. **Largest Contentful Paint (LCP)**: Target <2.5s
3. **Cumulative Layout Shift (CLS)**: Target <0.1
4. **Cache Hit Rate**: Monitor in Vercel Analytics

### Vercel Analytics

Enable in `next.config.ts`:

```typescript
experimental: {
  webVitals: true,
}
```

## Scaling Considerations

### Current Limits (MVP)

- ~1000 articles in sitemap
- 50 articles in RSS
- 12-20 articles per page

### Future Scaling

If traffic grows significantly:

1. **Add Redis**: Cache hot queries (most read, breaking news)
2. **Edge Caching**: Use Vercel Edge for regional content
3. **CDN for images**: Already using Supabase Storage CDN
4. **Read replicas**: Supabase Pro supports this

## Estimated Response Times

| Action                 | Target Time |
| ---------------------- | ----------- |
| Homepage load (cached) | <100ms      |
| Article page (cached)  | <100ms      |
| Search query           | <500ms      |
| Admin dashboard        | <300ms      |
| Image thumbnail        | <50ms (CDN) |
