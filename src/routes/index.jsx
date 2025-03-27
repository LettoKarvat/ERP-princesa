// src/routes/AppRoutes.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import VehicleList from '../pages/VehicleList';
// import VehicleChecklist from '../pages/VehicleChecklist'; // rota antiga (opcional)
import ConsumptionControl from '../pages/ConsumptionControl';
import PartsReplacement from '../pages/PartsReplacement';
import TireManagement from '../pages/TireManagement';
import Refueling from '../pages/Refueling';
import Layout from '../components/Layout';
import UserManagement from '../pages/UserManagement';
import DriverChecklist from '../pages/DriverChecklist';
import DriverChecklistsList from '../pages/DriverChecklistsList';
// Novas páginas para Checklist (Portaria)
import ChegadaPage from '../pages/ChegadaPage';
import SaidaPage from '../pages/SaidaPage';

// Verifica se há sessionToken no localStorage
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('sessionToken');
  return token ? children : <Navigate to="/login" />;
};

// Verifica se o usuário é admin
const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('sessionToken');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (role !== 'admin') {
    // Se não for admin, redireciona para a página inicial ou uma rota de "acesso negado"
    return <Navigate to="/" />;
  }
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Rota pública de login */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas privadas */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        {/* Redireciona / para /dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Dashboard - somente admin */}
        <Route
          path="dashboard"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        />

        <Route path="vehicles" element={<VehicleList />} />
        {/* Rota antiga de checklist, se ainda necessária */}
        {/* <Route path="checklist" element={<VehicleChecklist />} /> */}
        <Route path="consumption" element={<ConsumptionControl />} />
        <Route path="tire-replacement" element={<TireManagement />} />
        <Route path="parts-replacement" element={<PartsReplacement />} />
        <Route path="refueling" element={<Refueling />} />

        {/* Rota protegida para gerenciamento de usuários - somente admin */}
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

        {/* Novas rotas para Checklist (Portaria) */}
        <Route path="portaria">
          <Route path="Chegada" element={<ChegadaPage />} />
          <Route path="saida" element={<SaidaPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default AppRoutes;
