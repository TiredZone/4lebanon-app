-- Migration: 013_short_slugs.sql
-- Description: Replace transliterated Arabic slugs with short UUID-based slugs

-- Safety check: ensure no UUID prefix collisions
DO $$
BEGIN
  IF (SELECT COUNT(DISTINCT LEFT(id::text, 8)) FROM articles) < (SELECT COUNT(*) FROM articles) THEN
    RAISE EXCEPTION 'UUID prefix collision detected -- use longer prefix';
  END IF;
END $$;

-- Update all existing slugs to first 8 chars of their UUID
UPDATE articles SET slug = LEFT(id::text, 8);
