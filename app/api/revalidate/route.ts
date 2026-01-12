import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Secret token for webhook authentication
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET

export async function POST(request: NextRequest) {
  try {
    // Verify secret token
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!REVALIDATE_SECRET || token !== REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { type, slug, paths } = body

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
        // Revalidate specific paths
        if (Array.isArray(paths)) {
          for (const path of paths) {
            revalidatePath(path)
          }
        }
        break

      case 'all':
        // Revalidate everything (use sparingly)
        revalidatePath('/', 'layout')
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ revalidated: true, now: Date.now() })
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// GET handler for health check
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
