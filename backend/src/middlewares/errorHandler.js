/**
 * ✅ ERRORHANDLER.JS - MANEJADOR MEJORADO DE ERRORES
 *
 * Correcciones aplicadas:
 * 1. Manejo estructurado de errores
 * 2. Logging completo con contexto
 * 3. Respuestas de error consistentes
 * 4. Middleware para operaciones asíncronas
 */

const logger = require("../utils/logger");
const config = require("../config/env");

/**
 * Middleware para manejar rutas no encontradas
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  error.status = 404;
  error.code = "ROUTE_NOT_FOUND";
  error.details = {
    method: req.method,
    url: req.originalUrl,
    timestamp: new Date().toISOString(),
    ip: req.ip,
  };

  logger.warn(`404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Middleware principal de manejo de errores
 * @param {Error} err - Error
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
const handleError = (err, req, res, next) => {
  // ✅ MEJORA: Determinar status code
  const statusCode =
    err.status ||
    err.statusCode ||
    (err.response && err.response.status) ||
    500;

  // ✅ MEJORA: Información del error
  let message = err.message || "Error interno del servidor";
  let errorCode = err.code || "INTERNAL_SERVER_ERROR";
  let details = err.details || {};

  // ✅ MEJORA: Logging estructurado
  const logData = {
    error: {
      name: err.name,
      message: err.message,
      code: errorCode,
      stack: err.stack,
    },
    request: {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      userId: req.userId || "anonymous",
      params: req.params,
      query: req.query,
      body: config.server.nodeEnv === "development" ? req.body : undefined,
    },
    response: {
      statusCode,
      timestamp: new Date().toISOString(),
    },
    environment: config.server.nodeEnv,
  };

  // ✅ MEJORA: Niveles de log según tipo de error
  if (statusCode >= 500) {
    logger.error(`Error ${statusCode}: ${message}`, logData);
  } else if (statusCode >= 400) {
    logger.warn(`Error ${statusCode}: ${message}`, logData);
  } else {
    logger.info(`Error ${statusCode}: ${message}`, logData);
  }

  // ✅ MEJORA: Respuesta de error estructurada
  const response = {
    success: false,
    message: message,
    code: errorCode,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    ...details,
  };

  // ✅ MEJORA: Información adicional para desarrollo
  if (config.server.nodeEnv === "development") {
    response.stack = err.stack;
    response.error = {
      name: err.name,
      message: err.message,
      code: err.code,
    };

    // ✅ MEJORA: Información de validación Joi
    if (err.isJoi) {
      response.validationErrors = err.details.map((detail) => ({
        field: Array.isArray(detail.path) ? detail.path.join(".") : detail.path,
        message: detail.message.replace(/['"]+/g, ""),
        type: detail.type,
        context: detail.context,
      }));
    }
  }

  // ✅ MEJORA: Manejo específico de tipos de error

  // Errores de validación Joi
  if (err.isJoi) {
    response.message = "Error de validación";
    response.code = "VALIDATION_ERROR";
    response.errors = err.details.map((detail) => ({
      field: Array.isArray(detail.path) ? detail.path.join(".") : detail.path,
      message: detail.message.replace(/['"]+/g, ""),
      type: detail.type,
      context: detail.context,
    }));
  }

  // Errores de base de datos
  if (err.code && err.code.startsWith("ER_")) {
    response.message = "Error de base de datos";
    response.code = "DATABASE_ERROR";

    switch (err.code) {
      case "ER_DUP_ENTRY":
        response.message = "Registro duplicado";
        response.code = "DUPLICATE_ENTRY";
        response.field = err.sqlMessage?.match(/for key '(.+)'/)?.[1];
        break;
      case "ER_NO_REFERENCED_ROW":
        response.message = "Referencia a registro inexistente";
        response.code = "FOREIGN_KEY_ERROR";
        break;
      case "ER_DATA_TOO_LONG":
        response.message = "Datos demasiado largos";
        response.code = "DATA_TOO_LONG";
        break;
      case "PROTOCOL_CONNECTION_LOST":
      case "ECONNREFUSED":
        response.message = "Error de conexión a la base de datos";
        response.code = "DB_CONNECTION_ERROR";
        break;
    }
  }

  // Errores de autenticación/autorización
  if (statusCode === 401) {
    response.message = err.message || "No autorizado";
    response.code = err.code || "UNAUTHORIZED";
  }

  if (statusCode === 403) {
    response.message = err.message || "Acceso prohibido";
    response.code = err.code || "FORBIDDEN";
  }

  // Errores de rate limiting
  if (statusCode === 429) {
    response.message = err.message || "Demasiadas solicitudes";
    response.code = err.code || "RATE_LIMIT_EXCEEDED";
    if (err.retryAfter) {
      response.retryAfter = err.retryAfter;
      response.retryAfterSeconds = Math.ceil(err.retryAfter / 1000);
    }
  }

  // Errores de timeout
  if (err.code === "ETIMEDOUT" || err.code === "ESOCKETTIMEDOUT") {
    response.message = "Timeout de la solicitud";
    response.code = "REQUEST_TIMEOUT";
  }

  // ✅ MEJORA: Headers informativos
  res.setHeader("X-Error-Code", errorCode);
  res.setHeader("X-Error-Message", encodeURIComponent(message));

  // Headers para rate limiting
  if (statusCode === 429 && response.retryAfterSeconds) {
    res.setHeader("Retry-After", response.retryAfterSeconds);
  }

  // ✅ MEJORA: Enviar respuesta
  res.status(statusCode).json(response);
};

/**
 * Wrapper para funciones asíncronas
 * @param {Function} fn - Función asíncrona
 * @returns {Function} Middleware envuelto
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware para validar paginación
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
const validatePagination = (req, res, next) => {
  try {
    const defaultLimit = config.app?.pagination?.defaultLimit || 20;
    const maxLimit = config.app?.pagination?.maxLimit || 100;

    let limit = parseInt(req.query.limit, 10);
    let page = parseInt(req.query.page, 10);

    // ✅ MEJORA: Usar valores por defecto si no son números válidos
    if (isNaN(limit) || limit < 1) limit = defaultLimit;
    if (isNaN(page) || page < 1) page = 1;

    // ✅ MEJORA: Validar límites máximos
    if (limit > maxLimit) {
      return res.status(400).json({
        success: false,
        message: `El límite máximo es ${maxLimit} registros por página`,
        code: "MAX_LIMIT_EXCEEDED",
        maxLimit: maxLimit,
      });
    }

    // ✅ MEJORA: Calcular offset
    const offset = (page - 1) * limit;

    req.pagination = {
      limit,
      page,
      offset,
      hasPagination:
        req.query.limit !== undefined || req.query.page !== undefined,
    };

    // ✅ MEJORA: Headers informativos
    res.setHeader("X-Pagination-Limit", limit);
    res.setHeader("X-Pagination-Page", page);
    res.setHeader("X-Pagination-Offset", offset);

    next();
  } catch (error) {
    logger.error("Error validando paginación:", error);
    res.status(400).json({
      success: false,
      message: "Parámetros de paginación inválidos",
      code: "INVALID_PAGINATION",
    });
  }
};

/**
 * Middleware para validar content-type
 * @param {Array} allowedTypes - Tipos MIME permitidos
 * @returns {Function} Middleware de validación
 */
