'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    })

    if (resetError) {
      setError('حدث خطأ أثناء إرسال رابط إعادة التعيين. حاول مرة أخرى.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-2 text-2xl font-bold">نسيت كلمة المرور</h1>
          <p className="text-muted-foreground">
            أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
          </p>
        </div>

        {sent ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-foreground mb-2 text-lg font-semibold">تم إرسال الرابط</h2>
            <p className="text-muted-foreground mb-6 text-sm">
              تحقق من بريدك الإلكتروني <strong dir="ltr">{email}</strong> واضغط على رابط إعادة تعيين
              كلمة المرور.
            </p>
            <p className="text-muted-foreground mb-6 text-xs">
              لم يصل البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها (Spam).
            </p>
            <Link
              href="/admin/login"
              className="text-primary hover:text-primary-dark text-sm font-medium"
            >
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-[#830005]/5 p-4 text-sm text-[#830005]">{error}</div>
            )}

            <div>
              <label htmlFor="email" className="text-foreground mb-2 block text-sm font-medium">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
                placeholder="email@example.com"
                dir="ltr"
                suppressHydrationWarning
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bg-primary hover:bg-primary-dark w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
            </button>

            <div className="text-center">
              <Link
                href="/admin/login"
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                العودة لتسجيل الدخول
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
