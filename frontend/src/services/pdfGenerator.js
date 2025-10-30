import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { formatCurrency, formatDate } from './api';

class PDFGenerator {
  constructor() {
    this.pdf = null;
    this.pageWidth = 210; // A4 width in mm
    this.pageHeight = 297; // A4 height in mm
    this.margin = 20;
    this.contentWidth = this.pageWidth - (this.margin * 2);
    this.currentY = this.margin;
    this.lineHeight = 7;
    this.fontSize = {
      title: 18,
      subtitle: 14,
      heading: 12,
      body: 10,
      small: 8
    };
  }

  // Initialize PDF document
  initializePDF(orientation = 'portrait') {
    this.pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    // Set Turkish character support
    this.pdf.setFont('helvetica');
    this.currentY = this.margin;
    
    return this.pdf;
  }

  // Add header to PDF
  addHeader(title, subtitle = '', logoUrl = null) {
    if (!this.pdf) return;

    // Add logo if provided
    if (logoUrl) {
      try {
        this.pdf.addImage(logoUrl, 'PNG', this.margin, this.margin, 30, 15);
      } catch (error) {
        console.warn('Logo could not be added:', error);
      }
    }

    // Add title
    this.pdf.setFontSize(this.fontSize.title);
    this.pdf.setFont('helvetica', 'bold');
    const titleX = logoUrl ? this.margin + 35 : this.margin;
    this.pdf.text(title, titleX, this.margin + 10);

    // Add subtitle
    if (subtitle) {
      this.pdf.setFontSize(this.fontSize.subtitle);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(subtitle, titleX, this.margin + 18);
    }

    // Add generation date
    this.pdf.setFontSize(this.fontSize.small);
    this.pdf.setFont('helvetica', 'normal');
    const dateText = `Oluşturulma Tarihi: ${formatDate(new Date())}`;
    const dateWidth = this.pdf.getTextWidth(dateText);
    this.pdf.text(dateText, this.pageWidth - this.margin - dateWidth, this.margin + 10);

    // Add separator line
    this.currentY = this.margin + 25;
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  // Add footer to PDF
  addFooter(pageNumber, totalPages) {
    if (!this.pdf) return;

    const footerY = this.pageHeight - 15;
    
    // Add separator line
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, footerY - 5, this.pageWidth - this.margin, footerY - 5);

    // Add page number
    this.pdf.setFontSize(this.fontSize.small);
    this.pdf.setFont('helvetica', 'normal');
    const pageText = `Sayfa ${pageNumber} / ${totalPages}`;
    const pageWidth = this.pdf.getTextWidth(pageText);
    this.pdf.text(pageText, this.pageWidth - this.margin - pageWidth, footerY);

    // Add company/app name
    this.pdf.text('Bütçe Yönetimi Sistemi', this.margin, footerY);
  }

  // Add text with automatic line wrapping
  addText(text, fontSize = this.fontSize.body, fontStyle = 'normal', color = [0, 0, 0]) {
    if (!this.pdf || !text) return;

    this.pdf.setFontSize(fontSize);
    this.pdf.setFont('helvetica', fontStyle);
    this.pdf.setTextColor(color[0], color[1], color[2]);

    const lines = this.pdf.splitTextToSize(text, this.contentWidth);
    
    // Check if we need a new page
    if (this.currentY + (lines.length * this.lineHeight) > this.pageHeight - 30) {
      this.addNewPage();
    }

    lines.forEach(line => {
      this.pdf.text(line, this.margin, this.currentY);
      this.currentY += this.lineHeight;
    });

    this.currentY += 3; // Add some spacing after text
  }

  // Add heading
  addHeading(text, level = 1) {
    if (!this.pdf || !text) return;

    const fontSize = level === 1 ? this.fontSize.heading : this.fontSize.body;
    const fontStyle = 'bold';
    
    this.currentY += 5; // Add space before heading
    this.addText(text, fontSize, fontStyle);
    this.currentY += 2; // Add space after heading
  }

