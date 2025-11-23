-- Rollback Migration: Remove preferred_language column from users table
-- Date: 2025-11-22
-- Description: Rollback for multi-language feature

-- Drop check constraint
ALTER TABLE users 
DROP CONSTRAINT IF EXISTS chk_users_preferred_language;

-- Drop index
DROP INDEX IF EXISTS idx_users_preferred_language;

-- Drop column
ALTER TABLE users 
DROP COLUMN IF EXISTS preferred_language;
