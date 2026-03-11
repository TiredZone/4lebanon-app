// Database types for 4Lebanon News
// These types mirror the Supabase schema

export type ArticleStatus = 'draft' | 'scheduled' | 'published'

export type UserRole = 'super_admin' | 'admin' | 'editor'

export type ArticlePriority = 1 | 2 | 3 | 4 | 5

export interface Profile {
  id: string
  display_name_ar: string
  avatar_url: string | null
  bio_ar: string | null
  role: UserRole
  created_at: string
  updated_at: string
}

export interface Section {
  id: number
  slug: string
  name_ar: string
  description_ar: string | null
  sort_order: number
  created_at: string
}

export interface Region {
  id: number
  slug: string
  name_ar: string
  sort_order: number
  created_at: string
}

export interface Country {
  id: number
  slug: string
  name_ar: string
  region_id: number | null
  sort_order: number
  created_at: string
}

export interface Topic {
  id: number
  slug: string
  name_ar: string
  sort_order: number
  created_at: string
}

export interface ArticleSource {
  title: string
  url: string
}

export interface Article {
  id: string
  author_id: string
  slug: string
  title_ar: string
  excerpt_ar: string | null
  body_md: string
  cover_image_path: string | null
  section_id: number | null
  region_id: number | null
  country_id: number | null
  status: ArticleStatus
  published_at: string | null
  is_breaking: boolean
  is_featured: boolean
  priority: ArticlePriority
  sort_position: number
  sources: ArticleSource[]
  view_count: number
  created_at: string
  updated_at: string
}

export interface ArticleTopic {
  article_id: string
  topic_id: number
}

// Extended types with relations
export interface ArticleWithRelations extends Article {
  author: Profile | null // Can be null if author was deleted
  section: Section | null
  region: Region | null
  country: Country | null
  topics: Topic[]
}

export interface ArticleListItem {
  id: string
  slug: string
  title_ar: string
  excerpt_ar: string | null
  cover_image_path: string | null
  published_at: string | null
  is_breaking: boolean
  is_featured: boolean
  priority: ArticlePriority
  author: Pick<Profile, 'id' | 'display_name_ar' | 'avatar_url'> | null // Can be null if author was deleted
  section: Pick<Section, 'id' | 'slug' | 'name_ar'> | null
}

// Utility types for forms
export interface ArticleFormData {
  title_ar: string
  excerpt_ar: string | null // Can be null or undefined - matches Zod schema
  body_md: string
  cover_image_path: string | null
  section_id: number | null
  region_id: number | null
  country_id: number | null
  status: ArticleStatus
  published_at: string | null
  priority: ArticlePriority
  sources: ArticleSource[]
  topic_ids: number[]
}

// Search result type
export interface SearchResult {
  articles: ArticleListItem[]
  total: number
  page: number
  per_page: number
}

// Filter params type
export interface ArticleFilters {
  section_id?: number
  region_id?: number
  country_id?: number
  topic_id?: number
  is_breaking?: boolean
  search?: string
  page?: number
  per_page?: number
}
