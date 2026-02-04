'use client'

import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { getStorageUrl } from '@/lib/utils'

interface NewsImageProps {
  src: string | null | undefined
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  containerClassName?: string
  priority?: boolean
  sizes?: string
  aspect?: 'hero' | 'card' | 'thumb' | 'square'
}

export function NewsImage({
  src,
  alt,
  fill = true,
  width,
  height,
  className,
  containerClassName,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  aspect = 'card',
}: NewsImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const aspectClasses = {
    hero: 'aspect-news-hero',
    card: 'aspect-news-card',
    thumb: 'aspect-news-thumb',
    square: 'aspect-news-square',
  }

  // No image or error - show fallback
  if (!src || hasError) {
    return (
      <div
        className={cn(
          'image-fallback relative overflow-hidden',
          aspectClasses[aspect],
          containerClassName
        )}
        role="img"
        aria-label={alt}
      />
    )
  }

  const imageUrl = src.startsWith('http') ? src : getStorageUrl(src)

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-gray-100',
        aspectClasses[aspect],
        containerClassName
      )}
    >
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100" />
      )}

      {fill ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            'object-cover object-center transition-all duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true)
            setIsLoading(false)
          }}
        />
      ) : (
        <Image
          src={imageUrl}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          className={cn(
            'object-cover object-center transition-all duration-500',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true)
            setIsLoading(false)
          }}
        />
      )}
    </div>
  )
}
