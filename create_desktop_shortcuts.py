#!/usr/bin/env python3
"""
SRT Translator - Desktop Shortcuts Creator
Creates desktop shortcuts for both GUI and Web versions
"""

import os
import subprocess
import sys
from pathlib import Path

def create_desktop_shortcuts():
    """Create desktop shortcuts for SRT Translator applications"""
    
    # Get current directory and desktop path
    current_dir = os.getcwd()
    desktop_path = os.path.expanduser("~/Desktop")
    
    print("🖥️  SRT Translator - Desktop Shortcuts Creator")
    print("=" * 50)
    
    # GUI Application Shortcut
    gui_script_content = f"""#!/bin/bash
cd "{current_dir}"
python3 srt_translator_gui.py
"""
    
    gui_shortcut_path = os.path.join(desktop_path, "SRT Translator GUI.command")
    
    try:
        with open(gui_shortcut_path, 'w') as f:
            f.write(gui_script_content)
        
        # Make executable
        os.chmod(gui_shortcut_path, 0o755)
        print(f"✅ GUI Shortcut created: {gui_shortcut_path}")
        
    except Exception as e:
        print(f"❌ GUI Shortcut failed: {e}")
    
    # Web Application Shortcut
    web_script_content = f"""#!/bin/bash
cd "{current_dir}"
echo "🌐 Starting SRT Translator Web Server..."
echo "📱 Web interface will open at: http://localhost:5001"
echo "⏹️  Press Ctrl+C to stop the server"
echo ""
python3 web_app.py
"""
    
    web_shortcut_path = os.path.join(desktop_path, "SRT Translator Web.command")
    
    try:
        with open(web_shortcut_path, 'w') as f:
            f.write(web_script_content)
        
        # Make executable
        os.chmod(web_shortcut_path, 0o755)
        print(f"✅ Web Shortcut created: {web_shortcut_path}")
        
    except Exception as e:
        print(f"❌ Web Shortcut failed: {e}")
    
    # Browser Shortcut (opens web interface directly)
    browser_script_content = f"""#!/bin/bash
cd "{current_dir}"
echo "🚀 Starting SRT Translator and opening browser..."

# Start web server in background
python3 web_app.py &
WEB_PID=$!

# Wait a moment for server to start
sleep 3

# Open browser
open http://localhost:5001

echo "🌐 Web interface opened in browser"
echo "⏹️  Close this terminal to stop the server"

# Wait for web server
wait $WEB_PID
"""
    
    browser_shortcut_path = os.path.join(desktop_path, "SRT Translator (Browser).command")
    
    try:
        with open(browser_shortcut_path, 'w') as f:
            f.write(browser_script_content)
        
        # Make executable
        os.chmod(browser_shortcut_path, 0o755)
        print(f"✅ Browser Shortcut created: {browser_shortcut_path}")
        
    except Exception as e:
        print(f"❌ Browser Shortcut failed: {e}")
    
    print("\n🎉 Desktop shortcuts created successfully!")
    print("\n📋 Available shortcuts:")
    print("   • SRT Translator GUI.command - Opens desktop application")
    print("   • SRT Translator Web.command - Starts web server")
    print("   • SRT Translator (Browser).command - Starts web server and opens browser")
    
    # Try to set custom icons if available
    if os.path.exists("app_icon.png"):
        print("\n🎨 Setting custom icons...")
        try:
            # Use macOS specific icon setting
            for shortcut in [gui_shortcut_path, web_shortcut_path, browser_shortcut_path]:
                subprocess.run([
                    "sips", "-i", "app_icon.png"
                ], capture_output=True)
                
                subprocess.run([
                    "DeRez", "-only", "icns", "app_icon.png"
                ], capture_output=True)
                
            print("✅ Custom icons applied")
        except:
            print("⚠️  Custom icons not applied (optional)")

if __name__ == "__main__":
    create_desktop_shortcuts()