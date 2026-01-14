/**
 * Servicio de Notificaciones para la aplicación de Inventario QR
 * Proporciona una API unificada para mostrar notificaciones al usuario
 */

// ✅ MEJORA: Sistema de notificaciones con persistencia opcional
const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Almacenamiento para notificaciones persistentes
const PERSISTENT_NOTIFICATIONS_KEY = 'inventory_qr_persistent_notifications';

class NotificationService {
  constructor() {
    this.loadingNotifications = new Map();
    this.init();
  }

  /**
   * Inicializar el servicio
   */
  init() {
    // Restaurar notificaciones persistentes
    this.restorePersistentNotifications();
    
    // Configurar listeners para cambios en el DOM
    if (typeof document !== 'undefined') {
      document.addEventListener('click', (e) => {
        // Cerrar notificaciones al hacer clic en el botón de cerrar
        if (e.target.matches('.notification-close')) {
          const notification = e.target.closest('.notification');
          if (notification) {
            notification.remove();
          }
        }
      });
    }
  }

  /**
   * Mostrar notificación
   */
  show(message, type = NOTIFICATION_TYPES.INFO, options = {}) {
    const {
      duration = type === NOTIFICATION_TYPES.LOADING ? 0 : 5000,
      persistent = false,
      id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dismissible = true,
      position = 'top-right',
      action = null,
      onClose = null
    } = options;

    // Si ya existe una notificación con el mismo ID, eliminarla primero
    const existing = document.getElementById(id);
    if (existing) {
      existing.remove();
    }

    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${type} notification-${position}`;
    
    // Agregar contenido
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-message">${this.escapeHtml(message)}</span>
        ${action ? `<button class="notification-action">${action.label}</button>` : ''}
        ${dismissible ? '<button class="notification-close">&times;</button>' : ''}
      </div>
    `;

    // Agregar al DOM
    const container = this.getNotificationContainer(position);
    container.appendChild(notification);

    // Animar entrada
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Configurar acción
    if (action) {
      const actionBtn = notification.querySelector('.notification-action');
      actionBtn.addEventListener('click', (e) => {
        e.preventDefault();
        action.handler();
        if (action.dismissOnClick !== false) {
          this.dismiss(id);
        }
      });
    }

    // Auto-desaparición
    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    // Guardar si es persistente
    if (persistent) {
      this.savePersistentNotification(id, message, type, options);
    }

    // Configurar callback de cierre
    notification._onClose = onClose;

    return id;
  }

