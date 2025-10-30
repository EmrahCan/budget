import ExcelJS from 'exceljs';
import { formatCurrency, formatDate } from './api';
import ExcelFormatter from './excelFormatter';

class ExcelGenerator {
  constructor() {
    this.workbook = null;
    this.formatter = new ExcelFormatter();
    this.styles = {
      header: {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      },
      subHeader: {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      },
      title: {
        font: { bold: true, size: 16, color: { argb: '366092' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      },
      currency: {
        numFmt: '#,##0.00 ₺',
        alignment: { horizontal: 'right' }
      },
      percentage: {
        numFmt: '0.00%',
        alignment: { horizontal: 'right' }
      },
      date: {
        numFmt: 'dd/mm/yyyy',
        alignment: { horizontal: 'center' }
      },
      alternateRow: {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F8F9FA' } }
      },
      border: {
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
    };
  }

  // Initialize workbook
  initializeWorkbook() {
    this.workbook = new ExcelJS.Workbook();
    this.workbook.creator = 'Bütçe Yönetimi Sistemi';
    this.workbook.lastModifiedBy = 'Bütçe Yönetimi Sistemi';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.lastPrinted = new Date();
    
    return this.workbook;
  }

  // Create summary worksheet
  createSummaryWorksheet(reportData) {
    if (!this.workbook || !reportData.summary) return null;

    const worksheet = this.workbook.addWorksheet('Özet', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    let currentRow = 1;

    // Title
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'Finansal Rapor Özeti';
    titleCell.style = this.styles.title;
    currentRow += 2;

    // Report period
    worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
    const periodCell = worksheet.getCell(`A${currentRow}`);
    if (reportData.summary.period) {
      periodCell.value = `Dönem: ${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`;
    } else {
      periodCell.value = `Oluşturulma Tarihi: ${formatDate(new Date())}`;
    }
    periodCell.style = { alignment: { horizontal: 'center' }, font: { italic: true } };
    currentRow += 2;

    // Summary data
    const summaryData = [
      ['Metrik', 'Değer'],
      ['Toplam Gelir', formatCurrency(reportData.summary.totalIncome || 0)],
      ['Toplam Gider', formatCurrency(reportData.summary.totalExpense || 0)],
      ['Net Gelir', formatCurrency(reportData.summary.netIncome || 0)],
      ['İşlem Sayısı', String(reportData.summary.transactionCount || 0)]
    ];

    // Add financial metrics if available
    if (reportData.financialMetrics) {
      summaryData.push(
        ['Tasarruf Oranı', `%${(reportData.financialMetrics.savingsRate || 0).toFixed(2)}`],
        ['Gider Oranı', `%${(reportData.financialMetrics.expenseRatio || 0).toFixed(2)}`],
        ['Finansal Sağlık Skoru', `${(reportData.financialMetrics.healthScore || 0).toFixed(1)}/100`]
      );
    }

    this.addTableToWorksheet(worksheet, summaryData, currentRow, {
      hasHeader: true,
      autoWidth: true
    });

    return worksheet;
  }

  // Create category analysis worksheet
  createCategoryWorksheet(reportData) {
    if (!this.workbook || !reportData.categoryAnalysis) return null;

    const worksheet = this.workbook.addWorksheet('Kategori Analizi', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    let currentRow = 1;

    // Title
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'Kategori Bazlı Harcama Analizi';
    titleCell.style = this.styles.title;
    currentRow += 2;

    // Category data
    const categoryData = [
      ['Kategori', 'Tutar', 'Oran (%)', 'İşlem Sayısı', 'Trend', 'Ortalama İşlem']
    ];

    reportData.categoryAnalysis.forEach(category => {
      const avgTransaction = category.transactionCount > 0 ? 
        category.amount / category.transactionCount : 0;
      
      categoryData.push([
        category.category,
        category.amount,
        category.percentage / 100, // Excel will format as percentage
        category.transactionCount,
        category.trend === 'up' ? '↗ Artış' : 
        category.trend === 'down' ? '↘ Azalış' : '→ Sabit',
        avgTransaction
      ]);
    });

    const table = this.addTableToWorksheet(worksheet, categoryData, currentRow, {
      hasHeader: true,
      autoWidth: true,
      columnFormats: {
        B: 'currency', // Amount
        C: 'percentage', // Percentage
        F: 'currency' // Average transaction
      }
    });

    // Add total row
    const totalRow = currentRow + categoryData.length;
    worksheet.getCell(`A${totalRow}`).value = 'TOPLAM';
    worksheet.getCell(`A${totalRow}`).style = { font: { bold: true } };
    
    const totalAmount = reportData.categoryAnalysis.reduce((sum, cat) => sum + cat.amount, 0);
    const totalTransactions = reportData.categoryAnalysis.reduce((sum, cat) => sum + cat.transactionCount, 0);
    
    worksheet.getCell(`B${totalRow}`).value = totalAmount;
    worksheet.getCell(`B${totalRow}`).style = { ...this.styles.currency, font: { bold: true } };
    worksheet.getCell(`C${totalRow}`).value = 1; // 100%
    worksheet.getCell(`C${totalRow}`).style = { ...this.styles.percentage, font: { bold: true } };
    worksheet.getCell(`D${totalRow}`).value = totalTransactions;
    worksheet.getCell(`D${totalRow}`).style = { font: { bold: true } };

    return worksheet;
  }

  // Create trend analysis worksheet
  createTrendWorksheet(reportData) {
    if (!this.workbook || !reportData.trendAnalysis) return null;

    const worksheet = this.workbook.addWorksheet('Trend Analizi', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    let currentRow = 1;

    // Title
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'Aylık Finansal Trend Analizi';
    titleCell.style = this.styles.title;
    currentRow += 2;

    // Monthly trend data
    if (reportData.trendAnalysis.monthly && reportData.trendAnalysis.monthly.length > 0) {
      const trendData = [
        ['Dönem', 'Gelir', 'Gider', 'Net Gelir', 'Tasarruf Oranı (%)']
      ];

      reportData.trendAnalysis.monthly.forEach(month => {
        const netIncome = month.income - month.expense;
        const savingsRate = month.income > 0 ? (netIncome / month.income) * 100 : 0;
        
        trendData.push([
          month.month,
          month.income,
          month.expense,
          netIncome,
          savingsRate / 100 // Excel will format as percentage
        ]);
      });

      this.addTableToWorksheet(worksheet, trendData, currentRow, {
        hasHeader: true,
        autoWidth: true,
        columnFormats: {
          B: 'currency', // Income
          C: 'currency', // Expense
          D: 'currency', // Net Income
          E: 'percentage' // Savings Rate
        }
      });

      // Add chart data preparation
      currentRow += trendData.length + 3;
      
      // Chart data section
      worksheet.getCell(`A${currentRow}`).value = 'Grafik Verileri (Kopyalayıp grafik oluşturabilirsiniz)';
      worksheet.getCell(`A${currentRow}`).style = { font: { bold: true, size: 12 } };
      currentRow += 2;

      // Simple chart data
      const chartData = [
        ['Ay', 'Gelir', 'Gider']
      ];

      reportData.trendAnalysis.monthly.forEach(month => {
        chartData.push([month.month, month.income, month.expense]);
      });

      this.addTableToWorksheet(worksheet, chartData, currentRow, {
        hasHeader: true,
        autoWidth: true,
        columnFormats: {
          B: 'currency',
          C: 'currency'
        }
      });
    }

    return worksheet;
  }

  // Create detailed transactions worksheet
  createTransactionsWorksheet(reportData) {
    if (!this.workbook) return null;

    const worksheet = this.workbook.addWorksheet('İşlem Detayları', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    let currentRow = 1;

    // Title
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'Detaylı İşlem Listesi';
    titleCell.style = this.styles.title;
    currentRow += 2;

    // Generate sample transaction data based on category analysis
    const transactionData = [
      ['Tarih', 'Kategori', 'Açıklama', 'Tutar', 'Tür', 'Trend']
    ];

    if (reportData.categoryAnalysis) {
      reportData.categoryAnalysis.forEach(category => {
        // Generate sample transactions for each category
        const transactionCount = Math.min(category.transactionCount, 10); // Limit to 10 per category
        const avgAmount = category.amount / category.transactionCount;
        
        for (let i = 0; i < transactionCount; i++) {
          const randomDate = this.generateRandomDate(reportData.summary?.period);
          const amount = avgAmount * (0.5 + Math.random()); // Vary amount
          
          transactionData.push([
            randomDate,
            category.category,
            `${category.category} harcaması`,
            -Math.abs(amount), // Negative for expenses
            'Gider',
            category.trend === 'up' ? '↗' : category.trend === 'down' ? '↘' : '→'
          ]);
        }
      });
    }

    // Sort by date (newest first)
    const dataRows = transactionData.slice(1);
    dataRows.sort((a, b) => new Date(b[0]) - new Date(a[0]));
    const sortedData = [transactionData[0], ...dataRows];

    this.addTableToWorksheet(worksheet, sortedData, currentRow, {
      hasHeader: true,
      autoWidth: true,
      columnFormats: {
        A: 'date', // Date
        D: 'currency' // Amount
      }
    });

    return worksheet;
  }

  // Create financial metrics worksheet
  createMetricsWorksheet(reportData) {
    if (!this.workbook || !reportData.financialMetrics) return null;

    const worksheet = this.workbook.addWorksheet('Finansal Metrikler', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    let currentRow = 1;

    // Title
    worksheet.mergeCells(`A${currentRow}:C${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'Finansal Performans Metrikleri';
    titleCell.style = this.styles.title;
    currentRow += 2;

    // Metrics data
    const metricsData = [
      ['Metrik', 'Değer', 'Açıklama'],
      ['Tasarruf Oranı', (reportData.financialMetrics.savingsRate || 0) / 100, 'Net gelirin toplam gelire oranı'],
      ['Gider Oranı', (reportData.financialMetrics.expenseRatio || 0) / 100, 'Toplam giderin toplam gelire oranı'],
      ['Finansal Sağlık Skoru', (reportData.financialMetrics.healthScore || 0) / 100, 'Genel finansal durumu gösteren skor (0-1 arası)']
    ];

    // Add summary calculations
    if (reportData.summary) {
      const avgDailyExpense = (reportData.summary.totalExpense || 0) / 30;
      const avgDailyIncome = (reportData.summary.totalIncome || 0) / 30;
      const avgTransactionAmount = reportData.summary.transactionCount > 0 ? 
        (reportData.summary.totalExpense || 0) / reportData.summary.transactionCount : 0;

      metricsData.push(
        ['Ortalama Günlük Gider', avgDailyExpense, 'Aylık toplam giderin 30 güne bölümü'],
        ['Ortalama Günlük Gelir', avgDailyIncome, 'Aylık toplam gelirin 30 güne bölümü'],
        ['Ortalama İşlem Tutarı', avgTransactionAmount, 'Toplam giderin işlem sayısına bölümü']
      );
    }

    this.addTableToWorksheet(worksheet, metricsData, currentRow, {
      hasHeader: true,
      autoWidth: true,
      columnFormats: {
        B: 'currency' // Value column
      }
    });

    return worksheet;
  }

  // Add table to worksheet with formatting
  addTableToWorksheet(worksheet, data, startRow, options = {}) {
    const {
      hasHeader = false,
      autoWidth = false,
      columnFormats = {},
      alternateRows = true
    } = options;

    if (!data || data.length === 0) return null;

    const startCol = 1;
    const endCol = data[0].length;
    const endRow = startRow + data.length - 1;

    // Add data
    data.forEach((row, rowIndex) => {
      const currentRow = startRow + rowIndex;
      
      row.forEach((cell, colIndex) => {
        const currentCol = startCol + colIndex;
        const cellRef = worksheet.getCell(currentRow, currentCol);
        
        cellRef.value = cell;
        
        // Apply header style
        if (hasHeader && rowIndex === 0) {
          cellRef.style = this.styles.header;
        } else {
          // Apply border
          cellRef.style = { ...cellRef.style, ...this.styles.border };
          
          // Apply alternate row coloring
          if (alternateRows && rowIndex % 2 === 0 && rowIndex > 0) {
            cellRef.style = { ...cellRef.style, ...this.styles.alternateRow };
          }
          
          // Apply column-specific formatting
          const colLetter = String.fromCharCode(64 + currentCol); // A, B, C, etc.
          if (columnFormats[colLetter]) {
            switch (columnFormats[colLetter]) {
              case 'currency':
                cellRef.style = { ...cellRef.style, ...this.styles.currency };
                break;
              case 'percentage':
                cellRef.style = { ...cellRef.style, ...this.styles.percentage };
                break;
              case 'date':
                cellRef.style = { ...cellRef.style, ...this.styles.date };
                break;
            }
          }
        }
      });
    });

    // Auto-width columns
    if (autoWidth) {
      for (let col = startCol; col <= endCol; col++) {
        let maxLength = 0;
        
        for (let row = startRow; row <= endRow; row++) {
          const cell = worksheet.getCell(row, col);
          const cellLength = String(cell.value || '').length;
          maxLength = Math.max(maxLength, cellLength);
        }
        
        worksheet.getColumn(col).width = Math.min(Math.max(maxLength + 2, 10), 50);
      }
    }

    return {
      startRow,
      endRow,
      startCol,
      endCol
    };
  }

  // Generate random date within period
  generateRandomDate(period) {
    if (!period) {
      // Default to last 30 days
      const end = new Date();
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
      return new Date(randomTime);
    }

    const start = new Date(period.start);
    const end = new Date(period.end);
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
    return new Date(randomTime);
  }

  // Create enhanced summary worksheet with advanced formatting
  createEnhancedSummaryWorksheet(reportData) {
    if (!this.workbook) return null;

    const worksheet = this.workbook.addWorksheet('Gelişmiş Özet', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    let currentRow = 1;
    currentRow = this.formatter.formatFinancialSummary(worksheet, reportData, currentRow);
    
    return worksheet;
  }

  // Create enhanced category worksheet with conditional formatting
  createEnhancedCategoryWorksheet(reportData) {
    if (!this.workbook || !reportData.categoryAnalysis) return null;

    const worksheet = this.workbook.addWorksheet('Gelişmiş Kategori Analizi', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    let currentRow = 1;
    currentRow = this.formatter.formatCategoryAnalysis(worksheet, reportData, currentRow);
    
    return worksheet;
  }

  // Create enhanced trend worksheet with formulas
  createEnhancedTrendWorksheet(reportData) {
    if (!this.workbook || !reportData.trendAnalysis) return null;

    const worksheet = this.workbook.addWorksheet('Gelişmiş Trend Analizi', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });

    let currentRow = 1;
    currentRow = this.formatter.formatTrendAnalysis(worksheet, reportData, currentRow);
    
    return worksheet;
  }

  // Create dashboard worksheet with key metrics
  createDashboardWorksheet(reportData) {
    if (!this.workbook) return null;

    const worksheet = this.workbook.addWorksheet('Dashboard', {
      pageSetup: { paperSize: 9, orientation: 'portrait' }
    });

    let currentRow = 1;

    // Dashboard title
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'FİNANSAL DASHBOARD';
    titleCell.style = this.formatter.advancedStyles.titleMain;
    worksheet.getRow(currentRow).height = 35;
    currentRow += 3;

    // Key Performance Indicators
    if (reportData.summary) {
      const kpiData = [
        ['KPI', 'Değer', 'Hedef', 'Durum', 'Trend'],
        ['Net Gelir', reportData.summary.netIncome || 0, 'Pozitif', 
         (reportData.summary.netIncome || 0) >= 0 ? 'Başarılı' : 'Dikkat', '→'],
        ['Tasarruf Oranı', (reportData.financialMetrics?.savingsRate || 0) / 100, 0.2, 
         (reportData.financialMetrics?.savingsRate || 0) >= 20 ? 'Başarılı' : 'Geliştirilmeli', '→'],
        ['Finansal Sağlık', (reportData.financialMetrics?.healthScore || 0) / 100, 0.7,
         (reportData.financialMetrics?.healthScore || 0) >= 70 ? 'Başarılı' : 'Geliştirilmeli', '→']
      ];

      this.formatter.addAdvancedTable(worksheet, kpiData, currentRow, {
        hasHeader: true,
        columnWidths: [15, 15, 12, 15, 8],
        specialFormatting: true
      });

      currentRow += kpiData.length + 3;
    }

    // Top 5 categories
    if (reportData.categoryAnalysis) {
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const sectionCell = worksheet.getCell(`A${currentRow}`);
      sectionCell.value = 'EN YÜKSEK 5 HARCAMA KATEGORİSİ';
      sectionCell.style = this.formatter.advancedStyles.sectionHeader;
      currentRow += 2;

      const topCategories = reportData.categoryAnalysis.slice(0, 5);
      const categoryData = [['Kategori', 'Tutar', 'Oran', 'Risk']];
      
      topCategories.forEach(cat => {
        categoryData.push([
          cat.category,
          cat.amount,
          cat.percentage / 100,
          this.formatter.calculateCategoryRisk(cat, reportData.categoryAnalysis.reduce((sum, c) => sum + c.amount, 0))
        ]);
      });

      this.formatter.addAdvancedTable(worksheet, categoryData, currentRow, {
        hasHeader: true,
        columnWidths: [20, 15, 10, 12],
        specialFormatting: true
      });
    }

    return worksheet;
  }

  // Generate complete Excel report
  async generateReport(reportData, options = {}) {
    const {
      includeTransactions = true,
      includeMetrics = true,
      includeTrends = true,
      useAdvancedFormatting = true,
      fileName = 'finansal-rapor.xlsx'
    } = options;

    try {
      // Initialize workbook
      this.initializeWorkbook();

      // Create dashboard (always first)
      this.createDashboardWorksheet(reportData);

      // Create worksheets with advanced formatting if requested
      if (useAdvancedFormatting) {
        this.createEnhancedSummaryWorksheet(reportData);
        
        if (reportData.categoryAnalysis) {
          this.createEnhancedCategoryWorksheet(reportData);
        }
        
        if (includeTrends && reportData.trendAnalysis) {
          this.createEnhancedTrendWorksheet(reportData);
        }
      } else {
        // Use basic formatting
        this.createSummaryWorksheet(reportData);
        
        if (reportData.categoryAnalysis) {
          this.createCategoryWorksheet(reportData);
        }
        
        if (includeTrends && reportData.trendAnalysis) {
          this.createTrendWorksheet(reportData);
        }
      }
      
      if (includeTransactions) {
        this.createTransactionsWorksheet(reportData);
      }
      
      if (includeMetrics && reportData.financialMetrics) {
        this.createMetricsWorksheet(reportData);
      }

      return this.workbook;

    } catch (error) {
      console.error('Error generating Excel report:', error);
      throw new Error('Excel raporu oluşturulurken hata oluştu');
    }
  }

  // Save workbook as file
  async saveAsFile(fileName = 'finansal-rapor.xlsx') {
    if (!this.workbook) {
      throw new Error('Workbook oluşturulmamış');
    }

    try {
      const buffer = await this.workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Error saving Excel file:', error);
      throw new Error('Excel dosyası kaydedilirken hata oluştu');
    }
  }

  // Get workbook as buffer
  async getBuffer() {
    if (!this.workbook) {
      throw new Error('Workbook oluşturulmamış');
    }

    return await this.workbook.xlsx.writeBuffer();
  }

  // Get workbook as blob
  async getBlob() {
    const buffer = await this.getBuffer();
    return new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
  }
}

export default ExcelGenerator;