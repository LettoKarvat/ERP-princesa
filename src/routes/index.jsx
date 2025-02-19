import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoginPage from '../pages/LoginPage';
import Dashboard from '../pages/Dashboard';
import VehicleList from '../pages/VehicleList';
import VehicleChecklist from '../pages/VehicleChecklist';
import ConsumptionControl from '../pages/ConsumptionControl';

// IMPORTANTE: importar o componente de abastecimento
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

        {/* <-- AQUI adicionamos a rota de abastecimento */}
        <Route path="refueling" element={<Refueling />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
