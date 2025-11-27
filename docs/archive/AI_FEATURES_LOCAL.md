# 🤖 AI Özellikleri - Local Kullanım Rehberi

## ✅ Mevcut Durum

AI özellikleri **zaten kurulu ve aktif**! Gemini API kullanılıyor.

### Aktif AI Özellikleri

1. ✅ **Expense Categorization** - Harcama kategorilendirme
2. ✅ **Financial Insights** - Finansal içgörüler
3. ✅ **Personalized Recommendations** - Kişiselleştirilmiş öneriler
4. ✅ **Natural Language Queries** - Doğal dil sorguları

---

## 🔧 Konfigürasyon

### Backend (.env)

```env
# AI Configuration
GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
GEMINI_MODEL=gemini-1.5-pro
AI_CATEGORIZATION_ENABLED=true
AI_INSIGHTS_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_NL_QUERIES_ENABLED=true
AI_RATE_LIMIT=60
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
AI_ENABLE_LOGGING=true
```

✅ **Tüm özellikler aktif!**

---

## 🧪 Test Et

### 1. AI Health Check

```bash
curl http://localhost:5001/api/ai/health | jq '.'
```

**Beklenen Çıktı:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-11-16T...",
    "features": {
      "categorization": true,
      "insights": true,
      "recommendations": true,
      "naturalLanguageQueries": true
    }
  }
}
```

---

### 2. Harcama Kategorilendirme

**Login ol ve token al:**
```bash
TOKEN=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@local.com","password":"Test123!"}' | jq -r '.data.token')
```

**Harcamayı kategorize et:**
```bash
curl -X POST http://localhost:5001/api/ai/categorize \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Migros market alışverişi",
    "amount": 250.50
  }' | jq '.'
```

**Beklenen Çıktı:**
```json
{
  "success": true,
  "data": {
    "category": "Yiyecek ve İçecek",
    "confidence": 95,
    "subcategory": "Market Alışverişi",
    "reasoning": "Migros bir süpermarket zinciri..."
  }
}
```

---

### 3. Finansal İçgörüler

```bash
curl -X GET "http://localhost:5001/api/ai/insights?timeframe=monthly" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Beklenen Çıktı:**
```json
{
  "success": true,
  "data": {
    "insights": [
      {
        "type": "spending_pattern",
        "message": "Bu ay yiyecek harcamalarınız %15 arttı",
        "severity": "info"
      },
      {
        "type": "saving_opportunity",
        "message": "Ulaşım harcamalarınızı azaltarak ayda 500₺ tasarruf edebilirsiniz",
        "severity": "suggestion"
      }
    ]
  }
}
```

---

### 4. Kişiselleştirilmiş Öneriler

```bash
curl -X GET "http://localhost:5001/api/ai/recommendations" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

---

### 5. Doğal Dil Sorgusu

```bash
curl -X POST http://localhost:5001/api/ai/query \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Bu ay ne kadar harcama yaptım?",
    "language": "tr"
  }' | jq '.'
```

---

## 🎨 Frontend'de Kullanım

### AI Özelliklerini Ekle

Frontend'de AI özelliklerini kullanmak için:

#### 1. API Service Oluştur

`frontend/src/services/aiService.js`:

```javascript
import api from './api';

export const aiService = {
  // Harcama kategorilendirme
  categorizeExpense: async (description, amount) => {
    const response = await api.post('/ai/categorize', {
      description,
      amount
    });
    return response.data;
  },

  // Finansal içgörüler
  getInsights: async (timeframe = 'monthly') => {
    const response = await api.get(`/ai/insights?timeframe=${timeframe}`);
    return response.data;
  },

  // Öneriler
  getRecommendations: async () => {
    const response = await api.get('/ai/recommendations');
    return response.data;
  },

  // Doğal dil sorgusu
  query: async (question, language = 'tr') => {
    const response = await api.post('/ai/query', {
      query: question,
      language
    });
    return response.data;
  },

  // Health check
  checkHealth: async () => {
    const response = await api.get('/ai/health');
    return response.data;
  }
};
```

#### 2. Transaction Form'da Kullan

Harcama eklerken otomatik kategorilendirme:

```javascript
import { aiService } from '../services/aiService';

