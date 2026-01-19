import { localStorageService } from './index';

const notificationService = {
  // Tipos de notificaciones
  TYPES: {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error',
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock',
    EXPIRING: 'expiring'
  },

  // Notificaciones activas
  activeNotifications: [],

  // Obtener todas las notificaciones
  getAllNotifications: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const notifications = localStorageService.get('notifications') || [];
      
      return {
        success: true,
        data: notifications,
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      throw error;
    }
  },

  // Obtener notificaciones no leídas
  getUnreadNotifications: async () => {
    try {
      const notifications = localStorageService.get('notifications') || [];
      const unread = notifications.filter(n => !n.read);
      
      return {
        success: true,
        data: unread,
        count: unread.length
      };
    } catch (error) {
      console.error('Error obteniendo notificaciones no leídas:', error);
      throw error;
    }
  },

  // Marcar notificación como leída
  markAsRead: async (notificationId) => {
    try {
      const notifications = localStorageService.get('notifications') || [];
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex !== -1) {
        notifications[notificationIndex].read = true;
        notifications[notificationIndex].readAt = new Date().toISOString();
        localStorageService.set('notifications', notifications);
      }
      
      return {
        success: true,
        message: 'Notificación marcada como leída'
      };
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      throw error;
    }
  },

  // Marcar todas como leídas
  markAllAsRead: async () => {
    try {
      const notifications = localStorageService.get('notifications') || [];
      
      notifications.forEach(notification => {
        if (!notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
        }
      });
      
      localStorageService.set('notifications', notifications);
      
      return {
        success: true,
        message: 'Todas las notificaciones marcadas como leídas'
      };
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      throw error;
    }
  },

  // Eliminar notificación
  deleteNotification: async (notificationId) => {
    try {
      let notifications = localStorageService.get('notifications') || [];
      const filteredNotifications = notifications.filter(n => n.id !== notificationId);
      
      localStorageService.set('notifications', filteredNotifications);
      
      return {
        success: true,
        message: 'Notificación eliminada'
      };
    } catch (error) {
      console.error('Error eliminando notificación:', error);
      throw error;
    }
  },

  // Eliminar todas las notificaciones
  deleteAllNotifications: async () => {
    try {
      localStorageService.set('notifications', []);
      
      return {
        success: true,
        message: 'Todas las notificaciones eliminadas'
      };
    } catch (error) {
      console.error('Error eliminando todas las notificaciones:', error);
      throw error;
    }
  },

  // Crear una nueva notificación
  createNotification: (type, title, message, metadata = {}) => {
    try {
      const notifications = localStorageService.get('notifications') || [];
      
      const newNotification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        title,
        message,
        metadata,
        read: false,
        createdAt: new Date().toISOString(),
        icon: notificationService.getIconForType(type)
      };
      
      notifications.unshift(newNotification); // Agregar al inicio
      
      // Mantener máximo 100 notificaciones
      if (notifications.length > 100) {
        notifications.splice(100);
      }
      
      localStorageService.set('notifications', notifications);
      
      // Emitir evento para actualizar UI en tiempo real
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('newNotification', {
          detail: newNotification
        }));
      }
      
      return newNotification;
    } catch (error) {
      console.error('Error creando notificación:', error);
      return null;
    }
  },

  // Obtener icono según tipo
  getIconForType: (type) => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      low_stock: '📉',
      out_of_stock: '🛑',
      expiring: '⏰'
    };
    
    return icons[type] || '📢';
  },

  // Verificar y crear notificaciones automáticas
  checkAutomaticNotifications: async () => {
    try {
      // Obtener items del inventario
      const items = localStorageService.get('inventory_items') || [];
      
      // Verificar items con bajo stock
      const lowStockItems = items.filter(item => item.status === 'Bajo Stock');
      lowStockItems.forEach(item => {
        // Verificar si ya existe una notificación para este item
        const notifications = localStorageService.get('notifications') || [];
        const existingNotification = notifications.find(n => 
          n.metadata?.itemId === item.id && 
          n.type === 'low_stock' &&
          !n.read
        );
        
        if (!existingNotification) {
          notificationService.createNotification(
            'low_stock',
            'Bajo Stock Detectado',
            `${item.name} tiene bajo stock (${item.quantity} unidades restantes)`,
            { itemId: item.id, itemName: item.name, quantity: item.quantity }
          );
        }
      });
      
      // Verificar items agotados
      const outOfStockItems = items.filter(item => item.status === 'Agotado');
      outOfStockItems.forEach(item => {
        const notifications = localStorageService.get('notifications') || [];
        const existingNotification = notifications.find(n => 
          n.metadata?.itemId === item.id && 
          n.type === 'out_of_stock' &&
          !n.read
        );
        
        if (!existingNotification) {
          notificationService.createNotification(
            'out_of_stock',
            'Producto Agotado',
            `${item.name} está agotado. Es necesario reabastecer.`,
            { itemId: item.id, itemName: item.name }
          );
        }
      });
      
      return {
        success: true,
        lowStockCount: lowStockItems.length,
        outOfStockCount: outOfStockItems.length
      };
    } catch (error) {
      console.error('Error verificando notificaciones automáticas:', error);
      throw error;
    }
  },

  // Suscribirse a nuevas notificaciones
  subscribe: (callback) => {
    if (typeof window !== 'undefined') {
      const handler = (event) => {
        callback(event.detail);
      };
      
      window.addEventListener('newNotification', handler);
      
      // Retornar función para desuscribirse
      return () => {
        window.removeEventListener('newNotification', handler);
      };
    }
  }
};

export default notificationService;