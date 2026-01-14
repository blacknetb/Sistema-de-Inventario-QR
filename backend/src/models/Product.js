/**
 * ✅ MODELO MEJORADO DE PRODUCTO
 * Archivo: models/Product.js
 *
 * Correcciones aplicadas:
 * 1. ✅ Corregida importación de funciones de transacción
 * 2. ✅ Agregado logger alternativo para fallbacks
 * 3. ✅ Validaciones mejoradas con Joi
 * 4. ✅ Cache optimizado con TTL y LRU
 * 5. ✅ Manejo de errores robusto
 * 6. ✅ Transacciones mejoradas con rollback automático
 * 7. ✅ Sanitización de datos de entrada
 */

const { query, executeInTransaction } = require("../config/database");
const { generateSKU } = require("../utils/helpers");
const Joi = require("joi");

// ✅ MEJORA: Logger alternativo si no existe
const logger = {
  info: (message, meta) => console.log(`[INFO] ${message}`, meta || ""),
  error: (message, meta) => console.error(`[ERROR] ${message}`, meta || ""),
  warn: (message, meta) => console.warn(`[WARN] ${message}`, meta || ""),
  debug: (message, meta) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, meta || "");
    }
  },
};

/**
 * ✅ ESQUEMA DE VALIDACIÓN MEJORADO PARA PRODUCTOS
 * Con Joi para validación robusta
 */
const productSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().max(1000).allow("", null),
  sku: Joi.string()
    .max(50)
    .pattern(/^[A-Z0-9-]+$/)
    .allow("", null),
  barcode: Joi.string().max(100).allow("", null),
  categoryId: Joi.number().integer().min(1).allow(null),
  supplierId: Joi.number().integer().min(1).allow(null),
  price: Joi.number().precision(2).min(0).default(0),
  cost: Joi.number().precision(2).min(0).default(0),
  minStock: Joi.number().integer().min(0).default(0),
  maxStock: Joi.number().integer().min(0).default(1000),
  currentStock: Joi.number().integer().min(0).default(0),
  unit: Joi.string().max(20).default("unidad"),
  weight: Joi.number().precision(3).min(0).allow(null),
  dimensions: Joi.string().max(100).allow(null),
  status: Joi.string()
    .valid("active", "inactive", "discontinued", "draft")
    .default("active"),
});

/**
 * ✅ CLASE MEJORADA DE PRODUCTO
 * Implementa cache LRU con TTL y validaciones robustas
 */
