/**
 * Security Utilities Library
 * Provides comprehensive security functions for the application
 * MAXIMUM SECURITY MODE
 */

import { z } from 'zod'
import { headers } from 'next/headers'

// ============================================================================
// IP BLOCKING & THREAT DETECTION
// ============================================================================

// Blocked IPs store (in production, use Redis or database)
const blockedIPs = new Map<string, { until: number; reason: string }>()

// Suspicious activity tracker
const suspiciousActivity = new Map<
  string,
  { count: number; lastActivity: number; violations: string[] }
>()

// Known malicious patterns
const MALICIOUS_PATTERNS = [
  /(\.\.|\/\.\.)/i, // Path traversal
  /<script/i, // XSS attempt
  /javascript:/i, // JavaScript protocol
  /on\w+\s*=/i, // Event handlers
  /union\s+select/i, // SQL injection
  /;\s*drop\s+/i, // SQL drop
  /--\s*$/i, // SQL comment
  /\/\*.*\*\//i, // SQL block comment
  /\bexec\s*\(/i, // Command execution
  /\beval\s*\(/i, // Eval execution
  /base64_decode/i, // PHP attacks
  /\$\{.*\}/i, // Template injection
  /\{\{.*\}\}/i, // Template injection
  /__proto__/i, // Prototype pollution
  /constructor\s*\[/i, // Prototype pollution
]

// Known bad user agents (bots, scanners, etc.)
const BAD_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /burpsuite/i,
  /havij/i,
  /acunetix/i,
  /netsparker/i,
  /w3af/i,
  /whatweb/i,
  /nuclei/i,
]

/**
 * Check if an IP is blocked
 */
export function isIPBlocked(ip: string): { blocked: boolean; reason?: string; until?: number } {
  cleanupSecurityMaps()
  const block = blockedIPs.get(ip)
  if (!block) return { blocked: false }

  if (block.until < Date.now()) {
    blockedIPs.delete(ip)
    return { blocked: false }
  }

  return { blocked: true, reason: block.reason, until: block.until }
}

/**
 * Block an IP address
 */
export function blockIP(ip: string, durationMs: number, reason: string): void {
  blockedIPs.set(ip, {
    until: Date.now() + durationMs,
    reason,
  })
  console.warn(`[SECURITY] IP BLOCKED: ${ip} for ${durationMs / 1000}s - Reason: ${reason}`)
}

/**
 * Track suspicious activity and auto-block repeat offenders
 */
export function trackSuspiciousActivity(ip: string, violation: string): boolean {
  const now = Date.now()
  let activity = suspiciousActivity.get(ip)

  if (!activity || now - activity.lastActivity > 3600000) {
    // Reset after 1 hour of no activity
    activity = { count: 0, lastActivity: now, violations: [] }
  }

  activity.count++
  activity.lastActivity = now
  activity.violations.push(violation)

  // Keep only last 10 violations
  if (activity.violations.length > 10) {
    activity.violations = activity.violations.slice(-10)
  }

  suspiciousActivity.set(ip, activity)

  // Progressive blocking
  if (activity.count >= 50) {
    blockIP(ip, 86400000, `Excessive violations (${activity.count}): ${violation}`) // 24 hours
    return true
  } else if (activity.count >= 20) {
    blockIP(ip, 3600000, `Multiple violations (${activity.count}): ${violation}`) // 1 hour
    return true
  } else if (activity.count >= 10) {
    blockIP(ip, 600000, `Repeated violations (${activity.count}): ${violation}`) // 10 minutes
    return true
  }

  return false
}

/**
 * Check for malicious patterns in input
 */
export function containsMaliciousPattern(input: string): { malicious: boolean; pattern?: string } {
  for (const pattern of MALICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      return { malicious: true, pattern: pattern.toString() }
    }
  }
  return { malicious: false }
}

/**
 * Check if user agent is from known bad sources
 */
export function isBadUserAgent(userAgent: string): boolean {
  return BAD_USER_AGENTS.some((pattern) => pattern.test(userAgent))
}

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
  status: z.enum(['draft', 'published', 'scheduled']),
  published_at: z.string().datetime().optional().nullable(),
  priority: z.number().int().min(1).max(5).default(4),
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
// NOTE: In serverless environments (Vercel), this resets on each cold start
// and is NOT shared across instances. Use Redis for production rate limiting.
const rateLimitStore = new Map<string, RateLimitEntry>()
const MAX_RATE_LIMIT_ENTRIES = 10000

// Lazy cleanup: remove expired entries when map grows too large
function cleanupRateLimitStore() {
  if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
    // If still too large after cleanup, clear oldest half
    if (rateLimitStore.size > MAX_RATE_LIMIT_ENTRIES) {
      const entries = Array.from(rateLimitStore.entries())
      entries
        .sort((a, b) => a[1].resetTime - b[1].resetTime)
        .slice(0, Math.floor(entries.length / 2))
        .forEach(([key]) => rateLimitStore.delete(key))
    }
  }
}

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

