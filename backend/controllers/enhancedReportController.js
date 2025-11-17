const enhancedReportService = require('../services/enhancedReportService');
const geminiAIService = require('../services/geminiAIService');

class EnhancedReportController {
  // Get comprehensive financial report with AI analysis
  static async getComprehensiveReport(req, res) {
    try {
      const userId = req.user.id;
      
      console.log(`Generating comprehensive report for user ${userId}...`);
      
      // Collect all financial data
      const financialData = await enhancedReportService.collectFinancialData(userId);
      
      // Format for AI
      const formattedData = enhancedReportService.formatForAI(financialData);
      
      // Get AI insights
      const aiAnalysis = await geminiAIService.generateFinancialInsights(formattedData);
      
      res.json({
        success: true,
        data: {
          financialData,
          aiAnalysis: aiAnalysis.data || aiAnalysis.fallback,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      res.status(500).json({
        success: false,
        message: 'Kapsamlı rapor oluşturulurken hata oluştu',
        error: error.message
      });
    }
  }

  // Get only AI analysis (faster, cached)
  static async getAIAnalysis(req, res) {
    try {
      const userId = req.user.id;
      
      // Collect financial data
      const financialData = await enhancedReportService.collectFinancialData(userId);
      
      // Format for AI
      const formattedData = enhancedReportService.formatForAI(financialData);
      
      // Get AI insights
      const aiAnalysis = await geminiAIService.generateFinancialInsights(formattedData);
      
      res.json({
        success: true,
        data: aiAnalysis.data || aiAnalysis.fallback
      });
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      res.status(500).json({
        success: false,
        message: 'AI analizi oluşturulurken hata oluştu',
        error: error.message
      });
    }
  }

  // Get financial data summary only (no AI)
  static async getFinancialSummary(req, res) {
    try {
      const userId = req.user.id;
      
      const financialData = await enhancedReportService.collectFinancialData(userId);
      
      res.json({
        success: true,
        data: financialData
      });
    } catch (error) {
      console.error('Error generating financial summary:', error);
      res.status(500).json({
        success: false,
        message: 'Finansal özet oluşturulurken hata oluştu',
        error: error.message
      });
    }
  }
}

module.exports = EnhancedReportController;
