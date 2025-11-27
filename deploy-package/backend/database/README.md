# Database Setup Guide

## Prerequisites
- PostgreSQL 14 or higher
- Database user with CREATE DATABASE privileges

## Quick Setup

### 1. Create Database
```bash
createdb budget_app
```

Or using psql:
```sql
CREATE DATABASE budget_app;
```

### 2. Run Schema
```bash
psql -d budget_app -f schema.sql
```

### 3. Create Admin User (Optional)
```bash
cd ..
node scripts/create-admin.js
```

Default admin credentials:
- Email: `admin@budget.com`
- Password: `admin123`

### 4. Create Demo User (Optional)
```bash
node scripts/create-demo-user.js
```

Default demo credentials:
- Email: `demo@budget.com`
- Password: `demo123`

## Database Structure

### Core Tables
- **users** - User accounts and authentication
- **accounts** - Bank accounts with overdraft support
- **credit_cards** - Credit card management
- **transactions** - Income and expense tracking

### Payment Management
- **fixed_payments** - Recurring monthly payments
- **installment_payments** - Installment payment tracking
- **installment_payment_transactions** - Payment history for installments
- **land_payments** - Land/property payment tracking
- **land_payment_transactions** - Payment history for land purchases

### Budget & Notifications
- **budgets** - Monthly budget limits by category
- **notifications** - User notifications

## Features

### Accounts Table
- Multiple account types (checking, savings, cash, investment)
- Multi-currency support (default: TRY)
- Overdraft/credit line support with interest rates

### Installment Payments
- Track purchases paid in installments
- Automatic calculation of remaining amounts
- Payment history tracking
- Interest rate support
- Vendor information

### Land Payments
- Specialized tracking for land/property purchases
- Ada and Parsel number support
- Contract number tracking
- Installment progress monitoring

### Automatic Features
- Auto-updating timestamps (updated_at)
- Generated columns for calculated values
- Comprehensive indexes for performance
- Foreign key constraints for data integrity

## Environment Configuration

Create a `.env` file in the backend directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# AI Configuration (Optional)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-1.5-pro
```

## Migrations

If you need to update an existing database:

### Add Overdraft Support (if upgrading from older version)
```bash
psql -d budget_app -f add_overdraft_support.sql
```

### Add Installment Payments (if upgrading from older version)
```bash
psql -d budget_app -f installment_payments_schema.sql
```

## Backup & Restore

### Backup
```bash
pg_dump budget_app > backup.sql
```

### Restore
```bash
psql -d budget_app < backup.sql
```

## Troubleshooting

### Connection Issues
- Verify PostgreSQL is running: `pg_isready`
- Check connection settings in `.env`
- Ensure database exists: `psql -l | grep budget_app`

### Permission Issues
- Grant necessary privileges:
```sql
GRANT ALL PRIVILEGES ON DATABASE budget_app TO your_user;
```

### Reset Database
```bash
dropdb budget_app
createdb budget_app
psql -d budget_app -f schema.sql
```

## Security Notes

⚠️ **Important Security Reminders:**
1. Change default admin password after first login
2. Use strong JWT_SECRET in production
3. Never commit `.env` file to version control
4. Use SSL for database connections in production
5. Regularly backup your database

## Support

For issues or questions, please check:
- Main README.md in project root
- GitHub Issues
- Database logs: Check PostgreSQL logs for detailed error messages
