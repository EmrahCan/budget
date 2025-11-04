#!/bin/bash

# Budget App Backend Starter Script
cd "$(dirname "$0")/../backend"

# Load environment variables
export NODE_ENV=development
export PORT=5002

# Start backend with PM2 (process manager)
npm start