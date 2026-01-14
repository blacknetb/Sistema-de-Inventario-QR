/**
 * ✅ MODELO DE INVENTARIO MEJORADO
 * Archivo: models/Inventory.js
 *
 * Correcciones aplicadas:
 * 1. ✅ Corregida importación de logger no definido
 * 2. ✅ Agregada validación robusta con Joi
 * 3. ✅ Mejor manejo de transacciones y errores
 * 4. ✅ Optimización de consultas SQL
 * 5. ✅ Sistema de cache mejorado
 * 6. ✅ Métodos más seguros y eficientes
 */

const {
  query,
  executeInTransaction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../config/database");
const Product = require("./Product");
const Joi = require("joi");
const { auditLogger } = require("./AuditLog");

// ✅ MEJORA: Logger personalizado para inventario
class InventoryLogger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const colors = {
      info: "\x1b[36m",
      warn: "\x1b[33m",
      error: "\x1b[31m",
      debug: "\x1b[90m",
    };

    const color = colors[level] || "\x1b[0m";
    const reset = "\x1b[0m";

    console.log(
      `${color}[${timestamp}] [INVENTORY:${level.toUpperCase()}]${reset} ${message}`,
      meta,
    );
  }

  static info(message, meta = {}) {
    this.log("info", message, meta);
  }
  static warn(message, meta = {}) {
    this.log("warn", message, meta);
  }
  static error(message, meta = {}) {
    this.log("error", message, meta);
  }
  static debug(message, meta = {}) {
    this.log("debug", message, meta);
  }
}

// ✅ MEJORA: Esquemas de validación Joi para inventario
const inventorySchemas = {
  movement: Joi.object({
    productId: Joi.alternatives()
      .try(Joi.number().integer().min(1), Joi.string())
      .required(),
    product_id: Joi.alternatives().try(
      Joi.number().integer().min(1),
      Joi.string(),
    ),
    quantity: Joi.number().positive().required(),
    movementType: Joi.string()
      .valid("in", "out", "adjustment", "return", "damage", "transfer")
      .required(),
    movement_type: Joi.string().valid(
      "in",
      "out",
      "adjustment",
      "return",
      "damage",
      "transfer",
    ),
    reference: Joi.string().max(100).allow(null, ""),
    notes: Joi.string().max(500).allow(null, ""),
    location: Joi.string().max(100).allow(null, ""),
    createdAt: Joi.date().optional(),
    created_at: Joi.date().optional(),
  })
    .or("productId", "product_id")
    .or("movementType", "movement_type"),

  bulkAdjustment: Joi.object({
    productId: Joi.alternatives()
      .try(Joi.number().integer().min(1), Joi.string())
      .required(),
    previousStock: Joi.number().min(0).required(),
    newStock: Joi.number().min(0).required(),
    quantity: Joi.number().min(0).required(),
    notes: Joi.string().max(500).allow(null, ""),
    reference: Joi.string().max(100).allow(null, ""),
  }),

  filters: Joi.object({
    productId: Joi.alternatives().try(
      Joi.number().integer().min(1),
      Joi.string(),
    ),
    categoryId: Joi.alternatives().try(
      Joi.number().integer().min(1),
      Joi.string(),
    ),
    movementType: Joi.alternatives().try(
      Joi.string().valid(
        "in",
        "out",
        "adjustment",
        "return",
        "damage",
        "transfer",
      ),
      Joi.array().items(
        Joi.string().valid(
          "in",
          "out",
          "adjustment",
          "return",
          "damage",
          "transfer",
        ),
      ),
    ),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    search: Joi.string().max(100),
    status: Joi.string().valid("active", "inactive", "discontinued"),
    stockStatus: Joi.string().valid(
      "low_stock",
      "out_of_stock",
      "over_stock",
      "in_stock",
    ),
    limit: Joi.number().integer().min(1).max(1000),
    offset: Joi.number().integer().min(0),
    sortBy: Joi.string().valid(
      "created_at",
      "quantity",
      "movement_type",
      "product_name",
    ),
    sortOrder: Joi.string().valid("ASC", "DESC"),
  }),
};

class Inventory {
  // ✅ MEJORA: Tipos de movimiento definidos como constantes inmutables
  static MOVEMENT_TYPES = Object.freeze({
    IN: "in",
    OUT: "out",
    ADJUSTMENT: "adjustment",
    RETURN: "return",
    DAMAGE: "damage",
    TRANSFER: "transfer",
  });

  // ✅ MEJORA: Mapa de tipos de movimiento para display
  static MOVEMENT_TYPE_DISPLAY = Object.freeze({
    in: "Entrada",
    out: "Salida",
    adjustment: "Ajuste",
    return: "Devolución",
    damage: "Daño/Pérdida",
    transfer: "Transferencia",
  });

  // ✅ MEJORA: Cache de stock optimizado
  static stockCache = new Map();
  static CACHE_TTL = 60000; // 1 minuto en milisegundos
  static cacheHits = 0;
  static cacheMisses = 0;

