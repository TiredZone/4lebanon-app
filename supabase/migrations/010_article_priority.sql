-- Migration: Article Priority & Ordering System
-- Adds a 5-level priority system and sort_position for manual ordering.
-- Priority levels: 1=Pinned, 2=Breaking, 3=Featured, 4=Normal (default), 5=Low
-- Auto-syncs is_breaking/is_featured from priority via trigger for backward compatibility.

-- 1. Add priority column (1-5 scale, default 4 = Normal)
ALTER TABLE articles ADD COLUMN priority SMALLINT NOT NULL DEFAULT 4;
ALTER TABLE articles ADD CONSTRAINT articles_priority_check CHECK (priority >= 1 AND priority <= 5);

-- 2. Add sort_position for manual ordering within same priority level
--    Uses DOUBLE PRECISION (float) so we can insert between positions without reindexing.
--    Higher value = shown first (DESC order).
ALTER TABLE articles ADD COLUMN sort_position DOUBLE PRECISION;

-- 3. Populate sort_position from published_at (or created_at as fallback) for existing articles
UPDATE articles SET sort_position = EXTRACT(EPOCH FROM COALESCE(published_at, created_at));

-- Make sort_position NOT NULL after population and set a default
ALTER TABLE articles ALTER COLUMN sort_position SET NOT NULL;
ALTER TABLE articles ALTER COLUMN sort_position SET DEFAULT 0;

-- 4. Migrate existing is_breaking/is_featured flags to priority levels
--    is_breaking=true -> priority 2 (Breaking)
--    is_featured=true (but not breaking) -> priority 3 (Featured)
--    Everything else stays at default 4 (Normal)
UPDATE articles SET priority = 2 WHERE is_breaking = true;
UPDATE articles SET priority = 3 WHERE is_featured = true AND is_breaking = false;

-- 5. Create trigger to auto-sync is_breaking/is_featured from priority
--    This ensures backward compatibility: any code reading these boolean flags
--    will continue to work correctly as they become derived from priority.
CREATE OR REPLACE FUNCTION sync_article_flags()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_breaking = (NEW.priority IN (1, 2));
  NEW.is_featured = (NEW.priority IN (1, 2, 3));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_article_flags_trigger
  BEFORE INSERT OR UPDATE OF priority ON articles
  FOR EACH ROW
  EXECUTE FUNCTION sync_article_flags();

-- 6. Performance indexes for the new ordering pattern
--    Primary sort: priority ASC, sort_position DESC
CREATE INDEX idx_articles_priority_position
  ON articles (priority ASC, sort_position DESC)
  WHERE status = 'published';

CREATE INDEX idx_articles_section_priority
  ON articles (section_id, priority ASC, sort_position DESC)
  WHERE status = 'published';
