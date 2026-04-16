-- Migration: Time-Based Sorting Support
-- Adds index and helper view for time-weighted article sorting.
-- Breaking news (priority 2) gets boosted for 24 hours, then decays to normal sorting.

-- 1. Index to support published_at DESC queries (for latest news feed + time-decay sorting)
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc
  ON articles (published_at DESC)
  WHERE status = 'published' AND published_at IS NOT NULL;
