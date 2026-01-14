// ============================================
// APLICACIÓN PRINCIPAL - SISTEMA DE INVENTARIO QR
// ============================================

const App = {
    // Configuración de la aplicación
    config: window.AppConfig,
    
    // Estado de la aplicación
    state: {
        isLoading: true,
        isAuthenticated: false,
        currentUser: null,
        currentRoute: '/',
        sidebarCollapsed: false,
        theme: 'light',
        notifications: []
    },
    
    // Elementos del DOM
    elements: {
        root: null,
        loading: null,
        sidebar: null,
        header: null,
        main: null,
        footer: null
    },
    
    // Módulos de la aplicación
    modules: {
        auth: null,
        products: null,
        inventory: null,
        scanner: null,
        reports: null,
        settings: null
    },
    
    // =============== INICIALIZACIÓN ===============
    
    /**
     * Inicializa la aplicación
     */
    init: function() {
        console.log('🚀 Inicializando Sistema de Inventario QR...');
        
        // Inicializar elementos del DOM
        this.initElements();
        
        // Inicializar estado
        this.initState();
        
        // Inicializar eventos
        this.initEvents();
        
        // Inicializar módulos
        this.initModules();
        
        // Verificar autenticación
        this.checkAuthentication();
        
        // Inicializar tema
        this.initTheme();
        
        // Cargar ruta inicial
        this.loadRoute();
        
        // Ocultar pantalla de carga
        this.hideLoading();
        
        console.log('✅ Aplicación inicializada correctamente');
    },
    
    /**
     * Inicializa elementos del DOM
     */
    initElements: function() {
        this.elements = {
            root: document.getElementById('root'),
            loading: document.getElementById('app-loading')
        };
        
        // Verificar elementos esenciales
        if (!this.elements.root) {
            throw new Error('Elemento #root no encontrado en el DOM');
        }
    },
    
    /**
     * Inicializa el estado de la aplicación
     */
    initState: function() {
        // Cargar estado desde localStorage
        const savedState = Utils.Storage.get('app_state');
        if (savedState) {
            this.state = { ...this.state, ...savedState };
        }
        
        // Cargar usuario actual
        this.state.currentUser = window.Api.getCurrentUser();
        this.state.isAuthenticated = window.Api.isAuthenticated();
        
        // Obtener ruta actual
        this.state.currentRoute = window.location.pathname || '/';
        
        // Detectar tema del sistema
        this.state.theme = this.detectSystemTheme();
    },
    
    /**
     * Inicializa eventos globales
     */
    initEvents: function() {
        // Eventos de navegación
        window.addEventListener('popstate', () => {
            this.state.currentRoute = window.location.pathname;
            this.loadRoute();
        });
        
        // Eventos de conexión
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
        
        // Eventos de teclado
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
        
        // Eventos de cambio de tema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.state.theme === 'system') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
        
        // Evento de visibilidad de página
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handlePageVisible();
            }
        });
    },
    
    /**
     * Inicializa módulos de la aplicación
     */
    initModules: function() {
        this.modules = {
            auth: new AuthModule(this),
            products: new ProductsModule(this),
            inventory: new InventoryModule(this),
            scanner: new ScannerModule(this),
            reports: new ReportsModule(this),
            settings: new SettingsModule(this)
        };
    },
    
    // =============== AUTENTICACIÓN ===============
    
    /**
     * Verifica la autenticación del usuario
     */
    checkAuthentication: function() {
        const publicRoutes = [
            this.config.ROUTES.PUBLIC.LOGIN,
            this.config.ROUTES.PUBLIC.REGISTER,
            this.config.ROUTES.PUBLIC.FORGOT_PASSWORD,
            this.config.ROUTES.PUBLIC.RESET_PASSWORD
        ];
        
        const isPublicRoute = publicRoutes.some(route => 
            this.state.currentRoute.startsWith(route)
        );
        
        if (!this.state.isAuthenticated && !isPublicRoute) {
            this.navigateTo(this.config.ROUTES.PUBLIC.LOGIN);
            return;
        }
        
        if (this.state.isAuthenticated && isPublicRoute) {
            this.navigateTo(this.config.ROUTES.PRIVATE.DASHBOARD);
            return;
        }
    },
    
    /**
     * Maneja el inicio de sesión
     * @param {Object} credentials - Credenciales del usuario
     */
    async handleLogin(credentials) {
        try {
            this.showLoading('Iniciando sesión...');
            
            const result = await window.Api.login(credentials);
            
            // Actualizar estado
            this.state.isAuthenticated = true;
            this.state.currentUser = result.user;
            
            // Guardar estado
            this.saveState();
            
            // Mostrar notificación
            this.showNotification('success', 'Sesión iniciada correctamente');
            
            // Redirigir al dashboard
            this.navigateTo(this.config.ROUTES.PRIVATE.DASHBOARD);
            
        } catch (error) {
            this.showNotification('error', 'Error al iniciar sesión: ' + error.message);
            throw error;
        } finally {
            this.hideLoading();
        }
    },
    
    /**
     * Maneja el cierre de sesión
     */
    async handleLogout() {
        try {
            this.showLoading('Cerrando sesión...');
            
            await window.Api.logout();
            
            // Actualizar estado
            this.state.isAuthenticated = false;
            this.state.currentUser = null;
            
            // Guardar estado
            this.saveState();
            
            // Mostrar notificación
            this.showNotification('success', 'Sesión cerrada correctamente');
            
            // Redirigir al login
            this.navigateTo(this.config.ROUTES.PUBLIC.LOGIN);
            
        } catch (error) {
            this.showNotification('error', 'Error al cerrar sesión');
            throw error;
        } finally {
            this.hideLoading();
        }
    },
    
    // =============== NAVEGACIÓN ===============
    
    /**
     * Navega a una ruta específica
     * @param {string} path - Ruta de destino
     * @param {Object} params - Parámetros de la ruta
     */
    navigateTo(path, params = {}) {
        // Reemplazar parámetros en la ruta
        let finalPath = path;
        Object.keys(params).forEach(key => {
            finalPath = finalPath.replace(`:${key}`, params[key]);
        });
        
        // Actualizar estado
        this.state.currentRoute = finalPath;
        
        // Actualizar URL
        window.history.pushState({}, '', finalPath);
        
        // Cargar ruta
        this.loadRoute();
    },
    
    /**
     * Carga la ruta actual
     */
    loadRoute() {
        const route = this.state.currentRoute;
        
        // Mostrar indicador de carga
        this.showLoading('Cargando...');
        
        // Determinar qué módulo cargar
        let moduleToLoad = null;
        
        if (route.startsWith(this.config.ROUTES.PRIVATE.PRODUCTS.LIST)) {
            moduleToLoad = this.modules.products;
        } else if (route.startsWith(this.config.ROUTES.PRIVATE.INVENTORY.LIST)) {
            moduleToLoad = this.modules.inventory;
        } else if (route.startsWith(this.config.ROUTES.PRIVATE.SCANNER)) {
            moduleToLoad = this.modules.scanner;
        } else if (route.startsWith(this.config.ROUTES.PRIVATE.REPORTS)) {
            moduleToLoad = this.modules.reports;
        } else if (route.startsWith(this.config.ROUTES.PRIVATE.SETTINGS.GENERAL)) {
            moduleToLoad = this.modules.settings;
        } else if (route === this.config.ROUTES.PRIVATE.DASHBOARD) {
            moduleToLoad = this.modules.auth;
        } else if (route === this.config.ROUTES.PUBLIC.LOGIN) {
            moduleToLoad = this.modules.auth;
        } else {
            // Ruta no encontrada
            this.showNotFound();
            return;
        }
        
        // Cargar el módulo
        if (moduleToLoad && typeof moduleToLoad.load === 'function') {
            moduleToLoad.load(route).then(() => {
                this.hideLoading();
            }).catch(error => {
                console.error('Error cargando ruta:', error);
                this.showError('Error al cargar la página');
            });
        }
    },
    
    // =============== UI Y TEMAS ===============
    
    /**
     * Detecta el tema del sistema
     * @returns {string} - Tema detectado
     */
    detectSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    
    /**
     * Inicializa el tema
     */
    initTheme() {
        // Cargar tema guardado
        const savedTheme = Utils.Storage.get('theme');
        if (savedTheme) {
            this.state.theme = savedTheme;
        }
        
        // Aplicar tema
        this.applyTheme(this.state.theme);
    },
    
    /**
     * Cambia el tema
     * @param {string} theme - Nuevo tema
     */
    changeTheme(theme) {
        this.state.theme = theme;
        this.applyTheme(theme);
        Utils.Storage.set('theme', theme);
    },
    
    /**
     * Aplica el tema actual
     * @param {string} theme - Tema a aplicar
     */
    applyTheme(theme) {
        const finalTheme = theme === 'system' ? this.detectSystemTheme() : theme;
        document.documentElement.setAttribute('data-theme', finalTheme);
    },
    
    /**
     * Alterna el sidebar
     */
    toggleSidebar() {
        this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
        this.saveState();
        
        const sidebar = document.querySelector('.sidebar');
        const main = document.querySelector('.main-content');
        
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
        }
        
        if (main) {
            main.classList.toggle('collapsed');
        }
    },
    
    // =============== NOTIFICACIONES ===============
    
    /**
     * Muestra una notificación
     * @param {string} type - Tipo de notificación
     * @param {string} message - Mensaje de la notificación
     * @param {string} title - Título de la notificación (opcional)
     */
    showNotification(type, message, title = '') {
        const notification = {
            id: Date.now(),
            type: type,
            title: title,
            message: message,
            timestamp: new Date()
        };
        
        // Agregar a estado
        this.state.notifications.push(notification);
        
        // Limitar número de notificaciones
        if (this.state.notifications.length > this.config.NOTIFICATION_CONFIG.MAX_VISIBLE) {
            this.state.notifications.shift();
        }
        
        // Mostrar en UI
        this.renderNotification(notification);
        
        // Auto-remover después del tiempo configurado
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, this.config.NOTIFICATION_CONFIG.DURATION);
    },
    
    /**
     * Renderiza una notificación en el DOM
     * @param {Object} notification - Notificación a renderizar
     */
    renderNotification(notification) {
        const container = this.getNotificationContainer();
        const notificationElement = Utils.DOMUtils.createElement('div', {
            className: `notification notification-${notification.type}`,
            id: `notification-${notification.id}`,
            html: `
                ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
                <div class="notification-message">${notification.message}</div>
                <button class="notification-close">&times;</button>
            `,
            events: {
                click: (e) => {
                    if (e.target.classList.contains('notification-close')) {
                        this.removeNotification(notification.id);
                    }
                }
            }
        });
        
        container.appendChild(notificationElement);
        
        // Animar entrada
        setTimeout(() => {
            notificationElement.classList.add('show');
        }, 10);
    },
    
    /**
     * Elimina una notificación
     * @param {number} id - ID de la notificación
     */
    removeNotification(id) {
        // Remover del estado
        this.state.notifications = this.state.notifications.filter(n => n.id !== id);
        
        // Remover del DOM
        const element = document.getElementById(`notification-${id}`);
        if (element) {
            element.classList.remove('show');
            setTimeout(() => {
                if (element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }, 300);
        }
    },
    
    /**
     * Obtiene el contenedor de notificaciones
     * @returns {HTMLElement} - Contenedor de notificaciones
     */
    getNotificationContainer() {
        let container = document.querySelector('.notification-container');
        
        if (!container) {
            container = Utils.DOMUtils.createElement('div', {
                className: 'notification-container'
            });
            document.body.appendChild(container);
        }
        
        return container;
    },
    
    // =============== MANEJO DE ESTADO ===============
    
    /**
     * Guarda el estado actual
     */
    saveState() {
        Utils.Storage.set('app_state', {
            sidebarCollapsed: this.state.sidebarCollapsed,
            theme: this.state.theme
        });
    },
    
    /**
     * Actualiza el estado
     * @param {Object} updates - Actualizaciones del estado
     */
    updateState(updates) {
        this.state = { ...this.state, ...updates };
        this.saveState();
    },
    
    // =============== MANEJO DE ERRORES ===============
    
    /**
     * Muestra una página de error
     * @param {string} message - Mensaje de error
     */
    showError(message) {
        this.elements.root.innerHTML = `
            <div class="error-page">
                <div class="error-content">
                    <h1>Error</h1>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="App.navigateTo('/')">
                        Volver al inicio
                    </button>
                </div>
            </div>
        `;
    },
    
    /**
     * Muestra página no encontrada
     */
    showNotFound() {
        this.elements.root.innerHTML = `
            <div class="not-found-page">
                <div class="not-found-content">
                    <h1>404</h1>
                    <h2>Página no encontrada</h2>
                    <p>La página que buscas no existe o ha sido movida.</p>
                    <button class="btn btn-primary" onclick="App.navigateTo('/')">
                        Volver al inicio
                    </button>
                </div>
            </div>
        `;
    },
    
    // =============== MANEJO DE CARGA ===============
    
    /**
     * Muestra el indicador de carga
     * @param {string} message - Mensaje de carga (opcional)
     */
    showLoading(message = 'Cargando...') {
        this.state.isLoading = true;
        
        // Crear o actualizar overlay de carga
        let overlay = document.querySelector('.loading-overlay');
        
        if (!overlay) {
            overlay = Utils.DOMUtils.createElement('div', {
                className: 'loading-overlay',
                html: `
                    <div class="loading-content">
                        <div class="loading-spinner"></div>
                        <div class="loading-message">${message}</div>
                    </div>
                `
            });
            document.body.appendChild(overlay);
        } else {
            const messageElement = overlay.querySelector('.loading-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
    },
    
    /**
     * Oculta el indicador de carga
     */
    hideLoading() {
        this.state.isLoading = false;
        
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    },
    
    // =============== MANEJO DE EVENTOS ===============
    
    /**
     * Maneja conexión en línea
     */
    handleOnline() {
        this.showNotification('success', 'Conexión a internet restablecida');
        
        // Sincronizar datos pendientes
        this.syncPendingData();
    },
    
    /**
     * Maneja conexión fuera de línea
     */
    handleOffline() {
        this.showNotification('warning', 'Sin conexión a internet. Modo offline activado.');
    },
    
    /**
     * Maneja eventos de teclado
     * @param {KeyboardEvent} event - Evento de teclado
     */
    handleKeydown(event) {
        // Ctrl + K para buscar
        if (event.ctrlKey && event.key === 'k') {
            event.preventDefault();
            this.focusSearch();
        }
        
        // Escape para cerrar modales
        if (event.key === 'Escape') {
            this.closeModals();
        }
        
        // Ctrl + S para guardar
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            this.saveCurrentForm();
        }
    },
    
    /**
     * Maneja cuando la página se hace visible
     */
    handlePageVisible() {
        // Verificar autenticación
        this.checkAuthentication();
        
        // Sincronizar datos si es necesario
        if (this.state.isAuthenticated) {
            this.syncData();
        }
    },
    
    // =============== FUNCIONES DE UTILIDAD ===============
    
    /**
     * Sincroniza datos pendientes
     */
    async syncPendingData() {
        // Implementar sincronización de datos offline
        console.log('Sincronizando datos pendientes...');
    },
    
    /**
     * Sincroniza datos
     */
    async syncData() {
        // Implementar sincronización periódica
        console.log('Sincronizando datos...');
    },
    
    /**
     * Enfoca el campo de búsqueda
     */
    focusSearch() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    },
    
    /**
     * Cierra todos los modales abiertos
     */
    closeModals() {
        const modals = document.querySelectorAll('.modal.show');
        modals.forEach(modal => {
            modal.classList.remove('show');
        });
    },
    
    /**
     * Guarda el formulario actual
     */
    saveCurrentForm() {
        const form = document.querySelector('form');
        if (form) {
            const submitEvent = new Event('submit', { cancelable: true });
            form.dispatchEvent(submitEvent);
        }
    },
    
    // =============== RENDERIZADO DE PLANTILLAS ===============
    
    /**
     * Renderiza una plantilla
     * @param {string} template - Nombre de la plantilla
     * @param {Object} data - Datos para la plantilla
     * @returns {string} - HTML renderizado
     */
    renderTemplate(template, data = {}) {
        // En una aplicación real, esto usaría un motor de plantillas
        // Por ahora, usamos funciones simples
        
        const templates = {
            'dashboard': this.templates.dashboard(data),
            'login': this.templates.login(data),
            'products-list': this.templates.productsList(data),
            'product-form': this.templates.productForm(data)
            // Agregar más plantillas según sea necesario
        };
        
        return templates[template] || '<div>Plantilla no encontrada</div>';
    },
    
    // =============== PLANTILLAS ===============
    
    templates: {
        /**
         * Plantilla del dashboard
         * @param {Object} data - Datos del dashboard
         * @returns {string} - HTML del dashboard
         */
        dashboard: function(data) {
            return `
                <div class="app-container">
                    <header class="app-header">
                        <div class="container">
                            <div class="header-content">
                                <a href="#" class="logo" onclick="App.navigateTo('/')">
                                    <svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                    </svg>
                                    <span class="logo-text">Inventario QR</span>
                                </a>
                                
                                <nav class="nav-menu">
                                    <a href="#" class="nav-link ${data.currentRoute === '/' ? 'active' : ''}" 
                                       onclick="App.navigateTo('/')">
                                        Dashboard
                                    </a>
                                    <a href="#" class="nav-link ${data.currentRoute.startsWith('/products') ? 'active' : ''}" 
                                       onclick="App.navigateTo('/products')">
                                        Productos
                                    </a>
                                    <a href="#" class="nav-link ${data.currentRoute.startsWith('/inventory') ? 'active' : ''}" 
                                       onclick="App.navigateTo('/inventory')">
                                        Inventario
                                    </a>
                                    <a href="#" class="nav-link ${data.currentRoute === '/scanner' ? 'active' : ''}" 
                                       onclick="App.navigateTo('/scanner')">
                                        Escáner
                                    </a>
                                    <a href="#" class="nav-link ${data.currentRoute.startsWith('/reports') ? 'active' : ''}" 
                                       onclick="App.navigateTo('/reports')">
                                        Reportes
                                    </a>
                                </nav>
                                
                                <div class="user-menu">
                                    <div class="dropdown">
                                        <button class="user-avatar" onclick="App.toggleDropdown('user-menu')">
                                            ${data.user?.avatar || 
                                                `<span class="avatar">${data.user?.name?.charAt(0) || 'U'}</span>`}
                                        </button>
                                        <div class="dropdown-menu" id="user-menu-dropdown">
                                            <div class="dropdown-header">
                                                <div class="user-info">
                                                    <div class="user-name">${data.user?.name || 'Usuario'}</div>
                                                    <div class="user-email">${data.user?.email || 'usuario@ejemplo.com'}</div>
                                                </div>
                                            </div>
                                            <div class="dropdown-divider"></div>
                                            <a href="#" class="dropdown-item" onclick="App.navigateTo('/profile')">
                                                <i class="material-icons">person</i>
                                                Perfil
                                            </a>
                                            <a href="#" class="dropdown-item" onclick="App.navigateTo('/settings')">
                                                <i class="material-icons">settings</i>
                                                Configuración
                                            </a>
                                            <div class="dropdown-divider"></div>
                                            <a href="#" class="dropdown-item" onclick="App.handleLogout()">
                                                <i class="material-icons">logout</i>
                                                Cerrar Sesión
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </header>
                    
                    <div class="main-content">
                        <div class="container">
                            <div class="page-header">
                                <h1 class="page-title">Dashboard</h1>
                                <p class="page-subtitle">Bienvenido al sistema de gestión de inventario</p>
                            </div>
                            
                            <div class="stats-grid">
                                <div class="stat-card">
                                    <div class="stat-icon primary">
                                        <i class="material-icons">inventory</i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-value">${data.stats?.totalProducts || 0}</div>
                                        <div class="stat-label">Productos Totales</div>
                                        <div class="stat-change positive">
                                            <i class="material-icons">trending_up</i>
                                            <span>+12% desde ayer</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon success">
                                        <i class="material-icons">check_circle</i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-value">${data.stats?.availableStock || 0}</div>
                                        <div class="stat-label">Stock Disponible</div>
                                        <div class="stat-change positive">
                                            <i class="material-icons">trending_up</i>
                                            <span>+5% desde ayer</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon warning">
                                        <i class="material-icons">warning</i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-value">${data.stats?.lowStock || 0}</div>
                                        <div class="stat-label">Productos Bajos</div>
                                        <div class="stat-change negative">
                                            <i class="material-icons">trending_down</i>
                                            <span>-2% desde ayer</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="stat-card">
                                    <div class="stat-icon info">
                                        <i class="material-icons">attach_money</i>
                                    </div>
                                    <div class="stat-content">
                                        <div class="stat-value">$${Utils.NumberUtils.formatCurrency(data.stats?.totalValue || 0)}</div>
                                        <div class="stat-label">Valor Total</div>
                                        <div class="stat-change positive">
                                            <i class="material-icons">trending_up</i>
                                            <span>+8% desde ayer</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="quick-actions">
                                <h2 class="section-title">Acciones Rápidas</h2>
                                <div class="actions-grid">
                                    <a href="#" class="action-card" onclick="App.navigateTo('/products/new')">
                                        <div class="action-icon">
                                            <i class="material-icons">add_circle</i>
                                        </div>
                                        <h3 class="action-title">Agregar Producto</h3>
                                        <p class="action-description">Agrega un nuevo producto al inventario</p>
                                    </a>
                                    
                                    <a href="#" class="action-card" onclick="App.navigateTo('/scanner')">
                                        <div class="action-icon">
                                            <i class="material-icons">qr_code_scanner</i>
                                        </div>
                                        <h3 class="action-title">Escanear QR</h3>
                                        <p class="action-description">Escanea un código QR para consultar información</p>
                                    </a>
                                    
                                    <a href="#" class="action-card" onclick="App.navigateTo('/reports')">
                                        <div class="action-icon">
                                            <i class="material-icons">assessment</i>
                                        </div>
                                        <h3 class="action-title">Generar Reporte</h3>
                                        <p class="action-description">Genera reportes detallados del inventario</p>
                                    </a>
                                    
                                    <a href="#" class="action-card" onclick="App.navigateTo('/inventory/adjustments')">
                                        <div class="action-icon">
                                            <i class="material-icons">sync</i>
                                        </div>
                                        <h3 class="action-title">Ajustar Stock</h3>
                                        <p class="action-description">Realiza ajustes en el inventario</p>
                                    </a>
                                </div>
                            </div>
                            
                            <div class="recent-activity">
                                <h2 class="section-title">Actividad Reciente</h2>
                                <div class="activity-list">
                                    ${data.recentActivity?.map(activity => `
                                        <div class="activity-item">
                                            <div class="activity-icon">
                                                <i class="material-icons">${activity.icon}</i>
                                            </div>
                                            <div class="activity-content">
                                                <div class="activity-text">${activity.text}</div>
                                                <div class="activity-time">${Utils.DateUtils.timeAgo(activity.timestamp)}</div>
                                            </div>
                                        </div>
                                    `).join('') || '<p>No hay actividad reciente</p>'}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <footer class="app-footer">
                        <div class="container">
                            <div class="footer-content">
                                <div class="footer-section">
                                    <h3>Sistema de Inventario QR</h3>
                                    <p>Sistema profesional de gestión de inventario con códigos QR</p>
                                </div>
                                <div class="footer-section">
                                    <h3>Enlaces Rápidos</h3>
                                    <ul>
                                        <li><a href="#" onclick="App.navigateTo('/')">Dashboard</a></li>
                                        <li><a href="#" onclick="App.navigateTo('/products')">Productos</a></li>
                                        <li><a href="#" onclick="App.navigateTo('/inventory')">Inventario</a></li>
                                    </ul>
                                </div>
                                <div class="footer-section">
                                    <h3>Contacto</h3>
                                    <ul>
                                        <li>support@inventario-qr.com</li>
                                        <li>+1 (555) 123-4567</li>
                                    </ul>
                                </div>
                            </div>
                            <div class="copyright">
                                <p>© ${new Date().getFullYear()} Sistema de Inventario QR. Todos los derechos reservados.</p>
                                <p>Versión ${App.config.APP_VERSION}</p>
                            </div>
                        </div>
                    </footer>
                </div>
            `;
        },
        
        /**
         * Plantilla de inicio de sesión
         * @param {Object} data - Datos del login
         * @returns {string} - HTML del login
         */
        login: function(data) {
            return `
                <div class="login-page">
                    <div class="login-container">
                        <div class="login-card">
                            <div class="login-header">
                                <div class="logo-section">
                                    <div class="app-logo">
                                        <i class="material-icons logo-icon">qr_code_scanner</i>
                                    </div>
                                    <h1 class="app-title">Sistema de Inventario QR</h1>
                                    <p class="app-tagline">Gestión profesional de inventario</p>
                                </div>
                            </div>
                            
                            <div class="login-form-container">
                                <form id="login-form" onsubmit="App.handleLoginForm(event)">
                                    <div class="form-group">
                                        <label for="email" class="form-label">
                                            <i class="material-icons">email</i>
                                            Correo Electrónico
                                        </label>
                                        <input type="email" id="email" name="email" class="form-control" required 
                                               placeholder="usuario@ejemplo.com">
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="password" class="form-label">
                                            <i class="material-icons">lock</i>
                                            Contraseña
                                        </label>
                                        <div class="input-group">
                                            <input type="password" id="password" name="password" class="form-control" required 
                                                   placeholder="Ingresa tu contraseña">
                                            <button type="button" class="password-toggle" onclick="App.togglePassword('password')">
                                                <i class="material-icons">visibility</i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div class="form-options">
                                        <div class="checkbox-container">
                                            <input type="checkbox" id="remember-me" name="remember">
                                            <label for="remember-me" class="checkbox-label">Recordar sesión</label>
                                        </div>
                                        <a href="#" class="forgot-link" onclick="App.navigateTo('/forgot-password')">
                                            ¿Olvidaste tu contraseña?
                                        </a>
                                    </div>
                                    
                                    <div class="form-submit">
                                        <button type="submit" class="btn btn-primary btn-block">
                                            <i class="material-icons">login</i>
                                            Iniciar Sesión
                                        </button>
                                    </div>
                                    
                                    <div class="form-separator">
                                        <span class="separator-text">o</span>
                                    </div>
                                    
                                    <div class="demo-section">
                                        <button type="button" class="btn btn-warning btn-block" onclick="App.useDemoAccount()">
                                            <i class="material-icons">play_circle</i>
                                            Usar Cuenta Demo
                                        </button>
                                    </div>
                                    
                                    <div class="register-link-container">
                                        <p class="register-text">
                                            ¿No tienes una cuenta?
                                            <a href="#" class="register-link" onclick="App.navigateTo('/register')">
                                                Regístrate aquí
                                            </a>
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                        
                        <div class="login-footer">
                            <p class="footer-text">© ${new Date().getFullYear()} Sistema de Inventario QR</p>
                            <p class="footer-subtext">Versión ${App.config.APP_VERSION}</p>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    
    // =============== MÉTODOS PÚBLICOS ===============
    
    /**
     * Alterna un dropdown
     * @param {string} dropdownId - ID del dropdown
     */
    toggleDropdown: function(dropdownId) {
        const dropdown = document.getElementById(`${dropdownId}-dropdown`);
        if (dropdown) {
            dropdown.classList.toggle('show');
        }
    },
    
    /**
     * Alterna visibilidad de contraseña
     * @param {string} inputId - ID del input de contraseña
     */
    togglePassword: function(inputId) {
        const input = document.getElementById(inputId);
        const toggle = document.querySelector(`#${inputId} + .password-toggle .material-icons`);
        
        if (input.type === 'password') {
            input.type = 'text';
            toggle.textContent = 'visibility_off';
        } else {
            input.type = 'password';
            toggle.textContent = 'visibility';
        }
    },
    
    /**
     * Maneja el formulario de login
     * @param {Event} event - Evento del formulario
     */
    async handleLoginForm(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const credentials = {
            email: formData.get('email'),
            password: formData.get('password'),
            remember: formData.get('remember') === 'on'
        };
        
        await this.handleLogin(credentials);
    },
    
    /**
     * Usa una cuenta demo
     */
    async useDemoAccount() {
        const credentials = {
            email: 'demo@inventarioqr.com',
            password: 'demo123'
        };
        
        await this.handleLogin(credentials);
    }
};

// Exportar aplicación global
window.App = App;

// Módulos base (simplificados para el ejemplo)
class AuthModule {
    constructor(app) {
        this.app = app;
    }
    
    async load(route) {
        if (route === '/login') {
            this.renderLogin();
        } else if (route === '/') {
            this.renderDashboard();
        }
    }
    
    renderLogin() {
        this.app.elements.root.innerHTML = App.templates.login({
            currentRoute: '/login'
        });
    }
    
    async renderDashboard() {
        try {
            // Obtener datos del dashboard
            const stats = await this.getDashboardStats();
            const recentActivity = await this.getRecentActivity();
            
            this.app.elements.root.innerHTML = App.templates.dashboard({
                currentRoute: '/',
                user: this.app.state.currentUser,
                stats: stats,
                recentActivity: recentActivity
            });
        } catch (error) {
            this.app.showError('Error al cargar el dashboard');
        }
    }
    
    async getDashboardStats() {
        // En una aplicación real, esto vendría de la API
        return {
            totalProducts: 145,
            availableStock: 1250,
            lowStock: 12,
            totalValue: 45250.75
        };
    }
    
    async getRecentActivity() {
        // En una aplicación real, esto vendría de la API
        return [
            {
                icon: 'add_circle',
                text: 'Nuevo producto agregado: "Laptop Dell XPS 13"',
                timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutos atrás
            },
            {
                icon: 'inventory',
                text: 'Stock actualizado: "Mouse Logitech" -10 unidades',
                timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 minutos atrás
            },
            {
                icon: 'qr_code',
                text: 'Código QR generado para producto #PROD-1005',
                timestamp: new Date(Date.now() - 1000 * 60 * 60) // 1 hora atrás
            }
        ];
    }
}

// Otros módulos (estructura base)
class ProductsModule {
    constructor(app) {
        this.app = app;
    }
    
    async load(route) {
        // Implementar carga de productos
        this.app.elements.root.innerHTML = '<h1>Productos</h1>';
    }
}

class InventoryModule {
    constructor(app) {
        this.app = app;
    }
    
    async load(route) {
        // Implementar carga de inventario
        this.app.elements.root.innerHTML = '<h1>Inventario</h1>';
    }
}

class ScannerModule {
    constructor(app) {
        this.app = app;
    }
    
    async load(route) {
        // Implementar carga del scanner
        this.app.elements.root.innerHTML = '<h1>Escáner QR</h1>';
    }
}

class ReportsModule {
    constructor(app) {
        this.app = app;
    }
    
    async load(route) {
        // Implementar carga de reportes
        this.app.elements.root.innerHTML = '<h1>Reportes</h1>';
    }
}

class SettingsModule {
    constructor(app) {
        this.app = app;
    }
    
    async load(route) {
        // Implementar carga de configuración
        this.app.elements.root.innerHTML = '<h1>Configuración</h1>';
    }
}

// Log de carga
if (AppConfig.ENVIRONMENT.DEBUG) {
    console.log('✅ Aplicación principal cargada');
    console.log('📱 Módulos inicializados:', Object.keys(App.modules).length);
}