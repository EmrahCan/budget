#!/usr/bin/env python3
"""
SRT Translator macOS App Bundle oluşturucu
"""

import os
import shutil
import subprocess
import sys

def create_macos_app():
    """macOS .app bundle oluşturur"""
    
    app_name = "SRT Translator"
    app_dir = f"{app_name}.app"
    
    # Eski app'i sil
    if os.path.exists(app_dir):
        shutil.rmtree(app_dir)
    
    # App bundle yapısını oluştur
    contents_dir = os.path.join(app_dir, "Contents")
    macos_dir = os.path.join(contents_dir, "MacOS")
    resources_dir = os.path.join(contents_dir, "Resources")
    
    os.makedirs(macos_dir, exist_ok=True)
    os.makedirs(resources_dir, exist_ok=True)
    
    # Info.plist oluştur
    info_plist = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>SRT Translator</string>
    <key>CFBundleIdentifier</key>
    <string>com.kiro.srt-translator</string>
    <key>CFBundleName</key>
    <string>SRT Translator</string>
    <key>CFBundleDisplayName</key>
    <string>SRT Translator</string>
    <key>CFBundleVersion</key>
    <string>1.0</string>
    <key>CFBundleShortVersionString</key>
    <string>1.0</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>SRTT</string>
    <key>CFBundleIconFile</key>
    <string>app_icon</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.15</string>
    <key>NSHighResolutionCapable</key>
    <true/>
    <key>LSApplicationCategoryType</key>
    <string>public.app-category.utilities</string>
    <key>CFBundleDocumentTypes</key>
    <array>
        <dict>
            <key>CFBundleTypeExtensions</key>
            <array>
                <string>srt</string>
            </array>
            <key>CFBundleTypeName</key>
            <string>SubRip Subtitle</string>
            <key>CFBundleTypeRole</key>
            <string>Editor</string>
        </dict>
    </array>
</dict>
</plist>"""
    
    with open(os.path.join(contents_dir, "Info.plist"), "w") as f:
        f.write(info_plist)
    
    # Launcher script oluştur (Python launcher kullan)
    launcher_script = f"""#!/bin/bash
# SRT Translator Launcher

# Get the directory where this script is located
DIR="$( cd "$( dirname "${{BASH_SOURCE[0]}}" )" && pwd )"
RESOURCES_DIR="$DIR/../Resources"

# Change to resources directory
cd "$RESOURCES_DIR"

# Find Python3 executable
PYTHON_CMD=""
if command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_CMD="python"
elif [ -f "/usr/bin/python3" ]; then
    PYTHON_CMD="/usr/bin/python3"
elif [ -f "/opt/anaconda3/bin/python" ]; then
    PYTHON_CMD="/opt/anaconda3/bin/python"
else
    # Fallback: try system python
    PYTHON_CMD="/usr/bin/python3"
fi

# Run the Python launcher
exec "$PYTHON_CMD" launch_app.py 2>&1
"""
    
    launcher_path = os.path.join(macos_dir, "SRT Translator")
    with open(launcher_path, "w") as f:
        f.write(launcher_script)
    
    # Launcher'ı executable yap
    os.chmod(launcher_path, 0o755)
    
    # Python dosyalarını kopyala
    python_files = [
        "srt_translator_gui.py",
        "srt_translator.py", 
        "subtitle_downloader.py",
        "launch_app.py",
        "requirements.txt",
        "README.md"
    ]
    
    for file in python_files:
        if os.path.exists(file):
            shutil.copy2(file, resources_dir)
    
    # İkon dosyasını kopyala
    if os.path.exists("app_icon.png"):
        # PNG'yi icns'e çevir (macOS için)
        try:
            subprocess.run([
                "sips", "-s", "format", "icns", 
                "app_icon.png", "--out", 
                os.path.join(resources_dir, "app_icon.icns")
            ], check=True)
        except:
            # Fallback: PNG'yi kopyala
            shutil.copy2("app_icon.png", os.path.join(resources_dir, "app_icon.png"))
    
    print(f"✅ {app_name}.app oluşturuldu!")
    print(f"📁 Konum: {os.path.abspath(app_dir)}")
    print("🚀 Uygulamayı çalıştırmak için .app dosyasına çift tıklayın")
    
    return app_dir

def create_desktop_shortcut(app_path):
    """Desktop'a kısayol oluştur"""
    desktop_path = os.path.expanduser("~/Desktop")
    shortcut_name = "SRT Translator.app"
    shortcut_path = os.path.join(desktop_path, shortcut_name)
    
    # Eğer desktop'ta zaten varsa sil
    if os.path.exists(shortcut_path):
        if os.path.islink(shortcut_path):
            os.unlink(shortcut_path)
        else:
            shutil.rmtree(shortcut_path)
    
    # Symbolic link oluştur
    try:
        os.symlink(os.path.abspath(app_path), shortcut_path)
        print(f"✅ Desktop kısayolu oluşturuldu: {shortcut_path}")
    except:
        # Fallback: Kopyala
        shutil.copytree(app_path, shortcut_path)
        print(f"✅ Desktop'a kopyalandı: {shortcut_path}")

def install_to_applications():
    """Applications klasörüne kur"""
    app_name = "SRT Translator.app"
    applications_path = "/Applications"
    target_path = os.path.join(applications_path, app_name)
    
    if os.path.exists(app_name):
        try:
            # Eğer Applications'da zaten varsa sil
            if os.path.exists(target_path):
                shutil.rmtree(target_path)
            
            # Applications'a kopyala
            shutil.copytree(app_name, target_path)
            print(f"✅ Applications klasörüne kuruldu: {target_path}")
            print("🔍 Spotlight'tan 'SRT Translator' arayarak bulabilirsiniz")
            return True
        except PermissionError:
            print("❌ Applications klasörüne yazma izni yok")
            print("💡 Sudo ile çalıştırmayı deneyin: sudo python3 setup_app.py")
            return False
    return False

if __name__ == "__main__":
    print("🎬 SRT Translator macOS App Bundle oluşturuluyor...")
    
    # App bundle oluştur
    app_path = create_macos_app()
    
    # Desktop kısayolu oluştur
    create_desktop_shortcut(app_path)
    
    # Applications'a kurmayı dene
    if "--install" in sys.argv:
        install_to_applications()
    else:
        print("\n💡 Applications klasörüne kurmak için:")
        print("   python3 setup_app.py --install")
    
    print("\n🎉 Kurulum tamamlandı!")
    print("📱 Artık Desktop'taki ikona tıklayarak uygulamayı açabilirsiniz")