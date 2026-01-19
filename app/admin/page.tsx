import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatDateAr, getStatusLabelAr, getStatusBadgeClass } from '@/lib/utils'
import { ArticlesTable } from '@/components/admin/articles-table'
import type { Article, Section, Profile } from '@/types/database'

// Admin pages are dynamic
export const dynamic = 'force-dynamic'

interface ArticleWithSection extends Article {
  section: Section | null
}

async function getDashboardData(): Promise<{
  articles: ArticleWithSection[]
  profile: Profile | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const [articlesData, profileData] = await Promise.all([
    supabase
      .from('articles')
      .select(
        `
        *,
        section:sections(*)
      `
      )
      .eq('author_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase.from('profiles').select('*').eq('id', user.id).single(),
  ])

  return {
    articles: (articlesData.data || []) as ArticleWithSection[],
    profile: profileData.data as Profile | null,
  }
}

export default async function AdminDashboardPage() {
  const { articles, profile } = await getDashboardData()

  const draftCount = articles.filter((a) => a.status === 'draft').length
  const scheduledCount = articles.filter((a) => a.status === 'scheduled').length
  const publishedCount = articles.filter((a) => a.status === 'published').length
  const breakingCount = articles.filter((a) => a.is_breaking).length
  const featuredCount = articles.filter((a) => a.is_featured).length

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground mb-2 text-3xl font-bold">
              مرحباً، {profile?.display_name_ar || 'الكاتب'}
            </h1>
            <p className="text-muted-foreground">لوحة التحكم - إدارة مقالاتك ومحتواك</p>
          </div>
          <Link
            href="/admin/articles/new"
            className="bg-primary hover:bg-primary-dark flex items-center gap-2 rounded-lg px-6 py-3 text-lg font-medium text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            إنشاء مقال جديد
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Link
          href="/admin/articles/new"
          className="group rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold">كتابة مقال</h3>
          <p className="text-muted-foreground text-sm">ابدأ بكتابة مقال جديد ونشره على الموقع</p>
        </Link>

        <Link
          href="/"
          target="_blank"
          className="group rounded-lg bg-white p-6 shadow-sm transition-all hover:shadow-md"
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
            <svg
              className="h-6 w-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold">زيارة الموقع</h3>
          <p className="text-muted-foreground text-sm">شاهد مقالاتك المنشورة على الموقع الرئيسي</p>
        </Link>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
            <svg
              className="h-6 w-6 text-purple-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h3 className="mb-1 text-lg font-bold">ملفك الشخصي</h3>
          <p className="text-muted-foreground text-sm">
            {profile?.display_name_ar || 'قم بتحديث معلوماتك'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-6">
        <StatCard label="الإجمالي" value={articles.length} color="blue" icon="total" />
        <StatCard label="منشور" value={publishedCount} color="green" icon="published" />
        <StatCard label="مسودات" value={draftCount} color="gray" icon="draft" />
        <StatCard label="مجدول" value={scheduledCount} color="yellow" icon="scheduled" />
        <StatCard label="عاجل" value={breakingCount} color="red" icon="breaking" />
        <StatCard label="مميز" value={featuredCount} color="purple" icon="featured" />
      </div>

      {/* Articles header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-foreground text-xl font-bold">مقالاتي ({articles.length})</h2>
      </div>

      {/* Articles Table with Search & Filter */}
      <ArticlesTable articles={articles} />
    </div>
  )
}

function StatCard({
  label,
  value,
  color = 'blue',
  icon = 'total',
}: {
  label: string
  value: number
  color?: 'blue' | 'gray' | 'yellow' | 'green' | 'red' | 'purple'
  icon?: 'total' | 'draft' | 'scheduled' | 'published' | 'breaking' | 'featured'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    gray: 'bg-gray-50 border-gray-200',
    yellow: 'bg-yellow-50 border-yellow-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
    purple: 'bg-purple-50 border-purple-200',
  }

  const textColors = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    yellow: 'text-yellow-600',
    green: 'text-green-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
  }

  const icons = {
    total: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    ),
    draft: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
      />
    ),
    scheduled: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    published: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    ),
    breaking: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    ),
    featured: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
      />
    ),
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="mb-2 flex items-center justify-between">
        <p className={`text-sm font-medium ${textColors[color]}`}>{label}</p>
        <svg
          className={`h-5 w-5 ${textColors[color]} opacity-60`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icons[icon]}
        </svg>
      </div>
      <p className={`text-3xl font-bold ${textColors[color]}`}>{value}</p>
    </div>
  )
}
