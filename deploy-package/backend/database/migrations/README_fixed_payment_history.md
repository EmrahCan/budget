# Fixed Payment History Migration

## Overview
This migration adds a new table `fixed_payment_history` to track monthly payment status for fixed payments.

## What was added

### Table: `fixed_payment_history`
Tracks whether each fixed payment has been paid for each month.

**Columns:**
- `id` - Primary key
- `user_id` - Reference to users table
- `fixed_payment_id` - Reference to fixed_payments table
- `payment_month` - Month (1-12)
- `payment_year` - Year (2020+)
- `is_paid` - Boolean flag indicating if payment is made
- `paid_date` - Date when payment was made
- `paid_amount` - Actual amount paid (may differ from fixed amount)
- `transaction_id` - Reference to transaction record
- `notes` - Additional notes
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Constraints:**
- Unique constraint on (fixed_payment_id, payment_month, payment_year)
- Foreign key to users (CASCADE delete)
- Foreign key to fixed_payments (CASCADE delete)
- Foreign key to transactions (SET NULL on delete)

**Indexes:**
- `idx_fixed_payment_history_user_id`
- `idx_fixed_payment_history_fixed_payment_id`
- `idx_fixed_payment_history_month_year`
- `idx_fixed_payment_history_is_paid`
- `idx_fixed_payment_history_paid_date`

## How to run

### Local Development
```bash
cd backend
PGPASSWORD=postgres psql -h localhost -U postgres -d budget_app -f database/migrations/add_fixed_payment_history.sql
```

### Production (Azure)
```bash
psql $DATABASE_URL -f database/migrations/add_fixed_payment_history.sql
```

## Rollback
If you need to rollback this migration:

```sql
DROP TABLE IF EXISTS fixed_payment_history CASCADE;
```

## Usage Examples

### Mark a payment as paid
```sql
INSERT INTO fixed_payment_history (
    user_id, 
    fixed_payment_id, 
    payment_month, 
    payment_year, 
    is_paid, 
    paid_date, 
    paid_amount
) VALUES (
    1, 
    5, 
    1, 
    2024, 
    true, 
    '2024-01-15', 
    500.00
) ON CONFLICT (fixed_payment_id, payment_month, payment_year) 
DO UPDATE SET 
    is_paid = true,
    paid_date = EXCLUDED.paid_date,
    paid_amount = EXCLUDED.paid_amount;
```

### Check if payment is paid for current month
```sql
SELECT is_paid 
FROM fixed_payment_history 
WHERE fixed_payment_id = 5 
  AND payment_month = 1 
  AND payment_year = 2024;
```

### Get all unpaid payments for a user in current month
```sql
SELECT fp.*, fph.is_paid
FROM fixed_payments fp
LEFT JOIN fixed_payment_history fph 
    ON fp.id = fph.fixed_payment_id 
    AND fph.payment_month = 1 
    AND fph.payment_year = 2024
WHERE fp.user_id = 1 
  AND fp.is_active = true
  AND (fph.is_paid IS NULL OR fph.is_paid = false);
```

## Next Steps
1. ✅ Migration script created and executed
2. ⏳ Create FixedPaymentHistory model
3. ⏳ Add controller endpoints
4. ⏳ Update frontend UI
