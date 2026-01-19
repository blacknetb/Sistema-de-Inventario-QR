import { MESSAGES } from './constants';

/**
 * Sistema de notificaciones
 */
class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.subscribers = [];
    this.nextId = 1;
  }
  
  /**
   * Suscribirse a notificaciones
   * @param {Function} callback - Función a ejecutar cuando llegue una notificación
   * @returns {Function} Función para desuscribirse
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
  
  /**
   * Notificar a todos los suscriptores
   * @param {object} notification - Notificación a enviar
   */
  notifySubscribers(notification) {
    this.subscribers.forEach(callback => {
      callback(notification);
    });
  }
  
  /**
   * Crear una notificación
   * @param {object} options - Opciones de la notificación
   */
  createNotification(options) {
    const {
      type = 'info',
      title,
      message,
      duration = 5000,
      action,
      persist = false
    } = options;
    
    const notification = {
      id: this.nextId++,
      type,
      title: title || this.getDefaultTitle(type),
      message,
      duration,
      action,
      persist,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    this.notifications.unshift(notification);
    this.notifySubscribers(notification);
    
    // Auto-eliminar si no es persistente
    if (!persist && duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, duration);
    }
    
    return notification;
  }
  
  /**
   * Obtener título por defecto según el tipo
   */
  getDefaultTitle(type) {
    const titles = {
      success: 'Éxito',
      error: 'Error',
      warning: 'Advertencia',
      info: 'Información'
    };
    
    return titles[type] || 'Notificación';
  }
  
  /**
   * Notificación de éxito
   */
  success(message, options = {}) {
    return this.createNotification({
      type: 'success',
      message,
      ...options
    });
  }
  
  /**
   * Notificación de error
   */
  error(message, options = {}) {
    return this.createNotification({
      type: 'error',
      message,
      ...options
    });
  }
  
  /**
   * Notificación de advertencia
   */
  warning(message, options = {}) {
    return this.createNotification({
      type: 'warning',
      message,
      ...options
    });
  }
  
  /**
   * Notificación informativa
   */
  info(message, options = {}) {
    return this.createNotification({
      type: 'info',
      message,
      ...options
    });
  }
  
  /**
   * Eliminar una notificación
   */
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifySubscribers({ type: 'removed', id });
  }
  
  /**
   * Marcar notificación como leída
   */
  markAsRead(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifySubscribers({ type: 'updated', notification });
    }
  }
  
  /**
   * Marcar todas como leídas
   */
  markAllAsRead() {
    this.notifications.forEach(n => {
      n.read = true;
    });
    this.notifySubscribers({ type: 'allRead' });
  }
  
  /**
   * Eliminar todas las notificaciones
   */
  clearAll() {
    this.notifications = [];
    this.notifySubscribers({ type: 'cleared' });
  }
  
  /**
   * Obtener notificaciones no leídas
   */
  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }
  
  /**
   * Obtener todas las notificaciones
   */
  getAll() {
    return [...this.notifications];
  }
  
  /**
   * Obtener notificaciones recientes
   */
  getRecent(limit = 10) {
    return this.notifications.slice(0, limit);
  }
  
  /**
   * Notificaciones predefinidas para el inventario
   */
  
  productAdded(productName) {
    return this.success(`Producto "${productName}" agregado exitosamente`, {
      title: 'Producto Agregado'
    });
  }
  
  productUpdated(productName) {
    return this.success(`Producto "${productName}" actualizado exitosamente`, {
      title: 'Producto Actualizado'
    });
  }
  
  productDeleted(productName) {
    return this.info(`Producto "${productName}" eliminado`, {
      title: 'Producto Eliminado'
    });
  }
  
  lowStockWarning(productName, quantity) {
    return this.warning(`Stock bajo: "${productName}" tiene solo ${quantity} unidades`, {
      title: 'Stock Bajo',
      persist: true
    });
  }
  
  outOfStockAlert(productName) {
    return this.error(`Producto agotado: "${productName}" necesita reposición`, {
      title: 'Producto Agotado',
      persist: true
    });
  }
  
  inventoryExported(format) {
    return this.success(`Inventario exportado en formato ${format.toUpperCase()}`, {
      title: 'Exportación Exitosa'
    });
  }
  
  networkError() {
    return this.error(MESSAGES.ERROR.NETWORK_ERROR, {
      title: 'Error de Conexión',
      duration: 8000
    });
  }
  
  validationError(field) {
    return this.error(`Por favor verifica el campo: ${field}`, {
      title: 'Error de Validación'
    });
  }
}

// Instancia singleton
const notificationSystem = new NotificationSystem();

export default notificationSystem;