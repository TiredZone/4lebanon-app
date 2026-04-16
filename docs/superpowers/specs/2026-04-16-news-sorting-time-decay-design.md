# News Sorting System: Time-Based Decay + Latest News Feed

## Context

4Lebanon's homepage only shows articles with priority 1-3 in the main "أهم الأخبار" section. New articles default to priority 4 and never appear there. Breaking news (priority 2) stays permanently pinned with no time-based expiry, so the team published 10 articles and none appeared prominently. The system is entirely manual — nothing flows based on freshness.

**Goal:** Make the news system feel alive. New articles appear immediately, breaking news dominates for 24 hours then decays naturally, and editors get visibility into the time dimension.

## Design Decisions

| Decision                     | Choice                                                  |
| ---------------------------- | ------------------------------------------------------- |
| Breaking vs Latest priority  | Breaking always wins during its 24h window              |
| Where latest articles appear | New "آخر الأخبار" section on homepage                   |
| Decay duration               | 24 hours, fixed                                         |
| Decay mechanism              | Fully automatic, query-level (no cron, no new columns)  |
| Admin UI                     | Full update — timestamps, countdown, expiry warnings    |
| Existing data                | Auto-handled by new sorting logic, no cleanup migration |

## Architecture: Query-Level Time Decay

### Approach

Keep the database schema unchanged. Modify sorting logic in Supabase queries to compute time-weighted tiers at query time. No new columns, no cron jobs, no scheduled functions.

The `priority` column remains editor-controlled. The `is_breaking` boolean flag (auto-derived from priority via DB trigger) continues to drive the visual عاجل badge. Only the **sort position** is affected by time.

### Sorting Tiers (for homepage)

```
Tier 0: priority = 1 (Pinned)           → Always on top, no decay
Tier 1: priority = 2 AND < 24h old      → Active breaking, boosted
Tier 2: priority = 3 AND < 24h old      → Active featured, boosted
Tier 3: Everything else                  → Sorted by published_at DESC
```

Within each tier, articles sort by `published_at DESC` (newest first).

After 24 hours, a priority 2 article falls from Tier 1 to Tier 3. Its `is_breaking` flag and عاجل badge remain — only its sort position changes.

### Implementation: Postgres RPC Function

File: `supabase/migrations/019_homepage_sorting.sql`

```sql
CREATE OR REPLACE FUNCTION get_homepage_articles(p_limit int DEFAULT 9)
RETURNS SETOF articles AS $$
  SELECT *
  FROM articles
  WHERE status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  ORDER BY
    CASE WHEN priority = 1 THEN 0 ELSE 1 END,
    CASE WHEN priority = 2 AND published_at > NOW() - INTERVAL '24 hours' THEN 0 ELSE 1 END,
    CASE WHEN priority = 3 AND published_at > NOW() - INTERVAL '24 hours' THEN 0 ELSE 1 END,
    published_at DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;
```

Also create a simple function for the latest feed:

```sql
CREATE OR REPLACE FUNCTION get_latest_articles(p_limit int DEFAULT 15)
RETURNS SETOF articles AS $$
  SELECT *
  FROM articles
  WHERE status = 'published'
    AND published_at IS NOT NULL
    AND published_at <= NOW()
  ORDER BY published_at DESC
  LIMIT p_limit;
$$ LANGUAGE sql STABLE;
```

Add supporting index:

```sql
CREATE INDEX IF NOT EXISTS idx_articles_published_at_desc
  ON articles (published_at DESC)
  WHERE status = 'published' AND published_at IS NOT NULL;
```

### Join Strategy

The RPC functions return raw `articles` rows without joins (author, section). Two options:

**Option A (Recommended): Supabase JS query with inline CASE sort.** Instead of RPC, use Supabase's `.from('articles').select(...)` with the existing join syntax, but replace the `.order()` calls. Since Supabase JS doesn't support CASE expressions in `.order()`, we create a **Postgres view** that adds a computed `sort_tier` column, then query the view with `.order('sort_tier').order('published_at', { ascending: false })`.

```sql
CREATE OR REPLACE VIEW articles_with_tier AS
SELECT *,
  CASE
    WHEN priority = 1 THEN 0
    WHEN priority = 2 AND published_at > NOW() - INTERVAL '24 hours' THEN 1
    WHEN priority = 3 AND published_at > NOW() - INTERVAL '24 hours' THEN 2
    ELSE 3
  END AS sort_tier
FROM articles;
```

Then in the JS query: `.from('articles_with_tier').select('..., author:profiles!...').order('sort_tier').order('published_at', { ascending: false })`. This preserves the existing join pattern and avoids RPC limitations.

**Option B: Keep RPC + fetch relations separately.** Call the RPC for IDs/ordering, then fetch full article data with joins using `.in('id', ids)`. More complex, worse for performance.

**Decision: Use Option A (view).** The view approach is simpler, keeps existing query patterns, and the `sort_tier` column is computed on every query (no stale data).

## Changes by Area

### 1. Homepage Data Fetching (`app/page.tsx`)

**Important articles query (lines 22-37):**

- Replace `.in('priority', [1, 2, 3])` filter + static sort with RPC call to `get_homepage_articles`
- This removes the priority gate — all articles are eligible, but active breaking/featured get boosted
- Needs to include author and section joins (either in the RPC or as a follow-up query)

