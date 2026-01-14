import {
  get,
  post,
  put,
  del,
  uploadFile,
  requestWithRetry,
  clearCache,
} from "./api";
import notificationService from "./notificationService";

// ✅ MEJORA: Sistema de cache avanzado
const createCache = (defaultTTL = 5 * 60 * 1000) => {
  const cache = new Map();
  const pendingRequests = new Map();

  return {
    get: (key) => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      cache.delete(key);
      return null;
    },

    set: (key, data, ttl = defaultTTL) => {
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
        pendingRequests.clear();
      }
    },

    clearByProduct: (productId) => {
      for (const key of cache.keys()) {
        if (key.includes(`product_${productId}`) || key.includes("products_")) {
          cache.delete(key);
        }
      }
    },

    hasPending: (key) => pendingRequests.has(key),

    setPending: (key, promise) => {
      pendingRequests.set(key, promise);
    },

    getPending: (key) => pendingRequests.get(key),

    deletePending: (key) => {
      pendingRequests.delete(key);
    },
  };
};

// ✅ MEJORA: Caches con diferentes TTLs
const productCache = createCache(5 * 60 * 1000); // 5 minutos para productos
const stockCache = createCache(60 * 1000); // 1 minuto para stock
const searchCache = createCache(30 * 1000); // 30 segundos para búsquedas

