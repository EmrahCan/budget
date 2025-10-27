# Bütçe Yönetimi Uygulaması - Tasarım Belgesi

## Genel Bakış

Bu web uygulaması, kullanıcıların kişisel finanslarını kapsamlı şekilde yönetmelerine olanak sağlayan modern bir platform olacak. React.js frontend, Node.js/Express backend ve PostgreSQL veritabanı kullanarak geliştirilecek.

## Mimari

### Teknoloji Yığını

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL
- JWT (kimlik doğrulama)
- bcrypt (şifre hashleme)

**Frontend:**
- React.js 18+
- Material-UI
- Chart.js
- Axios
- React Router

## Veri Modelleri

### Kullanıcı Modeli
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Hesap Modeli
```sql
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'TRY',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Kredi Kartı Modeli
```sql
CREATE TABLE credit_cards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    bank_name VARCHAR(100),
    credit_limit DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2) DEFAULT 0.00,
    interest_rate DECIMAL(5,2) NOT NULL,
    minimum_payment_rate DECIMAL(5,2) DEFAULT 5.00,
    payment_due_date INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### İşlem Modeli
```sql
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    account_id INTEGER REFERENCES accounts(id),
    credit_card_id INTEGER REFERENCES credit_cards(id),
    type VARCHAR(20) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Sabit Ödeme Modeli
```sql
CREATE TABLE fixed_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    category VARCHAR(100),
    due_day INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Bütçe Modeli
```sql
CREATE TABLE budgets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    monthly_limit DECIMAL(12,2) NOT NULL,
    current_spent DECIMAL(12,2) DEFAULT 0.00,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```