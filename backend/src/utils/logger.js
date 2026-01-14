const winston = require("winston");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const config = require("../config/env");

// ✅ CORRECCIÓN: Crear directorios de logs si no existen
const logDir = "logs";
const mkdirAsync = promisify(fs.mkdir);

try {
  if (!fs.existsSync(logDir)) {
    mkdirAsync(logDir, { recursive: true }).catch((err) => {
      console.error("Failed to create log directory:", err);
    });
  }
} catch (error) {
  console.error("Error checking log directory:", error);
}

/**
 * ✅ LOGGER MEJORADO CON CORRECCIONES
 * Correcciones aplicadas:
 * 1. Manejo de errores robusto
 * 2. Configuración flexible por entorno
 * 3. Formatos mejorados
 */

// ✅ MEJORA: Formato de log estructurado
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json({
    space: process.env.NODE_ENV === "development" ? 2 : 0,
  }),
);

// ✅ MEJORA: Formato para consola más legible
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "HH:mm:ss.SSS" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = "";

    if (meta && Object.keys(meta).length > 0) {
      // ✅ CORRECCIÓN: Filtrar stack trace para niveles no-error
      if (meta.stack && !["error", "warn"].includes(level)) {
        const { stack, ...restMeta } = meta;
        if (Object.keys(restMeta).length > 0) {
          metaStr = " " + JSON.stringify(restMeta, null, 2);
        }
      } else {
        try {
          metaStr = " " + JSON.stringify(meta, null, 2);
        } catch (e) {
          metaStr = " [Meta cannot be stringified]";
        }
      }
    }

    return `[${timestamp}] ${level}: ${message}${metaStr}`;
  }),
);

// ✅ MEJORA: Configurar transports según ambiente
const getTransports = () => {
  const transports = [];
  const nodeEnv = config.server?.nodeEnv || "development";
  const logLevel =
    config.app?.logLevel || (nodeEnv === "production" ? "info" : "debug");

  // Transporte de consola (solo en desarrollo/staging)
  if (nodeEnv !== "test" && nodeEnv !== "production") {
    transports.push(
      new winston.transports.Console({
        format: consoleFormat,
        level: logLevel,
        handleExceptions: true,
        handleRejections: true,
      }),
    );
  }

  // Transporte de consola para producción (solo errores)
  if (nodeEnv === "production") {
    transports.push(
      new winston.transports.Console({
        format: winston.format.simple(),
        level: "error",
        handleExceptions: true,
        handleRejections: true,
      }),
    );
  }

  // Archivo de errores
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
      handleExceptions: true,
      handleRejections: true,
    }),
  );

  // Archivo combinado (todos los logs)
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      level: logLevel,
      format: logFormat,
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      tailable: true,
    }),
  );

  // Archivo de auditoría (si está habilitado)
  if (config.app?.logRequests !== false) {
    transports.push(
      new winston.transports.File({
        filename: path.join(logDir, "audit.log"),
        level: "info",
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
        maxsize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
      }),
    );
  }

  return transports;
};

// ✅ CORRECCIÓN: Definir niveles de log consistentes
const logLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
  },
  colors: {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    verbose: "cyan",
    debug: "blue",
    silly: "gray",
  },
};

winston.addColors(logLevels.colors);

// ✅ MEJORA: Crear logger principal
const logger = winston.createLogger({
  level: config.app?.logLevel || "info",
  levels: logLevels.levels,
  format: logFormat,
  transports: getTransports(),
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "exceptions.log"),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, "rejections.log"),
    }),
  ],
});

