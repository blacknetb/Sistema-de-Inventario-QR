/**
 * ✅ VALIDADOR SIMPLIFICADO Y CORREGIDO
 * Versión compatible con todas las rutas
 */

const Joi = require("joi");

// ✅ ESQUEMAS BÁSICOS
const schemas = {
  idParam: Joi.object({
    id: Joi.alternatives()
      .try(
        Joi.number().integer().positive().required(),
        Joi.string().pattern(/^\d+$/).required(),
      )
      .required(),
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string()
      .pattern(/^[a-zA-Z_]+:(ASC|DESC)$/)
      .default("id:DESC"),
  }),
};

// ✅ VALIDADORES COMUNES
const commonValidators = {
  email: () => Joi.string().email().trim().lowercase().required(),
  password: () =>
    Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .message(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número",
      ),
  phone: () =>
    Joi.string()
      .pattern(/^[\+]?[1-9][0-9]{7,14}$/)
      .message("Formato de teléfono inválido"),
};

// ✅ FUNCIÓN DE SANITIZACIÓN
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== "object") return obj;

    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "string") {
        obj[key] = obj[key]
          .replace(/<[^>]*>/g, "")
          .replace(/javascript:/gi, "")
          .trim();
      } else if (typeof obj[key] === "object") {
        sanitize(obj[key]);
      }
    });

    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};

// ✅ VALIDACIÓN DE PARÁMETROS
const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Parámetros inválidos",
        details: error.details.map((detail) => detail.message),
      });
    }

    req.params = value;
    next();
  };
};

// ✅ VALIDACIÓN DE BODY
const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Datos inválidos",
        details: error.details.map((detail) => ({
          field: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    req.body = value;
    next();
  };
};

// ✅ VALIDACIÓN DE QUERY
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      convert: true,
      stripUnknown: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Parámetros de consulta inválidos",
        details: error.details.map((detail) => ({
          param: detail.path.join("."),
          message: detail.message,
        })),
      });
    }

    req.query = value;
    next();
  };
};

// ✅ VALIDACIÓN SIMPLE DE PAGINACIÓN
const validatePagination = (req, res, next) => {
  try {
    // Página
    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) {
      page = 1;
    }

    // Límite
    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 100) {
      limit = 20;
    }

    // Ordenamiento
    let sort = req.query.sort || "id:DESC";
    const sortRegex = /^[a-zA-Z_]+:(ASC|DESC)$/;
    if (!sortRegex.test(sort)) {
      sort = "id:DESC";
    }

    req.query.page = page;
    req.query.limit = limit;
    req.query.sort = sort;

    next();
  } catch (error) {
    console.error("Error en validación de paginación:", error);
    return res.status(400).json({
      success: false,
      message: "Error en los parámetros de paginación",
    });
  }
};

// ✅ FUNCIÓN PARA EXTENDER ESQUEMAS (simplificada)
const extendSchema = (baseSchema, extension) => {
  if (baseSchema && baseSchema.keys) {
    return baseSchema.keys(extension);
  }
  return Joi.object(extension);
};

// ✅ EXPORTACIÓN SIMPLIFICADA
module.exports = {
  Joi,
  schemas,
  commonValidators,
  sanitizeInput,
  validateParams,
  validateBody,
  validateQuery,
  validatePagination,
  extendSchema,
};
