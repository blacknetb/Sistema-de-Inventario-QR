/**
 * Sistema de Inventario QR - Configuración de la Aplicación
 * Versión: 1.0.0
 * Última actualización: 2024-01-01
 */

window.APP_CONFIG = {
    // Información de la aplicación
    APP_NAME: 'Sistema de Inventario QR',
    APP_VERSION: '1.0.0',
    APP_DESCRIPTION: 'Sistema profesional de gestión de inventario con códigos QR',
    
    // URLs de la aplicación
    BASE_URL: window.location.origin,
    API_BASE_URL: process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000/api' 
        : 'https://api.inventario-qr.com/v1',
    
    // Configuración de API
    API_TIMEOUT: 30000, // 30 segundos
    API_RETRY_ATTEMPTS: 3,
    
    // Endpoints de API
    API_ENDPOINTS: {
        AUTH: {
            LOGIN: '/auth/login',
            REGISTER: '/auth/register',
            LOGOUT: '/auth/logout',
            REFRESH_TOKEN: '/auth/refresh',
            PROFILE: '/auth/profile'
        },
        PRODUCTS: {
            LIST: '/products',
            CREATE: '/products',
            GET: '/products/:id',
            UPDATE: '/products/:id',
            DELETE: '/products/:id',
            SEARCH: '/products/search',
            BULK_CREATE: '/products/bulk',
            EXPORT: '/products/export',
            IMPORT: '/products/import'
        },
        CATEGORIES: {
            LIST: '/categories',
            CREATE: '/categories',
            GET: '/categories/:id',
            UPDATE: '/categories/:id',
            DELETE: '/categories/:id'
        },
        INVENTORY: {
            STOCK: '/inventory/stock',
            MOVEMENTS: '/inventory/movements',
            ADJUST: '/inventory/adjust',
            TRANSFER: '/inventory/transfer',
            HISTORY: '/inventory/history/:productId'
        },
        QR: {
            GENERATE: '/qr/generate',
            GENERATE_BATCH: '/qr/generate-batch',
            SCAN: '/qr/scan',
            VALIDATE: '/qr/validate'
        },
        REPORTS: {
            STOCK: '/reports/stock',
            MOVEMENTS: '/reports/movements',
            PRODUCTS: '/reports/products',
            EXPORT_PDF: '/reports/export/pdf',
            EXPORT_EXCEL: '/reports/export/excel'
        },
        SETTINGS: {
            COMPANY: '/settings/company',
            USERS: '/settings/users',
            PREFERENCES: '/settings/preferences',
            BACKUP: '/settings/backup'
        }
    },
    
    // Configuración de autenticación
    AUTH: {
        TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas
        REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 días
        PASSWORD_MIN_LENGTH: 8,
        SESSION_TIMEOUT: 30 * 60 * 1000 // 30 minutos
    },
    
    // Almacenamiento local
    STORAGE_KEYS: {
        AUTH_TOKEN: 'inventario_qr_auth_token',
        REFRESH_TOKEN: 'inventario_qr_refresh_token',
        USER_DATA: 'inventario_qr_user_data',
        THEME: 'inventario_qr_theme',
        LANGUAGE: 'inventario_qr_language',
        SETTINGS: 'inventario_qr_settings',
        OFFLINE_DATA: 'inventario_qr_offline_data'
    },
    
    // Configuración de caché
    CACHE: {
        PRODUCTS_TTL: 5 * 60 * 1000, // 5 minutos
        CATEGORIES_TTL: 30 * 60 * 1000, // 30 minutos
        MAX_CACHE_SIZE: 50 // MB
    },
    
    // Formatos de fecha y hora
    DATE_FORMATS: {
        DISPLAY: 'DD/MM/YYYY',
        DISPLAY_TIME: 'DD/MM/YYYY HH:mm',
        API: 'YYYY-MM-DD',
        API_FULL: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
    },
    
    // Moneda
    CURRENCY: {
        SYMBOL: '$',
        DECIMALS: 2,
        THOUSAND_SEPARATOR: ',',
        DECIMAL_SEPARATOR: '.'
    },
    
    // Configuración de inventario
    INVENTORY: {
        LOW_STOCK_THRESHOLD: 10,
        CRITICAL_STOCK_THRESHOLD: 5,
        MAX_PRODUCTS_PER_PAGE: 50,
        DEFAULT_CATEGORY: 'Sin categoría'
    },
    
    // Configuración de QR
    QR: {
        SIZE: 200,
        COLOR: '#000000',
        BG_COLOR: '#FFFFFF',
        ERROR_LEVEL: 'M', // L, M, Q, H
        LOGO_SIZE: 40,
        MARGIN: 1
    },
    
    // Validación
    VALIDATION: {
        PRODUCT_CODE_MIN_LENGTH: 3,
        PRODUCT_CODE_MAX_LENGTH: 50,
        PRODUCT_NAME_MIN_LENGTH: 2,
        PRODUCT_NAME_MAX_LENGTH: 200,
        PRODUCT_DESCRIPTION_MAX_LENGTH: 1000,
        PASSWORD_MIN_LENGTH: 8,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_REGEX: /^[\+]?[0-9\s\-\(\)]+$/,
        URL_REGEX: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/
    },
    
    // Temas
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        SYSTEM: 'system'
    },
    
    // Idiomas soportados
    LANGUAGES: [
        { code: 'es', name: 'Español', flag: '🇪🇸' },
        { code: 'en', name: 'English', flag: '🇺🇸' }
    ],
    
    // Configuración de notificaciones
    NOTIFICATIONS: {
        DEFAULT_DURATION: 5000,
        MAX_VISIBLE: 5,
        POSITION: 'top-right'
    },
    
    // Configuración de exportación
    EXPORT: {
        CSV_DELIMITER: ',',
        CSV_ENCODING: 'UTF-8',
        PDF_ORIENTATION: 'portrait',
        PDF_FORMAT: 'A4'
    },
    
    // Límites
    LIMITS: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_PRODUCTS_PER_BATCH: 100,
        MAX_QR_CODES_PER_BATCH: 50,
        MAX_CATEGORIES: 100,
        MAX_USERS: 50
    },
    
    // Configuración de escáner
    SCANNER: {
        PREFERRED_CAMERA: 'environment',
        SCAN_INTERVAL: 100, // ms
        MAX_SCAN_TIME: 30000, // 30 segundos
        TORCH_ENABLED: false
    },
    
    // Configuración de PWA
    PWA: {
        CACHE_VERSION: 'v1.0.0',
        CACHE_NAME: 'inventario-qr-cache',
        OFFLINE_PAGE: '/offline.html',
        UPDATE_INTERVAL: 24 * 60 * 60 * 1000 // 24 horas
    },
    
    // Configuración de errores
    ERROR_MESSAGES: {
        NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
        SERVER_ERROR: 'Error del servidor. Intenta nuevamente más tarde.',
        AUTH_ERROR: 'Sesión expirada. Por favor, inicia sesión nuevamente.',
        VALIDATION_ERROR: 'Por favor, completa todos los campos requeridos correctamente.',
        PERMISSION_ERROR: 'No tienes permisos para realizar esta acción.',
        NOT_FOUND: 'El recurso solicitado no fue encontrado.'
    },
    
    // Configuración de desarrollo
    DEBUG: process.env.NODE_ENV === 'development',
    
    // Configuración de logging
    LOGGING: {
        LEVEL: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
        CONSOLE_ENABLED: true,
        REMOTE_ENABLED: false,
        REMOTE_ENDPOINT: '/api/logs'
    },
    
    // Configuración de actualizaciones
    UPDATES: {
        CHECK_INTERVAL: 60 * 60 * 1000, // 1 hora
        AUTO_UPDATE: true,
        NOTIFY_USER: true
    },
    
    // Configuración de respaldo
    BACKUP: {
        AUTO_BACKUP: true,
        BACKUP_INTERVAL: 24 * 60 * 60 * 1000, // 24 horas
        MAX_BACKUPS: 30,
        BACKUP_PATH: '/backups'
    },
    
    // Configuración de sincronización
    SYNC: {
        AUTO_SYNC: true,
        SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutos
        CONFLICT_RESOLUTION: 'server' // 'server', 'client', 'manual'
    }
};

