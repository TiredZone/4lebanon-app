-- 4Lebanon News Database Indexes
-- Migration: 002_indexes.sql
-- Description: Create performance-optimized indexes

-- ============================================
-- ARTICLES INDEXES
-- ============================================

-- Primary listing queries (published articles, newest first)
CREATE INDEX idx_articles_published 
  ON articles (published_at DESC) 
  WHERE status IN ('published', 'scheduled') AND published_at IS NOT NULL;

-- Breaking news filter (high priority)
CREATE INDEX idx_articles_breaking 
  ON articles (is_breaking, published_at DESC) 
  WHERE is_breaking = true AND status = 'published';

-- Featured articles
CREATE INDEX idx_articles_featured 
  ON articles (is_featured, published_at DESC) 
  WHERE is_featured = true AND status = 'published';

-- Section-based listings
CREATE INDEX idx_articles_section 
  ON articles (section_id, published_at DESC)
  WHERE status = 'published';

-- Region-based listings
CREATE INDEX idx_articles_region 
  ON articles (region_id, published_at DESC)
  WHERE status = 'published';

-- Country-based listings
CREATE INDEX idx_articles_country 
  ON articles (country_id, published_at DESC)
  WHERE status = 'published';

-- Author dashboard (their own articles)
CREATE INDEX idx_articles_author 
  ON articles (author_id, updated_at DESC);

-- Status filter for admin
CREATE INDEX idx_articles_status 
  ON articles (status, updated_at DESC);

-- Slug lookup (for article pages)
CREATE INDEX idx_articles_slug 
  ON articles (slug);

-- View count for "most read" queries
CREATE INDEX idx_articles_views 
  ON articles (view_count DESC)
  WHERE status = 'published';

-- ============================================
-- FULL-TEXT SEARCH (Arabic using 'simple' config)
-- ============================================

-- Add generated tsvector column
ALTER TABLE articles ADD COLUMN search_vector tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('simple', 
      COALESCE(title_ar, '') || ' ' || 
      COALESCE(excerpt_ar, '') || ' ' || 
      COALESCE(body_md, '')
    )
  ) STORED;

-- GIN index for full-text search
CREATE INDEX idx_articles_fts 
  ON articles USING GIN (search_vector);

-- ============================================
-- TRIGRAM INDEXES (for fuzzy/partial matching)
-- ============================================

-- Title trigram for autocomplete/fuzzy search
CREATE INDEX idx_articles_title_trgm 
  ON articles USING GIN (title_ar gin_trgm_ops);

-- Body trigram for substring search fallback
CREATE INDEX idx_articles_body_trgm 
  ON articles USING GIN (body_md gin_trgm_ops);

-- ============================================
-- JUNCTION TABLE INDEXES
-- ============================================

-- For topic-based article queries
CREATE INDEX idx_article_topics_topic 
  ON article_topics (topic_id);

-- For article's topics list
CREATE INDEX idx_article_topics_article 
  ON article_topics (article_id);

-- ============================================
-- TAXONOMY TABLE INDEXES
-- ============================================

-- Sections by sort order
CREATE INDEX idx_sections_sort 
  ON sections (sort_order, id);

-- Regions by sort order
CREATE INDEX idx_regions_sort 
  ON regions (sort_order, id);

-- Countries by region
CREATE INDEX idx_countries_region 
  ON countries (region_id, sort_order);

-- Topics by sort order
CREATE INDEX idx_topics_sort 
  ON topics (sort_order, id);

-- ============================================
-- PROFILES INDEXES
-- ============================================

-- Profile lookup by display name (for author pages)
CREATE INDEX idx_profiles_name 
  ON profiles (display_name_ar);
