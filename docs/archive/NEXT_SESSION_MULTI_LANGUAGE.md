# Next Session: Multi-Language Support Implementation

**Date Created:** November 22, 2025  
**Status:** Ready for Implementation  
**Spec Location:** `.kiro/specs/multi-language-support/`

---

## 🎯 Quick Start

### Yeni Session'da Söylemen Gerekenler:

```
"Multi-language support spec'ini implement etmek istiyorum.
Task 1'den başla: budget/.kiro/specs/multi-language-support/tasks.md"
```

veya daha spesifik:

```
"Multi-language support için Task 2.1'i implement et"
```

---

## 📋 Spec Özeti

### Amaç
Budget App'e 5 dil desteği eklemek:
- 🇹🇷 Türkçe (mevcut)
- 🇬🇧 İngilizce (mevcut)
- 🇩🇪 Almanca (yeni)
- 🇫🇷 Fransızca (yeni)
- 🇪🇸 İspanyolca (yeni)

### Ana Özellikler
1. **Language Switcher** - Header'da bayraklı dropdown menü
2. **User Preference** - Database'de kullanıcı dil tercihi
3. **Auto Detection** - Tarayıcı dili otomatik algılama
4. **Persistence** - localStorage + database
5. **Formatting** - Tarih/para formatları her dil için
6. **Translation Management** - Eksik çeviri kontrolü

---

## 📁 Spec Dosyaları

### 1. Requirements
**Dosya:** `.kiro/specs/multi-language-support/requirements.md`

**İçerik:**
- 10 ana requirement
- 50+ acceptance criteria
- User stories
- Glossary

### 2. Design
**Dosya:** `.kiro/specs/multi-language-support/design.md`

**İçerik:**
- Architecture diagram
- Component designs
- Database schema
- API endpoints
- Translation file structure
- Utilities (date, number, currency formatting)

### 3. Tasks
**Dosya:** `.kiro/specs/multi-language-support/tasks.md`

**İçerik:**
- 10 ana task
- 45 alt task
- Her task için requirements referansları

---

## 🗂️ Task Listesi Özeti

### Task 1: Database and Backend Setup (4 sub-tasks)
- Add `preferred_language` column to users table
- Update User model
- Create API endpoint for language preference
- Update login response

### Task 2: Frontend i18n Infrastructure (3 sub-tasks)
- Install and configure react-i18next
- Create language configuration constants
- Set up translation file structure

### Task 3: Create Translation Files (5 sub-tasks)
- English (en.json) - base
- Turkish (tr.json)
- German (de.json)
- French (fr.json)
- Spanish (es.json)

### Task 4: Language Switcher Component (3 sub-tasks)
- Create LanguageSwitcher component
- Add to Header
- Implement change handler

### Task 5: Language Context and Hooks (3 sub-tasks)
- Create LanguageContext
- Create useLanguage hook
- Initialize language on app load

### Task 6: Update Components (5 sub-tasks)
- Authentication components
- Dashboard components
- Navigation/layout components
- Form components
- Notification components

### Task 7: Localization Utilities (4 sub-tasks)
- Date formatting
- Number formatting
- Currency formatting
- Relative time formatting

### Task 8: Translation Management Tools (3 sub-tasks)
- Completeness checker script
- Key extractor script
- Build validation

### Task 9: Testing and Validation (5 sub-tasks)
- Language switcher tests
- Persistence tests
- Fallback tests
- Formatting tests
- Detection tests

### Task 10: Documentation and Deployment (5 sub-tasks)
- Developer guide
- Translator guide
- User documentation
- Database migration
- Frontend deployment

---

## 🚀 Önerilen Başlangıç Sırası

### Faz 1: Altyapı (1-2 gün)
1. Task 1: Database & Backend
2. Task 2: i18n Infrastructure
3. Task 5: Context & Hooks

### Faz 2: UI Components (1 gün)
4. Task 4: Language Switcher
5. Task 7: Utilities

### Faz 3: Çeviriler (2-3 gün)
6. Task 3: Translation Files
7. Task 6: Update Components

### Faz 4: Test & Deploy (1 gün)
8. Task 8: Management Tools
9. Task 9: Testing
10. Task 10: Documentation & Deployment

---

## 💡 Önemli Notlar

### Mevcut Durum
- ✅ i18n altyapısı zaten var (react-i18next)
- ✅ Türkçe ve İngilizce çeviriler mevcut
- ✅ `frontend/src/i18n/` klasörü var
- ⏳ Sadece genişletme gerekiyor

### Dikkat Edilmesi Gerekenler

1. **Translation Keys**
   - Mevcut `tr.json` ve `en.json` dosyalarını baz al
   - Aynı key yapısını koru
   - Nested keys kullan (örn: `auth.login.title`)

2. **Database Migration**
   - Production'da dikkatli çalıştır
   - Önce staging'de test et
   - Default value: 'en'

3. **Performance**
   - Translation dosyalarını code-split et
   - Lazy loading kullan
   - Bundle size'ı kontrol et

4. **Fallback Strategy**
   - Missing key → English
   - Missing English → Show key in brackets
   - Log warnings in development

