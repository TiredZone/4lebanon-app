-- Migration: 014_article_countries.sql
-- Description: Convert single country_id to many-to-many article_countries junction table

-- ============================================
-- CREATE JUNCTION TABLE (mirrors article_topics)
-- ============================================
CREATE TABLE article_countries (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  country_id INT NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, country_id)
);

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE article_countries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (mirrors article_topics exactly)
-- ============================================

-- Public can read country relationships for published articles
CREATE POLICY "article_countries_public_read" ON article_countries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_countries.article_id
      AND status = 'published'
      AND published_at IS NOT NULL
      AND published_at <= NOW()
    )
  );

-- Authors can read their own article-country relationships
CREATE POLICY "article_countries_author_read" ON article_countries
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_countries.article_id
      AND articles.author_id = auth.uid()
    )
  );

-- Authors can manage countries for their own articles
CREATE POLICY "article_countries_author_insert" ON article_countries
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_countries.article_id
      AND articles.author_id = auth.uid()
    )
  );

CREATE POLICY "article_countries_author_delete" ON article_countries
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_countries.article_id
      AND articles.author_id = auth.uid()
    )
  );

CREATE POLICY "article_countries_author_update" ON article_countries
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_countries.article_id
      AND articles.author_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM articles
      WHERE articles.id = article_countries.article_id
      AND articles.author_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_article_countries_country ON article_countries (country_id);
CREATE INDEX idx_article_countries_article ON article_countries (article_id);

-- ============================================
-- MIGRATE EXISTING DATA
-- ============================================
INSERT INTO article_countries (article_id, country_id)
SELECT id, country_id FROM articles WHERE country_id IS NOT NULL;

-- ============================================
-- DROP OLD COLUMN
-- ============================================
DROP INDEX IF EXISTS idx_articles_country;
ALTER TABLE articles DROP COLUMN country_id;
