import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticleEditor } from '@/components/admin/article-editor'
import type { Article, Section, Region, Country, Topic, UserRole } from '@/types/database'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

interface ArticleWithTopics extends Article {
  article_topics: { topic_id: number }[]
}

async function getArticleAndFormData(articleId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Get user role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  const userRole = ((profile as { role: string } | null)?.role || 'editor') as UserRole
  const isSuperAdmin = userRole === 'super_admin'

  // Super admin can edit any article; others can only edit their own
  let articleQuery = supabase
    .from('articles')
    .select(
      `
      *,
      article_topics(topic_id)
    `
    )
    .eq('id', articleId)

  if (!isSuperAdmin) {
    articleQuery = articleQuery.eq('author_id', user.id)
  }

  const { data: article } = await articleQuery.single()

  if (!article) {
    return null
  }

  // Get form data
  const [sections, regions, countries, topics] = await Promise.all([
    supabase.from('sections').select('*').order('sort_order'),
    supabase.from('regions').select('*').order('sort_order'),
    supabase.from('countries').select('*').order('sort_order'),
    supabase.from('topics').select('*').order('sort_order'),
  ])

  return {
    article: article as ArticleWithTopics,
    userRole,
    sections: (sections.data || []) as Section[],
    regions: (regions.data || []) as Region[],
    countries: (countries.data || []) as Country[],
    topics: (topics.data || []) as Topic[],
  }
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params
  const data = await getArticleAndFormData(id)

  if (!data) {
    notFound()
  }

  const { article, userRole, sections, regions, countries, topics } = data
  const topicIds = article.article_topics.map((at) => at.topic_id)

  return (
    <div>
      <div className="editor-page-header">
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
        <h1 className="editor-page-title">تعديل المقال</h1>
      </div>
      <ArticleEditor
        mode="edit"
        article={article}
        topicIds={topicIds}
        sections={sections}
        regions={regions}
        countries={countries}
        topics={topics}
        userRole={userRole}
      />
    </div>
  )
}
