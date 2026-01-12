import { ArticleCard } from './article-card'
import type { ArticleListItem } from '@/types/database'

interface ArticleGridProps {
  articles: ArticleListItem[]
  columns?: 2 | 3 | 4
  showExcerpt?: boolean
  showAuthor?: boolean
  showSection?: boolean
}

export function ArticleGrid({
  articles,
  columns = 3,
  showExcerpt = false,
  showAuthor = true,
  showSection = true,
}: ArticleGridProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  }

  return (
    <div className={`grid gap-6 ${gridCols[columns]}`}>
      {articles.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          showExcerpt={showExcerpt}
          showAuthor={showAuthor}
          showSection={showSection}
        />
      ))}
    </div>
  )
}

// Featured layout with one large and multiple small cards
interface FeaturedGridProps {
  featured: ArticleListItem
  articles: ArticleListItem[]
}

export function FeaturedGrid({ featured, articles }: FeaturedGridProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Featured article */}
      <div className="lg:col-span-2">
        <ArticleCard article={featured} variant="featured" />
      </div>

      {/* Secondary articles */}
      <div className="flex flex-col gap-4">
        {articles.slice(0, 3).map((article) => (
          <ArticleCard key={article.id} article={article} variant="horizontal" />
        ))}
      </div>
    </div>
  )
}

// Section with title and articles
interface SectionGridProps {
  title: string
  titleHref?: string
  articles: ArticleListItem[]
  columns?: 2 | 3 | 4
}

export function SectionGrid({ title, titleHref, articles, columns = 3 }: SectionGridProps) {
  return (
    <section className="py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-foreground text-xl font-bold">{title}</h2>
        {titleHref && (
          <a
            href={titleHref}
            className="text-primary flex items-center gap-1 text-sm font-medium hover:underline"
          >
            <span>المزيد</span>
            <svg
              className="h-4 w-4 rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>
      <ArticleGrid articles={articles} columns={columns} />
    </section>
  )
}
