'use client'

import { Suspense, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function SignupForm() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setLoading(false)
      return
    }

    if (!displayName.trim()) {
      setError('الاسم مطلوب')
      setLoading(false)
      return
    }

    const supabase = createClient()

    // Sign up the user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name_ar: displayName.trim(),
        },
      },
    })

    if (authError) {
      setError(
        authError.message === 'User already registered'
          ? 'هذا البريد الإلكتروني مسجل بالفعل'
          : 'حدث خطأ أثناء التسجيل'
      )
      setLoading(false)
      return
    }

    if (data.user) {
      // Update profile with display name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name_ar: displayName.trim(),
          bio_ar: '',
        })
        .eq('id', data.user.id)

      if (profileError) {
        console.error('Profile update error:', profileError)
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/admin/login')
      }, 2000)
    }
  }

  if (success) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-semibold text-green-900">تم التسجيل بنجاح!</h3>
        <p className="mt-2 text-sm text-green-600">جاري تحويلك لصفحة تسجيل الدخول...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}

      <div>
        <label htmlFor="displayName" className="text-foreground mb-2 block text-sm font-medium">
          الاسم الكامل *
        </label>
        <input
          type="text"
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          placeholder="أدخل اسمك الكامل"
        />
      </div>

      <div>
        <label htmlFor="email" className="text-foreground mb-2 block text-sm font-medium">
          البريد الإلكتروني *
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
          كلمة المرور *
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-1 focus:outline-none"
          placeholder="••••••••"
          dir="ltr"
        />
        <p className="mt-1 text-xs text-gray-500">يجب أن تكون 6 أحرف على الأقل</p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-foreground mb-2 block text-sm font-medium">
          تأكيد كلمة المرور *
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
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
        {loading ? 'جاري التسجيل...' : 'إنشاء حساب'}
      </button>

      <p className="text-center text-sm text-gray-600">
        لديك حساب بالفعل؟{' '}
        <Link href="/admin/login" className="text-primary font-medium hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </form>
  )
}

function SignupFormFallback() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="bg-muted h-10 rounded-lg"></div>
      <div className="bg-muted h-10 rounded-lg"></div>
      <div className="bg-muted h-10 rounded-lg"></div>
      <div className="bg-muted h-10 rounded-lg"></div>
      <div className="bg-muted h-12 rounded-lg"></div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h1 className="text-foreground mb-2 text-3xl font-bold">إنشاء حساب جديد</h1>
          <p className="text-muted-foreground text-sm">
            سجل للوصول إلى لوحة التحكم وإنشاء المقالات
          </p>
        </div>

        <Suspense fallback={<SignupFormFallback />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  )
}
