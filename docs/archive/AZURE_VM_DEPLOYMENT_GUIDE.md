# 🖥️ Azure VM Deployment Guide - Tam Rehber

## 🎯 **Avantajları**
✅ Tek VM'de her şey (frontend + backend + database)  
✅ Docker Compose ile kolay yönetim  
✅ Tam kontrol  
✅ Mevcut konfigürasyonlar kullanılabilir  
✅ Aylık ~$30 maliyet

---

## 📋 **ADIM 1: Azure VM Oluşturma**

### **Azure Portal'da:**

1. **"Virtual machines" arayın** ve seçin
2. **"+ Create" → "Azure virtual machine"**

**Konfigürasyon:**
```
Subscription: [Azure aboneliğiniz]
Resource group: budget-app-rg (yeni oluşturun)
Virtual machine name: budget-vm
Region: West Europe
Image: Ubuntu Server 22.04 LTS - x64 Gen2
Size: Standard B2s (2 vcpus, 4 GiB memory) - ~$30/ay

Authentication type: SSH public key
Username: azureuser
SSH public key source: Generate new key pair
Key pair name: budget-vm-key

Networking:
Public IP: Create new
NIC network security group: Advanced
Configure network security group: Create new

Inbound port rules ekleyin:
- SSH (22)
- HTTP (80)
- HTTPS (443)
- Custom (3000) - Frontend
- Custom (5001) - Backend
```

3. **"Review + create" → "Create"**
4. **SSH key'i indirin ve kaydedin!**

---

## 📋 **ADIM 2: VM'ye Bağlanma ve Setup**

### **2.1 SSH ile Bağlanma**
```bash
# SSH key'i kullanarak bağlan
ssh -i budget-vm-key.pem azureuser@[VM-PUBLIC-IP]
```

### **2.2 VM'de Gerekli Yazılımları Kurma**
```bash
# System update
sudo apt update && sudo apt upgrade -y

# Docker kurulumu
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose kurulumu
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Node.js kurulumu (script çalıştırmak için)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Git kurulumu
sudo apt install git -y

# Logout/login (docker group için)
exit
```

### **2.3 Kod Deploy Etme**
```bash
# Tekrar SSH ile bağlan
ssh -i budget-vm-key.pem azureuser@[VM-PUBLIC-IP]

# Repository clone
git clone https://github.com/EmrahCan/budget.git
cd budget

# Environment setup
chmod +x scripts/*.sh
./scripts/setup-env.sh production
```

---

## 🔧 **ADIM 3: Production Environment Ayarlama**

### **3.1 Production Environment Variables**

VM'nizin public IP'sini alın:
```bash
# VM'nin public IP'sini öğren
curl -s http://checkip.amazonaws.com
# veya
curl -s http://ipinfo.io/ip
```

### **3.2 Environment Dosyalarını Güncelleme**

**Backend Environment (.env):**
```bash
# Backend environment dosyasını düzenle
nano budget/backend/.env
```

```env
# Budget App - Production Environment

# Server Configuration
NODE_ENV=production
PORT=5001

# Database Configuration (Docker internal)
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_app_prod
DB_USER=postgres
DB_PASSWORD=BudgetApp2024!SecurePassword

# JWT Configuration
JWT_SECRET=budget_app_super_secret_jwt_key_2024_azure_vm
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://[VM-PUBLIC-IP]:3000

# CORS Configuration
CORS_ORIGIN=http://[VM-PUBLIC-IP]:3000

# AI Configuration
GEMINI_API_KEY=AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g
GEMINI_MODEL=gemini-1.5-pro

# Production Optimizations
GENERATE_SOURCEMAP=false
```

**Frontend Environment (.env):**
```bash
# Frontend environment dosyasını düzenle
nano budget/frontend/.env
```

```env
# Frontend Configuration
REACT_APP_API_URL=http://[VM-PUBLIC-IP]:5001/api
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
GENERATE_SOURCEMAP=false
```

### **3.3 Production Docker Compose Oluşturma**

```bash
# Production docker-compose dosyası oluştur
nano docker-compose.prod.yml
```

