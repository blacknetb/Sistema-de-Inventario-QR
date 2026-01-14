/**
 * ✅ CONFIGURACIÓN DE AUDITORÍA CENTRALIZADA
 * Archivo: src/config/audit.js
 *
 * Correcciones aplicadas:
 * 1. ✅ Configuración unificada
 * 2. ✅ Middleware para auditoría automática
 * 3. ✅ Integración con Express
 */

const config = require("./env");
const auditLogger = require("../utils/auditLogger");

/**
 * ✅ CONFIGURACIÓN DE AUDITORÍA
 */
const auditConfig = {
  // Habilitar/deshabilitar auditoría
  enabled: process.env.AUDIT_ENABLED !== "false",

  // Niveles de log a registrar
  levels: {
    info: true,
    warning: true,
    error: true,
    security: true,
    debug: config.server.nodeEnv === "development",
  },

  // Categorías a auditar
  categories: {
    authentication: true,
    authorization: true,
    data_change: true,
    system: true,
    security: true,
    api: true,
  },

  // Configuración de retención
  retention: {
    enabled: true,
    daysToKeep: parseInt(process.env.AUDIT_RETENTION_DAYS) || 90,
    autoCleanup: process.env.AUDIT_AUTO_CLEANUP === "true",
  },

  // Configuración de exportación
  export: {
    enabled: true,
    formats: ["json", "csv"],
    maxRows: 10000,
  },

  // Configuración específica por entorno
  environment: {
    development: {
      logToConsole: true,
      detailedLogging: true,
      logAllRequests: true,
    },
    production: {
      logToConsole: false,
      detailedLogging: false,
      logCriticalOnly: true,
    },
  },
};

/**
 * ✅ MIDDLEWARE DE AUDITORÍA PARA EXPRESS
 */
