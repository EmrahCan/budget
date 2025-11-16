#!/bin/bash

echo "🚀 Deploying Payment History API to Production..."

# Copy necessary files to production
echo "📦 Copying files..."
docker cp backend/routes/fixedPayments.js budget_backend_prod:/app/routes/fixedPayments.js
docker cp backend/controllers/fixedPaymentController.js budget_backend_prod:/app/controllers/fixedPaymentController.js
docker cp backend/models/FixedPaymentHistory.js budget_backend_prod:/app/models/FixedPaymentHistory.js

# Run database migration
echo "🗄️  Running database migration..."
docker exec budget_database_prod psql -U postgres -d budget_app_prod << 'EOF'
-- Create fixed_payment_history table if not exists
CREATE TABLE IF NOT EXISTS fixed_payment_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fixed_payment_id UUID NOT NULL REFERENCES fixed_payments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(fixed_payment_id, payment_date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fph_fixed_payment_id ON fixed_payment_history(fixed_payment_id);
CREATE INDEX IF NOT EXISTS idx_fph_user_id ON fixed_payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_fph_payment_date ON fixed_payment_history(payment_date);
CREATE INDEX IF NOT EXISTS idx_fph_is_paid ON fixed_payment_history(is_paid);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_fixed_payment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_fph_updated_at ON fixed_payment_history;
CREATE TRIGGER update_fph_updated_at
    BEFORE UPDATE ON fixed_payment_history
    FOR EACH ROW
    EXECUTE FUNCTION update_fixed_payment_history_updated_at();

SELECT 'Migration completed successfully' as status;
EOF

# Restart backend
echo "🔄 Restarting backend..."
docker restart budget_backend_prod

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 8

# Check logs
echo "📋 Backend logs:"
docker logs --tail=20 budget_backend_prod

# Test endpoints
echo -e "\n🧪 Testing endpoints..."
echo "1. Testing mark-paid endpoint:"
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:5001/api/fixed-payments

echo -e "\n✅ Deployment complete!"
echo "📝 New endpoints available:"
echo "   POST /api/fixed-payments/:id/mark-paid"
echo "   POST /api/fixed-payments/:id/mark-unpaid"
echo "   GET  /api/fixed-payments/history/monthly-status"
