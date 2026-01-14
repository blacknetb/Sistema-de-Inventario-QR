const config = require("../config/env");

/**
 * ✅ CONSTANTES DEL SISTEMA MEJORADAS
 * Correcciones aplicadas:
 * 1. Acceso seguro a propiedades anidadas
 * 2. Funciones helper mejoradas
 * 3. Validación de tipos mejorada
 */

const constants = {
  // ✅ MEJORA: Roles del sistema con validación mejorada
  ROLES: {
    SUPER_ADMIN: {
      id: 1,
      code: "SUPER_ADMIN",
      name: "super_admin",
      displayName: "Super Administrador",
      description: "Administrador con todos los permisos",
      level: 100,
      permissions: ["*"],
    },
    ADMIN: {
      id: 2,
      code: "ADMIN",
      name: "admin",
      displayName: "Administrador",
      description: "Administrador del sistema",
      level: 90,
      permissions: [
        "read",
        "write",
        "delete",
        "manage_users",
        "manage_inventory",
      ],
    },
    MANAGER: {
      id: 3,
      code: "MANAGER",
      name: "manager",
      displayName: "Gerente",
      description: "Gerente con permisos extendidos",
      level: 80,
      permissions: ["read", "write", "manage_inventory"],
    },
    USER: {
      id: 4,
      code: "USER",
      name: "user",
      displayName: "Usuario",
      description: "Usuario regular",
      level: 10,
      permissions: ["read", "write_own"],
    },
    GUEST: {
      id: 5,
      code: "GUEST",
      name: "guest",
      displayName: "Invitado",
      description: "Usuario invitado",
      level: 1,
      permissions: ["read"],
    },
  },

  // ✅ MEJORA: Tipos de movimiento con validación de stock
  MOVEMENT_TYPES: {
    IN: {
      code: "IN",
      name: "Entrada",
      description: "Ingreso de productos al inventario",
      affectsStock: 1,
      sign: "+",
    },
    OUT: {
      code: "OUT",
      name: "Salida",
      description: "Salida de productos del inventario",
      affectsStock: -1,
      sign: "-",
    },
    ADJUSTMENT: {
      code: "ADJUST",
      name: "Ajuste",
      description: "Ajuste manual de inventario",
      affectsStock: 0,
      sign: "±",
    },
    RETURN: {
      code: "RETURN",
      name: "Devolución",
      description: "Devolución de productos",
      affectsStock: 1,
      sign: "+",
    },
    DAMAGE: {
      code: "DAMAGE",
      name: "Daño",
      description: "Productos dañados o perdidos",
      affectsStock: -1,
      sign: "-",
    },
    TRANSFER: {
      code: "TRANSFER",
      name: "Transferencia",
      description: "Transferencia entre ubicaciones",
      affectsStock: 0,
      sign: "↔",
    },
  },

  // ✅ MEJORA: Estados con transiciones válidas
  STATUS: {
    ACTIVE: {
      code: "ACTIVE",
      name: "Activo",
      description: "Elemento activo y disponible",
      canTransitionTo: ["INACTIVE", "SUSPENDED", "DELETED"],
    },
    INACTIVE: {
      code: "INACTIVE",
      name: "Inactivo",
      description: "Elemento temporalmente no disponible",
      canTransitionTo: ["ACTIVE", "DELETED"],
    },
    PENDING: {
      code: "PENDING",
      name: "Pendiente",
      description: "Esperando aprobación o procesamiento",
      canTransitionTo: ["ACTIVE", "REJECTED", "CANCELLED"],
    },
    COMPLETED: {
      code: "COMPLETED",
      name: "Completado",
      description: "Proceso finalizado exitosamente",
      canTransitionTo: ["ARCHIVED"],
    },
    CANCELLED: {
      code: "CANCELLED",
      name: "Cancelado",
      description: "Proceso cancelado",
      canTransitionTo: [],
    },
  },

  // ✅ CORRECCIÓN: Tipos de productos con categorías consistentes
  PRODUCT_TYPES: {
    PHYSICAL: {
      code: "PHYSICAL",
      name: "Físico",
      description: "Producto físico tangible",
      requiresStock: true,
      hasWeight: true,
      hasDimensions: true,
    },
    DIGITAL: {
      code: "DIGITAL",
      name: "Digital",
      description: "Producto digital o servicio",
      requiresStock: false,
      hasWeight: false,
      hasDimensions: false,
    },
    SERVICE: {
      code: "SERVICE",
      name: "Servicio",
      description: "Servicio prestado",
      requiresStock: false,
      hasWeight: false,
      hasDimensions: false,
    },
  },

  // ✅ MEJORA: Unidades de medida con conversiones
  UNITS: {
    WEIGHT: {
      KG: {
        code: "KG",
        name: "Kilogramo",
        symbol: "kg",
        baseUnit: "g",
        conversion: 1000,
      },
      G: {
        code: "G",
        name: "Gramo",
        symbol: "g",
        baseUnit: "g",
        conversion: 1,
      },
      LB: {
        code: "LB",
        name: "Libra",
        symbol: "lb",
        baseUnit: "g",
        conversion: 453.592,
      },
      OZ: {
        code: "OZ",
        name: "Onza",
        symbol: "oz",
        baseUnit: "g",
        conversion: 28.3495,
      },
    },
    VOLUME: {
      L: {
        code: "L",
        name: "Litro",
        symbol: "L",
        baseUnit: "ml",
        conversion: 1000,
      },
      ML: {
        code: "ML",
        name: "Mililitro",
        symbol: "ml",
        baseUnit: "ml",
        conversion: 1,
      },
    },
    COUNT: {
      UNIT: { code: "UNIT", name: "Unidad", symbol: "unidad" },
      PACK: { code: "PACK", name: "Paquete", symbol: "pkg" },
      BOX: { code: "BOX", name: "Caja", symbol: "box" },
    },
  },

  // ✅ MEJORA: Configuración de paginación con valores seguros
  PAGINATION: {
    DEFAULT_LIMIT:
      (config.app?.pagination?.defaultLimit &&
        parseInt(config.app.pagination.defaultLimit)) ||
      20,
    DEFAULT_PAGE: 1,
    MIN_LIMIT: 1,
    MAX_LIMIT:
      (config.app?.pagination?.maxLimit &&
        parseInt(config.app.pagination.maxLimit)) ||
      200,
    ALLOWED_SORT_FIELDS: [
      "id",
      "name",
      "createdAt",
      "updatedAt",
      "price",
      "quantity",
      "status",
    ],
    ALLOWED_SORT_ORDERS: ["ASC", "DESC", "asc", "desc"],
  },

  // ✅ CORRECCIÓN: Tipos de archivos con validación
  FILE_TYPES: {
    IMAGE: {
      mimeTypes: [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/svg+xml",
        "image/bmp",
      ],
      extensions: [
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".webp",
        ".svg",
        ".bmp",
        ".ico",
      ],
      maxSize: 5 * 1024 * 1024, // 5MB
      category: "image",
    },
    DOCUMENT: {
      mimeTypes: [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
        "text/plain",
        "application/rtf",
      ],
      extensions: [
        ".pdf",
        ".doc",
        ".docx",
        ".xls",
        ".xlsx",
        ".csv",
        ".txt",
        ".rtf",
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
      category: "document",
    },
    ARCHIVE: {
      mimeTypes: [
        "application/zip",
        "application/x-rar-compressed",
        "application/x-7z-compressed",
        "application/x-tar",
        "application/gzip",
      ],
      extensions: [".zip", ".rar", ".7z", ".tar", ".gz", ".bz2"],
      maxSize: 50 * 1024 * 1024, // 50MB
      category: "archive",
    },
  },

  // ✅ CORRECCIÓN: Tamaño máximo de archivo con valor seguro
  MAX_FILE_SIZE:
    (config.app?.maxFileSize && parseInt(config.app.maxFileSize)) ||
    10 * 1024 * 1024,

  // ✅ MEJORA: Configuración de seguridad mejorada
  SECURITY: {
    PASSWORD: {
      MIN_LENGTH: 8,
      MAX_LENGTH: 100,
      REQUIRE_UPPERCASE: true,
      REQUIRE_LOWERCASE: true,
      REQUIRE_NUMBERS: true,
      REQUIRE_SYMBOLS: true,
      MAX_ATTEMPTS: 5,
      LOCKOUT_TIME: 15 * 60 * 1000, // 15 minutos
      TOKEN_EXPIRY: 60 * 60 * 1000, // 1 hora
    },
    SESSION: {
      TIMEOUT: 30 * 60 * 1000, // 30 minutos
      EXTEND_ON_ACTIVITY: true,
      MAX_SESSIONS: 5,
    },
    JWT: {
      ALGORITHM: "HS256",
      ISSUER: "inventory-qr-system",
      AUDIENCE: "inventory-qr-system-users",
    },
  },

  // ✅ NUEVO: Códigos de error del sistema
  ERROR_CODES: {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    INTEGRITY_ERROR: "INTEGRITY_ERROR",
    EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
    RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
    MAINTENANCE_MODE: "MAINTENANCE_MODE",
  },

  // ✅ NUEVO: Niveles de log
  LOG_LEVELS: {
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    HTTP: "http",
    VERBOSE: "verbose",
    DEBUG: "debug",
    SILLY: "silly",
  },

  // ✅ NUEVO: Formatos de fecha/hora
  DATE_FORMATS: {
    ISO: "iso",
    DATE_ONLY: "date",
    DATETIME: "datetime",
    HUMAN: "human",
    TIMESTAMP: "timestamp",
    SQL_DATE: "sql_date",
    SQL_DATETIME: "sql_datetime",
  },
};

// ✅ MEJORA: Helper para acceder a constantes por código con validación robusta
constants.getByCode = function (category, code) {
  try {
    if (!this[category] || typeof this[category] !== "object") {
      console.warn(`Categoría de constantes no encontrada: ${category}`);
      return null;
    }

    const categoryObj = this[category];

    // Buscar directamente por clave
    if (categoryObj[code]) {
      return categoryObj[code];
    }

    // Buscar por propiedad 'code'
    for (const key in categoryObj) {
      if (
        categoryObj[key] &&
        typeof categoryObj[key] === "object" &&
        categoryObj[key].code === code
      ) {
        return categoryObj[key];
      }
    }

    // Buscar por propiedad 'name'
    for (const key in categoryObj) {
      if (
        categoryObj[key] &&
        typeof categoryObj[key] === "object" &&
        categoryObj[key].name === code
      ) {
        return categoryObj[key];
      }
    }

    console.warn(`Código no encontrado en categoría ${category}: ${code}`);
    return null;
  } catch (error) {
    console.error(`Error obteniendo constante por código: ${error.message}`);
    return null;
  }
};

// ✅ MEJORA: Helper para obtener lista de opciones para selects con filtros
constants.getOptions = function (category, filterFn = null) {
  try {
    if (!this[category] || typeof this[category] !== "object") {
      return [];
    }

    const options = [];
    const categoryObj = this[category];

    for (const key in categoryObj) {
      const item = categoryObj[key];

      if (item && typeof item === "object" && item.code && item.name) {
        const option = {
          value: item.code,
          label: item.displayName || item.name,
          ...item,
        };

        if (!filterFn || filterFn(item)) {
          options.push(option);
        }
      } else if (typeof item === "string") {
        options.push({
          value: key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
        });
      }
    }

    return options.sort((a, b) => {
      // Ordenar por nivel si existe, sino por label
      if (a.level !== undefined && b.level !== undefined) {
        return b.level - a.level; // Mayor nivel primero
      }
      return a.label.localeCompare(b.label);
    });
  } catch (error) {
    console.error(`Error obteniendo opciones de ${category}: ${error.message}`);
    return [];
  }
};

// ✅ MEJORA: Helper para validar valores con múltiples criterios
constants.isValidValue = function (category, value, property = "code") {
  try {
    if (!this[category] || typeof this[category] !== "object") {
      return false;
    }

    const categoryObj = this[category];

    // Buscar por clave directa
    if (categoryObj[value]) {
      return true;
    }

    // Buscar por propiedad específica
    for (const key in categoryObj) {
      const item = categoryObj[key];
      if (item && typeof item === "object" && item[property] === value) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`Error validando valor en ${category}: ${error.message}`);
    return false;
  }
};

// ✅ NUEVO: Helper para obtener valores por múltiples propiedades
constants.findByProperties = function (category, properties) {
  try {
    if (!this[category] || typeof this[category] !== "object") {
      return null;
    }

    const categoryObj = this[category];

    for (const key in categoryObj) {
      const item = categoryObj[key];
      let match = true;

      if (item && typeof item === "object") {
        for (const prop in properties) {
          if (item[prop] !== properties[prop]) {
            match = false;
            break;
          }
        }

        if (match) {
          return item;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(
      `Error buscando por propiedades en ${category}: ${error.message}`,
    );
    return null;
  }
};

// ✅ NUEVO: Helper para mapear constantes a valores simples
constants.getMap = function (
  category,
  keyProperty = "code",
  valueProperty = "name",
) {
  try {
    const map = {};
    const options = this.getOptions(category);

    options.forEach((option) => {
      if (option[keyProperty] && option[valueProperty]) {
        map[option[keyProperty]] = option[valueProperty];
      }
    });

    return map;
  } catch (error) {
    console.error(`Error creando mapa de ${category}: ${error.message}`);
    return {};
  }
};

module.exports = constants;
