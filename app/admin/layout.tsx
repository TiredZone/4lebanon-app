import Link from 'next/link'
import { SITE_CONFIG } from '@/lib/constants'

export const metadata = {
  title: {
    default: 'لوحة التحكم',
    template: `%s | لوحة التحكم - ${SITE_CONFIG.nameAr}`,
  },
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted min-h-screen">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/admin" className="flex items-baseline gap-1 text-xl font-bold">
              <span className="text-2xl text-black">4</span>
              <span className="text-primary">Lebanon</span>
              <span className="text-muted-foreground mr-2 text-sm font-normal">لوحة التحكم</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-primary text-sm font-medium"
              >
                مقالاتي
              </Link>
              <Link
                href="/admin/articles/new"
                className="bg-primary hover:bg-primary-dark rounded-lg px-4 py-2 text-sm font-medium text-white"
              >
                مقال جديد
              </Link>
              <Link
                href="/"
                className="text-muted-foreground hover:text-primary text-sm font-medium"
                target="_blank"
              >
                زيارة الموقع
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  )
}
