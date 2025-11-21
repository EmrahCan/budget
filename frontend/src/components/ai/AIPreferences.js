import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Divider,
  Alert,
  Stack,
  Chip,
  Grid,
} from '@mui/material';
import {
  AutoAwesome,
  Mic,
  Notifications,
  Psychology,
  Speed,
  Language,
  School,
  Delete,
} from '@mui/icons-material';
import { useAI } from '../../hooks/useAI';
import { useNotification } from '../../contexts/NotificationContext';

/**
 * AIPreferences - AI feature preferences management component
 */
const AIPreferences = () => {
  const { preferences, updatePreferences, features, rateLimitStatus, clearCache } = useAI();
  const { showSuccess, showError } = useNotification();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSave = () => {
    updatePreferences(localPreferences);
    showSuccess('AI tercihleri kaydedildi');
  };

  const handleReset = () => {
    const defaultPreferences = {
      autoCategorization: true,
      categorizationThreshold: 70,
      voiceEnabled: false,
      notificationsEnabled: true,
      notificationFrequency: 'daily',
      language: 'tr',
      learningMode: true,
    };
    setLocalPreferences(defaultPreferences);
    updatePreferences(defaultPreferences);
    showSuccess('AI tercihleri sıfırlandı');
  };

  const handleClearCache = async () => {
    const result = await clearCache();
    if (result.success) {
      showSuccess('AI önbelleği temizlendi');
    } else {
      showError('Önbellek temizlenemedi');
    }
  };

  const handleChange = (key, value) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom display="flex" alignItems="center" gap={1}>
        <AutoAwesome color="primary" />
        AI Tercihleri
      </Typography>

      <Typography variant="body2" color="text.secondary" paragraph>
        Yapay zeka özelliklerini kişiselleştirin ve davranışlarını kontrol edin.
      </Typography>

      {/* Rate Limit Status */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Speed />
          <Box flex={1}>
            <Typography variant="body2" fontWeight="bold">
              API Kullanımı
            </Typography>
            <Typography variant="caption">
              {rateLimitStatus.requestsUsed} / {rateLimitStatus.requestsUsed + rateLimitStatus.requestsRemaining} istek kullanıldı
            </Typography>
          </Box>
          <Chip 
            label={`${rateLimitStatus.requestsRemaining} kalan`}
            color={rateLimitStatus.requestsRemaining < 10 ? 'warning' : 'success'}
            size="small"
          />
        </Stack>
      </Alert>

      <Grid container spacing={3}>
        {/* Categorization Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Psychology color="primary" />
                Akıllı Kategorilendirme
              </Typography>

              <Stack spacing={2} mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.autoCategorization}
                      onChange={(e) => handleChange('autoCategorization', e.target.checked)}
                      disabled={!features.categorization}
                    />
                  }
                  label="Otomatik kategorilendirme"
                />

                <Box>
                  <Typography variant="body2" gutterBottom>
                    Otomatik seçim eşiği: %{localPreferences.categorizationThreshold}
                  </Typography>
                  <Slider
                    value={localPreferences.categorizationThreshold}
                    onChange={(e, value) => handleChange('categorizationThreshold', value)}
                    min={50}
                    max={95}
                    step={5}
                    marks
                    valueLabelDisplay="auto"
                    disabled={!localPreferences.autoCategorization}
                  />
                  <Typography variant="caption" color="text.secondary">
                    AI güven skoru bu değerin üzerindeyse kategori otomatik seçilir
                  </Typography>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.learningMode}
                      onChange={(e) => handleChange('learningMode', e.target.checked)}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Öğrenme modu</Typography>
                      <Typography variant="caption" color="text.secondary">
                        AI tercihlerinizden öğrenir
                      </Typography>
                    </Box>
                  }
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Notification Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Notifications color="primary" />
                Akıllı Bildirimler
              </Typography>

              <Stack spacing={2} mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.notificationsEnabled}
                      onChange={(e) => handleChange('notificationsEnabled', e.target.checked)}
                      disabled={!features.notifications}
                    />
                  }
                  label="Akıllı bildirimleri etkinleştir"
                />

                <FormControl fullWidth disabled={!localPreferences.notificationsEnabled}>
                  <InputLabel>Bildirim sıklığı</InputLabel>
                  <Select
                    value={localPreferences.notificationFrequency}
                    onChange={(e) => handleChange('notificationFrequency', e.target.value)}
                    label="Bildirim sıklığı"
                  >
                    <MenuItem value="realtime">Gerçek zamanlı</MenuItem>
                    <MenuItem value="hourly">Saatlik</MenuItem>
                    <MenuItem value="daily">Günlük</MenuItem>
                    <MenuItem value="weekly">Haftalık</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Voice & Language Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Mic color="primary" />
                Sesli Komutlar
              </Typography>

              <Stack spacing={2} mt={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localPreferences.voiceEnabled}
                      onChange={(e) => handleChange('voiceEnabled', e.target.checked)}
                      disabled={!features.voice}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2">Sesli komutları etkinleştir</Typography>
                      {!features.voice && (
                        <Typography variant="caption" color="warning.main">
                          Yakında kullanıma sunulacak
                        </Typography>
                      )}
                    </Box>
                  }
                />

                <FormControl fullWidth>
                  <InputLabel>Dil</InputLabel>
                  <Select
                    value={localPreferences.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    label="Dil"
                    startAdornment={<Language sx={{ mr: 1 }} />}
                  >
                    <MenuItem value="tr">Türkçe</MenuItem>
                    <MenuItem value="en">English</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Cache Management */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                <Delete color="primary" />
                Önbellek Yönetimi
              </Typography>

              <Stack spacing={2} mt={2}>
                <Typography variant="body2" color="text.secondary">
                  AI yanıtları daha hızlı erişim için önbellekte saklanır. Önbelleği temizlemek taze sonuçlar almanızı sağlar.
                </Typography>

                <Button
                  variant="outlined"
                  color="warning"
                  startIcon={<Delete />}
                  onClick={handleClearCache}
                  fullWidth
                >
                  Önbelleği Temizle
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Action Buttons */}
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          onClick={handleReset}
        >
          Varsayılana Dön
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<School />}
        >
          Kaydet
        </Button>
      </Stack>

      {/* Feature Status */}
      <Box mt={3}>
        <Typography variant="subtitle2" gutterBottom>
          Aktif AI Özellikleri
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
          {Object.entries(features).map(([key, enabled]) => (
            <Chip
              key={key}
              label={key}
              color={enabled ? 'success' : 'default'}
              size="small"
              variant={enabled ? 'filled' : 'outlined'}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
};

export default AIPreferences;
