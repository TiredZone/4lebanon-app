import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PriorityBoard } from '@/components/admin/priority-board'
import type { Profile, UserRole } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PriorityArticle {
  id: string
  title_ar: string
  priority: number
  sort_position: number
  status: string
  published_at: string | null
  author: { id: string; display_name_ar: string } | null
}

async function getPriorityData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/admin/login')

  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = ((profileData as Profile | null)?.role || 'editor') as UserRole

  // Only super_admin and admin can access this page
  if (role === 'editor') {
    redirect('/admin')
  }

  let articlesQuery = supabase
    .from('articles')
    .select(
      'id, title_ar, priority, sort_position, status, published_at, author:profiles!author_id(id, display_name_ar)'
    )
    .eq('status', 'published')

  // Admin can only manage own + editor articles (not other admins')
  if (role === 'admin') {
    const { data: editors } = await supabase.from('profiles').select('id').eq('role', 'editor')
    const allowedIds = [user.id, ...(editors || []).map((e) => (e as { id: string }).id)]
    articlesQuery = articlesQuery.in('author_id', allowedIds)
  }

  const { data: articles } = await articlesQuery
    .order('priority', { ascending: true })
    .order('sort_position', { ascending: false })

  return {
    articles: (articles || []) as unknown as PriorityArticle[],
    role,
  }
}

export default async function PriorityPage() {
  const { articles, role } = await getPriorityData()

  return (
    <div>
      <div className="editor-page-header">
        <h1 className="editor-page-title">إدارة الأولويات</h1>
        <Link href="/admin" className="editor-back-btn">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          العودة إلى لوحة التحكم
        </Link>
      </div>
      <PriorityBoard articles={articles} userRole={role} />
    </div>
  )
}
