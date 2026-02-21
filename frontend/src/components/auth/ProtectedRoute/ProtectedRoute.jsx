import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ 
  isAuthenticated, 
  redirectTo = '/login',
  children 
}) => {
  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // Si hay children, renderizar children, si no, renderizar Outlet
  return children ? children : <Outlet />;
};

export default ProtectedRoute;