import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Tabs,
  Tab
} from '@mui/material';
import AIInsightsDashboard from '../../components/ai/AIInsightsDashboard';
import AIRecommendations from '../../components/ai/AIRecommendations';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadFinancialSummary();
  }, []);
  
  const loadFinancialSummary = async () => {
    try {
      setIsLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiUrl}/ai/financial-summary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          period: 'month'
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Transform data for display
        const categories = Object.entries(data.data.summary.categories).map(([name, info]) => ({
          name,
          amount: info.total,
          count: info.count,
          color: getRandomColor()
        }));
        
        setReportData({
          summary: {
            totalIncome: data.data.summary.totalIncome,
            totalExpense: data.data.summary.totalExpense,
            totalExpenseWithFixed: data.data.summary.totalExpenseWithFixed,
            netIncome: data.data.summary.netIncome,
            savingsRate: data.data.summary.savingsRate,
            fixedPayments: data.data.summary.fixedPayments,
            categories
          },
          aiInsights: data.data.aiInsights
        });
      } else {
        setError('Veri yüklenirken hata oluştu');
      }
    } catch (e) {
      console.error('Error loading financial summary:', e);
      setError('Veri yüklenirken hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getRandomColor = () => {
    const colors = ['#4caf50', '#2196f3', '#f44336', '#ff9800', '#9c27b0', '#00bcd4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Finansal Raporlar ve AI Analizi
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="Finansal Özet" />
          <Tab label="AI Analizi" />
          <Tab label="AI Önerileri" />
        </Tabs>
      </Box>

      {/* Tab 0: Finansal Özet */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Toplam Gelir</Typography>
                  <Typography variant="h5" sx={{ color: 'success.main' }}>
                    {reportData.summary.totalIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Toplam Gider</Typography>
                  <Typography variant="h5" sx={{ color: 'error.main' }}>
                    {(reportData.summary.totalExpenseWithFixed || reportData.summary.totalExpense).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </Typography>
                  {reportData.summary.fixedPayments && reportData.summary.fixedPayments.monthly > 0 && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      İşlemler: {reportData.summary.totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                      <br />
                      Sabit: {reportData.summary.fixedPayments.monthly.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Net Gelir</Typography>
                  <Typography variant="h5" sx={{ color: reportData.summary.netIncome >= 0 ? 'success.main' : 'error.main' }}>
                    {reportData.summary.netIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            {reportData.summary.fixedPayments && reportData.summary.fixedPayments.monthly > 0 && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Aylık Sabit Ödemeler</Typography>
                    <Typography variant="h5" sx={{ color: 'warning.main' }}>
                      {reportData.summary.fixedPayments.monthly.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {reportData.summary.fixedPayments.count} ödeme
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
            
            {reportData.summary.savingsRate && (
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary">Tasarruf Oranı</Typography>
                    <Typography variant="h5" sx={{ color: reportData.summary.savingsRate > 20 ? 'success.main' : reportData.summary.savingsRate > 10 ? 'warning.main' : 'error.main' }}>
                      %{reportData.summary.savingsRate}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
          
          {/* Fixed Payments Detail */}
          {reportData.summary.fixedPayments && reportData.summary.fixedPayments.items && reportData.summary.fixedPayments.items.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📅 Sabit Ödemeler Detayı
                </Typography>
                <Grid container spacing={2}>
                  {reportData.summary.fixedPayments.items.map((item, idx) => (
                    <Grid item xs={12} sm={6} md={4} key={idx}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {item.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {item.category}
                        </Typography>
                        <Typography variant="h6" color="warning.main" sx={{ mt: 1 }}>
                          {item.monthlyAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}/ay
                        </Typography>
                        {item.dueDay && (
                          <Typography variant="caption" color="text.secondary">
                            Her ayın {item.dueDay}. günü
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          )}
          
          {/* AI Insights Section */}
          {reportData.aiInsights && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    🤖 AI Finansal Analiz
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Genel Değerlendirme
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {reportData.aiInsights.overview}
                    </Typography>
                  </Grid>
                  
                  {reportData.aiInsights.topCategories && reportData.aiInsights.topCategories.length > 0 && (
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        En Çok Harcama Yapılan Kategoriler
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {reportData.aiInsights.topCategories.map((cat, idx) => (
                          <Typography component="li" key={idx} variant="body2">
                            {cat}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  )}
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Tasarruf Analizi
                    </Typography>
                    <Typography variant="body2">
                      {reportData.aiInsights.savingsAnalysis}
                    </Typography>
                  </Grid>
                  
                  {reportData.aiInsights.recommendations && reportData.aiInsights.recommendations.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        AI Önerileri
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {reportData.aiInsights.recommendations.map((rec, idx) => (
                          <Typography component="li" key={idx} variant="body2" sx={{ mb: 1 }}>
                            {rec}
                          </Typography>
                        ))}
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {/* Tab 1: AI Analizi */}
      {activeTab === 1 && (
        <AIInsightsDashboard timeframe="monthly" />
      )}

      {/* Tab 2: AI Önerileri */}
      {activeTab === 2 && (
        <AIRecommendations />
      )}
    </Container>
  );
};

export default ReportsPage;