import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface TrendingArticle {
  id: string
  slug: string
  title_ar: string
}

async function getTrendingArticles(): Promise<TrendingArticle[]> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data } = await supabase
    .from('articles')
    .select('id, slug, title_ar')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('view_count', { ascending: false })
    .limit(5)

  return (data || []) as TrendingArticle[]
}

export async function TrendingSidebar() {
  const articles = await getTrendingArticles()

  if (articles.length === 0) return null

  return (
    <aside className="article-trending-sidebar">
      <div className="trending-widget">
        <h3 className="trending-widget-title">الأكثر قراءة</h3>
        <div>
          {articles.map((article, index) => (
            <Link key={article.id} href={`/article/${article.slug}`} className="trending-item">
              <span className="trending-item-number">{index + 1}</span>
              <span className="trending-item-title">{article.title_ar}</span>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  )
}
