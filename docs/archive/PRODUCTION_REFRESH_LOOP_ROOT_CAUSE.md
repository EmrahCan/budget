# 🔴 Production Refresh Loop - ROOT CAUSE FOUND

## Problem Summary
budgetapp.site'da `/login` sayfasında saniyede 10+ refresh loop oluşuyor.

## Root Cause Analysis

### Nginx Logs Show:
```
GET /login - 200 OK
GET /api/ai/health - 200 OK  
GET /api/ai/rate-limit - 401 Unauthorized
[REPEAT 10+ times per second]
```

### The Issue:
1. **AIContext** her sayfa yüklendiğinde `/api/ai/health` ve `/api/ai/rate-limit` çağırıyor
2. `/api/ai/rate-limit` endpoint'i **401 Unauthorized** dönüyor (user login olmadığı için)
3. Bu 401 hatası bir yerde **catch edilip sayfa yeniden render ediliyor**
4. Yeniden render → Yeni API çağrısı → 401 → Yeniden render → **INFINITE LOOP**

### Why It's Happening:
- AIContext `App.js`'de tüm route'ları sarmalıyor
- Login sayfası da AIContext içinde
- Login olmamış kullanıcı için rate-limit API'si 401 dönüyor
- Bu hata bir yerde yakalanıp state değişikliğine sebep oluyor
- State değişikliği → Re-render → Yeni API çağrısı → Loop

## Solution Options

### Option 1: Skip AI Calls on Login/Register Pages ✅ RECOMMENDED
```javascript
// AIContext.js
useEffect(() => {
  const initialize = async () => {
    // Skip AI initialization on auth pages
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
      return;
    }
    
    try {
      const healthResponse = await aiAPI.healthCheck();
      // ...
    } catch (error) {
      console.error('AI initialization error:', error);
      setAiEnabled(false);
    }
  };

  initialize();
}, []);
```

### Option 2: Make AI Endpoints Public (No Auth Required)
- Remove authentication requirement from `/api/ai/health` and `/api/ai/rate-limit`
- These are read-only endpoints anyway

### Option 3: Wrap AIProvider Inside ProtectedRoute
- Move AIProvider to only wrap protected routes
- Login/Register pages won't have AI context

## Immediate Fix
Apply Option 1 - it's the quickest and safest fix.

## Files to Modify
- `frontend/src/contexts/AIContext.js`
