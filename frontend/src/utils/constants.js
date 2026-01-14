// ==================== CONSTANTES DE LA APLICACIÓN ====================

// ✅ CONFIGURACIÓN DE APLICACIÓN
export const APP_CONFIG = {
  NAME: import.meta.env.VITE_APP_NAME || "Sistema de Inventario QR",
  VERSION: import.meta.env.VITE_APP_VERSION || "1.0.0",
  SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL || "soporte@inventarioqr.com",
  COPYRIGHT_YEAR: new Date().getFullYear(),
  COMPANY_NAME: import.meta.env.VITE_COMPANY_NAME || "Inventory QR System",
  COMPANY_URL: import.meta.env.VITE_COMPANY_URL || "https://inventarioqr.com",

  // ✅ CONFIGURACIÓN DE API COMPATIBLE CON BACKEND
  API_CONFIG: {
    BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
    TIMEOUT: Number.parseInt(import.meta.env.VITE_API_TIMEOUT || "30000"),
    MAX_RETRIES: Number.parseInt(import.meta.env.VITE_API_MAX_RETRIES || "3"),
    RETRY_DELAY: Number.parseInt(import.meta.env.VITE_API_RETRY_DELAY || "1000"),
  },

  // ✅ CONFIGURACIÓN DE SEGURIDAD
  SECURITY: {
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutos antes de expirar
    SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hora
    MAX_LOGIN_ATTEMPTS: 5,
  },

  // ✅ CONFIGURACIÓN DE UI/UX
  UI: {
    THEME: {
      DEFAULT: "light",
      AVAILABLE: ["light", "dark", "system"],
    },
    LANGUAGE: {
      DEFAULT: "es",
      AVAILABLE: ["es", "en"],
    },
    ANIMATION_DURATION: 200,
    TOAST_DURATION: 5000,
  },
};

// ==================== ENDPOINTS DE API (COMPATIBLE CON BACKEND) ====================
export const API_ENDPOINTS = {
  // ✅ ENDPOINTS ACTUALIZADOS PARA COINCIDIR CON BACKEND
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    PROFILE: "/api/auth/profile",
    REFRESH_TOKEN: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
    CHANGE_PASSWORD: "/api/auth/change-password",
    VERIFY_TOKEN: "/api/auth/verify",
  },

  USERS: {
    BASE: "/api/users",
    BY_ID: (id) => `/api/users/${id}`,
    PROFILE: "/api/users/profile",
    UPDATE_PROFILE: "/api/users/profile",
  },

  PRODUCTS: {
    BASE: "/api/products",
    BY_ID: (id) => `/api/products/${id}`,
    BY_SKU: (sku) => `/api/products/sku/${sku}`,
    SEARCH: "/api/products/search",
    LOW_STOCK: "/api/products/low-stock",
    CATEGORY: (categoryId) => `/api/products/category/${categoryId}`,
    IMPORT: "/api/products/import",
    EXPORT: "/api/products/export",
    STATS: "/api/products/stats",
  },

  CATEGORIES: {
    BASE: "/api/categories",
    BY_ID: (id) => `/api/categories/${id}`,
    TREE: "/api/categories/tree",
    WITH_PRODUCTS: "/api/categories/with-products",
  },

  INVENTORY: {
    BASE: "/api/inventory",
    BY_ID: (id) => `/api/inventory/${id}`,
    MOVEMENTS: "/api/inventory/movements",
    HISTORY: "/api/inventory/history",
    ADJUST: "/api/inventory/adjust",
    TRANSFER: "/api/inventory/transfer",
    COUNT: "/api/inventory/count",
    REPORT: "/api/inventory/report",
  },

  TRANSACTIONS: {
    BASE: "/api/transactions",
    BY_ID: (id) => `/api/transactions/${id}`,
    BY_TYPE: (type) => `/api/transactions/type/${type}`,
    BY_PRODUCT: (productId) => `/api/transactions/product/${productId}`,
    SUMMARY: "/api/transactions/summary",
    REPORT: "/api/transactions/report",
  },

  QR_CODES: {
    BASE: "/api/qr-codes",
    BY_ID: (id) => `/api/qr-codes/${id}`,
    GENERATE: "/api/qr-codes/generate",
    SCAN: "/api/qr-codes/scan",
    BY_PRODUCT: (productId) => `/api/qr-codes/product/${productId}`,
    DOWNLOAD: (code) => `/api/qr-codes/download/${code}`,
    BULK_GENERATE: "/api/qr-codes/bulk-generate",
  },

  REPORTS: {
    BASE: "/api/reports",
    INVENTORY: "/api/reports/inventory",
    MOVEMENTS: "/api/reports/movements",
    TRANSACTIONS: "/api/reports/transactions",
    SALES: "/api/reports/sales",
    DASHBOARD: "/api/reports/dashboard",
    CUSTOM: "/api/reports/custom",
    GENERATE: "/api/reports/generate",
    EXPORT: (format) => `/api/reports/export/${format}`,
  },

  DASHBOARD: {
    STATS: "/api/dashboard/stats",
    OVERVIEW: "/api/dashboard/overview",
    CHARTS: "/api/dashboard/charts",
    ALERTS: "/api/dashboard/alerts",
    RECENT_ACTIVITY: "/api/dashboard/recent-activity",
  },

  FILES: {
    UPLOAD: "/api/files/upload",
    DOWNLOAD: (filename) => `/api/files/download/${filename}`,
    DELETE: (filename) => `/api/files/delete/${filename}`,
    LIST: "/api/files/list",
  },

  SETTINGS: {
    BASE: "/api/settings",
    COMPANY: "/api/settings/company",
    INVENTORY: "/api/settings/inventory",
    NOTIFICATIONS: "/api/settings/notifications",
    INTEGRATIONS: "/api/settings/integrations",
  },
};

