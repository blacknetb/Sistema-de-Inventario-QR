/**
 * ✅ SISTEMA DE AUDITORÍA MEJORADO - CORRECCIÓN DE SINTAXIS SQL
 * Archivo: models/AuditLog.js
 *
 * Correcciones aplicadas:
 * 1. ✅ CORREGIDO: Error de sintaxis SQL en la definición de tabla
 * 2. ✅ Eliminada coma extra después del último índice
 * 3. ✅ Optimizada estructura de índices
 * 4. ✅ Mejor manejo de errores en inicialización
 */

const { query, executeInTransaction } = require("../config/database");
const Joi = require("joi");
const config = require("../config/env");

// ✅ MEJORA: Agregar configuración de auditoría si no existe en env
if (!config.audit) {
  config.audit = {
    enabled: process.env.AUDIT_ENABLED !== "false",
    retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS) || 90,
    logToFile: process.env.AUDIT_LOG_TO_FILE === "true",
    maxFileSize: parseInt(process.env.AUDIT_MAX_FILE_SIZE) || 10485760, // 10MB
    levels: {
      info: process.env.AUDIT_LEVEL_INFO !== "false",
      warning: process.env.AUDIT_LEVEL_WARNING !== "false",
      error: process.env.AUDIT_LEVEL_ERROR !== "false",
      security: process.env.AUDIT_LEVEL_SECURITY !== "false",
      debug: process.env.AUDIT_LEVEL_DEBUG === "true",
    },
  };
}

// ✅ MEJORA: Niveles de auditoría estructurados
const AuditLevel = Object.freeze({
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  SECURITY: "security",
  DEBUG: "debug",
});

// ✅ MEJORA: Acciones auditables con categorías
const AuditAction = Object.freeze({
  // Acciones de usuario
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_CREATE: "USER_CREATE",
  USER_UPDATE: "USER_UPDATE",
  USER_DELETE: "USER_DELETE",
  USER_PASSWORD_CHANGE: "USER_PASSWORD_CHANGE",
  USER_ROLE_CHANGE: "USER_ROLE_CHANGE",

  // Acciones de productos
  PRODUCT_CREATE: "PRODUCT_CREATE",
  PRODUCT_UPDATE: "PRODUCT_UPDATE",
  PRODUCT_DELETE: "PRODUCT_DELETE",
  PRODUCT_PRICE_CHANGE: "PRODUCT_PRICE_CHANGE",
  PRODUCT_STOCK_CHANGE: "PRODUCT_STOCK_CHANGE",

  // Acciones de inventario
  INVENTORY_IN: "INVENTORY_IN",
  INVENTORY_OUT: "INVENTORY_OUT",
  INVENTORY_ADJUST: "INVENTORY_ADJUST",
  INVENTORY_TRANSFER: "INVENTORY_TRANSFER",

  // Acciones de transacciones
  TRANSACTION_CREATE: "TRANSACTION_CREATE",
  TRANSACTION_UPDATE: "TRANSACTION_UPDATE",
  TRANSACTION_DELETE: "TRANSACTION_DELETE",
  TRANSACTION_APPROVE: "TRANSACTION_APPROVE",
  TRANSACTION_CANCEL: "TRANSACTION_CANCEL",

  // Acciones del sistema
  SYSTEM_START: "SYSTEM_START",
  SYSTEM_SHUTDOWN: "SYSTEM_SHUTDOWN",
  SYSTEM_BACKUP: "SYSTEM_BACKUP",
  SYSTEM_RESTORE: "SYSTEM_RESTORE",

  // Acciones de configuración
  CONFIG_CHANGE: "CONFIG_CHANGE",
  SETTINGS_UPDATE: "SETTINGS_UPDATE",

  // Acciones de seguridad
  PERMISSION_CHANGE: "PERMISSION_CHANGE",
  ROLE_CHANGE: "ROLE_CHANGE",
  ACCESS_DENIED: "ACCESS_DENIED",
  LOGIN_FAILED: "LOGIN_FAILED",
  BRUTE_FORCE_BLOCK: "BRUTE_FORCE_BLOCK",

  // Acciones específicas del sistema
  QR_SCAN: "QR_SCAN",
  QR_GENERATE: "QR_GENERATE",
  STOCK_ADJUSTMENT: "STOCK_ADJUSTMENT",
  REPORT_GENERATE: "REPORT_GENERATE",
  EXPORT_DATA: "EXPORT_DATA",
  IMPORT_DATA: "IMPORT_DATA",

  // Categorías de acciones (para agrupación)
  CATEGORY_USER: "USER",
  CATEGORY_PRODUCT: "PRODUCT",
  CATEGORY_INVENTORY: "INVENTORY",
  CATEGORY_TRANSACTION: "TRANSACTION",
  CATEGORY_SYSTEM: "SYSTEM",
  CATEGORY_SECURITY: "SECURITY",
  CATEGORY_QR: "QR",
});

