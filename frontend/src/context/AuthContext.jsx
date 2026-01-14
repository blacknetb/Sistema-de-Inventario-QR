import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../assets/styles/context.css';

let authService;
try {
  // Usamos require condicional
  const authModule = require('../services/authService');
  authService = authModule.authService || authModule.default;
} catch (err) {
  console.warn('AuthService no encontrado, usando mock para desarrollo:', err);

  authService = {
    login: async () => ({
      success: true,
      data: {
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
        },
      },
    }),
    register: async () => ({ success: true }),
    logout: async () => ({ success: true }),
    getCurrentUser: () => null,
    isAuthenticated: () => false,
    updateUserInStorage: () => {},
    verifyToken: async () => ({ success: true }),
    updateProfile: async () => ({ success: true }),
    changePassword: async () => ({ success: true }),
  };
}

// ✅ Validar estructura del usuario
const validateUser = (user) => {
  if (!user) return false;

  try {
    return user &&
      (typeof user.id === 'number' || typeof user.id === 'string') &&
      typeof user.email === 'string' &&
      user.email.includes('@') &&
      typeof user.name === 'string' &&
      user.name.trim().length > 0;
  } catch (error) {
    console.warn('Error validando usuario:', error);
    return false;
  }
};

const AuthContext = createContext({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: () => false,
  hasRole: () => false,
  hasAnyRole: () => false,
  login: async () => ({ success: false, message: 'Contexto no inicializado' }),
  register: async () => ({ success: false, message: 'Contexto no inicializado' }),
  logout: () => { },
  updateProfile: async () => ({ success: false, message: 'Contexto no inicializado' }),
  changePassword: async () => ({ success: false, message: 'Contexto no inicializado' }),
  updateUser: () => false,
  forceVerifyToken: async () => false
});

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe ser usado dentro de AuthProvider. ' +
      'Asegúrate de que tu aplicación esté envuelta en <AuthProvider>.'
    );
  }

  return context;
};

