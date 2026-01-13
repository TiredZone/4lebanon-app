import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Image from 'next/image'
import type { Profile } from '@/types/database'

export const revalidate = 120

async function getAllWriters() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .order('display_name_ar', { ascending: true })

  return (data || []) as Profile[]
}

export default async function WritersPage() {
  const writers = await getAllWriters()

  return (
    <div className="bg-muted min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <header className="mb-8">
          <h1 className="text-foreground text-4xl font-bold">كتّابنا</h1>
          <p className="text-muted-foreground mt-2">تعرّف على الكتّاب والصحفيين في فريق 4 لبنان</p>
        </header>

        {writers.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {writers.map((writer) => (
              <Link
                key={writer.id}
                href={`/author/${writer.id}`}
                className="group block overflow-hidden rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex justify-center">
                  <div className="group-hover:ring-primary h-24 w-24 overflow-hidden rounded-full ring-2 ring-transparent transition-all">
                    {writer.avatar_url ? (
                      <Image
                        src={writer.avatar_url}
                        alt={writer.display_name_ar}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="from-primary to-primary-dark flex h-full w-full items-center justify-center bg-gradient-to-br text-2xl font-bold text-white">
                        {writer.display_name_ar?.[0] || 'ك'}
                      </div>
                    )}
                  </div>
                </div>
                <h2 className="text-foreground group-hover:text-primary mb-2 text-center text-lg font-bold transition-colors">
                  {writer.display_name_ar}
                </h2>
                {writer.bio_ar && (
                  <p className="text-muted-foreground line-clamp-2 text-center text-sm">
                    {writer.bio_ar}
                  </p>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex min-h-[400px] items-center justify-center rounded-lg bg-white p-8 text-center shadow-sm">
            <div>
              <svg
                className="text-muted-foreground mx-auto mb-4 h-16 w-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <h2 className="text-foreground mb-2 text-xl font-bold">لا يوجد كتّاب حالياً</h2>
              <p className="text-muted-foreground">لم يتم إضافة أي كتّاب بعد</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
