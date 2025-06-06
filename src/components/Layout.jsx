// src/components/Layout.jsx
import React, { useState } from "react";
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
  Collapse,
  Divider,
} from "@mui/material";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  FaHome,
  FaClipboardCheck,
  FaChartBar,
  FaGasPump,
  FaSignOutAlt,
  FaCog,
  FaUsers,
} from "react-icons/fa";
import { PiTireLight } from "react-icons/pi";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

const DRAWER_WIDTH = 256;

const listItemButtonStyle = {
  color: "#fff",
  textTransform: "none",
  "&.active": {
    backgroundColor: "#333",
  },
  "&:hover": {
    backgroundColor: "#374151",
  },
};

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role") || "";
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  // estado para abrir/fechar Drawer no mobile
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  // Rotas colapsáveis
  const [openPortaria, setOpenPortaria] = useState(false);
  const [openAbastecimento, setOpenAbastecimento] = useState(false);
  const [openTrocaPecas, setOpenTrocaPecas] = useState(false);
  const [openDriverDiario, setOpenDriverDiario] = useState(false);
  const [openDriverDecendial, setOpenDriverDecendial] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("role");
    localStorage.removeItem("fullname");
    navigate("/login");
  };

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1f2937",
        color: "#fff",
        overflowX: "hidden",
      }}
    >
      {/* Cabeçalho com logo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          backgroundColor: "#111827",
        }}
      >
        <Typography variant="h6" sx={{ display: "flex", alignItems: "center" }}>
          <img
            src="https://iili.io/39JTE5Q.png"
            alt="Logo Princesa"
            style={{ height: "100px", marginRight: "2px" }}
          />
        </Typography>
      </Box>

      <Divider />

      <Box component="nav" sx={{ flex: 1 }}>
        <List>
          {/* Dashboard -> só admin */}
          {role === "admin" && (
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/dashboard"
                sx={listItemButtonStyle}
                selected={location.pathname === "/dashboard"}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <FaHome />
                </ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Veículos -> admin ou manutencao */}
          {["admin", "manutencao"].includes(role) && (
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/vehicles"
                sx={listItemButtonStyle}
                selected={location.pathname === "/vehicles"}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <FaCog />
                </ListItemIcon>
                <ListItemText primary="Veículos" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Controle de Portaria -> admin, portaria, manutencao */}
          {["admin", "portaria", "manutencao"].includes(role) && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setOpenPortaria(!openPortaria)}
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <FaClipboardCheck />
                  </ListItemIcon>
                  <ListItemText primary="Controle de Portaria" />
                  {openPortaria ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openPortaria} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/portaria/saida"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/portaria/saida"}
                    >
                      <ListItemText primary="Saída" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/portaria/chegada"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/portaria/chegada"}
                    >
                      <ListItemText primary="Chegada" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>
            </>
          )}

          {/* Consumo -> admin, fiscal, manutencao */}
          {["admin", "fiscal", "manutencao"].includes(role) && (
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/consumption"
                sx={listItemButtonStyle}
                selected={location.pathname === "/consumption"}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <FaChartBar />
                </ListItemIcon>
                <ListItemText primary="Consumo" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Abastecimento -> admin, abastecimento, manutencao */}
          {["admin", "abastecimento", "manutencao"].includes(role) && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setOpenAbastecimento(!openAbastecimento)}
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <FaGasPump />
                  </ListItemIcon>
                  <ListItemText primary="Abastecimento" />
                  {openAbastecimento ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openAbastecimento} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/refueling"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/refueling"}
                    >
                      <ListItemText primary="Abastecimentos" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/refueling/report"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/refueling/report"}
                    >
                      <ListItemText primary="Relatórios" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>
            </>
          )}

          {/* Troca de peças -> admin, manutencao */}
          {["admin", "manutencao"].includes(role) && (
            <>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setOpenTrocaPecas(!openTrocaPecas)}
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <FaClipboardCheck />
                  </ListItemIcon>
                  <ListItemText primary="Troca de Peças" />
                  {openTrocaPecas ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openTrocaPecas} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/parts-replacement/maintenance"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={
                        location.pathname === "/parts-replacement/maintenance"
                      }
                    >
                      <ListItemText primary="Manutenção" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/parts-replacement/report"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/parts-replacement/report"}
                    >
                      <ListItemText primary="Relatórios" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>
            </>
          )}

          {/* Pneus -> admin, manutencao */}
          {["admin", "manutencao"].includes(role) && (
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/tire-replacement"
                sx={listItemButtonStyle}
                selected={location.pathname === "/tire-replacement"}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <PiTireLight size={24} />
                </ListItemIcon>
                <ListItemText primary="Pneus" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Usuários -> só admin */}
          {role === "admin" && (
            <ListItem disablePadding>
              <ListItemButton
                component={NavLink}
                to="/user-management"
                sx={listItemButtonStyle}
                selected={location.pathname === "/user-management"}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  <FaUsers />
                </ListItemIcon>
                <ListItemText primary="Usuários" />
              </ListItemButton>
            </ListItem>
          )}

          {/* Checklists do Motorista -> agrupar em dois: Diário e Decendial */}
          {["admin", "motorista", "manutencao"].includes(role) && (
            <>
              {/* Agrupamento Diário */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setOpenDriverDiario(!openDriverDiario)}
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <FaClipboardCheck />
                  </ListItemIcon>
                  <ListItemText primary="Checklist Diário" />
                  {openDriverDiario ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openDriverDiario} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/driver-checklist"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/driver-checklist"}
                    >
                      <ListItemText primary="Criar checklist" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/driver-checklists"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/driver-checklists"}
                    >
                      <ListItemText primary="Meus checklists" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>



              {/* Agrupamento Decendial */}
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => setOpenDriverDecendial(!openDriverDecendial)}
                  sx={listItemButtonStyle}
                >
                  <ListItemIcon sx={{ color: "inherit" }}>
                    <FaClipboardCheck />
                  </ListItemIcon>
                  <ListItemText primary="Checklist Decendial" />
                  {openDriverDecendial ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
              <Collapse in={openDriverDecendial} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/driver-checklist-decendial"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/driver-checklist-decendial"}
                    >
                      <ListItemText primary="Criar checklist" />
                    </ListItemButton>
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/driver-checklists-decendial"
                      sx={{ pl: 4, ...listItemButtonStyle }}
                      selected={location.pathname === "/driver-checklists-decendial"}
                    >
                      <ListItemText primary="Meus checklists" />
                    </ListItemButton>
                  </ListItem>
                </List>
              </Collapse>
            </>
          )}

          {/* Sair (para todos) */}
          <ListItem disablePadding sx={{ mt: 1 }}>
            <ListItemButton onClick={handleLogout} sx={listItemButtonStyle}>
              <ListItemIcon sx={{ color: "inherit" }}>
                <FaSignOutAlt style={{ color: "red" }} />
              </ListItemIcon>
              <ListItemText primary="Sair" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>

      {/* Rodapé */}
      <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Suporte:
        </Typography>
        <Button
          variant="contained"
          color="success"
          fullWidth
          component="a"
          href="https://chat.whatsapp.com/GyfebFkUpvE6SFHj1skkzB"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            fontSize: "1rem",
            padding: "8px 16px",
            textTransform: "none",
          }}
        >
          Atendimento
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#1f2937" }}
    >
      <CssBaseline />

      {/* AppBar no mobile */}
      {!isDesktop && (
        <AppBar
          position="fixed"
          sx={{
            width: "100%",
            ml: 0,
            backgroundColor: "#1f2937",
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
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              backgroundColor: "#1f2937",
              color: "#fff",
              overflowY: "auto",
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
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              backgroundColor: "#1f2937",
              color: "#fff",
              overflowY: "auto",
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
          ml: { md: 0 },
          mt: { xs: isDesktop ? 0 : 8, md: 0 },
          p: 2,
          backgroundColor: "#f5f6fa",
        }}
      >
        {!isDesktop && <Toolbar />}
        <Outlet />
      </Box>
    </Box>
  );
}

export default Layout;
