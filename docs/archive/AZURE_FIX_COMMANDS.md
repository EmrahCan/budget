# 🚀 Azure VM'de Çalıştırılacak Komutlar

## Adım Adım Komutlar

### 1️⃣ Proje Dizinine Git
```bash
cd ~/budget
```
veya projeniz başka yerdeyse:
```bash
cd /path/to/budget
```

### 2️⃣ Git'ten Son Değişiklikleri Çek
```bash
git pull origin main
```

Eğer local değişiklikler varsa ve conflict olursa:
```bash
git stash
git pull origin main
```

### 3️⃣ Script'i Çalıştırılabilir Yap
```bash
chmod +x scripts/fix-production-delete.sh
```

### 4️⃣ Fix'i Uygula
```bash
./scripts/fix-production-delete.sh
```

### 5️⃣ Sonucu Test Et
Tarayıcıda uygulamanızı açın ve hesap silmeyi deneyin:
```
http://98.71.149.168
```

---

## 🔍 Kontrol Komutları

### Backend Loglarını İzle
```bash
docker logs budget_backend_prod -f
```
(Çıkmak için: `Ctrl + C`)

### Container'ları Kontrol Et
```bash
docker ps
```

### Backend Health Check
```bash
curl http://localhost:5001/health
```

---

## 🚨 Sorun Çıkarsa

### Manuel Olarak Dosyayı Kopyala
```bash
docker cp backend/middleware/validation.js budget_backend_prod:/app/middleware/validation.js
docker restart budget_backend_prod
```

### Backend Loglarında Hata Ara
```bash
docker logs budget_backend_prod --tail 100 | grep -i error
```

### Database'i Kontrol Et
```bash
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod -c "\d accounts"
```

---

## 📋 Tek Komutla Tüm İşlemler

Eğer hızlı yapmak isterseniz, tüm komutları tek seferde:

```bash
cd ~/budget && \
git pull origin main && \
chmod +x scripts/fix-production-delete.sh && \
./scripts/fix-production-delete.sh
```

---

## ✅ Başarılı Olduğunu Nasıl Anlarım?

Script çalıştıktan sonra şunu göreceksiniz:
```
✅ File copied successfully
✅ Backend is healthy!
✨ Fix applied! Please test account deletion now.
```

Sonra tarayıcıda hesap silmeyi deneyin - artık çalışmalı!

---

## 🔙 Geri Alma (Rollback)

Eğer bir sorun olursa:
```bash
docker exec budget_backend_prod cp /app/middleware/validation.js.backup /app/middleware/validation.js
docker restart budget_backend_prod
```
