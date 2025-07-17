import React, { useState, useCallback } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Card,
  CardContent,
  Fade,
  IconButton,
  Collapse,
} from '@mui/material';
import { Add, ExpandMore, ExpandLess } from '@mui/icons-material';
import { ROLE_OPTIONS } from '../constants/roles';

export const UserForm = ({ onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    matricula: '',
    password: '',
    role: '',
  });
  const [expanded, setExpanded] = useState(false);

  const handleInputChange = useCallback((field) => (event) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleRoleChange = useCallback((event) => {
    const newRole = event.target.value;
    setFormData(prev => ({
      ...prev,
      role: newRole,
      email: newRole === 'admin' ? prev.email : '',
      matricula: newRole !== 'admin' ? prev.matricula : '',
    }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const payload = {
      fullname: formData.fullname,
      password: formData.password,
      role: formData.role,
    };

    if (formData.role === 'admin') {
      payload.email = formData.email.trim().toLowerCase();
    } else {
      payload.matricula = formData.matricula.trim();
    }

    await onSubmit(payload);

    // Reset form after successful submission
    setFormData({
      fullname: '',
      email: '',
      matricula: '',
      password: '',
      role: '',
    });
    setExpanded(false);
  }, [formData, onSubmit]);

  return (
    <Card
      elevation={0}
      sx={{
        mb: 4,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2.5,
          cursor: 'pointer',
          backgroundColor: expanded ? 'primary.main' : 'transparent',
          color: expanded ? 'white' : 'text.primary',
          transition: 'all 0.3s ease',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Add sx={{ fontSize: 24 }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Adicionar Novo Usuário
          </Typography>
        </Box>
        <IconButton
          sx={{ color: 'inherit' }}
          aria-label={expanded ? 'Recolher formulário' : 'Expandir formulário'}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout={300}>
        <CardContent sx={{ pt: 0 }}>
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ p: 1 }}
          >
            <Stack spacing={3}>
              <TextField
                label="Nome Completo"
                variant="outlined"
                fullWidth
                required
                value={formData.fullname}
                onChange={handleInputChange('fullname')}
                disabled={loading}
                inputProps={{ 'aria-label': 'Nome completo do usuário' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />

              <FormControl fullWidth required>
                <InputLabel id="role-label">Tipo de Usuário</InputLabel>
                <Select
                  labelId="role-label"
                  label="Tipo de Usuário"
                  value={formData.role}
                  onChange={handleRoleChange}
                  disabled={loading}
                  inputProps={{ 'aria-label': 'Tipo de usuário' }}
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="">Selecione...</MenuItem>
                  {ROLE_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Fade in={!!formData.role} timeout={300}>
                <Box>
                  {formData.role === 'admin' ? (
                    <TextField
                      label="Email"
                      type="email"
                      variant="outlined"
                      fullWidth
                      required
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      disabled={loading}
                      inputProps={{ 'aria-label': 'Email do administrador' }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  ) : formData.role && (
                    <TextField
                      label="Matrícula"
                      variant="outlined"
                      fullWidth
                      required
                      value={formData.matricula}
                      onChange={handleInputChange('matricula')}
                      disabled={loading}
                      inputProps={{ 'aria-label': 'Matrícula do usuário' }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  )}
                </Box>
              </Fade>

              <TextField
                label="Senha"
                type="password"
                variant="outlined"
                fullWidth
                required
                value={formData.password}
                onChange={handleInputChange('password')}
                disabled={loading}
                inputProps={{ 'aria-label': 'Senha do usuário' }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                  sx={{
                    minWidth: 160,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                  }}
                  aria-label="Criar novo usuário"
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Criar Usuário'}
                </Button>
              </Box>
            </Stack>
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
};