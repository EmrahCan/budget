# 🎯 Next Session Task: Dashboard Debt Display Enhancement

## 📋 Task Summary

**Goal:** Ana sayfadaki toplam borç gösteriminde, kredi kartı borcuna ek olarak kredili mevduat hesabı (overdraft account) borcunu da dahil et.

## 🔍 Current Situation

**Şu an:**
- Dashboard'da sadece **kredi kartı borçları** gösteriliyor
- Kredili mevduat hesapları (overdraft accounts) borç hesaplamasına dahil değil

**Olması gereken:**
- Dashboard'da **hem kredi kartı borçları** hem de **kredili mevduat hesabı borçları** gösterilmeli
- Toplam borç = Kredi Kartı Borçları + Kredili Mevduat Borçları

## 📊 Technical Details

### Account Types in Database

```sql
-- Account types
type = 'bank'        -- Normal banka hesabı
type = 'cash'        -- Nakit
type = 'overdraft'   -- Kredili mevduat hesabı (BUNU EKLE!)
type = 'credit_card' -- Kredi kartı (ŞU AN VAR)
```

### Overdraft Account Structure

```javascript
{
  id: "uuid",
  user_id: "uuid",
  name: "Hesap Adı",
  type: "overdraft",
  balance: -5000,           // Negatif = Borç
  overdraft_limit: 10000,   // Kredili mevduat limiti
  currency: "TRY"
}
```

**Borç Hesaplama:**
- Eğer `balance < 0` ise, bu borçtur
- Örnek: balance = -5000 → 5000 TL borç var

## 🎯 Implementation Steps

### 1. Backend Changes

**File:** `backend/controllers/accountController.js` veya dashboard controller

**Mevcut kod (muhtemelen):**
```javascript
// Sadece kredi kartı borçları
const creditCardDebt = await calculateCreditCardDebt(userId);
```

**Yeni kod olmalı:**
```javascript
// Hem kredi kartı hem overdraft borçları
const creditCardDebt = await calculateCreditCardDebt(userId);
const overdraftDebt = await calculateOverdraftDebt(userId);
const totalDebt = creditCardDebt + overdraftDebt;
```

**Yeni fonksiyon ekle:**
```javascript
async function calculateOverdraftDebt(userId) {
  const overdraftAccounts = await Account.findAll({
    where: {
      user_id: userId,
      type: 'overdraft',
      balance: { [Op.lt]: 0 }  // balance < 0
    }
  });
  
  return overdraftAccounts.reduce((total, account) => {
    return total + Math.abs(account.balance);
  }, 0);
}
```

### 2. Frontend Changes

**File:** `frontend/src/pages/Dashboard.js` veya dashboard component

**Mevcut görünüm:**
```
💳 Kredi Kartı Borcu: 15,000 TL
```

**Yeni görünüm seçenekleri:**

**Seçenek A - Ayrı göster:**
```
💳 Kredi Kartı Borcu: 15,000 TL
🏦 Kredili Mevduat Borcu: 5,000 TL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 Toplam Borç: 20,000 TL
```

**Seçenek B - Birleşik göster:**
```
💰 Toplam Borç: 20,000 TL
   (Kredi Kartı: 15,000 TL + Kredili Mevduat: 5,000 TL)
```

**Seçenek C - Detaylı kart:**
```
┌─────────────────────────────┐
│ 💰 Toplam Borçlar           │
├─────────────────────────────┤
│ 💳 Kredi Kartı    15,000 TL │
│ 🏦 Kredili Mevduat 5,000 TL │
├─────────────────────────────┤
│ TOPLAM           20,000 TL  │
└─────────────────────────────┘
```

### 3. API Response Update

**Endpoint:** `GET /api/dashboard/summary` veya benzeri

**Mevcut response:**
```json
{
  "creditCardDebt": 15000,
  "totalDebt": 15000
}
```

**Yeni response:**
```json
{
  "creditCardDebt": 15000,
  "overdraftDebt": 5000,
  "totalDebt": 20000,
  "debtBreakdown": {
    "creditCards": 15000,
    "overdraftAccounts": 5000
  }
}
```

## 📁 Files to Modify

### Backend
1. `backend/controllers/accountController.js` - Overdraft debt calculation
2. `backend/controllers/dashboardController.js` - Dashboard summary endpoint
3. `backend/models/Account.js` - Helper methods (if needed)

### Frontend
1. `frontend/src/pages/Dashboard.js` - Main dashboard
2. `frontend/src/components/dashboard/DebtSummary.js` - Debt display component (if exists)
3. `frontend/src/components/dashboard/FinancialMetricsWidget.js` - Metrics widget

## 🧪 Testing Checklist

- [ ] Kredili mevduat hesabı olmayan kullanıcı için test
- [ ] Kredili mevduat hesabı olan ama borcu olmayan kullanıcı için test (balance >= 0)
- [ ] Kredili mevduat hesabı borcu olan kullanıcı için test (balance < 0)
- [ ] Hem kredi kartı hem kredili mevduat borcu olan kullanıcı için test
- [ ] Çoklu kredili mevduat hesabı olan kullanıcı için test
- [ ] Currency conversion (farklı para birimleri varsa)

## 📝 Example Test Data

```sql
-- Test için kredili mevduat hesabı oluştur
INSERT INTO accounts (id, user_id, name, type, balance, overdraft_limit, currency)
VALUES (
  gen_random_uuid(),
  'YOUR_USER_ID',
  'Garanti Kredili Mevduat',
  'overdraft',
  -5000.00,  -- 5000 TL borç
  10000.00,  -- 10000 TL limit
  'TRY'
);
```

## 🎨 UI/UX Considerations

1. **Icon:** Kredili mevduat için uygun icon seç (🏦 veya 💼)
2. **Color:** Borç gösterimi için kırmızı/turuncu renk kullan
3. **Tooltip:** Kullanıcıya "Kredili mevduat nedir?" açıklaması ekle
4. **Responsive:** Mobil görünümde de düzgün görünsün

## 🔗 Related Files

- `backend/models/Account.js` - Account model
- `frontend/src/utils/formatters.js` - Currency formatting
- `frontend/src/i18n/locales/tr.json` - Turkish translations
- `frontend/src/i18n/locales/en.json` - English translations

## 💡 Additional Enhancements (Optional)

1. **Grafik:** Borç dağılımını pie chart ile göster
2. **Trend:** Borç artış/azalış trendi göster
3. **Alert:** Kredili mevduat limitine yaklaşınca uyarı ver
4. **Comparison:** Geçen aya göre borç karşılaştırması

## 🚀 Quick Start Commands

```bash
# Backend'i başlat
cd backend
npm run dev

# Frontend'i başlat (yeni terminal)
cd frontend
npm start

# Database'i kontrol et
psql -h localhost -p 5432 -U postgres -d budget_app
SELECT * FROM accounts WHERE type = 'overdraft';
```

## 📞 Questions to Ask in New Session

1. Hangi UI seçeneğini tercih ediyorsunuz? (A, B, veya C)
2. Kredili mevduat hesapları için özel bir renk/icon kullanmak ister misiniz?
3. Detaylı breakdown gösterilsin mi yoksa sadece toplam mı?
4. Mobil görünümde nasıl görünsün?

---

**Priority:** High  
**Estimated Time:** 2-3 hours  
**Difficulty:** Medium  
**Impact:** High (Better financial overview for users)

---

**Note:** Bu task için production database'i local'e sync ettik. Test için `emrahcan@hotmail.com` (password: `Test123!`) kullanabilirsiniz.
