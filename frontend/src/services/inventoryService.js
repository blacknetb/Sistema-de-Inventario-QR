import { get, post, put, del, requestWithRetry, clearCache } from "./api";
import notificationService from "./notificationService";

const createInventoryCache = () => {
  const cache = new Map();
  const pendingUpdates = new Map();

  return {
    get: (key) => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      cache.delete(key);
      return null;
    },

    set: (key, data, ttl = 2 * 60 * 1000) => {
      cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl,
      });
    },

    delete: (key) => {
      cache.delete(key);
    },

    clear: (pattern = null) => {
      if (pattern) {
        for (const key of cache.keys()) {
          if (key.includes(pattern)) {
            cache.delete(key);
          }
        }
      } else {
        cache.clear();
        pendingUpdates.clear();
      }
    },

    clearByProduct: (productId) => {
      for (const key of cache.keys()) {
        if (
          key.includes(`product_${productId}`) ||
          key.includes("inventory_")
        ) {
          cache.delete(key);
        }
      }
    },

    addPendingUpdate: (productId, quantityChange, operationId) => {
      if (!pendingUpdates.has(productId)) {
        pendingUpdates.set(productId, []);
      }
      pendingUpdates.get(productId).push({
        quantityChange,
        operationId,
        timestamp: Date.now(),
      });
    },

    getPendingUpdates: (productId) => {
      return pendingUpdates.get(productId) || [];
    },

    clearPendingUpdate: (productId, operationId) => {
      if (pendingUpdates.has(productId)) {
        const updates = pendingUpdates.get(productId);
        const filtered = updates.filter(
          (update) => update.operationId !== operationId
        );

        if (filtered.length === 0) {
          pendingUpdates.delete(productId);
        } else {
          pendingUpdates.set(productId, filtered);
        }
      }
    },

    clearAllPending: () => {
      pendingUpdates.clear();
    },
  };
};

const inventoryCache = createInventoryCache();

