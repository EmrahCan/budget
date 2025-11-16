#!/bin/bash

# CI/CD Setup Script
# Bu script GitHub Actions CI/CD pipeline'ını kurmak için gerekli adımları yapar

set -e

echo "🚀 CI/CD Pipeline Kurulum Scripti"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: SSH Key kontrolü
echo -e "${BLUE}1️⃣ SSH Key Kontrolü${NC}"
echo "-------------------"

SSH_KEY_PATH="$HOME/.ssh/github_actions_deploy"

if [ -f "$SSH_KEY_PATH" ]; then
  echo -e "${GREEN}✅ SSH key mevcut: $SSH_KEY_PATH${NC}"
else
  echo -e "${YELLOW}⚠️  SSH key bulunamadı. Oluşturuluyor...${NC}"
  ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$SSH_KEY_PATH" -N ""
  echo -e "${GREEN}✅ SSH key oluşturuldu${NC}"
fi

echo ""

# Step 2: Public key'i göster
echo -e "${BLUE}2️⃣ Public Key (Azure VM'e eklenecek)${NC}"
echo "--------------------------------------"
echo ""
cat "${SSH_KEY_PATH}.pub"
echo ""
echo -e "${YELLOW}⚠️  Bu public key'i Azure VM'e eklemen gerekiyor:${NC}"
echo ""
echo "Azure VM'de şu komutu çalıştır:"
echo -e "${GREEN}echo '$(cat ${SSH_KEY_PATH}.pub)' >> ~/.ssh/authorized_keys${NC}"
echo ""
read -p "Public key'i Azure VM'e ekledin mi? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Önce public key'i Azure VM'e ekle, sonra tekrar çalıştır${NC}"
  exit 1
fi

echo ""

# Step 3: Private key'i göster (GitHub Secrets için)
echo -e "${BLUE}3️⃣ Private Key (GitHub Secrets'a eklenecek)${NC}"
echo "--------------------------------------------"
echo ""
echo -e "${YELLOW}⚠️  Bu private key'i GitHub Secrets'a eklemen gerekiyor:${NC}"
echo ""
echo "GitHub'da: Settings → Secrets and variables → Actions → New repository secret"
echo "Secret adı: SSH_PRIVATE_KEY"
echo ""
echo "Private key içeriği:"
echo "-------------------"
cat "$SSH_KEY_PATH"
echo "-------------------"
echo ""
read -p "Private key'i GitHub Secrets'a ekledin mi? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Önce private key'i GitHub Secrets'a ekle, sonra tekrar çalıştır${NC}"
  exit 1
fi

echo ""

# Step 4: Diğer secrets
echo -e "${BLUE}4️⃣ Diğer GitHub Secrets${NC}"
echo "------------------------"
echo ""
echo "Şu secret'ları da GitHub'a ekle:"
echo ""
echo "VM_HOST: 98.71.149.168"
echo "VM_USER: obiwan"
echo ""
read -p "Tüm secrets'ları ekledin mi? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${RED}❌ Önce tüm secrets'ları ekle, sonra tekrar çalıştır${NC}"
  exit 1
fi

echo ""

# Step 5: SSH bağlantısını test et
echo -e "${BLUE}5️⃣ SSH Bağlantı Testi${NC}"
echo "---------------------"
echo ""

VM_HOST="98.71.149.168"
VM_USER="obiwan"

echo "Azure VM'e bağlanılıyor..."
if ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$VM_USER@$VM_HOST" "echo 'SSH bağlantısı başarılı!'" 2>/dev/null; then
  echo -e "${GREEN}✅ SSH bağlantısı çalışıyor!${NC}"
else
  echo -e "${RED}❌ SSH bağlantısı başarısız!${NC}"
  echo "Public key'in Azure VM'de doğru eklendiğinden emin ol"
  exit 1
fi

echo ""

# Step 6: Workflow dosyasını kontrol et
echo -e "${BLUE}6️⃣ Workflow Dosyası Kontrolü${NC}"
echo "-----------------------------"
echo ""

WORKFLOW_FILE=".github/workflows/deploy-to-production.yml"

if [ -f "$WORKFLOW_FILE" ]; then
  echo -e "${GREEN}✅ Workflow dosyası mevcut: $WORKFLOW_FILE${NC}"
else
  echo -e "${RED}❌ Workflow dosyası bulunamadı!${NC}"
  exit 1
fi

echo ""

# Step 7: Git commit ve push
echo -e "${BLUE}7️⃣ Git Commit ve Push${NC}"
echo "---------------------"
echo ""

if git diff --quiet HEAD -- "$WORKFLOW_FILE"; then
  echo -e "${YELLOW}ℹ️  Workflow dosyasında değişiklik yok${NC}"
else
  echo "Workflow dosyası commit ediliyor..."
  git add "$WORKFLOW_FILE"
  git add "CI_CD_SETUP_GUIDE.md"
  git add "setup-cicd.sh"
  git commit -m "ci: GitHub Actions CI/CD pipeline eklendi"
  
  echo ""
  read -p "GitHub'a push yapmak istiyor musun? (y/n): " -n 1 -r
  echo ""
  
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    git push origin main
    echo -e "${GREEN}✅ Değişiklikler GitHub'a push edildi${NC}"
  else
    echo -e "${YELLOW}⚠️  Manuel olarak push etmeyi unutma: git push origin main${NC}"
  fi
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ CI/CD Kurulumu Tamamlandı!${NC}"
echo "=================================="
echo ""
echo "📝 Sonraki Adımlar:"
echo ""
echo "1. GitHub'da Actions tab'ına git"
echo "2. 'Deploy to Production' workflow'unu göreceksin"
echo "3. Test için küçük bir değişiklik yap ve push et:"
echo ""
echo "   echo '# Test' >> README.md"
echo "   git add README.md"
echo "   git commit -m 'test: CI/CD test'"
echo "   git push origin main"
echo ""
echo "4. GitHub Actions'da deployment'ı izle"
echo ""
echo "📚 Detaylı bilgi için: CI_CD_SETUP_GUIDE.md"
echo ""
