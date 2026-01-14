/**
 * ✅ MANEJO DE ERRORES CENTRALIZADO MEJORADO
 *
 * Este módulo proporciona clases de errores personalizadas y funciones de manejo de errores.
 * Correcciones aplicadas:
 * 1. Jerarquía clara de errores
 * 2. Formateo consistente de errores
 * 3. Manejo de errores de validación
 * 4. Soporte para logging estructurado
 * 5. Integración con middleware de Express
 */

const logger = require("./logger");

/**
 * ✅ CLASE BASE DE ERROR PERSONALIZADO
 * Todas las clases de error personalizadas heredan de esta
 */
class AppError extends Error {
  constructor(message, statusCode = 500, details = null, isOperational = true) {
    super(message);

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = isOperational;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Capturar stack trace (excluyendo el constructor de la clase Error)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * ✅ ERRORES DE VALIDACIÓN (400)
 * Para errores de validación de datos de entrada
 */
class ValidationError extends AppError {
  constructor(message, validationErrors = []) {
    super(message || "Error de validación", 400, validationErrors);
    this.name = "ValidationError";
    this.code = "VALIDATION_ERROR";
  }
}

/**
 * ✅ ERROR DE AUTENTICACIÓN (401)
 * Para credenciales inválidas o tokens expirados
 */
class AuthenticationError extends AppError {
  constructor(message = "Autenticación requerida") {
    super(message, 401);
    this.name = "AuthenticationError";
    this.code = "AUTHENTICATION_ERROR";
  }
}

/**
 * ✅ ERROR DE AUTORIZACIÓN (403)
 * Para permisos insuficientes
 */
class AuthorizationError extends AppError {
  constructor(message = "No tiene permisos para realizar esta acción") {
    super(message, 403);
    this.name = "AuthorizationError";
    this.code = "AUTHORIZATION_ERROR";
  }
}

/**
 * ✅ RECURSO NO ENCONTRADO (404)
 * Para recursos que no existen
 */
class NotFoundError extends AppError {
  constructor(resource = "Recurso", id = null) {
    const message = id
      ? `${resource} con ID ${id} no encontrado`
      : `${resource} no encontrado`;

    super(message, 404);
    this.name = "NotFoundError";
    this.code = "NOT_FOUND";
    this.resource = resource;
    this.id = id;
  }
}

/**
 * ✅ CONFLICTO (409)
 * Para conflictos de datos (ej: email duplicado)
 */
class ConflictError extends AppError {
  constructor(message = "Conflicto de datos", conflictData = null) {
    super(message, 409, conflictData);
    this.name = "ConflictError";
    this.code = "CONFLICT_ERROR";
  }
}

/**
 * ✅ ERROR DE BASE DE DATOS (500)
 * Para errores relacionados con la base de datos
 */
class DatabaseError extends AppError {
  constructor(message = "Error de base de datos", sqlError = null) {
    super(message, 500, sqlError);
    this.name = "DatabaseError";
    this.code = "DATABASE_ERROR";

    // ✅ MEJORA: Extraer información útil del error SQL
    if (sqlError) {
      this.sqlCode = sqlError.code;
      this.sqlMessage = sqlError.message;
      this.sqlQuery = sqlError.sql;
    }
  }
}

/**
 * ✅ ERROR DE SERVICIO EXTERNO (502)
 * Para errores en llamadas a APIs externas
 */
class ExternalServiceError extends AppError {
  constructor(serviceName, errorMessage, statusCode = 502) {
    const message = `Error en servicio externo ${serviceName}: ${errorMessage}`;
    super(message, statusCode);
    this.name = "ExternalServiceError";
    this.code = "EXTERNAL_SERVICE_ERROR";
    this.serviceName = serviceName;
  }
}

/**
 * ✅ ERROR DE RATE LIMITING (429)
 * Para límite de peticiones excedido
 */
class RateLimitError extends AppError {
  constructor(message = "Límite de peticiones excedido", retryAfter = null) {
    super(message, 429);
    this.name = "RateLimitError";
    this.code = "RATE_LIMIT_EXCEEDED";
    this.retryAfter = retryAfter;
  }
}

/**
 * ✅ ERROR DE VALIDACIÓN DE ENTRADA
 * Especializado para errores de express-validator
 */
class InputValidationError extends ValidationError {
  constructor(validationErrors) {
    const message = "Error de validación de entrada";
    super(message, validationErrors);
    this.name = "InputValidationError";
    this.code = "INPUT_VALIDATION_ERROR";
  }
}

/**
 * ✅ ERROR DE ARCHIVO/SUBIDA (413/415)
 * Para errores relacionados con archivos
 */
class FileError extends AppError {
  constructor(message, statusCode = 400, fileInfo = null) {
    super(message, statusCode, fileInfo);
    this.name = "FileError";
    this.code = "FILE_ERROR";
  }
}

// ✅ ERRORES ESPECÍFICOS DEL SISTEMA DE INVENTARIO

/**
 * ✅ ERROR DE INVENTARIO INSUFICIENTE
 */
class InsufficientInventoryError extends AppError {
  constructor(productId, productName, requested, available) {
    const message = `Inventario insuficiente para ${productName}. Solicitado: ${requested}, Disponible: ${available}`;
    super(message, 400);
    this.name = "InsufficientInventoryError";
    this.code = "INSUFFICIENT_INVENTORY";
    this.productId = productId;
    this.productName = productName;
    this.requested = requested;
    this.available = available;
  }
}

/**
 * ✅ ERROR DE PRODUCTO INACTIVO
 */
class ProductInactiveError extends AppError {
  constructor(productId, productName) {
    const message = `El producto ${productName} está inactivo`;
    super(message, 400);
    this.name = "ProductInactiveError";
    this.code = "PRODUCT_INACTIVE";
    this.productId = productId;
    this.productName = productName;
  }
}

/**
 * ✅ ERROR DE CÓDIGO QR DUPLICADO
 */
class DuplicateQrCodeError extends ConflictError {
  constructor(qrCode) {
    const message = `El código QR ${qrCode} ya está en uso`;
    super(message, { qrCode });
    this.name = "DuplicateQrCodeError";
    this.code = "DUPLICATE_QR_CODE";
    this.qrCode = qrCode;
  }
}

// ============================================
// ✅ FUNCIONES DE MANEJO DE ERRORES
// ============================================

/**
 * ✅ FORMATEAR ERROR PARA RESPUESTA HTTP
 * Convierte cualquier error en un formato estándar para la respuesta
 */
function formatErrorForResponse(error, includeDetails = false) {
  // Si ya es un AppError, usar sus propiedades
  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        ...(includeDetails && error.details && { details: error.details }),
        ...(error.isOperational === false && { operational: false }),
      },
    };
  }

  // Si es un error de validación de express-validator
  if (error.name === "ValidationError" && error.array) {
    const validationError = new InputValidationError(error.array());
    return formatErrorForResponse(validationError, includeDetails);
  }

  // Para errores desconocidos, crear un error genérico
  const isDevelopment = process.env.NODE_ENV === "development";

  return {
    success: false,
    error: {
      name: "InternalServerError",
      message: isDevelopment ? error.message : "Ocurrió un error interno",
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      timestamp: new Date().toISOString(),
      ...(isDevelopment &&
        includeDetails && {
          details: {
            message: error.message,
            stack: error.stack,
            type: error.name,
          },
        }),
    },
  };
}

