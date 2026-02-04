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
    <div className="admin-page-bg">
      <main className="admin-main">{children}</main>
    </div>
  )
}
