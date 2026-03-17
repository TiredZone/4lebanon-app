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
  article_countries: { country_id: number }[]
}

type EditDataResult =
  | {
      ok: true
      article: ArticleWithTopics
      topicIds: number[]
      countryIds: number[]
      userRole: UserRole
      sections: Section[]
      regions: Region[]
      countries: Country[]
      topics: Topic[]
    }
  | { ok: false; notFound?: boolean; errorMessage: string; errorStack: string }

async function getArticleAndFormData(articleId: string): Promise<EditDataResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/admin/login')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const userRole = ((profile as { role: string } | null)?.role || 'editor') as UserRole

    let articleQuery = supabase
      .from('articles')
      .select(
        `
        *,
        article_topics(topic_id),
        article_countries(country_id)
      `
      )
      .eq('id', articleId)

    if (userRole === 'super_admin') {
      // Super admin can edit any article
    } else if (userRole === 'admin') {
      const { data: editors } = await supabase.from('profiles').select('id').eq('role', 'editor')
      const allowedIds = [user.id, ...(editors || []).map((e) => (e as { id: string }).id)]
      articleQuery = articleQuery.in('author_id', allowedIds)
    } else {
      articleQuery = articleQuery.eq('author_id', user.id)
    }

    const { data: article } = await articleQuery.single()

    if (!article) {
      return { ok: false, notFound: true, errorMessage: 'Article not found', errorStack: '' }
    }

    const typedArticle = article as ArticleWithTopics

    const [sections, regions, countries, topics] = await Promise.all([
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('regions').select('*').order('sort_order'),
      supabase.from('countries').select('*').order('sort_order'),
      supabase.from('topics').select('*').order('sort_order'),
    ])

    return {
      ok: true,
      article: typedArticle,
      topicIds: typedArticle.article_topics.map((at) => at.topic_id),
      countryIds: typedArticle.article_countries.map((ac) => ac.country_id),
      userRole,
      sections: (sections.data || []) as Section[],
      regions: (regions.data || []) as Region[],
      countries: (countries.data || []) as Country[],
      topics: (topics.data || []) as Topic[],
    }
  } catch (error) {
    // Re-throw Next.js internal errors (redirect, notFound)
    if (error instanceof Error && 'digest' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack || '' : ''
    console.error('getArticleAndFormData error:', message, stack)
    return { ok: false, errorMessage: message, errorStack: stack }
  }
}

export default async function EditArticlePage({ params }: PageProps) {
  const { id } = await params
  const result = await getArticleAndFormData(id)

  if (!result.ok) {
    if (result.notFound) {
      notFound()
    }
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-4 text-xl font-bold text-red-700">خطأ في تحميل الصفحة</h1>
        <p className="mb-4 text-gray-600">حدث خطأ أثناء تحميل صفحة تعديل المقال.</p>
        <pre className="mb-6 overflow-auto rounded bg-gray-100 p-4 text-xs text-gray-700" dir="ltr">
          {result.errorMessage}
          {'\n'}
          {result.errorStack}
        </pre>
        <Link
          href="/admin"
          className="inline-block rounded-lg bg-[#830005] px-6 py-3 font-medium text-white hover:bg-[#6b0004]"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    )
  }

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
        article={result.article}
        topicIds={result.topicIds}
        countryIds={result.countryIds}
        sections={result.sections}
        regions={result.regions}
        countries={result.countries}
        topics={result.topics}
        userRole={result.userRole}
      />
    </div>
  )
}
