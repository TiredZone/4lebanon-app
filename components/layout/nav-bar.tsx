'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_ITEMS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="hidden border-t border-gray-200 bg-[#f8f8f8] shadow-sm lg:block">
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
                      'cursor-pointer border-b-2 px-3 py-2.5 text-sm whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-[#c61b23] font-bold text-[#c61b23]'
                        : 'border-transparent font-normal text-gray-800 hover:text-[#c61b23]'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </nav>
  )
}
