# ⚠️ AI Özellikleri Hakkında Not

## Durum

Local production ortamında AI özellikleri şu anda çalışmıyor.

## Neden?

1. **Gemini API Model Değişikliği**
   - Backend kodu `gemini-1.5-flash` modelini kullanıyor
   - Bu model artık mevcut değil veya API versiyonu uyumsuz
   - Hata: `models/gemini-1.5-flash is not found for API version v1beta`

2. **Production API Key**
   - Kullanılan API key production ortamına ait
   - Local'de production API key kullanmak önerilmez

## Çözüm Seçenekleri

### Seçenek 1: AI Özelliklerini Devre Dışı Bırak (Önerilen)

Local'de AI olmadan geliştirme yapın:

```bash
# backend/.env.local-prod dosyasında:
AI_CATEGORIZATION_ENABLED=false
AI_INSIGHTS_ENABLED=false
AI_RECOMMENDATIONS_ENABLED=false
AI_NL_QUERIES_ENABLED=false
GEMINI_API_KEY=
```

**Avantajlar:**
- API kotası tüketilmez
- Daha hızlı geliştirme
- Production API key'i korur

**Dezavantajlar:**
- AI özellikleri test edilemez

### Seçenek 2: Kendi API Key'inizi Kullanın

1. Google AI Studio'dan ücretsiz API key alın: https://makersuite.google.com/app/apikey
2. `.env.local-prod` dosyasını güncelleyin:

```bash
GEMINI_API_KEY=YOUR_API_KEY_HERE
GEMINI_MODEL=gemini-pro
AI_CATEGORIZATION_ENABLED=true
AI_INSIGHTS_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_NL_QUERIES_ENABLED=true
```

3. Backend'i yeniden başlatın:
```bash
docker restart budget_backend_local_prod
```

### Seçenek 3: Model Adını Güncelleyin

Backend kodunda model adını güncelleyin:

```javascript
// backend/config/aiConfig.js
model: process.env.GEMINI_MODEL || 'gemini-pro',  // veya 'gemini-1.5-pro'
```

Sonra rebuild edin:
```bash
docker-compose -f docker-compose.local-prod.yml up -d --build backend
```

## Mevcut Durum

**Local Production:**
- ✅ Tüm temel özellikler çalışıyor
- ✅ Hesaplar, işlemler, sabit ödemeler
- ✅ Ödeme takvimi
- ❌ AI analiz ve öneriler (devre dışı)

**Production (Azure):**
- ✅ Tüm özellikler çalışıyor
- ✅ AI özellikleri aktif

## Frontend Hatası

Frontend'de gördüğünüz hata:
```
Unexpected token '<', "<!doctype "... is not valid JSON
```

Bu, backend'in HTML error page döndürmesi demek. AI endpoint'i çağrıldığında backend hata veriyor ve frontend bunu parse edemiyor.

## Geçici Çözüm

Frontend'de AI özelliklerini kullanmayın veya try-catch ile handle edin:

```javascript
try {
  const insights = await api.getAIInsights();
} catch (error) {
  console.log('AI features not available in local environment');
  // Fallback UI göster
}
```

## Önerilen Yaklaşım

Local development için AI özelliklerini devre dışı bırakın:

1. AI olmadan geliştirme yapın
2. Temel özellikleri test edin
3. AI özellikleri için production'da test yapın

Veya kendi API key'inizi kullanarak AI özelliklerini test edin.

## Production'da Test

AI özelliklerini test etmek için:
1. Production ortamına deploy edin
2. http://98.71.149.168:3000 adresinde test edin
3. Production API key'i orada çalışıyor

---

**Not:** Bu durum sadece local development ortamını etkiler. Production ortamında tüm özellikler çalışıyor.
