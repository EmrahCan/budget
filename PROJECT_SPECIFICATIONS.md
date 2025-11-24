# 📊 Budget App - Teknik Spesifikasyonlar

**Versiyon:** 2.0.0  
**Tarih:** 24 Kasım 2024  
**Durum:** ✅ Aktif - localhost:3003'te Çalışıyor

---

## 🎯 Genel Bakış

Budget App, kişisel finans yönetimi için geliştirilmiş full-stack bir web uygulamasıdır. AI destekli kategorizasyon, akıllı bildirimler ve kapsamlı raporlama özellikleri sunar.

### Temel Özellikler
- 💰 Gelir/Gider takibi
- 💳 Kredi kartı yönetimi
- 📊 Detaylı finansal raporlar
- 🤖 AI destekli kategorizasyon
- 🔔 Akıllı bildirim sistemi
- 📱 Responsive tasarım
- 🌍 Çoklu dil desteği (TR, EN, DE, ES, FR)
- 🎨 Dark/Light tema

---

## 🏗️ Mimari

### Genel Mimari
```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│                  localhost:3003                          │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         React Frontend (v18.2.0)                 │   │
│  │  - Material-UI Components                        │   │
│  │  - Context API (Auth, Theme, AI, Notifications) │   │
│  │  - React Router v6                               │   │
│  │  - i18next (Multi-language)                      │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/REST API
                          │ axios
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Backend API Server                          │
│                localhost:5001                            │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Node.js + Express (v4.18.2)              │   │
│  │  - JWT Authentication                            │   │
│  │  - Rate Limiting                                 │   │
│  │  - CORS Protection                               │   │
│  │  - Helmet Security                               │   │
│  │  - Winston Logging                               │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          │ pg (PostgreSQL Driver)
                          ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL Database                         │
│                localhost:5432                            │
│                                                           │
│  Database: budget_app                                    │
│  User: postgres                                          │
│  Tables: 17 tables                                       │
└─────────────────────────────────────────────────────────┘
                          │
                          │ External API
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Google Gemini AI                            │
│              gemini-2.5-flash                            │
│                                                           │
│  - Transaction Categorization                            │
│  - Financial Insights                                    │
│  - Natural Language Queries                              │
│  - Spending Analysis                                     │
└─────────────────────────────────────────────────────────┘
```

---

## 💻 Frontend Spesifikasyonları

### Teknoloji Stack

#### Core
- **React:** 18.2.0
- **React DOM:** 18.2.0
- **React Router:** 6.20.1
- **React Scripts:** 5.0.1

#### UI Framework
- **Material-UI Core:** 5.14.20
- **Material-UI Icons:** 5.14.19
- **Emotion (Styling):** 11.11.1
- **MUI Date Pickers:** 6.18.2

#### State Management & Forms
- **React Hook Form:** 7.48.2
- **Yup (Validation):** 1.3.3
- **@hookform/resolvers:** 3.3.2

#### Charts & Visualization
- **Chart.js:** 4.5.1
- **React-Chartjs-2:** 5.3.0
- **Recharts:** 3.3.0

#### Internationalization
- **i18next:** 25.6.2
- **react-i18next:** 16.3.3
- **i18next-browser-languagedetector:** 8.2.0

#### Utilities
- **Axios:** 1.6.2
- **date-fns:** 2.30.0
- **ExcelJS:** 4.4.0
- **jsPDF:** 3.0.3
- **html2canvas:** 1.4.1

#### Drag & Drop
- **react-dnd:** 16.0.1
- **react-dnd-html5-backend:** 16.0.1
- **react-dnd-touch-backend:** 16.0.1

