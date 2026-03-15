import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'isomorphic-dompurify'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'hr',
    'h1',
    'h2',
    'h3',
    'h4',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'del',
    'a',
    'img',
    'ul',
    'ol',
    'li',
    'blockquote',
    'code',
    'pre',
    'figure',
    'figcaption',
    'div',
    'span',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'width', 'height', 'class', 'dir', 'style'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ALLOW_DATA_ATTR: false,
}

function isHtmlContent(content: string): boolean {
  return content.trimStart().startsWith('<')
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // HTML content from the WYSIWYG editor
  if (isHtmlContent(content)) {
    const sanitized = DOMPurify.sanitize(content, DOMPURIFY_CONFIG)
    return (
      <div
        className={`article-body ${className}`}
        dangerouslySetInnerHTML={{ __html: sanitized }}
      />
    )
  }

  // Legacy Markdown content
  return (
    <div className={`article-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          // Custom link component for external links with URL validation
          a: ({ href, children, ...props }) => {
            const isValidUrl = (url: string | undefined): boolean => {
              if (!url) return false
              if (url.startsWith('/') || url.startsWith('#')) return true
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
          img: ({ src, alt }) => {
            const isValidSrc = (url: string | undefined): boolean => {
              if (!url) return false
              if (url.startsWith('/')) return true
              try {
                const parsed = new URL(url)
                return ['http:', 'https:'].includes(parsed.protocol)
              } catch {
                return false
              }
            }

            const srcString = typeof src === 'string' ? src : undefined
            const safeSrc = isValidSrc(srcString) ? srcString : undefined
            if (!safeSrc) return null

            return (
              <figure className="my-6">
                <Image
                  src={safeSrc}
                  alt={alt || ''}
                  width={800}
                  height={450}
                  className="mx-auto max-w-full rounded-lg"
                  sizes="(max-width: 768px) 100vw, 800px"
                  loading="lazy"
                />
                {alt && (
                  <figcaption className="text-muted-foreground mt-2 text-center text-sm">
                    {alt}
                  </figcaption>
                )}
              </figure>
            )
          },
          blockquote: ({ children, ...props }) => (
            <blockquote
              className="border-primary text-muted-foreground my-6 border-r-4 pr-4 italic"
              {...props}
            >
              {children}
            </blockquote>
          ),
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
