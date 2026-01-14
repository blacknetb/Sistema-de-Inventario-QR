import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

// ✅ Importación del servicio unificado
import { authService } from './authService';
import './Auth.css';

// ✅ Contexto de autenticación
export const AuthContext = createContext(null);

// ✅ Hook de autenticación optimizado
export const useAuth = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true,
    token: null,
    rememberMe: false,
    lastValidation: null,
  });

  const validateAuth = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      
      const { token, userData, rememberMe, timestamp } = authService.getStoredAuthData();

      // Verificar si hay datos almacenados
      if (!token || !userData) {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          token: null,
          rememberMe: false,
          lastValidation: Date.now(),
        });
        return false;
      }

      // Verificar si el token expiró
      if (authService.isTokenExpired(timestamp)) {
        console.log('⚠️ Token expirado, limpiando sesión...');
        authService.clearAuthStorage();
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          token: null,
          rememberMe: false,
          lastValidation: Date.now(),
        });
        return false;
      }

      // Validar token con el backend
      const isValid = await authService.validateToken(token);

      if (!isValid) {
        console.log('❌ Token inválido, limpiando sesión...');
        authService.clearAuthStorage();
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          token: null,
          rememberMe: false,
          lastValidation: Date.now(),
        });
        return false;
      }

      try {
        const user = JSON.parse(userData);
        
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
          token,
          rememberMe,
          lastValidation: Date.now(),
        });
        
        return true;
      } catch (error) {
        console.error('❌ Error parsing user data:', error);
        authService.clearAuthStorage();
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
          token: null,
          rememberMe: false,
          lastValidation: Date.now(),
        });
        return false;
      }
    } catch (error) {
      console.error('❌ Error en validación de auth:', error);
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
        token: null,
        rememberMe: false,
        lastValidation: Date.now(),
      });
      return false;
    }
  }, []);

  // Validación inicial
  useEffect(() => {
    validateAuth();
  }, [validateAuth]);

  // Sincronización entre pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token' || e.key === 'user_data') {
        validateAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [validateAuth]);

  // Validación periódica para sesiones temporales
  useEffect(() => {
    if (!authState.isAuthenticated || authState.rememberMe) return;

    const interval = setInterval(() => {
      validateAuth();
    }, 5 * 60 * 1000); // Cada 5 minutos

    return () => clearInterval(interval);
  }, [authState.isAuthenticated, authState.rememberMe, validateAuth]);

  const logout = useCallback(() => {
    authService.clearAuthStorage();
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
      token: null,
      rememberMe: false,
      lastValidation: Date.now(),
    });
  }, []);

  const isAdmin = useCallback(() => {
    return authState.user?.role === 'admin' || authState.user?.isAdmin === true;
  }, [authState.user]);

  const hasPermission = useCallback((permission) => {
    if (!authState.user) return false;
    if (isAdmin()) return true;

    const permissions = authState.user?.permissions || [];
    return permissions.includes(permission);
  }, [authState.user, isAdmin]);

  const hasRole = useCallback((requiredRole) => {
    if (!authState.user) return false;
    if (isAdmin()) return true;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(authState.user?.role);
  }, [authState.user, isAdmin]);

  return {
    ...authState,
    logout,
    refreshAuth: validateAuth,
    isAdmin,
    hasPermission,
    hasRole,
  };
};

// ✅ Provider de autenticación
export const AuthProvider = ({ children }) => {
  const auth = useAuth();
  const contextValue = useMemo(() => auth, [auth]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// ✅ Hook para usar el contexto
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider');
  }
  return context;
};

