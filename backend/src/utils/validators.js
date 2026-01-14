const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);
const constants = require("./constants");
const config = require("../config/env");

/**
 * ✅ VALIDADORES MEJORADOS CON CORRECCIONES
 * Correcciones aplicadas:
 * 1. Manejo consistente de tipos de datos
 * 2. Validación de referencias a constantes
 * 3. Schemas más robustos y reutilizables
 */

// ✅ HELPER: Obtener códigos válidos de constantes
const getValidCodes = (category, property = "code") => {
  try {
    const options = constants.getOptions(category);
    return options.map((opt) => opt[property] || opt.value).filter(Boolean);
  } catch (error) {
    console.error(`Error obteniendo códigos válidos de ${category}:`, error);
    return [];
  }
};

// ✅ HELPER: Schemas base reutilizables
const baseSchemas = {
  id: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().pattern(/^\d+$/))
    .required()
    .messages({
      "any.required": "El ID es requerido",
      "number.base": "El ID debe ser un número válido",
      "string.pattern.base": "El ID debe ser un número válido",
    }),

  email: Joi.string().email().required().normalize().max(100).messages({
    "string.email": "Debe ser un email válido",
    "string.empty": "El email es requerido",
    "string.max": "El email no puede exceder 100 caracteres",
  }),

  password: Joi.string()
    .min(constants.SECURITY.PASSWORD.MIN_LENGTH)
    .max(constants.SECURITY.PASSWORD.MAX_LENGTH)
    .required()
    .pattern(
      new RegExp(
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{" +
          constants.SECURITY.PASSWORD.MIN_LENGTH +
          ",}$",
      ),
    )
    .messages({
      "string.min": `La contraseña debe tener al menos ${constants.SECURITY.PASSWORD.MIN_LENGTH} caracteres`,
      "string.pattern.base":
        "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial",
      "string.empty": "La contraseña es requerida",
    }),

  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .messages({
      "string.pattern.base": "El nombre solo puede contener letras y espacios",
      "string.empty": "El nombre es requerido",
      "string.min": "El nombre debe tener al menos 2 caracteres",
      "string.max": "El nombre no puede exceder 100 caracteres",
    }),

  phone: Joi.string()
    .pattern(/^[0-9\-\+\s\(\)]{7,20}$/)
    .allow("", null)
    .messages({
      "string.pattern.base": "Formato de teléfono no válido",
    }),

  price: Joi.number().positive().precision(2).max(9999999.99).messages({
    "number.positive": "El valor debe ser mayor a 0",
    "number.max": "El valor no puede exceder 9,999,999.99",
  }),

  quantity: Joi.number().integer().min(0).messages({
    "number.base": "La cantidad debe ser un número",
    "number.min": "La cantidad no puede ser negativa",
  }),
};

