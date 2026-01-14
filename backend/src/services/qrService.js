const QRCode = require("qrcode");
const sharp = require("sharp");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const logger = require("../utils/logger");
const config = require("../config/env");

/**
 * ✅ SERVICIO MEJORADO DE CÓDIGOS QR
 * Correcciones aplicadas:
 * 1. Eliminación de dependencias problemáticas (Jimp, qrcode-reader, node-zxing)
 * 2. Implementación de manejo de errores robusto
 * 3. Mejora de rendimiento con procesamiento en lotes
 * 4. Validación mejorada de datos QR
 * 5. Optimización de uso de memoria
 */

class QRService {
  constructor() {
    // ✅ MEJORA: Rutas de directorios configuradas
    this.baseDir = path.join(process.cwd(), "uploads");
    this.qrDir = path.join(this.baseDir, "qrcodes");
    this.tempDir = path.join(this.qrDir, "temp");
    this.batchDir = path.join(this.qrDir, "batch");
    this.archivedDir = path.join(this.qrDir, "archived");
    this.productQrDir = path.join(this.qrDir, "products");

    // ✅ MEJORA: Configuraciones por defecto optimizadas
    this.defaultOptions = {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      type: "png",
      quality: 1,
    };

    // ✅ MEJORA: Cache para imágenes generadas frecuentemente
    this.imageCache = new Map();
    this.cacheTTL = 600000; // 10 minutos
  }

