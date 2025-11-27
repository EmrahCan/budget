# AI Özellikleri Local Test Kılavuzu

Bu kılavuz, yeni eklenen AI özelliklerini local ortamda nasıl test edeceğinizi adım adım açıklar.

---

## 📋 Ön Hazırlık

### 1. Database Migration'ı Çalıştır

```bash
cd backend

# PostgreSQL'e bağlan
psql -U postgres -d budget_db

# Migration'ı çalıştır
\i database/migrations/add_ai_tables.sql

# Tabloların oluşturulduğunu kontrol et
\dt

# Çıkış
\q
```

**Kontrol:** 8 yeni tablo görmelisiniz:
- `ai_interactions`
- `user_ai_preferences`
- `category_learning`
- `user_spending_profile`
- `receipt_images`
- `smart_notifications`
- `ai_query_history`
- `financial_coach_sessions`

### 2. Environment Variables Ayarla

`backend/.env` dosyasına ekle:

```env
# AI Features
AI_CATEGORIZATION_ENABLED=true
AI_NL_ENABLED=true
AI_PREDICTIONS_ENABLED=true
AI_OCR_ENABLED=false
AI_VOICE_ENABLED=false
AI_ANOMALY_ENABLED=true
AI_NOTIFICATIONS_ENABLED=true
AI_COACH_ENABLED=true

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
```

**Gemini API Key Alma:**
1. https://makersuite.google.com/app/apikey adresine git
2. "Create API Key" tıkla
3. Key'i kopyala ve .env'e yapıştır

### 3. Backend'i Başlat

```bash
cd backend
npm install  # Eğer yeni dependencies varsa
npm start
```

**Kontrol:** Terminal'de şunları görmelisiniz:
```
Server running on port 5002
AI Orchestrator initialized
AI features enabled: categorization, natural_language, predictions, anomaly, notifications, coach
```

### 4. Frontend'i Başlat

```bash
cd frontend
npm install  # Eğer yeni dependencies varsa
npm start
```

**Kontrol:** Browser'da `http://localhost:3000` açılmalı

---

## 🧪 Test Senaryoları

### Test 1: Akıllı Kategorilendirme ✅

**Adımlar:**
1. Login ol
2. "İşlemler" sayfasına git
3. "Yeni İşlem" butonuna tıkla
4. Açıklama gir: "Migros market alışverişi"
5. Tutar gir: 150
6. Bekle (800ms debounce)

**Beklenen Sonuç:**
- AI öneri alert'i görünmeli
- Kategori: "Yiyecek ve İçecek" önerilmeli
- Güven skoru gösterilmeli (%70+)
- "Kabul Et" ve "Reddet" butonları olmalı

**Test Varyasyonları:**
```
"Starbucks kahve" → Yiyecek ve İçecek
"Shell benzin" → Ulaşım
"Zara alışveriş" → Giyim
"Elektrik faturası" → Faturalar
```

**Debug:**
```bash
# Backend logs kontrol et
# Terminal'de AI categorization isteklerini göreceksin

# Browser console'da:
# Network tab → XHR → /api/ai/categorize
```

---

### Test 2: Doğal Dil Arama ✅

**Adımlar:**
1. Dashboard'a git
2. Arama kutusunu bul (üstte)
3. Türkçe sor: "Geçen ay market harcamalarım ne kadar?"
4. Enter'a bas

**Beklenen Sonuç:**
- Sorgu işlenmeli
- Sonuçlar gösterilmeli
- Grafik önerileri olmalı

**Test Soruları:**
```
"Bu ay toplam harcamam ne kadar?"
"En çok hangi kategoride harcama yaptım?"
"Geçen ay gelir gider farkım neydi?"
"Son 3 ayda ulaşım harcamalarım"
```

**Debug:**
```bash
# Backend logs:
# "Processing natural language query" mesajını ara

# Browser console:
# Network → /api/ai/query
```

---

### Test 3: Bütçe Performansı ✅

**Ön Koşul:** En az 1 bütçe tanımlı olmalı

**Adımlar:**
1. "Bütçeler" sayfasına git
2. Bütçe tanımla (örn: Yiyecek ve İçecek - 1000 TL)
3. Bu kategoride işlemler ekle
4. Dashboard'a dön
5. "Bütçe Performansı" widget'ını bul

**Beklenen Sonuç:**
- Performans skoru (0-100) gösterilmeli
- Kategori bazında kullanım oranları
- Progress bar'lar
- İyileştirme önerileri