  // Add table
  addTable(headers, rows, options = {}) {
    if (!this.pdf || !headers || !rows) return;

    const {
      headerBgColor = [240, 240, 240],
      headerTextColor = [0, 0, 0],
      rowBgColor = [255, 255, 255],
      alternateRowBgColor = [250, 250, 250],
      borderColor = [200, 200, 200],
      fontSize = this.fontSize.small,
      cellPadding = 3
    } = options;

    const colWidth = this.contentWidth / headers.length;
    const rowHeight = this.lineHeight + (cellPadding * 2);

    // Check if table fits on current page
    const tableHeight = (rows.length + 1) * rowHeight;
    if (this.currentY + tableHeight > this.pageHeight - 30) {
      this.addNewPage();
    }

    this.pdf.setFontSize(fontSize);

    // Draw header
    this.pdf.setFillColor(headerBgColor[0], headerBgColor[1], headerBgColor[2]);
    this.pdf.setTextColor(headerTextColor[0], headerTextColor[1], headerTextColor[2]);
    this.pdf.setFont('helvetica', 'bold');
    
    this.pdf.rect(this.margin, this.currentY, this.contentWidth, rowHeight, 'F');
    
    headers.forEach((header, index) => {
      const x = this.margin + (index * colWidth) + cellPadding;
      const y = this.currentY + rowHeight - cellPadding;
      this.pdf.text(header, x, y);
    });

    this.currentY += rowHeight;

    // Draw rows
    this.pdf.setFont('helvetica', 'normal');
    
    rows.forEach((row, rowIndex) => {
      // Alternate row colors
      const bgColor = rowIndex % 2 === 0 ? rowBgColor : alternateRowBgColor;
      this.pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      this.pdf.setTextColor(0, 0, 0);
      
      this.pdf.rect(this.margin, this.currentY, this.contentWidth, rowHeight, 'F');
      
      row.forEach((cell, cellIndex) => {
        const x = this.margin + (cellIndex * colWidth) + cellPadding;
        const y = this.currentY + rowHeight - cellPadding;
        
        // Handle different cell types
        let cellText = '';
        if (typeof cell === 'number') {
          cellText = formatCurrency(cell);
        } else if (cell instanceof Date) {
          cellText = formatDate(cell);
        } else {
          cellText = String(cell || '');
        }
        
        // Truncate text if too long
        const maxWidth = colWidth - (cellPadding * 2);
        const truncatedText = this.pdf.splitTextToSize(cellText, maxWidth)[0] || '';
        
        this.pdf.text(truncatedText, x, y);
      });

      this.currentY += rowHeight;
    });

    // Draw table border
    this.pdf.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    this.pdf.rect(this.margin, this.currentY - (rows.length + 1) * rowHeight, this.contentWidth, (rows.length + 1) * rowHeight);

    // Draw column separators
    for (let i = 1; i < headers.length; i++) {
      const x = this.margin + (i * colWidth);
      this.pdf.line(x, this.currentY - (rows.length + 1) * rowHeight, x, this.currentY);
    }

    // Draw row separators
    for (let i = 0; i <= rows.length; i++) {
      const y = this.currentY - (rows.length - i) * rowHeight;
      this.pdf.line(this.margin, y, this.pageWidth - this.margin, y);
    }

    this.currentY += 10; // Add space after table
  }