const auditMiddleware = (options = {}) => {
  const defaultOptions = {
    logRequests: true,
    logResponses: false,
    logErrors: true,
    excludePaths: ["/health", "/favicon.ico", "/robots.txt"],
    sensitiveFields: ["password", "token", "secret", "key"],
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return async (req, res, next) => {
    // Verificar si la auditoría está habilitada
    if (!auditConfig.enabled || !auditLogger.enabled) {
      return next();
    }

    // Verificar si la ruta está excluida
    if (mergedOptions.excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Crear ID de request para tracking
    const requestId =
      req.headers["x-request-id"] ||
      req.headers["x-correlation-id"] ||
      `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Añadir ID al request para uso posterior
    req.auditRequestId = requestId;

    // Variables para capturar datos de la respuesta
    const originalSend = res.send;
    const originalJson = res.json;
    const startTime = Date.now();

    let responseBody = null;
    let responseStatus = null;

    // Interceptar respuesta
    res.send = function (body) {
      responseBody = body;
      responseStatus = res.statusCode;
      return originalSend.call(this, body);
    };

    res.json = function (body) {
      responseBody = body;
      responseStatus = res.statusCode;
      return originalJson.call(this, body);
    };

    // Registrar fin de request
    res.on("finish", async () => {
      try {
        // Filtrar campos sensibles del body
        const filterSensitiveData = (data) => {
          if (!data || typeof data !== "object") return data;

          const filtered = { ...data };
          mergedOptions.sensitiveFields.forEach((field) => {
            if (filtered[field] !== undefined) {
              filtered[field] = "[FILTERED]";
            }
          });

          // Recursivamente filtrar objetos anidados
          Object.keys(filtered).forEach((key) => {
            if (filtered[key] && typeof filtered[key] === "object") {
              filtered[key] = filterSensitiveData(filtered[key]);
            }
          });

          return filtered;
        };

        // Determinar nivel basado en status code
        let level = "info";
        let severity = "INFO";

        if (responseStatus >= 400 && responseStatus < 500) {
          level = "warning";
          severity = "WARNING";
        } else if (responseStatus >= 500) {
          level = "error";
          severity = "ERROR";
        }

        // Preparar datos del request
        const requestData = {
          method: req.method,
          path: req.path,
          query: req.query,
          params: req.params,
          body: filterSensitiveData(req.body),
          headers: {
            "user-agent": req.headers["user-agent"],
            referer: req.headers["referer"],
            origin: req.headers["origin"],
          },
        };

        // Registrar request
        if (mergedOptions.logRequests) {
          await auditLogger.log({
            userIp:
              req.ip ||
              req.headers["x-forwarded-for"] ||
              req.connection.remoteAddress,
            userAgent: req.headers["user-agent"] || "",
            action: `HTTP_${req.method}`,
            entityType: "api",
            entityId: requestId,
            entityName: req.path,
            requestId,
            requestMethod: req.method,
            requestPath: req.path,
            requestParams: filterSensitiveData({
              query: req.query,
              params: req.params,
              body: req.body,
            }),
            message: `${req.method} ${req.path} - ${responseStatus}`,
            level,
            category: "api",
            severity,
            status: responseStatus < 400 ? "success" : "failed",
            metadata: {
              responseTime: Date.now() - startTime,
              statusCode: responseStatus,
              userId: req.user?.id || req.userId || null,
              contentLength: res.get("Content-Length"),
              contentType: res.get("Content-Type"),
            },
          });
        }
      } catch (error) {
        // No interrumpir el flujo por errores de auditoría
        console.error("❌ Error en middleware de auditoría:", error.message);
      }
    });

    next();
  };
};

/**
 * ✅ DECORADOR PARA AUDITAR MÉTODOS
 */
function auditMethod(options = {}) {
  return function (target, propertyName, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const startTime = Date.now();
      const methodName = propertyName;
      const className = target.constructor.name;

      try {
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;

        // Registrar éxito
        if (auditConfig.enabled && auditLogger.enabled) {
          await auditLogger.log({
            action: `METHOD_${methodName.toUpperCase()}`,
            entityType: "method",
            entityId: `${className}.${methodName}`,
            entityName: `${className}.${methodName}`,
            message: `Método ${className}.${methodName} ejecutado exitosamente`,
            level: "info",
            category: "system",
            severity: "INFO",
            status: "success",
            metadata: {
              className,
              methodName,
              executionTime,
              argsCount: args.length,
              timestamp: new Date().toISOString(),
            },
          });
        }

        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;

        // Registrar error
        if (auditConfig.enabled && auditLogger.enabled) {
          await auditLogger.log({
            action: `METHOD_${methodName.toUpperCase()}_ERROR`,
            entityType: "method",
            entityId: `${className}.${methodName}`,
            entityName: `${className}.${methodName}`,
            message: `Error en método ${className}.${methodName}: ${error.message}`,
            level: "error",
            category: "system",
            severity: "ERROR",
            status: "failed",
            errorMessage: error.stack || error.toString(),
            metadata: {
              className,
              methodName,
              executionTime,
              errorName: error.name,
              argsCount: args.length,
              timestamp: new Date().toISOString(),
            },
          });
        }

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * ✅ HELPER PARA AUDITAR CAMBIOS DE DATOS
 */
const auditDataChange = async (
  context,
  oldData,
  newData,
  userId,
  userIp = null,
) => {
  if (!auditConfig.enabled || !auditLogger.enabled) {
    return null;
  }

  try {
    const { entityType, entityId, action } = context;

    // Identificar campos cambiados
    const changedFields = [];
    if (oldData && newData) {
      Object.keys(newData).forEach((key) => {
        if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
          changedFields.push(key);
        }
      });
    }

    return await auditLogger.logDataChange(
      userId,
      entityType,
      entityId,
      action,
      oldData,
      newData,
      changedFields.length > 0 ? changedFields : null,
      userIp,
    );
  } catch (error) {
    console.error("❌ Error auditando cambio de datos:", error.message);
    return null;
  }
};

/**
 * ✅ HELPER PARA AUDITAR EVENTOS DE SEGURIDAD
 */
const auditSecurityEvent = async (
  action,
  message,
  details = {},
  userId = null,
) => {
  if (!auditConfig.enabled || !auditLogger.enabled) {
    return null;
  }

  try {
    return await auditLogger.logSecurityEvent(userId, action, message, details);
  } catch (error) {
    console.error("❌ Error auditando evento de seguridad:", error.message);
    return null;
  }
};

/**
 * ✅ API PARA GESTIÓN DE AUDITORÍA
 */
const auditAPI = {
  // Configuración
  config: auditConfig,

  // Logger instance
  logger: auditLogger,

  // Middleware
  middleware: auditMiddleware,

  // Helpers
  auditMethod,
  auditDataChange,
  auditSecurityEvent,

  // Métodos de gestión
  async getLogs(filters = {}, pagination = {}) {
    return await auditLogger.getLogs(filters, pagination);
  },

  async getStats(days = 30) {
    return await auditLogger.getStats(days);
  },

  async cleanup(daysToKeep = auditConfig.retention.daysToKeep) {
    return await auditLogger.cleanupOldLogs(daysToKeep);
  },

  async export(format = "json", filters = {}) {
    return await auditLogger.exportLogs(format, filters);
  },

  getStatus() {
    return {
      ...auditLogger.getStatus(),
      config: {
        enabled: auditConfig.enabled,
        retentionDays: auditConfig.retention.daysToKeep,
      },
    };
  },

  // Inicialización
  async initialize() {
    console.log("🔍 Inicializando sistema de auditoría...");

    try {
      await auditLogger.initialize();

      // Configurar limpieza automática si está habilitada
      if (auditConfig.retention.autoCleanup) {
        setInterval(
          async () => {
            try {
              await auditLogger.cleanupOldLogs(
                auditConfig.retention.daysToKeep,
              );
            } catch (error) {
              console.error(
                "❌ Error en limpieza automática de auditoría:",
                error.message,
              );
            }
          },
          24 * 60 * 60 * 1000,
        ); // Cada 24 horas

        console.log(
          `🔄 Limpieza automática configurada: cada 24 horas, conservar ${auditConfig.retention.daysToKeep} días`,
        );
      }

      console.log("✅ Sistema de auditoría inicializado");
      return true;
    } catch (error) {
      console.error(
        "❌ Error inicializando sistema de auditoría:",
        error.message,
      );
      return false;
    }
  },
};

// Inicializar automáticamente en desarrollo
if (config.server.nodeEnv === "development") {
  auditAPI.initialize().catch((error) => {
    console.error("❌ Error inicializando auditoría:", error.message);
  });
}

module.exports = auditAPI;
