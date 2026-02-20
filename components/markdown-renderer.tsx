'use client'

import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`article-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Custom link component for external links with URL validation
          a: ({ href, children, ...props }) => {
            // Validate URL to prevent XSS via javascript: or data: URLs
            const isValidUrl = (url: string | undefined): boolean => {
              if (!url) return false
              // Allow relative URLs
              if (url.startsWith('/') || url.startsWith('#')) return true
              // Only allow http/https protocols
              try {
                const parsed = new URL(url)
                return ['http:', 'https:'].includes(parsed.protocol)
              } catch {
                return false
              }
            }

            const safeHref = isValidUrl(href) ? href : undefined
            const isExternal = safeHref?.startsWith('http')

            if (!safeHref) {
              // Invalid URL - render as plain text
              return <span {...props}>{children}</span>
            }

            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                {...props}
              >
                {children}
              </a>
            )
          },
          // Custom image component with URL validation
          img: ({ src, alt, ...props }) => {
            // Validate image source - only accept strings, not Blobs
            const isValidSrc = (url: string | undefined): boolean => {
              if (!url) return false
              if (url.startsWith('/')) return true // Relative URL
              if (url.startsWith('data:image/')) return true // Data URL for images only
              try {
                const parsed = new URL(url)
                return ['http:', 'https:'].includes(parsed.protocol)
              } catch {
                return false
              }
            }

            // Handle case where src might be a Blob (we only accept string URLs)
            const srcString = typeof src === 'string' ? src : undefined
            const safeSrc = isValidSrc(srcString) ? srcString : undefined
            if (!safeSrc) return null

            return (
              <figure className="my-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={safeSrc}
                  alt={alt || ''}
                  className="mx-auto max-w-full rounded-lg"
                  loading="lazy"
                  {...props}
                />
                {alt && (
                  <figcaption className="text-muted-foreground mt-2 text-center text-sm">
                    {alt}
                  </figcaption>
                )}
              </figure>
            )
          },
          // Custom blockquote
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-primary text-muted-foreground my-6 border-r-4 pr-4 italic"
              {...props}
            >
              {children}
            </blockquote>
          ),
          // Custom code block
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match

            if (isInline) {
              return (
                <code className="bg-muted text-primary rounded px-1.5 py-0.5 text-sm" {...props}>
                  {children}
                </code>
              )
            }

            return (
              <pre className="my-4 overflow-x-auto rounded-lg bg-gray-900 p-4">
                <code className={`text-sm text-gray-100 ${className}`} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
          // Custom table
          table: ({ children, ...props }) => (
            <div className="my-6 overflow-x-auto">
              <table
                className="divide-border border-border min-w-full divide-y rounded-lg border"
                {...props}
              >
                {children}
              </table>
            </div>
          ),
          th: ({ children, ...props }) => (
            <th
              className="bg-muted text-foreground px-4 py-3 text-right text-sm font-semibold"
              {...props}
            >
              {children}
            </th>
          ),
          td: ({ children, ...props }) => (
            <td className="text-foreground px-4 py-3 text-sm" {...props}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