export const RATE_LIMITS = {
  // General API requests - strict limit
  api: { windowMs: 60000, maxRequests: 60 },
  // Authentication attempts - very strict
  auth: { windowMs: 900000, maxRequests: 3 }, // 3 attempts per 15 minutes
  // File uploads - limited
  upload: { windowMs: 60000, maxRequests: 5 },
  // Article creation - limited
  create: { windowMs: 60000, maxRequests: 5 },
  // Search requests
  search: { windowMs: 60000, maxRequests: 20 },
  // Password reset
  passwordReset: { windowMs: 3600000, maxRequests: 3 }, // 3 per hour
  // Admin actions
  admin: { windowMs: 60000, maxRequests: 30 },
  // Login page views (prevent enumeration)
  loginPage: { windowMs: 60000, maxRequests: 10 },
} as const

// Brute force tracking
const bruteForceAttempts = new Map<string, { attempts: number; firstAttempt: number }>()

/**
 * Track failed authentication attempts for brute force protection
 */
export function trackAuthFailure(identifier: string): {
  blocked: boolean
  attemptsRemaining: number
  lockoutUntil?: number
} {
  const now = Date.now()
  const MAX_ATTEMPTS = 5
  const LOCKOUT_DURATION = 1800000 // 30 minutes
  const ATTEMPT_WINDOW = 900000 // 15 minutes

  let record = bruteForceAttempts.get(identifier)

  // Reset if outside window
  if (record && now - record.firstAttempt > ATTEMPT_WINDOW) {
    record = undefined
  }

  if (!record) {
    record = { attempts: 0, firstAttempt: now }
  }

  record.attempts++
  bruteForceAttempts.set(identifier, record)

  if (record.attempts >= MAX_ATTEMPTS) {
    // Block the IP
    blockIP(identifier, LOCKOUT_DURATION, 'Brute force attack detected')
    return {
      blocked: true,
      attemptsRemaining: 0,
      lockoutUntil: now + LOCKOUT_DURATION,
    }
  }

  return {
    blocked: false,
    attemptsRemaining: MAX_ATTEMPTS - record.attempts,
  }
}

/**
 * Clear auth failure record on successful login
 */
export function clearAuthFailures(identifier: string): void {
  bruteForceAttempts.delete(identifier)
}

/**
 * Check rate limit for a given key
 * Returns true if request is allowed, false if rate limited
 */
