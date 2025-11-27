# 🚨 Production 502 Error - Fix Guide

## Problem
- Frontend: `https://budgetapp.site` 
- Error: **502 Bad Gateway** on `/api/auth/login`
- Root Cause: Nginx reverse proxy missing or misconfigured

## Quick Diagnosis

### Step 1: SSH to Azure VM
```bash
ssh obiwan@98.71.149.168
# Password: Eben2010++**++
```

### Step 2: Run Diagnostic Script
```bash
cd ~/budget
chmod +x diagnose-production-502.sh
./diagnose-production-502.sh
```

### Step 3: Analyze Results

The script will check:
- ✅ Docker containers running?
- ✅ Backend accessible on localhost:5001?
- ✅ Nginx installed and running?
- ✅ Nginx reverse proxy configured?
- ✅ Frontend API URL correct?

---

## Most Likely Fixes

### Fix 1: Install and Configure Nginx (if not installed)

```bash
# Install nginx
sudo apt update
sudo apt install -y nginx

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Fix 2: Create Nginx Reverse Proxy Configuration

```bash
# Create nginx configuration
sudo tee /etc/nginx/sites-available/budgetapp.site > /dev/null <<'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name budgetapp.site www.budgetapp.site;

    # Frontend static files (if serving from nginx)
    # location / {
    #     root /var/www/budgetapp;
    #     try_files $uri $uri/ /index.html;
    # }

    # Proxy to frontend container
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/budgetapp.site /etc/nginx/sites-enabled/

# Remove default site if exists
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Fix 3: Update Backend CORS (if needed)

```bash
cd ~/budget

# Check current CORS configuration
docker exec budget_backend_prod grep -A 20 "allowedOrigins" /app/server.js

# If budgetapp.site is not in the list, we need to update and redeploy
```

### Fix 4: Test the Fix

```bash
# Test backend directly
curl http://localhost:5001/health

# Test through nginx
curl http://localhost/health
curl http://localhost/api/health

# Test from domain (if DNS is configured)
curl http://budgetapp.site/health
curl http://budgetapp.site/api/health
```

---

## Alternative: Quick Fix Without Nginx

If you want to quickly test without nginx:

### Option A: Update Frontend to Use IP:Port

```bash
cd ~/budget

# Rebuild frontend with IP-based API URL
docker-compose -f docker-compose.prod.yml build frontend \
  --build-arg REACT_APP_API_URL=http://98.71.149.168:5001/api

# Restart frontend
docker-compose -f docker-compose.prod.yml up -d frontend

# Access via: http://98.71.149.168:3000
```

### Option B: Use Port Forwarding

```bash
# Forward port 80 to frontend
sudo iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 3000

# But this won't fix the API calls - nginx is still needed
```

---

## Verification Checklist

After applying fixes:

- [ ] Backend container is running: `docker ps | grep backend`
- [ ] Backend health check works: `curl http://localhost:5001/health`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Nginx proxy works: `curl http://localhost/api/health`
- [ ] Domain resolves: `nslookup budgetapp.site`
- [ ] Domain health check works: `curl http://budgetapp.site/health`
- [ ] Login works in browser: Open https://budgetapp.site and test login
- [ ] No 502 errors in browser console

---

## Common Issues

### Issue: "Connection refused" on localhost:5001
**Solution**: Backend container is not running
```bash
docker-compose -f docker-compose.prod.yml up -d backend
docker logs budget_backend_prod -f
```

### Issue: "nginx: command not found"
**Solution**: Nginx is not installed
```bash
sudo apt update && sudo apt install -y nginx
```

### Issue: "502 Bad Gateway" persists
**Solution**: Check nginx error logs
```bash
sudo tail -f /var/log/nginx/error.log
```

### Issue: CORS errors in browser
**Solution**: Update backend CORS configuration and redeploy

---

## Need Help?

Run the diagnostic script and share the output:
```bash
cd ~/budget
./diagnose-production-502.sh > diagnosis.txt 2>&1
cat diagnosis.txt
```

---

## Permanent Fix

Once working, update GitHub Actions to:
1. Deploy nginx configuration automatically
2. Verify nginx is running after deployment
3. Run health checks before marking deployment successful

See: `.github/workflows/deploy-to-production.yml`
