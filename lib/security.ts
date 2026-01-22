/**
 * Security Utilities Library
 * Provides comprehensive security functions for the application
 */

import { z } from 'zod'
import { headers } from 'next/headers'

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize HTML to prevent XSS attacks
 * Removes all HTML tags and potentially dangerous content
 */
export function sanitizeHtml(input: string): string {
  if (!input) return ''

  return (
    input
      // Remove script tags and content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove style tags and content
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove event handlers
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
      // Remove javascript: and data: URLs
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      // Remove expressions
      .replace(/expression\s*\(/gi, '')
      // Encode special characters
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim()
  )
}

/**
 * Sanitize string for safe database storage
 * Allows basic formatting but removes dangerous content
 */
export function sanitizeText(input: string): string {
  if (!input) return ''

  return (
    input
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove control characters except newlines and tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Normalize unicode
      .normalize('NFC')
      .trim()
  )
}

/**
 * Sanitize URL to prevent injection attacks
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null

  try {
    const parsed = new URL(url)

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }

    // Block javascript: and data: URLs that might bypass protocol check
    const lowercaseUrl = url.toLowerCase()
    if (lowercaseUrl.includes('javascript:') || lowercaseUrl.includes('data:')) {
      return null
    }

    return parsed.href
  } catch {
    return null
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return 'unnamed'

  return (
    filename
      // Remove path traversal attempts
      .replace(/\.\./g, '')
      .replace(/[/\\]/g, '')
      // Remove null bytes
      .replace(/\0/g, '')
      // Keep only safe characters
      .replace(/[^a-zA-Z0-9._-]/g, '-')
      // Collapse multiple dashes
      .replace(/-+/g, '-')
      // Remove leading/trailing dashes and dots
      .replace(/^[-.]|[-.]$/g, '')
      // Limit length
      .substring(0, 255) || 'unnamed'
  )
}

// ============================================================================
// INPUT VALIDATION SCHEMAS (Zod)
// ============================================================================

/**
 * Article form validation schema
 */
export const ArticleSchema = z.object({
  title_ar: z
    .string()
    .min(1, 'العنوان مطلوب')
    .max(500, 'العنوان طويل جداً')
    .transform(sanitizeText),
  excerpt_ar: z
    .string()
    .max(1000, 'الملخص طويل جداً')
    .optional()
    .nullable()
    .transform((val) => (val ? sanitizeText(val) : null)),
  body_md: z
    .string()
    .min(1, 'محتوى المقال مطلوب')
    .max(100000, 'المحتوى طويل جداً')
    .transform(sanitizeText),
  cover_image_path: z.string().max(500).optional().nullable(),
  section_id: z.number().int().positive().optional().nullable(),
  region_id: z.number().int().positive().optional().nullable(),
  country_id: z.number().int().positive().optional().nullable(),
  status: z.enum(['draft', 'published', 'scheduled', 'archived']),
  published_at: z.string().datetime().optional().nullable(),
  is_breaking: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  topic_ids: z.array(z.number().int().positive()).default([]),
  sources: z
    .array(
      z.object({
        title: z.string().max(200).transform(sanitizeText),
        url: z
          .string()
          .max(2000)
          .transform((val) => sanitizeUrl(val) || ''),
      })
    )
    .default([]),
})

export type ValidatedArticleForm = z.infer<typeof ArticleSchema>

/**
 * Search query validation schema
 */
export const SearchQuerySchema = z.object({
  q: z.string().max(200, 'Search query too long').transform(sanitizeText).optional(),
  section: z.string().max(100).optional(),
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(1000))
    .default(1),
})

/**
 * UUID validation schema
 */
