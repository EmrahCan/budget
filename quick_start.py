#!/usr/bin/env python3
"""
SRT Translator Quick Start
GitHub'dan indirdikten sonra hızlı başlangıç için
"""

import subprocess
import sys
import os

def install_requirements():
    """Gerekli kütüphaneleri yükler"""
    print("📦 Gerekli kütüphaneler yükleniyor...")
    try:
        subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', 'requirements.txt'])
        print("✅ Kütüphaneler başarıyla yüklendi!")
        return True
    except subprocess.CalledProcessError:
        print("❌ Kütüphane yükleme hatası!")
        return False

def start_app():
    """Uygulamayı başlatır"""
    print("🚀 SRT Translator başlatılıyor...")
    try:
        subprocess.run([sys.executable, 'srt_translator_gui.py'])
    except KeyboardInterrupt:
        print("\n👋 Uygulama kapatıldı")
    except Exception as e:
        print(f"❌ Başlatma hatası: {e}")

def main():
    print("🎬 SRT Translator Quick Start")
    print("=" * 40)
    
    if not os.path.exists('requirements.txt'):
        print("❌ requirements.txt bulunamadı!")
        print("Lütfen doğru klasörde olduğunuzdan emin olun.")
        return
    
    if not os.path.exists('srt_translator_gui.py'):
        print("❌ srt_translator_gui.py bulunamadı!")
        print("Lütfen doğru klasörde olduğunuzdan emin olun.")
        return
    
    # Kütüphaneleri yükle
    if install_requirements():
        print("\n🎉 Kurulum tamamlandı!")
        print("🚀 Uygulama başlatılıyor...\n")
        start_app()
    else:
        print("\n💡 Manuel kurulum:")
        print("   pip install -r requirements.txt")
        print("   python srt_translator_gui.py")

if __name__ == "__main__":
    main()