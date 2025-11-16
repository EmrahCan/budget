#!/bin/bash

echo "🔧 Fixing CORS issue - deploying to production..."
echo ""

# Commit changes
git add backend/server.js
git commit -m "Fix CORS: Add origin callback to properly set Access-Control-Allow-Origin header"

# Push to trigger CI/CD
git push origin main

echo ""
echo "✅ Changes pushed! GitHub Actions will deploy automatically."
echo ""
echo "⏳ Wait 2-3 minutes for deployment, then test at:"
echo "   http://98.71.149.168"
echo ""
echo "📧 Login credentials:"
echo "   Email: admin@budgetapp.com"
echo "   Email: emrahcan@hotmail.com"
