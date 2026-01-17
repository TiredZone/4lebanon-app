'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="hidden border-t border-gray-200 bg-[#f8f8f8] lg:block">
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
                        ? 'bg-[#c61b23] text-white'
                        : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
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
