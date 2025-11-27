# 🚀 VM Fresh Deployment Guide

**Tarih:** 24 Kasım 2024  
**VM IP:** 98.71.149.168  
**User:** obiwan  
**Database Backup:** ✅ Alındı (60KB)

---

## 📋 Deployment Planı

### 1. Mevcut Durumu Temizle
```bash
# VM'de eski container'ları durdur
docker-compose -f docker-compose.prod.yml down

# Eski budget klasörünü yedekle
mv budget budget_old_$(date +%Y%m%d_%H%M%S)
```

### 2. Yeni Kodu Deploy Et
```bash
# Local'den VM'e kodu gönder
rsync -avz --exclude 'node_modules' --exclude '.git' \
  budget/ obiwan@98.71.149.168:~/budget/
```

### 3. Database'i Restore Et
```bash
# Backup dosyasını VM'e gönder
scp vm_database_backup_20251124_113104.sql obiwan@98.71.149.168:~/

# VM'de database'i restore et
docker exec -i budget_database_prod psql -U postgres budget_app_prod < ~/vm_database_backup_20251124_113104.sql
```

### 4. Docker Container'ları Başlat
```bash
# VM'de
cd budget
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## 🔧 Gerekli Dosyalar

### Backend Dockerfile
✅ Hazır

### Frontend Dockerfile  
✅ Hazır

### docker-compose.prod.yml
✅ Hazır

### backend/.env.production
✅ Hazır

---

## ✅ Deployment Checklist

- [x] Database backup alındı
- [ ] Eski container'lar durduruldu
- [ ] Yeni kod VM'e gönderildi
- [ ] Database restore edildi
- [ ] Container'lar build edildi
- [ ] Container'lar başlatıldı
- [ ] Frontend erişilebilir (http://98.71.149.168:3000)
- [ ] Backend API çalışıyor (http://98.71.149.168:5001/api/health)
- [ ] Database bağlantısı OK

---

## 🆘 Sorun Giderme

### Container Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Specific Container
```bash
docker logs budget_frontend_prod -f
docker logs budget_backend_prod -f
docker logs budget_database_prod -f
```

### Container Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

---

**Hazır! Deployment başlasın! 🚀**