  /**
   * Mostrar notificación de éxito
   */
  success(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.SUCCESS, options);
  }

  /**
   * Mostrar notificación de error
   */
  error(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.ERROR, options);
  }

  /**
   * Mostrar notificación de advertencia
   */
  warning(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.WARNING, options);
  }

  /**
   * Mostrar notificación informativa
   */
  info(message, options = {}) {
    return this.show(message, NOTIFICATION_TYPES.INFO, options);
  }

  /**
   * Mostrar notificación de carga
   */
  loading(message = 'Cargando...', options = {}) {
    const id = this.show(message, NOTIFICATION_TYPES.LOADING, {
      duration: 0,
      dismissible: false,
      ...options
    });
    
    this.loadingNotifications.set(id, true);
    return id;
  }

  /**
   * Ocultar notificación de carga
   */
  dismissLoading(id = null) {
    if (id) {
      this.dismiss(id);
      this.loadingNotifications.delete(id);
    } else {
      // Ocultar todas las notificaciones de carga
      this.loadingNotifications.forEach((_, loadingId) => {
        this.dismiss(loadingId);
      });
      this.loadingNotifications.clear();
    }
  }

  /**
   * Ocultar notificación específica
   */
  dismiss(id) {
    const notification = document.getElementById(id);
    if (notification) {
      notification.classList.remove('show');
      notification.classList.add('hide');
      
      // Ejecutar callback de cierre si existe
      if (notification._onClose) {
        notification._onClose();
      }
      
      // Eliminar después de la animación
      setTimeout(() => {
        notification.remove();
      }, 300);

      // Eliminar de persistentes
      this.removePersistentNotification(id);
      
      // Eliminar de loading notifications
      this.loadingNotifications.delete(id);
    }
  }

  /**
   * Ocultar todas las notificaciones
   */
  dismissAll() {
    const notifications = document.querySelectorAll('.notification');
    notifications.forEach(notification => {
      const id = notification.id;
      this.dismiss(id);
    });
    
    this.loadingNotifications.clear();
  }

  /**
   * Mostrar diálogo de confirmación
   */
  confirm(message, options = {}) {
    return new Promise((resolve) => {
      const {
        title = 'Confirmar',
        confirmText = 'Aceptar',
        cancelText = 'Cancelar',
        destructive = false
      } = options;

      // Crear overlay
      const overlay = document.createElement('div');
      overlay.className = 'notification-overlay';
      
      // Crear diálogo
      const dialog = document.createElement('div');
      dialog.className = 'notification-dialog';
      
      dialog.innerHTML = `
        <div class="dialog-header">
          <h3>${this.escapeHtml(title)}</h3>
          <button class="dialog-close">&times;</button>
        </div>
        <div class="dialog-body">
          <p>${this.escapeHtml(message)}</p>
        </div>
        <div class="dialog-footer">
          <button class="dialog-button dialog-button-cancel">${cancelText}</button>
          <button class="dialog-button dialog-button-confirm ${destructive ? 'destructive' : ''}">${confirmText}</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      // Animar entrada
      setTimeout(() => {
        overlay.classList.add('show');
        dialog.classList.add('show');
      }, 10);

      // Configurar botones
      const closeBtn = dialog.querySelector('.dialog-close');
      const cancelBtn = dialog.querySelector('.dialog-button-cancel');
      const confirmBtn = dialog.querySelector('.dialog-button-confirm');

      const closeDialog = (result) => {
        overlay.classList.remove('show');
        dialog.classList.remove('show');
        
        setTimeout(() => {
          overlay.remove();
          resolve(result);
        }, 300);
      };

      closeBtn.addEventListener('click', () => closeDialog(false));
      cancelBtn.addEventListener('click', () => closeDialog(false));
      confirmBtn.addEventListener('click', () => closeDialog(true));

      // Cerrar con ESC
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          closeDialog(false);
          document.removeEventListener('keydown', handleEscape);
        }
      };
      document.addEventListener('keydown', handleEscape);

      // Cerrar al hacer clic fuera del diálogo
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          closeDialog(false);
        }
      });
    });
  }

  /**
   * Obtener contenedor de notificaciones
   */
  getNotificationContainer(position = 'top-right') {
    const containerId = `notification-container-${position}`;
    let container = document.getElementById(containerId);
    
    if (!container) {
      container = document.createElement('div');
      container.id = containerId;
      container.className = 'notification-container';
      document.body.appendChild(container);
    }
    
    return container;
  }

  /**
   * Guardar notificación persistente
   */
  savePersistentNotification(id, message, type, options) {
    try {
      const stored = localStorage.getItem(PERSISTENT_NOTIFICATIONS_KEY);
      const notifications = stored ? JSON.parse(stored) : {};
      
      notifications[id] = {
        message,
        type,
        options: {
          ...options,
          persistent: true
        },
        timestamp: Date.now()
      };
      
      localStorage.setItem(PERSISTENT_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.warn('Error guardando notificación persistente:', error);
    }
  }

  /**
   * Eliminar notificación persistente
   */
  removePersistentNotification(id) {
    try {
      const stored = localStorage.getItem(PERSISTENT_NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        delete notifications[id];
        localStorage.setItem(PERSISTENT_NOTIFICATIONS_KEY, JSON.stringify(notifications));
      }
    } catch (error) {
      console.warn('Error eliminando notificación persistente:', error);
    }
  }

  /**
   * Restaurar notificaciones persistentes
   */
  restorePersistentNotifications() {
    try {
      const stored = localStorage.getItem(PERSISTENT_NOTIFICATIONS_KEY);
      if (stored) {
        const notifications = JSON.parse(stored);
        const now = Date.now();
        
        Object.entries(notifications).forEach(([id, notification]) => {
          // Eliminar notificaciones antiguas (más de 24 horas)
          if (now - notification.timestamp > 24 * 60 * 60 * 1000) {
            delete notifications[id];
            return;
          }
          
          // Mostrar notificación
          this.show(
            notification.message,
            notification.type,
            notification.options
          );
        });
        
        // Actualizar almacenamiento
        localStorage.setItem(PERSISTENT_NOTIFICATIONS_KEY, JSON.stringify(notifications));
      }
    } catch (error) {
      console.warn('Error restaurando notificaciones persistentes:', error);
    }
  }

  /**
   * Escapar HTML para prevenir XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Verificar si hay notificaciones de carga activas
   */
  isLoading() {
    return this.loadingNotifications.size > 0;
  }

  /**
   * Obtener estadísticas de notificaciones
   */
  getStats() {
    const containers = document.querySelectorAll('.notification-container');
    const visibleCount = document.querySelectorAll('.notification.show').length;
    
    return {
      visible: visibleCount,
      loading: this.loadingNotifications.size,
      containers: containers.length
    };
  }
}

// Exportar instancia única
const notificationService = new NotificationService();
export default notificationService;