import React, { useMemo } from 'react';
import {
  Typography,
  Box,
  Skeleton,
  Stack,
  Fade,
  Card,
  CardContent,
  Button,
  Slide,
  Zoom,
} from '@mui/material';
import { People, PersonOff, ArrowBack } from '@mui/icons-material';
import { UserItem } from './UserItem';

export const UserList = ({
  users,
  loading,
  searchTerm,
  filterRole,
  showInactive,
  onToggleInactive,
  onEdit,
  onDelete,
  onReactivate,
}) => {
  const { filteredActive, filteredInactive } = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    const activeUsers = users.filter(u => u.is_active);
    const inactiveUsers = users.filter(u => !u.is_active);

    const filterUsers = (userList) => {
      return userList.filter(u => {
        const nameMatch = u.fullname.toLowerCase().includes(lowerSearch);
        const usernameMatch = (u.username || '').toLowerCase().includes(lowerSearch);
        const roleMatch = filterRole ? u.role === filterRole : true;
        return (nameMatch || usernameMatch) && roleMatch;
      });
    };

    return {
      filteredActive: filterUsers(activeUsers),
      filteredInactive: filterUsers(inactiveUsers),
    };
  }, [users, searchTerm, filterRole]);

  if (loading) {
    return (
      <Stack spacing={2}>
        {[...Array(3)].map((_, index) => (
          <Card key={index} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={56} height={56} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" height={28} />
                  <Skeleton variant="text" width="40%" height={20} />
                  <Skeleton variant="rectangular" width={100} height={24} sx={{ mt: 1, borderRadius: 1 }} />
                </Box>
                <Stack direction="row" spacing={1}>
                  <Skeleton variant="circular" width={48} height={48} />
                  <Skeleton variant="circular" width={48} height={48} />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>
    );
  }

  // Renderizar lista de usuários ativos
  const renderActiveUsers = () => (
    <Slide direction="right" in={!showInactive} timeout={500} mountOnEnter unmountOnExit>
      <Box>
        <Fade in={!showInactive} timeout={700}>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Zoom in={!showInactive} timeout={600}>
                <People sx={{ color: 'success.main', fontSize: 32 }} />
              </Zoom>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'success.main',
                  flex: 1
                }}
              >
                Usuários Ativos
              </Typography>
              <Zoom in={!showInactive} timeout={800}>
                <Box
                  sx={{
                    backgroundColor: 'success.main',
                    color: 'white',
                    px: 3,
                    py: 1,
                    borderRadius: 3,
                    fontSize: '1rem',
                    fontWeight: 700,
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)',
                  }}
                >
                  {filteredActive.length}
                </Box>
              </Zoom>
            </Box>

            {filteredActive.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 3,
                  py: 8
                }}
              >
                <CardContent>
                  <Box sx={{ textAlign: 'center' }}>
                    <People sx={{ fontSize: 64, color: 'text.disabled', mb: 3 }} />
                    <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                      Nenhum usuário ativo encontrado
                    </Typography>
                    <Typography variant="body1" color="text.disabled">
                      {searchTerm || filterRole ? 'Tente ajustar os filtros de busca' : 'Adicione o primeiro usuário'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {filteredActive.map((user, index) => (
                  <Slide
                    key={user.id}
                    direction="up"
                    in={!showInactive}
                    timeout={300 + (index * 100)}
                    style={{ transitionDelay: !showInactive ? `${index * 50}ms` : '0ms' }}
                  >
                    <Box>
                      <UserItem
                        user={user}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReactivate={onReactivate}
                      />
                    </Box>
                  </Slide>
                ))}
              </Stack>
            )}
          </Box>
        </Fade>
      </Box>
    </Slide>
  );

  // Renderizar lista de usuários inativos
  const renderInactiveUsers = () => (
    <Slide direction="left" in={showInactive} timeout={500} mountOnEnter unmountOnExit>
      <Box>
        <Fade in={showInactive} timeout={700}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={onToggleInactive}
                sx={{
                  borderRadius: 3,
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                    color: 'white',
                    transform: 'translateX(-4px)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Voltar aos Ativos
              </Button>

              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Zoom in={showInactive} timeout={600}>
                  <PersonOff sx={{ color: 'error.main', fontSize: 32 }} />
                </Zoom>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 700,
                    color: 'error.main',
                    flex: 1
                  }}
                >
                  Usuários Inativos
                </Typography>
                <Zoom in={showInactive} timeout={800}>
                  <Box
                    sx={{
                      backgroundColor: 'error.main',
                      color: 'white',
                      px: 3,
                      py: 1,
                      borderRadius: 3,
                      fontSize: '1rem',
                      fontWeight: 700,
                      boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                    }}
                  >
                    {filteredInactive.length}
                  </Box>
                </Zoom>
              </Box>
            </Box>

            {filteredInactive.length === 0 ? (
              <Card
                elevation={0}
                sx={{
                  border: '2px dashed',
                  borderColor: 'error.light',
                  borderRadius: 3,
                  py: 8,
                  backgroundColor: 'error.light',
                  backgroundImage: 'linear-gradient(45deg, rgba(244,67,54,0.05) 25%, transparent 25%, transparent 75%, rgba(244,67,54,0.05) 75%)',
                  backgroundSize: '20px 20px'
                }}
              >
                <CardContent>
                  <Box sx={{ textAlign: 'center' }}>
                    <PersonOff sx={{ fontSize: 64, color: 'error.main', mb: 3, opacity: 0.7 }} />
                    <Typography variant="h5" color="error.main" gutterBottom sx={{ fontWeight: 600 }}>
                      Nenhum usuário inativo encontrado
                    </Typography>
                    <Typography variant="body1" color="error.dark" sx={{ opacity: 0.8 }}>
                      {searchTerm || filterRole ? 'Tente ajustar os filtros de busca' : 'Todos os usuários estão ativos'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={2}>
                {filteredInactive.map((user, index) => (
                  <Slide
                    key={user.id}
                    direction="up"
                    in={showInactive}
                    timeout={300 + (index * 100)}
                    style={{ transitionDelay: showInactive ? `${index * 50}ms` : '0ms' }}
                  >
                    <Box>
                      <UserItem
                        user={user}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onReactivate={onReactivate}
                      />
                    </Box>
                  </Slide>
                ))}
              </Stack>
            )}
          </Box>
        </Fade>
      </Box>
    </Slide>
  );

  return (
    <Box sx={{ position: 'relative', minHeight: '400px' }}>
      {renderActiveUsers()}
      {renderInactiveUsers()}
    </Box>
  );
};