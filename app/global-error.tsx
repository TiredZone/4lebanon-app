'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="ar" dir="rtl">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-100">
          <div className="p-8 text-center">
            <h1 className="mb-4 text-4xl font-bold text-[#830005]">حدث خطأ</h1>
            <p className="mb-8 text-gray-600">عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={reset}
                className="rounded-lg bg-[#830005] px-6 py-3 font-medium text-white transition-colors hover:bg-[#6b0004]"
              >
                حاول مرة أخرى
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- Hard navigation needed in global error boundary */}
              <a
                href="/"
                className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                العودة للرئيسية
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
