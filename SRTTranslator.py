#!/opt/anaconda3/bin/python
"""
SRT Translator Desktop Launcher
"""

import os
import sys
import tkinter as tk
from tkinter import messagebox

def main():
    try:
        # Script dizinini al
        script_dir = os.path.dirname(os.path.abspath(__file__))
        os.chdir(script_dir)
        
        # GUI modülünü import et ve çalıştır
        sys.path.insert(0, script_dir)
        
        # GUI'yi başlat
        from srt_translator_gui import main as gui_main
        gui_main()
        
    except ImportError as e:
        # Hata durumunda basit mesaj göster
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Hata", f"SRT Translator başlatılamadı:\n{e}\n\nGerekli modüller:\n• deep-translator\n• requests\n• beautifulsoup4\n\nKurulum: pip install -r requirements.txt")
        
    except Exception as e:
        # Genel hata
        root = tk.Tk()
        root.withdraw()
        messagebox.showerror("Hata", f"Beklenmeyen hata:\n{e}")

if __name__ == "__main__":
    main()