/**
 * ✅ MANEJADOR DE ERRORES GLOBAL PARA EXPRESS
 * Middleware que captura todos los errores no manejados
 */
function errorHandler(err, req, res, next) {
  // ✅ MEJORA: Determinar si incluir detalles según el entorno
  const isDevelopment = process.env.NODE_ENV === "development";
  const includeDetails = isDevelopment || req.query.debug === "true";

  // ✅ MEJORA: Determinar nivel de log según tipo de error
  const logLevel = err.isOperational === false ? "error" : "warn";

  // ✅ MEJORA: Log estructurado del error
  const logData = {
    error: {
      name: err.name,
      message: err.message,
      code: err.code || "UNKNOWN",
      statusCode: err.statusCode || 500,
      stack: isDevelopment ? err.stack : undefined,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      userId: req.user?.id,
      params: req.params,
      query: req.query,
      body: isDevelopment ? req.body : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  // Loggear el error
  if (logLevel === "error") {
    logger.error("Error no manejado:", logData);
  } else {
    logger.warn("Error operacional:", logData);
  }

  // ✅ MEJORA: Formatear respuesta de error
  const errorResponse = formatErrorForResponse(err, includeDetails);

  // Enviar respuesta
  res.status(errorResponse.error.statusCode).json(errorResponse);
}

/**
 * ✅ WRAPPER ASYNC PARA MANEJAR ERRORES EN CONTROLADORES
 * Elimina la necesidad de try-catch en cada controlador
 */
function asyncHandler(fn) {
  return function (req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * ✅ VALIDADOR DE ESQUEMA CON MANEJO DE ERRORES
 * Valida datos contra un esquema Joi y lanza ValidationError si falla
 */
function validateWithJoi(schema, data, options = {}) {
  const { allowUnknown = false, stripUnknown = true } = options;

  const { error, value } = schema.validate(data, {
    abortEarly: false,
    allowUnknown,
    stripUnknown,
  });

  if (error) {
    const validationErrors = error.details.map((detail) => ({
      field: detail.path.join("."),
      message: detail.message,
      type: detail.type,
    }));

    throw new ValidationError("Error de validación de datos", validationErrors);
  }

  return value;
}

/**
 * ✅ MANEJADOR DE ERRORES DE BASE DE DATOS
 * Convierte errores de MySQL en DatabaseError con información útil
 */
function handleDatabaseError(error, context = "") {
  logger.error(`Error de base de datos ${context}:`, {
    message: error.message,
    code: error.code,
    sql: error.sql,
    stack: error.stack,
  });

  // ✅ MEJORA: Traducción de errores comunes de MySQL
  let userMessage = "Error de base de datos";
  let statusCode = 500;

  switch (error.code) {
    case "ER_DUP_ENTRY":
      userMessage = "Registro duplicado";
      statusCode = 409;
      break;
    case "ER_NO_REFERENCED_ROW_2":
    case "ER_NO_REFERENCED_ROW":
      userMessage = "Referencia a registro no existente";
      statusCode = 400;
      break;
    case "ER_DATA_TOO_LONG":
      userMessage = "Datos demasiado largos";
      statusCode = 400;
      break;
    case "ER_ACCESS_DENIED_ERROR":
      userMessage = "Acceso denegado a la base de datos";
      statusCode = 500;
      break;
    case "ER_BAD_DB_ERROR":
      userMessage = "Base de datos no existe";
      statusCode = 500;
      break;
    case "ER_CON_COUNT_ERROR":
      userMessage = "Demasiadas conexiones a la base de datos";
      statusCode = 503;
      break;
    case "ER_LOCK_WAIT_TIMEOUT":
    case "ER_LOCK_DEADLOCK":
      userMessage = "Conflicto de acceso a datos, por favor intente nuevamente";
      statusCode = 409;
      break;
  }

  return new DatabaseError(userMessage, error);
}

/**
 * ✅ CONVERTIR ERRORES DE EXPRESS-VALIDATOR
 */
function convertValidationErrors(errors) {
  if (!errors || !errors.array) {
    return errors;
  }

  const formattedErrors = errors.array().map((error) => ({
    field: error.param,
    message: error.msg,
    value: error.value,
    location: error.location,
  }));

  return new InputValidationError(formattedErrors);
}

/**
 * ✅ FUNCIÓN PARA LANZAR ERRORES DE "NO ENCONTRADO" CONDICIONALMENTE
 */
function throwIfNotFound(resource, id, entityName) {
  if (!resource) {
    throw new NotFoundError(entityName, id);
  }
  return resource;
}

/**
 * ✅ FUNCIÓN PARA VALIDAR PERMISOS
 */
function validatePermission(hasPermission, resource, action) {
  if (!hasPermission) {
    throw new AuthorizationError(
      `No tiene permisos para ${action} ${resource}`,
    );
  }
}

// ============================================
// ✅ MIDDLEWARES ESPECIALIZADOS
// ============================================

/**
 * ✅ MIDDLEWARE PARA RUTAS NO ENCONTRADAS (404)
 */
function notFoundHandler(req, res, next) {
  const error = new NotFoundError("Ruta", req.originalUrl);
  next(error);
}

/**
 * ✅ MIDDLEWARE PARA MANEJAR ERRORES DE MULTER (UPLOAD)
 */
function multerErrorHandler(err, req, res, next) {
  if (err) {
    let error;

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        error = new FileError(
          `Archivo demasiado grande. Tamaño máximo: ${req.app.get("maxFileSize")} bytes`,
          413,
          { field: err.field, fileSize: err.fileSize },
        );
        break;
      case "LIMIT_FILE_COUNT":
        error = new FileError("Demasiados archivos subidos", 400, {
          field: err.field,
        });
        break;
      case "LIMIT_UNEXPECTED_FILE":
        error = new FileError("Tipo de archivo no permitido", 415, {
          field: err.field,
          fileType: err.fileType,
        });
        break;
      default:
        error = new FileError(`Error al subir archivo: ${err.message}`, 400, {
          field: err.field,
        });
    }

    return next(error);
  }

  next();
}

/**
 * ✅ MIDDLEWARE PARA MANEJAR ERRORES DE JSON PARSING
 */
function jsonErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    const error = new ValidationError("JSON inválido", [
      { field: "body", message: "El JSON proporcionado es inválido" },
    ]);
    return next(error);
  }
  next();
}

// ============================================
// ✅ EXPORTS
// ============================================

module.exports = {
  // Clases de error
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  InputValidationError,
  FileError,

  // Errores específicos del sistema
  InsufficientInventoryError,
  ProductInactiveError,
  DuplicateQrCodeError,

  // Funciones de manejo de errores
  formatErrorForResponse,
  errorHandler,
  asyncHandler,
  validateWithJoi,
  handleDatabaseError,
  convertValidationErrors,
  throwIfNotFound,
  validatePermission,

  // Middlewares
  notFoundHandler,
  multerErrorHandler,
  jsonErrorHandler,

  // ✅ MEJORA: Función de utilidad para crear errores personalizados
  createError: (name, message, statusCode, details = null) => {
    const error = new Error(message);
    error.name = name;
    error.statusCode = statusCode;
    error.details = details;
    error.isOperational = true;
    return error;
  },

  // ✅ MEJORA: Función para manejar errores de promesas
  handlePromiseError: (promise, context = "") => {
    return promise.catch((error) => {
      logger.error(`Error en ${context}:`, {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    });
  },
};
