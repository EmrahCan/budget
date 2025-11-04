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
    const timer = setTimeout(() => {
      try {
        const data = {
          summary: {
            totalIncome: 12500,
            totalExpense: 8500,
            netIncome: 4000,
            categories: [
              { name: 'Gıda', amount: 2500, color: '#4caf50' },
              { name: 'Ulaşım', amount: 1500, color: '#2196f3' },
              { name: 'Kira', amount: 3000, color: '#f44336' },
              { name: 'Faturalar', amount: 1500, color: '#ff9800' }
            ]
          }
        };
        setReportData(data);
        setIsLoading(false);
      } catch (e) {
        setError('Veri yüklenirken hata oluştu');
        setIsLoading(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, []);

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
                    {reportData.summary.totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </Typography>
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
          </Grid>
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