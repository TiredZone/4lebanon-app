# Author Visibility: Opinion Section Only

**Date:** 2026-04-22
**Status:** Approved design, ready for implementation plan

## Context

Today, author names are hidden only on breaking articles (commit `62fda4f` wired this to the `is_breaking` flag). The editorial decision has shifted: author credit should be an opinion-column convention, not a general news convention. We want the byline to appear exclusively on pieces in the opinion section (`أراء و مقالات` / slug `opinions`) and be suppressed everywhere else — news, breaking, analysis, geopolitics, economy, security, special, and any future non-opinion section.

Note: older migration files (`004_seed.sql`, `007_expand_taxonomy.sql`) still reference the legacy slug `opinion` / name `رأي`. The live database and the frontend use `opinions` / `أراء و مقالات` (see [lib/constants.ts:22](../../../lib/constants.ts#L22)). Implementation must use the live value `opinions`.

This affects how readers perceive the site: news becomes institutional voice; opinion keeps personal attribution.

## The Rule

```
if author.is_anonymous           → hide
else if article.section.slug == 'opinions' → show
else                             → hide
```

That is the complete rule. `is_breaking` is no longer part of the author-visibility decision. It remains on the model and is still used for the "عاجل" badge and other breaking-news UI.

## Scope of Changes

### 1. `resolveAuthor()` — signature change

**File:** [lib/utils.ts:130-139](../../../lib/utils.ts#L130-L139)

Change from:

```ts
resolveAuthor(author, isBreaking?: boolean)
```

to:

```ts
resolveAuthor(author, sectionSlug?: string | null)
```

New body: return `null` if the author is missing, anonymous, or `sectionSlug !== 'opinions'`.

The opinion slug is a literal in one place (`'opinions'`). Define it as an exported constant in `lib/utils.ts` (e.g. `OPINION_SECTION_SLUG = 'opinions'`) so call sites and queries reference the same value.

### 2. Call sites — pass section slug instead of `is_breaking`

Six files call `resolveAuthor`:

- [components/article/article-card.tsx:22](../../../components/article/article-card.tsx#L22) — also remove the inline `!article.is_breaking` checks at lines 72 and 189; the `author` truthiness check is sufficient now.
- [components/glass-editorial-card.tsx:20](../../../components/glass-editorial-card.tsx#L20)
- [app/article/[slug]/page.tsx:173](../../../app/article/[slug]/page.tsx#L173), line 207, and the inline `!article.is_breaking` check at lines 289-313
- [app/recent/page.tsx:75](../../../app/recent/page.tsx#L75)
- [app/search/page.tsx:325](../../../app/search/page.tsx#L325)
- [app/rss.xml/route.ts:73-75](../../../app/rss.xml/route.ts#L73-L75)

Each call changes from `resolveAuthor(article.author, article.is_breaking)` to `resolveAuthor(article.author, article.section?.slug)`.

**Query verification required during plan phase:** confirm each Supabase query feeding these sites selects `section(slug, …)` (or the equivalent denormalized field). `ArticleListItem` already declares a `section` object, but the individual queries must be audited because not every call site uses the shared type. Add `section.slug` to any query that doesn't already return it.

### 3. Author profile page — filter to opinion only

**File:** [app/author/[id]/page.tsx:35-51](../../../app/author/[id]/page.tsx#L35-L51)

In `getAuthorArticles()`, replace:

```ts
.eq('is_breaking', false)
```

with a filter that restricts results to articles whose section slug is `'opinions'`. In Supabase this is typically done by joining `sections` and filtering on `sections.slug`, or by looking up the opinions section id once and using `.eq('section_id', opinionsSectionId)`.

The article count shown on the author profile should reflect this same filter (it already uses the same query), so no separate change needed — but verify in review.

### 4. What does NOT change

- `is_breaking` column and trigger ([supabase/migrations/010_article_priority.sql](../../../supabase/migrations/010_article_priority.sql)): untouched. Priority 1/2 still flip the flag; the flag is still used for the badge.
- Anonymous authors (`is_anonymous = true`): still hidden everywhere, including inside the opinion section.
- Admin/CMS flows: no changes — authors and sections are still assigned the same way.

## Verification

End-to-end checks after implementation:

1. **News article (section = `news`, author assigned, not anonymous):** no byline on article card, no byline on article detail page, no byline in recent, no byline in search, no `<author>` in RSS item.
2. **Opinion article (section = `opinions`, author assigned, not anonymous):** byline appears in all five surfaces plus RSS.
3. **Opinion article with anonymous author:** no byline anywhere.
4. **Breaking opinion article** (priority 2 + section = `opinions`): byline shown (confirms `is_breaking` no longer gates visibility). The "عاجل" badge still renders.
5. **Non-opinion breaking article** (priority 2 + section = `news`): byline hidden (matches current behavior, different code path).
6. **`/author/[id]` page:** shows only the author's opinion articles. Non-opinion articles the author wrote do not appear in the list and are not counted.
7. **RSS feed:** re-fetch `/rss.xml` and confirm `<author>` tags appear only on items whose `<category>` is `أراء و مقالات`.

No new tests are required beyond manual verification in the editor/preview unless the existing test suite covers `resolveAuthor` — in which case update those tests to reflect the new signature and rule.