class Product {
  // ✅ MEJORA: Estados definidos como constantes
  static STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
    DISCONTINUED: "discontinued",
    DRAFT: "draft",
  });

  // ✅ MEJORA: Cache LRU con TTL optimizado
  static cache = new Map();
  static CACHE_TTL = 300000; // 5 minutos en milisegundos
  static MAX_CACHE_SIZE = 1000;

  /**
   * ✅ LIMPIAR CACHE AUTOMÁTICAMENTE (LRU)
   */
  static cleanCache() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach((key) => this.cache.delete(key));

    // Limitar tamaño del cache
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const excess = this.cache.size - this.MAX_CACHE_SIZE;
      const keys = Array.from(this.cache.keys()).slice(0, excess);
      keys.forEach((key) => this.cache.delete(key));
    }
  }

  /**
   * ✅ CREAR PRODUCTO CON TRANSACCIÓN Y VALIDACIÓN COMPLETA
   * @param {Object} productData - Datos del producto
   * @param {Number} userId - ID del usuario que crea
   * @returns {Object} Producto creado
   */
  static async create(productData, userId) {
    try {
      // ✅ MEJORA: Validar datos con Joi
      const { error, value: validatedData } =
        productSchema.validate(productData);
      if (error) {
        throw new Error(
          `Validación fallida: ${error.details.map((d) => d.message).join(", ")}`,
        );
      }

      // ✅ MEJORA: Verificar si SKU ya existe
      let sku = validatedData.sku;
      if (!sku) {
        sku = await this.generateUniqueSKU(
          validatedData.name,
          validatedData.categoryId,
        );
      } else {
        const existingProduct = await this.findBySKU(sku);
        if (existingProduct) {
          throw new Error(`El SKU ${sku} ya está en uso`);
        }
      }

      // ✅ MEJORA: Usar transacción para operaciones atómicas
      const result = await executeInTransaction(async (connection) => {
        const sql = `
          INSERT INTO products (
            name, 
            description, 
            sku, 
            barcode,
            category_id, 
            supplier_id,
            price, 
            cost, 
            min_stock, 
            max_stock, 
            current_stock,
            unit, 
            weight,
            dimensions,
            status, 
            created_by,
            created_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [insertResult] = await connection.execute(sql, [
          validatedData.name,
          validatedData.description || "",
          sku,
          validatedData.barcode || null,
          validatedData.categoryId || null,
          validatedData.supplierId || null,
          validatedData.price || 0,
          validatedData.cost || 0,
          validatedData.minStock || 0,
          validatedData.maxStock || 1000,
          validatedData.currentStock || 0,
          validatedData.unit || "unidad",
          validatedData.weight || null,
          validatedData.dimensions || null,
          validatedData.status || this.STATUS.ACTIVE,
          userId,
        ]);

        // ✅ MEJORA: Si hay stock inicial, crear movimiento de inventario
        if (validatedData.currentStock && validatedData.currentStock > 0) {
          await connection.execute(
            `INSERT INTO inventory_movements (
              product_id, quantity, movement_type, reference, 
              notes, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              insertResult.insertId,
              validatedData.currentStock,
              "in",
              "INITIAL_STOCK",
              "Stock inicial del producto",
              userId,
            ],
          );
        }

        // ✅ MEJORA: Registrar log de auditoría
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            "CREATE",
            "PRODUCT",
            insertResult.insertId,
            userId,
            JSON.stringify({
              name: validatedData.name,
              sku,
              categoryId: validatedData.categoryId,
            }),
          ],
        );

        return insertResult;
      });

      logger.info("Producto creado exitosamente", {
        productId: result.insertId,
        sku,
        name: validatedData.name,
        userId,
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache();

      return {
        id: result.insertId,
        ...validatedData,
        sku,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error creando producto", {
        error: error.message,
        productName: productData.name,
        userId,
        stack: error.stack,
      });

      // ✅ MEJORA: Manejo específico de errores de base de datos
      if (error.code === "ER_DUP_ENTRY") {
        if (error.message.includes("sku")) {
          throw new Error("El SKU ya está en uso");
        } else if (error.message.includes("name")) {
          throw new Error("Ya existe un producto con ese nombre");
        }
      }

      throw new Error(`Error al crear producto: ${error.message}`);
    }
  }

  /**
   * ✅ ENCONTRAR PRODUCTO POR ID CON CACHE MEJORADO
   * @param {Number} id - ID del producto
   * @param {Boolean} includeStats - Incluir estadísticas
   * @returns {Object} Producto encontrado
   */
  static async findById(id, includeStats = false) {
    try {
      // ✅ MEJORA: Limpiar cache automáticamente
      this.cleanCache();

      // ✅ MEJORA: Verificar cache primero con clave compuesta
      const cacheKey = `product_${id}_${includeStats}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug("Producto recuperado del cache", { productId: id });
        return cached.data;
      }

      let sql = `
        SELECT 
          p.*, 
          c.name as category_name,
          c.id as category_id,
          s.name as supplier_name,
          s.id as supplier_id,
          u.name as created_by_name,
          u.email as created_by_email,
          (
            SELECT COUNT(*) 
            FROM qrcodes q 
            WHERE q.product_id = p.id AND q.deleted_at IS NULL
          ) as qr_count,
          (
            SELECT COUNT(*) 
            FROM product_images pi 
            WHERE pi.product_id = p.id AND pi.deleted_at IS NULL
          ) as image_count
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN suppliers s ON p.supplier_id = s.id 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = ? AND p.deleted_at IS NULL
      `;

      const [product] = await query(sql, [id]);

      if (!product) {
        return null;
      }

      // ✅ MEJORA: Incluir estadísticas si se solicita
      if (includeStats) {
        try {
          const stats = await this.getProductStats(id);
          product.stats = stats;
        } catch (statsError) {
          logger.warn("Error obteniendo estadísticas del producto", {
            productId: id,
            error: statsError.message,
          });
          product.stats = {};
        }
      }

      // ✅ MEJORA: Formatear datos
      product.status_display = this.getStatusDisplay(product.status);
      product.price_formatted = `$${parseFloat(product.price || 0).toFixed(2)}`;
      product.cost_formatted = `$${parseFloat(product.cost || 0).toFixed(2)}`;
      product.inventory_value = (
        product.current_stock * (product.cost || 0)
      ).toFixed(2);

      // ✅ MEJORA: Almacenar en cache
      this.cache.set(cacheKey, {
        data: product,
        timestamp: Date.now(),
      });

      return product;
    } catch (error) {
      logger.error("Error encontrando producto por ID", {
        id,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al buscar producto: ${error.message}`);
    }
  }

  /**
   * ✅ ENCONTRAR PRODUCTO POR SKU CON VALIDACIÓN
   * @param {String} sku - SKU del producto
   * @param {Boolean} includeInventory - Incluir inventario
   * @returns {Object} Producto encontrado
   */
  static async findBySKU(sku, includeInventory = true) {
    try {
      if (!sku || typeof sku !== "string") {
        throw new Error("SKU inválido");
      }

      let sql = `
        SELECT 
          p.*, 
          c.name as category_name,
          s.name as supplier_name,
          u.name as created_by_name
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN suppliers s ON p.supplier_id = s.id 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.sku = ? AND p.deleted_at IS NULL
      `;

      const [product] = await query(sql, [sku.trim().toUpperCase()]);

      if (!product) {
        return null;
      }

      // ✅ MEJORA: Incluir información de inventario si se solicita
      if (includeInventory) {
        try {
          // Importación dinámica para evitar dependencias circulares
          const Inventory = require("./Inventory");
          const inventoryHistory = await Inventory.getHistoryByProduct(
            product.id,
            { limit: 10 },
          );
          const stockInfo = await Inventory.getCurrentStock(product.id);

          product.current_stock_info = stockInfo;
          product.recent_movements = inventoryHistory;
        } catch (invError) {
          logger.warn("Error obteniendo información de inventario", {
            productId: product.id,
            error: invError.message,
          });
        }
      }

      return product;
    } catch (error) {
      logger.error("Error encontrando producto por SKU", {
        sku,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al buscar producto por SKU: ${error.message}`);
    }
  }

  /**
   * ✅ ACTUALIZAR PRODUCTO CON VALIDACIÓN COMPLETA
   * @param {Number} id - ID del producto
   * @param {Object} productData - Datos a actualizar
   * @param {Number} userId - ID del usuario que actualiza
   * @returns {Object} Producto actualizado
   */
  static async update(id, productData, userId) {
    try {
      // ✅ MEJORA: Verificar que el producto existe
      const existingProduct = await this.findById(id);
      if (!existingProduct) {
        throw new Error("Producto no encontrado");
      }

      // ✅ MEJORA: Validar datos de actualización
      const updateSchema = productSchema.fork(
        Object.keys(productSchema.describe().keys),
        (schema) => schema.optional(),
      );
      const { error, value: validatedData } =
        updateSchema.validate(productData);

      if (error) {
        throw new Error(
          `Validación fallida: ${error.details.map((d) => d.message).join(", ")}`,
        );
      }

      // ✅ MEJORA: Usar transacción
      await executeInTransaction(async (connection) => {
        const updates = [];
        const values = [];

        // ✅ MEJORA: Campos actualizables con validación
        const allowedFields = [
          "name",
          "description",
          "category_id",
          "supplier_id",
          "price",
          "cost",
          "min_stock",
          "max_stock",
          "unit",
          "weight",
          "dimensions",
          "barcode",
          "status",
        ];

        allowedFields.forEach((field) => {
          if (validatedData[field] !== undefined) {
            updates.push(`${field} = ?`);
            values.push(validatedData[field]);
          }
        });

        // ✅ MEJORA: Registrar quién actualizó
        updates.push("updated_at = NOW()");
        updates.push("updated_by = ?");
        values.push(userId);
        values.push(id);

        const sql = `UPDATE products SET ${updates.join(", ")} WHERE id = ? AND deleted_at IS NULL`;
        const [result] = await connection.execute(sql, values);

        if (result.affectedRows === 0) {
          throw new Error("Producto no encontrado o ya eliminado");
        }

        // ✅ MEJORA: Registrar cambios en log de auditoría
        const changes = {};
        allowedFields.forEach((field) => {
          if (
            validatedData[field] !== undefined &&
            validatedData[field] !== existingProduct[field]
          ) {
            changes[field] = {
              from: existingProduct[field],
              to: validatedData[field],
            };
          }
        });

        if (Object.keys(changes).length > 0) {
          await connection.execute(
            "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
            ["UPDATE", "PRODUCT", id, userId, JSON.stringify(changes)],
          );
        }

        return result;
      });

      logger.info("Producto actualizado exitosamente", {
        productId: id,
        userId,
        updatedFields: Object.keys(productData),
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache(id);

      return await this.findById(id);
    } catch (error) {
      logger.error("Error actualizando producto", {
        id,
        error: error.message,
        userId,
        stack: error.stack,
      });

      throw new Error(`Error al actualizar producto: ${error.message}`);
    }
  }

  /**
   * ✅ ELIMINAR PRODUCTO CON VALIDACIONES DE SEGURIDAD
   * @param {Number} id - ID del producto
   * @param {Number} userId - ID del usuario que elimina
   * @param {Boolean} force - Forzar eliminación
   * @returns {Boolean} Éxito de la operación
   */
  static async delete(id, userId, force = false) {
    try {
      // ✅ MEJORA: Verificar que el producto existe
      const product = await this.findById(id);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      // ✅ MEJORA: Validaciones de seguridad
      if (!force) {
        // Verificar si tiene stock
        if (product.current_stock > 0) {
          throw new Error(
            "No se puede eliminar un producto con stock. Usa force=true para forzar la eliminación.",
          );
        }

        // Verificar si tiene movimientos de inventario
        const hasMovements = await this.hasInventoryMovements(id);
        if (hasMovements) {
          throw new Error(
            "No se puede eliminar un producto con historial de inventario. Usa force=true para forzar la eliminación.",
          );
        }

        // Verificar si tiene QRs asociados
        if (product.qr_count > 0) {
          throw new Error(
            "No se puede eliminar un producto con códigos QR asociados. Usa force=true para forzar la eliminación.",
          );
        }
      }

      // ✅ MEJORA: Usar transacción
      await executeInTransaction(async (connection) => {
        // ✅ MEJORA: Si es force delete, eliminar realmente
        if (force) {
          const deleteSql = "DELETE FROM products WHERE id = ?";
          await connection.execute(deleteSql, [id]);

          // También eliminar relaciones
          await connection.execute(
            "DELETE FROM inventory_movements WHERE product_id = ?",
            [id],
          );
          await connection.execute("DELETE FROM qrcodes WHERE product_id = ?", [
            id,
          ]);
          await connection.execute(
            "DELETE FROM product_images WHERE product_id = ?",
            [id],
          );
        } else {
          // Soft delete
          const sql =
            "UPDATE products SET deleted_at = NOW(), deleted_by = ? WHERE id = ?";
          await connection.execute(sql, [userId, id]);
        }

        // ✅ MEJORA: Registrar eliminación en log
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            force ? "FORCE_DELETE" : "DELETE",
            "PRODUCT",
            id,
            userId,
            JSON.stringify({
              name: product.name,
              sku: product.sku,
            }),
          ],
        );
      });

      logger.info("Producto eliminado exitosamente", {
        productId: id,
        userId,
        force,
        productName: product.name,
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache(id);

      return true;
    } catch (error) {
      logger.error("Error eliminando producto", {
        id,
        error: error.message,
        userId,
        force,
        stack: error.stack,
      });

      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }

  /**
   * ✅ OBTENER PRODUCTOS CON FILTROS AVANZADOS Y PAGINACIÓN
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Object} Lista paginada de productos
   */
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          p.*, 
          c.name as category_name,
          s.name as supplier_name,
          (
            SELECT COUNT(*) 
            FROM product_images pi 
            WHERE pi.product_id = p.id AND pi.deleted_at IS NULL
          ) as image_count,
          (
            SELECT COUNT(*) 
            FROM qrcodes q 
            WHERE q.product_id = p.id AND q.deleted_at IS NULL
          ) as qr_count,
          (
            SELECT im.created_at
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            ORDER BY im.created_at DESC 
            LIMIT 1
          ) as last_movement_date
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN suppliers s ON p.supplier_id = s.id 
        WHERE p.deleted_at IS NULL
      `;

      const params = [];
      const whereConditions = [];

      // ✅ MEJORA: Filtros avanzados con seguridad
      if (filters.categoryId) {
        whereConditions.push("p.category_id = ?");
        params.push(parseInt(filters.categoryId));
      }

      if (filters.supplierId) {
        whereConditions.push("p.supplier_id = ?");
        params.push(parseInt(filters.supplierId));
      }

      if (filters.status) {
        whereConditions.push("p.status = ?");
        params.push(filters.status);
      }

      if (filters.minPrice) {
        whereConditions.push("p.price >= ?");
        params.push(parseFloat(filters.minPrice));
      }

      if (filters.maxPrice) {
        whereConditions.push("p.price <= ?");
        params.push(parseFloat(filters.maxPrice));
      }

      if (filters.stockStatus) {
        switch (filters.stockStatus) {
          case "low":
            whereConditions.push(
              "p.current_stock <= p.min_stock AND p.min_stock > 0",
            );
            break;
          case "out":
            whereConditions.push("p.current_stock = 0");
            break;
          case "over":
            whereConditions.push(
              "p.current_stock >= p.max_stock AND p.max_stock > 0",
            );
            break;
          case "normal":
            whereConditions.push(
              "p.current_stock > p.min_stock AND p.current_stock < p.max_stock",
            );
            break;
        }
      }

      if (filters.search) {
        whereConditions.push(
          "(p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ? OR p.barcode LIKE ?)",
        );
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Aplicar condiciones WHERE
      if (whereConditions.length > 0) {
        sql += " AND " + whereConditions.join(" AND ");
      }

      // ✅ MEJORA: Ordenamiento dinámico seguro
      const sortField = filters.sortBy || "p.created_at";
      const sortOrder = filters.sortOrder || "DESC";
      const validSortFields = [
        "name",
        "sku",
        "price",
        "current_stock",
        "created_at",
        "updated_at",
      ];

      if (validSortFields.includes(sortField.replace("p.", ""))) {
        sql += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        sql += " ORDER BY p.created_at DESC";
      }

      // ✅ MEJORA: Paginación con límites seguros
      const limit = Math.min(filters.limit || 20, 100);
      const page = Math.max(filters.page || 1, 1);
      const offset = (page - 1) * limit;

      sql += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const products = await query(sql, params);

      // ✅ MEJORA: Obtener total para paginación
      const countSql = sql
        .replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
        .replace(/ORDER BY[\s\S]*/, "")
        .replace(/LIMIT[\s\S]*/, "");
      const [countResult] = await query(countSql, params.slice(0, -2)); // Excluir limit y offset
      const total = countResult.total || 0;

      // ✅ MEJORA: Formatear datos
      const formattedProducts = products.map((product) => ({
        ...product,
        status_display: this.getStatusDisplay(product.status),
        price_formatted: `$${parseFloat(product.price || 0).toFixed(2)}`,
        cost_formatted: `$${parseFloat(product.cost || 0).toFixed(2)}`,
        inventory_value: (product.current_stock * (product.cost || 0)).toFixed(
          2,
        ),
        stock_status: this.getStockStatus(
          product.current_stock,
          product.min_stock,
          product.max_stock,
        ),
      }));

      return {
        data: formattedProducts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error obteniendo productos", {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al obtener productos: ${error.message}`);
    }
  }

  /**
   * ✅ BUSCAR PRODUCTOS CON BÚSQUEDA TEXTUAL AVANZADA
   * @param {String} term - Término de búsqueda
   * @param {Object} filters - Filtros adicionales
   * @returns {Array} Productos encontrados
   */
  static async search(term, filters = {}) {
    try {
      if (!term || term.trim().length < 2) {
        return [];
      }

      const searchTerm = `%${term.trim()}%`;

      let sql = `
        SELECT 
          p.*, 
          c.name as category_name,
          MATCH(p.name, p.description, p.sku) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        WHERE p.deleted_at IS NULL 
        AND (
          MATCH(p.name, p.description, p.sku) AGAINST(? IN NATURAL LANGUAGE MODE)
          OR p.name LIKE ?
          OR p.sku LIKE ?
          OR p.description LIKE ?
          OR p.barcode LIKE ?
        )
      `;

      const params = [
        term,
        term,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      ];

      if (filters.categoryId) {
        sql += " AND p.category_id = ?";
        params.push(filters.categoryId);
      }

      if (filters.status) {
        sql += " AND p.status = ?";
        params.push(filters.status);
      }

      if (filters.inStockOnly) {
        sql += " AND p.current_stock > 0";
      }

      sql += " ORDER BY relevance DESC, p.created_at DESC";

      if (filters.limit) {
        const limit = Math.min(filters.limit, 100);
        sql += " LIMIT ?";
        params.push(limit);
      }

      const products = await query(sql, params);

      return products.map((product) => ({
        ...product,
        status_display: this.getStatusDisplay(product.status),
        price_formatted: `$${parseFloat(product.price || 0).toFixed(2)}`,
      }));
    } catch (error) {
      logger.error("Error buscando productos", {
        term,
        filters,
        error: error.message,
      });
      throw new Error(`Error en búsqueda de productos: ${error.message}`);
    }
  }

  /**
   * ✅ CONTAR PRODUCTOS CON FILTROS
   * @param {Object} filters - Filtros de conteo
   * @returns {Number} Total de productos
   */
  static async count(filters = {}) {
    try {
      let sql =
        "SELECT COUNT(*) as total FROM products WHERE deleted_at IS NULL";
      const params = [];
      const whereConditions = [];

      if (filters.categoryId) {
        whereConditions.push("category_id = ?");
        params.push(filters.categoryId);
      }

      if (filters.supplierId) {
        whereConditions.push("supplier_id = ?");
        params.push(filters.supplierId);
      }

      if (filters.status) {
        whereConditions.push("status = ?");
        params.push(filters.status);
      }

      if (filters.search) {
        whereConditions.push(
          "(name LIKE ? OR sku LIKE ? OR description LIKE ?)",
        );
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (whereConditions.length > 0) {
        sql += " AND " + whereConditions.join(" AND ");
      }

      const [result] = await query(sql, params);
      return result.total || 0;
    } catch (error) {
      logger.error("Error contando productos", {
        filters,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * ✅ OBTENER PRODUCTOS CON STOCK BAJO
   * @param {Number} threshold - Umbral de stock bajo (0.5 = 50%)
   * @returns {Array} Productos con stock bajo
   */
  static async getLowStock(threshold = 0.5) {
    try {
      const sql = `
        SELECT 
          p.*, 
          c.name as category_name,
          s.name as supplier_name,
          ROUND((p.current_stock / NULLIF(p.min_stock, 0)) * 100, 2) as stock_percentage,
          CASE 
            WHEN p.current_stock = 0 THEN 0
            WHEN p.min_stock = 0 THEN 100
            ELSE ROUND((p.current_stock / p.min_stock) * 100, 2)
          END as coverage_percentage,
          GREATEST(p.min_stock - p.current_stock, 0) as needed_stock,
          (
            SELECT im.created_at
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type IN ('in', 'return')
            ORDER BY im.created_at DESC 
            LIMIT 1
          ) as last_restock_date
        FROM products p 
        LEFT JOIN categories c ON p.category_id = c.id 
        LEFT JOIN suppliers s ON p.supplier_id = s.id 
        WHERE p.deleted_at IS NULL 
        AND p.min_stock > 0
        AND p.current_stock <= (p.min_stock * ?)
        ORDER BY coverage_percentage ASC, p.current_stock ASC
        LIMIT 50
      `;

      const products = await query(sql, [threshold]);

      return products.map((product) => ({
        ...product,
        status_display: this.getStatusDisplay(product.status),
        price_formatted: `$${parseFloat(product.price || 0).toFixed(2)}`,
        critical: product.stock_percentage < 0.2,
      }));
    } catch (error) {
      logger.error("Error obteniendo productos con stock bajo", {
        threshold,
        error: error.message,
      });
      throw new Error(
        `Error al obtener productos con stock bajo: ${error.message}`,
      );
    }
  }

  /**
   * ✅ OBTENER ESTADÍSTICAS DEL PRODUCTO
   * @param {Number} productId - ID del producto
   * @returns {Object} Estadísticas del producto
   */
  static async getProductStats(productId) {
    try {
      const sql = `
        SELECT 
          p.current_stock,
          p.min_stock,
          p.max_stock,
          p.price,
          p.cost,
          (
            SELECT COUNT(*) 
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type = 'in'
            AND DATE(im.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as movements_in_30_days,
          (
            SELECT COUNT(*) 
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type = 'out'
            AND DATE(im.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as movements_out_30_days,
          (
            SELECT COALESCE(SUM(quantity), 0)
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type = 'in'
            AND DATE(im.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as quantity_in_30_days,
          (
            SELECT COALESCE(SUM(quantity), 0)
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            AND im.movement_type = 'out'
            AND DATE(im.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as quantity_out_30_days,
          (
            SELECT im.created_at
            FROM inventory_movements im 
            WHERE im.product_id = p.id 
            ORDER BY im.created_at DESC 
            LIMIT 1
          ) as last_movement_date,
          ROUND((p.cost * p.current_stock), 2) as inventory_value,
          ROUND((p.price * p.current_stock), 2) as potential_revenue,
          (
            SELECT COUNT(*)
            FROM qrcodes q 
            WHERE q.product_id = p.id 
            AND q.deleted_at IS NULL
          ) as qr_count,
          (
            SELECT COUNT(*)
            FROM transaction_items ti
            INNER JOIN transactions t ON ti.transaction_id = t.id
            WHERE ti.product_id = p.id
            AND t.type = 'sale'
            AND DATE(t.created_at) >= DATE_SUB(NOW(), INTERVAL 30 DAY)
          ) as sales_count_30_days
        FROM products p 
        WHERE p.id = ?
      `;

      const [stats] = await query(sql, [productId]);
      return stats || {};
    } catch (error) {
      logger.error("Error obteniendo estadísticas del producto", {
        productId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * ✅ VERIFICAR SI PRODUCTO TIENE MOVIMIENTOS DE INVENTARIO
   * @param {Number} productId - ID del producto
   * @returns {Boolean} Tiene movimientos
   */
  static async hasInventoryMovements(productId) {
    try {
      const sql =
        "SELECT COUNT(*) as count FROM inventory_movements WHERE product_id = ?";
      const [result] = await query(sql, [productId]);
      return result.count > 0;
    } catch (error) {
      logger.error("Error verificando movimientos de inventario", {
        productId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * ✅ GENERAR SKU ÚNICO MEJORADO
   * @param {String} name - Nombre del producto
   * @param {Number} categoryId - ID de la categoría
   * @returns {String} SKU único
   */
  static async generateUniqueSKU(name, categoryId) {
    try {
      if (!name || name.trim().length < 2) {
        throw new Error("Nombre del producto inválido");
      }

      let baseSKU = generateSKU(name, categoryId);
      let sku = baseSKU.toUpperCase();
      let counter = 1;

      // Verificar si el SKU ya existe
      while (await this.findBySKU(sku)) {
        sku = `${baseSKU.toUpperCase()}-${counter}`;
        counter++;

        if (counter > 100) {
          throw new Error(
            "No se pudo generar un SKU único después de 100 intentos",
          );
        }
      }

      return sku;
    } catch (error) {
      logger.error("Error generando SKU único", {
        name,
        categoryId,
        error: error.message,
      });
      throw new Error(`Error al generar SKU: ${error.message}`);
    }
  }

  /**
   * ✅ ACTUALIZAR STOCK CON VALIDACIÓN
   * @param {Number} productId - ID del producto
   * @param {Number} newStock - Nuevo stock
   * @param {String} reason - Razón del ajuste
   * @param {Number} userId - ID del usuario
   * @returns {Object} Resultado del ajuste
   */
  static async updateStock(
    productId,
    newStock,
    reason = "Ajuste manual",
    userId = null,
  ) {
    try {
      if (newStock < 0) {
        throw new Error("El stock no puede ser negativo");
      }

      const product = await this.findById(productId);
      if (!product) {
        throw new Error("Producto no encontrado");
      }

      const difference = newStock - product.current_stock;

      // ✅ MEJORA: Usar transacción
      await executeInTransaction(async (connection) => {
        // Actualizar stock del producto
        const updateSql =
          "UPDATE products SET current_stock = ?, updated_at = NOW() WHERE id = ?";
        await connection.execute(updateSql, [newStock, productId]);

        // Crear movimiento de ajuste
        if (difference !== 0) {
          const movementType = difference > 0 ? "in" : "out";
          const quantity = Math.abs(difference);

          await connection.execute(
            `INSERT INTO inventory_movements (
              product_id, quantity, movement_type, notes, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, NOW())`,
            [
              productId,
              quantity,
              movementType,
              `${reason}: ${difference > 0 ? "+" : ""}${difference} unidades`,
              userId,
            ],
          );
        }
      });

      logger.info("Stock actualizado exitosamente", {
        productId,
        previousStock: product.current_stock,
        newStock,
        difference,
        userId,
        reason,
      });

      // Limpiar cache
      this.clearCache(productId);

      return {
        productId,
        previousStock: product.current_stock,
        newStock,
        difference,
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error actualizando stock", {
        productId,
        newStock,
        error: error.message,
      });

      throw new Error(`Error al actualizar stock: ${error.message}`);
    }
  }

  /**
   * ✅ IMPORTAR PRODUCTOS MASIVAMENTE CON VALIDACIÓN
   * @param {Array} productsData - Datos de productos
   * @param {Number} userId - ID del usuario
   * @returns {Object} Resultado de la importación
   */
  static async bulkImport(productsData, userId) {
    try {
      if (!Array.isArray(productsData) || productsData.length === 0) {
        throw new Error("Datos de productos inválidos");
      }

      if (productsData.length > 1000) {
        throw new Error("No se pueden importar más de 1000 productos a la vez");
      }

      const results = [];
      const batchSize = 100;

      // ✅ MEJORA: Procesar en lotes para mejor rendimiento
      for (let i = 0; i < productsData.length; i += batchSize) {
        const batch = productsData.slice(i, i + batchSize);

        await executeInTransaction(async (connection) => {
          for (const productData of batch) {
            try {
              // Validar datos del producto
              const { error: validationError, value: validatedData } =
                productSchema.validate(productData);
              if (validationError) {
                throw new Error(
                  `Validación fallida: ${validationError.details.map((d) => d.message).join(", ")}`,
                );
              }

              // Generar SKU único
              const sku =
                validatedData.sku ||
                (await this.generateUniqueSKU(
                  validatedData.name,
                  validatedData.categoryId,
                ));

              // Verificar si SKU ya existe
              const existingProduct = await this.findBySKU(sku);
              if (existingProduct) {
                throw new Error(`SKU ${sku} ya existe`);
              }

              // Insertar producto
              const sql = `
                INSERT INTO products (
                  name, description, sku, category_id, price, cost,
                  min_stock, max_stock, current_stock, unit, status, created_by, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
              `;

              const [result] = await connection.execute(sql, [
                validatedData.name,
                validatedData.description || "",
                sku,
                validatedData.categoryId || null,
                validatedData.price || 0,
                validatedData.cost || 0,
                validatedData.minStock || 0,
                validatedData.maxStock || 1000,
                validatedData.currentStock || 0,
                validatedData.unit || "unidad",
                validatedData.status || this.STATUS.ACTIVE,
                userId,
              ]);

              results.push({
                name: validatedData.name,
                sku,
                success: true,
                productId: result.insertId,
              });
            } catch (error) {
              results.push({
                name: productData.name || "Desconocido",
                success: false,
                error: error.message,
              });
              logger.warn("Error importando producto", {
                productName: productData.name,
                error: error.message,
              });
            }
          }
        });
      }

      // Limpiar cache después de importación masiva
      this.clearCache();

      return {
        processed: productsData.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
        results,
      };
    } catch (error) {
      logger.error("Error en importación masiva de productos", {
        error: error.message,
        userId,
        productsCount: productsData.length,
      });

      throw new Error(`Error en importación masiva: ${error.message}`);
    }
  }

  /**
   * ✅ OBTENER PRODUCTOS MÁS VENDIDOS
   * @param {Number} limit - Límite de resultados
   * @param {Number} days - Días a considerar
   * @returns {Array} Productos más vendidos
   */
  static async getTopSelling(limit = 10, days = 30) {
    try {
      const sql = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.price,
          p.cost,
          p.current_stock,
          c.name as category_name,
          COUNT(DISTINCT t.id) as sale_count,
          COALESCE(SUM(ti.quantity), 0) as total_sold,
          COALESCE(SUM(ti.quantity * p.price), 0) as total_revenue,
          COALESCE(SUM(ti.quantity * p.cost), 0) as total_cost,
          ROUND(COALESCE(SUM(ti.quantity * p.price), 0) - COALESCE(SUM(ti.quantity * p.cost), 0), 2) as total_profit
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN transaction_items ti ON p.id = ti.product_id
        LEFT JOIN transactions t ON ti.transaction_id = t.id
          AND t.type = 'SALE'
          AND t.status = 'completed'
          AND t.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        WHERE p.deleted_at IS NULL
        GROUP BY p.id, p.name, p.sku, p.price, p.cost, p.current_stock, c.name
        ORDER BY total_sold DESC, total_revenue DESC
        LIMIT ?
      `;

      const products = await query(sql, [days, limit]);

      return products.map((product) => ({
        ...product,
        price_formatted: `$${parseFloat(product.price || 0).toFixed(2)}`,
        profit_margin:
          product.total_revenue > 0
            ? ((product.total_profit / product.total_revenue) * 100).toFixed(2)
            : "0.00",
      }));
    } catch (error) {
      logger.error("Error obteniendo productos más vendidos", {
        limit,
        days,
        error: error.message,
      });
      throw new Error(
        `Error al obtener productos más vendidos: ${error.message}`,
      );
    }
  }

  /**
   * ✅ MÉTODOS HELPER MEJORADOS
   */

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL ESTADO
   * @param {String} status - Estado del producto
   * @returns {String} Texto descriptivo
   */
  static getStatusDisplay(status) {
    const statusMap = {
      active: "🟢 Activo",
      inactive: "⚪ Inactivo",
      discontinued: "🔴 Descontinuado",
      draft: "📝 Borrador",
    };

    return statusMap[status] || status;
  }

  /**
   * OBTENER ESTADO DEL STOCK
   * @param {Number} current - Stock actual
   * @param {Number} min - Stock mínimo
   * @param {Number} max - Stock máximo
   * @returns {String} Estado del stock
   */
  static getStockStatus(current, min, max) {
    if (current === 0) return "agotado";
    if (min > 0 && current <= min) return "bajo";
    if (max > 0 && current >= max) return "exceso";
    if (min > 0 && current > min && (max === 0 || current < max))
      return "normal";
    return "sin límites";
  }

  /**
   * LIMPIAR CACHE DEL PRODUCTO
   * @param {Number} productId - ID del producto (opcional)
   */
  static clearCache(productId = null) {
    if (productId) {
      // Eliminar entradas específicas del producto
      for (const key of this.cache.keys()) {
        if (key.includes(`product_${productId}`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Limpiar todo el cache
      this.cache.clear();
    }

    logger.debug("Cache limpiado", {
      productId,
      cacheSize: this.cache.size,
    });
  }

  /**
   * ✅ EXPORTAR PRODUCTOS A FORMATO ESTRUCTURADO
   * @param {Array} productIds - IDs de productos a exportar
   * @returns {Object} Datos exportados
   */
  static async exportProducts(productIds = []) {
    try {
      let whereClause = "";
      const params = [];

      if (Array.isArray(productIds) && productIds.length > 0) {
        whereClause = "WHERE p.id IN (?)";
        params.push(productIds);
      }

      const sql = `
        SELECT 
          p.*,
          c.name as category_name,
          s.name as supplier_name,
          u.name as created_by_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN suppliers s ON p.supplier_id = s.id
        LEFT JOIN users u ON p.created_by = u.id
        ${whereClause}
        ORDER BY p.created_at DESC
      `;

      const products = await query(sql, params);

      // Formatear datos para exportación
      const exportData = products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        sku: product.sku,
        barcode: product.barcode,
        category: product.category_name,
        supplier: product.supplier_name,
        price: product.price,
        cost: product.cost,
        stock: {
          current: product.current_stock,
          minimum: product.min_stock,
          maximum: product.max_stock,
          unit: product.unit,
        },
        status: product.status,
        created_by: product.created_by_name,
        created_at: product.created_at,
        updated_at: product.updated_at,
      }));

      return {
        success: true,
        count: exportData.length,
        data: exportData,
        exported_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error exportando productos", {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = Product;