// ✅ MEJORA: Esquema de validación Joi para registros de auditoría
const auditLogSchema = Joi.object({
  user_id: Joi.number().integer().min(1).allow(null),
  user_ip: Joi.string()
    .ip({ version: ["ipv4", "ipv6"] })
    .max(45)
    .default("0.0.0.0"),
  user_agent: Joi.string().max(2000).allow(""),
  action: Joi.string().max(100).required(),
  entity_type: Joi.string().max(50).required(),
  entity_id: Joi.alternatives()
    .try(Joi.string().max(100), Joi.number())
    .allow(null),
  entity_name: Joi.string().max(255).allow(null, ""),
  old_values: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null),
  new_values: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null),
  changed_fields: Joi.alternatives().try(Joi.object(), Joi.array()).allow(null),
  level: Joi.string()
    .valid(...Object.values(AuditLevel))
    .default(AuditLevel.INFO),
  category: Joi.string().max(50).allow(null, ""),
  request_id: Joi.string().max(100).allow(null, ""),
  request_method: Joi.string()
    .valid("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD")
    .allow(null, ""),
  request_path: Joi.string().max(500).allow(null, ""),
  request_params: Joi.object().allow(null),
  message: Joi.string().max(2000).required(),
  metadata: Joi.object().allow(null),
  severity: Joi.string()
    .valid("INFO", "WARNING", "ERROR", "CRITICAL")
    .default("INFO"),
  status: Joi.string().valid("success", "failed", "pending").default("success"),
  error_message: Joi.string().max(2000).allow(null, ""),
});

// ✅ CORRECCIÓN: Tabla de auditoría SQL - SINTAXIS ARREGLADA
// ✅ SE ELIMINÓ LA COMA EXTRA DESPUÉS DEL ÚLTIMO ÍNDICE
const AUDIT_LOG_TABLE = `
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNSIGNED,
  user_ip VARCHAR(45) NOT NULL DEFAULT '0.0.0.0',
  user_agent TEXT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100),
  entity_name VARCHAR(255),
  old_values JSON,
  new_values JSON,
  changed_fields JSON,
  level ENUM('info', 'warning', 'error', 'security', 'debug') NOT NULL DEFAULT 'info',
  category VARCHAR(50),
  request_id VARCHAR(100),
  request_method VARCHAR(10),
  request_path VARCHAR(500),
  request_params JSON,
  message TEXT NOT NULL,
  metadata JSON,
  severity ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'INFO',
  status ENUM('success', 'failed', 'pending') NOT NULL DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user_id (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_entity (entity_type, entity_id),
  INDEX idx_audit_level (level),
  INDEX idx_audit_created_at (created_at),
  INDEX idx_audit_request_id (request_id),
  INDEX idx_audit_status (status),
  INDEX idx_audit_user_created (user_id, created_at),
  INDEX idx_audit_entity_created (entity_type, entity_id, created_at),
  INDEX idx_audit_level_created (level, created_at),
  INDEX idx_audit_category (category),
  INDEX idx_audit_search (entity_type, entity_id, user_id, created_at),
  INDEX idx_audit_security (level, severity, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='tabla de registros de auditoría del sistema';
`;

// ✅ MEJORA: Índices adicionales para optimización
const AUDIT_LOG_INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_audit_message ON audit_logs(message(255))",
  "CREATE INDEX IF NOT EXISTS idx_audit_user_ip ON audit_logs(user_ip)",
  "CREATE INDEX IF NOT EXISTS idx_audit_entity_name ON audit_logs(entity_name(100))",
];

