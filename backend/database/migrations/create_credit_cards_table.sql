-- Create credit cards table with enhanced features
-- This migration creates a comprehensive credit card management system

-- Create credit_cards table
CREATE TABLE IF NOT EXISTS credit_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    bank_id VARCHAR(50),
    bank_name VARCHAR(100),
    
    -- Credit card limits and balances
    credit_limit DECIMAL(15,2) NOT NULL CHECK (credit_limit > 0),
    current_balance DECIMAL(15,2) DEFAULT 0.00 CHECK (current_balance >= 0),
    statement_balance DECIMAL(15,2) DEFAULT 0.00 CHECK (statement_balance >= 0),
    
    -- Interest and payment settings
    interest_rate DECIMAL(5,2) NOT NULL CHECK (interest_rate >= 0 AND interest_rate <= 100),
    minimum_payment_rate DECIMAL(5,2) DEFAULT 5.00 CHECK (minimum_payment_rate >= 0 AND minimum_payment_rate <= 100),
    payment_due_date INTEGER CHECK (payment_due_date >= 1 AND payment_due_date <= 31),
    
    -- Statement and billing cycle
    statement_date INTEGER CHECK (statement_date >= 1 AND statement_date <= 31),
    billing_cycle_start DATE,
    billing_cycle_end DATE,
    
    -- Computed fields
    available_credit DECIMAL(15,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED,
    utilization_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN credit_limit > 0 THEN ROUND((current_balance / credit_limit) * 100, 2)
            ELSE 0 
        END
    ) STORED,
    minimum_payment DECIMAL(15,2) GENERATED ALWAYS AS (
        CASE 
            WHEN current_balance > 0 THEN GREATEST(
                ROUND(current_balance * (minimum_payment_rate / 100), 2),
                25.00  -- Minimum 25 TL
            )
            ELSE 0 
        END
    ) STORED,
    
    -- Status fields
    is_active BOOLEAN DEFAULT true,
    is_blocked BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_bank_id ON credit_cards(bank_id);
CREATE INDEX IF NOT EXISTS idx_credit_cards_active ON credit_cards(is_active);

-- Create updated_at trigger for credit_cards
CREATE TRIGGER update_credit_cards_updated_at BEFORE UPDATE ON credit_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE credit_cards IS 'Credit card management with Turkish banking system integration';
COMMENT ON COLUMN credit_cards.current_balance IS 'Current outstanding balance on the card';
COMMENT ON COLUMN credit_cards.statement_balance IS 'Balance from the last statement period';
COMMENT ON COLUMN credit_cards.available_credit IS 'Computed: Available credit limit';
COMMENT ON COLUMN credit_cards.utilization_percentage IS 'Computed: Credit utilization percentage';
COMMENT ON COLUMN credit_cards.minimum_payment IS 'Computed: Minimum payment amount';

-- Create credit card transactions table
CREATE TABLE IF NOT EXISTS credit_card_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    type VARCHAR(50) NOT NULL CHECK (type IN ('purchase', 'payment', 'interest', 'fee', 'refund', 'adjustment')),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    description TEXT,
    category VARCHAR(100),
    
    -- Transaction dates
    transaction_date DATE NOT NULL,
    posting_date DATE DEFAULT CURRENT_DATE,
    
    -- Statement period
    statement_period VARCHAR(7), -- Format: YYYY-MM
    is_posted BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for credit card transactions
CREATE INDEX IF NOT EXISTS idx_cc_transactions_card_id ON credit_card_transactions(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_user_id ON credit_card_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_date ON credit_card_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_type ON credit_card_transactions(type);
CREATE INDEX IF NOT EXISTS idx_cc_transactions_statement ON credit_card_transactions(statement_period);

-- Create updated_at trigger for credit card transactions
CREATE TRIGGER update_credit_card_transactions_updated_at BEFORE UPDATE ON credit_card_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create credit card statements table
CREATE TABLE IF NOT EXISTS credit_card_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Statement period
    statement_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    statement_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Balances
    previous_balance DECIMAL(15,2) DEFAULT 0.00,
    new_charges DECIMAL(15,2) DEFAULT 0.00,
    payments_credits DECIMAL(15,2) DEFAULT 0.00,
    interest_charges DECIMAL(15,2) DEFAULT 0.00,
    fees DECIMAL(15,2) DEFAULT 0.00,
    statement_balance DECIMAL(15,2) NOT NULL,
    minimum_payment_due DECIMAL(15,2) NOT NULL,
    
    -- Payment status
    is_paid BOOLEAN DEFAULT false,
    payment_amount DECIMAL(15,2) DEFAULT 0.00,
    payment_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint for statement period per card
    UNIQUE(credit_card_id, statement_period)
);

-- Create indexes for statements
CREATE INDEX IF NOT EXISTS idx_cc_statements_card_id ON credit_card_statements(credit_card_id);
CREATE INDEX IF NOT EXISTS idx_cc_statements_period ON credit_card_statements(statement_period);
CREATE INDEX IF NOT EXISTS idx_cc_statements_due_date ON credit_card_statements(due_date);

-- Create updated_at trigger for statements
CREATE TRIGGER update_credit_card_statements_updated_at BEFORE UPDATE ON credit_card_statements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log migration completion
DO $$
BEGIN
    RAISE NOTICE 'Credit cards tables created successfully with enhanced features';
END $$;