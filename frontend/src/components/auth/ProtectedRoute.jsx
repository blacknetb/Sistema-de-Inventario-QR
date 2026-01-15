import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ children, roles = [] }) => {
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

    // Si no está autenticado, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Si se especificaron roles, verificar permisos
    if (roles.length > 0) {
        const userRole = user?.rol || 'usuario';
        
        if (!roles.includes(userRole)) {
            // Usuario no tiene el rol requerido
            return (
                <div className="unauthorized-container">
                    <div className="unauthorized-card">
                        <div className="unauthorized-icon">
                            <i className="fas fa-ban"></i>
                        </div>
                        <h2>Acceso Denegado</h2>
                        <p>
                            No tienes permisos para acceder a esta página.
                            Se requiere uno de los siguientes roles: {roles.join(', ')}
                        </p>
                        <p className="user-role">
                            Tu rol actual: <span className="role-badge">{userRole}</span>
                        </p>
                        <div className="unauthorized-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => window.history.back()}
                            >
                                Volver Atrás
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => window.location.href = '/dashboard'}
                            >
                                Ir al Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
    }

    // Usuario autenticado y con permisos adecuados
    return children;
};

ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string)
};

export default ProtectedRoute;