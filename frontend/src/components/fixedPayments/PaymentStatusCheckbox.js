import React, { useState } from 'react';
import {
  Checkbox,
  CircularProgress,
  Tooltip,
  Box,
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';

const PaymentStatusCheckbox = ({ 
  payment, 
  month, 
  year, 
  isPaid, 
  onStatusChange,
  disabled = false 
}) => {
  const [loading, setLoading] = useState(false);

  const handleChange = async (event) => {
    const newStatus = event.target.checked;
    setLoading(true);
    
    try {
      await onStatusChange(payment.id, newStatus, month, year);
    } catch (error) {
      console.error('Error changing payment status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 42, height: 42 }}>
        <CircularProgress size={20} />
      </Box>
    );
  }

  return (
    <Tooltip title={isPaid ? "Ödendi olarak işaretli" : "Ödenmedi olarak işaretli"}>
      <Checkbox
        checked={isPaid}
        onChange={handleChange}
        disabled={disabled}
        icon={<RadioButtonUnchecked />}
        checkedIcon={<CheckCircle />}
        color="success"
        sx={{
          '&.Mui-checked': {
            color: 'success.main',
          },
        }}
      />
    </Tooltip>
  );
};

export default PaymentStatusCheckbox;
