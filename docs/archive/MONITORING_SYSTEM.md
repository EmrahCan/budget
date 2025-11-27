# System Monitoring and Health Management

Bu dokümantasyon, uygulamada implementasyonu yapılan kapsamlı sistem izleme ve sağlık yönetimi sistemini açıklamaktadır.

## Özellikler

### 🔍 Sistem Sağlık İzleme
- **Gerçek zamanlı izleme**: CPU, bellek, disk kullanımı
- **Performans metrikleri**: Yanıt süreleri, veritabanı sorguları, cache hit oranları
- **Otomatik uyarılar**: Kritik durumlar için anlık bildirimler
- **Sağlık durumu raporlama**: Detaylı sistem durumu raporları

### 🚨 Otomatik Kurtarma Sistemi
- **Bellek yönetimi**: Otomatik garbage collection ve cache temizleme
- **CPU optimizasyonu**: Eşzamanlılık azaltma ve arka plan görevlerini durdurma
- **Disk yönetimi**: Geçici dosya temizleme ve log rotasyonu
- **Performans optimizasyonu**: Agresif caching ve sorgu optimizasyonu

### 📊 Performans İzleme
- **İstek izleme**: HTTP isteklerinin yanıt süreleri ve durumları
- **Veritabanı izleme**: Sorgu performansı ve yavaş sorgular
- **Cache izleme**: Hit/miss oranları ve cache performansı
- **Hata izleme**: Sistem hatalarının kategorize edilmesi

### 🛡️ Circuit Breaker Pattern
- **Servis koruması**: Başarısız servislerin otomatik devre dışı bırakılması
- **Otomatik kurtarma**: Servislerin sağlık durumuna göre yeniden etkinleştirilmesi
- **Kademeli yük azaltma**: Sistem yükü altındayken isteklerin sınırlandırılması

## Dosya Yapısı

```
budget/
├── backend/
│   ├── services/
│   │   ├── systemHealthMonitor.js      # Ana sistem sağlık izleme servisi
│   │   ├── performanceMonitor.js       # Performans izleme servisi
│   │   ├── enhancedCacheManager.js     # Gelişmiş cache yönetimi
│   │   ├── connectionPoolManager.js    # Bağlantı havuzu yönetimi
│   │   └── queueManager.js            # Kuyruk yönetimi
│   ├── middleware/
│   │   └── healthCheck.js             # Sağlık kontrolü middleware'i
│   ├── config/
│   │   └── monitoring.js              # İzleme konfigürasyonu
│   └── scripts/
│       └── initializeMonitoring.js    # İzleme servislerini başlatma
└── frontend/
    ├── hooks/
    │   ├── useSystemHealth.js         # Frontend sistem sağlık hook'u
    │   ├── useMemoryManagement.js     # Bellek yönetimi hook'u
    │   └── usePerformanceMonitor.js   # Performans izleme hook'u
    ├── components/common/
    │   └── SystemHealthIndicator.js   # Sistem sağlık göstergesi
    └── pages/admin/
        └── SystemMonitoringPage.js    # İzleme dashboard'u
```

## Konfigürasyon

### Eşik Değerleri
```javascript
thresholds: {
  memory: {
    warning: 0.75,  // %75
    critical: 0.90  // %90
  },
  cpu: {
    warning: 0.70,  // %70
    critical: 0.85  // %85
  },
  responseTime: {
    warning: 2000,  // 2 saniye
    critical: 5000  // 5 saniye
  }
}
```

### İzleme Aralıkları
```javascript
intervals: {
  healthCheck: 30000,     // 30 saniye
  metrics: 60000,         // 1 dakika
  cleanup: 300000,        // 5 dakika
  alertCheck: 15000       // 15 saniye
}
```

## API Endpoints

### Sağlık Kontrolü
- `GET /health` - Temel sağlık durumu
- `GET /health/detailed` - Detaylı sağlık raporu
- `GET /health/metrics` - Performans metrikleri

### Örnek Yanıt
```json
{
  "status": "healthy",
  "timestamp": "2024-12-20T10:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "memory": {
      "status": "healthy",
      "usage": 65.2
    },
    "database": {
      "status": "healthy",
      "averageQueryTime": 45.2
    }
  }
}
```

## Frontend Kullanımı

### SystemHealthIndicator Komponenti
```jsx
import SystemHealthIndicator from './components/common/SystemHealthIndicator';

function App() {
  return (
    <div>
      {/* Diğer bileşenler */}
      <SystemHealthIndicator 
        position="bottom-right"
        showDetails={true}
        enableNotifications={true}
      />
    </div>
  );
}
```

