-- Migration: Add tracking columns to smart_notifications table
-- Version: v2.3.0
-- Date: 2024-11-21
-- Description: Adds related_entity_id and related_entity_type columns for better notification tracking

-- Add new columns for notification tracking
ALTER TABLE smart_notifications 
ADD COLUMN IF NOT EXISTS related_entity_id UUID,
ADD COLUMN IF NOT EXISTS related_entity_type VARCHAR(50);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_smart_notifications_entity 
ON smart_notifications(related_entity_type, related_entity_id);

-- Verify columns were added
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'smart_notifications' 
AND column_name IN ('related_entity_id', 'related_entity_type');
