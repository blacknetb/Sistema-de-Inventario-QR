const Inventory = require("../models/Inventory");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const logger = require("../utils/logger");
const { validationResult } = require("express-validator");
const database = require("../models/database");
const AuditLog = require("../models/AuditLog");
const cacheService = require("../services/cacheService");
const Alert = require("../models/Alert");

/**
 * ✅ CONTROLADOR DE INVENTARIO MEJORADO
 * Correcciones aplicadas:
 * 1. Validación robusta de movimientos
 * 2. Manejo seguro de transacciones
 * 3. Sistema de alertas de stock
 * 4. Control de permisos granular
 * 5. Caché optimizado para stock
 * 6. Reportes y estadísticas mejorados
 */

const inventoryController = {
  // ✅ Constantes para configuración
  INVENTORY_CONSTANTS: {
    MAX_DAILY_MOVEMENTS:
      parseInt(process.env.MAX_DAILY_INVENTORY_MOVEMENTS) || 100,
    MAX_QUANTITY_PER_MOVEMENT: 10000,
    MIN_QUANTITY: 1,
    STOCK_ALERT_THRESHOLDS: {
      CRITICAL: 0,
      LOW: 0.2, // 20% del stock mínimo
      WARNING: 0.5, // 50% del stock mínimo
    },
    CACHE_TTL: {
      STOCK: 60, // 1 minuto para stock actual
      HISTORY: 300, // 5 minutos para historial
      REPORT: 600, // 10 minutos para reportes
    },
    BATCH_SIZE: {
      IMPORT: 100,
      EXPORT: 1000,
    },
  },

  // ✅ Función auxiliar para validar movimiento mejorada
  validateMovement: async (
    productId,
    quantity,
    movementType,
    userId,
    options = {},
  ) => {
    const errors = [];
    const warnings = [];

    // ✅ Validar ID de producto
    if (!productId || productId <= 0) {
      errors.push("ID de producto inválido");
      return { isValid: false, errors, warnings, product: null };
    }

    // ✅ Validar cantidad
    if (!quantity || quantity <= 0) {
      errors.push("Cantidad debe ser mayor a 0");
    }

    if (
      quantity >
      inventoryController.INVENTORY_CONSTANTS.MAX_QUANTITY_PER_MOVEMENT
    ) {
      errors.push(
        `Cantidad excede el límite máximo de ${inventoryController.INVENTORY_CONSTANTS.MAX_QUANTITY_PER_MOVEMENT} por movimiento`,
      );
    }

    // ✅ Validar tipo de movimiento
    const validMovementTypes = ["in", "out", "adjustment", "transfer"];
    if (!validMovementTypes.includes(movementType)) {
      errors.push(
        `Tipo de movimiento inválido. Valores permitidos: ${validMovementTypes.join(", ")}`,
      );
    }

    // ✅ Buscar producto
    let product;
    try {
      product = await Product.findById(productId);
      if (!product) {
        errors.push("Producto no encontrado");
      }
    } catch (error) {
      errors.push("Error al buscar producto");
      logger.error("Error buscando producto para validación:", error);
    }

    // ✅ Validar stock para salidas
    if (movementType === "out" && product) {
      try {
        const currentStock = await Inventory.getCurrentStock(productId);
        if (currentStock < quantity) {
          errors.push(
            `Stock insuficiente. Disponible: ${currentStock}, Solicitado: ${quantity}`,
          );
        }

        // ✅ Advertencia si el stock queda bajo después del movimiento
        const remainingStock = currentStock - quantity;
        if (remainingStock <= product.min_stock) {
          warnings.push(
            `Stock quedará bajo después del movimiento. Stock restante: ${remainingStock}, Mínimo: ${product.min_stock}`,
          );
        }
      } catch (error) {
        errors.push("Error al verificar stock disponible");
        logger.error("Error verificando stock:", error);
      }
    }

    // ✅ Validar ajustes (solo administradores y managers)
    if (movementType === "adjustment" && options.userRole) {
      const allowedRoles = ["admin", "manager"];
      if (!allowedRoles.includes(options.userRole)) {
        errors.push(
          "Se requieren permisos especiales para ajustes de inventario",
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      product,
    };
  },

  // ✅ Función para verificar límites diarios de movimientos
  checkDailyMovementLimit: async (userId) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = `daily_movements:${userId}:${today}`;

      const movementsToday = (await cacheService.get(cacheKey)) || 0;

      if (
        movementsToday >=
        inventoryController.INVENTORY_CONSTANTS.MAX_DAILY_MOVEMENTS
      ) {
        return {
          exceeded: true,
          current: movementsToday,
          limit: inventoryController.INVENTORY_CONSTANTS.MAX_DAILY_MOVEMENTS,
          reset_time: "mañana a las 00:00",
        };
      }

      return {
        exceeded: false,
        current: movementsToday,
        limit: inventoryController.INVENTORY_CONSTANTS.MAX_DAILY_MOVEMENTS,
        remaining:
          inventoryController.INVENTORY_CONSTANTS.MAX_DAILY_MOVEMENTS -
          movementsToday,
      };
    } catch (error) {
      logger.warn(
        "Error verificando límite diario de movimientos:",
        error.message,
      );
      return { exceeded: false, error: true };
    }
  },

  // ✅ Incrementar contador de movimientos diarios
  incrementDailyMovementCount: async (userId) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = `daily_movements:${userId}:${today}`;

      const movementsToday = (await cacheService.get(cacheKey)) || 0;
      await cacheService.set(cacheKey, movementsToday + 1, 86400); // 24 horas

      return movementsToday + 1;
    } catch (error) {
      logger.warn(
        "Error incrementando contador de movimientos:",
        error.message,
      );
    }
  },

  // ✅ Construir respuesta de error estandarizada
  buildInventoryErrorResponse: (
    statusCode,
    message,
    errorCode,
    details = null,
  ) => {
    const response = {
      success: false,
      message,
      error_code: errorCode,
      timestamp: new Date().toISOString(),
      reference_id: `INV-ERR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    if (details) {
      response.details = details;
    }

    return {
      status: statusCode,
      json: response,
    };
  },

  // ✅ Construir respuesta de éxito estandarizada
  buildInventorySuccessResponse: (
    data,
    message = "Operación exitosa",
    statusCode = 200,
  ) => {
    return {
      status: statusCode,
      json: {
        success: true,
        message,
        data,
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0",
        },
      },
    };
  },

  // ✅ Invalidar caché relacionado con inventario
  invalidateInventoryCache: async (productId = null, movementId = null) => {
    if (process.env.ENABLE_CACHE !== "true") return;

    try {
      const cacheKeys = [
        "inventory:summary",
        "inventory:low_stock",
        "inventory:reports:*",
      ];

      if (productId) {
        cacheKeys.push(`stock:${productId}`);
        cacheKeys.push(`product:${productId}:history`);
        cacheKeys.push(`product:${productId}:stats`);
      }

      if (movementId) {
        cacheKeys.push(`movement:${movementId}`);
      }

      // Eliminar caché en paralelo
      await Promise.all(
        cacheKeys.flat().map((key) => {
          if (key.includes("*")) {
            // Para patrones, necesitarías una función específica del cache service
            // Por ahora, ignoramos los patrones
            return Promise.resolve();
          }
          return cacheService.del(key);
        }),
      );

      logger.debug(
        `Caché de inventario invalidado para productId: ${productId}, movementId: ${movementId}`,
      );
    } catch (error) {
      logger.warn("Error invalidando caché de inventario:", error.message);
    }
  },

  // ✅ Verificar permisos para operaciones de inventario
  checkInventoryPermissions: (userRole, operation) => {
    const permissions = {
      view: ["user", "manager", "admin"],
      create: ["manager", "admin"],
      update: ["manager", "admin"],
      delete: ["admin"],
      adjust: ["manager", "admin"],
      export: ["manager", "admin"],
    };

    return permissions[operation]?.includes(userRole) || false;
  },

  // ✅ Crear movimiento de inventario con validación mejorada
  createMovement: async (req, res) => {
    let transaction;

    try {
      const {
        product_id,
        quantity,
        movement_type,
        reason,
        reference_number,
        location,
        notes,
      } = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      logger.info("Creando movimiento de inventario", {
        userId,
        userRole,
        productId: product_id,
        movementType: movement_type,
        quantity,
      });

      // ✅ Validar permisos
      if (!inventoryController.checkInventoryPermissions(userRole, "create")) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para crear movimientos de inventario",
          "INSUFFICIENT_PERMISSIONS",
          { required_roles: ["manager", "admin"] },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validar datos de entrada con express-validator
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "Errores de validación",
          "VALIDATION_ERROR",
          { errors: validation.array() },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar límite diario de movimientos
      const limitCheck =
        await inventoryController.checkDailyMovementLimit(userId);
      if (limitCheck.exceeded) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          429,
          `Límite diario de movimientos alcanzado (${limitCheck.limit})`,
          "DAILY_MOVEMENT_LIMIT_EXCEEDED",
          {
            current: limitCheck.current,
            limit: limitCheck.limit,
            reset_time: limitCheck.reset_time,
          },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validar movimiento
      const validationResult = await inventoryController.validateMovement(
        product_id,
        quantity,
        movement_type,
        userId,
        { userRole },
      );

      if (!validationResult.isValid) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "Validación de movimiento fallida",
          "MOVEMENT_VALIDATION_ERROR",
          {
            errors: validationResult.errors,
            warnings: validationResult.warnings,
          },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      const { product, warnings } = validationResult;

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Obtener stock actual antes del movimiento
      const stockBefore = await Inventory.getCurrentStock(product_id);

      // ✅ Calcular stock después
      let stockAfter;
      if (movement_type === "in") {
        stockAfter = stockBefore + quantity;
      } else if (movement_type === "out") {
        stockAfter = stockBefore - quantity;
      } else {
        stockAfter = quantity; // Para ajustes, el stock después es la cantidad especificada
      }

      // ✅ Crear movimiento de inventario
      const movementData = {
        product_id,
        quantity,
        movement_type,
        reason: reason || `Movimiento de ${movement_type}`,
        reference_number: reference_number || `MOV-${Date.now()}-${product_id}`,
        location: location || "Almacén principal",
        created_by: userId,
        status: "completed",
        notes:
          notes ||
          `Stock antes: ${stockBefore}, Stock después: ${stockAfter}. ${warnings.join(" ")}`,
        metadata: {
          stock_before: stockBefore,
          stock_after: stockAfter,
          user_role: userRole,
          ip_address: req.ip,
        },
      };

      const movementId = await Inventory.create(movementData, transaction);

      // ✅ Crear transacción de auditoría
      const transactionType =
        movement_type === "in"
          ? "entry"
          : movement_type === "out"
            ? "exit"
            : "adjustment";

      await Transaction.create(
        {
          product_id,
          quantity,
          type: transactionType,
          notes:
            reason ||
            `Movimiento de ${movement_type}. Stock: ${stockBefore} → ${stockAfter}`,
          reference_number: reference_number || movementData.reference_number,
          location: location || "Almacén principal",
          created_by: userId,
          metadata: {
            movement_id: movementId,
            stock_before: stockBefore,
            stock_after: stockAfter,
            movement_type,
            user_role: userRole,
            warnings: warnings,
          },
        },
        transaction,
      );

      // ✅ Verificar y crear alertas de stock
      const alerts = await inventoryController.checkStockAlerts(
        product,
        stockAfter,
        movement_type,
      );

      if (alerts.length > 0) {
        for (const alert of alerts) {
          await Alert.create(
            {
              type: alert.type,
              product_id,
              severity: alert.severity,
              message: alert.message,
              created_by: "system",
              status: "active",
              metadata: {
                movement_id: movementId,
                current_stock: stockAfter,
                threshold: alert.threshold,
                product_name: product.name,
              },
            },
            transaction,
          );
        }
      }

      // ✅ Incrementar contador de movimientos diarios
      await inventoryController.incrementDailyMovementCount(userId);

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "inventory_movement_created",
          user_id: userId,
          details: {
            movement_id: movementId,
            product_id,
            product_name: product.name,
            movement_type,
            quantity,
            stock_before: stockBefore,
            stock_after: stockAfter,
            reason,
            alerts_generated: alerts.length,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      logger.info("Movimiento de inventario creado exitosamente", {
        movementId,
        productId: product_id,
        movementType: movement_type,
        quantity,
        stockBefore,
        stockAfter,
        userId,
        alerts: alerts.length,
      });

      // ✅ Invalidar caché relacionado
      await inventoryController.invalidateInventoryCache(
        product_id,
        movementId,
      );

      // ✅ Preparar respuesta
      const responseData = {
        movement_id: movementId,
        product: {
          id: product_id,
          name: product.name,
          sku: product.sku,
          category_name: product.category_name,
        },
        movement: {
          type: movement_type,
          quantity,
          reason: movementData.reason,
          reference_number: movementData.reference_number,
          location: movementData.location,
        },
        stock: {
          before: stockBefore,
          after: stockAfter,
          change: movement_type === "in" ? `+${quantity}` : `-${quantity}`,
        },
        alerts,
        warnings: warnings.length > 0 ? warnings : undefined,
        daily_limit: {
          current: limitCheck.current + 1,
          limit: limitCheck.limit,
          remaining: limitCheck.limit - (limitCheck.current + 1),
        },
        actions: [
          {
            action: "view_movement",
            url: `${req.protocol}://${req.get("host")}/api/inventory/movements/${movementId}`,
            method: "GET",
          },
          {
            action: "view_product",
            url: `${req.protocol}://${req.get("host")}/api/products/${product_id}`,
            method: "GET",
          },
          {
            action: "create_another",
            url: `${req.protocol}://${req.get("host")}/api/inventory/movements`,
            method: "POST",
            description: "Crear otro movimiento",
          },
        ],
      };

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Movimiento registrado exitosamente",
        201,
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      // ✅ Rollback de transacción si existe
      if (transaction) {
        try {
          await database.rollbackTransaction(transaction);
        } catch (rollbackError) {
          logger.error("Error durante rollback de transacción:", rollbackError);
        }
      }

      logger.error("Error creando movimiento de inventario:", {
        error: error.message,
        stack: error.stack,
        userId: req.userId,
        body: req.body,
      });

      let errorResponse;

      // ✅ Manejo de errores específicos
      switch (error.code) {
        case "ER_DUP_ENTRY":
          errorResponse = inventoryController.buildInventoryErrorResponse(
            409,
            "Movimiento duplicado detectado",
            "DUPLICATE_MOVEMENT",
          );
          break;

        case "ER_LOCK_WAIT_TIMEOUT":
          errorResponse = inventoryController.buildInventoryErrorResponse(
            503,
            "Tiempo de espera agotado. Por favor, intente nuevamente",
            "DATABASE_LOCK_TIMEOUT",
            { retry_after: 5000 },
          );
          break;

        case "ER_NO_REFERENCED_ROW":
          errorResponse = inventoryController.buildInventoryErrorResponse(
            404,
            "Producto no encontrado",
            "PRODUCT_NOT_FOUND",
          );
          break;

        default:
          errorResponse = inventoryController.buildInventoryErrorResponse(
            500,
            "Error interno al registrar movimiento",
            "MOVEMENT_CREATION_ERROR",
          );
      }

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Verificar y crear alertas de stock
  checkStockAlerts: async (product, currentStock, movementType) => {
    const alerts = [];

    if (!product) return alerts;

    const { min_stock, max_stock } = product;

    // ✅ Alerta de stock crítico (agotado)
    if (currentStock === 0) {
      alerts.push({
        type: "stock_critical",
        severity: "critical",
        message: `¡STOCK AGOTADO! ${product.name} se ha agotado.`,
        threshold: 0,
        current: currentStock,
        recommended_action: "Reabastecer urgentemente",
      });
    }

    // ✅ Alerta de stock bajo
    else if (currentStock <= min_stock) {
      alerts.push({
        type: "stock_low",
        severity: "high",
        message: `Stock bajo para ${product.name}. Actual: ${currentStock}, Mínimo: ${min_stock}`,
        threshold: min_stock,
        current: currentStock,
        recommended_action: "Reabastecer pronto",
      });
    }

    // ✅ Alerta de stock por debajo del 20% del mínimo
    else if (currentStock <= min_stock * 0.2) {
      alerts.push({
        type: "stock_very_low",
        severity: "medium",
        message: `Stock muy bajo para ${product.name}. Actual: ${currentStock}`,
        threshold: min_stock * 0.2,
        current: currentStock,
        recommended_action: "Considerar reabastecimiento",
      });
    }

    // ✅ Alerta de sobrestock
    if (currentStock > max_stock && movementType === "in") {
      alerts.push({
        type: "overstock",
        severity: "low",
        message: `Sobrestock para ${product.name}. Actual: ${currentStock}, Máximo: ${max_stock}`,
        threshold: max_stock,
        current: currentStock,
        recommended_action: "Revisar niveles máximos",
      });
    }

    return alerts;
  },

  // ✅ Obtener historial con filtros avanzados y caché
  getHistory: async (req, res) => {
    try {
      const {
        limit = 50,
        offset = 0,
        product_id,
        movement_type,
        start_date,
        end_date,
        user_id,
        location,
        min_quantity,
        max_quantity,
        sort_by = "created_at",
        sort_order = "DESC",
        include_details = "false",
      } = req.query;

      logger.debug("Obteniendo historial de inventario", {
        userId: req.userId,
        filters: { product_id, movement_type, start_date, end_date },
      });

      // ✅ Validar permisos
      if (
        !inventoryController.checkInventoryPermissions(req.userRole, "view")
      ) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para ver el historial de inventario",
          "INSUFFICIENT_PERMISSIONS",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validar y sanitizar parámetros
      const validatedLimit = Math.min(parseInt(limit, 10) || 50, 200);
      const validatedOffset = Math.max(parseInt(offset, 10) || 0, 0);

      // ✅ Verificar permisos para ver todos los movimientos
      if (user_id && parseInt(user_id, 10) !== req.userId) {
        if (
          !inventoryController.checkInventoryPermissions(
            req.userRole,
            "view_all",
          )
        ) {
          const errorResponse = inventoryController.buildInventoryErrorResponse(
            403,
            "No tienes permisos para ver movimientos de otros usuarios",
            "VIEW_OTHER_USERS_DENIED",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
      }

      // ✅ Construir clave de caché
      const cacheKey = `inventory_history:${JSON.stringify({
        limit: validatedLimit,
        offset: validatedOffset,
        product_id,
        movement_type,
        start_date,
        end_date,
        user_id:
          req.userRole !== "admin" && req.userRole !== "manager"
            ? req.userId
            : user_id,
        location,
        min_quantity,
        max_quantity,
        sort_by,
        sort_order,
      })}`;

      let history;
      let total;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            history = cached.data;
            total = cached.total;
            logger.debug("Historial obtenido de caché", { cacheKey });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!history) {
        [history, total] = await Promise.all([
          Inventory.getAllHistory(
            validatedLimit,
            validatedOffset,
            product_id,
            movement_type,
            start_date,
            end_date,
            user_id,
            location,
            min_quantity,
            max_quantity,
            sort_by,
            sort_order,
          ),
          Inventory.countHistory(
            product_id,
            movement_type,
            start_date,
            end_date,
            user_id,
            location,
            min_quantity,
            max_quantity,
          ),
        ]);

        // ✅ Cachear resultados
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              { data: history, total },
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.HISTORY,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Enriquecer datos si se solicita
      if (include_details === "true") {
        const enrichedHistory = [];

        for (const movement of history) {
          const enrichedMovement = { ...movement };

          // ✅ Obtener detalles del producto
          if (movement.product_id) {
            const product = await Product.findById(movement.product_id);
            enrichedMovement.product_details = product
              ? {
                  name: product.name,
                  sku: product.sku,
                  category_name: product.category_name,
                  image_url: product.image_url,
                }
              : null;
          }

          // ✅ Obtener detalles del usuario
          if (movement.created_by) {
            const user = await require("../models/User").findById(
              movement.created_by,
            );
            enrichedMovement.user_details = user
              ? {
                  name: user.name,
                  email: user.email,
                  role: user.role,
                }
              : null;
          }

          enrichedHistory.push(enrichedMovement);
        }

        history = enrichedHistory;
      }

      // ✅ Calcular estadísticas
      const stats = await Inventory.getHistoryStats(
        product_id,
        movement_type,
        start_date,
        end_date,
      );

      // ✅ Construir respuesta
      const responseData = {
        data: history,
        pagination: {
          total,
          page: Math.floor(validatedOffset / validatedLimit) + 1,
          limit: validatedLimit,
          total_pages: Math.ceil(total / validatedLimit),
          has_more: validatedOffset + validatedLimit < total,
        },
        filters: {
          product_id,
          movement_type,
          date_range: { start_date, end_date },
          user_id,
          location,
          quantity_range: { min_quantity, max_quantity },
          applied_filters: Object.keys(req.query).length - 2, // excluir limit y offset
        },
        summary: {
          total_movements: total,
          total_quantity: stats.total_quantity || 0,
          average_quantity: stats.average_quantity || 0,
          most_active_product: stats.most_active_product,
          peak_hour: stats.peak_hour,
          movement_distribution: stats.movement_distribution || {},
        },
        export_options: [
          {
            format: "csv",
            url: `${req.protocol}://${req.get("host")}/api/inventory/history/export/csv?${new URLSearchParams(req.query).toString()}`,
            description: "Exportar a CSV",
            requires_permission: inventoryController.checkInventoryPermissions(
              req.userRole,
              "export",
            ),
          },
          {
            format: "pdf",
            url: `${req.protocol}://${req.get("host")}/api/inventory/history/export/pdf?${new URLSearchParams(req.query).toString()}`,
            description: "Exportar a PDF",
            requires_permission: inventoryController.checkInventoryPermissions(
              req.userRole,
              "export",
            ),
          },
        ],
        cache_info: {
          cached: process.env.ENABLE_CACHE === "true",
          ttl_seconds:
            inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.HISTORY,
        },
      };

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Historial obtenido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo historial de inventario:", {
        error: error.message,
        stack: error.stack,
        query: req.query,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al obtener historial",
        "HISTORY_FETCH_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener movimiento específico por ID
  getMovementById: async (req, res) => {
    try {
      const movementId = parseInt(req.params.id, 10);

      logger.debug("Obteniendo movimiento por ID", {
        movementId,
        userId: req.userId,
      });

      // ✅ Validar ID
      if (!movementId || movementId <= 0) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "ID de movimiento inválido",
          "INVALID_MOVEMENT_ID",
          { provided_id: req.params.id },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Clave de caché
      const cacheKey = `movement:${movementId}`;
      let movement;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          movement = await cacheService.get(cacheKey);
          if (movement) {
            logger.debug("Movimiento obtenido de caché", { movementId });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!movement) {
        movement = await Inventory.getMovementById(movementId);

        if (!movement) {
          const errorResponse = inventoryController.buildInventoryErrorResponse(
            404,
            "Movimiento no encontrado",
            "MOVEMENT_NOT_FOUND",
            { movementId },
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }

        // ✅ Cachear movimiento
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              movement,
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.HISTORY,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Verificar permisos
      if (
        !inventoryController.checkInventoryPermissions(req.userRole, "view")
      ) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para ver este movimiento",
          "INSUFFICIENT_PERMISSIONS",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar si el usuario puede ver movimientos de otros usuarios
      if (movement.created_by !== req.userId) {
        if (
          !inventoryController.checkInventoryPermissions(
            req.userRole,
            "view_all",
          )
        ) {
          const errorResponse = inventoryController.buildInventoryErrorResponse(
            403,
            "No tienes permisos para ver movimientos de otros usuarios",
            "VIEW_OTHER_USERS_DENIED",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
      }

      // ✅ Enriquecer datos
      const [product, user, relatedMovements, timeline] = await Promise.all([
        Product.findById(movement.product_id),
        require("../models/User").findById(movement.created_by),
        Inventory.getRelatedMovements(
          movement.product_id,
          movement.created_at,
          5,
        ),
        Inventory.getMovementTimeline(movementId),
      ]);

      const enrichedMovement = {
        ...movement,
        product_details: product
          ? {
              id: product.id,
              name: product.name,
              sku: product.sku,
              category_name: product.category_name,
              image_url: product.image_url,
              current_stock: await Inventory.getCurrentStock(
                movement.product_id,
              ),
            }
          : null,
        user_details: user
          ? {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department,
            }
          : null,
        related_movements: relatedMovements,
        timeline: timeline,
      };

      // ✅ Construir respuesta
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const actions = [
        {
          action: "view_product",
          url: `${baseUrl}/api/products/${movement.product_id}`,
          method: "GET",
        },
      ];

      // ✅ Agregar acción de reversión si el usuario tiene permisos
      if (
        inventoryController.checkInventoryPermissions(req.userRole, "update") &&
        movement.status !== "reverted"
      ) {
        actions.push({
          action: "revert_movement",
          url: `${baseUrl}/api/inventory/movements/${movementId}/revert`,
          method: "POST",
          requires_admin: movement.movement_type === "adjustment",
          description: "Revertir este movimiento",
        });
      }

      const responseData = {
        movement: enrichedMovement,
        actions,
        permissions: {
          can_revert:
            inventoryController.checkInventoryPermissions(
              req.userRole,
              "update",
            ) && movement.status !== "reverted",
          can_view_details: true,
          can_export: inventoryController.checkInventoryPermissions(
            req.userRole,
            "export",
          ),
        },
      };

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Movimiento obtenido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo movimiento:", {
        error: error.message,
        movementId: req.params.id,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al obtener movimiento",
        "MOVEMENT_FETCH_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Revertir movimiento con validaciones
  revertMovement: async (req, res) => {
    let transaction;

    try {
      const movementId = parseInt(req.params.id, 10);
      const userId = req.userId;
      const userRole = req.userRole;

      logger.info("Revertiendo movimiento", {
        movementId,
        userId,
        userRole,
      });

      // ✅ Validar ID
      if (!movementId || movementId <= 0) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "ID de movimiento inválido",
          "INVALID_MOVEMENT_ID",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar permisos
      if (!inventoryController.checkInventoryPermissions(userRole, "update")) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para revertir movimientos",
          "INSUFFICIENT_PERMISSIONS",
          { required_roles: ["manager", "admin"] },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Para ajustes, solo administradores pueden revertir
      const originalMovement = await Inventory.getMovementById(movementId);
      if (!originalMovement) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          404,
          "Movimiento no encontrado",
          "MOVEMENT_NOT_FOUND",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      if (
        originalMovement.movement_type === "adjustment" &&
        userRole !== "admin"
      ) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "Solo administradores pueden revertir ajustes de inventario",
          "ADMIN_REQUIRED_FOR_ADJUSTMENTS",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar que no esté ya revertido
      if (originalMovement.status === "reverted") {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "El movimiento ya ha sido revertido",
          "MOVEMENT_ALREADY_REVERTED",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar stock actual para salidas
      if (originalMovement.movement_type === "in") {
        const currentStock = await Inventory.getCurrentStock(
          originalMovement.product_id,
        );
        if (currentStock < originalMovement.quantity) {
          const errorResponse = inventoryController.buildInventoryErrorResponse(
            400,
            `Stock insuficiente para revertir. Disponible: ${currentStock}, Necesario: ${originalMovement.quantity}`,
            "INSUFFICIENT_STOCK_FOR_REVERSAL",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Crear movimiento de reversión
      const reverseType =
        originalMovement.movement_type === "in" ? "out" : "in";
      const reverseReason =
        req.body.reason ||
        `Reversión de movimiento #${movementId}: ${originalMovement.reason}`;

      const reverseMovementData = {
        product_id: originalMovement.product_id,
        quantity: originalMovement.quantity,
        movement_type: reverseType,
        reason: reverseReason,
        reference_number: `REV-${originalMovement.reference_number || movementId}`,
        created_by: userId,
        status: "completed",
        parent_movement_id: movementId,
        notes: `Revertido por: ${userId}. Movimiento original: ${movementId}. Motivo: ${req.body.reason || "Corrección"}`,
        metadata: {
          original_movement_id: movementId,
          reverted_by: userId,
          reverted_at: new Date().toISOString(),
        },
      };

      const reverseMovementId = await Inventory.create(
        reverseMovementData,
        transaction,
      );

      // ✅ Marcar movimiento original como revertido
      await Inventory.updateMovementStatus(
        movementId,
        "reverted",
        userId,
        transaction,
      );

      // ✅ Crear transacción de auditoría
      await Transaction.create(
        {
          product_id: originalMovement.product_id,
          quantity: originalMovement.quantity,
          type: "reversal",
          notes: `Reversión del movimiento ${movementId}. Motivo: ${req.body.reason || "Corrección"}`,
          reference_number: `REV-${movementId}`,
          created_by: userId,
          metadata: {
            original_movement_id: movementId,
            reverse_movement_id: reverseMovementId,
            reverted_by: userId,
            reason: req.body.reason,
            user_role: userRole,
          },
        },
        transaction,
      );

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "movement_reverted",
          user_id: userId,
          details: {
            original_movement_id: movementId,
            reverse_movement_id: reverseMovementId,
            product_id: originalMovement.product_id,
            quantity: originalMovement.quantity,
            original_type: originalMovement.movement_type,
            reverse_type: reverseType,
            reason: req.body.reason,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      logger.info("Movimiento revertido exitosamente", {
        originalMovementId: movementId,
        reverseMovementId,
        productId: originalMovement.product_id,
        quantity: originalMovement.quantity,
        revertedBy: userId,
      });

      // ✅ Invalidar caché
      await inventoryController.invalidateInventoryCache(
        originalMovement.product_id,
        movementId,
      );

      // ✅ Obtener stock actualizado
      const currentStock = await Inventory.getCurrentStock(
        originalMovement.product_id,
      );

      // ✅ Construir respuesta
      const responseData = {
        original_movement: {
          id: movementId,
          type: originalMovement.movement_type,
          quantity: originalMovement.quantity,
          status: "reverted",
          reverted_at: new Date().toISOString(),
        },
        reverse_movement: {
          id: reverseMovementId,
          type: reverseType,
          quantity: originalMovement.quantity,
          reason: reverseReason,
          reference_number: reverseMovementData.reference_number,
        },
        product: {
          id: originalMovement.product_id,
          current_stock: currentStock,
          stock_change:
            reverseType === "in"
              ? `+${originalMovement.quantity}`
              : `-${originalMovement.quantity}`,
        },
        audit: {
          reverted_by: userId,
          reverted_at: new Date().toISOString(),
          reason: req.body.reason || "Corrección",
        },
      };

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Movimiento revertido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      // ✅ Rollback de transacción si existe
      if (transaction) {
        try {
          await database.rollbackTransaction(transaction);
        } catch (rollbackError) {
          logger.error("Error durante rollback de transacción:", rollbackError);
        }
      }

      logger.error("Error revirtiendo movimiento:", {
        error: error.message,
        movementId: req.params.id,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al revertir movimiento",
        "MOVEMENT_REVERSAL_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener historial por producto mejorado
  getHistoryByProduct: async (req, res) => {
    try {
      const productId = parseInt(req.params.productId, 10);
      const {
        limit = 50,
        offset = 0,
        include_stats = "true",
        chart_period = "30d",
      } = req.query;

      logger.debug("Obteniendo historial por producto", {
        productId,
        userId: req.userId,
      });

      // ✅ Validar ID
      if (!productId || productId <= 0) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "ID de producto inválido",
          "INVALID_PRODUCT_ID",
          { provided_id: req.params.productId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar permisos
      if (
        !inventoryController.checkInventoryPermissions(req.userRole, "view")
      ) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para ver historial de inventario",
          "INSUFFICIENT_PERMISSIONS",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar que el producto existe y es accesible
      const product = await Product.findById(productId);
      if (!product) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          404,
          "Producto no encontrado",
          "PRODUCT_NOT_FOUND",
          { productId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Para usuarios no administradores, verificar que el producto esté activo
      if (req.userRole !== "admin" && req.userRole !== "manager") {
        if (product.status !== "active") {
          const errorResponse = inventoryController.buildInventoryErrorResponse(
            403,
            "Producto no disponible",
            "PRODUCT_INACTIVE",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
      }

      // ✅ Clave de caché
      const cacheKey = `product_history:${productId}:${limit}:${offset}`;
      let history;
      let total;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            history = cached.data;
            total = cached.total;
            logger.debug("Historial por producto obtenido de caché", {
              cacheKey,
            });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!history) {
        [history, total] = await Promise.all([
          Inventory.getHistoryByProduct(
            productId,
            parseInt(limit, 10),
            parseInt(offset, 10),
          ),
          Inventory.countHistoryByProduct(productId),
        ]);

        // ✅ Cachear resultados
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              { data: history, total },
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.HISTORY,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Obtener información adicional
      const currentStock = await Inventory.getCurrentStock(productId);

      const responseData = {
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          current_stock: currentStock,
          min_stock: product.min_stock,
          max_stock: product.max_stock,
          unit: product.unit,
          status: product.status,
          category_name: product.category_name,
        },
        history: {
          data: history,
          pagination: {
            total,
            page: Math.floor(offset / limit) + 1,
            limit: parseInt(limit),
            total_pages: Math.ceil(total / limit),
            has_more: offset + history.length < total,
          },
        },
      };

      // ✅ Agregar estadísticas si se solicita
      if (include_stats === "true") {
        const productStats = await Inventory.getProductStats(productId);
        responseData.statistics = {
          total_movements: total,
          total_in: productStats.total_in || 0,
          total_out: productStats.total_out || 0,
          average_daily_movement: productStats.average_daily || 0,
          last_movement_date: productStats.last_movement,
          stock_turnover_rate: productStats.turnover_rate || 0,
          days_of_supply:
            currentStock > 0 && productStats.average_daily > 0
              ? Math.floor(currentStock / productStats.average_daily)
              : 0,
        };
      }

      // ✅ Agregar datos para gráficos si se solicita
      if (chart_period) {
        const chartData = await Inventory.getProductChartData(
          productId,
          chart_period,
        );
        responseData.charts = chartData;
      }

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Historial por producto obtenido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo historial por producto:", {
        error: error.message,
        productId: req.params.productId,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al obtener historial por producto",
        "PRODUCT_HISTORY_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener reporte de stock mejorado
  getStockReport: async (req, res) => {
    try {
      const {
        category_id,
        min_stock,
        max_stock,
        include_inactive = "false",
        sort_by = "current_stock",
        sort_order = "ASC",
        include_alerts = "true",
      } = req.query;

      logger.debug("Generando reporte de stock", {
        userId: req.userId,
        filters: { category_id, include_inactive },
      });

      // ✅ Verificar permisos
      if (
        !inventoryController.checkInventoryPermissions(req.userRole, "view")
      ) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para ver reportes de stock",
          "INSUFFICIENT_PERMISSIONS",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Construir clave de caché
      const cacheKey = `stock_report:${JSON.stringify(req.query)}`;
      let report;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          report = await cacheService.get(cacheKey);
          if (report) {
            logger.debug("Reporte de stock obtenido de caché", { cacheKey });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, generar reporte
      if (!report) {
        report = await Inventory.getStockReport(
          category_id,
          min_stock,
          max_stock,
          include_inactive === "true",
          sort_by,
          sort_order,
        );

        // ✅ Cachear reporte
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              report,
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.REPORT,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Calcular métricas
      const metrics = {
        total_products: report.length,
        total_value: report.reduce(
          (sum, p) => sum + p.current_stock * (p.price || 0),
          0,
        ),
        total_items: report.reduce((sum, p) => sum + p.current_stock, 0),
        out_of_stock: report.filter((p) => p.current_stock === 0).length,
        low_stock: report.filter(
          (p) => p.current_stock > 0 && p.current_stock <= p.min_stock,
        ).length,
        overstock: report.filter((p) => p.current_stock > p.max_stock).length,
        optimal_stock: report.filter(
          (p) =>
            p.current_stock > p.min_stock && p.current_stock <= p.max_stock,
        ).length,
      };

      // ✅ Identificar productos críticos
      const criticalProducts = report
        .filter(
          (p) =>
            p.current_stock === 0 ||
            (p.current_stock <= p.min_stock && p.status === "active"),
        )
        .slice(0, 10);

      // ✅ Preparar alertas si se solicitan
      let alerts = [];
      if (include_alerts === "true") {
        alerts = criticalProducts.map((product) => ({
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          current_stock: product.current_stock,
          min_stock: product.min_stock,
          max_stock: product.max_stock,
          severity: product.current_stock === 0 ? "critical" : "high",
          message:
            product.current_stock === 0
              ? `¡STOCK AGOTADO! ${product.name}`
              : `Stock bajo: ${product.name} (${product.current_stock}/${product.min_stock})`,
          recommended_action:
            product.current_stock === 0
              ? "Reabastecer urgentemente"
              : "Reabastecer pronto",
        }));
      }

      // ✅ Construir respuesta
      const responseData = {
        report,
        metrics,
        alerts,
        critical_products: criticalProducts,
        summary: {
          generated_at: new Date().toISOString(),
          generated_by: req.userId,
          filters_applied: Object.keys(req.query).length,
          cache_info: {
            cached: process.env.ENABLE_CACHE === "true",
            ttl_seconds:
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.REPORT,
          },
        },
        export_options: inventoryController.checkInventoryPermissions(
          req.userRole,
          "export",
        )
          ? [
              {
                format: "csv",
                url: `${req.protocol}://${req.get("host")}/api/inventory/report/export/csv?${new URLSearchParams(req.query).toString()}`,
                description: "Exportar a CSV",
              },
              {
                format: "pdf",
                url: `${req.protocol}://${req.get("host")}/api/inventory/report/export/pdf?${new URLSearchParams(req.query).toString()}`,
                description: "Exportar a PDF con gráficos",
              },
            ]
          : [],
      };

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Reporte de stock generado exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error generando reporte de stock:", {
        error: error.message,
        query: req.query,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al generar reporte de stock",
        "STOCK_REPORT_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener productos con stock bajo mejorado
  getLowStockReport: async (req, res) => {
    try {
      const {
        threshold,
        category_id,
        severity = "all",
        include_details = "false",
      } = req.query;

      logger.debug("Obteniendo reporte de stock bajo", {
        userId: req.userId,
        filters: { threshold, category_id, severity },
      });

      // ✅ Verificar permisos
      if (
        !inventoryController.checkInventoryPermissions(req.userRole, "view")
      ) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para ver reportes de stock bajo",
          "INSUFFICIENT_PERMISSIONS",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      const lowStockProducts = await Inventory.getLowStockProducts(
        threshold ? parseInt(threshold, 10) : null,
        category_id,
        severity,
      );

      // ✅ Agrupar por severidad
      const groupedBySeverity = {
        critical: lowStockProducts.filter((p) => p.current_stock === 0),
        high: lowStockProducts.filter(
          (p) => p.current_stock > 0 && p.current_stock <= p.min_stock,
        ),
        medium: lowStockProducts.filter(
          (p) =>
            p.current_stock > p.min_stock &&
            p.current_stock <= p.min_stock * 1.5,
        ),
        low: lowStockProducts.filter(
          (p) =>
            p.current_stock > p.min_stock * 1.5 &&
            p.current_stock <= p.min_stock * 2,
        ),
      };

      // ✅ Calcular necesidades de reabastecimiento
      const replenishmentNeeds = lowStockProducts.map((product) => ({
        product_id: product.id,
        product_name: product.name,
        sku: product.sku,
        current_stock: product.current_stock,
        min_stock: product.min_stock,
        max_stock: product.max_stock,
        unit_price: product.price || 0,
        needed_quantity: Math.max(product.min_stock - product.current_stock, 0),
        suggested_order: Math.max(product.max_stock - product.current_stock, 0),
        urgency:
          product.current_stock === 0
            ? "critical"
            : product.current_stock <= product.min_stock
              ? "high"
              : product.current_stock <= product.min_stock * 1.5
                ? "medium"
                : "low",
        last_replenishment: product.last_in_date,
        days_since_last_replenishment: product.last_in_date
          ? Math.floor(
              (new Date() - new Date(product.last_in_date)) /
                (1000 * 60 * 60 * 24),
            )
          : null,
        category_name: product.category_name,
      }));

      // ✅ Filtrar por severidad si se especifica
      let filteredReplenishment = replenishmentNeeds;
      if (severity !== "all") {
        filteredReplenishment = replenishmentNeeds.filter(
          (item) => item.urgency === severity,
        );
      }

      // ✅ Calcular totales
      const totalNeededQuantity = filteredReplenishment.reduce(
        (sum, item) => sum + item.needed_quantity,
        0,
      );
      const totalSuggestedOrder = filteredReplenishment.reduce(
        (sum, item) => sum + item.suggested_order,
        0,
      );
      const estimatedCost = filteredReplenishment.reduce(
        (sum, item) => sum + item.needed_quantity * item.unit_price,
        0,
      );

      // ✅ Construir respuesta
      const responseData = {
        low_stock_products:
          include_details === "true"
            ? lowStockProducts
            : lowStockProducts.length,
        grouped_by_severity: groupedBySeverity,
        replenishment_needs: filteredReplenishment,
        summary: {
          total_low_stock: lowStockProducts.length,
          critical: groupedBySeverity.critical.length,
          high: groupedBySeverity.high.length,
          medium: groupedBySeverity.medium.length,
          low: groupedBySeverity.low.length,
          total_needed_quantity: totalNeededQuantity,
          total_suggested_order: totalSuggestedOrder,
          estimated_cost: estimatedCost.toFixed(2),
          currency: "USD", // Esto debería venir de configuración
        },
      };

      // ✅ Agregar acciones si el usuario tiene permisos
      if (
        inventoryController.checkInventoryPermissions(req.userRole, "create")
      ) {
        responseData.actions = [
          {
            action: "generate_purchase_order",
            url: `${req.protocol}://${req.get("host")}/api/inventory/generate-purchase-order`,
            method: "POST",
            description: "Generar orden de compra automática",
            requires_permission: true,
          },
        ];
      }

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Reporte de stock bajo generado exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo productos con stock bajo:", {
        error: error.message,
        query: req.query,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al obtener productos con stock bajo",
        "LOW_STOCK_REPORT_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Ajustar inventario mejorado
  adjustInventory: async (req, res) => {
    let transaction;

    try {
      const { product_id, quantity, reason, discrepancy_type, notes } =
        req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      logger.info("Ajustando inventario", {
        userId,
        userRole,
        productId: product_id,
        quantity,
        discrepancyType: discrepancy_type,
      });

      // ✅ Verificar permisos
      if (!inventoryController.checkInventoryPermissions(userRole, "adjust")) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "Se requieren permisos especiales para ajustes de inventario",
          "INSUFFICIENT_PERMISSIONS",
          { required_roles: ["manager", "admin"] },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validaciones
      if (!product_id || !quantity || quantity < 0) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "Producto y cantidad requeridos. Cantidad debe ser >= 0",
          "INVALID_ADJUSTMENT_DATA",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Buscar producto
      const product = await Product.findById(product_id);
      if (!product) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          404,
          "Producto no encontrado",
          "PRODUCT_NOT_FOUND",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Obtener stock actual
      const currentStock = await Inventory.getCurrentStock(product_id);
      const difference = quantity - currentStock;

      // ✅ Verificar si hay diferencia
      if (difference === 0) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "El stock actual ya es igual a la cantidad especificada",
          "NO_ADJUSTMENT_NEEDED",
          { current_stock: currentStock },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Determinar tipo de movimiento
      const movementType = difference > 0 ? "in" : "out";
      const movementQuantity = Math.abs(difference);

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Crear movimiento de ajuste
      const movementId = await Inventory.create(
        {
          product_id,
          quantity: movementQuantity,
          movement_type: movementType,
          reason: `Ajuste: ${reason || discrepancy_type || "Corrección de inventario"}. Stock anterior: ${currentStock}`,
          reference_number: `ADJ-${Date.now()}-${product_id}`,
          created_by: userId,
          status: "completed",
          adjustment_type: discrepancy_type || "other",
          notes:
            notes || `Ajuste manual realizado por ${userId}. ${reason || ""}`,
          metadata: {
            old_stock: currentStock,
            new_stock: quantity,
            difference,
            discrepancy_type,
            is_adjustment: true,
          },
        },
        transaction,
      );

      // ✅ Crear transacción de auditoría
      await Transaction.create(
        {
          product_id,
          quantity: movementQuantity,
          type: "adjustment",
          notes: `Ajuste de inventario: ${reason || discrepancy_type || "Corrección"}. Stock anterior: ${currentStock}, Stock nuevo: ${quantity}`,
          reference_number: `ADJ-${movementId}`,
          created_by: userId,
          metadata: {
            movement_id: movementId,
            old_stock: currentStock,
            new_stock: quantity,
            difference,
            discrepancy_type,
            adjusted_by: userId,
            user_role: userRole,
          },
        },
        transaction,
      );

      // ✅ Registrar discrepancia si es significativa
      let discrepancyRecorded = false;
      if (
        Math.abs(difference) > currentStock * 0.1 ||
        Math.abs(difference) > 10
      ) {
        await require("../models/Discrepancy").create(
          {
            product_id,
            expected_stock: currentStock,
            actual_stock: quantity,
            difference: Math.abs(difference),
            discrepancy_type: discrepancy_type || "unexplained",
            movement_id: movementId,
            investigated_by: userId,
            status: "pending",
            notes: `Discrepancia detectada durante ajuste. ${notes || ""}`,
            severity:
              Math.abs(difference) > currentStock * 0.25 ? "high" : "medium",
          },
          transaction,
        );
        discrepancyRecorded = true;
      }

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "inventory_adjusted",
          user_id: userId,
          details: {
            product_id,
            product_name: product.name,
            old_stock: currentStock,
            new_stock: quantity,
            difference,
            movement_id: movementId,
            discrepancy_type,
            reason,
            discrepancy_recorded,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      logger.info("Inventario ajustado exitosamente", {
        movementId,
        productId: product_id,
        oldStock: currentStock,
        newStock: quantity,
        difference,
        adjustedBy: userId,
      });

      // ✅ Invalidar caché
      await inventoryController.invalidateInventoryCache(
        product_id,
        movementId,
      );

      // ✅ Verificar alertas de stock después del ajuste
      const alerts = await inventoryController.checkStockAlerts(
        product,
        quantity,
        movementType,
      );

      // ✅ Construir respuesta
      const responseData = {
        movement_id: movementId,
        product: {
          id: product_id,
          name: product.name,
          sku: product.sku,
        },
        adjustment: {
          old_stock: currentStock,
          new_stock: quantity,
          difference,
          type: movementType,
          quantity: movementQuantity,
          reason: reason || discrepancy_type,
        },
        flags: {
          significant_discrepancy: Math.abs(difference) > currentStock * 0.1,
          requires_investigation: Math.abs(difference) > 100,
          discrepancy_recorded: discrepancyRecorded,
        },
        alerts: alerts.length > 0 ? alerts : undefined,
        next_steps: [
          {
            action: "review_discrepancy",
            required: discrepancyRecorded,
            description: "Revisar discrepancia registrada",
          },
        ],
      };

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Inventario ajustado exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      // ✅ Rollback de transacción si existe
      if (transaction) {
        try {
          await database.rollbackTransaction(transaction);
        } catch (rollbackError) {
          logger.error("Error durante rollback de transacción:", rollbackError);
        }
      }

      logger.error("Error ajustando inventario:", {
        error: error.message,
        body: req.body,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al ajustar inventario",
        "INVENTORY_ADJUSTMENT_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener stock actual de producto con caché
  getCurrentStock: async (req, res) => {
    try {
      const productId = parseInt(req.params.productId, 10);

      logger.debug("Obteniendo stock actual", {
        productId,
        userId: req.userId,
      });

      // ✅ Validar ID
      if (!productId || productId <= 0) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          400,
          "ID de producto inválido",
          "INVALID_PRODUCT_ID",
          { provided_id: req.params.productId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Clave de caché
      const cacheKey = `stock:${productId}`;
      let stockData;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          stockData = await cacheService.get(cacheKey);
          if (stockData) {
            logger.debug("Stock obtenido de caché", { productId });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!stockData) {
        // Verificar que el producto exista
        const product = await Product.findById(productId);
        if (!product) {
          const errorResponse = inventoryController.buildInventoryErrorResponse(
            404,
            "Producto no encontrado",
            "PRODUCT_NOT_FOUND",
            { productId },
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }

        const [currentStock, recentMovements, stockStats] = await Promise.all([
          Inventory.getCurrentStock(productId),
          Inventory.getRecentMovements(productId, 5),
          Inventory.getStockStats(productId),
        ]);

        stockData = {
          product: {
            id: product.id,
            name: product.name,
            sku: product.sku,
            status: product.status,
            category_name: product.category_name,
            image_url: product.image_url,
            unit: product.unit,
          },
          stock: {
            current: currentStock,
            min: product.min_stock,
            max: product.max_stock,
            status:
              currentStock === 0
                ? "out_of_stock"
                : currentStock <= product.min_stock
                  ? "low_stock"
                  : currentStock > product.max_stock
                    ? "overstock"
                    : "normal",
            percentage:
              product.max_stock > 0
                ? Math.min(100, (currentStock / product.max_stock) * 100)
                : 0,
            value: currentStock * (product.price || 0),
          },
          recent_movements: recentMovements,
          statistics: stockStats,
        };

        // ✅ Cachear datos
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              stockData,
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.STOCK,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Verificar permisos para ver detalles completos
      if (
        !inventoryController.checkInventoryPermissions(req.userRole, "view")
      ) {
        // Para usuarios sin permisos, limitar información
        delete stockData.statistics;
        delete stockData.recent_movements;
        stockData.stock = {
          current: stockData.stock.current,
          status: stockData.stock.status,
        };
      }

      // ✅ Construir respuesta
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const actions = [
        {
          action: "view_history",
          url: `${baseUrl}/api/inventory/products/${productId}/history`,
          method: "GET",
        },
      ];

      // ✅ Agregar acciones según permisos
      if (inventoryController.checkInventoryPermissions(req.userRole, "view")) {
        actions.push({
          action: "view_product",
          url: `${baseUrl}/api/products/${productId}`,
          method: "GET",
        });
      }

      if (
        inventoryController.checkInventoryPermissions(req.userRole, "create")
      ) {
        actions.push({
          action: "create_movement",
          url: `${baseUrl}/api/inventory/movements`,
          method: "POST",
          description: "Crear movimiento de inventario",
        });
      }

      const responseData = {
        ...stockData,
        actions,
        cache_info: {
          cached: process.env.ENABLE_CACHE === "true",
          ttl_seconds: inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.STOCK,
        },
      };

      const successResponse = inventoryController.buildInventorySuccessResponse(
        responseData,
        "Stock actual obtenido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo stock actual:", {
        error: error.message,
        productId: req.params.productId,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al obtener stock actual",
        "STOCK_FETCH_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener resumen de inventario
  getInventorySummary: async (req, res) => {
    try {
      logger.debug("Obteniendo resumen de inventario", { userId: req.userId });

      // ✅ Verificar permisos
      if (
        !inventoryController.checkInventoryPermissions(req.userRole, "view")
      ) {
        const errorResponse = inventoryController.buildInventoryErrorResponse(
          403,
          "No tienes permisos para ver resumen de inventario",
          "INSUFFICIENT_PERMISSIONS",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Clave de caché
      const cacheKey = "inventory:summary";
      let summary;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          summary = await cacheService.get(cacheKey);
          if (summary) {
            logger.debug("Resumen obtenido de caché");
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, generar resumen
      if (!summary) {
        summary = await Inventory.getInventorySummary();

        // ✅ Cachear resumen
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              summary,
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.REPORT,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      const successResponse = inventoryController.buildInventorySuccessResponse(
        {
          ...summary,
          generated_at: new Date().toISOString(),
          cache_info: {
            cached: process.env.ENABLE_CACHE === "true",
            ttl_seconds:
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.REPORT,
          },
        },
        "Resumen de inventario obtenido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo resumen de inventario:", {
        error: error.message,
        userId: req.userId,
      });

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        500,
        "Error interno al obtener resumen",
        "INVENTORY_SUMMARY_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Health check para inventario
  healthCheck: async (req, res) => {
    try {
      // ✅ Verificar conexión a base de datos
      const dbStatus = await Inventory.healthCheck();

      // ✅ Verificar caché si está habilitado
      let cacheStatus = "disabled";
      if (process.env.ENABLE_CACHE === "true") {
        try {
          await cacheService.ping();
          cacheStatus = "healthy";
        } catch (error) {
          cacheStatus = "unhealthy";
        }
      }

      // ✅ Obtener métricas básicas
      const metrics = await Inventory.getHealthMetrics();

      const successResponse = inventoryController.buildInventorySuccessResponse(
        {
          service: "inventory-controller",
          status: "healthy",
          timestamp: new Date().toISOString(),
          dependencies: {
            database: dbStatus ? "connected" : "disconnected",
            cache: cacheStatus,
          },
          metrics: {
            total_products: metrics.total_products || 0,
            total_movements: metrics.total_movements || 0,
            low_stock_items: metrics.low_stock_items || 0,
            out_of_stock_items: metrics.out_of_stock_items || 0,
            today_movements: metrics.today_movements || 0,
          },
          limits: {
            max_daily_movements:
              inventoryController.INVENTORY_CONSTANTS.MAX_DAILY_MOVEMENTS,
            cache_ttl_stock:
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.STOCK,
            cache_ttl_history:
              inventoryController.INVENTORY_CONSTANTS.CACHE_TTL.HISTORY,
          },
        },
        "Servicio de inventario funcionando correctamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error en health check de inventario:", error);

      const errorResponse = inventoryController.buildInventoryErrorResponse(
        503,
        "Servicio de inventario no disponible",
        "INVENTORY_SERVICE_UNAVAILABLE",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },
};

module.exports = inventoryController;
