const constants = {
  // Estados de inventario
  INVENTORY_STATUS: {
    AVAILABLE: 'Disponible',
    LOW_STOCK: 'Bajo Stock',
    OUT_OF_STOCK: 'Agotado',
    RESERVED: 'Reservado',
    DAMAGED: 'Dañado',
    EXPIRED: 'Expirado'
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
    'Material de Oficina',
    'Limpieza',
    'Seguridad',
    'Alimentos',
    'Bebidas',
    'Ropa',
    'Calzado',
    'Deportes',
    'Juguetes',
    'Automotriz',
    'Industrial'
  ],

  // Unidades de medida
  UNITS: [
    'Unidad',
    'Pulgada',
    'Centímetro',
    'Metro',
    'Gramo',
    'Kilogramo',
    'Litro',
    'Mililitro',
    'Caja',
    'Paquete',
    'Docena',
    'Resma',
    'Rollos',
    'Botella',
    'Latas'
  ],

  // Tipos de movimiento
  MOVEMENT_TYPES: {
    ENTRY: 'Entrada',
    EXIT: 'Salida',
    ADJUSTMENT: 'Ajuste',
    TRANSFER: 'Transferencia',
    RETURN: 'Devolución',
    DAMAGE: 'Daño',
    LOSS: 'Pérdida'
  },

  // Roles de usuario
  USER_ROLES: {
    ADMIN: 'admin',
    MANAGER: 'manager',
    USER: 'user',
    VIEWER: 'viewer'
  },

  // Colores para estados
  STATUS_COLORS: {
    'Disponible': '#2ecc71',    // Verde
    'Bajo Stock': '#f39c12',    // Naranja
    'Agotado': '#e74c3c',       // Rojo
    'Reservado': '#3498db',     // Azul
    'Dañado': '#95a5a6',        // Gris
    'Expirado': '#34495e'       // Azul oscuro
  },

  // Colores para categorías
  CATEGORY_COLORS: [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#34495e', '#e67e22', '#27ae60', '#8e44ad',
    '#d35400', '#16a085', '#c0392b', '#2980b9', '#f1c40f'
  ],

  // Configuración de paginación
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 10,
    PAGE_SIZES: [5, 10, 20, 50, 100],
    MAX_PAGE_BUTTONS: 5
  },

  // Configuración de notificaciones
  NOTIFICATION_SETTINGS: {
    AUTO_CHECK_INTERVAL: 300000, // 5 minutos en milisegundos
    DISPLAY_DURATION: 5000,      // 5 segundos
    MAX_DISPLAYED: 5             // Máximo notificaciones mostradas
  },

  // Límites de validación
  VALIDATION_LIMITS: {
    MAX_NAME_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_SKU_LENGTH: 50,
    MAX_CATEGORY_NAME_LENGTH: 50,
    MAX_QUANTITY: 999999,
    MAX_PRICE: 9999999.99,
    MAX_MINIMUM_STOCK: 99999
  },

  // Formato de fechas
  DATE_FORMATS: {
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
    API: 'YYYY-MM-DD',
    API_WITH_TIME: 'YYYY-MM-DDTHH:mm:ssZ'
  },

  // Moneda
  CURRENCY: {
    SYMBOL: '$',
    DECIMAL_PLACES: 2,
    THOUSAND_SEPARATOR: ',',
    DECIMAL_SEPARATOR: '.'
  },

  // Configuración de exportación
  EXPORT: {
    DEFAULT_FORMAT: 'csv',
    SUPPORTED_FORMATS: ['csv', 'excel', 'json', 'pdf'],
    MAX_ROWS_FOR_PDF: 1000
  },

  // Configuración de backup
  BACKUP: {
    AUTO_BACKUP_INTERVAL: 3600000, // 1 hora en milisegundos
    MAX_BACKUPS: 10,
    BACKUP_KEY: 'inventory_backup'
  },

  // Mensajes del sistema
  MESSAGES: {
    SUCCESS: {
      ITEM_CREATED: 'Producto creado exitosamente',
      ITEM_UPDATED: 'Producto actualizado exitosamente',
      ITEM_DELETED: 'Producto eliminado exitosamente',
      STOCK_UPDATED: 'Stock actualizado exitosamente',
      CATEGORY_CREATED: 'Categoría creada exitosamente',
      CATEGORY_UPDATED: 'Categoría actualizada exitosamente',
      CATEGORY_DELETED: 'Categoría eliminada exitosamente',
      REPORT_GENERATED: 'Reporte generado exitosamente',
      DATA_EXPORTED: 'Datos exportados exitosamente',
      DATA_IMPORTED: 'Datos importados exitosamente',
      BACKUP_CREATED: 'Backup creado exitosamente',
      BACKUP_RESTORED: 'Backup restaurado exitosamente'
    },
    ERROR: {
      ITEM_NOT_FOUND: 'Producto no encontrado',
      CATEGORY_NOT_FOUND: 'Categoría no encontrada',
      INVALID_DATA: 'Datos inválidos proporcionados',
      UNAUTHORIZED: 'No autorizado para realizar esta acción',
      NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu conexión a internet.',
      SERVER_ERROR: 'Error del servidor. Por favor, intenta nuevamente más tarde.',
      DUPLICATE_ITEM: 'Ya existe un producto con ese nombre/SKU',
      DUPLICATE_CATEGORY: 'Ya existe una categoría con ese nombre',
      CATEGORY_IN_USE: 'No se puede eliminar la categoría porque hay productos usándola',
      INSUFFICIENT_STOCK: 'Stock insuficiente para realizar esta operación',
      EXPORT_ERROR: 'Error al exportar los datos',
      IMPORT_ERROR: 'Error al importar los datos',
      BACKUP_ERROR: 'Error al crear/restaurar el backup'
    },
    WARNING: {
      LOW_STOCK: 'Producto con bajo stock detectado',
      OUT_OF_STOCK: 'Producto agotado detectado',
      EXPIRING_SOON: 'Producto próximo a expirar',
      DATA_LOSS: 'Esta acción puede causar pérdida de datos. ¿Estás seguro?',
      DELETE_CONFIRMATION: '¿Estás seguro de que deseas eliminar este registro? Esta acción no se puede deshacer.'
    },
    INFO: {
      NO_DATA: 'No hay datos para mostrar',
      SEARCH_NO_RESULTS: 'No se encontraron resultados para tu búsqueda',
      LOADING: 'Cargando...',
      SAVING: 'Guardando...',
      PROCESSING: 'Procesando...'
    }
  },

  // Rutas de la aplicación
  ROUTES: {
    DASHBOARD: '/',
    INVENTORY: '/inventario',
    INVENTORY_ADD: '/inventario/nuevo',
    INVENTORY_EDIT: '/inventario/editar/:id',
    CATEGORIES: '/categorias',
    REPORTS: '/reportes',
    SETTINGS: '/configuracion',
    LOGIN: '/login',
    REGISTER: '/registro',
    PROFILE: '/perfil',
    NOTIFICATIONS: '/notificaciones',
    HELP: '/ayuda',
    ABOUT: '/acerca-de'
  },

  // Configuración de API
  API_ENDPOINTS: {
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      PROFILE: '/auth/profile',
      REFRESH_TOKEN: '/auth/refresh'
    },
    INVENTORY: {
      BASE: '/inventory',
      GET_ALL: '/inventory',
      GET_ONE: '/inventory/:id',
      CREATE: '/inventory',
      UPDATE: '/inventory/:id',
      DELETE: '/inventory/:id',
      UPDATE_STOCK: '/inventory/:id/stock',
      SEARCH: '/inventory/search',
      STATS: '/inventory/stats',
      EXPORT: '/inventory/export',
      IMPORT: '/inventory/import'
    },
    CATEGORIES: {
      BASE: '/categories',
      GET_ALL: '/categories',
      GET_ONE: '/categories/:id',
      CREATE: '/categories',
      UPDATE: '/categories/:id',
      DELETE: '/categories/:id',
      STATS: '/categories/stats'
    },
    REPORTS: {
      BASE: '/reports',
      INVENTORY: '/reports/inventory',
      MOVEMENTS: '/reports/movements',
      LOW_STOCK: '/reports/low-stock',
      SALES: '/reports/sales'
    },
    NOTIFICATIONS: {
      BASE: '/notifications',
      GET_ALL: '/notifications',
      MARK_READ: '/notifications/:id/read',
      MARK_ALL_READ: '/notifications/read-all',
      DELETE: '/notifications/:id',
      DELETE_ALL: '/notifications'
    }
  },

  // Configuración de localStorage keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'authToken',
    USER_DATA: 'user',
    INVENTORY_ITEMS: 'inventory_items',
    CATEGORIES: 'categories',
    NOTIFICATIONS: 'notifications',
    SETTINGS: 'app_settings',
    BACKUP: 'inventory_backup',
    RECENT_SEARCHES: 'recent_searches',
    FAVORITES: 'favorite_items'
  },

  // Configuración por defecto de la aplicación
  DEFAULT_SETTINGS: {
    THEME: 'light',
    LANGUAGE: 'es',
    NOTIFICATIONS_ENABLED: true,
    AUTO_SAVE: true,
    ITEMS_PER_PAGE: 10,
    CURRENCY: 'USD',
    TIMEZONE: 'America/Mexico_City',
    DATE_FORMAT: 'DD/MM/YYYY',
    DECIMAL_SEPARATOR: '.',
    THOUSAND_SEPARATOR: ','
  }
};

export default constants;