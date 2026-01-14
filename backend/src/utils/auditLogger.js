/**
 * ✅ AUDIT LOGGER - SERVICIO DE AUDITORÍA MEJORADO
 * Archivo: src/utils/auditLogger.js
 *
 * Correcciones aplicadas:
 * 1. ✅ CORREGIDO: Error de sintaxis SQL en CREATE TABLE
 * 2. ✅ MEJORA: Manejo de errores robusto
 * 3. ✅ MEJORA: Logging estructurado
 * 4. ✅ MEJORA: Compatibilidad con MySQL 5.7/8.0
 */

const { query } = require("../config/database");
const config = require("../config/env");

class AuditLogger {
  constructor() {
    this.initialized = false;
    this.enabled = config.security?.auditEnabled !== false;
    this.tableName = "audit_logs";
  }

  /**
   * ✅ INICIALIZAR TABLA DE AUDITORÍA - SQL CORREGIDO
   */
  async initialize() {
    if (this.initialized || !this.enabled) return;

    try {
      console.log("🔍 Inicializando servicio de auditoría...");

      // ✅ CORRECCIÓN: SQL corregido - sin coma extra al final de los índices
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
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

          -- ✅ CORRECCIÓN: Índices optimizados (sin coma extra al final)
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

          -- ✅ CORRECCIÓN: Índices compuestos (último índice sin coma)
          INDEX idx_audit_search (entity_type, entity_id, user_id, created_at),
          INDEX idx_audit_security (level, severity, created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Tabla de registros de auditoría del sistema'
      `;

      await query(createTableSQL);

      console.log("✅ Tabla de auditoría creada/verificada exitosamente");

      // Verificar compatibilidad con JSON
      try {
        const [result] = await query(
          `
          SELECT COUNT(*) as count 
          FROM information_schema.COLUMNS 
          WHERE TABLE_SCHEMA = ? 
            AND TABLE_NAME = ? 
            AND COLUMN_NAME = 'old_values' 
            AND DATA_TYPE = 'json'
        `,
          [config.db.database, this.tableName],
        );

        if (result[0].count === 0) {
          console.warn("⚠️  MySQL no soporta JSON, usando TEXT como fallback");
          await this.migrateToTextFields();
        }
      } catch (compatError) {
        console.warn(
          "⚠️  No se pudo verificar compatibilidad JSON:",
          compatError.message,
        );
      }

      // Verificar si la tabla tiene datos
      try {
        const [result] = await query(
          `SELECT COUNT(*) as count FROM ${this.tableName}`,
        );
        console.log(`📊 Auditoría: ${result[0].count} registros existentes`);
      } catch (countError) {
        console.warn(
          "⚠️  No se pudo contar registros de auditoría:",
          countError.message,
        );
      }

      this.initialized = true;
    } catch (error) {
      console.error("❌ Error inicializando auditoría:", error.message);

      // En desarrollo, mostrar el error completo
      if (config.server.nodeEnv === "development") {
        console.error("Detalles del error SQL:", error);

        // Intentar crear tabla simplificada
        await this.createSimpleTable();
      }

      this.initialized = false;
    }
  }

  /**
   * ✅ CREAR TABLA SIMPLIFICADA (fallback)
   */
  async createSimpleTable() {
    try {
      console.log("🔄 Intentando crear tabla simplificada...");

      const simpleTableSQL = `
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          user_id INT UNSIGNED,
          user_ip VARCHAR(45) DEFAULT '0.0.0.0',
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(100),
          message TEXT NOT NULL,
          level VARCHAR(20) DEFAULT 'info',
          severity VARCHAR(20) DEFAULT 'INFO',
          status VARCHAR(20) DEFAULT 'success',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_simple_user (user_id),
          INDEX idx_simple_action (action),
          INDEX idx_simple_entity (entity_type, entity_id),
          INDEX idx_simple_created (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `;

      await query(simpleTableSQL);
      console.log("✅ Tabla simplificada de auditoría creada");
      this.initialized = true;
    } catch (simpleError) {
      console.error(
        "❌ Error creando tabla simplificada:",
        simpleError.message,
      );
    }
  }

  /**
   * ✅ MIGRAR A CAMPOS TEXT PARA MYSQL ANTERIOR A 5.7
   */
  async migrateToTextFields() {
    try {
      console.log("🔄 Migrando campos JSON a TEXT...");

      const alterTableSQL = `
        ALTER TABLE ${this.tableName}
        MODIFY old_values TEXT,
        MODIFY new_values TEXT,
        MODIFY changed_fields TEXT,
        MODIFY request_params TEXT,
        MODIFY metadata TEXT
      `;

      await query(alterTableSQL);
      console.log("✅ Campos migrados a TEXT exitosamente");
    } catch (alterError) {
      console.error("❌ Error migrando campos:", alterError.message);

      // Crear tabla con TEXT desde el inicio
      await this.dropAndCreateWithText();
    }
  }

  /**
   * ✅ ELIMINAR Y CREAR TABLA CON TEXT
   */
  async dropAndCreateWithText() {
    try {
      console.log("🔄 Recreando tabla con campos TEXT...");

      // Primero verificar si existen datos importantes
      const [countResult] = await query(
        `SELECT COUNT(*) as count FROM ${this.tableName}`,
      );
      const rowCount = countResult[0].count;

      if (rowCount > 0) {
        console.warn(`⚠️  Advertencia: ${rowCount} registros serán eliminados`);

        // Crear backup temporal
        const backupSQL = `CREATE TABLE ${this.tableName}_backup AS SELECT * FROM ${this.tableName}`;
        await query(backupSQL);
        console.log(`💾 Backup creado: ${this.tableName}_backup`);
      }

      // Eliminar tabla existente
      await query(`DROP TABLE IF EXISTS ${this.tableName}`);

      // Crear nueva tabla con TEXT
      const createTextTableSQL = `
        CREATE TABLE ${this.tableName} (
          id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
          user_id INT UNSIGNED,
          user_ip VARCHAR(45) NOT NULL DEFAULT '0.0.0.0',
          user_agent TEXT,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id VARCHAR(100),
          entity_name VARCHAR(255),
          old_values TEXT,
          new_values TEXT,
          changed_fields TEXT,
          level ENUM('info', 'warning', 'error', 'security', 'debug') NOT NULL DEFAULT 'info',
          category VARCHAR(50),
          request_id VARCHAR(100),
          request_method VARCHAR(10),
          request_path VARCHAR(500),
          request_params TEXT,
          message TEXT NOT NULL,
          metadata TEXT,
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
        COMMENT='Tabla de registros de auditoría del sistema'
      `;

      await query(createTextTableSQL);
      console.log("✅ Tabla recreada con campos TEXT");
    } catch (recreateError) {
      console.error("❌ Error recreando tabla:", recreateError.message);
      throw recreateError;
    }
  }

  /**
   * ✅ REGISTRAR LOG DE AUDITORÍA - MANEJO MEJORADO
   */
  async log({
    userId = null,
    userIp = "0.0.0.0",
    userAgent = "",
    action,
    entityType,
    entityId = null,
    entityName = null,
    oldValues = null,
    newValues = null,
    changedFields = null,
    level = "info",
    category = null,
    requestId = null,
    requestMethod = null,
    requestPath = null,
    requestParams = null,
    message = "",
    metadata = null,
    severity = "INFO",
    status = "success",
    errorMessage = null,
  }) {
    // Si la auditoría está deshabilitada, retornar inmediatamente
    if (!this.enabled) {
      if (config.server.nodeEnv === "development" && level === "error") {
        console.error(`[AUDIT DISABLED] ${action}: ${message}`);
      }
      return null;
    }

    try {
      // Intentar inicializar si no está inicializado
      if (!this.initialized) {
        await this.initialize();

        // Si aún no se inicializó después del intento, usar console
        if (!this.initialized) {
          console.warn(
            `⚠️  Auditoría no inicializada, registrando en consola: ${action}`,
          );
          console.log({
            timestamp: new Date().toISOString(),
            action,
            entityType,
            entityId,
            message,
            level,
            severity,
          });
          return null;
        }
      }

      // Preparar valores JSON/TEXT
      const prepareJsonValue = (value) => {
        if (value === null || value === undefined) return null;
        if (typeof value === "string") return value;
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      };

      const result = await query(
        `INSERT INTO ${this.tableName} (
          user_id, user_ip, user_agent, action, entity_type, entity_id, entity_name,
          old_values, new_values, changed_fields, level, category, request_id,
          request_method, request_path, request_params, message, metadata,
          severity, status, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          userIp,
          userAgent,
          action,
          entityType,
          entityId,
          entityName,
          prepareJsonValue(oldValues),
          prepareJsonValue(newValues),
          prepareJsonValue(changedFields),
          level,
          category,
          requestId,
          requestMethod,
          requestPath,
          prepareJsonValue(requestParams),
          message,
          prepareJsonValue(metadata),
          severity,
          status,
          errorMessage,
        ],
      );

      if (
        config.server.nodeEnv === "development" &&
        config.app?.logLevel === "debug"
      ) {
        console.debug(
          `📝 Auditoría registrada [ID: ${result.data?.insertId || "N/A"}]: ${action} - ${entityType}`,
        );
      }

      return result.data?.insertId || null;
    } catch (error) {
      console.error("❌ Error registrando auditoría:", error.message);

      // En desarrollo, mostrar más detalles pero no interrumpir
      if (config.server.nodeEnv === "development") {
        console.error("Datos de auditoría fallidos:", {
          action,
          entityType,
          entityId,
          message: message.substring(0, 100),
          error: error.message,
        });
      }

      // Fallback a console.log para errores críticos
      if (
        level === "error" ||
        severity === "ERROR" ||
        severity === "CRITICAL"
      ) {
        console.error(`[AUDIT FALLBACK] ${action}: ${message}`, {
          userId,
          entityType,
          entityId,
          error: errorMessage,
        });
      }

      return null;
    }
  }

  /**
   * ✅ MÉTODOS AUXILIARES PARA TIPOS COMUNES
   */
  async logLogin(
    userId,
    userIp,
    userAgent,
    success = true,
    errorMessage = null,
  ) {
    return await this.log({
      userId: success ? userId : null,
      userIp,
      userAgent,
      action: "USER_LOGIN",
      entityType: "user",
      entityId: userId,
      level: success ? "info" : "security",
      category: "authentication",
      message: success
        ? "Inicio de sesión exitoso"
        : "Intento de inicio de sesión fallido",
      severity: success ? "INFO" : "WARNING",
      status: success ? "success" : "failed",
      errorMessage,
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: userAgent?.substring(0, 200),
        success,
      },
    });
  }

  async logLogout(userId, userIp, userAgent) {
    return await this.log({
      userId,
      userIp,
      userAgent,
      action: "USER_LOGOUT",
      entityType: "user",
      entityId: userId,
      level: "info",
      category: "authentication",
      message: "Cierre de sesión",
      severity: "INFO",
      status: "success",
    });
  }

  async logDataChange(
    userId,
    entityType,
    entityId,
    action,
    oldValues,
    newValues,
    changedFields = null,
    userIp = null,
  ) {
    return await this.log({
      userId,
      userIp: userIp || "0.0.0.0",
      action: `DATA_${action.toUpperCase()}`,
      entityType,
      entityId,
      entityName: `${entityType}_${entityId}`,
      oldValues,
      newValues,
      changedFields,
      level: "info",
      category: "data_change",
      message: `${action} en ${entityType} ID: ${entityId}`,
      severity: "INFO",
      status: "success",
      metadata: {
        action,
        entityType,
        timestamp: new Date().toISOString(),
        changedCount: changedFields ? changedFields.length : null,
      },
    });
  }

  async logSecurityEvent(
    userId,
    action,
    message,
    details = null,
    level = "security",
    severity = "WARNING",
  ) {
    return await this.log({
      userId,
      action: `SECURITY_${action}`,
      entityType: "security",
      level,
      category: "security",
      message,
      severity,
      status: "success",
      metadata: details
        ? {
            ...details,
            timestamp: new Date().toISOString(),
          }
        : { timestamp: new Date().toISOString() },
    });
  }

  async logError(error, context = {}, userId = null) {
    return await this.log({
      userId,
      action: "SYSTEM_ERROR",
      entityType: "system",
      level: "error",
      category: "system",
      message: error.message || "Error desconocido",
      severity: "ERROR",
      status: "failed",
      errorMessage: error.stack || error.toString(),
      metadata: {
        ...context,
        errorName: error.name,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * ✅ OBTENER REGISTROS DE AUDITORÍA
   */
  async getLogs(filters = {}, pagination = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const {
        userId = null,
        entityType = null,
        entityId = null,
        action = null,
        level = null,
        severity = null,
        status = null,
        startDate = null,
        endDate = null,
        search = null,
      } = filters;

      const {
        page = 1,
        limit = 50,
        sortBy = "created_at",
        sortOrder = "DESC",
      } = pagination;

      let queryStr = `SELECT * FROM ${this.tableName} WHERE 1=1`;
      const params = [];

      if (userId) {
        queryStr += " AND user_id = ?";
        params.push(userId);
      }

      if (entityType) {
        queryStr += " AND entity_type = ?";
        params.push(entityType);
      }

      if (entityId) {
        queryStr += " AND entity_id = ?";
        params.push(entityId);
      }

      if (action) {
        queryStr += " AND action = ?";
        params.push(action);
      }

      if (level) {
        queryStr += " AND level = ?";
        params.push(level);
      }

      if (severity) {
        queryStr += " AND severity = ?";
        params.push(severity);
      }

      if (status) {
        queryStr += " AND status = ?";
        params.push(status);
      }

      if (startDate) {
        queryStr += " AND created_at >= ?";
        params.push(startDate);
      }

      if (endDate) {
        queryStr += " AND created_at <= ?";
        params.push(endDate);
      }

      if (search) {
        queryStr +=
          " AND (message LIKE ? OR entity_name LIKE ? OR action LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Validar ordenamiento seguro
      const validSortFields = [
        "created_at",
        "id",
        "user_id",
        "action",
        "level",
        "severity",
      ];
      const safeSortBy = validSortFields.includes(sortBy)
        ? sortBy
        : "created_at";
      const safeSortOrder = ["ASC", "DESC"].includes(sortOrder.toUpperCase())
        ? sortOrder.toUpperCase()
        : "DESC";

      // Ordenamiento
      queryStr += ` ORDER BY ${safeSortBy} ${safeSortOrder}`;

      // Contar total (para paginación)
      const countQuery = queryStr.replace(
        "SELECT *",
        "SELECT COUNT(*) as total",
      );
      const countQueryWithoutOrder = countQuery.split("ORDER BY")[0];
      const [countResult] = await query(countQueryWithoutOrder, params);
      const total = countResult[0]?.total || 0;

      // Paginación
      const offset = (page - 1) * limit;
      queryStr += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [logsResult] = await query(queryStr, params);
      const logs = logsResult.data || logsResult || [];

      // Parsear JSON/TEXT fields
      const parsedLogs = logs.map((log) => {
        const parseField = (field) => {
          if (!log[field]) return null;
          try {
            return JSON.parse(log[field]);
          } catch {
            return log[field];
          }
        };

        return {
          ...log,
          old_values: parseField("old_values"),
          new_values: parseField("new_values"),
          changed_fields: parseField("changed_fields"),
          request_params: parseField("request_params"),
          metadata: parseField("metadata"),
        };
      });

      return {
        success: true,
        data: parsedLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(total),
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("❌ Error obteniendo logs de auditoría:", error.message);
      return {
        success: false,
        error: error.message,
        data: [],
        pagination: {
          page: 1,
          limit: 50,
          total: 0,
          totalPages: 0,
        },
      };
    }
  }

  /**
   * ✅ LIMPIAR REGISTROS ANTIGUOS
   */
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const [result] = await query(
        `DELETE FROM ${this.tableName} WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [daysToKeep],
      );

      const deletedCount = result.affectedRows || 0;

      console.log(
        `🗑️  Auditoría: ${deletedCount} registros antiguos eliminados (más de ${daysToKeep} días)`,
      );

      return {
        success: true,
        deleted: deletedCount,
        message: `${deletedCount} registros eliminados`,
      };
    } catch (error) {
      console.error("❌ Error limpiando logs de auditoría:", error.message);
      return {
        success: false,
        error: error.message,
        deleted: 0,
      };
    }
  }

  /**
   * ✅ OBTENER ESTADÍSTICAS
   */
  async getStats(days = 30) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const statsQueries = [
        // Total registros
        query(`SELECT COUNT(*) as total FROM ${this.tableName}`),

        // Registros últimos X días
        query(
          `SELECT COUNT(*) as recent FROM ${this.tableName} WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
          [days],
        ),

        // Por nivel
        query(
          `SELECT level, COUNT(*) as count FROM ${this.tableName} GROUP BY level ORDER BY count DESC`,
        ),

        // Por categoría
        query(
          `SELECT category, COUNT(*) as count FROM ${this.tableName} WHERE category IS NOT NULL GROUP BY category ORDER BY count DESC LIMIT 10`,
        ),

        // Por acción
        query(
          `SELECT action, COUNT(*) as count FROM ${this.tableName} GROUP BY action ORDER BY count DESC LIMIT 10`,
        ),

        // Actividad por día (últimos 7 días)
        query(`
          SELECT DATE(created_at) as date, COUNT(*) as count 
          FROM ${this.tableName} 
          WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          GROUP BY DATE(created_at) 
          ORDER BY date DESC
        `),
      ];

      const results = await Promise.all(
        statsQueries.map((p) => p.catch((e) => ({ error: e.message }))),
      );

      return {
        success: true,
        stats: {
          total: results[0][0]?.[0]?.total || 0,
          recent: results[1][0]?.[0]?.recent || 0,
          byLevel: results[2][0]?.data || results[2][0] || [],
          byCategory: results[3][0]?.data || results[3][0] || [],
          byAction: results[4][0]?.data || results[4][0] || [],
          dailyActivity: results[5][0]?.data || results[5][0] || [],
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(
        "❌ Error obteniendo estadísticas de auditoría:",
        error.message,
      );
      return {
        success: false,
        error: error.message,
        stats: {},
      };
    }
  }

  /**
   * ✅ ESTADO DEL SERVICIO
   */
  getStatus() {
    return {
      enabled: this.enabled,
      initialized: this.initialized,
      tableName: this.tableName,
      timestamp: new Date().toISOString(),
      environment: config.server?.nodeEnv,
    };
  }

  /**
   * ✅ EXPORTAR REGISTROS
   */
  async exportLogs(format = "json", filters = {}) {
    try {
      const { data } = await this.getLogs(filters, { limit: 1000, page: 1 });

      if (format === "json") {
        return {
          success: true,
          format: "json",
          count: data.length,
          data,
          exportedAt: new Date().toISOString(),
        };
      } else if (format === "csv") {
        // Convertir a CSV
        const headers = [
          "ID",
          "Fecha",
          "Usuario",
          "Acción",
          "Entidad",
          "Nivel",
          "Mensaje",
          "Estado",
        ];
        const csvRows = data.map((log) =>
          [
            log.id,
            log.created_at,
            log.user_id || "N/A",
            log.action,
            `${log.entity_type}${log.entity_id ? `:${log.entity_id}` : ""}`,
            log.level,
            log.message?.substring(0, 100) || "",
            log.status,
          ]
            .map((field) => `"${String(field).replace(/"/g, '""')}"`)
            .join(","),
        );

        const csvContent = [headers.join(","), ...csvRows].join("\n");

        return {
          success: true,
          format: "csv",
          count: data.length,
          content: csvContent,
          exportedAt: new Date().toISOString(),
        };
      } else {
        throw new Error(`Formato no soportado: ${format}`);
      }
    } catch (error) {
      console.error("❌ Error exportando logs:", error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ✅ EXPORTAR INSTANCIA SINGLETON
const auditLogger = new AuditLogger();

// Inicializar automáticamente en desarrollo
if (config.server.nodeEnv === "development") {
  auditLogger.initialize().catch((error) => {
    console.error(
      "❌ Error inicializando auditoría en desarrollo:",
      error.message,
    );
  });
}

module.exports = auditLogger;
