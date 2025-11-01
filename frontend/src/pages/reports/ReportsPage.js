import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';

const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Finansal Özet
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Card sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Typography color="text.secondary">Toplam Gelir</Typography>
              <Typography variant="h5" sx={{ color: 'success.main' }}>
                {reportData.summary.totalIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Typography color="text.secondary">Toplam Gider</Typography>
              <Typography variant="h5" sx={{ color: 'error.main' }}>
                {reportData.summary.totalExpense.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1, minWidth: 200 }}>
            <CardContent>
              <Typography color="text.secondary">Net Gelir</Typography>
              <Typography variant="h5" sx={{ color: reportData.summary.netIncome >= 0 ? 'success.main' : 'error.main' }}>
                {reportData.summary.netIncome.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Kategori Dağılımı
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {reportData.summary.categories.map((c, i) => (
                <Card key={i} variant="outlined" sx={{ p: 2, minWidth: 150, borderLeft: `4px solid ${c.color}` }}>
                  <Typography variant="subtitle2">{c.name}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {c.amount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </Typography>
                </Card>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default ReportsPage;