### useSystemHealth Hook'u
```jsx
import useSystemHealth from './hooks/useSystemHealth';

function MyComponent() {
  const {
    healthStatus,
    systemMetrics,
    memoryManager,
    clearAlerts
  } = useSystemHealth({
    enableAutoRecovery: true,
    thresholds: {
      memory: 0.8,
      renderTime: 50
    }
  });

  return (
    <div>
      <p>Sistem Durumu: {healthStatus.overall}</p>
      <p>Bellek Kullanımı: {systemMetrics.memory?.percentage}%</p>
    </div>
  );
}
```

## Otomatik Kurtarma Aksiyonları

### Bellek Kritik Durumu
1. **Garbage Collection**: Zorla bellek temizleme
2. **Cache Temizleme**: Tüm cache'lerin temizlenmesi
3. **Bağlantı Azaltma**: Veritabanı bağlantı havuzunun küçültülmesi

### CPU Kritik Durumu
1. **Eşzamanlılık Azaltma**: Paralel işlem sayısının azaltılması
2. **Arka Plan Görevleri**: Kritik olmayan görevlerin durdurulması
3. **Throttling**: İstek hızının sınırlandırılması

### Disk Kritik Durumu
1. **Geçici Dosyalar**: Temp dosyalarının temizlenmesi
2. **Log Rotasyonu**: Eski log dosyalarının arşivlenmesi
3. **Dosya Sıkıştırma**: Büyük dosyaların sıkıştırılması

## İzleme Dashboard'u

Admin panelinde bulunan sistem izleme sayfası şu özellikleri sunar:

- **Genel Bakış**: Sistem sağlığının özeti
- **Uyarılar**: Aktif uyarıların listesi
- **Kontroller**: Manuel müdahale seçenekleri
- **Gerçek Zamanlı Güncelleme**: Otomatik veri yenileme

## Geliştirme vs Prodüksiyon

### Geliştirme Ortamı
- Daha esnek eşik değerleri
- Daha uzun izleme aralıkları
- Detaylı loglama

### Prodüksiyon Ortamı
- Sıkı eşik değerleri
- Kısa izleme aralıkları
- Optimized loglama

## Çevre Değişkenleri

```bash
# İzleme ayarları
NODE_ENV=production
LOG_LEVEL=info

# Uyarı ayarları
ALERT_WEBHOOK_URL=https://hooks.slack.com/...
ALERT_EMAIL_FROM=alerts@myapp.com
ALERT_EMAIL_TO=admin@myapp.com

# SMTP ayarları
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Troubleshooting

### Yüksek Bellek Kullanımı
1. `/health/detailed` endpoint'ini kontrol edin
2. Memory leak detection loglarını inceleyin
3. Cache boyutunu kontrol edin
4. Manuel cleanup yapın: `memoryManager.forceCleanup()`

### Yavaş Yanıt Süreleri
1. Veritabanı sorgu performansını kontrol edin
2. Cache hit oranını inceleyin
3. CPU kullanımını kontrol edin
4. Network latency'sini ölçün

### Sistem Uyarıları
1. Alert loglarını kontrol edin
2. Otomatik kurtarma aksiyonlarının çalışıp çalışmadığını kontrol edin
3. Sistem kaynaklarını manuel olarak kontrol edin
4. Gerekirse servisi yeniden başlatın

## Best Practices

1. **Düzenli İzleme**: Dashboard'u düzenli olarak kontrol edin
2. **Eşik Ayarlama**: Uygulamanıza göre eşik değerlerini ayarlayın
3. **Log Analizi**: Performans loglarını düzenli olarak analiz edin
4. **Kapasite Planlama**: Trend analizleri yaparak kapasite planlayın
5. **Test Ortamı**: Prodüksiyon öncesi test ortamında izleme sistemini test edin

## Gelecek Geliştirmeler

- [ ] Grafana entegrasyonu
- [ ] Prometheus metrics export
- [ ] Machine learning tabanlı anomali tespiti
- [ ] Mobil uygulama için push notification
- [ ] Distributed tracing desteği
- [ ] Custom metric tanımlama
- [ ] A/B testing için performans karşılaştırması

Bu sistem sayesinde uygulamanızın sağlığını sürekli izleyebilir, sorunları önceden tespit edebilir ve otomatik kurtarma mekanizmaları ile sistem kararlılığını sağlayabilirsiniz.