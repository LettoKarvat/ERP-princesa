import React from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  Box,
  Button,
  CssBaseline,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material';
import {
  FaHome,
  FaClipboardCheck,
  FaChartBar,
  FaGasPump,
  FaTools,
  FaSignOutAlt,
  FaWhatsapp,
  FaCog,
  FaUsers, // <-- Novo ícone para gerenciamento de usuários
} from 'react-icons/fa';
import { PiTireLight } from 'react-icons/pi';

// Define a largura fixa da sidebar
const SIDEBAR_WIDTH = 240;

// Estilo padrão para os botões da lista
const listItemButtonStyle = {
  color: '#fff',
  textTransform: 'none', // não deixar tudo em maiúsculo
  '&.active': {
    backgroundColor: '#333', // fundo diferente no item ativo
  },
  '&:hover': {
    backgroundColor: '#374151',
  },
};

function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || '';

  const handleLogout = () => {
    // Remove o token e demais dados do usuário do localStorage
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('role');
    localStorage.removeItem('fullname');

    // Redireciona para a tela de login
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* SIDEBAR FIXA */}
      <Box
        sx={{
          width: SIDEBAR_WIDTH,
          height: '100vh',
          backgroundColor: '#1f2937',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          zIndex: 999,
        }}
      >
        {/* Cabeçalho com "logo" */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            backgroundColor: '#111827',
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <img
              src="https://iili.io/39JTE5Q.png"
              alt="Logo Princesa"
              style={{ height: '100px', marginRight: '2px' }}
            />
          </Typography>
        </Box>

        {/* Menu principal */}
        <Box component="nav" sx={{ flex: 1 }}>
          <List>
            {/* Dashboard (todos veem) */}
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/dashboard"
                sx={listItemButtonStyle}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <FaHome />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>

            {/* Veículos: ex. admin e manutencao */}
            {['admin', 'manutencao'].includes(role) && (
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/vehicles"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaCog />
                  </ListItemIcon>
                  <ListItemText primary="Veículos" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Checklist: ex. admin, motorista, portaria */}
            {['admin', 'motorista', 'portaria'].includes(role) && (
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/checklist"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaClipboardCheck />
                  </ListItemIcon>
                  <ListItemText primary="Checklist" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Consumo: ex. admin, fiscal */}
            {['admin', 'fiscal'].includes(role) && (
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/consumption"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaChartBar />
                  </ListItemIcon>
                  <ListItemText primary="Consumo" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Abastecimento: ex. admin, abastecimento */}
            {['admin', 'abastecimento'].includes(role) && (
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/refueling"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaGasPump />
                  </ListItemIcon>
                  <ListItemText primary="Abastecimento" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Troca de Peças: admin e manutencao */}
            {['admin', 'manutencao'].includes(role) && (
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/parts-replacement"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaTools />
                  </ListItemIcon>
                  <ListItemText primary="Troca de Peças" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Troca de Pneus: admin e manutencao */}
            {['admin', 'manutencao'].includes(role) && (
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/tire-replacement"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <PiTireLight size={24} />
                  </ListItemIcon>
                  <ListItemText primary="Pneus" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Gerenciar Usuários: somente admin */}
            {role === 'admin' && (
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/user-management"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaUsers />
                  </ListItemIcon>
                  <ListItemText primary="Usuários" />
                </ListItemButton>
              </ListItem>
            )}

            {/* Botão de sair */}
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={listItemButtonStyle}>
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <FaSignOutAlt style={{ color: 'red' }} />
                </ListItemIcon>
                <ListItemText primary="Sair" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>

        {/* Suporte (Rodapé) */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Suporte:
          </Typography>
          <Button
            variant="contained"
            color="success"
            fullWidth
            component="a"
            href="https://wa.me/5547996601626"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              fontSize: '1rem',
              padding: '8px 16px',
              textTransform: 'none',
            }}
          >
            Atendimento
          </Button>
        </Box>
      </Box>

      {/* CONTEÚDO PRINCIPAL */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: `${SIDEBAR_WIDTH}px`, // empurra o conteúdo para a direita
          p: 3,
          backgroundColor: '#f5f6fa',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