**Section articles query (lines 40-57):**

- Currently fetches 120 articles sorted by `priority ASC, sort_position DESC`
- Change to use same time-decay sorting: active breaking/featured first within each section, then by `published_at DESC`
- Can be done inline with Supabase query or via another RPC

**Breaking ticker query (lines 82-91):**

- Add time filter: `.gte('published_at', twentyFourHoursAgo)` where `twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()`
- Old breaking news drops off the ticker but keeps its badge on article pages

**New latest articles query:**

- Add `get_latest_articles` RPC call (or simple query: `ORDER BY published_at DESC LIMIT 15`)
- Return as `latestArticles` alongside existing data

### 2. New "آخر الأخبار" Section (Homepage UI)

**Position:** After "أهم الأخبار" section (after line 362), before dynamic section bento grids (line 364).

**Layout:**

- Header: Red accent bar + "آخر الأخبار" title + "المزيد" link to `/recent`
- Grid: 3-column responsive grid reusing the compact news card pattern (thumbnail 72-80px + title + time)
- Shows 12-15 articles
- Same styling as the compact grid in أهم الأخبار (lines 296-358)

**Data:** All published articles sorted by `published_at DESC`, no priority filtering. Every new article appears here immediately.

### 3. Section Bento Grids (Homepage)

**Current:** Section articles fetched in batch (120 articles) sorted by `priority ASC, sort_position DESC`.

**Change:** Query the `articles_with_tier` view instead of the `articles` table, using `.order('sort_tier').order('published_at', { ascending: false })`. Since articles are fetched in one batch and grouped by section client-side, the time-decay sort applies naturally within each section group.

### 4. Breaking News Ticker (`components/breaking-news-ticker.tsx`)

**Change:** The data source (in `app/page.tsx`) adds `.gte('published_at', twentyFourHoursAgo)`. The ticker component itself needs no changes — it already handles empty arrays gracefully.

### 5. Admin Priority Board

**Files:** `app/admin/priority/page.tsx`, `components/admin/priority-board.tsx`

**Changes to `PriorityArticle` interface:**

- Already includes `published_at` — just not displayed

**Changes to `SortableCard` component:**

- Show `published_at` formatted timestamp
- For priority 2 articles: show countdown "ينتهي خلال X ساعات" (expires in X hours)
- For priority 2 articles past 24h: show warning badge "انتهت فترة التعزيز" (boost expired) with grayed styling

**Changes to `PriorityBoard` component:**

- Add filter toggle: "الكل" / "نشط" / "منتهي" (All / Active boost / Expired boost) for the breaking column
- Priority 2 column header could show count of active vs expired

**No changes to save/reorder logic** — the priority system works the same, editors just get better visibility.

### 6. /important Page (`app/important/page.tsx`)

Align sorting with the homepage — use the same time-decay RPC or equivalent query logic so the "المزيد" link from أهم الأخبار shows consistent results.

### 7. Section Pages (`app/section/[slug]/page.tsx`)

**No changes to default editorial sort.** Section pages have an explicit sort dropdown (Newest, Oldest, Most Read, Editorial). The editorial default (`priority ASC, sort_position DESC`) is intentional for section pages where editors curate order. Time decay only applies to the homepage feeds.

### 8. Revalidation (`lib/constants.ts`)

Consider reducing homepage revalidation from 120s to 60s since content ordering now changes with time. The 24h window is coarse enough that 120s is probably fine, but faster revalidation makes the site feel more alive.

## Files to Modify

| File                                           | Change                                                                                         |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `supabase/migrations/019_homepage_sorting.sql` | **New** — `articles_with_tier` view, RPC functions, index, RLS on view                         |
| `app/page.tsx`                                 | Replace important query, add latest query, add latest section UI, fix ticker, fix section sort |
| `components/admin/priority-board.tsx`          | Add timestamps, countdown, expiry warnings, filter toggle                                      |
| `app/admin/priority/page.tsx`                  | Ensure `published_at` is passed to board                                                       |
| `app/important/page.tsx`                       | Align sorting with homepage                                                                    |
| `lib/constants.ts`                             | Optional: reduce homepage revalidation                                                         |
| `types/database.ts`                            | No changes needed                                                                              |

## Existing Data Handling

Old articles at priority 2 with `published_at` > 24h ago automatically lose their sort boost under the new queries. No data migration or cleanup needed. They keep their `is_breaking` flag and عاجل badge — only their sort position changes.

## Verification Plan

1. **Unit test the RPC function:** Insert test articles with various priorities and timestamps, verify sort order matches expected tiers
2. **Homepage visual check:**
   - Publish a new priority-4 article → verify it appears in "آخر الأخبار" immediately
   - Set an article to priority 2 → verify it appears at top of أهم الأخبار
   - Verify old breaking articles (> 24h) are no longer at the top
3. **Ticker check:** Verify old breaking articles drop off the ticker, new ones appear
4. **Admin board check:** Verify timestamps display, countdown works, expired articles show warning
5. **Section pages:** Verify no change to section page behavior (editorial sort preserved)
6. **Edge cases:**
   - What happens when there are zero active breaking articles? → All articles sort by recency
   - What happens at exactly the 24h boundary? → Article transitions from Tier 1 to Tier 3
   - Pinned articles (priority 1) → Always on top regardless of time
