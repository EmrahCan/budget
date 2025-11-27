# Notification Tracking Columns Migration

## Overview
This migration adds tracking columns to the `smart_notifications` table to link notifications with their related entities (payments, budgets, etc.).

## Changes
- Adds `related_entity_id` (UUID) column
- Adds `related_entity_type` (VARCHAR(50)) column
- Creates index for better query performance

## How to Apply

### Local Development (Docker)
```bash
docker-compose exec db psql -U postgres -d budget_app -f /migrations/add_notification_tracking_columns.sql
```

### Production (Docker)
```bash
docker-compose exec db psql -U postgres -d budget_app < backend/database/migrations/add_notification_tracking_columns.sql
```

### Direct PostgreSQL
```bash
psql -U postgres -d budget_app -f backend/database/migrations/add_notification_tracking_columns.sql
```

## Verification
```sql
-- Check if columns exist
\d smart_notifications

-- Check if index was created
\di idx_smart_notifications_entity

-- Count notifications with entity tracking
SELECT 
  related_entity_type, 
  COUNT(*) 
FROM smart_notifications 
WHERE related_entity_type IS NOT NULL 
GROUP BY related_entity_type;
```

## Rollback
```sql
-- Remove index
DROP INDEX IF EXISTS idx_smart_notifications_entity;

-- Remove columns
ALTER TABLE smart_notifications 
DROP COLUMN IF EXISTS related_entity_id,
DROP COLUMN IF EXISTS related_entity_type;
```

## Version
- **Migration Version:** v2.3.0
- **Date:** 2024-11-21
- **Safe to run multiple times:** Yes (uses IF NOT EXISTS)
