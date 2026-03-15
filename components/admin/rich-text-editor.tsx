'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { useState, useCallback, useRef, useEffect } from 'react'
import toast from 'react-hot-toast'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      Placeholder.configure({
        placeholder: 'اكتب محتوى المقال هنا...',
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onChange(editor.getHTML())
      }, 300)
    },
    editorProps: {
      attributes: {
        class: 'rich-text-content',
        dir: 'rtl',
      },
    },
  })

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleLinkSubmit = useCallback(() => {
    if (!editor) return

    if (linkUrl.trim()) {
      let url = linkUrl.trim()
      if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url
      }
      try {
        const parsed = new URL(url)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          toast.error('الرابط غير صالح')
          return
        }
        editor.chain().focus().setLink({ href: parsed.href }).run()
      } catch {
        toast.error('الرابط غير صالح')
        return
      }
    } else {
      editor.chain().focus().unsetLink().run()
    }

    setLinkUrl('')
    setShowLinkDialog(false)
  }, [editor, linkUrl])

  const openLinkDialog = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href || ''
    setLinkUrl(previousUrl)
    setShowLinkDialog(true)
  }, [editor])

  if (!editor) return null

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="rich-text-toolbar">
        {/* Text formatting */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`rich-text-toolbar__btn ${editor.isActive('bold') ? 'is-active' : ''}`}
            title="غامق"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`rich-text-toolbar__btn ${editor.isActive('italic') ? 'is-active' : ''}`}
            title="مائل"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="19" y1="4" x2="10" y2="4" />
              <line x1="14" y1="20" x2="5" y2="20" />
              <line x1="15" y1="4" x2="9" y2="20" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`rich-text-toolbar__btn ${editor.isActive('underline') ? 'is-active' : ''}`}
            title="تسطير"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3" />
              <line x1="4" y1="21" x2="20" y2="21" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`rich-text-toolbar__btn ${editor.isActive('strike') ? 'is-active' : ''}`}
            title="يتوسطه خط"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4H9a3 3 0 0 0-2.83 4" />
              <path d="M14 12a4 4 0 0 1 0 8H6" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </button>
        </div>

        <div className="rich-text-toolbar__separator" />

        {/* Headings */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`rich-text-toolbar__btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
            title="عنوان رئيسي"
          >
            <span className="rich-text-toolbar__text">H2</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`rich-text-toolbar__btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
            title="عنوان فرعي"
          >
            <span className="rich-text-toolbar__text">H3</span>
          </button>
        </div>

        <div className="rich-text-toolbar__separator" />

        {/* Lists & blockquote */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`rich-text-toolbar__btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
            title="قائمة نقطية"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`rich-text-toolbar__btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
            title="قائمة مرقمة"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <path d="M4 6h1v4" />
              <path d="M4 10h2" />
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`rich-text-toolbar__btn ${editor.isActive('blockquote') ? 'is-active' : ''}`}
            title="اقتباس"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
          </button>
        </div>

        <div className="rich-text-toolbar__separator" />

        {/* Link */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={openLinkDialog}
            className={`rich-text-toolbar__btn ${editor.isActive('link') ? 'is-active' : ''}`}
            title="رابط"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>

        <div className="rich-text-toolbar__separator" />

        {/* Horizontal rule */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="rich-text-toolbar__btn"
            title="خط فاصل"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
            </svg>
          </button>
        </div>

        <div className="rich-text-toolbar__separator" />

        {/* Undo/Redo */}
        <div className="rich-text-toolbar__group">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="rich-text-toolbar__btn"
            title="تراجع"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="rich-text-toolbar__btn"
            title="إعادة"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>
        </div>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Link dialog */}
      {showLinkDialog && (
        <div className="rich-text-dialog-overlay" onClick={() => setShowLinkDialog(false)}>
          <div className="rich-text-dialog" onClick={(e) => e.stopPropagation()}>
            <h4 className="rich-text-dialog__title">إضافة رابط</h4>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="rich-text-dialog__input"
              dir="ltr"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleLinkSubmit()
                }
                if (e.key === 'Escape') setShowLinkDialog(false)
              }}
            />
            <div className="rich-text-dialog__actions">
              <button
                type="button"
                onClick={handleLinkSubmit}
                className="rich-text-dialog__btn rich-text-dialog__btn--primary"
              >
                {linkUrl.trim() ? 'حفظ' : 'إزالة الرابط'}
              </button>
              <button
                type="button"
                onClick={() => setShowLinkDialog(false)}
                className="rich-text-dialog__btn"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
