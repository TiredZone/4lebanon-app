# 4Lebanon Deployment Guide

## Prerequisites

- Node.js 20.9.0+ (LTS)
- npm or pnpm
- Supabase account
- Vercel account
- Git repository (GitHub recommended)

## 1. Supabase Setup

### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and API keys

### 1.2 Run Migrations

Execute migrations in order:

```bash
# In Supabase SQL Editor, run each file in order:
# 1. supabase/migrations/001_schema.sql
# 2. supabase/migrations/002_indexes.sql
# 3. supabase/migrations/003_rls.sql
# 4. supabase/migrations/004_seed.sql
# 5. supabase/migrations/005_functions.sql
# 6. supabase/migrations/006_storage.sql (instructions for manual setup)
```

Or use Supabase CLI:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

### 1.3 Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `article-images`
3. Set it to **public**
4. Configure file settings:
   - File size limit: 5MB (5242880 bytes)
   - Allowed MIME types: `image/jpeg,image/png,image/webp,image/avif`

5. Add RLS policies (see `supabase/migrations/006_storage.sql`):

```sql
-- Public can view all images
CREATE POLICY "Public can view article images"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Authors can upload to their own folder (e.g., {user_id}/image.jpg)
CREATE POLICY "Authors can upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'article-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authors can update their own images
CREATE POLICY "Authors can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'article-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Authors can delete their own images
CREATE POLICY "Authors can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'article-images'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 1.4 Create Author Users

In Supabase Dashboard > Authentication > Users:

1. Click "Add user" > "Create new user"
2. Enter email and password
3. After creation, go to SQL Editor and set display name:

```sql
UPDATE profiles
SET display_name_ar = 'اسم الكاتب'
WHERE id = 'user-uuid-here';
```

## 2. Environment Variables

### Local Development

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATE_SECRET=your-random-secret-for-revalidation
```

### Vercel Environment Variables

Add these in Vercel Dashboard > Project > Settings > Environment Variables:

| Variable                        | Value                   | Environments        |
| ------------------------------- | ----------------------- | ------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase URL       | All                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your anon key           | All                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Your service role key   | Production, Preview |
| `NEXT_PUBLIC_SITE_URL`          | https://your-domain.com | Production          |
| `REVALIDATE_SECRET`             | Random secret string    | Production          |

## 3. Vercel Deployment

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your Git repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `./` (or your app folder)
   - Build Command: `npm run build`
   - Output Directory: (leave default)

### 3.2 Configure Domain

1. Go to Project > Settings > Domains
2. Add your custom domain
3. Configure DNS:
   - For apex domain: A record pointing to `76.76.21.21`
   - For www: CNAME to `cname.vercel-dns.com`

### 3.3 Automatic Deployments

- Push to `main` → Production deployment
- Pull requests → Preview deployments

## 4. Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Run migrations in production Supabase
- [ ] Create storage bucket with RLS policies
- [ ] Create author accounts
- [ ] Test admin login at `/admin/login`
- [ ] Create and publish a test article
- [ ] Test image upload via `/api/upload`
- [ ] Verify sitemap at `/sitemap.xml`
- [ ] Verify RSS at `/rss.xml`
- [ ] Test Arabic RTL rendering
- [ ] Check mobile responsiveness
- [ ] Verify Vercel Analytics in dashboard

## 5. Scheduled Publishing

The system handles scheduled publishing without cron jobs:

1. Articles with `status: 'scheduled'` and future `published_at` are stored
2. RLS policy checks `published_at <= NOW()` on every query
3. When the time arrives, articles automatically become visible
4. ISR revalidation (every 2-3 minutes) picks up new content

## 6. Revalidation Webhook

For instant cache updates, call the revalidation API:

```bash
curl -X POST https://your-domain.com/api/revalidate \
  -H "Authorization: Bearer YOUR_REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type": "article", "slug": "article-slug"}'
```

Types: `article`, `section`, `author`, `paths`, `all`

## Troubleshooting

### Common Issues

1. **Auth not working**: Ensure Supabase URL and keys are correct
2. **Images not loading**: Check storage bucket is public and CORS configured
3. **RLS errors**: Verify policies are applied correctly
4. **Build failures**: Check all environment variables are set

### Environment Validation

The app validates environment variables at build time using Zod schemas.
If you see "Invalid environment variables" errors, ensure all required
variables are set correctly in your `.env.local` or Vercel dashboard.

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Must be a valid Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations
- `REVALIDATE_SECRET` - Minimum 16 characters

### Support

- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vercel Docs: https://vercel.com/docs
