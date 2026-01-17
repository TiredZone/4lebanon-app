import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticleEditor } from '@/components/admin/article-editor'
import type { Article, Section, Region, Country, Topic } from '@/types/database'

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

  // Get article with topics
  const { data: article } = await supabase
    .from('articles')
    .select(
      `
      *,
      article_topics(topic_id)
    `
    )
    .eq('id', articleId)
    .eq('author_id', user.id) // RLS enforces this, but double check
    .single()

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

  const { article, sections, regions, countries, topics } = data
  const topicIds = article.article_topics.map((at) => at.topic_id)

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة إلى لوحة التحكم
        </Link>
        <Link href="/admin/articles/new" className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          كتابة مقال جديد
        </Link>
      </div>
      <h1 className="text-foreground mb-2 text-3xl font-bold">✏️ تعديل المقال</h1>
      <p className="text-muted-foreground mb-8">قم بتحديث المعلومات الخاصة بالمقال</p>
      <ArticleEditor
        mode="edit"
        article={article}
        topicIds={topicIds}
        sections={sections}
        regions={regions}
        countries={countries}
        topics={topics}
      />
    </div>
  )
}
