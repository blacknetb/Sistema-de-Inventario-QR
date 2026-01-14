import { useState, useEffect, useCallback, useRef } from 'react';

let authService = null;
let notificationService = null;

try {
  authService = require('../services/authService').authService;
} catch (err) {
  console.warn('authService no encontrado, usando mock:', err);
  authService = createMockAuthService();
}

try {
  notificationService = require('../contexts/NotificationContext').useNotification;
} catch (err) {
  console.warn('NotificationContext no encontrado:', err);
  notificationService = () => ({
    success: () => {},
    error: () => {},
    warning: () => {},
    info: () => {},
  }); 
}


/**
 * ✅ Servicio mock para desarrollo
 */
function createMockAuthService() {
  return {
    isAuthenticated: () => false,
    getCurrentUser: () => null,
    login: () => Promise.resolve({ success: false }),
    logout: () => {},
    verifyToken: () => Promise.resolve({ success: false }),
    updateUserInStorage: () => {},
    getToken: () => null
  };
}

/**
 * ✅ Validación mejorada de usuario
 */
const validateUser = (user) => {
  if (!user || typeof user !== 'object') return false;
  
  const requiredFields = ['id', 'email', 'name', 'role'];
  const hasAllFields = requiredFields.every(field => 
    user[field] !== undefined && user[field] !== null
  );
  
  if (!hasAllFields) return false;
  
  // Validar tipos de datos
  if (typeof user.id !== 'string' && typeof user.id !== 'number') return false;
  if (typeof user.email !== 'string' || !user.email.includes('@')) return false;
  if (typeof user.name !== 'string' || user.name.trim() === '') return false;
  if (!['admin', 'user', 'viewer'].includes(user.role)) return false;
  
  return true;
};

/**
 * ✅ Hook de autenticación principal
 */
