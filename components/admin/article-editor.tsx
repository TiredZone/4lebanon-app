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
import { EditorSelect } from './editor-select'
import { EditorTopics } from './editor-topics'
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

  // Convert data to select options
  const sectionOptions = sections.map((s) => ({ value: s.id, label: s.name_ar }))
  const regionOptions = regions.map((r) => ({ value: r.id, label: r.name_ar }))
  const countryOptions = filteredCountries.map((c) => ({ value: c.id, label: c.name_ar }))

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

  const handleRegionChange = (value: number | string | null) => {
    setRegionId(value as number | null)
    setCountryId(null) // Reset country when region changes
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error/Success messages */}
      {error && (
        <div className="editor-message error">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="editor-message success">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Title */}
          <div className="editor-card">
            <label htmlFor="title" className="editor-label editor-label-required">
              العنوان
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="editor-input editor-input-lg"
              placeholder="أدخل عنوان المقال..."
            />
          </div>

          {/* Excerpt */}
          <div className="editor-card">
            <label htmlFor="excerpt" className="editor-label">
              الملخص
            </label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="editor-input editor-textarea"
              placeholder="ملخص قصير للمقال (اختياري)..."
            />
          </div>

          {/* Body */}
          <div className="editor-card">
            <label htmlFor="body" className="editor-label editor-label-required">
              محتوى المقال (يدعم Markdown)
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={20}
              className="editor-input editor-textarea editor-textarea-code"
              placeholder="اكتب محتوى المقال هنا..."
              dir="rtl"
            />
          </div>

          {/* Sources */}
          <div className="editor-card">
            <div className="editor-sources-header">
              <h3 className="editor-card-title-inline">المصادر</h3>
              <button type="button" onClick={handleAddSource} className="editor-add-source-btn">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                إضافة مصدر
              </button>
            </div>
            {sources.length > 0 ? (
              <div>
                {sources.map((source, index) => (
                  <div key={index} className="editor-source-item">
                    <input
                      type="text"
                      value={source.title}
                      onChange={(e) => handleSourceChange(index, 'title', e.target.value)}
                      placeholder="عنوان المصدر"
                      className="editor-source-input"
                    />
                    <input
                      type="url"
                      value={source.url}
                      onChange={(e) => handleSourceChange(index, 'url', e.target.value)}
                      placeholder="رابط المصدر"
                      className="editor-source-input"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSource(index)}
                      className="editor-source-remove"
                      aria-label="حذف المصدر"
                    >
                      <svg
                        className="h-5 w-5"
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
                ))}
              </div>
            ) : (
              <p className="editor-no-sources">لا توجد مصادر - أضف مصادر لتوثيق المقال</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish settings */}
          <div className="editor-card">
            <h3 className="editor-card-title">النشر</h3>

            {/* Status */}
            <div className="mb-4">
              <label htmlFor="status" className="editor-label">
                الحالة
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ArticleStatus)}
                className="editor-input"
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
                <label htmlFor="publishedAt" className="editor-label">
                  تاريخ النشر
                </label>
                <input
                  type="datetime-local"
                  id="publishedAt"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="editor-input"
                  dir="ltr"
                />
                <p className="mt-1 text-xs text-gray-500">اتركه فارغاً للنشر الفوري</p>
              </div>
            )}

            {/* Breaking/Featured flags */}
            <div className="editor-checkbox-group">
              <label className={`editor-checkbox-label ${isBreaking ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isBreaking}
                  onChange={(e) => setIsBreaking(e.target.checked)}
                  className="editor-checkbox"
                />
                <span className={`editor-checkbox-text ${isBreaking ? 'breaking' : ''}`}>
                  <svg
                    className="ml-1 inline-block h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  خبر عاجل
                </span>
              </label>
              <label className={`editor-checkbox-label ${isFeatured ? 'checked' : ''}`}>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="editor-checkbox"
                />
                <span className={`editor-checkbox-text ${isFeatured ? 'featured' : ''}`}>
                  <svg
                    className="ml-1 inline-block h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  مقال مميز
                </span>
              </label>
            </div>

            {/* Action buttons */}
            <div className="mt-6 space-y-3">
              <button type="submit" disabled={isPending} className="editor-btn editor-btn-primary">
                {isPending ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : mode === 'create' ? (
                  'إنشاء المقال'
                ) : (
                  'حفظ التغييرات'
                )}
              </button>
              <button
                type="button"
                onClick={handleReset}
                disabled={isPending}
                className="editor-btn editor-btn-secondary"
              >
                إعادة تعيين
              </button>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="editor-btn editor-btn-danger"
                >
                  حذف المقال
                </button>
              )}
            </div>
          </div>

          {/* Cover image */}
          <div className="editor-card">
            <h3 className="editor-card-title">صورة الغلاف</h3>
            <div className={`editor-image-upload ${coverImageUrl ? 'has-image' : ''}`}>
              {coverImageUrl ? (
                <div className="editor-image-preview">
                  <Image
                    src={coverImageUrl}
                    alt="Cover"
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="editor-image-remove"
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
              ) : (
                <label htmlFor="cover-image" className="editor-image-upload-content cursor-pointer">
                  <svg
                    className="editor-image-upload-icon"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="editor-image-upload-text">
                    {uploading ? 'جاري الرفع...' : 'اضغط لاختيار صورة'}
                  </span>
                  <span className="editor-image-upload-hint">PNG, JPG, WebP حتى 5MB</span>
                </label>
              )}
              <input
                id="cover-image"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="editor-card">
            <h3 className="editor-card-title">التصنيف</h3>

            {/* Section */}
            <EditorSelect
              label="القسم"
              options={sectionOptions}
              value={sectionId}
              onChange={(v) => setSectionId(v as number | null)}
              placeholder="اختر القسم"
              searchPlaceholder="ابحث عن قسم..."
            />

            {/* Region */}
            <EditorSelect
              label="المنطقة"
              options={regionOptions}
              value={regionId}
              onChange={handleRegionChange}
              placeholder="اختر المنطقة"
              searchPlaceholder="ابحث عن منطقة..."
            />

            {/* Country - filtered by region */}
            <EditorSelect
              label="الدولة"
              options={countryOptions}
              value={countryId}
              onChange={(v) => setCountryId(v as number | null)}
              placeholder="اختر الدولة"
              searchPlaceholder="ابحث عن دولة..."
              disabled={!regionId && countries.length > 20}
            />
          </div>

          {/* Topics */}
          <div className="editor-card">
            <h3 className="editor-card-title">المواضيع</h3>
            <EditorTopics
              topics={topics}
              selectedTopics={selectedTopics}
              onChange={setSelectedTopics}
            />
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="editor-modal-overlay">
          <div className="editor-modal">
            <h3 className="editor-modal-title">تأكيد الحذف</h3>
            <p className="editor-modal-text">
              هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="editor-modal-actions">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending}
                className="editor-btn editor-btn-delete"
              >
                {isPending ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="editor-btn editor-btn-secondary"
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
