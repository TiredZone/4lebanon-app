import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Simple in-memory rate limiting for middleware
// In production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const key = `middleware:${ip}`

  let entry = rateLimitMap.get(key)

  if (!entry || entry.resetTime < now) {
    entry = { count: 1, resetTime: now + windowMs }
    rateLimitMap.set(key, entry)
    return true
  }

  entry.count++

  if (entry.count > limit) {
    return false
  }

  return true
}

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitMap.entries()) {
      if (entry.resetTime < now) {
        rateLimitMap.delete(key)
      }
    }
  }, 300000)
}

function getClientIp(request: NextRequest): string {
  // First check Cloudflare header (most trusted when using CF)
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  // Check X-Real-IP (set by nginx/other reverse proxies)
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  // X-Forwarded-For can be spoofed - only use rightmost IP which is the one
  // added by the most trusted proxy closest to the server
  // WARNING: This is still vulnerable if you're not behind a trusted proxy
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const ips = forwarded.split(',').map((ip) => ip.trim())
    // In a proper setup, use the rightmost non-internal IP
    // For now, use the first IP but log a warning in development
    if (process.env.NODE_ENV === 'development' && ips.length > 1) {
      console.warn('[SECURITY] Multiple IPs in x-forwarded-for - potential spoofing')
    }
    return ips[0]
  }

  return 'unknown'
}

// Known malicious bot user agents
const BLOCKED_USER_AGENTS = [
  /masscan/i,
  /nikto/i,
  /sqlmap/i,
  /nmap/i,
  /dirbuster/i,
  /gobuster/i,
  /wpscan/i,
  /nuclei/i,
  /zgrab/i,
  /python-requests\/2\.[0-9]+/i, // Often used for scraping
  /curl\/[0-9]/i, // Block raw curl requests (legitimate users use browsers)
  /libwww-perl/i,
  /wget/i,
  /scrapy/i,
  /httpclient/i,
]

// Check if user agent is a known malicious bot
function isBlockedBot(userAgent: string | null): boolean {
  if (!userAgent) return false
  return BLOCKED_USER_AGENTS.some((pattern) => pattern.test(userAgent))
}

// Validate HTTP method for the given path
function isValidMethod(method: string, pathname: string): boolean {
  const allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']
  if (!allowedMethods.includes(method.toUpperCase())) {
    return false
  }

  // Only allow GET/HEAD for public pages
  if (!pathname.startsWith('/api/') && !pathname.startsWith('/admin')) {
    return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())
  }

  return true
}

