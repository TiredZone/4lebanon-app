-- 4Lebanon News Storage Configuration
-- Migration: 006_storage.sql
-- Description: Configure Supabase Storage bucket and RLS policies

-- ============================================
-- CREATE STORAGE BUCKET
-- ============================================

-- Note: Run this in Supabase Dashboard > Storage > Create a new bucket
-- Or via the Supabase Management API

-- Bucket settings:
-- Name: article-images
-- Public: true (for public article images)
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/avif

-- ============================================
-- STORAGE RLS POLICIES
-- ============================================
-- These policies must be created via Supabase Dashboard > Storage > Policies
-- or via the storage-api

-- Policy 1: Public read access for article images
-- Name: "Public can view article images"
-- Target: SELECT
-- Role: anon, authenticated
-- Policy: true (all files in bucket are publicly readable)

-- Policy 2: Authenticated users can upload to their folder
-- Name: "Authors can upload to own folder"
-- Target: INSERT
-- Role: authenticated
-- Policy: (bucket_id = 'article-images' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Policy 3: Authors can update their own images
-- Name: "Authors can update own images"
-- Target: UPDATE
-- Role: authenticated
-- Policy: (bucket_id = 'article-images' AND (storage.foldername(name))[1] = auth.uid()::text)

-- Policy 4: Authors can delete their own images
-- Name: "Authors can delete own images"
-- Target: DELETE
-- Role: authenticated
-- Policy: (bucket_id = 'article-images' AND (storage.foldername(name))[1] = auth.uid()::text)

-- ============================================
-- MANUAL SETUP INSTRUCTIONS
-- ============================================
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket "article-images" with settings:
--    - Public: ON
--    - File size limit: 5242880 (5MB)
--    - Allowed MIME types: image/jpeg,image/png,image/webp,image/avif
--
-- 3. Go to Storage > Policies > article-images
-- 4. Create the following policies:
--
-- SELECT Policy (Public Read):
-- CREATE POLICY "Public can view article images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'article-images');
--
-- INSERT Policy (Author Upload):
-- CREATE POLICY "Authors can upload to own folder"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'article-images' 
--   AND auth.role() = 'authenticated'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );
--
-- UPDATE Policy (Author Update):
-- CREATE POLICY "Authors can update own images"
-- ON storage.objects FOR UPDATE
-- USING (
--   bucket_id = 'article-images'
--   AND auth.role() = 'authenticated'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );
--
-- DELETE Policy (Author Delete):
-- CREATE POLICY "Authors can delete own images"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'article-images'
--   AND auth.role() = 'authenticated'
--   AND (storage.foldername(name))[1] = auth.uid()::text
-- );

-- ============================================
-- HELPER: Cleanup orphaned images (optional cron)
-- ============================================
-- This function can be called periodically to remove images
-- that are no longer referenced by any article

CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS void AS $$
DECLARE
  orphan_record RECORD;
BEGIN
  -- Find images not referenced in articles
  -- Note: Actual deletion requires storage API call
  -- This just logs orphaned paths for manual cleanup
  FOR orphan_record IN
    SELECT DISTINCT cover_image_path
    FROM articles
    WHERE cover_image_path IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM articles a2 
      WHERE a2.cover_image_path = articles.cover_image_path
      AND a2.status = 'published'
    )
  LOOP
    RAISE NOTICE 'Orphaned image: %', orphan_record.cover_image_path;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
