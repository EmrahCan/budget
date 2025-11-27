const express = require('express');
const EnhancedReportController = require('../controllers/enhancedReportController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get comprehensive financial report with AI analysis
router.get('/comprehensive', EnhancedReportController.getComprehensiveReport);

// Get only AI analysis (faster)
router.get('/ai-analysis', EnhancedReportController.getAIAnalysis);

// Get financial summary only (no AI)
router.get('/financial-summary', EnhancedReportController.getFinancialSummary);

module.exports = router;
