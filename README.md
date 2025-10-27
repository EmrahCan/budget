# 💰 Budget Management App

A comprehensive budget management application with Turkish banking system integration, built with React.js and Node.js.

## 🏦 Version 0.2 - Turkish Banking System

### ✨ Key Features

- **Turkish Bank Integration** - Support for 25+ major Turkish banks
- **Smart Account Management** - IBAN support, bank selection, account tracking
- **Credit Card Management** - Full credit card lifecycle with payment tracking
- **Transaction System** - Income/expense tracking with categories
- **Payment Systems** - Fixed, installment, and land payment tracking
- **Financial Reports** - Interactive charts and analytics
- **Admin Panel** - User management and system administration

### 🏦 Supported Banks

**Public Banks**: Ziraat Bankası, Halkbank, VakıfBank
**Private Banks**: Akbank, Garanti BBVA, İş Bankası, Yapı Kredi, QNB Finansbank, DenizBank, TEB, Şekerbank, ODEA Bank, Fibabanka, Alternatifbank, Anadolubank
**Participation Banks**: Albaraka Türk, Kuveyt Türk, Türkiye Finans, Ziraat Katılım, Vakıf Katılım, Emlak Katılım
**Foreign Banks**: HSBC, ING Bank, Citibank
**Digital Banks**: Papara, İninal, Tosla

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/EmrahCan/budget.git
   cd budget
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   
   # Create .env file
   cp .env.example .env
   # Edit .env with your database credentials
   
   # Setup database
   npm run migrate
   npm run seed
   
   # Start backend server
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   
   # Start frontend development server
   npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

### Default Admin Account
- Email: admin@budgetapp.com
- Password: admin123

## 🔧 Tech Stack

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

## 📊 Features Overview

### 💳 Account Management
- Link accounts to Turkish banks
- IBAN support with validation
- Account number storage
- Balance tracking
- Transaction history

### 🏦 Credit Card System
- Bank-specific credit cards
- Credit limit and utilization tracking
- Payment due date management
- Interest calculation
- Payment history

### 💸 Transaction Management
- Income and expense tracking
- Category-based organization
- Date range filtering
- Search and sort functionality

### 📅 Payment Systems
- **Fixed Payments**: Monthly recurring payments (rent, utilities)
- **Installment Payments**: General installment tracking (phone, car, education)
- **Land Payments**: Real estate installment management

### 📈 Reports & Analytics
- Financial overview dashboard
- Interactive charts and graphs
- Monthly/yearly summaries
- Category-wise analysis
- Export functionality (CSV)

### 👥 Admin Panel
- User management
- Password reset functionality
- System monitoring
- Data management

## 🎨 UI Features

- **Responsive Design** - Works on all screen sizes
- **Bank Color Coding** - Each bank has its distinctive colors
- **Visual Avatars** - Bank letter avatars with brand colors
- **Intuitive Navigation** - Easy-to-use sidebar navigation
- **Real-time Updates** - Live data synchronization

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection protection
- CORS configuration
- Rate limiting

## 📱 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Bug Reports

If you find a bug, please create an issue on GitHub with:
- Bug description
- Steps to reproduce
- Expected behavior
- Screenshots (if applicable)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: emrah@example.com

## 🎯 Roadmap

### Version 0.3 (Planned)
- Dark mode support
- Enhanced animations
- Mobile app (React Native)
- Advanced reporting
- Budget alerts
- Expense categorization AI
- Bank statement import/export
- Multi-currency support

---

**Made with ❤️ in Turkey**

*This application is designed specifically for the Turkish banking system and Turkish users.*