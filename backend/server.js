const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import performance services
const reportPerformanceService = require('./services/reportPerformanceService');
const logger = require('./utils/logger');

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

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001'
  ],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(logger.requestMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Budget App Backend is running',
    timestamp: new Date().toISOString()
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

app.use('/api/auth', authRoutes);
app.use('/api/credit-cards', creditCardRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/fixed-payments', fixedPaymentRoutes);
app.use('/api/installment-payments', installmentPaymentRoutes);
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
app.use((err, req, res, next) => {
  logger.errorWithContext('Unhandled error', err, {
    url: req.url,
    method: req.method,
    userId: req.user ? req.user.id : null
  });
  
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

// Initialize performance services
async function initializeServices() {
  try {
    await reportPerformanceService.initialize();
    logger.info('All performance services initialized successfully');
  } catch (error) {
    logger.errorWithContext('Failed to initialize performance services', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await reportPerformanceService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await reportPerformanceService.shutdown();
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