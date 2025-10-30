import PDFGenerator from './pdfGenerator';
import { formatCurrency, formatDate } from './api';

// PDF Template configurations
export const PDF_TEMPLATES = {
  standard: {
    name: 'Standart Rapor',
    description: 'Temel finansal bilgiler ve özetler',
    includeCharts: false,
    includeDetails: true,
    layout: 'portrait'
  },
  executive: {
    name: 'Yönetici Raporu',
    description: 'Üst düzey özet ve kilit metrikler',
    includeCharts: true,
    includeDetails: false,
    layout: 'portrait'
  },
  detailed: {
    name: 'Detaylı Rapor',
    description: 'Kapsamlı analiz ve grafikler',
    includeCharts: true,
    includeDetails: true,
    layout: 'portrait'
  },
  comparison: {
    name: 'Karşılaştırmalı Rapor',
    description: 'Dönemsel karşılaştırma ve trend analizi',
    includeCharts: true,
    includeDetails: true,
    layout: 'landscape'
  }
};

class PDFTemplateEngine {
  constructor() {
    this.generator = new PDFGenerator();
  }

  // Generate report based on template
  async generateReport(reportData, templateType = 'standard', options = {}) {
    const template = PDF_TEMPLATES[templateType];
    if (!template) {
      throw new Error(`Geçersiz şablon türü: ${templateType}`);
    }

    const {
      title = this.getDefaultTitle(templateType, reportData),
      subtitle = this.getDefaultSubtitle(reportData),
      logoUrl = null,
      customOptions = {}
    } = options;

    // Initialize PDF with template settings
    this.generator.initializePDF(template.layout);

    // Generate report based on template type
    switch (templateType) {
      case 'standard':
        return await this.generateStandardReport(reportData, { title, subtitle, logoUrl, ...customOptions });
      case 'executive':
        return await this.generateExecutiveReport(reportData, { title, subtitle, logoUrl, ...customOptions });
      case 'detailed':
        return await this.generateDetailedReport(reportData, { title, subtitle, logoUrl, ...customOptions });
      case 'comparison':
        return await this.generateComparisonReport(reportData, { title, subtitle, logoUrl, ...customOptions });
      default:
        return await this.generateStandardReport(reportData, { title, subtitle, logoUrl, ...customOptions });
    }
  }

  // Standard Report Template
  async generateStandardReport(reportData, options = {}) {
    const { title, subtitle, logoUrl } = options;

    // Add header
    this.generator.addHeader(title, subtitle, logoUrl);

    // Executive Summary
    this.generator.addHeading('Yönetici Özeti', 1);
    this.generator.addText(this.generateExecutiveSummary(reportData));

    // Financial Summary
    if (reportData.summary) {
      this.generator.addSummarySection(reportData.summary);
    }

    // Key Metrics
    this.addKeyMetricsSection(reportData);

    // Category Analysis
    if (reportData.categoryAnalysis && reportData.categoryAnalysis.length > 0) {
      this.generator.addCategoryAnalysisSection(reportData.categoryAnalysis.slice(0, 10));
    }

    // Recommendations
    this.addRecommendationsSection(reportData);

    // Add footer to all pages
    this.addFooterToAllPages();

    return this.generator.pdf;
  }

  // Executive Report Template
  async generateExecutiveReport(reportData, options = {}) {
    const { title, subtitle, logoUrl } = options;

    // Add header
    this.generator.addHeader(title, subtitle, logoUrl);

    // Executive Dashboard
    this.generator.addHeading('Yönetici Panosu', 1);
    
    // Key Performance Indicators
    this.addKPISection(reportData);

    // Financial Health Score
    this.addFinancialHealthSection(reportData);

    // Top Categories (Top 5)
    if (reportData.categoryAnalysis && reportData.categoryAnalysis.length > 0) {
      this.generator.addHeading('En Yüksek Harcama Kategorileri', 1);
      const topCategories = reportData.categoryAnalysis.slice(0, 5);
      this.generator.addCategoryAnalysisSection(topCategories);
    }

    // Strategic Recommendations
    this.addStrategicRecommendations(reportData);

    // Risk Assessment
    this.addRiskAssessment(reportData);

    this.addFooterToAllPages();
    return this.generator.pdf;
  }

