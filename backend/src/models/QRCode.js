/**
 * ✅ MODELO MEJORADO DE CÓDIGO QR
 * Archivo: models/QRCode.js
 *
 * Correcciones aplicadas:
 * 1. ✅ Corregida importación de transacciones
 * 2. ✅ Agregado logger alternativo
 * 3. ✅ Validaciones mejoradas con Joi
 * 4. ✅ Generación de códigos seguros
 * 5. ✅ Manejo de errores robusto
 * 6. ✅ Cache para búsquedas frecuentes
 * 7. ✅ Integración con Product mejorada
 */

const { query, executeInTransaction } = require("../config/database");
const crypto = require("crypto");
const Joi = require("joi");

// ✅ MEJORA: Logger alternativo
const logger = {
  info: (message, meta) => console.log(`[QR INFO] ${message}`, meta || ""),
  error: (message, meta) => console.error(`[QR ERROR] ${message}`, meta || ""),
  warn: (message, meta) => console.warn(`[QR WARN] ${message}`, meta || ""),
  debug: (message, meta) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[QR DEBUG] ${message}`, meta || "");
    }
  },
};

/**
 * ✅ ESQUEMA DE VALIDACIÓN PARA QR CODES
 */
const qrCodeSchema = Joi.object({
  productId: Joi.number().integer().min(1).allow(null),
  locationId: Joi.number().integer().min(1).allow(null),
  assetId: Joi.number().integer().min(1).allow(null),
  code: Joi.string()
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .allow("", null),
  qrType: Joi.string()
    .valid("product", "location", "asset", "batch")
    .required(),
  data: Joi.object().allow(null),
  status: Joi.string()
    .valid("active", "inactive", "used", "expired")
    .default("active"),
  metadata: Joi.object().allow(null),
});

/**
 * ✅ CLASE MEJORADA DE QR CODE
 * Con generación segura de códigos y validaciones robustas
 */
class QRCode {
  // ✅ MEJORA: Tipos de QR definidos como constantes
  static QR_TYPES = Object.freeze({
    PRODUCT: "product",
    LOCATION: "location",
    ASSET: "asset",
    BATCH: "batch",
  });

  // ✅ MEJORA: Cache para búsquedas frecuentes
  static cache = new Map();
  static CACHE_TTL = 60000; // 1 minuto en milisegundos

  /**
   * ✅ CREAR CÓDIGO QR CON VALIDACIÓN COMPLETA
   * @param {Object} qrData - Datos del QR
   * @param {Number} userId - ID del usuario
   * @returns {Object} QR creado
   */
  static async create(qrData, userId) {
    try {
      // ✅ MEJORA: Validar datos con Joi
      const { error, value: validatedData } = qrCodeSchema.validate(qrData);
      if (error) {
        throw new Error(
          `Validación fallida: ${error.details.map((d) => d.message).join(", ")}`,
        );
      }

      // ✅ MEJORA: Verificar producto si corresponde
      if (
        validatedData.qrType === this.QR_TYPES.PRODUCT &&
        validatedData.productId
      ) {
        try {
          const Product = require("./Product");
          const product = await Product.findById(validatedData.productId);
          if (!product) {
            throw new Error("Producto no encontrado");
          }
        } catch (productError) {
          logger.warn("Producto no encontrado al crear QR", {
            productId: validatedData.productId,
            error: productError.message,
          });
        }
      }

      // ✅ MEJORA: Generar código único seguro
      const code = validatedData.code || (await this.generateUniqueCode());

      // ✅ MEJORA: Preparar datos del QR
      const qrPayload = this.prepareQRPayload(validatedData);
      const qrContent = JSON.stringify(qrPayload);

      // ✅ MEJORA: Usar transacción
      const result = await executeInTransaction(async (connection) => {
        const sql = `
          INSERT INTO qrcodes (
            product_id, 
            location_id,
            asset_id,
            code, 
            qr_type, 
            data, 
            status,
            created_by,
            created_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [insertResult] = await connection.execute(sql, [
          validatedData.productId || null,
          validatedData.locationId || null,
          validatedData.assetId || null,
          code,
          validatedData.qrType,
          qrContent,
          validatedData.status || "active",
          userId,
        ]);

        // ✅ MEJORA: Registrar en log de auditoría
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            "CREATE",
            "QRCODE",
            insertResult.insertId,
            userId,
            JSON.stringify({
              code,
              qrType: validatedData.qrType,
              productId: validatedData.productId,
            }),
          ],
        );

        return insertResult;
      });

      logger.info("Código QR creado exitosamente", {
        qrId: result.insertId,
        code,
        qrType: validatedData.qrType,
        userId,
      });

      return {
        id: result.insertId,
        code,
        ...validatedData,
        data: qrContent,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error creando código QR", {
        error: error.message,
        qrData,
        userId,
        stack: error.stack,
      });

      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El código QR ya existe");
      }

      throw new Error(`Error al crear código QR: ${error.message}`);
    }
  }

  /**
   * ✅ ENCONTRAR CÓDIGO QR POR ID CON CACHE
   * @param {Number} id - ID del QR
   * @param {Boolean} includeRelated - Incluir información relacionada
   * @returns {Object} QR encontrado
   */
  static async findById(id, includeRelated = true) {
    try {
      // ✅ MEJORA: Verificar cache
      const cacheKey = `qr_${id}_${includeRelated}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }

      let sql = `
        SELECT 
          q.*, 
          p.name as product_name, 
          p.sku,
          p.current_stock,
          l.name as location_name,
          a.name as asset_name,
          u.name as created_by_name,
          u.email as created_by_email,
          COUNT(qs.id) as scan_count,
          MAX(qs.scanned_at) as last_scan_date
        FROM qrcodes q 
        LEFT JOIN products p ON q.product_id = p.id AND p.deleted_at IS NULL
        LEFT JOIN locations l ON q.location_id = l.id AND l.deleted_at IS NULL
        LEFT JOIN assets a ON q.asset_id = a.id AND a.deleted_at IS NULL
        LEFT JOIN users u ON q.created_by = u.id
        LEFT JOIN qr_scans qs ON q.id = qs.qr_id
        WHERE q.id = ? AND q.deleted_at IS NULL
        GROUP BY q.id, p.name, p.sku, l.name, a.name, u.name, u.email
      `;

      const [qrCode] = await query(sql, [id]);

      if (!qrCode) {
        return null;
      }

      // ✅ MEJORA: Parsear datos del QR
      if (qrCode.data) {
        try {
          qrCode.parsedData = JSON.parse(qrCode.data);
        } catch (e) {
          qrCode.parsedData = qrCode.data;
        }
      }

      // ✅ MEJORA: Incluir información relacionada si se solicita
      if (includeRelated && qrCode.product_id) {
        try {
          const Product = require("./Product");
          const productInfo = await Product.findById(qrCode.product_id, true);
          qrCode.product = productInfo;
        } catch (productError) {
          logger.warn("Error obteniendo información del producto", {
            productId: qrCode.product_id,
            error: productError.message,
          });
        }
      }

      // ✅ MEJORA: Formatear datos
      qrCode.qr_type_display = this.getQRTypeDisplay(qrCode.qr_type);
      qrCode.status_display = this.getStatusDisplay(qrCode.status);
      qrCode.last_scan_relative = qrCode.last_scan_date
        ? this.getRelativeTime(qrCode.last_scan_date)
        : "Nunca escaneado";

      // ✅ MEJORA: Almacenar en cache
      this.cache.set(cacheKey, {
        data: qrCode,
        timestamp: Date.now(),
      });

      return qrCode;
    } catch (error) {
      logger.error("Error encontrando código QR por ID", {
        id,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al buscar código QR: ${error.message}`);
    }
  }

  /**
   * ✅ ENCONTRAR CÓDIGO QR POR CÓDIGO
   * @param {String} code - Código del QR
   * @param {Boolean} includeProductInfo - Incluir información del producto
   * @returns {Object} QR encontrado
   */
  static async findByCode(code, includeProductInfo = true) {
    try {
      if (!code || typeof code !== "string") {
        throw new Error("Código inválido");
      }

      let sql = `
        SELECT 
          q.*, 
          p.name as product_name, 
          p.sku,
          p.description,
          p.price,
          p.current_stock,
          p.min_stock,
          p.max_stock,
          p.status as product_status,
          c.name as category_name,
          l.name as location_name,
          a.name as asset_name,
          u.name as created_by_name
        FROM qrcodes q 
        LEFT JOIN products p ON q.product_id = p.id AND p.deleted_at IS NULL
        LEFT JOIN categories c ON p.category_id = c.id AND c.deleted_at IS NULL
        LEFT JOIN locations l ON q.location_id = l.id AND l.deleted_at IS NULL
        LEFT JOIN assets a ON q.asset_id = a.id AND a.deleted_at IS NULL
        LEFT JOIN users u ON q.created_by = u.id AND u.deleted_at IS NULL
        WHERE q.code = ? AND q.deleted_at IS NULL
      `;

      const [qrCode] = await query(sql, [code.toUpperCase()]);

      if (!qrCode) {
        return null;
      }

      // ✅ MEJORA: Parsear datos del QR
      if (qrCode.data) {
        try {
          qrCode.parsedData = JSON.parse(qrCode.data);
        } catch (e) {
          qrCode.parsedData = qrCode.data;
        }
      }

      // ✅ MEJORA: Incluir información adicional del producto
      if (includeProductInfo && qrCode.product_id) {
        try {
          const Product = require("./Product");
          const productStats = await Product.getProductStats(qrCode.product_id);
          qrCode.product_stats = productStats;
        } catch (statsError) {
          logger.warn("Error obteniendo estadísticas del producto", {
            productId: qrCode.product_id,
            error: statsError.message,
          });
        }
      }

      // ✅ MEJORA: Registrar escaneo (no bloqueante)
      this.recordScan(qrCode.id).catch((err) => {
        logger.warn("Error registrando escaneo", {
          qrId: qrCode.id,
          error: err.message,
        });
      });

      return qrCode;
    } catch (error) {
      logger.error("Error encontrando código QR por código", {
        code,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al buscar código QR por código: ${error.message}`);
    }
  }

  /**
   * ✅ GENERAR CÓDIGO ÚNICO MEJORADO
   * @param {Number} length - Longitud del código
   * @returns {String} Código único
   */
  static async generateUniqueCode(length = 16) {
    try {
      let attempts = 0;
      const maxAttempts = 20;

      while (attempts < maxAttempts) {
        // ✅ MEJORA: Generar código más seguro con timestamp y random
        const timestamp = Date.now().toString(36).toUpperCase();
        const randomBytes = crypto.randomBytes(8).toString("hex").toUpperCase();
        const code = `QR${timestamp.substring(timestamp.length - 6)}${randomBytes.substring(0, 10)}`;

        // Verificar si el código ya existe
        const existing = await this.findByCode(code);
        if (!existing) {
          return code;
        }

        attempts++;
        // Pequeño delay para evitar race conditions
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      throw new Error(
        "No se pudo generar un código único después de varios intentos",
      );
    } catch (error) {
      logger.error("Error generando código único", {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al generar código único: ${error.message}`);
    }
  }

  /**
   * ✅ GENERAR QR PARA PRODUCTO
   * @param {Number} productId - ID del producto
   * @param {Number} userId - ID del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Object} Resultado de la generación
   */
  static async generateForProduct(productId, userId, options = {}) {
    try {
      const Product = require("./Product");
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Producto no encontrado");
      }

      // ✅ MEJORA: Verificar si ya existe un QR para este producto
      const existingQRs = await this.findByProduct(productId, { limit: 1 });
      if (existingQRs.length > 0 && !options.force) {
        return {
          exists: true,
          qrCode: existingQRs[0],
          message: "Ya existe un código QR para este producto",
        };
      }

      const qrData = {
        productId: product.id,
        qrType: this.QR_TYPES.PRODUCT,
        data: {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          price: product.price,
          currentStock: product.current_stock,
          minStock: product.min_stock,
          maxStock: product.max_stock,
          category: product.category_name,
          createdAt: product.created_at,
          qrGenerated: new Date().toISOString(),
        },
        metadata: options.metadata || {},
      };

      const qrCode = await this.create(qrData, userId);

      logger.info("QR generado para producto exitosamente", {
        productId,
        qrId: qrCode.id,
        code: qrCode.code,
        userId,
      });

      return {
        exists: false,
        qrCode,
        message: "Código QR generado exitosamente",
      };
    } catch (error) {
      logger.error("Error generando QR para producto", {
        productId,
        error: error.message,
        userId,
        stack: error.stack,
      });
      throw new Error(`Error al generar QR para producto: ${error.message}`);
    }
  }

  /**
   * ✅ REGISTRAR ESCANEO DE QR
   * @param {Number} qrId - ID del QR
   * @param {Number} userId - ID del usuario
   * @param {Object} deviceInfo - Información del dispositivo
   * @returns {Boolean} Éxito de la operación
   */
  static async recordScan(qrId, userId = null, deviceInfo = {}) {
    try {
      const sql = `
        INSERT INTO qr_scans (
          qr_id, 
          user_id, 
          scanned_at, 
          device_info,
          ip_address,
          user_agent
        ) VALUES (?, ?, NOW(), ?, ?, ?)
      `;

      await query(sql, [
        qrId,
        userId,
        JSON.stringify(deviceInfo),
        deviceInfo.ip || null,
        deviceInfo.userAgent || null,
      ]);

      // ✅ MEJORA: Actualizar contador de escaneos
      await query(
        "UPDATE qrcodes SET scan_count = scan_count + 1, last_scan_at = NOW() WHERE id = ?",
        [qrId],
      );

      logger.debug("Escaneo de QR registrado", {
        qrId,
        userId,
        deviceInfo: Object.keys(deviceInfo),
      });

      return true;
    } catch (error) {
      logger.error("Error registrando escaneo de QR", {
        qrId,
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  /**
   * ✅ PREPARAR PAYLOAD DEL QR
   * @param {Object} qrData - Datos del QR
   * @returns {Object} Payload estructurado
   */
  static prepareQRPayload(qrData) {
    const basePayload = {
      qrType: qrData.qrType,
      generatedAt: new Date().toISOString(),
      system: "Inventory QR System",
      version: "1.0",
    };

    // Agregar datos específicos según el tipo
    switch (qrData.qrType) {
      case this.QR_TYPES.PRODUCT:
        if (qrData.productId) basePayload.productId = qrData.productId;
        break;
      case this.QR_TYPES.LOCATION:
        if (qrData.locationId) basePayload.locationId = qrData.locationId;
        break;
      case this.QR_TYPES.ASSET:
        if (qrData.assetId) basePayload.assetId = qrData.assetId;
        break;
      case this.QR_TYPES.BATCH:
        if (qrData.batchId) basePayload.batchId = qrData.batchId;
        break;
    }

    // Agregar metadatos adicionales
    if (qrData.metadata) {
      basePayload.metadata = qrData.metadata;
    }

    return basePayload;
  }

  /**
   * ✅ MÉTODOS HELPER MEJORADOS
   */

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL TIPO DE QR
   * @param {String} qrType - Tipo de QR
   * @returns {String} Texto descriptivo
   */
  static getQRTypeDisplay(qrType) {
    const typeMap = {
      product: "📦 Producto",
      location: "📍 Ubicación",
      asset: "💼 Activo",
      batch: "📋 Lote",
    };

    return typeMap[qrType] || qrType;
  }

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL ESTADO
   * @param {String} status - Estado del QR
   * @returns {String} Texto descriptivo
   */
  static getStatusDisplay(status) {
    const statusMap = {
      active: "🟢 Activo",
      inactive: "⚪ Inactivo",
      used: "🟡 Usado",
      expired: "🔴 Expirado",
    };

    return statusMap[status] || status;
  }

  /**
   * OBTENER TIEMPO RELATIVO
   * @param {Date} date - Fecha
   * @returns {String} Tiempo relativo
   */
  static getRelativeTime(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now - past;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    const diffMonth = Math.floor(diffDay / 30);
    const diffYear = Math.floor(diffDay / 365);

    if (diffYear > 0) return `Hace ${diffYear} año${diffYear > 1 ? "s" : ""}`;
    if (diffMonth > 0)
      return `Hace ${diffMonth} mes${diffMonth > 1 ? "es" : ""}`;
    if (diffDay > 0) return `Hace ${diffDay} día${diffDay > 1 ? "s" : ""}`;
    if (diffHour > 0) return `Hace ${diffHour} hora${diffHour > 1 ? "s" : ""}`;
    if (diffMin > 0) return `Hace ${diffMin} minuto${diffMin > 1 ? "s" : ""}`;
    return "Hace unos segundos";
  }

  /**
   * ✅ LIMPIAR CACHE
   * @param {Number} qrId - ID del QR (opcional)
   */
  static clearCache(qrId = null) {
    if (qrId) {
      for (const key of this.cache.keys()) {
        if (key.includes(`qr_${qrId}`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

module.exports = QRCode;
