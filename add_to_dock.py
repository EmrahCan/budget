#!/usr/bin/env python3
"""
SRT Translator'ı Dock'a ekler
"""

import subprocess
import os

def add_to_dock():
    """Uygulamayı Dock'a ekler"""
    app_path = "/Applications/SRT Translator.app"
    
    if not os.path.exists(app_path):
        print("❌ Uygulama Applications klasöründe bulunamadı")
        return False
    
    try:
        # Dock'a ekle
        subprocess.run([
            "defaults", "write", "com.apple.dock", "persistent-apps", "-array-add",
            f"<dict><key>tile-data</key><dict><key>file-data</key><dict><key>_CFURLString</key><string>{app_path}</string><key>_CFURLStringType</key><integer>0</integer></dict></dict></dict>"
        ], check=True)
        
        # Dock'u yeniden başlat
        subprocess.run(["killall", "Dock"], check=True)
        
        print("✅ SRT Translator Dock'a eklendi!")
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Dock'a ekleme hatası: {e}")
        return False

if __name__ == "__main__":
    print("🚢 SRT Translator Dock'a ekleniyor...")
    add_to_dock()