### Klasör Yapısı
```
frontend/src/
├── components/          # Reusable components
│   ├── ai/             # AI-related components
│   ├── auth/           # Authentication components
│   ├── charts/         # Chart components
│   ├── common/         # Common UI components
│   ├── dashboard/      # Dashboard widgets
│   ├── fixedPayments/  # Fixed payment components
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── notifications/  # Notification components
│   ├── reports/        # Report components
│   └── transactions/   # Transaction components
├── contexts/           # React Context providers
│   ├── AIContext.js
│   ├── AuthContext.js
│   ├── NotificationContext.js
│   └── ThemeContext.js
├── hooks/              # Custom React hooks
├── i18n/               # Internationalization
│   ├── config.js
│   └── locales/        # Language files (tr, en, de, es, fr)
├── pages/              # Page components
│   ├── accounts/
│   ├── admin/
│   ├── auth/
│   ├── creditCards/
│   ├── fixedPayments/
│   ├── reports/
│   └── transactions/
├── services/           # API and utility services
└── utils/              # Utility functions
```

### Environment Variables
```bash
# Development (localhost:3003)
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
REACT_APP_ENABLE_DEVTOOLS=true
REACT_APP_LOG_LEVEL=debug
```


---

## 🔧 Backend Spesifikasyonları

### Teknoloji Stack

#### Core
- **Node.js:** v24.10.0
- **Express:** 4.18.2
- **NPM:** 11.6.0

#### Database
- **PostgreSQL:** 14.19 (Homebrew)
- **pg (Node Driver):** 8.11.3
- **pg-pool:** 3.6.1
- **mysql2:** 3.6.5 (alternative support)

#### Authentication & Security
- **jsonwebtoken:** 9.0.2
- **bcryptjs:** 2.4.3
- **helmet:** 7.1.0
- **cors:** 2.8.5
- **express-rate-limit:** 7.1.5
- **express-validator:** 7.0.1
- **joi:** 18.0.1

#### AI Integration
- **@google/generative-ai:** 0.24.1 (Gemini API)

#### Background Jobs & Scheduling
- **node-cron:** 3.0.3
- **bull:** 4.12.2
- **redis:** 4.6.10

#### Logging & Monitoring
- **winston:** 3.11.0

#### File Upload
- **multer:** 1.4.5-lts.1

#### Internationalization
- **i18n:** 0.15.3

#### Development
- **nodemon:** 3.0.2
- **jest:** 29.7.0
- **supertest:** 6.3.3

### API Endpoints

#### Authentication (`/api/auth`)
- `POST /register` - Kullanıcı kaydı
- `POST /login` - Kullanıcı girişi
- `POST /logout` - Çıkış
- `GET /me` - Mevcut kullanıcı bilgisi
- `PUT /profile` - Profil güncelleme

#### Accounts (`/api/accounts`)
- `GET /` - Tüm hesapları listele
- `POST /` - Yeni hesap oluştur
- `GET /:id` - Hesap detayı
- `PUT /:id` - Hesap güncelle
- `DELETE /:id` - Hesap sil

#### Transactions (`/api/transactions`)
- `GET /` - İşlemleri listele (pagination, filtering)
- `POST /` - Yeni işlem ekle
- `GET /:id` - İşlem detayı
- `PUT /:id` - İşlem güncelle
- `DELETE /:id` - İşlem sil
- `POST /bulk` - Toplu işlem ekleme

#### Credit Cards (`/api/credit-cards`)
- `GET /` - Kredi kartlarını listele
- `POST /` - Yeni kart ekle
- `GET /:id` - Kart detayı
- `PUT /:id` - Kart güncelle
- `DELETE /:id` - Kart sil
- `GET /:id/statements` - Kart ekstreleri

#### Fixed Payments (`/api/fixed-payments`)
- `GET /` - Sabit ödemeleri listele
- `POST /` - Yeni sabit ödeme ekle
- `GET /:id` - Sabit ödeme detayı
- `PUT /:id` - Sabit ödeme güncelle
- `DELETE /:id` - Sabit ödeme sil
- `GET /:id/history` - Ödeme geçmişi

