import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Divider,
  Grid,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useTranslation } from 'react-i18next';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showError, showSuccess } = useNotification();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = t('validation.required');
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = t('validation.minLength', { min: 2 });
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('validation.required');
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = t('validation.minLength', { min: 2 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = t('validation.required');
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = t('validation.email');
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = t('validation.required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.minLength', { min: 6 });
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = t('validation.passwordStrength');
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwordMatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });
      
      if (result.success) {
        showSuccess(t('messages.success.registered'));
        navigate('/', { replace: true });
      } else {
        showError(result.message);
        setErrors({ general: result.message });
      }
    } catch (err) {
      const errorMessage = t('messages.error.general');
      showError(errorMessage);
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        {/* Logo and Title */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <TrendingUp sx={{ fontSize: 48, color: 'primary.main' }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('common.appTitle')}
          </Typography>
          <Typography variant="body1" color="textSecondary">
            {t('auth.registerSubtitle')}
          </Typography>
        </Box>

        <Card elevation={3}>
          <CardContent sx={{ p: 4 }}>
            {errors.general && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.general}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('auth.firstName')}
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    autoComplete="given-name"
                    autoFocus
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label={t('auth.lastName')}
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    autoComplete="family-name"
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                  />
                </Grid>
              </Grid>

              <TextField
                fullWidth
                label={t('auth.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                autoComplete="email"
                sx={{ mt: 2 }}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label={t('auth.password')}
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
                sx={{ mt: 2 }}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={togglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label={t('auth.confirmPassword')}
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                autoComplete="new-password"
                sx={{ mt: 2, mb: 3 }}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={toggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mb: 3, py: 1.5 }}
              >
                {loading ? t('auth.registering') : t('auth.createAccount')}
              </Button>
            </form>

            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="textSecondary">
                {t('auth.or')}
              </Typography>
            </Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link
                  to="/login"
                  style={{
                    color: 'inherit',
                    textDecoration: 'none',
                    fontWeight: 600,
                  }}
                >
                  {t('auth.login')}
                </Link>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default RegisterPage;