  // Detailed Report Template
  async generateDetailedReport(reportData, options = {}) {
    const { title, subtitle, logoUrl } = options;

    // Add header
    this.generator.addHeader(title, subtitle, logoUrl);

    // Table of Contents
    this.addTableOfContents();

    // Executive Summary
    this.generator.addHeading('Yönetici Özeti', 1);
    this.generator.addText(this.generateExecutiveSummary(reportData));

    // Detailed Financial Analysis
    this.generator.addHeading('Detaylı Finansal Analiz', 1);
    
    // Financial Summary with details
    if (reportData.summary) {
      this.generator.addSummarySection(reportData.summary);
    }

    // Comprehensive Category Analysis
    if (reportData.categoryAnalysis) {
      this.generator.addCategoryAnalysisSection(reportData.categoryAnalysis);
    }

    // Trend Analysis
    if (reportData.trendAnalysis) {
      this.generator.addHeading('Trend Analizi', 1);
      this.generator.addText(this.generator.generateTrendAnalysisText(reportData.trendAnalysis));
    }

    // Financial Metrics Deep Dive
    this.addDetailedMetricsSection(reportData);

    // Transaction Analysis
    this.addTransactionAnalysisSection(reportData);

    // Recommendations and Action Items
    this.addDetailedRecommendations(reportData);

    this.addFooterToAllPages();
    return this.generator.pdf;
  }

  // Comparison Report Template
  async generateComparisonReport(reportData, options = {}) {
    const { title, subtitle, logoUrl } = options;

    // Add header
    this.generator.addHeader(title, subtitle, logoUrl);

    // Comparison Overview
    this.generator.addHeading('Karşılaştırmalı Analiz Özeti', 1);
    this.generator.addText(this.generateComparisonSummary(reportData));

    // Period Comparison
    this.addPeriodComparisonSection(reportData);

    // Category Performance Comparison
    this.addCategoryComparisonSection(reportData);

    // Trend Comparison
    if (reportData.trendAnalysis) {
      this.addTrendComparisonSection(reportData);
    }

    // Growth Analysis
    this.addGrowthAnalysisSection(reportData);

    // Variance Analysis
    this.addVarianceAnalysisSection(reportData);

    // Comparative Recommendations
    this.addComparativeRecommendations(reportData);

    this.addFooterToAllPages();
    return this.generator.pdf;
  }

  // Helper Methods

  getDefaultTitle(templateType, reportData) {
    const templateNames = {
      standard: 'Standart Finansal Rapor',
      executive: 'Yönetici Raporu',
      detailed: 'Detaylı Finansal Analiz',
      comparison: 'Karşılaştırmalı Finansal Rapor'
    };
    return templateNames[templateType] || 'Finansal Rapor';
  }

  getDefaultSubtitle(reportData) {
    if (reportData?.summary?.period) {
      const start = formatDate(reportData.summary.period.start);
      const end = formatDate(reportData.summary.period.end);
      return `Dönem: ${start} - ${end}`;
    }
    return `Oluşturulma Tarihi: ${formatDate(new Date())}`;
  }

