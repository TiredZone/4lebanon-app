'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function isValidRedirect(path: string | null): boolean {
  if (!path) return false
  // Only allow internal paths that start with /admin
  if (!path.startsWith('/admin')) return false
  // Block any URLs with protocol or external redirects
  if (path.includes('://') || path.startsWith('//')) return false
  return true
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirect = searchParams.get('redirect')
  // Sanitize redirect URL - only allow safe internal paths
  const redirectTo = isValidRedirect(rawRedirect) ? rawRedirect! : '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-[#830005]/5 p-4 text-sm text-[#830005]">{error}</div>}

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

      <div>
        <label htmlFor="password" className="text-foreground mb-2 block text-sm font-medium">
          كلمة المرور
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border py-2 pr-4 pl-10 focus:ring-1 focus:outline-none"
            placeholder="••••••••"
            dir="ltr"
            suppressHydrationWarning
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
            aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-primary hover:bg-primary-dark w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? 'جاري التسجيل...' : 'تسجيل الدخول'}
      </button>
    </form>
  )
}

function LoginFormFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-10 rounded-lg"></div>
      <div className="bg-muted h-10 rounded-lg"></div>
      <div className="bg-muted h-12 rounded-lg"></div>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-2 text-2xl font-bold">تسجيل الدخول</h1>
          <p className="text-muted-foreground">لوحة تحكم المحررين والكتّاب</p>
          <p className="mt-2 text-xs text-gray-400">هذه اللوحة مخصصة لفريق التحرير فقط</p>
        </div>

        <Suspense fallback={<LoginFormFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
