'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createSection, deleteSection, getSections } from '../actions'
import type { Section } from '@/types/database'

export default function NewSectionPage() {
  const [loading, setLoading] = useState(false)
  const [existingSections, setExistingSections] = useState<Section[]>([])
  const [formData, setFormData] = useState({
    name_ar: '',
    slug: '',
    description_ar: '',
    sort_order: 0,
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load existing sections on mount
  useEffect(() => {
    async function loadSections() {
      const result = await getSections()

      if (result.success && result.data) {
        setExistingSections(result.data as Section[])
        // Set default sort_order to be after the last section
        setFormData((prev) => ({
          ...prev,
          sort_order:
            result.data.length > 0
              ? Math.max(...result.data.map((s: Section) => s.sort_order)) + 1
              : 1,
        }))
      }
    }
    loadSections()
  }, [])

  // Auto-generate slug from Arabic name
  const generateSlug = (name: string) => {
    // Simple transliteration for common Arabic words
    const transliterations: { [key: string]: string } = {
      الرئيسية: 'home',
      المحليّة: 'local',
      المحلية: 'local',
      أخبار: 'news',
      عاجل: 'breaking',
      عاجلة: 'breaking',
      رياضة: 'sports',
      اقتصاد: 'economy',
      سياسة: 'politics',
      تكنولوجيا: 'tech',
      ثقافة: 'culture',
      صحة: 'health',
      رأي: 'opinion',
      تحليل: 'analysis',
      خاص: 'special',
      رادار: 'radar',
      بحث: 'investigation',
      تحري: 'investigation',
      تحرّي: 'investigation',
      أمن: 'security',
      قضاء: 'justice',
      إقليمي: 'regional',
      دولي: 'international',
      كتّاب: 'writers',
      كتاب: 'writers',
    }

    // Check if the name matches any known translation
    for (const [arabic, english] of Object.entries(transliterations)) {
      if (name.includes(arabic)) {
        return english
      }
    }

    // Otherwise, create a slug from the Arabic text
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0621-\u064A\u0660-\u0669a-zA-Z0-9-]/g, '')
      .substring(0, 30)
  }

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name_ar: name,
      slug: generateSlug(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validation
    if (!formData.name_ar.trim()) {
      setError('اسم القسم مطلوب')
      setLoading(false)
      return
    }

    if (!formData.slug.trim()) {
      setError('الرابط (Slug) مطلوب')
      setLoading(false)
      return
    }

    // Check if slug already exists
    const slugExists = existingSections.some((s) => s.slug === formData.slug)
    if (slugExists) {
      setError('هذا الرابط موجود بالفعل، يرجى اختيار رابط آخر')
      setLoading(false)
      return
    }

    try {
      const result = await createSection({
        name_ar: formData.name_ar.trim(),
        slug: formData.slug.trim(),
        description_ar: formData.description_ar.trim() || null,
        sort_order: formData.sort_order,
      })

      if (!result.success) {
        setError(result.error || 'حدث خطأ أثناء إنشاء القسم')
        setLoading(false)
        return
      }

      setSuccess('تم إنشاء القسم بنجاح!')

      // Reset form
      setFormData({
        name_ar: '',
        slug: '',
        description_ar: '',
        sort_order: formData.sort_order + 1,
      })

      // Refresh sections list
      const sectionsResult = await getSections()
      if (sectionsResult.success && sectionsResult.data) {
        setExistingSections(sectionsResult.data as Section[])
      }
    } catch (err) {
      console.error('Error creating section:', err)
      setError('حدث خطأ أثناء إنشاء القسم')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا القسم؟ لن يتم حذف المقالات المرتبطة به.')) {
      return
    }

    try {
      const result = await deleteSection(sectionId)

      if (!result.success) {
        setError(result.error || 'حدث خطأ أثناء حذف القسم')
        return
      }

      // Refresh sections list
      setExistingSections((prev) => prev.filter((s) => s.id !== sectionId))
      setSuccess('تم حذف القسم بنجاح!')
    } catch (err) {
      console.error('Error deleting section:', err)
      setError('حدث خطأ أثناء حذف القسم')
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          العودة للوحة التحكم
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">إدارة الأقسام</h1>
        <p className="mt-1 text-slate-500">أنشئ وأدِر أقسام الموقع</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="mr-auto text-red-500 hover:text-red-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-green-700">
          <svg
            className="h-5 w-5 flex-shrink-0"
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
          <span>{success}</span>
          <button
            onClick={() => setSuccess(null)}
            className="mr-auto text-green-500 hover:text-green-700"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Create New Section Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
            <svg
              className="h-5 w-5 text-purple-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            إنشاء قسم جديد
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Section Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                اسم القسم <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="مثال: الأخبار المحلية"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                الرابط (Slug) <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">/section/</span>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                  placeholder="local-news"
                  className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-mono text-sm transition-all outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                  required
                  dir="ltr"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">استخدم حروف إنجليزية صغيرة وأرقام فقط</p>
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                الوصف (اختياري)
              </label>
              <textarea
                value={formData.description_ar}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description_ar: e.target.value }))
                }
                placeholder="وصف مختصر للقسم..."
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 transition-all outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Sort Order */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">ترتيب العرض</label>
              <input
                type="number"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))
                }
                min={0}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 transition-all outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
              />
              <p className="mt-1 text-xs text-slate-400">الأرقام الأصغر تظهر أولاً</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-purple-600 to-purple-500 px-6 py-3 font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:shadow-xl hover:shadow-purple-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  جاري الإنشاء...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  إنشاء القسم
                </>
              )}
            </button>
          </form>
        </div>

        {/* Existing Sections */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-slate-900">
            <svg
              className="h-5 w-5 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 10h16M4 14h16M4 18h16"
              />
            </svg>
            الأقسام الحالية ({existingSections.length})
          </h2>

          {existingSections.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <svg
                  className="h-8 w-8 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-slate-500">لا توجد أقسام بعد</p>
              <p className="mt-1 text-sm text-slate-400">أنشئ قسمك الأول من النموذج المجاور</p>
            </div>
          ) : (
            <div className="space-y-3">
              {existingSections.map((section) => (
                <div
                  key={section.id}
                  className="group rounded-xl border border-slate-200 p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-400">
                          #{section.sort_order}
                        </span>
                        <h3 className="truncate font-bold text-slate-900">{section.name_ar}</h3>
                      </div>
                      <p className="font-mono text-sm text-slate-500">/section/{section.slug}</p>
                      {section.description_ar && (
                        <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                          {section.description_ar}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <Link
                        href={`/section/${section.slug}`}
                        target="_blank"
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-500"
                        title="معاينة القسم"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleDeleteSection(section.id)}
                        className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        title="حذف القسم"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-8 rounded-2xl border border-purple-200 bg-gradient-to-l from-purple-50 to-purple-100/50 p-6">
        <h3 className="mb-3 flex items-center gap-2 font-bold text-purple-900">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          نصائح
        </h3>
        <ul className="space-y-2 text-sm text-purple-800">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-purple-500">•</span>
            <span>اختر أسماء واضحة ومختصرة للأقسام</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-purple-500">•</span>
            <span>استخدم الـ Slug لتحديد رابط القسم (يجب أن يكون فريداً)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-purple-500">•</span>
            <span>رتّب الأقسام حسب الأهمية - الأرقام الأصغر تظهر أولاً في القائمة</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-purple-500">•</span>
            <span>
              لإضافة القسم للقائمة الرئيسية، عدّل ملف{' '}
              <code className="rounded bg-purple-200/50 px-1">lib/constants.ts</code>
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}
