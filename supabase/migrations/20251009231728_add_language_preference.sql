/*
  # Add Language Preference to User Profiles

  1. Changes
    - Add `language` column to `user_profiles` table
    - Default language is 'pt' (Portuguese)
    - Supported languages: pt, es, fr, it, en, de

  2. Security
    - No RLS changes needed (existing policies cover this column)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'language'
  ) THEN
    ALTER TABLE user_profiles
    ADD COLUMN language text DEFAULT 'pt' CHECK (language IN ('pt', 'es', 'fr', 'it', 'en', 'de'));
  END IF;
END $$;