export const UUIDSchema = z.string().uuid('Invalid ID format')

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory rate limit store (for serverless, use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export const RATE_LIMITS = {
  // General API requests
  api: { windowMs: 60000, maxRequests: 100 },
  // Authentication attempts
  auth: { windowMs: 300000, maxRequests: 5 },
  // File uploads
  upload: { windowMs: 60000, maxRequests: 10 },
  // Article creation
  create: { windowMs: 60000, maxRequests: 10 },
  // Search requests
  search: { windowMs: 60000, maxRequests: 30 },
} as const

/**
 * Check rate limit for a given key
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetIn: number } {
  const config = RATE_LIMITS[action]
  const key = `${action}:${identifier}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    }
  }

  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.maxRequests - entry.count)
  const resetIn = Math.max(0, entry.resetTime - now)

  return {
    allowed: entry.count <= config.maxRequests,
    remaining,
    resetIn,
  }
}

/**
 * Get client identifier for rate limiting
 */
export async function getClientIdentifier(): Promise<string> {
  const headersList = await headers()

  // Try to get real IP from various headers
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const cfIp = headersList.get('cf-connecting-ip')

  // Use first IP from x-forwarded-for if available
  if (forwarded) {
    const ips = forwarded.split(',')
    return ips[0].trim()
  }

  return cfIp || realIp || 'unknown'
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validate CSRF token timing-safe comparison
 */
export function validateCsrfToken(token: string, expected: string): boolean {
  if (!token || !expected || token.length !== expected.length) {
    return false
  }

  // Timing-safe comparison to prevent timing attacks
  let result = 0
  for (let i = 0; i < token.length; i++) {
    result |= token.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return result === 0
}

// ============================================================================
// SECURITY LOGGING
// ============================================================================

export type SecurityEventType =
  | 'auth_success'
  | 'auth_failure'
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'unauthorized_access'
  | 'file_upload'
  | 'suspicious_activity'

interface SecurityLogEntry {
  timestamp: string
  type: SecurityEventType
  ip: string
  userId?: string
  path: string
  details?: Record<string, unknown>
}

/**
 * Log security-relevant events
 * In production, this should send to a proper logging service
 */
export async function logSecurityEvent(
  type: SecurityEventType,
  details?: Record<string, unknown>
): Promise<void> {
  const headersList = await headers()
  const ip = await getClientIdentifier()
  const path = headersList.get('x-pathname') || 'unknown'

  const entry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    type,
    ip,
    path,
    details,
  }

  // In development, log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('[SECURITY]', JSON.stringify(entry))
  }

  // In production, you would send to a logging service like:
  // - Sentry
  // - LogRocket
  // - DataDog
  // - Custom logging endpoint

  // For now, we'll just log to console in production too
  // but with less verbosity
  if (process.env.NODE_ENV === 'production' && type !== 'auth_success') {
    console.warn(`[SECURITY:${type}] IP: ${ip}, Path: ${path}`)
  }
}

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

/**
 * Validate that request comes from same origin (basic CSRF check)
 */
export async function validateOrigin(): Promise<boolean> {
  const headersList = await headers()
  const origin = headersList.get('origin')
  const host = headersList.get('host')

  // No origin header (same-origin request)
  if (!origin) return true

  try {
    const originUrl = new URL(origin)
    return originUrl.host === host
  } catch {
    return false
  }
}

/**
 * Check if request method is allowed
 */
export function isAllowedMethod(method: string, allowed: string[]): boolean {
  return allowed.map((m) => m.toUpperCase()).includes(method.toUpperCase())
}

/**
 * Validate content type
 */
export async function validateContentType(expected: string[]): Promise<boolean> {
  const headersList = await headers()
  const contentType = headersList.get('content-type')

  if (!contentType) return false

  return expected.some((type) => contentType.toLowerCase().includes(type.toLowerCase()))
}

// ============================================================================
// PASSWORD SECURITY
// ============================================================================

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else feedback.push('يجب أن تكون كلمة المرور 8 أحرف على الأقل')

  if (password.length >= 12) score++

  if (/[a-z]/.test(password)) score++
  else feedback.push('أضف أحرف صغيرة')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('أضف أحرف كبيرة')

  if (/[0-9]/.test(password)) score++
  else feedback.push('أضف أرقام')

  if (/[^a-zA-Z0-9]/.test(password)) score++
  else feedback.push('أضف رموز خاصة')

  // Check for common patterns
  const commonPatterns = [/^123/, /password/i, /qwerty/i, /abc123/i, /admin/i]

  if (commonPatterns.some((p) => p.test(password))) {
    score = Math.max(0, score - 2)
    feedback.push('تجنب الأنماط الشائعة')
  }

  return { score, feedback }
}

// ============================================================================
// SECURE RESPONSE HELPERS
// ============================================================================

/**
 * Create secure JSON response with security headers
 */
export function secureJsonResponse(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

/**
 * Create error response without leaking internal details
 */
export function secureErrorResponse(message: string, status: number = 500): Response {
  // Don't leak internal error details in production
  const safeMessage = process.env.NODE_ENV === 'production' ? 'An error occurred' : message

  return secureJsonResponse({ error: safeMessage }, status)
}
