import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDateAr, getStatusLabelAr, getStatusBadgeClass } from '@/lib/utils'
import type { Article, Section } from '@/types/database'

// Admin pages are dynamic
export const dynamic = 'force-dynamic'

interface ArticleWithSection extends Article {
  section: Section | null
}

async function getMyArticles(): Promise<ArticleWithSection[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data } = await supabase
    .from('articles')
    .select(
      `
      *,
      section:sections(*)
    `
    )
    .eq('author_id', user.id)
    .order('updated_at', { ascending: false })

  return (data || []) as ArticleWithSection[]
}

export default async function AdminDashboardPage() {
  const articles = await getMyArticles()

  const draftCount = articles.filter((a) => a.status === 'draft').length
  const scheduledCount = articles.filter((a) => a.status === 'scheduled').length
  const publishedCount = articles.filter((a) => a.status === 'published').length

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-foreground text-2xl font-bold">مقالاتي</h1>
        <Link
          href="/admin/articles/new"
          className="bg-primary hover:bg-primary-dark rounded-lg px-4 py-2 font-medium text-white"
        >
          مقال جديد
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <StatCard label="الإجمالي" value={articles.length} />
        <StatCard label="مسودات" value={draftCount} color="gray" />
        <StatCard label="مجدول" value={scheduledCount} color="yellow" />
        <StatCard label="منشور" value={publishedCount} color="green" />
      </div>

      {/* Articles table */}
      {articles.length > 0 ? (
        <div className="overflow-hidden rounded-lg bg-white shadow-sm">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                  العنوان
                </th>
                <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                  القسم
                </th>
                <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                  الحالة
                </th>
                <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                  آخر تحديث
                </th>
                <th className="text-muted-foreground px-6 py-3 text-right text-sm font-medium">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {articles.map((article) => (
                <tr key={article.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/articles/${article.id}/edit`}
                      className="text-foreground hover:text-primary font-medium"
                    >
                      {article.title_ar}
                    </Link>
                    {article.is_breaking && (
                      <span className="bg-primary mr-2 rounded px-1.5 py-0.5 text-[10px] font-bold text-white">
                        عاجل
                      </span>
                    )}
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    {article.section?.name_ar || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeClass(article.status)}`}
                    >
                      {getStatusLabelAr(article.status)}
                    </span>
                  </td>
                  <td className="text-muted-foreground px-6 py-4 text-sm">
                    {formatDateAr(article.updated_at, 'dd/MM/yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/articles/${article.id}/edit`}
                        className="text-primary text-sm hover:underline"
                      >
                        تعديل
                      </Link>
                      {article.status === 'published' && (
                        <Link
                          href={`/article/${article.slug}`}
                          className="text-muted-foreground hover:text-primary text-sm"
                          target="_blank"
                        >
                          عرض
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg bg-white p-8 text-center">
          <p className="text-muted-foreground mb-4">لا توجد مقالات بعد.</p>
          <Link
            href="/admin/articles/new"
            className="bg-primary hover:bg-primary-dark rounded-lg px-6 py-2 font-medium text-white"
          >
            إنشاء مقال جديد
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color = 'primary',
}: {
  label: string
  value: number
  color?: 'primary' | 'gray' | 'yellow' | 'green'
}) {
  const colorClasses = {
    primary: 'bg-primary text-white',
    gray: 'bg-gray-100 text-gray-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    green: 'bg-green-100 text-green-800',
  }

  return (
    <div className={`rounded-lg p-4 ${colorClasses[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}
