import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SITE_CONFIG, DEFAULT_METADATA } from '@/lib/constants'
import { Header } from '@/components/layout/header'
import { NavBar } from '@/components/layout/nav-bar'
import { Footer } from '@/components/layout/footer'
import { ToastProvider } from '@/components/layout/toast-provider'
import './globals.css'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
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
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="aura-full font-arabic text-foreground min-h-screen antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:shadow-lg"
        >
          تخطي إلى المحتوى الرئيسي
        </a>
        <ToastProvider />
        <div className="flex min-h-screen flex-col">
          <Header />
          <NavBar />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
        </div>
        {/* Vercel Analytics - automatically tracks Web Vitals */}
        <Analytics />
      </body>
    </html>
  )
}
