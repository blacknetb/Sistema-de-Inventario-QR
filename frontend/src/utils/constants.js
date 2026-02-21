/**
 * constants.js - Constantes globales para Inventory QR System (Frontend)
 * Contiene todos los valores constantes utilizados en la aplicación del frontend.
 */

// ========================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ========================================
export const APP_CONFIG = {
    NAME: 'Inventory QR System',
    VERSION: '1.0.0',
    API_VERSION: 'v1',
    DEFAULT_LANGUAGE: 'es',
    SUPPORTED_LANGUAGES: ['es', 'en'],
    DATE_FORMAT: 'DD/MM/YYYY',
    TIME_FORMAT: 'HH:mm:ss',
    DATETIME_FORMAT: 'DD/MM/YYYY HH:mm:ss',
    CURRENCY: 'MXN',
    TIMEZONE: 'America/Mexico_City'
};

// ========================================
// ESTADOS Y ROLES DE USUARIO
// ========================================
export const USER_ROLES = {
    ADMIN: 'admin',
    MANAGER: 'manager',
    SUPERVISOR: 'supervisor',
    OPERATOR: 'operator',
    VIEWER: 'viewer'
};

export const USER_ROLES_LABELS = {
    [USER_ROLES.ADMIN]: 'Administrador',
    [USER_ROLES.MANAGER]: 'Gerente',
    [USER_ROLES.SUPERVISOR]: 'Supervisor',
    [USER_ROLES.OPERATOR]: 'Operador',
    [USER_ROLES.VIEWER]: 'Consultor'
};

export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked',
    PENDING: 'pending'
};

export const USER_STATUS_LABELS = {
    [USER_STATUS.ACTIVE]: 'Activo',
    [USER_STATUS.INACTIVE]: 'Inactivo',
    [USER_STATUS.BLOCKED]: 'Bloqueado',
    [USER_STATUS.PENDING]: 'Pendiente'
};

export const USER_STATUS_COLORS = {
    [USER_STATUS.ACTIVE]: 'success',
    [USER_STATUS.INACTIVE]: 'default',
    [USER_STATUS.BLOCKED]: 'error',
    [USER_STATUS.PENDING]: 'warning'
};

// ========================================
// ESTADOS DE PRODUCTOS
// ========================================
export const PRODUCT_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DISCONTINUED: 'discontinued',
    OUT_OF_STOCK: 'out_of_stock',
    LOW_STOCK: 'low_stock'
};

export const PRODUCT_STATUS_LABELS = {
    [PRODUCT_STATUS.ACTIVE]: 'Activo',
    [PRODUCT_STATUS.INACTIVE]: 'Inactivo',
    [PRODUCT_STATUS.DISCONTINUED]: 'Descontinuado',
    [PRODUCT_STATUS.OUT_OF_STOCK]: 'Sin Stock',
    [PRODUCT_STATUS.LOW_STOCK]: 'Stock Bajo'
};

export const PRODUCT_STATUS_COLORS = {
    [PRODUCT_STATUS.ACTIVE]: 'success',
    [PRODUCT_STATUS.INACTIVE]: 'default',
    [PRODUCT_STATUS.DISCONTINUED]: 'error',
    [PRODUCT_STATUS.OUT_OF_STOCK]: 'error',
    [PRODUCT_STATUS.LOW_STOCK]: 'warning'
};

// ========================================
// TIPOS DE MOVIMIENTOS DE INVENTARIO
// ========================================
export const MOVEMENT_TYPES = {
    PURCHASE: 'purchase',
    SALE: 'sale',
    ADJUSTMENT: 'adjustment',
    RETURN: 'return',
    TRANSFER: 'transfer',
    DAMAGE: 'damage',
    EXPIRY: 'expiry'
};

export const MOVEMENT_TYPES_LABELS = {
    [MOVEMENT_TYPES.PURCHASE]: 'Compra',
    [MOVEMENT_TYPES.SALE]: 'Venta',
    [MOVEMENT_TYPES.ADJUSTMENT]: 'Ajuste',
    [MOVEMENT_TYPES.RETURN]: 'Devolución',
    [MOVEMENT_TYPES.TRANSFER]: 'Transferencia',
    [MOVEMENT_TYPES.DAMAGE]: 'Daño',
    [MOVEMENT_TYPES.EXPIRY]: 'Caducidad'
};

