'use client'

import Link from 'next/link'
import { formatDateAr, toLatinNumbers } from '@/lib/utils'
import { SearchForm } from './search-form'
import { UserMenu } from './user-menu'
import { useState, useEffect } from 'react'
import { NAV_ITEMS } from '@/lib/constants'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Header() {
  const today =
    typeof window !== 'undefined'
      ? toLatinNumbers(formatDateAr(new Date(), 'EEEE، dd MMMM yyyy'))
      : ''
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const pathname = usePathname()

  // Track scroll position for shadow effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  // Find active index for mobile menu
  const activeIndex = NAV_ITEMS.findIndex(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  )

  return (
    <>
      {/* Premium Glassmorphic Header */}
      <header
        className={cn(
          'header-glass z-50 transition-all duration-300',
          isScrolled && 'header-glass-scrolled'
        )}
      >
        <div className="mx-auto max-w-7xl px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Mobile Menu Button (right side in RTL = order-1) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="icon-glow order-1 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-all hover:bg-gray-100/50 active:scale-95 lg:hidden"
              aria-label="فتح القائمة"
            >
              <svg
                className="h-5 w-5 stroke-[1.5] sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo (centered on mobile, left-aligned on desktop) */}
            <div className="order-2 flex flex-1 items-center justify-center gap-2 sm:gap-4 lg:order-1 lg:flex-none lg:justify-start">
              <Link
                href="/"
                className="transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              >
                <img
                  src="/logo-transparent.png"
                  alt="Logo"
                  className="h-12 w-auto sm:h-14 md:h-16"
                />
              </Link>
              <time
                className="hidden text-xs font-medium text-slate-500 sm:block sm:text-sm"
                suppressHydrationWarning
              >
                {today}
              </time>
            </div>

            {/* Search - Center - Desktop only */}
            <div className="hidden flex-1 justify-center lg:order-2 lg:flex">
              <motion.div
                className="w-full max-w-md"
                animate={{
                  scale: searchFocused ? 1.02 : 1,
                }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className={cn(
                    'search-container transition-all duration-300',
                    searchFocused && 'search-container-focused'
                  )}
                >
                  <SearchForm
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                  />
                </div>
              </motion.div>
            </div>

            {/* Search + Profile */}
            <div className="order-3 flex items-center gap-1 lg:order-3">
              <Link
                href="/search"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-all hover:bg-gray-100/50 active:scale-95 lg:hidden"
                aria-label="بحث"
              >
                <svg
                  className="h-5 w-5 stroke-[1.5] sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </Link>
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in Panel - Premium White Design */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-[60] flex w-80 max-w-[85%] flex-col overflow-hidden bg-white shadow-2xl lg:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header - Red accent bar */}
              <div className="bg-gradient-to-l from-[#830005] to-[#6b0004] px-4 py-4">
                <div className="flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="transition-opacity hover:opacity-90"
                  >
                    <img src="/logo-alternate.png" alt="Logo" className="h-10 w-auto" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 transition-all hover:bg-white/30 active:scale-95"
                    aria-label="إغلاق القائمة"
                  >
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search in Menu */}
              <div className="px-4 py-4">
                <div className="relative">
                  <SearchForm onSearch={() => setMobileMenuOpen(false)} />
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="flex-1 overflow-y-auto px-4">
                <p className="mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  الأقسام
                </p>
                <div className="space-y-1">
                  {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex min-h-[48px] items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-[#830005] text-white shadow-md'
                            : 'text-slate-700 hover:bg-slate-100'
                        )}
                      >
                        <span className="flex-1">{item.label}</span>
                        {isActive && (
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </Link>
                    )
                  })}
                </div>
              </nav>

              {/* Footer Links */}
              <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex gap-2">
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:text-[#830005] hover:shadow-md active:scale-[0.98]"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                      />
                    </svg>
                    من نحن
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-3 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:text-[#830005] hover:shadow-md active:scale-[0.98]"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                    اتصل بنا
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