export const AuthProvider = ({
  children,
  renderNotificationContext,
  enableTokenRefresh = true,
  tokenRefreshInterval = 5 * 60 * 1000
}) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [refreshIntervalId, setRefreshIntervalId] = useState(null);

  const notificationContext = renderNotificationContext ?
    renderNotificationContext({
      success: (msg) => console.log('Éxito:', msg),
      error: (msg) => console.error('Error:', msg),
      handleApiError: (err) => console.error('API Error:', err)
    }) : null;

  const { success, error, handleApiError } = notificationContext || {};

  const handleExpiredSession = useCallback((silent = false) => {
    try {
      if (authService.isAuthenticated()) {
        authService.logout();
      }

      setUser(null);
      setIsAuthenticated(false);

      // Limpiar intervalo de refresh
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        setRefreshIntervalId(null);
      }

      // Solo mostrar mensaje si no es silencioso y había sesión activa
      if (!silent && isAuthenticated) {
        error?.('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }

      return true;
    } catch (err) {
      console.error('Error manejando sesión expirada:', err);
      return false;
    }
  }, [refreshIntervalId, isAuthenticated, error]);

  const verifyAndRefreshToken = useCallback(async (force = false) => {
    if (!authService.isAuthenticated() || (isVerifying && !force)) return false;

    setIsVerifying(true);

    try {
      const response = await authService.verifyToken();

      if (response.success && response.data?.user) {
        if (validateUser(response.data.user)) {
          setUser(response.data.user);
          authService.updateUserInStorage(response.data.user);
          setIsAuthenticated(true);
          return true;
        } else {
          console.warn('Usuario inválido recibido del servidor');
          handleExpiredSession(true);
          return false;
        }
      } else {
        handleExpiredSession(true);
        return false;
      }
    } catch (err) {
      console.warn('Error verificando token:', err);

      // Si es error 401, la sesión expiró
      if (err.response?.status === 401) {
        handleExpiredSession(true);
      }

      return false;
    } finally {
      setIsVerifying(false);
    }
  }, [isVerifying, handleExpiredSession]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();

          if (validateUser(currentUser)) {
            if (isMounted) {
              setUser(currentUser);
              setIsAuthenticated(true);
            }

            // Verificar token inicial
            const tokenValid = await verifyAndRefreshToken(true);

            if (tokenValid && enableTokenRefresh && isMounted) {
              const intervalId = setInterval(
                () => verifyAndRefreshToken(),
                tokenRefreshInterval
              );

              setRefreshIntervalId(intervalId);
            }
          } else {
            // Datos inválidos, limpiar
            handleExpiredSession(true);
          }
        }
      } catch (err) {
        console.error('Error inicializando autenticación:', err);
        handleExpiredSession(true);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
      }
    };
  }, [verifyAndRefreshToken, handleExpiredSession, enableTokenRefresh, tokenRefreshInterval]);

  const login = useCallback(async (email, password, rememberMe = false) => {
    if (!email || !password) {
      error?.('Por favor, ingresa email y contraseña');
      return { success: false, message: 'Email y contraseña requeridos' };
    }

    try {
      setLoading(true);
      const response = await authService.login(email, password, rememberMe);

      if (response.success && response.data?.user) {
        if (validateUser(response.data.user)) {
          setUser(response.data.user);
          setIsAuthenticated(true);

          // Configurar refresh automático
          if (enableTokenRefresh) {
            const intervalId = setInterval(
              () => verifyAndRefreshToken(),
              tokenRefreshInterval
            );
            setRefreshIntervalId(intervalId);
          }

          success?.('¡Bienvenido! Sesión iniciada correctamente.');
          return { success: true, data: response.data };
        } else {
          authService.logout();
          error?.('Datos de usuario inválidos recibidos');
          return { success: false, message: 'Datos de usuario inválidos' };
        }
      } else {
        const message = response.message || 'Error al iniciar sesión';
        error?.(message);
        return { success: false, message };
      }
    } catch (err) {
      const message = handleApiError?.(err, 'Error al iniciar sesión') ||
        err.response?.data?.message ||
        'Error al iniciar sesión';
      error?.(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [success, error, handleApiError, verifyAndRefreshToken, enableTokenRefresh, tokenRefreshInterval]);

  const register = useCallback(async (userData) => {
    const requiredFields = ['email', 'password', 'name'];
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
      const message = `Faltan campos requeridos: ${missingFields.join(', ')}`;
      error?.(message);
      return { success: false, message };
    }

    try {
      setLoading(true);
      const response = await authService.register(userData);

      if (response.success) {
        success?.('Usuario registrado exitosamente. Por favor, inicia sesión.');
        return { success: true, data: response.data };
      } else {
        error?.(response.message || 'Error al registrar usuario');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = handleApiError?.(err, 'Error al registrar usuario') ||
        err.response?.data?.message ||
        'Error al registrar usuario';
      error?.(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [success, error, handleApiError]);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      authService.logout();

      setUser(null);
      setIsAuthenticated(false);

      if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        setRefreshIntervalId(null);
      }

      success?.('Sesión cerrada correctamente');
      return { success: true };
    } catch (err) {
      console.error('Error cerrando sesión:', err);
      error?.('Error al cerrar sesión');
      return { success: false, message: 'Error al cerrar sesión' };
    } finally {
      setLoading(false);
    }
  }, [refreshIntervalId, success, error]);

  const updateProfile = useCallback(async (userData) => {
    if (!user) {
      error?.('No hay usuario autenticado');
      return { success: false, message: 'No autenticado' };
    }

    try {
      setLoading(true);
      const response = await authService.updateProfile(userData);

      if (response.success && response.data) {
        const updatedUser = { ...user, ...response.data };
        if (validateUser(updatedUser)) {
          setUser(updatedUser);
          authService.updateUserInStorage(updatedUser);
          success?.('Perfil actualizado exitosamente');
          return { success: true, data: response.data };
        } else {
          error?.('Datos de usuario inválidos');
          return { success: false, message: 'Datos inválidos' };
        }
      } else {
        error?.(response.message || 'Error al actualizar perfil');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = handleApiError?.(err, 'Error al actualizar perfil') ||
        err.response?.data?.message ||
        'Error al actualizar perfil';
      error?.(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [user, success, error, handleApiError]);

  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      error?.('Todos los campos son requeridos');
      return { success: false, message: 'Todos los campos son requeridos' };
    }

    if (newPassword !== confirmPassword) {
      error?.('Las contraseñas nuevas no coinciden');
      return { success: false, message: 'Contraseñas no coinciden' };
    }

    if (newPassword.length < 8) {
      error?.('La contraseña debe tener al menos 8 caracteres');
      return { success: false, message: 'Contraseña muy corta' };
    }

    try {
      setLoading(true);
      const response = await authService.changePassword(currentPassword, newPassword);

      if (response.success) {
        success?.('Contraseña cambiada exitosamente');
        return { success: true };
      } else {
        error?.(response.message || 'Error al cambiar contraseña');
        return { success: false, message: response.message };
      }
    } catch (err) {
      const message = handleApiError?.(err, 'Error al cambiar contraseña') ||
        err.response?.data?.message ||
        'Error al cambiar contraseña';
      error?.(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [success, error, handleApiError]);

  const isAdmin = useCallback(() => {
    return user?.role === 'admin';
  }, [user]);

  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  const updateUser = useCallback((userData) => {
    if (!user) return false;

    try {
      const updatedUser = { ...user, ...userData };
      if (validateUser(updatedUser)) {
        setUser(updatedUser);
        authService.updateUserInStorage(updatedUser);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error actualizando usuario:', err);
      return false;
    }
  }, [user]);

  const forceVerifyToken = useCallback(async () => {
    return await verifyAndRefreshToken(true);
  }, [verifyAndRefreshToken]);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isAdmin,
    hasRole,
    hasAnyRole,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateUser,
    forceVerifyToken
  }), [
    user,
    loading,
    isAuthenticated,
    isAdmin,
    hasRole,
    hasAnyRole,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    updateUser,
    forceVerifyToken
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
  renderNotificationContext: PropTypes.func,
  enableTokenRefresh: PropTypes.bool,
  tokenRefreshInterval: PropTypes.number
};

AuthProvider.defaultProps = {
  renderNotificationContext: null,
  enableTokenRefresh: true,
  tokenRefreshInterval: 5 * 60 * 1000
};