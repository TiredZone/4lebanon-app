'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDateAr, toLatinNumbers } from '@/lib/utils'
import { SearchForm } from './search-form'
import { UserMenu } from './user-menu'
import { useState, useEffect } from 'react'
import { NAV_ITEMS } from '@/lib/constants'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export function Header() {
  const today = toLatinNumbers(formatDateAr(new Date(), 'EEEE، dd MMMM yyyy'))
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
            {/* Mobile Menu Button (left side on mobile) */}
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

            {/* Logo & Date - Left side */}
            <div className="order-2 flex items-center gap-2 sm:gap-4 lg:order-1">
              <Link
                href="/"
                className="transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
              >
                <Image
                  src="/logo-transparent.png"
                  alt="Logo"
                  width={173}
                  height={58}
                  className="h-8 w-auto sm:h-10 md:h-14"
                  priority
                />
              </Link>
              <time className="hidden text-xs font-medium text-slate-500 lg:block">{today}</time>
            </div>

            {/* Search - Center - Desktop only */}
            <div className="order-3 hidden flex-1 justify-center lg:flex">
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

            {/* Profile/Dashboard Button - Mobile */}
            <Link
              href="/admin"
              className="group order-3 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[#c61b23] p-2.5 shadow-md transition-all hover:scale-105 hover:bg-[#8a1219] hover:shadow-lg active:scale-95 lg:hidden"
              aria-label="لوحة التحكم"
            >
              <svg
                className="h-5 w-5 text-white transition-transform group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </Link>

            {/* Profile - Right side */}
            <div className="order-4 hidden items-center lg:flex">
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
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Slide-in Panel - Premium White Design */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 flex w-80 max-w-[85%] flex-col overflow-hidden bg-white shadow-2xl lg:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header - Red accent bar */}
              <div className="bg-gradient-to-l from-[#c61b23] to-[#9a1419] px-4 py-4">
                <div className="flex items-center justify-between">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="transition-opacity hover:opacity-90"
                  >
                    <Image
                      src="/logo-transparent.png"
                      alt="Logo"
                      width={120}
                      height={40}
                      className="h-8 w-auto brightness-0 invert"
                    />
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

              {/* Dashboard Access */}
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="mx-4 mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-l from-slate-50 to-slate-100 px-4 py-3 transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c61b23]">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <span className="block text-sm font-bold text-slate-800">لوحة التحكم</span>
                  <span className="text-xs text-slate-500">إدارة المقالات</span>
                </div>
                <svg
                  className="h-5 w-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </Link>

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
                            ? 'bg-[#c61b23] text-white shadow-md'
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
              <div className="border-t border-slate-200 bg-slate-50 p-4">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                  >
                    من نحن
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                  >
                    اتصل بنا
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                  >
                    الشكاوى
                  </Link>
                  <Link
                    href="/terms"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center rounded-lg px-3 py-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-900"
                  >
                    أعلن معنا
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

export function HeaderMobile() {
  return null // No longer needed as search is in hamburger menu
}
