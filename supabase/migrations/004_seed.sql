-- 4Lebanon News Seed Data
-- Migration: 004_seed.sql
-- Description: Initial taxonomy data (developer-managed, not editable via admin)

-- ============================================
-- SECTIONS (News Categories)
-- ============================================
INSERT INTO sections (slug, name_ar, description_ar, sort_order) VALUES
  ('breaking', 'أخبار عاجلة', 'آخر الأخبار العاجلة والمستجدات', 1),
  ('news', 'الأخبار', 'الأخبار المحلية والإقليمية', 2),
  ('analysis', 'تحليل', 'تحليلات سياسية واقتصادية معمقة', 3),
  ('geopolitics', 'الجغرافيا السياسية', 'الأحداث الجيوسياسية والعلاقات الدولية', 4),
  ('economy', 'اقتصاد', 'الأخبار والتحليلات الاقتصادية', 5),
  ('security', 'أمن وقضاء', 'أخبار الأمن والقضاء', 6),
  ('opinion', 'رأي', 'مقالات الرأي والكتّاب', 7),
  ('special', 'خاص', 'تقارير وتحقيقات خاصة', 8);

-- ============================================
-- REGIONS (Geographic Regions)
-- ============================================
INSERT INTO regions (slug, name_ar, sort_order) VALUES
  ('middle-east', 'الشرق الأوسط', 1),
  ('europe', 'أوروبا', 2),
  ('americas', 'الأمريكيتين', 3),
  ('asia', 'آسيا', 4),
  ('africa', 'أفريقيا', 5),
  ('global', 'عالمي', 6);

-- ============================================
-- COUNTRIES (with Region FK)
-- ============================================
-- Middle East
INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
  ('lebanon', 'لبنان', 1, 1),
  ('syria', 'سوريا', 1, 2),
  ('palestine', 'فلسطين', 1, 3),
  ('israel', 'إسرائيل', 1, 4),
  ('jordan', 'الأردن', 1, 5),
  ('iraq', 'العراق', 1, 6),
  ('iran', 'إيران', 1, 7),
  ('saudi-arabia', 'السعودية', 1, 8),
  ('uae', 'الإمارات', 1, 9),
  ('qatar', 'قطر', 1, 10),
  ('egypt', 'مصر', 1, 11),
  ('turkey', 'تركيا', 1, 12);

-- Europe
INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
  ('france', 'فرنسا', 2, 1),
  ('germany', 'ألمانيا', 2, 2),
  ('uk', 'بريطانيا', 2, 3),
  ('russia', 'روسيا', 2, 4),
  ('italy', 'إيطاليا', 2, 5);

-- Americas
INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
  ('usa', 'الولايات المتحدة', 3, 1),
  ('canada', 'كندا', 3, 2),
  ('brazil', 'البرازيل', 3, 3);

-- Asia
INSERT INTO countries (slug, name_ar, region_id, sort_order) VALUES
  ('china', 'الصين', 4, 1),
  ('japan', 'اليابان', 4, 2),
  ('india', 'الهند', 4, 3);

-- ============================================
-- TOPICS (Article Tags)
-- ============================================
INSERT INTO topics (slug, name_ar, sort_order) VALUES
  ('politics', 'السياسة', 1),
  ('economy', 'الاقتصاد', 2),
  ('security', 'الأمن', 3),
  ('diplomacy', 'الدبلوماسية', 4),
  ('war', 'الحرب', 5),
  ('peace', 'السلام', 6),
  ('refugees', 'اللاجئين', 7),
  ('energy', 'الطاقة', 8),
  ('finance', 'المالية', 9),
  ('banking', 'المصارف', 10),
  ('infrastructure', 'البنية التحتية', 11),
  ('environment', 'البيئة', 12),
  ('technology', 'التكنولوجيا', 13),
  ('health', 'الصحة', 14),
  ('education', 'التعليم', 15),
  ('culture', 'الثقافة', 16),
  ('society', 'المجتمع', 17),
  ('corruption', 'الفساد', 18),
  ('elections', 'الانتخابات', 19),
  ('government', 'الحكومة', 20);