**Test Senaryoları:**
- Bütçe içinde: %50 kullanım → Yeşil
- Bütçe sınırında: %85 kullanım → Sarı
- Bütçe aşımı: %110 kullanım → Kırmızı

**Debug:**
```bash
# API test:
curl -X GET http://localhost:5002/api/ai/budget/performance \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Test 4: Anormallik Tespiti ✅

**Ön Koşul:** Bir kategoride en az 10 işlem olmalı

**Adımlar:**
1. Normal işlemler ekle (örn: 10 adet market alışverişi, 50-150 TL arası)
2. Profil oluşmasını bekle
3. Olağandışı işlem ekle: "Migros" - 1000 TL
4. Kaydet'e tıkla

**Beklenen Sonuç:**
- Anomaly Alert dialog açılmalı
- Risk seviyesi gösterilmeli (Yüksek/Orta/Düşük)
- Açıklama: "Bu işlem tutarı ortalamadan %X daha yüksek"
- "Normal" ve "Şüpheli" butonları

**Manuel Profil Oluşturma:**
```bash
# Backend'de:
cd backend
node -e "
const service = require('./services/anomalyDetectionService');
service.rebuildUserProfile('YOUR_USER_ID').then(console.log);
"
```

**Debug:**
```bash
# Database kontrol:
psql -U postgres -d budget_db -c "
SELECT * FROM user_spending_profile WHERE user_id = 'YOUR_USER_ID';
"
```

---

### Test 5: Kategori Trend Analizi ✅

**Ön Koşul:** Farklı kategorilerde işlemler olmalı

**Adımlar:**
1. "Raporlar" sayfasına git
2. "Trend Analizi" sekmesine tıkla
3. Kategorileri seç (multi-select)
4. Grafikleri incele

**Beklenen Sonuç:**
- Top 5 artan kategoriler (kırmızı)
- Top 5 azalan kategoriler (yeşil)
- Line chart (seçili kategoriler)
- Karşılaştırma tablosu

**Test Data Oluşturma:**
```sql
-- Trend görmek için farklı aylarda işlemler ekle
INSERT INTO transactions (user_id, type, category, amount, transaction_date)
VALUES 
  ('YOUR_USER_ID', 'expense', 'Yiyecek ve İçecek', 500, '2024-01-15'),
  ('YOUR_USER_ID', 'expense', 'Yiyecek ve İçecek', 600, '2024-02-15'),
  ('YOUR_USER_ID', 'expense', 'Yiyecek ve İçecek', 700, '2024-03-15');
```

---

### Test 6: AI Finansal Koç ✅

**Adımlar:**
1. Dashboard'da "AI Finansal Koç" widget'ını bul (veya yeni sayfa oluştur)
2. Soru sor: "Nasıl daha fazla tasarruf edebilirim?"
3. Yanıt bekle

**Beklenen Sonuç:**
- AI yanıt vermeli
- Öneriler listesi
- Takip soruları (clickable)
- Mesaj geçmişi

**Test Soruları:**
```
"Bütçemi nasıl iyileştirebilirim?"
"Acil durum fonu ne kadar olmalı?"
"Harcamalarımı nasıl azaltabilirim?"
"Borçlarımı nasıl ödeyebilirim?"
```

**Hızlı Test:**
```bash
# API test:
curl -X POST http://localhost:5002/api/ai/coach/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "Nasıl tasarruf edebilirim?"}'
```

---

## 🔍 API Test'leri (Postman/cURL)

### Health Check
```bash
curl http://localhost:5002/api/ai/health
```

### Kategorilendirme
```bash
curl -X POST http://localhost:5002/api/ai/categorize \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Migros market",
    "amount": 150
  }'
```

### Doğal Dil Sorgu
```bash
curl -X POST http://localhost:5002/api/ai/query \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Bu ay toplam harcamam ne kadar?",
    "language": "tr"
  }'
```

### Tahmin
```bash
curl http://localhost:5002/api/ai/predictions/3 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Anomali Kontrolü
```bash
curl -X POST http://localhost:5002/api/ai/anomaly/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "category": "Yiyecek ve İçecek",
    "description": "Market"
  }'
```

---

## 🐛 Troubleshooting

### Problem: AI yanıt vermiyor

**Çözüm:**
```bash
# 1. Gemini API key kontrol
echo $GEMINI_API_KEY

# 2. Backend logs kontrol
# Terminal'de error mesajları ara

# 3. Rate limit kontrol
curl http://localhost:5002/api/ai/rate-limit \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Feature flags kontrol
curl http://localhost:5002/api/ai/health
```