#### Installment Payments (`/api/installment-payments`)
- `GET /` - Taksitli ödemeleri listele
- `POST /` - Yeni taksitli ödeme ekle
- `GET /:id` - Taksit detayı
- `PUT /:id` - Taksit güncelle
- `DELETE /:id` - Taksit sil

#### AI Features (`/api/ai`)
- `POST /categorize` - İşlem kategorizasyonu
- `POST /insights` - Finansal içgörüler
- `POST /recommendations` - Öneriler
- `POST /query` - Doğal dil sorguları
- `GET /preferences` - AI tercihleri
- `PUT /preferences` - AI tercihlerini güncelle

#### Notifications (`/api/notifications`)
- `GET /` - Bildirimleri listele
- `GET /unread-count` - Okunmamış bildirim sayısı
- `PUT /:id/read` - Bildirimi okundu işaretle
- `PUT /:id/dismiss` - Bildirimi kapat
- `DELETE /:id` - Bildirimi sil

#### Reports (`/api/reports`)
- `GET /summary` - Özet rapor
- `GET /income-expense` - Gelir-gider raporu
- `GET /category-breakdown` - Kategori bazlı analiz
- `GET /trends` - Trend analizi
- `GET /optimized/monthly` - Optimize edilmiş aylık rapor
- `GET /enhanced/comprehensive` - Kapsamlı rapor

#### Admin (`/api/admin`)
- `GET /users` - Kullanıcı listesi
- `GET /users/:id` - Kullanıcı detayı
- `PUT /users/:id` - Kullanıcı güncelle
- `DELETE /users/:id` - Kullanıcı sil
- `GET /stats` - Sistem istatistikleri

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app
DB_USER=postgres
DB_PASSWORD=postgres

# JWT Configuration
JWT_SECRET=budget_app_secret_key_2024_development
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5001
NODE_ENV=development

# AI Configuration (Google Gemini)
GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
GEMINI_MODEL=gemini-2.5-flash
AI_CATEGORIZATION_ENABLED=true
AI_INSIGHTS_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_NL_QUERIES_ENABLED=true
AI_RATE_LIMIT=60
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
AI_ENABLE_LOGGING=true

# AI Confidence Thresholds
AI_USE_MOCK_DATA=false
AI_CATEGORIZATION_MIN_CONFIDENCE=70
AI_INSIGHT_MIN_CONFIDENCE=60
AI_RECOMMENDATION_MIN_CONFIDENCE=75
```

### Security Features

#### Rate Limiting
- **Global:** 100 requests/minute per IP
- **Auth Routes:** 20 requests/minute per IP
- **Health Checks:** Unlimited

#### CORS Configuration
```javascript
Allowed Origins:
- http://localhost:3000
- http://localhost:3001
- http://localhost:3002
- http://localhost:3003
- http://localhost:3004
- Production domains
- Azure VM IPs
```

#### Security Headers (Helmet)
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection

#### Authentication
- JWT-based authentication
- Token expiration: 7 days
- Password hashing: bcrypt
- Secure HTTP-only cookies

### Background Jobs

#### Scheduled Tasks (node-cron)
- **Daily Notifications:** 6:00 AM
  - Upcoming payment reminders
  - Overdue payment alerts
  - Budget warnings
  - Spending insights

### Logging

#### Winston Logger
- **Levels:** error, warn, info, debug
- **Transports:**
  - Console (development)
  - File (production)
    - `logs/combined.log`
    - `logs/error.log`
    - `logs/performance.log`

---

## 💾 Database Spesifikasyonları

### PostgreSQL Configuration
- **Version:** 14.19
- **Host:** localhost
- **Port:** 5432
- **Database:** budget_app
- **User:** postgres
- **Connection Pool:** pg-pool

### Database Schema (17 Tables)

#### 1. users
```sql
- id (UUID, PRIMARY KEY)
- email (VARCHAR, UNIQUE)
- password (VARCHAR, hashed)
- name (VARCHAR)
- preferred_language (VARCHAR(10), DEFAULT 'tr')
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 2. accounts
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- name (VARCHAR)
- type (VARCHAR) -- checking, savings, cash
- balance (DECIMAL)
- currency (VARCHAR(3), DEFAULT 'TRY')
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 3. credit_cards
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- name (VARCHAR)
- bank_name (VARCHAR)
- last_four_digits (VARCHAR(4))
- credit_limit (DECIMAL)
- available_credit (DECIMAL)
- statement_day (INTEGER)
- payment_due_day (INTEGER)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 4. transactions
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- account_id (UUID, FOREIGN KEY)
- type (VARCHAR) -- income, expense
- category (VARCHAR)
- amount (DECIMAL)
- description (TEXT)
- date (DATE)
- receipt_image_id (UUID, FOREIGN KEY)
- created_at (TIMESTAMP)
```

#### 5. fixed_payments
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- name (VARCHAR)
- amount (DECIMAL)
- category (VARCHAR)
- frequency (VARCHAR) -- monthly, weekly, yearly
- payment_day (INTEGER)
- account_id (UUID, FOREIGN KEY)
- is_active (BOOLEAN)
- next_payment_date (DATE)
- created_at (TIMESTAMP)
```

