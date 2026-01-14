const Product = require("../models/Product");
const Category = require("../models/Category");
const Inventory = require("../models/Inventory");
const QRCode = require("../models/QRCode");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");
const Supplier = require("../models/Supplier");
const database = require("../models/database");
const logger = require("../utils/logger");
const cacheService = require("../services/cacheService");
const { validationResult } = require("express-validator");
const {
  NotFoundError,
  ValidationError,
  PermissionError,
  DatabaseError,
} = require("../utils/errors");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const crypto = require("crypto");
const config = require("../config/env");

/**
 * ✅ CONTROLADOR DE PRODUCTOS MEJORADO
 * Correcciones aplicadas:
 * 1. Validación completa de datos
 * 2. Manejo transaccional robusto
 * 3. Caché inteligente
 * 4. Manejo de archivos seguro
 * 5. Sistema de permisos granular
 */

// ✅ CONFIGURACIÓN MEJORADA DE MULTER
const createStorageConfig = () => {
  const uploadDir = config.uploads?.directory || "uploads/products";
  const maxFileSize = config.app.maxFileSize || 5 * 1024 * 1024; // 5MB

  return multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        await fs.mkdir(uploadDir, { recursive: true });

        // ✅ Crear subdirectorios por fecha para organización
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        const subDir = path.join(uploadDir, `${year}`, `${month}`, `${day}`);
        await fs.mkdir(subDir, { recursive: true });

        cb(null, subDir);
      } catch (error) {
        cb(
          new Error(`Error creando directorio de uploads: ${error.message}`),
          null,
        );
      }
    },
    filename: (req, file, cb) => {
      const uniqueId = crypto.randomBytes(16).toString("hex");
      const sanitizedOriginalName = file.originalname.replace(
        /[^a-zA-Z0-9.-]/g,
        "_",
      );
      const ext = path.extname(sanitizedOriginalName).toLowerCase();
      const filename = `product_${uniqueId}_${Date.now()}${ext}`;
      cb(null, filename);
    },
  });
};

// ✅ FILTRO DE ARCHIVOS MEJORADO
const createFileFilter = () => {
  const allowedMimeTypes = config.uploads?.allowedMimeTypes || [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];

  return (req, file, cb) => {
    const fileExt = path.extname(file.originalname).toLowerCase().slice(1);
    const allowedExtensions = ["jpeg", "jpg", "png", "gif", "webp", "svg"];

    const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype);
    const isExtensionValid = allowedExtensions.includes(fileExt);

    if (isMimeTypeValid && isExtensionValid) {
      cb(null, true);
    } else {
      cb(
        new ValidationError(
          `Tipo de archivo no permitido. Tipos aceptados: ${allowedExtensions.join(", ")}`,
          "INVALID_FILE_TYPE",
        ),
        false,
      );
    }
  };
};

// ✅ CONFIGURACIÓN DE MULTER
const upload = multer({
  storage: createStorageConfig(),
  limits: {
    fileSize: config.app.maxFileSize || 5 * 1024 * 1024,
    files: config.uploads?.maxFiles || 1,
  },
  fileFilter: createFileFilter(),
});

class ProductController {
  /**
   * ✅ MIDDLEWARE DE UPLOAD MEJORADO
   */
  static uploadMiddleware = upload.single("image");

