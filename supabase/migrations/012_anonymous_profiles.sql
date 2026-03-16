-- Migration: Add anonymous profile support
-- When is_anonymous = true, the author is hidden from public display:
-- no name on articles, excluded from writers pages, /author/[id] returns 404.
-- Articles still belong to the user in the admin dashboard.

ALTER TABLE profiles ADD COLUMN is_anonymous BOOLEAN NOT NULL DEFAULT FALSE;
