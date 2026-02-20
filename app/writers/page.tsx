import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
import type { Profile } from '@/types/database'

export const metadata: Metadata = {
  title: 'كتّابنا',
  description: 'تعرّف على الكتّاب والصحفيين في فريق 4 لبنان',
}

export const revalidate = 120

async function getAllWriters() {
  const supabase = await createClient()
  const now = new Date().toISOString()

  // Only show authors who have at least one published article
  const { data: authorRows } = await supabase
    .from('articles')
    .select('author_id')
    .eq('status', 'published')
    .not('published_at', 'is', null)
    .lte('published_at', now)

  const uniqueAuthorIds = [...new Set((authorRows || []).map((r) => r.author_id).filter(Boolean))]

  if (uniqueAuthorIds.length === 0) return []

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueAuthorIds)
    .order('display_name_ar', { ascending: true })

  return (data || []) as Profile[]
}

export default async function WritersPage() {
  const writers = await getAllWriters()

  return (
    <div className="authors-page-bg">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        {/* Category Header - Centered */}
        <header className="category-header">
          <h1>كتّابنا</h1>
          <p>تعرّف على الكتّاب والصحفيين في فريق 4 لبنان</p>
        </header>

        {/* Writers Grid */}
        {writers.length > 0 ? (
          <div className="category-grid">
            {writers.map((writer, index) => (
              <Link
                key={writer.id}
                href={`/author/${writer.id}`}
                className="glass-author-card stagger-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Avatar */}
                <div className="author-avatar">
                  {writer.avatar_url && getStorageUrl(writer.avatar_url) ? (
                    <Image
                      src={getStorageUrl(writer.avatar_url)!}
                      alt={writer.display_name_ar}
                      width={120}
                      height={120}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#c61b23] to-[#a01519] text-2xl font-bold text-white sm:text-3xl">
                      {writer.display_name_ar?.[0] || 'ك'}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h2 className="author-name">{writer.display_name_ar}</h2>

                {/* Bio */}
                {writer.bio_ar && <p className="author-bio">{writer.bio_ar}</p>}
              </Link>
            ))}
          </div>
        ) : (
          <div className="glass-author-card mx-auto max-w-md p-8 text-center">
            <p className="text-gray-500">لا يوجد كتّاب حالياً.</p>
          </div>
        )}
      </div>
    </div>
  )
}
