'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="hidden border-t border-white/10 bg-[#c61b23] lg:block">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between">
          <ul className="scrollbar-hide flex flex-1 items-center gap-1 overflow-x-auto py-2">
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
                        ? 'bg-white/20 text-white'
                        : 'text-white/90 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div className="mr-4">
            <UserMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}
