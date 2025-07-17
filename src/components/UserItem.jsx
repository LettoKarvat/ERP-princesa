import React, { useCallback } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Stack,
  useTheme,
  useMediaQuery,
  Chip,
  Avatar,
  IconButton,
  Fade,
} from '@mui/material';
import {
  Edit,
  PersonOff,
  PersonAdd,
  AdminPanelSettings,
  Badge,
  LocalShipping,
  Build,
  Security
} from '@mui/icons-material';
import { ROLE_OPTIONS } from '../constants/roles';

export const UserItem = ({ user, onEdit, onDelete, onReactivate }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleEdit = useCallback(() => {
    onEdit(user);
  }, [user, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(user.id);
  }, [user.id, onDelete]);

  const handleReactivate = useCallback(() => {
    onReactivate(user.id);
  }, [user.id, onReactivate]);

  const getRoleLabel = useCallback((role) => {
    return ROLE_OPTIONS.find(option => option.value === role)?.label || role;
  }, []);

  const getRoleIcon = useCallback((role) => {
    const iconMap = {
      admin: <AdminPanelSettings />,
      abastecimento: <LocalShipping />,
      manutencao: <Build />,
      portaria: <Security />,
      motorista: <Badge />,
    };
    return iconMap[role] || <Badge />;
  }, []);

  const getRoleColor = useCallback((role) => {
    const colorMap = {
      admin: '#e53e3e',
      abastecimento: '#3182ce',
      manutencao: '#d69e2e',
      portaria: '#38a169',
      motorista: '#805ad5',
    };
    return colorMap[role] || '#718096';
  }, []);

  const getInitials = useCallback((name) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  return (
    <Fade in timeout={300}>
      <Card
        elevation={0}
        sx={{
          mb: 2,
          border: '1px solid',
          borderColor: user.is_active ? 'divider' : 'error.light',
          borderRadius: 3,
          backgroundColor: user.is_active ? 'background.paper' : 'grey.50',
          opacity: user.is_active ? 1 : 0.8,
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: user.is_active ? 'primary.main' : 'error.main',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)',
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            backgroundColor: user.is_active ? getRoleColor(user.role) : 'error.main',
          }
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={isMobile ? 'column' : 'row'}
            spacing={3}
            alignItems={isMobile ? 'flex-start' : 'center'}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  backgroundColor: getRoleColor(user.role),
                  fontSize: '1.2rem',
                  fontWeight: 600,
                }}
              >
                {getInitials(user.fullname)}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    mb: 0.5,
                    fontWeight: 600,
                    color: user.is_active ? 'text.primary' : 'text.secondary'
                  }}
                >
                  {user.fullname}
                </Typography>

                <Typography
                  variant="body2"
                  sx={{
                    mb: 1,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    color: 'primary.main',
                    fontSize: '0.9rem'
                  }}
                >
                  {user.username}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    icon={getRoleIcon(user.role)}
                    label={getRoleLabel(user.role)}
                    size="small"
                    sx={{
                      backgroundColor: `${getRoleColor(user.role)}15`,
                      color: getRoleColor(user.role),
                      fontWeight: 500,
                      '& .MuiChip-icon': {
                        color: 'inherit',
                      }
                    }}
                  />
                  {!user.is_active && (
                    <Chip
                      label="Inativo"
                      size="small"
                      color="error"
                      variant="outlined"
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexShrink: 0,
                width: isMobile ? '100%' : 'auto',
                justifyContent: isMobile ? 'flex-end' : 'flex-start'
              }}
            >
              {user.is_active ? (
                <>
                  <IconButton
                    onClick={handleEdit}
                    size="large"
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white',
                      }
                    }}
                    aria-label={`Editar usuário ${user.fullname}`}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={handleDelete}
                    size="large"
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'error.main',
                        color: 'white',
                      }
                    }}
                    aria-label={`Desativar usuário ${user.fullname}`}
                  >
                    <PersonOff />
                  </IconButton>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleReactivate}
                    startIcon={<PersonAdd />}
                    size="small"
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                    }}
                    aria-label={`Reativar usuário ${user.fullname}`}
                  >
                    Reativar
                  </Button>
                  <IconButton
                    onClick={handleEdit}
                    size="large"
                    sx={{
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white',
                      }
                    }}
                    aria-label={`Editar usuário ${user.fullname}`}
                  >
                    <Edit />
                  </IconButton>
                </>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Fade>
  );
};