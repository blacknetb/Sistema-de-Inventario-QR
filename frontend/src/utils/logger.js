/**
 * ✅ LOGGER MEJORADO Y OPTIMIZADO
 * Sistema de logging completo con múltiples niveles,
 * compatibilidad con backend y manejo de entorno.
 */

// ==================== CONFIGURACIÓN DEL LOGGER ====================

// Niveles de log (compatibles con backend)
export const LOG_LEVELS = {
  ERROR: "error",
  WARN: "warn",
  INFO: "info",
  DEBUG: "debug",
  TRACE: "trace",
};

// Configuración por entorno
const LOG_CONFIG = {
  LEVEL: import.meta.env.VITE_LOG_LEVEL ||
    (import.meta.env.MODE === "production" ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG),

  // Colores para desarrollo
  COLORS: {
    [LOG_LEVELS.ERROR]: "#ef4444", // Rojo
    [LOG_LEVELS.WARN]: "#f59e0b", // Amarillo
    [LOG_LEVELS.INFO]: "#3b82f6", // Azul
    [LOG_LEVELS.DEBUG]: "#10b981", // Verde
    [LOG_LEVELS.TRACE]: "#8b5cf6", // Púrpura
  },

  // Prefijos de nivel
  PREFIXES: {
    [LOG_LEVELS.ERROR]: "[ERROR]",
    [LOG_LEVELS.WARN]: "[WARN]",
    [LOG_LEVELS.INFO]: "[INFO]",
    [LOG_LEVELS.DEBUG]: "[DEBUG]",
    [LOG_LEVELS.TRACE]: "[TRACE]",
  },
};

// ==================== UTILIDADES INTERNAS ====================

/**
 * ✅ COMPROBAR SI UN NIVEL DEBE MOSTRARSE
 */
const shouldLog = (level) => {
  const levels = Object.values(LOG_LEVELS);
  const currentLevelIndex = levels.indexOf(LOG_CONFIG.LEVEL);
  const targetLevelIndex = levels.indexOf(level);
  return targetLevelIndex <= currentLevelIndex;
};

/**
 * ✅ FORMATEAR MARCA DE TIEMPO
 */
const formatTimestamp = () => {
  return new Date().toISOString();
};

/**
 * ✅ FORMATEAR MENSAJE
 */
const formatMessage = (level, message, ...args) => {
  const timestamp = formatTimestamp();
  const prefix = LOG_CONFIG.PREFIXES[level];
  let formatted = `${timestamp} ${prefix} ${message}`;

  // Agregar argumentos si existen
  if (args.length > 0) {
    args.forEach((arg) => {
      if (typeof arg === "object" && arg !== null) {
        try {
          formatted += `\n${JSON.stringify(arg, null, 2)}`;
        } catch {
          formatted += `\n${String(arg)}`;
        }
      } else {
        formatted += `\n${String(arg)}`;
      }
    });
  }

  return formatted;
};

// ==================== IMPLEMENTACIÓN DEL LOGGER ====================

/**
 * ✅ LOGGER PRINCIPAL
 */
class Logger {
  constructor(context = "app") {
    this.context = context;
  }

  /**
   * ✅ ERROR - Errores críticos
   */
  error(message, ...args) {
    if (!shouldLog(LOG_LEVELS.ERROR)) return;

    const formatted = formatMessage(
      LOG_LEVELS.ERROR,
      `[${this.context}] ${message}`,
      ...args
    );

    console.error(
      `%c${formatted}`,
      `color: ${LOG_CONFIG.COLORS.error}; font-weight: bold;`
    );
  }

  /**
   * ✅ WARN - Advertencias
   */
  warn(message, ...args) {
    if (!shouldLog(LOG_LEVELS.WARN)) return;

    const formatted = formatMessage(
      LOG_LEVELS.WARN,
      `[${this.context}] ${message}`,
      ...args
    );
    console.warn(`%c${formatted}`, `color: ${LOG_CONFIG.COLORS.warn}`);
  }

