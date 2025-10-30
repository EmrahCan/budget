import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import {
  Assessment,
  Description,
  Compare,
  Visibility,
  Close,
  CheckCircle,
} from '@mui/icons-material';

const ReportTypeSelector = ({ 
  value = 'summary', 
  onChange, 
  disabled = false,
  showPreview = true,
  allowCustomization = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [selectedType, setSelectedType] = useState(value);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState(null);

  // Report type definitions
  const reportTypes = [
    {
      key: 'summary',
      title: 'Özet Rapor',
      description: 'Temel finansal metriklerin hızlı görünümü',
      icon: <Assessment />,
      features: [
        'Toplam gelir/gider özeti',
        'Net gelir hesaplaması',
        'Temel kategori dağılımı',
        'Finansal sağlık skoru',
        'Hızlı trend göstergeleri'
      ],
      estimatedTime: '2-3 saniye',
      complexity: 'Basit',
      color: 'primary',
      recommended: true
    },
    {
      key: 'detailed',
      title: 'Detaylı Rapor',
      description: 'Kapsamlı finansal analiz ve detaylar',
      icon: <Description />,
      features: [
        'Tüm özet rapor özellikleri',
        'Detaylı kategori analizleri',
        'Aylık/haftalık trend grafikleri',
        'İşlem geçmişi analizi',
        'Harcama kalıpları',
        'Bütçe karşılaştırmaları'
      ],
      estimatedTime: '5-8 saniye',
      complexity: 'Orta',
      color: 'info',
      recommended: false
    },
    {
      key: 'comparison',
      title: 'Karşılaştırmalı Rapor',
      description: 'Dönemler arası karşılaştırma ve analiz',
      icon: <Compare />,
      features: [
        'Tüm detaylı rapor özellikleri',
        'Dönemler arası karşılaştırma',
        'Yıllık/aylık büyüme analizleri',
        'Performans değerlendirmesi',
        'Hedef vs gerçekleşen analizi',
        'Gelişmiş trend analizleri'
      ],
      estimatedTime: '8-12 saniye',
      complexity: 'Gelişmiş',
      color: 'secondary',
      recommended: false
    }
  ];

  // Handle report type change
  const handleTypeChange = (event) => {
    if (disabled) return;
    
    const newType = event.target.value;
    setSelectedType(newType);
    
    if (onChange) {
      onChange(newType);
    }
  };

  // Handle preview
  const handlePreview = (type) => {
    setPreviewType(type);
    setPreviewOpen(true);
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewType(null);
  };

  // Get selected report type details
  const getSelectedTypeDetails = () => {
    return reportTypes.find(type => type.key === selectedType);
  };

  const selectedDetails = getSelectedTypeDetails();

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Assessment color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6">
          Rapor Türü Seçimi
        </Typography>
      </Box>

      {/* Report Type Selection */}
      <FormControl component="fieldset" fullWidth disabled={disabled}>
        <RadioGroup
          value={selectedType}
          onChange={handleTypeChange}
          sx={{ gap: 2 }}
        >
          <Grid container spacing={2}>
            {reportTypes.map((type) => (
              <Grid item xs={12} md={4} key={type.key}>
                <Card 
                  sx={{ 
                    position: 'relative',
                    border: selectedType === type.key ? 2 : 1,
                    borderColor: selectedType === type.key ? `${type.color}.main` : 'grey.300',
                    cursor: disabled ? 'default' : 'pointer',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': disabled ? {} : {
                      borderColor: `${type.color}.main`,
                      boxShadow: 2
                    }
                  }}
                  onClick={() => !disabled && handleTypeChange({ target: { value: type.key } })}
                >
                  {/* Recommended Badge */}
                  {type.recommended && (
                    <Chip
                      label="Önerilen"
                      color="success"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1
                      }}
                    />
                  )}

                  <CardContent sx={{ pb: 2 }}>
                    {/* Radio Button and Header */}
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                      <FormControlLabel
                        value={type.key}
                        control={<Radio color={type.color} />}
                        label=""
                        sx={{ m: 0, mr: 1 }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {React.cloneElement(type.icon, { 
                            color: type.color, 
                            sx: { mr: 1 } 
                          })}
                          <Typography variant="h6" component="div">
                            {type.title}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {type.description}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Features Preview */}
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Özellikler:
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {type.features.slice(0, 3).map((feature, index) => (
                          <Typography 
                            key={index}
                            variant="body2" 
                            color="textSecondary"
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center',
                              fontSize: '0.75rem'
                            }}
                          >
                            <CheckCircle sx={{ fontSize: 12, mr: 0.5, color: 'success.main' }} />
                            {feature}
                          </Typography>
                        ))}
                        {type.features.length > 3 && (
                          <Typography variant="body2" color="primary">
                            +{type.features.length - 3} özellik daha
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Metadata */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={type.complexity} 
                        size="small" 
                        color={type.color}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="textSecondary">
                        ~{type.estimatedTime}
                      </Typography>
                    </Box>

                    {/* Preview Button */}
                    {showPreview && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreview(type);
                        }}
                        disabled={disabled}
                        fullWidth
                        sx={{ mt: 1 }}
                      >
                        Önizleme
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </RadioGroup>
      </FormControl>

      {/* Selected Type Summary */}
      {selectedDetails && (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Seçilen Rapor: <strong>{selectedDetails.title}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {selectedDetails.description} • Tahmini süre: {selectedDetails.estimatedTime}
          </Typography>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog 
        open={previewOpen} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
        fullScreen={isMobile}
      >
        {previewType && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {React.cloneElement(previewType.icon, { 
                  color: previewType.color, 
                  sx: { mr: 1 } 
                })}
                <Typography variant="h6">
                  {previewType.title} - Önizleme
                </Typography>
              </Box>
              <Button
                onClick={handleClosePreview}
                startIcon={<Close />}
                size="small"
              >
                Kapat
              </Button>
            </DialogTitle>
            
            <DialogContent>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {previewType.description}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              {/* Detailed Features */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Dahil Edilen Özellikler
              </Typography>
              <Grid container spacing={1} sx={{ mb: 3 }}>
                {previewType.features.map((feature, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CheckCircle sx={{ fontSize: 16, mr: 1, color: 'success.main' }} />
                      <Typography variant="body2">
                        {feature}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Technical Details */}
              <Typography variant="h6" sx={{ mb: 2 }}>
                Teknik Detaylar
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Karmaşıklık</Typography>
                  <Chip 
                    label={previewType.complexity} 
                    color={previewType.color}
                    variant="outlined"
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Tahmini Süre</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {previewType.estimatedTime}
                  </Typography>
                </Grid>
              </Grid>

              {/* Mock Preview Content */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 2 }}>
                  Rapor Örnek İçeriği
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Bu rapor türü seçildiğinde aşağıdaki gibi bir içerik oluşturulacaktır:
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: 1, borderColor: 'grey.300' }}>
                  <Typography variant="body2">
                    📊 {previewType.title} içeriği burada görüntülenecek...
                  </Typography>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions>
              <Button onClick={handleClosePreview}>
                Kapat
              </Button>
              <Button 
                variant="contained" 
                color={previewType.color}
                onClick={() => {
                  handleTypeChange({ target: { value: previewType.key } });
                  handleClosePreview();
                }}
                disabled={disabled}
              >
                Bu Raporu Seç
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Paper>
  );
};

export default ReportTypeSelector;