# 🚀 Azure VM Quick Start - 15 Dakikada Canlı!

## 📋 **Hızlı Kurulum Adımları**

### **1. Azure VM Oluştur (5 dakika)**
```
Azure Portal → Virtual Machines → Create
- Name: budget-vm
- Image: Ubuntu 22.04 LTS
- Size: Standard B2s (2 vCPU, 4GB RAM)
- Authentication: SSH key
- Ports: 22, 80, 443, 3000, 5001
```

### **2. SSH ile Bağlan**
```bash
ssh -i budget-vm-key.pem azureuser@[VM-PUBLIC-IP]
```

### **3. Tek Komutla Kurulum (10 dakika)**
```bash
# Repository clone ve setup
git clone https://github.com/EmrahCan/budget.git
cd budget
chmod +x scripts/azure-vm-setup.sh
./scripts/azure-vm-setup.sh
```

### **4. Logout/Login ve Deploy**
```bash
# Logout (Docker group için gerekli)
logout

# Tekrar login
ssh -i budget-vm-key.pem azureuser@[VM-PUBLIC-IP]

# Deploy
./deploy-budget.sh
```

### **5. Test Et**
```
Frontend: http://[VM-PUBLIC-IP]
Backend: http://[VM-PUBLIC-IP]:5001
Health: http://[VM-PUBLIC-IP]/health
```

---

## 🎯 **Tek Satır Kurulum**

VM'ye bağlandıktan sonra:

```bash
curl -sSL https://raw.githubusercontent.com/EmrahCan/budget/main/budget/scripts/azure-vm-setup.sh | bash
```

---

## 🔧 **Yönetim Komutları**

```bash
# Status kontrol
~/monitor-budget.sh

# Servisleri yeniden başlat
~/restart-budget.sh

# Logları görüntüle
docker-compose -f ~/budget/docker-compose.prod.yml logs -f

# Servisleri durdur
docker-compose -f ~/budget/docker-compose.prod.yml down

# Servisleri başlat
docker-compose -f ~/budget/docker-compose.prod.yml up -d
```

---

## 💰 **Maliyet**
- **Azure VM B2s**: ~$30/ay
- **Storage**: ~$3/ay
- **Network**: ~$2/ay
- **Toplam**: ~$35/ay

---

## 🚨 **Sorun Giderme**

### **Servisler çalışmıyor:**
```bash
cd ~/budget
docker-compose -f docker-compose.prod.yml restart
```

### **Port erişim sorunu:**
```bash
sudo ufw status
sudo ufw allow 3000/tcp
sudo ufw allow 5001/tcp
```

### **Database sorunu:**
```bash
docker exec -it budget_database_prod psql -U postgres -d budget_app_prod
```

---

## 🎉 **Başarı!**

15 dakikada Azure VM'de production-ready Budget Management System'iniz hazır!

**Erişim URL'leri:**
- 🌐 **Ana Sayfa**: http://[VM-PUBLIC-IP]
- 🔧 **API**: http://[VM-PUBLIC-IP]:5001/api
- 🏥 **Health**: http://[VM-PUBLIC-IP]/health