# Budget App - Local Kurulum Bilgileri

## ✅ Kurulum Tamamlandı!

Proje başarıyla klonlandı ve local ortamda çalışmaya hazır hale getirildi.

## 🚀 Çalışan Servisler

### Backend (Node.js + Express)
- **URL**: http://localhost:5001
- **API Base**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/health
- **Durum**: ✅ Çalışıyor
- **Konum**: `budget/backend`

### Frontend (React)
- **URL**: http://localhost:3002
- **Durum**: ✅ Çalışıyor
- **Konum**: `budget/frontend`

### Veritabanı (PostgreSQL)
- **Host**: localhost
- **Port**: 5432
- **Database**: budget_app
- **User**: postgres
- **Durum**: ✅ Çalışıyor ve bağlantı başarılı

## 📊 Veritabanı Durumu

Tüm tablolar oluşturulmuş ve veri içeriyor:

| Tablo | Kayıt Sayısı |
|-------|--------------|
| users | 4 |
| accounts | 12 |
| credit_cards | 13 |
| transactions | 4 |
| fixed_payments | 21 |
| installment_payments | 5 |
| budgets | 0 |
| notifications | 0 |

## 🔧 Konfigürasyon Dosyaları

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=budget_app
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=budget_app_secret_key_2024_development
PORT=5001
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5001/api
PORT=3002
REACT_APP_ENVIRONMENT=development
```

## 📝 Kullanım Komutları

### Backend'i Başlatma
```bash
cd budget/backend
npm start
```

### Frontend'i Başlatma
```bash
cd budget/frontend
npm start
```

### Veritabanı İşlemleri

#### Veritabanı Bağlantısını Test Et
```bash
psql -d budget_app -c "SELECT NOW();"
```

#### Tablo Listesini Görüntüle
```bash
psql -d budget_app -c "\dt"
```

#### Kullanıcıları Listele
```bash
psql -d budget_app -c "SELECT id, email, first_name, last_name, role FROM users;"
```

#### Veritabanını Sıfırla (DİKKAT: Tüm veriler silinir!)
```bash
cd budget/backend
npm run db:reset
```

## 🌐 Erişim Bilgileri

### Uygulamaya Erişim
Tarayıcınızda şu adresi açın: **http://localhost:3002**

### Mevcut Kullanıcılar
Veritabanında 4 kullanıcı mevcut. Giriş yapmak için mevcut kullanıcı bilgilerini kullanabilir veya yeni kayıt oluşturabilirsiniz.

## 🔍 Sorun Giderme

### Backend Çalışmıyorsa
1. PostgreSQL'in çalıştığından emin olun: `pg_isready`
2. .env dosyasındaki veritabanı bilgilerini kontrol edin
3. Port 5001'in kullanılabilir olduğundan emin olun

### Frontend Çalışmıyorsa
1. Backend'in çalıştığından emin olun
2. Port 3002'nin kullanılabilir olduğundan emin olun
3. .env dosyasındaki API URL'ini kontrol edin

### Veritabanı Bağlantı Hatası
1. PostgreSQL servisinin çalıştığını kontrol edin
2. Veritabanı kullanıcı adı ve şifresini doğrulayın
3. budget_app veritabanının var olduğundan emin olun

## 📚 Ek Kaynaklar

- **Ana README**: `budget/README.md`
- **Veritabanı Dokümantasyonu**: `budget/backend/database/README.md`
- **API Dokümantasyonu**: Backend çalışırken `/api` endpoint'lerini inceleyin

## 🎯 Sonraki Adımlar

1. ✅ Uygulamayı tarayıcıda açın: http://localhost:3002
2. ✅ Mevcut bir kullanıcı ile giriş yapın veya yeni kayıt oluşturun
3. ✅ Dashboard'u inceleyin ve özellikleri test edin
4. ✅ Gerekirse yeni özellikler ekleyin veya mevcut kodu düzenleyin

---

**Kurulum Tarihi**: 15 Kasım 2024
**Proje Versiyonu**: 2.0.0
