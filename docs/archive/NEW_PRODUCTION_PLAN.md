# Yeni Production Ortamı Planı

## 📋 Mevcut Durum
- **Eski Production:** Azure VM (98.71.149.168)
- **Domain:** budgetapp.emrahcan.net
- **Veritabanı:** PostgreSQL (Docker)
- **Son Versiyon:** GitHub'a push edildi (commit: 7830502)

## 🎯 Yeni Production Hedefleri

### 1. Altyapı Seçenekleri

#### Seçenek A: Modern Cloud Platform (Önerilen)
- **Vercel/Netlify** (Frontend)
  - Otomatik deployment
  - CDN ile hızlı erişim
  - SSL sertifikası dahil
  - Ücretsiz plan mevcut
  
- **Railway/Render** (Backend + Database)
  - PostgreSQL dahil
  - Otomatik scaling
  - Kolay deployment
  - Aylık ~$5-10

#### Seçenek B: Mevcut Azure VM'i İyileştir
- Docker Compose ile tam otomatik deployment
- GitHub Actions ile CI/CD
- Nginx reverse proxy optimizasyonu
- SSL sertifikası yenileme otomasyonu

#### Seçenek C: Yeni Cloud Provider
- **DigitalOcean App Platform**
- **AWS Amplify + RDS**
- **Google Cloud Run**

### 2. Deployment Stratejisi

#### Aşama 1: Hazırlık (1 gün)
- [ ] Yeni ortam seçimi
- [ ] Domain DNS ayarları planı
- [ ] Veritabanı migration stratejisi
- [ ] Environment variables hazırlığı

#### Aşama 2: Kurulum (1 gün)
- [ ] Yeni sunucu/platform kurulumu
- [ ] Database oluşturma
- [ ] Migration'ları çalıştırma
- [ ] Backend deployment
- [ ] Frontend deployment

#### Aşama 3: Test (1 gün)
- [ ] Tüm API endpoint'leri test
- [ ] Frontend-Backend bağlantısı
- [ ] Bildirim sistemi test
- [ ] AI özellikleri test
- [ ] Kullanıcı yönetimi test

#### Aşama 4: Geçiş (1 gün)
- [ ] Production veritabanı backup
- [ ] Veri migration
- [ ] DNS değişikliği
- [ ] SSL sertifikası
- [ ] Monitoring kurulumu

### 3. Gerekli Konfigürasyonlar

#### Environment Variables
```bash
# Backend
DB_HOST=<yeni-db-host>
DB_PORT=5432
DB_NAME=budget_app_prod
DB_USER=postgres
DB_PASSWORD=<güvenli-şifre>
JWT_SECRET=<yeni-secret>
GEMINI_API_KEY=<mevcut-key>
NODE_ENV=production
PORT=5001

# Frontend
REACT_APP_API_URL=https://api.budgetapp.emrahcan.net
REACT_APP_ENVIRONMENT=production
```

#### Database Migration Sırası
1. `add_ai_tables.sql`
2. `add_user_language_preference.sql`
3. `add_notification_tracking_columns.sql`
4. `add_notification_columns.sql`
5. `add_fixed_payment_history.sql`

### 4. Monitoring ve Backup

#### Monitoring
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Database backup otomasyonu

#### Backup Stratejisi
- Günlük otomatik database backup
- 30 gün backup retention
- S3/Cloud Storage'a yedekleme

### 5. Güvenlik

- [ ] HTTPS zorunlu
- [ ] Rate limiting aktif
- [ ] CORS ayarları
- [ ] Environment variables güvenli
- [ ] Database şifreleri güçlü
- [ ] JWT secret yenileme

### 6. Performans Optimizasyonları

- [ ] Frontend build optimizasyonu
- [ ] Image optimization
- [ ] Database indexleme
- [ ] Redis cache (opsiyonel)
- [ ] CDN kullanımı

## 💰 Maliyet Tahmini

### Seçenek A: Modern Cloud
- Frontend (Vercel): $0 (Hobby plan)
- Backend + DB (Railway): $5-10/ay
- Domain: Mevcut
- **Toplam: ~$5-10/ay**

### Seçenek B: Mevcut Azure
- VM: Mevcut maliyet
- Optimizasyon: $0
- **Toplam: Değişmez**

### Seçenek C: Premium Cloud
- AWS/GCP: $20-50/ay
- **Toplam: $20-50/ay**

## 🚀 Önerilen Yol Haritası

### Hızlı Geçiş (3-4 gün)
1. **Gün 1:** Railway'de backend + database kurulumu
2. **Gün 2:** Vercel'de frontend deployment
3. **Gün 3:** Test ve veri migration
4. **Gün 4:** DNS değişikliği ve go-live

### Güvenli Geçiş (1 hafta)
1. **Gün 1-2:** Yeni ortam kurulumu ve test
2. **Gün 3-4:** Paralel çalıştırma ve test
3. **Gün 5:** Veri migration
4. **Gün 6:** DNS değişikliği
5. **Gün 7:** Monitoring ve eski ortamı kapatma

## 📝 Sonraki Adımlar

1. **Hangi seçeneği tercih ediyorsunuz?**
   - A: Modern Cloud (Railway + Vercel)
   - B: Mevcut Azure'u iyileştir
   - C: Başka bir platform

2. **Geçiş stratejisi?**
   - Hızlı (3-4 gün)
   - Güvenli (1 hafta)

3. **Öncelikler?**
   - Maliyet
   - Performans
   - Kolay yönetim
   - Güvenilirlik

## 🔗 Faydalı Linkler

- [Railway Docs](https://docs.railway.app/)
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [DigitalOcean App Platform](https://www.digitalocean.com/products/app-platform)

---

**Hazırlayan:** Kiro AI
**Tarih:** 24 Kasım 2024
**Versiyon:** 1.0