export const MOVEMENT_TYPES_ICONS = {
    [MOVEMENT_TYPES.PURCHASE]: 'shopping-cart',
    [MOVEMENT_TYPES.SALE]: 'cash-register',
    [MOVEMENT_TYPES.ADJUSTMENT]: 'balance-scale',
    [MOVEMENT_TYPES.RETURN]: 'undo',
    [MOVEMENT_TYPES.TRANSFER]: 'exchange-alt',
    [MOVEMENT_TYPES.DAMAGE]: 'exclamation-triangle',
    [MOVEMENT_TYPES.EXPIRY]: 'calendar-times'
};

// ========================================
// TIPOS DE REPORTES
// ========================================
export const REPORT_TYPES = {
    INVENTORY: 'inventory',
    MOVEMENTS: 'movements',
    SALES: 'sales',
    PRODUCTS: 'products',
    SUPPLIERS: 'suppliers',
    EXPIRY: 'expiry',
    LOW_STOCK: 'low_stock',
    VALUATION: 'valuation',
    AUDIT: 'audit',
    PERFORMANCE: 'performance'
};

export const REPORT_TYPES_LABELS = {
    [REPORT_TYPES.INVENTORY]: 'Reporte de Inventario',
    [REPORT_TYPES.MOVEMENTS]: 'Reporte de Movimientos',
    [REPORT_TYPES.SALES]: 'Reporte de Ventas',
    [REPORT_TYPES.PRODUCTS]: 'Reporte de Productos',
    [REPORT_TYPES.SUPPLIERS]: 'Reporte de Proveedores',
    [REPORT_TYPES.EXPIRY]: 'Reporte de Caducidad',
    [REPORT_TYPES.LOW_STOCK]: 'Reporte de Stock Bajo',
    [REPORT_TYPES.VALUATION]: 'Reporte de Valorización',
    [REPORT_TYPES.AUDIT]: 'Reporte de Auditoría',
    [REPORT_TYPES.PERFORMANCE]: 'Reporte de Rendimiento'
};

// ========================================
// FORMATOS DE EXPORTACIÓN
// ========================================
export const EXPORT_FORMATS = {
    PDF: 'pdf',
    EXCEL: 'excel',
    CSV: 'csv',
    JSON: 'json',
    XML: 'xml'
};

export const EXPORT_FORMATS_LABELS = {
    [EXPORT_FORMATS.PDF]: 'PDF',
    [EXPORT_FORMATS.EXCEL]: 'Excel',
    [EXPORT_FORMATS.CSV]: 'CSV',
    [EXPORT_FORMATS.JSON]: 'JSON',
    [EXPORT_FORMATS.XML]: 'XML'
};

// ========================================
// CONFIGURACIÓN DE PAGINACIÓN
// ========================================
export const PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: parseInt(process.env.REACT_APP_PAGINATION_DEFAULT_LIMIT) || 20,
    MAX_LIMIT: parseInt(process.env.REACT_APP_PAGINATION_MAX_LIMIT) || 100,
    PAGE_SIZES: [10, 20, 50, 100]
};

// ========================================
// MENSAJES DEL SISTEMA
// ========================================
export const MESSAGES = {
    SUCCESS: {
        CREATE: 'Registro creado exitosamente',
        UPDATE: 'Registro actualizado exitosamente',
        DELETE: 'Registro eliminado exitosamente',
        IMPORT: 'Datos importados exitosamente',
        EXPORT: 'Datos exportados exitosamente',
        LOGIN: 'Sesión iniciada correctamente',
        LOGOUT: 'Sesión cerrada correctamente',
        PASSWORD_CHANGE: 'Contraseña cambiada exitosamente'
    },
    ERROR: {
        GENERIC: 'Ha ocurrido un error',
        NETWORK: 'Error de conexión',
        VALIDATION: 'Error de validación',
        UNAUTHORIZED: 'No autorizado',
        FORBIDDEN: 'Acceso denegado',
        NOT_FOUND: 'Recurso no encontrado',
        SERVER: 'Error del servidor',
        TIMEOUT: 'Tiempo de espera agotado'
    },
    WARNING: {
        UNSAVED_CHANGES: 'Tiene cambios sin guardar',
        DELETE_CONFIRM: '¿Está seguro de eliminar este registro?',
        LOW_STOCK: 'Productos con stock bajo',
        EXPIRING: 'Productos próximos a vencer'
    },
    INFO: {
        LOADING: 'Cargando...',
        NO_DATA: 'No hay datos disponibles',
        SEARCH: 'Ingrese su búsqueda'
    }
};

