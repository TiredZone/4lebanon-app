-- ============================================
-- 011: Admin manages editor articles
-- ============================================
-- Allows admin role to read, update, and delete articles written by editors.
-- Hierarchy: super_admin > admin > editor
-- Admins cannot touch other admins' or super_admins' articles.

-- ============================================
-- 1. RLS POLICIES FOR ADMIN ON EDITOR ARTICLES
-- ============================================

-- Admin can read articles by editors
CREATE POLICY "articles_admin_read_editor" ON articles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = articles.author_id AND p2.role = 'editor'
    )
  );

-- Admin can update articles by editors
CREATE POLICY "articles_admin_update_editor" ON articles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = articles.author_id AND p2.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'admin'
    )
  );

-- Admin can delete articles by editors
CREATE POLICY "articles_admin_delete_editor" ON articles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM profiles p2
      WHERE p2.id = articles.author_id AND p2.role = 'editor'
    )
  );

-- ============================================
-- 2. RLS POLICIES FOR ADMIN ON EDITOR ARTICLE_TOPICS
-- ============================================

-- Admin can read article-topic relationships for editor articles
CREATE POLICY "article_topics_admin_read_editor" ON article_topics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM articles a
      JOIN profiles p2 ON p2.id = a.author_id
      WHERE a.id = article_topics.article_id AND p2.role = 'editor'
    )
  );

-- Admin can manage topics for editor articles
CREATE POLICY "article_topics_admin_insert_editor" ON article_topics
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM articles a
      JOIN profiles p2 ON p2.id = a.author_id
      WHERE a.id = article_topics.article_id AND p2.role = 'editor'
    )
  );

CREATE POLICY "article_topics_admin_delete_editor" ON article_topics
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p1
      WHERE p1.id = auth.uid() AND p1.role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM articles a
      JOIN profiles p2 ON p2.id = a.author_id
      WHERE a.id = article_topics.article_id AND p2.role = 'editor'
    )
  );
