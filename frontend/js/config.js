/**
 * Configuración de la API y constantes del sistema
 */
const API_CONFIG = {
    // Base URL de la API (ajusta según tu entorno)
    BASE_URL: 'http://localhost:3000/api',
    // BASE_URL: 'https://tu-dominio.com/api',
    
    // Endpoints de la API
    ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            REFRESH: '/auth/refresh',
            VERIFY: '/auth/verify',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password'
        },
        USERS: {
            BASE: '/users',
            PROFILE: '/users/profile',
            CHANGE_PASSWORD: '/users/change-password'
        },
        PRODUCTS: {
            BASE: '/products',
            SEARCH: '/products/search',
            BY_CATEGORY: '/products/category',
            BY_LOCATION: '/products/location',
            LOW_STOCK: '/products/low-stock',
            GENERATE_QR: '/products/generate-qr',
            BULK_QR: '/products/bulk-qr'
        },
        CATEGORIES: {
            BASE: '/categories'
        },
        LOCATIONS: {
            BASE: '/locations'
        },
        MOVEMENTS: {
            BASE: '/movements',
            STATS: '/movements/stats',
            BY_DATE: '/movements/by-date'
        },
        REPORTS: {
            INVENTORY: '/reports/inventory',
            MOVEMENTS: '/reports/movements',
            LOW_STOCK: '/reports/low-stock',
            CATEGORIES: '/reports/categories',
            LOCATIONS: '/reports/locations',
            VALUATION: '/reports/valuation',
            EXPORT: '/reports/export'
        }
    },
    
    // Configuración de JWT
    JWT: {
        TOKEN_KEY: 'inventory_qr_token',
        REFRESH_KEY: 'inventory_qr_refresh_token',
        USER_KEY: 'inventory_qr_user'
    },
    
    // Configuración de paginación
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 10,
        PAGE_SIZES: [10, 25, 50, 100]
    },
    
    // Configuración de notificaciones
    NOTIFICATIONS: {
        AUTO_HIDE: 5000,
        POSITION: 'top-right'
    },
    
    // Configuración de QR
    QR: {
        DEFAULT_SIZE: 256,
        DEFAULT_COLOR: '#000000',
        DEFAULT_BG_COLOR: '#FFFFFF'
    },
    
    // Configuración del escáner
    SCANNER: {
        FACING_MODE: 'environment', // 'user' para frontal, 'environment' para trasera
        SCAN_INTERVAL: 500
    }
};

// Estado global de la aplicación
const APP_STATE = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    currentPage: null,
    permissions: [],
    notifications: [],
    loading: false
};

// Inicializar el estado desde localStorage
function initializeAppState() {
    const token = localStorage.getItem(API_CONFIG.JWT.TOKEN_KEY);
    const refreshToken = localStorage.getItem(API_CONFIG.JWT.REFRESH_KEY);
    const userData = localStorage.getItem(API_CONFIG.JWT.USER_KEY);
    
    if (token && userData) {
        try {
            APP_STATE.token = token;
            APP_STATE.refreshToken = refreshToken;
            APP_STATE.user = JSON.parse(userData);
            APP_STATE.isAuthenticated = true;
            
            // Cargar permisos del usuario
            loadUserPermissions();
        } catch (error) {
            console.error('Error al cargar estado de la aplicación:', error);
            clearAuthData();
        }
    }
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return APP_STATE.isAuthenticated;
}

// Función para obtener el token actual
function getToken() {
    return APP_STATE.token;
}

// Función para obtener el usuario actual
function getCurrentUser() {
    return APP_STATE.user;
}

// Función para verificar permisos de usuario
function hasPermission(requiredPermission) {
    if (!APP_STATE.permissions) return false;
    
    // Si el usuario es admin, tiene todos los permisos
    if (APP_STATE.user && APP_STATE.user.role === 'admin') {
        return true;
    }
    
    return APP_STATE.permissions.includes(requiredPermission);
}

// Función para cargar permisos del usuario
function loadUserPermissions() {
    if (!APP_STATE.user) return;
    
    // Definir permisos basados en el rol
    const rolePermissions = {
        admin: ['manage_users', 'manage_products', 'manage_categories', 'manage_locations', 
                'manage_movements', 'view_reports', 'generate_reports', 'export_data'],
        manager: ['manage_products', 'manage_categories', 'manage_locations', 
                 'manage_movements', 'view_reports', 'generate_reports'],
        operator: ['manage_products', 'manage_movements', 'view_reports'],
        viewer: ['view_products', 'view_movements', 'view_reports']
    };
    
    APP_STATE.permissions = rolePermissions[APP_STATE.user.role] || [];
}

// Función para guardar datos de autenticación
function saveAuthData(token, refreshToken, user) {
    APP_STATE.token = token;
    APP_STATE.refreshToken = refreshToken;
    APP_STATE.user = user;
    APP_STATE.isAuthenticated = true;
    
    localStorage.setItem(API_CONFIG.JWT.TOKEN_KEY, token);
    localStorage.setItem(API_CONFIG.JWT.REFRESH_KEY, refreshToken);
    localStorage.setItem(API_CONFIG.JWT.USER_KEY, JSON.stringify(user));
    
    loadUserPermissions();
}

// Función para limpiar datos de autenticación
function clearAuthData() {
    APP_STATE.token = null;
    APP_STATE.refreshToken = null;
    APP_STATE.user = null;
    APP_STATE.isAuthenticated = false;
    APP_STATE.permissions = [];
    
    localStorage.removeItem(API_CONFIG.JWT.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.JWT.REFRESH_KEY);
    localStorage.removeItem(API_CONFIG.JWT.USER_KEY);
}

// Función para construir URLs de la API
function buildApiUrl(endpoint, params = {}) {
    let url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Reemplazar parámetros en la URL (ej: /products/:id)
    Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
    });
    
    return url;
}

// Función para construir query string
function buildQueryString(params = {}) {
    const queryParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            queryParams.append(key, params[key]);
        }
    });
    
    const queryString = queryParams.toString();
    return queryString ? `?${queryString}` : '';
}

// Inicializar el estado al cargar la configuración
initializeAppState();

// Exportar funciones y configuraciones
window.API_CONFIG = API_CONFIG;
window.APP_STATE = APP_STATE;
window.isAuthenticated = isAuthenticated;
window.getToken = getToken;
window.getCurrentUser = getCurrentUser;
window.hasPermission = hasPermission;
window.saveAuthData = saveAuthData;
window.clearAuthData = clearAuthData;
window.buildApiUrl = buildApiUrl;
window.buildQueryString = buildQueryString;