// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { decodeToken } from "../utils/jwt";
import { logout } from "../services/apiFlask";

import LoginPage from "../pages/LoginPage";
import Dashboard from "../pages/Dashboard";
import VehicleList from "../pages/VehicleList";
import ConsumptionControl from "../pages/ConsumptionControl";
import TireManagement from "../pages/TireManagement";
import Refueling from "../pages/Refueling";
import Layout from "../components/Layout";
import UserManagement from "../pages/UserManagement";
import DriverChecklist from "../pages/DriverChecklist";
import DriverChecklistsList from "../pages/DriverChecklistsList";
import DecendialChecklist from "../pages/DecendialChecklist";
import DecendialChecklistsList from "../pages/DecendialChecklistsList";
import ChegadaPage from "../pages/ChegadaPage";
import SaidaPage from "../pages/SaidaPage";
import PartsReplacementReport from "../pages/PartsReplacementReport";
import PartsReplacementMaintenance from "../pages/PartsReplacementMaintenance";
import RefuelingsReport from "../pages/RefuelingsReport";

// ────────────── guards ──────────────
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const data = token ? decodeToken(token) : null;

  // DEBUG: saber o estado do token
  console.log("🔐 PrivateRoute:", { hasToken: !!token, decoded: data });

  // se não há token, ou payload inválido, ou expirado → desloga
  if (
    !token ||
    !data?.exp ||
    Date.now() >= data.exp * 1000
  ) {
    logout();
    return null;
  }

  // opcional: agendar logout exato
  useEffect(() => {
    const ms = data.exp * 1000 - Date.now();
    if (ms > 0) {
      const timer = setTimeout(() => logout(), ms);
      return () => clearTimeout(timer);
    }
  }, [data.exp]);

  return children;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const data = token ? decodeToken(token) : null;

  if (!token || !data?.exp || Date.now() >= data.exp * 1000) {
    logout();
    return null;
  }
  if (role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

// ───────── redireciona conforme papel ─────────
function RoleBasedRedirect() {
  const role = localStorage.getItem("role");
  switch (role) {
    case "admin":
      return <Navigate to="/dashboard" replace />;
    case "manutencao":
      return <Navigate to="/vehicles" replace />;
    case "portaria":
      return <Navigate to="/portaria/chegada" replace />;
    case "abastecimento":
      return <Navigate to="/refueling" replace />;
    case "motorista":
      return <Navigate to="/driver-checklists" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

// ───────── rotas ─────────
export default function AppRoutes() {
  return (
    <Routes>
      {/* rota pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* rotas protegidas */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<RoleBasedRedirect />} />

        {/* ADMIN */}
        <Route
          path="dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />
        <Route
          path="user-management"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        {/* COMUNS */}
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="consumption" element={<ConsumptionControl />} />
        <Route path="tire-replacement" element={<TireManagement />} />
        <Route path="parts-replacement/report" element={<PartsReplacementReport />} />
        <Route path="parts-replacement/maintenance" element={<PartsReplacementMaintenance />} />
        <Route path="refueling" element={<Refueling />} />
        <Route path="refueling/report" element={<RefuelingsReport />} />

        {/* MOTORISTA */}
        <Route path="driver-checklist" element={<DriverChecklist />} />
        <Route path="driver-checklists" element={<DriverChecklistsList />} />
        <Route path="driver-checklist-decendial" element={<DecendialChecklist />} />
        <Route path="driver-checklists-decendial" element={<DecendialChecklistsList />} />

        {/* PORTARIA */}
        <Route path="portaria/chegada" element={<ChegadaPage />} />
        <Route path="portaria/saida" element={<SaidaPage />} />
      </Route>
    </Routes>
  );
}
