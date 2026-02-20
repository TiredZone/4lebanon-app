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
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

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
        />
      </div>

      <div>
        <label htmlFor="password" className="text-foreground mb-2 block text-sm font-medium">
          كلمة المرور
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          placeholder="••••••••"
          dir="ltr"
        />
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