```yaml
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    container_name: budget_database_prod
    environment:
      POSTGRES_DB: budget_app_prod
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: BudgetApp2024!SecurePassword
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./budget/backend/database/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d budget_app_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build:
      context: ./budget/backend
      dockerfile: Dockerfile
    container_name: budget_backend_prod
    environment:
      - NODE_ENV=production
    env_file:
      - ./budget/backend/.env
    ports:
      - "5001:5001"
    depends_on:
      database:
        condition: service_healthy
    volumes:
      - ./budget/logs:/app/logs
      - ./budget/uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./budget/frontend
      dockerfile: Dockerfile
      args:
        - REACT_APP_API_URL=http://[VM-PUBLIC-IP]:5001/api
        - REACT_APP_ENVIRONMENT=production
    container_name: budget_frontend_prod
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local

networks:
  default:
    name: budget_network_prod
```

### **3.4 Nginx Reverse Proxy (Opsiyonel)**

```bash
# Nginx kurulumu
sudo apt install nginx -y

# Nginx konfigürasyonu
sudo nano /etc/nginx/sites-available/budget-app
```

```nginx
server {
    listen 80;
    server_name [VM-PUBLIC-IP];

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5001/health;
    }
}
```

```bash
# Nginx site'ı aktifleştir
sudo ln -s /etc/nginx/sites-available/budget-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🚀 **ADIM 4: Deployment**

### **4.1 Production Deploy**
```bash
# Production deployment
./scripts/deploy.sh production --build --clean
```

### **4.2 Servisleri Kontrol Et**
```bash
# Container'ları kontrol et
docker-compose -f docker-compose.prod.yml ps

# Logları kontrol et
docker-compose -f docker-compose.prod.yml logs -f

# Health check
curl http://localhost:5001/health
curl http://localhost:3000
```

---

## 🔍 **ADIM 5: Test ve Doğrulama**

### **5.1 Servis Testleri**
```bash
# Backend health check
curl http://[VM-PUBLIC-IP]:5001/health

# Frontend erişim
curl http://[VM-PUBLIC-IP]:3000

# API test
curl http://[VM-PUBLIC-IP]:5001/api/auth/health
```

### **5.2 Browser Testleri**
1. **Frontend**: `http://[VM-PUBLIC-IP]:3000`
2. **Backend Health**: `http://[VM-PUBLIC-IP]:5001/health`
3. **API**: `http://[VM-PUBLIC-IP]:5001/api`

---

## 🔧 **ADIM 6: Monitoring ve Maintenance**

### **6.1 Auto-restart Setup**
```bash
# Auto-restart script'ini çalıştır
./scripts/auto-restart.sh production
```

### **6.2 Log Monitoring**
```bash
# Real-time log monitoring
docker-compose -f docker-compose.prod.yml logs -f --tail=100

# Specific service logs
docker logs budget_backend_prod -f
docker logs budget_frontend_prod -f
docker logs budget_database_prod -f
```

### **6.3 Backup Setup**
```bash
# Database backup script
./scripts/backup-database.sh production
```

---

## 💰 **Maliyet Hesabı**

```
Azure VM (Standard B2s):     ~$30/ay
Disk Storage (30GB):         ~$3/ay
Network Traffic:             ~$2/ay
─────────────────────────────
TOPLAM:                     ~$35/ay
```

---

## 🚨 **Troubleshooting**

### **Container Sorunları**
```bash
# Container'ları yeniden başlat
docker-compose -f docker-compose.prod.yml restart

# Container'ları yeniden build et
docker-compose -f docker-compose.prod.yml build --no-cache
```

### **Network Sorunları**
```bash
# Port'ları kontrol et
sudo netstat -tlnp | grep -E ':(3000|5001|5432)'

# Firewall kontrol et
sudo ufw status
```

### **Database Sorunları**
```bash
# Database connection test
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod -c "SELECT 1;"
```

---

## 🎯 **Sonraki Adımlar**

1. ✅ **SSL Sertifikası** (Let's Encrypt)
2. ✅ **Domain Name** bağlama
3. ✅ **Monitoring** sistemi kurma
4. ✅ **Backup** stratejisi
5. ✅ **CI/CD** pipeline kurma

---

**🚀 Bu rehberle 30-45 dakikada Azure VM'de production'a çıkabilirsiniz!**