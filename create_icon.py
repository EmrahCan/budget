#!/usr/bin/env python3
"""
SRT Translator için ikon oluşturucu
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_app_icon():
    """Uygulama ikonu oluşturur"""
    # 512x512 boyutunda ikon oluştur
    size = 512
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Gradient arka plan
    for i in range(size):
        color = (30 + i//4, 150 + i//8, 255 - i//4, 255)
        draw.rectangle([0, i, size, i+1], fill=color)
    
    # Film şeridi çiz
    strip_height = 80
    strip_y = size // 2 - strip_height // 2
    
    # Film şeridi arka planı
    draw.rectangle([50, strip_y, size-50, strip_y + strip_height], 
                  fill=(50, 50, 50, 255), outline=(200, 200, 200, 255), width=3)
    
    # Film deliklerini çiz
    hole_size = 15
    for x in range(70, size-70, 40):
        draw.ellipse([x, strip_y + 10, x + hole_size, strip_y + 10 + hole_size], 
                    fill=(0, 0, 0, 255))
        draw.ellipse([x, strip_y + strip_height - 25, x + hole_size, strip_y + strip_height - 10], 
                    fill=(0, 0, 0, 255))
    
    # Metin ekle
    try:
        # Sistem fontunu kullan
        font_large = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 60)
        font_small = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 30)
    except:
        # Fallback font
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Ana metin
    text = "SRT"
    bbox = draw.textbbox((0, 0), text, font=font_large)
    text_width = bbox[2] - bbox[0]
    text_x = (size - text_width) // 2
    text_y = strip_y + 15
    
    # Metin gölgesi
    draw.text((text_x + 2, text_y + 2), text, fill=(0, 0, 0, 128), font=font_large)
    # Ana metin
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font_large)
    
    # Alt metin
    sub_text = "Translator"
    bbox = draw.textbbox((0, 0), sub_text, font=font_small)
    sub_width = bbox[2] - bbox[0]
    sub_x = (size - sub_width) // 2
    sub_y = size - 100
    
    draw.text((sub_x + 1, sub_y + 1), sub_text, fill=(0, 0, 0, 128), font=font_small)
    draw.text((sub_x, sub_y), sub_text, fill=(255, 255, 255, 255), font=font_small)
    
    # Çeviri okları ekle
    arrow_y = size // 2 + 100
    draw.polygon([(size//2 - 50, arrow_y), (size//2 - 20, arrow_y - 15), (size//2 - 20, arrow_y + 15)], 
                fill=(255, 200, 0, 255))
    draw.polygon([(size//2 + 20, arrow_y), (size//2 + 50, arrow_y - 15), (size//2 + 50, arrow_y + 15)], 
                fill=(255, 200, 0, 255))
    
    # Farklı boyutlarda kaydet
    sizes = [16, 32, 64, 128, 256, 512]
    
    for s in sizes:
        resized = img.resize((s, s), Image.Resampling.LANCZOS)
        resized.save(f'icon_{s}.png')
    
    # Ana ikon
    img.save('app_icon.png')
    print("✅ İkon dosyaları oluşturuldu!")

if __name__ == "__main__":
    create_app_icon()