# How to Restore to Version 0.1

## 📋 Quick Restore Checklist

### 1. Database Restore
```bash
# Connect to PostgreSQL
psql -h localhost -U postgres -d budget_app

# Drop all tables (if needed)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Restore schema
\i backend/database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your environment
node database/migrate.js create
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 4. Admin User Creation
```bash
cd backend
node scripts/create-admin.js
```

**Admin Credentials:**
- Email: `admin@budgetapp.com`
- Password: `admin123`

## 🗂️ File Structure (v0.1)

### Backend Files
```
backend/
├── controllers/
│   ├── accountController.js
│   ├── adminController.js
│   ├── authController.js
│   ├── creditCardController.js
│   ├── fixedPaymentController.js
│   ├── installmentPaymentController.js
│   ├── landPaymentController.js
│   ├── reportController.js
│   └── transactionController.js
├── models/
│   ├── Account.js
│   ├── CreditCard.js
│   ├── FixedPayment.js
│   ├── InstallmentPayment.js
│   ├── LandPayment.js
│   ├── Transaction.js
│   └── User.js
├── routes/
│   ├── accounts.js
│   ├── admin.js
│   ├── auth.js
│   ├── creditCards.js
│   ├── fixedPayments.js
│   ├── installmentPayments.js
│   ├── landPayments.js
│   ├── reports.js
│   └── transactions.js
├── database/
│   ├── schema.sql
│   ├── migrate.js
│   └── seed.sql
└── server.js
```

### Frontend Files
```
frontend/src/
├── components/
│   ├── auth/
│   └── layout/
├── contexts/
│   ├── AuthContext.js
│   └── NotificationContext.js
├── pages/
│   ├── accounts/AccountsPage.js
│   ├── admin/AdminDashboard.js
│   ├── admin/UserManagement.js
│   ├── auth/LoginPage.js
│   ├── auth/RegisterPage.js
│   ├── creditCards/CreditCardsPage.js
│   ├── fixedPayments/FixedPaymentsPage.js
│   ├── installmentPayments/InstallmentPaymentsPage.js
│   ├── landPayments/LandPaymentsPage.js
│   ├── profile/ProfilePage.js
│   ├── reports/ReportsPage.js
│   ├── transactions/TransactionsPage.js
│   └── Dashboard.js
├── services/
│   └── api.js
└── App.js
```

## 🔧 Configuration Files

### Backend .env
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app
DB_USER=postgres
DB_PASSWORD=password123
JWT_SECRET=budget_app_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
PORT=5001
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

### Frontend package.json (key dependencies)
```json
{
  "dependencies": {
    "@mui/material": "^5.x.x",
    "@mui/icons-material": "^5.x.x",
    "react": "^18.x.x",
    "react-router-dom": "^6.x.x",
    "chart.js": "^4.x.x",
    "react-chartjs-2": "^5.x.x",
    "axios": "^1.x.x"
  }
}
```

## 🚀 Verification Steps

After restore, verify these work:
1. ✅ Login with admin credentials
2. ✅ Create a bank account
3. ✅ Add a credit card
4. ✅ Record some transactions
5. ✅ Add fixed payments
6. ✅ Add installment payments
7. ✅ View reports with charts
8. ✅ Export data to CSV

## 📊 Test Data (Optional)

You can add this test data to verify everything works:

```sql
-- Test account
INSERT INTO accounts (user_id, name, type, balance) VALUES (1, 'Test Account', 'checking', 50000);

-- Test transactions
INSERT INTO transactions (user_id, account_id, type, amount, description, category, transaction_date) VALUES 
(1, 1, 'income', 15000, 'Salary', 'Salary', CURRENT_DATE),
(1, 1, 'expense', 2500, 'Groceries', 'Food', CURRENT_DATE),
(1, 1, 'expense', 1200, 'Gas', 'Transportation', CURRENT_DATE);

-- Test fixed payment
INSERT INTO fixed_payments (user_id, name, amount, category, due_day) VALUES 
(1, 'Rent', 5000, 'Housing', 1);
```

---

**Version 0.1 Status**: ✅ STABLE - All features tested and working
**Restore Time**: ~10 minutes
**Last Updated**: 2025-10-27