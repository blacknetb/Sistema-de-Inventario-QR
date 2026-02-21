import { useState, useCallback, useRef } from 'react';

export const useNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const notificationIdRef = useRef(0);

  const generateId = useCallback(() => {
    notificationIdRef.current += 1;
    return notificationIdRef.current;
  }, []);

  const addNotification = useCallback((notification) => {
    const id = generateId();
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-eliminar después de 5 segundos si es de tipo temporal
    if (notification.temporary) {
      setTimeout(() => {
        (id);
      }, notification.duration || 5000);
    }

    return id;
  }, [generateId]);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Toast methods
  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = generateId();
    const toast = {
      id,
      message,
      type,
      duration: options.duration || 3000,
      position: options.position || 'top-right'
    };

    setToasts(prev => [...prev, toast]);

    setTimeout(() => {
      (id);
    }, toast.duration);

    return id;
  }, [generateId]);

  const hideToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showSuccess = useCallback((message, options) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message, options) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = useCallback((message, options) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message, options) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  // Alert methods
  const showAlert = useCallback((message, type = 'info', options = {}) => {
    return addNotification({
      type: 'alert',
      title: options.title || getAlertTitle(type),
      message,
      variant: type,
      temporary: options.temporary || false,
      duration: options.duration,
      actions: options.actions
    });
  }, [addNotification]);

  const showConfirm = useCallback((message, onConfirm, onCancel, options = {}) => {
    return addNotification({
      type: 'confirm',
      title: options.title || 'Confirmar acción',
      message,
      variant: 'warning',
      actions: [
        {
          label: options.confirmText || 'Confirmar',
          onClick: onConfirm,
          variant: 'primary'
        },
        {
          label: options.cancelText || 'Cancelar',
          onClick: onCancel,
          variant: 'secondary'
        }
      ]
    });
  }, [addNotification]);

  const getAlertTitle = (type) => {
    const titles = {
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    };
    return titles[type] || 'Notificación';
  };

  return {
    // Notificaciones
    notifications,
    toasts,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    getUnreadCount,
    
    // Toasts
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    
    // Alerts
    showAlert,
    showConfirm
  };
};

export default useNotification;