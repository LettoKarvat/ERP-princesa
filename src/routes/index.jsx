import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import VehicleList from '../pages/VehicleList';
import VehicleChecklist from '../pages/VehicleChecklist';
import ConsumptionControl from '../pages/ConsumptionControl';
import PartsReplacement from '../pages/PartsReplacement';

// 1) Comente ou remova o import antigo
// import TireReplacement from '../pages/TireReplacement';

// 2) Importe o novo componente
import TireManagement from '../pages/TireManagement';

import Refueling from '../pages/Refueling';
import Layout from '../components/Layout';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
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
        {/* Redireciona / para /dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vehicles" element={<VehicleList />} />
        <Route path="checklist" element={<VehicleChecklist />} />
        <Route path="consumption" element={<ConsumptionControl />} />

        {/* 3) Substitua ou crie a rota que exibia o TireReplacement 
            para exibir o novo TireManagement */}
        {/* <Route path="tire-replacement" element={<TireReplacement />} /> */}
        <Route path="tire-replacement" element={<TireManagement />} />

        <Route path="parts-replacement" element={<PartsReplacement />} />
        <Route path="refueling" element={<Refueling />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