// ✅ Componente principal de ruta privada
const PrivateRoute = ({
  requiredRole = null,
  requiredPermission = null,
  redirectTo = '/auth/login',
  requireAuth = true,
  children,
  ...props
}) => {
  const location = useLocation();
  const { isAuthenticated, user, loading, hasRole, hasPermission } = useAuthContext();

  // Loading state
  if (loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner" aria-label="Cargando"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  // Rutas que requieren autenticación
  if (requireAuth) {
    if (!isAuthenticated) {
      const redirectState = {
        from: location.pathname + location.search,
        message: 'Por favor, inicia sesión para acceder a esta página',
        timestamp: new Date().toISOString(),
        code: 'UNAUTHENTICATED'
      };

      return <Navigate to={redirectTo} state={redirectState} replace />;
    }

    // Verificar rol requerido
    if (requiredRole && !hasRole(requiredRole)) {
      const redirectState = {
        from: location.pathname,
        message: 'No tienes el rol necesario para acceder a esta página',
        requiredRole,
        userRole: user?.role,
        code: 'INSUFFICIENT_ROLE'
      };
      return <Navigate to="/unauthorized" state={redirectState} replace />;
    }

    // Verificar permiso requerido
    if (requiredPermission && !hasPermission(requiredPermission)) {
      const redirectState = {
        from: location.pathname,
        message: 'No tienes los permisos necesarios para acceder a esta página',
        requiredPermission,
        userPermissions: user?.permissions || [],
        code: 'INSUFFICIENT_PERMISSION'
      };
      return <Navigate to="/unauthorized" state={redirectState} replace />;
    }
  } else if (isAuthenticated) {
    // Si no requiere autenticación pero el usuario está autenticado, redirigir
    const defaultRedirect = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return children || <Outlet {...props} />;
};

PrivateRoute.propTypes = {
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  requiredPermission: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  redirectTo: PropTypes.string,
  requireAuth: PropTypes.bool,
  children: PropTypes.node,
};

// ✅ Ruta solo para admins
const AdminRoute = ({ children, redirectTo = '/unauthorized', ...props }) => {
  const location = useLocation();
  const { isAuthenticated, user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner"></div>
        <p>Verificando permisos de administrador...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectState = {
      from: location.pathname,
      message: 'Se requiere autenticación de administrador',
      code: 'ADMIN_REQUIRED'
    };
    return <Navigate to="/auth/login" state={redirectState} replace />;
  }

  const isUserAdmin = user?.role === 'admin' || user?.isAdmin === true;

  if (!isUserAdmin) {
    const redirectState = {
      from: location.pathname,
      message: 'No tienes permisos de administrador',
      requiredRole: 'admin',
      userRole: user?.role,
      code: 'NOT_ADMIN'
    };
    return <Navigate to={redirectTo} state={redirectState} replace />;
  }

  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
  redirectTo: PropTypes.string,
};

// ✅ Ruta solo para usuarios no autenticados
const PublicOnlyRoute = ({ children, redirectTo = '/dashboard', ...props }) => {
  const { isAuthenticated, loading, user } = useAuthContext();

  if (loading) {
    return (
      <div className="route-loading">
        <div className="loading-spinner"></div>
        <p>Verificando estado de autenticación...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    const defaultRedirect = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={redirectTo || defaultRedirect} replace />;
  }

  return children || <Outlet {...props} />;
};

PublicOnlyRoute.propTypes = {
  children: PropTypes.node,
  redirectTo: PropTypes.string,
};

// ✅ Componente protegido por condiciones
const ProtectedElement = ({
  children,
  requiredRole = null,
  requiredPermission = null,
  fallback = null,
  showIf = true,
  ...props
}) => {
  const { isAuthenticated, loading, hasRole, hasPermission } = useAuthContext();

  if (loading || !showIf) {
    return fallback;
  }

  if (!isAuthenticated) {
    return fallback;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return fallback;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback;
  }

  return React.cloneElement(children, props);
};

ProtectedElement.propTypes = {
  children: PropTypes.element.isRequired,
  requiredRole: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  requiredPermission: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string)
  ]),
  fallback: PropTypes.node,
  showIf: PropTypes.bool,
};

// ✅ HOC para protección de componentes
const withAuthProtection = (WrappedComponent, options = {}) => {
  const { requiredRole, requiredPermission, redirectTo = '/auth/login' } = options;

  const WithAuthProtection = (props) => {
    const location = useLocation();
    const { isAuthenticated, loading, hasRole, hasPermission } = useAuthContext();

    if (loading) {
      return (
        <div className="route-loading">
          <div className="loading-spinner"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return <Navigate to={redirectTo} state={{ from: location.pathname }} replace />;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return <Navigate to="/unauthorized" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <WrappedComponent {...props} />;
  };

  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithAuthProtection.displayName = `WithAuthProtection(${displayName})`;

  return WithAuthProtection;
};

// ✅ Componente aumentado
const EnhancedPrivateRoute = Object.assign(PrivateRoute, {
  Admin: AdminRoute,
  PublicOnly: PublicOnlyRoute,
  Element: ProtectedElement,
  withAuth: withAuthProtection,
  Provider: AuthProvider,
  useAuth: useAuthContext,
  AuthContext,
});

export default EnhancedPrivateRoute;

export {
  AdminRoute,
  PublicOnlyRoute,
  ProtectedElement,
  withAuthProtection,
  useAuth,
  AuthProvider,
  useAuthContext,
};