import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// In-memory stores for middleware (reset on cold start)
// ⚠️  LIMITATION: On Vercel (serverless), each edge invocation may get a fresh
//     isolate, so these maps are NOT shared across instances. The rate limiting
//     is therefore best-effort and only effective per-isolate. For production-
//     grade rate limiting, consider Vercel KV, Upstash Redis, or an edge rate
//     limiter like @upstash/ratelimit.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
const blockedIPs = new Set<string>()
const suspiciousIPs = new Map<string, number>()

// Bad patterns to detect in URLs
const MALICIOUS_URL_PATTERNS = [
  /\.\.\//, // Path traversal
  /<script/i, // XSS in URL
  /javascript:/i, // JavaScript protocol
  /union.*select/i, // SQL injection
  /\bor\b.*[=<>]/i, // SQL injection
  /\band\b.*[=<>]/i, // SQL injection
  /exec\s*\(/i, // Command execution
  /\$\{/i, // Template injection
  /%00/i, // Null byte injection
  /etc\/passwd/i, // LFI attempt
  /proc\/self/i, // LFI attempt
  /\.env/i, // Environment file access
  /\.git/i, // Git folder access
  /wp-admin/i, // WordPress probes
  /wp-login/i, // WordPress probes
  /phpmyadmin/i, // PhpMyAdmin probes
  /\.php$/i, // PHP file probes
  /\.asp$/i, // ASP file probes
]

// Bad user agents (scanners, bots)
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
  /acunetix/i,
  /netsparker/i,
  /nuclei/i,
  /zgrab/i,
  /python-requests.*\/2/i, // Generic Python bots (allow newer versions)
]

// Sensitive paths that require extra protection
const PROTECTED_PATHS = ['/admin', '/api/admin']

// Rate limit configurations
// Note: In serverless (Vercel), these are per-isolate so they're best-effort.
// Keep limits generous — a single page load can trigger 20-40 requests.
const RATE_LIMITS = {
  global: { windowMs: 60000, maxRequests: 500 },
  auth: { windowMs: 300000, maxRequests: 10 },
  api: { windowMs: 60000, maxRequests: 120 },
  admin: { windowMs: 60000, maxRequests: 200 },
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfIP = request.headers.get('cf-connecting-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  return cfIP || realIP || 'unknown'
}

function isRateLimited(key: string, config: { windowMs: number; maxRequests: number }): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + config.windowMs })
    return false
  }

  entry.count++
  rateLimitStore.set(key, entry)

  return entry.count > config.maxRequests
}

function trackSuspicious(ip: string): boolean {
  const count = (suspiciousIPs.get(ip) || 0) + 1
  suspiciousIPs.set(ip, count)

  // Auto-block after 10 suspicious requests
  if (count >= 10) {
    blockedIPs.add(ip)
    console.warn(`[SECURITY] Auto-blocked IP: ${ip} after ${count} suspicious requests`)
    return true
  }

  return false
}

function containsMaliciousPattern(url: string): boolean {
  const decodedUrl = decodeURIComponent(url)
  return MALICIOUS_URL_PATTERNS.some((pattern) => pattern.test(decodedUrl))
}

function isBadUserAgent(userAgent: string): boolean {
  return BAD_USER_AGENTS.some((pattern) => pattern.test(userAgent))
}

export async function proxy(request: NextRequest) {
  const ip = getClientIP(request)
  const userAgent = request.headers.get('user-agent') || ''
  const pathname = request.nextUrl.pathname
  const url = request.nextUrl.toString()

  // 1. Check if IP is blocked
  if (blockedIPs.has(ip)) {
    console.warn(`[SECURITY] Blocked request from banned IP: ${ip}`)
    return new NextResponse('Access Denied', { status: 403 })
  }

  // 2. Check for bad user agents
  if (isBadUserAgent(userAgent)) {
    console.warn(`[SECURITY] Bad user agent detected: ${userAgent} from ${ip}`)
    trackSuspicious(ip)
    return new NextResponse('Access Denied', { status: 403 })
  }

  // 3. Check for malicious URL patterns
  if (containsMaliciousPattern(url)) {
    console.warn(`[SECURITY] Malicious URL pattern detected: ${pathname} from ${ip}`)
    if (trackSuspicious(ip)) {
      return new NextResponse('Access Denied', { status: 403 })
    }
    return new NextResponse('Bad Request', { status: 400 })
  }

  // 4. Rate limiting
  const isProtectedPath = PROTECTED_PATHS.some((p) => pathname.startsWith(p))
  const isApiPath = pathname.startsWith('/api')
  const isAuthPath = pathname.includes('/login') || pathname.includes('/auth')

  let rateLimitConfig = RATE_LIMITS.global
  let rateLimitKey = `global:${ip}`

  if (isAuthPath) {
    rateLimitConfig = RATE_LIMITS.auth
    rateLimitKey = `auth:${ip}`
  } else if (isProtectedPath) {
    rateLimitConfig = RATE_LIMITS.admin
    rateLimitKey = `admin:${ip}`
  } else if (isApiPath) {
    rateLimitConfig = RATE_LIMITS.api
    rateLimitKey = `api:${ip}`
  }

  if (isRateLimited(rateLimitKey, rateLimitConfig)) {
    // Don't track as suspicious — rate limits are soft protection, not attacks
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': rateLimitConfig.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  // 5. Block direct access to sensitive files
  const blockedExtensions = ['.env', '.git', '.htaccess', '.htpasswd', '.DS_Store']
  if (blockedExtensions.some((ext) => pathname.includes(ext))) {
    console.warn(`[SECURITY] Blocked access to sensitive file: ${pathname} from ${ip}`)
    trackSuspicious(ip)
    return new NextResponse('Not Found', { status: 404 })
  }

  // 6. Validate request method for specific paths
  const method = request.method
  if (isApiPath && !['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].includes(method)) {
    console.warn(`[SECURITY] Invalid method ${method} for ${pathname} from ${ip}`)
    return new NextResponse('Method Not Allowed', { status: 405 })
  }

  // 7. Add security headers to response
  const response = await updateSession(request)

  // Add additional security headers
  response.headers.set('X-Request-ID', crypto.randomUUID())
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  // No caching for admin/auth paths
  if (isProtectedPath || isAuthPath) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
