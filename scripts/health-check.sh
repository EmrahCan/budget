#!/bin/bash
# Health check script for Docker containers

set -e

SERVICE_NAME=${1:-"unknown"}
HEALTH_URL=${2:-"http://localhost:3000/health"}
TIMEOUT=${3:-10}

echo "🏥 Health check for $SERVICE_NAME"
echo "📍 URL: $HEALTH_URL"
echo "⏱️  Timeout: ${TIMEOUT}s"

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local timeout=$2
    
    if command -v curl >/dev/null 2>&1; then
        response=$(curl -s -w "%{http_code}" -o /tmp/health_response --max-time "$timeout" "$url" || echo "000")
        
        if [ "$response" = "200" ]; then
            echo "✅ Health check passed (HTTP $response)"
            if [ -f /tmp/health_response ]; then
                echo "📊 Response:"
                cat /tmp/health_response | jq '.' 2>/dev/null || cat /tmp/health_response
                rm -f /tmp/health_response
            fi
            return 0
        else
            echo "❌ Health check failed (HTTP $response)"
            if [ -f /tmp/health_response ]; then
                echo "📊 Response:"
                cat /tmp/health_response
                rm -f /tmp/health_response
            fi
            return 1
        fi
    elif command -v wget >/dev/null 2>&1; then
        if wget -q --timeout="$timeout" --spider "$url"; then
            echo "✅ Health check passed"
            return 0
        else
            echo "❌ Health check failed"
            return 1
        fi
    else
        echo "❌ Neither curl nor wget available"
        return 1
    fi
}

# Function to check TCP port
check_tcp() {
    local host=$1
    local port=$2
    local timeout=$3
    
    if timeout "$timeout" bash -c "</dev/tcp/$host/$port"; then
        echo "✅ TCP connection to $host:$port successful"
        return 0
    else
        echo "❌ TCP connection to $host:$port failed"
        return 1
    fi
}

# Main health check logic
case $SERVICE_NAME in
    "backend")
        check_http "http://localhost:5001/health" "$TIMEOUT"
        ;;
    "frontend")
        check_http "http://localhost:3000/health" "$TIMEOUT"
        ;;
    "database")
        check_tcp "localhost" "5432" "$TIMEOUT"
        ;;
    *)
        check_http "$HEALTH_URL" "$TIMEOUT"
        ;;
esac

exit_code=$?

if [ $exit_code -eq 0 ]; then
    echo "🎉 $SERVICE_NAME is healthy"
else
    echo "💥 $SERVICE_NAME is unhealthy"
fi

exit $exit_code