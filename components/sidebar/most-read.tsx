import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PAGINATION } from '@/lib/constants'

interface MostReadArticle {
  id: string
  slug: string
  title_ar: string
  view_count: number
}

async function getMostReadArticles(): Promise<MostReadArticle[]> {
  const supabase = await createClient()

  const now = new Date().toISOString()
  const { data } = await supabase
    .from('articles')
    .select('id, slug, title_ar, view_count')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('view_count', { ascending: false })
    .limit(PAGINATION.mostReadCount)

  return (data || []) as MostReadArticle[]
}

export async function MostRead() {
  const articles = await getMostReadArticles()

  if (!articles.length) return null

  return (
    <aside className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="border-primary text-primary mb-4 border-b pb-2 text-lg font-bold">
        الأكثر قراءة
      </h2>
      <ul className="space-y-3">
        {articles.map((article, index) => (
          <li key={article.id} className="flex items-start gap-3">
            <span className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm font-bold text-white">
              {index + 1}
            </span>
            <Link
              href={`/article/${article.slug}`}
              className="text-foreground hover:text-primary text-sm leading-snug font-medium transition-colors"
            >
              {article.title_ar}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}

// Static version for when we pass data directly
export function MostReadStatic({ articles }: { articles: MostReadArticle[] }) {
  if (!articles.length) return null

  return (
    <aside className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="border-primary text-primary mb-4 border-b pb-2 text-lg font-bold">
        الأكثر قراءة
      </h2>
      <ul className="space-y-3">
        {articles.map((article, index) => (
          <li key={article.id} className="flex items-start gap-3">
            <span className="bg-primary flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm font-bold text-white">
              {index + 1}
            </span>
            <Link
              href={`/article/${article.slug}`}
              className="text-foreground hover:text-primary text-sm leading-snug font-medium transition-colors"
            >
              {article.title_ar}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  )
}