const validateContentType =
  (allowedTypes = ["application/json"]) =>
  (req, res, next) => {
    const contentType = req.headers["content-type"];

    if (
      req.method === "POST" ||
      req.method === "PUT" ||
      req.method === "PATCH"
    ) {
      if (
        !contentType ||
        !allowedTypes.some((type) => contentType.includes(type))
      ) {
        return res.status(415).json({
          success: false,
          message: `Content-Type no soportado. Se esperaba: ${allowedTypes.join(", ")}`,
          code: "UNSUPPORTED_MEDIA_TYPE",
          receivedContentType: contentType,
        });
      }
    }

    next();
  };

/**
 * Middleware para sanitizar inputs
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
const sanitizeInput = (req, res, next) => {
  // Sanitizar query params
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (typeof req.query[key] === "string") {
        req.query[key] = req.query[key].trim().replace(/[<>]/g, "");
      }
    });
  }

  // Sanitizar body
  if (req.body && typeof req.body === "object") {
    const sanitizeObject = (obj) => {
      Object.keys(obj).forEach((key) => {
        if (typeof obj[key] === "string") {
          obj[key] = obj[key].trim().replace(/[<>]/g, "");
        } else if (typeof obj[key] === "object" && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };
    sanitizeObject(req.body);
  }

  next();
};

/**
 * Middleware para manejo de CORS errors
 * @param {Error} err - Error
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message === "No permitido por CORS" || err.message.includes("CORS")) {
    return res.status(403).json({
      success: false,
      message: "Origen no permitido por CORS",
      code: "CORS_ERROR",
      origin: req.headers.origin,
      allowedOrigins: config.app?.frontendUrl ? [config.app.frontendUrl] : [],
    });
  }
  next(err);
};

/**
 * Middleware para validar tamaño de request
 * @param {Object} options - Opciones de validación
 * @returns {Function} Middleware de validación
 */
const validateRequestSize = (options = {}) => {
  const maxSize = options.maxSize || "10mb";

  return (req, res, next) => {
    const contentLength = req.headers["content-length"];

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxBytes = parseSizeString(maxSize);

      if (sizeInBytes > maxBytes) {
        return res.status(413).json({
          success: false,
          message: `La solicitud es demasiado grande. Tamaño máximo: ${maxSize}`,
          code: "REQUEST_TOO_LARGE",
          maxSize,
          actualSize: `${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`,
        });
      }
    }

    next();
  };
};

/**
 * Helper para convertir string de tamaño a bytes
 * @param {string} sizeString - String de tamaño (ej: '10mb')
 * @returns {number} Tamaño en bytes
 */
const parseSizeString = (sizeString) => {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = sizeString.match(/^(\d+)([a-zA-Z]+)$/);
  if (!match) return parseInt(sizeString, 10) || 1024 * 1024; // 1MB por defecto

  const [, value, unit] = match;
  const unitLower = unit.toLowerCase();

  return parseInt(value, 10) * (units[unitLower] || units.mb);
};

// Exportar módulo
module.exports = {
  notFound,
  handleError,
  asyncHandler,
  validatePagination,
  validateContentType,
  sanitizeInput,
  corsErrorHandler,
  validateRequestSize,

  // ✅ MEJORA: Funciones utilitarias adicionales
  createError: (
    message,
    code = "INTERNAL_ERROR",
    status = 500,
    details = {},
  ) => {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    error.details = details;
    return error;
  },

  // ✅ MEJORA: Handler para errores de base de datos
  handleDatabaseError: (err, req, res, next) => {
    if (err.code && err.code.startsWith("ER_")) {
      err.status = 500;
      err.code = "DATABASE_ERROR";
    }
    next(err);
  },

  // ✅ MEJORA: Handler para errores de validación
  handleValidationError: (err, req, res, next) => {
    if (err.isJoi) {
      err.status = 400;
      err.code = "VALIDATION_ERROR";
    }
    next(err);
  },
};
