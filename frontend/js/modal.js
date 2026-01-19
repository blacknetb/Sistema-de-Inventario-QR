/**
 * Sistema de modales
 */
class ModalManager {
    constructor() {
        this.modals = new Map();
        this.activeModal = null;
        this.modalStack = [];
        this.init();
    }
    
    init() {
        // Configurar eventos globales
        this.setupGlobalEvents();
        
        // Inicializar modales existentes en el DOM
        this.initExistingModals();
    }
    
    /**
     * Configurar eventos globales
     */
    setupGlobalEvents() {
        // Cerrar modal con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.hide(this.activeModal);
            }
        });
        
        // Cerrar modal al hacer click fuera
        document.addEventListener('click', (e) => {
            if (this.activeModal && e.target.classList.contains('modal')) {
                this.hide(this.activeModal);
            }
        });
    }
    
    /**
     * Inicializar modales existentes en el DOM
     */
    initExistingModals() {
        const modalElements = document.querySelectorAll('.modal');
        
        modalElements.forEach(modal => {
            const id = modal.id || `modal-${utils.generateId()}`;
            if (!modal.id) {
                modal.id = id;
            }
            
            this.register(modal);
            
            // Configurar botones de cierre
            const closeButtons = modal.querySelectorAll('.modal-close');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => this.hide(id));
            });
        });
    }
    
    /**
     * Registrar un modal
     */
    register(modalElement) {
        const id = modalElement.id;
        
        if (!id) {
            console.error('Modal debe tener un ID');
            return;
        }
        
        this.modals.set(id, {
            element: modalElement,
            isVisible: false,
            callbacks: {
                onShow: [],
                onHide: [],
                onConfirm: []
            }
        });
        
        return id;
    }
    
    /**
     * Crear un modal dinámicamente
     */
    create(options) {
        const id = options.id || `modal-${utils.generateId()}`;
        
        // Crear elemento modal
        const modal = document.createElement('div');
        modal.id = id;
        modal.className = 'modal';
        
        if (options.className) {
            modal.classList.add(...options.className.split(' '));
        }
        
        // Tamaño del modal
        let sizeClass = '';
        switch (options.size) {
            case 'sm':
                sizeClass = 'modal-sm';
                break;
            case 'lg':
                sizeClass = 'modal-lg';
                break;
            case 'xl':
                sizeClass = 'modal-xl';
                break;
            case 'fullscreen':
                sizeClass = 'modal-fullscreen';
                break;
        }
        
        // Crear contenido
        modal.innerHTML = `
            <div class="modal-content ${sizeClass}">
                ${options.header ? `
                    <div class="modal-header">
                        <h2>${options.header}</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                ` : ''}
                
                <div class="modal-body">
                    ${options.content || ''}
                </div>
                
                ${options.footer ? `
                    <div class="modal-footer">
                        ${options.footer}
                    </div>
                ` : ''}
            </div>
        `;
        
        // Agregar al DOM
        document.body.appendChild(modal);
        
        // Registrar el modal
        this.register(modal);
        
        // Configurar callbacks
        if (options.onShow) {
            this.onShow(id, options.onShow);
        }
        
        if (options.onHide) {
            this.onHide(id, options.onHide);
        }
        
        return id;
    }
    
    /**
     * Mostrar modal
     */
    show(modalId, data = null) {
        const modal = this.modals.get(modalId);
        if (!modal) {
            console.error(`Modal ${modalId} no encontrado`);
            return;
        }
        
        // Agregar a la pila
        if (this.activeModal && this.activeModal !== modalId) {
            this.modalStack.push(this.activeModal);
            this.hide(this.activeModal, false);
        }
        
        // Mostrar modal
        modal.element.classList.add('show');
        modal.isVisible = true;
        this.activeModal = modalId;
        
        // Prevenir scroll del body
        document.body.style.overflow = 'hidden';
        
        // Ejecutar callbacks
        modal.callbacks.onShow.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error en callback onShow:', error);
            }
        });
        
        // Enfocar primer elemento interactivo
        setTimeout(() => {
            const focusable = modal.element.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusable) {
                focusable.focus();
            }
        }, 100);
    }
    
    /**
     * Ocultar modal
     */
    hide(modalId, restorePrevious = true) {
        const modal = this.modals.get(modalId);
        if (!modal || !modal.isVisible) return;
        
        // Ocultar modal
        modal.element.classList.remove('show');
        modal.isVisible = false;
        
        // Ejecutar callbacks
        modal.callbacks.onHide.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error en callback onHide:', error);
            }
        });
        
        // Restaurar modal anterior si hay uno en la pila
        if (restorePrevious && this.modalStack.length > 0) {
            const previousModalId = this.modalStack.pop();
            setTimeout(() => {
                this.show(previousModalId);
            }, 300);
        } else {
            this.activeModal = null;
            document.body.style.overflow = '';
        }
    }
    
    /**
     * Ocultar todos los modales
     */
    hideAll() {
        this.modals.forEach((modal, id) => {
            if (modal.isVisible) {
                this.hide(id, false);
            }
        });
        
        this.modalStack = [];
        this.activeModal = null;
        document.body.style.overflow = '';
    }
    
    /**
     * Eliminar modal
     */
    remove(modalId) {
        const modal = this.modals.get(modalId);
        if (!modal) return;
        
        // Ocultar primero si está visible
        if (modal.isVisible) {
            this.hide(modalId, false);
        }
        
        // Eliminar del DOM
        if (modal.element.parentNode) {
            modal.element.parentNode.removeChild(modal.element);
        }
        
        // Eliminar del registro
        this.modals.delete(modalId);
        
        // Limpiar de la pila si está allí
        this.modalStack = this.modalStack.filter(id => id !== modalId);
    }
    
    /**
     * Agregar callback al mostrar
     */
    onShow(modalId, callback) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.callbacks.onShow.push(callback);
        }
    }
    
    /**
     * Agregar callback al ocultar
     */
    onHide(modalId, callback) {
        const modal = this.modals.get(modalId);
        if (modal) {
            modal.callbacks.onHide.push(callback);
        }
    }
    
    /**
     * Modal de confirmación
     */
    confirm(options) {
        return new Promise((resolve) => {
            const modalId = this.create({
                id: options.id || 'confirm-modal',
                className: 'confirmation-modal',
                header: options.title || 'Confirmar',
                content: `
                    <div class="confirmation-icon ${options.type || 'warning'}">
                        ${this.getConfirmationIcon(options.type)}
                    </div>
                    <div class="confirmation-title">${options.title || 'Confirmar'}</div>
                    <div class="confirmation-message">${options.message || '¿Está seguro?'}</div>
                `,
                footer: `
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        ${options.cancelText || 'Cancelar'}
                    </button>
                    <button type="button" class="btn ${this.getConfirmButtonClass(options.type)}" data-action="confirm">
                        ${options.confirmText || 'Confirmar'}
                    </button>
                `
            });
            
            // Configurar eventos de botones
            const modal = this.modals.get(modalId);
            const buttons = modal.element.querySelectorAll('[data-action]');
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    
                    if (action === 'confirm') {
                        resolve(true);
                    } else {
                        resolve(false);
                    }
                    
                    this.hide(modalId);
                });
            });
            
            this.show(modalId);
        });
    }
    
    /**
     * Modal de alerta
     */
    alert(options) {
        return new Promise((resolve) => {
            const modalId = this.create({
                id: options.id || 'alert-modal',
                className: 'alert-modal',
                header: options.title || 'Alerta',
                content: `
                    <div class="alert-icon">
                        ${this.getAlertIcon(options.type)}
                    </div>
                    <div class="alert-title">${options.title || 'Alerta'}</div>
                    <div class="alert-message">${options.message}</div>
                `,
                footer: `
                    <button type="button" class="btn ${this.getAlertButtonClass(options.type)}" data-action="ok">
                        ${options.okText || 'Aceptar'}
                    </button>
                `
            });
            
            // Configurar eventos de botones
            const modal = this.modals.get(modalId);
            const button = modal.element.querySelector('[data-action="ok"]');
            
            button.addEventListener('click', () => {
                resolve();
                this.hide(modalId);
            });
            
            this.show(modalId);
        });
    }
    
    /**
     * Modal de carga
     */
    showLoading(options = {}) {
        const modalId = this.create({
            id: options.id || 'loading-modal',
            className: 'loading-modal',
            content: `
                <div class="loading-content">
                    <div class="spinner"></div>
                    <div class="loading-text">${options.message || 'Cargando...'}</div>
                </div>
            `
        });
        
        this.show(modalId);
        return modalId;
    }
    
    /**
     * Ocultar modal de carga
     */
    hideLoading(modalId = 'loading-modal') {
        this.hide(modalId);
    }
    
    /**
     * Modal con formulario
     */
    form(options) {
        return new Promise((resolve, reject) => {
            const modalId = this.create({
                id: options.id || 'form-modal',
                className: 'form-modal',
                header: options.title || 'Formulario',
                content: options.content || '',
                footer: `
                    <button type="button" class="btn btn-secondary" data-action="cancel">
                        ${options.cancelText || 'Cancelar'}
                    </button>
                    <button type="submit" class="btn btn-primary" data-action="submit">
                        ${options.submitText || 'Guardar'}
                    </button>
                `
            });
            
            const modal = this.modals.get(modalId);
            const form = modal.element.querySelector('form');
            const buttons = modal.element.querySelectorAll('[data-action]');
            
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    resolve(data);
                    this.hide(modalId);
                });
            }
            
            buttons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const action = e.target.dataset.action;
                    
                    if (action === 'cancel') {
                        reject(new Error('Cancelado por el usuario'));
                        this.hide(modalId);
                    }
                });
            });
            
            this.show(modalId);
        });
    }
    
    /**
     * Obtener ícono para confirmación
     */
    getConfirmationIcon(type) {
        const icons = {
            'success': '✅',
            'warning': '⚠️',
            'danger': '❌',
            'info': 'ℹ️'
        };
        
        return icons[type] || '❓';
    }
    
    /**
     * Obtener clase para botón de confirmación
     */
    getConfirmButtonClass(type) {
        const classes = {
            'success': 'btn-success',
            'warning': 'btn-warning',
            'danger': 'btn-danger',
            'info': 'btn-info'
        };
        
        return classes[type] || 'btn-primary';
    }
    
    /**
     * Obtener ícono para alerta
     */
    getAlertIcon(type) {
        const icons = {
            'success': '✅',
            'warning': '⚠️',
            'danger': '❌',
            'info': 'ℹ️'
        };
        
        return icons[type] || '🔔';
    }
    
    /**
     * Obtener clase para botón de alerta
     */
    getAlertButtonClass(type) {
        const classes = {
            'success': 'btn-success',
            'warning': 'btn-warning',
            'danger': 'btn-danger',
            'info': 'btn-info'
        };
        
        return classes[type] || 'btn-primary';
    }
    
    /**
     * Verificar si hay un modal visible
     */
    isAnyModalVisible() {
        return this.activeModal !== null;
    }
    
    /**
     * Obtener modal activo
     */
    getActiveModal() {
        return this.activeModal;
    }
    
    /**
     * Obtener todos los modales
     */
    getAllModals() {
        return Array.from(this.modals.keys());
    }
}

// Crear instancia global del gestor de modales
const modalManager = new ModalManager();

// Funciones auxiliares globales para compatibilidad
window.showModal = function(modalId, data) {
    return modalManager.show(modalId, data);
};

window.hideModal = function(modalId) {
    return modalManager.hide(modalId);
};

window.confirmModal = function(options) {
    return modalManager.confirm(options);
};

window.alertModal = function(options) {
    return modalManager.alert(options);
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = modalManager;
} else {
    window.modalManager = modalManager;
}