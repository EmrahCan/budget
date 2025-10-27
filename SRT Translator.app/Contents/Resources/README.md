# SRT Altyazı Çevirici v1.0

🎬 Film altyazılarını otomatik bulan ve çeviren Python uygulaması

## ✨ Özellikler

### 🎯 Ana Fonksiyonlar
- **🔍 Film Arama**: Film adı yazarak otomatik altyazı bulma
- **📝 Manuel Çeviri**: Mevcut SRT dosyalarını çevirme  
- **🌍 Çoklu Dil**: 6 farklı dil desteği (EN, TR, FR, DE, ES, IT)
- **📂 Kayıt Klasörü**: Çıktı dosyaları için klasör seçimi

### 🔗 Altyazı Kaynakları
- **OpenSubtitles.org**: Gerçek hesap entegrasyonu
- **Subscene.com**: Web scraping ile arama
- **YIFY Subtitles**: Alternatif kaynak
- **Demo Altyazılar**: Test ve fallback

### 🎨 Kullanıcı Arayüzü
- Modern GUI tasarım
- İlerleme çubuğu ve canlı log
- Altyazı seçim penceresi
- Dosya konumu açma özelliği

## 🚀 Kurulum

1. **Gerekli kütüphaneleri yükleyin:**
```bash
pip install -r requirements.txt
```

2. **GUI uygulamasını başlatın:**
```bash
python srt_translator_gui.py
```

## 📖 Kullanım

### 🎬 Film Altyazısı Bulma
1. Film adını yazın (örn: "Inception")
2. Kayıt klasörünü seçin
3. "Altyazı Bul ve Çevir" butonuna tıklayın
4. Listeden altyazı seçin
5. Çeviri otomatik başlar

### 📝 Manuel SRT Çevirisi
1. "Mevcut SRT Dosyası Çevir" bölümünden dosya seçin
2. Çıktı klasörünü belirleyin
3. Dil seçimi yapın
4. "Dosya Çevirisini Başlat" butonuna tıklayın

### 🎛️ Komut Satırı (Opsiyonel)
```bash
# Basit çeviri
python srt_translator.py movie.srt

# Özel çıktı dosyası
python srt_translator.py movie.srt turkce_altyazi.srt
```

## 📦 Dosya Yapısı

```
📂 SRT Translator v1.0
├── 🎬 srt_translator_gui.py      # Ana GUI uygulaması
├── ⚙️ srt_translator.py          # Çeviri motoru  
├── 🔍 subtitle_downloader.py     # Altyazı arama/indirme
├── 📋 requirements.txt           # Gerekli kütüphaneler
├── 📖 README.md                  # Bu dosya
├── 📝 VERSION.md                 # Version geçmişi
└── 🧪 Örnek dosyalar             # Test SRT'leri
```

## 🔧 Gereksinimler

- **Python**: 3.7 veya üzeri
- **İnternet**: Çeviri ve altyazı indirme için
- **Kütüphaneler**: requirements.txt'de listelenen

## 🎯 Kullanım Senaryoları

- **🎭 Film İzleyicisi**: Yabancı filmlere Türkçe altyazı
- **📺 İçerik Üreticisi**: Mevcut altyazıları çevirme
- **🌐 Çevirmen**: Farklı dil kombinasyonları
- **📚 Arşiv Yöneticisi**: Toplu altyazı organizasyonu

## 🐛 Bilinen Sınırlamalar

- Cloudflare koruması nedeniyle bazı siteler erişilemez
- API rate limiting nedeniyle çeviri hızı sınırlı
- İnternet bağlantısı gerekli

## 🔮 Gelecek Planları (v2.0)

- Offline çeviri desteği
- Toplu dosya işleme  
- Çeviri kalitesi ayarları
- Daha fazla altyazı kaynağı
- Çeviri önizlemesi

## 📊 Version 1.0 İstatistikleri

- **Kod Satırı**: ~800 satır
- **Desteklenen Dil**: 6 dil
- **Altyazı Kaynağı**: 4 kaynak
- **Test Dosyası**: 5 örnek

---

**🎬 İyi seyirler! Artık hiçbir film altyazısız kalmayacak!**