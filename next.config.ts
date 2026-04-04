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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Powered by header removal (security through obscurity)
  poweredByHeader: false,

  // Comprehensive security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development'

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
      // Restrict browser features - MAXIMUM RESTRICTIONS
      {
        key: 'Permissions-Policy',
        value: [
          'camera=()',
          'microphone=()',
          'geolocation=()',
          'interest-cohort=()',
          'accelerometer=()',
          'autoplay=()',
          'encrypted-media=()',
          'fullscreen=(self)',
          'gyroscope=()',
          'magnetometer=()',
          'midi=()',
          'payment=()',
          'picture-in-picture=()',
          'sync-xhr=()',
          'usb=()',
          'xr-spatial-tracking=()',
          'clipboard-read=()',
          'clipboard-write=(self)',
        ].join(', '),
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
      // Content Security Policy - MAXIMUM SECURITY (skip in dev for Turbopack compatibility)
      ...(isDev
        ? []
        : [
            {
              key: 'Content-Security-Policy',
              value: [
                // Default: only same origin
                "default-src 'self'",
                // Scripts: self + Vercel analytics (unsafe-inline needed for Next.js hydration)
                "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://www.clarity.ms https://scripts.clarity.ms",
                // Styles: self + inline (needed for Tailwind) + Google Fonts
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                // Fonts: self + Google Fonts
                "font-src 'self' https://fonts.gstatic.com data:",
                // Images: self + Supabase storage + Unsplash
                `img-src 'self' data: blob: https://${supabaseHost} https://*.supabase.co https://images.unsplash.com https://www.clarity.ms https://*.clarity.ms https://c.bing.com`,
                // Connections: self + Supabase + Vercel
                `connect-src 'self' https://${supabaseHost} https://*.supabase.co https://va.vercel-scripts.com https://www.clarity.ms https://*.clarity.ms wss://${supabaseHost}`,
                // No iframes allowed to embed this site
                "frame-ancestors 'none'",
                // Allow Supabase iframes for auth session management
                `frame-src 'self' https://${supabaseHost}`,
                // Base URI restriction
                "base-uri 'self'",
                // Form submissions only to same origin
                "form-action 'self'",
                // No plugins (Flash, Java, etc.)
                "object-src 'none'",
                // No media except from self and Supabase
                `media-src 'self' https://${supabaseHost}`,
                // Workers only from self
                "worker-src 'self' blob:",
                // Manifests only from self
                "manifest-src 'self'",
                // Upgrade HTTP to HTTPS
                'upgrade-insecure-requests',
                // Block all mixed content
                'block-all-mixed-content',
              ].join('; '),
            },
          ]),
      // Cross-Origin-Embedder-Policy for enhanced isolation
      {
        key: 'Cross-Origin-Embedder-Policy',
        value: 'credentialless',
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
