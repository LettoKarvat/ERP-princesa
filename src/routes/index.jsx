// src/routes/AppRoutes.jsx

import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import VehicleList from '../pages/VehicleList';
import VehicleChecklist from '../pages/VehicleChecklist';
import ConsumptionControl from '../pages/ConsumptionControl';
import PartsReplacement from '../pages/PartsReplacement';
import TireManagement from '../pages/TireManagement';
import Refueling from '../pages/Refueling';
import Layout from '../components/Layout';
import UserManagement from '../pages/UserManagement';
import DriverChecklist from '../pages/DriverChecklist';
import DriverChecklistsList from '../pages/DriverChecklistsList';


// Verifica se há sessionToken no localStorage
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('sessionToken');
  return token ? children : <Navigate to="/login" />;
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

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="checklist" element={<VehicleChecklist />} />
        <Route path="consumption" element={<ConsumptionControl />} />
        <Route path="tire-replacement" element={<TireManagement />} />
        <Route path="parts-replacement" element={<PartsReplacement />} />
        <Route path="refueling" element={<Refueling />} />
        <Route path="user-management" element={<UserManagement />} />
        <Route path="/driver-checklist" element={<DriverChecklist />} />
        <Route path="/driver-checklists" element={<DriverChecklistsList />} />

      </Route>
    </Routes>
  );
}

export default AppRoutes;