const handleDescriptionChange = async (description) => {
  if (description.length > 5) {
    try {
      const result = await aiService.categorizeExpense(description, amount);
      if (result.success && result.data.confidence > 70) {
        setCategory(result.data.category);
        setSubcategory(result.data.subcategory);
      }
    } catch (error) {
      console.error('AI categorization failed:', error);
    }
  }
};
```

#### 3. Dashboard'da İçgörüler

```javascript
import { aiService } from '../services/aiService';
import { useState, useEffect } from 'react';

const AIInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const result = await aiService.getInsights('monthly');
        if (result.success) {
          setInsights(result.data.insights);
        }
      } catch (error) {
        console.error('Failed to fetch insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) return <div>Yükleniyor...</div>;

  return (
    <div className="ai-insights">
      <h3>💡 AI İçgörüleri</h3>
      {insights.map((insight, index) => (
        <div key={index} className={`insight ${insight.severity}`}>
          <p>{insight.message}</p>
        </div>
      ))}
    </div>
  );
};
```

#### 4. AI Chatbot

```javascript
import { aiService } from '../services/aiService';
import { useState } from 'react';

const AIChatbot = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await aiService.query(query, 'tr');
      if (result.success) {
        setResponse(result.data);
      }
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-chatbot">
      <h3>🤖 AI Asistan</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Bir soru sorun... (örn: Bu ay ne kadar harcadım?)"
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Düşünüyor...' : 'Sor'}
        </button>
      </form>
      {response && (
        <div className="response">
          <p>{response.answer}</p>
        </div>
      )}
    </div>
  );
};
```

---

## 🚀 Geliştirme Fikirleri

### 1. Akıllı Bütçe Önerileri

```javascript
// Kullanıcının harcama geçmişine göre bütçe öner
const suggestBudget = async (userId) => {
  const insights = await aiService.getInsights('quarterly');
  // AI'dan gelen verilere göre bütçe öner
};
```

### 2. Harcama Tahminleri

```javascript
// Gelecek ay harcama tahmini
const predictNextMonthExpenses = async () => {
  const result = await aiService.query(
    'Gelecek ay harcamalarım ne kadar olabilir?',
    'tr'
  );
  return result.data;
};
```

### 3. Otomatik Kategori Öğrenme

```javascript
// Kullanıcı kategorilendirmelerinden öğren
const learnFromUserCategories = async (transactions) => {
  // AI'ya kullanıcının tercihlerini öğret
};
```

### 4. Fatura Hatırlatıcıları

```javascript
// AI ile akıllı fatura hatırlatıcıları
const smartBillReminders = async () => {
  const insights = await aiService.getInsights('monthly');
  // Ödeme tarihleri yaklaşan faturaları tespit et
};
```

---

## 📊 Rate Limiting

- **Dakika başına:** 60 istek
- **Saat başına:** 1000 istek
- **Gün başına:** 10000 istek

Rate limit aşılırsa 429 hatası alırsın.

---

## 🔒 Güvenlik

- ✅ Tüm AI endpoint'leri authentication gerektiriyor
- ✅ Rate limiting aktif
- ✅ Request logging aktif
- ✅ Circuit breaker pattern kullanılıyor
- ✅ Cache mekanizması var

---

## 🐛 Troubleshooting

### AI Health Check Başarısız

```bash
# Backend loglarını kontrol et
# Process ID 5 (backend)
```

### Gemini API Hatası

```bash
# API key'i kontrol et
cat backend/.env | grep GEMINI_API_KEY

# Quota kontrolü
# https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com
```

### Rate Limit Aşıldı

```
429 Too Many Requests
```

Çözüm: Biraz bekle veya rate limit'i artır (.env'de)

---

## 📚 Kaynaklar

- **Gemini API Docs:** https://ai.google.dev/docs
- **Backend AI Config:** `backend/config/aiConfig.js`
- **AI Routes:** `backend/routes/ai.js`
- **AI Middleware:** `backend/middleware/aiMiddleware.js`

---

## 🎯 Özet

✅ AI özellikleri **tamamen kurulu ve çalışıyor**
✅ Gemini API entegre
✅ 4 ana özellik aktif
✅ Frontend'de kullanıma hazır
✅ Rate limiting ve caching var

**Şimdi yapabilirsin:**
1. Backend'de AI endpoint'lerini test et
2. Frontend'de AI servislerini kullan
3. Dashboard'a AI içgörüleri ekle
4. Transaction form'a otomatik kategorilendirme ekle
5. AI chatbot ekle

**Başlamak için:** Yukarıdaki curl komutlarını çalıştır ve test et!