// ========================================
// VALIDACIÓN
// ========================================
export const VALIDATION_RULES = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 20,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    DESCRIPTION_MAX_LENGTH: 500,
    SKU_MAX_LENGTH: 50,
    BARCODE_MAX_LENGTH: 20,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,
    PRICE_MIN: 0,
    PRICE_MAX: 9999999.99,
    STOCK_MIN: 0,
    STOCK_MAX: 999999
};

// ========================================
// CONFIGURACIÓN DE QR
// ========================================
export const QR_CONFIG = {
    DEFAULT_SIZE: parseInt(process.env.REACT_APP_QR_CODE_SIZE) || 300,
    DEFAULT_MARGIN: parseInt(process.env.REACT_APP_QR_CODE_MARGIN) || 4,
    DEFAULT_ERROR_CORRECTION: process.env.REACT_APP_QR_CODE_ERROR_CORRECTION_LEVEL || 'H',
    COLORS: {
        DARK: '#000000',
        LIGHT: '#FFFFFF',
        PRIMARY: '#0066CC',
        SUCCESS: '#10B981',
        WARNING: '#F59E0B',
        ERROR: '#EF4444'
    },
    FORMATS: ['png', 'svg', 'jpeg'],
    TYPES: ['product', 'location', 'contact', 'wifi', 'event']
};

// ========================================
// CONFIGURACIÓN DE NOTIFICACIONES
// ========================================
export const NOTIFICATION_CONFIG = {
    LOW_STOCK_THRESHOLD: parseInt(process.env.REACT_APP_NOTIFY_LOW_STOCK_THRESHOLD) || 10,
    EXPIRY_DAYS: parseInt(process.env.REACT_APP_NOTIFY_EXPIRY_DAYS) || 7,
    DURATION: 5000,
    POSITION: 'top-right',
    TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    }
};

// ========================================
// RUTAS DE LA APLICACIÓN
// ========================================
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',

    DASHBOARD: '/dashboard',

    PRODUCTS: '/products',
    PRODUCT_DETAIL: (id) => `/products/${id}`,
    PRODUCT_CREATE: '/products/create',
    PRODUCT_EDIT: (id) => `/products/${id}/edit`,

    CATEGORIES: '/categories',
    CATEGORY_DETAIL: (id) => `/categories/${id}`,
    CATEGORY_CREATE: '/categories/create',
    CATEGORY_EDIT: (id) => `/categories/${id}/edit`,

    SUPPLIERS: '/suppliers',
    SUPPLIER_DETAIL: (id) => `/suppliers/${id}`,
    SUPPLIER_CREATE: '/suppliers/create',
    SUPPLIER_EDIT: (id) => `/suppliers/${id}/edit`,

    USERS: '/users',
    USER_DETAIL: (id) => `/users/${id}`,
    USER_CREATE: '/users/create',
    USER_EDIT: (id) => `/users/${id}/edit`,
    PROFILE: '/profile',

    REPORTS: '/reports',
    REPORT_GENERATE: (type) => `/reports/generate/${type}`,

    QR: '/qr',
    QR_SCANNER: '/qr/scanner',
    QR_GENERATE: '/qr/generate',

    SETTINGS: '/settings'
};

// ========================================
// PERMISOS
// ========================================
export const PERMISSIONS = {
    PRODUCTS: {
        VIEW: 'products:view',
        CREATE: 'products:create',
        EDIT: 'products:edit',
        DELETE: 'products:delete',
        EXPORT: 'products:export',
        IMPORT: 'products:import'
    },
    CATEGORIES: {
        VIEW: 'categories:view',
        CREATE: 'categories:create',
        EDIT: 'categories:edit',
        DELETE: 'categories:delete'
    },
    SUPPLIERS: {
        VIEW: 'suppliers:view',
        CREATE: 'suppliers:create',
        EDIT: 'suppliers:edit',
        DELETE: 'suppliers:delete'
    },
    USERS: {
        VIEW: 'users:view',
        CREATE: 'users:create',
        EDIT: 'users:edit',
        DELETE: 'users:delete'
    },
    REPORTS: {
        VIEW: 'reports:view',
        GENERATE: 'reports:generate',
        EXPORT: 'reports:export'
    },
    SETTINGS: {
        VIEW: 'settings:view',
        EDIT: 'settings:edit'
    }
};