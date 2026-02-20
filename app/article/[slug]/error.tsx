'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function ArticleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Article error:', error)
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
        </div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900">تعذر تحميل المقال</h1>
        <p className="mb-8 max-w-md text-gray-600">
          عذراً، حدث خطأ أثناء تحميل المقال. يرجى المحاولة مرة أخرى أو العودة للصفحة الرئيسية.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-lg bg-[#c61b23] px-6 py-3 font-medium text-white transition-colors hover:bg-[#a01820]"
          >
            حاول مرة أخرى
          </button>
          <Link
            href="/"
            className="rounded-lg bg-gray-200 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-300"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </div>
  )
}
