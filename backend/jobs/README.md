# Background Jobs

Bu dizin, arka planda çalışan scheduled job'ları içerir.

## Spending Profile Update Job

**Dosya:** `updateSpendingProfiles.js`

**Amaç:** Kullanıcıların harcama profillerini günlük olarak günceller. Bu profiller anomali tespiti için kullanılır.

**Çalışma Sıklığı:** Günlük (önerilen: gece 02:00)

### Manuel Çalıştırma

```bash
cd backend
node jobs/updateSpendingProfiles.js
```

### Cron Job Kurulumu

#### Linux/Mac (crontab)

```bash
# Crontab'ı düzenle
crontab -e

# Her gün saat 02:00'de çalıştır
0 2 * * * cd /path/to/budget/backend && node jobs/updateSpendingProfiles.js >> logs/spending-profiles.log 2>&1
```

#### PM2 ile Scheduled Job

```bash
# PM2 ile cron job ekle
pm2 start jobs/updateSpendingProfiles.js --cron "0 2 * * *" --name "spending-profile-update" --no-autorestart
```

#### Node-cron ile (Uygulama içinde)

`server.js` dosyasına ekleyin:

```javascript
const cron = require('node-cron');
const updateSpendingProfiles = require('./jobs/updateSpendingProfiles');

// Her gün saat 02:00'de çalıştır
cron.schedule('0 2 * * *', async () => {
  console.log('Running spending profile update job...');
  await updateSpendingProfiles();
});
```

### Bağımlılıklar

Node-cron kullanmak için:

```bash
npm install node-cron
```

### Loglama

Job çalıştırıldığında:
- Başarılı güncellemeler info seviyesinde loglanır
- Hatalar error seviyesinde loglanır
- Özet bilgi job sonunda loglanır

### Performans

- Her kullanıcı için tüm kategoriler yeniden hesaplanır
- Büyük veritabanları için işlem süresi uzun olabilir
- Gerekirse batch processing eklenebilir

### Monitoring

Job'ın düzgün çalışıp çalışmadığını kontrol etmek için:

```bash
# Log dosyasını kontrol et
tail -f logs/spending-profiles.log

# PM2 ile kontrol
pm2 logs spending-profile-update

# Veritabanında son güncelleme zamanını kontrol et
SELECT user_id, category, last_updated 
FROM user_spending_profile 
ORDER BY last_updated DESC 
LIMIT 10;
```

## Gelecek Job'lar

- **Smart Notifications Job:** Akıllı bildirimler oluşturma
- **Budget Performance Job:** Bütçe performans raporları
- **Data Cleanup Job:** Eski AI interaction loglarını temizleme
