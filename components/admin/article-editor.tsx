'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  createArticle,
  updateArticle,
  deleteArticle,
  uploadImage,
} from '@/app/admin/articles/actions'
import { getStorageUrl } from '@/lib/utils'
import { ARTICLE_STATUSES, SUCCESS_MESSAGES } from '@/lib/constants'
import type {
  Article,
  Section,
  Region,
  Country,
  Topic,
  ArticleSource,
  ArticleStatus,
} from '@/types/database'

interface ArticleEditorProps {
  mode: 'create' | 'edit'
  article?: Article
  topicIds?: number[]
  sections: Section[]
  regions: Region[]
  countries: Country[]
  topics: Topic[]
}

export function ArticleEditor({
  mode,
  article,
  topicIds = [],
  sections,
  regions,
  countries,
  topics,
}: ArticleEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [title, setTitle] = useState(article?.title_ar || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt_ar || '')
  const [body, setBody] = useState(article?.body_md || '')
  const [coverImage, setCoverImage] = useState(article?.cover_image_path || '')
  const [sectionId, setSectionId] = useState<number | null>(article?.section_id || null)
  const [regionId, setRegionId] = useState<number | null>(article?.region_id || null)
  const [countryId, setCountryId] = useState<number | null>(article?.country_id || null)
  const [selectedTopics, setSelectedTopics] = useState<number[]>(topicIds)
  const [status, setStatus] = useState<ArticleStatus>(article?.status || 'draft')
  const [publishedAt, setPublishedAt] = useState(
    article?.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : ''
  )
  const [isBreaking, setIsBreaking] = useState(article?.is_breaking || false)
  const [isFeatured, setIsFeatured] = useState(article?.is_featured || false)
  const [sources, setSources] = useState<ArticleSource[]>(article?.sources || [])

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Filter countries by selected region
  const filteredCountries = regionId ? countries.filter((c) => c.region_id === regionId) : countries

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)

    const result = await uploadImage(formData)

    if (result.error) {
      setError(result.error)
    } else if (result.path) {
      setCoverImage(result.path)
      setSuccess('تم رفع الصورة بنجاح')
      setTimeout(() => setSuccess(null), 3000)
    }

    setUploading(false)
  }

  const handleAddSource = () => {
    setSources([...sources, { title: '', url: '' }])
  }

  const handleReset = () => {
    setTitle(article?.title_ar || '')
    setExcerpt(article?.excerpt_ar || '')
    setBody(article?.body_md || '')
    setCoverImage(article?.cover_image_path || '')
    setSectionId(article?.section_id || null)
    setRegionId(article?.region_id || null)
    setCountryId(article?.country_id || null)
    setSelectedTopics(topicIds)
    setStatus(article?.status || 'draft')
    setPublishedAt(
      article?.published_at ? new Date(article.published_at).toISOString().slice(0, 16) : ''
    )
    setIsBreaking(article?.is_breaking || false)
    setIsFeatured(article?.is_featured || false)
    setSources(article?.sources || [])
    setError(null)
    setSuccess(null)
  }

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index))
  }

  const handleSourceChange = (index: number, field: 'title' | 'url', value: string) => {
    const newSources = [...sources]
    newSources[index][field] = value
    setSources(newSources)
  }

  const handleTopicToggle = (topicId: number) => {
    setSelectedTopics((prev) =>
      prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!title.trim()) {
      setError('العنوان مطلوب')
      return
    }

    if (!body.trim()) {
      setError('محتوى المقال مطلوب')
      return
    }

    const formData = {
      title_ar: title.trim(),
      excerpt_ar: excerpt.trim(),
      body_md: body,
      cover_image_path: coverImage || null,
      section_id: sectionId,
      region_id: regionId,
      country_id: countryId,
      status,
      published_at: status !== 'draft' ? publishedAt || new Date().toISOString() : null,
      is_breaking: isBreaking,
      is_featured: isFeatured,
      sources: sources.filter((s) => s.title && s.url),
      topic_ids: selectedTopics,
    }

    startTransition(async () => {
      let result

      if (mode === 'create') {
        result = await createArticle(formData)
      } else if (article) {
        result = await updateArticle(article.id, formData)
      }

      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(SUCCESS_MESSAGES.articleSaved)
        if (mode === 'create' && result?.success && result.articleId) {
          router.push(`/admin/articles/${result.articleId}/edit`)
        }
      }
    })
  }

  const handleDelete = async () => {
    if (!article) return

    startTransition(async () => {
      const result = await deleteArticle(article.id)
      if (result?.error) {
        setError(result.error)
        setShowDeleteConfirm(false)
      }
      // Redirect happens in the server action
    })
  }

  const coverImageUrl = coverImage ? getStorageUrl(coverImage) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Error/Success messages */}
      {error && <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">{success}</div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <label htmlFor="title" className="text-foreground mb-2 block text-sm font-medium">
              العنوان *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-3 text-lg focus:ring-1 focus:outline-none"
              placeholder="أدخل عنوان المقال..."
            />
          </div>

          {/* Excerpt */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <label htmlFor="excerpt" className="text-foreground mb-2 block text-sm font-medium">
              الملخص
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-3 focus:ring-1 focus:outline-none"
              placeholder="ملخص قصير للمقال (اختياري)..."
            />
          </div>

          {/* Body */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <label htmlFor="body" className="text-foreground mb-2 block text-sm font-medium">
              محتوى المقال * (يدعم Markdown)
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={20}
              className="border-border focus:border-primary focus:ring-primary w-full rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
              placeholder="اكتب محتوى المقال هنا..."
              dir="rtl"
            />
          </div>

          {/* Sources */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-foreground text-sm font-medium">المصادر</label>
              <button
                type="button"
                onClick={handleAddSource}
                className="text-primary text-sm font-medium hover:underline"
              >
                + إضافة مصدر
              </button>
            </div>
            {sources.length > 0 ? (
              <div className="space-y-4">
                {sources.map((source, index) => (
                  <div key={index} className="flex gap-4">
                    <input
                      type="text"
                      value={source.title}
                      onChange={(e) => handleSourceChange(index, 'title', e.target.value)}
                      placeholder="عنوان المصدر"
                      className="border-border focus:border-primary flex-1 rounded-lg border px-4 py-2 focus:outline-none"
                    />
                    <input
                      type="url"
                      value={source.url}
                      onChange={(e) => handleSourceChange(index, 'url', e.target.value)}
                      placeholder="رابط المصدر"
                      className="border-border focus:border-primary flex-1 rounded-lg border px-4 py-2 focus:outline-none"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">لا توجد مصادر</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish settings */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-foreground mb-4 text-lg font-bold">النشر</h3>

            {/* Status */}
            <div className="mb-4">
              <label htmlFor="status" className="text-foreground mb-2 block text-sm font-medium">
                الحالة
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="border-border focus:border-primary w-full rounded-lg border px-4 py-2 focus:outline-none"
              >
                {ARTICLE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Publish date (for scheduled) */}
            {status !== 'draft' && (
              <div className="mb-4">
                <label
                  htmlFor="publishedAt"
                  className="text-foreground mb-2 block text-sm font-medium"
                >
                  تاريخ النشر
                </label>
                <input
                  type="datetime-local"
                  id="publishedAt"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="border-border focus:border-primary w-full rounded-lg border px-4 py-2 focus:outline-none"
                  dir="ltr"
                />
                <p className="text-muted-foreground mt-1 text-xs">اتركه فارغاً للنشر الفوري</p>
              </div>
            )}

            {/* Breaking/Featured flags */}
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
                />
                <span className="text-sm">خبر عاجل</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="border-border text-primary focus:ring-primary h-4 w-4 rounded"
                />
                <span className="text-sm">مقال مميز</span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-2">
              <button
                type="submit"
                disabled={isPending}
                className="bg-primary hover:bg-primary-dark w-full rounded-lg px-4 py-3 font-medium text-white disabled:opacity-50"
              >
                {isPending ? 'جاري الحفظ...' : mode === 'create' ? 'إنشاء المقال' : 'حفظ التغييرات'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                إعادة تعيين
              </button>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full rounded-lg border border-red-500 px-4 py-2 font-medium text-red-500 hover:bg-red-50"
                >
                  حذف المقال
                </button>
              )}
            </div>
          </div>

          {/* Cover image */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-foreground mb-4 text-lg font-bold">صورة الغلاف</h3>
            {coverImageUrl && (
              <div className="relative mb-4 aspect-video overflow-hidden rounded-lg">
                <Image
                  src={coverImageUrl}
                  alt="Cover"
                  fill
                  className="object-cover"
                  sizes="300px"
                />
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="absolute top-2 left-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                  title="حذف الصورة"
                  aria-label="حذف الصورة"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <label htmlFor="cover-image" className="text-foreground mb-2 block text-sm font-medium">
              اختر الصورة
            </label>
            <input
              id="cover-image"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="w-full text-sm"
            />
            {uploading && <p className="text-muted-foreground mt-2 text-sm">جاري الرفع...</p>}
          </div>

          {/* Categories */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-foreground mb-4 text-lg font-bold">التصنيف</h3>

            {/* Section */}
            <div className="mb-4">
              <label htmlFor="section" className="text-foreground mb-2 block text-sm font-medium">
                القسم
              </label>
              <select
                id="section"
                value={sectionId || ''}
                onChange={(e) => setSectionId(e.target.value ? Number(e.target.value) : null)}
                className="border-border focus:border-primary w-full rounded-lg border px-4 py-2 focus:outline-none"
              >
                <option value="">اختر القسم</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div className="mb-4">
              <label htmlFor="region" className="text-foreground mb-2 block text-sm font-medium">
                المنطقة
              </label>
              <select
                id="region"
                value={regionId || ''}
                onChange={(e) => {
                  setRegionId(e.target.value ? Number(e.target.value) : null)
                  setCountryId(null) // Reset country when region changes
                }}
                className="border-border focus:border-primary w-full rounded-lg border px-4 py-2 focus:outline-none"
              >
                <option value="">اختر المنطقة</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name_ar}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div className="mb-4">
              <label htmlFor="country" className="text-foreground mb-2 block text-sm font-medium">
                الدولة
              </label>
              <select
                id="country"
                value={countryId || ''}
                onChange={(e) => setCountryId(e.target.value ? Number(e.target.value) : null)}
                className="border-border focus:border-primary w-full rounded-lg border px-4 py-2 focus:outline-none"
              >
                <option value="">اختر الدولة</option>
                {filteredCountries.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_ar}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h3 className="text-foreground mb-4 text-lg font-bold">المواضيع</h3>
            <div className="flex flex-wrap gap-2">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => handleTopicToggle(topic.id)}
                  className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                    selectedTopics.includes(topic.id)
                      ? 'bg-primary text-white'
                      : 'bg-muted text-foreground hover:bg-primary/10'
                  }`}
                >
                  {topic.name_ar}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="text-foreground mb-4 text-lg font-bold">تأكيد الحذف</h3>
            <p className="text-muted-foreground mb-6">
              هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isPending ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="border-border text-foreground hover:bg-muted flex-1 rounded-lg border px-4 py-2 font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
