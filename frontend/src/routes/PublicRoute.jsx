import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import '../../assets/styles/routes/routes.css';

const PublicRoute = ({ children, restricted = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }

        // Verificar si el token es válido
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(true);
        }
        
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

    // Limpiar timeout si el componente se desmonta
    return () => {
      setLoading(false);
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-logo">📦</div>
        <div className="loading-spinner"></div>
        <p className="loading-text">Cargando...</p>
      </div>
    );
  }

  // Si la ruta es restringida (como login/register) y el usuario está autenticado,
  // redirigir al dashboard
  if (restricted && isAuthenticated) {
    const redirectPath = localStorage.getItem('redirectPath') || '/dashboard';
    localStorage.removeItem('redirectPath');
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default PublicRoute;