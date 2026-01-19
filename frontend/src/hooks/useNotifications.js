import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para manejar notificaciones del sistema de inventario
 * @param {Object} options - Opciones de configuración
 * @returns {Object} Funciones y estado de notificaciones
 */
const useNotifications = (options = {}) => {
  const {
    maxNotifications = 50,
    autoDismiss = true,
    dismissTime = 5000,
    enableSounds = false,
    position = 'top-right'
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState({
    enableStockAlerts: true,
    enableSystemAlerts: true,
    enableEmailNotifications: false,
    lowStockThreshold: 5,
    soundEnabled: enableSounds,
    vibrationEnabled: false,
    desktopNotifications: false
  });

  const notificationSound = useRef(null);
  const notificationId = useRef(0);

  // Inicializar sonido de notificación
  useEffect(() => {
    if (settings.soundEnabled && typeof window !== 'undefined') {
      try {
        notificationSound.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQ=');
      } catch (error) {
        console.warn('No se pudo cargar el sonido de notificación:', error);
      }
    }
  }, [settings.soundEnabled]);

  // Configurar notificaciones del navegador
  useEffect(() => {
    if (settings.desktopNotifications && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [settings.desktopNotifications]);

  // Auto-dismiss de notificaciones
  useEffect(() => {
    if (autoDismiss && notifications.length > 0) {
      const timers = notifications
        .filter(notification => !notification.persistent)
        .map(notification => {
          return setTimeout(() => {
            dismissNotification(notification.id);
          }, dismissTime);
        });

      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [notifications, autoDismiss, dismissTime]);

  // Crear una nueva notificación
  const addNotification = useCallback((notification) => {
    const id = ++notificationId.current;
    const timestamp = new Date().toISOString();
    
    const newNotification = {
      id,
      ...notification,
      timestamp,
      read: false,
      persistent: notification.persistent || false
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      if (updated.length > maxNotifications) {
        return updated.slice(0, maxNotifications);
      }
      return updated;
    });

    setUnreadCount(prev => prev + 1);

    // Reproducir sonido
    if (settings.soundEnabled && notificationSound.current) {
      try {
        notificationSound.current.currentTime = 0;
        notificationSound.current.play();
      } catch (error) {
        console.warn('Error reproduciendo sonido:', error);
      }
    }

    // Vibrar (si está soportado)
    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      navigator.vibrate(200);
    }

    // Notificación del navegador
    if (settings.desktopNotifications && Notification.permission === 'granted') {
      new Notification(notification.title || 'Sistema de Inventario', {
        body: notification.message,
        icon: '/favicon.ico',
        tag: 'inventory-notification'
      });
    }

    return id;
  }, [maxNotifications, settings]);

  // Notificaciones específicas del inventario
  const addStockNotification = useCallback((item, type, details = {}) => {
    const notificationsMap = {
      low_stock: {
        title: 'Stock Bajo',
        message: `${item.name} tiene stock bajo (${item.quantity} unidades)`,
        type: 'warning',
        action: 'check_stock'
      },
      out_of_stock: {
        title: 'Stock Agotado',
        message: `${item.name} se ha agotado`,
        type: 'error',
        action: 'reorder'
      },
      reorder: {
        title: 'Reorden Sugerida',
        message: `Es tiempo de reordenar ${item.name}`,
        type: 'info',
        action: 'reorder'
      },
      stock_adjusted: {
        title: 'Stock Ajustado',
        message: `Stock de ${item.name} ajustado a ${details.newQuantity} unidades`,
        type: 'info',
        action: 'view_item'
      },
      price_change: {
        title: 'Precio Actualizado',
        message: `Precio de ${item.name} actualizado a $${details.newPrice}`,
        type: 'info',
        action: 'view_item'
      }
    };

    const notification = notificationsMap[type] || {
      title: 'Actualización de Inventario',
      message: `${item.name} ha sido actualizado`,
      type: 'info'
    };

    return addNotification({
      ...notification,
      itemId: item.id,
      itemName: item.name,
      data: details
    });
  }, [addNotification]);

  // Notificaciones del sistema
  const addSystemNotification = useCallback((type, details = {}) => {
    const notificationsMap = {
      backup_complete: {
        title: 'Respaldo Completado',
        message: 'El respaldo del inventario se completó exitosamente',
        type: 'success'
      },
      backup_failed: {
        title: 'Error en Respaldo',
        message: 'No se pudo completar el respaldo del inventario',
        type: 'error'
      },
      import_complete: {
        title: 'Importación Completada',
        message: `Se importaron ${details.count || 0} items exitosamente`,
        type: 'success'
      },
      import_failed: {
        title: 'Error en Importación',
        message: 'No se pudo completar la importación de items',
        type: 'error'
      },
      export_complete: {
        title: 'Exportación Completada',
        message: `Se exportaron ${details.count || 0} items exitosamente`,
        type: 'success'
      },
      sync_complete: {
        title: 'Sincronización Completada',
        message: 'Los datos han sido sincronizados exitosamente',
        type: 'success'
      },
      maintenance: {
        title: 'Mantenimiento Programado',
        message: 'El sistema entrará en mantenimiento en 10 minutos',
        type: 'warning',
        persistent: true
      }
    };

    const notification = notificationsMap[type] || {
      title: 'Notificación del Sistema',
      message: details.message || 'Nueva notificación del sistema',
      type: 'info'
    };

    return addNotification(notification);
  }, [addNotification]);

  // Marcar notificación como leída
  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    
    setUnreadCount(0);
  }, []);

  // Descartar notificación
  const dismissNotification = useCallback((id) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      return prev.filter(notification => notification.id !== id);
    });
  }, []);

  // Descartar todas las notificaciones
  const dismissAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Filtrar notificaciones
  const filterNotifications = useCallback((filter) => {
    switch(filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      case 'errors':
        return notifications.filter(n => n.type === 'error');
      case 'warnings':
        return notifications.filter(n => n.type === 'warning');
      case 'stock':
        return notifications.filter(n => n.action && ['check_stock', 'reorder', 'view_item'].includes(n.action));
      case 'system':
        return notifications.filter(n => !n.action || n.action === 'system');
      default:
        return notifications;
    }
  }, [notifications]);

  // Agrupar notificaciones por fecha
  const groupByDate = useCallback(() => {
    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    notifications.forEach(notification => {
      const notificationDate = new Date(notification.timestamp);
      
      if (notificationDate >= today) {
        groups.today.push(notification);
      } else if (notificationDate >= yesterday) {
        groups.yesterday.push(notification);
      } else if (notificationDate >= weekAgo) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  }, [notifications]);

  // Obtener estadísticas de notificaciones
  const getNotificationStats = useCallback(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const errors = notifications.filter(n => n.type === 'error').length;
    const warnings = notifications.filter(n => n.type === 'warning').length;
    const today = notifications.filter(n => {
      const notificationDate = new Date(n.timestamp);
      const today = new Date();
      return notificationDate.toDateString() === today.toDateString();
    }).length;

    return {
      total,
      unread,
      errors,
      warnings,
      today,
      read: total - unread
    };
  }, [notifications]);

  // Actualizar configuración
  const updateSettings = useCallback((newSettings) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
  }, []);

  // Verificar stock bajo y generar notificaciones
  const checkLowStock = useCallback((items) => {
    if (!settings.enableStockAlerts) return [];

    const lowStockItems = items.filter(item => 
      item.quantity > 0 && 
      item.quantity <= (settings.lowStockThreshold || item.minStock || 5)
    );

    const outOfStockItems = items.filter(item => item.quantity === 0);

    const notificationIds = [];

    lowStockItems.forEach(item => {
      if (!notifications.some(n => 
        n.itemId === item.id && 
        n.action === 'check_stock' && 
        new Date(n.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )) {
        const id = addStockNotification(item, 'low_stock', {
          currentQuantity: item.quantity,
          minStock: item.minStock || settings.lowStockThreshold
        });
        notificationIds.push(id);
      }
    });

    outOfStockItems.forEach(item => {
      if (!notifications.some(n => 
        n.itemId === item.id && 
        n.action === 'reorder' && 
        new Date(n.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      )) {
        const id = addStockNotification(item, 'out_of_stock');
        notificationIds.push(id);
      }
    });

    return notificationIds;
  }, [settings, notifications, addStockNotification]);

  // Exportar notificaciones
  const exportNotifications = useCallback((format = 'json') => {
    const data = {
      exportedAt: new Date().toISOString(),
      count: notifications.length,
      notifications: notifications.map(n => ({
        ...n,
        timestamp: new Date(n.timestamp).toLocaleString()
      }))
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else if (format === 'csv') {
      const headers = ['ID', 'Título', 'Mensaje', 'Tipo', 'Fecha', 'Leído'];
      const rows = notifications.map(n => [
        n.id,
        `"${n.title || ''}"`,
        `"${n.message || ''}"`,
        n.type,
        new Date(n.timestamp).toLocaleString(),
        n.read ? 'Sí' : 'No'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      return csvContent;
    }

    return data;
  }, [notifications]);

  // Limpiar notificaciones antiguas
  const cleanupOldNotifications = useCallback((days = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    setNotifications(prev => {
      const filtered = prev.filter(n => new Date(n.timestamp) > cutoffDate);
      const removedCount = prev.length - filtered.length;
      
      // Actualizar contador de no leídos
      const removedUnread = prev
        .filter(n => new Date(n.timestamp) <= cutoffDate && !n.read)
        .length;
      
      setUnreadCount(prevCount => Math.max(0, prevCount - removedUnread));
      
      return filtered;
    });
  }, []);

  return {
    // Estado
    notifications,
    unreadCount,
    settings,
    
    // Setters
    setNotifications,
    setSettings: updateSettings,
    
    // Acciones
    addNotification,
    addStockNotification,
    addSystemNotification,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    dismissAll,
    
    // Utilidades
    filterNotifications,
    groupByDate,
    getNotificationStats,
    checkLowStock,
    exportNotifications,
    cleanupOldNotifications,
    
    // Información
    hasNotifications: notifications.length > 0,
    hasUnread: unreadCount > 0,
    notificationCount: notifications.length
  };
};

export default useNotifications;