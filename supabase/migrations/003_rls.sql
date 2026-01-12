-- 4Lebanon News Row Level Security Policies
-- Migration: 003_rls.sql
-- Description: Implement strict RLS for data security

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_topics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Public can view all author profiles
CREATE POLICY "profiles_public_read" ON profiles
  FOR SELECT
  USING (true);

-- Authors can update their own profile
CREATE POLICY "profiles_owner_update" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================
-- TAXONOMY TABLES POLICIES (Read-only for public)
-- ============================================

-- Sections: public read, no client writes
CREATE POLICY "sections_public_read" ON sections
  FOR SELECT
  USING (true);

-- Regions: public read, no client writes
CREATE POLICY "regions_public_read" ON regions
  FOR SELECT
  USING (true);

-- Countries: public read, no client writes
CREATE POLICY "countries_public_read" ON countries
  FOR SELECT
  USING (true);

-- Topics: public read, no client writes
CREATE POLICY "topics_public_read" ON topics
  FOR SELECT
  USING (true);

-- ============================================
-- ARTICLES POLICIES
-- ============================================

-- Public can only view published articles where published_at <= now()
-- This handles scheduled publishing without cron jobs
CREATE POLICY "articles_public_read" ON articles
  FOR SELECT
  USING (
    status IN ('published', 'scheduled') 
    AND published_at IS NOT NULL 
    AND published_at <= NOW()
  );

-- Authors can view ALL their own articles (including drafts)
CREATE POLICY "articles_author_read" ON articles
  FOR SELECT
  USING (author_id = auth.uid());

-- Authors can insert articles (only for themselves)
CREATE POLICY "articles_author_insert" ON articles
  FOR INSERT
  WITH CHECK (author_id = auth.uid());

-- Authors can update ONLY their own articles
CREATE POLICY "articles_author_update" ON articles
  FOR UPDATE
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Authors can delete ONLY their own articles
CREATE POLICY "articles_author_delete" ON articles
  FOR DELETE
  USING (author_id = auth.uid());

-- ============================================
-- ARTICLE_TOPICS POLICIES
-- ============================================

-- Public can read article-topic relationships for published articles
CREATE POLICY "article_topics_public_read" ON article_topics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_topics.article_id 
      AND status IN ('published', 'scheduled')
      AND published_at IS NOT NULL 
      AND published_at <= NOW()
    )
  );

-- Authors can read their own article-topic relationships
CREATE POLICY "article_topics_author_read" ON article_topics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_topics.article_id 
      AND articles.author_id = auth.uid()
    )
  );

-- Authors can manage topics only for their own articles
CREATE POLICY "article_topics_author_insert" ON article_topics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_topics.article_id 
      AND articles.author_id = auth.uid()
    )
  );

CREATE POLICY "article_topics_author_delete" ON article_topics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM articles 
      WHERE articles.id = article_topics.article_id 
      AND articles.author_id = auth.uid()
    )
  );

-- ============================================
-- SERVICE ROLE BYPASS
-- ============================================
-- Note: Service role key bypasses RLS automatically in Supabase
-- This is useful for server-side operations like sitemap generation

-- ============================================
-- HELPER FUNCTION: Check if article is visible
-- ============================================
CREATE OR REPLACE FUNCTION is_article_visible(article_row articles)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    article_row.status IN ('published', 'scheduled') 
    AND article_row.published_at IS NOT NULL 
    AND article_row.published_at <= NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