// ✅ MEJORA: Métodos auxiliares para logging estructurado
const loggingHelpers = {
  // Log de operaciones de usuario con contexto
  userAction: (userId, action, details = {}, context = {}) => {
    logger.info(`USER_ACTION: ${action}`, {
      type: "USER_ACTION",
      userId,
      action,
      ...details,
      context: {
        timestamp: new Date().toISOString(),
        ...context,
      },
    });
  },

  // Log de auditoría para acciones sensibles
  auditLog: (userId, action, resource, changes = {}, metadata = {}) => {
    logger.info(`AUDIT: ${action} on ${resource}`, {
      type: "AUDIT",
      userId,
      action,
      resource,
      changes,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  },

  // Log de performance con umbral configurable
  performance: (operation, durationMs, thresholdMs = 1000, details = {}) => {
    const level = durationMs > thresholdMs ? "warn" : "info";

    logger[level](`PERFORMANCE: ${operation}`, {
      type: "PERFORMANCE",
      operation,
      durationMs,
      thresholdMs,
      isSlow: durationMs > thresholdMs,
      ...details,
    });
  },

  // Log de seguridad
  security: (event, details = {}, severity = "medium") => {
    const levelMap = {
      low: "info",
      medium: "warn",
      high: "error",
    };

    logger[levelMap[severity] || "warn"](`SECURITY: ${event}`, {
      type: "SECURITY",
      event,
      severity,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },

  // Log de negocio (métricas importantes)
  business: (metric, value, details = {}) => {
    logger.info(`BUSINESS: ${metric} = ${value}`, {
      type: "BUSINESS",
      metric,
      value,
      timestamp: new Date().toISOString(),
      ...details,
    });
  },

  // Log de request HTTP mejorado
  httpRequest: (req, res, durationMs) => {
    const logData = {
      type: "HTTP_REQUEST",
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user?.id || req.userId || "anonymous",
      userRole: req.user?.role || "unknown",
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent") || "unknown",
      contentLength: res.get("Content-Length") || 0,
      referrer: req.get("Referer") || "direct",
    };

    // Clasificar por status code
    if (res.statusCode >= 500) {
      logger.error(
        `HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`,
        logData,
      );
    } else if (res.statusCode >= 400) {
      logger.warn(
        `HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`,
        logData,
      );
    } else {
      logger.http(
        `HTTP ${res.statusCode} ${req.method} ${req.originalUrl}`,
        logData,
      );
    }

    // Log de performance si es lento
    if (durationMs > 5000) {
      loggingHelpers.performance(
        `${req.method} ${req.originalUrl}`,
        durationMs,
        5000,
        {
          statusCode: res.statusCode,
          userId: logData.userId,
        },
      );
    }
  },
};

// ✅ MEJORA: Función para rotación manual de logs
const rotateLogs = async () => {
  try {
    logger.info("Iniciando rotación manual de logs");

    // Cerrar los archivos actuales
    logger.transports.forEach((transport) => {
      if (transport.close) {
        transport.close();
      }
    });

    // Renombrar archivos existentes (ejemplo básico)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const files = ["error.log", "combined.log", "audit.log"];

    for (const file of files) {
      const filePath = path.join(logDir, file);
      if (fs.existsSync(filePath)) {
        const newPath = path.join(logDir, `${file}.${timestamp}.bak`);
        fs.renameSync(filePath, newPath);
        logger.info(`Rotated ${file} to ${newPath}`);
      }
    }

    // Reabrir los transports
    logger.transports = getTransports();

    logger.info("Rotación de logs completada exitosamente");
  } catch (error) {
    logger.error("Error durante la rotación de logs", {
      error: error.message,
      stack: error.stack,
    });
  }
};

// ✅ MEJORA: Middleware para Express mejorado
const expressLogger = (req, res, next) => {
  const start = Date.now();

  // Capturar el body de la request (si existe)
  let requestBody = null;
  if (req.body && Object.keys(req.body).length > 0) {
    // Excluir contraseñas y datos sensibles
    const { password, confirmPassword, token, refreshToken, ...safeBody } =
      req.body;
    requestBody = safeBody;
  }

  // Interceptar la respuesta
  const originalSend = res.send;
  res.send = function (body) {
    const duration = Date.now() - start;

    // Log detallado de la request
    loggingHelpers.httpRequest(req, res, duration);

    // Log adicional para requests con body
    if (requestBody) {
      logger.debug(`Request body for ${req.method} ${req.originalUrl}`, {
        type: "REQUEST_BODY",
        method: req.method,
        url: req.originalUrl,
        body: requestBody,
        userId: req.user?.id || "anonymous",
      });
    }

    return originalSend.call(this, body);
  };

  next();
};

// ✅ MEJORA: Función para obtener estadísticas de logs
const getLogStats = () => {
  const stats = {
    levels: {},
    transports: logger.transports.length,
    exceptions: logger.exceptionHandlers ? logger.exceptionHandlers.length : 0,
    rejections: logger.rejectionHandlers ? logger.rejectionHandlers.length : 0,
  };

  // Contar logs por nivel (ejemplo básico)
  Object.keys(logLevels.levels).forEach((level) => {
    stats.levels[level] = 0; // En una implementación real, contaríamos de algún archivo
  });

  return stats;
};

// ✅ Exportar logger mejorado con todas las funciones
module.exports = {
  // Logger principal
  logger,

  // Helpers de logging
  ...loggingHelpers,

  // Middleware y utilidades
  expressLogger,
  rotateLogs,
  getLogStats,

  // Métodos compatibles
  info: (message, meta = null) => logger.info(message, meta),
  error: (message, error = null) => {
    if (error instanceof Error) {
      logger.error(message, {
        error: error.message,
        stack: error.stack,
        code: error.code,
        ...(error.details && { details: error.details }),
      });
    } else if (typeof error === "object") {
      logger.error(message, error);
    } else if (error) {
      logger.error(message, { details: error });
    } else {
      logger.error(message);
    }
  },
  warn: (message, meta = null) => logger.warn(message, meta),
  debug: (message, meta = null) => logger.debug(message, meta),
  verbose: (message, meta = null) => logger.verbose(message, meta),
};
