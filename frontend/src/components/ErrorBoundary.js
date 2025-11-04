import React from 'react';
import { Card, CardContent, Typography, Button, Box, Alert } from '@mui/material';
import { Refresh, Warning } from '@mui/icons-material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Warning color="error" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {this.props.title || 'Bir hata oluştu'}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                {this.props.message || 'Bu bileşen yüklenirken bir sorun yaşandı.'}
              </Typography>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
                  <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem' }}>
                    {this.state.error.toString()}
                  </Typography>
                </Alert>
              )}
              
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
              >
                Tekrar Dene
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;