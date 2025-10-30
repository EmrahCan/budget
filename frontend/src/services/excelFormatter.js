import { formatCurrency, formatDate } from './api';

class ExcelFormatter {
  constructor() {
    // Advanced Excel styles
    this.advancedStyles = {
      titleMain: {
        font: { bold: true, size: 20, color: { argb: '1F4E79' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7E6E6' } },
        border: {
          top: { style: 'thick', color: { argb: '1F4E79' } },
          bottom: { style: 'thick', color: { argb: '1F4E79' } }
        }
      },
      sectionHeader: {
        font: { bold: true, size: 14, color: { argb: '1F4E79' } },
        alignment: { horizontal: 'left', vertical: 'middle' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9E2F3' } },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      },
      dataHeader: {
        font: { bold: true, size: 11, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      },
      positiveNumber: {
        font: { color: { argb: '00B050' } },
        numFmt: '#,##0.00 ₺',
        alignment: { horizontal: 'right' }
      },
      negativeNumber: {
        font: { color: { argb: 'C5504B' } },
        numFmt: '#,##0.00 ₺',
        alignment: { horizontal: 'right' }
      },
      percentageGood: {
        font: { color: { argb: '00B050' } },
        numFmt: '0.00%',
        alignment: { horizontal: 'right' }
      },
      percentageBad: {
        font: { color: { argb: 'C5504B' } },
        numFmt: '0.00%',
        alignment: { horizontal: 'right' }
      },
      trendUp: {
        font: { color: { argb: 'C5504B' }, bold: true },
        alignment: { horizontal: 'center' }
      },
      trendDown: {
        font: { color: { argb: '00B050' }, bold: true },
        alignment: { horizontal: 'center' }
      },
      trendStable: {
        font: { color: { argb: '7F7F7F' } },
        alignment: { horizontal: 'center' }
      },
      totalRow: {
        font: { bold: true, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F2F2F2' } },
        border: {
          top: { style: 'thick', color: { argb: '000000' } },
          bottom: { style: 'thick', color: { argb: '000000' } }
        }
      },
      warningCell: {
        font: { color: { argb: 'FFFFFF' }, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B35' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      },
      successCell: {
        font: { color: { argb: 'FFFFFF' }, bold: true },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '28A745' } },
        alignment: { horizontal: 'center', vertical: 'middle' }
      }
    };

    // Number formats
    this.numberFormats = {
      currency: '#,##0.00 ₺',
      currencyNoDecimals: '#,##0 ₺',
      percentage: '0.00%',
      percentageNoDecimals: '0%',
      number: '#,##0.00',
      integer: '#,##0',
      date: 'dd/mm/yyyy',
      dateTime: 'dd/mm/yyyy hh:mm',
      monthYear: 'mmm yyyy'
    };
  }

  // Format financial summary with advanced styling
  formatFinancialSummary(worksheet, reportData, startRow = 1) {
    let currentRow = startRow;

    // Main title
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'FİNANSAL ÖZET RAPORU';
    titleCell.style = this.advancedStyles.titleMain;
    worksheet.getRow(currentRow).height = 30;
    currentRow += 2;

    // Period info
    if (reportData.summary?.period) {
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const periodCell = worksheet.getCell(`A${currentRow}`);
      periodCell.value = `Rapor Dönemi: ${formatDate(reportData.summary.period.start)} - ${formatDate(reportData.summary.period.end)}`;
      periodCell.style = {
        font: { italic: true, size: 11 },
        alignment: { horizontal: 'center' }
      };
      currentRow += 2;
    }

    // Key metrics section
    worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
    const sectionCell = worksheet.getCell(`A${currentRow}`);
    sectionCell.value = 'Temel Finansal Göstergeler';
    sectionCell.style = this.advancedStyles.sectionHeader;
    currentRow += 1;

    // Metrics table
    const metricsData = [
      ['Metrik', 'Değer', 'Durum', 'Açıklama', 'Hedef']
    ];

    if (reportData.summary) {
      const { totalIncome, totalExpense, netIncome, transactionCount } = reportData.summary;
      const savingsRate = reportData.financialMetrics?.savingsRate || 0;
      const healthScore = reportData.financialMetrics?.healthScore || 0;

      metricsData.push(
        ['Toplam Gelir', totalIncome, this.getIncomeStatus(totalIncome), 'Dönem içi toplam gelir', 'Artış'],
        ['Toplam Gider', totalExpense, this.getExpenseStatus(totalExpense, totalIncome), 'Dönem içi toplam gider', 'Kontrol'],
        ['Net Gelir', netIncome, this.getNetIncomeStatus(netIncome), 'Gelir - Gider farkı', 'Pozitif'],
        ['Tasarruf Oranı', savingsRate / 100, this.getSavingsRateStatus(savingsRate), 'Net gelir / Toplam gelir', '≥ %20'],
        ['Finansal Sağlık', healthScore / 100, this.getHealthScoreStatus(healthScore), 'Genel finansal durum skoru', '≥ %70'],
        ['İşlem Sayısı', transactionCount, 'Bilgi', 'Toplam işlem adedi', 'N/A']
      );
    }

    this.addAdvancedTable(worksheet, metricsData, currentRow, {
      hasHeader: true,
      columnWidths: [20, 15, 12, 25, 12],
      specialFormatting: true
    });

    return currentRow + metricsData.length + 2;
  }

  // Format category analysis with conditional formatting
  formatCategoryAnalysis(worksheet, reportData, startRow = 1) {
    if (!reportData.categoryAnalysis) return startRow;

    let currentRow = startRow;

    // Section title
    worksheet.mergeCells(`A${currentRow}:G${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'KATEGORİ BAZLI HARCAMA ANALİZİ';
    titleCell.style = this.advancedStyles.sectionHeader;
    currentRow += 2;

    // Category data with advanced formatting
    const categoryData = [
      ['Kategori', 'Tutar', 'Oran', 'İşlem', 'Ort. İşlem', 'Trend', 'Risk Seviyesi']
    ];

    const totalAmount = reportData.categoryAnalysis.reduce((sum, cat) => sum + cat.amount, 0);

    reportData.categoryAnalysis.forEach(category => {
      const avgTransaction = category.transactionCount > 0 ? 
        category.amount / category.transactionCount : 0;
      const riskLevel = this.calculateCategoryRisk(category, totalAmount);
      
      categoryData.push([
        category.category,
        category.amount,
        category.percentage / 100,
        category.transactionCount,
        avgTransaction,
        this.formatTrend(category.trend),
        riskLevel
      ]);
    });

    // Add total row
    const totalTransactions = reportData.categoryAnalysis.reduce((sum, cat) => sum + cat.transactionCount, 0);
    const avgOverallTransaction = totalTransactions > 0 ? totalAmount / totalTransactions : 0;
    
    categoryData.push([
      'TOPLAM',
      totalAmount,
      1, // 100%
      totalTransactions,
      avgOverallTransaction,
      '',
      ''
    ]);

    this.addAdvancedTable(worksheet, categoryData, currentRow, {
      hasHeader: true,
      columnWidths: [18, 15, 10, 8, 12, 10, 12],
      specialFormatting: true,
      hasTotalRow: true
    });

    // Add formulas for analysis
    const formulaRow = currentRow + categoryData.length + 2;
    this.addCategoryFormulas(worksheet, formulaRow, categoryData.length - 2); // Exclude header and total

    return formulaRow + 5;
  }

  // Format trend analysis with charts preparation
  formatTrendAnalysis(worksheet, reportData, startRow = 1) {
    if (!reportData.trendAnalysis?.monthly) return startRow;

    let currentRow = startRow;

    // Section title
    worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
    const titleCell = worksheet.getCell(`A${currentRow}`);
    titleCell.value = 'TREND ANALİZİ VE PROJEKSİYONLAR';
    titleCell.style = this.advancedStyles.sectionHeader;
    currentRow += 2;

    // Monthly data with calculations
    const trendData = [
      ['Dönem', 'Gelir', 'Gider', 'Net Gelir', 'Tasarruf Oranı', 'Büyüme Oranı']
    ];

    const monthlyData = reportData.trendAnalysis.monthly;
    
    monthlyData.forEach((month, index) => {
      const netIncome = month.income - month.expense;
      const savingsRate = month.income > 0 ? (netIncome / month.income) : 0;
      
      // Calculate growth rate compared to previous month
      let growthRate = 0;
      if (index > 0) {
        const prevMonth = monthlyData[index - 1];
        const prevNet = prevMonth.income - prevMonth.expense;
        if (prevNet !== 0) {
          growthRate = (netIncome - prevNet) / Math.abs(prevNet);
        }
      }
      
      trendData.push([
        month.month,
        month.income,
        month.expense,
        netIncome,
        savingsRate,
        growthRate
      ]);
    });

    this.addAdvancedTable(worksheet, trendData, currentRow, {
      hasHeader: true,
      columnWidths: [12, 15, 15, 15, 12, 12],
      specialFormatting: true
    });

    // Add trend formulas and projections
    const formulaRow = currentRow + trendData.length + 2;
    this.addTrendFormulas(worksheet, formulaRow, trendData.length - 1);

    return formulaRow + 8;
  }

  // Add advanced table with conditional formatting
  addAdvancedTable(worksheet, data, startRow, options = {}) {
    const {
      hasHeader = false,
      columnWidths = [],
      specialFormatting = false,
      hasTotalRow = false
    } = options;

    if (!data || data.length === 0) return;

    const startCol = 1;
    const endCol = data[0].length;
    const endRow = startRow + data.length - 1;

    // Set column widths
    columnWidths.forEach((width, index) => {
      if (width) {
        worksheet.getColumn(startCol + index).width = width;
      }
    });

    // Add data with formatting
    data.forEach((row, rowIndex) => {
      const currentRow = startRow + rowIndex;
      
      row.forEach((cell, colIndex) => {
        const currentCol = startCol + colIndex;
        const cellRef = worksheet.getCell(currentRow, currentCol);
        
        cellRef.value = cell;
        
        // Apply styles based on position and content
        if (hasHeader && rowIndex === 0) {
          cellRef.style = this.advancedStyles.dataHeader;
        } else if (hasTotalRow && rowIndex === data.length - 1) {
          cellRef.style = this.advancedStyles.totalRow;
          this.applyTotalRowFormatting(cellRef, colIndex, cell);
        } else if (specialFormatting) {
          this.applySpecialFormatting(cellRef, rowIndex, colIndex, cell, data[0][colIndex]);
        }
      });
    });

    // Add borders to entire table
    for (let row = startRow; row <= endRow; row++) {
      for (let col = startCol; col <= startCol + endCol - 1; col++) {
        const cell = worksheet.getCell(row, col);
        if (!cell.style.border) {
          cell.style = {
            ...cell.style,
            border: {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
        }
      }
    }
  }

  // Apply special formatting based on content
  applySpecialFormatting(cell, rowIndex, colIndex, value, columnHeader) {
    // Skip header row
    if (rowIndex === 0) return;

    switch (columnHeader) {
      case 'Tutar':
      case 'Ort. İşlem':
        if (typeof value === 'number') {
          cell.style = value >= 0 ? this.advancedStyles.positiveNumber : this.advancedStyles.negativeNumber;
        }
        break;
        
      case 'Net Gelir':
        if (typeof value === 'number') {
          cell.style = value >= 0 ? this.advancedStyles.positiveNumber : this.advancedStyles.negativeNumber;
        }
        break;
        
      case 'Oran':
      case 'Tasarruf Oranı':
        if (typeof value === 'number') {
          cell.style = value >= 0.1 ? this.advancedStyles.percentageGood : this.advancedStyles.percentageBad;
        }
        break;
        
      case 'Büyüme Oranı':
        if (typeof value === 'number') {
          cell.style = value >= 0 ? this.advancedStyles.percentageGood : this.advancedStyles.percentageBad;
        }
        break;
        
      case 'Trend':
        if (typeof value === 'string') {
          if (value.includes('↗')) {
            cell.style = this.advancedStyles.trendUp;
          } else if (value.includes('↘')) {
            cell.style = this.advancedStyles.trendDown;
          } else {
            cell.style = this.advancedStyles.trendStable;
          }
        }
        break;
        
      case 'Durum':
        if (typeof value === 'string') {
          if (value === 'İyi' || value === 'Mükemmel') {
            cell.style = this.advancedStyles.successCell;
          } else if (value === 'Dikkat' || value === 'Kötü') {
            cell.style = this.advancedStyles.warningCell;
          }
        }
        break;
        
      case 'Risk Seviyesi':
        if (typeof value === 'string') {
          if (value === 'Yüksek') {
            cell.style = this.advancedStyles.warningCell;
          } else if (value === 'Düşük') {
            cell.style = this.advancedStyles.successCell;
          }
        }
        break;
        
      default:
        // Apply basic formatting
        if (typeof value === 'number' && value !== Math.floor(value)) {
          cell.numFmt = this.numberFormats.number;
        }
        break;
    }
  }

  // Apply total row formatting
  applyTotalRowFormatting(cell, colIndex, value) {
    cell.style = { ...cell.style, ...this.advancedStyles.totalRow };
    
    if (typeof value === 'number') {
      if (colIndex === 1 || colIndex === 4) { // Amount columns
        cell.numFmt = this.numberFormats.currency;
      } else if (colIndex === 2) { // Percentage column
        cell.numFmt = this.numberFormats.percentage;
      }
    }
  }

  // Add category analysis formulas
  addCategoryFormulas(worksheet, startRow, dataRows) {
    // Analysis formulas
    worksheet.getCell(`A${startRow}`).value = 'OTOMATIK ANALİZ:';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 12 } };
    
    // Highest spending category
    worksheet.getCell(`A${startRow + 1}`).value = 'En Yüksek Harcama:';
    worksheet.getCell(`B${startRow + 1}`).value = { formula: `INDEX(A${startRow - dataRows}:A${startRow - 1},MATCH(MAX(B${startRow - dataRows}:B${startRow - 1}),B${startRow - dataRows}:B${startRow - 1},0))` };
    
    // Average spending per category
    worksheet.getCell(`A${startRow + 2}`).value = 'Ortalama Kategori Harcaması:';
    worksheet.getCell(`B${startRow + 2}`).value = { formula: `AVERAGE(B${startRow - dataRows}:B${startRow - 1})` };
    worksheet.getCell(`B${startRow + 2}`).numFmt = this.numberFormats.currency;
    
    // Categories above average
    worksheet.getCell(`A${startRow + 3}`).value = 'Ortalamanın Üstündeki Kategoriler:';
    worksheet.getCell(`B${startRow + 3}`).value = { formula: `SUMPRODUCT((B${startRow - dataRows}:B${startRow - 1}>B${startRow + 2})*1)` };
  }

  // Add trend analysis formulas
  addTrendFormulas(worksheet, startRow, dataRows) {
    worksheet.getCell(`A${startRow}`).value = 'TREND ANALİZİ:';
    worksheet.getCell(`A${startRow}`).style = { font: { bold: true, size: 12 } };
    
    // Average monthly income
    worksheet.getCell(`A${startRow + 1}`).value = 'Ortalama Aylık Gelir:';
    worksheet.getCell(`B${startRow + 1}`).value = { formula: `AVERAGE(B${startRow - dataRows}:B${startRow - 1})` };
    worksheet.getCell(`B${startRow + 1}`).numFmt = this.numberFormats.currency;
    
    // Average monthly expense
    worksheet.getCell(`A${startRow + 2}`).value = 'Ortalama Aylık Gider:';
    worksheet.getCell(`B${startRow + 2}`).value = { formula: `AVERAGE(C${startRow - dataRows}:C${startRow - 1})` };
    worksheet.getCell(`B${startRow + 2}`).numFmt = this.numberFormats.currency;
    
    // Trend direction
    worksheet.getCell(`A${startRow + 3}`).value = 'Gelir Trendi:';
    worksheet.getCell(`B${startRow + 3}`).value = { formula: `IF(B${startRow - 1}>B${startRow - dataRows},"Yükseliş","Düşüş")` };
    
    // Best month
    worksheet.getCell(`A${startRow + 4}`).value = 'En İyi Ay (Net Gelir):';
    worksheet.getCell(`B${startRow + 4}`).value = { formula: `INDEX(A${startRow - dataRows}:A${startRow - 1},MATCH(MAX(D${startRow - dataRows}:D${startRow - 1}),D${startRow - dataRows}:D${startRow - 1},0))` };
    
    // Worst month
    worksheet.getCell(`A${startRow + 5}`).value = 'En Kötü Ay (Net Gelir):';
    worksheet.getCell(`B${startRow + 5}`).value = { formula: `INDEX(A${startRow - dataRows}:A${startRow - 1},MATCH(MIN(D${startRow - dataRows}:D${startRow - 1}),D${startRow - dataRows}:D${startRow - 1},0))` };
  }

  // Helper methods for status determination
  getIncomeStatus(income) {
    if (income > 10000) return 'Mükemmel';
    if (income > 5000) return 'İyi';
    if (income > 2000) return 'Orta';
    return 'Düşük';
  }

  getExpenseStatus(expense, income) {
    if (!income || income === 0) return 'Bilgi Yok';
    const ratio = expense / income;
    if (ratio < 0.5) return 'İyi';
    if (ratio < 0.8) return 'Orta';
    return 'Dikkat';
  }

  getNetIncomeStatus(netIncome) {
    if (netIncome > 0) return 'İyi';
    if (netIncome === 0) return 'Sıfır';
    return 'Negatif';
  }

  getSavingsRateStatus(rate) {
    if (rate >= 20) return 'Mükemmel';
    if (rate >= 10) return 'İyi';
    if (rate >= 0) return 'Orta';
    return 'Kötü';
  }

  getHealthScoreStatus(score) {
    if (score >= 80) return 'Mükemmel';
    if (score >= 60) return 'İyi';
    if (score >= 40) return 'Orta';
    return 'Kötü';
  }

  calculateCategoryRisk(category, totalAmount) {
    const percentage = category.percentage;
    if (percentage > 40) return 'Yüksek';
    if (percentage > 25) return 'Orta';
    return 'Düşük';
  }

  formatTrend(trend) {
    switch (trend) {
      case 'up': return '↗ Artış';
      case 'down': return '↘ Azalış';
      default: return '→ Sabit';
    }
  }
}

export default ExcelFormatter;