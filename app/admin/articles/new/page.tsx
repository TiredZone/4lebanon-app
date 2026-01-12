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
      <h1 className="text-foreground mb-8 text-2xl font-bold">مقال جديد</h1>
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