const validateMovementData = (movementData) => {
  const errors = [];
  const warnings = [];

  if (!movementData.product_id) {
    errors.push("El producto es obligatorio");
  } else {
    const productId = parseInt(movementData.product_id);
    if (isNaN(productId) || productId <= 0) {
      errors.push("ID de producto inválido");
    }
  }

  if (!movementData.quantity) {
    errors.push("La cantidad es obligatoria");
  } else {
    const quantity = parseFloat(movementData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      errors.push("La cantidad debe ser un número mayor a 0");
    } else if (quantity > 1000000) {
      warnings.push("La cantidad parece muy alta");
    }
  }

  if (
    !movementData.movement_type ||
    !["in", "out", "adjustment"].includes(movementData.movement_type)
  ) {
    errors.push('El tipo de movimiento debe ser "in", "out" o "adjustment"');
  }

  if (!movementData.reason || movementData.reason.trim().length < 3) {
    errors.push("La razón debe tener al menos 3 caracteres");
  }

  if (movementData.location && movementData.location.length > 100) {
    warnings.push("La ubicación es muy larga");
  }

  if (movementData.reference && movementData.reference.length > 50) {
    warnings.push("La referencia es muy larga");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const inventoryService = {
  createMovement: async (movementData, optimistic = true) => {
    try {
      const validation = validateMovementData(movementData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const operationId = `movement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      let productService = null;
      if (optimistic) {
        try {
          const productServiceModule = await import("./productService");
          productService =
            productServiceModule.default || productServiceModule.productService;
        } catch (error) {
          console.warn(
            "No se pudo cargar productService para actualización optimista:",
            error
          );
          optimistic = false;
        }
      }

      if (optimistic && productService) {
        const quantityChange =
          movementData.movement_type === "in"
            ? parseFloat(movementData.quantity)
            : -parseFloat(movementData.quantity);

        inventoryCache.addPendingUpdate(
          movementData.product_id,
          quantityChange,
          operationId
        );

        productService.updateStockLocally(
          movementData.product_id,
          quantityChange
        );

        notificationService.info("Registrando movimiento...", {
          id: operationId,
        });
      }

      const response = await post("/inventory/movements", movementData);

      if (response.success) {
        inventoryCache.clearByProduct(movementData.product_id);
        inventoryCache.clear("inventory_history");
        inventoryCache.clear("inventory_report");
        inventoryCache.clearPendingUpdate(movementData.product_id, operationId);

        if (productService) {
          productService.clearCache(movementData.product_id);
        }

        notificationService.dismissLoading(operationId);
        notificationService.success("Movimiento registrado exitosamente");
      } else {
        if (optimistic && productService) {
          const quantityChange =
            movementData.movement_type === "in"
              ? -parseFloat(movementData.quantity)
              : parseFloat(movementData.quantity);

          productService.updateStockLocally(
            movementData.product_id,
            quantityChange
          );
          inventoryCache.clearPendingUpdate(
            movementData.product_id,
            operationId
          );
        }

        notificationService.dismissLoading(operationId);
      }

      return response;
    } catch (error) {
      if (movementData.product_id) {
        const operationId = `movement_${Date.now()}`;
        inventoryCache.clearPendingUpdate(movementData.product_id, operationId);
      }

      notificationService.dismissLoading();
      throw error;
    }
  },

  adjustInventory: async (adjustmentData) => {
    try {
      if (
        !adjustmentData.product_id ||
        !adjustmentData.new_quantity ||
        !adjustmentData.reason
      ) {
        throw new Error("Producto, nueva cantidad y razón son obligatorios");
      }

      const newQuantity = parseFloat(adjustmentData.new_quantity);
      if (isNaN(newQuantity) || newQuantity < 0) {
        throw new Error(
          "La nueva cantidad debe ser un número mayor o igual a 0"
        );
      }

      const response = await post("/inventory/adjust", adjustmentData);

      if (response.success) {
        inventoryCache.clearByProduct(adjustmentData.product_id);
        inventoryCache.clear("inventory_history");
        inventoryCache.clear("inventory_report");

        try {
          const productServiceModule = await import("./productService");
          const productService =
            productServiceModule.default || productServiceModule.productService;
          productService.clearCache(adjustmentData.product_id);
        } catch (error) {
          console.warn("No se pudo limpiar cache del producto:", error);
        }

        notificationService.success("Inventario ajustado exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getHistory: async (params = {}, useCache = true) => {
    try {
      const cacheKey = `inventory_history_${JSON.stringify(params)}`;

      if (useCache) {
        const cached = inventoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/inventory/history", params);

      if (useCache && response.success) {
        inventoryCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getHistoryByProduct: async (productId, params = {}, useCache = true) => {
    try {
      const cacheKey = `inventory_product_${productId}_history_${JSON.stringify(params)}`;

      if (useCache) {
        const cached = inventoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(
        `/inventory/product/${productId}/history`,
        params
      );

      if (useCache && response.success) {
        inventoryCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getStockReport: async (useCache = true) => {
    try {
      const cacheKey = "inventory_report";

      if (useCache) {
        const cached = inventoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/inventory/report");

      if (useCache && response.success) {
        inventoryCache.set(cacheKey, response, 60 * 1000);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getLowStockReport: async (threshold = null, useCache = false) => {
    try {
      const cacheKey = `inventory_low_stock_${threshold || "default"}`;

      if (useCache) {
        const cached = inventoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const params = threshold ? { threshold } : {};
      const response = await get("/inventory/low-stock", params);

      if (useCache && response.success) {
        inventoryCache.set(cacheKey, response, 30 * 1000);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  getCurrentStock: async (productId, useCache = false) => {
    try {
      const cacheKey = `inventory_stock_${productId}`;

      if (useCache) {
        const cached = inventoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(`/inventory/product/${productId}/stock`);

      if (useCache && response.success) {
        inventoryCache.set(cacheKey, response, 15 * 1000);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  performPhysicalInventory: async (
    productId,
    countedQuantity,
    notes = "",
    adjustAutomatically = true
  ) => {
    try {
      if (countedQuantity < 0) {
        throw new Error("La cantidad contada no puede ser negativa");
      }

      const currentStockResponse = await this.getCurrentStock(productId, false);
      const systemStock = currentStockResponse.success
        ? currentStockResponse.data.current_stock
        : 0;

      const difference = countedQuantity - systemStock;

      if (difference === 0) {
        return {
          success: true,
          message: "El inventario físico coincide con el sistema",
          data: {
            systemStock,
            countedQuantity,
            difference: 0,
            notes,
            timestamp: new Date().toISOString(),
          },
        };
      }

      if (!adjustAutomatically) {
        return {
          success: true,
          message: "Inventario físico completado",
          data: {
            systemStock,
            countedQuantity,
            difference,
            needsAdjustment: true,
            notes,
            timestamp: new Date().toISOString(),
          },
        };
      }

      const movementType = difference > 0 ? "in" : "out";
      const movementQuantity = Math.abs(difference);

      const reason =
        `Inventario físico: ${notes || "Sin notas"}. ` +
        `Sistema: ${systemStock}, Físico: ${countedQuantity}`;

      const response = await this.createMovement(
        {
          product_id: productId,
          quantity: movementQuantity,
          movement_type: movementType,
          reason,
          reference: "PHYSICAL_INVENTORY",
        },
        false
      );

      return response;
    } catch (error) {
      throw error;
    }
  },

  transferStock: async (
    productId,
    fromLocation,
    toLocation,
    quantity,
    notes = ""
  ) => {
    try {
      if (!fromLocation || !toLocation) {
        throw new Error("Las ubicaciones de origen y destino son requeridas");
      }

      if (quantity <= 0) {
        throw new Error("La cantidad debe ser mayor a 0");
      }

      if (fromLocation === toLocation) {
        throw new Error(
          "Las ubicaciones de origen y destino no pueden ser iguales"
        );
      }

      notificationService.loading("Realizando transferencia...");

      try {
        const exitResponse = await this.createMovement(
          {
            product_id: productId,
            quantity,
            movement_type: "out",
            reason: `Transferencia a ${toLocation}: ${notes || "Sin notas"}`,
            location: fromLocation,
            reference: `TRANSFER_OUT_${Date.now()}`,
          },
          false
        );

        if (!exitResponse.success) {
          throw new Error("Error al registrar salida de inventario");
        }

        const entryResponse = await this.createMovement(
          {
            product_id: productId,
            quantity,
            movement_type: "in",
            reason: `Transferencia desde ${fromLocation}: ${notes || "Sin notas"}`,
            location: toLocation,
            reference: `TRANSFER_IN_${Date.now()}`,
          },
          false
        );

        notificationService.dismissLoading();

        if (!entryResponse.success) {
          await this.createMovement(
            {
              product_id: productId,
              quantity,
              movement_type: "in",
              reason: `Reversión por falla en transferencia a ${toLocation}`,
              location: fromLocation,
              reference: `TRANSFER_REVERT_${Date.now()}`,
            },
            false
          );

          throw new Error(
            "Error al registrar entrada de inventario, transferencia revertida"
          );
        }

        notificationService.success("Transferencia completada exitosamente");
        return entryResponse;
      } catch (error) {
        notificationService.dismissLoading();
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  getStatistics: async (useCache = true) => {
    try {
      const cacheKey = "inventory_statistics";

      if (useCache) {
        const cached = inventoryCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      try {
        const response = await get("/inventory/statistics");

        if (useCache && response.success) {
          inventoryCache.set(cacheKey, response, 60 * 1000);
        }

        return response;
      } catch (error) {
        console.log("Calculando estadísticas desde historial...");

        const historyResponse = await this.getHistory({ limit: 1000 }, false);

        if (
          historyResponse.success &&
          historyResponse.data &&
          Array.isArray(historyResponse.data)
        ) {
          const movements = historyResponse.data;
          const today = new Date();
          const lastWeek = new Date(today);
          lastWeek.setDate(lastWeek.getDate() - 7);
          const lastMonth = new Date(today);
          lastMonth.setMonth(lastMonth.getMonth() - 1);

          const stats = {
            totalMovements: movements.length,
            today: {
              entries: 0,
              exits: 0,
              adjustments: 0,
            },
            lastWeek: {
              entries: 0,
              exits: 0,
              adjustments: 0,
            },
            lastMonth: {
              entries: 0,
              exits: 0,
              adjustments: 0,
            },
            byProduct: {},
            topProducts: [],
          };

          movements.forEach((movement) => {
            const movementDate = new Date(movement.created_at);

            if (movementDate.toDateString() === today.toDateString()) {
              if (movement.movement_type === "in") stats.today.entries++;
              else if (movement.movement_type === "out") stats.today.exits++;
              else if (movement.movement_type === "adjustment")
                stats.today.adjustments++;
            }

            if (movementDate >= lastWeek) {
              if (movement.movement_type === "in") stats.lastWeek.entries++;
              else if (movement.movement_type === "out") stats.lastWeek.exits++;
              else if (movement.movement_type === "adjustment")
                stats.lastWeek.adjustments++;
            }

            if (movementDate >= lastMonth) {
              if (movement.movement_type === "in") stats.lastMonth.entries++;
              else if (movement.movement_type === "out")
                stats.lastMonth.exits++;
              else if (movement.movement_type === "adjustment")
                stats.lastMonth.adjustments++;
            }

            if (movement.product_id) {
              if (!stats.byProduct[movement.product_id]) {
                stats.byProduct[movement.product_id] = {
                  product_id: movement.product_id,
                  product_name:
                    movement.product_name || `Producto ${movement.product_id}`,
                  entries: 0,
                  exits: 0,
                  adjustments: 0,
                  total: 0,
                };
              }

              if (movement.movement_type === "in") {
                stats.byProduct[movement.product_id].entries++;
                stats.byProduct[movement.product_id].total += movement.quantity;
              } else if (movement.movement_type === "out") {
                stats.byProduct[movement.product_id].exits++;
                stats.byProduct[movement.product_id].total -= movement.quantity;
              } else if (movement.movement_type === "adjustment") {
                stats.byProduct[movement.product_id].adjustments++;
                stats.byProduct[movement.product_id].total += movement.quantity;
              }
            }
          });

          stats.topProducts = Object.values(stats.byProduct)
            .sort((a, b) => Math.abs(b.total) - Math.abs(a.total))
            .slice(0, 10);

          const response = {
            success: true,
            data: stats,
            calculated: true,
          };

          if (useCache) {
            inventoryCache.set(cacheKey, response, 60 * 1000);
          }

          return response;
        }

        return historyResponse;
      }
    } catch (error) {
      throw error;
    }
  },

  getTrends: async (days = 30, productId = null) => {
    const cacheKey = `inventory_trends_${days}_${productId || "all"}`;

    const cached = inventoryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const params = { days };
      if (productId) params.product_id = productId;

      const response = await get("/inventory/trends", params);

      if (response.success) {
        inventoryCache.set(cacheKey, response, 5 * 60 * 1000);
      }

      return response;
    } catch (error) {
      console.error("❌ Error al obtener /inventory/trends:", error.message);
      console.log("Calculando tendencias desde historial...");

      const params = { limit: 1000 };
      if (productId) params.product_id = productId;

      const historyResponse = await this.getHistory(params, false);

      if (historyResponse?.success && Array.isArray(historyResponse?.data)) {
        const trends = this.processTrendsData(historyResponse.data, days);

        const response = {
          success: true,
          data: trends,
          days,
          productId,
          calculated: true,
        };

        inventoryCache.set(cacheKey, response, 5 * 60 * 1000);
        return response;
      }

      throw error;
    }
  },

  processTrendsData: (movements, days) => {
    if (!Array.isArray(movements)) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const dailyData = {};
    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split("T")[0];

      dailyData[dateString] = {
        date: dateString,
        entries: 0,
        exits: 0,
        adjustments: 0,
        net_change: 0,
        running_total: 0,
      };
    }

    let runningTotal = 0;

    movements.forEach((movement) => {
      if (!movement?.created_at) return;

      const movementDate = new Date(movement.created_at);
      const dateString = movementDate.toISOString().split("T")[0];

      if (dailyData[dateString]) {
        const quantity = Number.parseFloat(movement?.quantity) || 0;

        switch (movement?.movement_type) {
          case "in":
            dailyData[dateString].entries += quantity;
            dailyData[dateString].net_change += quantity;
            break;

          case "out":
            dailyData[dateString].exits += quantity;
            dailyData[dateString].net_change -= quantity;
            break;

          case "adjustment":
            dailyData[dateString].adjustments += quantity;
            dailyData[dateString].net_change += quantity;
            break;
        }
      }
    });

    const sortedDates = Object.keys(dailyData).sort(
      (a, b) => new Date(a) - new Date(b)
    );
    sortedDates.forEach((dateString, index) => {
      if (index > 0) {
        const previousDate = sortedDates[index - 1];
        runningTotal += dailyData[previousDate].net_change;
      }
      dailyData[dateString].running_total =
        runningTotal + dailyData[dateString].net_change;
    });

    return sortedDates.map((dateString) => dailyData[dateString]);
  },

  validateMovement: (movementData) => {
    return validateMovementData(movementData);
  },

  createMultipleMovements: async (movements, batchSize = 10) => {
    try {
      if (!Array.isArray(movements) || movements.length === 0) {
        throw new Error("No hay movimientos para registrar");
      }

      movements.forEach((movement, index) => {
        const validation = this.validateMovement(movement);
        if (!validation.isValid) {
          throw new Error(
            `Movimiento ${index + 1}: ${validation.errors.join(", ")}`
          );
        }
      });

      notificationService.loading(
        `Registrando ${movements.length} movimientos...`
      );

      const batches = [];
      for (let i = 0; i < movements.length; i += batchSize) {
        batches.push(movements.slice(i, i + batchSize));
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const batch of batches) {
        const batchPromises = batch.map(async (movement) => {
          try {
            const result = await this.createMovement(movement, false);
            return { movement, success: true, data: result.data };
          } catch (error) {
            return { movement, success: false, error: error.message };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        batchResults.forEach((result) => {
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        });

        if (batches.length > 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }

      notificationService.dismissLoading();

      this.clearCache();

      try {
        const productServiceModule = await import("./productService");
        const productService =
          productServiceModule.default || productServiceModule.productService;
        productService.clearCache();
      } catch (error) {
        console.warn("No se pudo limpiar cache de productos:", error);
      }

      if (errorCount === 0) {
        notificationService.success(
          `Todos los movimientos registrados exitosamente`
        );
      } else if (successCount === 0) {
        notificationService.error(`Error registrando todos los movimientos`);
      } else {
        notificationService.warning(
          `${successCount} registrados, ${errorCount} errores`
        );
      }

      return {
        success: errorCount === 0,
        results,
        summary: {
          total: movements.length,
          success: successCount,
          errors: errorCount,
        },
      };
    } catch (error) {
      notificationService.dismissLoading();
      throw error;
    }
  },

  clearCache: () => {
    inventoryCache.clear();
    inventoryCache.clearAllPending();
    clearCache("inventory");
  },
};

export default inventoryService;