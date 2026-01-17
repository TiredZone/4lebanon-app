'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatDateAr } from '@/lib/utils'
import { SearchForm } from './search-form'
import { useState } from 'react'
import { NAV_ITEMS } from '@/lib/constants'
import { usePathname } from 'next/navigation'

export function Header() {
  const today = formatDateAr(new Date(), 'EEEE، dd MMMM yyyy')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#c61b23] text-white">
        <div className="mx-auto max-w-7xl px-3 py-2.5 md:px-4 md:py-3">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button (left side on mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="order-1 rounded-lg p-2 hover:bg-white/10 lg:hidden"
              aria-label="فتح القائمة"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            {/* Logo - Center on mobile, left on desktop */}
            <Link href="/" className="order-2 flex items-center gap-2 lg:order-1">
              <Image src="/logo-transparent.png" alt="Logo" width={120} height={40} className="h-8 w-auto md:h-10" priority />
            </Link>

            {/* Center: Date only - Desktop only */}
            <div className="order-2 hidden items-center gap-4 lg:flex">
              <time className="text-sm opacity-90">{today}</time>
            </div>

            {/* Removed live button */}
            <div className="order-2 hidden lg:flex">
              <Link
                href="#"
                className="hidden"
              >
                <span className="live-indicator h-2 w-2 rounded-full bg-red-500"></span>
                <span>مباشر</span>
              </Link>
            </div>

            {/* Live Button - Mobile */}
            <Link
              href="/"
              className="order-3 flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs transition-colors hover:bg-white/20 lg:hidden"
            >
              <span className="live-indicator h-1.5 w-1.5 rounded-full bg-red-500"></span>
              <span>مباشر</span>
            </Link>

            {/* Search - Desktop only */}
            <div className="order-3 hidden lg:block">
              <SearchForm />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="fixed top-0 right-0 bottom-0 w-80 max-w-[85%] overflow-y-auto bg-[#c61b23] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between border-b border-white/20 p-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs transition-colors hover:bg-white/20"
                >
                  <span className="live-indicator h-1.5 w-1.5 rounded-full bg-red-500"></span>
                  <span className="text-white">مباشر</span>
                </Link>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="إغلاق القائمة"
              >
                <svg
                  className="h-6 w-6 text-white"
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

            {/* Search in Menu */}
            <div className="border-b border-white/20 p-4">
              <SearchForm onSearch={() => setMobileMenuOpen(false)} />
            </div>

            {/* Navigation Links */}
            <nav className="py-2">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-end border-b border-white/10 px-6 py-3.5 text-base font-medium text-white transition-colors ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <span>← {item.label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Footer Links */}
            <div className="mt-4 border-t border-white/20 p-6">
              <div className="grid grid-cols-2 gap-4 text-center text-sm">
                <Link
                  href="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white transition-colors hover:text-white/80"
                >
                  من نحن
                </Link>
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white transition-colors hover:text-white/80"
                >
                  اتصل بنا
                </Link>
                <Link
                  href="/privacy"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white transition-colors hover:text-white/80"
                >
                  الشكاوى والتصحيحات
                </Link>
                <Link
                  href="/terms"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white transition-colors hover:text-white/80"
                >
                  أعلن معنا
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function HeaderMobile() {
  return null // No longer needed as search is in hamburger menu
}
