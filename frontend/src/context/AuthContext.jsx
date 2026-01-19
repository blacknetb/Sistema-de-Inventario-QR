import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logger from '../utils/logger';
import api from '../utils/api';

// Estructura de usuario
const DEFAULT_USER = {
  id: null,
  email: '',
  name: '',
  role: 'user',
  avatar: '',
  isVerified: false,
  preferences: {},
  permissions: [],
  lastLogin: null,
  createdAt: null,
  companyId: null,
  department: null
};

// Tipos de roles
export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  USER: 'user',
  GUEST: 'guest'
};

// Permisos disponibles
export const PERMISSIONS = {
  // Gestión de inventario
  VIEW_INVENTORY: 'view_inventory',
  EDIT_INVENTORY: 'edit_inventory',
  DELETE_INVENTORY: 'delete_inventory',
  
  // Gestión de productos
  VIEW_PRODUCTS: 'view_products',
  CREATE_PRODUCTS: 'create_products',
  EDIT_PRODUCTS: 'edit_products',
  DELETE_PRODUCTS: 'delete_products',
  
  // Categorías
  VIEW_CATEGORIES: 'view_categories',
  MANAGE_CATEGORIES: 'manage_categories',
  
  // Proveedores
  VIEW_SUPPLIERS: 'view_suppliers',
  MANAGE_SUPPLIERS: 'manage_suppliers',
  
  // Transacciones
  VIEW_TRANSACTIONS: 'view_transactions',
  CREATE_TRANSACTIONS: 'create_transactions',
  
  // Reportes
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  
  // Usuarios
  VIEW_USERS: 'view_users',
  MANAGE_USERS: 'manage_users',
  
  // Configuración
  VIEW_SETTINGS: 'view_settings',
  MANAGE_SETTINGS: 'manage_settings',
  
  // Sistema
  ACCESS_ADMIN_PANEL: 'access_admin_panel',
  MANAGE_SYSTEM: 'manage_system'
};

