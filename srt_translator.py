#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SRT Altyazı Çevirici - Core Engine v1.0
İngilizce SRT dosyalarını Türkçe'ye çevirir

Version: 1.0
Date: 2025-10-12
Author: Kiro AI Assistant
"""

import re
import os
import sys
from deep_translator import GoogleTranslator
import time

class SRTTranslator:
    def __init__(self):
        self.translator = GoogleTranslator(source='en', target='tr')
        
    def parse_srt(self, file_path):
        """SRT dosyasını parse eder"""
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # SRT formatını parse et
        pattern = r'(\d+)\n(\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3})\n(.*?)(?=\n\d+\n|\n*$)'
        matches = re.findall(pattern, content, re.DOTALL)
        
        subtitles = []
        for match in matches:
            subtitle_id = match[0]
            timestamp = match[1]
            text = match[2].strip()
            subtitles.append({
                'id': subtitle_id,
                'timestamp': timestamp,
                'text': text
            })
        
        return subtitles
    
    def translate_text(self, text, src='en', dest='tr'):
        """Metni çevirir"""
        try:
            # Boş satırları ve HTML etiketlerini koru
            if not text.strip():
                return text
            
            result = self.translator.translate(text)
            return result
        except Exception as e:
            print(f"Çeviri hatası: {e}")
            return text
    
    def translate_batch(self, texts, src='en', dest='tr'):
        """Birden fazla metni aynı anda çevirir (daha hızlı)"""
        try:
            if not texts:
                return []
            
            # Boş metinleri filtrele
            non_empty_texts = []
            text_indices = []
            
            for i, text in enumerate(texts):
                if text.strip():
                    non_empty_texts.append(text)
                    text_indices.append(i)
            
            if not non_empty_texts:
                return texts
            
            # Metinleri birleştir (her satır arasına özel ayırıcı koy)
            separator = " |SUBTITLE_SEPARATOR| "
            combined_text = separator.join(non_empty_texts)
            
            # Tek seferde çevir
            translated_combined = self.translator.translate(combined_text)
            
            # Çevrilmiş metni ayır
            translated_parts = translated_combined.split(" |SUBTITLE_SEPARATOR| ")
            
            # Sonuçları orijinal sıraya koy
            results = texts.copy()
            for i, translated_part in enumerate(translated_parts):
                if i < len(text_indices):
                    results[text_indices[i]] = translated_part.strip()
            
            return results
            
        except Exception as e:
            print(f"Batch çeviri hatası: {e}")
            # Hata durumunda tek tek çevir
            return [self.translate_text(text, src, dest) for text in texts]
    
    def translate_srt(self, input_file, output_file=None):
        """SRT dosyasını çevirir"""
        if not os.path.exists(input_file):
            print(f"Hata: {input_file} dosyası bulunamadı!")
            return False
        
        if output_file is None:
            name, ext = os.path.splitext(input_file)
            output_file = f"{name}_tr{ext}"
        
        print(f"SRT dosyası okunuyor: {input_file}")
        subtitles = self.parse_srt(input_file)
        
        print(f"Toplam {len(subtitles)} altyazı bulundu. Çeviri başlıyor...")
        
        translated_subtitles = []
        for i, subtitle in enumerate(subtitles, 1):
            print(f"Çevriliyor: {i}/{len(subtitles)}", end='\r')
            
            # Metni çevir
            translated_text = self.translate_text(subtitle['text'])
            
            translated_subtitles.append({
                'id': subtitle['id'],
                'timestamp': subtitle['timestamp'],
                'text': translated_text
            })
            
            # API limitlerini aşmamak için kısa bekleme
            time.sleep(0.1)
        
        # Çevrilmiş SRT dosyasını yaz
        self.write_srt(translated_subtitles, output_file)
        print(f"\nÇeviri tamamlandı! Çıktı dosyası: {output_file}")
        return True
    
    def write_srt(self, subtitles, output_file):
        """Çevrilmiş altyazıları SRT formatında yazar"""
        with open(output_file, 'w', encoding='utf-8') as file:
            for subtitle in subtitles:
                file.write(f"{subtitle['id']}\n")
                file.write(f"{subtitle['timestamp']}\n")
                file.write(f"{subtitle['text']}\n\n")

def main():
    translator = SRTTranslator()
    
    if len(sys.argv) < 2:
        print("Kullanım: python srt_translator.py <input_file.srt> [output_file.srt]")
        print("Örnek: python srt_translator.py movie.srt movie_tr.srt")
        return
    
    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else None
    
    translator.translate_srt(input_file, output_file)

if __name__ == "__main__":
    main()