export async function updateSession(request: NextRequest) {
  const ip = getClientIp(request)
  const { pathname } = request.nextUrl
  const userAgent = request.headers.get('user-agent')
  const { method } = request

  // Block known malicious bots
  if (isBlockedBot(userAgent)) {
    console.warn(`[SECURITY] Blocked malicious bot: ${userAgent} from IP: ${ip}`)
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Validate HTTP method for the path
  if (!isValidMethod(method, pathname)) {
    console.warn(`[SECURITY] Invalid method ${method} for ${pathname} from IP: ${ip}`)
    return new NextResponse('Method Not Allowed', { status: 405 })
  }

  // Rate limiting for all requests (1000 requests per minute)
  if (!checkRateLimit(ip, 1000, 60000)) {
    console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip}`)
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Remaining': '0',
      },
    })
  }

  // Stricter rate limiting for auth endpoints (10 requests per 5 minutes)
  const isAuthEndpoint = pathname.includes('/login') || pathname.includes('/signup')
  if (isAuthEndpoint && !checkRateLimit(`auth:${ip}`, 10, 300000)) {
    console.warn(`[SECURITY] Auth rate limit exceeded for IP: ${ip}`)
    return new NextResponse('Too Many Authentication Attempts', {
      status: 429,
      headers: {
        'Retry-After': '300',
      },
    })
  }

  // Block suspicious patterns - only test against pathname (not full URL with hostname)
  const suspiciousPathPatterns = [
    /\.\./, // Path traversal
    /<script/i, // XSS attempt
    /javascript:/i, // JavaScript injection
    /vbscript:/i, // VBScript injection
    /on\w+\s*=/i, // Event handler injection
    /union\s+select/i, // SQL injection
    /\b(drop|delete|truncate)\s+table/i, // SQL injection
    /\/etc\/passwd/i, // LFI attempt
    /\/\.env\b/i, // Env file access (with path separator to avoid false positives)
    /\/wp-admin/i, // WordPress scan
    /\/phpMyAdmin/i, // phpMyAdmin scan
    /\/\.git\b/i, // Git access (with path separator to avoid false positives)
    /\/\.htaccess/i, // Apache config
  ]

  // Test against pathname and search params only, not the full URL which includes hostname
  const pathAndSearch = pathname + (request.nextUrl.search || '')
  for (const pattern of suspiciousPathPatterns) {
    if (pattern.test(pathAndSearch)) {
      console.warn(`[SECURITY] Suspicious request blocked: ${pathname} from IP: ${ip}`)
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Check request body size for POST/PUT requests
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
    // 10MB limit
    return new NextResponse('Request Entity Too Large', { status: 413 })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Enhance cookie security - do NOT set httpOnly as Supabase
              // client-side JS needs to read auth cookies for session management
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
            })
          )
        },
      },
    }
  )

  // Refresh the session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    // Allow access to login and signup pages
    if (pathname === '/admin/login' || pathname === '/admin/signup') {
      // If already logged in, redirect to admin dashboard
      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
      return supabaseResponse
    }

    // All other admin routes require authentication
    if (!user) {
      console.log(`[SECURITY] Unauthenticated access attempt to ${pathname} from IP: ${ip}`)
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    // Verify user has admin or editor role (graceful: skip if column doesn't exist yet)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profileError && profile) {
      const role = (profile as { role?: string }).role
      if (role && !['super_admin', 'admin', 'editor'].includes(role)) {
        console.warn(
          `[SECURITY] Unauthorized admin access: user ${user.id} role=${role} path=${pathname} IP=${ip}`
        )
        return new NextResponse('Forbidden', { status: 403 })
      }
    }

    // Log admin access
    if (process.env.NODE_ENV === 'development') {
      const role = (profile as { role?: string } | null)?.role || 'unknown'
      console.log(`[ADMIN] User ${user.id} (${role}) accessed ${pathname}`)
    }
  }

  // Protect API routes
  if (pathname.startsWith('/api/')) {
    // Add security headers to API responses
    supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff')
    supabaseResponse.headers.set('X-Frame-Options', 'DENY')

    // Stricter rate limiting for API (100 requests per minute)
    if (!checkRateLimit(`api:${ip}`, 100, 60000)) {
      return new NextResponse(JSON.stringify({ error: 'Too Many Requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '60',
        },
      })
    }

    // Validate origin for API requests (strict CSRF protection)
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (origin && host) {
      try {
        const originUrl = new URL(origin)
        const isCrossOrigin = originUrl.host !== host

        // Only allow same-origin requests or specific trusted Vercel deployments
        // Note: In production, replace with your actual domain
        const trustedDomains = ['4lebanon.com', 'www.4lebanon.com', 'localhost']

        // Check if this is our own Vercel deployment (same project)
        const isOwnVercelDeployment =
          (originUrl.host.endsWith('.vercel.app') &&
            host.endsWith('.vercel.app') &&
            originUrl.host.split('-')[0] === host.split('-')[0]) || // Same project prefix
          trustedDomains.some(
            (domain) => originUrl.host === domain || originUrl.host.endsWith(`.${domain}`)
          )

        if (isCrossOrigin && !isOwnVercelDeployment) {
          console.warn(`[SECURITY] CORS violation: origin ${origin} for host ${host}`)
          return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      } catch {
        // Invalid origin URL - block the request
        console.warn(`[SECURITY] Invalid origin header: ${origin}`)
        return new NextResponse(JSON.stringify({ error: 'Bad Request' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }
  }

  // Add pathname header for logging
  supabaseResponse.headers.set('x-pathname', pathname)

  return supabaseResponse
}
