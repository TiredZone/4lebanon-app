export type AdPlacement =
  | 'home-top'
  | 'home-after-featured'
  | 'home-after-latest'
  | 'home-mid-sections'
  | 'home-before-mostread'
  | 'article-top'
  | 'article-sidebar'
  | 'article-in-body'
  | 'article-after-recommended'

export type AdVariant = 'wide' | 'card' | 'sidebar'

export interface AdCreative {
  /** Stable slug; used as React key and data-promo-id. */
  id: string
  placement: AdPlacement
  /** '/ads/foo.svg' (local) | full https URL | bare Supabase storage path. */
  src: string
  /**
   * Advertiser destination URL. OPTIONAL: an advertiser that supplied artwork
   * but no landing page renders as an unlinked plate — same box, same label,
   * just nothing to click. Omit the field entirely rather than passing ''.
   */
  href?: string
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