// ==================== ALMACENAMIENTO LOCAL ====================
export const STORAGE_KEYS = {
  // ✅ KEYS ORGANIZADAS POR CATEGORÍA
  AUTH: {
    ACCESS_TOKEN: "qr_inventory_access_token",
    REFRESH_TOKEN: "qr_inventory_refresh_token",
    TOKEN_EXPIRY: "qr_inventory_token_expiry",
    USER_DATA: "qr_inventory_user_data",
    SESSION_ID: "qr_inventory_session_id",
  },

  USER: {
    PREFERENCES: "qr_inventory_user_preferences",
    RECENT_SEARCHES: "qr_inventory_recent_searches",
    FAVORITES: "qr_inventory_favorites",
    NOTIFICATIONS: "qr_inventory_notifications",
  },

  APP: {
    THEME: "qr_inventory_theme",
    LANGUAGE: "qr_inventory_language",
    SIDEBAR_STATE: "qr_inventory_sidebar_state",
    LAST_VISITED: "qr_inventory_last_visited",
    TOUR_COMPLETED: "qr_inventory_tour_completed",
  },

  CACHE: {
    PRODUCTS: "qr_inventory_cache_products",
    CATEGORIES: "qr_inventory_cache_categories",
    DASHBOARD: "qr_inventory_cache_dashboard",
    REPORTS: "qr_inventory_cache_reports",
  },

  WORKFLOW: {
    DRAFT_FORMS: "qr_inventory_draft_forms",
    UPLOAD_QUEUE: "qr_inventory_upload_queue",
    SCAN_HISTORY: "qr_inventory_scan_history",
  },
};

// ==================== CONFIGURACIÓN DE TIEMPOS ====================
export const TIMING = {
  // ✅ TIEMPOS OPTIMIZADOS PARA MEJOR UX
  API: {
    TIMEOUT: 30000,
    DEBOUNCE: 300,
    RETRY_DELAY: 1000,
    POLLING_INTERVAL: 30000,
  },

  UI: {
    ANIMATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    TOAST: {
      SUCCESS: 3000,
      ERROR: 5000,
      WARNING: 4000,
      INFO: 3000,
    },
    LOADING: {
      MINIMUM: 500,
      TIMEOUT: 30000,
    },
  },

  CACHE: {
    PRODUCTS: 5 * 60 * 1000, // 5 minutos
    CATEGORIES: 10 * 60 * 1000, // 10 minutos
    DASHBOARD: 2 * 60 * 1000, // 2 minutos
    REPORTS: 30 * 60 * 1000, // 30 minutos
    USER_DATA: 60 * 60 * 1000, // 1 hora
  },
};

// ==================== PAGINACIÓN Y FILTRADO ====================
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  LIMIT_OPTIONS: [10, 20, 50, 100],
  SORT_OPTIONS: {
    NAME_ASC: { field: "name", direction: "asc" },
    NAME_DESC: { field: "name", direction: "desc" },
    CREATED_ASC: { field: "created_at", direction: "asc" },
    CREATED_DESC: { field: "created_at", direction: "desc" },
    PRICE_ASC: { field: "price", direction: "asc" },
    PRICE_DESC: { field: "price", direction: "desc" },
    STOCK_ASC: { field: "current_stock", direction: "asc" },
    STOCK_DESC: { field: "current_stock", direction: "desc" },
  },
};

