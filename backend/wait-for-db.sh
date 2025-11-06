#!/bin/sh
# wait-for-db.sh - Wait for database to be ready

set -e

host="${DB_HOST:-database}"
port="${DB_PORT:-5432}"
user="${DB_USER:-postgres}"
database="${DB_NAME:-budget_app_prod}"

echo "⏳ Waiting for database $host:$port to be ready..."

# Wait for database to be ready (max 60 seconds)
counter=0
until pg_isready -h "$host" -p "$port" -U "$user" -d "$database" > /dev/null 2>&1; do
    counter=$((counter+1))
    if [ $counter -gt 30 ]; then
        echo "❌ Database connection timeout after 60 seconds"
        exit 1
    fi
    echo "⏳ Database is unavailable - sleeping (attempt $counter/30)"
    sleep 2
done

echo "✅ Database is ready!"

# Execute the main command
echo "🚀 Starting application..."
exec "$@"