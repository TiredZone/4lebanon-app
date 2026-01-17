-- Expand taxonomy data with comprehensive global coverage
-- Migration: 007_expand_taxonomy.sql
-- Description: Add missing sections, regions, countries, and topics

-- ============================================
-- SECTIONS - Add missing sections
-- ============================================
INSERT INTO sections (slug, name_ar, description_ar, sort_order) VALUES
  ('local', 'محلي', 'الأخبار المحلية اللبنانية', 3),
  ('regional', 'إقليمي ودولي', 'الأخبار الإقليمية والدولية', 4),
  ('investigation', 'بحث وتحرّي', 'تحقيقات استقصائية معمقة', 5),
  ('radar', 'رادار', 'رصد ومتابعة الأحداث', 6)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  description_ar = EXCLUDED.description_ar,
  sort_order = EXCLUDED.sort_order;

-- Update existing sections sort order
UPDATE sections SET sort_order = 7 WHERE slug = 'analysis';
UPDATE sections SET sort_order = 8 WHERE slug = 'geopolitics';
UPDATE sections SET sort_order = 9 WHERE slug = 'economy';
UPDATE sections SET sort_order = 10 WHERE slug = 'security';
UPDATE sections SET sort_order = 11 WHERE slug = 'opinion';
UPDATE sections SET sort_order = 12 WHERE slug = 'special';

-- ============================================
-- REGIONS - Add Oceania region
-- ============================================
INSERT INTO regions (slug, name_ar, sort_order) VALUES
  ('oceania', 'أوقيانوسيا', 6)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  sort_order = EXCLUDED.sort_order;

-- Update global region sort order
UPDATE regions SET sort_order = 7 WHERE slug = 'global';

-- ============================================
-- COUNTRIES - Add comprehensive list
-- ============================================
-- Get region IDs
DO $$
DECLARE
  middle_east_id INTEGER;
  europe_id INTEGER;
  americas_id INTEGER;
  asia_id INTEGER;
  africa_id INTEGER;
  oceania_id INTEGER;
BEGIN
  SELECT id INTO middle_east_id FROM regions WHERE slug = 'middle-east';
  SELECT id INTO europe_id FROM regions WHERE slug = 'europe';
  SELECT id INTO americas_id FROM regions WHERE slug = 'americas';
  SELECT id INTO asia_id FROM regions WHERE slug = 'asia';
  SELECT id INTO africa_id FROM regions WHERE slug = 'africa';
  SELECT id INTO oceania_id FROM regions WHERE slug = 'oceania';

  -- Middle East - Additional countries
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('kuwait', 'الكويت', middle_east_id, 11),
    ('bahrain', 'البحرين', middle_east_id, 12),
    ('oman', 'عُمان', middle_east_id, 13),
    ('yemen', 'اليمن', middle_east_id, 14),
    ('libya', 'ليبيا', middle_east_id, 17),
    ('tunisia', 'تونس', middle_east_id, 18),
    ('algeria', 'الجزائر', middle_east_id, 19),
    ('morocco', 'المغرب', middle_east_id, 20),
    ('sudan', 'السودان', middle_east_id, 21),
    ('mauritania', 'موريتانيا', middle_east_id, 22)
  ON CONFLICT (slug) DO NOTHING;

  -- Update Egypt sort order
  UPDATE countries SET sort_order = 15 WHERE slug = 'egypt';
  UPDATE countries SET sort_order = 16 WHERE slug = 'turkey';

  -- Europe - Additional countries
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('spain', 'إسبانيا', europe_id, 6),
    ('netherlands', 'هولندا', europe_id, 7),
    ('belgium', 'بلجيكا', europe_id, 8),
    ('switzerland', 'سويسرا', europe_id, 9),
    ('austria', 'النمسا', europe_id, 10),
    ('poland', 'بولندا', europe_id, 11),
    ('ukraine', 'أوكرانيا', europe_id, 12),
    ('sweden', 'السويد', europe_id, 13),
    ('norway', 'النرويج', europe_id, 14),
    ('denmark', 'الدنمارك', europe_id, 15),
    ('finland', 'فنلندا', europe_id, 16),
    ('greece', 'اليونان', europe_id, 17),
    ('portugal', 'البرتغال', europe_id, 18),
    ('czech-republic', 'التشيك', europe_id, 19),
    ('romania', 'رومانيا', europe_id, 20),
    ('hungary', 'المجر', europe_id, 21),
    ('ireland', 'إيرلندا', europe_id, 22)
  ON CONFLICT (slug) DO NOTHING;

  -- Americas - Additional countries
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('mexico', 'المكسيك', americas_id, 3),
    ('argentina', 'الأرجنتين', americas_id, 5),
    ('colombia', 'كولومبيا', americas_id, 6),
    ('chile', 'تشيلي', americas_id, 7),
    ('peru', 'بيرو', americas_id, 8),
    ('venezuela', 'فنزويلا', americas_id, 9),
    ('cuba', 'كوبا', americas_id, 10),
    ('ecuador', 'الإكوادور', americas_id, 11),
    ('bolivia', 'بوليفيا', americas_id, 12)
  ON CONFLICT (slug) DO NOTHING;

  -- Update Brazil sort order
  UPDATE countries SET sort_order = 4 WHERE slug = 'brazil';

  -- Asia - Additional countries
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('south-korea', 'كوريا الجنوبية', asia_id, 4),
    ('north-korea', 'كوريا الشمالية', asia_id, 5),
    ('pakistan', 'باكستان', asia_id, 6),
    ('bangladesh', 'بنغلاديش', asia_id, 7),
    ('afghanistan', 'أفغانستان', asia_id, 8),
    ('thailand', 'تايلاند', asia_id, 9),
    ('vietnam', 'فيتنام', asia_id, 10),
    ('indonesia', 'إندونيسيا', asia_id, 11),
    ('malaysia', 'ماليزيا', asia_id, 12),
    ('singapore', 'سنغافورة', asia_id, 13),
    ('philippines', 'الفلبين', asia_id, 14),
    ('myanmar', 'ميانمار', asia_id, 15),
    ('cambodia', 'كمبوديا', asia_id, 16),
    ('nepal', 'نيبال', asia_id, 17),
    ('sri-lanka', 'سريلانكا', asia_id, 18),
    ('mongolia', 'منغوليا', asia_id, 19),
    ('kazakhstan', 'كازاخستان', asia_id, 20),
    ('uzbekistan', 'أوزبكستان', asia_id, 21),
    ('azerbaijan', 'أذربيجان', asia_id, 22),
    ('georgia', 'جورجيا', asia_id, 23),
    ('armenia', 'أرمينيا', asia_id, 24)
  ON CONFLICT (slug) DO NOTHING;

  -- Africa - Additional countries
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('south-africa', 'جنوب أفريقيا', africa_id, 1),
    ('nigeria', 'نيجيريا', africa_id, 2),
    ('kenya', 'كينيا', africa_id, 3),
    ('ethiopia', 'إثيوبيا', africa_id, 4),
    ('ghana', 'غانا', africa_id, 5),
    ('tanzania', 'تنزانيا', africa_id, 6),
    ('uganda', 'أوغندا', africa_id, 7),
    ('zimbabwe', 'زيمبابوي', africa_id, 8),
    ('cameroon', 'الكاميرون', africa_id, 9),
    ('senegal', 'السنغال', africa_id, 10),
    ('mali', 'مالي', africa_id, 11),
    ('niger', 'النيجر', africa_id, 12),
    ('chad', 'تشاد', africa_id, 13),
    ('somalia', 'الصومال', africa_id, 14),
    ('rwanda', 'رواندا', africa_id, 15),
    ('mozambique', 'موزمبيق', africa_id, 16),
    ('angola', 'أنغولا', africa_id, 17),
    ('congo', 'الكونغو', africa_id, 18)
  ON CONFLICT (slug) DO NOTHING;

  -- Oceania
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('australia', 'أستراليا', oceania_id, 1),
    ('new-zealand', 'نيوزيلندا', oceania_id, 2),
    ('fiji', 'فيجي', oceania_id, 3),
    ('papua-new-guinea', 'بابوا غينيا الجديدة', oceania_id, 4)
  ON CONFLICT (slug) DO NOTHING;
