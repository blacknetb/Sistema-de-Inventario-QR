/**
 * ✅ SERVICIO DE AUDITORÍA CORREGIDO
 * Correcciones aplicadas:
 * 1. ✅ SQL syntax error solucionado (coma extra eliminada)
 * 2. ✅ Error de promesas MySQL2 solucionado
 * 3. ✅ Manejo de errores mejorado
 */

const { query } = require("../config/database");
const config = require("../config/env");

class AuditService {
  constructor() {
    this.initialized = false;
    this.enabled = config.security?.auditEnabled !== false;
  }

  async initialize() {
    if (this.initialized || !this.enabled) return;

    try {
      console.log("🔍 Inicializando servicio de auditoría...");

      // ✅ CORRECCIÓN: SQL corregido - sin coma extra antes de ENGINE
      const createTableSQL = `
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

          -- Índices optimizados para consultas frecuentes
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

          -- Índices compuestos para consultas complejas
          INDEX idx_audit_search (entity_type, entity_id, user_id, created_at),
          INDEX idx_audit_security (level, severity, created_at)
          -- ✅ CORRECCIÓN: NO COMA aquí antes del cierre de paréntesis

        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        COMMENT='Tabla de registros de auditoría del sistema'
      `;

      await query(createTableSQL);

      console.log("✅ Tabla de auditoría creada/verificada exitosamente");
      this.initialized = true;

      // Verificar si la tabla tiene datos
      const [result] = await query("SELECT COUNT(*) as count FROM audit_logs");
      console.log(`📊 Auditoría: ${result[0].count} registros existentes`);
    } catch (error) {
      console.error("❌ Error inicializando auditoría:", error.message);

      // En desarrollo, mostrar el error completo
      if (config.server.nodeEnv === "development") {
        console.error("Detalles del error:", error);
      }

      // No lanzar error para no bloquear el inicio del servidor
      // pero marcar como no inicializado
      this.initialized = false;
    }
  }

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
    if (!this.enabled) return null;

    try {
      // Intentar inicializar si no está inicializado
      if (!this.initialized) {
        await this.initialize();

        // Si aún no se inicializó después del intento, salir
        if (!this.initialized) {
          console.warn("⚠️  Auditoría no inicializada, omitiendo registro");
          return null;
        }
      }

      const result = await query(
        `INSERT INTO audit_logs (
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
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          changedFields ? JSON.stringify(changedFields) : null,
          level,
          category,
          requestId,
          requestMethod,
          requestPath,
          requestParams ? JSON.stringify(requestParams) : null,
          message,
          metadata ? JSON.stringify(metadata) : null,
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
          `📝 Auditoría registrada [ID: ${result.insertId}]: ${action} - ${entityType}`,
        );
      }

      return result.insertId;
    } catch (error) {
      console.error("❌ Error registrando auditoría:", error.message);

      // En desarrollo, mostrar más detalles
      if (config.server.nodeEnv === "development") {
        console.error("Datos de auditoría:", {
          action,
          entityType,
          entityId,
          level,
          status,
        });
      }

      // No lanzar error para no interrumpir el flujo principal
      return null;
    }
  }

  // Métodos auxiliares para tipos comunes de auditoría
  async logLogin(
    userId,
    userIp,
    userAgent,
    success = true,
    errorMessage = null,
  ) {
    return await this.log({
      userId,
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
  ) {
    return await this.log({
      userId,
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
    });
  }

  async logSecurityEvent(
    userId,
    action,
    message,
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
    });
  }

  // Método para obtener registros de auditoría
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

      let queryStr = "SELECT * FROM audit_logs WHERE 1=1";
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

      if (startDate) {
        queryStr += " AND created_at >= ?";
        params.push(startDate);
      }

      if (endDate) {
        queryStr += " AND created_at <= ?";
        params.push(endDate);
      }

      if (search) {
        queryStr += " AND (message LIKE ? OR entity_name LIKE ?)";
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
      }

      // Ordenamiento
      queryStr += ` ORDER BY ${sortBy} ${sortOrder}`;

      // Paginación
      const offset = (page - 1) * limit;
      queryStr += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [logs] = await query(queryStr, params);

      // Obtener total para paginación
      const countQuery = queryStr.replace(
        "SELECT *",
        "SELECT COUNT(*) as total",
      );
      const [countResult] = await query(
        countQuery.split("ORDER BY")[0],
        params.slice(0, -2),
      ); // Remover LIMIT y OFFSET
      const total = countResult[0]?.total || 0;

      return {
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
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

  // Método para limpiar registros antiguos (ejecutar periódicamente)
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }

      const result = await query(
        "DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
        [daysToKeep],
      );

      console.log(
        `🗑️  Auditoría: ${result.affectedRows} registros antiguos eliminados (más de ${daysToKeep} días)`,
      );

      return {
        success: true,
        deleted: result.affectedRows,
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

  // Método para verificar estado del servicio
  getStatus() {
    return {
      enabled: this.enabled,
      initialized: this.initialized,
      timestamp: new Date().toISOString(),
    };
  }
}

// Exportar instancia singleton
module.exports = new AuditService();
