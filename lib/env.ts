import { z } from 'zod'

/**
 * Environment variable validation schema
 * Validates both server and client environment variables
 */

// Server-side environment variables (not exposed to client)
const serverEnvSchema = z.object({
  // Supabase Service Role Key (for admin operations)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  // Revalidation secret for webhook authentication
  REVALIDATE_SECRET: z.string().min(16, 'REVALIDATE_SECRET must be at least 16 characters'),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Client-side environment variables (exposed via NEXT_PUBLIC_ prefix)
const clientEnvSchema = z.object({
  // Supabase Project URL
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .refine((url) => url.includes('supabase'), 'Must be a Supabase URL'),

  // Supabase Anonymous Key (public, safe for client)
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),

  // Site URL for SEO and metadata
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url('NEXT_PUBLIC_SITE_URL must be a valid URL')
    .default('https://4lebanon.com'),
})

// Combined schema for server-side usage
const envSchema = serverEnvSchema.merge(clientEnvSchema)

// Type definitions
export type ServerEnv = z.infer<typeof serverEnvSchema>
export type ClientEnv = z.infer<typeof clientEnvSchema>
export type Env = z.infer<typeof envSchema>

/**
 * Validates environment variables at runtime
 * Call this in server startup or build time
 */
export function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment variables')
  }

  return parsed.data
}

/**
 * Validates only client-side environment variables
 * Safe to call from any component
 */
export function validateClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  })

  if (!parsed.success) {
    console.error('❌ Invalid client environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid client environment variables')
  }

  return parsed.data
}

/**
 * Get validated environment variable (server-side only)
 * Use this to access env vars with type safety
 */
export function getEnv<K extends keyof Env>(key: K): Env[K] {
  const value = process.env[key]

  // For optional values with defaults, return early
  if (key === 'NODE_ENV') {
    return (value || 'development') as Env[K]
  }

  if (key === 'NEXT_PUBLIC_SITE_URL') {
    return (value || 'https://4lebanon.com') as Env[K]
  }

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }

  return value as Env[K]
}

/**
 * Check if we're in production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

/**
 * Check if we're in development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}
