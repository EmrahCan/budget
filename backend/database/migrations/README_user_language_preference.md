# User Language Preference Migration

**Date:** November 22, 2025  
**Feature:** Multi-Language Support  
**Status:** Ready to Apply

---

## Overview

This migration adds language preference support to the users table, allowing users to select and persist their preferred language across sessions.

## Changes

### New Column: `preferred_language`

- **Type:** VARCHAR(5)
- **Default:** 'en' (English)
- **Nullable:** NO
- **Constraint:** Must be one of: 'tr', 'en', 'de', 'fr', 'es'

### New Index: `idx_users_preferred_language`

- **Purpose:** Improve query performance when filtering by language
- **Type:** B-tree index

### Check Constraint: `chk_users_preferred_language`

- **Purpose:** Ensure only supported language codes are stored
- **Allowed Values:** 'tr', 'en', 'de', 'fr', 'es'

---

## Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| tr   | Turkish  | Türkçe      |
| en   | English  | English     |
| de   | German   | Deutsch     |
| fr   | French   | Français    |
| es   | Spanish  | Español     |

---

## How to Apply

### Option 1: Using the Script (Recommended)

```bash
# From project root
./apply-language-migration.sh
```

### Option 2: Manual Application

```bash
# Apply migration
cat backend/database/migrations/add_user_language_preference.sql | \
    docker exec -i <database_container> psql -U postgres -d budget_app

# Verify
docker exec -i <database_container> psql -U postgres -d budget_app \
    -c "\d users" | grep preferred_language
```

### Option 3: Direct SQL

```sql
-- Connect to your database and run:
\i backend/database/migrations/add_user_language_preference.sql
```

---

## Rollback

If you need to rollback this migration:

```bash
cat backend/database/migrations/rollback_user_language_preference.sql | \
    docker exec -i <database_container> psql -U postgres -d budget_app
```

---

## Verification

After applying the migration, verify the changes:

```sql
-- Check column exists
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'preferred_language';

-- Check index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_preferred_language';

-- Check constraint exists
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'chk_users_preferred_language';

-- Check existing data
SELECT preferred_language, COUNT(*) as user_count
FROM users
GROUP BY preferred_language;
```

---

## Impact

### Existing Data

- All existing users will have `preferred_language` set to 'en' (English)
- No data loss
- No breaking changes

### Application Changes Required

After applying this migration, you need to:

1. ✅ Update User model (`backend/models/User.js`)
2. ✅ Create API endpoint (`PUT /api/users/preferences`)
3. ✅ Update login response to include language preference
4. ✅ Update frontend to use language preference

---

## Testing

### Test Cases

1. **New Users**
   ```sql
   INSERT INTO users (email, password, preferred_language)
   VALUES ('test@example.com', 'hashed_password', 'de');
   ```

2. **Update Existing User**
   ```sql
   UPDATE users 
   SET preferred_language = 'fr' 
   WHERE email = 'existing@example.com';
   ```

3. **Invalid Language (Should Fail)**
   ```sql
   UPDATE users 
   SET preferred_language = 'invalid' 
   WHERE id = 1;
   -- Error: new row violates check constraint
   ```

4. **Query by Language**
   ```sql
   SELECT * FROM users WHERE preferred_language = 'tr';
   ```

---

## Performance

- **Index Size:** Minimal (~few KB for typical user counts)
- **Query Performance:** O(log n) for language-based queries
- **Storage Impact:** 5 bytes per user
- **Migration Time:** < 1 second for typical databases

---

## Related Files

- **Migration:** `add_user_language_preference.sql`
- **Rollback:** `rollback_user_language_preference.sql`
- **Apply Script:** `../../apply-language-migration.sh`
- **Spec:** `../../.kiro/specs/multi-language-support/`

---

## Notes

- This migration is idempotent (safe to run multiple times)
- Uses `IF NOT EXISTS` clauses to prevent errors on re-run
- Default language is English ('en') for all users
- Users can change their language preference via the UI after implementation

---

## Troubleshooting

### Error: "column already exists"

The migration uses `IF NOT EXISTS`, so this shouldn't happen. If it does:

```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'preferred_language';
```

### Error: "constraint already exists"

```sql
-- Drop and recreate
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_preferred_language;
-- Then re-run migration
```

### Error: "index already exists"

```sql
-- Drop and recreate
DROP INDEX IF EXISTS idx_users_preferred_language;
-- Then re-run migration
```

---

**Status:** ✅ Ready to Apply  
**Risk Level:** Low  
**Estimated Time:** < 1 minute
