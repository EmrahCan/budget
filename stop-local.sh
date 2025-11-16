#!/bin/bash

# Local Development Stop Script
# Bu script local geliştirme ortamını durdurur

echo "🛑 Budget App - Local Development Durduruluyor..."
echo "=================================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# PID dosyalarından oku
if [ -f ".backend.pid" ]; then
  BACKEND_PID=$(cat .backend.pid)
  if kill -0 $BACKEND_PID 2>/dev/null; then
    kill $BACKEND_PID
    echo -e "${GREEN}✅ Backend durduruldu (PID: $BACKEND_PID)${NC}"
  else
    echo "⚠️  Backend zaten durmuş"
  fi
  rm .backend.pid
else
  # Port'tan bul
  if lsof -ti:5001 > /dev/null 2>&1; then
    kill -9 $(lsof -ti:5001)
    echo -e "${GREEN}✅ Backend durduruldu (Port: 5001)${NC}"
  fi
fi

if [ -f ".frontend.pid" ]; then
  FRONTEND_PID=$(cat .frontend.pid)
  if kill -0 $FRONTEND_PID 2>/dev/null; then
    kill $FRONTEND_PID
    echo -e "${GREEN}✅ Frontend durduruldu (PID: $FRONTEND_PID)${NC}"
  else
    echo "⚠️  Frontend zaten durmuş"
  fi
  rm .frontend.pid
else
  # Port'tan bul
  if lsof -ti:3002 > /dev/null 2>&1; then
    kill -9 $(lsof -ti:3002)
    echo -e "${GREEN}✅ Frontend durduruldu (Port: 3002)${NC}"
  fi
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Local Development Ortamı Durduruldu${NC}"
echo "=================================================="
echo ""
echo "Yeniden başlatmak için: ./start-local.sh"
echo ""
