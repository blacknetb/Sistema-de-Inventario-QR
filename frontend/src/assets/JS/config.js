// ============================================
// CONFIGURACIÓN DEL SISTEMA DE INVENTARIO QR
// ============================================

const AppConfig = {
    // Información de la aplicación
    APP_NAME: 'Sistema de Inventario QR',
    APP_VERSION: '1.0.0',
    APP_BUILD_DATE: '2024-01-01',
    APP_AUTHOR: 'Desarrollo Web',
    
    // Configuración de API
    API_CONFIG: {
        BASE_URL: window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : '/api',
        
        ENDPOINTS: {
            // Autenticación
            AUTH: {
                LOGIN: '/auth/login',
                REGISTER: '/auth/register',
                LOGOUT: '/auth/logout',
                REFRESH: '/auth/refresh',
                PROFILE: '/auth/profile',
                VERIFY: '/auth/verify'
            },
            
            // Usuarios
            USERS: {
                BASE: '/users',
                PROFILE: '/users/profile',
                ROLES: '/users/roles',
                PERMISSIONS: '/users/permissions'
            },
            
            // Productos
            PRODUCTS: {
                BASE: '/products',
                CATEGORIES: '/products/categories',
                BRANDS: '/products/brands',
                SUPPLIERS: '/products/suppliers',
                IMPORT: '/products/import',
                EXPORT: '/products/export',
                BULK: '/products/bulk'
            },
            
            // Inventario
            INVENTORY: {
                BASE: '/inventory',
                MOVEMENTS: '/inventory/movements',
                ADJUSTMENTS: '/inventory/adjustments',
                TRANSFERS: '/inventory/transfers',
                STOCK: '/inventory/stock',
                ALERTS: '/inventory/alerts'
            },
            
            // Códigos QR
            QR: {
                BASE: '/qr',
                GENERATE: '/qr/generate',
                SCAN: '/qr/scan',
                BATCH: '/qr/batch'
            },
            
            // Reportes
            REPORTS: {
                BASE: '/reports',
                INVENTORY: '/reports/inventory',
                MOVEMENTS: '/reports/movements',
                PRODUCTS: '/reports/products',
                SALES: '/reports/sales',
                EXPORT: '/reports/export'
            },
            
            // Configuración
            SETTINGS: {
                BASE: '/settings',
                COMPANY: '/settings/company',
                INVENTORY: '/settings/inventory',
                NOTIFICATIONS: '/settings/notifications',
                BACKUP: '/settings/backup'
            }
        },
        
        // Configuración de peticiones
        REQUEST_CONFIG: {
            TIMEOUT: 30000, // 30 segundos
            RETRY_ATTEMPTS: 3,
            RETRY_DELAY: 1000,
            
            HEADERS: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    },
    
    // Configuración de autenticación
    AUTH_CONFIG: {
        TOKEN_KEY: 'inventory_qr_token',
        REFRESH_TOKEN_KEY: 'inventory_qr_refresh_token',
        USER_KEY: 'inventory_qr_user',
        
        TOKEN_EXPIRY: 24 * 60 * 60 * 1000, // 24 horas
        REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 días
        
        ROLES: {
            ADMIN: 'admin',
            MANAGER: 'manager',
            USER: 'user',
            GUEST: 'guest'
        },
        
        PERMISSIONS: {
            // Productos
            PRODUCTS_VIEW: 'products.view',
            PRODUCTS_CREATE: 'products.create',
            PRODUCTS_EDIT: 'products.edit',
            PRODUCTS_DELETE: 'products.delete',
            PRODUCTS_EXPORT: 'products.export',
            PRODUCTS_IMPORT: 'products.import',
            
            // Inventario
            INVENTORY_VIEW: 'inventory.view',
            INVENTORY_UPDATE: 'inventory.update',
            INVENTORY_ADJUST: 'inventory.adjust',
            INVENTORY_TRANSFER: 'inventory.transfer',
            INVENTORY_EXPORT: 'inventory.export',
            
            // Usuarios
            USERS_VIEW: 'users.view',
            USERS_CREATE: 'users.create',
            USERS_EDIT: 'users.edit',
            USERS_DELETE: 'users.delete',
            
            // Reportes
            REPORTS_VIEW: 'reports.view',
            REPORTS_EXPORT: 'reports.export',
            
            // Configuración
            SETTINGS_VIEW: 'settings.view',
            SETTINGS_EDIT: 'settings.edit'
        }
    },
    
    // Configuración de almacenamiento local
    STORAGE_CONFIG: {
        PREFIX: 'inventory_qr_',
        VERSION: '1.0.0',
        
        KEYS: {
            PRODUCTS: 'products_cache',
            CATEGORIES: 'categories_cache',
            INVENTORY: 'inventory_cache',
            USERS: 'users_cache',
            SETTINGS: 'settings_cache'
        },
        
        TTL: {
            PRODUCTS: 5 * 60 * 1000, // 5 minutos
            CATEGORIES: 30 * 60 * 1000, // 30 minutos
            INVENTORY: 2 * 60 * 1000, // 2 minutos
            USERS: 60 * 60 * 1000, // 1 hora
            SETTINGS: 24 * 60 * 60 * 1000 // 24 horas
        }
    },
    
    // Configuración de subida de archivos
    UPLOAD_CONFIG: {
        MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
        MAX_FILES: 10,
        
        ALLOWED_TYPES: {
            IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
            DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            EXCEL: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            CSV: ['text/csv', 'application/csv']
        },
        
        ENDPOINTS: {
            IMAGES: '/upload/images',
            DOCUMENTS: '/upload/documents',
            IMPORT: '/upload/import'
        }
    },
    
    // Configuración de paginación
    PAGINATION_CONFIG: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
        
        PAGE_SIZES: [10, 20, 50, 100],
        
        VISIBLE_PAGES: 5
    },
    
    // Configuración de notificaciones
    NOTIFICATION_CONFIG: {
        POSITION: 'top-right',
        DURATION: 5000,
        MAX_VISIBLE: 3,
        
        TYPES: {
            SUCCESS: 'success',
            ERROR: 'error',
            WARNING: 'warning',
            INFO: 'info'
        }
    },
    
    // Configuración de exportación
    EXPORT_CONFIG: {
        CSV: {
            DELIMITER: ',',
            ENCODING: 'utf-8',
            BOM: true
        },
        
        PDF: {
            ORIENTATION: 'portrait',
            UNIT: 'mm',
            FORMAT: 'A4',
            MARGINS: {
                TOP: 20,
                RIGHT: 15,
                BOTTOM: 20,
                LEFT: 15
            }
        },
        
        EXCEL: {
            SHEET_NAME: 'Inventario',
            HEADER_STYLE: {
                font: { bold: true },
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } }
            }
        }
    },
    
    // Configuración de códigos QR
    QR_CONFIG: {
        SIZE: 200,
        MARGIN: 10,
        COLOR_DARK: '#000000',
        COLOR_LIGHT: '#FFFFFF',
        FORMAT: 'png',
        ERROR_CORRECTION: 'H', // L, M, Q, H
        
        TYPES: {
            PRODUCT: 'product',
            LOCATION: 'location',
            SUPPLIER: 'supplier'
        },
        
        CONTENT_TEMPLATE: {
            PRODUCT: 'PROD-{id}',
            LOCATION: 'LOC-{id}',
            SUPPLIER: 'SUP-{id}'
        }
    },
    
    // Configuración de inventario
    INVENTORY_CONFIG: {
        STOCK_LEVELS: {
            HIGH: 50,
            MEDIUM: 10,
            LOW: 5,
            CRITICAL: 2
        },
        
        MOVEMENT_TYPES: {
            ENTRY: 'entry',
            EXIT: 'exit',
            ADJUSTMENT: 'adjustment',
            TRANSFER: 'transfer',
            RETURN: 'return'
        },
        
        UNITS: {
            PIECE: 'piece',
            KILOGRAM: 'kg',
            GRAM: 'g',
            LITER: 'l',
            MILLILITER: 'ml',
            METER: 'm',
            CENTIMETER: 'cm'
        },
        
        STATUS: {
            ACTIVE: 'active',
            INACTIVE: 'inactive',
            DISCONTINUED: 'discontinued',
            OUT_OF_STOCK: 'out_of_stock'
        }
    },
    
    // Configuración de validación
    VALIDATION_CONFIG: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PHONE_REGEX: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
        URL_REGEX: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        
        PASSWORD: {
            MIN_LENGTH: 8,
            REQUIRE_UPPERCASE: true,
            REQUIRE_LOWERCASE: true,
            REQUIRE_NUMBER: true,
            REQUIRE_SPECIAL: true
        },
        
        PRODUCT: {
            CODE_MIN_LENGTH: 3,
            CODE_MAX_LENGTH: 50,
            NAME_MIN_LENGTH: 2,
            NAME_MAX_LENGTH: 200,
            DESCRIPTION_MAX_LENGTH: 1000,
            PRICE_MIN: 0,
            PRICE_MAX: 1000000,
            STOCK_MIN: 0,
            STOCK_MAX: 100000
        }
    },
    
    // Configuración de rutas
    ROUTES: {
        PUBLIC: {
            LOGIN: '/login',
            REGISTER: '/register',
            FORGOT_PASSWORD: '/forgot-password',
            RESET_PASSWORD: '/reset-password'
        },
        
        PRIVATE: {
            DASHBOARD: '/dashboard',
            PRODUCTS: {
                LIST: '/products',
                CREATE: '/products/new',
                EDIT: '/products/:id/edit',
                VIEW: '/products/:id',
                CATEGORIES: '/products/categories',
                BRANDS: '/products/brands'
            },
            INVENTORY: {
                LIST: '/inventory',
                MOVEMENTS: '/inventory/movements',
                ADJUSTMENTS: '/inventory/adjustments',
                TRANSFERS: '/inventory/transfers',
                ALERTS: '/inventory/alerts'
            },
            SCANNER: '/scanner',
            REPORTS: '/reports',
            USERS: {
                LIST: '/users',
                CREATE: '/users/new',
                EDIT: '/users/:id/edit',
                PROFILE: '/profile',
                ROLES: '/users/roles'
            },
            SETTINGS: {
                GENERAL: '/settings',
                COMPANY: '/settings/company',
                INVENTORY: '/settings/inventory',
                NOTIFICATIONS: '/settings/notifications',
                BACKUP: '/settings/backup'
            }
        }
    },
    
    // Configuración de temas
    THEME_CONFIG: {
        DEFAULT: 'light',
        AVAILABLE: ['light', 'dark', 'system'],
        
        COLORS: {
            PRIMARY: '#4361ee',
            SECONDARY: '#7209b7',
            SUCCESS: '#06d6a0',
            WARNING: '#ffd166',
            DANGER: '#ef476f',
            INFO: '#118ab2'
        },
        
        FONTS: {
            PRIMARY: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            SECONDARY: "'SF Mono', Monaco, 'Cascadia Mono', 'Courier New', monospace"
        }
    },
    
    // Configuración de características
    FEATURES: {
        OFFLINE_MODE: true,
        QR_SCANNER: true,
        BARCODE_SCANNER: true,
        EXPORT_CSV: true,
        EXPORT_PDF: true,
        EXPORT_EXCEL: true,
        IMPORT_CSV: true,
        IMPORT_EXCEL: true,
        BATCH_OPERATIONS: true,
        NOTIFICATIONS: true,
        AUDIT_LOG: true,
        BACKUP_RESTORE: true
    },
    
    // Configuración de entorno
    ENVIRONMENT: {
        IS_DEVELOPMENT: window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.port === '3000' ||
                        window.location.port === '5173',
        
        IS_PRODUCTION: !(window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' ||
                        window.location.port === '3000' ||
                        window.location.port === '5173'),
        
        DEBUG: true
    }
};

// Exportar configuración global
window.AppConfig = AppConfig;

// Log de información de desarrollo
if (AppConfig.ENVIRONMENT.IS_DEVELOPMENT) {
    console.log('🚀 Sistema de Inventario QR - Configuración cargada');
    console.log('📱 Aplicación:', AppConfig.APP_NAME);
    console.log('📦 Versión:', AppConfig.APP_VERSION);
    console.log('🌍 Entorno:', AppConfig.ENVIRONMENT.IS_DEVELOPMENT ? 'Desarrollo' : 'Producción');
    console.log('🔗 API:', AppConfig.API_CONFIG.BASE_URL);
}