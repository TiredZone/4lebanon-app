-- Migration: 016_anonymize_chadi.sql
-- Description: Anonymize Chadi's profile (chadizgheib@4lebanon.com)
-- Articles remain but author attribution is hidden from public display.

UPDATE profiles
SET is_anonymous = TRUE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'chadizgheib@4lebanon.com'
);
