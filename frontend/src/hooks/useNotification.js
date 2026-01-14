import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * ✅ HOOK DE NOTIFICACIONES MEJORADO - VERSIÓN CORREGIDA
 * Correcciones aplicadas:
 * 1. Manejo robusto de JSON en localStorage
 * 2. Eliminación segura de timeouts
 * 3. Optimización de persistencia
 * 4. Compatibilidad con estilos CSS proporcionados
 */

// ✅ Tipos de notificaciones soportadas
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SYSTEM: 'system'
};

// ✅ Configuración por defecto
const DEFAULT_CONFIG = {
  maxNotifications: 50,
  autoRemove: true,
  autoRemoveDelay: 5000,
  persist: true,
  storageKey: 'app_notifications'
};

/**
 * ✅ Hook principal de notificaciones - VERSIÓN CORREGIDA
 */
export const useNotification = (config = {}) => {
  // ✅ MEJORA CORREGIDA: Configuración estable
  const finalConfig = useRef({ ...DEFAULT_CONFIG, ...config }).current;
  
  const {
    maxNotifications,
    autoRemove,
    autoRemoveDelay,
    persist,
    storageKey
  } = finalConfig;

  // ✅ MEJORA CORREGIDA: Estado inicial seguro
  const [notifications, setNotifications] = useState(() => {
    if (!persist || typeof window === 'undefined') {
      return [];
    }
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      
      // ✅ Filtrar notificaciones expiradas
      const now = Date.now();
      return parsed.filter(notification => 
        !notification.expiresAt || notification.expiresAt > now
      );
    } catch (error) {
      console.warn('Error cargando notificaciones:', error);
      return [];
    }
  });
  
  const [unreadCount, setUnreadCount] = useState(0);
  const mountedRef = useRef(true);
  const removalTimeouts = useRef(new Map());

  /**
   * ✅ Calcular conteo de no leídos
   */
  const calculateUnreadCount = useCallback((notificationsList) => {
    return notificationsList.filter(n => !n.read).length;
  }, []);

  /**
   * ✅ MEJORA CORREGIDA: Persistir notificaciones segura
   */
  const persistNotifications = useCallback((notificationsList) => {
    if (!persist || typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(notificationsList));
    } catch (error) {
      console.warn('Error guardando notificaciones:', error);
    }
  }, [persist, storageKey]);

  /**
   * ✅ Programar auto-eliminación
   */
  const scheduleAutoRemoval = useCallback((notificationId, delay = autoRemoveDelay) => {
    if (!autoRemove || !mountedRef.current) return;
    
    // Limpiar timeout anterior
    if (removalTimeouts.current.has(notificationId)) {
      clearTimeout(removalTimeouts.current.get(notificationId));
    }
    
    const timeout = setTimeout(() => {
      if (mountedRef.current) {
        removeNotification(notificationId);
      }
    }, delay);
    
    removalTimeouts.current.set(notificationId, timeout);
  }, [autoRemove, autoRemoveDelay]);

  /**
   * ✅ Cancelar auto-eliminación
   */
  const cancelAutoRemoval = useCallback((notificationId) => {
    if (removalTimeouts.current.has(notificationId)) {
      clearTimeout(removalTimeouts.current.get(notificationId));
      removalTimeouts.current.delete(notificationId);
    }
  }, []);

  /**
   * ✅ MEJORA CORREGIDA: Agregar notificación optimizada
   */
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      read: false,
      type: NOTIFICATION_TYPES.INFO,
      priority: 0,
      actions: [],
      data: {},
      expiresAt: autoRemove ? Date.now() + autoRemoveDelay : null,
      ...notification
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      
      // ✅ Limitar número máximo
      if (updated.length > maxNotifications) {
        updated.splice(maxNotifications);
      }
      
      persistNotifications(updated);
      
      // ✅ Programar auto-eliminación
      if (autoRemove && newNotification.expiresAt) {
        const delay = newNotification.expiresAt - Date.now();
        if (delay > 0) {
          scheduleAutoRemoval(newNotification.id, delay);
        }
      }
      
      return updated;
    });
    
    return newNotification.id;
  }, [autoRemove, autoRemoveDelay, maxNotifications, persistNotifications, scheduleAutoRemoval]);

  /**
   * ✅ Métodos específicos por tipo
   */
  const success = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SUCCESS,
      message,
      title: options.title || 'Éxito',
      priority: 1,
      ...options
    });
  }, [addNotification]);

  const error = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      message,
      title: options.title || 'Error',
      priority: 10,
      ...options
    });
  }, [addNotification]);

  const warning = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.WARNING,
      message,
      title: options.title || 'Advertencia',
      priority: 5,
      ...options
    });
  }, [addNotification]);

  const info = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.INFO,
      message,
      title: options.title || 'Información',
      ...options
    });
  }, [addNotification]);

  const system = useCallback((message, options = {}) => {
    return addNotification({
      type: NOTIFICATION_TYPES.SYSTEM,
      message,
      title: options.title || 'Sistema',
      ...options
    });
  }, [addNotification]);

  /**
   * ✅ Marcar como leído
   */
  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, read: true } : n
      );
      persistNotifications(updated);
      return updated;
    });
    
    cancelAutoRemoval(id);
  }, [cancelAutoRemoval, persistNotifications]);

  /**
   * ✅ Marcar todas como leídas
   */
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      persistNotifications(updated);
      
      prev.forEach(n => cancelAutoRemoval(n.id));
      
      return updated;
    });
  }, [cancelAutoRemoval, persistNotifications]);

  /**
   * ✅ Eliminar notificación
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      persistNotifications(updated);
      
      cancelAutoRemoval(id);
      
      return updated;
    });
  }, [cancelAutoRemoval, persistNotifications]);

  /**
   * ✅ Eliminar todas las notificaciones
   */
  const clearAll = useCallback(() => {
    removalTimeouts.current.forEach(timeout => clearTimeout(timeout));
    removalTimeouts.current.clear();
    
    setNotifications([]);
    
    if (persist && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [persist, storageKey]);

  /**
   * ✅ Filtrar notificaciones por tipo
   */
  const getByType = useCallback((type) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  /**
   * ✅ Filtrar notificaciones por prioridad
   */
  const getByPriority = useCallback((minPriority = 0) => {
    return notifications.filter(n => n.priority >= minPriority);
  }, [notifications]);

  /**
   * ✅ Obtener notificaciones no leídas
   */
  const getUnread = useCallback(() => {
    return notifications.filter(n => !n.read);
  }, [notifications]);

  /**
   * ✅ Actualizar notificación
   */
  const updateNotification = useCallback((id, updates) => {
    setNotifications(prev => {
      const updated = prev.map(n => 
        n.id === id ? { ...n, ...updates } : n
      );
      persistNotifications(updated);
      return updated;
    });
  }, [persistNotifications]);

  /**
   * ✅ Ejecutar acción de notificación
   */
  const executeAction = useCallback((notificationId, actionId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    const action = notification.actions?.find(a => a.id === actionId);
    if (action && action.handler) {
      action.handler();
      
      if (action.autoDismiss) {
        removeNotification(notificationId);
      }
    }
  }, [notifications, removeNotification]);

  /**
   * ✅ Manejar error de API
   */
  const handleApiError = useCallback((error, context = '') => {
    const errorData = error.response?.data || {};
    const message = errorData.message || error.message || 'Error desconocido';
    
    const notificationId = addNotification({
      type: NOTIFICATION_TYPES.ERROR,
      title: `Error${context ? ` en ${context}` : ''}`,
      message,
      data: {
        status: error.response?.status,
        code: errorData.code,
        details: errorData.details,
        timestamp: new Date().toISOString()
      },
      actions: [
        {
          id: 'retry',
          label: 'Reintentar',
          handler: () => {
            console.log('Retrying...');
          }
        },
        {
          id: 'dismiss',
          label: 'Descartar',
          handler: () => removeNotification(notificationId),
          autoDismiss: true
        }
      ]
    });
    
    return notificationId;
  }, [addNotification, removeNotification]);

  /**
   * ✅ Efecto para actualizar conteo de no leídos
   */
  useEffect(() => {
    if (mountedRef.current) {
      setUnreadCount(calculateUnreadCount(notifications));
    }
  }, [notifications, calculateUnreadCount]);

  /**
   * ✅ MEJORA CORREGIDA: Limpieza segura
   */
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      
      removalTimeouts.current.forEach(timeout => clearTimeout(timeout));
      removalTimeouts.current.clear();
    };
  }, []);

  return {
    // Estado
    notifications,
    unreadCount,
    
    // Métodos de agregar por tipo
    success,
    error,
    warning,
    info,
    system,
    add: addNotification,
    
    // Métodos de gestión
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    updateNotification,
    executeAction,
    
    // Filtros
    getByType,
    getByPriority,
    getUnread,
    
    // Utilidades
    handleApiError,
    
    // Información
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0,
    notificationTypes: NOTIFICATION_TYPES
  };
};