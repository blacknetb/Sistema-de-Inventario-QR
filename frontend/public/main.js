/**
 * Sistema de Inventario QR - Script Principal
 * Versión: 1.0.0
 * Autor: Inventario QR
 * Descripción: Script principal de inicialización y manejo de la aplicación
 */

// Verificar que la configuración esté cargada
if (!window.APP_CONFIG) {
    console.error('Error: La configuración de la aplicación no se ha cargado correctamente.');
    document.getElementById('app-loading').innerHTML = `
        <div class="error-container">
            <h2>Error de Configuración</h2>
            <p>No se pudo cargar la configuración de la aplicación.</p>
            <button onclick="location.reload()">Reintentar</button>
        </div>
    `;
    throw new Error('APP_CONFIG no está definido');
}

// Variables globales de la aplicación
const AppState = {
    isInitialized: false,
    isAuthenticated: false,
    user: null,
    theme: 'light',
    language: 'es',
    offlineMode: false
};

// Utilidades de la aplicación
const AppUtils = {
    // Formatear fechas
    formatDate: function(date, format = 'display') {
        if (!date) return '';
        
        const d = new Date(date);
        const config = window.APP_CONFIG.DATE_FORMATS;
        
        switch(format) {
            case 'display':
                return d.toLocaleDateString('es-MX');
            case 'display_time':
                return d.toLocaleString('es-MX');
            case 'api':
                return d.toISOString().split('T')[0];
            default:
                return d.toLocaleDateString('es-MX');
        }
    },
    
    // Formatear moneda
    formatCurrency: function(amount) {
        const config = window.APP_CONFIG.CURRENCY;
        return `${config.SYMBOL}${amount.toFixed(config.DECIMALS).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
    },
    
    // Validar email
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validar contraseña
    validatePassword: function(password) {
        return password.length >= window.APP_CONFIG.VALIDATION.PASSWORD_MIN_LENGTH;
    },
    
    // Generar código único
    generateUniqueCode: function(prefix = 'PROD') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `${prefix}-${timestamp}-${random}`.toUpperCase();
    },
    
    // Copiar al portapapeles
    copyToClipboard: function(text) {
        return navigator.clipboard.writeText(text)
            .then(() => true)
            .catch(() => {
                // Fallback para navegadores antiguos
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                const success = document.execCommand('copy');
                document.body.removeChild(textArea);
                return success;
            });
    },
    
    // Descargar archivo
    downloadFile: function(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    // Leer archivo como texto
    readFileAsText: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    },
    
    // Leer archivo como Data URL
    readFileAsDataURL: function(file) {
        return new Promise((resolve, reject) =>{
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },
    
    // Deformatear JSON seguro
    safeJsonParse: function(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch (error) {
            return defaultValue;
        }
    },
    
    // Esperar un tiempo
    sleep: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    // Capitalizar texto
    capitalize: function(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
};

// Sistema de notificaciones
class NotificationSystem {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.init();
    }
    
    init() {
        // Crear contenedor de notificaciones
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    }
    
    show(message, type = 'info', duration = 5000) {
        const id = Date.now();
        const notification = document.createElement('div');
        notification.id = `notification-${id}`;
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="App.notifications.close(${id})">×</button>
            </div>
        `;
        
        this.container.appendChild(notification);
        this.notifications.push(id);
        
        // Animar entrada
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        });
        
        // Auto cerrar
        if (duration > 0) {
            setTimeout(() => this.close(id), duration);
        }
        
        return id;
    }
    
    close(id) {
        const notification = document.getElementById(`notification-${id}`);
        if (notification) {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            
            setTimeout(() => {
                notification.remove();
                this.notifications = this.notifications.filter(nid => nid !== id);
            }, 300);
        }
    }
    
    getBackgroundColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }
    
    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }
    
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }
    
    warning(message, duration = 5000) {
        return this.show(message, 'warning', duration);
    }
    
    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// Sistema de autenticación
