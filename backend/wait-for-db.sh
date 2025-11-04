#!/bin/sh
# wait-for-db.sh - Wait for database to be ready

set -e

host="$DB_HOST"
port="$DB_PORT"
user="$DB_USER"
database="$DB_NAME"

echo "⏳ Waiting for database $host:$port to be ready..."

# Install postgresql-client if not available
if ! command -v pg_isready > /dev/null; then
    echo "📦 Installing postgresql-client..."
    apk add --no-cache postgresql-client
fi

# Wait for database to be ready
until pg_isready -h "$host" -p "$port" -U "$user" -d "$database"; do
    echo "⏳ Database is unavailable - sleeping"
    sleep 2
done

echo "✅ Database is ready!"

# Run database migrations if needed
echo "🔄 Running database migrations..."
node database/migrate.js check

# Execute the main command
echo "🚀 Starting application..."
exec "$@"