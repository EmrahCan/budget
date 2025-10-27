# Budget Management App v0.1

A comprehensive personal finance management application built with React.js and Node.js.

## 🚀 Features

### 💰 Financial Management
- **Account Management** - Track multiple bank accounts
- **Credit Card Tracking** - Monitor balances, payments, and interest
- **Transaction Management** - Record income and expenses with categories
- **Fixed Payments** - Manage recurring monthly payments
- **Installment Tracking** - Track phone, car, education installments
- **Land Payments** - Real estate installment management

### 📊 Analytics & Reports
- **Interactive Charts** - Visual financial data with Chart.js
- **Category Analysis** - Spending breakdown by category
- **Monthly Trends** - Income/expense trends over time
- **Net Worth Tracking** - Asset vs debt analysis
- **Data Export** - CSV export for external analysis

### 👥 User Management
- **Authentication** - Secure JWT-based login system
- **Admin Panel** - User management and password reset
- **Profile Management** - User settings and preferences

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend
- **React.js** - UI framework
- **Material-UI** - Component library
- **Chart.js** - Data visualization
- **Axios** - HTTP client
- **React Router** - Navigation

## 📦 Installation

### Prerequisites
- Node.js (v16+)
- PostgreSQL (v12+)
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env  # Configure your database
node database/migrate.js create
node scripts/create-admin.js
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 🔧 Configuration

### Environment Variables (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
PORT=5001
FRONTEND_URL=http://localhost:3001
```

## 👤 Default Admin User
- **Email**: admin@budgetapp.com
- **Password**: admin123

## 🎯 Usage

1. **Register/Login** - Create account or use admin credentials
2. **Add Accounts** - Set up your bank accounts
3. **Record Transactions** - Track income and expenses
4. **Manage Credit Cards** - Monitor balances and payments
5. **Set Up Installments** - Track recurring payments
6. **View Reports** - Analyze your financial data

## 📱 Screenshots

### Dashboard
- Financial overview with summary cards
- Recent transactions and upcoming payments
- Quick action buttons

### Reports
- Interactive charts for income/expense trends
- Category breakdown with pie charts
- Net worth history tracking

### Management Pages
- Clean, intuitive interfaces for all financial data
- Easy-to-use forms with validation
- Responsive design for mobile devices

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection protection
- CORS configuration
- Rate limiting

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/profile` - Get user profile

### Accounts
- `GET /api/accounts` - List accounts
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `GET /api/transactions/summary/monthly` - Monthly summary

### Reports
- `GET /api/reports/financial-overview` - Financial summary
- `GET /api/reports/category-breakdown` - Category analysis
- `GET /api/reports/monthly-trends` - Monthly trends
- `GET /api/reports/export` - Export data to CSV

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

### Environment Setup
- Set NODE_ENV=production
- Configure production database
- Set secure JWT secret
- Enable HTTPS

## 📝 Version History

- **v0.1** (2025-10-27) - Initial stable release with all core features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the version history
- Use the restore guide if needed

---

**Status**: ✅ Production Ready (v0.1)
**Last Updated**: 2025-10-27