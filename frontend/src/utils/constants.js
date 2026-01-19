// Constantes del sistema de inventario
export const INVENTORY_CONSTANTS = {
  // Estados de producto
  PRODUCT_STATUS: {
    AVAILABLE: 'Disponible',
    LOW_STOCK: 'Bajo Stock',
    OUT_OF_STOCK: 'Agotado',
    DISCONTINUED: 'Descontinuado'
  },
  
  // Colores para cada estado
  STATUS_COLORS: {
    'Disponible': '#2ecc71',
    'Bajo Stock': '#f39c12',
    'Agotado': '#e74c3c',
    'Descontinuado': '#95a5a6'
  },
  
  // Categorías predefinidas
  CATEGORIES: [
    'Electrónica',
    'Accesorios',
    'Oficina',
    'Almacenamiento',
    'Redes',
    'Muebles',
    'Herramientas',
    'Software',
    'Libros',
    'Ropa',
    'Alimentos',
    'Bebidas',
    'Limpieza',
    'Jardinería',
    'Automotriz',
    'Salud',
    'Deportes',
    'Juguetes',
    'Otros'
  ],
  
  // Unidades de medida
  UNITS: [
    'Unidad',
    'Kilogramo',
    'Gramo',
    'Litro',
    'Mililitro',
    'Metro',
    'Centímetro',
    'Caja',
    'Paquete',
    'Docena'
  ],
  
  // Límites para alertas
  ALERT_THRESHOLDS: {
    LOW_STOCK: 10, // Alerta cuando quedan 10 o menos unidades
    CRITICAL_STOCK: 3, // Alerta crítica cuando quedan 3 o menos unidades
    HIGH_VALUE: 1000 // Productos de alto valor (> $1000)
  },
  
  // Configuración de paginación
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZES: [5, 10, 25, 50, 100]
  },
  
  // Formatos de fecha
  DATE_FORMATS: {
    DISPLAY: 'DD/MM/YYYY',
    DATABASE: 'YYYY-MM-DD',
    DATETIME: 'DD/MM/YYYY HH:mm'
  },
  
  // Moneda
  CURRENCY: {
    SYMBOL: '$',
    CODE: 'USD',
    LOCALE: 'es-MX'
  }
};

// Constantes de rutas de API
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  INVENTORY: '/api/inventory',
  REPORTS: '/api/reports',
  USERS: '/api/users',
  ACTIVITY: '/api/activity'
};

// Constantes de mensajes
export const MESSAGES = {
  SUCCESS: {
    PRODUCT_ADDED: 'Producto agregado exitosamente',
    PRODUCT_UPDATED: 'Producto actualizado exitosamente',
    PRODUCT_DELETED: 'Producto eliminado exitosamente',
    INVENTORY_UPDATED: 'Inventario actualizado exitosamente',
    REPORT_GENERATED: 'Reporte generado exitosamente'
  },
  
  ERROR: {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_NUMBER: 'Por favor ingresa un número válido',
    INVALID_PRICE: 'El precio debe ser mayor a 0',
    INVALID_QUANTITY: 'La cantidad debe ser un número entero positivo',
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    NETWORK_ERROR: 'Error de conexión. Por favor intenta nuevamente',
    UNAUTHORIZED: 'No tienes permiso para realizar esta acción'
  },
  
  WARNING: {
    LOW_STOCK: 'Producto con stock bajo',
    OUT_OF_STOCK: 'Producto agotado',
    HIGH_VALUE: 'Producto de alto valor'
  }
};

// Constantes de local storage
export const STORAGE_KEYS = {
  INVENTORY_DATA: 'inventory_data',
  USER_PREFERENCES: 'user_preferences',
  RECENT_SEARCHES: 'recent_searches',
  CART_ITEMS: 'cart_items',
  THEME: 'theme_preference'
};

// Constantes de temas
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  BLUE: 'blue',
  GREEN: 'green'
};

// Constantes de exportación
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  PDF: 'pdf',
  JSON: 'json'
};