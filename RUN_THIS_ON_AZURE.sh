#!/bin/bash
# ============================================
# Azure VM'de Çalıştırılacak Tek Script
# ============================================

echo "🚀 Budget App - Account Delete Fix"
echo "===================================="
echo ""

# Proje dizinine git
echo "📁 Proje dizinine gidiliyor..."
cd ~/budget || cd /home/azureuser/budget || { echo "❌ Budget dizini bulunamadı!"; exit 1; }

echo "✅ Dizin: $(pwd)"
echo ""

# Git pull
echo "📥 Son değişiklikler çekiliyor..."
git pull origin main

echo ""

# Script'i executable yap
echo "🔧 Script hazırlanıyor..."
chmod +x scripts/fix-production-delete.sh

echo ""

# Fix'i uygula
echo "🚀 Fix uygulanıyor..."
./scripts/fix-production-delete.sh

echo ""
echo "✨ İşlem tamamlandı!"
echo ""
echo "🌐 Şimdi tarayıcıda test edin: http://98.71.149.168"
echo "📊 Logları izlemek için: docker logs budget_backend_prod -f"