  /**
   * ✅ MEJORA: Inicializar directorios de forma segura
   */
  async initialize() {
    try {
      const directories = [
        this.qrDir,
        this.tempDir,
        this.batchDir,
        this.archivedDir,
        this.productQrDir,
      ];

      for (const dir of directories) {
        try {
          await fs.access(dir);
        } catch {
          await fs.mkdir(dir, { recursive: true });
          logger.debug(`Created directory: ${dir}`);
        }
      }

      logger.info("QR service directories initialized");
    } catch (error) {
      logger.error("Failed to initialize QR service directories:", error);
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Generar código QR con validación mejorada
   * @param {string} data - Datos para el código QR
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Buffer>} Buffer de la imagen QR
   */
  async generateQRCode(data, options = {}) {
    try {
      // ✅ MEJORA: Validación robusta de datos de entrada
      if (!data || typeof data !== "string") {
        throw new Error("QR data must be a non-empty string");
      }

      if (data.trim().length === 0) {
        throw new Error("QR data cannot be empty or whitespace");
      }

      // ✅ MEJORA: Limitar tamaño según nivel de corrección
      const maxLength = {
        L: 2953, // Baja corrección
        M: 2331, // Media
        Q: 1663, // Calidad
        H: 1273, // Alta
      };

      const correctionLevel = options.errorCorrectionLevel || "H";
      if (data.length > maxLength[correctionLevel]) {
        throw new Error(
          `QR data too large. Maximum ${maxLength[correctionLevel]} characters for ${correctionLevel} error correction.`,
        );
      }

      // ✅ MEJORA: Verificar cache primero
      const cacheKey = this.generateCacheKey(data, options);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        logger.debug("QR served from cache", {
          cacheKey,
          length: cached.length,
        });
        return cached;
      }

      // ✅ MEJORA: Combinar opciones por defecto con las personalizadas
      const qrOptions = {
        ...this.defaultOptions,
        ...options,
        color: {
          ...this.defaultOptions.color,
          ...(options.color || {}),
        },
      };

      // ✅ MEJORA: Generar QR como buffer directamente
      const qrBuffer = await QRCode.toBuffer(data, qrOptions);

      // ✅ MEJORA: Guardar en cache
      this.addToCache(cacheKey, qrBuffer);

      logger.debug("QR code generated successfully", {
        dataLength: data.length,
        size: qrBuffer.length,
        errorCorrection: correctionLevel,
      });

      return qrBuffer;
    } catch (error) {
      logger.error("Error generating QR code:", {
        error: error.message,
        dataLength: data?.length,
        options,
      });

      // ✅ MEJORA: Lanzar error específico
      if (error.message.includes("QR data")) {
        throw error;
      }
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  /**
   * ✅ MEJORA: Guardar imagen QR con nombre seguro y metadatos
   * @param {Buffer} qrBuffer - Buffer de la imagen QR
   * @param {string} filename - Nombre base del archivo
   * @param {Object} options - Opciones de guardado
   * @returns {Promise<Object>} Información del archivo guardado
   */
  async saveQRImage(qrBuffer, filename, options = {}) {
    try {
      const {
        subdirectory = "",
        compress = true,
        quality = 80,
        addMetadata = true,
        format = "png",
      } = options;

      // ✅ MEJORA: Validar buffer de entrada
      if (!Buffer.isBuffer(qrBuffer)) {
        throw new Error("qrBuffer must be a valid Buffer");
      }

      if (qrBuffer.length === 0) {
        throw new Error("qrBuffer cannot be empty");
      }

      // ✅ MEJORA: Crear directorio seguro
      const saveDir = subdirectory
        ? path.join(this.qrDir, subdirectory)
        : this.qrDir;

      await fs.mkdir(saveDir, { recursive: true });

      // ✅ MEJORA: Generar nombre de archivo seguro
      const safeFilename = this.generateSafeFilename(filename);
      const fileExtension = format.toLowerCase();
      const filePath = path.join(saveDir, `${safeFilename}.${fileExtension}`);

      // ✅ MEJORA: Procesar imagen si se requiere compresión
      let finalBuffer = qrBuffer;
      if (compress && fileExtension === "png") {
        try {
          finalBuffer = await sharp(qrBuffer).png({ quality }).toBuffer();
        } catch (sharpError) {
          logger.warn(
            "Compression failed, using original buffer:",
            sharpError.message,
          );
        }
      }

      // ✅ MEJORA: Guardar archivo con permisos seguros
      await fs.writeFile(filePath, finalBuffer, { mode: 0o644 });

      // ✅ MEJORA: Guardar metadatos en archivo separado
      if (addMetadata) {
        await this.saveMetadata(filePath, {
          generatedAt: new Date().toISOString(),
          filename: safeFilename,
          originalName: filename,
          size: finalBuffer.length,
          system: config.app.name || "Inventory QR System",
        });
      }

      logger.info("QR image saved successfully", {
        filePath,
        size: finalBuffer.length,
        filename: safeFilename,
      });

      return {
        path: filePath,
        url: this.getPublicUrl(filePath),
        filename: safeFilename,
        size: finalBuffer.length,
        format: fileExtension,
        directory: saveDir,
      };
    } catch (error) {
      logger.error("Error saving QR image:", {
        error: error.message,
        filename,
        options,
      });
      throw new Error(`Failed to save QR image: ${error.message}`);
    }
  }

  /**
   * ✅ MEJORA: Generar código QR con logo optimizado
   * @param {string} data - Datos para el código QR
   * @param {Object} logoOptions - Opciones del logo
   * @param {Object} qrOptions - Opciones del QR
   * @returns {Promise<Buffer>} Buffer de la imagen QR con logo
   */
  async generateQRCodeWithLogo(data, logoOptions = {}, qrOptions = {}) {
    try {
      // ✅ MEJORA: Generar QR base
      const qrBuffer = await this.generateQRCode(data, qrOptions);

      // ✅ MEJORA: Verificar si hay logo
      if (!logoOptions.path && !logoOptions.buffer) {
        return qrBuffer;
      }

      // ✅ MEJORA: Cargar y procesar imagen QR
      const qrImage = sharp(qrBuffer);
      const qrMetadata = await qrImage.metadata();

      let logoImage;
      try {
        // ✅ MEJORA: Cargar logo desde buffer o archivo
        if (logoOptions.buffer) {
          logoImage = sharp(logoOptions.buffer);
        } else {
          // Verificar que el archivo existe
          await fs.access(logoOptions.path);
          logoImage = sharp(logoOptions.path);
        }
      } catch (logoError) {
        logger.warn(
          "Logo not found or invalid, returning QR without logo:",
          logoError.message,
        );
        return qrBuffer;
      }

      // ✅ MEJORA: Redimensionar logo proporcionalmente
      const logoSize = Math.floor(qrMetadata.width * (logoOptions.size || 0.2));
      const logoResized = await logoImage
        .resize(logoSize, logoSize, {
          fit: "contain",
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .toBuffer();

      // ✅ MEJORA: Componer QR con logo centrado
      const finalImage = await qrImage
        .composite([
          {
            input: logoResized,
            top: Math.floor((qrMetadata.height - logoSize) / 2),
            left: Math.floor((qrMetadata.width - logoSize) / 2),
            blend: "over",
          },
        ])
        .png({ quality: qrOptions.quality || 90 })
        .toBuffer();

      logger.debug("QR with logo generated successfully", {
        dataLength: data.length,
        logoSize,
        finalSize: finalImage.length,
      });

      return finalImage;
    } catch (error) {
      logger.error("Error generating QR with logo:", {
        error: error.message,
        logoOptions,
        qrOptions,
      });

      // ✅ MEJORA: Fallback a QR sin logo
      try {
        return await this.generateQRCode(data, qrOptions);
      } catch (fallbackError) {
        throw new Error(`Failed to generate QR code: ${fallbackError.message}`);
      }
    }
  }

  /**
   * ✅ MEJORA: Generar múltiples códigos QR en lote con control de concurrencia
   * @param {Array} items - Array de items para generar QR
   * @param {Object} options - Opciones del lote
   * @returns {Promise<Object>} Resultados del lote
   */
  async generateBatchQRCodes(items, options = {}) {
    const startTime = Date.now();

    try {
      // ✅ MEJORA: Validación de entrada
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Items must be a non-empty array");
      }

      if (items.length > 1000) {
        throw new Error("Batch size too large. Maximum 1000 items per batch.");
      }

      const {
        batchId = this.generateBatchId(),
        concurrency = 3, // ✅ MEJORA: Concurrencia más conservadora
        subdirectory = `batch/${batchId}`,
        ...qrOptions
      } = options;

      logger.info("Starting batch QR generation", {
        batchId,
        itemCount: items.length,
        concurrency,
      });

      const results = [];
      const errors = [];
      const batchDir = path.join(this.batchDir, batchId);

      // ✅ MEJORA: Crear directorio del lote
      await fs.mkdir(batchDir, { recursive: true });

      // ✅ MEJORA: Función para procesar un item
      const processItem = async (item, index) => {
        try {
          // ✅ MEJORA: Preparar datos del QR
          const qrData =
            item.data ||
            JSON.stringify({
              type: item.type || "product",
              id: item.id,
              sku: item.sku,
              timestamp: new Date().toISOString(),
              batchId,
            });

          // ✅ MEJORA: Validar datos antes de generar
          if (!this.validateQRData(qrData, item.type)) {
            throw new Error(`Invalid QR data for item ${index}`);
          }

          // ✅ MEJORA: Generar QR
          const qrBuffer = await this.generateQRCode(qrData, {
            ...qrOptions,
            width: item.size || qrOptions.width || 300,
          });

          // ✅ MEJORA: Nombre de archivo seguro
          const filename =
            item.filename ||
            `${item.type || "qr"}-${item.id || item.sku || index}`;

          const saved = await this.saveQRImage(qrBuffer, filename, {
            subdirectory: path.join("batch", batchId),
            compress: qrOptions.compress !== false,
            format: qrOptions.format || "png",
          });

          results.push({
            ...item,
            qrData,
            ...saved,
            index,
            success: true,
          });

          logger.debug(`Generated QR for item ${index}`, {
            filename,
            itemId: item.id,
          });
        } catch (error) {
          errors.push({
            item: { ...item, index },
            error: error.message,
            timestamp: new Date().toISOString(),
          });
          logger.error(`Error generating QR for item ${index}:`, error.message);
        }
      };

      // ✅ MEJORA: Procesar en lotes controlados
      const batchSize = Math.min(concurrency, 10);
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        await Promise.allSettled(
          batch.map((item, batchIndex) => processItem(item, i + batchIndex)),
        );

        // ✅ MEJORA: Pequeña pausa entre lotes para no sobrecargar
        if (i + batchSize < items.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      // ✅ MEJORA: Guardar reporte del lote
      const batchReport = {
        batchId,
        generatedAt: new Date().toISOString(),
        totalItems: items.length,
        successful: results.length,
        failed: errors.length,
        processingTime: Date.now() - startTime,
        results: results.map((r) => ({
          filename: r.filename,
          url: r.url,
          dataPreview:
            r.qrData.substring(0, 100) + (r.qrData.length > 100 ? "..." : ""),
        })),
        errors,
      };

      await this.saveBatchReport(batchId, batchReport);

      logger.info("Batch QR generation completed", {
        batchId,
        successful: results.length,
        failed: errors.length,
        processingTime: Date.now() - startTime,
      });

      return {
        batchId,
        results,
        errors,
        report: batchReport,
        processingTime: Date.now() - startTime,
      };
    } catch (error) {
      logger.error("Error in batch QR generation:", {
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Batch QR generation failed: ${error.message}`);
    }
  }

  /**
   * ✅ MEJORA: Generar QR para producto con información estructurada
   * @param {Object} product - Datos del producto
   * @param {Object} options - Opciones de generación
   * @returns {Promise<Object>} Información del QR generado
   */
  async generateProductQR(product, options = {}) {
    try {
      // ✅ MEJORA: Validar datos del producto
      if (!product || !product.id || !product.sku) {
        throw new Error("Product must have id and sku");
      }

      // ✅ MEJORA: Datos estructurados para el QR
      const productData = {
        type: "product",
        productId: product.id,
        sku: product.sku,
        name: product.name,
        system: config.app.name || "Inventory QR System",
        url: `${config.app.url}/products/${product.id}`,
        timestamp: new Date().toISOString(),
        version: "2.0",
      };

      // ✅ MEJORA: Codificar datos de forma segura
      const jsonData = JSON.stringify(productData);
      const base64Data = Buffer.from(jsonData).toString("base64");
      const qrData = `INVENTORY:${base64Data}`;

      // ✅ MEJORA: Opciones específicas para productos
      const qrOptions = {
        errorCorrectionLevel: "Q",
        width: options.size || 400,
        color: {
          dark: options.color || "#1a237e",
          light: options.bgColor || "#ffffff",
        },
        margin: 3,
        ...options,
      };

      let qrBuffer;

      // ✅ MEJORA: Generar con logo si está especificado
      if (options.logo && (options.logo.path || options.logo.buffer)) {
        qrBuffer = await this.generateQRCodeWithLogo(
          qrData,
          options.logo,
          qrOptions,
        );
      } else {
        qrBuffer = await this.generateQRCode(qrData, qrOptions);
      }

      // ✅ MEJORA: Guardar con nombre descriptivo
      const filename = `product-${product.sku}-${product.id}`;
      const saved = await this.saveQRImage(qrBuffer, filename, {
        subdirectory: "products",
        compress: options.compress !== false,
        addMetadata: true,
      });

      logger.info("Product QR generated successfully", {
        productId: product.id,
        sku: product.sku,
        filename: saved.filename,
        size: saved.size,
      });

      return {
        ...saved,
        productData,
        qrData,
        productId: product.id,
        sku: product.sku,
      };
    } catch (error) {
      logger.error("Error generating product QR:", {
        error: error.message,
        productId: product?.id,
        sku: product?.sku,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Generar archivo ZIP con múltiples códigos QR
   * @param {Array} items - Array de items para generar QR
   * @param {Object} options - Opciones del ZIP
   * @returns {Promise<Object>} Información del ZIP generado
   */
  async generateQRCodesZip(items, options = {}) {
    const startTime = Date.now();

    try {
      // ✅ MEJORA: Validar entrada
      if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Items must be a non-empty array");
      }

      if (items.length > 500) {
        throw new Error(
          "Too many items for ZIP generation. Maximum 500 items.",
        );
      }

      const JSZip = require("jszip");
      const zip = new JSZip();

      // ✅ MEJORA: Contador de progreso
      let processed = 0;
      const total = items.length;

      // ✅ MEJORA: Generar y agregar cada QR al ZIP
      for (const item of items) {
        try {
          const qrBuffer = await this.generateQRCode(
            item.data || JSON.stringify(item),
            item.options || {},
          );

          const filename = `${item.filename || `qr-${processed}`}.png`;
          zip.file(filename, qrBuffer);

          processed++;

          // ✅ MEJORA: Log de progreso cada 10 items
          if (processed % 10 === 0) {
            logger.debug(`ZIP generation progress: ${processed}/${total}`);
          }
        } catch (error) {
          logger.warn(
            `Failed to generate QR for ${item.filename}:`,
            error.message,
          );
        }
      }

      // ✅ MEJORA: Agregar archivo README
      const readmeContent = this.generateReadmeContent(items, {
        generatedAt: new Date().toISOString(),
        totalItems: items.length,
        successfulItems: processed,
      });
      zip.file("README.txt", readmeContent);

      // ✅ MEJORA: Generar ZIP en memoria
      const zipBuffer = await zip.generateAsync({
        type: "nodebuffer",
        compression: "DEFLATE",
        compressionOptions: { level: 9 },
      });

      // ✅ MEJORA: Guardar ZIP si se solicita
      let savedInfo = null;
      if (options.saveToDisk !== false) {
        const zipFilename = options.filename || `qrcodes-${Date.now()}.zip`;
        const zipPath = path.join(this.tempDir, zipFilename);

        await fs.writeFile(zipPath, zipBuffer);
        savedInfo = {
          path: zipPath,
          url: this.getPublicUrl(zipPath),
          filename: zipFilename,
          size: zipBuffer.length,
        };
      }

      const processingTime = Date.now() - startTime;

      logger.info("QR codes ZIP generated successfully", {
        totalItems: items.length,
        successfulItems: processed,
        zipSize: zipBuffer.length,
        processingTime,
      });

      return {
        zipBuffer,
        savedInfo,
        totalItems: items.length,
        successfulItems: processed,
        processingTime,
      };
    } catch (error) {
      logger.error("Error generating QR codes ZIP:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Métodos auxiliares optimizados
   */

  generateSafeFilename(original) {
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString("hex");

    // ✅ MEJORA: Sanitización más robusta
    const sanitized = original
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9._-]/g, "-") // Reemplazar caracteres no permitidos
      .replace(/-+/g, "-") // Reemplazar múltiples guiones
      .replace(/^-|-$/g, "") // Remover guiones al inicio/final
      .substring(0, 100); // Limitar longitud

    return `${sanitized || "qr"}-${timestamp}-${random}`;
  }

  async saveMetadata(filePath, metadata) {
    try {
      const metaPath = `${filePath}.meta.json`;
      await fs.writeFile(metaPath, JSON.stringify(metadata, null, 2), {
        mode: 0o644,
      });
    } catch (error) {
      logger.warn("Failed to save metadata:", error.message);
    }
  }

  async saveBatchReport(batchId, report) {
    try {
      const reportPath = path.join(this.batchDir, batchId, "report.json");
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2), {
        mode: 0o644,
      });
    } catch (error) {
      logger.error("Failed to save batch report:", error);
      throw error;
    }
  }

  getPublicUrl(filePath) {
    try {
      const relativePath = path.relative(this.baseDir, filePath);
      return `${config.app.url}/uploads/${relativePath.replace(/\\/g, "/")}`;
    } catch {
      return null;
    }
  }

  generateBatchId() {
    return `batch-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
  }

  generateCacheKey(data, options) {
    const optionsString = JSON.stringify(options);
    return crypto
      .createHash("md5")
      .update(data + optionsString)
      .digest("hex");
  }

  addToCache(key, buffer) {
    this.imageCache.set(key, {
      buffer,
      timestamp: Date.now(),
    });

    // ✅ MEJORA: Limpiar cache periódicamente
    if (this.imageCache.size > 100) {
      this.cleanupCache();
    }
  }

  getFromCache(key) {
    const cached = this.imageCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.buffer;
    }

    if (cached) {
      this.imageCache.delete(key);
    }

    return null;
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.imageCache.entries()) {
      if (now - value.timestamp > this.cacheTTL) {
        this.imageCache.delete(key);
      }
    }
  }

  generateReadmeContent(items, metadata) {
    return `
QR Codes Batch Export
=====================
Generated: ${new Date(metadata.generatedAt).toLocaleString()}
Total Items: ${metadata.totalItems}
Successfully Generated: ${metadata.successfulItems}

Files included:
${items.map((item, i) => `${i + 1}. ${item.filename || `qr-${i}`}.png`).join("\n")}

System: ${config.app.name || "Inventory QR System"}
Version: 2.0
Export ID: ${Date.now()}
=====================================================
This file was automatically generated by the system.
    `;
  }

  /**
   * ✅ MEJORA: Validar formato de datos QR
   * @param {string} data - Datos a validar
   * @param {string} type - Tipo de datos
   * @returns {boolean} True si es válido
   */
  validateQRData(data, type = "generic") {
    if (!data || typeof data !== "string" || data.trim().length === 0) {
      return false;
    }

    const validators = {
      product: (data) => {
        try {
          const parsed = JSON.parse(data);
          return parsed.productId && parsed.sku && parsed.type === "product";
        } catch {
          return false;
        }
      },
      url: (data) => {
        try {
          const url = new URL(data);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      json: (data) => {
        try {
          JSON.parse(data);
          return true;
        } catch {
          return false;
        }
      },
      generic: (data) => {
        return data.length <= 2953; // Límite para corrección alta
      },
    };

    const validator = validators[type] || validators.generic;
    return validator(data);
  }

  /**
   * ✅ MEJORA: Limpiar archivos temporales antiguos
   * @param {number} maxAgeHours - Horas máximas de antigüedad
   * @returns {Promise<Object>} Resultado de la limpieza
   */
  async cleanupTempFiles(maxAgeHours = 24) {
    try {
      const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
      let cleaned = 0;
      let totalSize = 0;

      const cleanDirectory = async (dir) => {
        try {
          const files = await fs.readdir(dir);

          for (const file of files) {
            const filePath = path.join(dir, file);

            try {
              const stats = await fs.stat(filePath);

              if (stats.isDirectory()) {
                const subResult = await cleanDirectory(filePath);
                cleaned += subResult.cleaned;
                totalSize += subResult.totalSize;

                // ✅ MEJORA: Eliminar directorio vacío
                const remaining = await fs.readdir(filePath);
                if (remaining.length === 0) {
                  await fs.rmdir(filePath);
                }
              } else if (stats.mtimeMs < cutoff) {
                await fs.unlink(filePath);
                cleaned++;
                totalSize += stats.size;
                logger.debug(
                  `Cleaned temp file: ${file} (${stats.size} bytes)`,
                );
              }
            } catch (error) {
              logger.warn(`Error processing file ${file}:`, error.message);
            }
          }
        } catch (error) {
          if (error.code !== "ENOENT") {
            logger.error(`Error cleaning directory ${dir}:`, error);
          }
        }

        return { cleaned: 0, totalSize: 0 };
      };

      const result = await cleanDirectory(this.tempDir);
      cleaned += result.cleaned;
      totalSize += result.totalSize;

      logger.info(
        `Cleaned ${cleaned} temporary files (${(totalSize / 1024 / 1024).toFixed(2)} MB)`,
      );

      return {
        cleaned,
        totalSize,
        reclaimedMB: totalSize / 1024 / 1024,
      };
    } catch (error) {
      logger.error("Error cleaning temp files:", error);
      return { cleaned: 0, totalSize: 0, error: error.message };
    }
  }

  /**
   * ✅ MEJORA: Obtener estadísticas de uso
   * @param {string} period - Período de tiempo
   * @returns {Promise<Object>} Estadísticas de uso
   */
  async getUsageStats(period = "month") {
    try {
      const stats = {
        generated: 0,
        storageUsed: 0,
        byType: {},
        recentFiles: [],
      };

      // ✅ MEJORA: Calcular tamaño de almacenamiento de forma eficiente
      const calculateDirSize = async (dir) => {
        let total = 0;

        try {
          const files = await fs.readdir(dir, { withFileTypes: true });

          for (const file of files) {
            const filePath = path.join(dir, file.name);

            try {
              if (file.isDirectory()) {
                total += await calculateDirSize(filePath);
              } else {
                const stats = await fs.stat(filePath);
                total += stats.size;

                // ✅ MEJORA: Registrar archivos recientes
                if (file.name.endsWith(".png") || file.name.endsWith(".jpg")) {
                  stats.recentFiles.push({
                    name: file.name,
                    path: filePath,
                    size: stats.size,
                    modified: stats.mtime,
                  });
                }
              }
            } catch (error) {
              logger.warn(`Error processing file ${filePath}:`, error.message);
            }
          }
        } catch (error) {
          if (error.code !== "ENOENT") {
            logger.error(`Error calculating size for ${dir}:`, error);
          }
        }

        return total;
      };

      stats.storageUsed = await calculateDirSize(this.qrDir);

      // ✅ MEJORA: Limitar archivos recientes
      stats.recentFiles = stats.recentFiles
        .sort((a, b) => b.modified - a.modified)
        .slice(0, 20);

      return stats;
    } catch (error) {
      logger.error("Error getting QR usage stats:", error);
      throw error;
    }
  }
}

// ✅ MEJORA: Crear y exportar instancia inicializada
const qrService = new QRService();

// Inicializar el servicio al cargar el módulo
qrService.initialize().catch((error) => {
  logger.error("Failed to initialize QR service:", error);
});

module.exports = qrService;
