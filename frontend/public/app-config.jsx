/**
 * Sistema de Inventario QR - Configuración de la Aplicación
 * Versión: 1.0.0
 * Autor: Inventario QR
 * Descripción: Configuración global y constantes de la aplicación
 */

// Configuración de entorno
const APP_CONFIG = {
    // Información de la aplicación
    APP_NAME: 'Sistema de Inventario QR',
    APP_VERSION: '1.0.0',
    APP_BUILD: '2024.01.01',
    
    // Configuración del backend
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api'
        : 'https://api.inventario-qr.com/api',
    
    // Tiempos de espera (en milisegundos)
    TIMEOUTS: {
        API_REQUEST: 30000,
        AUTH_TOKEN_REFRESH: 300000, // 5 minutos
        SESSION_TIMEOUT: 1800000, // 30 minutos
        NOTIFICATION_DURATION: 5000,
        LOADING_MIN_DURATION: 1000
    },
    
    // Configuración de almacenamiento
    STORAGE_KEYS: {
        AUTH_TOKEN: 'inventario_qr_auth_token',
        REFRESH_TOKEN: 'inventario_qr_refresh_token',
        USER_DATA: 'inventario_qr_user_data',
        THEME: 'inventario_qr_theme',
        LANGUAGE: 'inventario_qr_language',
        LAST_SYNC: 'inventario_qr_last_sync',
        OFFLINE_DATA: 'inventario_qr_offline_data'
    },
    
    // Configuración de rutas
    ROUTES: {
        HOME: '/',
        LOGIN: '/login',
        REGISTER: '/register',
        DASHBOARD: '/dashboard',
        PRODUCTS: '/products',
        PRODUCT_NEW: '/products/new',
        PRODUCT_EDIT: '/products/:id/edit',
        CATEGORIES: '/categories',
        SCANNER: '/scanner',
        REPORTS: '/reports',
        SETTINGS: '/settings',
        PROFILE: '/profile'
    },
    
    // Configuración de API endpoints
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            REFRESH: '/auth/refresh',
            FORGOT_PASSWORD: '/auth/forgot-password',
            RESET_PASSWORD: '/auth/reset-password',
            VERIFY_EMAIL: '/auth/verify-email'
        },
        PRODUCTS: {
            BASE: '/products',
            BULK_CREATE: '/products/bulk',
            IMPORT: '/products/import',
            EXPORT: '/products/export',
            STATS: '/products/stats'
        },
        CATEGORIES: {
            BASE: '/categories'
        },
        INVENTORY: {
            BASE: '/inventory',
            MOVEMENTS: '/inventory/movements',
            ADJUSTMENTS: '/inventory/adjustments'
        },
        REPORTS: {
            BASE: '/reports',
            STOCK: '/reports/stock',
            MOVEMENTS: '/reports/movements',
            EXPIRATION: '/reports/expiration'
        },
        QR: {
            GENERATE: '/qr/generate',
            VALIDATE: '/qr/validate',
            BATCH_GENERATE: '/qr/batch-generate'
        },
        USERS: {
            BASE: '/users',
            PROFILE: '/users/profile',
            PREFERENCES: '/users/preferences'
        }
    },
    
    // Configuración de paginación
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        PAGE_SIZES: [10, 20, 50, 100],
        DEFAULT_PAGE: 1
    },
    
    // Configuración de validación
    VALIDATION: {
        PRODUCT_CODE_MIN_LENGTH: 3,
        PRODUCT_CODE_MAX_LENGTH: 50,
        PRODUCT_NAME_MIN_LENGTH: 2,
        PRODUCT_NAME_MAX_LENGTH: 200,
        PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,
        CATEGORY_NAME_MIN_LENGTH: 2,
        CATEGORY_NAME_MAX_LENGTH: 100,
        USERNAME_MIN_LENGTH: 3,
        USERNAME_MAX_LENGTH: 50,
        PASSWORD_MIN_LENGTH: 8,
        EMAIL_MAX_LENGTH: 255
    },
    
    // Configuración de fechas y formatos
    DATE_FORMATS: {
        DISPLAY: 'DD/MM/YYYY',
        DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
        API: 'YYYY-MM-DD',
        API_FULL: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
        MONTH_YEAR: 'MM/YYYY'
    },
    
    // Configuración de moneda
    CURRENCY: {
        SYMBOL: '$',
        CODE: 'MXN',
        DECIMALS: 2,
        THOUSANDS_SEPARATOR: ',',
        DECIMAL_SEPARATOR: '.'
    },
    
    // Configuración de unidades de medida
    UNITS: {
        WEIGHT: ['kg', 'g', 'lb', 'oz'],
        VOLUME: ['L', 'ml', 'gal', 'oz'],
        LENGTH: ['m', 'cm', 'mm', 'in', 'ft'],
        COUNT: ['pz', 'un', 'caja', 'paquete']
    },
    
    // Estados del producto
    PRODUCT_STATUS: {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        DISCONTINUED: 'discontinued',
        OUT_OF_STOCK: 'out_of_stock',
        LOW_STOCK: 'low_stock'
    },
    
    // Tipos de movimiento de inventario
    MOVEMENT_TYPES: {
        ENTRY: 'entry',
        EXIT: 'exit',
        ADJUSTMENT: 'adjustment',
        TRANSFER: 'transfer',
        LOSS: 'loss'
    },
    
    // Roles de usuario
    USER_ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        OPERATOR: 'operator',
        VIEWER: 'viewer'
    },
    
    // Configuración de notificaciones
    NOTIFICATIONS: {
        POSITION: 'top-right',
        DURATION: 5000,
        MAX_VISIBLE: 5
    },
    
    // Configuración de temas
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
    },
    
    // Configuración de idiomas
    LANGUAGES: [
        { code: 'es', name: 'Español', flag: '🇲🇽' },
        { code: 'en', name: 'English', flag: '🇺🇸' }
    ],
    
    // Configuración de límites
    LIMITS: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_BULK_OPERATIONS: 1000,
        MAX_PRODUCT_IMAGES: 5,
        MAX_QR_BATCH_GENERATE: 100
    },
    
    // Configuración de calidad de imágenes
    IMAGE_QUALITY: {
        THUMBNAIL: { width: 100, height: 100 },
        PREVIEW: { width: 400, height: 400 },
        FULL: { width: 1200, height: 1200 }
    }
};

