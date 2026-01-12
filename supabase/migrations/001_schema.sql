-- 4Lebanon News Database Schema
-- Migration: 001_schema.sql
-- Description: Create core tables for the news platform

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- PROFILES TABLE (linked to auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name_ar TEXT NOT NULL,
  avatar_url TEXT,
  bio_ar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- SECTIONS TABLE (news categories)
-- ============================================
CREATE TABLE sections (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  description_ar TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- REGIONS TABLE (geographic regions)
-- ============================================
CREATE TABLE regions (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- COUNTRIES TABLE (with region FK)
-- ============================================
CREATE TABLE countries (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  region_id INT REFERENCES regions(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- TOPICS TABLE (article tags/topics)
-- ============================================
CREATE TABLE topics (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- ARTICLES TABLE (main content)
-- ============================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title_ar TEXT NOT NULL,
  excerpt_ar TEXT,
  body_md TEXT NOT NULL,
  cover_image_path TEXT,
  section_id INT REFERENCES sections(id) ON DELETE SET NULL,
  region_id INT REFERENCES regions(id) ON DELETE SET NULL,
  country_id INT REFERENCES countries(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at TIMESTAMPTZ,
  is_breaking BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  sources JSONB DEFAULT '[]'::jsonb,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================
-- ARTICLE_TOPICS TABLE (many-to-many junction)
-- ============================================
CREATE TABLE article_topics (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  topic_id INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, topic_id)
);

-- ============================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name_ar)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name_ar', 'مستخدم جديد')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