#### 6. fixed_payment_history
```sql
- id (UUID, PRIMARY KEY)
- fixed_payment_id (UUID, FOREIGN KEY)
- payment_date (DATE)
- amount (DECIMAL)
- status (VARCHAR) -- paid, pending, failed
- transaction_id (UUID, FOREIGN KEY)
- created_at (TIMESTAMP)
```

#### 7. installment_payments
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- credit_card_id (UUID, FOREIGN KEY)
- name (VARCHAR)
- total_amount (DECIMAL)
- installment_count (INTEGER)
- installment_amount (DECIMAL)
- remaining_installments (INTEGER)
- start_date (DATE)
- category (VARCHAR)
- created_at (TIMESTAMP)
```

#### 8. credit_card_statements
```sql
- id (UUID, PRIMARY KEY)
- credit_card_id (UUID, FOREIGN KEY)
- statement_date (DATE)
- due_date (DATE)
- total_amount (DECIMAL)
- minimum_payment (DECIMAL)
- is_paid (BOOLEAN)
- created_at (TIMESTAMP)
```

#### 9. credit_card_transactions
```sql
- id (UUID, PRIMARY KEY)
- credit_card_id (UUID, FOREIGN KEY)
- statement_id (UUID, FOREIGN KEY)
- description (TEXT)
- amount (DECIMAL)
- category (VARCHAR)
- transaction_date (DATE)
- created_at (TIMESTAMP)
```

#### 10. smart_notifications
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- type (VARCHAR) -- payment_reminder, budget_alert, insight
- title (VARCHAR)
- message (TEXT)
- priority (VARCHAR) -- high, medium, low
- action_url (VARCHAR)
- metadata (JSONB)
- is_read (BOOLEAN)
- dismissed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### 11. ai_interactions
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- interaction_type (VARCHAR) -- categorization, insight, query
- input_data (JSONB)
- output_data (JSONB)
- confidence_score (DECIMAL)
- processing_time_ms (INTEGER)
- created_at (TIMESTAMP)
```

#### 12. ai_query_history
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- query_text (TEXT)
- query_type (VARCHAR)
- response (JSONB)
- confidence (DECIMAL)
- created_at (TIMESTAMP)
```

#### 13. category_learning
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- description_pattern (VARCHAR)
- learned_category (VARCHAR)
- confidence (DECIMAL)
- usage_count (INTEGER)
- last_used_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### 14. user_ai_preferences
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- auto_categorization (BOOLEAN)
- insight_frequency (VARCHAR)
- notification_preferences (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

#### 15. user_spending_profile
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- average_monthly_income (DECIMAL)
- average_monthly_expense (DECIMAL)
- top_categories (JSONB)
- spending_patterns (JSONB)
- last_analyzed_at (TIMESTAMP)
- created_at (TIMESTAMP)
```