  /**
   * ✅ INFO - Información general
   */
  info(message, ...args) {
    if (!shouldLog(LOG_LEVELS.INFO)) return;

    const formatted = formatMessage(
      LOG_LEVELS.INFO,
      `[${this.context}] ${message}`,
      ...args
    );
    console.info(`%c${formatted}`, `color: ${LOG_CONFIG.COLORS.info}`);
  }

  /**
   * ✅ DEBUG - Información para debugging
   */
  debug(message, ...args) {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;

    const formatted = formatMessage(
      LOG_LEVELS.DEBUG,
      `[${this.context}] ${message}`,
      ...args
    );
    console.debug(`%c${formatted}`, `color: ${LOG_CONFIG.COLORS.debug}`);
  }

  /**
   * ✅ TRACE - Información detallada
   */
  trace(message, ...args) {
    if (!shouldLog(LOG_LEVELS.TRACE)) return;

    const formatted = formatMessage(
      LOG_LEVELS.TRACE,
      `[${this.context}] ${message}`,
      ...args
    );
    console.trace(`%c${formatted}`, `color: ${LOG_CONFIG.COLORS.trace}`);
  }

  /**
   * ✅ LOG DE PETICIONES API
   */
  apiRequest(config) {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;

    const { method, url } = config;
    this.debug(`API Request: ${method} ${url}`);
  }

  /**
   * ✅ LOG DE RESPUESTAS API
   */
  apiResponse(response) {
    if (!shouldLog(LOG_LEVELS.DEBUG)) return;

    const { config, status, statusText } = response;
    const { method, url } = config;

    this.debug(`API Response: ${method} ${url} → ${status} ${statusText}`);
  }

  /**
   * ✅ LOG DE ERRORES API
   */
  apiError(error) {
    if (error.response) {
      const { config, status } = error.response;
      const { method, url } = config;
      this.error(`API Error: ${method} ${url} → ${status}`);
    } else if (error.request) {
      this.error(`API Network Error: ${error.message}`);
    } else {
      this.error(`API Error: ${error.message}`);
    }
  }

  /**
   * ✅ LOG DE PERFORMANCE
   */
  performance(label, duration, threshold = 100) {
    if (duration > threshold) {
      this.warn(
        `Performance: ${label} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    } else if (shouldLog(LOG_LEVELS.DEBUG)) {
      this.debug(`Performance: ${label} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * ✅ CREAR LOGGER CON CONTEXTO
   */
  create(context) {
    return new Logger(context);
  }
}

// ==================== LOGGER GLOBAL ====================

// Instancia global del logger
export const logger = new Logger();

// Métodos directos para uso rápido
export const log = {
  error: (message, ...args) => logger.error(message, ...args),
  warn: (message, ...args) => logger.warn(message, ...args),
  info: (message, ...args) => logger.info(message, ...args),
  debug: (message, ...args) => logger.debug(message, ...args),
  trace: (message, ...args) => logger.trace(message, ...args),
};

// ==================== UTILIDADES ADICIONALES ====================

/**
 * ✅ MANEJADOR GLOBAL DE ERRORES
 */
export const setupGlobalErrorHandling = () => {
  if (typeof window === "undefined") return;

  // Error handler para errores no capturados
  window.onerror = function (message, source, lineno, colno, error) {
    logger.error(`Uncaught Error: ${message}`, {
      source,
      lineno,
      colno,
      error: error?.stack || error,
    });
    return false;
  };

  // Promise rejection handler
  window.onunhandledrejection = function (event) {
    logger.error("Unhandled Promise Rejection:", {
      reason: event.reason,
    });
  };

  logger.info("Global error handling initialized");
};

// ✅ EXPORTACIÓN POR DEFECTO
export default {
  LOG_LEVELS,
  logger,
  log,
  Logger,
  setupGlobalErrorHandling,
};