// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
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
import DecendialChecklist from "../pages/DecendialChecklist";            // <<< nova import
import DecendialChecklistsList from "../pages/DecendialChecklistsList";  // <<< se você tiver uma listagem específica
import ChegadaPage from "../pages/ChegadaPage";
import SaidaPage from "../pages/SaidaPage";
import PartsReplacementReport from "../pages/PartsReplacementReport";
import PartsReplacementMaintenance from "../pages/PartsReplacementMaintenance";
import RefuelingsReport from "../pages/RefuelingsReport";

/* ────────────── guards ────────────── */
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (!token) return <Navigate to="/login" replace />;
  if (role !== "admin") return <Navigate to="/" replace />;
  return children;
};

/* ───────── redireciona conforme papel ───────── */
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
      // por padrão, leva o motorista para a lista de checklists diários
      return <Navigate to="/driver-checklists" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

/* ───────── rotas ───────── */
export default function AppRoutes() {
  return (
    <Routes>
      {/* rota pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* todas as outras só podem ser acessadas com token (PrivateRoute) */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* rota raiz redireciona conforme papel */}
        <Route index element={<RoleBasedRedirect />} />

        {/* ——————————— ADMINISTRADOR ——————————— */}
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

        {/* ————— rotas comuns a quem estiver logado ————— */}
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="consumption" element={<ConsumptionControl />} />
        <Route path="tire-replacement" element={<TireManagement />} />
        <Route path="parts-replacement/report" element={<PartsReplacementReport />} />
        <Route path="parts-replacement/maintenance" element={<PartsReplacementMaintenance />} />
        <Route path="refueling" element={<Refueling />} />
        <Route path="refueling/report" element={<RefuelingsReport />} />

        {/* ————— CHECKLISTS MOTORISTA ————— */}
        {/* Página de cadastro do checklist diário */}
        <Route path="driver-checklist" element={<DriverChecklist />} />

        {/* Página que lista todos os checklists diários (admin vê todos; motorista vê só os seus) */}
        <Route path="driver-checklists" element={<DriverChecklistsList />} />

        {/* Página de cadastro do checklist decendial */}
        <Route path="driver-checklist-decendial" element={<DecendialChecklist />} />

        {/* Página que lista todos os checklists decendiais */}
        <Route path="driver-checklists-decendial" element={<DecendialChecklistsList />} />

        {/* ————— CHECKLISTS PORTARIA ————— */}
        <Route path="portaria">
          <Route path="chegada" element={<ChegadaPage />} />
          <Route path="saida" element={<SaidaPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
