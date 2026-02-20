'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Admin error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="p-8 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">حدث خطأ في لوحة التحكم</h1>
        <p className="mb-8 max-w-md text-gray-600">
          عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة للوحة التحكم الرئيسية.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-[#c61b23] px-6 py-3 font-medium text-white transition-colors hover:bg-[#a01820]"
          >
            حاول مرة أخرى
          </button>
          <Link
            href="/admin"
            className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    </div>
  )
}
