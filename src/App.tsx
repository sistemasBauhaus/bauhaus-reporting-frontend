import React, { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import ReporteMensualComponent from './pages/ReporteMensual';
import GestionUsuarios from './pages/GestionUsuarios';
import ReportesView from './pages/ReportesView';

// Componente para proteger rutas
const PrivateRoute = ({ children }: { children: ReactElement }) => {
  const token = localStorage.getItem('token');
  const usuario = localStorage.getItem('usuario');
  return token || usuario ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/reporte-diario"
            element={
              <PrivateRoute>
                <ReporteMensualComponent />
              </PrivateRoute>
            }
          />
          <Route
            path="/usuarios"
            element={
              <PrivateRoute>
                <GestionUsuarios />
              </PrivateRoute>
            }
          />
          <Route
            path="/reportes"
            element={
              <PrivateRoute>
                <ReportesView />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;