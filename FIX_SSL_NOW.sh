#!/bin/bash

echo "🔧 SSL Sorunu Acil Çözüm"
echo "========================"
echo ""

# 1. Backend container'ına doğrudan database.js dosyasını düzelt
echo "📝 Backend container'ında database.js dosyasını düzeltiyoruz..."

docker exec budget_backend_prod sh -c 'cat > /app/config/database.js << "EOF"
const { Pool } = require("pg");
require("dotenv").config();

// Database configuration with Docker network support
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "budget_app",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  acquireTimeoutMillis: 60000
};

console.log(`🔗 Connecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

const pool = new Pool(dbConfig);

pool.on("connect", (client) => {
  console.log(`✅ New database connection established (PID: ${client.processID})`);
});

pool.on("acquire", (client) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`🔄 Client acquired from pool (PID: ${client.processID})`);
  }
});

pool.on("remove", (client) => {
  console.log(`🔌 Client removed from pool (PID: ${client.processID})`);
});

pool.on("error", (err, client) => {
  console.error("❌ Unexpected error on idle client:", err);
  console.error("Client details:", client ? `PID: ${client.processID}` : "No client info");
});

process.on("SIGINT", async () => {
  console.log("🔄 Closing database pool...");
  await pool.end();
  console.log("✅ Database pool closed");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🔄 Closing database pool...");
  await pool.end();
  console.log("✅ Database pool closed");
  process.exit(0);
});

const healthCheck = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as current_time, version() as db_version");
    client.release();
    
    return {
      status: "healthy",
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

module.exports = pool;
module.exports.healthCheck = healthCheck;
EOF'

echo "✅ Dosya güncellendi"
echo ""

# 2. Backend'i restart et
echo "🔄 Backend container'ı yeniden başlatılıyor..."
docker restart budget_backend_prod

# 3. Başlamasını bekle
echo "⏳ Backend'in başlaması bekleniyor (15 saniye)..."
sleep 15

# 4. Logları kontrol et
echo ""
echo "📋 Backend Logları:"
echo "==================="
docker logs budget_backend_prod --tail 10

# 5. Login testi
echo ""
echo "🔐 Login Testi:"
echo "==============="
sleep 3
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "Origin: http://108.143.146.143" \
  -d '{"email":"admin@budgetapp.com","password":"admin123"}' \
  -s | jq '.'

echo ""
echo "✅ İşlem tamamlandı!"
