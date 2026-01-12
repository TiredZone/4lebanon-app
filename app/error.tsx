'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="bg-muted flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <h1 className="text-primary mb-4 text-4xl font-bold">حدث خطأ</h1>
        <p className="text-muted-foreground mb-8">
          عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
        </p>
        <button
          onClick={reset}
          className="bg-primary hover:bg-primary-dark rounded-lg px-6 py-3 font-medium text-white"
        >
          حاول مرة أخرى
        </button>
      </div>
    </div>
  )
}
