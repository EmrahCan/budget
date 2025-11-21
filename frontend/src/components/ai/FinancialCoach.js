import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
} from '@mui/material';
import {
  Send,
  Psychology,
  Person,
  Lightbulb,
  Refresh,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';

const FinancialCoach = () => {
  const { showError } = useNotification();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    'Nasıl daha fazla tasarruf edebilirim?',
    'Bütçemi nasıl iyileştirebilirim?',
    'Acil durum fonu ne kadar olmalı?',
    'Harcamalarımı nasıl azaltabilirim?',
  ];

  useEffect(() => {
    // Welcome message
    setMessages([
      {
        type: 'coach',
        text: 'Merhaba! Ben senin AI finansal koçunum. Finansal hedeflerine ulaşmana yardımcı olmak için buradayım. Bana sorularını sorabilirsin.',
        timestamp: new Date(),
      },
    ]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      type: 'user',
      text: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiUrl}/ai/coach/ask`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: input }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Soru yanıtlanamadı');
      }

      const coachMessage = {
        type: 'coach',
        text: data.data.answer,
        suggestions: data.data.suggestions,
        followUpQuestions: data.data.followUpQuestions,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      console.error('Coach error:', error);
      showError(`Finansal koç yanıt veremedi: ${error.message}`);
      
      const errorMessage = {
        type: 'coach',
        text: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar dene.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    setMessages([
      {
        type: 'coach',
        text: 'Merhaba! Ben senin AI finansal koçunum. Finansal hedeflerine ulaşmana yardımcı olmak için buradayım. Bana sorularını sorabilirsin.',
        timestamp: new Date(),
      },
    ]);
  };

  return (
    <Card>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Psychology color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6">AI Finansal Koç</Typography>
              <Typography variant="caption" color="textSecondary">
                Kişiselleştirilmiş finansal danışmanlık
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={handleReset} size="small">
            <Refresh />
          </IconButton>
        </Box>

        {/* Quick Questions */}
        {messages.length === 1 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
              Hızlı Sorular:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {quickQuestions.map((question, index) => (
                <Chip
                  key={index}
                  label={question}
                  onClick={() => handleQuickQuestion(question)}
                  size="small"
                  variant="outlined"
                  clickable
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Messages */}
        <Paper
          elevation={0}
          sx={{
            height: 400,
            overflowY: 'auto',
            p: 2,
            mb: 2,
            bgcolor: 'grey.50',
            border: 1,
            borderColor: 'grey.200',
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                mb: 2,
              }}
            >
              <Box
                sx={{
                  maxWidth: '75%',
                  display: 'flex',
                  flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                  gap: 1,
                }}
              >
                {/* Avatar */}
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: message.type === 'user' ? 'primary.main' : 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {message.type === 'user' ? (
                    <Person sx={{ color: 'white', fontSize: 20 }} />
                  ) : (
                    <Psychology sx={{ color: 'white', fontSize: 20 }} />
                  )}
                </Box>

                {/* Message Content */}
                <Box>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 1.5,
                      bgcolor: message.type === 'user' ? 'primary.light' : 'white',
                      color: message.type === 'user' ? 'primary.contrastText' : 'text.primary',
                    }}
                  >
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {message.text}
                    </Typography>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <Lightbulb fontSize="small" />
                          Öneriler:
                        </Typography>
                        <List dense sx={{ pl: 2 }}>
                          {message.suggestions.map((suggestion, idx) => (
                            <ListItem key={idx} sx={{ py: 0.5, px: 0 }}>
                              <ListItemText
                                primary={suggestion}
                                primaryTypographyProps={{ variant: 'caption' }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Follow-up Questions */}
                    {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="textSecondary" sx={{ mb: 1, display: 'block' }}>
                          Takip Soruları:
                        </Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {message.followUpQuestions.map((question, idx) => (
                            <Chip
                              key={idx}
                              label={question}
                              size="small"
                              variant="outlined"
                              onClick={() => handleQuickQuestion(question)}
                              clickable
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                    {message.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Psychology sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Paper elevation={1} sx={{ p: 1.5 }}>
                  <CircularProgress size={20} />
                </Paper>
              </Box>
            </Box>
          )}

          <div ref={messagesEndRef} />
        </Paper>

        {/* Input */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Finansal sorunu sor..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            sx={{ minWidth: 100 }}
            endIcon={<Send />}
          >
            Gönder
          </Button>
        </Box>

        {/* Disclaimer */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="caption">
            Bu AI koç genel finansal bilgi sağlar. Önemli finansal kararlar için profesyonel danışman ile görüşün.
          </Typography>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default FinancialCoach;