  generateExecutiveSummary(reportData) {
    if (!reportData.summary) return 'Özet bilgi mevcut değil.';

    const { totalIncome, totalExpense, netIncome, transactionCount } = reportData.summary;
    const savingsRate = reportData.financialMetrics?.savingsRate || 0;
    const healthScore = reportData.financialMetrics?.healthScore || 0;

    let summary = `Bu rapor, belirtilen dönem içerisindeki finansal performansınızı özetlemektedir.\n\n`;
    
    summary += `Dönem boyunca toplam ${formatCurrency(totalIncome)} gelir elde edilmiş, `;
    summary += `${formatCurrency(totalExpense)} gider yapılmıştır. `;
    summary += `Net gelir ${formatCurrency(netIncome)} olarak gerçekleşmiştir.\n\n`;
    
    summary += `Toplam ${transactionCount} işlem gerçekleştirilmiş, `;
    summary += `tasarruf oranı %${savingsRate.toFixed(1)} olarak hesaplanmıştır. `;
    summary += `Finansal sağlık skorunuz ${healthScore.toFixed(1)}/100'dür.\n\n`;

    if (netIncome > 0) {
      summary += `Pozitif net gelir elde ettiğiniz bu dönemde finansal durumunuz olumlu görünmektedir.`;
    } else {
      summary += `Negatif net gelir durumu, harcama kontrolü yapılması gerektiğini göstermektedir.`;
    }

    return summary;
  }

  generateComparisonSummary(reportData) {
    let summary = `Bu karşılaştırmalı rapor, farklı dönemler arasındaki finansal performans değişimlerini analiz etmektedir.\n\n`;
    
    if (reportData.trendAnalysis?.monthly && reportData.trendAnalysis.monthly.length > 1) {
      const months = reportData.trendAnalysis.monthly;
      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];
      
      const incomeChange = lastMonth.income - firstMonth.income;
      const expenseChange = lastMonth.expense - firstMonth.expense;
      
      summary += `Analiz edilen dönemde gelir ${incomeChange >= 0 ? 'artışı' : 'azalışı'} `;
      summary += `${formatCurrency(Math.abs(incomeChange))}, `;
      summary += `gider ${expenseChange >= 0 ? 'artışı' : 'azalışı'} `;
      summary += `${formatCurrency(Math.abs(expenseChange))} olarak gerçekleşmiştir.\n\n`;
    }

    summary += `Detaylı karşılaştırma analizleri aşağıdaki bölümlerde sunulmaktadır.`;
    
