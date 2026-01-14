/**
 * ✅ MODELO MEJORADO DE TRANSACCIÓN
 * Archivo: models/Transaction.js
 *
 * Correcciones aplicadas:
 * 1. ✅ Corregida importación de transacciones
 * 2. ✅ Validaciones robustas con Joi
 * 3. ✅ Manejo de stock e inventario mejorado
 * 4. ✅ Transacciones atómicas mejoradas
 * 5. ✅ Cache para consultas frecuentes
 * 6. ✅ Estadísticas avanzadas
 * 7. ✅ Integración con Product e Inventory
 * 8. ✅ Auditoría completa
 */

const { query, executeInTransaction } = require("../config/database");
const Joi = require("joi");

// ✅ MEJORA: Logger estructurado
const logger = {
  info: (message, meta) => console.log(`[TRX INFO] ${message}`, meta || ""),
  error: (message, meta) => console.error(`[TRX ERROR] ${message}`, meta || ""),
  warn: (message, meta) => console.warn(`[TRX WARN] ${message}`, meta || ""),
  debug: (message, meta) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[TRX DEBUG] ${message}`, meta || "");
    }
  },
};

/**
 * ✅ ESQUEMA DE VALIDACIÓN PARA TRANSACCIONES
 */
const transactionSchema = Joi.object({
  type: Joi.string()
    .valid("sale", "purchase", "return", "adjustment", "transfer", "damage")
    .required(),
  reference: Joi.string().max(50).allow("", null),
  customerId: Joi.number().integer().min(1).allow(null),
  supplierId: Joi.number().integer().min(1).allow(null),
  items: Joi.array()
    .items(
      Joi.object({
        productId: Joi.number().integer().min(1).required(),
        quantity: Joi.number().integer().min(1).required(),
        price: Joi.number().precision(2).min(0).required(),
        discount: Joi.number().precision(2).min(0).max(100).default(0),
        notes: Joi.string().max(500).allow("", null),
      }),
    )
    .min(1)
    .required(),
  paymentMethod: Joi.string()
    .valid("cash", "card", "transfer", "credit", "check", "digital")
    .default("cash"),
  paymentStatus: Joi.string()
    .valid("pending", "paid", "partial", "failed", "refunded")
    .default("pending"),
  status: Joi.string()
    .valid(
      "pending",
      "completed",
      "cancelled",
      "refunded",
      "partially_refunded",
    )
    .default("pending"),
  notes: Joi.string().max(1000).allow("", null),
  location: Joi.string().max(100).allow("", null),
  metadata: Joi.object().allow(null),
});

/**
 * ✅ ESQUEMA DE ACTUALIZACIÓN DE TRANSACCIÓN
 */
const transactionUpdateSchema = Joi.object({
  customerId: Joi.number().integer().min(1).allow(null),
  supplierId: Joi.number().integer().min(1).allow(null),
  paymentMethod: Joi.string().valid(
    "cash",
    "card",
    "transfer",
    "credit",
    "check",
    "digital",
  ),
  paymentStatus: Joi.string().valid(
    "pending",
    "paid",
    "partial",
    "failed",
    "refunded",
  ),
  status: Joi.string().valid(
    "pending",
    "completed",
    "cancelled",
    "refunded",
    "partially_refunded",
  ),
  notes: Joi.string().max(1000).allow("", null),
  metadata: Joi.object().allow(null),
});

/**
 * ✅ CLASE MEJORADA DE TRANSACCIÓN
 * Con validaciones de stock y transacciones atómicas
 */
class Transaction {
  // ✅ MEJORA: Tipos de transacción definidos como constantes
  static TYPES = Object.freeze({
    SALE: "sale",
    PURCHASE: "purchase",
    RETURN: "return",
    ADJUSTMENT: "adjustment",
    TRANSFER: "transfer",
    DAMAGE: "damage",
  });

  // ✅ MEJORA: Métodos de pago
  static PAYMENT_METHODS = Object.freeze({
    CASH: "cash",
    CARD: "card",
    TRANSFER: "transfer",
    CREDIT: "credit",
    CHECK: "check",
    DIGITAL: "digital",
  });

  // ✅ MEJORA: Estados de transacción
  static STATUS = Object.freeze({
    PENDING: "pending",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    REFUNDED: "refunded",
    PARTIALLY_REFUNDED: "partially_refunded",
  });

  // ✅ MEJORA: Cache para transacciones frecuentes
  static cache = new Map();
  static CACHE_TTL = 180000; // 3 minutos

  /**
   * ✅ CREAR TRANSACCIÓN CON VALIDACIÓN COMPLETA
   * @param {Object} transactionData - Datos de la transacción
   * @param {Number} userId - ID del usuario
   * @returns {Object} Transacción creada
   */
  static async create(transactionData, userId) {
    try {
      // ✅ MEJORA: Validar datos con Joi
      const { error, value: validatedData } =
        transactionSchema.validate(transactionData);
      if (error) {
        throw new Error(
          `Validación fallida: ${error.details.map((d) => d.message).join(", ")}`,
        );
      }

      // ✅ MEJORA: Verificar productos y stock
      await this.validateTransactionItems(
        validatedData.items,
        validatedData.type,
      );

      // ✅ MEJORA: Usar transacción para operaciones atómicas
      const result = await executeInTransaction(async (connection) => {
        // ✅ MEJORA: Calcular totales
        let totalAmount = 0;
        let totalItems = 0;
        let totalDiscount = 0;

        validatedData.items.forEach((item) => {
          const itemTotal = item.quantity * item.price;
          const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
          totalAmount += itemTotal - itemDiscount;
          totalItems += item.quantity;
          totalDiscount += itemDiscount;
        });

        // ✅ MEJORA: Generar referencia única
        const reference =
          validatedData.reference ||
          (await this.generateReference(validatedData.type));

        // ✅ MEJORA: Insertar transacción principal
        const transactionSql = `
          INSERT INTO transactions (
            type,
            reference,
            customer_id,
            supplier_id,
            total_amount,
            total_discount,
            total_items,
            payment_method,
            payment_status,
            status,
            notes,
            location,
            metadata,
            created_by,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [transactionResult] = await connection.execute(transactionSql, [
          validatedData.type,
          reference,
          validatedData.customerId || null,
          validatedData.supplierId || null,
          totalAmount,
          totalDiscount,
          totalItems,
          validatedData.paymentMethod || this.PAYMENT_METHODS.CASH,
          validatedData.paymentStatus || "pending",
          validatedData.status || this.STATUS.PENDING,
          validatedData.notes || "",
          validatedData.location || null,
          validatedData.metadata
            ? JSON.stringify(validatedData.metadata)
            : null,
          userId,
        ]);

        const transactionId = transactionResult.insertId;

        // ✅ MEJORA: Insertar items de transacción
        for (const item of validatedData.items) {
          const itemTotal = item.quantity * item.price;
          const itemDiscount = (itemTotal * (item.discount || 0)) / 100;
          const itemNetTotal = itemTotal - itemDiscount;

          const itemSql = `
            INSERT INTO transaction_items (
              transaction_id,
              product_id,
              quantity,
              unit_price,
              discount_percent,
              discount_amount,
              total_price,
              net_price,
              notes,
              created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
          `;

          await connection.execute(itemSql, [
            transactionId,
            item.productId,
            item.quantity,
            item.price,
            item.discount || 0,
            itemDiscount,
            itemTotal,
            itemNetTotal,
            item.notes || "",
          ]);

          // ✅ MEJORA: Registrar movimiento de inventario
          await this.processInventoryMovement(
            connection,
            transactionId,
            item.productId,
            item.quantity,
            validatedData.type,
            reference,
            validatedData.notes,
            userId,
            validatedData.location,
          );
        }

        // ✅ MEJORA: Registrar en log de auditoría
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            "CREATE",
            "TRANSACTION",
            transactionId,
            userId,
            JSON.stringify({
              type: validatedData.type,
              reference,
              totalAmount,
              totalItems,
              totalDiscount,
              customerId: validatedData.customerId,
              supplierId: validatedData.supplierId,
            }),
          ],
        );

        return {
          transactionId,
          reference,
          totalAmount,
          totalItems,
          totalDiscount,
        };
      });

      logger.info("Transacción creada exitosamente", {
        transactionId: result.transactionId,
        type: validatedData.type,
        reference: result.reference,
        totalAmount: result.totalAmount,
        totalItems: result.totalItems,
        userId,
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache();

      return {
        id: result.transactionId,
        ...validatedData,
        reference: result.reference,
        totalAmount: result.totalAmount,
        totalItems: result.totalItems,
        totalDiscount: result.totalDiscount,
        createdBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error creando transacción", {
        error: error.message,
        transactionType: transactionData.type,
        userId,
        stack: error.stack,
      });

      throw new Error(`Error al crear transacción: ${error.message}`);
    }
  }

  /**
   * ✅ VALIDAR ITEMS DE TRANSACCIÓN
   * @param {Array} items - Items a validar
   * @param {String} type - Tipo de transacción
   */
  static async validateTransactionItems(items, type) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("La transacción debe contener al menos un item");
    }

    const Product = require("./Product");

    for (const item of items) {
      // Verificar producto
      const product = await Product.findById(item.productId);
      if (!product) {
        throw new Error(`Producto no encontrado: ${item.productId}`);
      }

      // Verificar stock para ventas
      if (type === this.TYPES.SALE && product.current_stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para producto: ${product.name}. Disponible: ${product.current_stock}, Solicitado: ${item.quantity}`,
        );
      }

      // Verificar precios
      if (item.price <= 0) {
        throw new Error(`Precio inválido para producto: ${product.name}`);
      }

      if (item.quantity <= 0) {
        throw new Error(`Cantidad inválida para producto: ${product.name}`);
      }
    }
  }

  /**
   * ✅ PROCESAR MOVIMIENTO DE INVENTARIO
   * @param {Object} connection - Conexión de transacción
   * @param {Number} transactionId - ID de transacción
   * @param {Number} productId - ID del producto
   * @param {Number} quantity - Cantidad
   * @param {String} type - Tipo de transacción
   * @param {String} reference - Referencia
   * @param {String} notes - Notas
   * @param {Number} userId - ID del usuario
   * @param {String} location - Ubicación
   */
  static async processInventoryMovement(
    connection,
    transactionId,
    productId,
    quantity,
    type,
    reference,
    notes,
    userId,
    location,
  ) {
    let movementType = null;
    let movementNotes = `Transacción ${type}: ${reference}`;

    switch (type) {
      case this.TYPES.SALE:
        movementType = "out";
        movementNotes = `Venta: ${reference}. ${notes || ""}`;
        break;
      case this.TYPES.PURCHASE:
        movementType = "in";
        movementNotes = `Compra: ${reference}. ${notes || ""}`;
        break;
      case this.TYPES.RETURN:
        movementType = "in"; // Devolución de cliente
        movementNotes = `Devolución: ${reference}. ${notes || ""}`;
        break;
      case this.TYPES.ADJUSTMENT:
        movementType = "adjustment";
        movementNotes = `Ajuste: ${reference}. ${notes || ""}`;
        break;
      case this.TYPES.DAMAGE:
        movementType = "damage";
        movementNotes = `Daño/Desperdicio: ${reference}. ${notes || ""}`;
        break;
      case this.TYPES.TRANSFER:
        movementType = "transfer";
        movementNotes = `Transferencia: ${reference}. ${notes || ""}`;
        break;
    }

    if (movementType) {
      // Registrar movimiento de inventario
      await connection.execute(
        `INSERT INTO inventory_movements (
          product_id, 
          transaction_id,
          quantity, 
          movement_type, 
          reference, 
          notes,
          location,
          created_by, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productId,
          transactionId,
          quantity,
          movementType,
          reference,
          movementNotes,
          location,
          userId,
        ],
      );

      // Actualizar stock del producto
      const stockChange =
        movementType === "in" || movementType === "return"
          ? quantity
          : -quantity;
      await connection.execute(
        "UPDATE products SET current_stock = current_stock + ?, updated_at = NOW() WHERE id = ?",
        [stockChange, productId],
      );
    }
  }

  /**
   * ✅ ENCONTRAR TRANSACCIÓN POR ID CON CACHE
   * @param {Number} id - ID de la transacción
   * @param {Boolean} includeItems - Incluir items
   * @returns {Object} Transacción encontrada
   */
  static async findById(id, includeItems = true) {
    try {
      // ✅ MEJORA: Verificar cache
      const cacheKey = `transaction_${id}_${includeItems}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug("Transacción recuperada del cache", { transactionId: id });
        return cached.data;
      }

      let sql = `
        SELECT 
          t.*,
          c.name as customer_name,
          c.email as customer_email,
          c.phone as customer_phone,
          s.name as supplier_name,
          s.email as supplier_email,
          s.phone as supplier_phone,
          u.name as created_by_name,
          u.email as created_by_email,
          (
            SELECT COUNT(*) 
            FROM transaction_items ti 
            WHERE ti.transaction_id = t.id
          ) as item_count,
          (
            SELECT SUM(ti.quantity) 
            FROM transaction_items ti 
            WHERE ti.transaction_id = t.id
          ) as total_quantity
        FROM transactions t 
        LEFT JOIN customers c ON t.customer_id = c.id AND c.deleted_at IS NULL
        LEFT JOIN suppliers s ON t.supplier_id = s.id AND s.deleted_at IS NULL
        LEFT JOIN users u ON t.created_by = u.id AND u.deleted_at IS NULL
        WHERE t.id = ? AND t.deleted_at IS NULL
      `;

      const [transaction] = await query(sql, [id]);

      if (!transaction) {
        return null;
      }

      // ✅ MEJORA: Parsear metadata
      if (transaction.metadata) {
        try {
          transaction.metadata = JSON.parse(transaction.metadata);
        } catch (e) {
          transaction.metadata = {};
        }
      }

      // ✅ MEJORA: Incluir items si se solicita
      if (includeItems) {
        const items = await this.getTransactionItems(id);
        transaction.items = items;
      }

      // ✅ MEJORA: Formatear datos
      transaction.type_display = this.getTypeDisplay(transaction.type);
      transaction.status_display = this.getStatusDisplay(transaction.status);
      transaction.payment_method_display = this.getPaymentMethodDisplay(
        transaction.payment_method,
      );
      transaction.total_amount_formatted = this.formatCurrency(
        transaction.total_amount,
      );
      transaction.total_discount_formatted = this.formatCurrency(
        transaction.total_discount,
      );
      transaction.created_relative = this.getRelativeTime(
        transaction.created_at,
      );

      // ✅ MEJORA: Almacenar en cache
      this.cache.set(cacheKey, {
        data: transaction,
        timestamp: Date.now(),
      });

      return transaction;
    } catch (error) {
      logger.error("Error encontrando transacción por ID", {
        id,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al buscar transacción: ${error.message}`);
    }
  }

  /**
   * ✅ OBTENER TODAS LAS TRANSACCIONES CON FILTROS
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Object} Lista paginada de transacciones
   */
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          t.*,
          c.name as customer_name,
          s.name as supplier_name,
          u.name as created_by_name,
          (
            SELECT COUNT(*) 
            FROM transaction_items ti 
            WHERE ti.transaction_id = t.id
          ) as item_count,
          (
            SELECT GROUP_CONCAT(p.name SEPARATOR ', ') 
            FROM transaction_items ti 
            LEFT JOIN products p ON ti.product_id = p.id 
            WHERE ti.transaction_id = t.id 
            LIMIT 3
          ) as product_names
        FROM transactions t 
        LEFT JOIN customers c ON t.customer_id = c.id AND c.deleted_at IS NULL
        LEFT JOIN suppliers s ON t.supplier_id = s.id AND s.deleted_at IS NULL
        LEFT JOIN users u ON t.created_by = u.id AND u.deleted_at IS NULL
        WHERE t.deleted_at IS NULL
      `;

      const params = [];
      const whereConditions = [];

      // ✅ MEJORA: Filtros avanzados
      if (filters.type) {
        whereConditions.push("t.type = ?");
        params.push(filters.type);
      }

      if (filters.customerId) {
        whereConditions.push("t.customer_id = ?");
        params.push(filters.customerId);
      }

      if (filters.supplierId) {
        whereConditions.push("t.supplier_id = ?");
        params.push(filters.supplierId);
      }

      if (filters.paymentMethod) {
        whereConditions.push("t.payment_method = ?");
        params.push(filters.paymentMethod);
      }

      if (filters.status) {
        whereConditions.push("t.status = ?");
        params.push(filters.status);
      }

      if (filters.paymentStatus) {
        whereConditions.push("t.payment_status = ?");
        params.push(filters.paymentStatus);
      }

      if (filters.minAmount) {
        whereConditions.push("t.total_amount >= ?");
        params.push(parseFloat(filters.minAmount));
      }

      if (filters.maxAmount) {
        whereConditions.push("t.total_amount <= ?");
        params.push(parseFloat(filters.maxAmount));
      }

      if (filters.startDate) {
        whereConditions.push("DATE(t.created_at) >= ?");
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        whereConditions.push("DATE(t.created_at) <= ?");
        params.push(filters.endDate);
      }

      if (filters.search) {
        whereConditions.push(
          "(t.reference LIKE ? OR c.name LIKE ? OR s.name LIKE ?)",
        );
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Aplicar condiciones WHERE
      if (whereConditions.length > 0) {
        sql += " AND " + whereConditions.join(" AND ");
      }

      // ✅ MEJORA: Ordenamiento seguro
      const sortField = filters.sortBy || "t.created_at";
      const sortOrder = filters.sortOrder || "DESC";
      const validSortFields = [
        "reference",
        "total_amount",
        "created_at",
        "updated_at",
        "type",
      ];

      if (validSortFields.includes(sortField.replace("t.", ""))) {
        sql += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        sql += " ORDER BY t.created_at DESC";
      }

      // ✅ MEJORA: Paginación segura
      const limit = Math.min(filters.limit || 50, 200);
      const page = Math.max(filters.page || 1, 1);
      const offset = (page - 1) * limit;

      sql += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const transactions = await query(sql, params);

      // ✅ MEJORA: Obtener total para paginación
      const countSql = sql
        .replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
        .replace(/ORDER BY[\s\S]*/, "")
        .replace(/LIMIT[\s\S]*/, "");
      const [countResult] = await query(countSql, params.slice(0, -2));
      const total = countResult.total || 0;

      // ✅ MEJORA: Formatear datos
      const formattedTransactions = transactions.map((transaction) => ({
        ...transaction,
        type_display: this.getTypeDisplay(transaction.type),
        status_display: this.getStatusDisplay(transaction.status),
        payment_method_display: this.getPaymentMethodDisplay(
          transaction.payment_method,
        ),
        total_amount_formatted: this.formatCurrency(transaction.total_amount),
        created_relative: this.getRelativeTime(transaction.created_at),
      }));

      return {
        data: formattedTransactions,
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
      logger.error("Error obteniendo transacciones", {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al obtener transacciones: ${error.message}`);
    }
  }

  /**
   * ✅ CANCELAR TRANSACCIÓN CON REVERSIÓN DE STOCK
   * @param {Number} id - ID de la transacción
   * @param {Number} userId - ID del usuario
   * @param {String} reason - Razón de cancelación
   * @returns {Boolean} Éxito de la operación
   */
  static async cancel(id, userId, reason = "Cancelada por el usuario") {
    try {
      // ✅ MEJORA: Obtener transacción con items
      const transaction = await this.findById(id, true);
      if (!transaction) {
        throw new Error("Transacción no encontrada");
      }

      // ✅ MEJORA: Validar estado
      if (transaction.status === this.STATUS.CANCELLED) {
        throw new Error("La transacción ya está cancelada");
      }

      if (
        transaction.status === this.STATUS.COMPLETED &&
        transaction.payment_status === "paid"
      ) {
        throw new Error(
          "No se puede cancelar una transacción completada y pagada",
        );
      }

      // ✅ MEJORA: Usar transacción para reversión atómica
      await executeInTransaction(async (connection) => {
        // ✅ MEJORA: Revertir movimientos de inventario
        if (transaction.items && transaction.items.length > 0) {
          for (const item of transaction.items) {
            await this.reverseInventoryMovement(
              connection,
              id,
              item.productId,
              item.quantity,
              transaction.type,
              transaction.reference,
              reason,
              userId,
              transaction.location,
            );
          }
        }

        // ✅ MEJORA: Actualizar estado de la transacción
        const updateSql = `
          UPDATE transactions 
          SET status = ?, 
              notes = CONCAT(COALESCE(notes, ''), '\\nCancelada: ', ?),
              updated_at = NOW(),
              updated_by = ?
          WHERE id = ?
        `;

        await connection.execute(updateSql, [
          this.STATUS.CANCELLED,
          reason,
          userId,
          id,
        ]);

        // ✅ MEJORA: Registrar cancelación en auditoría
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            "CANCEL",
            "TRANSACTION",
            id,
            userId,
            JSON.stringify({
              reason,
              previousStatus: transaction.status,
              transactionType: transaction.type,
              totalAmount: transaction.total_amount,
            }),
          ],
        );
      });

      logger.info("Transacción cancelada exitosamente", {
        transactionId: id,
        userId,
        reason,
        transactionType: transaction.type,
        totalAmount: transaction.total_amount,
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache(id);

      return true;
    } catch (error) {
      logger.error("Error cancelando transacción", {
        id,
        error: error.message,
        userId,
        reason,
        stack: error.stack,
      });

      throw new Error(`Error al cancelar transacción: ${error.message}`);
    }
  }

  /**
   * ✅ REVERTIR MOVIMIENTO DE INVENTARIO
   * @param {Object} connection - Conexión de transacción
   * @param {Number} transactionId - ID de transacción
   * @param {Number} productId - ID del producto
   * @param {Number} quantity - Cantidad
   * @param {String} type - Tipo de transacción original
   * @param {String} reference - Referencia original
   * @param {String} reason - Razón de reversión
   * @param {Number} userId - ID del usuario
   * @param {String} location - Ubicación
   */
  static async reverseInventoryMovement(
    connection,
    transactionId,
    productId,
    quantity,
    type,
    reference,
    reason,
    userId,
    location,
  ) {
    let reverseMovementType = null;
    let reverseNotes = `Cancelación: ${reference}. Razón: ${reason}`;

    // Determinar movimiento inverso
    switch (type) {
      case this.TYPES.SALE:
        reverseMovementType = "in"; // Devolver stock
        break;
      case this.TYPES.PURCHASE:
        reverseMovementType = "out"; // Quitar stock
        break;
      case this.TYPES.RETURN:
        reverseMovementType = "out"; // Revertir devolución
        break;
      case this.TYPES.ADJUSTMENT:
        reverseMovementType = "adjustment";
        break;
      default:
        return; // No revertir para otros tipos
    }

    if (reverseMovementType) {
      // Registrar movimiento inverso
      await connection.execute(
        `INSERT INTO inventory_movements (
          product_id, 
          transaction_id,
          quantity, 
          movement_type, 
          reference, 
          notes,
          location,
          created_by, 
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          productId,
          transactionId,
          quantity,
          reverseMovementType,
          `CANCEL-${reference}`,
          reverseNotes,
          location,
          userId,
        ],
      );

      // Actualizar stock (inverso del movimiento original)
      const stockChange = reverseMovementType === "in" ? quantity : -quantity;
      await connection.execute(
        "UPDATE products SET current_stock = current_stock + ?, updated_at = NOW() WHERE id = ?",
        [stockChange, productId],
      );
    }
  }

  /**
   * ✅ OBTENER ITEMS DE TRANSACCIÓN
   * @param {Number} transactionId - ID de la transacción
   * @returns {Array} Items de la transacción
   */
  static async getTransactionItems(transactionId) {
    try {
      const sql = `
        SELECT 
          ti.*,
          p.name as product_name,
          p.sku,
          p.current_stock,
          p.price as product_price,
          c.name as category_name
        FROM transaction_items ti
        LEFT JOIN products p ON ti.product_id = p.id AND p.deleted_at IS NULL
        LEFT JOIN categories c ON p.category_id = c.id AND c.deleted_at IS NULL
        WHERE ti.transaction_id = ?
        ORDER BY ti.id
      `;

      const items = await query(sql, [transactionId]);

      // ✅ MEJORA: Formatear datos
      return items.map((item) => ({
        ...item,
        unit_price_formatted: this.formatCurrency(item.unit_price),
        discount_amount_formatted: this.formatCurrency(item.discount_amount),
        total_price_formatted: this.formatCurrency(item.total_price),
        net_price_formatted: this.formatCurrency(item.net_price),
        profit: item.net_price - item.unit_price * item.quantity, // Calcular ganancia
      }));
    } catch (error) {
      logger.error("Error obteniendo items de transacción", {
        transactionId,
        error: error.message,
      });
      return [];
    }
  }

  /**
   * ✅ OBTENER ESTADÍSTICAS DE TRANSACCIONES
   * @param {String} period - Período (day, week, month, year)
   * @returns {Object} Estadísticas
   */
  static async getStats(period = "month") {
    try {
      let interval = "30 DAY";
      let groupBy = "DATE(created_at)";

      switch (period) {
        case "day":
          interval = "1 DAY";
          break;
        case "week":
          interval = "7 DAY";
          break;
        case "month":
          interval = "30 DAY";
          break;
        case "quarter":
          interval = "90 DAY";
          groupBy = "WEEK(created_at)";
          break;
        case "year":
          interval = "365 DAY";
          groupBy = "MONTH(created_at)";
          break;
      }

      const sql = `
        SELECT 
          ${groupBy} as period,
          type,
          COUNT(*) as transaction_count,
          SUM(total_amount) as total_amount,
          SUM(total_discount) as total_discount,
          SUM(total_items) as total_items,
          AVG(total_amount) as avg_amount,
          COUNT(DISTINCT customer_id) as unique_customers,
          COUNT(DISTINCT created_by) as unique_operators,
          SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as paid_amount,
          SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending_amount
        FROM transactions 
        WHERE status = 'completed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL ${interval})
        AND deleted_at IS NULL
        GROUP BY ${groupBy}, type
        ORDER BY period DESC, total_amount DESC
      `;

      const stats = await query(sql);

      // ✅ MEJORA: Calcular estadísticas adicionales
      const summary = {
        totalTransactions: stats.reduce(
          (sum, item) => sum + item.transaction_count,
          0,
        ),
        totalAmount: stats.reduce(
          (sum, item) => sum + parseFloat(item.total_amount || 0),
          0,
        ),
        totalItems: stats.reduce(
          (sum, item) => sum + (item.total_items || 0),
          0,
        ),
        totalDiscount: stats.reduce(
          (sum, item) => sum + parseFloat(item.total_discount || 0),
          0,
        ),
        paidAmount: stats.reduce(
          (sum, item) => sum + parseFloat(item.paid_amount || 0),
          0,
        ),
        pendingAmount: stats.reduce(
          (sum, item) => sum + parseFloat(item.pending_amount || 0),
          0,
        ),
        byType: {},
        byPeriod: {},
      };

      // Agrupar por tipo
      stats.forEach((item) => {
        if (!summary.byType[item.type]) {
          summary.byType[item.type] = {
            count: 0,
            amount: 0,
            items: 0,
          };
        }
        summary.byType[item.type].count += item.transaction_count;
        summary.byType[item.type].amount += parseFloat(item.total_amount || 0);
        summary.byType[item.type].items += item.total_items;
      });

      // Agrupar por período
      stats.forEach((item) => {
        if (!summary.byPeriod[item.period]) {
          summary.byPeriod[item.period] = {
            count: 0,
            amount: 0,
            items: 0,
          };
        }
        summary.byPeriod[item.period].count += item.transaction_count;
        summary.byPeriod[item.period].amount += parseFloat(
          item.total_amount || 0,
        );
        summary.byPeriod[item.period].items += item.total_items;
      });

      return {
        period,
        interval,
        stats,
        summary,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error obteniendo estadísticas de transacciones", {
        period,
        error: error.message,
      });
      throw new Error(`Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * ✅ MÉTODOS HELPER MEJORADOS
   */

  /**
   * GENERAR REFERENCIA ÚNICA
   * @param {String} type - Tipo de transacción
   * @returns {String} Referencia única
   */
  static async generateReference(type) {
    try {
      const prefix = this.getReferencePrefix(type);
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const reference = `${prefix}${timestamp}${random}`.substring(0, 16);

      // Verificar si la referencia ya existe
      const existing = await this.findByReference(reference);
      if (existing) {
        // Retry con diferentes random
        return await this.generateReference(type);
      }

      return reference;
    } catch (error) {
      logger.error("Error generando referencia", {
        type,
        error: error.message,
      });
      throw new Error(`Error al generar referencia: ${error.message}`);
    }
  }

  /**
   * BUSCAR TRANSACCIÓN POR REFERENCIA
   * @param {String} reference - Referencia
   * @returns {Object} Transacción encontrada
   */
  static async findByReference(reference) {
    try {
      const sql =
        "SELECT * FROM transactions WHERE reference = ? AND deleted_at IS NULL";
      const [transaction] = await query(sql, [reference]);
      return transaction || null;
    } catch (error) {
      logger.error("Error buscando transacción por referencia", {
        reference,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * OBTENER PREFIJO DE REFERENCIA
   * @param {String} type - Tipo de transacción
   * @returns {String} Prefijo
   */
  static getReferencePrefix(type) {
    const prefixes = {
      sale: "SALE-",
      purchase: "PUR-",
      return: "RET-",
      adjustment: "ADJ-",
      transfer: "TRF-",
      damage: "DMG-",
    };

    return prefixes[type] || "TRX-";
  }

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL TIPO
   * @param {String} type - Tipo de transacción
   * @returns {String} Texto descriptivo
   */
  static getTypeDisplay(type) {
    const typeMap = {
      sale: "💰 Venta",
      purchase: "🛒 Compra",
      return: "↩️ Devolución",
      adjustment: "⚙️ Ajuste",
      transfer: "🔄 Transferencia",
      damage: "💔 Daño/Desperdicio",
    };

    return typeMap[type] || type;
  }

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL ESTADO
   * @param {String} status - Estado de transacción
   * @returns {String} Texto descriptivo
   */
  static getStatusDisplay(status) {
    const statusMap = {
      pending: "🟡 Pendiente",
      completed: "🟢 Completada",
      cancelled: "🔴 Cancelada",
      refunded: "↩️ Reembolsada",
      partially_refunded: "🟠 Parcialmente Reembolsada",
    };

    return statusMap[status] || status;
  }

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL MÉTODO DE PAGO
   * @param {String} method - Método de pago
   * @returns {String} Texto descriptivo
   */
  static getPaymentMethodDisplay(method) {
    const methodMap = {
      cash: "💵 Efectivo",
      card: "💳 Tarjeta",
      transfer: "🏦 Transferencia",
      credit: "📝 Crédito",
      check: "📋 Cheque",
      digital: "📱 Digital",
    };

    return methodMap[method] || method;
  }

  /**
   * FORMATO DE MONEDA
   * @param {Number} amount - Cantidad
   * @returns {String} Cantidad formateada
   */
  static formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
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

    if (diffDay > 0) return `Hace ${diffDay} día${diffDay > 1 ? "s" : ""}`;
    if (diffHour > 0) return `Hace ${diffHour} hora${diffHour > 1 ? "s" : ""}`;
    if (diffMin > 0) return `Hace ${diffMin} minuto${diffMin > 1 ? "s" : ""}`;
    return "Hace unos segundos";
  }

  /**
   * LIMPIAR CACHE DE TRANSACCIÓN
   * @param {Number} transactionId - ID de transacción (opcional)
   */
  static clearCache(transactionId = null) {
    if (transactionId) {
      for (const key of this.cache.keys()) {
        if (key.includes(`transaction_${transactionId}`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }

    logger.debug("Cache de transacciones limpiado", {
      transactionId,
      cacheSize: this.cache.size,
    });
  }

  /**
   * ✅ EXPORTAR TRANSACCIONES A FORMATO ESTRUCTURADO
   * @param {Array} transactionIds - IDs de transacciones
   * @param {String} format - Formato (json, csv)
   * @returns {Object} Datos exportados
   */
  static async exportTransactions(transactionIds = [], format = "json") {
    try {
      let whereClause = "";
      const params = [];

      if (Array.isArray(transactionIds) && transactionIds.length > 0) {
        whereClause = "WHERE t.id IN (?)";
        params.push(transactionIds);
      }

      const sql = `
        SELECT 
          t.*,
          c.name as customer_name,
          s.name as supplier_name,
          u.name as created_by_name,
          (
            SELECT JSON_ARRAYAGG(
              JSON_OBJECT(
                'product_name', p.name,
                'sku', p.sku,
                'quantity', ti.quantity,
                'unit_price', ti.unit_price,
                'total_price', ti.total_price
              )
            )
            FROM transaction_items ti
            LEFT JOIN products p ON ti.product_id = p.id
            WHERE ti.transaction_id = t.id
          ) as items_json
        FROM transactions t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN suppliers s ON t.supplier_id = s.id
        LEFT JOIN users u ON t.created_by = u.id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT 1000
      `;

      const transactions = await query(sql, params);

      // Formatear datos para exportación
      const exportData = transactions.map((transaction) => {
        let items = [];
        if (transaction.items_json) {
          try {
            items = JSON.parse(transaction.items_json);
          } catch (e) {
            items = [];
          }
        }

        return {
          id: transaction.id,
          reference: transaction.reference,
          type: transaction.type,
          type_display: this.getTypeDisplay(transaction.type),
          customer: transaction.customer_name,
          supplier: transaction.supplier_name,
          total_amount: transaction.total_amount,
          total_discount: transaction.total_discount,
          total_items: transaction.total_items,
          payment_method: transaction.payment_method,
          payment_status: transaction.payment_status,
          status: transaction.status,
          created_by: transaction.created_by_name,
          created_at: transaction.created_at,
          items: items,
          metadata: transaction.metadata
            ? JSON.parse(transaction.metadata)
            : null,
        };
      });

      return {
        success: true,
        format,
        count: exportData.length,
        data: exportData,
        exported_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error exportando transacciones", {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = Transaction;
