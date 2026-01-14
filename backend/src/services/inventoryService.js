const { query, executeInTransaction } = require("../config/database");
const emailService = require("./emailService");
const cacheService = require("./cacheService");
const logger = require("../utils/logger");
const config = require("../config/env");

class InventoryService {
  constructor() {
    this.lowStockThreshold = config.inventory?.lowStockThreshold || 5;
    this.reorderPointMultiplier =
      config.inventory?.reorderPointMultiplier || 1.5;
    this.cachePrefix = "inventory:";
  }

  // ✅ CORRECCIÓN: Método mejorado para verificar stock bajo
  async checkLowStockAlerts(options = {}) {
    const cacheKey = `${this.cachePrefix}low-stock-alerts:${JSON.stringify(options)}`;

    // ✅ MEJORA: Usar cache para evitar cálculos repetidos
    const cachedResult = await cacheService.get(cacheKey);
    if (cachedResult.hit && cachedResult.value) {
      logger.debug("Returning cached low stock alerts");
      return cachedResult.value;
    }

    try {
      const {
        threshold = this.lowStockThreshold,
        includeZeroStock = true,
        categoryId = null,
        sendEmail = true,
        recipients = config.email?.alertRecipients || [],
      } = options;

      // ✅ CORRECCIÓN: Consulta SQL corregida
      let sql = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.price,
          p.cost,
          p.min_stock,
          p.max_stock,
          c.name as category_name,
          COALESCE(
            (
              SELECT SUM(
                CASE 
                  WHEN im.movement_type = 'IN' THEN im.quantity 
                  ELSE -im.quantity 
                END
              )
              FROM inventory_movements im
              WHERE im.product_id = p.id
            ), 0
          ) as current_stock,
          (
            SELECT MAX(created_at)
            FROM inventory_movements 
            WHERE product_id = p.id AND movement_type = 'IN'
          ) as last_purchase_date
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'active'
      `;

      const params = [];
      const conditions = [];

      if (includeZeroStock) {
        conditions.push(`
          COALESCE(
            (
              SELECT SUM(
                CASE 
                  WHEN im.movement_type = 'IN' THEN im.quantity 
                  ELSE -im.quantity 
                END
              )
              FROM inventory_movements im
              WHERE im.product_id = p.id
            ), 0
          ) <= ?
        `);
        params.push(threshold);
      } else {
        conditions.push(`
          COALESCE(
            (
              SELECT SUM(
                CASE 
                  WHEN im.movement_type = 'IN' THEN im.quantity 
                  ELSE -im.quantity 
                END
              )
              FROM inventory_movements im
              WHERE im.product_id = p.id
            ), 0
          ) BETWEEN 1 AND ?
        `);
        params.push(threshold);
      }

      if (categoryId) {
        conditions.push("p.category_id = ?");
        params.push(categoryId);
      }

      if (conditions.length > 0) {
        sql += " AND " + conditions.join(" AND ");
      }

      sql += " ORDER BY current_stock ASC LIMIT 100";

      const lowStockProducts = await query(sql, params);

      if (lowStockProducts.length === 0) {
        const result = {
          success: true,
          alertSent: false,
          products: [],
          message: "No products below threshold",
        };

        // ✅ MEJORA: Cachear resultado vacío también
        await cacheService.set(cacheKey, result, { ttl: 300 });
        return result;
      }

      // Preparar datos para email
      const alertData = {
        products: lowStockProducts,
        threshold,
        generatedAt: new Date().toISOString(),
        categoryFilter: categoryId
          ? `Categoría ID: ${categoryId}`
          : "Todas las categorías",
      };

      let emailResult = { sent: false };

      // ✅ CORRECCIÓN: Verificar transporter correctamente
      if (sendEmail && recipients.length > 0 && emailService.transporter) {
        try {
          emailResult = await emailService.sendLowStockAlert(
            lowStockProducts,
            recipients,
            alertData,
          );
        } catch (emailError) {
          logger.error("Error sending low stock alert email:", emailError);
        }
      }

      // Registrar alerta en base de datos
      await this.logStockAlert(lowStockProducts, threshold, emailResult.sent);

      // Calcular métricas
      const metrics = this.calculateLowStockMetrics(lowStockProducts);

      logger.info("Low stock alerts processed", {
        productCount: lowStockProducts.length,
        threshold,
        emailSent: emailResult.sent,
        recipientsCount: recipients.length,
        metrics,
      });

      const result = {
        success: true,
        alertSent: emailResult.sent,
        products: lowStockProducts,
        metrics,
        emailResult,
      };

      // ✅ MEJORA: Cachear resultado
      await cacheService.set(cacheKey, result, { ttl: 60 });
      return result;
    } catch (error) {
      logger.error("Error checking low stock alerts:", error);
      throw new Error(`Failed to process low stock alerts: ${error.message}`);
    }
  }

  // ✅ CORRECCIÓN: Método de inventario físico mejorado
  async performPhysicalInventory(inventoryData, userId) {
    return await executeInTransaction(async (connection) => {
      try {
        const {
          productId,
          countedQuantity,
          locationId = null,
          notes = "",
          tolerance = 0.05,
          autoAdjust = true,
        } = inventoryData;

        // ✅ CORRECCIÓN: Validar producto con parámetros correctos
        const [product] = await connection.execute(
          "SELECT * FROM products WHERE id = ? AND status = ?",
          [productId, "active"],
        );

        if (product.length === 0) {
          throw new Error("Producto no encontrado o inactivo");
        }

        // Obtener stock actual del sistema
        const systemStock = await this.getCurrentStock(
          productId,
          locationId,
          connection,
        );

        // Calcular diferencia y porcentaje
        const difference = countedQuantity - systemStock;
        const differencePercentage =
          systemStock > 0
            ? Math.abs(difference) / systemStock
            : Math.abs(difference);

        // Verificar si está dentro de la tolerancia
        const withinTolerance = differencePercentage <= tolerance;

        // ✅ CORRECCIÓN: Insertar con parámetros correctos
        const [inventoryResult] = await connection.execute(
          `INSERT INTO physical_inventory_results 
           (product_id, location_id, system_stock, counted_quantity, difference, 
            difference_percentage, within_tolerance, notes, conducted_by, conducted_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            productId,
            locationId,
            systemStock,
            countedQuantity,
            difference,
            differencePercentage,
            withinTolerance,
            notes,
            userId,
          ],
        );

        const resultId = inventoryResult.insertId;

        // Si hay diferencia y autoAdjust está activado, crear ajuste
        let adjustmentId = null;
        if (difference !== 0 && autoAdjust) {
          const movementType = difference > 0 ? "IN" : "OUT";
          const movementQuantity = Math.abs(difference);

          const [adjustment] = await connection.execute(
            `INSERT INTO inventory_movements 
             (product_id, quantity, movement_type, reference_type, reference_id, 
              reason, location_id, created_by)
             VALUES (?, ?, ?, 'PHYSICAL_INVENTORY', ?, ?, ?, ?)`,
            [
              productId,
              movementQuantity,
              movementType,
              resultId,
              `Ajuste por inventario físico: ${notes}`,
              locationId,
              userId,
            ],
          );

          adjustmentId = adjustment.insertId;
        }

        // ✅ CORRECCIÓN: Actualizar estadísticas del producto
        await connection.execute(
          `UPDATE products 
           SET last_inventory_date = NOW(), 
               inventory_count = COALESCE(inventory_count, 0) + 1,
               last_counted_quantity = ?,
               inventory_variance = ?
           WHERE id = ?`,
          [countedQuantity, difference, productId],
        );

        // ✅ MEJORA: Invalidar cache relacionado
        await cacheService.invalidateProductCache(productId);

        logger.info("Physical inventory completed", {
          productId,
          systemStock,
          countedQuantity,
          difference,
          withinTolerance,
          resultId,
          adjustmentId,
          userId,
        });

        return {
          success: true,
          resultId,
          adjustmentId,
          productId,
          systemStock,
          countedQuantity,
          difference,
          differencePercentage: (differencePercentage * 100).toFixed(2) + "%",
          withinTolerance,
          requiresAdjustment: difference !== 0 && !withinTolerance,
          autoAdjusted: difference !== 0 && autoAdjust,
        };
      } catch (error) {
        logger.error("Error performing physical inventory:", error);
        throw error;
      }
    });
  }

  // ✅ CORRECCIÓN: Transferir stock con mejor manejo de errores
  async transferStock(transferData, userId) {
    return await executeInTransaction(async (connection) => {
      try {
        const {
          productId,
          fromLocationId,
          toLocationId,
          quantity,
          reason = "",
          validateAvailability = true,
        } = transferData;

        // ✅ CORRECCIÓN: Validar que las ubicaciones sean diferentes
        if (fromLocationId === toLocationId) {
          throw new Error(
            "Las ubicaciones de origen y destino deben ser diferentes",
          );
        }

        // Validar producto
        const [product] = await connection.execute(
          "SELECT id, name FROM products WHERE id = ? AND status = ?",
          [productId, "active"],
        );

        if (product.length === 0) {
          throw new Error("Producto no encontrado o inactivo");
        }

        // Validar disponibilidad en ubicación de origen
        if (validateAvailability) {
          const availableStock = await this.getLocationStock(
            productId,
            fromLocationId,
            connection,
          );

          if (availableStock < quantity) {
            throw new Error(
              `Stock insuficiente en ubicación origen. Disponible: ${availableStock}, Solicitado: ${quantity}`,
            );
          }
        }

        // Registrar movimiento de salida
        const [exitMovement] = await connection.execute(
          `INSERT INTO inventory_movements 
           (product_id, quantity, movement_type, reference_type, location_id, 
            reason, created_by)
           VALUES (?, ?, 'OUT', 'TRANSFER', ?, ?, ?)`,
          [
            productId,
            quantity,
            fromLocationId,
            `Transferencia a ubicación ${toLocationId}: ${reason}`,
            userId,
          ],
        );

        // Registrar movimiento de entrada
        const [entryMovement] = await connection.execute(
          `INSERT INTO inventory_movements 
           (product_id, quantity, movement_type, reference_type, location_id, 
            reason, created_by)
           VALUES (?, ?, 'IN', 'TRANSFER', ?, ?, ?)`,
          [
            productId,
            quantity,
            toLocationId,
            `Transferencia desde ubicación ${fromLocationId}: ${reason}`,
            userId,
          ],
        );

        // Registrar la transferencia
        const [transferRecord] = await connection.execute(
          `INSERT INTO stock_transfers 
           (product_id, from_location_id, to_location_id, quantity, 
            exit_movement_id, entry_movement_id, reason, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            productId,
            fromLocationId,
            toLocationId,
            quantity,
            exitMovement.insertId,
            entryMovement.insertId,
            reason,
            userId,
          ],
        );

        // ✅ MEJORA: Invalidar cache
        await cacheService.invalidateProductCache(productId);

        logger.info("Stock transfer completed", {
          productId,
          fromLocationId,
          toLocationId,
          quantity,
          transferId: transferRecord.insertId,
          exitMovementId: exitMovement.insertId,
          entryMovementId: entryMovement.insertId,
          userId,
        });

        return {
          success: true,
          transferId: transferRecord.insertId,
          exitMovementId: exitMovement.insertId,
          entryMovementId: entryMovement.insertId,
          productId,
          fromLocationId,
          toLocationId,
          quantity,
        };
      } catch (error) {
        logger.error("Error transferring stock:", error);
        throw error;
      }
    });
  }

  // ✅ CORRECCIÓN: Método de valor de inventario optimizado
  async calculateInventoryValue(options = {}) {
    const cacheKey = `${this.cachePrefix}inventory-value:${JSON.stringify(options)}`;

    // ✅ MEJORA: Cachear cálculos costosos
    const cached = await cacheService.get(cacheKey);
    if (cached.hit && cached.value) {
      return cached.value;
    }

    try {
      const {
        valuationMethod = "AVERAGE",
        includeInactive = false,
        categoryId = null,
        locationId = null,
        asOfDate = new Date(),
      } = options;

      // ✅ CORRECCIÓN: Consulta optimizada
      let sql = `
        SELECT 
          p.id,
          p.name,
          p.sku,
          p.price,
          p.cost,
          c.name as category_name,
          (
            SELECT COALESCE(SUM(
              CASE 
                WHEN im.movement_type = 'IN' THEN im.quantity 
                ELSE -im.quantity 
              END
            ), 0)
            FROM inventory_movements im
            WHERE im.product_id = p.id
              AND im.created_at <= ?
          ) as current_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
      `;

      const params = [asOfDate];
      const conditions = [];

      if (!includeInactive) {
        conditions.push('p.status = "active"');
      }

      if (categoryId) {
        conditions.push("p.category_id = ?");
        params.push(categoryId);
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      const products = await query(sql, params);

      // Calcular valor según método de valuación
      let totalValue = 0;
      const valuations = [];

      for (const product of products) {
        let productValue = 0;

        switch (valuationMethod) {
          case "FIFO":
            productValue = await this.calculateFIFOValue(product.id, asOfDate);
            break;

          case "LIFO":
            productValue = await this.calculateLIFOValue(product.id, asOfDate);
            break;

          case "AVERAGE":
          default:
            if (product.current_stock > 0) {
              const avgCostResult = await query(
                `SELECT AVG(cost) as avg_cost 
                 FROM inventory_movements 
                 WHERE product_id = ? AND movement_type = 'IN' AND created_at <= ?`,
                [product.id, asOfDate],
              );

              const avgCost = avgCostResult[0]?.avg_cost || product.cost || 0;
              productValue = product.current_stock * avgCost;
            }
            break;
        }

        totalValue += productValue;

        valuations.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          stock: product.current_stock,
          unitCost: product.cost || 0,
          totalValue: productValue,
          valuationMethod,
        });
      }

      // Calcular ratios
      const productCount = products.length;
      const inStockCount = products.filter((p) => p.current_stock > 0).length;
      const outOfStockCount = products.filter(
        (p) => p.current_stock <= 0,
      ).length;
      const lowStockCount = products.filter(
        (p) => p.current_stock > 0 && p.current_stock <= this.lowStockThreshold,
      ).length;

      const result = {
        totalValue: parseFloat(totalValue.toFixed(2)),
        valuationMethod,
        asOfDate,
        metrics: {
          productCount,
          inStockCount,
          outOfStockCount,
          lowStockCount,
          averageValuePerProduct:
            productCount > 0 ? totalValue / productCount : 0,
          inventoryTurnover: await this.calculateInventoryTurnover(asOfDate),
        },
        byCategory: await this.getValueByCategory(asOfDate, categoryId),
        valuations,
      };

      // ✅ MEJORA: Cachear resultado
      await cacheService.set(cacheKey, result, { ttl: 300 });
      return result;
    } catch (error) {
      logger.error("Error calculating inventory value:", error);
      throw error;
    }
  }

  // ✅ MEJORA: Métodos auxiliares optimizados
  async getCurrentStock(productId, locationId = null, connection = null) {
    const db = connection || query;

    let sql = `
      SELECT COALESCE(SUM(
        CASE WHEN movement_type = 'IN' THEN quantity ELSE -quantity END
      ), 0) as current_stock
      FROM inventory_movements
      WHERE product_id = ?
    `;

    const params = [productId];

    if (locationId) {
      sql += " AND location_id = ?";
      params.push(locationId);
    }

    const [result] = await db(sql, params);
    return result ? result.current_stock : 0;
  }

  async getLocationStock(productId, locationId, connection = null) {
    return this.getCurrentStock(productId, locationId, connection);
  }

  async logStockAlert(products, threshold, emailSent) {
    try {
      const alertData = {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          current_stock: p.current_stock,
          min_stock: p.min_stock,
        })),
        threshold,
        emailSent,
        timestamp: new Date().toISOString(),
      };

      await query(
        `INSERT INTO stock_alerts 
         (alert_data, product_count, threshold, email_sent, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [JSON.stringify(alertData), products.length, threshold, emailSent],
      );
    } catch (error) {
      logger.warn("Failed to log stock alert:", error);
    }
  }

  calculateLowStockMetrics(products) {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        zeroStockCount: 0,
        averageDeficit: 0,
        totalDeficitValue: 0,
        criticalProducts: 0,
      };
    }

    let totalDeficit = 0;
    let totalDeficitValue = 0;
    let zeroStockCount = 0;
    let criticalProducts = 0;

    products.forEach((product) => {
      const deficit = (product.min_stock || 0) - product.current_stock;
      totalDeficit += Math.max(deficit, 0);

      if (product.current_stock <= 0) {
        zeroStockCount++;
      }

      if (deficit >= (product.min_stock || 0) * 2) {
        criticalProducts++;
      }

      if (product.cost) {
        totalDeficitValue += Math.max(deficit, 0) * product.cost;
      }
    });

    return {
      totalProducts: products.length,
      zeroStockCount,
      averageDeficit: products.length > 0 ? totalDeficit / products.length : 0,
      totalDeficitValue,
      criticalProducts,
    };
  }

  // ✅ CORRECCIÓN: Métodos faltantes implementados
  async getValueByCategory(asOfDate, filterCategoryId = null) {
    let sql = `
      SELECT 
        c.id,
        c.name,
        COUNT(p.id) as product_count,
        SUM(
          COALESCE((
            SELECT SUM(
              CASE 
                WHEN im.movement_type = 'IN' THEN im.quantity 
                ELSE -im.quantity 
              END
            )
            FROM inventory_movements im
            WHERE im.product_id = p.id AND im.created_at <= ?
          ), 0) * COALESCE(p.cost, 0)
        ) as total_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id AND p.status = 'active'
    `;

    const params = [asOfDate];
    const conditions = [];

    if (filterCategoryId) {
      conditions.push("c.id = ?");
      params.push(filterCategoryId);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " GROUP BY c.id, c.name ORDER BY total_value DESC";

    return await query(sql, params);
  }

  async calculateFIFOValue(productId, asOfDate) {
    const movements = await query(
      `SELECT movement_type, quantity, cost, created_at
       FROM inventory_movements
       WHERE product_id = ? AND created_at <= ?
       ORDER BY created_at ASC`,
      [productId, asOfDate],
    );

    let remainingStock = 0;
    let totalValue = 0;
    const layers = [];

    for (const movement of movements) {
      if (movement.movement_type === "IN") {
        layers.push({
          quantity: movement.quantity,
          cost: movement.cost,
          date: movement.created_at,
        });
        remainingStock += movement.quantity;
      } else {
        let toRemove = movement.quantity;

        while (toRemove > 0 && layers.length > 0) {
          const oldestLayer = layers[0];

          if (oldestLayer.quantity <= toRemove) {
            totalValue += oldestLayer.quantity * oldestLayer.cost;
            toRemove -= oldestLayer.quantity;
            layers.shift();
          } else {
            totalValue += toRemove * oldestLayer.cost;
            oldestLayer.quantity -= toRemove;
            toRemove = 0;
          }
        }

        remainingStock = Math.max(0, remainingStock - movement.quantity);
      }
    }

    const remainingValue = layers.reduce(
      (sum, layer) => sum + layer.quantity * layer.cost,
      0,
    );

    return remainingValue;
  }

  async calculateLIFOValue(productId, asOfDate) {
    const movements = await query(
      `SELECT movement_type, quantity, cost, created_at
       FROM inventory_movements
       WHERE product_id = ? AND created_at <= ?
       ORDER BY created_at ASC`,
      [productId, asOfDate],
    );

    let remainingStock = 0;
    let totalValue = 0;
    const layers = [];

    for (const movement of movements) {
      if (movement.movement_type === "IN") {
        layers.push({
          quantity: movement.quantity,
          cost: movement.cost,
          date: movement.created_at,
        });
        remainingStock += movement.quantity;
      } else {
        let toRemove = movement.quantity;

        while (toRemove > 0 && layers.length > 0) {
          const newestLayer = layers[layers.length - 1];

          if (newestLayer.quantity <= toRemove) {
            totalValue += newestLayer.quantity * newestLayer.cost;
            toRemove -= newestLayer.quantity;
            layers.pop();
          } else {
            totalValue += toRemove * newestLayer.cost;
            newestLayer.quantity -= toRemove;
            toRemove = 0;
          }
        }

        remainingStock = Math.max(0, remainingStock - movement.quantity);
      }
    }

    const remainingValue = layers.reduce(
      (sum, layer) => sum + layer.quantity * layer.cost,
      0,
    );

    return remainingValue;
  }

  async calculateInventoryTurnover(asOfDate) {
    // Implementación simplificada
    const result = await query(
      `SELECT 
        COUNT(*) as total_movements,
        SUM(CASE WHEN movement_type = 'OUT' THEN quantity ELSE 0 END) as total_out
       FROM inventory_movements
       WHERE created_at <= ?`,
      [asOfDate],
    );

    const avgValue = await this.calculateInventoryValue({ asOfDate });

    if (avgValue.totalValue > 0 && result[0].total_out > 0) {
      return result[0].total_out / avgValue.totalValue;
    }

    return 0;
  }
}

// ✅ CORRECCIÓN: Exportar instancia singleton
module.exports = new InventoryService();
