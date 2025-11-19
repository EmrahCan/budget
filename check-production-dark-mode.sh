#!/bin/bash
# Check if dark mode is working in production

set -e

echo "🌙 Checking Dark Mode in Production"
echo "===================================="
echo ""

VM_HOST="98.71.149.168"
VM_USER="obiwan"
VM_PASSWORD="Eben2010++**++"

echo "📋 Connecting to production server..."
echo ""

sshpass -p "$VM_PASSWORD" ssh -o StrictHostKeyChecking=no $VM_USER@$VM_HOST << 'ENDSSH'
    set -e
    
    cd ~/budget
    
    echo "1️⃣ Checking ThemeContext.js in production..."
    echo "============================================"
    if docker exec budget_frontend_prod test -f /app/src/contexts/ThemeContext.js; then
        echo "✅ ThemeContext.js exists in container"
        echo ""
        echo "Content preview:"
        docker exec budget_frontend_prod head -30 /app/src/contexts/ThemeContext.js
    else
        echo "❌ ThemeContext.js not found in container"
    fi
    echo ""
    
    echo "2️⃣ Checking if dark mode is default..."
    echo "======================================="
    if docker exec budget_frontend_prod grep -q "return savedMode || 'dark'" /app/src/contexts/ThemeContext.js 2>/dev/null; then
        echo "✅ Dark mode is set as default"
    else
        echo "⚠️  Dark mode might not be default"
    fi
    echo ""
    
    echo "3️⃣ Checking frontend build..."
    echo "=============================="
    echo "Frontend container status:"
    docker ps --filter "name=budget_frontend_prod" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    
    echo "4️⃣ Checking frontend logs for errors..."
    echo "========================================"
    echo "Recent logs:"
    docker logs budget_frontend_prod --tail 20
    echo ""
    
    echo "5️⃣ Testing frontend accessibility..."
    echo "===================================="
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend is accessible on http://localhost:3000"
    else
        echo "❌ Frontend is not accessible"
    fi
    echo ""
    
    echo "📊 Summary"
    echo "=========="
    echo "To verify dark mode is working:"
    echo "1. Open http://98.71.149.168:3000 in browser"
    echo "2. Check if the page loads with dark theme"
    echo "3. Look for theme toggle button in the UI"
    echo "4. Test switching between light and dark modes"
    echo ""
    echo "If dark mode is not working, you may need to:"
    echo "- Rebuild frontend container with latest code"
    echo "- Clear browser cache and localStorage"
    echo "- Check browser console for errors"
    echo ""
ENDSSH

echo ""
echo "✅ Check completed!"
echo ""
echo "🌐 Test in browser: http://98.71.149.168:3000"
echo ""
