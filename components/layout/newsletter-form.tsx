'use client'

import { useState, FormEvent } from 'react'
import toast from 'react-hot-toast'

export function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailRegex.test(email)) {
      toast.error('الرجاء إدخال بريد إلكتروني صحيح')
      return
    }

    setLoading(true)

    try {
      // TODO: Replace with actual newsletter API endpoint when available
      // For now, show a message that the feature is coming soon
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success('شكراً لاهتمامك! خدمة النشرة البريدية قيد التطوير')
      setEmail('')
    } catch {
      toast.error('حدث خطأ. الرجاء المحاولة مرة أخرى')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mb-6 max-w-md">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="أدخل بريدك الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="flex-1 rounded-lg border-2 border-transparent px-5 py-3.5 text-gray-900 placeholder-gray-500 shadow-lg transition-all focus:border-white focus:ring-2 focus:ring-white/30 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white px-8 py-3.5 font-bold whitespace-nowrap text-[#830005] shadow-lg transition-all hover:bg-gray-100 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'جاري الإرسال...' : 'اشترك الآن →'}
        </button>
      </div>
    </form>
  )
}