#### 16. financial_coach_sessions
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- session_type (VARCHAR)
- questions (JSONB)
- recommendations (JSONB)
- created_at (TIMESTAMP)
```

#### 17. receipt_images
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, FOREIGN KEY)
- transaction_id (UUID, FOREIGN KEY)
- file_path (VARCHAR)
- file_size (INTEGER)
- mime_type (VARCHAR)
- created_at (TIMESTAMP)
```

### Database Indexes
```sql
-- Performance optimization indexes
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_fixed_payments_user ON fixed_payments(user_id);
CREATE INDEX idx_notifications_user_unread ON smart_notifications(user_id, is_read);
CREATE INDEX idx_ai_interactions_user ON ai_interactions(user_id, created_at DESC);
```

---

## 🤖 AI Features (Google Gemini Integration)

### Gemini API Configuration
- **Model:** gemini-2.5-flash
- **API Key:** Configured in environment
- **Rate Limit:** 60 requests/minute
- **Cache:** Enabled (TTL: 3600 seconds)

### AI Capabilities

#### 1. Transaction Categorization
- Automatic category suggestion
- Confidence scoring (min: 70%)
- Learning from user corrections
- Pattern recognition

#### 2. Financial Insights
- Spending pattern analysis
- Budget recommendations
- Anomaly detection
- Trend predictions

#### 3. Natural Language Queries
- "How much did I spend on food last month?"
- "Show my biggest expenses this year"
- "What's my average monthly income?"

#### 4. Financial Coach
- Personalized advice
- Budget optimization
- Savings recommendations
- Debt management strategies

### AI Data Flow
```
User Action → Backend API → Gemini API → Response Processing → Database Storage → Frontend Display
```

---

## 🔔 Notification System

### Notification Types

#### 1. Payment Reminders
- Upcoming fixed payments (3 days before)
- Credit card due dates
- Installment payments

#### 2. Budget Alerts
- Budget threshold warnings (80%, 100%)
- Overspending alerts
- Category budget exceeded

#### 3. Financial Insights
- Weekly spending summary
- Monthly financial report
- Unusual spending detected

#### 4. Overdue Alerts
- Missed payments
- Late payment warnings

### Notification Priority
- **High:** Overdue payments, budget exceeded
- **Medium:** Upcoming payments, insights
- **Low:** General tips, recommendations

### Delivery Channels
- In-app notifications (NotificationBell component)
- Dashboard widgets
- Email (future feature)

---

## 🌍 Internationalization (i18n)

### Supported Languages
1. **Turkish (tr)** - Default
2. **English (en)**
3. **German (de)**
4. **Spanish (es)**
5. **French (fr)**

### Translation Coverage
- UI Components: 100%
- Error Messages: 100%
- Notifications: 100%
- Reports: 100%

### Language Detection
- Browser language detection
- User preference storage
- Manual language switcher

---

## 📊 Reporting Features

### Report Types

#### 1. Summary Dashboard
- Total income/expense
- Account balances
- Credit card utilization
- Upcoming payments

#### 2. Income/Expense Report
- Monthly comparison
- Category breakdown
- Trend analysis
- Charts and graphs

#### 3. Category Analysis
- Spending by category
- Budget vs actual
- Category trends
- Top expenses

#### 4. Trend Analysis
- Historical data
- Predictive analytics
- Seasonal patterns
- Year-over-year comparison

#### 5. Export Options
- PDF export (jsPDF)
- Excel export (ExcelJS)
- CSV export
- Print-friendly format

---

## 🎨 UI/UX Features

### Theme System
- **Light Mode:** Default
- **Dark Mode:** Full support
- **Theme Toggle:** Persistent preference

### Responsive Design
- **Desktop:** Full features
- **Tablet:** Optimized layout
- **Mobile:** Touch-optimized