export function checkRateLimit(
  identifier: string,
  action: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetIn: number } {
  // Lazy cleanup to prevent unbounded memory growth
  cleanupRateLimitStore()

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

// ============================================================================
// HONEYPOT DETECTION
// ============================================================================

/**
 * Check if honeypot field was filled (indicates bot)
 */
export function isHoneypotTriggered(formData: Record<string, unknown>): boolean {
  // Common honeypot field names
  const honeypotFields = [
    'website',
    'url',
    'phone2',
    'fax',
    'company',
    'address2',
    'hp_field',
    'bot_check',
  ]

  for (const field of honeypotFields) {
    if (formData[field] && String(formData[field]).trim() !== '') {
      return true
    }
  }

  return false
}

// ============================================================================
// REQUEST FINGERPRINTING
// ============================================================================

/**
 * Generate a request fingerprint for tracking
 */
export async function getRequestFingerprint(): Promise<string> {
  const headersList = await headers()

  const components = [
    await getClientIdentifier(),
    headersList.get('user-agent') || '',
    headersList.get('accept-language') || '',
    headersList.get('accept-encoding') || '',
  ]

  // Simple hash
  const str = components.join('|')
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  return Math.abs(hash).toString(36)
}

// ============================================================================
// COMPREHENSIVE SECURITY CHECK
// ============================================================================

export interface SecurityCheckResult {
  passed: boolean
  blocked: boolean
  reason?: string
  ip: string
  fingerprint: string
}

/**
 * Perform comprehensive security check on incoming request
 */
export async function performSecurityCheck(
  input?: string | Record<string, unknown>
): Promise<SecurityCheckResult> {
  const ip = await getClientIdentifier()
  const fingerprint = await getRequestFingerprint()
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''

  // Check if IP is blocked
  const blockStatus = isIPBlocked(ip)
  if (blockStatus.blocked) {
    return {
      passed: false,
      blocked: true,
      reason: `IP blocked: ${blockStatus.reason}`,
      ip,
      fingerprint,
    }
  }

  // Check for bad user agents
  if (isBadUserAgent(userAgent)) {
    trackSuspiciousActivity(ip, 'Bad user agent detected')
    await logSecurityEvent('suspicious_activity', { reason: 'Bad user agent', userAgent })
    return {
      passed: false,
      blocked: false,
      reason: 'Suspicious request detected',
      ip,
      fingerprint,
    }
  }

  // Check input for malicious patterns
  if (input) {
    const inputStr = typeof input === 'string' ? input : JSON.stringify(input)
    const maliciousCheck = containsMaliciousPattern(inputStr)
    if (maliciousCheck.malicious) {
      trackSuspiciousActivity(ip, `Malicious pattern: ${maliciousCheck.pattern}`)
      await logSecurityEvent('suspicious_activity', {
        reason: 'Malicious pattern detected',
        pattern: maliciousCheck.pattern,
      })
      return {
        passed: false,
        blocked: false,
        reason: 'Invalid input detected',
        ip,
        fingerprint,
      }
    }
  }

  // Check honeypot if form data
  if (input && typeof input === 'object' && isHoneypotTriggered(input as Record<string, unknown>)) {
    trackSuspiciousActivity(ip, 'Honeypot triggered')
    await logSecurityEvent('suspicious_activity', { reason: 'Honeypot triggered' })
    return {
      passed: false,
      blocked: false,
      reason: 'Bot detected',
      ip,
      fingerprint,
    }
  }

  return {
    passed: true,
    blocked: false,
    ip,
    fingerprint,
  }
}

// ============================================================================
// SECURE TOKEN GENERATION
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Generate a time-limited token with expiry
 */
export function generateTimedToken(expiresInMs: number = 3600000): {
  token: string
  expires: number
} {
  const token = generateSecureToken(32)
  const expires = Date.now() + expiresInMs
  return { token, expires }
}

// ============================================================================
// INPUT LENGTH LIMITS (DoS Prevention)
// ============================================================================

export const INPUT_LIMITS = {
  title: 500,
  excerpt: 1000,
  body: 100000,
  comment: 5000,
  search: 200,
  url: 2000,
  email: 254,
  password: 128,
  username: 50,
  filename: 255,
} as const

/**
 * Check if input exceeds safe length limits
 */
export function exceedsLengthLimit(value: string, type: keyof typeof INPUT_LIMITS): boolean {
  return value.length > INPUT_LIMITS[type]
}

// ============================================================================
// ADDITIONAL VALIDATION SCHEMAS
// ============================================================================

/**
 * Strict email validation schema
 */
export const EmailSchema = z
  .string()
  .email('بريد إلكتروني غير صالح')
  .max(254, 'البريد الإلكتروني طويل جداً')
  .transform((val) => val.toLowerCase().trim())

/**
 * Strict password validation schema
 */
export const PasswordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
  .max(128, 'كلمة المرور طويلة جداً')
  .refine((val) => /[a-z]/.test(val), 'يجب أن تحتوي على حرف صغير')
  .refine((val) => /[A-Z]/.test(val), 'يجب أن تحتوي على حرف كبير')
  .refine((val) => /[0-9]/.test(val), 'يجب أن تحتوي على رقم')
  .refine((val) => /[^a-zA-Z0-9]/.test(val), 'يجب أن تحتوي على رمز خاص')

/**
 * Slug validation schema
 */
export const SlugSchema = z
  .string()
  .min(1, 'الرابط مطلوب')
  .max(200, 'الرابط طويل جداً')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'الرابط يجب أن يحتوي على أحرف صغيرة وأرقام وشرطات فقط')

// ============================================================================
// CLEANUP ROUTINES
// ============================================================================

// NOTE: Using lazy cleanup instead of setInterval to avoid timer leaks
// in serverless environments. Cleanup runs when maps grow too large.
const MAX_SECURITY_MAP_SIZE = 5000

function cleanupSecurityMaps() {
  const now = Date.now()

  // Clean blocked IPs
  if (blockedIPs.size > MAX_SECURITY_MAP_SIZE) {
    for (const [ip, block] of blockedIPs.entries()) {
      if (block.until < now) {
        blockedIPs.delete(ip)
      }
    }
  }

  // Clean suspicious activity older than 2 hours
  if (suspiciousActivity.size > MAX_SECURITY_MAP_SIZE) {
    for (const [ip, activity] of suspiciousActivity.entries()) {
      if (now - activity.lastActivity > 7200000) {
        suspiciousActivity.delete(ip)
      }
    }
  }

  // Clean brute force records older than 1 hour
  if (bruteForceAttempts.size > MAX_SECURITY_MAP_SIZE) {
    for (const [id, record] of bruteForceAttempts.entries()) {
      if (now - record.firstAttempt > 3600000) {
        bruteForceAttempts.delete(id)
      }
    }
  }
}

// Export cleanup for external use if needed
export { cleanupSecurityMaps }