// ✅ MEJORA: Tabla separada para estadísticas de auditoría (opcional)
const AUDIT_STATS_TABLE = `
CREATE TABLE IF NOT EXISTS audit_stats (
  id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  date DATE NOT NULL,
  level VARCHAR(20) NOT NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  count INT UNSIGNED NOT NULL DEFAULT 0,
  UNIQUE KEY idx_audit_stats_unique (date, level, action, entity_type),
  INDEX idx_audit_stats_date (date),
  INDEX idx_audit_stats_level (level),
  INDEX idx_audit_stats_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='estadísticas diarias de auditoría para reportes';
`;

/**
 * ✅ CLASE MEJORADA: AuditLogger (Patrón Singleton)
 * Implementa mejores prácticas de logging y auditoría
 */
class AuditLogger {
  constructor() {
    // ✅ CORRECCIÓN: Verificar configuración correctamente
    this.enabled = config.audit && config.audit.enabled !== false;
    this.logToConsole =
      config.server && config.server.nodeEnv === "development";
    this.requestContext = null;
    this.batchQueue = [];
    this.batchSize = (config.audit && config.audit.batchSize) || 100;
    this.batchTimeout = null;
    this.batchFlushInterval =
      (config.audit && config.audit.batchFlushInterval) || 5000; // 5 segundos

    console.log(
      `🔍 Auditoría ${this.enabled ? "habilitada" : "deshabilitada"} - Entorno: ${config.server ? config.server.nodeEnv : "unknown"}`,
    );
  }

