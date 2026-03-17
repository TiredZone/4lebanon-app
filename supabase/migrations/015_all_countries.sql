-- Migration: 015_all_countries.sql
-- Description: Add all remaining countries worldwide

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

  -- ============================================
  -- MIDDLE EAST - Missing countries
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('djibouti', 'جيبوتي', middle_east_id, 23),
    ('comoros', 'جزر القمر', middle_east_id, 24),
    ('somalia-land', 'أرض الصومال', middle_east_id, 25)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- EUROPE - Missing countries
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('belarus', 'بيلاروسيا', europe_id, 23),
    ('serbia', 'صربيا', europe_id, 24),
    ('croatia', 'كرواتيا', europe_id, 25),
    ('bosnia', 'البوسنة والهرسك', europe_id, 26),
    ('montenegro', 'الجبل الأسود', europe_id, 27),
    ('north-macedonia', 'مقدونيا الشمالية', europe_id, 28),
    ('albania', 'ألبانيا', europe_id, 29),
    ('kosovo', 'كوسوفو', europe_id, 30),
    ('bulgaria', 'بلغاريا', europe_id, 31),
    ('slovakia', 'سلوفاكيا', europe_id, 32),
    ('slovenia', 'سلوفينيا', europe_id, 33),
    ('lithuania', 'ليتوانيا', europe_id, 34),
    ('latvia', 'لاتفيا', europe_id, 35),
    ('estonia', 'إستونيا', europe_id, 36),
    ('moldova', 'مولدوفا', europe_id, 37),
    ('luxembourg', 'لوكسمبورغ', europe_id, 38),
    ('malta', 'مالطا', europe_id, 39),
    ('cyprus', 'قبرص', europe_id, 40),
    ('iceland', 'آيسلندا', europe_id, 41)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- AMERICAS - Missing countries
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('uruguay', 'أوروغواي', americas_id, 13),
    ('paraguay', 'باراغواي', americas_id, 14),
    ('panama', 'بنما', americas_id, 15),
    ('costa-rica', 'كوستاريكا', americas_id, 16),
    ('guatemala', 'غواتيمالا', americas_id, 17),
    ('honduras', 'هندوراس', americas_id, 18),
    ('el-salvador', 'السلفادور', americas_id, 19),
    ('nicaragua', 'نيكاراغوا', americas_id, 20),
    ('dominican-republic', 'جمهورية الدومينيكان', americas_id, 21),
    ('haiti', 'هايتي', americas_id, 22),
    ('jamaica', 'جامايكا', americas_id, 23),
    ('trinidad-and-tobago', 'ترينيداد وتوباغو', americas_id, 24),
    ('guyana', 'غيانا', americas_id, 25),
    ('suriname', 'سورينام', americas_id, 26),
    ('belize', 'بليز', americas_id, 27),
    ('bahamas', 'الباهاماس', americas_id, 28),
    ('barbados', 'باربادوس', americas_id, 29),
    ('puerto-rico', 'بورتوريكو', americas_id, 30)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- ASIA - Missing countries
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('turkmenistan', 'تركمانستان', asia_id, 25),
    ('tajikistan', 'طاجيكستان', asia_id, 26),
    ('kyrgyzstan', 'قيرغيزستان', asia_id, 27),
    ('laos', 'لاوس', asia_id, 28),
    ('brunei', 'بروناي', asia_id, 29),
    ('east-timor', 'تيمور الشرقية', asia_id, 30),
    ('maldives', 'المالديف', asia_id, 31),
    ('bhutan', 'بوتان', asia_id, 32),
    ('taiwan', 'تايوان', asia_id, 33)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- AFRICA - Missing countries
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('eritrea', 'إريتريا', africa_id, 19),
    ('south-sudan', 'جنوب السودان', africa_id, 20),
    ('burkina-faso', 'بوركينا فاسو', africa_id, 21),
    ('benin', 'بنين', africa_id, 22),
    ('togo', 'توغو', africa_id, 23),
    ('guinea', 'غينيا', africa_id, 24),
    ('guinea-bissau', 'غينيا بيساو', africa_id, 25),
    ('ivory-coast', 'ساحل العاج', africa_id, 26),
    ('sierra-leone', 'سيراليون', africa_id, 27),
    ('liberia', 'ليبيريا', africa_id, 28),
    ('gambia', 'غامبيا', africa_id, 29),
    ('cape-verde', 'الرأس الأخضر', africa_id, 30),
    ('central-african-republic', 'جمهورية أفريقيا الوسطى', africa_id, 31),
    ('gabon', 'الغابون', africa_id, 32),
    ('equatorial-guinea', 'غينيا الاستوائية', africa_id, 33),
    ('congo-dr', 'الكونغو الديمقراطية', africa_id, 34),
    ('madagascar', 'مدغشقر', africa_id, 35),
    ('mauritius', 'موريشيوس', africa_id, 36),
    ('seychelles', 'سيشل', africa_id, 37),
    ('burundi', 'بوروندي', africa_id, 38),
    ('malawi', 'ملاوي', africa_id, 39),
    ('zambia', 'زامبيا', africa_id, 40),
    ('botswana', 'بوتسوانا', africa_id, 41),
    ('namibia', 'ناميبيا', africa_id, 42),
    ('lesotho', 'ليسوتو', africa_id, 43),
    ('eswatini', 'إسواتيني', africa_id, 44)
  ON CONFLICT (slug) DO NOTHING;

  -- ============================================
  -- OCEANIA - Missing countries
  -- ============================================
  INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
    ('samoa', 'ساموا', oceania_id, 5),
    ('tonga', 'تونغا', oceania_id, 6),
    ('vanuatu', 'فانواتو', oceania_id, 7),
    ('solomon-islands', 'جزر سليمان', oceania_id, 8)
  ON CONFLICT (slug) DO NOTHING;

END $$;
