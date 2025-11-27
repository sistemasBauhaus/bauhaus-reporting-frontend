import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireAuthProps {
  permiso: string;
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ permiso, children }) => {
  const { isLogged, hasPermiso } = useAuth();

  if (!isLogged) {
    return <Navigate to="/login" replace />;
  }
  if (!hasPermiso(permiso)) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#c00', fontWeight: 700 }}>
        Acceso denegado: no tienes permiso para ver esta página.
      </div>
    );
  }
  return <>{children}</>;
};

export default RequireAuth;