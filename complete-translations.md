# Tüm Sayfa Çevirilerini Tamamlama Rehberi

## ✅ Tamamlanan İşler:
1. i18n altyapısı kuruldu
2. LanguageSwitcher eklendi
3. Navigation ve Header çevrildi
4. Temel translation dosyaları oluşturuldu

## 📋 Yapılacaklar:

### 1. Translation Dosyalarını Güncelle

`tr-full.json` ve `en-full.json` dosyalarını `tr.json` ve `en.json` olarak kopyala:

```bash
cd frontend/src/i18n/locales
cp tr-full.json tr.json
cp en-full.json en.json
```

### 2. Her Sayfaya `useTranslation` Ekle

Tüm sayfa componentlerinde:

```javascript
import { useTranslation } from 'react-i18next';

const MyPage = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('pages.myPage.title')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

### 3. Sayfalar Listesi (Öncelik Sırasına Göre):

#### Yüksek Öncelik:
- ✅ Dashboard (Ana Sayfa)
- ✅ Sidebar (Navigation)
- ✅ Header
- [ ] LoginPage
- [ ] RegisterPage
- [ ] AccountsPage
- [ ] CreditCardsDashboard
- [ ] TransactionsPage

#### Orta Öncelik:
- [ ] FixedPaymentsPage
- [ ] InstallmentPaymentsPage
- [ ] OverdraftsPage
- [ ] ReportsPage
- [ ] PaymentCalendarPage
- [ ] ProfilePage

#### Düşük Öncelik:
- [ ] AdminDashboard
- [ ] UserManagement

### 4. Otomatik Çeviri Scripti

Tüm hard-coded metinleri bulmak için:

```bash
# Türkçe metinleri bul
grep -r "\"[A-ZÇĞİÖŞÜ]" frontend/src/pages --include="*.js" --include="*.jsx"

# İngilizce metinleri bul (büyük harfle başlayan)
grep -r "\"[A-Z][a-z]" frontend/src/pages --include="*.js" --include="*.jsx"
```

### 5. Hızlı Çeviri Şablonu

Her sayfa için:

```javascript
// 1. Import ekle
import { useTranslation } from 'react-i18next';

// 2. Hook kullan
const { t } = useTranslation();

// 3. Metinleri değiştir
// Önce:  <h1>Hesaplar</h1>
// Sonra: <h1>{t('pages.accounts.title')}</h1>

// Önce:  <Button>Kaydet</Button>
// Sonra: <Button>{t('common.save')}</Button>
```

### 6. Test Etme

Her sayfa çevirildikten sonra:

1. Sayfayı aç
2. Dil değiştir (🌐 ikonu)
3. Tüm metinlerin değiştiğini kontrol et
4. Console'da hata olup olmadığını kontrol et

### 7. Commit ve Deploy

```bash
git add .
git commit -m "feat: Complete all page translations for i18n"
git push origin main
```

## 🚀 Hızlı Başlangıç

En önemli 5 sayfayı çevirmek için:

```bash
# 1. Login/Register sayfaları
# 2. Dashboard
# 3. Accounts
# 4. Transactions  
# 5. Credit Cards
```

Bu sayfalar çevrildiğinde kullanıcıların %80'i çevrilmiş olur.

## 📝 Translation Key Yapısı

```
common.*              -> Genel butonlar, mesajlar
navigation.*          -> Menu itemları
auth.*               -> Login/Register
pages.dashboard.*    -> Dashboard sayfası
pages.accounts.*     -> Accounts sayfası
validation.*         -> Form validasyonları
messages.success.*   -> Başarı mesajları
messages.error.*     -> Hata mesajları
messages.confirm.*   -> Onay mesajları
```

## ⚡ Toplu Çeviri İpuçları

1. **Find & Replace kullan:**
   - "Kaydet" -> {t('common.save')}
   - "İptal" -> {t('common.cancel')}
   - "Sil" -> {t('common.delete')}

2. **Component bazlı çevir:**
   - Önce bir component'i tamamen çevir
   - Test et
   - Sonraki component'e geç

3. **Translation key'leri organize et:**
   - Sayfa bazlı grupla
   - Ortak keyleri `common` altında topla
   - Tutarlı isimlendirme kullan

## 🎯 Hedef

Tüm sayfaların çevirileri tamamlandığında:
- ✅ Kullanıcı dilini seçebilir
- ✅ Tüm metinler çevrilir
- ✅ Dil tercihi kaydedilir
- ✅ Production'da da çalışır

## 📊 İlerleme Takibi

Task listesini kontrol et:
```bash
cat .kiro/specs/multi-language-support/tasks.md
```

Her task tamamlandığında işaretle!