// ==================== ROLES Y PERMISOS ====================
export const ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  MANAGER: "manager",
  USER: "user",
  VIEWER: "viewer",

  // ✅ FUNCIONES HELPER PARA ROLES
  isAdmin: (role) => ["super_admin", "admin"].includes(role),
  canManageUsers: (role) => ["super_admin", "admin"].includes(role),
  canManageProducts: (role) => ["super_admin", "admin", "manager"].includes(role),
  canViewReports: (role) => ["super_admin", "admin", "manager"].includes(role),
  canScanQR: (role) => true, // Todos los roles pueden escanear
  isReadOnly: (role) => role === "viewer",
};

// ==================== ESTADOS DE PRODUCTO ====================
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DISCONTINUED: "discontinued",
  ARCHIVED: "archived",

  // ✅ MÉTODOS HELPER
  isValid: (status) => Object.values(PRODUCT_STATUS).includes(status),
  getLabel: (status) => {
    const labels = {
      [PRODUCT_STATUS.ACTIVE]: "Activo",
      [PRODUCT_STATUS.INACTIVE]: "Inactivo",
      [PRODUCT_STATUS.DISCONTINUED]: "Descontinuado",
      [PRODUCT_STATUS.ARCHIVED]: "Archivado",
    };
    return labels[status] || "Desconocido";
  },
  getColor: (status) => {
    const colors = {
      [PRODUCT_STATUS.ACTIVE]: "success",
      [PRODUCT_STATUS.INACTIVE]: "warning",
      [PRODUCT_STATUS.DISCONTINUED]: "error",
      [PRODUCT_STATUS.ARCHIVED]: "gray",
    };
    return colors[status] || "gray";
  },
};

// ==================== ESTADOS DE INVENTARIO ====================
export const INVENTORY_STATUS = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  OUT_OF_STOCK: "out_of_stock",
  OVER_STOCK: "over_stock",

  // ✅ CÁLCULO AUTOMÁTICO DE ESTADO
  calculate: (current, min, max) => {
    if (current <= 0) return INVENTORY_STATUS.OUT_OF_STOCK;
    if (current <= min) return INVENTORY_STATUS.LOW_STOCK;
    if (current >= max) return INVENTORY_STATUS.OVER_STOCK;
    return INVENTORY_STATUS.IN_STOCK;
  },

  getLabel: (status) => {
    const labels = {
      [INVENTORY_STATUS.IN_STOCK]: "En Stock",
      [INVENTORY_STATUS.LOW_STOCK]: "Stock Bajo",
      [INVENTORY_STATUS.OUT_OF_STOCK]: "Sin Stock",
      [INVENTORY_STATUS.OVER_STOCK]: "Exceso de Stock",
    };
    return labels[status] || "Desconocido";
  },

  getColor: (status) => {
    const colors = {
      [INVENTORY_STATUS.IN_STOCK]: "success",
      [INVENTORY_STATUS.LOW_STOCK]: "warning",
      [INVENTORY_STATUS.OUT_OF_STOCK]: "error",
      [INVENTORY_STATUS.OVER_STOCK]: "info",
    };
    return colors[status] || "gray";
  },

  getIcon: (status) => {
    const icons = {
      [INVENTORY_STATUS.IN_STOCK]: "check-circle",
      [INVENTORY_STATUS.LOW_STOCK]: "exclamation-circle",
      [INVENTORY_STATUS.OUT_OF_STOCK]: "x-circle",
      [INVENTORY_STATUS.OVER_STOCK]: "information-circle",
    };
    return icons[status] || "question-mark-circle";
  },
};

// ==================== TIPOS DE MOVIMIENTO ====================
export const MOVEMENT_TYPES = {
  ENTRY: "entry",
  EXIT: "exit",
  ADJUSTMENT: "adjustment",
  TRANSFER: "transfer",
  COUNT: "count",

  getLabel: (type) => {
    const labels = {
      [MOVEMENT_TYPES.ENTRY]: "Entrada",
      [MOVEMENT_TYPES.EXIT]: "Salida",
      [MOVEMENT_TYPES.ADJUSTMENT]: "Ajuste",
      [MOVEMENT_TYPES.TRANSFER]: "Transferencia",
      [MOVEMENT_TYPES.COUNT]: "Conteo",
    };
    return labels[type] || "Desconocido";
  },

  getColor: (type) => {
    const colors = {
      [MOVEMENT_TYPES.ENTRY]: "success",
      [MOVEMENT_TYPES.EXIT]: "error",
      [MOVEMENT_TYPES.ADJUSTMENT]: "warning",
      [MOVEMENT_TYPES.TRANSFER]: "info",
      [MOVEMENT_TYPES.COUNT]: "purple",
    };
    return colors[type] || "gray";
  },
};

