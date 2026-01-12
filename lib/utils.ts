import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import slugify from 'slugify'

// Class name utility (Tailwind merge alternative)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Format date in Arabic
export function formatDateAr(date: string | Date, formatStr: string = 'dd MMMM yyyy') {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, formatStr, { locale: ar })
}

// Format relative time in Arabic (e.g., "منذ ساعتين")
export function formatRelativeTimeAr(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { locale: ar, addSuffix: true })
}

// Format time only (e.g., "14:30")
export function formatTimeAr(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'HH:mm', { locale: ar })
}

// Generate URL-safe slug from Arabic text
export function generateSlug(text: string, id?: string): string {
  const baseSlug = slugify(text, {
    lower: true,
    strict: true,
    locale: 'ar',
    remove: /[*+~.()'"!:@]/g,
  })

  // If slug is empty (pure Arabic), use a fallback with ID
  if (!baseSlug && id) {
    return `article-${id.slice(0, 8)}`
  }

  return baseSlug || 'article'
}

// Calculate reading time in Arabic
export function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200
  const wordCount = text.trim().split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  if (minutes === 1) {
    return 'دقيقة واحدة للقراءة'
  } else if (minutes === 2) {
    return 'دقيقتان للقراءة'
  } else if (minutes >= 3 && minutes <= 10) {
    return `${minutes} دقائق للقراءة`
  } else {
    return `${minutes} دقيقة للقراءة`
  }
}

// Extract plain text from markdown
export function extractTextFromMarkdown(markdown: string): string {
  return markdown
    .replace(/#+\s/g, '') // Headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold
    .replace(/\*([^*]+)\*/g, '$1') // Italic
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/>\s/g, '') // Blockquotes
    .replace(/[-*+]\s/g, '') // List items
    .replace(/\d+\.\s/g, '') // Numbered lists
    .replace(/\n+/g, ' ') // Newlines to space
    .trim()
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Get Supabase storage public URL
export function getStorageUrl(path: string | null): string | null {
  if (!path) return null
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  return `${supabaseUrl}/storage/v1/object/public/images/${path}`
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Sanitize HTML (basic)
export function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
}

// Debounce function
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Format number in Arabic numerals
export function formatNumberAr(num: number): string {
  return num.toLocaleString('ar-EG')
}

// Get article status label in Arabic
export function getStatusLabelAr(status: string): string {
  const labels: Record<string, string> = {
    draft: 'مسودة',
    scheduled: 'مجدول',
    published: 'منشور',
  }
  return labels[status] || status
}

// Get status badge color class
export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    scheduled: 'bg-yellow-100 text-yellow-800',
    published: 'bg-green-100 text-green-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}
