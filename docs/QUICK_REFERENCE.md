# Quick Reference Guide - Animation & Enhancement Usage

## 🎬 Animation Components

### AnimatedSection

Use for entire sections that should fade in when scrolled into view.

```tsx
import { AnimatedSection } from '@/components/layout'
;<AnimatedSection delay={0.2}>{/* Your section content */}</AnimatedSection>
```

**Props:**

- `children`: ReactNode (required)
- `className`: string (optional)
- `delay`: number (optional, default: 0) - in seconds

### AnimatedCard

Use for individual cards/items that should animate with a scale effect.

```tsx
import { AnimatedCard } from '@/components/layout'

{
  items.map((item, index) => (
    <AnimatedCard key={item.id} delay={index * 0.1}>
      {/* Your card content */}
    </AnimatedCard>
  ))
}
```

**Props:**

- `children`: ReactNode (required)
- `className`: string (optional)
- `delay`: number (optional, default: 0) - in seconds

**Pro Tip:** Use `index * 0.1` for staggered animations

## 🔔 Toast Notifications

### Basic Usage

```tsx
import toast from 'react-hot-toast'

// Success
toast.success('تم الحفظ بنجاح!')

// Error
toast.error('حدث خطأ في الحفظ')

// Info
toast('معلومة مهمة')

// Loading
const loading = toast.loading('جاري التحميل...')
// Later dismiss it
toast.dismiss(loading)
```

### With Promise

```tsx
toast.promise(saveData(), {
  loading: 'جاري الحفظ...',
  success: 'تم الحفظ بنجاح!',
  error: 'فشل الحفظ',
})
```

### Custom Duration

```tsx
toast.success('تم النسخ!', { duration: 2000 })
```

## 📱 Mobile Breakpoints

```tsx
// Tailwind breakpoints used in the project
sm:  640px   // Small devices
md:  768px   // Medium devices (tablets)
lg:  1024px  // Large devices (desktops)
xl:  1280px  // Extra large
2xl: 1536px  // 2X Extra large

// Common patterns
className="text-base md:text-xl"           // Responsive text
className="hidden lg:block"                 // Show on desktop only
className="grid grid-cols-1 lg:grid-cols-3" // Responsive grid
className="px-4 md:px-6 lg:px-8"          // Responsive padding
```

## 🎨 Brand Colors

```tsx
// Primary red
#c61b23  // Main brand color
#a01419  // Darker shade for gradients
#830005  // Darkest shade (old color, still used)

// Accents
#f5e6e6  // Pink accent
bg-white text-gray-900 // For search/forms
bg-gray-50  // Light background

// Usage
className="text-[#c61b23]"
className="bg-[#c61b23]"
className="hover:text-[#c61b23]"
className="border-[#c61b23]"
```

## ⚡ Common Patterns

### Hover Effects

```tsx
// Card hover
className = 'hover:shadow-xl transition-all duration-300'
className = 'hover:scale-110 transition-transform duration-500'

// Button hover
className = 'hover:bg-gray-100 active:scale-95 transition-all'

// Text hover
className = 'hover:text-[#c61b23] transition-colors'
```

### Loading States

```tsx
const [loading, setLoading] = useState(false)

<button
  disabled={loading}
  className="disabled:opacity-50"
>
  {loading ? 'جاري التحميل...' : 'حفظ'}
</button>
```

### Responsive Images

```tsx
import Image from 'next/image'
import { getStorageUrl } from '@/lib/utils'
;<Image src={getStorageUrl(imagePath)} alt="description" fill className="object-cover" />
```

## 🏗️ Component Structure

### Server Component (Default)

```tsx
// app/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('articles').select('*')

  return <div>{/* render data */}</div>
}
```

### Client Component (Interactive)

```tsx
// components/form.tsx
'use client'

import { useState } from 'react'

export function Form() {
  const [value, setValue] = useState('')

  return <input value={value} onChange={(e) => setValue(e.target.value)} />
}
```

## 📦 Import Aliases

```tsx
import { Component } from '@/components/...'
import { createClient } from '@/lib/supabase/...'
import { constants } from '@/lib/constants'
import type { Article } from '@/types/database'
import '@/app/globals.css'
```

## 🔧 Useful Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Install packages
npm install package-name
```

## 🎯 Animation Best Practices

### DO ✅

- Use `AnimatedSection` for large content blocks
- Use `AnimatedCard` for repeated items
- Add delays for staggered effects (index \* 0.1)
- Keep animations under 0.6s duration
- Use `triggerOnce: true` for scroll animations
- Test on mobile devices

### DON'T ❌

- Animate layout properties (width, height, top, left)
- Add animations to every element
- Use long durations (> 1s)
- Animate on every scroll
- Forget mobile performance
- Over-complicate animations

## 🚨 Common Issues & Solutions

### Issue: Animation not triggering

**Solution:** Check that component is wrapped in `AnimatedSection` or `AnimatedCard`

### Issue: Toast not showing

**Solution:** Ensure `<ToastProvider />` is in layout.tsx

### Issue: "use client" error

**Solution:** Interactive components need 'use client' directive at top

### Issue: Hydration error

**Solution:** Don't use browser-only APIs (window, document) on initial render

### Issue: Image not loading

**Solution:** Check getStorageUrl returns valid URL, add fallback

## 📚 File Locations

```
components/
├── layout/
│   ├── animated-section.tsx    # Animation wrappers
│   ├── toast-provider.tsx      # Toast configuration
│   ├── newsletter-form.tsx     # Newsletter with toast
│   ├── header.tsx              # Main header
│   ├── search-form.tsx         # Real-time search
│   └── index.ts                # Exports

app/
├── layout.tsx                  # Root layout (ToastProvider here)
├── page.tsx                    # Homepage (uses animations)
├── globals.css                 # Global styles
└── */page.tsx                  # Other pages

docs/
├── ENHANCEMENTS.md             # Full enhancement guide
├── MOBILE_TESTING.md           # Testing checklist
└── QUICK_REFERENCE.md          # This file
```

## 🎓 Learning Resources

### Framer Motion

- Docs: https://www.framer.com/motion/
- Examples: https://www.framer.com/motion/examples/

### React Hot Toast

- Docs: https://react-hot-toast.com/
- API: https://react-hot-toast.com/docs

### Next.js App Router

- Docs: https://nextjs.org/docs
- Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components

### Tailwind CSS

- Docs: https://tailwindcss.com/docs
- RTL: https://tailwindcss.com/docs/rtl

---

Keep this guide handy for quick reference during development!
