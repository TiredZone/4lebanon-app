import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component - cookies can only be modified in Server Actions or Route Handlers
          }
        },
      },
    }
  )
}

/**
 * Cookie-free anon client for public, cacheable reads.
 *
 * `createClient()` above calls `cookies()`, which is a dynamic API — any route
 * touching it opts out of static rendering. On a route that pairs
 * `generateStaticParams` with `revalidate` (article, section), that combination
 * makes every path NOT prerendered at build time fail at request time with
 * `DYNAMIC_SERVER_USAGE`, i.e. a 500.
 *
 * Public pages read only published rows that anon RLS already exposes and never
 * need a session, so they use this client and stay statically renderable and
 * ISR-cacheable. Anything that reads or writes the logged-in user (admin, auth
 * callback, upload, search) must keep using `createClient()`.
 */
export async function createStaticClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Service role client for admin operations (bypasses RLS)
// Uses standard client instead of SSR client to properly bypass RLS
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
