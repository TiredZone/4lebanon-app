import { clsx, type ClassValue } from 'clsx'
import { format, formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'
import slugify from 'slugify'

// Class name utility (Tailwind merge alternative)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Arabic month names (Gregorian in Arabic)
const ARABIC_MONTHS = [
  'كانون الثاني', // January
  'شباط', // February
  'آذار', // March
  'نيسان', // April
  'أيار', // May
  'حزيران', // June
  'تموز', // July
  'آب', // August
  'أيلول', // September
  'تشرين الأول', // October
  'تشرين الثاني', // November
  'كانون الأول', // December
]

const ARABIC_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// Format date in Arabic with Levantine month names (كانون، شباط، آذار، etc.)
// All formats use Levantine Arabic months - NOT Egyptian (يناير، فبراير)
export function formatDateAr(date: string | Date, formatStr: string = 'dd MMMM yyyy') {
  const d = typeof date === 'string' ? new Date(date) : date

  // Handle invalid dates
  if (isNaN(d.getTime())) return ''

  const day = d.getDate()
  const month = ARABIC_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  const dayName = ARABIC_DAYS[d.getDay()]
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const monthNum = (d.getMonth() + 1).toString().padStart(2, '0')
  const dayPadded = day.toString().padStart(2, '0')

  switch (formatStr) {
    // Full formats with weekday
    case 'EEEE، dd MMMM yyyy':
    case 'weekday-full':
      return `${dayName}، ${day} ${month} ${year}`

    // Standard date formats
    case 'dd MMMM yyyy':
    case 'full':
      return `${day} ${month} ${year}`

    // Day and month only
    case 'd MMMM':
    case 'day-month':
      return `${day} ${month}`

    // Numeric formats
    case 'dd/MM':
      return `${dayPadded}/${monthNum}`
    case 'dd/MM/yyyy':
      return `${dayPadded}/${monthNum}/${year}`
    case 'dd/MM/yyyy HH:mm':
      return `${dayPadded}/${monthNum}/${year} ${hours}:${minutes}`

    // Month and year
    case 'MMMM yyyy':
    case 'month-year':
      return `${month} ${year}`

    // Month only
    case 'MMMM':
    case 'month':
      return month

    // Day only
    case 'dd':
    case 'day':
      return day.toString()

    default:
      // Default to full date with Levantine months
      return `${day} ${month} ${year}`
  }
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
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // Images (must come BEFORE links)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
    .replace(/```[\s\S]*?```/g, '') // Code blocks
    .replace(/`([^`]+)`/g, '$1') // Inline code
    .replace(/>\s/g, '') // Blockquotes
    .replace(/[-*+]\s/g, '') // List items
    .replace(/\d+\.\s/g, '') // Numbered lists
    .replace(/\n+/g, ' ') // Newlines to space
    .trim()
}

// Escape special characters for Supabase/PostgreSQL ilike patterns
export function escapeIlike(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`)
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

// Get Supabase storage public URL (also supports external URLs)
// Returns null when path is null/empty so callers can decide fallback behavior
export function getStorageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  // If it's already a full URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null
  // Storage paths are already properly formatted - don't encode the whole path
  // as it would double-encode any existing percent-encoded characters
  return `${supabaseUrl}/storage/v1/object/public/article-images/${path}`
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

// Convert Arabic-Indic numerals to Latin numerals (٠-٩ → 0-9)
export function toLatinNumbers(str: string | number): string {
  const arabicToLatinMap: Record<string, string> = {
    '٠': '0',
    '١': '1',
    '٢': '2',
    '٣': '3',
    '٤': '4',
    '٥': '5',
    '٦': '6',
    '٧': '7',
    '٨': '8',
    '٩': '9',
  }

  return String(str).replace(/[٠-٩]/g, (match) => arabicToLatinMap[match] || match)
}

// Format date with Latin numerals
export function formatDateLatinAr(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDate()
  const month = ARABIC_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// Alias for formatDateLatinAr (same format)
export const formatLevantineDate = formatDateLatinAr

// Get article status label in Arabic
export function getStatusLabelAr(status: string): string {
  const labels: Record<string, string> = {
    draft: 'مسودة',
    published: 'منشور',
  }
  return labels[status] || status
}

// Get status badge color class
export function getStatusBadgeClass(status: string): string {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}
