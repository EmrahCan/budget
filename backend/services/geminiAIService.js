const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || 'AIzaSyC9JlhE9djALEg6lPurAbV0PpWY-KdAK1g';
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-1.5-pro';
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    
    // Rate limiting
    this.requestCount = 0;
    this.lastResetTime = Date.now();
    this.maxRequestsPerMinute = 60;
  }

  // Rate limiting check
  checkRateLimit() {
    const now = Date.now();
    const timeDiff = now - this.lastResetTime;
    
    // Reset counter every minute
    if (timeDiff >= 60000) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }
    
    if (this.requestCount >= this.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    this.requestCount++;
  }

  // Expense categorization
  async categorizeExpense(description, amount, context = {}) {
    try {
      this.checkRateLimit();
      
      const prompt = `
        Analyze this financial transaction and categorize it:
        
        Description: "${description}"
        Amount: ${amount} TL
        Context: ${JSON.stringify(context)}
        
        Available categories:
        - Yiyecek ve İçecek (Food & Beverage)
        - Ulaşım (Transportation)
        - Alışveriş (Shopping)
        - Faturalar (Bills)
        - Eğlence (Entertainment)
        - Sağlık (Health)
        - Eğitim (Education)
        - Ev ve Yaşam (Home & Living)
        - Teknoloji (Technology)
        - Giyim (Clothing)
        - Seyahat (Travel)
        - Diğer (Other)
        
        Respond in JSON format:
        {
          "category": "category_name",
          "confidence": 85,
          "reasoning": "Brief explanation in Turkish",
          "suggestedTags": ["tag1", "tag2"],
          "alternativeCategories": ["alt1", "alt2"]
        }
        
        Confidence should be 0-100. Use Turkish for reasoning.
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: parsed
        };
      }
      
      throw new Error('Invalid response format from AI');
      
    } catch (error) {
      console.error('Gemini AI categorization error:', error);
      return {
        success: false,
        error: error.message,
        fallback: {
          category: 'Diğer',
          confidence: 0,
          reasoning: 'AI kategorilendirme başarısız oldu',
          suggestedTags: [],
          alternativeCategories: []
        }
      };
    }
  }

  // Generate comprehensive financial insights with real data
  async generateFinancialInsights(financialData) {
    try {
      this.checkRateLimit();
      
      const prompt = `
Sen bir finansal danışman yapay zekasısın. Aşağıdaki finansal verileri analiz et ve Türkçe öngörüler sun:

FINANSAL VERİLER:
${JSON.stringify(financialData, null, 2)}

Lütfen şu konularda detaylı analiz yap:
1. Gelir-Gider Dengesi: Aylık gelir ve gider oranını değerlendir
2. Kredi Kartı Kullanımı: Kredi kartı kullanım oranını analiz et (%30'un üzeri riskli)
3. Borç Yükü: Toplam borç/varlık oranını değerlendir
4. Harcama Patternleri: Kategori bazında harcama analizi
5. Nakit Akışı: Aylık yükümlülükler vs gelir dengesi
6. Tasarruf Potansiyeli: Tasarruf fırsatlarını belirle

ZORUNLU JSON FORMAT (başka hiçbir metin ekleme):
{
  "insights": [
    {
      "type": "spending_pattern|budget_alert|debt_warning|saving_opportunity|cash_flow",
      "title": "Kısa başlık (Türkçe)",
      "description": "Detaylı açıklama (Türkçe, 2-3 cümle)",
      "severity": "info|warning|critical",
      "actionable": true,
      "recommendations": ["Öneri 1", "Öneri 2", "Öneri 3"]
    }
  ],
  "summary": "Genel finansal durum özeti (Türkçe, 3-4 cümle)",
  "healthScore": 75,
  "keyMetrics": {
    "debtToAssetRatio": 0.25,
    "savingsRate": 0.15,
    "creditUtilization": 0.45
  }
}

En az 4, en fazla 6 insight üret. Her insight için 2-3 actionable recommendation sun.
`;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: parsed
        };
      }
      
      throw new Error('Invalid response format from AI');
      
    } catch (error) {
      console.error('Gemini AI insights error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getMockInsights().data
      };
    }
  }

  getMockInsights() {
    const mockInsights = {
        insights: [
          {
            type: 'spending_pattern',
            title: 'Yüksek Yiyecek Harcaması Tespit Edildi',
            description: 'Son ay yiyecek harcamalarınız bütçenizin %35\'ini oluşturuyor. Bu oran ideal %25 seviyesinin üzerinde.',
            severity: 'warning',
            actionable: true,
            recommendations: [
              'Haftalık yemek planı yaparak market alışverişini optimize edin',
              'Dışarıda yemek yeme sıklığını azaltmayı düşünün',
              'Toplu alışveriş yaparak birim maliyetleri düşürün'
            ]
          },
          {
            type: 'budget_alert',
            title: 'Ulaşım Bütçesi Aşıldı',
            description: 'Bu ay ulaşım harcamalarınız belirlenen bütçeyi %15 aştı.',
            severity: 'critical',
            actionable: true,
            recommendations: [
              'Toplu taşıma kullanımını artırın',
              'Kısa mesafeler için yürümeyi tercih edin',
              'Aylık ulaşım kartı alarak tasarruf sağlayın'
            ]
          },
          {
            type: 'saving_opportunity',
            title: 'Tasarruf Fırsatı Bulundu',
            description: 'Abonelik harcamalarınızda kullanmadığınız servisler tespit edildi.',
            severity: 'info',
            actionable: true,
            recommendations: [
              'Kullanmadığınız dijital abonelikleri iptal edin',
              'Aile paketlerine geçerek maliyet düşürün',
              'Yıllık ödeme seçeneklerini değerlendirin'
            ]
          }
        ],
        summary: 'Genel finansal durumunuz stabil ancak bazı kategorilerde optimizasyon yapılabilir. Özellikle yiyecek ve ulaşım harcamalarında dikkatli olmanız önerilir.'
      };
      
    
    return {
      success: true,
      data: mockInsights
    };
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(userProfile, financialData) {
    try {
      this.checkRateLimit();
      
      // Use mock data in development or when AI_USE_MOCK_DATA is true
      if (process.env.NODE_ENV === 'development' || process.env.AI_USE_MOCK_DATA === 'true') {
        return this.getMockRecommendations();
      }
      
      // Real AI implementation for production
      const prompt = `
        Generate personalized financial recommendations in Turkish:
        
        User Profile: ${JSON.stringify(userProfile)}
        Financial Data: ${JSON.stringify(financialData)}
        
        Provide recommendations for:
        1. Budget optimization
        2. Saving strategies
        3. Cost reduction opportunities
        4. Investment suggestions (if applicable)
        
        Respond in JSON format:
        {
          "recommendations": [
            {
              "id": "unique_id",
              "type": "budget|saving|investment|cost_reduction",
              "title": "Recommendation title in Turkish",
              "description": "Detailed description in Turkish",
              "priority": "high|medium|low",
              "estimatedSavings": 500,
              "timeframe": "1 month",
              "actionSteps": ["step1", "step2"]
            }
          ],
          "totalPotentialSavings": 1500
        }
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: parsed
        };
      }
      
      throw new Error('Invalid response format from AI');
      
    } catch (error) {
      console.error('Gemini AI recommendations error:', error);
      // Fallback to mock data on error
      return this.getMockRecommendations();
    }
  }

  getMockRecommendations() {
    const mockRecommendations = {
        recommendations: [
          {
            id: 'rec_001',
            type: 'budget',
            title: 'Bütçe Kategorilerini Yeniden Düzenleyin',
            description: 'Mevcut harcama desenlerinize göre bütçe kategorilerinizi optimize ederek daha gerçekçi hedefler belirleyin.',
            priority: 'high',
            estimatedSavings: 800,
            timeframe: '1 ay',
            actionSteps: [
              'Son 3 ayın harcama verilerini analiz edin',
              'Gerçekçi olmayan bütçe limitlerini revize edin',
              'Esnek kategoriler için %10 tolerans payı ekleyin'
            ]
          },
          {
            id: 'rec_002',
            type: 'saving',
            title: 'Otomatik Tasarruf Planı Oluşturun',
            description: 'Gelir elde ettiğiniz anda otomatik olarak tasarruf yapacak bir sistem kurun.',
            priority: 'medium',
            estimatedSavings: 1200,
            timeframe: '3 ay',
            actionSteps: [
              'Maaş hesabınızdan otomatik transfer ayarlayın',
              'Gelirin %20\'sini tasarruf hedefi belirleyin',
              'Yüksek faizli tasarruf hesabı açın'
            ]
          },
          {
            id: 'rec_003',
            type: 'cost_reduction',
            title: 'Abonelik Harcamalarını Optimize Edin',
            description: 'Kullanmadığınız veya az kullandığınız abonelikleri iptal ederek aylık sabit giderlerinizi azaltın.',
            priority: 'high',
            estimatedSavings: 350,
            timeframe: '1 hafta',
            actionSteps: [
              'Tüm aktif aboneliklerinizi listeleyin',
              'Son 3 ayda kullanım sıklığını değerlendirin',
              'Gereksiz abonelikleri iptal edin',
              'Kalan abonelikler için daha uygun paketleri araştırın'
            ]
          },
          {
            id: 'rec_004',
            type: 'investment',
            title: 'Acil Durum Fonu Oluşturun',
            description: 'Beklenmedik harcamalar için 3-6 aylık giderinizi karşılayacak bir acil durum fonu oluşturun.',
            priority: 'medium',
            estimatedSavings: 0,
            timeframe: '6 ay',
            actionSteps: [
              'Aylık sabit giderlerinizi hesaplayın',
              '3 aylık gider tutarını hedef belirleyin',
              'Aylık küçük miktarlarla fon biriktirmeye başlayın',
              'Fonu kolay erişilebilir ama faizli hesapta tutun'
            ]
          }
        ],
        totalPotentialSavings: 2350
      };
      
    
    return {
      success: true,
      data: mockRecommendations
    };
  }

  // Process natural language queries
  async processNaturalLanguageQuery(query, userContext) {
    try {
      this.checkRateLimit();
      
      const prompt = `
        Process this natural language query about financial data:
        
        Query: "${query}"
        User Context: ${JSON.stringify(userContext)}
        
        The user is asking about their financial data. Interpret the query and provide:
        1. What data they're looking for
        2. How to present it
        3. Any insights or analysis
        
        Support both Turkish and English queries.
        
        Respond in JSON format:
        {
          "queryType": "financial_data|insight|recommendation",
          "interpretation": "What the user is asking for",
          "dataNeeded": ["transactions", "accounts", "budgets"],
          "response": "Direct answer in Turkish",
          "suggestions": ["related queries"],
          "needsClarification": false,
          "clarificationQuestion": "Question if clarification needed"
        }
      `;
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          success: true,
          data: parsed
        };
      }
      
      throw new Error('Invalid response format from AI');
      
    } catch (error) {
      console.error('Gemini AI query processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Health check
  async healthCheck() {
    // For now, just return healthy if API key exists
    if (this.apiKey && this.apiKey.length > 10) {
      return {
        success: true,
        status: 'healthy',
        response: 'API key configured'
      };
    } else {
      return {
        success: false,
        status: 'unhealthy',
        error: 'API key not configured'
      };
    }
  }
}

module.exports = new GeminiAIService();