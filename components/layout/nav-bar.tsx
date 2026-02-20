'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()
  const navRef = useRef<HTMLUListElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })
  const [isReady, setIsReady] = useState(false)

  // Determine if a nav item is active
  const isActiveLink = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Find active index
  const activeIndex = NAV_ITEMS.findIndex((item) => isActiveLink(item.href))

  // Update indicator position
  useEffect(() => {
    if (!navRef.current) return

    const updateIndicator = () => {
      const navElement = navRef.current
      if (!navElement || activeIndex < 0) return

      const activeItem = navElement.children[activeIndex] as HTMLElement | undefined
      if (activeItem) {
        const link = activeItem.querySelector('a') as HTMLElement
        if (link) {
          setIndicatorStyle({
            left: link.offsetLeft,
            width: link.offsetWidth,
          })
          setIsReady(true)
        }
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(updateIndicator, 50)
    window.addEventListener('resize', updateIndicator)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [activeIndex, pathname])

  return (
    <nav className="nav-bar-glass hidden lg:block">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative flex items-center justify-center">
          <ul
            ref={navRef}
            className="scrollbar-hide relative flex items-center gap-0 overflow-x-auto"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = isActiveLink(item.href)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn('nav-link-item', isActive && 'nav-link-item-active')}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}

            {/* Sliding Underline Indicator */}
            {isReady && activeIndex >= 0 && (
              <motion.div
                className="absolute bottom-2 h-[2.5px] rounded-full bg-[var(--aura-red)]"
                initial={false}
                animate={{
                  left: indicatorStyle.left + Math.min(20, indicatorStyle.width / 4),
                  width: Math.max(0, indicatorStyle.width - Math.min(40, indicatorStyle.width / 2)),
                }}
                transition={{
                  type: 'spring',
                  stiffness: 380,
                  damping: 30,
                }}
              />
            )}
          </ul>
        </div>
      </div>
    </nav>
  )
}