---

## 🔧 Teknik Detaylar

### Database Schema
```sql
ALTER TABLE users 
ADD COLUMN preferred_language VARCHAR(5) DEFAULT 'en';

CREATE INDEX idx_users_preferred_language 
ON users(preferred_language);
```

### API Endpoint
```
PUT /api/users/preferences
Body: { language: 'de' }
Response: { success: true, language: 'de' }
```

### Translation File Structure
```
frontend/src/i18n/locales/
├── en.json (base)
├── tr.json (existing)
├── de.json (new)
├── fr.json (new)
└── es.json (new)
```

### Language Config
```javascript
const SUPPORTED_LANGUAGES = [
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
];
```

---

## 📝 Hızlı Komutlar

### Spec Dosyalarını Aç
```bash
# Requirements
cat budget/.kiro/specs/multi-language-support/requirements.md

# Design
cat budget/.kiro/specs/multi-language-support/design.md

# Tasks
cat budget/.kiro/specs/multi-language-support/tasks.md
```

### Task Başlat
Yeni session'da Kiro'ya söyle:
```
"Task 1.1'i implement et: Add preferred_language column to users table"
```

### Tüm Spec'i Göster
```
"Multi-language support spec'inin tüm dosyalarını göster"
```

---

## 🎨 UI Mockup

### Language Switcher (Header)
```
┌─────────────────────────────────────────────┐
│  Budget App    🌐 English ▼    👤 Profile   │
│                    │                         │
│                    ▼                         │
│              ┌─────────────────┐            │
│              │ 🇹🇷 Türkçe      │            │
│              │ ✓ 🇬🇧 English   │            │
│              │ 🇩🇪 Deutsch     │            │
│              │ 🇫🇷 Français    │            │
│              │ 🇪🇸 Español     │            │
│              └─────────────────┘            │
└─────────────────────────────────────────────┘
```

---

## ✅ Checklist: Implementation Başlamadan Önce

- [ ] Spec dosyalarını oku (requirements, design, tasks)
- [ ] Mevcut i18n yapısını incele (`frontend/src/i18n/`)
- [ ] Mevcut translation dosyalarını gör (`tr.json`, `en.json`)
- [ ] Local development environment hazır
- [ ] Database backup al (migration için)
- [ ] Git branch oluştur: `feature/multi-language-support`

---

## 🔗 İlgili Dosyalar

### Mevcut i18n Dosyaları
- `frontend/src/i18n/config.js` - i18n configuration
- `frontend/src/i18n/locales/tr.json` - Turkish translations
- `frontend/src/i18n/locales/en.json` - English translations

### Güncellenecek Dosyalar
- `backend/models/User.js` - Add language field
- `backend/routes/users.js` - Add preference endpoint
- `frontend/src/components/layout/Header.js` - Add language switcher
- `frontend/src/contexts/AuthContext.js` - Load user language

---

## 📊 Tahmini Süre

| Faz | Süre | Açıklama |
|-----|------|----------|
| Faz 1: Altyapı | 1-2 gün | Database, backend, i18n setup |
| Faz 2: UI | 1 gün | Language switcher, utilities |
| Faz 3: Çeviriler | 2-3 gün | 5 dil x tüm componentler |
| Faz 4: Test & Deploy | 1 gün | Testing, docs, deployment |
| **TOPLAM** | **5-7 gün** | Full implementation |

---

## 🎯 Success Criteria

Implementation tamamlandığında:

- [ ] 5 dil seçeneği header'da görünüyor
- [ ] Dil değişimi anında çalışıyor
- [ ] Seçilen dil localStorage'a kaydediliyor
- [ ] Seçilen dil database'e kaydediliyor
- [ ] Login sonrası kullanıcı dili yükleniyor
- [ ] Tüm UI elementleri çevrilmiş
- [ ] Tarih/para formatları doğru
- [ ] Tarayıcı dili otomatik algılanıyor
- [ ] Missing translation fallback çalışıyor
- [ ] Translation completeness checker çalışıyor

---

## 🆘 Sorun Yaşarsan

### Kiro'ya Sor
```
"Multi-language support spec'inde Task X.Y'yi implement ederken sorun yaşıyorum"
```

### Spec Dosyalarına Bak
```
"Design dokümanında [konu] hakkında ne yazıyor?"
```

### Context Sağla
```
"Requirements dokümanını oku ve Task 3.2'yi implement et"
```

---

## 📚 Kaynaklar

### Documentation
- [react-i18next](https://react.i18next.com/)
- [i18next](https://www.i18next.com/)
- [Intl API](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)

### Translation Services (Opsiyonel)
- Google Translate API
- DeepL API
- Professional translation services

---

## 🎉 Başarılar!

Bu spec ile:
- ✅ Profesyonel çoklu dil desteği
- ✅ Kullanıcı dostu dil değiştirme
- ✅ Kalıcı dil tercihleri
- ✅ Otomatik dil algılama
- ✅ Kolay bakım ve genişletme

---

**Hazır mısın? Yeni session'da "Task 1'den başla" de ve başlayalım! 🚀**
