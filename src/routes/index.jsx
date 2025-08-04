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
import DecendialChecklist from "../pages/DecendialChecklist";
import DecendialChecklistsList from "../pages/DecendialChecklistsList";
import ChegadaPage from "../pages/ChegadaPage";
import SaidaPage from "../pages/SaidaPage";
import PartsReplacementReport from "../pages/PartsReplacementReport";
import PartsReplacementMaintenance from "../pages/PartsReplacementMaintenance";
import RefuelingsReport from "../pages/RefuelingsReport";
import TravelReportPage from "../pages/TravelReportPage";   // <<< novo

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

/* ─────── guard específico p/ várias funções ─────── */       // <<< novo
const RoleRoute = ({ roles, children }) => {                    // <<< novo
  const token = localStorage.getItem("token");                  // <<< novo
  const role = localStorage.getItem("role");                   // <<< novo
  if (!token) return <Navigate to="/login" replace />;          // <<< novo
  return roles.includes(role) ? children : <Navigate to="/" replace />; // <<< novo
};                                                              // <<< novo

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

        {/* ————— rotas comuns ————— */}
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="consumption" element={<ConsumptionControl />} />
        <Route path="tire-replacement" element={<TireManagement />} />
        <Route path="parts-replacement/report" element={<PartsReplacementReport />} />
        <Route path="parts-replacement/maintenance" element={<PartsReplacementMaintenance />} />
        <Route path="refueling" element={<Refueling />} />
        <Route path="refueling/report" element={<RefuelingsReport />} />


        <Route
          path="travel-report"
          element={
            <AdminRoute>
              <TravelReportPage />             {/* seu componente de relatório */}
            </AdminRoute>
          }
        />                                                        {/* <<< novo */}

        {/* ————— CHECKLISTS MOTORISTA ————— */}
        <Route path="driver-checklist" element={<DriverChecklist />} />
        <Route path="driver-checklists" element={<DriverChecklistsList />} />
        <Route path="driver-checklist-decendial" element={<DecendialChecklist />} />
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
