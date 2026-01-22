import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Enable experimental features
  experimental: {
    // Turbopack is now default in Next.js 16
  },

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Powered by header removal (security through obscurity)
  poweredByHeader: false,

  // Comprehensive security headers
  async headers() {
    // Get Supabase URL for CSP
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'
    const supabaseHost = supabaseUrl.replace('https://', '')

    // Common security headers for all routes
    const securityHeaders = [
      // Prevent clickjacking attacks
      {
        key: 'X-Frame-Options',
        value: 'DENY',
      },
      // Prevent MIME type sniffing
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      // Control referrer information
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      // DNS prefetching
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      // Force HTTPS for 2 years with preload
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload',
      },
      // Restrict browser features
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
      },
      // XSS protection for legacy browsers
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      // Cross-Origin policies
      {
        key: 'Cross-Origin-Opener-Policy',
        value: 'same-origin',
      },
      {
        key: 'Cross-Origin-Resource-Policy',
        value: 'same-origin',
      },
      // Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com data:",
          `img-src 'self' data: blob: https://${supabaseHost} https://*.supabase.co`,
          `connect-src 'self' https://${supabaseHost} https://*.supabase.co https://va.vercel-scripts.com wss://${supabaseHost}`,
          "frame-ancestors 'none'",
          "base-uri 'self'",
          "form-action 'self'",
          "object-src 'none'",
          'upgrade-insecure-requests',
        ].join('; '),
      },
    ]

    return [
      // Apply security headers to all routes
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      // Additional cache control for API routes
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      // Strict headers for admin routes
      {
        source: '/admin/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, private',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ]
  },
}

export default nextConfig
