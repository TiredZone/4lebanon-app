'use client'

import { useState } from 'react'
import { ImageLightbox } from './image-lightbox'

interface ArticleHeroImageProps {
  src: string
  alt: string
  caption?: string
}

export function ArticleHeroImage({ src, alt, caption }: ArticleHeroImageProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)

  return (
    <>
      <figure
        className="article-hero-image"
        onClick={() => setLightboxOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setLightboxOpen(true)}
        aria-label="اضغط لتكبير الصورة"
      >
        {/* Using native img for better aspect ratio handling with object-fit: contain */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} loading="eager" />
        {caption && <figcaption className="article-image-caption">{caption}</figcaption>}
      </figure>

      <ImageLightbox
        src={src}
        alt={alt}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  )
}
