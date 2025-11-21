import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Info,
  CheckCircle,
} from '@mui/icons-material';

/**
 * QueryResults - Display AI query results with visualizations
 */
const QueryResults = ({ results }) => {
  if (!results) return null;

  const { interpretation, results: data, response, suggestions, visualizations } = results;

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const renderVisualization = () => {
    if (!visualizations || visualizations.type === 'none') return null;

    const { type, data: chartData } = visualizations;

    switch (type) {
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: %${(percent * 100).toFixed(0)}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(2)} TL`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(2)} TL`} />
              <Legend />
              <Bar dataKey="value" fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(2)} TL`} />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#8884d8" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderDataTable = () => {
    if (!data || !data.data) return null;

    const tableData = Array.isArray(data.data) ? data.data : [];
    if (tableData.length === 0) return null;

    return (
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Kategori</TableCell>
              <TableCell align="right">Tutar</TableCell>
              {tableData[0].transaction_count && (
                <TableCell align="right">İşlem Sayısı</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.category || row.name}</TableCell>
                <TableCell align="right">
                  {parseFloat(row.value || row.balance || 0).toFixed(2)} TL
                </TableCell>
                {row.transaction_count && (
                  <TableCell align="right">{row.transaction_count}</TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderSummaryCards = () => {
    if (data.type === 'summary' && data.data) {
      const { income, expense, net, transactions } = data.data;
      
      return (
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Gelir
              </Typography>
              <Typography variant="h6" color="success.main">
                {income.toFixed(2)} TL
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Gider
              </Typography>
              <Typography variant="h6" color="error.main">
                {expense.toFixed(2)} TL
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                <Typography variant="caption" color="text.secondary">
                  Net
                </Typography>
                {net > 0 ? (
                  <TrendingUp fontSize="small" color="success" />
                ) : (
                  <TrendingDown fontSize="small" color="error" />
                )}
              </Stack>
              <Typography
                variant="h6"
                color={net > 0 ? 'success.main' : 'error.main'}
              >
                {net.toFixed(2)} TL
              </Typography>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ flex: 1, minWidth: 150 }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                İşlem Sayısı
              </Typography>
              <Typography variant="h6">
                {transactions}
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      );
    }

    if (data.type === 'comparison' && data.change) {
      const { amount, percentage } = data.change;
      const isIncrease = amount > 0;
      
      return (
        <Alert
          severity={isIncrease ? 'warning' : 'success'}
          icon={isIncrease ? <TrendingUp /> : <TrendingDown />}
        >
          <Typography variant="body2">
            Bir önceki döneme göre{' '}
            <strong>
              {isIncrease ? 'artış' : 'azalış'}: {Math.abs(amount).toFixed(2)} TL
            </strong>{' '}
            (%{Math.abs(percentage).toFixed(1)})
          </Typography>
        </Alert>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardContent>
        {/* Response Text */}
        <Stack direction="row" spacing={1} alignItems="flex-start" mb={2}>
          <CheckCircle color="success" />
          <Box flex={1}>
            <Typography variant="body1" gutterBottom>
              {response}
            </Typography>
            
            {/* Confidence Score */}
            {interpretation.confidence && (
              <Chip
                label={`Güven: %${interpretation.confidence}`}
                size="small"
                color={interpretation.confidence > 80 ? 'success' : 'warning'}
                variant="outlined"
              />
            )}
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {/* Summary Cards */}
        {renderSummaryCards()}

        {/* Visualization */}
        {visualizations && visualizations.type !== 'none' && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Görselleştirme
            </Typography>
            {renderVisualization()}
          </Box>
        )}

        {/* Data Table */}
        {data && data.data && Array.isArray(data.data) && data.data.length > 0 && (
          <Box mt={3}>
            <Typography variant="subtitle2" gutterBottom>
              Detaylar
            </Typography>
            {renderDataTable()}
          </Box>
        )}

        {/* Total */}
        {data && data.total !== undefined && (
          <Box mt={2}>
            <Typography variant="h6" align="right">
              Toplam: {data.total.toFixed(2)} TL
            </Typography>
          </Box>
        )}

        {/* Suggestions */}
        {suggestions && suggestions.length > 0 && (
          <Box mt={3}>
            <Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
              <Info fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                İlgili sorular:
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
              {suggestions.map((suggestion, index) => (
                <Chip
                  key={index}
                  label={suggestion}
                  size="small"
                  variant="outlined"
                  clickable
                />
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default QueryResults;
