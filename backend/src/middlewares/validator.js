/**
 * ✅ VALIDATOR.JS - SISTEMA MEJORADO DE VALIDACIÓN
 *
 * Correcciones aplicadas:
 * 1. Manejo robusto de errores
 * 2. Validaciones más específicas
 * 3. Sanitización de datos mejorada
 * 4. Soporte para múltiples fuentes de datos
 * 5. Cache de esquemas para mejor rendimiento
 */

const Joi = require("joi");

// ✅ MEJORA: Cache de esquemas compilados para mejor rendimiento
const schemaCache = new Map();

/**
 * Compila y cachea un esquema Joi
 * @param {Joi.Schema} schema - Esquema Joi
 * @returns {Joi.Schema} Esquema compilado
 */
const getCachedSchema = (schema) => {
  if (!schema.isJoi) {
    throw new Error("El esquema debe ser una instancia de Joi");
  }

  const cacheKey = schema.describe();
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey);
  }

  schemaCache.set(cacheKey, schema);
  return schema;
};

/**
 * Middleware para validar el cuerpo de la solicitud
 * @param {Joi.Schema} schema - Esquema de validación
 * @param {Object} options - Opciones de validación
 * @returns {Function} Middleware de validación
 */
const validateBody = (schema, options = {}) => {
  const compiledSchema = getCachedSchema(schema);

  return async (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
        convert: true,
        errors: {
          wrap: { label: "" },
        },
        context: {
          // ✅ MEJORA: Contexto adicional para validaciones condicionales
          user: req.user,
          method: req.method,
          path: req.path,
        },
        ...options,
      };

      const { error, value } = compiledSchema.validate(
        req.body,
        validationOptions,
      );

      if (error) {
        const errors = error.details.map((detail) => {
          const path = Array.isArray(detail.path)
            ? detail.path.join(".")
            : detail.path;
          return {
            field: path || "unknown",
            message: detail.message.replace(/['"]+/g, ""),
            type: detail.type,
            code: `VALIDATION_${detail.type.toUpperCase()}`,
            context: detail.context,
          };
        });

        // ✅ MEJORA: Log estructurado de errores de validación
        console.warn("Validation error:", {
          errors: errors.map((e) => ({ field: e.field, message: e.message })),
          path: req.path,
          method: req.method,
          userId: req.user?.id || "anonymous",
        });

        return res.status(400).json({
          success: false,
          message: "Error de validación en los datos enviados",
          code: "VALIDATION_ERROR",
          errors,
          validatedFields: Object.keys(value || {}),
        });
      }

      // ✅ MEJORA: Sanitizar datos después de validación
      req.body = sanitizeData(value);
      req.validatedBody = value; // Copia de datos validados

      next();
    } catch (error) {
      console.error("Error en middleware de validación:", error);
      res.status(500).json({
        success: false,
        message: "Error interno en validación de datos",
        code: "VALIDATION_INTERNAL_ERROR",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  };
};

/**
 * Middleware para validar parámetros de consulta
 * @param {Joi.Schema} schema - Esquema de validación
 * @param {Object} options - Opciones de validación
 * @returns {Function} Middleware de validación
 */
const validateQuery = (schema, options = {}) => {
  const compiledSchema = getCachedSchema(schema);

  return async (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
        convert: true,
        ...options,
      };

      const { error, value } = compiledSchema.validate(
        req.query,
        validationOptions,
      );

      if (error) {
        const errors = error.details.map((detail) => ({
          field: Array.isArray(detail.path)
            ? detail.path.join(".")
            : detail.path,
          message: detail.message.replace(/['"]+/g, ""),
          type: detail.type,
          code: `QUERY_${detail.type.toUpperCase()}`,
        }));

        return res.status(400).json({
          success: false,
          message: "Error de validación en parámetros de consulta",
          code: "QUERY_VALIDATION_ERROR",
          errors,
        });
      }

      req.query = sanitizeData(value);
      req.validatedQuery = value;

      next();
    } catch (error) {
      console.error("Error validando query params:", error);
      res.status(500).json({
        success: false,
        message: "Error interno validando parámetros de consulta",
        code: "QUERY_VALIDATION_INTERNAL_ERROR",
      });
    }
  };
};

/**
 * Middleware para validar parámetros de ruta
 * @param {Joi.Schema} schema - Esquema de validación
 * @param {Object} options - Opciones de validación
 * @returns {Function} Middleware de validación
 */
const validateParams = (schema, options = {}) => {
  const compiledSchema = getCachedSchema(schema);

  return async (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: false,
        convert: true,
        ...options,
      };

      const { error, value } = compiledSchema.validate(
        req.params,
        validationOptions,
      );

      if (error) {
        const errors = error.details.map((detail) => ({
          field: Array.isArray(detail.path)
            ? detail.path.join(".")
            : detail.path,
          message: detail.message.replace(/['"]+/g, ""),
          type: detail.type,
          code: `PARAMS_${detail.type.toUpperCase()}`,
        }));

        return res.status(400).json({
          success: false,
          message: "Error de validación en parámetros de ruta",
          code: "PARAMS_VALIDATION_ERROR",
          errors,
        });
      }

      req.params = value;
      req.validatedParams = value;

      next();
    } catch (error) {
      console.error("Error validando route params:", error);
      res.status(500).json({
        success: false,
        message: "Error interno validando parámetros de ruta",
        code: "PARAMS_VALIDATION_INTERNAL_ERROR",
      });
    }
  };
};

/**
 * Middleware para validar headers
 * @param {Joi.Schema} schema - Esquema de validación
 * @param {Object} options - Opciones de validación
 * @returns {Function} Middleware de validación
 */
const validateHeaders = (schema, options = {}) => {
  const compiledSchema = getCachedSchema(schema);

  return async (req, res, next) => {
    try {
      const validationOptions = {
        abortEarly: false,
        stripUnknown: true,
        allowUnknown: true, // Permitir headers adicionales
        convert: true,
        ...options,
      };

      const { error, value } = compiledSchema.validate(
        req.headers,
        validationOptions,
      );

      if (error) {
        const errors = error.details.map((detail) => ({
          field: Array.isArray(detail.path)
            ? detail.path.join(".")
            : detail.path,
          message: detail.message.replace(/['"]+/g, ""),
          type: detail.type,
          code: `HEADERS_${detail.type.toUpperCase()}`,
        }));

        return res.status(400).json({
          success: false,
          message: "Error de validación en headers",
          code: "HEADERS_VALIDATION_ERROR",
          errors,
        });
      }

      req.validatedHeaders = value;
      next();
    } catch (error) {
      console.error("Error validando headers:", error);
      res.status(500).json({
        success: false,
        message: "Error interno validando headers",
        code: "HEADERS_VALIDATION_INTERNAL_ERROR",
      });
    }
  };
};

/**
 * Sanitiza datos después de validación
 * @param {any} data - Datos a sanitizar
 * @returns {any} Datos sanitizados
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== "object") {
    if (typeof data === "string") {
      return data.trim() || null;
    }
    return data;
  }

  const sanitize = (obj) => {
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "string") {
        // Eliminar espacios en blanco y caracteres de control
        obj[key] = obj[key].trim().replace(/[\x00-\x1F\x7F]/g, "");

        // Convertir vacíos a null
        if (obj[key] === "") {
          obj[key] = null;
        }
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitize(obj[key]);
      }
    });
    return obj;
  };

  // ✅ MEJORA: No mutar el objeto original
  return sanitize({ ...data });
};

/**
 * Esquemas de validación predefinidos
 */
const schemas = {
  // Esquemas de usuario
  register: Joi.object({
    email: Joi.string()
      .email({
        minDomainSegments: 2,
        tlds: { allow: ["com", "net", "org", "edu"] },
      })
      .required()
      .normalize()
      .max(100)
      .messages({
        "string.email": "El email debe tener un formato válido",
        "any.required": "El email es requerido",
        "string.max": "El email no puede exceder 100 caracteres",
      }),
    password: Joi.string()
      .min(8)
      .max(100)
      .required()
      .pattern(
        new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$"),
      )
      .messages({
        "string.min": "La contraseña debe tener al menos 8 caracteres",
        "string.max": "La contraseña no puede exceder 100 caracteres",
        "string.pattern.base":
          "La contraseña debe contener al menos una mayúscula, una minúscula y un número",
      }),
    name: Joi.string()
      .trim()
      .required()
      .min(2)
      .max(100)
      .pattern(new RegExp("^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s\\-'\"]+$"))
      .messages({
        "string.pattern.base":
          "El nombre solo puede contener letras, espacios y guiones",
        "string.min": "El nombre debe tener al menos 2 caracteres",
        "string.max": "El nombre no puede exceder 100 caracteres",
      }),
    role: Joi.string()
      .valid("user", "admin", "manager")
      .default("user")
      .messages({
        "any.only": "El rol debe ser uno de: user, admin, manager",
      }),
    phone: Joi.string()
      .pattern(
        new RegExp(
          "^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$",
        ),
      )
      .allow("", null)
      .messages({
        "string.pattern.base": "Número de teléfono inválido",
      }),
  }),

  login: Joi.object({
    email: Joi.string().email().required().normalize().messages({
      "string.email": "El email debe tener un formato válido",
      "any.required": "El email es requerido",
    }),
    password: Joi.string().required().messages({
      "any.required": "La contraseña es requerida",
    }),
    rememberMe: Joi.boolean().default(false),
  }),

  // Esquemas de productos
  product: Joi.object({
    name: Joi.string().trim().required().min(2).max(255).messages({
      "any.required": "El nombre del producto es requerido",
      "string.min": "El nombre debe tener al menos 2 caracteres",
      "string.max": "El nombre no puede exceder 255 caracteres",
    }),
    description: Joi.string().trim().max(2000).allow("", null),
    sku: Joi.string()
      .trim()
      .required()
      .max(100)
      .pattern(new RegExp("^[A-Z0-9\\-\\_]+$"))
      .messages({
        "string.pattern.base":
          "El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos",
      }),
    price: Joi.number()
      .positive()
      .precision(2)
      .max(9999999.99)
      .required()
      .messages({
        "number.positive": "El precio debe ser un número positivo",
        "number.max": "El precio no puede exceder 9,999,999.99",
      }),
    cost: Joi.number()
      .positive()
      .precision(2)
      .max(9999999.99)
      .required()
      .messages({
        "number.positive": "El costo debe ser un número positivo",
        "number.max": "El costo no puede exceder 9,999,999.99",
      }),
    quantity: Joi.number().integer().min(0).default(0),
    minStock: Joi.number().integer().min(0).default(5),
    maxStock: Joi.number()
      .integer()
      .min(Joi.ref("minStock"))
      .default(100)
      .messages({
        "number.min": "El stock máximo debe ser mayor o igual al stock mínimo",
      }),
    categoryId: Joi.number().integer().positive().allow(null).messages({
      "number.positive": "El ID de categoría debe ser un número positivo",
    }),
    status: Joi.string()
      .valid("active", "inactive", "discontinued")
      .default("active")
      .messages({
        "any.only": "El estado debe ser uno de: active, inactive, discontinued",
      }),
    barcode: Joi.string().trim().max(100).allow("", null),
    weight: Joi.number().positive().allow(null),
    dimensions: Joi.string()
      .pattern(new RegExp("^\\d+(\\.\\d+)?x\\d+(\\.\\d+)?x\\d+(\\.\\d+)?$"))
      .allow("", null)
      .messages({
        "string.pattern.base":
          "Las dimensiones deben estar en formato: largo x ancho x alto (ej: 10x20x30)",
      }),
  }),

  // Esquema para IDs
  idParam: Joi.object({
    id: Joi.alternatives()
      .try(
        Joi.number().integer().positive().required(),
        Joi.string().pattern(new RegExp("^\\d+$")).required(),
      )
      .custom((value, helpers) => {
        if (typeof value === "string") {
          const num = parseInt(value, 10);
          if (isNaN(num) || num <= 0) {
            return helpers.error("any.invalid");
          }
          return num;
        }
        return value;
      }, "ID conversion")
      .messages({
        "any.required": "El ID es requerido",
        "any.invalid": "El ID debe ser un número positivo",
      }),
  }),

  // Esquema de paginación
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.min": "La página debe ser al menos 1",
    }),
    limit: Joi.number().integer().min(1).max(200).default(20).messages({
      "number.max": "El límite no puede exceder 200 registros",
    }),
    search: Joi.string().trim().max(100).allow(""),
    sortBy: Joi.string().trim().max(50).default("created_at"),
    sortOrder: Joi.string().valid("ASC", "DESC").default("DESC").messages({
      "any.only": "El orden debe ser ASC o DESC",
    }),
  }),

  // Esquema de fechas
  dateRange: Joi.object({
    startDate: Joi.date().iso().max("now").required().messages({
      "date.format": "Fecha de inicio debe estar en formato ISO (YYYY-MM-DD)",
      "date.max": "La fecha de inicio no puede ser futura",
    }),
    endDate: Joi.date()
      .iso()
      .min(Joi.ref("startDate"))
      .max("now")
      .required()
      .messages({
        "date.min": "La fecha fin debe ser posterior o igual a la fecha inicio",
        "date.max": "La fecha fin no puede ser futura",
      }),
  }),
};

/**
 * Validadores comunes reutilizables
 */
const commonValidators = {
  email: () => Joi.string().email().normalize().max(100),
  password: () => Joi.string().min(8).max(100),
  phone: () =>
    Joi.string().pattern(
      new RegExp(
        "^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$",
      ),
    ),
  url: () => Joi.string().uri().max(500),
  positiveNumber: () => Joi.number().positive(),
  positiveInteger: () => Joi.number().integer().positive(),
  status: (validStatuses = ["active", "inactive"]) =>
    Joi.string().valid(...validStatuses),
  date: () => Joi.date().iso(),
  boolean: () => Joi.boolean().truthy("true", "1").falsy("false", "0"),
  // ✅ NUEVO: Validador para nombres de archivo
  filename: () =>
    Joi.string()
      .pattern(new RegExp("^[a-zA-Z0-9\\-\\_\\.]+$"))
      .max(255)
      .messages({
        "string.pattern.base":
          "El nombre del archivo solo puede contener letras, números, guiones, guiones bajos y puntos",
      }),
};

// Exportar módulo
module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  validateHeaders,
  sanitizeData,
  schemas,
  commonValidators,
  getCachedSchema,

  // ✅ MEJORA: Exportar Joi para uso externo
  Joi,

  // ✅ MEJORA: Función para validar datos directamente (útil para tests)
  validate: (schema, data, options = {}) => {
    const compiledSchema = getCachedSchema(schema);
    const { error, value } = compiledSchema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      ...options,
    });

    if (error) {
      throw error;
    }

    return value;
  },

  // ✅ MEJORA: Clear cache (útil para tests)
  clearCache: () => {
    schemaCache.clear();
  },
};