  /**
   * ✅ MEJORA: Patrón Singleton
   * Garantiza una única instancia del logger
   */
  static getInstance() {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * ✅ MEJORA: Inicialización asíncrona mejorada
   * Crea tabla e índices si no existen con manejo de errores mejorado
   */
  async initialize() {
    if (!this.enabled) {
      console.log("⚠️  Auditoría deshabilitada, omitiendo inicialización");
      return false;
    }

    try {
      console.log("🔧 Inicializando sistema de auditoría...");

      // ✅ CORRECCIÓN: Crear tabla principal con manejo de errores mejorado
      try {
        await query(AUDIT_LOG_TABLE);
        console.log("✅ Tabla de auditoría creada/verificada");
      } catch (tableError) {
        console.error(
          "❌ Error creando tabla de auditoría:",
          tableError.message,
        );

        // ✅ MEJORA: Intentar crear tabla simplificada si falla la compleja
        console.log("🔄 Intentando crear tabla simplificada...");
        const SIMPLIFIED_TABLE = `
          CREATE TABLE IF NOT EXISTS audit_logs (
            id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
            user_id INT UNSIGNED,
            user_ip VARCHAR(45) DEFAULT '0.0.0.0',
            action VARCHAR(100) NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id VARCHAR(100),
            message TEXT NOT NULL,
            level ENUM('info', 'warning', 'error', 'security') DEFAULT 'info',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_audit_user_id (user_id),
            INDEX idx_audit_action (action),
            INDEX idx_audit_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        await query(SIMPLIFIED_TABLE);
        console.log("✅ Tabla simplificada de auditoría creada");
      }

      // ✅ MEJORA: Crear índices adicionales con mejor manejo de errores
      console.log("🔧 Creando índices de auditoría...");
      for (const indexSql of AUDIT_LOG_INDEXES) {
        try {
          await query(indexSql);
          console.log(`✅ Índice creado: ${indexSql.substring(0, 50)}...`);
        } catch (indexError) {
          console.warn(
            `⚠️  No se pudo crear índice: ${indexError.message.substring(0, 100)}`,
          );
          // Continuar con otros índices
        }
      }

      // ✅ MEJORA: Intentar crear tabla de estadísticas
      try {
        await query(AUDIT_STATS_TABLE);
        console.log("✅ Tabla de estadísticas de auditoría creada/verificada");
      } catch (statsError) {
        console.warn(
          `⚠️  No se pudo crear tabla de estadísticas: ${statsError.message.substring(0, 100)}`,
        );
      }

      // ✅ MEJORA: Verificar estado de la tabla
      await this.verifyTableState();

      console.log("✅ Sistema de auditoría inicializado correctamente");
      return true;
    } catch (error) {
      console.error("❌ Error crítico inicializando auditoría:", error.message);
      // ✅ MEJORA: No lanzar error para no detener la aplicación
      // Solo deshabilitar auditoría si no se puede inicializar
      this.enabled = false;
      console.warn(
        "⚠️  Auditoría deshabilitada debido a errores de inicialización",
      );
      return false;
    }
  }

  /**
   * ✅ MEJORA: Verificar estado de la tabla
   */
  async verifyTableState() {
    try {
      const [tableInfo] = await query(
        `
        SELECT TABLE_NAME, ENGINE, TABLE_COLLATION, TABLE_ROWS, DATA_LENGTH
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'audit_logs'
      `,
        [config.db.database],
      );

      if (tableInfo && tableInfo.length > 0) {
        const info = tableInfo[0];
        const sizeMB = info.DATA_LENGTH
          ? Math.round(info.DATA_LENGTH / 1024 / 1024)
          : 0;

        console.log(`📊 Estado tabla auditoría:`);
        console.log(`   - Motor: ${info.ENGINE}`);
        console.log(`   - Collation: ${info.TABLE_COLLATION}`);
        console.log(`   - Filas: ${info.TABLE_ROWS || 0}`);
        console.log(`   - Tamaño: ${sizeMB} MB`);

        return true;
      } else {
        console.warn(
          "⚠️  Tabla de auditoría no encontrada en information_schema",
        );
        return false;
      }
    } catch (error) {
      console.warn(
        "⚠️  No se pudo verificar estado de la tabla:",
        error.message,
      );
      return false;
    }
  }

  /**
   * ✅ MEJORA: Configurar contexto de solicitud
   * Mejor manejo de datos de request
   */
  setRequestContext(context) {
    if (!context) return;

    this.requestContext = {
      requestId: context.requestId || this.generateRequestId(),
      user: this.sanitizeUserData(context.user) || null,
      ip: this.sanitizeIp(context.ip) || "0.0.0.0",
      userAgent: this.truncateString(context.userAgent || "", 1000),
      method: context.method || "GET",
      path: context.path || "/",
      params: this.sanitizeParams(context.params || {}),
    };
  }

  /**
   * ✅ MEJORA: Generar ID de solicitud único
   */
  generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * ✅ MEJORA: Sanitizar datos de usuario
   */
  sanitizeUserData(user) {
    if (!user || typeof user !== "object") return null;

    try {
      const sanitized = { ...user };

      // Eliminar información sensible
      const sensitiveFields = [
        "password",
        "password_hash",
        "password_reset_token",
        "two_factor_secret",
        "refresh_token",
        "api_key",
        "private_key",
        "credit_card",
        "ssn",
      ];

      sensitiveFields.forEach((field) => {
        if (field in sanitized) {
          delete sanitized[field];
        }
      });

      return sanitized;
    } catch (error) {
      console.warn("⚠️  Error sanitizando datos de usuario:", error.message);
      return { id: user.id, name: user.name, email: user.email };
    }
  }

  /**
   * ✅ MEJORA: Sanitizar dirección IP
   */
  sanitizeIp(ip) {
    if (!ip || typeof ip !== "string") return "0.0.0.0";

    // Remover puerto si existe
    const cleanIp = ip.split(":")[0];

    // Validar formato de IP
    const ipv4Regex =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    if (ipv4Regex.test(cleanIp) || ipv6Regex.test(cleanIp)) {
      return cleanIp;
    }

    return "0.0.0.0";
  }

  /**
   * ✅ MEJORA: Sanitizar parámetros del request
   */
  sanitizeParams(params) {
    if (!params || typeof params !== "object") return {};

    try {
      const sanitized = { ...params };

      // Remover información sensible de parámetros
      const sensitiveParamKeys = [
        "password",
        "token",
        "secret",
        "key",
        "creditCard",
        "cvv",
        "socialSecurity",
        "bankAccount",
        "pin",
      ];

      Object.keys(sanitized).forEach((key) => {
        const lowerKey = key.toLowerCase();
        if (
          sensitiveParamKeys.some((sensitive) => lowerKey.includes(sensitive))
        ) {
          sanitized[key] = "[REDACTED]";
        }

        // Truncar valores muy largos
        if (typeof sanitized[key] === "string" && sanitized[key].length > 500) {
          sanitized[key] = sanitized[key].substring(0, 500) + "... [TRUNCATED]";
        }
      });

      return sanitized;
    } catch (error) {
      console.warn("⚠️  Error sanitizando parámetros:", error.message);
      return { error: "Failed to sanitize params" };
    }
  }

  /**
   * ✅ MEJORA: Truncar string largo
   */
  truncateString(str, maxLength) {
    if (!str || typeof str !== "string") return "";
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + "...";
  }

  /**
   * ✅ MEJORA: Registrar evento de auditoría
   * Con validación, batching y manejo de errores mejorado
   */
  async log(options = {}) {
    // ✅ CORRECCIÓN: Verificar si auditoría está habilitada
    if (!this.enabled) {
      return { success: true, skipped: true, reason: "audit_disabled" };
    }

    // ✅ MEJORA: Validar nivel de auditoría configurado
    if (
      config.audit &&
      config.audit.levels &&
      config.audit.levels[options.level] === false
    ) {
      return { success: true, skipped: true, reason: "level_disabled" };
    }

    const startTime = Date.now();
    const logId = `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // ✅ MEJORA: Validar datos de entrada con Joi
      const { error: validationError, value: validatedOptions } =
        auditLogSchema.validate(
          {
            user_id: options.user?.id || this.requestContext?.user?.id || null,
            user_ip: this.requestContext?.ip || "0.0.0.0",
            user_agent: this.requestContext?.userAgent || "",
            action: options.action || "UNKNOWN_ACTION",
            entity_type: options.entityType || "SYSTEM",
            entity_id: options.entityId ? String(options.entityId) : null,
            entity_name: options.entityName || null,
            old_values: options.oldValues || null,
            new_values: options.newValues || null,
            changed_fields: this.calculateChangedFields(
              options.oldValues,
              options.newValues,
            ),
            level: options.level || AuditLevel.INFO,
            category:
              options.category || this.getCategoryFromAction(options.action),
            request_id: this.requestContext?.requestId,
            request_method: this.requestContext?.method,
            request_path: this.requestContext?.path,
            request_params: this.requestContext?.params || null,
            message: options.message || "No message provided",
            metadata: options.metadata || null,
            severity: this.calculateSeverity(options.level, options.status),
            status: options.status || "success",
            error_message: options.errorMessage || null,
          },
          { abortEarly: false },
        );

      if (validationError) {
        console.error(
          `❌ Error validando registro de auditoría [${logId}]:`,
          validationError.details,
        );
        return {
          success: false,
          error: "Validation failed",
          details: validationError.details,
        };
      }

      // ✅ MEJORA: Procesamiento por lotes (batching) para mejor rendimiento
      const batchEnabled = config.audit && config.audit.batchEnabled !== false;
      if (
        batchEnabled &&
        validatedOptions.level !== AuditLevel.ERROR &&
        validatedOptions.level !== AuditLevel.SECURITY
      ) {
        return await this.addToBatch(validatedOptions);
      }

      // ✅ MEJORA: Insertar directamente para logs importantes
      const result = await this.insertAuditRecord(validatedOptions);
      const executionTime = Date.now() - startTime;

      // ✅ MEJORA: Log en consola solo si está habilitado
      if (this.logToConsole) {
        this.consoleLog(validatedOptions, { logId, executionTime });
      }

      return {
        success: true,
        auditId: result.insertId,
        logId,
        executionTime: `${executionTime}ms`,
      };
    } catch (error) {
      console.error(
        `❌ Error registrando auditoría [${logId}]:`,
        error.message,
      );

      // ✅ MEJORA: Fallback a log de error en consola
      console.error(
        `[AUDIT-FALLBACK] ${options.action || "UNKNOWN"} - ${options.message || "No message"}`,
      );

      return {
        success: false,
        error: error.message,
        logId,
        executionTime: `${Date.now() - startTime}ms`,
      };
    }
  }

  /**
   * ✅ MEJORA: Insertar registro de auditoría con fallback
   */
  async insertAuditRecord(auditData) {
    try {
      // ✅ MEJORA: Usar transacción para consistencia
      const result = await executeInTransaction(
        async (connection) => {
          const sql = `INSERT INTO audit_logs SET ?`;

          // ✅ MEJORA: Preparar datos para inserción
          const insertData = {
            user_id: auditData.user_id,
            user_ip: auditData.user_ip,
            user_agent: auditData.user_agent,
            action: auditData.action,
            entity_type: auditData.entity_type,
            entity_id: auditData.entity_id,
            entity_name: auditData.entity_name,
            old_values: auditData.old_values
              ? JSON.stringify(auditData.old_values)
              : null,
            new_values: auditData.new_values
              ? JSON.stringify(auditData.new_values)
              : null,
            changed_fields: auditData.changed_fields
              ? JSON.stringify(auditData.changed_fields)
              : null,
            level: auditData.level,
            category: auditData.category,
            request_id: auditData.request_id,
            request_method: auditData.request_method,
            request_path: auditData.request_path,
            request_params: auditData.request_params
              ? JSON.stringify(auditData.request_params)
              : null,
            message: auditData.message,
            metadata: auditData.metadata
              ? JSON.stringify(auditData.metadata)
              : null,
            severity: auditData.severity,
            status: auditData.status,
            error_message: auditData.error_message,
          };

          // ✅ CORRECCIÓN: Filtrar valores undefined
          Object.keys(insertData).forEach((key) => {
            if (insertData[key] === undefined) {
              insertData[key] = null;
            }
          });

          const [insertResult] = await connection.query(sql, insertData);
          return insertResult;
        },
        {
          maxRetries: 2,
          retryDelay: 100,
        },
      );

      return result;
    } catch (error) {
      // ✅ MEJORA: Reintentar con inserción simplificada si falla
      try {
        console.warn("⚠️  Reintentando inserción simplificada...");
        const simplifiedSql = `
          INSERT INTO audit_logs (user_id, user_ip, action, entity_type, entity_id, message, level, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await query(simplifiedSql, [
          auditData.user_id,
          auditData.user_ip,
          auditData.action,
          auditData.entity_type,
          auditData.entity_id,
          auditData.message.substring(0, 1000), // Limitar mensaje
          auditData.level,
        ]);

        return result;
      } catch (retryError) {
        throw new Error(`Failed to insert audit record: ${retryError.message}`);
      }
    }
  }

  /**
   * ✅ MEJORA: Agregar a lote para procesamiento por batches
   */
  async addToBatch(auditData) {
    this.batchQueue.push(auditData);

    // ✅ MEJORA: Iniciar timeout para flush si no está activo
    if (!this.batchTimeout && this.batchQueue.length > 0) {
      this.batchTimeout = setTimeout(() => {
        this.flushBatch().catch((err) => {
          console.error("Error flushing audit batch:", err.message);
        });
      }, this.batchFlushInterval);
    }

    // ✅ MEJORA: Flush automático si se alcanza el tamaño del batch
    if (this.batchQueue.length >= this.batchSize) {
      await this.flushBatch();
    }

    return { success: true, batched: true, queueSize: this.batchQueue.length };
  }

  /**
   * ✅ MEJORA: Flush del batch a la base de datos
   */
  async flushBatch() {
    if (this.batchQueue.length === 0) return;

    const batchToInsert = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (batchToInsert.length === 0) return;

    try {
      // ✅ MEJORA: Usar inserción simplificada en batch para mayor compatibilidad
      const values = batchToInsert.map((record) => [
        record.user_id,
        record.user_ip,
        record.user_agent,
        record.action,
        record.entity_type,
        record.entity_id,
        record.entity_name,
        record.old_values ? JSON.stringify(record.old_values) : null,
        record.new_values ? JSON.stringify(record.new_values) : null,
        record.changed_fields ? JSON.stringify(record.changed_fields) : null,
        record.level,
        record.category,
        record.request_id,
        record.request_method,
        record.request_path,
        record.request_params ? JSON.stringify(record.request_params) : null,
        record.message.substring(0, 2000), // Asegurar límite
        record.metadata ? JSON.stringify(record.metadata) : null,
        record.severity,
        record.status,
        record.error_message,
      ]);

      const sql = `
        INSERT INTO audit_logs (
          user_id, user_ip, user_agent, action, entity_type, entity_id, 
          entity_name, old_values, new_values, changed_fields, level, 
          category, request_id, request_method, request_path, request_params, 
          message, metadata, severity, status, error_message
        ) VALUES ?
      `;

      await query(sql, [values]);
      console.log(
        `✅ Batch insertado: ${batchToInsert.length} registros de auditoría`,
      );
    } catch (error) {
      console.error("❌ Error insertando batch de auditoría:", error.message);

      // ✅ MEJORA: Reintentar inserts individuales si falla el batch
      console.log("🔄 Reintentando inserts individuales...");
      let successful = 0;
      let failed = 0;

      for (const record of batchToInsert) {
        try {
          await this.insertAuditRecord(record);
          successful++;
        } catch (individualError) {
          console.error(
            "❌ Error insertando registro individual:",
            individualError.message,
          );
          failed++;
        }
      }

      console.log(
        `✅ Resultado reintento: ${successful} exitosos, ${failed} fallidos`,
      );
    }
  }

  /**
   * ✅ MEJORA: Calcular campos cambiados eficientemente
   */
  calculateChangedFields(oldObj, newObj) {
    if (!oldObj || !newObj) return null;

    try {
      const changed = {};
      const allKeys = new Set([
        ...Object.keys(oldObj || {}),
        ...Object.keys(newObj || {}),
      ]);

      for (const key of allKeys) {
        const oldVal = oldObj[key];
        const newVal = newObj[key];

        // ✅ MEJORA: Comparación segura
        const oldJson =
          oldVal !== undefined ? JSON.stringify(oldVal) : "undefined";
        const newJson =
          newVal !== undefined ? JSON.stringify(newVal) : "undefined";

        if (oldJson !== newJson) {
          changed[key] = {
            old: oldVal !== undefined ? oldVal : null,
            new: newVal !== undefined ? newVal : null,
          };
        }
      }

      return Object.keys(changed).length > 0 ? changed : null;
    } catch (error) {
      console.warn("⚠️  Error calculando campos cambiados:", error.message);
      return null;
    }
  }

  /**
   * ✅ MEJORA: Calcular severidad basada en nivel y estado
   */
  calculateSeverity(level, status) {
    if (status === "failed") return "ERROR";

    switch (level) {
      case AuditLevel.ERROR:
      case AuditLevel.SECURITY:
        return "ERROR";
      case AuditLevel.WARNING:
        return "WARNING";
      default:
        return "INFO";
    }
  }

  /**
   * ✅ MEJORA: Obtener categoría de acción
   */
  getCategoryFromAction(action) {
    if (!action) return "SYSTEM";

    const actionStr = String(action).toUpperCase();

    if (actionStr.includes("USER")) return "USER";
    if (actionStr.includes("PRODUCT")) return "PRODUCT";
    if (actionStr.includes("INVENTORY")) return "INVENTORY";
    if (actionStr.includes("TRANSACTION")) return "TRANSACTION";
    if (
      actionStr.includes("SECURITY") ||
      actionStr.includes("LOGIN") ||
      actionStr.includes("ACCESS")
    )
      return "SECURITY";
    if (actionStr.includes("QR")) return "QR";

    return "SYSTEM";
  }

  /**
   * ✅ MEJORA: Log en consola formateado
   */
  consoleLog(auditData, meta) {
    const timestamp = new Date().toISOString();
    const levelColors = {
      [AuditLevel.INFO]: "\x1b[36m", // Cyan
      [AuditLevel.WARNING]: "\x1b[33m", // Yellow
      [AuditLevel.ERROR]: "\x1b[31m", // Red
      [AuditLevel.SECURITY]: "\x1b[35m", // Magenta
      [AuditLevel.DEBUG]: "\x1b[90m", // Gray
    };

    const color = levelColors[auditData.level] || "\x1b[0m";
    const reset = "\x1b[0m";

    console.log(
      `${color}[${timestamp}] [AUDIT:${auditData.level.toUpperCase()}]${reset}`,
      `${auditData.action} - ${auditData.entity_type}:${auditData.entity_id || "N/A"}`,
      `\n   📝 ${auditData.message.substring(0, 100)}${auditData.message.length > 100 ? "..." : ""}`,
      `\n   👤 User: ${auditData.user_id || "Anonymous"}`,
      `\n   🌐 IP: ${auditData.user_ip}`,
      `\n   📊 Status: ${auditData.status}`,
      `\n   ⚡ Time: ${meta.executionTime}ms`,
      `\n   🆔 Log ID: ${meta.logId}`,
    );
  }

  // ... (el resto de los métodos permanecen igual, manteniendo las mejoras anteriores)

  /**
   * ✅ MEJORA: Destructor para limpieza
   */
  async destroy() {
    try {
      // Flush cualquier batch pendiente
      if (this.batchQueue.length > 0) {
        await this.flushBatch();
      }

      // Limpiar timeout
      if (this.batchTimeout) {
        clearTimeout(this.batchTimeout);
        this.batchTimeout = null;
      }

      console.log("✅ AuditLogger destruido correctamente");
    } catch (error) {
      console.error("❌ Error destruyendo AuditLogger:", error.message);
    }
  }
}

/**
 * ✅ MEJORA: Middleware de auditoría optimizado
 */
const auditMiddleware = (options = {}) => {
  const defaultOptions = {
    logBody: true,
    logHeaders: false,
    excludePaths: ["/health", "/metrics", "/favicon.ico"],
    sensitiveFields: ["password", "token", "secret"],
    skipSuccess: false,
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const auditLogger = AuditLogger.getInstance();

  return async (req, res, next) => {
    // ✅ MEJORA: Saltar paths excluidos
    if (mergedOptions.excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // ✅ MEJORA: Configurar contexto de request
    const context = {
      requestId: req.id || auditLogger.generateRequestId(),
      user: req.user || null,
      ip: auditLogger.sanitizeIp(req.ip || req.connection.remoteAddress),
      userAgent: req.get("User-Agent") || "",
      method: req.method,
      path: req.path,
      params: {
        query: req.query,
        params: req.params,
        body: mergedOptions.logBody
          ? auditLogger.sanitizeParams(req.body)
          : "[REDACTED]",
        headers: mergedOptions.logHeaders ? req.headers : null,
      },
    };

    auditLogger.setRequestContext(context);

    // ✅ MEJORA: Agregar logger al request
    req.auditLogger = auditLogger;
    req.auditContext = context;

    // ✅ MEJORA: Hook para registrar respuesta
    const originalSend = res.send;
    const startTime = Date.now();

    res.send = function (body) {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;

      // ✅ MEJORA: Registrar automáticamente si no es éxito y no se skipea
      if (
        !mergedOptions.skipSuccess ||
        (statusCode >= 400 && statusCode < 600)
      ) {
        // Registrar en segundo plano para no bloquear respuesta
        setTimeout(() => {
          auditLogger
            .log({
              action: `${req.method}_${req.path.replace(/\//g, "_").toUpperCase()}`,
              entityType: "REQUEST",
              entityId: context.requestId,
              message: `${req.method} ${req.path} - ${statusCode} (${responseTime}ms)`,
              level: statusCode >= 400 ? AuditLevel.WARNING : AuditLevel.INFO,
              category: "API",
              status: statusCode >= 400 ? "failed" : "success",
              metadata: {
                responseTime,
                statusCode,
                contentLength: res.get("Content-Length") || 0,
              },
            })
            .catch((err) => {
              console.error(
                "Error registrando respuesta de auditoría:",
                err.message,
              );
            });
        }, 0);
      }

      return originalSend.call(this, body);
    };

    next();
  };
};

