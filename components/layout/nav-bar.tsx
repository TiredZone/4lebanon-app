'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="bg-primary border-primary-dark border-t">
      <div className="mx-auto max-w-7xl px-4">
        <ul className="scrollbar-hide flex items-center gap-1 overflow-x-auto py-2">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors',
                    isActive
                      ? 'text-accent bg-white/20'
                      : 'hover:text-accent text-white hover:bg-white/10'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
