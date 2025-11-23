-- Migration: Add missing columns to smart_notifications table
-- Date: 2024-11-24
-- Description: Adds action_url, metadata, and dismissed_at columns for notification system

-- Add action_url column for notification actions
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Add metadata column for additional notification data
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add dismissed_at column to track when notifications were dismissed
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS dismissed_at TIMESTAMP;

-- Add comment to columns
COMMENT ON COLUMN smart_notifications.action_url IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN smart_notifications.metadata IS 'Additional JSON data for the notification';
COMMENT ON COLUMN smart_notifications.dismissed_at IS 'Timestamp when notification was dismissed';