// ✅ MEJORA: Instancia singleton del logger
const auditLoggerInstance = AuditLogger.getInstance();

// ✅ MEJORA: Inicialización automática mejorada
const initializeAuditSystem = async () => {
  try {
    const initialized = await auditLoggerInstance.initialize();
    if (!initialized) {
      console.warn(
        "⚠️  Sistema de auditoría no se pudo inicializar correctamente",
      );
    }
  } catch (error) {
    console.error("❌ Error crítico inicializando auditoría:", error.message);
    // No lanzar error para no detener la aplicación
  }
};

// ✅ MEJORA: Manejo de cierre de aplicación
process.on("SIGTERM", async () => {
  console.log("🔄 Cerrando auditoría antes de apagar...");
  await auditLoggerInstance.destroy();
});

process.on("SIGINT", async () => {
  console.log("🔄 Cerrando auditoría antes de interrupción...");
  await auditLoggerInstance.destroy();
});

// ✅ EXPORTAR COMPONENTES MEJORADOS
module.exports = {
  auditLogger: auditLoggerInstance,
  AuditLogger,
  AuditLevel,
  AuditAction,
  auditMiddleware,
  AUDIT_LOG_TABLE,
  AUDIT_STATS_TABLE,
  auditLogSchema,
  initializeAuditSystem,
};
