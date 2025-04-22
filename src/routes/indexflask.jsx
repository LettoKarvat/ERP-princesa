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
import ChegadaPage from "../pages/ChegadaPage";
import SaidaPage from "../pages/SaidaPage";
import PartsReplacementReport from "../pages/PartsReplacementReport";
import PartsReplacementMaintenance from "../pages/PartsReplacementMaintenance";
import RefuelingsReport from "../pages/RefuelingsReport";

/* ---------- helpers de rota ---------- */
const hasSession = () =>
  localStorage.getItem("sessionToken") || document.cookie.includes("session=");

const PrivateRoute = ({ children }) =>
  hasSession() ? children : <Navigate to="/login" />;

const AdminRoute = ({ children }) => {
  if (!hasSession()) return <Navigate to="/login" />;
  return localStorage.getItem("role") === "admin" ? children : <Navigate to="/" />;
};

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

/* ---------- rotas ---------- */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<RoleBasedRedirect />} />

        <Route
          path="dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />

        <Route path="vehicles" element={<VehicleList />} />
        <Route path="consumption" element={<ConsumptionControl />} />
        <Route path="tire-replacement" element={<TireManagement />} />
        <Route path="parts-replacement/report" element={<PartsReplacementReport />} />
        <Route
          path="parts-replacement/maintenance"
          element={<PartsReplacementMaintenance />}
        />
        <Route path="refueling" element={<Refueling />} />
        <Route path="refueling/report" element={<RefuelingsReport />} />

        <Route
          path="user-management"
          element={
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          }
        />

        <Route path="driver-checklist" element={<DriverChecklist />} />
        <Route path="driver-checklists" element={<DriverChecklistsList />} />

        <Route path="portaria">
          <Route path="chegada" element={<ChegadaPage />} />
          <Route path="saida" element={<SaidaPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
