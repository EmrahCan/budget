#!/opt/anaconda3/bin/python
"""
SRT Translator Auto-Install Launcher
Gerekli modülleri otomatik yükler ve uygulamayı başlatır
"""

import os
import sys
import subprocess
import tkinter as tk
from tkinter import messagebox

def install_requirements():
    """Gerekli modülleri yükler"""
    requirements = [
        'deep-translator',
        'requests', 
        'beautifulsoup4',
        'Pillow'
    ]
    
    for package in requirements:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            print(f"📦 {package} yükleniyor...")
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                print(f"✅ {package} yüklendi")
            except subprocess.CalledProcessError:
                print(f"❌ {package} yüklenemedi")
                return False
    
    return True

def main():
    try:
        # Script dizinini al
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        print("🎬 SRT Translator başlatılıyor...")
        print("📦 Gerekli modüller kontrol ediliyor...")
        
        # Gerekli modülleri yükle
        if not install_requirements():
            root = tk.Tk()
            root.withdraw()
            messagebox.showerror("Hata", "Gerekli modüller yüklenemedi!")
            return
        
        print("✅ Tüm modüller hazır")
        print("🚀 GUI başlatılıyor...")
        
        # GUI modülünü import et ve çalıştır
        sys.path.insert(0, script_dir)
        
        # GUI'yi başlat
        from srt_translator_gui import main as gui_main
        gui_main()
        
    except ImportError as e:
        # Hata durumunda basit mesaj göster
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Hata", f"SRT Translator başlatılamadı:\n{e}")
        
    except Exception as e:
        # Genel hata
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Hata", f"Beklenmeyen hata:\n{e}")

if __name__ == "__main__":
    main()