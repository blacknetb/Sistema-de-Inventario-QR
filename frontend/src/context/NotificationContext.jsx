import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import toast, { Toaster } from 'react-hot-toast';
import '../assets/styles/context.css';

const NOTIFICATION_TYPES = Object.freeze({
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
});

const NOTIFICATION_CONFIGS = {
  [NOTIFICATION_TYPES.SUCCESS]: {
    duration: 3000,
    icon: '✅',
    style: {
      background: '#10b981',
      color: '#ffffff',
      fontWeight: 500
    }
  },
  [NOTIFICATION_TYPES.ERROR]: {
    duration: 5000,
    icon: '❌',
    style: {
      background: '#ef4444',
      color: '#ffffff',
      fontWeight: 500
    }
  },
  [NOTIFICATION_TYPES.WARNING]: {
    duration: 4000,
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#ffffff',
      fontWeight: 500
    }
  },
  [NOTIFICATION_TYPES.INFO]: {
    duration: 3000,
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#ffffff',
      fontWeight: 500
    }
  },
  [NOTIFICATION_TYPES.LOADING]: {
    duration: Infinity,
    style: {
      background: '#6b7280',
      color: '#ffffff',
      fontWeight: 500
    }
  }
};

const TOAST_CONFIG = {
  position: 'top-right',
  duration: 4000,
  style: {
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '14px',
    lineHeight: '1.5',
    maxWidth: '400px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
  },
  success: {
    duration: 3000,
    style: {
      background: '#10b981',
      color: '#ffffff'
    }
  },
  error: {
    duration: 5000,
    style: {
      background: '#ef4444',
      color: '#ffffff'
    }
  }
};

const NotificationContext = createContext({
  notifications: [],
  showNotification: () => '',
  success: () => '',
  error: () => '',
  warning: () => '',
  info: () => '',
  loading: () => '',
  removeNotification: () => { },
  clearAllNotifications: () => { },
  updateNotification: () => { },
  withLoadingNotification: async () => { },
  handleApiError: () => '',
  NOTIFICATION_TYPES: NOTIFICATION_TYPES
});

export const useNotification = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      'useNotification debe ser usado dentro de NotificationProvider. ' +
      'Asegúrate de que tu aplicación esté envuelta en <NotificationProvider>.'
    );
  }

  return context;
};

export const NotificationToaster = ({
  position = 'top-right',
  toastOptions = {}
}) => {
  const mergedOptions = useMemo(() => ({
    ...TOAST_CONFIG,
    position,
    ...toastOptions
  }), [position, toastOptions]);

  return <Toaster {...mergedOptions} />;
};