// ✅ MEJORA: Validación de datos de producto
const validateProductData = (productData, isUpdate = false) => {
  const errors = [];
  const warnings = [];

  // Validaciones básicas
  if (!isUpdate || productData.name !== undefined) {
    if (!productData.name || productData.name.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    } else if (productData.name.length > 255) {
      errors.push("El nombre no puede exceder 255 caracteres");
    }
  }

  if (!isUpdate || productData.sku !== undefined) {
    if (!productData.sku || productData.sku.trim().length < 3) {
      errors.push("El SKU debe tener al menos 3 caracteres");
    } else if (productData.sku.length > 50) {
      errors.push("El SKU no puede exceder 50 caracteres");
    }
  }

  if (!isUpdate || productData.category_id !== undefined) {
    if (
      productData.category_id === undefined ||
      productData.category_id === null
    ) {
      errors.push("La categoría es obligatoria");
    } else {
      const categoryId = parseInt(productData.category_id);
      if (isNaN(categoryId) || categoryId <= 0) {
        errors.push("ID de categoría inválido");
      }
    }
  }

  // Validaciones numéricas
  if (productData.price !== undefined) {
    const price = parseFloat(productData.price);
    if (isNaN(price) || price <= 0) {
      errors.push("El precio debe ser un número mayor a 0");
    } else if (price > 1000000) {
      warnings.push("El precio parece muy alto");
    }
  }

  if (productData.cost !== undefined) {
    const cost = parseFloat(productData.cost);
    if (isNaN(cost) || cost < 0) {
      errors.push("El costo debe ser un número mayor o igual a 0");
    } else if (cost > 500000) {
      warnings.push("El costo parece muy alto");
    }
  }

  if (productData.min_stock !== undefined) {
    const minStock = parseInt(productData.min_stock);
    if (isNaN(minStock) || minStock < 0) {
      errors.push("El stock mínimo debe ser un número mayor o igual a 0");
    }
  }

  if (productData.max_stock !== undefined) {
    const maxStock = parseInt(productData.max_stock);
    if (isNaN(maxStock) || maxStock < 0) {
      errors.push("El stock máximo debe ser un número mayor o igual a 0");
    }
  }

  // Validar que min_stock < max_stock si ambos están definidos
  if (
    productData.min_stock !== undefined &&
    productData.max_stock !== undefined
  ) {
    const minStock = parseInt(productData.min_stock);
    const maxStock = parseInt(productData.max_stock);

    if (minStock > maxStock) {
      errors.push("El stock mínimo no puede ser mayor al stock máximo");
    }
  }

  // Validaciones de descripción
  if (
    productData.description !== undefined &&
    productData.description.length > 1000
  ) {
    warnings.push("La descripción es muy larga (máximo 1000 caracteres)");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * ✅ SERVICIO DE PRODUCTOS COMPLETO
 */
export const productService = {
  /**
   * Obtener todos los productos
   */
  getAll: async (params = {}, useCache = true) => {
    const cacheKey = `products_all_${JSON.stringify(params)}`;

    try {
      // ✅ MEJORA: Evitar request duplicados
      if (productCache.hasPending(cacheKey)) {
        return await productCache.getPending(cacheKey);
      }

      // Intentar cache
      if (useCache) {
        const cached = productCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Crear promise para evitar duplicados
      const promise = (async () => {
        try {
          const response = await get("/products", params);

          if (useCache && response.success) {
            productCache.set(cacheKey, response);
          }

          return response;
        } finally {
          productCache.deletePending(cacheKey);
        }
      })();

      productCache.setPending(cacheKey, promise);
      return await promise;
    } catch (error) {
      productCache.deletePending(cacheKey);
      throw error;
    }
  },

  /**
   * Obtener producto por ID
   */
  getById: async (id, useCache = true) => {
    const cacheKey = `product_${id}`;

    try {
      // Verificar cache
      if (useCache) {
        const cached = productCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(`/products/${id}`);

      if (useCache && response.success) {
        productCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener producto por SKU
   */
  getBySKU: async (sku, useCache = true) => {
    const cacheKey = `product_sku_${sku}`;

    try {
      if (useCache) {
        const cached = productCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(`/products/sku/${sku}`);

      if (useCache && response.success) {
        productCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear producto
   */
  create: async (productData) => {
    try {
      // Validar datos
      const validation = validateProductData(productData, false);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Mostrar warnings si existen
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const response = await post("/products", productData);

      if (response.success) {
        // Limpiar cache relacionada
        productCache.clear();
        searchCache.clear();
        clearCache("products");

        notificationService.success("Producto creado exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar producto
   */
  update: async (id, productData) => {
    try {
      // Validar datos
      const validation = validateProductData(productData, true);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Mostrar warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const response = await put(`/products/${id}`, productData);

      if (response.success) {
        // Limpiar cache
        productCache.delete(`product_${id}`);
        productCache.clear();
        searchCache.clear();
        stockCache.clear();
        clearCache("products");

        notificationService.success("Producto actualizado exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar producto
   */
  delete: async (id, confirm = true) => {
    try {
      // Confirmación opcional
      if (confirm) {
        const confirmed = await notificationService.confirm(
          "¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        );

        if (!confirmed) {
          return { success: false, message: "Operación cancelada" };
        }
      }

      const response = await del(`/products/${id}`);

      if (response.success) {
        // Limpiar cache
        productCache.delete(`product_${id}`);
        productCache.clear();
        searchCache.clear();
        stockCache.clear();
        clearCache("products");

        notificationService.success("Producto eliminado exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Subir imagen del producto
   */
  uploadImage: async (id, file, onUploadProgress = null) => {
    try {
      // Validar archivo
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        throw new Error(
          "Tipo de archivo no permitido. Solo imágenes JPEG, PNG, GIF o WebP"
        );
      }

      // Validar tamaño (10MB máximo - compatible con backend)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `La imagen es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`
        );
      }

      // Mostrar notificación de carga
      const loadingId = `upload_${id}_${Date.now()}`;
      notificationService.loading("Subiendo imagen...", { id: loadingId });

      try {
        const response = await uploadFile(
          `/products/${id}/image`,
          file,
          onUploadProgress
        );

        // Limpiar cache del producto
        productCache.delete(`product_${id}`);

        notificationService.dismissLoading(loadingId);
        notificationService.success("Imagen subida exitosamente");

        return response;
      } catch (error) {
        notificationService.dismissLoading(loadingId);
        throw error;
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Subir múltiples imágenes
   */
  uploadMultipleImages: async (id, files, onUploadProgress = null) => {
    try {
      if (!files || !Array.isArray(files) || files.length === 0) {
        throw new Error("No hay archivos para subir");
      }

      if (files.length > 10) {
        throw new Error("Máximo 10 imágenes por producto");
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < files.length; i++) {
        try {
          const result = await this.uploadImage(
            id,
            files[i],
            (progressEvent) => {
              if (onUploadProgress) {
                const totalProgress =
                  ((i + progressEvent.loaded / progressEvent.total) /
                    files.length) *
                  100;
                onUploadProgress({
                  loaded: totalProgress,
                  total: 100,
                  fileIndex: i,
                  fileName: files[i].name,
                });
              }
            }
          );

          results.push({ success: true, file: files[i].name, data: result });
          successCount++;
        } catch (error) {
          results.push({
            success: false,
            file: files[i].name,
            error: error.message,
          });
          errorCount++;
        }
      }

      const summary = `${successCount} subida(s) exitosa(s), ${errorCount} error(es)`;

      if (errorCount === 0) {
        notificationService.success(`Todas las imágenes subidas: ${summary}`);
      } else if (successCount === 0) {
        notificationService.error(`Todas las imágenes fallaron: ${summary}`);
      } else {
        notificationService.warning(`Subida parcial: ${summary}`);
      }

      return {
        success: errorCount === 0,
        results,
        summary: {
          total: files.length,
          success: successCount,
          errors: errorCount,
        },
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener productos con stock bajo
   */
  getLowStock: async (useCache = true) => {
    const cacheKey = "products_low_stock";

    try {
      if (useCache) {
        const cached = productCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/products/low-stock");

      if (useCache && response.success) {
        // TTL más corto para stock bajo (2 minutos)
        productCache.set(cacheKey, response, 2 * 60 * 1000);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Buscar productos
   */
  search: async (term, params = {}, useCache = false) => {
    if (!term || term.trim().length === 0) {
      return await this.getAll(params, useCache);
    }

    const cacheKey = `products_search_${term}_${JSON.stringify(params)}`;

    try {
      if (useCache) {
        const cached = searchCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/products", { ...params, search: term });

      if (useCache && response.success) {
        searchCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener productos por categoría
   */
  getByCategory: async (categoryId, params = {}, useCache = true) => {
    const cacheKey = `products_category_${categoryId}_${JSON.stringify(params)}`;

    try {
      if (useCache) {
        const cached = productCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/products", {
        ...params,
        category_id: categoryId,
      });

      if (useCache && response.success) {
        productCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener historial de inventario del producto
   */
  getInventoryHistory: async (productId, params = {}) => {
    try {
      const response = await get(
        `/inventory/product/${productId}/history`,
        params
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener stock actual del producto
   */
  getCurrentStock: async (productId, useCache = true) => {
    const cacheKey = `product_stock_${productId}`;

    try {
      if (useCache) {
        const cached = stockCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(`/inventory/product/${productId}/stock`);

      if (useCache && response.success) {
        stockCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generar SKU sugerido
   */
  generateSuggestedSKU: (name, categoryId = 1) => {
    if (!name?.trim()) {
      return `PROD${Date.now().toString(36).toUpperCase().slice(-6)}`;
    }

    const namePart = name
      .substring(0, 3)
      .toUpperCase()
      .replaceAll(/[^A-Z]/g, "");

    const categoryPart = categoryId.toString().padStart(3, "0");
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();

    return `${namePart}${categoryPart}${randomPart}`;
  },

  /**
   * Validar producto
   */
  validateProduct: (productData) => {
    return validateProductData(productData, false);
  },

  /**
   * ✅ MEJORA: Obtener productos en batch
   */
  getBatch: async (ids, useCache = true) => {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return { success: true, data: [] };
    }

    // Limitar batch size para no sobrecargar
    const batchSize = 50;
    const batches = [];

    for (let i = 0; i < ids.length; i += batchSize) {
      batches.push(ids.slice(i, i + batchSize));
    }

    const results = [];

    for (const batch of batches) {
      try {
        // Usar parámetro de batch si el backend lo soporta
        const response = await get("/products/batch", { ids: batch.join(",") });

        if (response.success && response.data && Array.isArray(response.data)) {
          results.push(...response.data);
        }
      } catch (error) {
        console.warn("Error obteniendo batch:", error);
        // Continuar con otros batches
      }
    }

    return {
      success: true,
      data: results,
      total: results.length,
      requested: ids.length,
    };
  },

  /**
   * ✅ CORRECCIÓN: Actualizar stock localmente (optimistic updates)
   */
  updateStockLocally: (productId, quantityChange) => {
    const cacheKey = `product_${productId}`;
    const cached = productCache.get(cacheKey);

    if (cached?.success && cached?.data) {
      const currentStock = cached.data.current_stock ?? 0;
      cached.data.current_stock = Math.max(0, currentStock + quantityChange);
      productCache.set(cacheKey, cached);

      // Actualizar cache de stock
      stockCache.delete(`product_stock_${productId}`);
    }

    // Actualizar cache de productos general
    productCache.clear();
  },

  /**
   * Limpiar cache
   */
  clearCache: (productId = null) => {
    if (productId) {
      productCache.clearByProduct(productId);
      stockCache.delete(`product_stock_${productId}`);
    } else {
      productCache.clear();
      stockCache.clear();
      searchCache.clear();
      clearCache("products");
    }
  },
};

export default productService;
