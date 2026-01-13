# Homepage Sections Implementation

## Overview

The homepage has been completely redesigned to match the Lebanon Debate reference screenshots with pixel-perfect RTL Arabic layout.

## Design Tokens & Variables

### Color Palette

```css
--brand-red: #c61b23 /* Main brand color - used for headings, CTA */ --accent-pink: #f5e6e6
  /* Light pink background - used in خاص section */ --text-dark: #222 /* Main text color */
  --gray-900: #111827 /* Dark gray for headings */;
```

### Typography

- **Heading Font Size (Desktop)**: 30-34px (text-3xl)
- **Heading Font Size (Mobile)**: 20-24px (text-xl)
- **Body Text**: 14px (text-sm) to 16px (text-base)
- **Small Text**: 12px (text-xs)

### Spacing

- **Section Gap**: 64px (space-y-16)
- **Grid Gutters**: 16-24px (gap-4 to gap-6)
- **Container Max Width**: 1200px (max-w-7xl)

## Section Layouts

### 1. رادار & بحث وتحرّي (Side by Side)

**Layout**: Two columns on desktop, stacked on mobile

- Each section: 2x2 grid of article cards
- Image height: 128px (h-32)
- Red header with underline separator
- "المزيــــــد" link on left

### 2. خاص (Special)

**Layout**: 3-column grid

