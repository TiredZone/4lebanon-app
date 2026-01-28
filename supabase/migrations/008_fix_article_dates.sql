-- Migration: Fix article published_at dates
-- This migration fixes articles that have future dates by setting them to the current time
-- and ensures all published articles have proper publish dates

-- 1. Fix any published articles that have NULL published_at (set to current time)
UPDATE articles
SET published_at = NOW()
WHERE status = 'published'
  AND published_at IS NULL;

-- 2. Fix any published articles with future dates (set to current time)
-- These articles were incorrectly set with future dates while having "published" status
UPDATE articles
SET published_at = NOW()
WHERE status = 'published'
  AND published_at > NOW();

-- 3. For scheduled articles, keep their future dates as they are meant to be published later
-- No action needed - the query changes will handle them correctly

-- 4. Optional: Log the count of fixed articles (run separately in SQL editor to see results)
-- SELECT COUNT(*) as fixed_count FROM articles WHERE status = 'published' AND published_at > NOW();

COMMENT ON TABLE articles IS 'Articles table - published_at must be <= NOW() for published articles to be visible';
