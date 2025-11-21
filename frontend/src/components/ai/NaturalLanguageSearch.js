import React, { useState } from 'react';
import {
  Box,
  TextField,
  Paper,
  IconButton,
  CircularProgress,
  Chip,
  Stack,
  Typography,
  Alert,
  InputAdornment,
  Fade,
} from '@mui/material';
import {
  Search,
  Mic,
  Send,
  AutoAwesome,
  TipsAndUpdates,
} from '@mui/icons-material';
import { useAI } from '../../hooks/useAI';

/**
 * NaturalLanguageSearch - AI-powered natural language search component
 * Allows users to ask questions in natural language
 */
const NaturalLanguageSearch = ({ onResults, compact = false }) => {
  const { processQuery, loading, aiEnabled } = useAI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);

  // Example queries
  const exampleQueries = [
    'Geçen ay market harcamalarım ne kadar?',
    'Bu ayki gelirlerim toplamı',
    'Son 3 aydaki ulaşım giderlerimi karşılaştır',
    'Hesap bakiyelerimi göster',
    'Bu hafta ne kadar harcadım?',
  ];

  const handleSearch = async () => {
    if (!query.trim()) return;

    setError(null);
    setShowSuggestions(false);

    const response = await processQuery(query);

    if (response.success) {
      setResults(response.data);
      if (onResults) {
        onResults(response.data);
      }
    } else {
      setError(response.error || 'Sorgu işlenemedi');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleExampleClick = (example) => {
    setQuery(example);
    setShowSuggestions(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults(null);
    setError(null);
    setShowSuggestions(true);
  };

  if (!aiEnabled) {
    return (
      <Alert severity="warning">
        AI özellikleri şu anda devre dışı
      </Alert>
    );
  }

  return (
    <Box>
      {/* Search Input */}
      <Paper
        elevation={compact ? 1 : 3}
        sx={{
          p: compact ? 1 : 2,
          borderRadius: 2,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? 'rgba(255, 255, 255, 0.05)'
              : 'rgba(0, 0, 0, 0.02)',
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={3}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Finansal verileriniz hakkında soru sorun... (örn: Geçen ay market harcamalarım ne kadar?)"
          disabled={loading.query}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AutoAwesome color="primary" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <Stack direction="row" spacing={0.5}>
                  {loading.query ? (
                    <CircularProgress size={24} />
                  ) : (
                    <>
                      <IconButton
                        size="small"
                        onClick={handleSearch}
                        disabled={!query.trim()}
                        color="primary"
                      >
                        <Send />
                      </IconButton>
                    </>
                  )}
                </Stack>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />

        {/* Example Queries */}
        {showSuggestions && !results && (
          <Fade in={showSuggestions}>
            <Box mt={2}>
              <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
                <TipsAndUpdates fontSize="small" color="action" />
                <Typography variant="caption" color="text.secondary">
                  Örnek sorular:
                </Typography>
              </Stack>
              <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                {exampleQueries.map((example, index) => (
                  <Chip
                    key={index}
                    label={example}
                    size="small"
                    variant="outlined"
                    onClick={() => handleExampleClick(example)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Stack>
            </Box>
          </Fade>
        )}
      </Paper>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results Preview (if compact mode) */}
      {compact && results && (
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            {results.response}
          </Typography>
          {results.suggestions && results.suggestions.length > 0 && (
            <Box mt={1}>
              <Typography variant="caption" color="text.secondary">
                İlgili sorular:
              </Typography>
              <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" gap={0.5}>
                {results.suggestions.map((suggestion, index) => (
                  <Chip
                    key={index}
                    label={suggestion}
                    size="small"
                    variant="outlined"
                    onClick={() => handleExampleClick(suggestion)}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default NaturalLanguageSearch;
