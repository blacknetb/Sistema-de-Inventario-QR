import React from 'react';
import { Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const AdminRoute = ({ children }) => {
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  
  // Si ya estamos dentro de PrivateRoute y el usuario no es admin, mostrar mensaje
  // Esta componente es para usar dentro de PrivateRoute
  if (userData.role !== 'admin' && userData.role !== 'administrador') {
    return (
      <div className="page-container">
        <div style={{ 
          textAlign: 'center', 
          padding: '100px 20px',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '5rem', color: '#e74c3c', marginBottom: '20px' }}>
            🔒
          </div>
          <h1 style={{ color: '#2c3e50', marginBottom: '15px' }}>
            Acceso Restringido
          </h1>
          <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
            Esta área requiere privilegios de administrador. 
            Contacta al administrador del sistema si necesitas acceso.
          </p>
          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.history.back()}
              className="btn btn-secondary"
            >
              Volver Atrás
            </button>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="btn btn-primary"
            >
              Ir al Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

// Versión que combina con PrivateRoute
const AdminRouteWithAuth = ({ children }) => {
  return (
    <PrivateRoute requiredRoles={['admin', 'administrador']}>
      {children}
    </PrivateRoute>
  );
};

export { AdminRoute as default, AdminRouteWithAuth };