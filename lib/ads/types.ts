export type AdPlacement =
  | 'home-after-latest'
  | 'home-mid-sections'
  | 'home-before-mostread'
  | 'article-sidebar'
  | 'article-in-body'
  | 'article-after-recommended'

export type AdVariant = 'banner' | 'card' | 'sidebar'

export interface AdCreative {
  /** Stable slug; used as React key and data-promo-id. */
  id: string
  placement: AdPlacement
  /** '/ads/foo.svg' (local) | full https URL | bare Supabase storage path. */
  src: string
  /** Advertiser destination URL. */
  href: string
  /** Arabic alt text (accessibility + SEO). */
  alt: string
  /** Optional label override; defaults to 'إعلان'. */
  label?: string
  /** Intrinsic px — REQUIRED. Drives the reserved aspect-ratio box (CLS defense). */
  width: number
  height: number
  /** Rotation weight (default 1). */
  weight?: number
  /** Default true. */
  active?: boolean
  /** Optional ISO flight window. */
  startAt?: string
  endAt?: string
}
