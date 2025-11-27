# Yeni VM'e Budget App Deployment Rehberi

## 🎯 Hedef Sunucu Bilgileri
- **IP:** 4.180.74.2
- **Kullanıcı:** obiwan
- **Şifre:** Eben2010++**++
- **Uygulama Dizini:** /home/obiwan/budget-app

## 📋 Ön Gereksinimler

Local makinenizde `sshpass` kurulu olmalı:
```bash
# macOS
brew install hudochenkov/sshpass/sshpass

# Linux
sudo apt-get install sshpass
```

## 🚀 Hızlı Deployment

### Adım 1: Deployment Script'ini Çalıştır
```bash
cd budget
chmod +x deploy-to-new-vm.sh
./deploy-to-new-vm.sh
```

Bu script otomatik olarak:
1. ✅ Local database'den dump alır
2. ✅ Deployment paketini hazırlar
3. ✅ VM'e bağlantıyı test eder
4. ✅ Gerekli paketleri kurar (Docker, Nginx, PM2)
5. ✅ Dosyaları VM'e kopyalar
6. ✅ Environment dosyalarını oluşturur
7. ✅ Docker container'ları başlatır
8. ✅ Database'i restore eder
9. ✅ Nginx'i yapılandırır
10. ✅ Servisleri başlatır

### Adım 2: Deployment'ı Doğrula
```bash
chmod +x verify-new-vm.sh
./verify-new-vm.sh
```

## 🌐 Erişim Adresleri

Deployment tamamlandıktan sonra:

- **Frontend:** http://4.180.74.2
- **Backend API:** http://4.180.74.2:5001/api
- **Health Check:** http://4.180.74.2/health

## 🔧 VM'de Yönetim

### VM'e Bağlanma
```bash
ssh obiwan@4.180.74.2
# Şifre: Eben2010++**++
```

### Yönetim Menüsünü Kullanma
```bash
cd /home/obiwan/budget-app
./vm-management-commands.sh
```

### Manuel Komutlar

#### Container Durumunu Görüntüleme
```bash
cd /home/obiwan/budget-app
docker-compose -f docker-compose.prod.yml ps
```

#### Logları Görüntüleme
```bash
# Tüm loglar
docker-compose -f docker-compose.prod.yml logs -f

# Sadece backend
docker-compose -f docker-compose.prod.yml logs -f backend

# Sadece frontend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

#### Uygulamayı Yeniden Başlatma
```bash
docker-compose -f docker-compose.prod.yml restart
```

#### Uygulamayı Durdurma
```bash
docker-compose -f docker-compose.prod.yml stop
```

#### Uygulamayı Başlatma
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Database Backup Alma
```bash
docker exec budget_database_prod pg_dump -U postgres -d budget_app_prod > backup_$(date +%Y%m%d).sql
```

#### Nginx Durumu
```bash
sudo systemctl status nginx
sudo nginx -t  # Config test
sudo systemctl restart nginx
```

## 📊 Kurulu Servisler

### Docker Container'lar
- **budget_database_prod** - PostgreSQL 15
- **budget_backend_prod** - Node.js Backend (Port 5001)
- **budget_frontend_prod** - React Frontend (Port 3000)

### Nginx
- Port 80'de çalışır
- Frontend isteklerini port 3000'e yönlendirir
- API isteklerini port 5001'e yönlendirir

### Database
- **Host:** localhost (container içinde)
- **Port:** 5432
- **Database:** budget_app_prod
- **User:** postgres
- **Password:** 9Ht03GrRP7iK8zOgQrKC9br7w4jpcutn

## 🔐 Güvenlik Notları

1. **Firewall Ayarları**
   ```bash
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow 22/tcp
   sudo ufw enable
   ```

2. **SSL Sertifikası (Opsiyonel)**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## 🐛 Sorun Giderme

### Container Başlamıyorsa
```bash
# Container'ları temizle ve yeniden başlat
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Bağlantı Hatası
```bash
# Database container'ını kontrol et
docker logs budget_database_prod

# Database'e manuel bağlan
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod
```

### Nginx Hatası
```bash
# Nginx config'i test et
sudo nginx -t

# Nginx loglarını kontrol et
sudo tail -f /var/log/nginx/error.log
```

### Port Çakışması
```bash
# Portları kontrol et
sudo netstat -tulpn | grep -E ':(80|3000|5001|5432)'

# Çakışan process'i durdur
sudo kill -9 <PID>
```

## 📝 Önemli Dosyalar

- `/home/obiwan/budget-app/docker-compose.prod.yml` - Docker yapılandırması
- `/home/obiwan/budget-app/backend/.env.production` - Backend environment
- `/etc/nginx/sites-available/budget-app` - Nginx yapılandırması
- `/home/obiwan/budget-app/logs/` - Uygulama logları

## 🔄 Güncelleme Yapma

Yeni bir versiyon deploy etmek için:

```bash
# Local'den yeni deployment çalıştır
./deploy-to-new-vm.sh

# Veya VM'de manuel güncelleme
ssh obiwan@4.180.74.2
cd /home/obiwan/budget-app
git pull  # Eğer git kullanıyorsanız
docker-compose -f docker-compose.prod.yml up -d --build
```

## 📞 Destek

Sorun yaşarsanız:
1. Logları kontrol edin
2. Container durumlarını kontrol edin
3. Nginx yapılandırmasını kontrol edin
4. Database bağlantısını test edin

## ✅ Deployment Checklist

- [ ] sshpass kurulu
- [ ] Local database dump alındı
- [ ] VM'e SSH bağlantısı test edildi
- [ ] deploy-to-new-vm.sh çalıştırıldı
- [ ] verify-new-vm.sh ile doğrulama yapıldı
- [ ] Frontend'e tarayıcıdan erişildi
- [ ] Backend API test edildi
- [ ] Database'de veriler kontrol edildi
- [ ] Nginx çalışıyor
- [ ] Firewall ayarları yapıldı

## 🎉 Başarılı Deployment

Tüm adımlar tamamlandıysa, uygulamanız şu adreste çalışıyor olmalı:
**http://4.180.74.2**

Tebrikler! 🚀
