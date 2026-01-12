import Link from 'next/link'
import { formatDateAr } from '@/lib/utils'
import { SearchForm } from './search-form'

export function Header() {
  const today = formatDateAr(new Date(), 'EEEE، dd MMMM yyyy')

  return (
    <header className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-baseline gap-1 text-2xl font-bold">
            <span className="text-3xl text-black">4</span>
            <span className="text-white">Lebanon</span>
          </Link>

          {/* Center: Date and Live indicator */}
          <div className="hidden items-center gap-4 md:flex">
            <time className="text-sm opacity-90">{today}</time>
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm transition-colors hover:bg-white/20"
            >
              <span className="live-indicator h-2 w-2 rounded-full bg-red-500"></span>
              <span>مباشر</span>
            </Link>
            <Link
              href="/#ticker"
              className="rounded-full border border-white/30 px-4 py-1.5 text-sm transition-colors hover:bg-white/10"
            >
              على مدار الساعة
            </Link>
          </div>

          {/* Search */}
          <div className="hidden lg:block">
            <SearchForm />
          </div>

          {/* Mobile menu button */}
          <button className="rounded-lg p-2 hover:bg-white/10 lg:hidden" aria-label="فتح القائمة">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export function HeaderMobile() {
  return (
    <div className="border-primary-dark bg-primary border-b px-4 py-2 lg:hidden">
      <SearchForm />
    </div>
  )
}
