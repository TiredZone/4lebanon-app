-- ============================================
-- 008: Add role column to profiles
-- ============================================
-- Enables admin vs. editor distinction.
-- Default 'editor' so existing users are unaffected.
-- Only a service-role / superadmin migration can promote to 'admin'.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'editor'
  CHECK (role IN ('admin', 'editor'));

COMMENT ON COLUMN profiles.role IS 'User role: admin (full access) or editor (content only)';
