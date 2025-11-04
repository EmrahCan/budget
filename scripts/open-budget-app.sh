#!/bin/bash

# Open Budget App in Browser
echo "Opening Budget App..."

# Check if services are running
if pm2 list | grep -q "budget-backend.*online" && pm2 list | grep -q "budget-frontend.*online"; then
    echo "Services are running, opening browser..."
    open http://localhost:3001
else
    echo "Services not running, starting them first..."
    cd "$(dirname "$0")/.."
    pm2 start ecosystem.config.js
    
    # Wait a bit for services to start
    sleep 5
    
    echo "Opening browser..."
    open http://localhost:3001
fi