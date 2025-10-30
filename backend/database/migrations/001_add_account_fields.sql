-- Add missing fields to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS bank_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS iban VARCHAR(32),
ADD COLUMN IF NOT EXISTS account_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS overdraft_limit DECIMAL(12,2) DEFAULT 0.00 CHECK (overdraft_limit >= 0);

-- Add index for bank_id
CREATE INDEX IF NOT EXISTS idx_accounts_bank_id ON accounts(bank_id);