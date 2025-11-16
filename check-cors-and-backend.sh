#!/bin/bash

echo "=== Checking Backend Container Status ==="
docker ps -a | grep budget_backend

echo -e "\n=== Checking Backend Logs ==="
docker logs --tail=30 budget_backend_prod

echo -e "\n=== Testing Health Endpoint ==="
curl -v http://localhost:5001/health

echo -e "\n=== Testing from Frontend Origin ==="
curl -v -H "Origin: http://98.71.149.168:3000" http://localhost:5001/health

echo -e "\n=== Checking CORS Configuration in Container ==="
docker exec budget_backend_prod grep -A 20 "cors({" /app/server.js
