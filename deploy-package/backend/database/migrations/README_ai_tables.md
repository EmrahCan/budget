# AI Tables Migration

This migration adds database tables required for AI feature expansion.

## Tables Created

### 1. ai_interactions
Logs all AI service interactions for analytics, debugging, and improvement.
- Tracks request/response data
- Stores confidence scores
- Records user feedback
- Measures processing time

### 2. user_ai_preferences
Stores user-specific AI feature preferences.
- Auto-categorization settings
- Voice command preferences
- Notification preferences
- Language preferences
- Learning mode toggle

### 3. category_learning
Stores user-specific category learning patterns.
- Description patterns
- Suggested vs actual categories
- Frequency tracking
- Enables personalized categorization

### 4. user_spending_profile
Statistical profile of user spending for anomaly detection.
- Average amounts per category
- Standard deviation
- Min/max amounts
- Transaction counts
- Updated periodically for anomaly detection

### 5. receipt_images
Stores receipt/invoice images and OCR data.
- Image file paths
- OCR extracted data
- Confidence scores
- Links to transactions

### 6. smart_notifications
AI-generated smart notifications and reminders.
- Payment reminders
- Budget alerts
- Saving opportunities
- Anomaly warnings
- Priority levels
- Read/dismissed status

### 7. ai_query_history
History of natural language queries.
- Query text and language
- Interpretation results
- Execution metrics
- Success tracking

### 8. financial_coach_sessions
Financial coaching chat sessions and insights.
- Chat messages
- Generated insights
- Recommendations
- Health scores
- Session tracking

## Running the Migration

### Apply Migration
```bash
# Using psql
psql -U your_username -d budget_db -f add_ai_tables.sql

# Or using the migrate script
node database/migrate.js
```

### Rollback Migration
```bash
# Using psql
psql -U your_username -d budget_db -f rollback_ai_tables.sql
```

## Features Enabled by These Tables

1. **Smart Transaction Categorization** - Uses category_learning and ai_interactions
2. **Natural Language Search** - Uses ai_query_history
3. **Predictive Analytics** - Uses user_spending_profile
4. **Anomaly Detection** - Uses user_spending_profile and smart_notifications
5. **Receipt OCR** - Uses receipt_images
6. **Smart Notifications** - Uses smart_notifications
7. **Financial Coach** - Uses financial_coach_sessions
8. **User Preferences** - Uses user_ai_preferences

## Indexes

All tables include appropriate indexes for:
- User lookups
- Time-based queries
- Composite queries
- Foreign key relationships

## Data Privacy

- All tables include CASCADE DELETE on user_id
- User data is automatically cleaned up when user is deleted
- Sensitive data is stored in JSONB for flexibility
- OCR data includes confidence scores for validation

## Performance Considerations

- Indexes optimized for common query patterns
- JSONB columns for flexible data storage
- Timestamp indexes for time-series queries
- Composite indexes for user-specific queries

## Maintenance

### Cleanup Old Data
```sql
-- Delete old AI interactions (older than 90 days)
DELETE FROM ai_interactions 
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old query history (older than 180 days)
DELETE FROM ai_query_history 
WHERE created_at < NOW() - INTERVAL '180 days';

-- Delete processed receipts (older than 1 year)
DELETE FROM receipt_images 
WHERE created_at < NOW() - INTERVAL '1 year' 
AND transaction_id IS NOT NULL;
```

### Update Spending Profiles
```sql
-- Recalculate spending profiles for all users
-- This should be run periodically (e.g., daily via cron job)
-- Implementation in backend service
```

## Notes

- Default AI preferences are created for all existing users
- Tables use UUID for primary keys
- All timestamps use CURRENT_TIMESTAMP
- JSONB columns allow flexible schema evolution
- Check constraints ensure data validity
