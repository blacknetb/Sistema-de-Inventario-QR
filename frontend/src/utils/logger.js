/**
 * Sistema de Logging Avanzado para Sistema de Inventario QR
 * 
 * Características:
 * - Niveles de logging: debug, info, warn, error, fatal
 * - Soporte para colores en consola
 * - Logging estructurado (JSON en producción)
 * - Persistencia en localStorage para debugging
 * - Filtrado por nivel de log
 * - Métricas de rendimiento
 * - Integración con servicios externos (opcional)
 * - Seguro para producción
 */

// ✅ Configuración del logger
const LOG_CONFIG = {
  // Nivel mínimo de logging (debug, info, warn, error, fatal)
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  
  // Habilitar colores en consola (solo desarrollo)
  colors: process.env.NODE_ENV !== 'production',
  
  // Habilitar almacenamiento en localStorage para debugging
  persist: process.env.NODE_ENV !== 'production',
  
  // Máximo número de logs a persistir
  maxPersistedLogs: 100,
  
  // Habilitar métricas de rendimiento
  enableMetrics: true,
  
  // Habilitar logging estructurado (JSON)
  structured: process.env.NODE_ENV === 'production',
  
  // Tags para categorizar logs
  defaultTags: ['inventory-app'],
  
  // Servicios externos (opcional)
  externalServices: {
    sentry: false,
    analytics: false
  }
};

// ✅ Colores ANSI para consola
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// ✅ Niveles de logging con prioridades
const LOG_LEVELS = {
  debug: { priority: 0, color: COLORS.cyan, icon: '🐛' },
  info: { priority: 1, color: COLORS.green, icon: 'ℹ️' },
  warn: { priority: 2, color: COLORS.yellow, icon: '⚠️' },
  error: { priority: 3, color: COLORS.red, icon: '❌' },
  fatal: { priority: 4, color: COLORS.bgRed + COLORS.white, icon: '💀' }
};

// ✅ Almacenamiento de métricas de rendimiento
const performanceMetrics = {
  timers: new Map(),
  counters: new Map(),
  gauges: new Map()
};

// ✅ Utilidad para formatear timestamp
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString();
};

// ✅ Utilidad para obtener contexto de la aplicación
const getAppContext = () => {
  return {
    appName: window.GLOBAL_CONFIG?.app?.name || 'Inventario QR',
    appVersion: window.GLOBAL_CONFIG?.app?.version || '1.0.0',
    environment: window.GLOBAL_CONFIG?.app?.environment || 'development',
    userAgent: navigator.userAgent,
    url: window.location.href,
    timestamp: getTimestamp()
  };
};

// ✅ Utilidad para obtener stack trace limpio
const getCleanStackTrace = (error, depth = 3) => {
  if (!error || !error.stack) return null;
  
  const stackLines = error.stack.split('\n');
  // Filtrar líneas innecesarias y limitar profundidad
  return stackLines
    .slice(1, depth + 1)
    .map(line => line.trim())
    .join(' | ');
};

