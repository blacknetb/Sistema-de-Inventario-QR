const Category = require("../models/Category");
const Product = require("../models/Product");
const logger = require("../utils/logger");
const validator = require("../middlewares/validator");
const { validationResult } = require("express-validator");
const {
  NotFoundError,
  ValidationError,
  DatabaseError,
} = require("../utils/errors");
const database = require("../models/database");
const AuditLog = require("../models/AuditLog");
const cacheService = require("../services/cacheService");

/**
 * ✅ CONTROLADOR DE CATEGORÍAS MEJORADO
 * Correcciones aplicadas:
 * 1. Importaciones organizadas y validadas
 * 2. Manejo mejorado de transacciones
 * 3. Validación robusta de datos
 * 4. Control de errores centralizado
 * 5. Caché optimizado
 * 6. Respuestas HTTP más consistentes
 */

const categoryController = {
  // ✅ Constantes para configuración
  CATEGORY_CONSTANTS: {
    MAX_NAME_LENGTH: 100,
    MIN_NAME_LENGTH: 2,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_CATEGORIES: process.env.MAX_CATEGORIES || 100,
    MAX_CATEGORY_DEPTH: process.env.MAX_CATEGORY_DEPTH || 3,
    CACHE_TTL: 300, // 5 minutos
    TREE_CACHE_TTL: 600, // 10 minutos
  },

  // ✅ Función auxiliar para validar categoría (mejorada)
  validateCategory: (categoryData) => {
    const errors = [];

    // ✅ Validación mejorada del nombre
    if (
      !categoryData.name ||
      categoryData.name.trim().length <
        categoryController.CATEGORY_CONSTANTS.MIN_NAME_LENGTH
    ) {
      errors.push(
        `El nombre debe tener al menos ${categoryController.CATEGORY_CONSTANTS.MIN_NAME_LENGTH} caracteres`,
      );
    }

    if (
      categoryData.name &&
      categoryData.name.length >
        categoryController.CATEGORY_CONSTANTS.MAX_NAME_LENGTH
    ) {
      errors.push(
        `El nombre no puede exceder ${categoryController.CATEGORY_CONSTANTS.MAX_NAME_LENGTH} caracteres`,
      );
    }

    // ✅ Validación mejorada de descripción
    if (
      categoryData.description &&
      categoryData.description.length >
        categoryController.CATEGORY_CONSTANTS.MAX_DESCRIPTION_LENGTH
    ) {
      errors.push(
        `La descripción no puede exceder ${categoryController.CATEGORY_CONSTANTS.MAX_DESCRIPTION_LENGTH} caracteres`,
      );
    }

    // ✅ Validar slug con mejoras
    if (categoryData.slug) {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      if (!slugRegex.test(categoryData.slug)) {
        errors.push(
          "El slug debe contener solo letras minúsculas, números y guiones",
        );
      }

      if (categoryData.slug.length > 100) {
        errors.push("El slug no puede exceder 100 caracteres");
      }
    }

    // ✅ Validar color HEX mejorado
    if (categoryData.color) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(categoryData.color)) {
        errors.push(
          "Color inválido. Debe ser un código HEX válido (ej: #3498db)",
        );
      }
    }

    // ✅ Validar icono como URL
    if (categoryData.icon) {
      try {
        // Intenta crear una URL para validar
        new URL(categoryData.icon);
        // Verificar protocolos permitidos
        if (
          !categoryData.icon.startsWith("http://") &&
          !categoryData.icon.startsWith("https://")
        ) {
          errors.push(
            "El icono debe ser una URL válida con http:// o https://",
          );
        }
      } catch (error) {
        errors.push("Icono inválido. Debe ser una URL válida");
      }
    }

    // ✅ Validar ID de categoría padre
    if (
      categoryData.parent_id !== undefined &&
      categoryData.parent_id !== null
    ) {
      if (
        isNaN(parseInt(categoryData.parent_id, 10)) ||
        parseInt(categoryData.parent_id, 10) <= 0
      ) {
        errors.push("ID de categoría padre inválido");
      }
    }

    // ✅ Validar orden
    if (categoryData.sort_order !== undefined) {
      if (isNaN(parseInt(categoryData.sort_order, 10))) {
        errors.push("El orden debe ser un número válido");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      errorCode: errors.length > 0 ? "CATEGORY_VALIDATION_ERROR" : null,
    };
  },

  // ✅ Función para verificar permisos de usuario (centralizada)
  checkCategoryPermissions: (
    userRole,
    requiredRoles = ["admin", "manager"],
  ) => {
    return requiredRoles.includes(userRole);
  },

  // ✅ Generar slug automático mejorado
  generateSlug: async (name, existingSlugs = []) => {
    // Limpiar nombre y convertir a slug
    let slug = name
      .toLowerCase()
      .trim()
      .normalize("NFD") // Normalizar caracteres especiales
      .replace(/[\u0300-\u036f]/g, "") // Remover diacríticos
      .replace(/[^a-z0-9]+/g, "-") // Reemplazar caracteres no alfanuméricos con guiones
      .replace(/^-+|-+$/g, ""); // Remover guiones al inicio y final

    // Asegurar que no esté vacío
    if (!slug) slug = "category";

    // Verificar unicidad
    let uniqueSlug = slug;
    let counter = 1;

    while (existingSlugs.includes(uniqueSlug)) {
      uniqueSlug = `${slug}-${counter}`;
      counter++;

      // Prevenir loops infinitos
      if (counter > 100) {
        uniqueSlug = `${slug}-${Date.now()}`;
        break;
      }
    }

    return uniqueSlug;
  },

  // ✅ Función para construir respuesta de error estandarizada
  buildErrorResponse: (statusCode, message, errorCode, details = null) => {
    const response = {
      success: false,
      message,
      error_code: errorCode,
      timestamp: new Date().toISOString(),
      reference_id: `ERR-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };

    if (details) {
      response.details = details;
    }

    return {
      status: statusCode,
      json: response,
    };
  },

  // ✅ Función para construir respuesta de éxito estandarizada
  buildSuccessResponse: (
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

  // ✅ Función para invalidar caché de categorías
  invalidateCategoryCache: async (categoryId, parentId = null) => {
    if (process.env.ENABLE_CACHE !== "true") return;

    try {
      const cacheKeys = [
        "categories:all",
        "categories:tree",
        `category:${categoryId}`,
        `category:${categoryId}:children`,
        `category:${categoryId}:stats`,
      ];

      if (parentId) {
        cacheKeys.push(`category:${parentId}:children`);
      }

      // Incluir patrones de búsqueda
      cacheKeys.push("categories:search:*");

      // Eliminar caché en paralelo
      await Promise.all(cacheKeys.map((key) => cacheService.del(key)));

      logger.debug(
        `Caché de categorías invalidado para categoryId: ${categoryId}`,
      );
    } catch (error) {
      logger.warn("Error invalidando caché de categorías:", error.message);
    }
  },

  // ✅ Crear categoría con transacción mejorada
  create: async (req, res) => {
    let transaction;

    try {
      const categoryData = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      logger.info("Iniciando creación de categoría", {
        userId,
        userRole,
        categoryData: { name: categoryData.name },
      });

      // ✅ Validar permisos del usuario
      if (!categoryController.checkCategoryPermissions(userRole)) {
        const errorResponse = categoryController.buildErrorResponse(
          403,
          "No tienes permisos para crear categorías",
          "INSUFFICIENT_PERMISSIONS",
          { required_roles: ["admin", "manager"] },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validar datos de entrada con express-validator
      const validation = validationResult(req);
      if (!validation.isEmpty()) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "Errores de validación",
          "VALIDATION_ERROR",
          { errors: validation.array() },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validación adicional específica de categoría
      const categoryValidation =
        categoryController.validateCategory(categoryData);
      if (!categoryValidation.isValid) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "Errores de validación de categoría",
          categoryValidation.errorCode,
          { errors: categoryValidation.errors },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Verificar si la categoría ya existe por nombre
      const existingCategory = await Category.findByName(
        categoryData.name.trim(),
      );
      if (existingCategory) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          409,
          "La categoría ya existe",
          "CATEGORY_ALREADY_EXISTS",
          {
            existing_category: {
              id: existingCategory.id,
              name: existingCategory.name,
            },
          },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar límite de categorías
      const categoryCount = await Category.count();
      const maxCategories =
        categoryController.CATEGORY_CONSTANTS.MAX_CATEGORIES;

      if (categoryCount >= maxCategories) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          400,
          `Se ha alcanzado el límite máximo de categorías (${maxCategories})`,
          "CATEGORY_LIMIT_REACHED",
          {
            suggestion:
              "Considere reorganizar o eliminar categorías existentes",
            current_count: categoryCount,
            max_limit: maxCategories,
          },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Generar slug automático si no se proporciona
      let slug = categoryData.slug;
      if (!slug) {
        // Obtener slugs existentes
        const existingSlugs = await Category.getAllSlugs();
        slug = await categoryController.generateSlug(
          categoryData.name,
          existingSlugs,
        );
      } else {
        // Verificar que el slug personalizado sea único
        const existingSlug = await Category.findBySlug(slug);
        if (existingSlug) {
          await transaction.rollback();
          const errorResponse = categoryController.buildErrorResponse(
            409,
            "El slug ya está en uso",
            "SLUG_ALREADY_EXISTS",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
      }

      // ✅ Preparar datos completos de categoría
      const fullCategoryData = {
        name: categoryData.name.trim(),
        description: categoryData.description || null,
        slug: slug,
        color: categoryData.color || "#3498db",
        icon: categoryData.icon || null,
        parent_id: categoryData.parent_id || null,
        sort_order: categoryData.sort_order || 0,
        is_active:
          categoryData.is_active !== undefined
            ? Boolean(categoryData.is_active)
            : true,
        meta_title: categoryData.meta_title || categoryData.name.trim(),
        meta_description:
          categoryData.meta_description || categoryData.description || null,
        created_by: userId,
        updated_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // ✅ Validar categoría padre si se especifica
      if (fullCategoryData.parent_id) {
        const parentCategory = await Category.findById(
          fullCategoryData.parent_id,
        );
        if (!parentCategory) {
          await transaction.rollback();
          const errorResponse = categoryController.buildErrorResponse(
            404,
            "Categoría padre no encontrada",
            "PARENT_CATEGORY_NOT_FOUND",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }

        // ✅ Verificar que no se cree un ciclo
        if (parentCategory.id === fullCategoryData.parent_id) {
          await transaction.rollback();
          const errorResponse = categoryController.buildErrorResponse(
            400,
            "Una categoría no puede ser padre de sí misma",
            "CATEGORY_SELF_PARENT",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }

        // ✅ Verificar profundidad máxima
        const parentDepth = await Category.getCategoryDepth(
          fullCategoryData.parent_id,
        );
        if (
          parentDepth >=
          categoryController.CATEGORY_CONSTANTS.MAX_CATEGORY_DEPTH
        ) {
          await transaction.rollback();
          const errorResponse = categoryController.buildErrorResponse(
            400,
            `Profundidad máxima de categorías alcanzada (${categoryController.CATEGORY_CONSTANTS.MAX_CATEGORY_DEPTH})`,
            "MAX_CATEGORY_DEPTH_REACHED",
            {
              parent_depth: parentDepth,
              max_depth:
                categoryController.CATEGORY_CONSTANTS.MAX_CATEGORY_DEPTH,
            },
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
      }

      // ✅ Crear categoría con transacción
      const categoryId = await Category.create(fullCategoryData, transaction);

      // ✅ Obtener categoría creada con datos completos
      const category = await Category.findById(categoryId);

      // ✅ Actualizar jerarquía si es necesario
      if (fullCategoryData.parent_id) {
        await Category.updateHierarchy(categoryId, transaction);
      }

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "category_created",
          user_id: userId,
          details: {
            category_id: categoryId,
            category_name: category.name,
            parent_id: category.parent_id,
            data: fullCategoryData,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      logger.info("Categoría creada exitosamente", {
        categoryId,
        name: category.name,
        createdBy: userId,
        parentId: category.parent_id,
      });

      // ✅ Invalidar caché de categorías
      await categoryController.invalidateCategoryCache(
        categoryId,
        category.parent_id,
      );

      // ✅ Obtener datos enriquecidos para respuesta
      const enrichedCategory = {
        ...category,
        breadcrumb: await Category.getBreadcrumb(categoryId),
        children_count: await Category.countChildren(categoryId),
        products_count: await Category.countProducts(categoryId),
      };

      // ✅ Construir respuesta exitosa
      const successResponse = categoryController.buildSuccessResponse(
        {
          category: enrichedCategory,
          actions: [
            {
              action: "view_category",
              url: `${req.protocol}://${req.get("host")}/api/categories/${categoryId}`,
              method: "GET",
            },
            {
              action: "add_product",
              url: `${req.protocol}://${req.get("host")}/api/products`,
              method: "POST",
              description: "Agregar producto a esta categoría",
              requires_auth: true,
              required_permissions: ["admin", "manager"],
            },
          ],
          metadata: {
            created_at: category.created_at,
            created_by: userId,
            cache_invalidated: process.env.ENABLE_CACHE === "true",
          },
        },
        "Categoría creada exitosamente",
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

      logger.error("Error creando categoría:", {
        error: error.message,
        stack: error.stack,
        userId: req.userId,
        categoryData: req.body ? { name: req.body.name } : null,
      });

      // ✅ Manejo específico de errores de base de datos
      let errorResponse;

      switch (error.code) {
        case "ER_DUP_ENTRY":
          errorResponse = categoryController.buildErrorResponse(
            409,
            "Conflicto de datos. El nombre o slug ya están en uso",
            "DUPLICATE_CATEGORY",
          );
          break;

        case "ER_NO_REFERENCED_ROW":
          errorResponse = categoryController.buildErrorResponse(
            404,
            "Categoría padre no encontrada",
            "PARENT_NOT_FOUND",
          );
          break;

        case "ER_LOCK_WAIT_TIMEOUT":
          errorResponse = categoryController.buildErrorResponse(
            503,
            "Tiempo de espera agotado. Por favor, intente nuevamente",
            "DATABASE_LOCK_TIMEOUT",
            { retry_after: 5000 },
          );
          break;

        default:
          errorResponse = categoryController.buildErrorResponse(
            500,
            "Error interno al crear categoría",
            "CATEGORY_CREATION_ERROR",
          );
      }

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener categoría por ID con mejoras de caché y permisos
  getById: async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id, 10);

      // ✅ Validar ID de categoría
      if (!categoryId || categoryId <= 0) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "ID de categoría inválido",
          "INVALID_CATEGORY_ID",
          { provided_id: req.params.id },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      logger.debug("Obteniendo categoría por ID", {
        categoryId,
        userId: req.userId,
      });

      // ✅ Clave de caché
      const cacheKey = `category:${categoryId}`;
      let category;

      // ✅ Intentar obtener de caché primero
      if (process.env.ENABLE_CACHE === "true") {
        try {
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            category = cached;
            logger.debug("Categoría obtenida de caché", { categoryId });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!category) {
        category = await Category.findById(categoryId);

        if (!category) {
          const errorResponse = categoryController.buildErrorResponse(
            404,
            "Categoría no encontrada",
            "CATEGORY_NOT_FOUND",
            { categoryId },
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }

        // ✅ Enriquecer datos de la categoría
        const [
          breadcrumb,
          children,
          childrenCount,
          productsCount,
          siblings,
          stats,
        ] = await Promise.all([
          Category.getBreadcrumb(categoryId),
          Category.getChildren(categoryId),
          Category.countChildren(categoryId),
          Category.countProducts(categoryId),
          Category.getSiblings(categoryId),
          Category.getCategoryStats(categoryId),
        ]);

        category = {
          ...category,
          breadcrumb,
          children,
          children_count: childrenCount,
          products_count: productsCount,
          siblings,
          stats,
        };

        // ✅ Cachear categoría enriquecida
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              category,
              categoryController.CATEGORY_CONSTANTS.CACHE_TTL,
            );
            logger.debug("Categoría almacenada en caché", { categoryId });
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Verificar si la categoría está activa (para usuarios no administradores)
      if (
        !category.is_active &&
        !categoryController.checkCategoryPermissions(req.userRole)
      ) {
        const errorResponse = categoryController.buildErrorResponse(
          403,
          "Categoría no disponible",
          "CATEGORY_INACTIVE",
          { categoryId, categoryName: category.name },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Obtener productos de esta categoría si se solicita
      let productsResponse = null;
      if (req.query.include_products === "true") {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;

        // ✅ Determinar si mostrar productos inactivos
        const showInactive = categoryController.checkCategoryPermissions(
          req.userRole,
        );
        const statusFilter = showInactive ? null : "active";

        const [products, productsTotal] = await Promise.all([
          Product.findByCategory(categoryId, limit, offset, statusFilter),
          Product.countByCategory(categoryId, statusFilter),
        ]);

        productsResponse = {
          data: products,
          pagination: {
            total: productsTotal,
            page,
            limit,
            total_pages: Math.ceil(productsTotal / limit),
            has_more: offset + products.length < productsTotal,
          },
        };
      }

      // ✅ Construir respuesta con HATEOAS (Hypermedia)
      const baseUrl = `${req.protocol}://${req.get("host")}`;
      const links = [
        {
          rel: "self",
          href: `${baseUrl}/api/categories/${categoryId}`,
          method: "GET",
          description: "Categoría actual",
        },
        {
          rel: "parent",
          href: category.parent_id
            ? `${baseUrl}/api/categories/${category.parent_id}`
            : null,
          method: "GET",
          description: "Categoría padre",
        },
        {
          rel: "children",
          href: `${baseUrl}/api/categories/${categoryId}/children`,
          method: "GET",
          description: "Subcategorías",
        },
        {
          rel: "products",
          href: `${baseUrl}/api/products?category_id=${categoryId}`,
          method: "GET",
          description: "Productos en esta categoría",
        },
      ];

      // ✅ Agregar enlaces de modificación si el usuario tiene permisos
      if (categoryController.checkCategoryPermissions(req.userRole)) {
        links.push(
          {
            rel: "update",
            href: `${baseUrl}/api/categories/${categoryId}`,
            method: "PUT",
            description: "Actualizar categoría",
          },
          {
            rel: "delete",
            href: `${baseUrl}/api/categories/${categoryId}`,
            method: "DELETE",
            description: "Eliminar categoría",
          },
        );
      }

      // ✅ Construir respuesta final
      const responseData = {
        category,
        ...(productsResponse && { products: productsResponse }),
        links,
        permissions: {
          can_edit: categoryController.checkCategoryPermissions(req.userRole),
          can_delete:
            categoryController.checkCategoryPermissions(req.userRole) &&
            category.products_count === 0,
          can_view_inactive: categoryController.checkCategoryPermissions(
            req.userRole,
          ),
        },
        cache_info: {
          cached: process.env.ENABLE_CACHE === "true",
          ttl_seconds: categoryController.CATEGORY_CONSTANTS.CACHE_TTL,
        },
      };

      const successResponse = categoryController.buildSuccessResponse(
        responseData,
        "Categoría obtenida exitosamente",
      );
      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo categoría por ID:", {
        error: error.message,
        stack: error.stack,
        categoryId: req.params.id,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al obtener categoría",
        "CATEGORY_FETCH_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener categoría por slug (redirige a getById)
  getBySlug: async (req, res) => {
    try {
      const { slug } = req.params;

      if (!slug || slug.trim().length === 0) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "Slug de categoría requerido",
          "MISSING_SLUG",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      logger.debug("Obteniendo categoría por slug", {
        slug,
        userId: req.userId,
      });

      const category = await Category.findBySlug(slug.trim());

      if (!category) {
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría no encontrada",
          "CATEGORY_NOT_FOUND",
          { slug },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Redirigir internamente al endpoint por ID
      req.params.id = category.id;
      return categoryController.getById(req, res);
    } catch (error) {
      logger.error("Error obteniendo categoría por slug:", {
        error: error.message,
        slug: req.params.slug,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al obtener categoría por slug",
        "CATEGORY_SLUG_FETCH_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Actualizar categoría con validaciones mejoradas
  update: async (req, res) => {
    let transaction;

    try {
      const categoryId = parseInt(req.params.id, 10);
      const updateData = req.body;
      const userId = req.userId;
      const userRole = req.userRole;

      logger.info("Iniciando actualización de categoría", {
        categoryId,
        userId,
        updateFields: Object.keys(updateData),
      });

      // ✅ Validar ID de categoría
      if (!categoryId || categoryId <= 0) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "ID de categoría inválido",
          "INVALID_CATEGORY_ID",
          { provided_id: req.params.id },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar permisos
      if (!categoryController.checkCategoryPermissions(userRole)) {
        const errorResponse = categoryController.buildErrorResponse(
          403,
          "No tienes permisos para actualizar categorías",
          "INSUFFICIENT_PERMISSIONS",
          { required_roles: ["admin", "manager"] },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar que exista la categoría
      const existingCategory = await Category.findById(categoryId);
      if (!existingCategory) {
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría no encontrada",
          "CATEGORY_NOT_FOUND",
          { categoryId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validar datos de actualización
      if (Object.keys(updateData).length === 0) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "No hay datos para actualizar",
          "NO_UPDATE_DATA",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      const categoryValidation =
        categoryController.validateCategory(updateData);
      if (!categoryValidation.isValid) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "Errores de validación",
          categoryValidation.errorCode,
          { errors: categoryValidation.errors },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Verificar nombre único si se está actualizando
      if (updateData.name && updateData.name.trim() !== existingCategory.name) {
        const nameExists = await Category.findByName(updateData.name.trim());
        if (nameExists && nameExists.id !== categoryId) {
          await transaction.rollback();
          const errorResponse = categoryController.buildErrorResponse(
            409,
            "El nombre de categoría ya está en uso",
            "CATEGORY_NAME_EXISTS",
            { existing_category: { id: nameExists.id, name: nameExists.name } },
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
        updateData.name = updateData.name.trim();
      }

      // ✅ Verificar slug único si se está actualizando
      if (updateData.slug && updateData.slug !== existingCategory.slug) {
        const slugExists = await Category.findBySlug(updateData.slug);
        if (slugExists && slugExists.id !== categoryId) {
          await transaction.rollback();
          const errorResponse = categoryController.buildErrorResponse(
            409,
            "El slug ya está en uso",
            "CATEGORY_SLUG_EXISTS",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }
      }

      // ✅ Validar categoría padre si se está actualizando
      if (updateData.parent_id !== undefined) {
        // No permitir que una categoría sea padre de sí misma
        if (updateData.parent_id === categoryId) {
          await transaction.rollback();
          const errorResponse = categoryController.buildErrorResponse(
            400,
            "Una categoría no puede ser padre de sí misma",
            "CATEGORY_SELF_PARENT",
          );
          return res.status(errorResponse.status).json(errorResponse.json);
        }

        // Verificar que la categoría padre exista si no es null
        if (updateData.parent_id !== null) {
          const parentCategory = await Category.findById(updateData.parent_id);
          if (!parentCategory) {
            await transaction.rollback();
            const errorResponse = categoryController.buildErrorResponse(
              404,
              "Categoría padre no encontrada",
              "PARENT_CATEGORY_NOT_FOUND",
            );
            return res.status(errorResponse.status).json(errorResponse.json);
          }

          // ✅ Verificar ciclos (que la nueva categoría padre no sea descendiente)
          const isDescendant = await Category.isDescendantOf(
            updateData.parent_id,
            categoryId,
          );
          if (isDescendant) {
            await transaction.rollback();
            const errorResponse = categoryController.buildErrorResponse(
              400,
              "No se puede establecer una categoría descendiente como padre",
              "CATEGORY_CYCLE_DETECTED",
            );
            return res.status(errorResponse.status).json(errorResponse.json);
          }

          // ✅ Verificar profundidad máxima
          const parentDepth = await Category.getCategoryDepth(
            updateData.parent_id,
          );
          if (
            parentDepth >=
            categoryController.CATEGORY_CONSTANTS.MAX_CATEGORY_DEPTH
          ) {
            await transaction.rollback();
            const errorResponse = categoryController.buildErrorResponse(
              400,
              `Profundidad máxima de categorías alcanzada (${categoryController.CATEGORY_CONSTANTS.MAX_CATEGORY_DEPTH})`,
              "MAX_CATEGORY_DEPTH_REACHED",
            );
            return res.status(errorResponse.status).json(errorResponse.json);
          }
        }
      }

      // ✅ Preparar datos de actualización
      const finalUpdateData = {
        ...updateData,
        updated_by: userId,
        updated_at: new Date(),
      };

      // ✅ Realizar actualización
      const updated = await Category.update(
        categoryId,
        finalUpdateData,
        transaction,
      );

      if (!updated) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría no encontrada",
          "CATEGORY_NOT_FOUND",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Actualizar jerarquía si se cambió el parent_id
      if (updateData.parent_id !== undefined) {
        await Category.updateHierarchy(categoryId, transaction);
      }

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "category_updated",
          user_id: userId,
          details: {
            category_id: categoryId,
            old_data: existingCategory,
            new_data: finalUpdateData,
            changed_fields: Object.keys(updateData),
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      // ✅ Obtener categoría actualizada
      const category = await Category.findById(categoryId);

      // ✅ Invalidar caché
      await categoryController.invalidateCategoryCache(
        categoryId,
        existingCategory.parent_id,
      );
      if (
        category.parent_id &&
        category.parent_id !== existingCategory.parent_id
      ) {
        await categoryController.invalidateCategoryCache(
          null,
          category.parent_id,
        );
      }

      logger.info("Categoría actualizada exitosamente", {
        categoryId,
        updatedBy: userId,
        changedFields: Object.keys(updateData),
      });

      // ✅ Construir respuesta exitosa
      const successResponse = categoryController.buildSuccessResponse(
        {
          category,
          changes: Object.keys(updateData),
          metadata: {
            updated_at: new Date().toISOString(),
            updated_by: userId,
            previous_parent: existingCategory.parent_id,
            new_parent: category.parent_id,
          },
        },
        "Categoría actualizada exitosamente",
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

      logger.error("Error actualizando categoría:", {
        error: error.message,
        stack: error.stack,
        categoryId: req.params.id,
        userId: req.userId,
      });

      let errorResponse;

      // ✅ Manejo de errores específicos
      switch (error.code) {
        case "ER_DUP_ENTRY":
          errorResponse = categoryController.buildErrorResponse(
            409,
            "Conflicto de datos. El nombre o slug ya están en uso",
            "DUPLICATE_CATEGORY_DATA",
          );
          break;

        case "ER_NO_REFERENCED_ROW":
          errorResponse = categoryController.buildErrorResponse(
            404,
            "Categoría padre no encontrada",
            "PARENT_NOT_FOUND",
          );
          break;

        default:
          errorResponse = categoryController.buildErrorResponse(
            500,
            "Error interno al actualizar categoría",
            "CATEGORY_UPDATE_ERROR",
          );
      }

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Eliminar categoría con validaciones mejoradas
  delete: async (req, res) => {
    let transaction;

    try {
      const categoryId = parseInt(req.params.id, 10);
      const userId = req.userId;
      const userRole = req.userRole;
      const forceDelete = req.query.force === "true";

      logger.info("Iniciando eliminación de categoría", {
        categoryId,
        userId,
        userRole,
        forceDelete,
      });

      // ✅ Validar ID de categoría
      if (!categoryId || categoryId <= 0) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "ID de categoría inválido",
          "INVALID_CATEGORY_ID",
          { provided_id: req.params.id },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Solo administradores pueden eliminar categorías
      if (userRole !== "admin") {
        const errorResponse = categoryController.buildErrorResponse(
          403,
          "Se requieren permisos de administrador para eliminar categorías",
          "INSUFFICIENT_PERMISSIONS",
          { required_role: "admin" },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Verificar que la categoría exista
      const category = await Category.findById(categoryId);
      if (!category) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría no encontrada",
          "CATEGORY_NOT_FOUND",
          { categoryId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar si la categoría tiene productos
      const hasProducts = await Category.hasProducts(categoryId);

      if (hasProducts && !forceDelete) {
        const productsCount = await Category.countProducts(categoryId);
        const products = await Product.findByCategory(categoryId, 5, 0);

        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "No se puede eliminar la categoría porque tiene productos asociados",
          "CATEGORY_HAS_PRODUCTS",
          {
            products_count: productsCount,
            sample_products: products.map((p) => ({
              id: p.id,
              name: p.name,
              sku: p.sku,
            })),
            actions: [
              {
                action: "reassign_products",
                description:
                  "Reasignar productos a otra categoría antes de eliminar",
                url: `${req.protocol}://${req.get("host")}/api/categories/${categoryId}/reassign-products`,
                method: "POST",
              },
              {
                action: "force_delete",
                description:
                  "Eliminar categoría y todos sus productos (peligroso)",
                url: `${req.protocol}://${req.get("host")}/api/categories/${categoryId}?force=true`,
                method: "DELETE",
                warning:
                  "Esta acción eliminará permanentemente todos los productos asociados",
              },
            ],
          },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar si la categoría tiene subcategorías
      const hasChildren = await Category.hasChildren(categoryId);

      if (hasChildren && !forceDelete) {
        const childrenCount = await Category.countChildren(categoryId);
        const children = await Category.getChildren(categoryId);

        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "No se puede eliminar la categoría porque tiene subcategorías",
          "CATEGORY_HAS_CHILDREN",
          {
            children_count: childrenCount,
            sample_children: children.map((c) => ({ id: c.id, name: c.name })),
            actions: [
              {
                action: "reassign_children",
                description:
                  "Reasignar subcategorías a otra categoría antes de eliminar",
                url: `${req.protocol}://${req.get("host")}/api/categories/${categoryId}/reassign-children`,
                method: "POST",
              },
              {
                action: "delete_with_children",
                description: "Eliminar categoría y todas sus subcategorías",
                url: `${req.protocol}://${req.get("host")}/api/categories/${categoryId}?force=true&include_children=true`,
                method: "DELETE",
                warning:
                  "Esta acción eliminará permanentemente todas las subcategorías",
              },
            ],
          },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ En modo force delete, eliminar productos primero
      if (forceDelete && hasProducts) {
        const products = await Product.findByCategory(categoryId, 1000, 0);

        for (const product of products) {
          // Registrar eliminación de productos
          await AuditLog.create(
            {
              action: "product_deleted_with_category",
              user_id: userId,
              details: {
                product_id: product.id,
                product_name: product.name,
                deleted_with_category: categoryId,
                force_delete: true,
                ip_address: req.ip,
                user_agent: req.headers["user-agent"],
              },
            },
            transaction,
          );
        }

        // Eliminar productos
        await Product.deleteByCategory(categoryId, transaction);
      }

      // ✅ En modo force delete, eliminar subcategorías primero
      if (forceDelete && hasChildren && req.query.include_children === "true") {
        const children = await Category.getChildren(categoryId);

        for (const child of children) {
          // Eliminar recursivamente
          await Category.delete(child.id, true, transaction);
        }
      }

      // ✅ Eliminar categoría
      const deleted = await Category.delete(
        categoryId,
        forceDelete,
        transaction,
      );

      if (!deleted) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría no encontrada",
          "CATEGORY_NOT_FOUND",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Registrar actividad de auditoría
      await AuditLog.create(
        {
          action: "category_deleted",
          user_id: userId,
          details: {
            category_id: categoryId,
            category_name: category.name,
            force_delete: forceDelete,
            deleted_products:
              forceDelete && hasProducts
                ? await Category.countProducts(categoryId)
                : 0,
            deleted_children:
              forceDelete && hasChildren
                ? await Category.countChildren(categoryId)
                : 0,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      // ✅ Invalidar caché
      await categoryController.invalidateCategoryCache(
        categoryId,
        category.parent_id,
      );

      logger.info("Categoría eliminada exitosamente", {
        categoryId,
        name: category.name,
        deletedBy: userId,
        forceDelete,
        productsDeleted: forceDelete && hasProducts,
        childrenDeleted: forceDelete && hasChildren,
      });

      // ✅ Construir respuesta exitosa
      const successResponse = categoryController.buildSuccessResponse(
        {
          category_id: categoryId,
          category_name: category.name,
          deletion_type: forceDelete ? "force_delete" : "soft_delete",
          timestamp: new Date().toISOString(),
          can_restore: !forceDelete,
          ...(forceDelete && {
            warning:
              "Esta acción es irreversible. Se han eliminado permanentemente:",
            deleted_items: {
              products: hasProducts
                ? await Category.countProducts(categoryId)
                : 0,
              subcategories: hasChildren
                ? await Category.countChildren(categoryId)
                : 0,
            },
          }),
        },
        "Categoría eliminada exitosamente",
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

      logger.error("Error eliminando categoría:", {
        error: error.message,
        stack: error.stack,
        categoryId: req.params.id,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al eliminar categoría",
        "CATEGORY_DELETE_ERROR",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener todas las categorías con paginación y filtros
  getAll: async (req, res) => {
    try {
      const {
        limit = 50,
        offset = 0,
        parent_id = null,
        is_active = null,
        include_inactive = "false",
        tree_view = "false",
        include_counts = "true",
        sort_by = "name",
        sort_order = "ASC",
      } = req.query;

      logger.debug("Obteniendo todas las categorías", {
        userId: req.userId,
        filters: { parent_id, include_inactive, tree_view },
      });

      // ✅ Validar y sanitizar parámetros
      const validatedLimit = Math.min(parseInt(limit, 10) || 50, 200);
      const validatedOffset = Math.max(parseInt(offset, 10) || 0, 0);

      // ✅ Determinar si incluir inactivas
      const showInactive =
        categoryController.checkCategoryPermissions(req.userRole) ||
        include_inactive === "true";

      // ✅ Construir clave de caché
      const cacheKey = `categories:${JSON.stringify({
        limit: validatedLimit,
        offset: validatedOffset,
        parent_id,
        is_active: showInactive ? null : true,
        tree_view,
        sort_by,
        sort_order,
      })}`;

      let categories;
      let total;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true" && tree_view === "false") {
        try {
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            categories = cached.data;
            total = cached.total;
            logger.debug("Categorías obtenidas de caché", { cacheKey });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!categories) {
        if (tree_view === "true") {
          // ✅ Vista de árbol jerárquico
          categories = await Category.getTreeView(parent_id, showInactive);
          total = categories.length;
        } else {
          // ✅ Vista plana paginada
          [categories, total] = await Promise.all([
            Category.findAll(
              validatedLimit,
              validatedOffset,
              parent_id,
              showInactive ? null : true,
              sort_by,
              sort_order,
            ),
            Category.count(parent_id, showInactive ? null : true),
          ]);
        }

        // ✅ Cachear resultados si no es vista de árbol
        if (process.env.ENABLE_CACHE === "true" && tree_view === "false") {
          try {
            await cacheService.set(
              cacheKey,
              { data: categories, total },
              categoryController.CATEGORY_CONSTANTS.CACHE_TTL,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Enriquecer con conteos si se solicita
      if (include_counts === "true" && tree_view === "false") {
        categories = await Promise.all(
          categories.map(async (category) => {
            const [productsCount, childrenCount] = await Promise.all([
              Category.countProducts(category.id),
              Category.countChildren(category.id),
            ]);

            return {
              ...category,
              products_count: productsCount,
              children_count: childrenCount,
              breadcrumb: await Category.getBreadcrumb(category.id),
            };
          }),
        );
      }

      // ✅ Construir respuesta
      const responseData = {
        data: categories,
        metadata: {
          total,
          ...(tree_view === "false" && {
            pagination: {
              total,
              page: Math.floor(validatedOffset / validatedLimit) + 1,
              limit: validatedLimit,
              total_pages: Math.ceil(total / validatedLimit),
              has_more: validatedOffset + validatedLimit < total,
            },
          }),
          filters: {
            parent_id,
            include_inactive: showInactive,
            tree_view: tree_view === "true",
            sort_by,
            sort_order,
          },
          cache_info: {
            cached: process.env.ENABLE_CACHE === "true",
            ttl_seconds: categoryController.CATEGORY_CONSTANTS.CACHE_TTL,
          },
        },
      };

      // ✅ Agregar estadísticas generales para administradores
      if (categoryController.checkCategoryPermissions(req.userRole)) {
        responseData.metadata.stats = await Category.getGlobalStats();
      }

      const successResponse = categoryController.buildSuccessResponse(
        responseData,
        "Categorías obtenidas exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo categorías:", {
        error: error.message,
        stack: error.stack,
        query: req.query,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al obtener categorías",
        "CATEGORIES_FETCH_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener árbol de categorías con profundidad configurable
  getCategoryTree: async (req, res) => {
    try {
      const {
        parent_id = null,
        depth = 3,
        include_inactive = "false",
      } = req.query;

      logger.debug("Obteniendo árbol de categorías", {
        parent_id,
        depth,
        userId: req.userId,
      });

      const showInactive =
        categoryController.checkCategoryPermissions(req.userRole) ||
        include_inactive === "true";
      const maxDepth = Math.min(parseInt(depth, 10) || 3, 5);

      const cacheKey = `categories:tree:${parent_id}:${maxDepth}:${showInactive}`;
      let tree;

      // ✅ Intentar obtener de caché
      if (process.env.ENABLE_CACHE === "true") {
        try {
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            tree = cached;
            logger.debug("Árbol de categorías obtenido de caché", { cacheKey });
          }
        } catch (cacheError) {
          logger.warn("Error al acceder al caché:", cacheError.message);
        }
      }

      // ✅ Si no está en caché, obtener de la base de datos
      if (!tree) {
        tree = await Category.getTree(parent_id, maxDepth, showInactive);

        // ✅ Cachear árbol
        if (process.env.ENABLE_CACHE === "true") {
          try {
            await cacheService.set(
              cacheKey,
              tree,
              categoryController.CATEGORY_CONSTANTS.TREE_CACHE_TTL,
            );
          } catch (cacheError) {
            logger.warn("Error al almacenar en caché:", cacheError.message);
          }
        }
      }

      // ✅ Calcular métricas del árbol
      const totalNodes = await Category.countTreeNodes(tree);

      const successResponse = categoryController.buildSuccessResponse(
        {
          tree,
          metadata: {
            depth: maxDepth,
            total_nodes: totalNodes,
            generated_at: new Date().toISOString(),
            cache_info: {
              cached: process.env.ENABLE_CACHE === "true",
              ttl_seconds: categoryController.CATEGORY_CONSTANTS.TREE_CACHE_TTL,
            },
          },
        },
        "Árbol de categorías obtenido exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo árbol de categorías:", {
        error: error.message,
        parent_id: req.query.parent_id,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al obtener árbol de categorías",
        "CATEGORY_TREE_FETCH_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Buscar categorías con paginación
  searchCategories: async (req, res) => {
    try {
      const {
        q,
        limit = 20,
        offset = 0,
        include_inactive = "false",
      } = req.query;

      // ✅ Validar término de búsqueda
      if (!q || q.trim().length < 2) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "Término de búsqueda debe tener al menos 2 caracteres",
          "INVALID_SEARCH_TERM",
          { min_length: 2 },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      logger.debug("Buscando categorías", {
        query: q,
        limit,
        offset,
        userId: req.userId,
      });

      const showInactive =
        categoryController.checkCategoryPermissions(req.userRole) ||
        include_inactive === "true";
      const searchTerm = q.trim();

      const [results, total] = await Promise.all([
        Category.search(
          searchTerm,
          parseInt(limit, 10),
          parseInt(offset, 10),
          showInactive,
        ),
        Category.searchCount(searchTerm, showInactive),
      ]);

      // ✅ Enriquecer resultados
      const enrichedResults = await Promise.all(
        results.map(async (category) => {
          const [productsCount, childrenCount, breadcrumb] = await Promise.all([
            Category.countProducts(category.id),
            Category.countChildren(category.id),
            Category.getBreadcrumb(category.id),
          ]);

          return {
            ...category,
            products_count: productsCount,
            children_count: childrenCount,
            breadcrumb,
          };
        }),
      );

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      const successResponse = categoryController.buildSuccessResponse(
        {
          data: enrichedResults,
          pagination: {
            total,
            page,
            limit: parseInt(limit),
            total_pages: totalPages,
            has_more: offset + results.length < total,
          },
          search: {
            query: searchTerm,
            results_count: total,
            search_time: new Date().toISOString(),
          },
        },
        "Búsqueda de categorías completada",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error buscando categorías:", {
        error: error.message,
        query: req.query.q,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al buscar categorías",
        "CATEGORY_SEARCH_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Reasignar productos de categoría
  reassignProducts: async (req, res) => {
    let transaction;

    try {
      const categoryId = parseInt(req.params.id, 10);
      const { new_category_id, move_products = false } = req.body;
      const userId = req.userId;

      logger.info("Reasignando productos de categoría", {
        sourceCategoryId: categoryId,
        targetCategoryId: new_category_id,
        userId,
        moveProducts: move_products,
      });

      // ✅ Validar permisos (solo administradores)
      if (req.userRole !== "admin") {
        const errorResponse = categoryController.buildErrorResponse(
          403,
          "Se requieren permisos de administrador",
          "INSUFFICIENT_PERMISSIONS",
          { required_role: "admin" },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Validar IDs
      if (
        !categoryId ||
        categoryId <= 0 ||
        !new_category_id ||
        new_category_id <= 0
      ) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "IDs de categoría inválidos",
          "INVALID_CATEGORY_IDS",
          { source_id: categoryId, target_id: new_category_id },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Iniciar transacción
      transaction = await database.beginTransaction();

      // ✅ Verificar categoría origen
      const sourceCategory = await Category.findById(categoryId);
      if (!sourceCategory) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría origen no encontrada",
          "SOURCE_CATEGORY_NOT_FOUND",
          { categoryId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar categoría destino
      const targetCategory = await Category.findById(new_category_id);
      if (!targetCategory) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría destino no encontrada",
          "TARGET_CATEGORY_NOT_FOUND",
          { new_category_id },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar que no sea la misma categoría
      if (categoryId === new_category_id) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "No se puede reasignar a la misma categoría",
          "SAME_CATEGORY_REASSIGNMENT",
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Obtener productos de la categoría origen
      const productsCount = await Category.countProducts(categoryId);

      if (productsCount === 0) {
        await transaction.rollback();
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "La categoría no tiene productos para reasignar",
          "NO_PRODUCTS_TO_REASSIGN",
          { categoryId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Reasignar productos
      const reassignedCount = await Product.reassignCategory(
        categoryId,
        new_category_id,
        move_products,
        transaction,
      );

      // ✅ Registrar actividad
      await AuditLog.create(
        {
          action: "products_reassigned",
          user_id: userId,
          details: {
            from_category_id: categoryId,
            to_category_id: new_category_id,
            products_count: reassignedCount,
            move_products,
            source_category_name: sourceCategory.name,
            target_category_name: targetCategory.name,
            ip_address: req.ip,
            user_agent: req.headers["user-agent"],
          },
        },
        transaction,
      );

      // ✅ Commit de la transacción
      await database.commitTransaction(transaction);

      // ✅ Invalidar caché de ambas categorías
      await Promise.all([
        categoryController.invalidateCategoryCache(
          categoryId,
          sourceCategory.parent_id,
        ),
        categoryController.invalidateCategoryCache(
          new_category_id,
          targetCategory.parent_id,
        ),
      ]);

      logger.info("Productos reasignados exitosamente", {
        fromCategory: categoryId,
        toCategory: new_category_id,
        productsCount: reassignedCount,
        userId,
      });

      // ✅ Obtener datos actualizados
      const [remainingProducts, totalProductsAfter] = await Promise.all([
        Category.countProducts(categoryId),
        Category.countProducts(new_category_id),
      ]);

      const successResponse = categoryController.buildSuccessResponse(
        {
          from_category: {
            id: categoryId,
            name: sourceCategory.name,
            remaining_products: remainingProducts,
          },
          to_category: {
            id: new_category_id,
            name: targetCategory.name,
            total_products_after: totalProductsAfter,
          },
          reassigned_count: reassignedCount,
          operation: move_products ? "move" : "copy",
          timestamp: new Date().toISOString(),
        },
        `Productos reasignados exitosamente (${reassignedCount} productos)`,
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

      logger.error("Error reasignando productos:", {
        error: error.message,
        categoryId: req.params.id,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al reasignar productos",
        "PRODUCT_REASSIGNMENT_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Obtener estadísticas detalladas de categoría
  getCategoryStats: async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id, 10);

      // ✅ Validar ID de categoría
      if (!categoryId || categoryId <= 0) {
        const errorResponse = categoryController.buildErrorResponse(
          400,
          "ID de categoría inválido",
          "INVALID_CATEGORY_ID",
          { provided_id: req.params.id },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      logger.debug("Obteniendo estadísticas de categoría", {
        categoryId,
        userId: req.userId,
      });

      // ✅ Verificar permisos
      if (!categoryController.checkCategoryPermissions(req.userRole)) {
        const errorResponse = categoryController.buildErrorResponse(
          403,
          "No tienes permisos para ver estadísticas",
          "INSUFFICIENT_PERMISSIONS",
          { required_roles: ["admin", "manager"] },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Verificar que la categoría exista
      const category = await Category.findById(categoryId);
      if (!category) {
        const errorResponse = categoryController.buildErrorResponse(
          404,
          "Categoría no encontrada",
          "CATEGORY_NOT_FOUND",
          { categoryId },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      // ✅ Obtener estadísticas detalladas
      const stats = await Category.getDetailedStats(categoryId);

      const successResponse = categoryController.buildSuccessResponse(
        {
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
            is_active: category.is_active,
          },
          statistics: stats,
          generated_at: new Date().toISOString(),
          cache_info: {
            cached: false, // Estadísticas no se cachean por ser datos en tiempo real
            refresh_interval: 60, // Segundos
          },
        },
        "Estadísticas de categoría obtenidas exitosamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error obteniendo estadísticas de categoría:", {
        error: error.message,
        categoryId: req.params.id,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al obtener estadísticas",
        "CATEGORY_STATS_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Exportar categorías en diferentes formatos
  exportCategories: async (req, res) => {
    try {
      const { format = "json", include_products = "false" } = req.query;

      logger.info("Exportando categorías", {
        format,
        includeProducts: include_products,
        userId: req.userId,
      });

      // ✅ Verificar permisos
      if (!categoryController.checkCategoryPermissions(req.userRole)) {
        const errorResponse = categoryController.buildErrorResponse(
          403,
          "No tienes permisos para exportar categorías",
          "INSUFFICIENT_PERMISSIONS",
          { required_roles: ["admin", "manager"] },
        );
        return res.status(errorResponse.status).json(errorResponse.json);
      }

      const includeProducts = include_products === "true";
      const timestamp = Date.now();

      // ✅ Exportar según formato solicitado
      switch (format.toLowerCase()) {
        case "csv":
          const csvData = await Category.exportToCSV(includeProducts);

          res.set({
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="categorias-${timestamp}.csv"`,
            "Content-Length": Buffer.byteLength(csvData, "utf8"),
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          });

          return res.send(csvData);

        case "json":
          const jsonData = await Category.getAllForExport(includeProducts);

          res.set({
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="categorias-${timestamp}.json"`,
            "Content-Length": Buffer.byteLength(
              JSON.stringify(jsonData),
              "utf8",
            ),
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          });

          return res.json(jsonData);

        case "excel":
          // ✅ Nota: Requeriría librería adicional como exceljs
          return res.status(501).json({
            success: false,
            message: "Exportación a Excel no implementada aún",
            error_code: "EXPORT_NOT_IMPLEMENTED",
          });

        default:
          const errorResponse = categoryController.buildErrorResponse(
            400,
            "Formato de exportación no soportado",
            "UNSUPPORTED_EXPORT_FORMAT",
            { supported_formats: ["csv", "json", "excel"] },
          );
          return res.status(errorResponse.status).json(errorResponse.json);
      }
    } catch (error) {
      logger.error("Error exportando categorías:", {
        error: error.message,
        format: req.query.format,
        userId: req.userId,
      });

      const errorResponse = categoryController.buildErrorResponse(
        500,
        "Error interno al exportar categorías",
        "CATEGORY_EXPORT_ERROR",
      );
      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },

  // ✅ Health check para categorías
  healthCheck: async (req, res) => {
    try {
      // ✅ Verificar conexión a base de datos
      const dbStatus = await Category.healthCheck();

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

      const successResponse = categoryController.buildSuccessResponse(
        {
          service: "category-controller",
          status: "healthy",
          timestamp: new Date().toISOString(),
          dependencies: {
            database: dbStatus ? "connected" : "disconnected",
            cache: cacheStatus,
          },
          metrics: {
            total_categories: await Category.count(),
            active_categories: await Category.count(null, true),
            categories_with_products:
              await Category.countCategoriesWithProducts(),
          },
        },
        "Servicio de categorías funcionando correctamente",
      );

      return res.status(successResponse.status).json(successResponse.json);
    } catch (error) {
      logger.error("Error en health check de categorías:", error);

      const errorResponse = categoryController.buildErrorResponse(
        503,
        "Servicio de categorías no disponible",
        "SERVICE_UNAVAILABLE",
      );

      return res.status(errorResponse.status).json(errorResponse.json);
    }
  },
};

module.exports = categoryController;
