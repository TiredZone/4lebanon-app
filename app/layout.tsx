import type { Metadata } from 'next'
import { Noto_Kufi_Arabic } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE_CONFIG, DEFAULT_METADATA } from '@/lib/constants'
import { Header, HeaderMobile } from '@/components/layout/header'
import { NavBar } from '@/components/layout/nav-bar'
import { Footer } from '@/components/layout/footer'
import './globals.css'

const notoKufiArabic = Noto_Kufi_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-kufi-arabic',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: DEFAULT_METADATA.title,
    template: `%s | ${SITE_CONFIG.nameAr}`,
  },
  description: DEFAULT_METADATA.description,
  keywords: ['لبنان', 'أخبار', 'سياسة', 'اقتصاد', 'تحليل', 'الشرق الأوسط'],
  authors: [{ name: SITE_CONFIG.nameAr }],
  creator: SITE_CONFIG.nameAr,
  publisher: SITE_CONFIG.nameAr,
  metadataBase: new URL(SITE_CONFIG.url),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/rss.xml',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_LB',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.nameAr,
    title: DEFAULT_METADATA.title,
    description: DEFAULT_METADATA.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_METADATA.title,
    description: DEFAULT_METADATA.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={notoKufiArabic.variable}>
      <body className="bg-background font-arabic text-foreground min-h-screen antialiased">
        <div className="flex min-h-screen flex-col">
          <Header />
          <HeaderMobile />
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
        {/* Vercel Analytics - automatically tracks Web Vitals */}
        <Analytics />
      </body>
    </html>
  )
}