### Problem: Kategorilendirme çalışmıyor

**Çözüm:**
```bash
# 1. AI_CATEGORIZATION_ENABLED kontrol
grep AI_CATEGORIZATION backend/.env

# 2. Cache temizle
curl -X DELETE http://localhost:5002/api/ai/cache \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Learning data kontrol
curl http://localhost:5002/api/ai/categorize/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Problem: Anomali tespiti çalışmıyor

**Çözüm:**
```bash
# 1. Profil var mı kontrol
psql -U postgres -d budget_db -c "
SELECT * FROM user_spending_profile;
"

# 2. Profil oluştur
curl -X POST http://localhost:5002/api/ai/anomaly/rebuild-profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# 3. Minimum 10 işlem olduğunu kontrol et
```

### Problem: Database migration hatası

**Çözüm:**
```bash
# 1. Rollback yap
psql -U postgres -d budget_db -f backend/database/migrations/rollback_ai_tables.sql

# 2. Tekrar çalıştır
psql -U postgres -d budget_db -f backend/database/migrations/add_ai_tables.sql

# 3. Tabloları kontrol et
psql -U postgres -d budget_db -c "\dt"
```

---

## 📊 Test Data Oluşturma

### Hızlı Test Data Script

```sql
-- Test user için işlemler oluştur
INSERT INTO transactions (user_id, type, category, amount, description, transaction_date)
VALUES 
  -- Market alışverişleri (normal)
  ('YOUR_USER_ID', 'expense', 'Yiyecek ve İçecek', 120, 'Migros', CURRENT_DATE - INTERVAL '1 day'),
  ('YOUR_USER_ID', 'expense', 'Yiyecek ve İçecek', 85, 'Carrefour', CURRENT_DATE - INTERVAL '3 days'),
  ('YOUR_USER_ID', 'expense', 'Yiyecek ve İçecek', 150, 'A101', CURRENT_DATE - INTERVAL '5 days'),
  
  -- Ulaşım
  ('YOUR_USER_ID', 'expense', 'Ulaşım', 300, 'Shell benzin', CURRENT_DATE - INTERVAL '2 days'),
  ('YOUR_USER_ID', 'expense', 'Ulaşım', 50, 'İstanbulkart', CURRENT_DATE - INTERVAL '4 days'),
  
  -- Faturalar
  ('YOUR_USER_ID', 'expense', 'Faturalar', 200, 'Elektrik faturası', CURRENT_DATE - INTERVAL '10 days'),
  ('YOUR_USER_ID', 'expense', 'Faturalar', 150, 'Su faturası', CURRENT_DATE - INTERVAL '12 days'),
  
  -- Gelir
  ('YOUR_USER_ID', 'income', 'Maaş', 10000, 'Aylık maaş', CURRENT_DATE - INTERVAL '15 days');

-- Bütçe oluştur
INSERT INTO budgets (user_id, category, amount, period, is_active)
VALUES 
  ('YOUR_USER_ID', 'Yiyecek ve İçecek', 1000, 'monthly', true),
  ('YOUR_USER_ID', 'Ulaşım', 500, 'monthly', true),
  ('YOUR_USER_ID', 'Faturalar', 400, 'monthly', true);
```

---

## ✅ Test Checklist

### Temel Testler
- [ ] Database migration başarılı
- [ ] Backend başlatıldı (port 5002)
- [ ] Frontend başlatıldı (port 3000)
- [ ] Gemini API key çalışıyor
- [ ] Health check OK

### AI Özellikleri
- [ ] Akıllı kategorilendirme çalışıyor
- [ ] Doğal dil arama çalışıyor
- [ ] Bütçe performansı gösteriliyor
- [ ] Anomali tespiti çalışıyor
- [ ] Trend analizi gösteriliyor
- [ ] Finansal koç yanıt veriyor

### UI/UX
- [ ] Loading states gösteriliyor
- [ ] Error messages gösteriliyor
- [ ] Success feedback var
- [ ] Responsive design çalışıyor
- [ ] AI disclaimers gösteriliyor

---

## 🚀 Production'a Hazırlık

Test'ler başarılı olduktan sonra:

1. **Environment Variables:** Production .env'i hazırla
2. **Database:** Production'da migration çalıştır
3. **Gemini API:** Production API key al
4. **Monitoring:** Log'ları izle
5. **Backup:** Database backup al
6. **Deploy:** Production'a deploy et

---

**Test Süresi:** ~30-45 dakika
**Zorluk:** Orta
**Gereksinimler:** PostgreSQL, Node.js, Gemini API Key

