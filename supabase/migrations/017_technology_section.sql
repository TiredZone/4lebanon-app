-- Migration: 017_technology_section.sql
-- Description: Add Technology (تكنولوجيا) section for tech news coverage.

INSERT INTO sections (slug, name_ar, description_ar, sort_order)
VALUES ('technology', 'تكنولوجيا', 'أخبار التكنولوجيا والابتكار', 13)
ON CONFLICT (slug) DO NOTHING;
