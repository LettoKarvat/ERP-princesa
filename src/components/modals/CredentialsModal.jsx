import React, { useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Divider,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import { ContentCopy, Close, Person, Key, Badge } from '@mui/icons-material';

export const CredentialsModal = ({ open, credentials, onClose, onCopy }) => {
  const handleCopy = useCallback(() => {
    onCopy();
  }, [onCopy]);

  if (!credentials) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Key sx={{ fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Credenciais Criadas
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(255,255,255,0.1)'
            }
          }}
          aria-label="Fechar modal"
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 4 }}>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3, textAlign: 'center' }}
          >
            Usuário criado com sucesso! Compartilhe essas credenciais com segurança.
          </Typography>

          <Stack spacing={3}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Person sx={{ color: 'primary.main' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Informações do Usuário
                  </Typography>
                </Box>

                <Stack spacing={2}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      Nome Completo
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                      {credentials.fullname}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      Nome de Usuário
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, fontFamily: 'monospace', color: 'primary.main' }}>
                      {credentials.username}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      Tipo de Usuário
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        icon={<Badge />}
                        label={credentials.role}
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            <Card
              elevation={0}
              sx={{
                border: '2px solid',
                borderColor: 'warning.main',
                borderRadius: 2,
                backgroundColor: 'warning.light',
                backgroundImage: 'linear-gradient(45deg, rgba(255,193,7,0.1) 25%, transparent 25%, transparent 75%, rgba(255,193,7,0.1) 75%)',
                backgroundSize: '20px 20px'
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Key sx={{ color: 'warning.dark' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                    Senha Temporária
                  </Typography>
                </Box>

                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    color: 'warning.dark',
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    p: 2,
                    borderRadius: 2,
                    textAlign: 'center',
                    letterSpacing: 2,
                    border: '1px solid',
                    borderColor: 'warning.main',
                  }}
                >
                  {credentials.password}
                </Typography>

                <Typography
                  variant="body2"
                  color="warning.dark"
                  sx={{ mt: 2, textAlign: 'center', fontWeight: 500 }}
                >
                  ⚠️ O usuário deve alterar esta senha no primeiro acesso
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={onClose} variant="outlined" size="large" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Fechar
        </Button>
        <Button
          onClick={handleCopy}
          variant="contained"
          startIcon={<ContentCopy />}
          size="large"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            px: 3
          }}
          aria-label="Copiar credenciais para área de transferência"
        >
          Copiar Credenciais
        </Button>
      </DialogActions>
    </Dialog>
  );
};