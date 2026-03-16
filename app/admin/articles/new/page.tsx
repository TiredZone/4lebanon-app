import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticleEditor } from '@/components/admin/article-editor'
import type { Section, Region, Country, Topic, UserRole } from '@/types/database'

export const dynamic = 'force-dynamic'

type FormDataResult =
  | {
      ok: true
      userRole: UserRole
      sections: Section[]
      regions: Region[]
      countries: Country[]
      topics: Topic[]
    }
  | { ok: false; errorMessage: string; errorStack: string }

async function getFormData(): Promise<FormDataResult> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/admin/login')
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
    }

    const userRole = ((profile as { role: string } | null)?.role || 'editor') as UserRole

    const [sections, regions, countries, topics] = await Promise.all([
      supabase.from('sections').select('*').order('sort_order'),
      supabase.from('regions').select('*').order('sort_order'),
      supabase.from('countries').select('*').order('sort_order'),
      supabase.from('topics').select('*').order('sort_order'),
    ])

    return {
      ok: true,
      userRole,
      sections: (sections.data || []) as Section[],
      regions: (regions.data || []) as Region[],
      countries: (countries.data || []) as Country[],
      topics: (topics.data || []) as Topic[],
    }
  } catch (error) {
    // Re-throw redirect
    if (error instanceof Error && 'digest' in error) {
      throw error
    }
    const message = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack || '' : ''
    console.error('getFormData error:', message, stack)
    return { ok: false, errorMessage: message, errorStack: stack }
  }
}

export default async function NewArticlePage() {
  const result = await getFormData()

  if (!result.ok) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <h1 className="mb-4 text-xl font-bold text-red-700">خطأ في تحميل الصفحة</h1>
        <p className="mb-4 text-gray-600">حدث خطأ أثناء تحميل صفحة إنشاء المقال.</p>
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
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          العودة إلى لوحة التحكم
        </Link>
        <h1 className="editor-page-title">إنشاء مقال جديد</h1>
      </div>

      <ArticleEditor
        mode="create"
        sections={result.sections}
        regions={result.regions}
        countries={result.countries}
        topics={result.topics}
        userRole={result.userRole}
      />
    </div>
  )
}
