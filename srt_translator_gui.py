#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SRT Altyazı Çevirici - GUI Versiyonu v1.0
İngilizce SRT dosyalarını Türkçe'ye çeviren grafik arayüzlü uygulama

Version: 1.0
Date: 2025-10-12
Author: Kiro AI Assistant
Features: Film arama, çoklu dil desteği, kayıt klasörü seçimi
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import threading
import os
from srt_translator import SRTTranslator
from deep_translator import GoogleTranslator
from subtitle_downloader import SubtitleDownloader

class SRTTranslatorGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("🎬 SRT Altyazı Çevirici v1.1")
        self.root.geometry("900x700")
        self.root.resizable(True, True)
        
        # Modern tema ve renkler
        self.setup_theme()
        
        # Translator instance
        self.translator = SRTTranslator()
        self.downloader = SubtitleDownloader()
        self.is_translating = False
        self.stop_requested = False
        
        self.setup_ui()
        
    def setup_theme(self):
        """Modern tema ve stil ayarları"""
        # Daha okunabilir modern renkler
        self.colors = {
            'primary': '#1976D2',      # Koyu mavi (daha okunabilir)
            'secondary': '#F57C00',    # Koyu turuncu
            'success': '#388E3C',      # Koyu yeşil (daha okunabilir)
            'danger': '#D32F2F',       # Koyu kırmızı
            'warning': '#F9A825',      # Koyu sarı (daha okunabilir)
            'info': '#0097A7',         # Koyu cyan
            'light': '#FAFAFA',        # Açık gri
            'dark': '#424242',         # Orta koyu gri (daha okunabilir)
            'text_dark': '#212121',    # Çok koyu metin
            'background': '#F5F5F5',   # Daha yumuşak arka plan
            'surface': '#FFFFFF',      # Beyaz yüzey
            'border': '#E0E0E0',       # Açık gri border
            'hover': '#E3F2FD'         # Hover efekti için açık mavi
        }
        
        # Ana pencere arka plan
        self.root.configure(bg=self.colors['background'])
        
        # Stil oluştur
        style = ttk.Style()
        style.theme_use('clam')
        
        # Custom stiller - daha okunabilir
        style.configure('Title.TLabel', 
                       font=('Helvetica', 20, 'bold'),
                       foreground=self.colors['text_dark'],
                       background=self.colors['background'])
        
        style.configure('Subtitle.TLabel',
                       font=('Helvetica', 12, 'bold'),
                       foreground=self.colors['text_dark'])
        
        # Entry stilleri
        style.configure('Modern.TEntry',
                       font=('Helvetica', 11),
                       fieldbackground=self.colors['surface'],
                       borderwidth=1,
                       relief='solid')
        
        # Combobox stilleri
        style.configure('Modern.TCombobox',
                       font=('Helvetica', 10),
                       fieldbackground=self.colors['surface'],
                       borderwidth=1,
                       relief='solid')
        
        # LabelFrame stilleri - daha yumuşak
        style.configure('Modern.TLabelframe',
                       background=self.colors['surface'],
                       relief='solid',
                       borderwidth=1,
                       bordercolor=self.colors['border'])
        
        style.configure('Modern.TLabelframe.Label',
                       font=('Helvetica', 12, 'bold'),
                       foreground=self.colors['primary'],
                       background=self.colors['surface'],
                       padding=(10, 5))
        
    def setup_ui(self):
        """Kullanıcı arayüzünü oluşturur"""
        # Ana frame
        main_frame = ttk.Frame(self.root, padding="20")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        main_frame.configure(style='Modern.TFrame')
        
        # Header bölümü
        header_frame = tk.Frame(main_frame, bg=self.colors['primary'], height=80)
        header_frame.grid(row=0, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 20))
        header_frame.grid_propagate(False)
        
        # Başlık ve ikon
        title_frame = tk.Frame(header_frame, bg=self.colors['primary'])
        title_frame.pack(expand=True, fill='both')
        
        # Film ikonu (emoji)
        icon_label = tk.Label(title_frame, text="🎬", font=('Arial', 32), 
                             bg=self.colors['primary'], fg='white')
        icon_label.pack(side='left', padx=20, pady=10)
        
        # Başlık metni
        title_container = tk.Frame(title_frame, bg=self.colors['primary'])
        title_container.pack(side='left', fill='both', expand=True, pady=10)
        
        title_label = tk.Label(title_container, text="SRT Altyazı Çevirici", 
                              font=('Helvetica', 24, 'bold'),
                              bg=self.colors['primary'], fg='white')
        title_label.pack(anchor='w')
        
        subtitle_label = tk.Label(title_container, text="🌍 Film altyazılarını otomatik bul ve çevir", 
                                 font=('Helvetica', 12),
                                 bg=self.colors['primary'], fg='white')
        subtitle_label.pack(anchor='w')
        
        # Version badge
        version_label = tk.Label(title_frame, text="v1.1", 
                                font=('Helvetica', 10, 'bold'),
                                bg=self.colors['warning'], fg='black',
                                padx=8, pady=4)
        version_label.pack(side='right', padx=20, pady=20)
        
        # Film arama bölümü
        search_frame = ttk.LabelFrame(main_frame, text="🔍 Film Altyazısı Bul", 
                                     padding="15", style='Modern.TLabelframe')
        search_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Film adı girişi
        movie_label = tk.Label(search_frame, text="🎭 Film Adı:", 
                              font=('Helvetica', 11, 'bold'),
                              bg=self.colors['surface'], fg=self.colors['text_dark'])
        movie_label.grid(row=0, column=0, sticky=tk.W, pady=8)
        
        self.movie_name_var = tk.StringVar()
        movie_entry = ttk.Entry(search_frame, textvariable=self.movie_name_var, 
                               width=45, font=('Helvetica', 11), style='Modern.TEntry')
        movie_entry.grid(row=0, column=1, padx=(15, 10), pady=8, sticky=(tk.W, tk.E))
        
        self.search_btn = tk.Button(search_frame, text="🚀 Altyazı Bul ve Çevir", 
                                   command=self.search_and_translate,
                                   font=('Helvetica', 11, 'bold'),
                                   bg=self.colors['primary'], fg='black',
                                   padx=15, pady=8, relief='flat',
                                   cursor='hand2')
        self.search_btn.grid(row=0, column=2, padx=10, pady=8)
        
        # Kayıt klasörü seçimi
        folder_label = tk.Label(search_frame, text="📁 Kayıt Klasörü:", 
                               font=('Helvetica', 11, 'bold'),
                               bg=self.colors['surface'], fg=self.colors['text_dark'])
        folder_label.grid(row=1, column=0, sticky=tk.W, pady=8)
        
        self.save_folder_var = tk.StringVar(value=os.getcwd())
        save_folder_entry = ttk.Entry(search_frame, textvariable=self.save_folder_var, 
                                     width=45, font=('Helvetica', 11), style='Modern.TEntry')
        save_folder_entry.grid(row=1, column=1, padx=(15, 10), pady=8, sticky=(tk.W, tk.E))
        
        save_folder_btn = tk.Button(search_frame, text="📂 Gözat", 
                                   command=self.browse_save_folder,
                                   font=('Helvetica', 10, 'bold'),
                                   bg=self.colors['secondary'], fg='black',
                                   padx=12, pady=6, relief='flat',
                                   cursor='hand2')
        save_folder_btn.grid(row=1, column=2, padx=10, pady=8)
        
        # Ayırıcı bölümü
        separator_frame = tk.Frame(main_frame, bg=self.colors['background'], height=50)
        separator_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=15)
        
        # Çizgi ve VEYA etiketi
        line1 = tk.Frame(separator_frame, bg=self.colors['primary'], height=2)
        line1.place(relx=0, rely=0.5, relwidth=0.4)
        
        or_label = tk.Label(separator_frame, text="VEYA", 
                           font=('Helvetica', 12, 'bold'),
                           bg=self.colors['background'], fg=self.colors['primary'])
        or_label.place(relx=0.5, rely=0.5, anchor='center')
        
        line2 = tk.Frame(separator_frame, bg=self.colors['primary'], height=2)
        line2.place(relx=0.6, rely=0.5, relwidth=0.4)
        
        # Dosya seçimi bölümü
        file_frame = ttk.LabelFrame(main_frame, text="📄 Mevcut SRT Dosyası Çevir", 
                                   padding="15", style='Modern.TLabelframe')
        file_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Input dosyası
        input_label = tk.Label(file_frame, text="📎 SRT Dosyası:", 
                              font=('Helvetica', 11, 'bold'),
                              bg=self.colors['surface'], fg=self.colors['text_dark'])
        input_label.grid(row=0, column=0, sticky=tk.W, pady=8)
        
        self.input_file_var = tk.StringVar()
        input_entry = ttk.Entry(file_frame, textvariable=self.input_file_var, 
                               width=50, font=('Helvetica', 11), style='Modern.TEntry')
        input_entry.grid(row=0, column=1, padx=(15, 10), pady=8, sticky=(tk.W, tk.E))
        
        input_browse_btn = tk.Button(file_frame, text="📁 Gözat", 
                                    command=self.browse_input_file,
                                    font=('Helvetica', 10, 'bold'),
                                    bg=self.colors['secondary'], fg='black',
                                    padx=12, pady=6, relief='flat',
                                    cursor='hand2')
        input_browse_btn.grid(row=0, column=2, padx=10, pady=8)
        
        # Output dosyası
        output_label = tk.Label(file_frame, text="💾 Çıktı Dosyası:", 
                               font=('Helvetica', 11, 'bold'),
                               bg=self.colors['surface'], fg=self.colors['text_dark'])
        output_label.grid(row=1, column=0, sticky=tk.W, pady=8)
        
        self.output_file_var = tk.StringVar()
        output_entry = ttk.Entry(file_frame, textvariable=self.output_file_var, 
                                width=50, font=('Helvetica', 11), style='Modern.TEntry')
        output_entry.grid(row=1, column=1, padx=(15, 10), pady=8, sticky=(tk.W, tk.E))
        
        output_browse_btn = tk.Button(file_frame, text="💾 Gözat", 
                                     command=self.browse_output_file,
                                     font=('Helvetica', 10, 'bold'),
                                     bg=self.colors['secondary'], fg='black',
                                     padx=12, pady=6, relief='flat',
                                     cursor='hand2')
        output_browse_btn.grid(row=1, column=2, padx=10, pady=8)
        
        # Manuel çeviri için kayıt klasörü
        manual_folder_label = tk.Label(file_frame, text="📁 Kayıt Klasörü:", 
                                      font=('Helvetica', 11, 'bold'),
                                      bg=self.colors['surface'], fg=self.colors['text_dark'])
        manual_folder_label.grid(row=2, column=0, sticky=tk.W, pady=8)
        
        self.manual_save_folder_var = tk.StringVar(value=os.getcwd())
        manual_save_entry = ttk.Entry(file_frame, textvariable=self.manual_save_folder_var, 
                                     width=50, font=('Helvetica', 11), style='Modern.TEntry')
        manual_save_entry.grid(row=2, column=1, padx=(15, 10), pady=8, sticky=(tk.W, tk.E))
        
        manual_save_btn = tk.Button(file_frame, text="📂 Gözat", 
                                   command=self.browse_manual_save_folder,
                                   font=('Helvetica', 10, 'bold'),
                                   bg=self.colors['secondary'], fg='black',
                                   padx=12, pady=6, relief='flat',
                                   cursor='hand2')
        manual_save_btn.grid(row=2, column=2, padx=10, pady=8)
        
        # Manuel çeviri başlat butonu
        manual_translate_frame = tk.Frame(file_frame, bg=self.colors['surface'])
        manual_translate_frame.grid(row=3, column=0, columnspan=3, pady=15)
        
        # Manuel çeviri butonları container
        manual_buttons_container = tk.Frame(manual_translate_frame, bg=self.colors['surface'])
        manual_buttons_container.pack()
        
        self.manual_translate_btn = tk.Button(manual_buttons_container, text="🚀 SRT Dosyasını Çevir", 
                                             command=self.start_translation,
                                             font=('Helvetica', 12, 'bold'),
                                             bg=self.colors['success'], fg='black',
                                             padx=25, pady=12, relief='flat',
                                             cursor='hand2')
        self.manual_translate_btn.pack(side='left', padx=(0, 10))
        
        # Stop butonu (başlangıçta gizli)
        self.manual_stop_btn = tk.Button(manual_buttons_container, text="⏹️ Durdur", 
                                        command=self.stop_translation,
                                        font=('Helvetica', 12, 'bold'),
                                        bg=self.colors['danger'], fg='black',
                                        padx=25, pady=12, relief='flat',
                                        cursor='hand2')
        # Başlangıçta gizli
        self.manual_stop_btn.pack_forget()
        
        # Dil seçimi
        lang_frame = ttk.LabelFrame(main_frame, text="🌍 Dil Seçimi", 
                                   padding="15", style='Modern.TLabelframe')
        lang_frame.grid(row=5, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Dil seçimi - daha görsel
        lang_container = tk.Frame(lang_frame, bg=self.colors['surface'])
        lang_container.grid(row=0, column=0, columnspan=4, sticky=(tk.W, tk.E), pady=10)
        
        # Kaynak dil
        source_frame = tk.Frame(lang_container, bg=self.colors['info'], padx=15, pady=10)
        source_frame.pack(side='left', padx=(0, 20))
        
        tk.Label(source_frame, text="🔤 Kaynak Dil", font=('Helvetica', 11, 'bold'),
                bg=self.colors['info'], fg='white').pack()
        
        self.source_lang_var = tk.StringVar(value="en")
        source_combo = ttk.Combobox(source_frame, textvariable=self.source_lang_var, 
                                   values=["en", "fr", "de", "es", "it"], width=12,
                                   font=('Helvetica', 10), style='Modern.TCombobox')
        source_combo.pack(pady=(5, 0))
        
        # Ok işareti
        arrow_label = tk.Label(lang_container, text="➡️", font=('Arial', 20),
                              bg=self.colors['surface'])
        arrow_label.pack(side='left', padx=10)
        
        # Hedef dil
        target_frame = tk.Frame(lang_container, bg=self.colors['success'], padx=15, pady=10)
        target_frame.pack(side='left', padx=(20, 0))
        
        tk.Label(target_frame, text="🎯 Hedef Dil", font=('Helvetica', 11, 'bold'),
                bg=self.colors['success'], fg='white').pack()
        
        self.target_lang_var = tk.StringVar(value="tr")
        target_combo = ttk.Combobox(target_frame, textvariable=self.target_lang_var,
                                   values=["tr", "en", "fr", "de", "es", "it"], width=12,
                                   font=('Helvetica', 10), style='Modern.TCombobox')
        target_combo.pack(pady=(5, 0))
        
        # Hız ayarları
        speed_frame = tk.Frame(lang_container, bg=self.colors['warning'], padx=15, pady=10)
        speed_frame.pack(side='left', padx=(20, 0))
        
        tk.Label(speed_frame, text="⚡ Çeviri Hızı", font=('Helvetica', 11, 'bold'),
                bg=self.colors['warning'], fg='black').pack()
        
        self.speed_var = tk.StringVar(value="normal")
        speed_combo = ttk.Combobox(speed_frame, textvariable=self.speed_var,
                                  values=["slow", "normal", "fast", "turbo"], width=10,
                                  font=('Helvetica', 10), style='Modern.TCombobox')
        speed_combo.pack(pady=(5, 0))
        

        
        # Progress bölümü
        progress_frame = ttk.LabelFrame(main_frame, text="📊 İşlem Durumu", 
                                       padding="15", style='Modern.TLabelframe')
        progress_frame.grid(row=6, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 15))
        
        # Status label
        self.status_var = tk.StringVar(value="✅ Hazır")
        status_label = tk.Label(progress_frame, textvariable=self.status_var,
                               font=('Helvetica', 12, 'bold'),
                               bg=self.colors['surface'], fg=self.colors['primary'])
        status_label.grid(row=0, column=0, columnspan=3, pady=(0, 10))
        
        # Progress bar - daha büyük ve renkli
        self.progress_var = tk.DoubleVar()
        progress_container = tk.Frame(progress_frame, bg=self.colors['surface'])
        progress_container.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=5)
        
        self.progress_bar = ttk.Progressbar(progress_container, variable=self.progress_var, 
                                           maximum=100, length=400, mode='determinate')
        self.progress_bar.pack(fill='x', padx=10)
        
        # Progress yüzdesi
        self.progress_text = tk.Label(progress_container, text="0%",
                                     font=('Helvetica', 10, 'bold'),
                                     bg=self.colors['surface'], fg=self.colors['primary'])
        self.progress_text.pack(pady=(5, 0))
        
        # Log alanı - daha modern
        log_frame = ttk.LabelFrame(main_frame, text="📝 İşlem Günlüğü", 
                                  padding="15", style='Modern.TLabelframe')
        log_frame.grid(row=7, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 0))
        
        # Log text area - daha okunabilir renkler
        self.log_text = scrolledtext.ScrolledText(log_frame, height=12, width=80,
                                                 font=('Consolas', 10),
                                                 bg='#FAFAFA', fg=self.colors['text_dark'],
                                                 insertbackground=self.colors['primary'],
                                                 selectbackground=self.colors['hover'],
                                                 relief='solid', borderwidth=1)
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # Log'a başlangıç mesajı
        self.log_text.insert(tk.END, "🎬 SRT Altyazı Çevirici v1.1 - TURBO EDİTİON başlatıldı\n")
        self.log_text.insert(tk.END, "✨ Film adı girin veya SRT dosyası seçin\n")
        self.log_text.insert(tk.END, "🌍 Desteklenen diller: EN, TR, FR, DE, ES, IT\n")
        self.log_text.insert(tk.END, "⚡ Hız seçenekleri: SLOW, NORMAL, FAST, TURBO\n")
        self.log_text.insert(tk.END, "🚀 Batch çeviri ile 5-10x daha hızlı!\n")
        self.log_text.insert(tk.END, "=" * 60 + "\n")
        
        # Grid weights
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        main_frame.rowconfigure(7, weight=1)
        search_frame.columnconfigure(1, weight=1)
        file_frame.columnconfigure(1, weight=1)
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
    def browse_input_file(self):
        """Input dosyası seçimi"""
        filename = filedialog.askopenfilename(
            title="SRT Dosyası Seçin",
            filetypes=[("SRT files", "*.srt"), ("All files", "*.*")]
        )
        if filename:
            self.input_file_var.set(filename)
            # Otomatik output dosyası öner
            if not self.output_file_var.get():
                name, ext = os.path.splitext(os.path.basename(filename))
                save_folder = self.manual_save_folder_var.get()
                output_filename = f"{name}_tr{ext}"
                output_path = os.path.join(save_folder, output_filename)
                self.output_file_var.set(output_path)
    
    def browse_output_file(self):
        """Output dosyası seçimi"""
        filename = filedialog.asksaveasfilename(
            title="Çıktı Dosyası Seçin",
            defaultextension=".srt",
            filetypes=[("SRT files", "*.srt"), ("All files", "*.*")]
        )
        if filename:
            self.output_file_var.set(filename)
    
    def browse_save_folder(self):
        """Film arama için kayıt klasörü seçimi"""
        folder = filedialog.askdirectory(
            title="Çevrilmiş Dosyaların Kaydedileceği Klasörü Seçin",
            initialdir=self.save_folder_var.get()
        )
        if folder:
            self.save_folder_var.set(folder)
    
    def browse_manual_save_folder(self):
        """Manuel çeviri için kayıt klasörü seçimi"""
        folder = filedialog.askdirectory(
            title="Çevrilmiş Dosyaların Kaydedileceği Klasörü Seçin",
            initialdir=self.manual_save_folder_var.get()
        )
        if folder:
            self.manual_save_folder_var.set(folder)
    
    def stop_translation(self):
        """Çeviri işlemini durdurur"""
        self.stop_requested = True
        self.status_var.set("⏹️ Durdurma isteği gönderildi...")
        self.log_message("⏹️ Kullanıcı tarafından durdurma isteği gönderildi")
        self.log_message("⏳ Mevcut işlem tamamlandıktan sonra durduruluyor...")
    
    def log_message(self, message):
        """Log alanına mesaj ekler"""
        import datetime
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.log_text.insert(tk.END, f"[{timestamp}] {message}\n")
        self.log_text.see(tk.END)
        self.root.update_idletasks()
    
    def update_progress(self, value):
        """Progress bar ve yüzde metnini günceller"""
        self.progress_var.set(value)
        self.progress_text.config(text=f"{int(value)}%")
        
        # Progress bar rengini değiştir
        if value < 30:
            color = self.colors['danger']
        elif value < 70:
            color = self.colors['warning'] 
        else:
            color = self.colors['success']
            
        self.root.update_idletasks()
    
    def start_translation(self):
        """Çeviri işlemini başlatır"""
        if self.is_translating:
            return
            
        input_file = self.input_file_var.get()
        output_file = self.output_file_var.get()
        
        if not input_file:
            messagebox.showerror("Hata", "Lütfen bir SRT dosyası seçin!")
            return
            
        if not output_file:
            messagebox.showerror("Hata", "Lütfen çıktı dosyası belirtin!")
            return
            
        if not os.path.exists(input_file):
            messagebox.showerror("Hata", "Seçilen dosya bulunamadı!")
            return
        
        # Çıktı klasörünün var olduğundan emin ol
        output_dir = os.path.dirname(output_file)
        if output_dir and not os.path.exists(output_dir):
            try:
                os.makedirs(output_dir, exist_ok=True)
            except Exception as e:
                messagebox.showerror("Hata", f"Çıktı klasörü oluşturulamadı: {e}")
                return
        
        # Çeviri işlemini ayrı thread'de başlat
        self.is_translating = True
        self.stop_requested = False
        
        # Butonları güncelle
        self.manual_translate_btn.pack_forget()  # Çevir butonunu gizle
        self.manual_stop_btn.pack(side='left')   # Stop butonunu göster
        
        self.search_btn.config(state="disabled", bg=self.colors['warning'])
        self.update_progress(0)
        self.status_var.set("🔄 İşlem başlatılıyor...")
        
        # Log'u temizle ve başlangıç mesajı ekle
        self.log_text.delete(1.0, tk.END)
        self.log_message("=" * 60)
        self.log_message("🚀 MANUEL ÇEVİRİ İŞLEMİ BAŞLATILDI")
        self.log_message(f"📁 Kaynak dosya: {input_file}")
        self.log_message(f"💾 Hedef dosya: {output_file}")
        self.log_message(f"🌍 {self.source_lang_var.get().upper()} → {self.target_lang_var.get().upper()}")
        self.log_message("⏹️ İşlemi durdurmak için 'Durdur' butonuna tıklayın")
        self.log_message("=" * 60)
        
        thread = threading.Thread(target=self.translate_file, 
                                 args=(input_file, output_file))
        thread.daemon = True
        thread.start()
    
    def translate_file(self, input_file, output_file):
        """Dosya çevirisi (thread'de çalışır)"""
        try:
            # Translator'ı güncelle
            source_lang = self.source_lang_var.get()
            target_lang = self.target_lang_var.get()
            self.translator.translator = GoogleTranslator(source=source_lang, target=target_lang)
            
            self.status_var.set("Dosya okunuyor...")
            self.log_message(f"SRT dosyası okunuyor: {input_file}")
            
            subtitles = self.translator.parse_srt(input_file)
            total_subtitles = len(subtitles)
            
            self.log_message(f"Toplam {total_subtitles} altyazı bulundu.")
            self.status_var.set("Çeviri başlıyor...")
            
            # Hız ayarına göre batch size belirle
            speed_settings = {
                "slow": {"batch_size": 3, "delay": 0.2},
                "normal": {"batch_size": 5, "delay": 0.1}, 
                "fast": {"batch_size": 8, "delay": 0.05},
                "turbo": {"batch_size": 12, "delay": 0.02}
            }
            
            speed = self.speed_var.get()
            settings = speed_settings.get(speed, speed_settings["normal"])
            batch_size = settings["batch_size"]
            delay = settings["delay"]
            
            self.log_message(f"⚡ Çeviri hızı: {speed.upper()} (Batch: {batch_size}, Gecikme: {delay}s)")
            translated_subtitles = []
            
            for batch_start in range(0, total_subtitles, batch_size):
                # Stop kontrolü
                if self.stop_requested:
                    self.log_message("⏹️ İşlem kullanıcı tarafından durduruldu")
                    self.status_var.set("⏹️ İşlem durduruldu")
                    return
                
                batch_end = min(batch_start + batch_size, total_subtitles)
                batch_subtitles = subtitles[batch_start:batch_end]
                
                # Progress güncelle
                progress = (batch_end / total_subtitles) * 100
                self.update_progress(progress)
                self.status_var.set(f"🚀 Hızlı çeviri: {batch_end}/{total_subtitles}")
                
                # Log mesajı
                self.log_message(f"🚀 Batch çeviri: {batch_start+1}-{batch_end}/{total_subtitles}")
                
                # Batch metinleri hazırla
                batch_texts = [sub['text'] for sub in batch_subtitles]
                
                # Batch çeviri yap
                translated_texts = self.translator.translate_batch(
                    batch_texts, 
                    self.source_lang_var.get(), 
                    self.target_lang_var.get()
                )
                
                # Sonuçları ekle
                for i, (subtitle, translated_text) in enumerate(zip(batch_subtitles, translated_texts)):
                    translated_subtitles.append({
                        'id': subtitle['id'],
                        'timestamp': subtitle['timestamp'],
                        'text': translated_text
                    })
                
                # Hız ayarına göre bekleme
                import time
                time.sleep(delay)
            
            # Dosyayı yaz
            self.status_var.set("Dosya yazılıyor...")
            self.translator.write_srt(translated_subtitles, output_file)
            
            self.update_progress(100)
            self.status_var.set("✅ Çeviri tamamlandı!")
            self.log_message(f"🎉 Çeviri tamamlandı! Çıktı dosyası: {output_file}")
            
            # Başarı mesajı ve dosya konumunu aç seçeneği
            result = messagebox.askyesno("Başarılı", 
                                       f"Çeviri tamamlandı!\n\nÇıktı dosyası: {output_file}\n\n"
                                       f"Dosya konumunu açmak ister misiniz?")
            if result:
                self.open_file_location(output_file)
            
        except Exception as e:
            self.status_var.set("Hata oluştu!")
            self.log_message(f"Hata: {str(e)}")
            messagebox.showerror("Hata", f"Çeviri sırasında hata oluştu:\n{str(e)}")
        
        finally:
            self.is_translating = False
            self.stop_requested = False
            
            # Butonları eski haline getir
            self.manual_stop_btn.pack_forget()  # Stop butonunu gizle
            self.manual_translate_btn.pack(side='left', padx=(0, 10))  # Çevir butonunu göster
            
            self.search_btn.config(state="normal", bg=self.colors['primary'])
    
    def search_and_translate(self):
        """Film arar, altyazı indirir ve çevirir"""
        if self.is_translating:
            return
            
        movie_name = self.movie_name_var.get().strip()
        if not movie_name:
            messagebox.showerror("Hata", "Lütfen film adını girin!")
            return
        
        # İşlemi ayrı thread'de başlat
        self.is_translating = True
        
        # Butonları devre dışı bırak ve görsel feedback ver
        self.search_btn.config(text="⏳ Aranıyor...", state="disabled", bg=self.colors['warning'])
        self.manual_translate_btn.config(state="disabled", bg=self.colors['warning'])
        
        # Film arama için stop butonu ekle (ana pencerede)
        self.search_stop_btn = tk.Button(self.root, text="⏹️ Film Aramasını Durdur", 
                                        command=self.stop_translation,
                                        font=('Helvetica', 11, 'bold'),
                                        bg=self.colors['danger'], fg='black',
                                        padx=15, pady=8, relief='flat',
                                        cursor='hand2')
        self.search_stop_btn.place(relx=0.5, rely=0.95, anchor='center')
        
        self.update_progress(0)
        self.status_var.set("🔍 Film aranıyor...")
        
        # Log'u temizle ve başlangıç mesajı ekle
        self.log_text.delete(1.0, tk.END)
        self.log_message("=" * 60)
        self.log_message(f"🎬 YENİ ARAMA BAŞLATILDI")
        self.log_message(f"🔍 Aranan film: {movie_name}")
        self.log_message(f"🌍 Kaynak dil: {self.source_lang_var.get()}")
        self.log_message(f"🎯 Hedef dil: {self.target_lang_var.get()}")
        self.log_message("=" * 60)
        
        thread = threading.Thread(target=self.search_download_translate, 
                                 args=(movie_name,))
        thread.daemon = True
        thread.start()
    
    def search_download_translate(self, movie_name):
        """Film arama, indirme ve çeviri işlemi"""
        try:
            self.status_var.set("🔍 Altyazı kaynakları taranıyor...")
            self.log_message("🔍 OpenSubtitles.org kontrol ediliyor...")
            self.update_progress(10)
            
            self.log_message("🔍 Subscene.com kontrol ediliyor...")
            self.update_progress(15)
            
            self.log_message("🔍 YIFY Subtitles kontrol ediliyor...")
            
            # Altyazı ara
            results = self.downloader.search_subtitles(movie_name, self.source_lang_var.get())
            
            if not results:
                self.log_message("❌ Hiçbir kaynakta altyazı bulunamadı!")
                self.status_var.set("❌ Altyazı bulunamadı")
                messagebox.showwarning("Uyarı", "Bu film için altyazı bulunamadı!\n\nDeneyebilecekleriniz:\n• Film adını farklı yazın\n• İngilizce adını deneyin\n• Yılı ekleyin (örn: Inception 2010)")
                return
            
            self.update_progress(25)
            self.log_message(f"✅ {len(results)} altyazı bulundu!")
            self.log_message("📋 Altyazı listesi hazırlanıyor...")
            
            self.update_progress(30)
            self.status_var.set("📋 Altyazı seçimi bekleniyor...")
            self.log_message("📋 Altyazı seçim penceresi açılıyor...")
            
            # Kullanıcıya seçim yaptır
            selected_subtitle = self.show_subtitle_selection(results)
            if not selected_subtitle:
                self.log_message("❌ Kullanıcı seçim yapmadı - işlem iptal edildi")
                self.status_var.set("❌ İşlem iptal edildi")
                return
            
            self.update_progress(40)
            self.log_message(f"✅ Seçilen altyazı: {selected_subtitle['title']}")
            self.log_message(f"📍 Kaynak: {selected_subtitle.get('source', 'Bilinmiyor')}")
            
            # Geçici dosya oluştur
            temp_srt = f"temp_{movie_name.replace(' ', '_')}.srt"
            
            self.status_var.set("⬇️ Altyazı indiriliyor...")
            self.log_message("⬇️ Altyazı dosyası indiriliyor...")
            self.update_progress(50)
            
            # Altyazı indir
            if self.downloader.download_subtitle(selected_subtitle['download_url'], temp_srt):
                # Dosya boyutunu kontrol et
                if os.path.exists(temp_srt):
                    file_size = os.path.getsize(temp_srt)
                    self.log_message(f"✅ Altyazı başarıyla indirildi: {temp_srt} ({file_size} bytes)")
                    
                    # Dosya içeriğini kontrol et
                    with open(temp_srt, 'r', encoding='utf-8') as f:
                        content_preview = f.read(200)  # İlk 200 karakter
                        self.log_message(f"📄 Dosya önizleme: {content_preview[:100]}...")
                else:
                    self.log_message(f"❌ Dosya oluşturulamadı: {temp_srt}")
                    
                self.update_progress(60)
                self.status_var.set("📝 Çeviri hazırlığı...")
                
                # Çıktı dosyası belirle
                save_folder = self.save_folder_var.get()
                if not os.path.exists(save_folder):
                    os.makedirs(save_folder, exist_ok=True)
                
                output_filename = f"{movie_name.replace(' ', '_')}_tr.srt"
                output_file = os.path.join(save_folder, output_filename)
                
                # Çeviri yap
                self.status_var.set("🔄 Çeviri yapılıyor...")
                self.log_message("🔄 Google Translate ile çeviri başlıyor...")
                self.log_message(f"📝 {self.source_lang_var.get().upper()} → {self.target_lang_var.get().upper()}")
                
                # Translator'ı güncelle
                source_lang = self.source_lang_var.get()
                target_lang = self.target_lang_var.get()
                self.translator.translator = GoogleTranslator(source=source_lang, target=target_lang)
                
                # SRT dosyasını parse et
                subtitles = self.translator.parse_srt(temp_srt)
                total_subtitles = len(subtitles)
                
                if total_subtitles == 0:
                    self.log_message("❌ SRT dosyası parse edilemedi veya boş!")
                    return
                
                self.log_message(f"📊 Toplam {total_subtitles} altyazı satırı çevriliyor...")
                self.log_message("⏳ Bu işlem biraz zaman alabilir...")
                
                # İlk birkaç altyazıyı göster
                for i, sub in enumerate(subtitles[:3]):
                    self.log_message(f"📝 Örnek {i+1}: {sub['text'][:50]}...")
                
                # Film arama için hız ayarını uygula
                speed_settings = {
                    "slow": {"batch_size": 4, "delay": 0.25},
                    "normal": {"batch_size": 8, "delay": 0.15}, 
                    "fast": {"batch_size": 12, "delay": 0.08},
                    "turbo": {"batch_size": 15, "delay": 0.03}
                }
                
                speed = self.speed_var.get()
                settings = speed_settings.get(speed, speed_settings["normal"])
                batch_size = settings["batch_size"]
                delay = settings["delay"]
                translated_subtitles = []
                
                for batch_start in range(0, total_subtitles, batch_size):
                    # Stop kontrolü
                    if self.stop_requested:
                        self.log_message("⏹️ Film arama işlemi kullanıcı tarafından durduruldu")
                        self.status_var.set("⏹️ İşlem durduruldu")
                        return
                    
                    batch_end = min(batch_start + batch_size, total_subtitles)
                    batch_subtitles = subtitles[batch_start:batch_end]
                    
                    # Progress bar güncelle (60-90 arası)
                    progress = 60 + (batch_end / total_subtitles) * 30
                    self.update_progress(progress)
                    
                    self.log_message(f"🚀 Hızlı çeviri: {batch_start+1}-{batch_end}/{total_subtitles}")
                    self.status_var.set(f"🚀 Turbo çeviri: {batch_end}/{total_subtitles}")
                    
                    # Batch metinleri hazırla
                    batch_texts = [sub['text'] for sub in batch_subtitles]
                    
                    # Batch çeviri yap
                    translated_texts = self.translator.translate_batch(
                        batch_texts, 
                        self.source_lang_var.get(), 
                        self.target_lang_var.get()
                    )
                    
                    # Sonuçları ekle
                    for subtitle, translated_text in zip(batch_subtitles, translated_texts):
                        translated_subtitles.append({
                            'id': subtitle['id'],
                            'timestamp': subtitle['timestamp'],
                            'text': translated_text
                        })
                    
                    # Hız ayarına göre bekleme
                    import time
                    time.sleep(delay)
                
                # Çevrilmiş dosyayı yaz
                self.status_var.set("💾 Dosya kaydediliyor...")
                self.log_message("💾 Çevrilmiş altyazı dosyası kaydediliyor...")
                self.translator.write_srt(translated_subtitles, output_file)
                
                # Geçici dosyayı sil
                if os.path.exists(temp_srt):
                    os.remove(temp_srt)
                    self.log_message("🗑️ Geçici dosyalar temizlendi")
                
                self.update_progress(100)
                self.status_var.set("🎉 İşlem başarıyla tamamlandı!")
                self.log_message("=" * 60)
                self.log_message("🎉 İŞLEM BAŞARIYLA TAMAMLANDI!")
                self.log_message(f"📁 Çıktı dosyası: {output_file}")
                self.log_message(f"📊 Çevrilen satır sayısı: {total_subtitles}")
                self.log_message("=" * 60)
                
                # Başarı mesajı ve dosya konumunu aç seçeneği
                result = messagebox.askyesno("Başarılı", 
                                           f"Film altyazısı bulundu ve çevrildi!\n\n"
                                           f"Dosya: {output_file}\n\n"
                                           f"Dosya konumunu açmak ister misiniz?")
                if result:
                    self.open_file_location(output_file)
            else:
                self.log_message("❌ Altyazı indirilemedi!")
                self.status_var.set("❌ İndirme hatası")
                messagebox.showerror("Hata", "Altyazı indirilemedi!\n\nMümkün nedenler:\n• İnternet bağlantısı sorunu\n• Altyazı sitesi erişim sorunu\n• Dosya bozuk olabilir")
                
        except Exception as e:
            self.status_var.set("❌ Hata oluştu!")
            self.log_message("=" * 60)
            self.log_message("❌ HATA OLUŞTU!")
            self.log_message(f"🔍 Hata detayı: {str(e)}")
            self.log_message("=" * 60)
            messagebox.showerror("Hata", f"İşlem sırasında hata oluştu:\n\n{str(e)}\n\nLütfen tekrar deneyin veya farklı bir film adı kullanın.")
        
        finally:
            self.is_translating = False
            self.search_btn.config(text="🚀 Altyazı Bul ve Çevir", state="normal", bg=self.colors['primary'])
            self.manual_translate_btn.config(state="normal", bg=self.colors['success'])
            
            # Film arama stop butonunu kaldır
            if hasattr(self, 'search_stop_btn'):
                self.search_stop_btn.destroy()
                delattr(self, 'search_stop_btn')
    
    def open_file_location(self, file_path):
        """Dosya konumunu sistem dosya yöneticisinde açar"""
        try:
            import subprocess
            import platform
            
            if platform.system() == "Darwin":  # macOS
                subprocess.run(["open", "-R", file_path])
            elif platform.system() == "Windows":  # Windows
                subprocess.run(["explorer", "/select,", file_path])
            else:  # Linux
                subprocess.run(["xdg-open", os.path.dirname(file_path)])
                
        except Exception as e:
            print(f"Dosya konumu açma hatası: {e}")
            # Hata durumunda en azından klasörü aç
            try:
                import webbrowser
                webbrowser.open(os.path.dirname(file_path))
            except:
                pass
    
    def show_subtitle_selection(self, results):
        """Altyazı seçimi penceresi gösterir"""
        selection_window = tk.Toplevel(self.root)
        selection_window.title("🎬 Altyazı Seçimi")
        selection_window.geometry("1000x600")
        selection_window.resizable(True, True)
        selection_window.transient(self.root)
        selection_window.grab_set()
        selection_window.configure(bg=self.colors['background'])
        
        # Pencereyi ortala
        selection_window.geometry("+%d+%d" % (
            self.root.winfo_rootx() + 50,
            self.root.winfo_rooty() + 50
        ))
        
        selected_result = None
        
        # Ana frame
        main_frame = tk.Frame(selection_window, bg=self.colors['background'], padx=20, pady=20)
        main_frame.pack(fill=tk.BOTH, expand=True)
        
        # Header
        header_frame = tk.Frame(main_frame, bg=self.colors['primary'], height=60)
        header_frame.pack(fill='x', pady=(0, 20))
        header_frame.pack_propagate(False)
        
        # Başlık
        title_container = tk.Frame(header_frame, bg=self.colors['primary'])
        title_container.pack(expand=True, fill='both')
        
        icon_label = tk.Label(title_container, text="🎬", font=('Arial', 24), 
                             bg=self.colors['primary'], fg='white')
        icon_label.pack(side='left', padx=20, pady=10)
        
        title_label = tk.Label(title_container, 
                              text=f"'{self.movie_name_var.get()}' için bulunan altyazılar",
                              font=('Helvetica', 16, 'bold'),
                              bg=self.colors['primary'], fg='white')
        title_label.pack(side='left', pady=15)
        
        # Treeview için frame
        tree_frame = ttk.Frame(main_frame)
        tree_frame.pack(fill=tk.BOTH, expand=True, pady=(0, 10))
        
        # Treeview oluştur
        columns = ('source', 'title', 'rating', 'downloads', 'release', 'uploader', 'size')
        tree = ttk.Treeview(tree_frame, columns=columns, show='headings', height=15)
        
        # Sütun başlıkları
        tree.heading('source', text='Kaynak')
        tree.heading('title', text='Film Adı')
        tree.heading('rating', text='Puan')
        tree.heading('downloads', text='İndirme')
        tree.heading('release', text='Sürüm')
        tree.heading('uploader', text='Yükleyen')
        tree.heading('size', text='Boyut')
        
        # Sütun genişlikleri
        tree.column('source', width=80)
        tree.column('title', width=180)
        tree.column('rating', width=60)
        tree.column('downloads', width=80)
        tree.column('release', width=140)
        tree.column('uploader', width=90)
        tree.column('size', width=70)
        
        # Scrollbar
        scrollbar = ttk.Scrollbar(tree_frame, orient=tk.VERTICAL, command=tree.yview)
        tree.configure(yscrollcommand=scrollbar.set)
        
        # Pack treeview ve scrollbar
        tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Sonuçları ekle
        for i, result in enumerate(results):
            # Kaynak rengini belirle
            source = result.get('source', 'Unknown')
            tree.insert('', tk.END, values=(
                source,
                result['title'],
                result['rating'],
                result['downloads'],
                result['release'],
                result['uploader'],
                result['size']
            ))
        
        # İlk öğeyi seç
        if results:
            tree.selection_set(tree.get_children()[0])
            tree.focus(tree.get_children()[0])
        
        # Buton frame
        button_frame = ttk.Frame(main_frame)
        button_frame.pack(fill=tk.X, pady=(10, 0))
        
        # Bilgi etiketi
        info_label = ttk.Label(button_frame, 
                              text="Çevirmek istediğiniz altyazıyı seçin ve 'Seç ve Çevir' butonuna tıklayın.",
                              font=("Arial", 9))
        info_label.pack(pady=(0, 10))
        
        def on_select():
            nonlocal selected_result
            selection = tree.selection()
            if selection:
                item = tree.item(selection[0])
                index = tree.index(selection[0])
                selected_result = results[index]
                selection_window.destroy()
        
        def on_cancel():
            nonlocal selected_result
            selected_result = None
            selection_window.destroy()
        
        def on_double_click(event):
            on_select()
        
        # Event binding
        tree.bind('<Double-1>', on_double_click)
        
        # Butonlar - daha büyük ve renkli
        button_container = tk.Frame(button_frame, bg=self.colors['background'])
        button_container.pack(pady=10)
        
        select_btn = tk.Button(button_container, text="🚀 Seç ve Çevir", 
                              command=on_select,
                              font=('Helvetica', 12, 'bold'),
                              bg=self.colors['success'], fg='white',
                              padx=20, pady=10, relief='flat',
                              cursor='hand2')
        select_btn.pack(side=tk.LEFT, padx=(0, 15))
        
        cancel_btn = tk.Button(button_container, text="❌ İptal", 
                              command=on_cancel,
                              font=('Helvetica', 12, 'bold'),
                              bg=self.colors['danger'], fg='white',
                              padx=20, pady=10, relief='flat',
                              cursor='hand2')
        cancel_btn.pack(side=tk.LEFT)
        
        # Önizleme frame
        preview_frame = ttk.LabelFrame(main_frame, text="Seçilen Altyazı Detayları", padding="10")
        preview_frame.pack(fill=tk.X, pady=(10, 0))
        
        preview_text = tk.Text(preview_frame, height=4, wrap=tk.WORD, state=tk.DISABLED)
        preview_text.pack(fill=tk.X)
        
        def on_tree_select(event):
            selection = tree.selection()
            if selection:
                item = tree.item(selection[0])
                index = tree.index(selection[0])
                result = results[index]
                
                preview_text.config(state=tk.NORMAL)
                preview_text.delete(1.0, tk.END)
                preview_text.insert(tk.END, f"Kaynak: {result.get('source', 'Unknown')} | Film: {result['title']}\n")
                preview_text.insert(tk.END, f"Puan: {result['rating']}/10 | İndirme: {result['downloads']} | Boyut: {result['size']}\n")
                preview_text.insert(tk.END, f"Sürüm: {result['release']}\n")
                preview_text.insert(tk.END, f"Yükleyen: {result['uploader']}")
                preview_text.config(state=tk.DISABLED)
        
        tree.bind('<<TreeviewSelect>>', on_tree_select)
        
        # İlk seçimi göster
        if results:
            on_tree_select(None)
        
        # Pencereyi bekle
        selection_window.wait_window()
        
        return selected_result

def main():
    root = tk.Tk()
    app = SRTTranslatorGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main()