  // Add chart from canvas element
  async addChartFromElement(element, title = '', options = {}) {
    if (!this.pdf || !element) return;

    const {
      width = this.contentWidth,
      height = 100,
      quality = 2,
      backgroundColor = '#ffffff'
    } = options;

    try {
      // Create canvas from element
      const canvas = await html2canvas(element, {
        scale: quality,
        backgroundColor: backgroundColor,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Add title if provided
      if (title) {
        this.addHeading(title, 2);
      }

      // Check if chart fits on current page
      if (this.currentY + height > this.pageHeight - 30) {
        this.addNewPage();
      }

      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      this.pdf.addImage(imgData, 'PNG', this.margin, this.currentY, width, height);
      
      this.currentY += height + 10;

    } catch (error) {
      console.error('Error adding chart to PDF:', error);
      this.addText(`Grafik eklenirken hata oluştu: ${title}`, this.fontSize.small, 'italic', [255, 0, 0]);
    }
  }

  // Add summary section
  addSummarySection(summaryData) {
    if (!this.pdf || !summaryData) return;

    this.addHeading('Finansal Özet', 1);

    const summaryRows = [
      ['Toplam Gelir', formatCurrency(summaryData.totalIncome || 0)],
      ['Toplam Gider', formatCurrency(summaryData.totalExpense || 0)],
      ['Net Gelir', formatCurrency(summaryData.netIncome || 0)],
      ['İşlem Sayısı', String(summaryData.transactionCount || 0)],
      ['Dönem', `${formatDate(summaryData.period?.start)} - ${formatDate(summaryData.period?.end)}`]
    ];

    this.addTable(['Metrik', 'Değer'], summaryRows, {
      fontSize: this.fontSize.body
    });
  }

  // Add category analysis section
  addCategoryAnalysisSection(categoryData) {
    if (!this.pdf || !categoryData || categoryData.length === 0) return;

    this.addHeading('Kategori Analizi', 1);

    const categoryRows = categoryData.map(item => [
      item.category,
      formatCurrency(item.amount),
      `%${item.percentage.toFixed(1)}`,
      String(item.transactionCount),
      item.trend === 'up' ? '↗ Artış' : item.trend === 'down' ? '↘ Azalış' : '→ Sabit'
    ]);

    this.addTable(
      ['Kategori', 'Tutar', 'Oran', 'İşlem', 'Trend'],
      categoryRows,
      { fontSize: this.fontSize.small }
    );
  }

  // Add new page
  addNewPage() {
    if (!this.pdf) return;

    this.pdf.addPage();
    this.currentY = this.margin;
  }

  // Generate complete report PDF
  async generateReport(reportData, options = {}) {
    const {
      title = 'Finansal Rapor',
      subtitle = '',
      template = 'standard',
      includeCharts = true,
      includeDetails = true
    } = options;

    try {
      // Initialize PDF
      this.initializePDF();

      // Add header
      this.addHeader(title, subtitle);

      // Add summary section
      if (reportData.summary) {
        this.addSummarySection(reportData.summary);
      }

      // Add category analysis
      if (reportData.categoryAnalysis && includeDetails) {
        this.addCategoryAnalysisSection(reportData.categoryAnalysis);
      }

      // Add trend analysis text summary
      if (reportData.trendAnalysis && includeDetails) {
        this.addHeading('Trend Analizi', 1);
        
        const trendText = this.generateTrendAnalysisText(reportData.trendAnalysis);
        this.addText(trendText);
      }

      // Add financial metrics
      if (reportData.financialMetrics) {
        this.addHeading('Finansal Metrikler', 1);
        
        const metricsRows = [
          ['Tasarruf Oranı', `%${reportData.financialMetrics.savingsRate?.toFixed(1) || 0}`],
          ['Gider Oranı', `%${reportData.financialMetrics.expenseRatio?.toFixed(1) || 0}`],
          ['Finansal Sağlık Skoru', `${reportData.financialMetrics.healthScore?.toFixed(1) || 0}/100`]
        ];

        this.addTable(['Metrik', 'Değer'], metricsRows);
      }

      // Add footer to all pages
      const totalPages = this.pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        this.pdf.setPage(i);
        this.addFooter(i, totalPages);
      }

      return this.pdf;

    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw new Error('PDF raporu oluşturulurken hata oluştu');
    }
  }

  // Generate trend analysis text
  generateTrendAnalysisText(trendData) {
    if (!trendData.monthly || trendData.monthly.length === 0) {
      return 'Trend analizi için yeterli veri bulunmuyor.';
    }

    const monthlyData = trendData.monthly;
    const firstMonth = monthlyData[0];
    const lastMonth = monthlyData[monthlyData.length - 1];

    const incomeChange = lastMonth.income - firstMonth.income;
    const expenseChange = lastMonth.expense - firstMonth.expense;
    const incomeChangePercent = firstMonth.income > 0 ? (incomeChange / firstMonth.income) * 100 : 0;
    const expenseChangePercent = firstMonth.expense > 0 ? (expenseChange / firstMonth.expense) * 100 : 0;

    let text = `Analiz edilen ${monthlyData.length} aylık dönemde:\n\n`;
    
    text += `• Gelir ${incomeChange >= 0 ? 'artışı' : 'azalışı'}: ${formatCurrency(Math.abs(incomeChange))} (${Math.abs(incomeChangePercent).toFixed(1)}%)\n`;
    text += `• Gider ${expenseChange >= 0 ? 'artışı' : 'azalışı'}: ${formatCurrency(Math.abs(expenseChange))} (${Math.abs(expenseChangePercent).toFixed(1)}%)\n\n`;

    // Add recommendations
    if (expenseChangePercent > incomeChangePercent && expenseChangePercent > 10) {
      text += 'Öneri: Gider artışı gelir artışından yüksek. Harcama kontrolü yapılması önerilir.\n';
    } else if (incomeChangePercent > 0 && expenseChangePercent < incomeChangePercent) {
      text += 'Öneri: Olumlu finansal trend. Mevcut strateji sürdürülebilir.\n';
    } else {
      text += 'Öneri: Finansal durumun yakından takip edilmesi önerilir.\n';
    }

    return text;
  }

  // Save PDF
  save(filename = 'finansal-rapor.pdf') {
    if (!this.pdf) {
      throw new Error('PDF oluşturulmamış');
    }

    this.pdf.save(filename);
  }

  // Get PDF as blob
  getBlob() {
    if (!this.pdf) {
      throw new Error('PDF oluşturulmamış');
    }

    return this.pdf.output('blob');
  }

  // Get PDF as data URL
  getDataURL() {
    if (!this.pdf) {
      throw new Error('PDF oluşturulmamış');
    }

    return this.pdf.output('dataurlstring');
  }
}

export default PDFGenerator;