// Configuración de logger para desarrollo
if (window.APP_CONFIG.DEBUG) {
    window.logger = {
        debug: (...args) => console.debug('[DEBUG]', ...args),
        info: (...args) => console.info('[INFO]', ...args),
        warn: (...args) => console.warn('[WARN]', ...args),
        error: (...args) => console.error('[ERROR]', ...args),
        log: (...args) => console.log('[LOG]', ...args)
    };
} else {
    window.logger = {
        debug: () => {},
        info: (...args) => console.info(...args),
        warn: (...args) => console.warn(...args),
        error: (...args) => console.error(...args),
        log: () => {}
    };
}

// Detectar entorno
window.APP_CONFIG.ENVIRONMENT = process.env.NODE_ENV || 'production';
window.APP_CONFIG.IS_MOBILE = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
window.APP_CONFIG.IS_OFFLINE = !navigator.onLine;

// Inicializar polyfills si es necesario
if (!window.Promise) {
    console.warn('Promise no soportado en este navegador');
}

if (!window.fetch) {
    console.warn('Fetch API no soportado en este navegador');
}

// Configuración de Service Worker
if ('serviceWorker' in navigator && window.APP_CONFIG.ENVIRONMENT === 'production') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.log('Error al registrar ServiceWorker:', error);
            });
    });
}