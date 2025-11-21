-- Rollback AI Feature Expansion - Database Migration
-- This script removes all AI-related tables and their dependencies

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS financial_coach_sessions CASCADE;
DROP TABLE IF EXISTS ai_query_history CASCADE;
DROP TABLE IF EXISTS smart_notifications CASCADE;
DROP TABLE IF EXISTS receipt_images CASCADE;
DROP TABLE IF EXISTS user_spending_profile CASCADE;
DROP TABLE IF EXISTS category_learning CASCADE;
DROP TABLE IF EXISTS user_ai_preferences CASCADE;
DROP TABLE IF EXISTS ai_interactions CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_user_ai_preferences_timestamp() CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'AI tables rollback completed successfully!';
  RAISE NOTICE 'Dropped tables: financial_coach_sessions, ai_query_history, smart_notifications, receipt_images, user_spending_profile, category_learning, user_ai_preferences, ai_interactions';
END $$;
