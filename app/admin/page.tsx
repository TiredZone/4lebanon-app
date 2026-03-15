import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticlesTable } from '@/components/admin/articles-table'
import { DeletionToast } from '@/components/admin/deletion-toast'
import type { Article, Section, Profile, UserRole } from '@/types/database'

// Admin pages are dynamic
export const dynamic = 'force-dynamic'

interface ArticleWithSection extends Article {
  section: Section | null
  author?: { id: string; display_name_ar: string } | null
}

async function getDashboardData(): Promise<{
  articles: ArticleWithSection[]
  profile: Profile | null
  role: UserRole
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()
  const role = ((profileData as Profile | null)?.role || 'editor') as UserRole
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin'
  const canSeeOthers = isSuperAdmin || isAdmin

  // Super admin sees all articles; admin sees own + editors' articles; editor sees own only
  let articlesQuery = supabase
    .from('articles')
    .select(
      canSeeOthers
        ? `*, section:sections(*), author:profiles!author_id(id, display_name_ar, role)`
        : `*, section:sections(*)`
    )

  if (!canSeeOthers) {
    articlesQuery = articlesQuery.eq('author_id', user.id)
  }

  const { data: articlesData } = await articlesQuery
    .order('priority', { ascending: true })
    .order('sort_position', { ascending: false })

  return {
    articles: (articlesData || []) as unknown as ArticleWithSection[],
    profile: profileData as Profile | null,
    role,
  }
}

export default async function AdminDashboardPage() {
  const { articles, role } = await getDashboardData()
  const isSuperAdmin = role === 'super_admin'
  const isAdmin = role === 'admin'
  const canManageOthers = isSuperAdmin || isAdmin

  const draftCount = articles.filter((a) => a.status === 'draft').length
  const scheduledCount = articles.filter((a) => a.status === 'scheduled').length
  const publishedCount = articles.filter((a) => a.status === 'published').length
  const breakingCount = articles.filter((a) => a.is_breaking).length
  const featuredCount = articles.filter((a) => a.is_featured).length

  return (
    <div>
      <DeletionToast />
      {/* Quick Actions - 3 Cards */}
      <div className="admin-quick-actions">
        <Link href="/admin/articles/new" className="admin-action-card primary-card">
          <div className="admin-action-icon green">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </div>
          <h3>كتابة مقال</h3>
          <p>ابدأ بكتابة مقال جديد ونشره على الموقع</p>
        </Link>

        {canManageOthers && (
          <Link href="/admin/priority" className="admin-action-card primary-card">
            <div className="admin-action-icon purple">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 10h16M4 14h16M4 18h16"
                />
              </svg>
            </div>
            <h3>إدارة الأولويات</h3>
            <p>إعادة ترتيب المقالات وتغيير أولوياتها</p>
          </Link>
        )}

        {isSuperAdmin && (
          <Link href="/admin/sections/new" className="admin-action-card primary-card">
            <div className="admin-action-icon purple">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3>إضافة قسم</h3>
            <p>أنشئ قسم جديد لتصنيف المقالات</p>
          </Link>
        )}

        <Link href="/" target="_blank" className="admin-action-card">
          <div className="admin-action-icon blue">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
              />
            </svg>
          </div>
          <h3>زيارة الموقع</h3>
          <p>شاهد مقالاتك المنشورة على الموقع الرئيسي</p>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <StatCard label="الإجمالي" value={articles.length} color="blue" icon="total" />
        <StatCard label="منشور" value={publishedCount} color="green" icon="published" />
        <StatCard label="مسودات" value={draftCount} color="gray" icon="draft" />
        <StatCard label="مجدول" value={scheduledCount} color="yellow" icon="scheduled" />
        <StatCard label="عاجل" value={breakingCount} color="red" icon="breaking" />
        <StatCard label="مميز" value={featuredCount} color="purple" icon="featured" />
      </div>

      {/* Articles Section Header */}
      <div className="admin-section-header">
        <h2 className="admin-section-title">
          {canManageOthers ? `جميع المقالات (${articles.length})` : `مقالاتي (${articles.length})`}
        </h2>
      </div>

      {/* Articles Table with Search & Filter */}
      <ArticlesTable articles={articles} showAuthor={canManageOthers} />
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
    <div className={`admin-stat-card ${color}`}>
      <div className="admin-stat-header">
        <p className={`admin-stat-label ${color}`}>{label}</p>
        <svg
          className={`admin-stat-icon ${color}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {icons[icon]}
        </svg>
      </div>
      <p className={`admin-stat-value ${color}`}>{value}</p>
    </div>
  )
}
