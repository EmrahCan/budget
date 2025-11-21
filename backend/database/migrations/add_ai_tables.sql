-- AI Feature Expansion - Database Migration
-- This migration adds tables for AI features including:
-- - AI interaction logging
-- - User AI preferences
-- - Category learning data
-- - Anomaly detection profiles
-- - Receipt images storage

-- ============================================
-- 1. AI Interactions Log Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL, -- categorization, query, prediction, ocr, voice, etc.
  request_data JSONB NOT NULL,
  response_data JSONB,
  confidence_score DECIMAL(5,2),
  user_feedback VARCHAR(20), -- accepted, rejected, modified
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ai_interactions
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_id ON ai_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_created_at ON ai_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_type ON ai_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_ai_interactions_user_created ON ai_interactions(user_id, created_at DESC);

-- ============================================
-- 2. User AI Preferences Table
-- ============================================
CREATE TABLE IF NOT EXISTS user_ai_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_categorization_enabled BOOLEAN DEFAULT true,
  auto_categorization_threshold INTEGER DEFAULT 70 CHECK (auto_categorization_threshold BETWEEN 0 AND 100),
  voice_commands_enabled BOOLEAN DEFAULT false,
  smart_notifications_enabled BOOLEAN DEFAULT true,
  notification_frequency VARCHAR(20) DEFAULT 'daily' CHECK (notification_frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  preferred_language VARCHAR(5) DEFAULT 'tr' CHECK (preferred_language IN ('tr', 'en')),
  learning_mode BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_ai_preferences_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_ai_preferences_timestamp
  BEFORE UPDATE ON user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_ai_preferences_timestamp();

-- ============================================
-- 3. Category Learning Data Table
-- ============================================
CREATE TABLE IF NOT EXISTS category_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description_pattern TEXT NOT NULL,
  suggested_category VARCHAR(100),
  actual_category VARCHAR(100) NOT NULL,
  frequency INTEGER DEFAULT 1,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for category_learning
CREATE INDEX IF NOT EXISTS idx_category_learning_user_id ON category_learning(user_id);
CREATE INDEX IF NOT EXISTS idx_category_learning_pattern ON category_learning(user_id, description_pattern);
CREATE INDEX IF NOT EXISTS idx_category_learning_last_used ON category_learning(last_used DESC);

-- ============================================
-- 4. User Spending Profile Table (for Anomaly Detection)
-- ============================================
CREATE TABLE IF NOT EXISTS user_spending_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  avg_amount DECIMAL(15,2),
  std_deviation DECIMAL(15,2),
  min_amount DECIMAL(15,2),
  max_amount DECIMAL(15,2),
  transaction_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, category)
);

-- Indexes for user_spending_profile
CREATE INDEX IF NOT EXISTS idx_spending_profile_user_id ON user_spending_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_spending_profile_category ON user_spending_profile(category);
CREATE INDEX IF NOT EXISTS idx_spending_profile_user_category ON user_spending_profile(user_id, category);

-- ============================================
-- 5. Receipt Images Table
-- ============================================
CREATE TABLE IF NOT EXISTS receipt_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  image_path TEXT NOT NULL,
  image_size INTEGER, -- Size in bytes
  mime_type VARCHAR(50),
  ocr_data JSONB,
  ocr_confidence DECIMAL(5,2),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for receipt_images
CREATE INDEX IF NOT EXISTS idx_receipt_images_user_id ON receipt_images(user_id);
CREATE INDEX IF NOT EXISTS idx_receipt_images_transaction_id ON receipt_images(transaction_id);
CREATE INDEX IF NOT EXISTS idx_receipt_images_created_at ON receipt_images(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_receipt_images_user_created ON receipt_images(user_id, created_at DESC);

-- ============================================
-- 6. Smart Notifications Table
-- ============================================
CREATE TABLE IF NOT EXISTS smart_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- payment_reminder, budget_alert, saving_opportunity, anomaly_detected
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  data JSONB, -- Additional notification data
  is_read BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  action_taken BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for smart_notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON smart_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON smart_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON smart_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON smart_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON smart_notifications(scheduled_for) WHERE sent_at IS NULL;

-- ============================================
-- 7. AI Query History Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  query_text TEXT NOT NULL,
  query_language VARCHAR(5) DEFAULT 'tr',
  interpretation JSONB,
  results_count INTEGER,
  execution_time_ms INTEGER,
  was_successful BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for ai_query_history
CREATE INDEX IF NOT EXISTS idx_query_history_user_id ON ai_query_history(user_id);
CREATE INDEX IF NOT EXISTS idx_query_history_created_at ON ai_query_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_history_user_created ON ai_query_history(user_id, created_at DESC);

-- ============================================
-- 8. Financial Coach Sessions Table
-- ============================================
CREATE TABLE IF NOT EXISTS financial_coach_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL, -- chat, health_report, goal_tracking
  messages JSONB, -- Array of messages in the session
  insights JSONB, -- Generated insights
  recommendations JSONB, -- Generated recommendations
  health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Indexes for financial_coach_sessions
CREATE INDEX IF NOT EXISTS idx_coach_sessions_user_id ON financial_coach_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_started_at ON financial_coach_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_sessions_active ON financial_coach_sessions(user_id, ended_at) WHERE ended_at IS NULL;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE ai_interactions IS 'Logs all AI service interactions for analytics and debugging';
COMMENT ON TABLE user_ai_preferences IS 'Stores user preferences for AI features';
COMMENT ON TABLE category_learning IS 'Stores user-specific category learning patterns';
COMMENT ON TABLE user_spending_profile IS 'Statistical profile of user spending for anomaly detection';
COMMENT ON TABLE receipt_images IS 'Stores receipt/invoice images and OCR data';
COMMENT ON TABLE smart_notifications IS 'AI-generated smart notifications and reminders';
COMMENT ON TABLE ai_query_history IS 'History of natural language queries';
COMMENT ON TABLE financial_coach_sessions IS 'Financial coaching chat sessions and insights';

-- ============================================
-- Initial data: Create default preferences for existing users
-- ============================================
INSERT INTO user_ai_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_ai_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'AI tables migration completed successfully!';
  RAISE NOTICE 'Created tables: ai_interactions, user_ai_preferences, category_learning, user_spending_profile, receipt_images, smart_notifications, ai_query_history, financial_coach_sessions';
END $$;
