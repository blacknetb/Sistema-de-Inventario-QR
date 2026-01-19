import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../../assets/styles/routes/routes.css';

const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Verificar token en localStorage
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (!token || !userData) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Decodificar token
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        // Verificar expiración
        if (decoded.exp < currentTime) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Obtener datos del usuario
        const user = JSON.parse(userData);
        setIsAuthenticated(true);
        setUserRole(user.role);
        setLoading(false);
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setIsAuthenticated(false);
        setLoading(false);
      }
    };

    checkAuth();

    // Verificar autenticación cada minuto
    const interval = setInterval(checkAuth, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Resetear verificación al cambiar de ruta
    if (loading) {
      const checkAuth = () => {
        const token = localStorage.getItem('authToken');
        setIsAuthenticated(!!token);
        setLoading(false);
      };
      
      const timeout = setTimeout(checkAuth, 100);
      return () => clearTimeout(timeout);
    }
  }, [location.pathname, loading]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">📦</div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Verificando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Guardar la ruta a la que intentaba acceder para redirigir después del login
    localStorage.setItem('redirectPath', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles si se especifican
  if (requiredRoles.length > 0) {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    
    if (!requiredRoles.includes(userData.role)) {
      return (
        <div className="page-container">
          <div style={{ 
            textAlign: 'center', 
            padding: '100px 20px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <div style={{ fontSize: '5rem', color: '#e74c3c', marginBottom: '20px' }}>
              ⚠️
            </div>
            <h1 style={{ color: '#2c3e50', marginBottom: '15px' }}>
              Acceso Denegado
            </h1>
            <p style={{ color: '#7f8c8d', marginBottom: '30px' }}>
              No tienes permisos para acceder a esta página. Tu rol actual ({userData.role}) no está autorizado.
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
  }

  return children;
};

export default PrivateRoute;