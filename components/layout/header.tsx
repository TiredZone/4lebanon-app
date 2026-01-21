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

            {/* Live Button - Mobile */}
            <Link
              href="/"
              className="order-3 flex min-h-[44px] items-center gap-1.5 rounded-full border border-gray-200/50 bg-white/60 px-3 py-1.5 text-[11px] backdrop-blur-sm transition-all hover:bg-white/80 hover:shadow-sm active:scale-95 sm:px-4 sm:py-2 sm:text-xs lg:hidden"
            >
              <span className="live-indicator h-1.5 w-1.5 rounded-full bg-red-500"></span>
              <span className="font-medium">مباشر</span>
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

            {/* Slide-in Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85%] overflow-y-auto bg-gradient-to-b from-[#c61b23] to-[#9a1419] shadow-2xl lg:hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Menu Header */}
              <div className="flex items-center justify-between border-b border-white/20 p-3 sm:p-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Link
                    href="/"
                    className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs backdrop-blur-sm transition-colors hover:bg-white/20"
                  >
                    <span className="live-indicator h-1.5 w-1.5 rounded-full bg-red-400"></span>
                    <span className="text-white">مباشر</span>
                  </Link>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg p-2 transition-all duration-300 hover:bg-white/10 active:scale-95"
                  aria-label="إغلاق القائمة"
                >
                  <svg
                    className="h-6 w-6 stroke-[1.5] text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Search in Menu */}
              <div className="border-b border-white/20 p-4">
                <SearchForm onSearch={() => setMobileMenuOpen(false)} />
              </div>

              {/* Navigation Links with Active Indicator */}
              <nav className="py-2">
                {NAV_ITEMS.map((item, index) => {
                  const isActive = index === activeIndex
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'mobile-nav-link flex min-h-[52px] items-center justify-between border-b border-white/10 px-4 py-3 text-sm text-white transition-all sm:px-6 sm:py-3.5 sm:text-base',
                        isActive ? 'mobile-nav-link-active' : 'hover:bg-white/5'
                      )}
                    >
                      <span
                        className={cn(
                          'transition-transform duration-300',
                          !isActive && 'hover:translate-x-1'
                        )}
                      >
                        ← {item.label}
                      </span>
                      {/* Vertical Active Indicator Bar (RTL = right side) */}
                      {isActive && (
                        <motion.span
                          layoutId="mobile-active-indicator"
                          className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-l-full bg-white"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Footer Links */}
              <div className="mt-4 border-t border-white/20 p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-2 text-center text-xs sm:gap-4 sm:text-sm">
                  <Link
                    href="/about"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center justify-center rounded-lg px-2 py-2 text-white/90 transition-all duration-300 hover:bg-white/10 hover:text-white"
                  >
                    من نحن
                  </Link>
                  <Link
                    href="/contact"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center justify-center rounded-lg px-2 py-2 text-white/90 transition-all duration-300 hover:bg-white/10 hover:text-white"
                  >
                    اتصل بنا
                  </Link>
                  <Link
                    href="/privacy"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center justify-center rounded-lg px-2 py-2 text-white/90 transition-all duration-300 hover:bg-white/10 hover:text-white"
                  >
                    الشكاوى والتصحيحات
                  </Link>
                  <Link
                    href="/terms"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex min-h-[44px] items-center justify-center rounded-lg px-2 py-2 text-white/90 transition-all duration-300 hover:bg-white/10 hover:text-white"
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