  /**
   * ✅ MEJORA: Crear movimiento de inventario con validación robusta
   * @param {Object} movementData - Datos del movimiento
   * @param {number|string} userId - ID del usuario que realiza la acción
   * @returns {Promise<Object>} - Movimiento creado
   */
  static async create(movementData, userId) {
    let connection = null;
    const startTime = Date.now();
    const movementId = `movement-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      // ✅ CORRECCIÓN: Usar esquema Joi correctamente
      const { error: validationError, value: validatedData } =
        inventorySchemas.movement.validate(movementData, {
          abortEarly: false,
          stripUnknown: true,
        });

      if (validationError) {
        const errorMessages = validationError.details
          .map((detail) => detail.message)
          .join(", ");
        throw new Error(`Validación fallida: ${errorMessages}`);
      }

      // ✅ MEJORA: Normalizar datos
      const productId = validatedData.productId || validatedData.product_id;
      const movementType =
        validatedData.movementType || validatedData.movement_type;
      const quantity = validatedData.quantity;

      // ✅ MEJORA: Verificar producto existente con más información
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error(`Producto no encontrado (ID: ${productId})`);
      }

      // ✅ MEJORA: Validar stock disponible para salidas
      if (movementType === "out" || movementType === "damage") {
        const currentStock = await this.getCurrentStock(productId, false); // No usar cache
        if (currentStock < quantity) {
          throw new Error(
            `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${quantity}`,
          );
        }
      }

      // ✅ MEJORA: Obtener conexión para transacción
      connection = await beginTransaction();

      // ✅ MEJORA: Insertar movimiento con campos completos
      const sql = `
        INSERT INTO inventory_movements (
          product_id, 
          quantity, 
          movement_type, 
          reference, 
          notes, 
          location, 
          created_by, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const [result] = await connection.execute(sql, [
        productId,
        quantity,
        movementType,
        validatedData.reference || null,
        validatedData.notes || null,
        validatedData.location || null,
        userId,
      ]);

      const movementInsertId = result.insertId;

      // ✅ MEJORA: Calcular cambio de stock dinámicamente
      let stockChange = quantity;
      if (movementType === "out" || movementType === "damage") {
        stockChange = -quantity;
      }
      // 'adjustment' necesita ser manejado de forma especial - no cambia stock automáticamente
      if (movementType === "adjustment") {
        stockChange = 0; // Se actualizará manualmente en bulkAdjust
      }

      // ✅ MEJORA: Actualizar stock actual del producto si no es ajuste
      if (movementType !== "adjustment") {
        const updateStockSql = `
          UPDATE products 
          SET current_stock = current_stock + ?,
              updated_at = NOW(),
              last_stock_update = NOW()
          WHERE id = ?
        `;

        await connection.execute(updateStockSql, [stockChange, productId]);
      }

      // ✅ MEJORA: Registrar auditoría con más contexto
      const auditData = {
        productId,
        quantity,
        movementType,
        stockChange,
        productName: product.name,
        productSku: product.sku,
      };

      await connection.execute(
        `INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          entity_name, message, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          "INVENTORY_MOVEMENT_CREATE",
          "INVENTORY_MOVEMENT",
          movementInsertId,
          `Movimiento ${movementType} - ${product.name}`,
          `Movimiento de inventario creado: ${movementType} de ${quantity} unidades`,
          JSON.stringify(auditData),
        ],
      );

      // ✅ MEJORA: Actualizar cache de stock
      this.clearStockCache(productId);

      await commitTransaction(connection);

      const executionTime = Date.now() - startTime;

      InventoryLogger.info("Movimiento de inventario creado exitosamente", {
        movementId,
        productId,
        productName: product.name,
        movementType,
        quantity,
        userId,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: true,
        id: movementInsertId,
        productId,
        productName: product.name,
        quantity,
        movementType,
        movementTypeDisplay: this.getMovementTypeDisplay(movementType),
        reference: validatedData.reference,
        notes: validatedData.notes,
        location: validatedData.location,
        createdBy: userId,
        createdAt: new Date(),
        metadata: {
          movementId,
          executionTime,
          cacheCleared: true,
        },
      };
    } catch (error) {
      if (connection) {
        await rollbackTransaction(connection).catch((rollbackError) => {
          InventoryLogger.error("Error durante rollback", {
            movementId,
            originalError: error.message,
            rollbackError: rollbackError.message,
          });
        });
      }

      const executionTime = Date.now() - startTime;

      InventoryLogger.error("Error creando movimiento de inventario", {
        movementId,
        movementData,
        userId,
        error: error.message,
        stack: error.stack,
        executionTime: `${executionTime}ms`,
      });

      // ✅ MEJORA: Clasificar errores para mejor manejo
      let errorMessage = error.message;
      let errorCode = "INVENTORY_CREATE_ERROR";

      if (error.code === "ER_DUP_ENTRY") {
        errorMessage = "Movimiento duplicado";
        errorCode = "DUPLICATE_MOVEMENT";
      } else if (error.code === "ER_NO_REFERENCED_ROW") {
        errorMessage = "Producto no encontrado en la base de datos";
        errorCode = "PRODUCT_NOT_FOUND";
      } else if (error.message.includes("Stock insuficiente")) {
        errorCode = "INSUFFICIENT_STOCK";
      } else if (error.message.includes("Validación fallida")) {
        errorCode = "VALIDATION_ERROR";
      }

      throw {
        code: errorCode,
        message: errorMessage,
        originalError: error.message,
        movementId,
        executionTime,
      };
    }
  }

  /**
   * ✅ MEJORA: Obtener stock actual con cache mejorado
   * @param {number|string} productId - ID del producto
   * @param {boolean} useCache - Usar cache o forzar consulta
   * @returns {Promise<number>} - Stock actual
   */
  static async getCurrentStock(productId, useCache = true) {
    const cacheKey = `stock_${productId}`;

    // ✅ MEJORA: Verificar cache con TTL
    if (useCache) {
      const cached = this.stockCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.cacheHits++;
        InventoryLogger.debug("Cache hit para stock", {
          productId,
          cacheHits: this.cacheHits,
        });
        return cached.stock;
      }
    }

    this.cacheMisses++;
    InventoryLogger.debug("Cache miss para stock", {
      productId,
      cacheMisses: this.cacheMisses,
    });

    try {
      // ✅ MEJORA: Consulta optimizada con manejo de nulls
      const sql = `
        SELECT 
          COALESCE(p.current_stock, 0) as current_stock,
          p.min_stock,
          p.max_stock,
          p.name,
          p.sku,
          p.status
        FROM products p 
        WHERE p.id = ? AND p.deleted_at IS NULL
        LIMIT 1
      `;

      const [result] = await query(sql, [productId]);

      if (!result || result.length === 0) {
        InventoryLogger.warn("Producto no encontrado al consultar stock", {
          productId,
        });
        return 0;
      }

      const stock = Number(result[0].current_stock) || 0;

      // ✅ MEJORA: Actualizar cache
      this.stockCache.set(cacheKey, {
        stock,
        timestamp: Date.now(),
        productName: result[0].name,
        sku: result[0].sku,
      });

      // ✅ MEJORA: Limpieza periódica de cache
      this.cleanExpiredCache();

      return stock;
    } catch (error) {
      InventoryLogger.error("Error obteniendo stock actual", {
        productId,
        error: error.message,
        cacheMisses: this.cacheMisses,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener historial de producto con estadísticas
   * @param {number|string} productId - ID del producto
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} - Historial con estadísticas
   */
  static async getHistoryByProduct(productId, filters = {}) {
    try {
      // ✅ MEJORA: Validar filtros
      const { error: filterError, value: validatedFilters } =
        inventorySchemas.filters.validate(filters, {
          abortEarly: false,
          stripUnknown: true,
        });

      if (filterError) {
        throw new Error(
          `Filtros inválidos: ${filterError.details.map((d) => d.message).join(", ")}`,
        );
      }

      let sql = `
        SELECT 
          im.id,
          im.product_id,
          im.quantity,
          im.movement_type,
          im.reference,
          im.notes,
          im.location,
          im.created_at,
          im.created_by,
          u.name as created_by_name,
          u.email as created_by_email,
          p.name as product_name,
          p.sku,
          p.current_stock,
          c.name as category_name
        FROM inventory_movements im
        INNER JOIN products p ON im.product_id = p.id AND p.deleted_at IS NULL
        LEFT JOIN users u ON im.created_by = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE im.product_id = ?
      `;

      const params = [productId];

      // ✅ MEJORA: Aplicar filtros dinámicos de forma segura
      if (validatedFilters.movementType) {
        if (Array.isArray(validatedFilters.movementType)) {
          sql += " AND im.movement_type IN (?)";
          params.push(validatedFilters.movementType);
        } else {
          sql += " AND im.movement_type = ?";
          params.push(validatedFilters.movementType);
        }
      }

      if (validatedFilters.startDate) {
        sql += " AND im.created_at >= ?";
        params.push(validatedFilters.startDate);
      }

      if (validatedFilters.endDate) {
        sql += " AND im.created_at <= ?";
        params.push(validatedFilters.endDate);
      }

      if (validatedFilters.search) {
        sql += " AND (im.reference LIKE ? OR im.notes LIKE ?)";
        const searchTerm = `%${validatedFilters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      // ✅ MEJORA: Ordenar y paginar
      const sortBy = validatedFilters.sortBy || "im.created_at";
      const sortOrder = validatedFilters.sortOrder || "DESC";

      // Validar campo de ordenamiento para prevenir SQL injection
      const safeSortFields = [
        "im.created_at",
        "im.quantity",
        "im.movement_type",
        "p.name",
      ];
      const safeSortBy = safeSortFields.includes(sortBy)
        ? sortBy
        : "im.created_at";

      sql += ` ORDER BY ${safeSortBy} ${sortOrder}`;

      if (validatedFilters.limit) {
        sql += " LIMIT ?";
        params.push(Math.min(validatedFilters.limit, 1000)); // Máximo 1000 registros

        if (validatedFilters.offset) {
          sql += " OFFSET ?";
          params.push(validatedFilters.offset);
        }
      }

      const movements = await query(sql, params);

      // ✅ MEJORA: Calcular estadísticas del historial
      const stats = {
        totalMovements: movements.length,
        totalIn: 0,
        totalOut: 0,
        netChange: 0,
      };

      // ✅ MEJORA: Calcular stock acumulado por movimiento
      let runningStock = await this.getCurrentStock(productId, false);
      const movementsWithStock = movements
        .reverse()
        .map((movement) => {
          let stockChange = movement.quantity;

          if (
            movement.movement_type === "in" ||
            movement.movement_type === "return"
          ) {
            stats.totalIn += movement.quantity;
          } else if (
            movement.movement_type === "out" ||
            movement.movement_type === "damage"
          ) {
            stockChange = -movement.quantity;
            stats.totalOut += movement.quantity;
          } else if (movement.movement_type === "adjustment") {
            stockChange = 0; // Los ajustes no afectan el running stock
          }

          runningStock -= stockChange; // Retroceder en el tiempo

          return {
            ...movement,
            movement_type_display: this.getMovementTypeDisplay(
              movement.movement_type,
            ),
            stock_change: stockChange,
            running_stock_at_time: runningStock,
            is_in: ["in", "return"].includes(movement.movement_type),
            is_out: ["out", "damage"].includes(movement.movement_type),
            is_adjustment: movement.movement_type === "adjustment",
          };
        })
        .reverse(); // Volver a ordenar cronológicamente

      stats.netChange = stats.totalIn - stats.totalOut;

      return {
        success: true,
        productId,
        productName: movements[0]?.product_name || "N/A",
        movements: movementsWithStock,
        stats,
        filters: validatedFilters,
        currentStock: await this.getCurrentStock(productId),
        generatedAt: new Date(),
      };
    } catch (error) {
      InventoryLogger.error("Error obteniendo historial por producto", {
        productId,
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener todo el historial con paginación y estadísticas
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>} - Historial paginado con estadísticas
   */
  static async getAllHistory(filters = {}) {
    try {
      // ✅ MEJORA: Validar y normalizar filtros
      const { error: filterError, value: validatedFilters } =
        inventorySchemas.filters.validate(filters, {
          abortEarly: false,
          stripUnknown: true,
        });

      if (filterError) {
        throw new Error(
          `Filtros inválidos: ${filterError.details.map((d) => d.message).join(", ")}`,
        );
      }

      const limit = Math.min(validatedFilters.limit || 50, 500);
      const offset = validatedFilters.offset || 0;
      const sortBy = validatedFilters.sortBy || "im.created_at";
      const sortOrder = validatedFilters.sortOrder || "DESC";

      let sql = `
        SELECT SQL_CALC_FOUND_ROWS
          im.id,
          im.product_id,
          im.quantity,
          im.movement_type,
          im.reference,
          im.notes,
          im.location,
          im.created_at,
          im.created_by,
          u.name as created_by_name,
          p.name as product_name,
          p.sku,
          p.current_stock,
          p.min_stock,
          p.max_stock,
          c.name as category_name,
          c.id as category_id
        FROM inventory_movements im
        INNER JOIN products p ON im.product_id = p.id AND p.deleted_at IS NULL
        LEFT JOIN users u ON im.created_by = u.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE 1=1
      `;

      const params = [];

      // ✅ MEJORA: Aplicar filtros de forma segura
      if (validatedFilters.productId) {
        sql += " AND im.product_id = ?";
        params.push(validatedFilters.productId);
      }

      if (validatedFilters.categoryId) {
        sql += " AND p.category_id = ?";
        params.push(validatedFilters.categoryId);
      }

      if (validatedFilters.movementType) {
        if (Array.isArray(validatedFilters.movementType)) {
          sql += " AND im.movement_type IN (?)";
          params.push(validatedFilters.movementType);
        } else {
          sql += " AND im.movement_type = ?";
          params.push(validatedFilters.movementType);
        }
      }

      if (validatedFilters.startDate) {
        sql += " AND im.created_at >= ?";
        params.push(validatedFilters.startDate);
      }

      if (validatedFilters.endDate) {
        sql += " AND im.created_at <= ?";
        params.push(validatedFilters.endDate);
      }

      if (validatedFilters.search) {
        sql +=
          " AND (p.name LIKE ? OR p.sku LIKE ? OR im.reference LIKE ? OR im.notes LIKE ?)";
        const searchTerm = `%${validatedFilters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // ✅ MEJORA: Validar campo de ordenamiento
      const safeSortFields = [
        "im.created_at",
        "im.quantity",
        "im.movement_type",
        "p.name",
        "p.sku",
      ];
      const safeSortBy = safeSortFields.includes(sortBy)
        ? sortBy
        : "im.created_at";

      sql += ` ORDER BY ${safeSortBy} ${sortOrder}`;
      sql += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const movements = await query(sql, params);

      // ✅ MEJORA: Obtener total de registros para paginación
      const [totalResult] = await query("SELECT FOUND_ROWS() as total");
      const total = totalResult[0]?.total || 0;

      // ✅ MEJORA: Enriquecer datos de movimientos
      const enrichedMovements = movements.map((movement) => {
        const isIn = ["in", "return"].includes(movement.movement_type);
        const isOut = ["out", "damage"].includes(movement.movement_type);

        return {
          ...movement,
          movement_type_display: this.getMovementTypeDisplay(
            movement.movement_type,
          ),
          is_in: isIn,
          is_out: isOut,
          is_adjustment: movement.movement_type === "adjustment",
          stock_status: this.calculateStockStatus(
            movement.current_stock,
            movement.min_stock,
            movement.max_stock,
          ),
        };
      });

      // ✅ MEJORA: Calcular estadísticas
      const stats = {
        totalMovements: total,
        showing: movements.length,
        totalIn: movements
          .filter((m) => ["in", "return"].includes(m.movement_type))
          .reduce((sum, m) => sum + m.quantity, 0),
        totalOut: movements
          .filter((m) => ["out", "damage"].includes(m.movement_type))
          .reduce((sum, m) => sum + m.quantity, 0),
        uniqueProducts: new Set(movements.map((m) => m.product_id)).size,
        uniqueUsers: new Set(movements.map((m) => m.created_by).filter(Boolean))
          .size,
      };

      return {
        success: true,
        data: enrichedMovements,
        pagination: {
          page: Math.floor(offset / limit) + 1,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: offset + limit < total,
          hasPrev: offset > 0,
        },
        stats,
        filters: validatedFilters,
        generatedAt: new Date(),
      };
    } catch (error) {
      InventoryLogger.error("Error obteniendo historial completo", {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Reporte de stock avanzado
   * @param {Object} filters - Filtros para el reporte
   * @returns {Promise<Object>} - Reporte de stock con estadísticas
   */
  static async getStockReport(filters = {}) {
    try {
      const { error: filterError, value: validatedFilters } =
        inventorySchemas.filters.validate(filters, {
          abortEarly: false,
          stripUnknown: true,
        });

      if (filterError) {
        throw new Error(
          `Filtros inválidos: ${filterError.details.map((d) => d.message).join(", ")}`,
        );
      }

      let sql = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.description,
          p.price,
          p.cost,
          p.min_stock,
          p.max_stock,
          p.current_stock,
          p.unit,
          p.status,
          p.last_stock_update,
          p.created_at as product_created_at,
          c.name as category_name,
          c.id as category_id,
          (
            SELECT COALESCE(SUM(quantity), 0)
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type IN ('in', 'return')
            AND im.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as last_30_days_in,
          (
            SELECT COALESCE(SUM(quantity), 0)
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type IN ('out', 'damage')
            AND im.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as last_30_days_out,
          (
            SELECT im.created_at
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            ORDER BY im.created_at DESC 
            LIMIT 1
          ) as last_movement_date,
          CASE 
            WHEN p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 'low_stock'
            WHEN p.current_stock <= 0 THEN 'out_of_stock'
            WHEN p.current_stock >= p.max_stock AND p.max_stock > 0 THEN 'over_stock'
            ELSE 'in_stock'
          END as stock_status,
          CASE 
            WHEN p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 'danger'
            WHEN p.current_stock <= 0 THEN 'danger'
            WHEN p.current_stock >= p.max_stock AND p.max_stock > 0 THEN 'warning'
            ELSE 'success'
          END as stock_status_color,
          ROUND((p.cost * p.current_stock), 2) as inventory_value,
          ROUND(p.price * p.current_stock, 2) as potential_value,
          ROUND((p.price - p.cost) * p.current_stock, 2) as potential_profit,
          CASE 
            WHEN p.min_stock > 0 
            THEN ROUND((p.current_stock / p.min_stock) * 100, 2)
            ELSE 100 
          END as min_stock_coverage
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.deleted_at IS NULL
      `;

      const params = [];
      const havingConditions = [];

      if (validatedFilters.categoryId) {
        sql += " AND p.category_id = ?";
        params.push(validatedFilters.categoryId);
      }

      if (validatedFilters.status) {
        sql += " AND p.status = ?";
        params.push(validatedFilters.status);
      }

      if (validatedFilters.search) {
        sql +=
          " AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";
        const searchTerm = `%${validatedFilters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      if (validatedFilters.stockStatus) {
        havingConditions.push("stock_status = ?");
        params.push(validatedFilters.stockStatus);
      }

      sql += " ORDER BY stock_status, inventory_value DESC, p.name";

      const products = await query(sql, params);

      // ✅ MEJORA: Calcular estadísticas detalladas del reporte
      let totalInventoryValue = 0;
      let totalPotentialValue = 0;
      let totalPotentialProfit = 0;
      const stockStatusCounts = {
        low_stock: 0,
        out_of_stock: 0,
        over_stock: 0,
        in_stock: 0,
      };
      const categoryStats = {};

      products.forEach((product) => {
        totalInventoryValue += Number(product.inventory_value) || 0;
        totalPotentialValue += Number(product.potential_value) || 0;
        totalPotentialProfit += Number(product.potential_profit) || 0;

        stockStatusCounts[product.stock_status] =
          (stockStatusCounts[product.stock_status] || 0) + 1;

        if (!categoryStats[product.category_id]) {
          categoryStats[product.category_id] = {
            name: product.category_name,
            productCount: 0,
            inventoryValue: 0,
            lowStockCount: 0,
          };
        }

        categoryStats[product.category_id].productCount++;
        categoryStats[product.category_id].inventoryValue +=
          Number(product.inventory_value) || 0;
        if (
          product.stock_status === "low_stock" ||
          product.stock_status === "out_of_stock"
        ) {
          categoryStats[product.category_id].lowStockCount++;
        }
      });

      const stats = {
        totalProducts: products.length,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        totalPotentialValue: Math.round(totalPotentialValue * 100) / 100,
        totalPotentialProfit: Math.round(totalPotentialProfit * 100) / 100,
        averageStockValue:
          products.length > 0
            ? Math.round((totalInventoryValue / products.length) * 100) / 100
            : 0,
        stockStatusCounts,
        lowStockValue: products
          .filter((p) => p.stock_status === "low_stock")
          .reduce((sum, p) => sum + (Number(p.inventory_value) || 0), 0),
        categoryStats: Object.values(categoryStats).sort(
          (a, b) => b.inventoryValue - a.inventoryValue,
        ),
      };

      return {
        success: true,
        products,
        stats,
        filters: validatedFilters,
        generatedAt: new Date(),
        cacheInfo: {
          hits: this.cacheHits,
          misses: this.cacheMisses,
          hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
        },
      };
    } catch (error) {
      InventoryLogger.error("Error obteniendo reporte de stock", {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Ajuste masivo de inventario con rollback parcial
   * @param {Array} inventoryAdjustments - Ajustes a realizar
   * @param {number|string} userId - ID del usuario
   * @returns {Promise<Object>} - Resultado del ajuste masivo
   */
  static async bulkAdjust(inventoryAdjustments, userId) {
    if (
      !Array.isArray(inventoryAdjustments) ||
      inventoryAdjustments.length === 0
    ) {
      throw new Error("Se requiere un array de ajustes de inventario");
    }

    if (inventoryAdjustments.length > 100) {
      throw new Error("Máximo 100 ajustes permitidos por operación");
    }

    let connection = null;
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const results = [];
    const startTime = Date.now();

    try {
      connection = await beginTransaction();

      // ✅ MEJORA: Validar y procesar cada ajuste
      for (let i = 0; i < inventoryAdjustments.length; i++) {
        const adjustment = inventoryAdjustments[i];
        const adjustmentId = `${batchId}-${i}`;

        try {
          // Validar ajuste individual
          const { error: validationError, value: validatedAdjustment } =
            inventorySchemas.bulkAdjustment.validate(adjustment, {
              abortEarly: false,
            });

          if (validationError) {
            throw new Error(
              `Validación fallida: ${validationError.details.map((d) => d.message).join(", ")}`,
            );
          }

          const productId = validatedAdjustment.productId;

          // Verificar producto
          const product = await Product.findById(productId);
          if (!product) {
            throw new Error(`Producto no encontrado (ID: ${productId})`);
          }

          // Verificar que el stock anterior coincida
          const currentStock = await this.getCurrentStock(productId, false);
          if (currentStock !== validatedAdjustment.previousStock) {
            throw new Error(
              `Stock anterior no coincide. Actual: ${currentStock}, Esperado: ${validatedAdjustment.previousStock}`,
            );
          }

          // Crear movimiento de ajuste
          const movementData = {
            productId,
            quantity: Math.abs(validatedAdjustment.quantity),
            movementType: "adjustment",
            notes: validatedAdjustment.notes || "Ajuste masivo de inventario",
            reference:
              validatedAdjustment.reference || `${batchId}-${productId}`,
          };

          const movementResult = await this.create(movementData, userId);

          // Actualizar stock directamente
          const updateSql = `
            UPDATE products 
            SET current_stock = ?,
                updated_at = NOW(),
                last_stock_update = NOW()
            WHERE id = ?
          `;

          await connection.execute(updateSql, [
            validatedAdjustment.newStock,
            productId,
          ]);

          // Limpiar cache del producto
          this.clearStockCache(productId);

          results.push({
            productId,
            success: true,
            movementId: movementResult.id,
            previousStock: validatedAdjustment.previousStock,
            newStock: validatedAdjustment.newStock,
            adjustment: validatedAdjustment.quantity,
            productName: product.name,
          });

          InventoryLogger.info("Ajuste masivo exitoso", {
            adjustmentId,
            productId,
            productName: product.name,
            previousStock: validatedAdjustment.previousStock,
            newStock: validatedAdjustment.newStock,
          });
        } catch (adjustmentError) {
          results.push({
            productId: adjustment.productId,
            success: false,
            error: adjustmentError.message,
            adjustmentId,
          });

          InventoryLogger.warn("Error en ajuste individual", {
            adjustmentId,
            productId: adjustment.productId,
            error: adjustmentError.message,
          });
        }
      }

      // ✅ MEJORA: Registrar auditoría del batch completo
      await connection.execute(
        `INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          entity_name, message, metadata, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          userId,
          "INVENTORY_BULK_ADJUST",
          "INVENTORY_BATCH",
          batchId,
          `Ajuste masivo de ${results.length} productos`,
          `Ajuste masivo completado: ${results.filter((r) => r.success).length} exitosos, ${results.filter((r) => !r.success).length} fallidos`,
          JSON.stringify({
            batchId,
            total: inventoryAdjustments.length,
            successful: results.filter((r) => r.success).length,
            failed: results.filter((r) => !r.success).length,
            results: results.map((r) => ({
              productId: r.productId,
              success: r.success,
              error: r.error,
            })),
          }),
        ],
      );

      await commitTransaction(connection);

      const executionTime = Date.now() - startTime;

      InventoryLogger.info("Ajuste masivo completado", {
        batchId,
        total: inventoryAdjustments.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        userId,
        executionTime: `${executionTime}ms`,
      });

      return {
        success: true,
        batchId,
        processed: inventoryAdjustments.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
        metadata: {
          executionTime,
          timestamp: new Date(),
        },
      };
    } catch (error) {
      if (connection) {
        await rollbackTransaction(connection).catch((rollbackError) => {
          InventoryLogger.error("Error durante rollback de ajuste masivo", {
            batchId,
            originalError: error.message,
            rollbackError: rollbackError.message,
          });
        });
      }

      InventoryLogger.error("Error en ajuste masivo de inventario", {
        batchId,
        error: error.message,
        userId,
        adjustmentsCount: inventoryAdjustments.length,
        executionTime: `${Date.now() - startTime}ms`,
      });

      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener estadísticas de inventario avanzadas
   * @returns {Promise<Object>} - Estadísticas detalladas
   */
  static async getInventoryStats() {
    try {
      const sql = `
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          SUM(p.current_stock) as total_items,
          SUM(p.current_stock * p.cost) as total_value,
          SUM(p.current_stock * p.price) as total_potential_value,
          AVG(p.current_stock) as avg_stock_per_product,
          COUNT(CASE WHEN p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 1 END) as low_stock_count,
          COUNT(CASE WHEN p.current_stock = 0 THEN 1 END) as out_of_stock_count,
          COUNT(CASE WHEN p.current_stock >= p.max_stock AND p.max_stock > 0 THEN 1 END) as over_stock_count,
          COUNT(CASE WHEN p.current_stock > 0 AND p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 1 END) as critical_stock_count,
          (
            SELECT COUNT(DISTINCT im.product_id)
            FROM inventory_movements im
            WHERE DATE(im.created_at) = CURDATE()
          ) as products_moved_today,
          (
            SELECT SUM(CASE 
              WHEN im.movement_type IN ('in', 'return') THEN im.quantity 
              WHEN im.movement_type IN ('out', 'damage') THEN -im.quantity 
              ELSE 0 
            END)
            FROM inventory_movements im
            WHERE DATE(im.created_at) = CURDATE()
          ) as net_movement_today,
          (
            SELECT COUNT(*)
            FROM inventory_movements im
            WHERE DATE(im.created_at) = CURDATE()
          ) as movements_today
        FROM products p 
        WHERE p.deleted_at IS NULL
      `;

      const [stats] = await query(sql);

      // ✅ MEJORA: Calcular valoración por categoría
      const categoryValueSql = `
        SELECT 
          c.id,
          c.name,
          COUNT(p.id) as product_count,
          SUM(p.current_stock) as total_items,
          SUM(p.current_stock * p.cost) as category_value,
          COUNT(CASE WHEN p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 1 END) as low_stock_in_category,
          ROUND((SUM(p.current_stock * p.cost) / NULLIF(?, 0)) * 100, 2) as percentage_of_total
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        GROUP BY c.id, c.name
        ORDER BY category_value DESC
        LIMIT 10
      `;

      const categoryValues = await query(categoryValueSql, [
        stats.total_value || 1,
      ]);

      // ✅ MEJORA: Obtener productos que necesitan atención
      const attentionNeededSql = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.current_stock,
          p.min_stock,
          p.max_stock,
          c.name as category_name,
          CASE 
            WHEN p.current_stock <= 0 THEN 'Sin stock'
            WHEN p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 'Stock bajo'
            WHEN p.current_stock >= p.max_stock AND p.max_stock > 0 THEN 'Exceso de stock'
            ELSE 'OK'
          END as status,
          DATEDIFF(NOW(), COALESCE(p.last_stock_update, p.created_at)) as days_since_update
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.deleted_at IS NULL
        AND (p.current_stock <= p.min_stock OR p.current_stock >= p.max_stock OR p.current_stock <= 0)
        ORDER BY 
          CASE 
            WHEN p.current_stock <= 0 THEN 1
            WHEN p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 2
            ELSE 3
          END,
          p.current_stock / NULLIF(p.min_stock, 0)
        LIMIT 20
      `;

      const attentionNeeded = await query(attentionNeededSql);

      // ✅ MEJORA: Estadísticas de movimientos recientes
      const recentMovementsSql = `
        SELECT 
          DATE(im.created_at) as date,
          COUNT(*) as movement_count,
          SUM(CASE WHEN im.movement_type IN ('in', 'return') THEN im.quantity ELSE 0 END) as total_in,
          SUM(CASE WHEN im.movement_type IN ('out', 'damage') THEN im.quantity ELSE 0 END) as total_out
        FROM inventory_movements im
        WHERE im.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(im.created_at)
        ORDER BY date DESC
      `;

      const recentMovements = await query(recentMovementsSql);

      return {
        success: true,
        stats: {
          ...stats,
          total_value: Math.round(stats.total_value * 100) / 100,
          total_potential_value:
            Math.round(stats.total_potential_value * 100) / 100,
        },
        categoryValues,
        attentionNeeded,
        recentMovements,
        cacheStats: {
          hits: this.cacheHits,
          misses: this.cacheMisses,
          size: this.stockCache.size,
          hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
        },
        generatedAt: new Date(),
      };
    } catch (error) {
      InventoryLogger.error("Error obteniendo estadísticas de inventario", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Helper para calcular estado de stock
   * @param {number} currentStock - Stock actual
   * @param {number} minStock - Stock mínimo
   * @param {number} maxStock - Stock máximo
   * @returns {string} - Estado del stock
   */
  static calculateStockStatus(currentStock, minStock, maxStock) {
    if (currentStock <= 0) return "out_of_stock";
    if (minStock > 0 && currentStock <= minStock) return "low_stock";
    if (maxStock > 0 && currentStock >= maxStock) return "over_stock";
    return "in_stock";
  }

  /**
   * ✅ MEJORA: Helper para obtener texto descriptivo del tipo de movimiento
   * @param {string} movementType - Tipo de movimiento
   * @returns {string} - Texto descriptivo
   */
  static getMovementTypeDisplay(movementType) {
    return this.MOVEMENT_TYPE_DISPLAY[movementType] || movementType;
  }

  /**
   * ✅ MEJORA: Limpiar cache de stock de forma segura
   * @param {number|string|null} productId - ID del producto (opcional)
   */
  static clearStockCache(productId = null) {
    if (productId) {
      const cacheKey = `stock_${productId}`;
      this.stockCache.delete(cacheKey);
      InventoryLogger.debug("Cache limpiado para producto", { productId });
    } else {
      this.stockCache.clear();
      InventoryLogger.debug("Cache de stock limpiado completamente");
    }
  }

  /**
   * ✅ MEJORA: Limpiar entradas expiradas del cache
   */
  static cleanExpiredCache() {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, value] of this.stockCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.stockCache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      InventoryLogger.debug("Entradas expiradas eliminadas del cache", {
        expiredCount,
      });
    }
  }

  /**
   * ✅ MEJORA: Verificar si hay stock suficiente
   * @param {number|string} productId - ID del producto
   * @param {number} requiredQuantity - Cantidad requerida
   * @returns {Promise<boolean>} - True si hay stock suficiente
   */
  static async hasSufficientStock(productId, requiredQuantity) {
    try {
      if (requiredQuantity <= 0) {
        return true;
      }

      const currentStock = await this.getCurrentStock(productId);
      const hasStock = currentStock >= requiredQuantity;

      if (!hasStock) {
        InventoryLogger.warn("Stock insuficiente", {
          productId,
          currentStock,
          requiredQuantity,
          deficit: requiredQuantity - currentStock,
        });
      }

      return hasStock;
    } catch (error) {
      InventoryLogger.error("Error verificando stock suficiente", {
        productId,
        requiredQuantity,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * ✅ MEJORA: Obtener historial de stock para gráficos
   * @param {number|string} productId - ID del producto
   * @param {number} days - Días de historial
   * @returns {Promise<Array>} - Historial para gráficos
   */
  static async getStockHistoryForChart(productId, days = 30) {
    try {
      const sql = `
        SELECT 
          DATE(im.created_at) as date,
          SUM(CASE WHEN im.movement_type IN ('in', 'return') THEN im.quantity ELSE 0 END) as stock_in,
          SUM(CASE WHEN im.movement_type IN ('out', 'damage') THEN im.quantity ELSE 0 END) as stock_out,
          (
            SELECT p2.current_stock
            FROM products p2 
            WHERE p2.id = ?
            AND p2.deleted_at IS NULL
          ) as current_stock,
          COUNT(*) as movement_count
        FROM inventory_movements im
        WHERE im.product_id = ?
        AND im.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        GROUP BY DATE(im.created_at)
        ORDER BY date ASC
      `;

      const history = await query(sql, [
        productId,
        productId,
        Math.min(days, 365),
      ]);

      // ✅ MEJORA: Calcular stock acumulado por día
      let runningStock = await this.getCurrentStock(productId, false);
      const formattedHistory = [];

      // Trabajar hacia atrás desde el presente
      for (let i = history.length - 1; i >= 0; i--) {
        const day = history[i];
        const netChange = day.stock_in - day.stock_out;

        // Restar el cambio neto para retroceder en el tiempo
        runningStock -= netChange;

        formattedHistory.unshift({
          date: day.date,
          stock_in: day.stock_in,
          stock_out: day.stock_out,
          net_change: netChange,
          running_stock: runningStock,
          movement_count: day.movement_count,
          current_stock: day.current_stock,
        });
      }

      return formattedHistory;
    } catch (error) {
      InventoryLogger.error("Error obteniendo historial para gráfico", {
        productId,
        days,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener productos con stock bajo
   * @param {number} threshold - Umbral como porcentaje (0-1)
   * @returns {Promise<Array>} - Productos con stock bajo
   */
  static async getLowStockProducts(threshold = 0.5) {
    try {
      const sql = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.min_stock,
          p.max_stock,
          p.current_stock,
          p.unit,
          p.cost,
          p.price,
          c.name as category_name,
          ROUND((p.current_stock / NULLIF(p.min_stock, 0)) * 100, 2) as coverage_percentage,
          ROUND((p.cost * (p.min_stock - p.current_stock)), 2) as restock_cost,
          (
            SELECT im.created_at
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type IN ('in', 'return')
            ORDER BY im.created_at DESC 
            LIMIT 1
          ) as last_restock_date,
          DATEDIFF(NOW(), COALESCE(p.last_stock_update, p.created_at)) as days_since_update,
          CASE 
            WHEN p.current_stock <= 0 THEN 'Sin stock'
            WHEN p.current_stock <= p.min_stock * ? THEN 'Crítico'
            WHEN p.current_stock <= p.min_stock THEN 'Bajo'
            ELSE 'Aceptable'
          END as severity
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.deleted_at IS NULL 
        AND p.min_stock > 0
        AND p.current_stock <= p.min_stock
        ORDER BY 
          CASE 
            WHEN p.current_stock <= 0 THEN 1
            WHEN p.current_stock <= p.min_stock * ? THEN 2
            ELSE 3
          END,
          coverage_percentage ASC
        LIMIT 100
      `;

      return await query(sql, [threshold, threshold]);
    } catch (error) {
      InventoryLogger.error("Error obteniendo productos con stock bajo", {
        threshold,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener métricas de rendimiento del modelo
   * @returns {Object} - Métricas de rendimiento
   */
  static getPerformanceMetrics() {
    return {
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        size: this.stockCache.size,
        hitRate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
      },
      limits: {
        maxCacheSize: 1000,
        cacheTTL: this.CACHE_TTL,
        maxBulkAdjustments: 100,
      },
      version: "2.0.0",
      timestamp: new Date(),
    };
  }
}

// ✅ INICIALIZAR CACHE Y MÉTRICAS
Inventory.stockCache = new Map();
Inventory.cacheHits = 0;
Inventory.cacheMisses = 0;

module.exports = Inventory;
