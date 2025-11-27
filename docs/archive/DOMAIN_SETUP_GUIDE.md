# Domain Setup Guide - budgetapp.site

## 1. DNS Configuration (Domain Provider)

Add these DNS records at your domain provider:

```
Type: A
Name: @
Value: 98.71.149.168
TTL: 3600

Type: A  
Name: www
Value: 98.71.149.168
TTL: 3600
```

Wait 5-10 minutes for DNS propagation.

## 2. Verify DNS Propagation

```bash
# Check if DNS is working
dig budgetapp.site
nslookup budgetapp.site

# Should return: 98.71.149.168
```

## 3. Setup Nginx and SSL on Azure VM

```bash
# SSH to Azure VM
ssh obiwan@98.71.149.168

# Run setup script
cd ~/budget
chmod +x setup-domain.sh
./setup-domain.sh

# Get SSL certificate
sudo certbot --nginx -d budgetapp.site -d www.budgetapp.site

# Follow prompts:
# - Enter email address
# - Agree to terms
# - Choose to redirect HTTP to HTTPS (option 2)
```

## 4. Update Backend CORS

Already done! Backend now accepts:
- https://budgetapp.site
- https://www.budgetapp.site

## 5. Test the Setup

```bash
# Test HTTP (should redirect to HTTPS)
curl -I http://budgetapp.site

# Test HTTPS
curl -I https://budgetapp.site

# Test API
curl https://budgetapp.site/health
```

## 6. Update Frontend Environment (Optional)

If you want to hardcode the production domain in frontend:

Edit `frontend/.env.production`:
```
REACT_APP_API_URL=https://budgetapp.site/api
```

Then rebuild and redeploy frontend.

## 7. SSL Certificate Auto-Renewal

Certbot automatically sets up renewal. Test it:

```bash
sudo certbot renew --dry-run
```

## Troubleshooting

### DNS not resolving
- Wait longer (up to 24 hours for full propagation)
- Check DNS settings at domain provider
- Use `dig budgetapp.site` to verify

### SSL certificate fails
- Make sure ports 80 and 443 are open in Azure firewall
- Verify DNS is pointing to correct IP
- Check Nginx is running: `sudo systemctl status nginx`

### CORS errors
- Backend already updated with domain
- Clear browser cache
- Check browser console for exact error

## Current Status

✅ Domain purchased: budgetapp.site
✅ Backend CORS updated
⏳ DNS configuration (do this at domain provider)
⏳ Nginx setup (run setup-domain.sh on Azure VM)
⏳ SSL certificate (run certbot after DNS propagates)

## Access URLs

After setup complete:
- **Production**: https://budgetapp.site
- **API**: https://budgetapp.site/api
- **Health**: https://budgetapp.site/health
- **Fallback IP**: http://98.71.149.168
