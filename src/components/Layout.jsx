// src/components/Layout.jsx
import React, { useState } from 'react';
import {
  Box,
  CssBaseline,
  Toolbar,
  Typography,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Drawer,
  AppBar,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import {
  FaHome,
  FaClipboardCheck,
  FaChartBar,
  FaGasPump,
  FaTools,
  FaSignOutAlt,
  FaWhatsapp,
  FaCog,
  FaUsers,
} from 'react-icons/fa';
import { PiTireLight } from 'react-icons/pi';
import MenuIcon from '@mui/icons-material/Menu';

const DRAWER_WIDTH = 240;

function Layout() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role') || '';
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('role');
    localStorage.removeItem('fullname');
    navigate('/login');
  };

  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1f2937',
        color: '#fff',
      }}
    >
      {/* Cabeçalho com logo */}
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

      <Box component="nav" sx={{ flex: 1 }}>
        <List>
          {/* Dashboard */}
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

          {/* Veículos */}
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

          {/* Checklist (tela antiga) */}
          {['admin', 'portaria'].includes(role) && (
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/checklist"
                sx={listItemButtonStyle}
              >
                <ListItemIcon sx={{ color: 'inherit' }}>
                  <FaClipboardCheck />
                </ListItemIcon>
                <ListItemText primary="Checklist (Portaria)" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Consumo */}
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

          {/* Abastecimento */}
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

          {/* Peças */}
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

          {/* Pneus */}
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

          {/* Usuários */}
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

          {/* ------------------------------
              NOVOS ITENS PARA O DRIVER
              (motorista e admin)
          ------------------------------ */}
          {['admin', 'motorista'].includes(role) && (
            <>
              {/* Criar Checklist (Driver) */}
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/driver-checklist"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaClipboardCheck />
                  </ListItemIcon>
                  <ListItemText primary="Criar Checklist (Caminhão/Motorista)" />
                </ListItemButton>
              </ListItem>
              {/* Listar Checklists (Driver) */}
              <ListItem disablePadding>
                <ListItemButton
                  component={NavLink}
                  to="/driver-checklists"
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: 'inherit' }}>
                    <FaClipboardCheck />
                  </ListItemIcon>
                  <ListItemText primary="Meus Checklists" />
                </ListItemButton>
              </ListItem>
            </>
          )}

          {/* Botão Sair */}
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

      {/* Rodapé */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
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
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />

      {/* AppBar no mobile */}
      {!isDesktop && (
        <AppBar
          position="fixed"
          sx={{
            width: '100%',
            ml: 0,
            backgroundColor: '#1f2937',
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Princesa ERP
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      {/* Drawer (sidebar) */}
      {isDesktop ? (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            [`& .MuiDrawer-paper`]: {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      ) : (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            [`& .MuiDrawer-paper`]: {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Conteúdo principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: { md: `${DRAWER_WIDTH}px` },
          mt: { xs: isDesktop ? 0 : 8, md: 0 },
          p: 2,
          minHeight: '100vh',
          backgroundColor: '#f5f6fa',
        }}
      >
        {!isDesktop && <Toolbar />}
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;

// Estilos do item de lista
const listItemButtonStyle = {
  color: '#fff',
  textTransform: 'none',
  '&.active': {
    backgroundColor: '#333',
  },
  '&:hover': {
    backgroundColor: '#374151',
  },
};
