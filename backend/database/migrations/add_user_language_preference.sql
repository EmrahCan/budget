-- Migration: Add preferred_language column to users table
-- Date: 2025-11-22
-- Description: Adds language preference support for multi-language feature

-- Add preferred_language column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(5) DEFAULT 'en';

-- Add comment to column
COMMENT ON COLUMN users.preferred_language IS 'User preferred language code (tr, en, de, fr, es)';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_preferred_language 
ON users(preferred_language);

-- Add check constraint to ensure only supported languages
ALTER TABLE users 
ADD CONSTRAINT IF NOT EXISTS chk_users_preferred_language 
CHECK (preferred_language IN ('tr', 'en', 'de', 'fr', 'es'));

-- Update existing users to have default language (en)
UPDATE users 
SET preferred_language = 'en' 
WHERE preferred_language IS NULL;
