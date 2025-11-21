import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Avatar,
  Pagination,
  CircularProgress,
  InputAdornment,
} from '@mui/material';
import {
  Edit,
  Block,
  CheckCircle,
  Search,
  Person,
  AdminPanelSettings,
  Add,
  Lock,
  VpnKey,
  Delete,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { adminAPI, formatDate, handleApiError } from '../../services/api';

const UserManagement = () => {
  const { showSuccess, showError } = useNotification();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [createAdminDialogOpen, setCreateAdminDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
  });

  // Create admin form
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  useEffect(() => {
    loadUsers();
  }, [currentPage, filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: 10,
        ...filters,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          delete params[key];
        }
      });

      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data.data.users);
      setTotalPages(response.data.data.pagination.totalPages);
    } catch (error) {
      showError(handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleUpdateUserStatus = async (userId, isActive) => {
    try {
      await adminAPI.updateUserStatus(userId, { isActive });
      showSuccess(`Kullanıcı ${isActive ? 'aktif' : 'pasif'} hale getirildi`);
      loadUsers();
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleUpdateUserRole = async (userId, role) => {
    try {
      await adminAPI.updateUserRole(userId, { role });
      showSuccess(`Kullanıcı rolü ${role} olarak güncellendi`);
      setEditDialogOpen(false);
      loadUsers();
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleCreateAdmin = async () => {
    try {
      await adminAPI.createAdmin(adminForm);
      showSuccess('Admin kullanıcı başarıyla oluşturuldu');
      setCreateAdminDialogOpen(false);
      setAdminForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
      });
      loadUsers();
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleOpenPasswordDialog = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setGeneratedPassword('');
    setPasswordDialogOpen(true);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      showError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      await adminAPI.resetUserPassword(selectedUser.id, { newPassword });
      showSuccess('Kullanıcı şifresi başarıyla sıfırlandı');
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const handleGeneratePassword = async () => {
    try {
      const response = await adminAPI.generateUserPassword(selectedUser.id);
      setGeneratedPassword(response.data.data.newPassword);
      showSuccess('Yeni şifre oluşturuldu');
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showSuccess('Şifre panoya kopyalandı');
    });
  };

  const handleOpenDeleteDialog = (user) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    try {
      await adminAPI.deleteUser(selectedUser.id);
      showSuccess('Kullanıcı başarıyla silindi');
      setDeleteDialogOpen(false);
      loadUsers();
    } catch (error) {
      showError(handleApiError(error));
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Kullanıcı Yönetimi
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Sistem kullanıcılarını yönetin
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateAdminDialogOpen(true)}
          >
            Admin Oluştur
          </Button>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filtreler
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Ara"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={filters.role}
                    label="Rol"
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="user">Kullanıcı</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={filters.isActive}
                    label="Durum"
                    onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  >
                    <MenuItem value="">Tümü</MenuItem>
                    <MenuItem value="true">Aktif</MenuItem>
                    <MenuItem value="false">Pasif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilters({ search: '', role: '', isActive: '' });
                    setCurrentPage(1);
                  }}
                >
                  Temizle
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Card>

        {/* Users Table */}
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Kullanıcı</TableCell>
                  <TableCell>E-posta</TableCell>
                  <TableCell>Rol</TableCell>
                  <TableCell>Durum</TableCell>
                  <TableCell>Kayıt Tarihi</TableCell>
                  <TableCell align="center">İşlemler</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {getInitials(user.firstName, user.lastName)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">
                              {user.firstName} {user.lastName}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={user.role === 'admin' ? <AdminPanelSettings /> : <Person />}
                          label={user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                          color={user.role === 'admin' ? 'secondary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={user.isActive ? <CheckCircle /> : <Block />}
                          label={user.isActive ? 'Aktif' : 'Pasif'}
                          color={user.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleEditUser(user)}
                          title="Düzenle"
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleOpenPasswordDialog(user)}
                          title="Şifre Sıfırla"
                        >
                          <Lock />
                        </IconButton>
                        <IconButton
                          size="small"
                          color={user.isActive ? 'error' : 'success'}
                          onClick={() => handleUpdateUserStatus(user.id, !user.isActive)}
                          title={user.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                        >
                          {user.isActive ? <Block /> : <CheckCircle />}
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleOpenDeleteDialog(user)}
                          title="Kullanıcıyı Sil"
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="textSecondary">
                        Kullanıcı bulunamadı
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
          )}
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Kullanıcı Düzenle</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {selectedUser.email}
                </Typography>
                
                <FormControl fullWidth sx={{ mt: 3 }}>
                  <InputLabel>Rol</InputLabel>
                  <Select
                    value={selectedUser.role}
                    label="Rol"
                    onChange={(e) => setSelectedUser(prev => ({ ...prev, role: e.target.value }))}
                  >
                    <MenuItem value="user">Kullanıcı</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>İptal</Button>
            <Button
              onClick={() => handleUpdateUserRole(selectedUser.id, selectedUser.role)}
              variant="contained"
            >
              Güncelle
            </Button>
          </DialogActions>
        </Dialog>

        {/* Password Reset Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Kullanıcı Şifresi Sıfırla</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {selectedUser.firstName} {selectedUser.lastName}
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {selectedUser.email}
                </Typography>
                
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<VpnKey />}
                    onClick={handleGeneratePassword}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Rastgele Şifre Oluştur
                  </Button>
                  
                  {generatedPassword && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                      <Typography variant="body2" gutterBottom>
                        Oluşturulan Şifre:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          value={generatedPassword}
                          variant="outlined"
                          size="small"
                          fullWidth
                          InputProps={{
                            readOnly: true,
                          }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => copyToClipboard(generatedPassword)}
                        >
                          Kopyala
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" gutterBottom>
                  Veya manuel şifre belirleyin:
                </Typography>
                <TextField
                  fullWidth
                  label="Yeni Şifre"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="En az 6 karakter olmalıdır"
                  sx={{ mt: 1 }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>İptal</Button>
            <Button
              onClick={handleResetPassword}
              variant="contained"
              disabled={!newPassword || newPassword.length < 6}
            >
              Şifreyi Sıfırla
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Admin Dialog */}
        <Dialog open={createAdminDialogOpen} onClose={() => setCreateAdminDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Yeni Admin Oluştur</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Ad"
                    value={adminForm.firstName}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Soyad"
                    value={adminForm.lastName}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="E-posta"
                    type="email"
                    value={adminForm.email}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Şifre"
                    type="password"
                    value={adminForm.password}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateAdminDialogOpen(false)}>İptal</Button>
            <Button
              onClick={handleCreateAdmin}
              variant="contained"
            >
              Oluştur
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete User Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Kullanıcıyı Sil</DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Box sx={{ pt: 2 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>{selectedUser.firstName} {selectedUser.lastName}</strong> kullanıcısını silmek istediğinizden emin misiniz?
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  E-posta: {selectedUser.email}
                </Typography>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'error.50', borderRadius: 1, border: 1, borderColor: 'error.main' }}>
                  <Typography variant="body2" color="error.main" fontWeight="bold">
                    ⚠️ Uyarı: Bu işlem geri alınamaz!
                  </Typography>
                  <Typography variant="caption" color="error.main" sx={{ display: 'block', mt: 1 }}>
                    Kullanıcının tüm verileri (hesaplar, işlemler, kredi kartları vb.) kalıcı olarak silinecektir.
                  </Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>İptal</Button>
            <Button
              onClick={handleDeleteUser}
              variant="contained"
              color="error"
              startIcon={<Delete />}
            >
              Kullanıcıyı Sil
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserManagement;