import React, { useState, useEffect } from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Avatar,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
import {
  AccountBalance,
  Business,
  Mosque,
  Public,
  PhoneAndroid,
  Category,
} from '@mui/icons-material';
import { turkishBanks, bankTypes, popularBanks, getBankById } from '../../data/turkishBanks';

const BankSelector = ({ 
  value, 
  onChange, 
  label = "Banka Seçin",
  error = false,
  helperText = "",
  required = false,
  disabled = false,
  showPopular = true,
  showTypes = true,
  ...props 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);

  useEffect(() => {
    if (value) {
      const bank = getBankById(value) || turkishBanks.find(b => b.name === value);
      setSelectedBank(bank);
    } else {
      setSelectedBank(null);
    }
  }, [value]);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'kamu': return <Business fontSize="small" />;
      case 'ozel': return <AccountBalance fontSize="small" />;
      case 'katilim': return <Mosque fontSize="small" />;
      case 'yabanci': return <Public fontSize="small" />;
      case 'dijital': return <PhoneAndroid fontSize="small" />;
      default: return <Category fontSize="small" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'kamu': return '#1976d2';
      case 'ozel': return '#388e3c';
      case 'katilim': return '#7b1fa2';
      case 'yabanci': return '#f57c00';
      case 'dijital': return '#e91e63';
      default: return '#757575';
    }
  };

  // Popüler bankaları üstte göster
  const sortedBanks = showPopular 
    ? [
        ...turkishBanks.filter(bank => popularBanks.includes(bank.id)),
        ...turkishBanks.filter(bank => !popularBanks.includes(bank.id))
      ]
    : turkishBanks;

  // Grup başlıkları için bankaları türe göre grupla
  const groupedBanks = showTypes 
    ? Object.entries(bankTypes).reduce((acc, [type, typeName]) => {
        const banksOfType = sortedBanks.filter(bank => bank.type === type);
        if (banksOfType.length > 0) {
          acc.push({ type: 'group', label: typeName });
          acc.push(...banksOfType);
        }
        return acc;
      }, [])
    : sortedBanks;

  return (
    <Autocomplete
      value={selectedBank}
      onChange={(event, newValue) => {
        setSelectedBank(newValue);
        onChange(newValue ? newValue.id : '');
      }}
      inputValue={inputValue}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue);
      }}
      options={groupedBanks}
      getOptionLabel={(option) => {
        if (option.type === 'group') return option.label;
        return option.name || '';
      }}
      groupBy={(option) => {
        if (option.type === 'group') return null;
        return showTypes ? bankTypes[option.type] : null;
      }}
      isOptionEqualToValue={(option, value) => {
        if (option.type === 'group') return false;
        return option.id === value?.id;
      }}
      getOptionDisabled={(option) => option.type === 'group'}
      renderOption={(props, option) => {
        if (option.type === 'group') {
          return (
            <Box key={option.label}>
              <Divider sx={{ my: 1 }} />
              <Typography 
                variant="subtitle2" 
                color="textSecondary" 
                sx={{ px: 2, py: 1, fontWeight: 600 }}
              >
                {option.label}
              </Typography>
            </Box>
          );
        }

        const isPopular = popularBanks.includes(option.id);
        
        return (
          <Box component="li" {...props} key={option.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', py: 1 }}>
              <Avatar
                sx={{
                  bgcolor: option.color || getTypeColor(option.type),
                  width: 32,
                  height: 32,
                  mr: 2,
                  fontSize: '0.75rem'
                }}
              >
                {option.name.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1">
                    {option.name}
                  </Typography>
                  {isPopular && (
                    <Chip 
                      label="Popüler" 
                      size="small" 
                      color="primary" 
                      sx={{ height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                <Typography variant="caption" color="textSecondary">
                  {option.fullName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                {getTypeIcon(option.type)}
              </Box>
            </Box>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          required={required}
          disabled={disabled}
          placeholder="Banka adı yazın veya listeden seçin..."
          InputProps={{
            ...params.InputProps,
            startAdornment: selectedBank ? (
              <Avatar
                sx={{
                  bgcolor: selectedBank.color || getTypeColor(selectedBank.type),
                  width: 24,
                  height: 24,
                  mr: 1,
                  fontSize: '0.7rem'
                }}
              >
                {selectedBank.name.charAt(0)}
              </Avatar>
            ) : (
              <AccountBalance sx={{ mr: 1, color: 'action.active' }} />
            ),
          }}
        />
      )}
      disabled={disabled}
      {...props}
    />
  );
};

export default BankSelector;