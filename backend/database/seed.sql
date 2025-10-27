-- Sample data for Budget Management App

-- Insert sample categories for transactions
INSERT INTO transactions (user_id, account_id, type, amount, description, category, transaction_date) VALUES
-- This will be populated after users are created
-- Sample categories: 'Yiyecek', 'Ulaşım', 'Eğlence', 'Faturalar', 'Alışveriş', 'Sağlık', 'Eğitim', 'Maaş', 'Freelance'
(1, 1, 'expense', 150.00, 'Market alışverişi', 'Yiyecek', CURRENT_DATE - INTERVAL '5 days'),
(1, 1, 'expense', 50.00, 'Otobüs kartı', 'Ulaşım', CURRENT_DATE - INTERVAL '3 days'),
(1, 1, 'income', 5000.00, 'Aylık maaş', 'Maaş', CURRENT_DATE - INTERVAL '10 days'),
(1, 1, 'expense', 200.00, 'Elektrik faturası', 'Faturalar', CURRENT_DATE - INTERVAL '7 days');

-- Sample fixed payments
INSERT INTO fixed_payments (user_id, name, amount, category, due_day) VALUES
(1, 'Kira', 2000.00, 'Konut', 1),
(1, 'İnternet', 100.00, 'Faturalar', 15),
(1, 'Telefon', 80.00, 'Faturalar', 20),
(1, 'Spor Salonu', 150.00, 'Sağlık', 5);

-- Sample budget limits
INSERT INTO budgets (user_id, category, monthly_limit, month, year) VALUES
(1, 'Yiyecek', 800.00, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
(1, 'Ulaşım', 200.00, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
(1, 'Eğlence', 300.00, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER),
(1, 'Alışveriş', 500.00, EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

-- Note: User, account, and credit card data will be created through the application
-- This seed file contains only reference data and sample transactions