// Exportar configuración para uso global
window.APP_CONFIG = APP_CONFIG;

// Detectar entorno
APP_CONFIG.ENVIRONMENT = (function() {
    const hostname = window.location.hostname;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
        return 'staging';
    } else {
        return 'production';
    }
})();

// Configuración específica por entorno
const ENV_CONFIG = {
    development: {
        DEBUG: true,
        LOG_LEVEL: 'debug',
        API_BASE_URL: 'http://localhost:3000/api',
        ENABLE_MOCKS: true
    },
    staging: {
        DEBUG: true,
        LOG_LEVEL: 'info',
        API_BASE_URL: 'https://staging-api.inventario-qr.com/api',
        ENABLE_MOCKS: false
    },
    production: {
        DEBUG: false,
        LOG_LEVEL: 'warn',
        API_BASE_URL: 'https://api.inventario-qr.com/api',
        ENABLE_MOCKS: false
    }
};

// Mezclar configuración de entorno con configuración principal
Object.assign(APP_CONFIG, ENV_CONFIG[APP_CONFIG.ENVIRONMENT]);

// Configuración de logging
class Logger {
    constructor() {
        this.enabled = APP_CONFIG.DEBUG;
        this.level = APP_CONFIG.LOG_LEVEL;
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
    }

    log(level, message, ...args) {
        if (!this.enabled || this.levels[level] < this.levels[this.level]) {
            return;
        }

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
        
        switch(level) {
            case 'error':
                console.error(prefix, message, ...args);
                break;
            case 'warn':
                console.warn(prefix, message, ...args);
                break;
            case 'info':
                console.info(prefix, message, ...args);
                break;
            default:
                console.log(prefix, message, ...args);
        }
    }

    debug(message, ...args) {
        this.log('debug', message, ...args);
    }

    info(message, ...args) {
        this.log('info', message, ...args);
    }

    warn(message, ...args) {
        this.log('warn', message, ...args);
    }

    error(message, ...args) {
        this.log('error', message, ...args);
    }
}

// Crear instancia global del logger
window.logger = new Logger();

// Función para inicializar la aplicación
window.initializeApp = function() {
    logger.info('Inicializando aplicación...');
    
    // Configurar interceptores de fetch
    if (typeof fetch === 'function') {
        const originalFetch = window.fetch;
        
        window.fetch = function(...args) {
            const url = args[0];
            const options = args[1] || {};
            
            logger.debug(`Fetch request: ${url}`, options);
            
            // Agregar token de autenticación si existe
            const token = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH_TOKEN);
            if (token && !url.toString().includes('auth/login')) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                };
            }
            
            // Agregar timeout
            const timeout = APP_CONFIG.TIMEOUTS.API_REQUEST;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);
            options.signal = controller.signal;
            
            return originalFetch.apply(this, args)
                .then(response => {
                    clearTimeout(timeoutId);
                    
                    // Verificar si la respuesta es JSON
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        return response.json().then(data => {
                            logger.debug(`Fetch response: ${url}`, { status: response.status, data });
                            
                            // Verificar errores de autenticación
                            if (response.status === 401) {
                                logger.warn('Token de autenticación inválido o expirado');
                                // Aquí podrías manejar el refresh del token
                            }
                            
                            return { response, data };
                        });
                    }
                    
                    return { response, data: null };
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    logger.error(`Fetch error: ${url}`, error);
                    
                    if (error.name === 'AbortError') {
                        throw new Error('La solicitud ha excedido el tiempo de espera');
                    }
                    
                    throw error;
                });
        };
    }
    
    // Configurar almacenamiento offline
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                logger.info('Service Worker registrado con éxito:', registration);
            })
            .catch(error => {
                logger.error('Error al registrar Service Worker:', error);
            });
    }
    
    // Configurar tema
    const savedTheme = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.THEME) || APP_CONFIG.THEMES.SYSTEM;
    const theme = savedTheme === APP_CONFIG.THEMES.SYSTEM 
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? APP_CONFIG.THEMES.DARK : APP_CONFIG.THEMES.LIGHT)
        : savedTheme;
    
    document.documentElement.setAttribute('data-theme', theme);
    
    // Configurar idioma
    const savedLanguage = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.LANGUAGE) || 'es';
    document.documentElement.lang = savedLanguage;
    
    logger.info('Aplicación inicializada correctamente');
};

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeApp);
} else {
    window.initializeApp();
}