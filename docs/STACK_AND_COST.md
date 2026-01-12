# 4Lebanon Stack & Cost Overview

## Technology Stack

### Frontend

| Technology       | Version | Purpose                         |
| ---------------- | ------- | ------------------------------- |
| Next.js          | 16.1.1  | React framework with App Router |
| React            | 19.2.x  | UI library                      |
| TypeScript       | 5.x     | Type safety                     |
| Tailwind CSS     | 4.x     | Styling                         |
| Noto Kufi Arabic | -       | Arabic typography               |

### Backend

| Technology         | Purpose                            |
| ------------------ | ---------------------------------- |
| Supabase           | PostgreSQL database, Auth, Storage |
| PostgreSQL         | Primary database with FTS          |
| Row Level Security | Per-author permissions             |

### Infrastructure

| Service          | Purpose                        |
| ---------------- | ------------------------------ |
| Vercel           | Hosting, CDN, Edge functions   |
| Supabase Storage | Image hosting with CDN         |
| GitHub           | Source control, CI/CD triggers |

### Development Tools

| Tool        | Purpose            |
| ----------- | ------------------ |
| Husky       | Git hooks          |
| lint-staged | Pre-commit linting |
| ESLint      | Code quality       |
| Prettier    | Code formatting    |

## Cost Breakdown

### Free Tier (Development/Low Traffic)

| Service       | Free Tier Limits                     | Suitable For         |
| ------------- | ------------------------------------ | -------------------- |
| Vercel Hobby  | 100GB bandwidth, 100 builds/day      | Development, testing |
| Supabase Free | 500MB DB, 1GB storage, 2GB bandwidth | MVP, low traffic     |
| GitHub Free   | Unlimited public repos               | Open source          |

**Total: $0/month** (with limitations)

### Production Tier (Recommended)

| Service          | Plan            | Cost                            |
| ---------------- | --------------- | ------------------------------- |
| Vercel Pro       | $20/month       | 1TB bandwidth, team features    |
| Supabase Pro     | $25/month       | 8GB DB, 100GB storage, no pause |
| Domain           | ~$10-15/year    | Custom domain                   |
| Email (optional) | $4-7/user/month | Professional email              |

**Estimated Total: $50-70/month**

### Scaling Costs

| Traffic Level   | Vercel     | Supabase | Estimate      |
| --------------- | ---------- | -------- | ------------- |
| <10K views/mo   | Hobby      | Free     | $0            |
| 10K-100K views  | Pro        | Free/Pro | $20-45        |
| 100K-500K views | Pro        | Pro      | $45-70        |
| 500K+ views     | Enterprise | Pro+     | Contact sales |

## Feature Matrix

### MVP (Phase 1) - Included

| Feature               | Status |
| --------------------- | ------ |
| Arabic RTL UI         | ✅     |
| Homepage with filters | ✅     |
| Article pages         | ✅     |
| Full-text search      | ✅     |
| Author pages          | ✅     |
| Admin dashboard       | ✅     |
| Article CRUD          | ✅     |
| Image upload          | ✅     |
| Scheduled publishing  | ✅     |
| SEO (sitemap, RSS)    | ✅     |
| RLS permissions       | ✅     |

### Future Phases - Not Included

| Feature              | Phase |
| -------------------- | ----- |
| Newsletter           | 2     |
| Comments             | 2     |
| Push notifications   | 2     |
| Advanced analytics   | 2     |
| Paywall/monetization | 3     |
| Multi-language       | 3     |
| Mobile app           | 3     |

## Performance Targets

| Metric     | Target | Tool             |
| ---------- | ------ | ---------------- |
| TTFB       | <200ms | Vercel Analytics |
| LCP        | <2.5s  | Core Web Vitals  |
| CLS        | <0.1   | Core Web Vitals  |
| FID        | <100ms | Core Web Vitals  |
| Lighthouse | >90    | Chrome DevTools  |

## Security Checklist

| Measure         | Implementation                       |
| --------------- | ------------------------------------ |
| Authentication  | Supabase Auth (email/password)       |
| Authorization   | PostgreSQL RLS                       |
| Data validation | TypeScript + Zod (optional)          |
| XSS prevention  | React auto-escaping, rehype-sanitize |
| CSRF            | Supabase handles for auth            |
| Rate limiting   | Vercel Edge (built-in)               |
| Secrets         | Environment variables                |

## Maintenance Requirements

### Regular Tasks

| Task               | Frequency    | Owner     |
| ------------------ | ------------ | --------- |
| Dependency updates | Monthly      | Developer |
| Security patches   | As needed    | Developer |
| Database backup    | Daily (auto) | Supabase  |
| Content moderation | Daily        | Editors   |
| Analytics review   | Weekly       | Admin     |

### Monitoring

| What        | Tool               |
| ----------- | ------------------ |
| Uptime      | Vercel Status      |
| Performance | Vercel Analytics   |
| Errors      | Vercel Logs        |
| Database    | Supabase Dashboard |

## Support Channels

| Issue    | Resource                            |
| -------- | ----------------------------------- |
| Supabase | docs.supabase.com, Discord          |
| Vercel   | vercel.com/docs, Support tickets    |
| Next.js  | nextjs.org/docs, GitHub Discussions |
| General  | Developer documentation in /docs    |
