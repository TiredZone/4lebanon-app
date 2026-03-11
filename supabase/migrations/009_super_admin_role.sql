-- ============================================
-- 009: Add super_admin role
-- ============================================
-- Adds super_admin role with full control over all articles and sections.
-- Regular admins/editors can only manage their own articles.
-- Only super_admin can manage sections (categories).
-- super_admin promotion is done via direct DB access only.

-- ============================================
-- 1. UPDATE CHECK CONSTRAINT
-- ============================================
-- Drop existing inline check constraint and add new one including super_admin
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_catalog.pg_constraint con
  JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
  JOIN pg_catalog.pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
  WHERE rel.relname = 'profiles' AND att.attname = 'role' AND con.contype = 'c';

  IF constraint_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || constraint_name;
  END IF;
END $$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('super_admin', 'admin', 'editor'));

COMMENT ON COLUMN profiles.role IS 'User role: super_admin (full control), admin (own content), editor (own content)';

-- ============================================
-- 2. RLS POLICIES FOR SUPER_ADMIN ON ARTICLES
-- ============================================

-- Super admin can read ALL articles (including other authors'' drafts)
CREATE POLICY "articles_super_admin_read" ON articles
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can update ANY article
CREATE POLICY "articles_super_admin_update" ON articles
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can delete ANY article
CREATE POLICY "articles_super_admin_delete" ON articles
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- ============================================
-- 3. RLS POLICIES FOR SUPER_ADMIN ON ARTICLE_TOPICS
-- ============================================

-- Super admin can read all article-topic relationships
CREATE POLICY "article_topics_super_admin_read" ON article_topics
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Super admin can manage topics for any article
CREATE POLICY "article_topics_super_admin_insert" ON article_topics
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "article_topics_super_admin_update" ON article_topics
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "article_topics_super_admin_delete" ON article_topics
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
  );