const validators = {
  // ✅ MEJORA: Validación para registro de usuario mejorada
  register: Joi.object({
    name: baseSchemas.name,

    email: baseSchemas.email,

    password: baseSchemas.password,

    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Las contraseñas no coinciden",
        "string.empty": "La confirmación de contraseña es requerida",
      }),

    role: Joi.string()
      .valid(...getValidCodes("ROLES"))
      .default(constants.ROLES.USER.code)
      .messages({
        "any.only": "Rol no válido",
      }),

    phone: baseSchemas.phone,

    company: Joi.string().trim().max(100).allow("", null),

    position: Joi.string().trim().max(100).allow("", null),

    department: Joi.string().trim().max(100).allow("", null),
  }).with("password", "confirmPassword"),

  // ✅ CORRECCIÓN: Validación para login mejorada
  login: Joi.object({
    email: Joi.string().email().required().normalize().messages({
      "string.email": "Debe ser un email válido",
      "string.empty": "El email es requerido",
    }),

    password: Joi.string().required().messages({
      "string.empty": "La contraseña es requerida",
    }),

    rememberMe: Joi.boolean().default(false),

    deviceId: Joi.string().max(200).allow("", null),

    userAgent: Joi.string().max(500).allow("", null),
  }),

  // ✅ MEJORA: Validación para productos con validación de referencias
  product: Joi.object({
    name: Joi.string().trim().min(2).max(255).required().messages({
      "string.empty": "El nombre del producto es requerido",
      "string.min": "El nombre debe tener al menos 2 caracteres",
      "string.max": "El nombre no puede exceder 255 caracteres",
    }),

    description: Joi.string().trim().max(2000).allow("", null),

    sku: Joi.string()
      .trim()
      .max(100)
      .required()
      .pattern(/^[A-Z0-9\-_]+$/)
      .messages({
        "string.pattern.base":
          "El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos",
        "string.empty": "El SKU es requerido",
      }),

    barcode: Joi.string()
      .trim()
      .max(100)
      .pattern(/^[0-9]+$/)
      .allow("", null)
      .messages({
        "string.pattern.base":
          "El código de barras solo puede contener números",
      }),

    categoryId: baseSchemas.id.messages({
      "any.required": "La categoría es requerida",
    }),

    type: Joi.string()
      .valid(...getValidCodes("PRODUCT_TYPES"))
      .default(constants.PRODUCT_TYPES.PHYSICAL.code),

    brand: Joi.string().trim().max(100).allow("", null),

    price: baseSchemas.price.required(),

    cost: baseSchemas.price.required(),

    minStock: Joi.number().integer().min(0).default(0).messages({
      "number.min": "El stock mínimo no puede ser negativo",
    }),

    maxStock: Joi.number().integer().min(1).default(1000).messages({
      "number.min": "El stock máximo debe ser al menos 1",
    }),

    currentStock: Joi.number().integer().min(0).default(0),

    unit: Joi.string().trim().max(50).default("UNIT"),

    weight: Joi.number().positive().precision(3).allow(null),

    dimensions: Joi.string()
      .pattern(/^\d+(\.\d+)?x\d+(\.\d+)?x\d+(\.\d+)?$/)
      .allow("", null)
      .messages({
        "string.pattern.base":
          "Las dimensiones deben estar en formato LxAxA (ej: 10.5x5.2x2.0)",
      }),

    status: Joi.string()
      .valid(...getValidCodes("STATUS"))
      .default(constants.STATUS.ACTIVE.code),

    tags: Joi.array().items(Joi.string().trim().max(50)).max(10),

    notes: Joi.string().trim().max(1000).allow("", null),

    expiryDate: Joi.date().iso().min("now").allow(null).messages({
      "date.min": "La fecha de expiración debe ser futura",
      "date.format": "La fecha debe estar en formato ISO (YYYY-MM-DD)",
    }),

    supplierId: baseSchemas.id.allow(null),

    location: Joi.string().trim().max(100).allow("", null),
  }),

  // ✅ MEJORA: Validación para categorías con validación de parentId
  category: Joi.object({
    name: Joi.string().trim().min(2).max(255).required().messages({
      "string.empty": "El nombre de la categoría es requerido",
    }),

    description: Joi.string().trim().max(1000).allow("", null),

    parentId: Joi.alternatives()
      .try(
        Joi.number().integer().positive(),
        Joi.string().pattern(/^\d+$/),
        Joi.valid(null),
      )
      .allow(null),

    code: Joi.string()
      .trim()
      .max(50)
      .uppercase()
      .pattern(/^[A-Z0-9_]+$/)
      .allow("", null),

    status: Joi.string()
      .valid(...getValidCodes("STATUS"))
      .default(constants.STATUS.ACTIVE.code),

    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .allow("", null)
      .messages({
        "string.pattern.base":
          "El color debe estar en formato hexadecimal (ej: #FF0000 o #F00)",
      }),

    icon: Joi.string().trim().max(100).allow("", null),

    displayOrder: Joi.number().integer().min(0).default(0),

    metadata: Joi.object().unknown(true).allow(null),
  }),

  // ✅ CORRECCIÓN: Validación para inventario con movimiento type validado
  inventory: Joi.object({
    productId: baseSchemas.id.messages({
      "any.required": "El producto es requerido",
    }),

    quantity: baseSchemas.quantity.required(),

    movementType: Joi.string()
      .valid(...getValidCodes("MOVEMENT_TYPES"))
      .required()
      .messages({
        "any.required": "El tipo de movimiento es requerido",
        "any.only": "Tipo de movimiento no válido",
      }),

    reason: Joi.string().trim().max(500).required().messages({
      "string.empty": "La razón del movimiento es requerida",
    }),

    reference: Joi.string().trim().max(100).allow("", null),

    location: Joi.string().trim().max(100).allow("", null),

    batchNumber: Joi.string().trim().max(50).allow("", null),

    expiryDate: Joi.date().iso().allow(null),

    cost: baseSchemas.price.allow(null),

    notes: Joi.string().trim().max(1000).allow("", null),

    userId: baseSchemas.id.allow(null),

    transactionId: baseSchemas.id.allow(null),
  }),

  // ✅ MEJORA: Validación para usuarios con validación de roles
  user: Joi.object({
    name: baseSchemas.name,

    email: baseSchemas.email,

    role: Joi.string()
      .valid(...getValidCodes("ROLES"))
      .default(constants.ROLES.USER.code),

    status: Joi.string()
      .valid(...getValidCodes("STATUS"))
      .default(constants.STATUS.ACTIVE.code),

    phone: baseSchemas.phone,

    department: Joi.string().trim().max(100).allow("", null),

    position: Joi.string().trim().max(100).allow("", null),

    avatar: Joi.string().uri().allow("", null).messages({
      "string.uri": "El avatar debe ser una URL válida",
    }),
  }),

  // ✅ CORRECCIÓN: Validación para cambio de contraseña
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      "string.empty": "La contraseña actual es requerida",
    }),

    newPassword: baseSchemas.password,

    confirmNewPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({
        "any.only": "Las contraseñas no coinciden",
      }),
  }),

  // ✅ CORRECCIÓN: Validación para recuperación de contraseña
  resetPassword: Joi.object({
    email: baseSchemas.email,

    token: Joi.string().required().min(10).messages({
      "string.empty": "El token es requerido",
      "string.min": "Token inválido",
    }),

    newPassword: baseSchemas.password,

    confirmNewPassword: Joi.string().valid(Joi.ref("newPassword")).required(),
  }),

  // ✅ MEJORA: Validación para búsqueda con paginación
  search: Joi.object({
    q: Joi.string().trim().max(200).allow(""),

    page: Joi.number()
      .integer()
      .min(1)
      .default(constants.PAGINATION.DEFAULT_PAGE),

    limit: Joi.number()
      .integer()
      .min(constants.PAGINATION.MIN_LIMIT)
      .max(constants.PAGINATION.MAX_LIMIT)
      .default(constants.PAGINATION.DEFAULT_LIMIT),

    categoryId: baseSchemas.id.allow(null),

    status: Joi.string()
      .valid(...getValidCodes("STATUS"), "all")
      .default(constants.STATUS.ACTIVE.code),

    minPrice: baseSchemas.price.allow(null),

    maxPrice: baseSchemas.price.allow(null),

    inStock: Joi.boolean().allow(null),

    sortBy: Joi.string()
      .valid(...constants.PAGINATION.ALLOWED_SORT_FIELDS)
      .default("name"),

    sortOrder: Joi.string()
      .valid(...constants.PAGINATION.ALLOWED_SORT_ORDERS)
      .default("ASC"),

    fields: Joi.string()
      .pattern(/^[a-zA-Z_,\s]+$/)
      .allow("")
      .messages({
        "string.pattern.base": "Los campos deben estar separados por comas",
      }),
  }),

  // ✅ NUEVO: Validación para filtros de fecha
  dateRange: Joi.object({
    startDate: Joi.date().iso().required().messages({
      "date.base": "La fecha de inicio debe ser una fecha válida",
      "date.format": "La fecha debe estar en formato ISO (YYYY-MM-DD)",
    }),

    endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
      "date.base": "La fecha de fin debe ser una fecha válida",
      "date.min": "La fecha de fin debe ser mayor o igual a la fecha de inicio",
    }),

    timezone: Joi.string().default("UTC"),
  }),

  // ✅ MEJORA: Validación para archivos
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    size: Joi.number().integer().positive().required(),
    destination: Joi.string(),
    filename: Joi.string().required(),
    path: Joi.string().required(),
    buffer: Joi.binary(),
  }),

  // ✅ MEJORA: Funciones de utilidad para validación con mejor manejo de errores
  validatePartial: (schema, data, options = {}) => {
    const defaultOptions = {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: true,
      convert: true,
    };

    return schema.validate(data, { ...defaultOptions, ...options });
  },

  validateStrict: (schema, data, options = {}) => {
    const defaultOptions = {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false,
      convert: true,
    };

    return schema.validate(data, { ...defaultOptions, ...options });
  },

  // ✅ NUEVO: Validación de array de IDs
  idsArray: Joi.array()
    .items(baseSchemas.id)
    .min(1)
    .max(100)
    .unique()
    .messages({
      "array.min": "Debe proporcionar al menos un ID",
      "array.max": "No se pueden procesar más de 100 IDs a la vez",
      "array.unique": "Los IDs deben ser únicos",
    }),

  // ✅ NUEVO: Validación de UUID
  uuid: Joi.string()
    .guid({ version: ["uuidv4"] })
    .required()
    .messages({
      "string.guid": "Debe ser un UUID válido",
      "string.empty": "El UUID es requerido",
    }),

  // ✅ NUEVO: Validación de URL
  url: Joi.string()
    .uri({ scheme: ["http", "https"] })
    .messages({
      "string.uri": "Debe ser una URL válida",
      "string.uriCustomScheme": "La URL debe usar http o https",
    }),

  // ✅ NUEVO: Validación de coordenadas
  coordinates: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),

  // ✅ Exportar schemas base
  baseSchemas,
};

module.exports = validators;
