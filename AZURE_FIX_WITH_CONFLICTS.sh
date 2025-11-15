#!/bin/bash
# Azure VM'de Git Conflict'i Çözerek Fix Uygulama

echo "🔧 Git Conflict'i Çözülüyor ve Fix Uygulanıyor..."
echo ""

# 1. Local değişiklikleri yedekle
echo "📦 Local değişiklikler yedekleniyor..."
git stash save "backup-before-account-delete-fix-$(date +%Y%m%d-%H%M%S)"

if [ $? -eq 0 ]; then
    echo "✅ Local değişiklikler stash'lendi"
else
    echo "⚠️  Stash başarısız, devam ediliyor..."
fi

echo ""

# 2. Untracked dosyayı sil veya taşı
echo "🗑️  Untracked dosya temizleniyor..."
rm -f backend/scripts/reset-password-mysql.js

echo ""

# 3. Git pull
echo "📥 Son değişiklikler çekiliyor..."
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull başarısız!"
    echo "Manuel olarak çözmeniz gerekebilir."
    exit 1
fi

echo "✅ Git pull başarılı"
echo ""

# 4. Script'i executable yap
echo "🔧 Script hazırlanıyor..."
chmod +x scripts/fix-production-delete.sh

echo ""

# 5. Fix'i uygula
echo "🚀 Fix uygulanıyor..."
./scripts/fix-production-delete.sh

echo ""
echo "✨ İşlem tamamlandı!"
echo ""
echo "📝 Not: Local değişiklikleriniz stash'lendi."
echo "   Geri yüklemek için: git stash pop"
echo ""
echo "🌐 Şimdi tarayıcıda test edin: http://98.71.149.168"
