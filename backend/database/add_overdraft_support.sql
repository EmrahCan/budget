-- Add overdraft support to accounts table
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS overdraft_limit DECIMAL(12,2) DEFAULT 0.00 CHECK (overdraft_limit >= 0),
ADD COLUMN IF NOT EXISTS overdraft_used DECIMAL(12,2) DEFAULT 0.00 CHECK (overdraft_used >= 0),
ADD COLUMN IF NOT EXISTS overdraft_interest_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (overdraft_interest_rate >= 0);

-- Add comment
COMMENT ON COLUMN accounts.overdraft_limit IS 'Kredili mevduat hesabı limiti';
COMMENT ON COLUMN accounts.overdraft_used IS 'Kullanılan kredili mevduat tutarı';
COMMENT ON COLUMN accounts.overdraft_interest_rate IS 'Kredili mevduat faiz oranı';
