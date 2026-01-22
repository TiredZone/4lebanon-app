import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

// Secret token for webhook authentication
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60000 // 1 minute
  const maxRequests = 10

  const entry = rateLimitMap.get(ip)
  if (!entry || entry.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  entry.count++
  return entry.count <= maxRequests
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfIp = request.headers.get('cf-connecting-ip')

  if (forwarded) return forwarded.split(',')[0].trim()
  return cfIp || realIp || 'unknown'
}

// Timing-safe string comparison to prevent timing attacks
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  // Rate limiting
  if (!checkRateLimit(ip)) {
    console.warn(`[SECURITY] Revalidate rate limit exceeded for IP: ${ip}`)
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  try {
    // Verify secret token with timing-safe comparison
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || ''

    if (!REVALIDATE_SECRET || !timingSafeEqual(token, REVALIDATE_SECRET)) {
      console.warn(`[SECURITY] Invalid revalidate token from IP: ${ip}`)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { type, slug, paths } = body

    // Validate type
    const allowedTypes = ['article', 'section', 'author', 'paths', 'all']
    if (!type || !allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    // Validate slug format (alphanumeric, hyphens, underscores only)
    const slugPattern = /^[a-zA-Z0-9_-]+$/
    if (slug && !slugPattern.test(slug)) {
      console.warn(`[SECURITY] Invalid slug format from IP: ${ip}`)
      return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })
    }

    // Validate paths (must start with / and not contain suspicious patterns)
    const suspiciousPatterns = [/\.\./, /<script/i, /javascript:/i, /\0/]
    const validatePath = (path: string): boolean => {
      if (!path.startsWith('/')) return false
      return !suspiciousPatterns.some((p) => p.test(path))
    }

    // Revalidate based on type
    switch (type) {
      case 'article':
        // Revalidate article page and related pages
        if (slug) {
          revalidatePath(`/article/${slug}`)
        }
        revalidatePath('/') // Homepage
        revalidatePath('/sitemap.xml')
        revalidatePath('/rss.xml')
        break

      case 'section':
        if (slug) {
          revalidatePath(`/section/${slug}`)
        }
        revalidatePath('/')
        break

      case 'author':
        if (slug) {
          revalidatePath(`/author/${slug}`)
        }
        break

      case 'paths':
        // Revalidate specific paths with validation
        if (Array.isArray(paths)) {
          const validPaths = paths.filter(
            (p): p is string => typeof p === 'string' && validatePath(p)
          )
          for (const path of validPaths) {
            revalidatePath(path)
          }
        }
        break

      case 'all':
        // Revalidate everything (use sparingly)
        revalidatePath('/', 'layout')
        break
    }

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Revalidation error:', error)
    // Don't leak error details
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
