# 📋 Production Migration - Özet Kılavuz

## 🎯 Amaç
GitHub'daki son DB yapısını (AI tables, notification tracking, fixed payment history) Azure production'a güvenli şekilde aktarmak.

---

## ⚡ Hızlı Başlangıç (Önerilen)

### 1. Azure VM'e Bağlan
```bash
ssh obiwan@98.71.149.168
```

### 2. Otomatik Script'i Çalıştır
```bash
cd ~/budget-app
git pull origin main
chmod +x apply-production-migrations.sh
./apply-production-migrations.sh
```

**Bu kadar!** Script her şeyi otomatik yapar:
- ✅ Backup alır
- ✅ Kodu günceller  
- ✅ Migration'ları uygular
- ✅ Veri kontrolü yapar
- ✅ Container'ları yeniden başlatır

**Süre:** ~5-10 dakika

---

## 📚 Detaylı Dökümanlar

1. **PRODUCTION_MIGRATION_QUICK_START.md** - Hızlı komutlar ve rollback
2. **PRODUCTION_DB_MIGRATION_PLAN.md** - Detaylı adım adım plan
3. **apply-production-migrations.sh** - Otomatik migration script'i

---

## 🔍 Migration Sonrası Kontrol

### Web Üzerinden Test
```
https://butce.obiwan.com.tr
```
- Login yapın
- Dashboard'u kontrol edin
- Bildirimler çalışıyor mu?
- Sabit ödemeler görünüyor mu?

### Komut Satırından Kontrol
```bash
# Container durumu
docker ps

# Yeni tabloları kontrol et
docker exec budget_database_prod psql -U postgres -d budget_app -c "\dt" | grep -E "(ai_|smart_|fixed_payment_history)"

# Backend logs
docker logs budget_backend_prod --tail 50
```

---

## 📊 Eklenecek Tablolar

1. **fixed_payment_history** - Sabit ödeme takibi
2. **ai_interactions** - AI etkileşim logları
3. **user_ai_preferences** - Kullanıcı AI tercihleri
4. **category_learning** - Kategori öğrenme
5. **user_spending_profile** - Harcama profili
6. **receipt_images** - Fiş resimleri
7. **smart_notifications** - Akıllı bildirimler
8. **ai_query_history** - AI sorgu geçmişi
9. **financial_coach_sessions** - Finansal koç

**Güncelleme:**
- **smart_notifications** - `related_entity_id` ve `related_entity_type` kolonları

---

## 🔙 Rollback (Sorun Çıkarsa)

```bash
cd ~/db-backups
ls -lt *.sql.gz | head -1  # En son backup'ı bul
gunzip budget_db_backup_YYYYMMDD_HHMMSS.sql.gz
docker exec -i budget_database_prod psql -U postgres -d budget_app < budget_db_backup_YYYYMMDD_HHMMSS.sql
cd ~/budget-app
docker-compose -f docker-compose.prod.yml restart
```

---

## ⚠️ Önemli Notlar

- ✅ **Veri kaybı olmaz** - Sadece yeni tablolar ekleniyor
- ✅ **Backup otomatik** - Script her zaman backup alır
- ✅ **Minimal downtime** - Sadece restart sırasında (~30 saniye)
- ✅ **Rollback hazır** - Backup her zaman mevcut

---

## 🚨 Sorun Giderme

### Script hata verirse
```bash
# Logları kontrol et
docker logs budget_backend_prod --tail 100

# Manuel migration dene
docker exec budget_database_prod psql -U postgres -d budget_app -f /tmp/add_ai_tables.sql
```

### Container başlamazsa
```bash
docker restart budget_backend_prod
docker restart budget_frontend_prod
```

### Database bağlantı sorunu
```bash
docker exec budget_database_prod psql -U postgres -d budget_app -c "SELECT 1;"
```

---

## ✅ Başarı Kriterleri

Migration başarılı sayılır eğer:
- [ ] Tüm yeni tablolar oluşturuldu
- [ ] Mevcut veri korundu (user, transaction sayıları aynı)
- [ ] Backend ve Frontend çalışıyor
- [ ] Web sitesi erişilebilir
- [ ] Login yapılabiliyor
- [ ] Dashboard yükleniyor

---

## 📞 Yardım

Sorun çıkarsa:
1. Önce logları kontrol edin
2. Rollback yapın
3. Manuel adımları deneyin
4. Backup'tan geri yükleyin

**Hazır olduğunuzda başlayalım! 🚀**

---

## 🎬 Sonraki Adımlar

Migration tamamlandıktan sonra:
1. Web sitesini test edin
2. Yeni özellikleri kontrol edin
3. Kullanıcı feedback'i toplayın
4. Monitoring'i gözlemleyin

**Başarılar! 🎉**
