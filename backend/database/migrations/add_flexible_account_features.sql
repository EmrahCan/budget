-- Add flexible account features to existing accounts table
-- This migration adds credit-like functionality to regular accounts

-- Add new columns for flexible account features
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS account_limit DECIMAL(15,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS current_debt DECIMAL(15,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS minimum_payment_rate DECIMAL(5,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS payment_due_date INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_flexible BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bank_id VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS iban VARCHAR(34) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50) DEFAULT NULL;

-- Add computed columns for flexible accounts
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS available_limit DECIMAL(15,2) GENERATED ALWAYS AS (
    CASE 
        WHEN is_flexible = true AND account_limit IS NOT NULL 
        THEN GREATEST(0, account_limit - current_debt)
        ELSE NULL 
    END
) STORED,
ADD COLUMN IF NOT EXISTS utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
        WHEN is_flexible = true AND account_limit IS NOT NULL AND account_limit > 0
        THEN ROUND((current_debt / account_limit) * 100, 2)
        ELSE NULL 
    END
) STORED;

-- Update account types to include flexible types
-- Add new account types for flexible accounts
-- Note: This doesn't change existing data, just documents the new types

-- Create index for flexible account queries
CREATE INDEX IF NOT EXISTS idx_accounts_is_flexible ON accounts(is_flexible);
CREATE INDEX IF NOT EXISTS idx_accounts_bank_id ON accounts(bank_id);

-- Add check constraints for data integrity
ALTER TABLE accounts 
ADD CONSTRAINT chk_account_limit_positive 
CHECK (account_limit IS NULL OR account_limit >= 0);

ALTER TABLE accounts 
ADD CONSTRAINT chk_current_debt_non_negative 
CHECK (current_debt >= 0);

ALTER TABLE accounts 
ADD CONSTRAINT chk_interest_rate_valid 
CHECK (interest_rate IS NULL OR (interest_rate >= 0 AND interest_rate <= 100));

ALTER TABLE accounts 
ADD CONSTRAINT chk_minimum_payment_rate_valid 
CHECK (minimum_payment_rate >= 0 AND minimum_payment_rate <= 100);

ALTER TABLE accounts 
ADD CONSTRAINT chk_payment_due_date_valid 
CHECK (payment_due_date IS NULL OR (payment_due_date >= 1 AND payment_due_date <= 31));

-- Add comment to document the flexible account feature
COMMENT ON COLUMN accounts.is_flexible IS 'Indicates if this account has credit-like features (limit, debt tracking)';
COMMENT ON COLUMN accounts.account_limit IS 'Credit limit or spending limit for flexible accounts';
COMMENT ON COLUMN accounts.current_debt IS 'Current debt/used amount for flexible accounts';
COMMENT ON COLUMN accounts.available_limit IS 'Computed: Available credit/spending limit';
COMMENT ON COLUMN accounts.utilization_percentage IS 'Computed: Percentage of limit used';

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Flexible account features added to accounts table successfully';
END $$;