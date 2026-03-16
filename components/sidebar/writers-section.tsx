import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getStorageUrl } from '@/lib/utils'
import type { Profile } from '@/types/database'

async function getAuthors(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data } = await supabase.from('profiles').select('*').order('display_name_ar').limit(6)

  return (data || []) as Profile[]
}

export async function WritersSection() {
  const authors = await getAuthors()

  if (!authors.length) return null

  return (
    <aside className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="border-primary text-primary mb-4 border-b pb-2 text-lg font-bold">كتّابنا</h2>
      <div className="grid grid-cols-2 gap-4">
        {authors.map((author) => {
          const avatarUrl = getStorageUrl(author.avatar_url)

          return (
            <Link
              key={author.id}
              href={`/author/${author.id}`}
              className="group flex flex-col items-center text-center"
            >
              <div className="bg-muted relative mb-2 h-16 w-16 overflow-hidden rounded-full">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={author.display_name_ar}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="bg-primary flex h-full w-full items-center justify-center text-white">
                    <span className="text-xl font-bold">{author.display_name_ar.charAt(0)}</span>
                  </div>
                )}
              </div>
              <span className="text-foreground group-hover:text-primary text-sm font-medium">
                {author.display_name_ar}
              </span>
            </Link>
          )
        })}
      </div>
      <Link
        href="/writers"
        className="text-primary mt-4 block text-center text-sm font-medium hover:underline"
      >
        عرض الكل
      </Link>
    </aside>
  )
}

// Static version
export function WritersSectionStatic({ authors }: { authors: Profile[] }) {
  if (!authors.length) return null

  return (
    <aside className="rounded-lg bg-white p-4 shadow-sm">
      <h2 className="border-primary text-primary mb-4 border-b pb-2 text-lg font-bold">كتّابنا</h2>
      <div className="grid grid-cols-2 gap-4">
        {authors.map((author) => {
          const avatarUrl = getStorageUrl(author.avatar_url)

          return (
            <Link
              key={author.id}
              href={`/author/${author.id}`}
              className="group flex flex-col items-center text-center"
            >
              <div className="bg-muted relative mb-2 h-16 w-16 overflow-hidden rounded-full">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={author.display_name_ar}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="bg-primary flex h-full w-full items-center justify-center text-white">
                    <span className="text-xl font-bold">{author.display_name_ar.charAt(0)}</span>
                  </div>
                )}
              </div>
              <span className="text-foreground group-hover:text-primary text-sm font-medium">
                {author.display_name_ar}
              </span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
