import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';

const GuestRoute = ({ children }) => {
    const { user, loading, isAuthenticated } = useAuth();
    const location = useLocation();

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
        return (
            <div className="loading-overlay">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Cargando...</p>
                </div>
            </div>
        );
    }

    // Si ya está autenticado, redirigir al dashboard o página anterior
    if (isAuthenticated) {
        const from = location.state?.from?.pathname || '/dashboard';
        return <Navigate to={from} replace />;
    }

    // Usuario no autenticado, permitir acceso a la ruta
    return children;
};

GuestRoute.propTypes = {
    children: PropTypes.node.isRequired
};

export default GuestRoute;