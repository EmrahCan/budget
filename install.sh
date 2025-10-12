#!/bin/bash
# SRT Translator Kurulum Scripti

echo "🎬 SRT Translator Kurulum Başlıyor..."
echo "=================================="

# Python bağımlılıklarını kur
echo "📦 Python bağımlılıkları kuruluyor..."
pip3 install -r requirements.txt

# İkon oluştur
echo "🎨 Uygulama ikonu oluşturuluyor..."
python3 create_icon.py

# macOS App Bundle oluştur
echo "📱 macOS uygulaması oluşturuluyor..."
python3 setup_app.py --install

# Dock'a ekle
echo "🚢 Dock'a ekleniyor..."
python3 add_to_dock.py

echo ""
echo "🎉 KURULUM TAMAMLANDI!"
echo "======================"
echo ""
echo "✅ Desktop'ta kısayol oluşturuldu"
echo "✅ Applications klasörüne kuruldu"  
echo "✅ Dock'a eklendi"
echo "✅ Spotlight'tan aranabilir"
echo ""
echo "🚀 Kullanım yolları:"
echo "   • Desktop'taki ikona çift tıklayın"
echo "   • Dock'taki ikona tıklayın"
echo "   • Spotlight'ta 'SRT Translator' arayın"
echo "   • Applications klasöründen açın"
echo ""
echo "🎬 İyi çeviriler!"