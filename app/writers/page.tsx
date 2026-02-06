import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
import type { Profile } from '@/types/database'

export const revalidate = 120

async function getAllWriters() {
  const supabase = await createClient()

  // Only show writers who have published at least one article
  const { data } = await supabase
    .from('profiles')
    .select('*, articles!articles_author_id_fkey(id)')
    .order('display_name_ar', { ascending: true })

  // Filter to profiles that have at least one published article
  const writers = ((data || []) as (Profile & { articles: { id: string }[] })[])
    .filter((p) => p.articles && p.articles.length > 0)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ articles: _articles, ...profile }) => profile)

  return writers as Profile[]
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
                  {writer.avatar_url ? (
                    <Image
                      src={getStorageUrl(writer.avatar_url)}
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
