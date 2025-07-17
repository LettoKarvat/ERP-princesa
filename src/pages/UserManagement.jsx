import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Backdrop,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Container,
  InputAdornment,
  Fade,
  Card,
  CardContent,
} from '@mui/material';
import { Search, FilterList, ManageAccounts } from '@mui/icons-material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useUsers } from '../hooks/useUsers';
import { UserForm } from '../components/UserForm';
import { UserList } from '../components/UserList';
import { CredentialsModal } from '../components/modals/CredentialsModal';
import { ROLE_OPTIONS } from '../constants/roles';

export default function UserManagement() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    reactivateUser,
    clearError,
  } = useUsers();

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  // Snackbar states
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Credentials modal states
  const [credentialsModal, setCredentialsModal] = useState({
    open: false,
    credentials: null,
  });

  // Edit modal states
  const [editModal, setEditModal] = useState({
    open: false,
    user: null,
    formData: {
      fullname: '',
      email: '',
      matricula: '',
      password: '',
      role: '',
    },
  });

  // Delete modal states
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    userId: null,
  });

  // Validation function
  const validateUserForm = useCallback((formData, isEdit = false) => {
    if (!formData.fullname || (!isEdit && !formData.password) || !formData.role) {
      return 'Preencha nome completo, senha e tipo de usuário.';
    }
    if (formData.role === 'admin' && !formData.email) {
      return 'Para criar um Admin, informe o email.';
    }
    if (formData.role !== 'admin' && !formData.matricula) {
      return 'Para criar usuários não-admin, informe a matrícula.';
    }
    return null;
  }, []);

  // Snackbar handlers
  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const closeSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // Create user handler
  const handleCreateUser = useCallback(async (payload) => {
    const validationError = validateUserForm(payload);
    if (validationError) {
      showSnackbar(validationError, 'error');
      return;
    }

    try {
      const credentials = await createUser(payload);
      setCredentialsModal({ open: true, credentials });
      showSnackbar('Usuário criado com sucesso!');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [createUser, validateUserForm, showSnackbar]);

  // Credentials modal handlers
  const closeCredentialsModal = useCallback(() => {
    setCredentialsModal({ open: false, credentials: null });
  }, []);

  const handleCopyCredentials = useCallback(() => {
    if (!credentialsModal.credentials) return;

    const { credentials } = credentialsModal;
    const credentialsText = `Nome: ${credentials.fullname}\nUsuário: ${credentials.username}\nTipo: ${credentials.role}\nSenha: ${credentials.password}`;

    navigator.clipboard.writeText(credentialsText)
      .then(() => showSnackbar('Credenciais copiadas para a área de transferência!'))
      .catch(() => showSnackbar('Erro ao copiar credenciais', 'error'));
  }, [credentialsModal.credentials, showSnackbar]);

  // Edit modal handlers
  const openEditModal = useCallback((user) => {
    setEditModal({
      open: true,
      user,
      formData: {
        fullname: user.fullname,
        email: user.role === 'admin' ? user.username || '' : '',
        matricula: user.role !== 'admin' ? user.username || '' : '',
        password: '',
        role: user.role,
      },
    });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({
      open: false,
      user: null,
      formData: {
        fullname: '',
        email: '',
        matricula: '',
        password: '',
        role: '',
      },
    });
  }, []);

  const handleEditFormChange = useCallback((field, value) => {
    setEditModal(prev => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
    }));
  }, []);

  const handleEditRoleChange = useCallback((newRole) => {
    setEditModal(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        role: newRole,
        email: newRole === 'admin' ? prev.formData.email : '',
        matricula: newRole !== 'admin' ? prev.formData.matricula : '',
      },
    }));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    const { user, formData } = editModal;
    if (!user) return;

    const validationError = validateUserForm(formData, true);
    if (validationError) {
      showSnackbar(validationError, 'error');
      return;
    }

    try {
      const payload = { fullname: formData.fullname, role: formData.role };
      if (formData.password) payload.password = formData.password;
      if (formData.role === 'admin') {
        payload.email = formData.email.trim().toLowerCase();
      } else {
        payload.matricula = formData.matricula.trim();
      }

      await updateUser(user.id, payload);
      closeEditModal();
      showSnackbar('Usuário editado com sucesso!');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [editModal, updateUser, validateUserForm, showSnackbar, closeEditModal]);

  // Delete modal handlers
  const openDeleteModal = useCallback((userId) => {
    setDeleteModal({ open: true, userId });
  }, []);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ open: false, userId: null });
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteModal.userId) return;

    try {
      await deleteUser(deleteModal.userId);
      closeDeleteModal();
      showSnackbar('Usuário desativado com sucesso!');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [deleteModal.userId, deleteUser, closeDeleteModal, showSnackbar]);

  // Reactivate user handler
  const handleReactivateUser = useCallback(async (userId) => {
    try {
      await reactivateUser(userId);
      showSnackbar('Usuário reativado com sucesso!');
    } catch (err) {
      showSnackbar(err.message, 'error');
    }
  }, [reactivateUser, showSnackbar]);

  // Toggle inactive users visibility
  const handleToggleInactive = useCallback(() => {
    setShowInactive(prev => !prev);
  }, []);

  // Clear error when snackbar closes
  React.useEffect(() => {
    if (error && !snackbar.open) {
      clearError();
    }
  }, [error, snackbar.open, clearError]);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      py: 4
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <ManageAccounts
              sx={{
                fontSize: 64,
                color: 'primary.main',
                mb: 2,
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }}
            />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Gerenciamento de Usuários
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
              Controle completo de usuários do sistema
            </Typography>
          </Box>
        </Fade>

        {/* User Creation Form */}
        <Fade in timeout={700}>
          <Box>
            <UserForm onSubmit={handleCreateUser} loading={loading} />
          </Box>
        </Fade>

        {/* Search and Filter Controls */}
        <Fade in timeout={900}>
          <Card
            elevation={0}
            sx={{
              mb: 4,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 3,
              overflow: 'hidden'
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack
                direction={isMobile ? 'column' : 'row'}
                spacing={3}
                alignItems="center"
              >
                <TextField
                  label="Pesquisar usuários"
                  placeholder="Digite o nome ou usuário..."
                  variant="outlined"
                  fullWidth
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ 'aria-label': 'Pesquisar usuários' }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />

                <FormControl sx={{ minWidth: isMobile ? '100%' : 240 }}>
                  <InputLabel id="filter-role-label">Filtrar por Tipo</InputLabel>
                  <Select
                    labelId="filter-role-label"
                    label="Filtrar por Tipo"
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    startAdornment={
                      <InputAdornment position="start">
                        <FilterList color="action" />
                      </InputAdornment>
                    }
                    inputProps={{ 'aria-label': 'Filtrar por tipo de usuário' }}
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    <MenuItem value="">Todos os tipos</MenuItem>
                    {ROLE_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  variant={showInactive ? "contained" : "outlined"}
                  color="error"
                  startIcon={showInactive ? <VisibilityOff /> : <Visibility />}
                  onClick={handleToggleInactive}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    minWidth: 160,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {showInactive ? 'Ocultar Inativos' : 'Mostrar Inativos'}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* User List */}
        <Fade in timeout={1100}>
          <Box>
            <UserList
              users={users}
              loading={loading}
              searchTerm={searchTerm}
              filterRole={filterRole}
              showInactive={showInactive}
              onToggleInactive={handleToggleInactive}
              onEdit={openEditModal}
              onDelete={openDeleteModal}
              onReactivate={handleReactivateUser}
            />
          </Box>
        </Fade>
      </Container>

      {/* Credentials Modal */}
      <CredentialsModal
        open={credentialsModal.open}
        credentials={credentialsModal.credentials}
        onClose={closeCredentialsModal}
        onCopy={handleCopyCredentials}
      />

      {/* Edit User Modal */}
      <Dialog
        open={editModal.open}
        onClose={closeEditModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 3
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Editar Usuário
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Stack spacing={3} sx={{ pt: 1 }}>
            <TextField
              label="Nome Completo"
              variant="outlined"
              fullWidth
              value={editModal.formData.fullname}
              onChange={(e) => handleEditFormChange('fullname', e.target.value)}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />

            <FormControl fullWidth>
              <InputLabel id="edit-role-label">Tipo de Usuário</InputLabel>
              <Select
                labelId="edit-role-label"
                label="Tipo de Usuário"
                value={editModal.formData.role}
                onChange={(e) => handleEditRoleChange(e.target.value)}
                disabled={loading}
                sx={{
                  borderRadius: 2,
                }}
              >
                {ROLE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {editModal.formData.role === 'admin' ? (
              <TextField
                label="Email"
                type="email"
                variant="outlined"
                fullWidth
                value={editModal.formData.email}
                onChange={(e) => handleEditFormChange('email', e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            ) : editModal.formData.role && (
              <TextField
                label="Matrícula"
                variant="outlined"
                fullWidth
                value={editModal.formData.matricula}
                onChange={(e) => handleEditFormChange('matricula', e.target.value)}
                disabled={loading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            )}

            <TextField
              label="Nova Senha"
              type="password"
              variant="outlined"
              fullWidth
              value={editModal.formData.password}
              onChange={(e) => handleEditFormChange('password', e.target.value)}
              disabled={loading}
              helperText="Deixe em branco se não quiser alterar a senha."
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={closeEditModal}
            disabled={loading}
            variant="outlined"
            size="large"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveEdit}
            disabled={loading}
            size="large"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteModal.open}
        onClose={closeDeleteModal}
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
          color: 'white',
          py: 3
        }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Desativar Usuário
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
            Tem certeza que deseja desativar este usuário? Esta ação pode ser revertida posteriormente.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          <Button
            onClick={closeDeleteModal}
            disabled={loading}
            variant="outlined"
            size="large"
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            disabled={loading}
            size="large"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 3
            }}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : 'Desativar Usuário'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Loading Backdrop */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(4px)',
        }}
        open={loading}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress color="inherit" size={60} />
          <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
            Processando...
          </Typography>
        </Box>
      </Backdrop>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={closeSnackbar}
          severity={snackbar.severity}
          sx={{
            width: '100%',
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      {error && (
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={clearError}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={clearError}
            severity="error"
            sx={{
              width: '100%',
              borderRadius: 2,
              fontWeight: 500,
            }}
          >
            {error}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}