-- Installment payments table (Taksitli ödemeler)
CREATE TABLE IF NOT EXISTS installment_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
    paid_amount DECIMAL(12,2) DEFAULT 0.00 CHECK (paid_amount >= 0),
    remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    installment_amount DECIMAL(12,2) NOT NULL CHECK (installment_amount > 0),
    total_installments INTEGER NOT NULL CHECK (total_installments > 0),
    paid_installments INTEGER DEFAULT 0 CHECK (paid_installments >= 0),
    remaining_installments INTEGER GENERATED ALWAYS AS (total_installments - paid_installments) STORED,
    interest_rate DECIMAL(5,2) DEFAULT 0.00 CHECK (interest_rate >= 0),
    start_date DATE NOT NULL,
    next_payment_date DATE,
    vendor VARCHAR(200),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Installment payment transactions table (Taksit ödeme geçmişi)
CREATE TABLE IF NOT EXISTS installment_payment_transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    installment_payment_id INTEGER REFERENCES installment_payments(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    installment_number INTEGER NOT NULL,
    description TEXT,
    receipt_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_installment_payments_user_id ON installment_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_payments_next_payment ON installment_payments(next_payment_date);
CREATE INDEX IF NOT EXISTS idx_installment_payments_category ON installment_payments(category);
CREATE INDEX IF NOT EXISTS idx_installment_payment_transactions_user_id ON installment_payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_installment_payment_transactions_installment_id ON installment_payment_transactions(installment_payment_id);

-- Create trigger for updated_at
CREATE TRIGGER update_installment_payments_updated_at BEFORE UPDATE ON installment_payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installment_payment_transactions_updated_at BEFORE UPDATE ON installment_payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