export const NotificationProvider = ({
  children,
  maxNotifications = 50,
  enableQueue = true,
  queueDelay = 100
}) => {
  const [notifications, setNotifications] = useState([]);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const timeoutsRef = useRef(new Map());
  const queueTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
      timeoutsRef.current.clear();

      if (queueTimeoutRef.current) {
        clearTimeout(queueTimeoutRef.current);
      }
    };
  }, []);

  const processQueue = useCallback(() => {
    if (notificationQueue.length === 0) {
      queueTimeoutRef.current = null;
      return;
    }

    const [notification, ...remainingQueue] = notificationQueue;
    setNotificationQueue(remainingQueue);

    const { message, type, options, resolve } = notification;
    const id = showNotification(message, type, options);
    resolve?.(id);

    if (remainingQueue.length > 0) {
      queueTimeoutRef.current = setTimeout(processQueue, queueDelay);
    } else {
      queueTimeoutRef.current = null;
    }
  }, [notificationQueue, queueDelay, showNotification]);

  const generateId = useCallback(() => {
    const randomPart = Math.random().toString(36).slice(2, 11);
    return `notification_${Date.now()}_${randomPart}`;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));

    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }

    toast.dismiss(id);
  }, []);

  const showNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const id = options.id || generateId();
    const config = NOTIFICATION_CONFIGS[type] || NOTIFICATION_CONFIGS[NOTIFICATION_TYPES.INFO];

    const notification = {
      id,
      message: String(message),
      type,
      timestamp: new Date(),
      options: {
        ...config,
        ...options,
        id
      }
    };

    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        toast.success(message, notification.options);
        break;
      case NOTIFICATION_TYPES.ERROR:
        toast.error(message, notification.options);
        break;
      case NOTIFICATION_TYPES.WARNING:
        toast.custom((t) => (
          <div
            style={{
              background: config.style.background,
              color: config.style.color,
              padding: '12px 16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>{config.icon}</span>
            <span>{message}</span>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              ×
            </button>
          </div>
        ), notification.options);
        break;
      case NOTIFICATION_TYPES.INFO:
        toast(message, notification.options);
        break;
      case NOTIFICATION_TYPES.LOADING:
        toast.loading(message, notification.options);
        break;
      default:
        toast(message, notification.options);
    }

    setNotifications(prev => {
      const newNotifications = [...prev, notification];
      return newNotifications.length > maxNotifications
        ? newNotifications.slice(-maxNotifications)
        : newNotifications;
    });

    if (type !== NOTIFICATION_TYPES.LOADING && !options.persist) {
      const duration = options.duration || config.duration;
      if (duration && duration !== Infinity) {
        const timeoutId = setTimeout(() => {
          removeNotification(id);
        }, duration);

        timeoutsRef.current.set(id, timeoutId);
      }
    }

    return id;
  }, [generateId, maxNotifications, removeNotification, NOTIFICATION_TYPES]);

  const enqueueNotification = useCallback((message, type, options = {}) => {
    return new Promise((resolve) => {
      setNotificationQueue(prev => [
        ...prev,
        { message, type, options, resolve }
      ]);

      if (!queueTimeoutRef.current) {
        queueTimeoutRef.current = setTimeout(processQueue, queueDelay);
      }
    });
  }, [processQueue, queueDelay]);

  const success = useCallback((message, options = {}) => {
    if (enableQueue && notificationQueue.length > 0) {
      return enqueueNotification(message, NOTIFICATION_TYPES.SUCCESS, options);
    }
    return showNotification(message, NOTIFICATION_TYPES.SUCCESS, options);
  }, [showNotification, enqueueNotification, enableQueue, notificationQueue.length, NOTIFICATION_TYPES.SUCCESS]);

  const error = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.ERROR, options);
  }, [showNotification, NOTIFICATION_TYPES.ERROR]);

  const warning = useCallback((message, options = {}) => {
    if (enableQueue && notificationQueue.length > 0) {
      return enqueueNotification(message, NOTIFICATION_TYPES.WARNING, options);
    }
    return showNotification(message, NOTIFICATION_TYPES.WARNING, options);
  }, [showNotification, enqueueNotification, enableQueue, notificationQueue.length, NOTIFICATION_TYPES.WARNING]);

  const info = useCallback((message, options = {}) => {
    if (enableQueue && notificationQueue.length > 0) {
      return enqueueNotification(message, NOTIFICATION_TYPES.INFO, options);
    }
    return showNotification(message, NOTIFICATION_TYPES.INFO, options);
  }, [showNotification, enqueueNotification, enableQueue, notificationQueue.length, NOTIFICATION_TYPES.INFO]);

  const loading = useCallback((message, options = {}) => {
    return showNotification(message, NOTIFICATION_TYPES.LOADING, options);
  }, [showNotification, NOTIFICATION_TYPES.LOADING]);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setNotificationQueue([]);

    timeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current.clear();

    if (queueTimeoutRef.current) {
      clearTimeout(queueTimeoutRef.current);
      queueTimeoutRef.current = null;
    }

    toast.dismiss();
  }, []);

  const updateNotification = useCallback((id, message, type, options = {}) => {
    setNotifications(prev => prev.map(notification => {
      if (notification.id === id) {
        return {
          ...notification,
          message,
          type,
          options: { ...notification.options, ...options },
          timestamp: new Date()
        };
      }
      return notification;
    }));

    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }

    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        toast.success(message, { ...options, id });
        break;
      case NOTIFICATION_TYPES.ERROR:
        toast.error(message, { ...options, id });
        break;
      default:
        toast(message, { ...options, id });
    }

    if (!options.persist) {
      const config = NOTIFICATION_CONFIGS[type] || NOTIFICATION_CONFIGS[NOTIFICATION_TYPES.INFO];
      const duration = options.duration || config.duration;

      if (duration && duration !== Infinity) {
        const timeoutId = setTimeout(() => {
          removeNotification(id);
        }, duration);
        timeoutsRef.current.set(id, timeoutId);
      }
    }
  }, [removeNotification, NOTIFICATION_TYPES]);

  const withLoadingNotification = useCallback(async (
    promise,
    messages = {
      loading: 'Procesando...',
      success: '¡Operación completada!',
      error: (err) => err?.response?.data?.message || err?.message || 'Ha ocurrido un error'
    },
    options = {}
  ) => {
    const loadingId = loading(messages.loading, { ...options, persist: true });

    try {
      const result = await promise;

      updateNotification(
        loadingId,
        typeof messages.success === 'function' ? messages.success(result) : messages.success,
        NOTIFICATION_TYPES.SUCCESS,
        { duration: 3000, ...options }
      );

      return result;
    } catch (err) {
      const errorMessage = typeof messages.error === 'function' ? messages.error(err) : messages.error;
      updateNotification(
        loadingId,
        errorMessage,
        NOTIFICATION_TYPES.ERROR,
        { duration: 5000, ...options }
      );

      throw err;
    }
  }, [loading, updateNotification, NOTIFICATION_TYPES]);

  const handleApiError = useCallback((error, defaultMessage = 'Ha ocurrido un error') => {
    let message = defaultMessage;

    if (error.response?.data) {
      const data = error.response.data;

      if (data.message) {
        message = data.message;
      }

      if (data.errors && Array.isArray(data.errors)) {
        if (data.errors[0]) {
          const firstError = data.errors[0];
          showNotification(
            `${firstError.field ? `${firstError.field}: ` : ''}${firstError.message}`,
            NOTIFICATION_TYPES.ERROR,
            { duration: 5000 }
          );
        }

        data.errors.slice(1).forEach((err, index) => {
          setTimeout(() => {
            showNotification(
              `${err.field ? `${err.field}: ` : ''}${err.message}`,
              NOTIFICATION_TYPES.ERROR,
              { duration: 5000 }
            );
          }, (index + 1) * 300);
        });

        return 'Error de validación';
      }
    } else if (error.message) {
      message = error.message;
    }

    showNotification(message, NOTIFICATION_TYPES.ERROR, { duration: 5000 });
    return message;
  }, [showNotification, NOTIFICATION_TYPES]);

  const value = useMemo(() => ({
    notifications,
    showNotification,
    success,
    error,
    warning,
    info,
    loading,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    withLoadingNotification,
    handleApiError,
    NOTIFICATION_TYPES
  }), [
    notifications,
    showNotification,
    success,
    error,
    warning,
    info,
    loading,
    removeNotification,
    clearAllNotifications,
    updateNotification,
    withLoadingNotification,
    handleApiError
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
  maxNotifications: PropTypes.number,
  enableQueue: PropTypes.bool,
  queueDelay: PropTypes.number
};

NotificationProvider.defaultProps = {
  maxNotifications: 50,
  enableQueue: true,
  queueDelay: 100
};

NotificationToaster.propTypes = {
  position: PropTypes.oneOf(['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right']),
  toastOptions: PropTypes.object
};

NotificationToaster.defaultProps = {
  position: 'top-right',
  toastOptions: {}
};