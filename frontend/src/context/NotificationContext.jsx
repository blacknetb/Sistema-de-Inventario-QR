import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { Toaster, toast as hotToast } from 'react-hot-toast';
import logger from '../utils/logger';

// Tipos de notificaciones
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Estructura de una notificación
export const createNotification = (type, message, options = {}) => ({
  id: Date.now().toString(36) + Math.random().toString(36).substr(2),
  type,
  message,
  title: options.title || '',
  duration: options.duration || (type === NOTIFICATION_TYPES.ERROR ? 6000 : 4000),
  action: options.action || null,
  dismissible: options.dismissible !== false,
  timestamp: Date.now(),
  ...options
});

// Crear el contexto
const NotificationContext = createContext();

// Hook personalizado
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de un NotificationProvider');
  }
  return context;
};

// Proveedor de notificaciones
export const NotificationProvider = ({ children }) => {
  // Estado para notificaciones
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Configuración
  const [config, setConfig] = useState({
    position: 'top-right',
    maxNotifications: 5,
    autoDismiss: true,
    playSound: false,
    showNotifications: true,
    vibration: false
  });

  // Sonidos para notificaciones
  const sounds = useMemo(() => ({
    [NOTIFICATION_TYPES.SUCCESS]: '/sounds/success.mp3',
    [NOTIFICATION_TYPES.ERROR]: '/sounds/error.mp3',
    [NOTIFICATION_TYPES.WARNING]: '/sounds/warning.mp3',
    [NOTIFICATION_TYPES.INFO]: '/sounds/info.mp3'
  }), []);

  // Reproducir sonido
  const playSound = useCallback((type) => {
    if (!config.playSound) return;
    
    try {
      const audio = new Audio(sounds[type] || sounds[NOTIFICATION_TYPES.INFO]);
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Silenciar error si no se puede reproducir
      });
    } catch (error) {
      logger.warn('Error al reproducir sonido:', error);
    }
  }, [config.playSound, sounds]);

  // Vibrar (si está soportado)
  const vibrate = useCallback(() => {
    if (!config.vibration || !('vibrate' in navigator)) return;
    
    try {
      navigator.vibrate([100, 50, 100]);
    } catch (error) {
      logger.warn('Error al vibrar:', error);
    }
  }, [config.vibration]);

  // Añadir notificación
  const addNotification = useCallback((type, message, options = {}) => {
    if (!config.showNotifications) return null;

    const notification = createNotification(type, message, options);
    
    // Reproducir efectos
    if (type !== NOTIFICATION_TYPES.LOADING) {
      playSound(type);
      vibrate();
    }

    // Añadir al estado
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      if (newNotifications.length > config.maxNotifications) {
        return newNotifications.slice(0, config.maxNotifications);
      }
      return newNotifications;
    });

    // Incrementar contador de no leídas
    if (options.markAsRead !== true) {
      setUnreadCount(prev => prev + 1);
    }

    // Mostrar toast
    const toastOptions = {
      duration: notification.duration,
      position: config.position,
      id: notification.id,
      ...notification.toastOptions
    };

    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        hotToast.success(message, toastOptions);
        break;
      case NOTIFICATION_TYPES.ERROR:
        hotToast.error(message, toastOptions);
        break;
      case NOTIFICATION_TYPES.WARNING:
        hotToast(message, {
          ...toastOptions,
          icon: '⚠️',
          style: {
            background: 'var(--color-warning)',
            color: 'white'
          }
        });
        break;
      case NOTIFICATION_TYPES.INFO:
        hotToast(message, {
          ...toastOptions,
          icon: 'ℹ️',
          style: {
            background: 'var(--color-info)',
            color: 'white'
          }
        });
        break;
      case NOTIFICATION_TYPES.LOADING:
        return hotToast.loading(message, toastOptions);
      default:
        hotToast(message, toastOptions);
    }

    return notification.id;
  }, [config, playSound, vibrate]);

  // Métodos específicos
  const success = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.SUCCESS, message, options), [addNotification]);

  const error = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.ERROR, message, options), [addNotification]);

  const warning = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.WARNING, message, options), [addNotification]);

  const info = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.INFO, message, options), [addNotification]);

  const loading = useCallback((message, options = {}) => 
    addNotification(NOTIFICATION_TYPES.LOADING, message, options), [addNotification]);

  const dismiss = useCallback((id) => {
    // Dismiss toast
    hotToast.dismiss(id);
    
    // Remover del estado
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    hotToast.dismiss();
    setNotifications([]);
  }, []);

  const updateNotification = useCallback((id, newData) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, ...newData } : notif
      )
    );
  }, []);

  const markAsRead = useCallback((id = null) => {
    if (id) {
      // Marcar una notificación específica como leída
      updateNotification(id, { read: true });
      setUnreadCount(prev => Math.max(0, prev - 1));
    } else {
      // Marcar todas como leídas
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
      setUnreadCount(0);
    }
  }, [updateNotification]);

  const removeNotification = useCallback((id) => {
    dismiss(id);
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, [dismiss]);

  // Configurar posición del toast
  useEffect(() => {
    const updateToastPosition = () => {
      const isMobile = window.innerWidth < 768;
      setConfig(prev => ({
        ...prev,
        position: isMobile ? 'top-center' : 'top-right'
      }));
    };

    updateToastPosition();
    window.addEventListener('resize', updateToastPosition);
    
    return () => window.removeEventListener('resize', updateToastPosition);
  }, []);

  // Cargar configuración guardada
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem('notification_config');
      if (savedConfig) {
        setConfig(prev => ({ ...prev, ...JSON.parse(savedConfig) }));
      }
    } catch (error) {
      logger.warn('Error al cargar configuración de notificaciones:', error);
    }
  }, []);

  // Guardar configuración
  useEffect(() => {
    try {
      localStorage.setItem('notification_config', JSON.stringify(config));
    } catch (error) {
      logger.warn('Error al guardar configuración de notificaciones:', error);
    }
  }, [config]);

  // Valor del contexto
  const contextValue = useMemo(() => ({
    // Estado
    notifications,
    unreadCount,
    config,
    
    // Métodos
    addNotification,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    dismissAll,
    updateNotification,
    markAsRead,
    removeNotification,
    
    // Configuración
    updateConfig: (newConfig) => setConfig(prev => ({ ...prev, ...newConfig })),
    
    // Utilidades
    hasUnread: unreadCount > 0,
    getNotificationsByType: (type) => 
      notifications.filter(notif => notif.type === type),
    getRecentNotifications: (count = 5) => 
      notifications.slice(0, count)
  }), [notifications, unreadCount, config, addNotification, success, error, warning, info, loading, dismiss, dismissAll, updateNotification, markAsRead, removeNotification]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* Toast Container personalizado */}
      <div className="notification-toast-container">
        <Toaster
          position={config.position}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              fontSize: '0.875rem',
              maxWidth: '350px'
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: 'var(--color-success)',
                secondary: 'var(--color-text-inverse)'
              }
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: 'var(--color-danger)',
                secondary: 'var(--color-text-inverse)'
              }
            }
          }}
        />
      </div>
    </NotificationContext.Provider>
  );
};