// ==================== FORMATOS DE FECHA Y HORA ====================
export const DATE_FORMATS = {
  // Compatible con backend
  API: {
    DATE: "yyyy-MM-dd",
    DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
    TIME: "HH:mm:ss",
  },

  // Para display en UI
  DISPLAY: {
    DATE: "dd/MM/yyyy",
    DATETIME: "dd/MM/yyyy HH:mm",
    TIME: "HH:mm",
    SHORT_DATE: "dd/MM/yy",
    LONG_DATE: "dd MMMM yyyy",
    RELATIVE: "relative",
  },

  // Para nombres de archivo
  FILENAME: {
    DATE: "yyyyMMdd",
    DATETIME: "yyyyMMdd_HHmmss",
    TIMESTAMP: "yyyyMMdd_HHmmss_SSS",
  },
};

// ==================== CONFIGURACIÓN DE MONEDA ====================
export const CURRENCY_CONFIG = {
  DEFAULT: "MXN",
  LOCALE: "es-MX",

  FORMATS: {
    MXN: {
      symbol: "$",
      code: "MXN",
      decimals: 2,
      thousandsSeparator: ",",
      decimalSeparator: ".",
      format: "symbol",
    },
    USD: {
      symbol: "US$",
      code: "USD",
      decimals: 2,
      thousandsSeparator: ",",
      decimalSeparator: ".",
      format: "symbol",
    },
    EUR: {
      symbol: "€",
      code: "EUR",
      decimals: 2,
      thousandsSeparator: ".",
      decimalSeparator: ",",
      format: "symbol",
    },
  },

  // ✅ FUNCIÓN CORREGIDA PARA FORMATEAR MONEDA
  format: (amount, currency = "MXN", options = {}) => {
    const config = CURRENCY_CONFIG.FORMATS[currency] || CURRENCY_CONFIG.FORMATS.MXN;
    const locale = CURRENCY_CONFIG.LOCALE;

    const formatter = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: config.code,
      minimumFractionDigits: options.decimals ?? config.decimals,
      maximumFractionDigits: options.decimals ?? config.decimals,
    });

    return formatter.format(amount);
  },
};

// ==================== LÍMITES DE ARCHIVOS ====================
export const FILE_LIMITS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_TOTAL_SIZE: 50 * 1024 * 1024, // 50MB para múltiples archivos
  MAX_FILES: 10,

  ALLOWED_TYPES: [
    // Imágenes
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",

    // Documentos
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

    // Hojas de cálculo
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

    // CSV
    "text/csv",
    "text/plain",
  ],

  ALLOWED_EXTENSIONS: [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".csv",
    ".txt",
  ],
};

// ==================== COLORES DE LA APLICACIÓN ====================
export const COLORS = {
  // Paleta principal
  PRIMARY: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },

  SECONDARY: {
    50: "#f8fafc",
    100: "#f1f5f9",
    200: "#e2e8f0",
    300: "#cbd5e1",
    400: "#94a3b8",
    500: "#64748b",
    600: "#475569",
    700: "#334155",
    800: "#1e293b",
    900: "#0f172a",
  },

  // Funciones helper
  getStatusColor: (status) => {
    const statusColors = {
      in_stock: COLORS.SUCCESS[500],
      low_stock: COLORS.WARNING[500],
      out_of_stock: COLORS.ERROR[500],
      over_stock: COLORS.INFO[500],
      active: COLORS.SUCCESS[500],
      inactive: COLORS.WARNING[500],
      discontinued: COLORS.ERROR[500],
      archived: COLORS.SECONDARY[500],
    };
    return statusColors[status] || COLORS.SECONDARY[500];
  },

  getMovementColor: (type) => {
    const movementColors = {
      entry: COLORS.SUCCESS[500],
      exit: COLORS.ERROR[500],
      adjustment: COLORS.WARNING[500],
      transfer: COLORS.INFO[500],
      count: COLORS.PRIMARY[500],
    };
    return movementColors[type] || COLORS.SECONDARY[500];
  },
};

// ✅ EXPORTACIÓN POR DEFECTO
export default {
  APP_CONFIG,
  API_ENDPOINTS,
  STORAGE_KEYS,
  TIMING,
  PAGINATION,
  ROLES,
  PRODUCT_STATUS,
  INVENTORY_STATUS,
  MOVEMENT_TYPES,
  DATE_FORMATS,
  CURRENCY_CONFIG,
  FILE_LIMITS,
  COLORS,
};