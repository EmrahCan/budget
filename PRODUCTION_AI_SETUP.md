# Production AI Setup Guide

## 🚀 Gemini AI Production Deployment

### 1. Environment Variables

Production ortamında aşağıdaki environment variables'ları ayarlayın:

```bash
# AI Configuration
GEMINI_API_KEY=your_real_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-pro
NODE_ENV=production
AI_USE_MOCK_DATA=false

# AI Features
AI_CATEGORIZATION_ENABLED=true
AI_INSIGHTS_ENABLED=true
AI_RECOMMENDATIONS_ENABLED=true
AI_NL_QUERIES_ENABLED=true

# Rate Limiting
AI_RATE_LIMIT=100
AI_RATE_LIMIT_HOUR=1000
AI_RATE_LIMIT_DAY=10000

# Caching
AI_CACHE_ENABLED=true
AI_CACHE_TTL=3600
AI_CACHE_MAX_SIZE=1000

# Confidence Thresholds
AI_CATEGORIZATION_MIN_CONFIDENCE=70
AI_INSIGHT_MIN_CONFIDENCE=60
AI_RECOMMENDATION_MIN_CONFIDENCE=75

# Logging
AI_ENABLE_LOGGING=true
AI_LOG_LEVEL=info
AI_LOG_REQUESTS=true
AI_LOG_RESPONSES=false
```

### 2. Gemini API Key Alma

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. Yeni API key oluşturun
3. API key'i güvenli bir şekilde saklayın
4. Production ortamında environment variable olarak ayarlayın

### 3. Model Seçimi

Mevcut desteklenen modeller:
- `gemini-1.5-pro` (Önerilen - En gelişmiş)
- `gemini-1.5-flash` (Hızlı - Daha ekonomik)
- `gemini-pro` (Eski versiyon - Deprecated)

### 4. Rate Limiting

Production ortamında API kullanımını kontrol etmek için:

```javascript
// Günlük limits
const dailyLimits = {
  'gemini-1.5-pro': 50,      // requests per day
  'gemini-1.5-flash': 1500   // requests per day
};
```

### 5. Monitoring

Production'da AI servisini izlemek için:

```bash
# Health check endpoint
curl https://your-domain.com/api/ai/health

# Expected response
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-11-04T21:00:00.000Z",
    "features": {
      "categorization": true,
      "insights": true,
      "recommendations": true,
      "naturalLanguageQueries": true
    }
  }
}
```

### 6. Error Handling

Production'da AI servisi başarısız olursa:
- Otomatik olarak mock data'ya fallback yapar
- Kullanıcıya hata mesajı gösterilir
- Sistem çalışmaya devam eder

### 7. Cost Management

AI API maliyetlerini kontrol etmek için:
- Rate limiting aktif tutun
- Cache'i etkin kullanın
- Gereksiz API çağrılarını önleyin
- Kullanım metriklerini izleyin

### 8. Security

- API key'leri environment variables'da saklayın
- HTTPS kullanın
- Request/response loglarında sensitive data'yı maskeleyin
- Rate limiting ile abuse'i önleyin

### 9. Testing

Production'a deploy etmeden önce:

```bash
# Test AI endpoints
npm run test:ai

# Load test
npm run test:load

# Integration test
npm run test:integration
```

### 10. Deployment Checklist

- [ ] Gemini API key alındı ve ayarlandı
- [ ] Environment variables production'da ayarlandı
- [ ] Rate limiting konfigüre edildi
- [ ] Monitoring kuruldu
- [ ] Error handling test edildi
- [ ] Cache ayarları optimize edildi
- [ ] Security review yapıldı
- [ ] Load testing tamamlandı

## 🔄 Development vs Production

| Feature | Development | Production |
|---------|-------------|------------|
| AI Data | Mock Data | Real Gemini AI |
| API Key | Test Key | Production Key |
| Rate Limit | 60/min | 100/min |
| Caching | Optional | Required |
| Logging | Verbose | Optimized |
| Error Handling | Debug Mode | User-Friendly |

## 📊 Monitoring Metrics

Production'da izlenmesi gereken metrikler:
- AI API response times
- Success/failure rates
- Daily API usage
- Cache hit rates
- User satisfaction scores
- Cost per request

## 🚨 Troubleshooting

### Common Issues:

1. **API Key Invalid**
   - Check environment variables
   - Verify key in Google AI Studio

2. **Rate Limit Exceeded**
   - Increase limits or implement queuing
   - Optimize request frequency

3. **Model Not Found**
   - Update to supported model name
   - Check Google AI documentation

4. **High Costs**
   - Implement better caching
   - Reduce unnecessary requests
   - Consider using gemini-1.5-flash for simple tasks