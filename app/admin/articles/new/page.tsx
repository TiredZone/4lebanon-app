import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ArticleEditor } from '@/components/admin/article-editor'
import type { Section, Region, Country, Topic } from '@/types/database'

export const dynamic = 'force-dynamic'

async function getFormData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const [sections, regions, countries, topics] = await Promise.all([
    supabase.from('sections').select('*').order('sort_order'),
    supabase.from('regions').select('*').order('sort_order'),
    supabase.from('countries').select('*').order('sort_order'),
    supabase.from('topics').select('*').order('sort_order'),
  ])

  return {
    sections: (sections.data || []) as Section[],
    regions: (regions.data || []) as Region[],
    countries: (countries.data || []) as Country[],
    topics: (topics.data || []) as Topic[],
  }
}

export default async function NewArticlePage() {
  const formData = await getFormData()

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
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
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-[#c61b23] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#a01519]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          إنشاء مقال جديد
        </Link>
      </div>
      <ArticleEditor
        mode="create"
        sections={formData.sections}
        regions={formData.regions}
        countries={formData.countries}
        topics={formData.topics}
      />
    </div>
  )
}