  /**
   * ✅ VALIDAR PRODUCTO COMPLETO
   */
  static async validateProduct(productData, isUpdate = false) {
    const errors = [];
    const warnings = [];

    // ✅ VALIDACIÓN DE NOMBRE
    if (!isUpdate || productData.name !== undefined) {
      if (!productData.name || productData.name.trim().length < 2) {
        errors.push("El nombre debe tener al menos 2 caracteres");
      }
      if (productData.name && productData.name.length > 200) {
        errors.push("El nombre no puede exceder 200 caracteres");
      }

      // Validar caracteres peligrosos
      const dangerousPatterns = /[<>{}[\]]/;
      if (dangerousPatterns.test(productData.name)) {
        errors.push("El nombre contiene caracteres no permitidos");
      }
    }

    // ✅ VALIDACIÓN DE SKU
    if (!isUpdate || productData.sku !== undefined) {
      if (productData.sku) {
        const sku = productData.sku.trim();

        if (sku.length < 3) {
          errors.push("El SKU debe tener al menos 3 caracteres");
        }
        if (sku.length > 50) {
          errors.push("El SKU no puede exceder 50 caracteres");
        }

        // Validar formato
        const skuRegex = /^[A-Z0-9][A-Z0-9\-_]*[A-Z0-9]$/;
        if (!skuRegex.test(sku)) {
          errors.push(
            "El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos",
          );
        }
      }
    }

    // ✅ VALIDACIÓN DE PRECIOS
    if (productData.price !== undefined) {
      const price = parseFloat(productData.price);
      if (isNaN(price) || price < 0) {
        errors.push("El precio debe ser un número positivo");
      }
      if (price > 9999999.99) {
        errors.push("El precio no puede exceder 9,999,999.99");
      }

      // Advertencia para precios extremadamente bajos
      if (price > 0 && price < 0.01) {
        warnings.push("El precio parece ser extremadamente bajo");
      }
    }

    if (
      productData.cost_price !== undefined &&
      productData.cost_price !== null
    ) {
      const costPrice = parseFloat(productData.cost_price);
      if (isNaN(costPrice) || costPrice < 0) {
        errors.push("El precio de costo debe ser un número positivo");
      }

      // Validar relación precio/costo
      if (productData.price && costPrice > parseFloat(productData.price)) {
        warnings.push("El precio de costo es mayor que el precio de venta");
      }
    }

    // ✅ VALIDACIÓN DE STOCK
    if (productData.min_stock !== undefined) {
      const minStock = parseInt(productData.min_stock, 10);
      if (isNaN(minStock) || minStock < 0) {
        errors.push("El stock mínimo debe ser un número entero positivo");
      }
      if (minStock > 1000000) {
        errors.push("El stock mínimo no puede exceder 1,000,000");
      }
    }

    if (productData.max_stock !== undefined) {
      const maxStock = parseInt(productData.max_stock, 10);
      if (isNaN(maxStock) || maxStock < 0) {
        errors.push("El stock máximo debe ser un número entero positivo");
      }
      if (maxStock > 10000000) {
        errors.push("El stock máximo no puede exceder 10,000,000");
      }

      // Validar relación min/max
      if (productData.min_stock !== undefined) {
        const minStock = parseInt(productData.min_stock, 10);
        if (maxStock <= minStock) {
          errors.push("El stock máximo debe ser mayor que el stock mínimo");
        }
      }
    }

    // ✅ VALIDACIÓN DE CATEGORÍA
    if (productData.category_id !== undefined) {
      const categoryId = parseInt(productData.category_id, 10);
      if (isNaN(categoryId) || categoryId <= 0) {
        errors.push("ID de categoría inválido");
      } else {
        try {
          const category = await Category.findById(categoryId);
          if (!category) {
            errors.push("Categoría no encontrada");
          } else if (!category.is_active) {
            warnings.push("La categoría no está activa");
          }
        } catch (error) {
          errors.push("Error validando categoría");
        }
      }
    }

    // ✅ VALIDACIÓN DE FECHA DE EXPIRACIÓN
    if (productData.expiry_date) {
      const expiryDate = new Date(productData.expiry_date);
      if (isNaN(expiryDate.getTime())) {
        errors.push("Fecha de expiración inválida");
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryDate < today) {
          errors.push("La fecha de expiración no puede ser en el pasado");
        }

        // Advertencia para fechas cercanas
        const daysDifference = Math.ceil(
          (expiryDate - today) / (1000 * 60 * 60 * 24),
        );
        if (daysDifference <= 30) {
          warnings.push(
            "La fecha de expiración está dentro de los próximos 30 días",
          );
        }
      }
    }

    // ✅ VALIDACIÓN DE DESCRIPCIÓN
    if (productData.description && productData.description.length > 5000) {
      errors.push("La descripción no puede exceder 5000 caracteres");
    }

    // ✅ VALIDACIÓN DE CÓDIGO DE BARRAS
    if (productData.barcode) {
      if (productData.barcode.length > 100) {
        errors.push("El código de barras no puede exceder 100 caracteres");
      }

      // Validar formato básico de código de barras
      const barcodeRegex = /^[0-9a-zA-Z\-_]+$/;
      if (!barcodeRegex.test(productData.barcode)) {
        errors.push("Código de barras contiene caracteres no válidos");
      }
    }