- **Left column**: Pink background (#f5e6e6) with 5 article titles + thumbnails
- **Right columns (2)**: Featured images
  - First image: spans 2 columns, height 288px (h-72)
  - Next 2 images: half height each, 176px (h-44)

### 3. الأكثر قراءة (Most Read)

**Layout**: 3-column grid

- **Left column**: Numbered list (02-06) with thumbnails
  - Number badge: 48x48px dark gray circle
  - Small thumbnail: 64x48px
- **Right columns (2)**: Large featured article
  - Image height: 320px (h-80)
  - Red "01" badge in top-right corner

### 4. SpotShot (Video Section)

**Layout**: 4-column grid (1 + 3)

- **Left column**: 4 video previews with play icons
  - Thumbnail: 80x56px with play overlay
- **Right columns (3)**: Large video player
  - Height: 320px (h-80)
  - Large centered play button
  - Gradient overlay with title

### 5. المحلية (Local News)

**Layout**: 3-column responsive grid

- **First item**: Spans 2 columns, height 256-320px
- **Next 2 items**: Side images, height 144px (h-36)
- **Bottom**: 3 text-only links with borders

### 6. أمن وقضاء (Security)

**Layout**: 4-column grid

- Image height: 128px (h-32)
- Compact article cards with titles

### 7. إقليمي ودولي (Regional)

**Layout**: 3-column grid (2 + 1)

- **Left columns (2)**: Large featured image, height 320px
- **Right column**: 2 stacked smaller images, height 144px each

### 8. كتّابنا (Writers)

**Layout**: Horizontal flex row (centered)

- Circular avatars: 96x96px
- Border: 3px solid gray, changes to red on hover
- 5 writers displayed

### 9. اقتصاد (Economy)

**Layout**: 4-column grid

- Image height: 128px
- Date stamps below titles

### 10. Newsletter CTA

**Layout**: Full-width red banner

- Background: #c61b23
- Centered email input + button
- Social media icons row
- Large decorative "L" watermark

## Responsive Breakpoints

### Desktop (lg: >=1024px)

- All multi-column layouts active
- Full spacing and padding

### Tablet (md: 768px - 1023px)

- Most grids adapt to 2 columns
- Reduced font sizes
- Adjusted spacing

### Mobile (<=767px)

- Single column layout
- Collapsible sections
- Touch-optimized spacing
- Minimum touch target: 44x44px

### Exact Mobile (375x667px)

Additional tweaks for pixel-perfect iPhone SE layout:

```css
@media (max-width: 375px) {
  .section-heading {
    font-size: 20px;
  }
  .article-title {
    font-size: 14px;
  }
  .grid {
    gap: 12px;
  }
}
```

## Hover & Interaction States

### Images

```css
.group:hover img {
  transform: scale(1.05);
  transition: transform 300ms ease;
}
```

### Titles

```css
.group:hover h3 {
  color: #c61b23;
  transition: color 200ms ease;
}
```

### Buttons/CTAs

```css
button:hover {
  background-color: #a01519; /* Darker red */
}
```

## Accessibility Features

### Semantic HTML

- All sections use `<section>` tags
- Articles wrapped in `<article>` where appropriate
- Proper heading hierarchy (h2 for sections, h3 for articles)

### ARIA Labels

- Social media links have aria-label attributes
- Newsletter form has proper labels
- Image alt text in Arabic

### Keyboard Navigation

- All interactive elements are focusable
- Tab order follows visual layout (RTL)
- Focus states visible

## Data Integration

### Data Source

Articles are fetched from Supabase in `getHomepageData()`:

```typescript
const data = await getHomepageData()
// Returns: { headlines, recent, important, sections, writers }
```

### Section Data

Each section fetches via `getSectionArticles(slug, limit)`:

- radar: 4 articles
- investigation: 4 articles
- special: 5 articles
- local: 6 articles
- security: 7 articles
- regional: 6 articles
- economy: 7 articles

## Performance Optimizations

### Image Optimization

- Next.js Image component with automatic optimization
- Lazy loading enabled
- Proper sizing hints

### Code Splitting

- Server components for data fetching
- Client components only where needed

### Caching

```typescript
export const revalidate = 120 // Revalidate every 2 minutes
```

## Customization Guide

### Change Brand Color

Update all instances of #c61b23 to your brand color in:

1. Section headings
2. Hover states
3. Newsletter CTA background
4. Social icons

### Adjust Spacing

Modify these Tailwind classes:

- `space-y-16`: Section vertical spacing
- `gap-4` to `gap-8`: Grid gutters
- `mb-5`, `mt-3`: Individual margins

### Change Image Heights

Update these classes:

- `h-32`: Small thumbnails (128px)
- `h-64`: Medium images (256px)
- `h-80`: Large featured images (320px)

### Font Sizes

- `text-3xl`: Section headings (30px)
- `text-sm`: Article titles (14px)
- `text-xs`: Metadata (12px)

## Testing Checklist

- [ ] Desktop layout (1200px+) matches screenshots
- [ ] Tablet layout (768-1023px) is readable
- [ ] Mobile layout (375px) matches exactly
- [ ] All hover states work correctly
- [ ] RTL text direction is consistent
- [ ] Images load and display properly
- [ ] Links navigate correctly
- [ ] Newsletter form is functional
- [ ] Keyboard navigation works
- [ ] Screen reader announces properly

## Browser Support

- Chrome/Edge: 90+
- Firefox: 88+
- Safari: 14+
- Mobile Safari: iOS 14+
- Chrome Mobile: Latest

## Known Issues & Limitations

1. **Placeholder Images**: Replace `/placeholder.png` with actual images
2. **Social Icons**: Currently showing circles - integrate actual icon library
3. **Newsletter Form**: Needs backend integration for email capture
4. **Video Player**: SpotShot section needs actual video player integration

## Next Steps

1. Add actual images to `/public/images/` directory
2. Integrate social media icons (Font Awesome, Heroicons, etc.)
3. Connect newsletter form to email service
4. Implement video player for SpotShot section
5. Add lazy loading observer for images below fold
6. Optimize for Core Web Vitals (LCP, FID, CLS)

## File Locations

- **Main Page**: `/app/page.tsx`
- **Data File**: `/data/home-articles.json` (sample structure)
- **Utilities**: `/lib/utils.ts` (formatDateAr, getStorageUrl)
- **Types**: `/types/database.ts` (ArticleListItem)

## Support & Maintenance

For pixel adjustments, refer to the exact measurements in this document and the CSS variables listed. All spacing and sizing uses Tailwind's standard scale for consistency.
