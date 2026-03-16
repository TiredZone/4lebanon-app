'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close dropdown on Escape key
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false)
  }, [])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, handleEscapeKey])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  if (loading) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200"></div>
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex h-10 w-10 items-center justify-center rounded-full bg-[#830005] font-bold text-white shadow-md transition-all hover:scale-105 hover:bg-[#6b0004] hover:shadow-lg"
        aria-label="قائمة المستخدم"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg
          className="h-5 w-5 transition-transform group-hover:scale-110"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setIsOpen(false)}></div>
          <div
            className="absolute left-0 z-[80] mt-2 w-56 rounded-lg bg-white shadow-lg"
            role="menu"
          >
            <div className="border-b border-gray-200 p-3">
              <p className="truncate text-sm font-medium text-gray-900">{user.email}</p>
            </div>
            <div className="p-2">
              <Link
                href="/admin"
                className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                لوحة التحكم
              </Link>
              <Link
                href="/admin/articles/new"
                className="block rounded-md px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                مقال جديد
              </Link>
              <button
                onClick={() => {
                  setIsOpen(false)
                  handleLogout()
                }}
                className="w-full rounded-md px-3 py-2 text-right text-sm text-[#830005] hover:bg-[#830005]/5"
              >
                تسجيل الخروج
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
