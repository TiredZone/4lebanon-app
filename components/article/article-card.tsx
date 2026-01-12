import Image from 'next/image'
import Link from 'next/link'
import { formatDateAr, formatRelativeTimeAr, getStorageUrl } from '@/lib/utils'
import type { ArticleListItem } from '@/types/database'

interface ArticleCardProps {
  article: ArticleListItem
  variant?: 'default' | 'featured' | 'compact' | 'horizontal'
  showExcerpt?: boolean
  showAuthor?: boolean
  showSection?: boolean
}

export function ArticleCard({
  article,
  variant = 'default',
  showExcerpt = false,
  showAuthor = true,
  showSection = true,
}: ArticleCardProps) {
  const imageUrl = getStorageUrl(article.cover_image_path)

  if (variant === 'featured') {
    return (
      <article className="group relative overflow-hidden rounded-lg bg-black">
        {/* Image */}
        <div className="aspect-[16/9] w-full">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title_ar}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          ) : (
            <div className="from-primary to-primary-dark h-full w-full bg-gradient-to-br" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-x-0 bottom-0 p-6">
          {/* Breaking badge */}
          {article.is_breaking && (
            <span className="bg-primary mb-3 inline-block rounded px-2 py-1 text-xs font-bold text-white">
              عاجل
            </span>
          )}

          {/* Section */}
          {showSection && article.section && (
            <Link
              href={`/section/${article.section.slug}`}
              className="text-accent mb-2 inline-block text-sm font-medium hover:underline"
            >
              {article.section.name_ar}
            </Link>
          )}

          {/* Title */}
          <h2 className="mb-3 text-2xl leading-tight font-bold text-white md:text-3xl">
            <Link href={`/article/${article.slug}`} className="hover:text-accent">
              {article.title_ar}
            </Link>
          </h2>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm text-white/80">
            {showAuthor && (
              <>
                <Link href={`/author/${article.author.id}`} className="hover:text-accent">
                  {article.author.display_name_ar}
                </Link>
                <span>•</span>
              </>
            )}
            {article.published_at && <time>{formatRelativeTimeAr(article.published_at)}</time>}
          </div>
        </div>
      </article>
    )
  }

  if (variant === 'horizontal') {
    return (
      <article className="card-hover group flex gap-4 rounded-lg bg-white p-4 shadow-sm">
        {/* Image */}
        <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-md">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={article.title_ar}
              fill
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <div className="from-muted to-border h-full w-full bg-gradient-to-br" />
          )}
          {article.is_breaking && (
            <span className="bg-primary absolute top-1 right-1 rounded px-1.5 py-0.5 text-[10px] font-bold text-white">
              عاجل
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          {showSection && article.section && (
            <Link
              href={`/section/${article.section.slug}`}
              className="text-primary mb-1 inline-block text-xs font-medium hover:underline"
            >
              {article.section.name_ar}
            </Link>
          )}
          <h3 className="text-foreground group-hover:text-primary mb-2 line-clamp-2 leading-snug font-bold">
            <Link href={`/article/${article.slug}`}>{article.title_ar}</Link>
          </h3>
          <time className="text-muted-foreground text-xs">
            {article.published_at && formatDateAr(article.published_at, 'dd MMMM yyyy')}
          </time>
        </div>
      </article>
    )
  }

  if (variant === 'compact') {
    return (
      <article className="group border-border flex items-start gap-3 border-b py-3 last:border-0">
        <h3 className="text-foreground group-hover:text-primary flex-1 text-sm leading-snug font-medium">
          <Link href={`/article/${article.slug}`}>{article.title_ar}</Link>
        </h3>
        {article.published_at && (
          <time className="text-muted-foreground shrink-0 text-xs">
            {formatDateAr(article.published_at, 'dd/MM')}
          </time>
        )}
      </article>
    )
  }

  // Default card
  return (
    <article className="card-hover group overflow-hidden rounded-lg bg-white shadow-sm">
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={article.title_ar}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
          />
        ) : (
          <div className="from-muted to-border h-full w-full bg-gradient-to-br" />
        )}
        {article.is_breaking && (
          <span className="bg-primary absolute top-3 right-3 rounded px-2 py-1 text-xs font-bold text-white">
            عاجل
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {showSection && article.section && (
          <Link
            href={`/section/${article.section.slug}`}
            className="text-primary mb-2 inline-block text-xs font-medium hover:underline"
          >
            {article.section.name_ar}
          </Link>
        )}
        <h3 className="text-foreground group-hover:text-primary mb-2 line-clamp-2 text-lg leading-snug font-bold">
          <Link href={`/article/${article.slug}`}>{article.title_ar}</Link>
        </h3>
        {showExcerpt && article.excerpt_ar && (
          <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{article.excerpt_ar}</p>
        )}
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          {showAuthor && (
            <Link href={`/author/${article.author.id}`} className="hover:text-primary">
              {article.author.display_name_ar}
            </Link>
          )}
          {article.published_at && (
            <time>{formatDateAr(article.published_at, 'dd MMMM yyyy')}</time>
          )}
        </div>
      </div>
    </article>
  )
}
