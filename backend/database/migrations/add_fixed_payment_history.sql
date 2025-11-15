-- Migration: Add fixed_payment_history table for tracking monthly payment status
-- Created: 2024-01-16
-- Description: This table tracks whether fixed payments have been paid each month

-- Create fixed_payment_history table
CREATE TABLE IF NOT EXISTS fixed_payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fixed_payment_id INTEGER NOT NULL REFERENCES fixed_payments(id) ON DELETE CASCADE,
    payment_month INTEGER NOT NULL CHECK (payment_month >= 1 AND payment_month <= 12),
    payment_year INTEGER NOT NULL CHECK (payment_year >= 2020),
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE,
    paid_amount DECIMAL(12,2),
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_payment_month_year UNIQUE(fixed_payment_id, payment_month, payment_year)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_user_id ON fixed_payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_fixed_payment_id ON fixed_payment_history(fixed_payment_id);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_month_year ON fixed_payment_history(payment_month, payment_year);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_is_paid ON fixed_payment_history(is_paid);
CREATE INDEX IF NOT EXISTS idx_fixed_payment_history_paid_date ON fixed_payment_history(paid_date);

-- Create trigger for updated_at
CREATE TRIGGER update_fixed_payment_history_updated_at 
    BEFORE UPDATE ON fixed_payment_history
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE fixed_payment_history IS 'Tracks monthly payment status for fixed payments';
COMMENT ON COLUMN fixed_payment_history.payment_month IS 'Month of the payment (1-12)';
COMMENT ON COLUMN fixed_payment_history.payment_year IS 'Year of the payment';
COMMENT ON COLUMN fixed_payment_history.is_paid IS 'Whether the payment has been made';
COMMENT ON COLUMN fixed_payment_history.paid_date IS 'Date when the payment was made';
COMMENT ON COLUMN fixed_payment_history.paid_amount IS 'Actual amount paid (may differ from fixed amount)';
COMMENT ON COLUMN fixed_payment_history.transaction_id IS 'Reference to the transaction record';