// Mapeo de roles a permisos
const ROLE_PERMISSIONS = {
  [USER_ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [USER_ROLES.ADMIN]: [
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.EDIT_INVENTORY,
    PERMISSIONS.DELETE_INVENTORY,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.DELETE_PRODUCTS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.MANAGE_SUPPLIERS,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.CREATE_TRANSACTIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_USERS,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_SETTINGS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.ACCESS_ADMIN_PANEL
  ],
  [USER_ROLES.MANAGER]: [
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.EDIT_INVENTORY,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_SUPPLIERS,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.CREATE_TRANSACTIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_SETTINGS
  ],
  [USER_ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.CREATE_PRODUCTS,
    PERMISSIONS.EDIT_PRODUCTS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_TRANSACTIONS,
    PERMISSIONS.CREATE_TRANSACTIONS,
    PERMISSIONS.VIEW_REPORTS
  ],
  [USER_ROLES.USER]: [
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_PRODUCTS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_REPORTS
  ],
  [USER_ROLES.GUEST]: [
    PERMISSIONS.VIEW_INVENTORY,
    PERMISSIONS.VIEW_PRODUCTS
  ]
};

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados
  const [user, setUser] = useState(DEFAULT_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState(null);

  // Verificar autenticación al cargar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('inventario_qr_token');
        const refreshToken = localStorage.getItem('inventario_qr_refresh_token');
        const savedUser = localStorage.getItem('inventario_qr_user');

        if (token && refreshToken && savedUser) {
          // Verificar si el token está expirado
          const tokenData = parseJwt(token);
          const isExpired = tokenData.exp * 1000 < Date.now();

          if (isExpired) {
            // Intentar refrescar el token
            await refreshAccessToken();
          } else {
            // Establecer usuario desde localStorage
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            setSessionExpiresAt(new Date(tokenData.exp * 1000));
          }
        }
      } catch (error) {
        logger.error('Error al verificar autenticación:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Función para parsear JWT
  const parseJwt = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return {};
    }
  };

  // Refrescar token de acceso
  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('inventario_qr_refresh_token');
      
      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      const response = await api.post('/auth/refresh', { refreshToken });
      
      if (response.data.accessToken) {
        // Guardar nuevo token
        localStorage.setItem('inventario_qr_token', response.data.accessToken);
        
        if (response.data.refreshToken) {
          localStorage.setItem('inventario_qr_refresh_token', response.data.refreshToken);
        }

        // Actualizar expiración
        const tokenData = parseJwt(response.data.accessToken);
        setSessionExpiresAt(new Date(tokenData.exp * 1000));

        logger.info('Token refrescado exitosamente');
        return response.data.accessToken;
      }
    } catch (error) {
      logger.error('Error al refrescar token:', error);
      logout();
      throw error;
    }
  }, []);

  // Iniciar sesión
  const login = useCallback(async (email, password, rememberMe = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
        rememberMe
      });

      const { accessToken, refreshToken, user: userData } = response.data;

      // Guardar tokens
      localStorage.setItem('inventario_qr_token', accessToken);
      localStorage.setItem('inventario_qr_refresh_token', refreshToken);
      localStorage.setItem('inventario_qr_user', JSON.stringify(userData));

      // Actualizar estado
      setUser(userData);
      setIsAuthenticated(true);
      
      // Calcular expiración
      const tokenData = parseJwt(accessToken);
      setSessionExpiresAt(new Date(tokenData.exp * 1000));

      // Guardar preferencias de recordar
      if (rememberMe) {
        localStorage.setItem('inventario_qr_remember', 'true');
      }

      // Registrar inicio de sesión
      logger.info(`Usuario ${email} ha iniciado sesión`);

      // Redirigir
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      logger.error('Error en login:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location]);

  // Registro
  const register = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/register', userData);
      
      const { accessToken, refreshToken, user: newUser } = response.data;

      // Guardar tokens
      localStorage.setItem('inventario_qr_token', accessToken);
      localStorage.setItem('inventario_qr_refresh_token', refreshToken);
      localStorage.setItem('inventario_qr_user', JSON.stringify(newUser));

      // Actualizar estado
      setUser(newUser);
      setIsAuthenticated(true);
      
      // Calcular expiración
      const tokenData = parseJwt(accessToken);
      setSessionExpiresAt(new Date(tokenData.exp * 1000));

      logger.info(`Usuario ${userData.email} registrado exitosamente`);

      // Redirigir a dashboard
      navigate('/dashboard', { replace: true });

      return { success: true, user: newUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al registrar usuario';
      setError(errorMessage);
      logger.error('Error en registro:', error);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Cerrar sesión
  const logout = useCallback(async (redirectToLogin = true) => {
    try {
      const token = localStorage.getItem('inventario_qr_token');
      
      if (token) {
        // Intentar cerrar sesión en el servidor
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {
          // Ignorar errores en logout
        });
      }

      // Limpiar datos locales
      clearAuthData();

      // Resetear estado
      setUser(DEFAULT_USER);
      setIsAuthenticated(false);
      setSessionExpiresAt(null);
      setError(null);

      logger.info('Sesión cerrada exitosamente');

      // Redirigir a login si se solicita
      if (redirectToLogin) {
        navigate('/login', { replace: true });
      }
    } catch (error) {
      logger.error('Error en logout:', error);
      // Forzar limpieza incluso si hay error
      clearAuthData();
      setUser(DEFAULT_USER);
      setIsAuthenticated(false);
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Limpiar datos de autenticación
  const clearAuthData = () => {
    localStorage.removeItem('inventario_qr_token');
    localStorage.removeItem('inventario_qr_refresh_token');
    localStorage.removeItem('inventario_qr_user');
    localStorage.removeItem('inventario_qr_remember');
  };

  // Actualizar perfil de usuario
  const updateProfile = useCallback(async (updatedData) => {
    try {
      const response = await api.put('/auth/profile', updatedData);
      const updatedUser = response.data.user;

      // Actualizar estado y localStorage
      setUser(updatedUser);
      localStorage.setItem('inventario_qr_user', JSON.stringify(updatedUser));

      logger.info('Perfil actualizado exitosamente');
      return { success: true, user: updatedUser };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al actualizar perfil';
      logger.error('Error al actualizar perfil:', error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Cambiar contraseña
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      logger.info('Contraseña cambiada exitosamente');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Error al cambiar contraseña';
      logger.error('Error al cambiar contraseña:', error);
      return { success: false, error: errorMessage };
    }
  }, []);

  // Verificar permisos
  const hasPermission = useCallback((permission) => {
    if (!isAuthenticated || !user.role) return false;
    
    // Obtener permisos del rol
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    
    // Verificar si el permiso está en los permisos del rol
    return rolePermissions.includes(permission);
  }, [isAuthenticated, user.role]);

  // Verificar múltiples permisos
  const hasAnyPermission = useCallback((permissions) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  // Verificar todos los permisos
  const hasAllPermissions = useCallback((permissions) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  // Verificar rol
  const hasRole = useCallback((role) => {
    if (!isAuthenticated) return false;
    return user.role === role;
  }, [isAuthenticated, user.role]);

  // Verificar cualquier rol
  const hasAnyRole = useCallback((roles) => {
    if (!isAuthenticated) return false;
    return roles.includes(user.role);
  }, [isAuthenticated, user.role]);

  // Obtener tiempo restante de sesión
  const getSessionTimeLeft = useCallback(() => {
    if (!sessionExpiresAt) return null;
    
    const now = new Date();
    const diff = sessionExpiresAt.getTime() - now.getTime();
    
    if (diff <= 0) return { minutes: 0, seconds: 0, expired: true };
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return { minutes, seconds, expired: false };
  }, [sessionExpiresAt]);

  // Auto logout cuando la sesión expira
  useEffect(() => {
    if (!sessionExpiresAt) return;

    const checkSession = () => {
      const timeLeft = getSessionTimeLeft();
      if (timeLeft?.expired) {
        logout();
      }
    };

    const interval = setInterval(checkSession, 60000); // Chequear cada minuto
    return () => clearInterval(interval);
  }, [sessionExpiresAt, getSessionTimeLeft, logout]);

  // Interceptor para refrescar token automáticamente
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('inventario_qr_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no es una solicitud de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            // Intentar refrescar el token
            const newToken = await refreshAccessToken();
            
            // Actualizar header de autorización
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Reintentar la solicitud original
            return api(originalRequest);
          } catch (refreshError) {
            // Si falla el refresh, cerrar sesión
            logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshAccessToken, logout]);

  // Valor del contexto
  const contextValue = useMemo(() => ({
    // Estados
    user,
    isAuthenticated,
    isLoading,
    error,
    sessionExpiresAt,
    
    // Métodos de autenticación
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshAccessToken,
    
    // Verificaciones
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    
    // Utilidades
    getSessionTimeLeft,
    isAdmin: hasRole(USER_ROLES.ADMIN) || hasRole(USER_ROLES.SUPER_ADMIN),
    isManager: hasRole(USER_ROLES.MANAGER),
    isEmployee: hasRole(USER_ROLES.EMPLOYEE),
    isGuest: hasRole(USER_ROLES.GUEST),
    
    // Permisos específicos
    canViewInventory: hasPermission(PERMISSIONS.VIEW_INVENTORY),
    canEditInventory: hasPermission(PERMISSIONS.EDIT_INVENTORY),
    canManageProducts: hasPermission(PERMISSIONS.MANAGE_CATEGORIES),
    canViewReports: hasPermission(PERMISSIONS.VIEW_REPORTS),
    canManageUsers: hasPermission(PERMISSIONS.MANAGE_USERS),
    canAccessAdmin: hasPermission(PERMISSIONS.ACCESS_ADMIN_PANEL),
    
    // Información de sesión
    sessionInfo: {
      isExpired: getSessionTimeLeft()?.expired || false,
      timeLeft: getSessionTimeLeft(),
      expiresAt: sessionExpiresAt
    }
  }), [
    user,
    isAuthenticated,
    isLoading,
    error,
    sessionExpiresAt,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshAccessToken,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    getSessionTimeLeft
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Componente para proteger rutas
export const ProtectedRoute = ({ 
  children, 
  requiredPermissions = [], 
  requiredRoles = [],
  redirectTo = '/login',
  showForbidden = true
}) => {
  const { isAuthenticated, isLoading, hasAnyPermission, hasAnyRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner"></div>
        <p>Verificando autenticación...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirigir a login guardando la ubicación actual
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Verificar permisos si se requieren
  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    if (showForbidden) {
      return (
        <div className="forbidden-page">
          <h1>403 - Acceso Denegado</h1>
          <p>No tienes permisos para acceder a esta página.</p>
          <p>Permisos requeridos: {requiredPermissions.join(', ')}</p>
          <button onClick={() => window.history.back()}>
            Volver atrás
          </button>
        </div>
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar roles si se requieren
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    if (showForbidden) {
      return (
        <div className="forbidden-page">
          <h1>403 - Acceso Denegado</h1>
          <p>Tu rol no tiene acceso a esta página.</p>
          <p>Roles permitidos: {requiredRoles.join(', ')}</p>
          <button onClick={() => window.history.back()}>
            Volver atrás
          </button>
        </div>
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente para mostrar información de usuario
export const UserInfo = () => {
  const { user, logout, getSessionTimeLeft } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const timeLeft = getSessionTimeLeft();
  const isSessionExpiring = timeLeft && timeLeft.minutes < 5 && !timeLeft.expired;

  return (
    <div className="user-info">
      <div 
        className="user-avatar"
        onClick={() => setShowMenu(!showMenu)}
        title={`${user.name} (${user.role})`}
      >
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} />
        ) : (
          <div className="user-avatar-fallback">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
        
        {isSessionExpiring && (
          <div className="session-warning" title="Sesión por expirar">
            ⏰
          </div>
        )}
      </div>

      {showMenu && (
        <div className="user-menu">
          <div className="user-menu-header">
            <div className="user-menu-name">{user.name}</div>
            <div className="user-menu-email">{user.email}</div>
            <div className="user-menu-role">{user.role}</div>
          </div>
          
          <div className="user-menu-items">
            <a href="/profile" className="user-menu-item">
              <span className="user-menu-icon">👤</span>
              <span className="user-menu-text">Perfil</span>
            </a>
            
            <a href="/settings" className="user-menu-item">
              <span className="user-menu-icon">⚙️</span>
              <span className="user-menu-text">Configuración</span>
            </a>
            
            <div className="user-menu-divider"></div>
            
            {timeLeft && !timeLeft.expired && (
              <div className="user-menu-session">
                <span className="user-menu-icon">⏰</span>
                <span className="user-menu-text">
                  Sesión expira en {timeLeft.minutes}:{timeLeft.seconds.toString().padStart(2, '0')}
                </span>
              </div>
            )}
            
            <button 
              className="user-menu-item logout"
              onClick={() => logout()}
            >
              <span className="user-menu-icon">🚪</span>
              <span className="user-menu-text">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar estado de autenticación
export const AuthStatus = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="auth-status loading">
        <span className="auth-status-icon">⏳</span>
        <span className="auth-status-text">Verificando...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-status not-authenticated">
        <span className="auth-status-icon">🔒</span>
        <span className="auth-status-text">No autenticado</span>
      </div>
    );
  }

  return (
    <div className="auth-status authenticated">
      <span className="auth-status-icon">✅</span>
      <span className="auth-status-text">
        Conectado como {user.name} ({user.role})
      </span>
    </div>
  );
};

export default AuthContext;