const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting (more relaxed for development)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // increased limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Parse additional allowed origins from environment
const additionalOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:3001',
  // Azure VM IP addresses - FIXED for port 80
  'http://4.210.173.21',        // Frontend on port 80 (default HTTP)
  'http://4.210.173.21:80',     // Explicit port 80
  'http://4.210.173.21:3000',   // Alternative port
  'https://4.210.173.21',       // HTTPS variant
  'https://4.210.173.21:443',   // HTTPS explicit port
  // Docker network internal communication
  'http://budget-frontend:3000',
  'http://frontend:3000',
  // Additional origins from environment
  ...additionalOrigins
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}`);
      console.error(`Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint with database connectivity
app.get('/health', async (req, res) => {
  try {
    // Import database health check
    const { healthCheck } = require('./config/database');
    
    // Check database connectivity
    const dbHealth = await healthCheck();
    
    const healthStatus = {
      status: dbHealth.status === 'healthy' ? 'OK' : 'DEGRADED',
      message: 'Budget App Backend is running',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: dbHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };

    // Return appropriate status code
    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Detailed monitoring endpoint
app.get('/health/detailed', async (req, res) => {
  try {
    const { healthCheck } = require('./config/database');
    const dbHealth = await healthCheck();
    
    // System metrics
    const systemMetrics = {
      cpu: process.cpuUsage(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    };

    // Application metrics
    const appMetrics = {
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    const detailedHealth = {
      status: dbHealth.status === 'healthy' ? 'HEALTHY' : 'UNHEALTHY',
      checks: {
        database: dbHealth,
        system: systemMetrics,
        application: appMetrics
      }
    };

    const statusCode = dbHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
    
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(503).json({
      status: 'ERROR',
      message: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Readiness probe (for Kubernetes/Docker)
app.get('/ready', async (req, res) => {
  try {
    const { healthCheck } = require('./config/database');
    const dbHealth = await healthCheck();
    
    if (dbHealth.status === 'healthy') {
      res.status(200).json({
        status: 'READY',
        message: 'Service is ready to accept traffic',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'NOT_READY',
        message: 'Service is not ready',
        timestamp: new Date().toISOString(),
        reason: 'Database not available'
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'NOT_READY',
      message: 'Readiness check failed',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness probe (for Kubernetes/Docker)
app.get('/live', (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    message: 'Service is alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
const authRoutes = require('./routes/auth');
const creditCardRoutes = require('./routes/creditCards');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const fixedPaymentRoutes = require('./routes/fixedPayments');
const landPaymentRoutes = require('./routes/landPayments');
const installmentPaymentRoutes = require('./routes/installmentPayments');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');

app.use('/api/auth', authRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fixed-payments', fixedPaymentRoutes);
app.use('/api/land-payments', landPaymentRoutes);
app.use('/api/installment-payments', installmentPaymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});