    return summary;
  }

  addKPISection(reportData) {
    this.generator.addHeading('Kilit Performans Göstergeleri', 1);

    const kpis = [];
    
    if (reportData.summary) {
      kpis.push(['Net Gelir', formatCurrency(reportData.summary.netIncome || 0)]);
      kpis.push(['Toplam İşlem', String(reportData.summary.transactionCount || 0)]);
    }

    if (reportData.financialMetrics) {
      kpis.push(['Tasarruf Oranı', `%${(reportData.financialMetrics.savingsRate || 0).toFixed(1)}`]);
      kpis.push(['Finansal Sağlık', `${(reportData.financialMetrics.healthScore || 0).toFixed(1)}/100`]);
    }

    if (kpis.length > 0) {
      this.generator.addTable(['KPI', 'Değer'], kpis, {
        headerBgColor: [52, 152, 219],
        headerTextColor: [255, 255, 255]
      });
    }
  }

  addKeyMetricsSection(reportData) {
    this.generator.addHeading('Temel Metrikler', 1);

    const metrics = [];
    
    if (reportData.summary) {
      const { totalIncome, totalExpense, netIncome } = reportData.summary;
      const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
      
      metrics.push(['Gelir/Gider Oranı', `%${expenseRatio.toFixed(1)}`]);
      metrics.push(['Ortalama Günlük Gider', formatCurrency(totalExpense / 30)]);
      metrics.push(['Ortalama Günlük Gelir', formatCurrency(totalIncome / 30)]);
    }

    if (metrics.length > 0) {
      this.generator.addTable(['Metrik', 'Değer'], metrics);
    }
  }

  addFinancialHealthSection(reportData) {
    this.generator.addHeading('Finansal Sağlık Değerlendirmesi', 1);

    const healthScore = reportData.financialMetrics?.healthScore || 0;
    let healthText = '';

    if (healthScore >= 80) {
      healthText = 'Mükemmel: Finansal durumunuz çok iyi. Mevcut stratejinizi sürdürün.';
    } else if (healthScore >= 60) {
      healthText = 'İyi: Finansal durumunuz olumlu. Küçük iyileştirmeler yapılabilir.';
    } else if (healthScore >= 40) {
      healthText = 'Orta: Finansal durumunuz ortalama. Harcama kontrolü önerilir.';
    } else {
      healthText = 'Zayıf: Finansal durumunuz dikkat gerektiriyor. Acil önlemler alınmalı.';
    }

    this.generator.addText(`Finansal Sağlık Skoru: ${healthScore.toFixed(1)}/100\n\n${healthText}`);
  }

  addRecommendationsSection(reportData) {
    this.generator.addHeading('Öneriler', 1);

    let recommendations = '';
    const netIncome = reportData.summary?.netIncome || 0;
    const savingsRate = reportData.financialMetrics?.savingsRate || 0;

    if (netIncome < 0) {
      recommendations += '• Acil harcama kontrolü yapılması önerilir.\n';
      recommendations += '• Gereksiz harcamaları belirleyip azaltın.\n';
      recommendations += '• Ek gelir kaynakları araştırın.\n\n';
    }

    if (savingsRate < 10) {
      recommendations += '• Tasarruf oranınızı artırmaya odaklanın.\n';
      recommendations += '• Aylık bütçe planı oluşturun.\n';
      recommendations += '• Otomatik tasarruf planı kurun.\n\n';
    }

    if (reportData.categoryAnalysis && reportData.categoryAnalysis.length > 0) {
      const topCategory = reportData.categoryAnalysis[0];
      if (topCategory.percentage > 40) {
        recommendations += `• ${topCategory.category} kategorisindeki harcamalarınız toplam giderin %${topCategory.percentage.toFixed(1)}'ini oluşturuyor. Bu alanda tasarruf imkanları araştırın.\n\n`;
      }
    }

    if (!recommendations) {
      recommendations = 'Finansal durumunuz genel olarak olumlu görünmektedir. Mevcut stratejinizi sürdürmeye devam edin.';
    }

    this.generator.addText(recommendations);
  }

  addStrategicRecommendations(reportData) {
    this.generator.addHeading('Stratejik Öneriler', 1);

    let strategies = '';
    const healthScore = reportData.financialMetrics?.healthScore || 0;

    if (healthScore < 50) {
      strategies += '1. Acil Eylem Planı:\n';
      strategies += '   • Tüm harcamaları gözden geçirin\n';
      strategies += '   • Gereksiz abonelikleri iptal edin\n';
      strategies += '   • Acil durum fonu oluşturun\n\n';
    }

    strategies += '2. Orta Vadeli Hedefler:\n';
    strategies += '   • 3-6 aylık acil durum fonu oluşturun\n';
    strategies += '   • Yatırım planı geliştirin\n';
    strategies += '   • Borç azaltma stratejisi uygulayın\n\n';

    strategies += '3. Uzun Vadeli Planlama:\n';
    strategies += '   • Emeklilik planlaması yapın\n';
    strategies += '   • Çeşitlendirilmiş yatırım portföyü oluşturun\n';
    strategies += '   • Finansal hedeflerinizi düzenli gözden geçirin';

    this.generator.addText(strategies);
  }

  addRiskAssessment(reportData) {
    this.generator.addHeading('Risk Değerlendirmesi', 1);

    let riskText = 'Finansal Risk Analizi:\n\n';
    
    const netIncome = reportData.summary?.netIncome || 0;
    const savingsRate = reportData.financialMetrics?.savingsRate || 0;

    // Income Risk
    if (netIncome < 0) {
      riskText += '🔴 Yüksek Risk: Negatif net gelir\n';
    } else if (savingsRate < 5) {
      riskText += '🟡 Orta Risk: Düşük tasarruf oranı\n';
    } else {
      riskText += '🟢 Düşük Risk: Pozitif finansal durum\n';
    }

    // Expense Concentration Risk
    if (reportData.categoryAnalysis && reportData.categoryAnalysis.length > 0) {
      const topCategory = reportData.categoryAnalysis[0];
      if (topCategory.percentage > 50) {
        riskText += `🔴 Yüksek Risk: ${topCategory.category} kategorisinde yoğunlaşma\n`;
      }
    }

    this.generator.addText(riskText);
  }

  addTableOfContents() {
    this.generator.addHeading('İçindekiler', 1);
    
    const contents = [
      '1. Yönetici Özeti',
      '2. Detaylı Finansal Analiz',
      '3. Kategori Analizi',
      '4. Trend Analizi',
      '5. Finansal Metrikler',
      '6. İşlem Analizi',
      '7. Öneriler ve Eylem Planı'
    ];

    contents.forEach(item => {
      this.generator.addText(item, this.generator.fontSize.body);
    });

    this.generator.addNewPage();
  }

  addDetailedMetricsSection(reportData) {
    this.generator.addHeading('Detaylı Finansal Metrikler', 1);

    if (reportData.financialMetrics) {
      const metrics = reportData.financialMetrics;
      const detailedMetrics = [
        ['Tasarruf Oranı', `%${(metrics.savingsRate || 0).toFixed(2)}`],
        ['Gider Oranı', `%${(metrics.expenseRatio || 0).toFixed(2)}`],
        ['Finansal Sağlık Skoru', `${(metrics.healthScore || 0).toFixed(2)}/100`]
      ];

      this.generator.addTable(['Metrik', 'Değer'], detailedMetrics);
    }
  }

  addTransactionAnalysisSection(reportData) {
    this.generator.addHeading('İşlem Analizi', 1);

    if (reportData.summary) {
      const avgTransactionAmount = reportData.summary.totalExpense / (reportData.summary.transactionCount || 1);
      
      const transactionStats = [
        ['Toplam İşlem Sayısı', String(reportData.summary.transactionCount || 0)],
        ['Ortalama İşlem Tutarı', formatCurrency(avgTransactionAmount)],
        ['En Yüksek Kategori', reportData.categoryAnalysis?.[0]?.category || 'N/A'],
        ['En Yüksek Tutar', formatCurrency(reportData.categoryAnalysis?.[0]?.amount || 0)]
      ];

      this.generator.addTable(['İstatistik', 'Değer'], transactionStats);
    }
  }

  addDetailedRecommendations(reportData) {
    this.generator.addHeading('Detaylı Öneriler ve Eylem Planı', 1);

    let recommendations = 'Finansal durumunuzu iyileştirmek için aşağıdaki eylem planını uygulayabilirsiniz:\n\n';

    recommendations += '1. Kısa Vadeli Eylemler (1-3 ay):\n';
    recommendations += '   • Tüm harcamalarınızı kategorize edin\n';
    recommendations += '   • Gereksiz abonelikleri iptal edin\n';
    recommendations += '   • Haftalık bütçe takibi yapın\n\n';

    recommendations += '2. Orta Vadeli Hedefler (3-12 ay):\n';
    recommendations += '   • Acil durum fonu oluşturun\n';
    recommendations += '   • Yüksek faizli borçları kapatın\n';
    recommendations += '   • Gelir artırıcı fırsatları değerlendirin\n\n';

    recommendations += '3. Uzun Vadeli Planlama (1+ yıl):\n';
    recommendations += '   • Yatırım planı oluşturun\n';
    recommendations += '   • Emeklilik tasarrufu başlatın\n';
    recommendations += '   • Finansal hedeflerinizi yıllık gözden geçirin';

    this.generator.addText(recommendations);
  }

  addPeriodComparisonSection(reportData) {
    this.generator.addHeading('Dönem Karşılaştırması', 1);

    if (reportData.trendAnalysis?.monthly && reportData.trendAnalysis.monthly.length > 1) {
      const months = reportData.trendAnalysis.monthly;
      const comparisonData = months.map(month => [
        month.month,
        formatCurrency(month.income),
        formatCurrency(month.expense),
        formatCurrency(month.income - month.expense)
      ]);

      this.generator.addTable(
        ['Dönem', 'Gelir', 'Gider', 'Net'],
        comparisonData,
        { fontSize: this.generator.fontSize.small }
      );
    }
  }

  addCategoryComparisonSection(reportData) {
    this.generator.addHeading('Kategori Performans Karşılaştırması', 1);

    if (reportData.categoryAnalysis) {
      const categoryComparison = reportData.categoryAnalysis.map(cat => [
        cat.category,
        formatCurrency(cat.amount),
        `%${cat.percentage.toFixed(1)}`,
        cat.trend === 'up' ? '↗ Artış' : cat.trend === 'down' ? '↘ Azalış' : '→ Sabit'
      ]);

      this.generator.addTable(
        ['Kategori', 'Tutar', 'Oran', 'Trend'],
        categoryComparison,
        { fontSize: this.generator.fontSize.small }
      );
    }
  }

  addTrendComparisonSection(reportData) {
    this.generator.addHeading('Trend Karşılaştırması', 1);
    this.generator.addText(this.generator.generateTrendAnalysisText(reportData.trendAnalysis));
  }

  addGrowthAnalysisSection(reportData) {
    this.generator.addHeading('Büyüme Analizi', 1);

    if (reportData.trendAnalysis?.monthly && reportData.trendAnalysis.monthly.length > 1) {
      const months = reportData.trendAnalysis.monthly;
      const firstMonth = months[0];
      const lastMonth = months[months.length - 1];

      const incomeGrowth = firstMonth.income > 0 ? 
        ((lastMonth.income - firstMonth.income) / firstMonth.income) * 100 : 0;
      const expenseGrowth = firstMonth.expense > 0 ? 
        ((lastMonth.expense - firstMonth.expense) / firstMonth.expense) * 100 : 0;

      const growthData = [
        ['Gelir Büyümesi', `%${incomeGrowth.toFixed(2)}`],
        ['Gider Büyümesi', `%${expenseGrowth.toFixed(2)}`],
        ['Net Büyüme', `%${(incomeGrowth - expenseGrowth).toFixed(2)}`]
      ];

      this.generator.addTable(['Metrik', 'Büyüme Oranı'], growthData);
    }
  }

  addVarianceAnalysisSection(reportData) {
    this.generator.addHeading('Varyans Analizi', 1);
    
    let varianceText = 'Bu bölümde beklenen değerler ile gerçekleşen değerler arasındaki farklar analiz edilmektedir.\n\n';
    
    if (reportData.summary) {
      const avgMonthlyExpense = reportData.summary.totalExpense / 12; // Assuming yearly data
      varianceText += `Ortalama aylık gider: ${formatCurrency(avgMonthlyExpense)}\n`;
      varianceText += 'Standart sapma ve varyans hesaplamaları için daha fazla veri gereklidir.';
    }

    this.generator.addText(varianceText);
  }

  addComparativeRecommendations(reportData) {
    this.generator.addHeading('Karşılaştırmalı Öneriler', 1);

    let recommendations = 'Karşılaştırmalı analiz sonuçlarına dayalı öneriler:\n\n';

    if (reportData.trendAnalysis?.monthly && reportData.trendAnalysis.monthly.length > 1) {
      const months = reportData.trendAnalysis.monthly;
      const recentMonths = months.slice(-3);
      const avgRecentExpense = recentMonths.reduce((sum, m) => sum + m.expense, 0) / recentMonths.length;
      const avgRecentIncome = recentMonths.reduce((sum, m) => sum + m.income, 0) / recentMonths.length;

      if (avgRecentExpense > avgRecentIncome) {
        recommendations += '• Son dönemde giderleriniz gelirinizi aşmış durumda. Acil harcama kontrolü gerekli.\n';
      }

      recommendations += '• Trend analizine göre gelecek dönem projeksiyonlarınızı güncelleyin.\n';
      recommendations += '• Dönemsel değişimleri dikkate alarak bütçe planlaması yapın.\n';
    }

    this.generator.addText(recommendations);
  }

  addFooterToAllPages() {
    const totalPages = this.generator.pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.generator.pdf.setPage(i);
      this.generator.addFooter(i, totalPages);
    }
  }
}

export default PDFTemplateEngine;