    // ✅ VALIDACIÓN DE UNIDAD
    if (productData.unit && productData.unit.length > 50) {
      errors.push("La unidad no puede exceder 50 caracteres");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedData: productData,
    };
  }

  /**
   * ✅ CREAR PRODUCTO CON VALIDACIÓN COMPLETA
   */
  static async create(req, res) {
    const transaction = await database.beginTransaction();

    try {
      const productData = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VERIFICAR PERMISOS
      if (!["admin", "manager"].includes(userRole)) {
        throw new PermissionError(
          "Se requieren permisos de administrador o manager para crear productos",
          "INSUFFICIENT_PERMISSIONS",
          { requiredRoles: ["admin", "manager"], userRole },
        );
      }

      // ✅ VALIDAR DATOS DE ENTRADA
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        throw new ValidationError(
          "Errores de validación en los datos de entrada",
          "VALIDATION_ERROR",
          { errors: validation.array() },
        );
      }

      // ✅ VALIDACIÓN ADICIONAL DEL PRODUCTO
      const productValidation = await ProductController.validateProduct(
        productData,
        false,
      );
      if (!productValidation.isValid) {
        throw new ValidationError(
          "Errores de validación del producto",
          "PRODUCT_VALIDATION_ERROR",
          { errors: productValidation.errors },
        );
      }

      // ✅ VERIFICAR LÍMITES DEL SISTEMA
      const productCount = await Product.count();
      const maxProducts = process.env.MAX_PRODUCTS || 10000;

      if (productCount >= maxProducts) {
        throw new ValidationError(
          `Se ha alcanzado el límite máximo de productos (${maxProducts})`,
          "PRODUCT_LIMIT_REACHED",
          {
            suggestion:
              "Considere archivar productos inactivos o contactar al administrador",
            currentCount: productCount,
            maxAllowed: maxProducts,
          },
        );
      }

      // ✅ VERIFICAR UNICIDAD DE SKU
      if (productData.sku) {
        const existingProduct = await Product.findBySKU(productData.sku.trim());
        if (existingProduct) {
          throw new ValidationError(
            "El SKU ya está en uso",
            "SKU_ALREADY_EXISTS",
            {
              existing_product: {
                id: existingProduct.id,
                name: existingProduct.name,
                sku: existingProduct.sku,
              },
            },
          );
        }
      }

      // ✅ VERIFICAR UNICIDAD DE CÓDIGO DE BARRAS
      if (productData.barcode) {
        const existingBarcode = await Product.findByBarcode(
          productData.barcode.trim(),
        );
        if (existingBarcode) {
          throw new ValidationError(
            "El código de barras ya está en uso",
            "BARCODE_ALREADY_EXISTS",
            { existing_product_id: existingBarcode.id },
          );
        }
      }

      // ✅ PREPARAR DATOS COMPLETOS
      const fullProductData = {
        name: productData.name.trim(),
        sku: productData.sku ? productData.sku.trim().toUpperCase() : null,
        description: productData.description
          ? productData.description.trim()
          : null,
        category_id: parseInt(productData.category_id, 10),
        price: productData.price ? parseFloat(productData.price) : 0,
        cost_price: productData.cost_price
          ? parseFloat(productData.cost_price)
          : null,
        min_stock: parseInt(productData.min_stock || 0, 10),
        max_stock: parseInt(productData.max_stock || 100, 10),
        unit: productData.unit || "unidad",
        weight: productData.weight ? parseFloat(productData.weight) : null,
        dimensions: productData.dimensions
          ? productData.dimensions.trim()
          : null,
        barcode: productData.barcode ? productData.barcode.trim() : null,
        supplier_id: productData.supplier_id || null,
        supplier_sku: productData.supplier_sku
          ? productData.supplier_sku.trim()
          : null,
        expiry_date: productData.expiry_date || null,
        is_active:
          productData.is_active !== undefined
            ? Boolean(productData.is_active)
            : true,
        requires_refrigeration: Boolean(productData.requires_refrigeration),
        is_fragile: Boolean(productData.is_fragile),
        hazard_class: productData.hazard_class || null,
        tags: productData.tags
          ? productData.tags.split(",").map((tag) => tag.trim())
          : [],
        meta_title: productData.meta_title || productData.name,
        meta_description:
          productData.meta_description ||
          (productData.description
            ? productData.description.substring(0, 160)
            : null),
        created_by: userId,
        updated_by: userId,
        status: "active",
      };

      // ✅ VERIFICAR CATEGORÍA
      const category = await Category.findById(fullProductData.category_id);
      if (!category) {
        throw new NotFoundError(
          "Categoría no encontrada",
          "CATEGORY_NOT_FOUND",
        );
      }

      if (!category.is_active) {
        throw new ValidationError(
          "No se pueden agregar productos a categorías inactivas",
          "CATEGORY_INACTIVE",
        );
      }

      // ✅ CREAR PRODUCTO
      const productId = await Product.create(fullProductData, transaction);

      // ✅ OBTENER PRODUCTO CREADO
      const product = await Product.findById(productId, transaction);

      // ✅ CREAR STOCK INICIAL SI SE ESPECIFICA
      let initialStockRecord = null;
      if (
        productData.initial_stock &&
        parseInt(productData.initial_stock, 10) > 0
      ) {
        const initialStock = parseInt(productData.initial_stock, 10);

        initialStockRecord = await Inventory.create(
          {
            product_id: productId,
            quantity: initialStock,
            movement_type: "in",
            reason: "Stock inicial del producto",
            reference_number: `INIT-${productId}-${Date.now()}`,
            created_by: userId,
            status: "completed",
            notes: "Registro automático de stock inicial",
          },
          transaction,
        );

        // ✅ REGISTRAR TRANSACCIÓN
        await Transaction.create(
          {
            product_id: productId,
            quantity: initialStock,
            type: "entry",
            notes: "Stock inicial del producto",
            reference_number: `INIT-${productId}`,
            created_by: userId,
            unit_price: product.price || 0,
            total_value: initialStock * (product.price || 0),
          },
          transaction,
        );
      }

      // ✅ REGISTRAR ACTIVIDAD DE AUDITORÍA
      await AuditLog.create(
        {
          action: "product_created",
          user_id: userId,
          details: {
            product_id: productId,
            product_name: product.name,
            product_sku: product.sku,
            category_id: product.category_id,
            category_name: category.name,
            initial_stock: productData.initial_stock || 0,
            data_snapshot: {
              ...fullProductData,
              password: undefined, // No registrar datos sensibles
            },
          },
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          severity: "info",
        },
        transaction,
      );

      await transaction.commit();

      // ✅ INVALIDAR CACHÉ
      await ProductController.invalidateProductCache(
        productId,
        product.category_id,
      );

      logger.info("Producto creado exitosamente", {
        productId,
        name: product.name,
        sku: product.sku,
        createdBy: userId,
        categoryId: product.category_id,
        initialStock: productData.initial_stock || 0,
      });

      // ✅ CONSTRUIR RESPUESTA
      const response = {
        success: true,
        message: "Producto creado exitosamente",
        data: {
          product: {
            ...product,
            category_name: category.name,
            current_stock: productData.initial_stock || 0,
          },
          metadata: {
            created_at: new Date().toISOString(),
            created_by: userId,
            version: "1.0",
            warnings: productValidation.warnings,
          },
          actions: ProductController.generateProductActions(
            req,
            productId,
            userId,
            userRole,
          ),
        },
      };

      res.status(201).json(response);
    } catch (error) {
      await transaction.rollback();

      logger.error("Error creando producto:", {
        error: error.message,
        stack: error.stack,
        body: req.body,
        userId: req.userId,
        userRole: req.userRole,
      });

      ProductController.handleErrorResponse(
        error,
        res,
        "PRODUCT_CREATION_ERROR",
      );
    }
  }

  /**
   * ✅ OBTENER PRODUCTO POR ID MEJORADO
   */
  static async getById(req, res) {
    try {
      const productId = parseInt(req.params.id, 10);
      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VALIDAR ID
      if (!productId || productId <= 0) {
        throw new ValidationError(
          "ID de producto inválido",
          "INVALID_PRODUCT_ID",
        );
      }

      // ✅ VERIFICAR CACHÉ
      const cacheKey = `product:${productId}:${userRole}`;
      let product = null;

      if (config.cache.enabled) {
        product = await cacheService.get(cacheKey);
      }

      if (!product) {
        // ✅ OBTENER PRODUCTO DE LA BASE DE DATOS
        product = await Product.findById(productId);
        if (!product) {
          throw new NotFoundError(
            "Producto no encontrado",
            "PRODUCT_NOT_FOUND",
          );
        }

        // ✅ VERIFICAR PERMISOS PARA PRODUCTOS INACTIVOS
        if (!product.is_active && !["admin", "manager"].includes(userRole)) {
          throw new PermissionError(
            "Producto no disponible",
            "PRODUCT_INACTIVE",
            { product_id: productId, product_status: product.status },
          );
        }

        // ✅ ENRIQUECER DATOS EN PARALELO
        const [
          currentStock,
          category,
          inventoryHistory,
          qrCodes,
          supplier,
          similarProducts,
          stockStats,
          salesStats,
        ] = await Promise.all([
          Inventory.getCurrentStock(productId),
          Category.findById(product.category_id),
          Inventory.getHistoryByProduct(productId, 10, 0),
          QRCode.findByProduct(productId, 5),
          product.supplier_id
            ? Supplier.findById(product.supplier_id)
            : Promise.resolve(null),
          Product.findSimilarProducts(productId, product.category_id, 5),
          Inventory.getStockStats(productId),
          Transaction.getProductStats(productId),
        ]);

        // ✅ CONSTRUIR OBJETO DE PRODUCTO ENRIQUECIDO
        product = {
          ...product,
          category_name: category?.name || "Sin categoría",
          current_stock: currentStock,
          stock_status: ProductController.calculateStockStatus(
            currentStock,
            product.min_stock,
            product.max_stock,
          ),
          stock_percentage:
            product.max_stock > 0
              ? Math.min(100, (currentStock / product.max_stock) * 100)
              : 0,
          metrics: {
            average_daily_usage: stockStats.average_usage || 0,
            days_of_supply:
              currentStock > 0 && stockStats.average_usage > 0
                ? Math.floor(currentStock / stockStats.average_usage)
                : 0,
            stock_turnover: stockStats.turnover || 0,
            total_sales: salesStats.total_quantity || 0,
            last_sale: salesStats.last_transaction,
            forecast: await ProductController.calculateStockForecast(
              currentStock,
              stockStats.average_usage,
            ),
          },
          related_data: {
            inventory_history: inventoryHistory,
            qr_codes: qrCodes,
            supplier: supplier
              ? {
                  id: supplier.id,
                  name: supplier.name,
                  contact_email: supplier.contact_email,
                  phone: supplier.phone,
                }
              : null,
            similar_products: similarProducts,
          },
        };

        // ✅ FILTRAR DATOS SENSIBLES POR ROL
        product = ProductController.filterSensitiveData(product, userRole);

        // ✅ GUARDAR EN CACHÉ
        if (config.cache.enabled) {
          await cacheService.set(cacheKey, product, 300); // 5 minutos
        }
      }

      // ✅ CONSTRUIR RESPUESTA
      const response = {
        success: true,
        data: {
          product,
          metadata: {
            retrieved_at: new Date().toISOString(),
            cache_hit: config.cache.enabled && product !== null,
            permissions: {
              can_edit: ["admin", "manager"].includes(userRole),
              can_delete:
                ["admin"].includes(userRole) && product.current_stock === 0,
              can_view_history: ["admin", "manager", "auditor"].includes(
                userRole,
              ),
            },
          },
        },
        links: ProductController.generateProductLinks(req, productId, userRole),
      };

      // ✅ AGREGAR ALERTAS
      const alerts = ProductController.generateProductAlerts(product);
      if (alerts.length > 0) {
        response.data.alerts = alerts;
      }

      res.json(response);
    } catch (error) {
      logger.error("Error obteniendo producto:", {
        error: error.message,
        productId: req.params.id,
        userId: req.userId,
      });

      ProductController.handleErrorResponse(error, res, "PRODUCT_FETCH_ERROR");
    }
  }

  /**
   * ✅ ACTUALIZAR PRODUCTO MEJORADO
   */
  static async update(req, res) {
    const transaction = await database.beginTransaction();

    try {
      const productId = parseInt(req.params.id, 10);
      const updateData = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      // ✅ VALIDACIONES INICIALES
      if (!productId || productId <= 0) {
        throw new ValidationError(
          "ID de producto inválido",
          "INVALID_PRODUCT_ID",
        );
      }

      if (!["admin", "manager"].includes(userRole)) {
        throw new PermissionError(
          "Permisos insuficientes para actualizar productos",
          "INSUFFICIENT_PERMISSIONS",
        );
      }

      if (Object.keys(updateData).length === 0) {
        throw new ValidationError(
          "No hay datos para actualizar",
          "NO_UPDATE_DATA",
        );
      }

      // ✅ VERIFICAR EXISTENCIA DEL PRODUCTO
      const existingProduct = await Product.findById(productId);
      if (!existingProduct) {
        throw new NotFoundError("Producto no encontrado", "PRODUCT_NOT_FOUND");
      }

      // ✅ VALIDAR DATOS DE ACTUALIZACIÓN
      const validation = await ProductController.validateProduct(
        updateData,
        true,
      );
      if (!validation.isValid) {
        throw new ValidationError(
          "Errores de validación en los datos de actualización",
          "PRODUCT_VALIDATION_ERROR",
          { errors: validation.errors },
        );
      }

      // ✅ VERIFICAR UNICIDAD DE DATOS ÚNICOS
      await ProductController.validateUniqueData(updateData, productId);

      // ✅ VALIDAR CAMBIO DE CATEGORÍA
      let categoryChanged = false;
      if (
        updateData.category_id &&
        parseInt(updateData.category_id, 10) !== existingProduct.category_id
      ) {
        const newCategory = await Category.findById(
          parseInt(updateData.category_id, 10),
        );
        if (!newCategory) {
          throw new NotFoundError(
            "Nueva categoría no encontrada",
            "CATEGORY_NOT_FOUND",
          );
        }
        if (!newCategory.is_active) {
          throw new ValidationError(
            "No se puede mover el producto a una categoría inactiva",
            "CATEGORY_INACTIVE",
          );
        }
        categoryChanged = true;
      }

      // ✅ PREPARAR DATOS DE ACTUALIZACIÓN
      const finalUpdateData = ProductController.prepareUpdateData(
        updateData,
        userId,
      );

      // ✅ EJECUTAR ACTUALIZACIÓN
      const updated = await Product.update(
        productId,
        finalUpdateData,
        transaction,
      );
      if (!updated) {
        throw new NotFoundError(
          "Producto no encontrado durante la actualización",
          "UPDATE_FAILED",
        );
      }

      // ✅ REGISTRAR CAMBIOS DE CATEGORÍA
      if (categoryChanged) {
        const oldCategory = await Category.findById(
          existingProduct.category_id,
        );
        const newCategory = await Category.findById(updateData.category_id);

        await AuditLog.create(
          {
            action: "product_category_changed",
            user_id: userId,
            details: {
              product_id: productId,
              product_name: existingProduct.name,
              from_category: {
                id: existingProduct.category_id,
                name: oldCategory?.name,
              },
              to_category: {
                id: updateData.category_id,
                name: newCategory?.name,
              },
            },
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
          transaction,
        );
      }

      // ✅ REGISTRAR ACTUALIZACIÓN
      await AuditLog.create(
        {
          action: "product_updated",
          user_id: userId,
          details: {
            product_id: productId,
            product_name: existingProduct.name,
            changed_fields: Object.keys(updateData),
            old_values: ProductController.extractChangedValues(
              existingProduct,
              updateData,
            ),
            new_values: updateData,
          },
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
        },
        transaction,
      );

      await transaction.commit();

      // ✅ INVALIDAR CACHÉ
      await ProductController.invalidateProductCache(
        productId,
        existingProduct.category_id,
      );
      if (categoryChanged && updateData.category_id) {
        await ProductController.invalidateProductCache(
          productId,
          updateData.category_id,
        );
      }

      // ✅ OBTENER PRODUCTO ACTUALIZADO
      const updatedProduct = await Product.findById(productId);

      logger.info("Producto actualizado exitosamente", {
        productId,
        name: updatedProduct.name,
        updatedBy: userId,
        changedFields: Object.keys(updateData),
      });

      res.json({
        success: true,
        message: "Producto actualizado exitosamente",
        data: {
          product: updatedProduct,
          changes: Object.keys(updateData),
          metadata: {
            updated_at: new Date().toISOString(),
            updated_by: userId,
            category_changed: categoryChanged,
            warnings: validation.warnings,
          },
        },
      });
    } catch (error) {
      await transaction.rollback();

      logger.error("Error actualizando producto:", {
        error: error.message,
        productId: req.params.id,
        userId: req.userId,
      });

      ProductController.handleErrorResponse(error, res, "PRODUCT_UPDATE_ERROR");
    }
  }

  /**
   * ✅ ELIMINAR PRODUCTO MEJORADO
   */
  static async delete(req, res) {
    const transaction = await database.beginTransaction();

    try {
      const productId = parseInt(req.params.id, 10);
      const userId = req.userId;
      const userRole = req.userRole;
      const forceDelete = req.query.force === "true";

      // ✅ VALIDACIONES INICIALES
      if (!productId || productId <= 0) {
        throw new ValidationError(
          "ID de producto inválido",
          "INVALID_PRODUCT_ID",
        );
      }

      if (userRole !== "admin") {
        throw new PermissionError(
          "Se requieren permisos de administrador para eliminar productos",
          "INSUFFICIENT_PERMISSIONS",
        );
      }

      // ✅ VERIFICAR EXISTENCIA
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError("Producto no encontrado", "PRODUCT_NOT_FOUND");
      }

      // ✅ VERIFICAR STOCK
      const currentStock = await Inventory.getCurrentStock(productId);
      if (currentStock > 0 && !forceDelete) {
        throw new ValidationError(
          "No se puede eliminar el producto porque tiene stock disponible",
          "PRODUCT_HAS_STOCK",
          {
            current_stock: currentStock,
            alternative_actions: [
              {
                action: "adjust_inventory",
                url: `${req.protocol}://${req.get("host")}/api/inventory/adjust`,
                method: "POST",
                body: {
                  product_id: productId,
                  quantity: 0,
                  reason: "Eliminación de producto",
                },
              },
              {
                action: "force_delete",
                url: `${req.protocol}://${req.get("host")}/api/products/${productId}?force=true`,
                method: "DELETE",
                warning:
                  "Esta acción eliminará el producto y su historial de inventario",
              },
            ],
          },
        );
      }

      // ✅ VERIFICAR CÓDIGOS QR ACTIVOS
      const qrCodes = await QRCode.findByProduct(productId);
      const activeQRCodes = qrCodes.filter((qr) => qr.status === "active");
      if (activeQRCodes.length > 0 && !forceDelete) {
        throw new ValidationError(
          "No se puede eliminar el producto porque tiene códigos QR activos",
          "PRODUCT_HAS_ACTIVE_QR",
          {
            active_qr_codes: activeQRCodes.length,
            alternative_actions: [
              {
                action: "deactivate_qr_codes",
                url: `${req.protocol}://${req.get("host")}/api/qr/deactivate/product/${productId}`,
                method: "POST",
              },
            ],
          },
        );
      }

      // ✅ ELIMINACIÓN EN MODO FORCE
      if (forceDelete) {
        await ProductController.forceDeleteProduct(
          productId,
          qrCodes,
          transaction,
        );
      }

      // ✅ ELIMINAR IMAGEN SI EXISTE
      if (product.image_url) {
        await ProductController.deleteProductImage(product.image_url);
      }

      // ✅ EJECUTAR ELIMINACIÓN
      const deleted = await Product.delete(productId, forceDelete, transaction);
      if (!deleted) {
        throw new NotFoundError(
          "Producto no encontrado durante la eliminación",
          "DELETE_FAILED",
        );
      }

      // ✅ REGISTRAR AUDITORÍA
      await AuditLog.create(
        {
          action: "product_deleted",
          user_id: userId,
          details: {
            product_id: productId,
            product_name: product.name,
            product_sku: product.sku,
            deletion_type: forceDelete ? "force_delete" : "soft_delete",
            had_stock: currentStock > 0,
            qr_codes_deleted: qrCodes.length,
            image_deleted: !!product.image_url,
          },
          ip_address: req.ip,
          user_agent: req.headers["user-agent"],
          severity: "warning",
        },
        transaction,
      );

      await transaction.commit();

      // ✅ INVALIDAR CACHÉ
      await ProductController.invalidateProductCache(
        productId,
        product.category_id,
      );

      logger.info("Producto eliminado exitosamente", {
        productId,
        name: product.name,
        deletedBy: userId,
        forceDelete,
        hadStock: currentStock > 0,
      });

      res.json({
        success: true,
        message: "Producto eliminado exitosamente",
        data: ProductController.buildDeletionResponse(
          productId,
          product,
          forceDelete,
          currentStock,
          qrCodes.length,
        ),
      });
    } catch (error) {
      await transaction.rollback();

      logger.error("Error eliminando producto:", {
        error: error.message,
        productId: req.params.id,
        userId: req.userId,
      });

      ProductController.handleErrorResponse(error, res, "PRODUCT_DELETE_ERROR");
    }
  }

  /**
   * ✅ MÉTODOS AUXILIARES
   */

  static async invalidateProductCache(productId, categoryId) {
    if (!config.cache.enabled) return;

    const cacheKeys = [
      `product:${productId}:*`,
      "products:all:*",
      "products:low_stock:*",
      `category:${categoryId}:products:*`,
    ];

    for (const key of cacheKeys) {
      await cacheService.delPattern(key);
    }
  }

  static calculateStockStatus(currentStock, minStock, maxStock) {
    if (currentStock === 0) return "out_of_stock";
    if (currentStock <= minStock) return "low_stock";
    if (currentStock > maxStock) return "overstock";
    return "normal";
  }

  static async calculateStockForecast(currentStock, averageUsage) {
    if (!averageUsage || averageUsage <= 0) return null;

    const daysOfSupply = Math.floor(currentStock / averageUsage);
    const reorderPoint = averageUsage * 7; // 7 días de stock de seguridad

    return {
      days_of_supply: daysOfSupply,
      reorder_point: reorderPoint,
      reorder_needed: currentStock <= reorderPoint,
      estimated_runout_date: new Date(
        Date.now() + daysOfSupply * 24 * 60 * 60 * 1000,
      ),
    };
  }

  static filterSensitiveData(product, userRole) {
    if (["admin", "manager"].includes(userRole)) {
      return product;
    }

    const {
      cost_price,
      supplier_id,
      supplier_sku,
      supplier_info,
      ...safeProduct
    } = product;

    if (safeProduct.related_data) {
      const { supplier, ...safeRelatedData } = safeProduct.related_data;
      safeProduct.related_data = safeRelatedData;
    }

    if (safeProduct.metrics) {
      const { forecast, ...safeMetrics } = safeProduct.metrics;
      safeProduct.metrics = safeMetrics;
    }

    return safeProduct;
  }

  static generateProductLinks(req, productId, userRole) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const links = [
      {
        rel: "self",
        href: `${baseUrl}/api/products/${productId}`,
        method: "GET",
      },
      {
        rel: "inventory",
        href: `${baseUrl}/api/inventory/products/${productId}/stock`,
        method: "GET",
      },
      {
        rel: "history",
        href: `${baseUrl}/api/inventory/products/${productId}/history`,
        method: "GET",
      },
    ];

    if (["admin", "manager"].includes(userRole)) {
      links.push(
        {
          rel: "update",
          href: `${baseUrl}/api/products/${productId}`,
          method: "PUT",
        },
        {
          rel: "update_image",
          href: `${baseUrl}/api/products/${productId}/image`,
          method: "PUT",
        },
        {
          rel: "generate_qr",
          href: `${baseUrl}/api/qr/generate/product/${productId}`,
          method: "POST",
        },
      );
    }

    return links;
  }

  static generateProductAlerts(product) {
    const alerts = [];

    // Alerta de stock bajo
    if (product.current_stock <= product.min_stock) {
      alerts.push({
        type: "low_stock",
        message: `¡Alerta! Stock bajo para ${product.name}`,
        severity: product.current_stock === 0 ? "critical" : "warning",
        current_stock: product.current_stock,
        min_stock: product.min_stock,
        suggested_action:
          product.current_stock === 0
            ? "Reabastecer urgentemente"
            : "Reabastecer pronto",
        code: product.current_stock === 0 ? "ALT001" : "ALT002",
      });
    }

    // Alerta de expiración
    if (product.expiry_date) {
      const expiryDate = new Date(product.expiry_date);
      const now = new Date();
      const daysUntilExpiry = Math.ceil(
        (expiryDate - now) / (1000 * 60 * 60 * 24),
      );

      if (daysUntilExpiry <= 0) {
        alerts.push({
          type: "expired",
          message: `¡Producto expirado! ${product.name}`,
          severity: "critical",
          expiry_date: product.expiry_date,
          suggested_action: "Retirar del inventario",
          code: "ALT003",
        });
      } else if (daysUntilExpiry <= 7) {
        alerts.push({
          type: "expiring_soon",
          message: `Producto por expirar en ${daysUntilExpiry} días: ${product.name}`,
          severity: "warning",
          expiry_date: product.expiry_date,
          days_until_expiry: daysUntilExpiry,
          suggested_action: "Priorizar venta o uso",
          code: "ALT004",
        });
      }
    }

    return alerts;
  }

  static generateProductActions(req, productId, userId, userRole) {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const actions = [
      {
        action: "view_product",
        url: `${baseUrl}/api/products/${productId}`,
        method: "GET",
        description: "Ver detalles del producto",
      },
    ];

    if (["admin", "manager"].includes(userRole)) {
      actions.push(
        {
          action: "update_inventory",
          url: `${baseUrl}/api/inventory/movements`,
          method: "POST",
          description: "Actualizar inventario del producto",
        },
        {
          action: "generate_qr",
          url: `${baseUrl}/api/qr/generate/product/${productId}`,
          method: "POST",
          description: "Generar código QR para el producto",
        },
      );
    }

    return actions;
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

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "El SKU o código de barras ya está en uso",
        error_code: "DUPLICATE_PRODUCT_DATA",
      });
    }

    logger.error("Error no manejado en ProductController:", {
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

  static async validateUniqueData(updateData, productId) {
    if (updateData.sku) {
      const existing = await Product.findBySKU(updateData.sku.trim());
      if (existing && existing.id !== productId) {
        throw new ValidationError(
          "El SKU ya está en uso",
          "SKU_ALREADY_EXISTS",
        );
      }
    }

    if (updateData.barcode) {
      const existing = await Product.findByBarcode(updateData.barcode.trim());
      if (existing && existing.id !== productId) {
        throw new ValidationError(
          "El código de barras ya está en uso",
          "BARCODE_ALREADY_EXISTS",
        );
      }
    }
  }

  static prepareUpdateData(updateData, userId) {
    const prepared = { ...updateData, updated_by: userId };

    // Convertir tipos de datos
    if (prepared.price !== undefined)
      prepared.price = parseFloat(prepared.price);
    if (prepared.cost_price !== undefined) {
      prepared.cost_price =
        prepared.cost_price !== null ? parseFloat(prepared.cost_price) : null;
    }
    if (prepared.min_stock !== undefined)
      prepared.min_stock = parseInt(prepared.min_stock, 10);
    if (prepared.max_stock !== undefined)
      prepared.max_stock = parseInt(prepared.max_stock, 10);
    if (prepared.weight !== undefined) {
      prepared.weight =
        prepared.weight !== null ? parseFloat(prepared.weight) : null;
    }

    return prepared;
  }

  static extractChangedValues(existingProduct, updateData) {
    const changed = {};
    Object.keys(updateData).forEach((key) => {
      if (existingProduct[key] !== undefined) {
        changed[key] = existingProduct[key];
      }
    });
    return changed;
  }

  static async forceDeleteProduct(productId, qrCodes, transaction) {
    // Desactivar códigos QR
    for (const qrCode of qrCodes) {
      await QRCode.delete(qrCode.id, true, transaction);
    }

    // Eliminar registros relacionados
    await Inventory.deleteByProduct(productId, transaction);
    await Transaction.deleteByProduct(productId, transaction);
  }

  static async deleteProductImage(imageUrl) {
    try {
      const imagePath = path.join(process.cwd(), imageUrl);
      await fs.unlink(imagePath);

      // Intentar eliminar directorios vacíos
      const dirPath = path.dirname(imagePath);
      try {
        const files = await fs.readdir(dirPath);
        if (files.length === 0) {
          await fs.rmdir(dirPath);
        }
      } catch (error) {
        // Ignorar error de directorio no vacío
      }
    } catch (error) {
      logger.warn("No se pudo eliminar la imagen del producto:", error.message);
    }
  }

  static buildDeletionResponse(
    productId,
    product,
    forceDelete,
    currentStock,
    qrCodeCount,
  ) {
    const response = {
      product_id: productId,
      product_name: product.name,
      product_sku: product.sku,
      deletion_type: forceDelete ? "force_delete" : "soft_delete",
      timestamp: new Date().toISOString(),
      can_restore: !forceDelete,
    };

    if (forceDelete) {
      response.warning = "Esta acción es irreversible";
      response.deleted_items = {
        product_data: true,
        inventory_history: true,
        qr_codes: qrCodeCount,
        transactions: true,
        product_image: !!product.image_url,
      };
    }

    return response;
  }
}

// ✅ EXPORTAR CONTROLADOR COMPLETO
module.exports = {
  // Métodos principales
  create: ProductController.create.bind(ProductController),
  getById: ProductController.getById.bind(ProductController),
  update: ProductController.update.bind(ProductController),
  delete: ProductController.delete.bind(ProductController),

  // Middleware
  uploadMiddleware: ProductController.uploadMiddleware,

  // Métodos auxiliares
  validateProduct: ProductController.validateProduct.bind(ProductController),

  // Clase completa para testing
  ProductController,
};
