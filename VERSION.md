# SRT Altyazı Çevirici - Version History

## Version 1.0 (2025-10-12)

### 🎬 Ana Özellikler
- **Film Arama ve Otomatik Çeviri**: Film adı yazarak otomatik altyazı bulma ve çeviri
- **Manuel SRT Çevirisi**: Mevcut SRT dosyalarını çevirme
- **Çoklu Dil Desteği**: İngilizce, Türkçe, Fransızca, Almanca, İspanyolca, İtalyanca
- **Akıllı Altyazı Seçimi**: Birden fazla altyazı bulunduğunda seçim yapabilme

### 🔍 Altyazı Kaynakları
- **OpenSubtitles.org**: Gerçek hesap entegrasyonu (emrahcandemo)
- **Subscene.com**: Web scraping ile arama
- **YIFY Subtitles**: Alternatif kaynak
- **Demo Altyazılar**: Test ve fallback amaçlı

### 💾 Dosya Yönetimi
- **Kayıt Klasörü Seçimi**: Film arama ve manuel çeviri için ayrı klasör seçimi
- **Otomatik Klasör Oluşturma**: Seçilen klasör yoksa otomatik oluşturma
- **Akıllı Dosya Adlandırma**: Çakışmaları önleyen otomatik adlandırma
- **Dosya Konumu Açma**: İşlem sonrası Finder/Explorer'da gösterme

### 🎨 Kullanıcı Arayüzü
- **Modern GUI**: tkinter tabanlı kullanıcı dostu arayüz
- **İlerleme Takibi**: Progress bar ve canlı log
- **Altyazı Seçim Penceresi**: Detaylı altyazı bilgileri ile seçim
- **Çoklu İşlem Desteği**: Thread tabanlı responsive arayüz

### ⚙️ Teknik Özellikler
- **Google Translate**: deep-translator kütüphanesi ile çeviri
- **SRT Format Desteği**: Tam SRT format uyumluluğu
- **Hata Yönetimi**: Kapsamlı hata yakalama ve kullanıcı bildirimleri
- **Web Scraping**: BeautifulSoup ile altyazı sitesi entegrasyonu

### 📦 Dosya Yapısı
```
📂 SRT Translator v1.0
├── 🎬 srt_translator_gui.py      # Ana GUI uygulaması
├── ⚙️ srt_translator.py          # Çeviri motoru
├── 🔍 subtitle_downloader.py     # Altyazı arama/indirme
├── 📋 requirements.txt           # Gerekli kütüphaneler
├── 📖 README.md                  # Kullanım kılavuzu
├── 📝 VERSION.md                 # Version geçmişi
└── 🧪 Test dosyaları             # Örnek SRT dosyaları
```

### 🚀 Kullanım Senaryoları
1. **Film İzleyicisi**: "Inception" → Otomatik Türkçe altyazı
2. **İçerik Üreticisi**: Mevcut İngilizce SRT → Türkçe çeviri
3. **Çevirmen**: Farklı dil kombinasyonları
4. **Arşiv Yöneticisi**: Toplu altyazı organizasyonu

### 🔧 Gereksinimler
- Python 3.7+
- tkinter (GUI)
- deep-translator (Çeviri)
- requests (HTTP istekleri)
- beautifulsoup4 (Web scraping)
- python-opensubtitles (API desteği)

### 📊 İstatistikler
- **Toplam Kod Satırı**: ~800 satır
- **Desteklenen Dil**: 6 dil
- **Altyazı Kaynağı**: 4 farklı kaynak
- **Test Dosyası**: 5 örnek SRT

### 🐛 Bilinen Sınırlamalar
- Cloudflare koruması nedeniyle bazı siteler erişilemez
- API rate limiting nedeniyle çeviri hızı sınırlı
- İnternet bağlantısı gerekli

### 🎯 Gelecek Planları (v2.0)
- Offline çeviri desteği
- Toplu dosya işleme
- Çeviri kalitesi ayarları
- Daha fazla altyazı kaynağı
- Çeviri önizlemesi