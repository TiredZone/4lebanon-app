'use client'

import Link from 'next/link'
import Image from 'next/image'
import { getStorageUrl, formatDateAr, resolveAuthor } from '@/lib/utils'
import type { ArticleListItem } from '@/types/database'

interface GlassEditorialCardProps {
  article: ArticleListItem
  index?: number
  variant?: 'default' | 'exclusive'
}

export function GlassEditorialCard({
  article,
  index = 0,
  variant = 'default',
}: GlassEditorialCardProps) {
  const cardClass = variant === 'exclusive' ? 'glass-exclusive-card' : 'glass-editorial-card'
  const author = resolveAuthor(article.author, article.is_breaking)

  return (
    <Link
      href={`/article/${article.slug}`}
      className={`${cardClass} stagger-in block`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Container */}
      <div className="card-image">
        {article.cover_image_path ? (
          <Image
            src={getStorageUrl(article.cover_image_path)!}
            alt={article.title_ar}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="image-fallback h-full w-full" />
        )}
      </div>

      {/* Content */}
      <div className="card-content">
        {/* Exclusive Badge */}
        {variant === 'exclusive' && (
          <span className="exclusive-badge mb-2 inline-block">
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            خاص
          </span>
        )}

        {/* Title */}
        <h3 className="card-title">{article.title_ar}</h3>

        {/* Meta */}
        <div className="card-meta">
          {author?.display_name_ar && <span>{author.display_name_ar}</span>}
          {article.published_at && (
            <>
              {author?.display_name_ar && <span>•</span>}
              <time>{formatDateAr(new Date(article.published_at), 'dd MMMM yyyy')}</time>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
