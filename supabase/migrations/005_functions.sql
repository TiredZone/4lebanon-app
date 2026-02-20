-- 4Lebanon News Database Functions
-- Migration: 005_functions.sql
-- Description: Helper functions for the application

-- ============================================
-- INCREMENT VIEW COUNT
-- ============================================
-- Safe increment that doesn't fail on concurrent updates
CREATE OR REPLACE FUNCTION increment_view_count(article_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE articles 
  SET view_count = view_count + 1 
  WHERE id = article_id
    AND status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET PUBLISHED ARTICLES COUNT
-- ============================================
CREATE OR REPLACE FUNCTION get_published_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM articles 
    WHERE status = 'published' 
    AND published_at <= NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEARCH ARTICLES
-- ============================================
CREATE OR REPLACE FUNCTION search_articles(
  search_query TEXT,
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title_ar TEXT,
  excerpt_ar TEXT,
  cover_image_path TEXT,
  published_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.slug,
    a.title_ar,
    a.excerpt_ar,
    a.cover_image_path,
    a.published_at,
    ts_rank(a.search_vector, to_tsquery('simple', search_query)) as rank
  FROM articles a
  WHERE 
    a.status = 'published'
    AND a.published_at <= NOW()
    AND a.search_vector @@ to_tsquery('simple', search_query)
  ORDER BY rank DESC, a.published_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEARCH ARTICLES COUNT (for pagination)
-- ============================================
CREATE OR REPLACE FUNCTION search_articles_count(
  search_query TEXT
)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM articles a
    WHERE
      a.status = 'published'
      AND a.published_at <= NOW()
      AND a.search_vector @@ to_tsquery('simple', search_query)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET RELATED ARTICLES
-- ============================================
CREATE OR REPLACE FUNCTION get_related_articles(
  article_uuid UUID,
  section_id_param INTEGER,
  limit_count INTEGER DEFAULT 4
)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title_ar TEXT,
  cover_image_path TEXT,
  published_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.slug,
    a.title_ar,
    a.cover_image_path,
    a.published_at
  FROM articles a
  WHERE 
    a.id != article_uuid
    AND a.status = 'published'
    AND a.published_at <= NOW()
    AND (section_id_param IS NULL OR a.section_id = section_id_param)
  ORDER BY a.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
