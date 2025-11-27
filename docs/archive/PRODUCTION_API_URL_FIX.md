# Production API URL Fix - CRITICAL BUG

## Problem Identified ❌

**Error in Browser Console:**
```
Access to XMLHttpRequest at 'http://localhost:5001/api/auth/login' 
from origin 'https://budgetapp.site' has been blocked by CORS policy
```

**Root Cause:**
Production frontend is trying to connect to `http://localhost:5001/api` instead of the correct production API endpoint!

## Why This Happened

### Current Configuration (WRONG):
```
frontend/.env:
REACT_APP_API_URL=http://localhost:5001/api
```

When building for production, React uses `.env` file if `.env.production` doesn't exist. This means the production build has `localhost:5001` hardcoded in it!

### What Should Happen:
Production frontend should use **relative path** `/api` which will automatically use the same domain (budgetapp.site).

## Solution Implemented ✅

### Created `.env.production` file:
```
frontend/.env.production:
REACT_APP_API_URL=/api
PORT=3000
```

### Why Relative Path?
- `/api` → Automatically becomes `https://budgetapp.site/api`
- No CORS issues
- Works on any domain
- No hardcoded URLs

## How nginx/Reverse Proxy Works

Your setup likely has:
```
https://budgetapp.site → nginx → frontend (port 3000)
https://budgetapp.site/api → nginx → backend (port 5001)
```

So when frontend makes request to `/api/auth/login`, it goes to:
```
https://budgetapp.site/api/auth/login → nginx → http://localhost:5001/api/auth/login
```

## Deployment Steps

### Option 1: Automated (Recommended)
```bash
chmod +x fix-production-api-url.sh
./fix-production-api-url.sh
```

### Option 2: Manual
```bash
# 1. Commit changes
git add frontend/.env.production
git commit -m "Fix production API URL"
git push origin main

# 2. SSH to Azure
ssh azureuser@98.71.149.168
cd ~/budget

# 3. Pull and rebuild
git pull origin main
docker-compose down
docker-compose build frontend
docker-compose up -d

# 4. Verify
curl http://localhost:5001/api/auth/verify
docker logs budget-frontend --tail 20
```

## Verification

After deployment, check browser console:
- ❌ Before: `http://localhost:5001/api/auth/login`
- ✅ After: `https://budgetapp.site/api/auth/login`

## Why It Worked on This Computer

On this computer, you're probably:
1. Running frontend locally (localhost:3000 or 3003)
2. It connects to localhost:5001 backend
3. Both are on localhost, so no CORS issues

But on production:
1. Frontend is on https://budgetapp.site
2. Trying to connect to http://localhost:5001
3. Browser blocks this (Mixed Content + CORS)

## Files Created/Modified

1. ✅ `frontend/.env.production` - Production environment config
2. ✅ `fix-production-api-url.sh` - Automated deployment script
3. ✅ `PRODUCTION_API_URL_FIX.md` - This documentation

## Expected Result

After fix:
- ✅ Login works from any computer
- ✅ No CORS errors
- ✅ No "localhost" in production
- ✅ All API calls use https://budgetapp.site/api

## Testing After Deployment

1. **Clear browser cache** (important!)
2. **Hard refresh**: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
3. **Open browser console** (F12)
4. **Try to login**
5. **Check Network tab** - Should see requests to `https://budgetapp.site/api/...`

## Additional Notes

### Environment Files Priority:
```
npm run build → Uses .env.production (if exists) or .env
npm start → Uses .env.development (if exists) or .env
```

### Best Practice:
- `.env` - Default/fallback values
- `.env.development` - Local development
- `.env.production` - Production build
- `.env.local` - Local overrides (gitignored)

## Security Note

Using relative paths (`/api`) is more secure than absolute URLs because:
- No hardcoded domains
- Works with any domain (staging, production, etc.)
- No CORS configuration needed for same-origin requests
- Easier to maintain

---

**Status:** Fix Ready ✅  
**Action Required:** Run deployment script  
**Priority:** CRITICAL (blocks all users)  
**Estimated Fix Time:** 5-10 minutes  
**Date:** November 22, 2025
