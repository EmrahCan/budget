#!/bin/bash

# macOS LaunchAgent servisleri oluşturur
# Bu servisler bilgisayar açıldığında otomatik başlar

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

CURRENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAUNCH_AGENTS_DIR="$HOME/Library/LaunchAgents"

echo -e "${YELLOW}🚀 Budget App - Otomatik Servis Kurulumu${NC}\n"

# LaunchAgents dizinini oluştur
mkdir -p "$LAUNCH_AGENTS_DIR"

# 1. PostgreSQL Servisi (zaten var, kontrol et)
echo -e "${YELLOW}1. PostgreSQL kontrol ediliyor...${NC}"
if brew services list | grep -q "postgresql@15.*started"; then
    echo -e "${GREEN}✅ PostgreSQL zaten çalışıyor${NC}"
else
    echo -e "${YELLOW}PostgreSQL başlatılıyor...${NC}"
    brew services start postgresql@15
    echo -e "${GREEN}✅ PostgreSQL başlatıldı${NC}"
fi

# 2. Backend Servisi
echo -e "\n${YELLOW}2. Backend servisi oluşturuluyor...${NC}"
cat > "$LAUNCH_AGENTS_DIR/com.budgetapp.backend.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.budgetapp.backend</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>server.js</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${CURRENT_DIR}/backend</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>
    
    <key>StandardOutPath</key>
    <string>${CURRENT_DIR}/backend/logs/service.log</string>
    
    <key>StandardErrorPath</key>
    <string>${CURRENT_DIR}/backend/logs/service-error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>NODE_ENV</key>
        <string>development</string>
        <key>PORT</key>
        <string>5001</string>
    </dict>
</dict>
</plist>
EOF

# 3. Frontend Servisi
echo -e "${YELLOW}3. Frontend servisi oluşturuluyor...${NC}"
cat > "$LAUNCH_AGENTS_DIR/com.budgetapp.frontend.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.budgetapp.frontend</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/npm</string>
        <string>start</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>${CURRENT_DIR}/frontend</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>
    
    <key>StandardOutPath</key>
    <string>${CURRENT_DIR}/frontend/logs/service.log</string>
    
    <key>StandardErrorPath</key>
    <string>${CURRENT_DIR}/frontend/logs/service-error.log</string>
    
    <key>EnvironmentVariables</key>
    <dict>
        <key>PORT</key>
        <string>3002</string>
        <key>BROWSER</key>
        <string>none</string>
    </dict>
</dict>
</plist>
EOF

# Log dizinlerini oluştur
mkdir -p "${CURRENT_DIR}/backend/logs"
mkdir -p "${CURRENT_DIR}/frontend/logs"

# 4. Servisleri yükle ve başlat
echo -e "\n${YELLOW}4. Servisler yükleniyor...${NC}"

# Eski servisleri durdur
launchctl unload "$LAUNCH_AGENTS_DIR/com.budgetapp.backend.plist" 2>/dev/null || true
launchctl unload "$LAUNCH_AGENTS_DIR/com.budgetapp.frontend.plist" 2>/dev/null || true

# Yeni servisleri yükle
launchctl load "$LAUNCH_AGENTS_DIR/com.budgetapp.backend.plist"
launchctl load "$LAUNCH_AGENTS_DIR/com.budgetapp.frontend.plist"

echo -e "${GREEN}✅ Servisler yüklendi${NC}"

# 5. Servisleri başlat
echo -e "\n${YELLOW}5. Servisler başlatılıyor...${NC}"
launchctl start com.budgetapp.backend
launchctl start com.budgetapp.frontend

sleep 5

# 6. Durum kontrolü
echo -e "\n${YELLOW}6. Servis durumu kontrol ediliyor...${NC}"
echo ""
echo "Backend:"
if launchctl list | grep -q "com.budgetapp.backend"; then
    echo -e "${GREEN}✅ Backend servisi çalışıyor${NC}"
else
    echo -e "${RED}❌ Backend servisi çalışmıyor${NC}"
fi

echo ""
echo "Frontend:"
if launchctl list | grep -q "com.budgetapp.frontend"; then
    echo -e "${GREEN}✅ Frontend servisi çalışıyor${NC}"
else
    echo -e "${RED}❌ Frontend servisi çalışmıyor${NC}"
fi

# 7. Health check
echo -e "\n${YELLOW}7. Health check yapılıyor...${NC}"
sleep 10

if curl -s http://localhost:5001/health > /dev/null; then
    echo -e "${GREEN}✅ Backend health check başarılı${NC}"
else
    echo -e "${RED}❌ Backend health check başarısız${NC}"
fi

if curl -s http://localhost:3002 > /dev/null; then
    echo -e "${GREEN}✅ Frontend health check başarılı${NC}"
else
    echo -e "${YELLOW}⏳ Frontend henüz hazır değil (build sürüyor)${NC}"
fi

echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Otomatik Servisler Kuruldu! 🎉                  ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${YELLOW}📋 Kullanım:${NC}"
echo -e "  • Servisler artık otomatik başlayacak (bilgisayar açıldığında)"
echo -e "  • Backend: http://localhost:5001"
echo -e "  • Frontend: http://localhost:3002"
echo ""
echo -e "${YELLOW}🔧 Yönetim Komutları:${NC}"
echo -e "  • Servisleri durdur:"
echo -e "    launchctl stop com.budgetapp.backend"
echo -e "    launchctl stop com.budgetapp.frontend"
echo ""
echo -e "  • Servisleri başlat:"
echo -e "    launchctl start com.budgetapp.backend"
echo -e "    launchctl start com.budgetapp.frontend"
echo ""
echo -e "  • Servisleri kaldır (otomatik başlatmayı iptal et):"
echo -e "    launchctl unload ~/Library/LaunchAgents/com.budgetapp.backend.plist"
echo -e "    launchctl unload ~/Library/LaunchAgents/com.budgetapp.frontend.plist"
echo ""
echo -e "  • Logları görüntüle:"
echo -e "    tail -f ${CURRENT_DIR}/backend/logs/service.log"
echo -e "    tail -f ${CURRENT_DIR}/frontend/logs/service.log"
echo ""
echo -e "${GREEN}✨ Artık her açılışta otomatik çalışacak!${NC}\n"
