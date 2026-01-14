const QRCode = require("../models/QRCode");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const AuditLog = require("../models/AuditLog");
const qrService = require("../services/qrService");
const cacheService = require("../services/cacheService");
const logger = require("../utils/logger");
const crypto = require("crypto");
const {
  NotFoundError,
  ValidationError,
  PermissionError,
  RateLimitError,
} = require("../utils/errors");
const config = require("../config/env");

/**
 * ✅ CONTROLADOR DE CÓDIGOS QR MEJORADO
 * Correcciones aplicadas:
 * 1. Validación robusta de códigos QR
 * 2. Sistema de seguridad mejorado
 * 3. Límites y rate limiting
 * 4. Caché inteligente
 * 5. Auditoría completa
 */

class QRController {
  /**
   * ✅ GENERAR CÓDIGO QR PARA PRODUCTO MEJORADO
   */
  static async generateForProduct(req, res) {
    const transaction = await require("../models/database").beginTransaction();

    try {
      const productId = parseInt(req.params.productId, 10);
      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VALIDACIONES INICIALES
      if (!productId || productId <= 0) {
        throw new ValidationError(
          "ID de producto inválido",
          "INVALID_PRODUCT_ID",
        );
      }

      // ✅ VERIFICAR PERMISOS
      if (!["admin", "manager"].includes(userRole)) {
        throw new PermissionError(
          "Permisos insuficientes para generar códigos QR",
          "INSUFFICIENT_PERMISSIONS",
          { requiredRoles: ["admin", "manager"], userRole },
        );
      }

      // ✅ VERIFICAR PRODUCTO
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Producto no encontrado", "PRODUCT_NOT_FOUND");
      }

      // ✅ VERIFICAR LÍMITES DE CÓDIGOS QR
      const existingQRCodes = await QRCode.findByProduct(productId);
      const maxQRCodesPerProduct = process.env.MAX_QR_CODES_PER_PRODUCT || 10;

      if (existingQRCodes.length >= maxQRCodesPerProduct) {
        throw new ValidationError(
          `Límite de ${maxQRCodesPerProduct} códigos QR por producto alcanzado`,
          "QR_LIMIT_REACHED",
          {
            current_count: existingQRCodes.length,
            max_allowed: maxQRCodesPerProduct,
            suggestion: "Elimine códigos QR existentes antes de crear nuevos",
          },
        );
      }

      // ✅ VERIFICAR RATE LIMITING
      const userQRCodesToday = await QRCode.countUserQRCodesToday(userId);
      const maxDailyQRCodes = process.env.MAX_DAILY_QR_CODES || 50;

      if (userQRCodesToday >= maxDailyQRCodes) {
        throw new RateLimitError(
          `Límite diario de ${maxDailyQRCodes} códigos QR alcanzado`,
          "QR_RATE_LIMIT_EXCEEDED",
          { reset_time: QRController.getResetTime() },
        );
      }

      // ✅ GENERAR CÓDIGO ÚNICO SEGURO
      const code = await QRController.generateSecureQRCode();

      // ✅ CONSTRUIR DATOS SEGUROS DEL QR
      const qrData = QRController.buildQRData(product, code, userId);

      // ✅ CREAR REGISTRO EN BASE DE DATOS
      const qrId = await QRCode.create(
        {
          product_id: productId,
          code,
          qr_type: "product",
          data: JSON.stringify(qrData),
          created_by: userId,
          status: "active",
          metadata: {
            version: "2.0",
            security_level: "high",
            generation_method: "api",
          },
        },
        transaction,
      );

      // ✅ GENERAR IMAGEN QR CON OPCIONES MEJORADAS
      const qrOptions = {
        errorCorrectionLevel: "H", // High error correction
        margin: 2,
        scale: 10,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        logo: process.env.QR_LOGO_PATH
          ? {
              path: process.env.QR_LOGO_PATH,
              width: 40,
              height: 40,
            }
          : null,
      };

      const qrImageBuffer = await qrService.generateQRCode(
        JSON.stringify(qrData),
        qrOptions,
      );

      // ✅ GUARDAR IMAGEN QR
      const qrImagePath = await qrService.saveQRImage(qrImageBuffer, code, {
        quality: 90,
        format: "png",
        size: { width: 500, height: 500 },
      });

      // ✅ REGISTRAR AUDITORÍA
      await AuditLog.create(
        {
          action: "qr_generated",
          user_id: userId,
          details: {
            qr_id: qrId,
            product_id: productId,
            product_name: product.name,
            qr_code: code,
            qr_type: "product",
            security_hash: qrData.security_hash,
          },
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          severity: "info",
        },
        transaction,
      );

      await transaction.commit();

      // ✅ CACHEAR CÓDIGO QR
      await QRController.cacheQRCode(code, {
        qr_id: qrId,
        product_id: productId,
      });

      logger.info("Código QR generado exitosamente", {
        qrId,
        productId,
        code,
        generatedBy: userId,
        securityHash: qrData.security_hash,
      });

      // ✅ CONSTRUIR RESPUESTA
      const response = {
        success: true,
        message: "Código QR generado exitosamente",
        data: QRController.buildQRResponse(
          req,
          qrId,
          productId,
          code,
          qrData,
          qrImagePath,
        ),
      };

      res.status(201).json(response);
    } catch (error) {
      await transaction.rollback();

      logger.error("Error generando código QR:", {
        error: error.message,
        productId: req.params.productId,
        userId: req.userId,
        userRole: req.userRole,
      });

      QRController.handleErrorResponse(error, res, "QR_GENERATION_ERROR");
    }
  }

  /**
   * ✅ ESCANEAR CÓDIGO QR MEJORADO
   */
  static async scan(req, res) {
    const transaction = await require("../models/database").beginTransaction();

    try {
      const { code, location, device_info, scan_type = "standard" } = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VALIDACIONES INICIALES
      if (!code) {
        throw new ValidationError("Código QR requerido", "QR_CODE_REQUIRED");
      }

      if (code.length < 8 || code.length > 100) {
        throw new ValidationError(
          "Formato de código QR inválido",
          "INVALID_QR_FORMAT",
        );
      }

      // ✅ VERIFICAR RATE LIMITING DE ESCANEOS
      const userScansToday = await QRCode.countUserScansToday(userId);
      const maxDailyScans = process.env.MAX_DAILY_SCANS || 1000;

      if (userScansToday >= maxDailyScans) {
        throw new RateLimitError(
          `Límite diario de ${maxDailyScans} escaneos alcanzado`,
          "SCAN_RATE_LIMIT_EXCEEDED",
          { reset_time: QRController.getResetTime() },
        );
      }

      // ✅ OBTENER CÓDIGO QR (CON CACHÉ)
      const qrCode = await QRController.getQRCodeFromCacheOrDB(code);
      if (!qrCode) {
        throw new NotFoundError("Código QR no encontrado", "QR_NOT_FOUND");
      }

      // ✅ VALIDAR ESTADO DEL CÓDIGO QR
      QRController.validateQRCodeStatus(qrCode);

      // ✅ VALIDAR HASH DE SEGURIDAD
      if (!QRController.validateQRSecurity(qrCode)) {
        throw new ValidationError(
          "Código QR comprometido o inválido",
          "QR_SECURITY_ERROR",
        );
      }

      // ✅ OBTENER INFORMACIÓN DEL PRODUCTO
      const product = await Product.findById(qrCode.product_id);
      if (!product) {
        throw new NotFoundError(
          "Producto asociado no encontrado",
          "PRODUCT_NOT_FOUND",
        );
      }

      QRController.validateProductStatus(product);

      // ✅ OBTENER STOCK ACTUAL
      const currentStock = await Inventory.getCurrentStock(product.id);

      // ✅ REGISTRAR ESCANEO
      const scanData = {
        qr_id: qrCode.id,
        scanned_by: userId,
        scan_type,
        location: location || null,
        device_info: device_info || QRController.extractDeviceInfo(req),
        ip_address: req.ip,
        user_agent: req.headers["user-agent"],
        metadata: {
          user_role: userRole,
          scan_timestamp: new Date().toISOString(),
          scan_quality: "high",
        },
      };

      const scanId = await QRCode.logScan(scanData, transaction);

      // ✅ ACTUALIZAR ESTADÍSTICAS
      await QRCode.incrementScanCount(qrCode.id, transaction);
      await QRCode.updateLastScan(qrCode.id, new Date(), transaction);

      // ✅ REGISTRAR AUDITORÍA
      await AuditLog.create(
        {
          action: "qr_scanned",
          user_id: userId,
          details: {
            qr_id: qrCode.id,
            product_id: product.id,
            product_name: product.name,
            scan_id: scanId,
            location,
            device_info: scanData.device_info,
          },
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          severity: "info",
        },
        transaction,
      );

      await transaction.commit();

      // ✅ ACTUALIZAR CACHÉ
      await QRController.updateQRCodeCache(qrCode);

      logger.info("Código QR escaneado exitosamente", {
        qrId: qrCode.id,
        productId: product.id,
        scanId,
        scannedBy: userId,
        location,
      });

      // ✅ CONSTRUIR RESPUESTA
      const response = {
        success: true,
        message: "Código QR escaneado exitosamente",
        data: await QRController.buildScanResponse(
          req,
          qrCode,
          product,
          currentStock,
          scanId,
        ),
      };

      res.json(response);
    } catch (error) {
      await transaction.rollback();

      logger.error("Error escaneando código QR:", {
        error: error.message,
        code: req.body?.code,
        userId: req.userId,
        userRole: req.userRole,
      });

      QRController.handleErrorResponse(error, res, "QR_SCAN_ERROR");
    }
  }

  /**
   * ✅ OBTENER INFORMACIÓN DE CÓDIGO QR MEJORADO
   */
  static async getQRInfo(req, res) {
    try {
      const code = req.params.code;
      const userRole = req.userRole;

      // ✅ VALIDAR CÓDIGO
      if (!code || code.length < 8) {
        throw new ValidationError("Código QR inválido", "INVALID_QR_CODE");
      }

      // ✅ OBTENER CÓDIGO QR
      const qrCode = await QRCode.findByCode(code);
      if (!qrCode) {
        throw new NotFoundError("Código QR no encontrado", "QR_NOT_FOUND");
      }

      // ✅ VERIFICAR PERMISOS
      if (
        !["admin", "manager"].includes(userRole) &&
        qrCode.created_by !== req.userId
      ) {
        throw new PermissionError(
          "Permisos insuficientes para ver esta información",
          "INSUFFICIENT_PERMISSIONS",
        );
      }

      // ✅ OBTENER INFORMACIÓN RELACIONADA
      const [product, stats, recentScans] = await Promise.all([
        Product.findById(qrCode.product_id),
        QRCode.getQRStats(qrCode.id),
        QRCode.getRecentScans(qrCode.id, 10),
      ]);

      if (!product) {
        throw new NotFoundError(
          "Producto asociado no encontrado",
          "PRODUCT_NOT_FOUND",
        );
      }

      // ✅ CONSTRUIR RESPUESTA
      const response = {
        success: true,
        data: {
          qr_code: QRController.enrichQRCodeData(qrCode),
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            category_id: product.category_id,
            price: product.price,
            status: product.status,
          },
          stats: {
            total_scans: stats.total_scans || 0,
            last_scan: stats.last_scan,
            unique_scanners: stats.unique_scanners || 0,
            scan_frequency: stats.scan_frequency || "N/A",
          },
          recent_activity: {
            scans: recentScans.slice(0, 5),
            last_24_hours: await QRCode.countScansLast24Hours(qrCode.id),
          },
          security: {
            is_valid: QRController.validateQRSecurity(qrCode),
            last_validation: new Date().toISOString(),
            recommendations: QRController.generateSecurityRecommendations(
              qrCode,
              stats,
            ),
          },
        },
        links: QRController.generateQRInfoLinks(req, qrCode, userRole),
      };

      res.json(response);
    } catch (error) {
      logger.error("Error obteniendo información de QR:", {
        error: error.message,
        code: req.params.code,
        userId: req.userId,
      });

      QRController.handleErrorResponse(error, res, "QR_INFO_ERROR");
    }
  }

  /**
   * ✅ DESCARGAR IMAGEN QR MEJORADO
   */
  static async downloadQR(req, res) {
    try {
      const code = req.params.code;
      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VALIDACIONES
      if (!code) {
        throw new ValidationError("Código QR requerido", "QR_CODE_REQUIRED");
      }

      // ✅ OBTENER CÓDIGO QR
      const qrCode = await QRCode.findByCode(code);
      if (!qrCode) {
        throw new NotFoundError("Código QR no encontrado", "QR_NOT_FOUND");
      }

      // ✅ VERIFICAR PERMISOS DE DESCARGA
      await QRController.validateDownloadPermissions(qrCode, userId, userRole);

      // ✅ OBTENER IMAGEN QR (CON CACHÉ)
      let qrImageBuffer = await QRController.getQRImageFromCache(code);

      if (!qrImageBuffer) {
        // Generar imagen QR
        const qrData =
          typeof qrCode.data === "string"
            ? JSON.parse(qrCode.data)
            : qrCode.data;
        qrImageBuffer = await qrService.generateQRCode(JSON.stringify(qrData), {
          errorCorrectionLevel: "H",
          margin: 2,
          scale: 12, // Alta resolución para impresión
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        // Cachear imagen
        await QRController.cacheQRImage(code, qrImageBuffer);
      }

      // ✅ REGISTRAR DESCARGA
      await QRCode.logDownload(qrCode.id, userId, req.ip);

      // ✅ CONFIGURAR HEADERS DE RESPUESTA
      res.set({
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="qr-${code}-${Date.now()}.png"`,
        "Content-Length": qrImageBuffer.length,
        "Cache-Control": "public, max-age=86400",
        ETag: crypto.createHash("md5").update(qrImageBuffer).digest("hex"),
        "X-QR-Info": JSON.stringify({
          qr_id: qrCode.id,
          product_id: qrCode.product_id,
          generated_at: qrCode.created_at,
        }),
      });

      res.send(qrImageBuffer);
    } catch (error) {
      logger.error("Error descargando código QR:", {
        error: error.message,
        code: req.params.code,
        userId: req.userId,
      });

      QRController.handleErrorResponse(error, res, "QR_DOWNLOAD_ERROR");
    }
  }

  /**
   * ✅ MÉTODOS AUXILIARES
   */

  static async generateSecureQRCode() {
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString("hex").toUpperCase();
    const checksum = crypto
      .createHash("sha256")
      .update(`${timestamp}-${random}`)
      .digest("hex")
      .substring(0, 4)
      .toUpperCase();

    return `QR${timestamp}${random}${checksum}`;
  }

  static buildQRData(product, code, userId) {
    const timestamp = new Date().toISOString();

    return {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      category_id: product.category_id,
      generated_at: timestamp,
      generated_by: userId,
      version: "2.0",
      security_hash: crypto
        .createHash("sha256")
        .update(
          `${product.id}-${code}-${timestamp}-${process.env.QR_SECURITY_SALT || "secure_salt"}`,
        )
        .digest("hex")
        .substring(0, 16),
      metadata: {
        system: "Inventory QR System",
        api_version: "2.0",
        encoding: "UTF-8",
      },
    };
  }

  static buildQRResponse(req, qrId, productId, code, qrData, qrImagePath) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return {
      qr_id: qrId,
      product_id: productId,
      code,
      qr_type: "product",
      qr_image_url: qrImagePath,
      download_url: `${baseUrl}/api/qr/download/${code}`,
      secure_download_url: `${baseUrl}/api/qr/secure-download/${code}?token=${QRController.generateDownloadToken(code)}`,
      scan_url: `${baseUrl}/api/qr/scan`,
      qr_data: qrData,
      metadata: {
        generated_at: new Date().toISOString(),
        expires_at: new Date(
          Date.now() + 365 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        max_scans: process.env.MAX_QR_SCANS || 1000,
        security_level: "high",
      },
      actions: [
        {
          action: "download",
          url: `${baseUrl}/api/qr/download/${code}`,
          method: "GET",
          description: "Descargar imagen QR",
        },
        {
          action: "scan",
          url: `${baseUrl}/api/qr/scan`,
          method: "POST",
          description: "Escanear código QR",
          body: { code },
        },
        {
          action: "info",
          url: `${baseUrl}/api/qr/${code}/info`,
          method: "GET",
          description: "Ver información del código QR",
        },
      ],
    };
  }

  static generateDownloadToken(code) {
    const timestamp = Date.now();
    const secret = process.env.QR_TOKEN_SECRET || "qr_secret";

    return crypto
      .createHash("sha256")
      .update(`${code}-${timestamp}-${secret}`)
      .digest("hex")
      .substring(0, 16);
  }

  static async getQRCodeFromCacheOrDB(code) {
    if (!config.cache.enabled) {
      return await QRCode.findByCode(code);
    }

    const cacheKey = `qr:${code}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return cached;
    }

    const qrCode = await QRCode.findByCode(code);
    if (qrCode) {
      await cacheService.set(cacheKey, qrCode, 300); // 5 minutos
    }

    return qrCode;
  }

  static validateQRCodeStatus(qrCode) {
    if (qrCode.status !== "active") {
      throw new ValidationError(
        `Código QR no está activo. Estado actual: ${qrCode.status}`,
        "QR_INACTIVE",
        { status: qrCode.status },
      );
    }

    // Verificar límite de escaneos
    const maxScans = process.env.MAX_QR_SCANS || 1000;
    if (qrCode.scan_count >= maxScans) {
      throw new ValidationError(
        "Límite de escaneos alcanzado para este código QR",
        "QR_SCAN_LIMIT_REACHED",
      );
    }

    // Verificar expiración
    if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
      throw new ValidationError("Código QR expirado", "QR_EXPIRED");
    }
  }

  static validateQRSecurity(qrCode) {
    try {
      const qrData =
        typeof qrCode.data === "string" ? JSON.parse(qrCode.data) : qrCode.data;

      if (!qrData.security_hash) {
        return false;
      }

      const expectedHash = crypto
        .createHash("sha256")
        .update(
          `${qrData.product_id}-${qrCode.code}-${qrData.generated_at}-${process.env.QR_SECURITY_SALT || "secure_salt"}`,
        )
        .digest("hex")
        .substring(0, 16);

      return qrData.security_hash === expectedHash;
    } catch (error) {
      logger.warn("Error validando seguridad del QR:", {
        error: error.message,
        qrCodeId: qrCode.id,
      });
      return false;
    }
  }

  static validateProductStatus(product) {
    if (product.status !== "active") {
      throw new ValidationError(
        `Producto no disponible. Estado actual: ${product.status}`,
        "PRODUCT_INACTIVE",
        { status: product.status },
      );
    }

    if (!product.is_active) {
      throw new ValidationError(
        "Producto marcado como inactivo",
        "PRODUCT_DISABLED",
      );
    }
  }

  static extractDeviceInfo(req) {
    return {
      user_agent: req.headers["user-agent"],
      accept_language: req.headers["accept-language"],
      platform: req.headers["sec-ch-ua-platform"] || "unknown",
      mobile: /mobile/i.test(req.headers["user-agent"]),
      browser: QRController.detectBrowser(req.headers["user-agent"]),
      os: QRController.detectOS(req.headers["user-agent"]),
    };
  }

  static detectBrowser(userAgent) {
    if (/chrome/i.test(userAgent)) return "Chrome";
    if (/firefox/i.test(userAgent)) return "Firefox";
    if (/safari/i.test(userAgent)) return "Safari";
    if (/edge/i.test(userAgent)) return "Edge";
    return "Unknown";
  }

  static detectOS(userAgent) {
    if (/windows/i.test(userAgent)) return "Windows";
    if (/macintosh|mac os/i.test(userAgent)) return "macOS";
    if (/linux/i.test(userAgent)) return "Linux";
    if (/android/i.test(userAgent)) return "Android";
    if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
    return "Unknown";
  }

  static async updateQRCodeCache(qrCode) {
    if (!config.cache.enabled) return;

    const cacheKey = `qr:${qrCode.code}`;
    await cacheService.set(cacheKey, qrCode, 300);
  }

  static async buildScanResponse(req, qrCode, product, currentStock, scanId) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const response = {
      scan_id: scanId,
      qr_code: {
        id: qrCode.id,
        code: qrCode.code,
        status: qrCode.status,
        created_at: qrCode.created_at,
        scan_count: (qrCode.scan_count || 0) + 1,
      },
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        price: product.price,
        category_id: product.category_id,
        image_url: product.image_url,
        status: product.status,
      },
      inventory: {
        current_stock: currentStock,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        unit: product.unit,
        reorder_point: product.min_stock,
        reorder_quantity: Math.max(product.max_stock - currentStock, 0),
        stock_status: QRController.getStockStatus(
          currentStock,
          product.min_stock,
        ),
      },
      actions: [
        {
          action: "view_product",
          url: `${baseUrl}/api/products/${product.id}`,
          method: "GET",
          description: "Ver detalles del producto",
        },
        {
          action: "check_inventory",
          url: `${baseUrl}/api/inventory/products/${product.id}/stock`,
          method: "GET",
          description: "Ver historial de inventario",
        },
      ],
      metadata: {
        scan_timestamp: new Date().toISOString(),
        server_time: new Date().toISOString(),
        scan_validity: "valid",
      },
    };

    // Agregar alertas si es necesario
    const alerts = QRController.generateScanAlerts(currentStock, product);
    if (alerts.length > 0) {
      response.alerts = alerts;
    }

    return response;
  }

  static getStockStatus(currentStock, minStock) {
    if (currentStock === 0) return "out_of_stock";
    if (currentStock <= minStock) return "low_stock";
    return "in_stock";
  }

  static generateScanAlerts(currentStock, product) {
    const alerts = [];

    if (currentStock === 0) {
      alerts.push({
        type: "out_of_stock",
        message: `¡Alerta! ${product.name} está fuera de stock`,
        severity: "critical",
        suggested_action: "Reabastecer urgentemente",
      });
    } else if (currentStock <= product.min_stock) {
      alerts.push({
        type: "low_stock",
        message: `Stock bajo para ${product.name}. Stock actual: ${currentStock}`,
        severity: "warning",
        suggested_action: "Reabastecer pronto",
      });
    }

    return alerts;
  }

  static async cacheQRCode(code, data) {
    if (!config.cache.enabled) return;

    const cacheKey = `qr:${code}`;
    await cacheService.set(cacheKey, data, 3600); // 1 hora
  }

  static async getQRImageFromCache(code) {
    if (!config.cache.enabled) return null;

    const cacheKey = `qr_image:${code}`;
    const cached = await cacheService.get(cacheKey);

    if (cached) {
      return Buffer.from(cached, "base64");
    }

    return null;
  }

  static async cacheQRImage(code, imageBuffer) {
    if (!config.cache.enabled) return;

    const cacheKey = `qr_image:${code}`;
    await cacheService.set(cacheKey, imageBuffer.toString("base64"), 86400); // 24 horas
  }

  static async validateDownloadPermissions(qrCode, userId, userRole) {
    if (["admin", "manager"].includes(userRole)) {
      return true;
    }

    // Para usuarios regulares, verificar límites
    const downloadCount = await QRCode.getDownloadCount(qrCode.id);
    const maxDownloads = process.env.MAX_QR_DOWNLOADS || 50;

    if (downloadCount >= maxDownloads) {
      throw new RateLimitError(
        `Límite de descargas alcanzado para este código QR`,
        "QR_DOWNLOAD_LIMIT_REACHED",
        { max_downloads: maxDownloads, current_downloads: downloadCount },
      );
    }

    // Verificar si el usuario es el creador
    if (qrCode.created_by !== userId) {
      throw new PermissionError(
        "No tienes permisos para descargar este código QR",
        "DOWNLOAD_PERMISSION_DENIED",
      );
    }

    return true;
  }

  static enrichQRCodeData(qrCode) {
    const enriched = { ...qrCode };

    try {
      enriched.data =
        typeof qrCode.data === "string" ? JSON.parse(qrCode.data) : qrCode.data;
    } catch (error) {
      enriched.data = { error: "Failed to parse QR data" };
    }

    enriched.security = {
      is_valid: QRController.validateQRSecurity(qrCode),
      last_validated: new Date().toISOString(),
    };

    return enriched;
  }

  static generateSecurityRecommendations(qrCode, stats) {
    const recommendations = [];

    if (stats.total_scans > 1000) {
      recommendations.push({
        type: "high_usage",
        message: "Código QR con alto uso, considerar renovación",
        priority: "medium",
      });
    }

    if (!QRController.validateQRSecurity(qrCode)) {
      recommendations.push({
        type: "security_risk",
        message: "Código QR con posible compromiso de seguridad",
        priority: "high",
        action: "Regenerar código QR",
      });
    }

    return recommendations;
  }

  static generateQRInfoLinks(req, qrCode, userRole) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const links = [
      {
        rel: "self",
        href: `${baseUrl}/api/qr/${qrCode.code}/info`,
        method: "GET",
      },
      {
        rel: "download",
        href: `${baseUrl}/api/qr/download/${qrCode.code}`,
        method: "GET",
      },
    ];

    if (["admin", "manager"].includes(userRole)) {
      links.push(
        {
          rel: "scans",
          href: `${baseUrl}/api/qr/${qrCode.id}/scans`,
          method: "GET",
          description: "Ver historial de escaneos",
        },
        {
          rel: "update",
          href: `${baseUrl}/api/qr/${qrCode.id}`,
          method: "PUT",
          description: "Actualizar código QR",
        },
        {
          rel: "regenerate",
          href: `${baseUrl}/api/qr/regenerate/${qrCode.id}`,
          method: "POST",
          description: "Regenerar código QR",
        },
      );
    }

    return links;
  }

  static getResetTime() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  static handleErrorResponse(error, res, defaultErrorCode) {
    if (error instanceof PermissionError) {
      return res.status(403).json({
        success: false,
        message: error.message,
        error_code: error.code,
        details: error.details,
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error_code: error.code,
        details: error.details,
      });
    }

    if (error instanceof NotFoundError) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error_code: error.code,
      });
    }

    if (error instanceof RateLimitError) {
      return res.status(429).json({
        success: false,
        message: error.message,
        error_code: error.code,
        details: error.details,
        retry_after: error.details?.reset_time,
      });
    }

    logger.error("Error no manejado en QRController:", {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error_code: defaultErrorCode,
      reference_id: `ERR-${Date.now()}`,
      timestamp: new Date().toISOString(),
    });
  }
}

// ✅ EXPORTAR CONTROLADOR COMPLETO
module.exports = {
  // Métodos principales
  generateForProduct: QRController.generateForProduct.bind(QRController),
  scan: QRController.scan.bind(QRController),
  getQRInfo: QRController.getQRInfo.bind(QRController),
  downloadQR: QRController.downloadQR.bind(QRController),

  // Métodos auxiliares para testing
  _generateSecureQRCode: QRController.generateSecureQRCode,
  _buildQRData: QRController.buildQRData,
  _validateQRSecurity: QRController.validateQRSecurity,

  // Clase completa
  QRController,
};
