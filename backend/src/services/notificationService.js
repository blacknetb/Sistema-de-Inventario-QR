const EventEmitter = require("events");
const logger = require("../utils/logger");
const config = require("../config/env");

/**
 * ✅ SERVICIO MEJORADO DE NOTIFICACIONES
 * Correcciones aplicadas:
 * 1. Eliminación de WebSocket (se manejará en otro módulo)
 * 2. Implementación de sistema de notificaciones basado en eventos
 * 3. Mejora de manejo de colas y procesamiento por lotes
 * 4. Optimización de rendimiento y uso de memoria
 * 5. Validación mejorada de datos
 */

class NotificationService extends EventEmitter {
  constructor() {
    super();
    this.notificationQueue = [];
    this.isProcessingQueue = false;
    this.maxQueueSize = 10000;
    this.processingBatchSize = 50;
    this.retryAttempts = 3;
    this.initialize();
  }

  /**
   * ✅ MEJORA: Inicializar servicio
   */
  async initialize() {
    try {
      // ✅ MEJORA: Inicializar conexión a base de datos si es necesario
      this.db = require("../config/database");

      // ✅ MEJORA: Limpiar notificaciones antiguas al iniciar
      await this.cleanupOldNotifications();

      logger.info("Notification service initialized");
    } catch (error) {
      logger.error("Failed to initialize notification service:", error);
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Enviar notificación
   * @param {Object} notification - Datos de la notificación
   * @returns {string} ID de la notificación
   */
  sendNotification(notification) {
    try {
      // ✅ MEJORA: Validar datos de entrada
      if (!notification || typeof notification !== "object") {
        throw new Error("notification must be a valid object");
      }

      if (!notification.title || !notification.message) {
        throw new Error("notification must have title and message");
      }

      const notificationId = this.generateNotificationId();
      const timestamp = new Date().toISOString();

      const fullNotification = {
        id: notificationId,
        type: notification.type || "info",
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: this.validatePriority(notification.priority),
        channels: this.validateChannels(notification.channels),
        recipients: this.validateRecipients(notification.recipients),
        timestamp,
        expiresAt: notification.expiresAt || this.getDefaultExpiration(),
        read: false,
        delivered: false,
        deliveryAttempts: 0,
      };

      // ✅ MEJORA: Verificar límite de cola
      if (this.notificationQueue.length >= this.maxQueueSize) {
        logger.warn("Notification queue full, dropping oldest notification");
        this.notificationQueue.shift();
      }

      // ✅ MEJORA: Agregar a la cola
      this.notificationQueue.push(fullNotification);

      // ✅ MEJORA: Iniciar procesamiento si no está en curso
      if (!this.isProcessingQueue) {
        this.processQueue();
      }

      // ✅ MEJORA: Emitir evento
      this.emit("notification_queued", fullNotification);

      logger.debug("Notification queued", {
        id: notificationId,
        type: fullNotification.type,
        priority: fullNotification.priority,
        queueSize: this.notificationQueue.length,
      });

      return notificationId;
    } catch (error) {
      logger.error("Error sending notification:", {
        error: error.message,
        notification,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Procesar cola de notificaciones
   */
  async processQueue() {
    if (this.isProcessingQueue || this.notificationQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      while (this.notificationQueue.length > 0) {
        // ✅ MEJORA: Tomar un lote para procesamiento
        const batch = this.notificationQueue.splice(
          0,
          this.processingBatchSize,
        );

        // ✅ MEJORA: Procesar en paralelo
        const processingPromises = batch.map((notification) =>
          this.processSingleNotification(notification),
        );

        await Promise.allSettled(processingPromises);

        // ✅ MEJORA: Pequeña pausa entre lotes
        if (this.notificationQueue.length > 0) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      logger.error("Error processing notification queue:", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  /**
   * ✅ MEJORA: Procesar una sola notificación
   * @param {Object} notification - Notificación a procesar
   */
  async processSingleNotification(notification) {
    try {
      // ✅ MEJORA: Incrementar intentos de entrega
      notification.deliveryAttempts++;

      // ✅ MEJORA: Guardar en base de datos
      await this.saveNotification(notification);

      // ✅ MEJORA: Enviar por email si es de alta prioridad
      if (
        notification.priority === "high" &&
        notification.recipients.length > 0
      ) {
        await this.sendEmailNotification(notification);
      }

      // ✅ MEJORA: Marcar como entregada
      notification.delivered = true;
      await this.markAsDelivered(notification.id);

      // ✅ MEJORA: Emitir evento de entrega
      this.emit("notification_delivered", notification);

      logger.debug("Notification processed successfully", {
        id: notification.id,
        type: notification.type,
        deliveryAttempts: notification.deliveryAttempts,
      });
    } catch (error) {
      logger.error("Error processing notification:", {
        id: notification.id,
        error: error.message,
        deliveryAttempts: notification.deliveryAttempts,
      });

      // ✅ MEJORA: Reintentar si no ha excedido los intentos
      if (notification.deliveryAttempts < this.retryAttempts) {
        this.notificationQueue.push(notification);
      } else {
        this.emit("notification_failed", {
          ...notification,
          error: error.message,
        });
      }
    }
  }

  /**
   * ✅ MEJORA: Guardar notificación en base de datos
   * @param {Object} notification - Notificación a guardar
   */
  async saveNotification(notification) {
    try {
      await this.db.query(
        `INSERT INTO notifications 
         (notification_id, type, title, message, data, priority, channels, 
          recipients, created_at, expires_at, delivered)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.id,
          notification.type,
          notification.title,
          notification.message,
          JSON.stringify(notification.data),
          notification.priority,
          JSON.stringify(notification.channels),
          JSON.stringify(notification.recipients),
          notification.timestamp,
          notification.expiresAt,
          notification.delivered ? 1 : 0,
        ],
      );
    } catch (error) {
      logger.error("Error saving notification to database:", {
        id: notification.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Marcar notificación como entregada
   * @param {string} notificationId - ID de la notificación
   */
  async markAsDelivered(notificationId) {
    try {
      await this.db.query(
        "UPDATE notifications SET delivered = 1 WHERE notification_id = ?",
        [notificationId],
      );
    } catch (error) {
      logger.error("Error marking notification as delivered:", {
        id: notificationId,
        error: error.message,
      });
    }
  }

  /**
   * ✅ MEJORA: Enviar notificación por email
   * @param {Object} notification - Notificación a enviar
   */
  async sendEmailNotification(notification) {
    try {
      // ✅ MEJORA: Obtener servicio de email
      const emailService = require("./emailService");

      // ✅ MEJORA: Obtener destinatarios de email
      const emailRecipients = await this.getEmailRecipients(
        notification.recipients,
      );

      if (emailRecipients.length === 0) {
        return;
      }

      // ✅ MEJORA: Enviar email
      await emailService.sendEmail({
        to: emailRecipients,
        subject: `${this.getPriorityIcon(notification.priority)} ${notification.title}`,
        html: this.generateNotificationEmail(notification),
        priority: notification.priority,
      });

      logger.debug("Email notification sent", {
        id: notification.id,
        recipients: emailRecipients.length,
      });
    } catch (error) {
      logger.error("Error sending email notification:", {
        id: notification.id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Métodos de utilidad optimizados
   */

  generateNotificationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `notif_${timestamp}_${random}`;
  }

  validatePriority(priority) {
    const validPriorities = ["low", "medium", "high"];
    return validPriorities.includes(priority) ? priority : "medium";
  }

  validateChannels(channels) {
    if (!channels) return ["global"];

    if (typeof channels === "string") {
      return [channels];
    }

    if (Array.isArray(channels)) {
      return channels.slice(0, 10); // Limitar a 10 canales
    }

    return ["global"];
  }

  validateRecipients(recipients) {
    if (!recipients) return [];

    if (typeof recipients === "string") {
      return [recipients];
    }

    if (Array.isArray(recipients)) {
      return recipients.slice(0, 100); // Limitar a 100 destinatarios
    }

    return [];
  }

  getDefaultExpiration() {
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + 30); // 30 días por defecto
    return expiration.toISOString();
  }

  getPriorityIcon(priority) {
    const icons = {
      high: "🔴",
      medium: "🟡",
      low: "🟢",
    };
    return icons[priority] || "🔵";
  }

  async getEmailRecipients(userIds) {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    try {
      // ✅ MEJORA: Consultar usuarios activos con email
      const placeholders = userIds.map(() => "?").join(",");
      const sql = `
        SELECT email 
        FROM users 
        WHERE id IN (${placeholders}) 
          AND status = 'active' 
          AND email IS NOT NULL 
          AND email_notifications = 1
      `;

      const results = await this.db.query(sql, userIds);
      return results.map((row) => row.email).filter((email) => email);
    } catch (error) {
      logger.error("Error getting email recipients:", error);
      return [];
    }
  }

  generateNotificationEmail(notification) {
    const priorityColor = this.getPriorityColor(notification.priority);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${notification.title}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          }
          .header {
            background-color: ${priorityColor};
            color: white;
            padding: 25px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
          }
          .content {
            padding: 30px;
          }
          .message {
            font-size: 16px;
            margin-bottom: 25px;
            color: #444;
          }
          .details {
            background-color: #f9f9f9;
            border-left: 4px solid ${priorityColor};
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
          }
          .details h3 {
            margin-top: 0;
            color: ${priorityColor};
          }
          .metadata {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
          }
          .metadata-item {
            background-color: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e9ecef;
          }
          .metadata-label {
            font-weight: 600;
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .metadata-value {
            font-size: 14px;
            color: #212529;
            font-weight: 500;
          }
          .footer {
            padding: 20px 30px;
            background-color: #f8f9fa;
            border-top: 1px solid #dee2e6;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
          }
          .footer p {
            margin: 5px 0;
          }
          .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            background-color: ${priorityColor};
            color: white;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .timestamp {
            font-size: 12px;
            color: #6c757d;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${notification.title}</h1>
          </div>
          <div class="content">
            <div class="message">
              ${notification.message}
            </div>
            
            <div class="metadata">
              <div class="metadata-item">
                <div class="metadata-label">Tipo</div>
                <div class="metadata-value">${this.getNotificationTypeText(notification.type)}</div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">Prioridad</div>
                <div class="metadata-value">
                  <span class="priority-badge">${notification.priority.toUpperCase()}</span>
                </div>
              </div>
              <div class="metadata-item">
                <div class="metadata-label">ID</div>
                <div class="metadata-value">${notification.id}</div>
              </div>
            </div>
            
            ${
              notification.data && Object.keys(notification.data).length > 0
                ? `
            <div class="details">
              <h3>Detalles Adicionales</h3>
              <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; font-size: 14px;">${JSON.stringify(notification.data, null, 2)}</pre>
            </div>
            `
                : ""
            }
            
            <div class="timestamp">
              Enviado: ${new Date(notification.timestamp).toLocaleString()}
            </div>
          </div>
          <div class="footer">
            <p>Este es un mensaje automático del ${config.app.name || "Sistema de Inventario QR"}.</p>
            <p>Para gestionar sus notificaciones, acceda al sistema en ${config.app.url || "la aplicación"}.</p>
            <p>© ${new Date().getFullYear()} - Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  getPriorityColor(priority) {
    const colors = {
      high: "#dc3545",
      medium: "#ffc107",
      low: "#28a745",
    };
    return colors[priority] || "#007bff";
  }

  getNotificationTypeText(type) {
    const types = {
      info: "Información",
      warning: "Advertencia",
      error: "Error",
      success: "Éxito",
      low_stock: "Stock Bajo",
      inventory_movement: "Movimiento de Inventario",
      audit_completed: "Auditoría Completada",
      report_ready: "Reporte Listo",
    };
    return types[type] || type;
  }

  /**
   * ✅ MEJORA: Métodos para tipos específicos de notificaciones
   */

  sendLowStockNotification(products, threshold) {
    return this.sendNotification({
      type: "low_stock",
      title: `⚠️ Alerta: ${products.length} Producto(s) con Stock Bajo`,
      message: `Se detectaron ${products.length} productos con stock por debajo de ${threshold} unidades.`,
      data: {
        products: products.slice(0, 10), // Limitar a 10 productos en detalles
        threshold,
        totalProducts: products.length,
      },
      priority: "high",
      channels: ["inventory", "alerts"],
      recipients: [], // Se enviará a todos los administradores
    });
  }

  sendInventoryMovementNotification(movement, product) {
    return this.sendNotification({
      type: "inventory_movement",
      title: `📦 Movimiento de Inventario: ${product?.name || "Producto"}`,
      message: `Se registró un movimiento de ${movement.quantity} unidades (${this.getMovementTypeText(movement.movement_type)})`,
      data: { movement, product },
      priority: "medium",
      channels: ["inventory"],
    });
  }

  sendAuditCompletionNotification(auditId, results) {
    return this.sendNotification({
      type: "audit_completed",
      title: "✅ Auditoría de Inventario Completada",
      message: `La auditoría #${auditId} se completó con ${results.discrepancies || 0} discrepancias detectadas.`,
      data: { auditId, results },
      priority: "medium",
      channels: ["inventory", "audit"],
    });
  }

  sendReportReadyNotification(reportId, reportType) {
    return this.sendNotification({
      type: "report_ready",
      title: `📊 Reporte ${this.getReportTypeText(reportType)} Listo`,
      message: `El reporte ${this.getReportTypeText(reportType)} #${reportId} está disponible para descarga.`,
      data: { reportId, reportType },
      priority: "low",
      channels: ["reports"],
    });
  }

  getMovementTypeText(type) {
    const types = {
      IN: "Entrada",
      OUT: "Salida",
      ADJUSTMENT: "Ajuste",
      RETURN: "Devolución",
      DAMAGE: "Daño",
      TRANSFER: "Transferencia",
    };
    return types[type] || type;
  }

  getReportTypeText(type) {
    const types = {
      inventory: "de Inventario",
      sales: "de Ventas",
      movements: "de Movimientos",
      financial: "Financiero",
      products: "de Productos",
    };
    return types[type] || type;
  }

  /**
   * ✅ MEJORA: Métodos para gestión de notificaciones
   */

  async getUserNotifications(userId, options = {}) {
    try {
      let sql = `
        SELECT * FROM notifications 
        WHERE (JSON_CONTAINS(recipients, ?) OR JSON_LENGTH(recipients) = 0)
          AND expires_at > NOW()
      `;

      const params = [JSON.stringify(userId)];
      const conditions = [];

      if (options.unreadOnly) {
        conditions.push("read = 0");
      }

      if (options.type) {
        conditions.push("type = ?");
        params.push(options.type);
      }

      if (options.startDate) {
        conditions.push("created_at >= ?");
        params.push(options.startDate);
      }

      if (options.endDate) {
        conditions.push("created_at <= ?");
        params.push(options.endDate);
      }

      if (conditions.length > 0) {
        sql += " AND " + conditions.join(" AND ");
      }

      sql += " ORDER BY created_at DESC LIMIT ?";
      params.push(options.limit || 50);

      const notifications = await this.db.query(sql, params);

      // ✅ MEJORA: Parsear datos JSON
      return notifications.map((notif) => ({
        ...notif,
        data: notif.data ? JSON.parse(notif.data) : null,
        channels: notif.channels ? JSON.parse(notif.channels) : [],
        recipients: notif.recipients ? JSON.parse(notif.recipients) : [],
      }));
    } catch (error) {
      logger.error("Error getting user notifications:", error);
      return [];
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      await this.db.query(
        `UPDATE notifications SET read = 1 
         WHERE notification_id = ? AND JSON_CONTAINS(recipients, ?)`,
        [notificationId, JSON.stringify(userId)],
      );

      return true;
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      return false;
    }
  }

  async markAllAsRead(userId) {
    try {
      await this.db.query(
        `UPDATE notifications SET read = 1 
         WHERE JSON_CONTAINS(recipients, ?) AND read = 0`,
        [JSON.stringify(userId)],
      );

      return true;
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      return false;
    }
  }

  async getNotificationStats(period = "month") {
    try {
      const sql = `
        SELECT 
          type,
          priority,
          COUNT(*) as total,
          SUM(read) as read_count,
          SUM(delivered) as delivered_count,
          DATE(created_at) as date
        FROM notifications
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 ${period.toUpperCase()})
        GROUP BY type, priority, DATE(created_at)
        ORDER BY date DESC
      `;

      const stats = await this.db.query(sql);
      return this.processStats(stats, period);
    } catch (error) {
      logger.error("Error getting notification stats:", error);
      return {};
    }
  }

  processStats(stats, period) {
    const processed = {
      total: 0,
      read: 0,
      delivered: 0,
      byType: {},
      byPriority: {},
      readRate: 0,
      deliveryRate: 0,
      timeline: [],
    };

    stats.forEach((stat) => {
      processed.total += stat.total;
      processed.read += stat.read_count;
      processed.delivered += stat.delivered_count;

      // Por tipo
      if (!processed.byType[stat.type]) {
        processed.byType[stat.type] = 0;
      }
      processed.byType[stat.type] += stat.total;

      // Por prioridad
      if (!processed.byPriority[stat.priority]) {
        processed.byPriority[stat.priority] = 0;
      }
      processed.byPriority[stat.priority] += stat.total;

      // Timeline
      processed.timeline.push({
        date: stat.date,
        type: stat.type,
        priority: stat.priority,
        total: stat.total,
        read: stat.read_count,
        delivered: stat.delivered_count,
      });
    });

    // Calcular tasas
    processed.readRate =
      processed.total > 0 ? (processed.read / processed.total) * 100 : 0;

    processed.deliveryRate =
      processed.total > 0 ? (processed.delivered / processed.total) * 100 : 0;

    return processed;
  }

  async cleanupOldNotifications(maxAgeDays = 90) {
    try {
      const result = await this.db.query(
        `DELETE FROM notifications 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
        [maxAgeDays],
      );

      logger.info(`Cleaned up ${result.affectedRows} old notifications`);
      return result.affectedRows;
    } catch (error) {
      logger.error("Error cleaning up old notifications:", error);
      return 0;
    }
  }

  /**
   * ✅ MEJORA: Métodos para gestión de cola
   */

  getQueueStats() {
    return {
      queueSize: this.notificationQueue.length,
      isProcessing: this.isProcessingQueue,
      maxQueueSize: this.maxQueueSize,
    };
  }

  clearQueue() {
    const clearedCount = this.notificationQueue.length;
    this.notificationQueue = [];
    logger.info(`Cleared ${clearedCount} notifications from queue`);
    return clearedCount;
  }

  /**
   * ✅ MEJORA: Método para enviar notificación inmediata (sin cola)
   * @param {Object} notification - Notificación a enviar
   */
  async sendImmediateNotification(notification) {
    try {
      const notificationId = this.generateNotificationId();
      const timestamp = new Date().toISOString();

      const fullNotification = {
        id: notificationId,
        type: notification.type || "info",
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        priority: this.validatePriority(notification.priority),
        channels: this.validateChannels(notification.channels),
        recipients: this.validateRecipients(notification.recipients),
        timestamp,
        expiresAt: notification.expiresAt || this.getDefaultExpiration(),
        read: false,
        delivered: false,
        deliveryAttempts: 0,
      };

      // ✅ MEJORA: Procesar inmediatamente
      await this.processSingleNotification(fullNotification);

      return notificationId;
    } catch (error) {
      logger.error("Error sending immediate notification:", error);
      throw error;
    }
  }
}

// ✅ MEJORA: Crear y exportar instancia inicializada
const notificationService = new NotificationService();

// Inicializar el servicio al cargar el módulo
notificationService.initialize().catch((error) => {
  logger.error("Failed to initialize notification service:", error);
});

module.exports = notificationService;