// Componente de notificación individual
export const NotificationItem = ({ notification, onDismiss, onAction }) => {
  const { type, message, title, action, dismissible, timestamp } = notification;

  const getIcon = () => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS: return '✅';
      case NOTIFICATION_TYPES.ERROR: return '❌';
      case NOTIFICATION_TYPES.WARNING: return '⚠️';
      case NOTIFICATION_TYPES.INFO: return 'ℹ️';
      case NOTIFICATION_TYPES.LOADING: return '⏳';
      default: return '📢';
    }
  };

  const getTimeAgo = () => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'ahora';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  return (
    <div className={`notification-item notification-${type}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-content">
        {title && <div className="notification-title">{title}</div>}
        <div className="notification-message">{message}</div>
        <div className="notification-footer">
          <span className="notification-time">{getTimeAgo()}</span>
          {action && (
            <button 
              className="notification-action"
              onClick={() => onAction?.(action)}
            >
              {action.label}
            </button>
          )}
        </div>
      </div>
      {dismissible && (
        <button 
          className="notification-dismiss"
          onClick={() => onDismiss?.(notification.id)}
          aria-label="Descartar notificación"
        >
          ×
        </button>
      )}
    </div>
  );
};

// Componente de lista de notificaciones
export const NotificationList = ({ maxItems = 10, showUnreadOnly = false }) => {
  const { notifications, markAsRead, removeNotification, hasUnread } = useNotification();

  const filteredNotifications = showUnreadOnly
    ? notifications.filter(n => !n.read)
    : notifications.slice(0, maxItems);

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  if (filteredNotifications.length === 0) {
    return (
      <div className="notification-list-empty">
        {showUnreadOnly && hasUnread ? (
          <p>Todas las notificaciones están leídas</p>
        ) : (
          <p>No hay notificaciones</p>
        )}
      </div>
    );
  }

  return (
    <div className="notification-list">
      {filteredNotifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onDismiss={removeNotification}
          onClick={() => handleNotificationClick(notification)}
        />
      ))}
    </div>
  );
};

export default NotificationContext;