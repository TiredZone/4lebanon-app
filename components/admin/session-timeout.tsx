'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { signOut } from '@/app/admin/articles/actions'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000 // 2 minutes before timeout

export function SessionTimeout() {
  const pathname = usePathname()
  const lastActivityRef = useRef<number>(0)
  const warningToastIdRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const resetTimers = useCallback(() => {
    lastActivityRef.current = Date.now()

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current)
      warningRef.current = null
    }
    if (warningToastIdRef.current) {
      toast.dismiss(warningToastIdRef.current)
      warningToastIdRef.current = null
    }
  }, [])

  const scheduleTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)

    warningRef.current = setTimeout(() => {
      warningToastIdRef.current = toast(
        'ستتم إعادة توجيهك لتسجيل الدخول خلال دقيقتين بسبب عدم النشاط',
        { duration: 120000, id: 'session-timeout-warning' }
      )
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS)

    timeoutRef.current = setTimeout(async () => {
      await signOut()
    }, INACTIVITY_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    if (pathname === '/admin/login') return

    lastActivityRef.current = Date.now()

    const handleActivity = () => {
      resetTimers()
      scheduleTimers()
    }

    handleActivity()

    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart']
    events.forEach((event) => window.addEventListener(event, handleActivity))

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity))
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (warningRef.current) clearTimeout(warningRef.current)
      if (warningToastIdRef.current) toast.dismiss(warningToastIdRef.current)
    }
  }, [pathname, resetTimers, scheduleTimers])

  return null
}