// ✅ Almacenamiento persistente de logs
const LogStorage = {
  KEY: 'inventory_qr_logs',
  
  // Obtener logs almacenados
  getLogs() {
    try {
      const logs = localStorage.getItem(this.KEY);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error al leer logs del storage:', error);
      return [];
    }
  },
  
  // Guardar log
  saveLog(logEntry) {
    try {
      const logs = this.getLogs();
      logs.push(logEntry);
      
      // Limitar número de logs almacenados
      if (logs.length > LOG_CONFIG.maxPersistedLogs) {
        logs.splice(0, logs.length - LOG_CONFIG.maxPersistedLogs);
      }
      
      localStorage.setItem(this.KEY, JSON.stringify(logs));
    } catch (error) {
      console.error('Error al guardar log:', error);
    }
  },
  
  // Limpiar logs almacenados
  clearLogs() {
    try {
      localStorage.removeItem(this.KEY);
    } catch (error) {
      console.error('Error al limpiar logs:', error);
    }
  },
  
  // Exportar logs como archivo
  exportLogs() {
    try {
      const logs = this.getLogs();
      const blob = new Blob([JSON.stringify(logs, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-logs-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error al exportar logs:', error);
    }
  }
};

// ✅ Clase principal del Logger
class Logger {
  constructor(tags = []) {
    this.tags = [...LOG_CONFIG.defaultTags, ...tags];
    this.enabled = true;
    this.correlationId = this.generateCorrelationId();
  }
  
  // Generar ID de correlación para agrupar logs relacionados
  generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Verificar si un nivel de log debe ser mostrado
  shouldLog(level) {
    if (!this.enabled) return false;
    
    const currentLevel = LOG_LEVELS[level]?.priority ?? 0;
    const minLevel = LOG_LEVELS[LOG_CONFIG.level]?.priority ?? 0;
    
    return currentLevel >= minLevel;
  }
  
  // Formatear mensaje para consola
  formatConsoleMessage(level, message, data, tags) {
    const levelConfig = LOG_LEVELS[level];
    const timestamp = new Date().toLocaleTimeString();
    const tagString = tags?.length > 0 ? `[${tags.join('][')}]` : '';
    
    if (LOG_CONFIG.colors) {
      return `${levelConfig.color}${levelConfig.icon} ${timestamp} ${level.toUpperCase()}${COLORS.reset} ${tagString} ${message}`;
    }
    
    return `${levelConfig.icon} ${timestamp} ${level.toUpperCase()} ${tagString} ${message}`;
  }
  
  // Formatear log estructurado (para producción)
  formatStructuredLog(level, message, data, tags) {
    return {
      level,
      message,
      data,
      tags: [...this.tags, ...(tags || [])],
      context: getAppContext(),
      correlationId: this.correlationId,
      timestamp: getTimestamp()
    };
  }
  
  // Enviar a servicios externos (opcional)
  sendToExternalServices(level, structuredLog) {
    // Integración con Sentry
    if (LOG_CONFIG.externalServices.sentry && window.Sentry) {
      try {
        if (level === 'error' || level === 'fatal') {
          window.Sentry.captureException(new Error(structuredLog.message), {
            extra: structuredLog
          });
        }
      } catch (error) {
        // Silenciar errores de integración
      }
    }
    
    // Integración con Google Analytics
    if (LOG_CONFIG.externalServices.analytics && window.gtag) {
      try {
        if (level === 'error') {
          window.gtag('event', 'exception', {
            description: structuredLog.message,
            fatal: level === 'fatal'
          });
        }
      } catch (error) {
        // Silenciar errores de integración
      }
    }
  }
  
  // Método base para logging
  log(level, message, data = {}, tags = []) {
    if (!this.shouldLog(level)) return;
    
    const allTags = [...this.tags, ...tags];
    const structuredLog = this.formatStructuredLog(level, message, data, allTags);
    
    // Log en consola
    const consoleMessage = this.formatConsoleMessage(level, message, data, allTags);
    
    if (level === 'error' || level === 'fatal') {
      console.error(consoleMessage, data);
    } else if (level === 'warn') {
      console.warn(consoleMessage, data);
    } else if (level === 'info') {
      console.info(consoleMessage, data);
    } else {
      console.log(consoleMessage, data);
    }
    
    // Log estructurado para producción
    if (LOG_CONFIG.structured) {
      console.log(JSON.stringify(structuredLog));
    }
    
    // Persistir log
    if (LOG_CONFIG.persist) {
      LogStorage.saveLog(structuredLog);
    }
    
    // Enviar a servicios externos
    this.sendToExternalServices(level, structuredLog);
    
    return structuredLog;
  }
  
  // ✅ Métodos públicos principales
  
  debug(message, data = {}, tags = []) {
    return this.log('debug', message, data, tags);
  }
  
  info(message, data = {}, tags = []) {
    return this.log('info', message, data, tags);
  }
  
  warn(message, data = {}, tags = []) {
    return this.log('warn', message, data, tags);
  }
  
  error(message, error = null, data = {}, tags = []) {
    const errorData = {
      ...data,
      errorMessage: error?.message,
      errorStack: getCleanStackTrace(error),
      errorName: error?.name
    };
    
    return this.log('error', message, errorData, tags);
  }
  
  fatal(message, error = null, data = {}, tags = []) {
    const errorData = {
      ...data,
      errorMessage: error?.message,
      errorStack: getCleanStackTrace(error),
      errorName: error?.name
    };
    
    const logEntry = this.log('fatal', message, errorData, tags);
    
    // En caso de error fatal, enviar notificación
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('fatal-error', {
        detail: logEntry
      }));
    }
    
    return logEntry;
  }
  
  // ✅ Métodos para métricas de rendimiento
  
  time(label) {
    if (!LOG_CONFIG.enableMetrics) return;
    
    performanceMetrics.timers.set(label, {
      start: performance.now(),
      label
    });
    
    this.debug(`⏱️  Timer started: ${label}`, {}, ['performance']);
  }
  
  timeEnd(label, tags = []) {
    if (!LOG_CONFIG.enableMetrics) return null;
    
    const timer = performanceMetrics.timers.get(label);
    if (!timer) {
      this.warn(`Timer "${label}" no encontrado`, {}, ['performance']);
      return null;
    }
    
    const duration = performance.now() - timer.start;
    performanceMetrics.timers.delete(label);
    
    this.info(`⏱️  Timer ended: ${label} - ${duration.toFixed(2)}ms`, 
      { duration: duration.toFixed(2), label }, 
      ['performance', ...tags]
    );
    
    return duration;
  }
  
  // Métrica de contador
  count(label, value = 1, tags = []) {
    if (!LOG_CONFIG.enableMetrics) return;
    
    const current = performanceMetrics.counters.get(label) || 0;
    const newValue = current + value;
    performanceMetrics.counters.set(label, newValue);
    
    this.debug(`🔢 Counter: ${label} = ${newValue}`, 
      { label, value: newValue, increment: value }, 
      ['metrics', ...tags]
    );
    
    return newValue;
  }
  
  // Métrica de gauge
  gauge(label, value, tags = []) {
    if (!LOG_CONFIG.enableMetrics) return;
    
    performanceMetrics.gauges.set(label, value);
    
    this.debug(`📊 Gauge: ${label} = ${value}`, 
      { label, value }, 
      ['metrics', ...tags]
    );
    
    return value;
  }
  
  // ✅ Métodos de utilidad
  
  // Crear logger con tags adicionales
  withTags(tags) {
    return new Logger([...this.tags, ...tags]);
  }
  
  // Crear logger con nuevo ID de correlación
  withNewCorrelationId() {
    const newLogger = new Logger(this.tags);
    newLogger.correlationId = this.generateCorrelationId();
    return newLogger;
  }
  
  // Habilitar/deshabilitar logging
  enable() {
    this.enabled = true;
  }
  
  disable() {
    this.enabled = false;
  }
  
  // ✅ Métodos para debugging y desarrollo
  
  // Log de ciclo de vida de componentes
  componentLifecycle(componentName, lifecycle, data = {}) {
    return this.debug(`🔄 ${componentName}: ${lifecycle}`, 
      { componentName, lifecycle, ...data }, 
      ['component', 'lifecycle']
    );
  }
  
  // Log de estado de la aplicación
  appState(state, data = {}) {
    return this.info(`📱 Estado de app: ${state}`, 
      { state, ...data }, 
      ['app', 'state']
    );
  }
  
  // Log de red
  network(event, data = {}) {
    return this.info(`🌐 Red: ${event}`, 
      { event, ...data }, 
      ['network']
    );
  }
  
  // Log de autenticación
  auth(event, data = {}) {
    const sensitiveData = { ...data };
    
    // Ocultar datos sensibles
    if (sensitiveData.token) sensitiveData.token = '[REDACTED]';
    if (sensitiveData.password) sensitiveData.password = '[REDACTED]';
    
    return this.info(`🔐 Auth: ${event}`, 
      { event, ...sensitiveData }, 
      ['auth', 'security']
    );
  }
  
  // Log de inventario
  inventory(action, data = {}) {
    return this.info(`📦 Inventario: ${action}`, 
      { action, ...data }, 
      ['inventory', 'business']
    );
  }
  
  // Log de QR
  qr(action, data = {}) {
    return this.info(`📱 QR: ${action}`, 
      { action, ...data }, 
      ['qr', 'scanner']
    );
  }
  
  // ✅ Métodos para obtener información del logger
  
  // Obtener estadísticas de logs
  getStats() {
    const logs = LogStorage.getLogs();
    const stats = {
      total: logs.length,
      byLevel: {},
      byTag: {}
    };
    
    logs.forEach(log => {
      // Contar por nivel
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;
      
      // Contar por tags
      log.tags?.forEach(tag => {
        stats.byTag[tag] = (stats.byTag[tag] || 0) + 1;
      });
    });
    
    return stats;
  }
  
  // Obtener métricas actuales
  getMetrics() {
    return {
      timers: Array.from(performanceMetrics.timers.entries()),
      counters: Array.from(performanceMetrics.counters.entries()),
      gauges: Array.from(performanceMetrics.gauges.entries())
    };
  }
  
  // ✅ Métodos de limpieza y mantenimiento
  
  // Limpiar logs antiguos
  cleanupOldLogs(maxAgeHours = 24) {
    try {
      const logs = LogStorage.getLogs();
      const cutoff = Date.now() - (maxAgeHours * 60 * 60 * 1000);
      
      const filteredLogs = logs.filter(log => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime > cutoff;
      });
      
      localStorage.setItem(LogStorage.KEY, JSON.stringify(filteredLogs));
      
      this.info(`🧹 Limpieza de logs: eliminados ${logs.length - filteredLogs.length} logs`, 
        { removed: logs.length - filteredLogs.length, remaining: filteredLogs.length },
        ['maintenance']
      );
      
      return filteredLogs.length;
    } catch (error) {
      this.error('Error en cleanup de logs', error);
      return 0;
    }
  }
  
  // Exportar logs
  export() {
    return LogStorage.exportLogs();
  }
  
  // Limpiar todos los logs
  clear() {
    LogStorage.clearLogs();
    this.info('🧹 Todos los logs han sido limpiados', {}, ['maintenance']);
  }
}

