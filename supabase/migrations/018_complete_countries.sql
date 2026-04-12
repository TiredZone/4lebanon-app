-- Migration: 018_complete_countries.sql
-- Description: Add all remaining UN-recognized countries for complete 195-country coverage

DO $$
DECLARE
  europe_id INTEGER;
  americas_id INTEGER;
  africa_id INTEGER;
  oceania_id INTEGER;
BEGIN
  SELECT id INTO europe_id FROM regions WHERE slug = 'europe';
  SELECT id INTO americas_id FROM regions WHERE slug = 'americas';
  SELECT id INTO africa_id FROM regions WHERE slug = 'africa';
  SELECT id INTO oceania_id FROM regions WHERE slug = 'oceania';

  -- ============================================
  -- EUROPE - 5 missing micro-states
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('andorra', 'أندورا', europe_id, 42),
    ('liechtenstein', 'ليختنشتاين', europe_id, 43),
    ('monaco', 'موناكو', europe_id, 44),
    ('san-marino', 'سان مارينو', europe_id, 45),
    ('holy-see', 'الفاتيكان', europe_id, 46)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- AMERICAS - 6 missing Caribbean nations
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('grenada', 'غرينادا', americas_id, 31),
    ('saint-lucia', 'سانت لوسيا', americas_id, 32),
    ('dominica', 'دومينيكا', americas_id, 33),
    ('saint-vincent', 'سانت فينسنت والغرينادين', americas_id, 34),
    ('antigua-and-barbuda', 'أنتيغوا وباربودا', americas_id, 35),
    ('saint-kitts-and-nevis', 'سانت كيتس ونيفيس', americas_id, 36)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- AFRICA - 1 missing country
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('sao-tome-and-principe', 'ساو تومي وبرينسيبي', africa_id, 45)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- OCEANIA - 6 missing Pacific island nations
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('kiribati', 'كيريباتي', oceania_id, 9),
    ('micronesia', 'ميكرونيزيا', oceania_id, 10),
    ('marshall-islands', 'جزر مارشال', oceania_id, 11),
    ('palau', 'بالاو', oceania_id, 12),
    ('nauru', 'ناورو', oceania_id, 13),
    ('tuvalu', 'توفالو', oceania_id, 14)
  ON CONFLICT (slug) DO NOTHING;

END $$;