export const useAuth = (options = {}) => {
  const {
    autoVerifyToken = true,
    verifyInterval = 5 * 60 * 1000, // 5 minutos
    showNotifications = true,
    sessionTimeout = 24 * 60 * 60 * 1000 // 24 horas
  } = options;

  // ✅ Estado mejorado
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [lastActivity, setLastActivity] = useState(Date.now());
  
  // ✅ Refs para manejo de estado
  const verifyIntervalRef = useRef(null);
  const activityTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const refreshPromiseRef = useRef(null);
  
  // ✅ Sistema de notificaciones opcional
  const notificationHook = notificationService ? notificationService() : null;
  
  /**
   * ✅ MEJORA: Notificaciones con fallback
   */
  const notify = useCallback((type, message, details = null) => {
    if (!showNotifications) return;
    
    console.log(`[AUTH ${type.toUpperCase()}] ${message}`, details || '');
    
    if (notificationHook) {
      try {
        if (type === 'success' && notificationHook.showSuccess) {
          notificationHook.showSuccess(message);
        } else if (type === 'error' && notificationHook.showError) {
          notificationHook.showError(message);
        } else if (notificationHook.addNotification) {
          notificationHook.addNotification({
            type,
            message,
            details
          });
        }
      } catch (err) {
        console.warn('Error en sistema de notificaciones:', err);
      }
    }
  }, [notificationHook, showNotifications]);

  /**
   * ✅ Manejo de errores de API
   */
  const handleApiError = useCallback((error, defaultMessage) => {
    const status = error.response?.status;
    const errorData = error.response?.data || {};
    
    let message = '';
    switch (status) {
      case 401:
        message = 'No autorizado. Por favor, inicie sesión nuevamente.';
        break;
      case 403:
        message = 'Acceso denegado. No tiene permisos suficientes.';
        break;
      case 404:
        message = 'Recurso no encontrado.';
        break;
      case 409:
        message = 'Conflicto de datos.';
        break;
      case 422:
        message = 'Error de validación.';
        break;
      case 429:
        message = 'Demasiadas solicitudes. Intente más tarde.';
        break;
      case 500:
        message = 'Error interno del servidor.';
        break;
      default:
        message = errorData.message || error.message || defaultMessage;
    }
    
    return {
      message,
      status,
      code: errorData.code,
      details: errorData.details
    };
  }, []);

  /**
   * ✅ Manejo de sesión expirada
   */
  const handleExpiredSession = useCallback(async (silent = false) => {
    if (authService.isAuthenticated()) {
      authService.logout();
      setUser(null);
      setSessionStart(null);
      
      if (!silent) {
        notify('error', 'Sesión expirada. Por favor, inicie sesión nuevamente.');
      }
    }
    
    return true;
  }, [notify]);

  /**
   * ✅ Verificación de token
   */
  const verifyToken = useCallback(async (force = false) => {
    if (!authService.isAuthenticated() || (isVerifying && !force)) {
      return { success: false, reason: 'Not authenticated or already verifying' };
    }
    
    if (refreshPromiseRef.current && !force) {
      return refreshPromiseRef.current;
    }
    
    setIsVerifying(true);
    
    const verification = (async () => {
      try {
        const response = await authService.verifyToken();
        
        if (response.success && response.data?.user) {
          if (validateUser(response.data.user)) {
            setUser(response.data.user);
            authService.updateUserInStorage(response.data.user);
            setSessionStart(Date.now());
            setLastActivity(Date.now());
            
            notify('success', 'Sesión verificada');
            return { 
              success: true, 
              user: response.data.user,
              refreshed: response.data.refreshed || false
            };
          } else {
            notify('error', 'Datos de usuario inválidos');
            await handleExpiredSession(true);
            return { success: false, reason: 'Invalid user data' };
          }
        } else {
          const reason = response.message || 'Invalid token response';
          notify('error', 'Sesión expirada');
          await handleExpiredSession(true);
          return { success: false, reason };
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        
        const errorInfo = handleApiError(error, 'Error verificando token');
        
        if (error.response?.status === 401) {
          await handleExpiredSession(true);
        }
        
        return { 
          success: false, 
          reason: errorInfo.message,
          error: errorInfo 
        };
      } finally {
        if (mountedRef.current) {
          setIsVerifying(false);
          refreshPromiseRef.current = null;
        }
      }
    })();
    
    if (!force) {
      refreshPromiseRef.current = verification;
    }
    
    return verification;
  }, [isVerifying, notify, handleApiError, handleExpiredSession]);

  /**
   * ✅ Iniciar verificación periódica
   */
  const startPeriodicVerification = useCallback(() => {
    stopPeriodicVerification();
    
    if (autoVerifyToken && verifyInterval > 0) {
      verifyIntervalRef.current = setInterval(async () => {
        if (authService.isAuthenticated()) {
          await verifyToken();
        }
      }, verifyInterval);
    }
  }, [autoVerifyToken, verifyInterval, verifyToken]);

  /**
   * ✅ Detener verificación periódica
   */
  const stopPeriodicVerification = useCallback(() => {
    if (verifyIntervalRef.current) {
      clearInterval(verifyIntervalRef.current);
      verifyIntervalRef.current = null;
    }
  }, []);

  /**
   * ✅ Monitoreo de actividad
   */
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  /**
   * ✅ Verificar tiempo de inactividad
   */
  const checkInactivity = useCallback(() => {
    if (!sessionTimeout) return false;
    
    const inactiveTime = Date.now() - lastActivity;
    if (inactiveTime > sessionTimeout) {
      handleExpiredSession();
      return true;
    }
    
    return false;
  }, [lastActivity, sessionTimeout]);

  /**
   * ✅ Cargar usuario al iniciar
   */
  useEffect(() => {
    mountedRef.current = true;
    
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          
          if (validateUser(currentUser)) {
            setUser(currentUser);
            setSessionStart(Date.now());
            setLastActivity(Date.now());
            
            if (autoVerifyToken) {
              await verifyToken();
            }
            
            startPeriodicVerification();
          } else {
            console.warn('Invalid user data in storage, clearing...');
            authService.logout();
          }
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setError('Error al cargar usuario');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    loadUser();

    // ✅ Configurar monitoreo de actividad
    const handleUserActivity = () => {
      if (mountedRef.current) {
        updateActivity();
      }
    };

    globalThis.addEventListener('mousemove', handleUserActivity);
    globalThis.addEventListener('keydown', handleUserActivity);
    globalThis.addEventListener('click', handleUserActivity);
    globalThis.addEventListener('scroll', handleUserActivity);

    // ✅ Verificar inactividad periódicamente
    activityTimerRef.current = setInterval(() => {
      if (mountedRef.current) {
        checkInactivity();
      }
    }, 60000);

    // Cleanup
    return () => {
      mountedRef.current = false;
      stopPeriodicVerification();
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
      
      globalThis.removeEventListener('mousemove', handleUserActivity);
      globalThis.removeEventListener('keydown', handleUserActivity);
      globalThis.removeEventListener('click', handleUserActivity);
      globalThis.removeEventListener('scroll', handleUserActivity);
    };
  }, [autoVerifyToken, verifyToken]);

  /**
   * ✅ Iniciar sesión con validación
   */
  const login = useCallback(async (email, password, options = {}) => {
    const { rememberMe = false } = options;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(email, password, { rememberMe });
      
      if (response.success && response.data?.user) {
        if (validateUser(response.data.user)) {
          setUser(response.data.user);
          setSessionStart(Date.now());
          setLastActivity(Date.now());
          
          notify('success', 'Inicio de sesión exitoso');
          
          startPeriodicVerification();
          
          return { 
            success: true, 
            data: response.data,
            user: response.data.user 
          };
        } else {
          authService.logout();
          notify('error', 'Datos de usuario inválidos recibidos');
          return { 
            success: false, 
            message: 'Datos de usuario inválidos recibidos' 
          };
        }
      } else {
        const message = response.message || 'Error al iniciar sesión';
        notify('error', message);
        return { 
          success: false, 
          message 
        };
      }
    } catch (error) {
      const errorInfo = handleApiError(error, 'Error al iniciar sesión');
      notify('error', errorInfo.message);
      setError(errorInfo.message);
      return { 
        success: false, 
        message: errorInfo.message,
        error: errorInfo 
      };
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [notify, startPeriodicVerification, handleApiError]);

  /**
   * ✅ Cerrar sesión con opciones
   */
  const logout = useCallback(async (options = {}) => {
    const { 
      silent = false,
      redirectTo = '/login',
      clearStorage = true 
    } = options;
    
    stopPeriodicVerification();
    
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Error during logout:', err);
    }
    
    setUser(null);
    setSessionStart(null);
    setError(null);
    
    if (clearStorage) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    
    if (!silent) {
      notify('success', 'Sesión cerrada exitosamente');
    }
    
    if (redirectTo && globalThis.location.pathname !== redirectTo) {
      globalThis.location.href = redirectTo;
    }
    
    return { success: true };
  }, [notify, stopPeriodicVerification]);

  return {
    // Estado
    user,
    loading,
    error,
    isVerifying,
    sessionStart,
    lastActivity,
    
    // Acciones
    login,
    logout,
    
    // Verificaciones
    isAdmin: () => user?.role === 'admin',
    hasRole: (role) => user?.role === role,
    hasAnyRole: (roles) => roles.includes(user?.role),
    isAuthenticated: () => !!user && authService.isAuthenticated(),
    
    // Utilidades
    getToken: () => authService.getToken?.() || null,
    verifyToken: () => verifyToken(true),
    updateActivity,
    
    // Información
    sessionAge: sessionStart ? Date.now() - sessionStart : 0,
    inactiveTime: Date.now() - lastActivity,
  };
};