// ✅ Instancia global del logger
const globalLogger = new Logger();

// ✅ Función helper para crear loggers específicos
const createLogger = (tags = []) => {
  return new Logger(tags);
};

// ✅ Exportar funciones de conveniencia
export const logger = {
  // Métodos básicos
  debug: (message, data, tags) => globalLogger.debug(message, data, tags),
  info: (message, data, tags) => globalLogger.info(message, data, tags),
  warn: (message, data, tags) => globalLogger.warn(message, data, tags),
  error: (message, error, data, tags) => globalLogger.error(message, error, data, tags),
  fatal: (message, error, data, tags) => globalLogger.fatal(message, error, data, tags),
  
  // Métricas
  time: (label) => globalLogger.time(label),
  timeEnd: (label, tags) => globalLogger.timeEnd(label, tags),
  count: (label, value, tags) => globalLogger.count(label, value, tags),
  gauge: (label, value, tags) => globalLogger.gauge(label, value, tags),
  
  // Métodos específicos de dominio
  component: (name, lifecycle, data) => globalLogger.componentLifecycle(name, lifecycle, data),
  app: (state, data) => globalLogger.appState(state, data),
  network: (event, data) => globalLogger.network(event, data),
  auth: (event, data) => globalLogger.auth(event, data),
  inventory: (action, data) => globalLogger.inventory(action, data),
  qr: (action, data) => globalLogger.qr(action, data),
  
  // Utilidades
  withTags: (tags) => globalLogger.withTags(tags),
  create: (tags) => createLogger(tags),
  
  // Gestión
  enable: () => globalLogger.enable(),
  disable: () => globalLogger.disable(),
  getStats: () => globalLogger.getStats(),
  getMetrics: () => globalLogger.getMetrics(),
  cleanup: (hours) => globalLogger.cleanupOldLogs(hours),
  export: () => globalLogger.export(),
  clear: () => globalLogger.clear(),
  
  // Configuración
  config: LOG_CONFIG,
  setLevel: (level) => {
    if (LOG_LEVELS[level]) {
      LOG_CONFIG.level = level;
      globalLogger.info(`Nivel de log cambiado a: ${level}`, {}, ['config']);
    }
  }
};

// ✅ Polyfill para navegadores antiguos
if (typeof console.debug === 'undefined') {
  console.debug = console.log;
}

// ✅ Capturar errores globales no manejados
if (typeof window !== 'undefined') {
  // Error de JavaScript
  window.addEventListener('error', (event) => {
    globalLogger.error('Error global de JavaScript', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }, ['global', 'unhandled']);
  });
  
  // Promesas rechazadas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    globalLogger.error('Promesa rechazada no manejada', event.reason, {
      reason: event.reason?.toString()
    }, ['global', 'promise', 'unhandled']);
  });
  
  // Exponer logger para debugging en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    window.__LOGGER = globalLogger;
    window.__LOG_STORAGE = LogStorage;
  }
}

// ✅ Exportación por defecto
export default logger;