import { clsx, type ClassValue } from 'clsx'
import { formatDistanceToNow } from 'date-fns'
import { ar } from 'date-fns/locale'

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

// Convert a date to Lebanon timezone (Asia/Beirut) components
function toLebanonTime(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Beirut',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  })
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]))
  const dayOfWeek = new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`
  ).getDay()
  return {
    day: parseInt(parts.day),
    monthIndex: parseInt(parts.month) - 1,
    year: parseInt(parts.year),
    hours: parts.hour,
    minutes: parts.minute,
    dayOfWeek,
  }
}

// Format date in Arabic with Levantine month names (كانون، شباط، آذار، etc.)
// All dates are displayed in Lebanon timezone (Asia/Beirut)
export function formatDateAr(date: string | Date, formatStr: string = 'dd MMMM yyyy') {
  const d = typeof date === 'string' ? new Date(date) : date

  // Handle invalid dates
  if (isNaN(d.getTime())) return ''

  const lt = toLebanonTime(d)
  const day = lt.day
  const month = ARABIC_MONTHS[lt.monthIndex]
  const year = lt.year
  const dayName = ARABIC_DAYS[lt.dayOfWeek]
  const hours = lt.hours
  const minutes = lt.minutes
  const monthNum = (lt.monthIndex + 1).toString().padStart(2, '0')
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

// Format time only in Lebanon timezone (e.g., "14:30")
export function formatTimeAr(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date
  const lt = toLebanonTime(d)
  return `${lt.hours}:${lt.minutes}`
}

// Only the opinion section credits a byline. Everywhere else the author is hidden,
// and anonymous authors are hidden regardless of section.
export const OPINION_SECTION_SLUG = 'opinions'

export function resolveAuthor<T extends { is_anonymous?: boolean } | null | undefined>(
  author: T,
  sectionSlug?: string | null
): T | null {
  if (!author || (author as { is_anonymous?: boolean }).is_anonymous) return null
  if (sectionSlug !== OPINION_SECTION_SLUG) return null
  return author
}

// Generate short unique slug from UUID
export function generateSlug(_text: string, id?: string): string {
  return id || crypto.randomUUID().slice(0, 8)
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

// Compute sort tier for time-weighted article sorting.
// Tier 0: Pinned (priority 1) — always on top
// Tier 1: Breaking (priority 2) published within boost window
// Tier 2: Featured (priority 3) published within boost window
// Tier 3: Everything else — sorted by published_at
import { PINNED_BOOST_DURATION_MS, BREAKING_BOOST_DURATION_MS } from '@/lib/constants'

export function computeSortTier(
  priority: number,
  publishedAt: string | null,
  now: number = Date.now()
): number {
  if (!publishedAt) return 3
  const age = now - new Date(publishedAt).getTime()
  if (priority === 1 && age < PINNED_BOOST_DURATION_MS) return 0
  if (priority === 2 && age < BREAKING_BOOST_DURATION_MS) return 1
  if (priority === 3 && age < BREAKING_BOOST_DURATION_MS) return 2
  return 3
}

// Sort articles by tier then by published_at DESC
export function sortByTier<T extends { priority: number; published_at: string | null }>(
  articles: T[],
  now: number = Date.now()
): T[] {
  return [...articles].sort((a, b) => {
    const tierA = computeSortTier(a.priority, a.published_at, now)
    const tierB = computeSortTier(b.priority, b.published_at, now)
    if (tierA !== tierB) return tierA - tierB
    // Within same tier, newest first
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0
    return dateB - dateA
  })
}

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
