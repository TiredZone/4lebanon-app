import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface TickerItem {
  id: string
  slug: string
  title_ar: string
  published_at: string
}

async function getTickerItems(): Promise<TickerItem[]> {
  const supabase = await createClient()

  const now = new Date().toISOString()
  const { data } = await supabase
    .from('articles')
    .select('id, slug, title_ar, published_at')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)
    .order('published_at', { ascending: false })
    .limit(12)

  return (data || []) as TickerItem[]
}

export async function LiveTicker() {
  const items = await getTickerItems()

  if (!items.length) return null

  return (
    <section id="ticker" className="border-border bg-muted border-b py-4">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <h2 className="section-heading text-lg font-bold text-black">على مدار الساعة</h2>
            <div className="bg-primary mt-1 h-0.5 w-full"></div>
          </div>

          <div className="min-w-0 flex-1">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <time className="text-primary shrink-0 text-sm font-medium">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                      : ''}
                  </time>
                  <Link
                    href={`/article/${item.slug}`}
                    className="text-foreground hover:text-primary text-sm leading-relaxed transition-colors"
                  >
                    {item.title_ar}
                  </Link>
                </li>
              ))}
            </ul>

            <Link
              href="/recent"
              className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-black hover:underline"
            >
              <span>المزيد</span>
              <svg
                className="h-4 w-4 rotate-180"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// Static version for when we don't have data
export function LiveTickerStatic({ items }: { items: TickerItem[] }) {
  if (!items.length) return null

  return (
    <section id="ticker" className="border-border bg-muted border-b py-4">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-start gap-6">
          <div className="shrink-0">
            <h2 className="section-heading text-lg font-bold text-black">على مدار الساعة</h2>
            <div className="bg-primary mt-1 h-0.5 w-full"></div>
          </div>
          <div className="min-w-0 flex-1">
            <ul className="space-y-2">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <time className="text-primary shrink-0 text-sm font-medium">
                    {item.published_at
                      ? new Date(item.published_at).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        })
                      : ''}
                  </time>
                  <Link
                    href={`/article/${item.slug}`}
                    className="text-foreground hover:text-primary text-sm leading-relaxed transition-colors"
                  >
                    {item.title_ar}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
