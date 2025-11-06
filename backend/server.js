const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import performance services - temporarily disabled
// const reportPerformanceService = require('./services/reportPerformanceService');
const logger = require('./utils/logger');

// Import health monitoring
const {
  healthCheckMiddleware,
  systemHealthMiddleware,
  memoryMonitoringMiddleware,
  errorTrackingMiddleware,
  initializeHealthMonitoring,
  shutdownHealthMonitoring
} = require('./middleware/healthCheck');

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
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    // Current Azure VM IP - comprehensive coverage
    'http://108.143.146.143',
    'http://108.143.146.143:80',
    'http://108.143.146.143:3000',
    'https://108.143.146.143',
    'https://108.143.146.143:443',
    // Docker network internal communication
    'http://budget-frontend:3000',
    'http://frontend:3000'
  ],
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
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Handle preflight OPTIONS requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400'); // 24 hours
  res.sendStatus(200);
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(logger.requestMiddleware);

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Budget App Backend is running',
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    uptime: process.uptime()
  });
});

// API routes
const authRoutes = require('./routes/auth');
const creditCardRoutes = require('./routes/creditCards');
const accountRoutes = require('./routes/accounts');
const transactionRoutes = require('./routes/transactions');
const fixedPaymentRoutes = require('./routes/fixedPayments');
const installmentPaymentRoutes = require('./routes/installmentPayments');
const reportRoutes = require('./routes/reports');
const optimizedReportRoutes = require('./routes/optimizedReports');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');

app.use('/api/auth', authRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fixed-payments', fixedPaymentRoutes);
app.use('/api/installment-payments', installmentPaymentRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reports/optimized', optimizedReportRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

// Global error handler
app.use((error, req, res, next) => {
  // Track error in performance monitor
  performanceMonitor.trackError(error, 'request');
  
  logger.errorWithContext('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize services - simplified for stability
async function initializeServices() {
  try {
    logger.info('Basic services initialized successfully');
  } catch (error) {
    logger.errorWithContext('Failed to initialize services', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.errorWithContext('Failed to start server', error);
    process.exit(1);
  }
}

startServer();