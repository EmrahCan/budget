#!/usr/bin/env python3
"""
SRT Translator Python Launcher
"""

import os
import sys
import subprocess

def main():
    # Script'in bulunduğu dizini al
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    # GUI dosyasının yolunu belirle
    gui_file = os.path.join(script_dir, "srt_translator_gui.py")
    
    if not os.path.exists(gui_file):
        print(f"❌ GUI dosyası bulunamadı: {gui_file}")
        return 1
    
    # Çalışma dizinini değiştir
    os.chdir(script_dir)
    
    # GUI'yi çalıştır
    try:
        subprocess.run([sys.executable, gui_file], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Uygulama çalıştırılamadı: {e}")
        return 1
    except KeyboardInterrupt:
        print("👋 Uygulama kapatıldı")
        return 0
    
    return 0

if __name__ == "__main__":
    sys.exit(main())