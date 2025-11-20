# 🤖 AI Analizi Düzeltme - Deployment Talimatları

## Sorun
AI analizi çalışmıyor. Hata: `gemini-1.5-flash model bulunamadı`

## Çözüm
Model adını `gemini-1.5-pro` olarak güncelledik.

## 🚀 Azure VM'de Çalıştırılacak Komutlar

### 1. SSH ile Bağlan
```bash
ssh obiwan@98.71.149.168
# Password: Eben2010++**++
```

### 2. Projeye Git ve Güncellemeleri Çek
```bash
cd ~/budget
git stash
git pull origin main
```

### 3. Backend'i Rebuild Et ve Restart Et
```bash
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml up -d backend
```

### 4. Backend'in Başlamasını Bekle (15 saniye)
```bash
sleep 15
```

### 5. Backend Loglarını Kontrol Et
```bash
docker logs budget_backend_prod --tail 50
```

### 6. AI Health Check Yap
```bash
curl http://localhost:5001/api/ai/health
```

Beklenen sonuç:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "...",
    "features": {
      "categorization": true,
      "insights": true,
      "recommendations": true,
      "naturalLanguageQueries": true
    }
  }
}
```

### 7. Test Et
Browser'da aç: http://98.71.149.168:3000
- Login yap
- Reports sayfasına git
- "AI Analizi" tab'ına tıkla
- AI analizinin yüklendiğini kontrol et

## 🔧 Alternatif: Tek Komutla Fix

Veya tüm adımları tek seferde çalıştır:

```bash
cd ~/budget && \
git stash && \
git pull origin main && \
docker-compose -f docker-compose.prod.yml build backend && \
docker-compose -f docker-compose.prod.yml up -d backend && \
sleep 15 && \
echo "Testing AI health..." && \
curl http://localhost:5001/api/ai/health
```

## 📊 Kontrol Listesi

- [ ] SSH ile VM'e bağlandım
- [ ] Git pull yaptım
- [ ] Backend rebuild ettim
- [ ] Backend restart ettim
- [ ] Backend loglarını kontrol ettim
- [ ] AI health check başarılı
- [ ] Browser'da test ettim
- [ ] AI analizi çalışıyor

## ❓ Sorun Devam Ederse

### Backend loglarını detaylı incele:
```bash
docker logs budget_backend_prod -f
```

### Environment variable'ları kontrol et:
```bash
docker exec budget_backend_prod env | grep GEMINI
```

Beklenen:
```
GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
GEMINI_MODEL=gemini-1.5-pro
```

### Container'ı tamamen yeniden başlat:
```bash
docker-compose -f docker-compose.prod.yml down backend
docker-compose -f docker-compose.prod.yml up -d backend
```

## 🎯 Değişiklikler

1. **backend/.env.production**: `GEMINI_MODEL=gemini-1.5-pro`
2. **backend/config/aiConfig.js**: Default model `gemini-1.5-pro`
3. **backend/services/geminiAIService.js**: Default model `gemini-1.5-pro`

## 📝 Notlar

- Gemini API'de `gemini-1.5-flash` modeli v1beta API'de desteklenmiyor
- `gemini-1.5-pro` modeli stabil ve destekleniyor
- API key doğru ve çalışıyor
- Sadece model adı değişti, başka bir şey değişmedi
