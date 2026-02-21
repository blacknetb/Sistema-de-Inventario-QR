import React, { createContext, useState, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Auto-eliminar después de 5 segundos si es toast
    if (notification.type === 'toast') {
      setTimeout(() => {
        (newNotification.id);
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === id && !n.read ? { ...n, read: true } : n
      );

      const unreadChanged = prev.find(n => n.id === id && !n.read);
      if (unreadChanged) {
        setUnreadCount(count => Math.max(0, count - 1));
      }

      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Métodos específicos para diferentes tipos de notificaciones
  const showSuccess = useCallback((message, title = 'Éxito') => {
    addNotification({
      type: 'success',
      title,
      message,
      variant: 'success'
    });
  }, [addNotification]);

  const showError = useCallback((message, title = 'Error') => {
    addNotification({
      type: 'error',
      title,
      message,
      variant: 'error'
    });
  }, [addNotification]);

  const showWarning = useCallback((message, title = 'Advertencia') => {
    addNotification({
      type: 'warning',
      title,
      message,
      variant: 'warning'
    });
  }, [addNotification]);

  const showInfo = useCallback((message, title = 'Información') => {
    addNotification({
      type: 'info',
      title,
      message,
      variant: 'info'
    });
  }, [addNotification]);

  const showToast = useCallback((message, type = 'info') => {
    addNotification({
      type: 'toast',
      message,
      variant: type
    });
  }, [addNotification]);

  // Notificaciones del sistema
  const addSystemNotification = useCallback((message, severity = 'info') => {
    addNotification({
      type: 'system',
      title: 'Sistema',
      message,
      variant: severity
    });
  }, [addNotification]);

  // Notificaciones de inventario
  const addInventoryNotification = useCallback((message, productName, severity = 'info') => {
    addNotification({
      type: 'inventory',
      title: `Inventario - ${productName}`,
      message,
      variant: severity
    });
  }, [addNotification]);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
    addSystemNotification,
    addInventoryNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;