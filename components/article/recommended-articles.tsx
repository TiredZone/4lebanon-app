import Link from 'next/link'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
import type { ArticleListItem } from '@/types/database'

interface RecommendedArticlesProps {
  articles: ArticleListItem[]
}

export function RecommendedArticles({ articles }: RecommendedArticlesProps) {
  if (articles.length === 0) return null

  return (
    <section className="article-recommended">
      <h2 className="article-recommended-title">اخترنا لكم</h2>
      <div className="article-recommended-grid">
        {articles.slice(0, 3).map((article) => {
          const imageUrl = getStorageUrl(article.cover_image_path)

          return (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="recommended-card group"
            >
              <div className="card-image">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={article.title_ar}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                ) : (
                  <div className="image-fallback h-full w-full" />
                )}
              </div>
              <div className="card-content">
                <h3 className="card-title">{article.title_ar}</h3>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