class AuthSystem {
    constructor() {
        this.token = null;
        this.user = null;
        this.init();
    }
    
    init() {
        // Cargar token y usuario del almacenamiento local
        this.token = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        const userData = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.USER_DATA);
        
        if (userData) {
            try {
                this.user = JSON.parse(userData);
                AppState.isAuthenticated = true;
                AppState.user = this.user;
            } catch (error) {
                console.error('Error al parsear datos de usuario:', error);
                this.clearAuth();
            }
        }
    }
    
    async login(email, password) {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}${window.APP_CONFIG.API_ENDPOINTS.AUTH.LOGIN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                this.setAuth(result.data.token, result.data.user);
                return { success: true, user: result.data.user };
            } else {
                return { success: false, message: result.message || 'Error en la autenticación' };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { success: false, message: 'Error de conexión con el servidor' };
        }
    }
    
    async register(userData) {
        try {
            const response = await fetch(`${window.APP_CONFIG.API_BASE_URL}${window.APP_CONFIG.API_ENDPOINTS.AUTH.REGISTER}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                return { success: true, message: 'Registro exitoso' };
            } else {
                return { success: false, message: result.message || 'Error en el registro' };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            return { success: false, message: 'Error de conexión con el servidor' };
        }
    }
    
    async logout() {
        try {
            if (this.token) {
                await fetch(`${window.APP_CONFIG.API_BASE_URL}${window.APP_CONFIG.API_ENDPOINTS.AUTH.LOGOUT}`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }
        } catch (error) {
            console.error('Error en logout:', error);
        } finally {
            this.clearAuth();
        }
    }
    
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        AppState.isAuthenticated = true;
        AppState.user = user;
        
        // Guardar en almacenamiento local
        localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        
        // Configurar header por defecto para fetch
        window.logger.info('Autenticación establecida para usuario:', user.email);
    }
    
    clearAuth() {
        this.token = null;
        this.user = null;
        AppState.isAuthenticated = false;
        AppState.user = null;
        
        // Limpiar almacenamiento local
        localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.USER_DATA);
        
        window.logger.info('Autenticación limpiada');
    }
    
    isAuthenticated() {
        return !!this.token && !!this.user;
    }
    
    getUser() {
        return this.user;
    }
    
    getToken() {
        return this.token;
    }
}

// Sistema de enrutamiento
class Router {
    constructor() {
        this.routes = [];
        this.currentRoute = null;
        this.init();
    }
    
    init() {
        // Definir rutas
        this.routes = [
            { path: '/', component: 'DashboardPage' },
            { path: '/login', component: 'LoginPage', public: true },
            { path: '/register', component: 'RegisterPage', public: true },
            { path: '/dashboard', component: 'DashboardPage' },
            { path: '/products', component: 'ProductsPage' },
            { path: '/products/new', component: 'ProductNewPage' },
            { path: '/products/:id/edit', component: 'ProductEditPage' },
            { path: '/categories', component: 'CategoriesPage' },
            { path: '/scanner', component: 'ScannerPage' },
            { path: '/reports', component: 'ReportsPage' },
            { path: '/settings', component: 'SettingsPage' },
            { path: '/profile', component: 'ProfilePage' }
        ];
        
        // Manejar cambios en la URL
        window.addEventListener('popstate', () => this.handleRouteChange());
        
        // Manejar enlaces internos
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="/"]');
            if (link && !link.target) {
                e.preventDefault();
                this.navigate(link.getAttribute('href'));
            }
        });
        
        // Manejar ruta inicial
        this.handleRouteChange();
    }
    
    navigate(path, replace = false) {
        if (replace) {
            window.history.replaceState({}, '', path);
        } else {
            window.history.pushState({}, '', path);
        }
        this.handleRouteChange();
    }
    
    handleRouteChange() {
        const path = window.location.pathname;
        const route = this.findRoute(path);
        
        if (!route) {
            this.navigate('/');
            return;
        }
        
        // Verificar autenticación para rutas protegidas
        if (!route.public && !AppState.isAuthenticated) {
            this.navigate('/login');
            return;
        }
        
        // Verificar permisos (aquí puedes agregar lógica basada en roles)
        if (route.requiresAdmin && AppState.user?.role !== 'admin') {
            App.notifications.error('No tienes permisos para acceder a esta página');
            this.navigate('/');
            return;
        }
        
        this.currentRoute = route;
        this.render(route);
    }
    
    findRoute(path) {
        for (const route of this.routes) {
            const routePath = route.path;
            const paramNames = [];
            
            // Convertir ruta a expresión regular
            const regexPath = routePath
                .replace(/\/:(\w+)/g, (_, paramName) => {
                    paramNames.push(paramName);
                    return '/([^/]+)';
                })
                .replace(/\//g, '\\/');
            
            const regex = new RegExp(`^${regexPath}$`);
            const match = path.match(regex);
            
            if (match) {
                const params = {};
                paramNames.forEach((name, index) => {
                    params[name] = match[index + 1];
                });
                
                return {
                    ...route,
                    params,
                    fullPath: path
                };
            }
        }
        return null;
    }
    
    async render(route) {
        // Mostrar loading
        const appElement = document.getElementById('app');
        appElement.innerHTML = '<div class="page-loading">Cargando...</div>';
        
        try {
            // Cargar componente dinámicamente
            const component = await this.loadComponent(route.component);
            
            // Crear instancia del componente
            const componentInstance = new component();
            
            // Renderizar componente
            const content = await componentInstance.render(route.params);
            
            // Actualizar el DOM
            appElement.innerHTML = content;
            
            // Inicializar eventos del componente
            if (typeof componentInstance.init === 'function') {
                componentInstance.init();
            }
            
            // Actualizar título de la página
            if (componentInstance.title) {
                document.title = `${componentInstance.title} | ${window.APP_CONFIG.APP_NAME}`;
            }
            
            window.logger.info(`Navegación a: ${route.fullPath}`);
        } catch (error) {
            console.error('Error al renderizar ruta:', error);
            appElement.innerHTML = '<div class="error-page"><h2>Error al cargar la página</h2><button onclick="App.router.navigate(\'/\')">Volver al inicio</button></div>';
        }
    }
    
    async loadComponent(componentName) {
        // En una aplicación real, esto cargaría componentes dinámicamente
        // Por ahora, retornamos una clase base
        return class BaseComponent {
            constructor() {
                this.title = 'Página';
            }
            
            async render(params) {
                return `
                    <div class="page-container">
                        <h1>${this.title}</h1>
                        <p>Contenido de la página ${componentName}</p>
                        <p>Parámetros: ${JSON.stringify(params)}</p>
                    </div>
                `;
            }
            
            init() {
                // Método para inicializar eventos
            }
        };
    }
    
    getCurrentRoute() {
        return this.currentRoute;
    }
}

// Clase principal de la aplicación
class InventarioQRApp {
    constructor() {
        this.state = AppState;
        this.utils = AppUtils;
        this.auth = new AuthSystem();
        this.router = new Router();
        this.notifications = new NotificationSystem();
        this.isInitialized = false;
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        window.logger.info('Iniciando aplicación Inventario QR...');
        
        // Simular carga de módulos
        await this.simulateLoading();
        
        // Inicializar sistemas
        this.setupEventListeners();
        this.checkOnlineStatus();
        this.setupTheme();
        
        // Verificar autenticación automática
        if (this.auth.isAuthenticated()) {
            window.logger.info('Usuario autententicado automáticamente');
        }
        
        this.isInitialized = true;
        this.state.isInitialized = true;
        
        // Ocultar pantalla de carga
        this.hideLoadingScreen();
        
        window.logger.info('Aplicación inicializada correctamente');
    }
    
    async simulateLoading() {
        const steps = [
            { text: 'Inicializando módulos...', progress: 20 },
            { text: 'Cargando componentes...', progress: 40 },
            { text: 'Configurando base de datos...', progress: 60 },
            { text: 'Estableciendo conexión...', progress: 80 },
            { text: 'Preparando interfaz...', progress: 95 }
        ];
        
        for (const step of steps) {
            await AppUtils.sleep(300);
            this.updateLoadingProgress(step.progress, step.text);
        }
        
        await AppUtils.sleep(300);
        this.updateLoadingProgress(100, '¡Listo!');
    }
    
    updateLoadingProgress(progress, text) {
        const progressBar = document.getElementById('loading-progress');
        const progressText = document.getElementById('loading-text');
        
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        
        if (progressText) {
            progressText.textContent = text;
        }
    }
    
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('app-loading');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
            
            // Remover después de la animación
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }
    
    setupEventListeners() {
        // Detectar cambios en la conexión
        window.addEventListener('online', () => {
            this.state.offlineMode = false;
            this.notifications.success('Conexión restablecida', 3000);
        });
        
        window.addEventListener('offline', () => {
            this.state.offlineMode = true;
            this.notifications.warning('Modo offline activado', 3000);
        });
        
        // Detectar cambios en el tema del sistema
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (this.state.theme === 'system') {
                this.setTheme(e.matches ? 'dark' : 'light');
            }
        });
    }
    
    checkOnlineStatus() {
        this.state.offlineMode = !navigator.onLine;
    }
    
    setupTheme() {
        const savedTheme = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.THEME) || 'system';
        this.setTheme(savedTheme, false);
    }
    
    setTheme(theme, save = true) {
        const themes = window.APP_CONFIG.THEMES;
        
        if (!Object.values(themes).includes(theme)) {
            theme = themes.LIGHT;
        }
        
        this.state.theme = theme;
        
        let actualTheme = theme;
        if (theme === themes.SYSTEM) {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? themes.DARK : themes.LIGHT;
        }
        
        document.documentElement.setAttribute('data-theme', actualTheme);
        
        if (save) {
            localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.THEME, theme);
        }
    }
    
    setLanguage(language) {
        const languages = window.APP_CONFIG.LANGUAGES.map(lang => lang.code);
        
        if (!languages.includes(language)) {
            language = 'es';
        }
        
        this.state.language = language;
        document.documentElement.lang = language;
        localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.LANGUAGE, language);
        
        this.notifications.info('Idioma cambiado', 3000);
    }
    
    // Métodos de utilidad para la UI
    showModal(title, content, options = {}) {
        // Implementar sistema de modales
        console.log('Mostrar modal:', title);
    }
    
    showConfirm(message, callback) {
        // Implementar confirmaciones
        if (confirm(message)) {
            callback(true);
        }
    }
    
    showLoading(message = 'Cargando...') {
        // Implementar overlay de carga
        console.log('Mostrar loading:', message);
    }
    
    hideLoading() {
        // Ocultar overlay de carga
        console.log('Ocultar loading');
    }
}

// Crear instancia global de la aplicación
window.App = new InventarioQRApp();

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Esperar un momento para asegurar que todo esté listo
    setTimeout(() => {
        window.App.initialize();
    }, 100);
});

// Exportar para uso global
window.AppState = AppState;
window.AppUtils = AppUtils;

// Manejar errores no capturados
window.addEventListener('error', (event) => {
    console.error('Error no capturado:', event.error);
    
    if (window.App?.notifications) {
        window.App.notifications.error('Ha ocurrido un error inesperado');
    }
});

// Manejar promesas no capturadas
window.addEventListener('unhandledrejection', (event) => {
    console.error('Promesa no capturada:', event.reason);
    
    if (window.App?.notifications) {
        window.App.notifications.error('Error en operación asíncrona');
    }
});