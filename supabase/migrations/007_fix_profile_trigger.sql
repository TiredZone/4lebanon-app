-- 4Lebanon Fix: Profile Creation on User Signup
-- Migration: 007_fix_profile_trigger.sql
-- Description: Fix the trigger that creates profiles for new users

-- ============================================
-- OPTION 1: Add INSERT policy for profiles (recommended)
-- ============================================
-- This allows the trigger function to insert profiles

-- First, drop existing trigger and function to recreate cleanly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name_ar)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name_ar',
      NEW.raw_user_meta_data->>'name',
      'مستخدم جديد'
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant execute to the function
GRANT EXECUTE ON FUNCTION handle_new_user() TO service_role;

-- Recreate trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- NOTE: SECURITY DEFINER on handle_new_user() bypasses RLS automatically.
-- No permissive INSERT policy is needed. Adding WITH CHECK (true) would
-- allow any authenticated user to insert arbitrary profiles.
-- ============================================

-- Clean up if the permissive policy was previously applied
DROP POLICY IF EXISTS "profiles_service_insert" ON profiles;

-- ============================================
-- MANUAL FIX: If user already exists without profile
-- ============================================
-- Run this to manually create profiles for existing users:
--
-- INSERT INTO profiles (id, display_name_ar)
-- SELECT id, COALESCE(raw_user_meta_data->>'name', 'مستخدم جديد')
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM profiles)
-- ON CONFLICT (id) DO NOTHING;