### Components Library
- Material-UI components
- Custom styled components
- Reusable widgets
- Interactive charts

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast mode

---

## 🔒 Security Features

### Authentication
- JWT-based auth
- Secure password hashing (bcrypt)
- Token expiration
- Refresh token support

### Authorization
- Role-based access control (RBAC)
- Admin panel access
- User-specific data isolation

### Data Protection
- SQL injection prevention (parameterized queries)
- XSS protection (Helmet)
- CSRF protection
- Input validation (Joi, Yup)

### API Security
- Rate limiting
- CORS configuration
- Request size limits
- Security headers

---

## 📈 Performance Optimization

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Caching strategies
- Memory management hooks

### Backend
- Database connection pooling
- Query optimization
- Response caching
- Compression middleware

### Database
- Indexed queries
- Optimized joins
- Pagination
- Query result caching

---

## 🧪 Testing

### Frontend Testing
- **Framework:** Jest + React Testing Library
- **Coverage:** Components, hooks, utilities
- **E2E:** Planned (Cypress)

### Backend Testing
- **Framework:** Jest + Supertest
- **Coverage:** API endpoints, services, models
- **Integration:** Database tests

---

## 📦 Deployment

### Development
- **Frontend:** localhost:3003
- **Backend:** localhost:5001
- **Database:** localhost:5432

### Production Options
1. **Azure Static Web Apps** (Recommended)
2. **Azure VM**
3. **Docker Containers**
4. **Traditional VPS**

---

## 🔄 Version History

### v2.0.0 (Current)
- AI feature expansion
- Smart notification system
- Multi-language support
- Enhanced reporting
- Performance optimizations

### v1.0.0
- Initial release
- Basic CRUD operations
- Authentication
- Simple reporting

---

## 📝 Development Commands

### Frontend
```bash
cd frontend
npm start          # Start development server (port 3003)
npm run build      # Production build
npm test           # Run tests
```

### Backend
```bash
cd backend
npm start          # Start server (port 5001)
npm run dev        # Start with nodemon
npm test           # Run tests
npm run db:create  # Create database
npm run db:seed    # Seed data
```

### Database
```bash
# Connect to database
psql -U postgres -d budget_app

# Run migrations
psql -U postgres -d budget_app -f backend/database/schema.sql

# Backup database
pg_dump -U postgres budget_app > backup.sql

# Restore database
psql -U postgres budget_app < backup.sql
```

---

## 🔗 External Dependencies

### APIs
- **Google Gemini AI:** AI-powered features
- **Future:** Email service, SMS notifications

### Services
- **PostgreSQL:** Primary database
- **Redis:** Caching (optional)
- **Bull:** Job queue (optional)

---

## 📚 Documentation

### Available Docs
1. `PROJECT_SPECIFICATIONS.md` - This file
2. `AZURE_STATIC_WEB_APP_DEPLOYMENT.md` - Azure deployment
3. `LOCAL_DEVELOPMENT_GUIDE.md` - Local setup
4. `API_DOCUMENTATION.md` - API reference (to be created)

---

## 🎯 Future Roadmap

### Planned Features
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Bank account integration
- [ ] Investment tracking
- [ ] Tax reporting
- [ ] Multi-currency support
- [ ] Family/shared accounts
- [ ] Receipt OCR
- [ ] Voice commands

### Technical Improvements
- [ ] GraphQL API
- [ ] WebSocket real-time updates
- [ ] Progressive Web App (PWA)
- [ ] Offline support
- [ ] Advanced caching
- [ ] Microservices architecture

---

## 👥 Team & Support

**Developer:** EmrahCan  
**Repository:** https://github.com/EmrahCan/budget  
**Azure DevOps:** https://dev.azure.com/EmrahC/Budget

---

## 📄 License

MIT License

---

**Son Güncelleme:** 24 Kasım 2024  
**Durum:** ✅ Aktif Geliştirme  
**Versiyon:** 2.0.0
