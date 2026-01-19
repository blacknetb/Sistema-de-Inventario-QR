/**
 * Sistema de notificaciones
 */

class NotificationSystem {
    constructor() {
        this.containerId = 'notificationContainer';
        this.defaultOptions = {
            position: 'top-right',
            duration: 5000,
            animation: true,
            closeButton: true,
            maxNotifications: 5
        };
        
        this.notifications = [];
        this.initializeContainer();
    }
    
    /**
     * Inicializa el contenedor de notificaciones
     */
    initializeContainer() {
        let container = document.getElementById(this.containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = this.containerId;
            container.className = `notification-container ${this.defaultOptions.position}`;
            document.body.appendChild(container);
        }
        
        this.container = container;
    }
    
    /**
     * Muestra una notificación
     * @param {string} message - Mensaje a mostrar
     * @param {string} type - Tipo de notificación (success, error, warning, info)
     * @param {object} options - Opciones adicionales
     */
    show(message, type = 'info', options = {}) {
        const finalOptions = { ...this.defaultOptions, ...options };
        
        // Crear ID único para la notificación
        const id = 'notification_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${type}`;
        
        // Icono según el tipo
        const icon = this.getIconForType(type);
        
        // Contenido de la notificación
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">${icon}</div>
                <div class="notification-message">${message}</div>
            </div>
            ${finalOptions.closeButton ? '<button class="notification-close">&times;</button>' : ''}
        `;
        
        // Agregar al contenedor
        this.container.appendChild(notification);
        
        // Agregar a la lista de notificaciones activas
        this.notifications.push({
            id: id,
            element: notification,
            timeout: null
        });
        
        // Animación de entrada
        if (finalOptions.animation) {
            setTimeout(() => {
                notification.classList.add('show');
            }, 10);
        }
        
        // Configurar auto-ocultar
        if (finalOptions.duration > 0) {
            const timeout = setTimeout(() => {
                this.remove(id);
            }, finalOptions.duration);
            
            // Guardar referencia al timeout
            const notifIndex = this.notifications.findIndex(n => n.id === id);
            if (notifIndex !== -1) {
                this.notifications[notifIndex].timeout = timeout;
            }
        }
        
        // Configurar botón de cerrar
        if (finalOptions.closeButton) {
            const closeBtn = notification.querySelector('.notification-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.remove(id));
            }
        }
        
        // Configurar cierre al hacer clic en la notificación
        notification.addEventListener('click', (e) => {
            if (e.target !== notification.querySelector('.notification-close')) {
                this.remove(id);
            }
        });
        
        // Limitar número máximo de notificaciones
        this.limitNotifications(finalOptions.maxNotifications);
        
        return id;
    }
    
    /**
     * Obtiene el icono para un tipo de notificación
     * @param {string} type - Tipo de notificación
     * @returns {string} Icono HTML
     */
    getIconForType(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        
        return icons[type] || icons.info;
    }
    
    /**
     * Elimina una notificación
     * @param {string} id - ID de la notificación
     */
    remove(id) {
        const notification = this.notifications.find(n => n.id === id);
        
        if (notification) {
            // Limpiar timeout si existe
            if (notification.timeout) {
                clearTimeout(notification.timeout);
            }
            
            // Animación de salida
            notification.element.classList.remove('show');
            
            // Eliminar después de la animación
            setTimeout(() => {
                if (notification.element.parentNode) {
                    notification.element.parentNode.removeChild(notification.element);
                }
                
                // Eliminar de la lista
                const index = this.notifications.findIndex(n => n.id === id);
                if (index !== -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }
    
    /**
     * Limita el número de notificaciones visibles
     * @param {number} max - Número máximo de notificaciones
     */
    limitNotifications(max) {
        if (this.notifications.length > max) {
            const toRemove = this.notifications.slice(0, this.notifications.length - max);
            toRemove.forEach(notification => {
                this.remove(notification.id);
            });
        }
    }
    
    /**
     * Elimina todas las notificaciones
     */
    clearAll() {
        // Crear copia de la lista para evitar problemas de iteración
        const notificationsToRemove = [...this.notifications];
        notificationsToRemove.forEach(notification => {
            this.remove(notification.id);
        });
    }
    
    /**
     * Muestra una notificación de éxito
     * @param {string} message - Mensaje a mostrar
     * @param {object} options - Opciones adicionales
     */
    success(message, options = {}) {
        return this.show(message, 'success', options);
    }
    
    /**
     * Muestra una notificación de error
     * @param {string} message - Mensaje a mostrar
     * @param {object} options - Opciones adicionales
     */
    error(message, options = {}) {
        return this.show(message, 'error', options);
    }
    
    /**
     * Muestra una notificación de advertencia
     * @param {string} message - Mensaje a mostrar
     * @param {object} options - Opciones adicionales
     */
    warning(message, options = {}) {
        return this.show(message, 'warning', options);
    }
    
    /**
     * Muestra una notificación informativa
     * @param {string} message - Mensaje a mostrar
     * @param {object} options - Opciones adicionales
     */
    info(message, options = {}) {
        return this.show(message, 'info', options);
    }
    
    /**
     * Muestra una notificación de carga
     * @param {string} message - Mensaje a mostrar
     * @param {object} options - Opciones adicionales
     */
    loading(message = 'Cargando...', options = {}) {
        const loadingOptions = {
            duration: 0, // No se auto-oculta
            closeButton: false,
            ...options
        };
        
        const id = this.show(`
            <div class="notification-loading">
                <div class="loading-spinner"></div>
                <span>${message}</span>
            </div>
        `, 'info', loadingOptions);
        
        return id;
    }
    
    /**
     * Actualiza una notificación de carga
     * @param {string} id - ID de la notificación
     * @param {string} message - Nuevo mensaje
     * @param {string} type - Nuevo tipo (opcional)
     */
    update(id, message, type = null) {
        const notification = this.notifications.find(n => n.id === id);
        
        if (notification) {
            const messageElement = notification.element.querySelector('.notification-message');
            if (messageElement) {
                messageElement.innerHTML = message;
            }
            
            if (type) {
                // Actualizar clase de tipo
                notification.element.className = notification.element.className.replace(
                    /notification-\w+/,
                    `notification-${type}`
                );
                
                // Actualizar icono
                const iconElement = notification.element.querySelector('.notification-icon');
                if (iconElement) {
                    iconElement.innerHTML = this.getIconForType(type);
                }
            }
        }
    }
    
    /**
     * Muestra una notificación de confirmación
     * @param {string} message - Mensaje a mostrar
     * @param {function} onConfirm - Función a ejecutar al confirmar
     * @param {function} onCancel - Función a ejecutar al cancelar
     * @param {object} options - Opciones adicionales
     */
    confirm(message, onConfirm, onCancel = null, options = {}) {
        const confirmOptions = {
            duration: 0,
            closeButton: false,
            ...options
        };
        
        const id = this.show(`
            <div class="notification-confirm">
                <div class="confirm-message">${message}</div>
                <div class="confirm-buttons">
                    <button class="btn btn-sm btn-primary confirm-yes">Sí</button>
                    <button class="btn btn-sm btn-secondary confirm-no">No</button>
                </div>
            </div>
        `, 'info', confirmOptions);
        
        // Configurar eventos de los botones
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            const yesBtn = notification.element.querySelector('.confirm-yes');
            const noBtn = notification.element.querySelector('.confirm-no');
            
            if (yesBtn) {
                yesBtn.addEventListener('click', () => {
                    if (onConfirm) onConfirm();
                    this.remove(id);
                });
            }
            
            if (noBtn) {
                noBtn.addEventListener('click', () => {
                    if (onCancel) onCancel();
                    this.remove(id);
                });
            }
        }
        
        return id;
    }
    
    /**
     * Muestra una notificación con acciones personalizadas
     * @param {string} message - Mensaje a mostrar
     * @param {Array} actions - Array de acciones [{text: '', callback: function, class: ''}]
     * @param {object} options - Opciones adicionales
     */
    actions(message, actions = [], options = {}) {
        const actionsOptions = {
            duration: 0,
            closeButton: true,
            ...options
        };
        
        const actionsHTML = actions.map(action => `
            <button class="btn btn-sm ${action.class || 'btn-secondary'} notification-action" 
                    data-action="${action.text}">
                ${action.text}
            </button>
        `).join('');
        
        const id = this.show(`
            <div class="notification-actions">
                <div class="actions-message">${message}</div>
                <div class="actions-buttons">${actionsHTML}</div>
            </div>
        `, 'info', actionsOptions);
        
        // Configurar eventos de los botones
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            const actionButtons = notification.element.querySelectorAll('.notification-action');
            actionButtons.forEach(button => {
                const actionText = button.getAttribute('data-action');
                const action = actions.find(a => a.text === actionText);
                
                if (action && action.callback) {
                    button.addEventListener('click', () => {
                        action.callback();
                        this.remove(id);
                    });
                }
            });
        }
        
        return id;
    }
    
    /**
     * Muestra una notificación con progreso
     * @param {string} message - Mensaje a mostrar
     * @param {number} progress - Progreso (0-100)
     * @param {object} options - Opciones adicionales
     */
    progress(message, progress = 0, options = {}) {
        const progressOptions = {
            duration: 0,
            closeButton: false,
            ...options
        };
        
        const id = this.show(`
            <div class="notification-progress">
                <div class="progress-message">${message}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%"></div>
                </div>
                <div class="progress-text">${progress}%</div>
            </div>
        `, 'info', progressOptions);
        
        return id;
    }
    
    /**
     * Actualiza una notificación de progreso
     * @param {string} id - ID de la notificación
     * @param {number} progress - Nuevo progreso (0-100)
     * @param {string} message - Nuevo mensaje (opcional)
     */
    updateProgress(id, progress, message = null) {
        const notification = this.notifications.find(n => n.id === id);
        
        if (notification) {
            const progressFill = notification.element.querySelector('.progress-fill');
            const progressText = notification.element.querySelector('.progress-text');
            const progressMessage = notification.element.querySelector('.progress-message');
            
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
            
            if (progressText) {
                progressText.textContent = `${progress}%`;
            }
            
            if (message && progressMessage) {
                progressMessage.textContent = message;
            }
        }
    }
    
    /**
     * Configura notificaciones globales para la aplicación
     */
    setupGlobalNotifications() {
        // Interceptar errores no manejados
        window.addEventListener('error', (event) => {
            this.error(`Error no manejado: ${event.message}`);
        });
        
        // Interceptar promesas rechazadas no manejadas
        window.addEventListener('unhandledrejection', (event) => {
            this.error(`Promesa rechazada: ${event.reason?.message || event.reason}`);
        });
        
        // Notificación de conexión
        window.addEventListener('online', () => {
            this.success('Conexión restablecida');
        });
        
        window.addEventListener('offline', () => {
            this.warning('Sin conexión a internet', { duration: 0 });
        });
        
        // Notificación de copia al portapapeles
        document.addEventListener('copy', () => {
            this.info('Copiado al portapapeles');
        });
    }
}

// Instancia global del sistema de notificaciones
const notificationSystem = new NotificationSystem();

// Función de conveniencia para uso global
function showNotification(message, type = 'info', options = {}) {
    return notificationSystem.show(message, type, options);
}

// Funciones específicas de tipo
function showSuccess(message, options = {}) {
    return notificationSystem.success(message, options);
}

function showError(message, options = {}) {
    return notificationSystem.error(message, options);
}

function showWarning(message, options = {}) {
    return notificationSystem.warning(message, options);
}

function showInfo(message, options = {}) {
    return notificationSystem.info(message, options);
}

function showLoading(message = 'Cargando...', options = {}) {
    return notificationSystem.loading(message, options);
}

function showConfirm(message, onConfirm, onCancel = null, options = {}) {
    return notificationSystem.confirm(message, onConfirm, onCancel, options);
}

// Configurar notificaciones globales al cargar
document.addEventListener('DOMContentLoaded', function() {
    notificationSystem.setupGlobalNotifications();
});

// Exportar funciones
window.notificationSystem = notificationSystem;
window.showNotification = showNotification;
window.showSuccess = showSuccess;
window.showError = showError;
window.showWarning = showWarning;
window.showInfo = showInfo;
window.showLoading = showLoading;
window.showConfirm = showConfirm;