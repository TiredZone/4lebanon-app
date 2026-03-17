'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { marked } from 'marked'
import {
  createArticle,
  updateArticle,
  deleteArticle,
  uploadImage,
} from '@/app/admin/articles/actions'
import { getStorageUrl } from '@/lib/utils'
import { ARTICLE_STATUSES, ARTICLE_PRIORITIES, SUCCESS_MESSAGES } from '@/lib/constants'
import { EditorSelect } from './editor-select'
import { EditorTopics } from './editor-topics'
import { EditorCountries } from './editor-countries'

const RichTextEditor = dynamic(
  () => import('./rich-text-editor').then((m) => ({ default: m.RichTextEditor })),
  {
    ssr: false,
    loading: () => <div className="rich-text-editor-loading">جاري تحميل المحرر...</div>,
  }
)
import type {
  Article,
  Section,
  Region,
  Country,
  Topic,
  ArticleSource,
  ArticleStatus,
  ArticlePriority,
  UserRole,
} from '@/types/database'

interface ArticleEditorProps {
  mode: 'create' | 'edit'
  article?: Article
  topicIds?: number[]
  countryIds?: number[]
  sections: Section[]
  regions: Region[]
  countries: Country[]
  topics: Topic[]
  userRole?: UserRole
}

export function ArticleEditor({
  mode,
  article,
  topicIds = [],
  countryIds = [],
  sections,
  regions,
  countries,
  topics,
  userRole = 'editor',
}: ArticleEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Form state
  const [title, setTitle] = useState(article?.title_ar || '')
  const [excerpt, setExcerpt] = useState(article?.excerpt_ar || '')
  // Convert legacy Markdown to HTML for existing articles
  const initialBody = useMemo(() => {
    const raw = article?.body_md || ''
    if (!raw) return ''
    // If it already looks like HTML, use as-is
    if (raw.trimStart().startsWith('<')) return raw
    // Convert Markdown to HTML for the WYSIWYG editor
    return marked.parse(raw, { async: false }) as string
  }, [article?.body_md])
  const [body, setBody] = useState(initialBody)
  const [coverImage, setCoverImage] = useState(article?.cover_image_path || '')
  const [sectionId, setSectionId] = useState<number | null>(article?.section_id ?? null)
  const [regionId, setRegionId] = useState<number | null>(article?.region_id ?? null)
  const [selectedCountries, setSelectedCountries] = useState<number[]>(countryIds)
  const [selectedTopics, setSelectedTopics] = useState<number[]>(topicIds)
  const [status, setStatus] = useState<ArticleStatus>(article?.status || 'draft')
  const [priority, setPriority] = useState<ArticlePriority>(article?.priority ?? 4)

  // Filter priorities based on user role
  const allowedPriorities = ARTICLE_PRIORITIES.filter((p) => {
    if (userRole === 'super_admin') return true
    if (userRole === 'admin') return p.value >= 2
    return p.value >= 3 // editor
  })
  const [sources, setSources] = useState<ArticleSource[]>(article?.sources || [])

  // UI state
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Convert data to select options
  const sectionOptions = sections.map((s) => ({ value: s.id, label: s.name_ar }))
  const regionOptions = regions.map((r) => ({ value: r.id, label: r.name_ar }))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await uploadImage(formData)

      if (result.error) {
        setError(result.error)
        toast.error(result.error)
      } else if (result.path) {
        setCoverImage(result.path)
        toast.success(SUCCESS_MESSAGES.imageUploaded)
      }
    } catch {
      setError('فشل رفع الصورة. الرجاء المحاولة مرة أخرى')
      toast.error('فشل رفع الصورة')
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-uploaded
      e.target.value = ''
    }
  }

  const handleAddSource = () => {
    setSources([...sources, { title: '', url: '' }])
  }

  const handleRemoveSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index))
  }

  const handleSourceChange = (index: number, field: 'title' | 'url', value: string) => {
    setSources(sources.map((source, i) => (i === index ? { ...source, [field]: value } : source)))
  }

  const handleRegionChange = (value: number | string | null) => {
    setRegionId(value as number | null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('العنوان مطلوب')
      return
    }

    // Strip HTML tags to check if body actually has content
    const bodyText = body.replace(/<[^>]*>/g, '').trim()
    if (!bodyText) {
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
      status,
      published_at:
        status === 'published' ? article?.published_at || new Date().toISOString() : null,
      priority,
      sources: sources.filter((s) => s.title && s.url),
      topic_ids: selectedTopics,
      country_ids: selectedCountries,
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
        toast.error(result.error)
      } else {
        toast.success(SUCCESS_MESSAGES.articleSaved)
        if (mode === 'create' && result?.success && result.articleId) {
          router.push(`/admin/articles/${result.articleId}/edit`)
        }
      }
    })
  }

  const handleDelete = async () => {
    if (!article) return

    startTransition(async () => {
      sessionStorage.setItem('articleDeleted', '1')
      const result = await deleteArticle(article.id)
      if (result?.error) {
        sessionStorage.removeItem('articleDeleted')
        setError(result.error)
        toast.error(result.error)
        setShowDeleteConfirm(false)
      }
      // Redirect happens in the server action
    })
  }

  const coverImageUrl = coverImage ? getStorageUrl(coverImage) : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
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
            <label className="editor-label editor-label-required">محتوى المقال</label>
            <RichTextEditor content={body} onChange={setBody} />
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
                  <div key={`${index}-${source.url}`} className="editor-source-item">
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

            {status === 'published' && (
              <p className="mb-4 text-xs text-green-600">سيتم نشر المقال فوراً</p>
            )}

            {/* Priority */}
            <div className="mb-4">
              <label htmlFor="priority" className="editor-label">
                الأولوية
              </label>
              <div className="space-y-1.5">
                {allowedPriorities.map((p) => (
                  <label
                    key={p.value}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 transition-all ${
                      priority === p.value
                        ? 'border-current bg-slate-50 font-medium'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                    style={
                      priority === p.value ? { color: p.color, borderColor: p.color } : undefined
                    }
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={p.value}
                      checked={priority === p.value}
                      onChange={() => setPriority(p.value as ArticlePriority)}
                      className="sr-only"
                    />
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className="text-sm">{p.label}</span>
                  </label>
                ))}
              </div>
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
                accept="image/png,image/jpeg,image/webp"
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

            {/* Countries - multi-select, filtered by region */}
            <EditorCountries
              countries={countries}
              regions={regions}
              selectedCountries={selectedCountries}
              regionId={regionId}
              onChange={setSelectedCountries}
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
                disabled={isPending}
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