END $$;

-- ============================================
-- TOPICS - Expand with comprehensive tags
-- ============================================
INSERT INTO topics (slug, name_ar, sort_order) VALUES
  ('military', 'العسكري', 4),
  ('conflict', 'النزاعات', 8),
  ('terrorism', 'الإرهاب', 9),
  ('migration', 'الهجرة', 11),
  ('human-rights', 'حقوق الإنسان', 12),
  ('oil-gas', 'النفط والغاز', 14),
  ('trade', 'التجارة', 17),
  ('sanctions', 'العقوبات', 18),
  ('investment', 'الاستثمار', 19),
  ('currency', 'العملة', 20),
  ('inflation', 'التضخم', 21),
  ('transportation', 'النقل', 23),
  ('climate-change', 'التغير المناخي', 25),
  ('water', 'المياه', 26),
  ('agriculture', 'الزراعة', 27),
  ('cyber-security', 'الأمن السيبراني', 29),
  ('ai', 'الذكاء الاصطناعي', 30),
  ('internet', 'الإنترنت', 31),
  ('pandemic', 'الأوبئة', 33),
  ('medicine', 'الطب', 34),
  ('university', 'الجامعات', 36),
  ('arts', 'الفنون', 38),
  ('media', 'الإعلام', 39),
  ('religion', 'الدين', 41),
  ('sectarianism', 'الطائفية', 42),
  ('judiciary', 'القضاء', 44),
  ('parliament', 'البرلمان', 45),
  ('presidency', 'الرئاسة', 48),
  ('parties', 'الأحزاب', 49),
  ('protests', 'الاحتجاجات', 50),
  ('crisis', 'الأزمة', 51),
  ('reform', 'الإصلاح', 52),
  ('investigation', 'التحقيق', 53),
  ('crime', 'الجريمة', 54),
  ('drugs', 'المخدرات', 55),
  ('smuggling', 'التهريب', 56),
  ('kidnapping', 'الخطف', 57),
  ('assassination', 'الاغتيال', 58),
  ('explosions', 'التفجيرات', 59),
  ('weapons', 'الأسلحة', 60),
  ('nuclear', 'النووي', 61),
  ('missiles', 'الصواريخ', 62),
  ('drones', 'الطائرات المسيرة', 63),
  ('cyber-attacks', 'الهجمات الإلكترونية', 64),
  ('intelligence', 'الاستخبارات', 65),
  ('espionage', 'التجسس', 66),
  ('borders', 'الحدود', 67),
  ('maritime', 'البحري', 68),
  ('aviation', 'الطيران', 69),
  ('space', 'الفضاء', 70),
  ('sports', 'الرياضة', 71),
  ('tourism', 'السياحة', 72),
  ('real-estate', 'العقارات', 73),
  ('labor', 'العمل', 74),
  ('unemployment', 'البطالة', 75),
  ('poverty', 'الفقر', 76),
  ('women', 'المرأة', 77),
  ('youth', 'الشباب', 78),
  ('children', 'الأطفال', 79),
  ('elderly', 'المسنين', 80)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  sort_order = EXCLUDED.sort_order;
