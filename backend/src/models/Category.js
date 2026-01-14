/**
 * ✅ MODELO MEJORADO: Category.js
 * Correcciones aplicadas:
 * 1. ✅ Corregidas importaciones faltantes (beginTransaction, commitTransaction, rollbackTransaction)
 * 2. ✅ Agregado esquema de validación Joi para categorías
 * 3. ✅ Mejor manejo de errores y logging
 * 4. ✅ Optimización de consultas SQL
 * 5. ✅ Validación de datos mejorada
 * 6. ✅ Funciones auxiliares mejoradas
 */

const {
  query,
  executeInTransaction,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
} = require("../config/database");
const Joi = require("joi");

// ✅ CORRECCIÓN: Logger simulado (reemplaza el import faltante)
const logger = {
  info: (message, data) => console.log(`[INFO] ${message}`, data),
  error: (message, data) => console.error(`[ERROR] ${message}`, data),
  warn: (message, data) => console.warn(`[WARN] ${message}`, data),
};

// ✅ CORRECCIÓN: Validator simulado (reemplaza el import faltante)
const validator = {
  schemas: {
    category: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      description: Joi.string().max(500).allow("", null),
      parentId: Joi.number().integer().min(1).allow(null),
      parent_id: Joi.number().integer().min(1).allow(null),
      color: Joi.string()
        .pattern(/^#[0-9A-F]{6}$/i)
        .allow("", null),
      icon: Joi.string().max(50).allow("", null),
      status: Joi.string().valid("active", "inactive", "archived"),
      sortOrder: Joi.number().integer().min(0),
      sort_order: Joi.number().integer().min(0),
    }).unknown(true), // Permitir campos adicionales
  },
};

// ✅ MEJORA: Clase Category con mejoras significativas
class Category {
  // ✅ MEJORA: Estados definidos como constantes
  static STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
    ARCHIVED: "archived",
  });

  // ✅ MEJORA: Campos permitidos para actualización
  static ALLOWED_FIELDS = [
    "name",
    "description",
    "parentId",
    "parent_id",
    "color",
    "icon",
    "status",
    "sortOrder",
    "sort_order",
  ];

  /**
   * ✅ MEJORA: Crear categoría con validación robusta
   * @param {Object} categoryData - Datos de la categoría
   * @param {number} userId - ID del usuario que crea
   * @returns {Promise<Object>} Categoría creada
   */
  static async create(categoryData, userId) {
    if (!userId) {
      throw new Error("Se requiere userId para crear categoría");
    }

    try {
      // ✅ MEJORA: Normalizar datos de entrada
      const normalizedData = this.normalizeCategoryData(categoryData);

      // ✅ MEJORA: Validar datos de entrada
      const validation = validator.schemas.category.validate(normalizedData, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (validation.error) {
        const errors = validation.error.details
          .map((detail) => detail.message)
          .join(", ");
        throw new Error(`Validación fallida: ${errors}`);
      }

      const validatedData = validation.value;

      // ✅ MEJORA: Verificar si la categoría ya existe
      const existingCategory = await this.findByName(validatedData.name);
      if (existingCategory) {
        throw new Error("Ya existe una categoría con ese nombre");
      }

      // ✅ MEJORA: Verificar categoría padre si se especifica
      if (validatedData.parentId) {
        const parentCategory = await this.findById(validatedData.parentId);
        if (!parentCategory) {
          throw new Error("Categoría padre no encontrada");
        }

        // ✅ MEJORA: Prevenir loops en jerarquía (máximo 3 niveles)
        if (parentCategory.parent_id) {
          const grandparent = await this.findById(parentCategory.parent_id);
          if (grandparent && grandparent.parent_id) {
            throw new Error("No se permiten más de 3 niveles de jerarquía");
          }
        }
      }

      const result = await executeInTransaction(async (connection) => {
        const sql = `
          INSERT INTO categories (
            name, 
            description, 
            parent_id,
            color,
            icon,
            status,
            sort_order,
            created_by,
            created_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [insertResult] = await connection.execute(sql, [
          validatedData.name,
          validatedData.description || null,
          validatedData.parentId || null,
          validatedData.color || null,
          validatedData.icon || null,
          validatedData.status || this.STATUS.ACTIVE,
          validatedData.sortOrder || validatedData.sort_order || 0,
          userId,
        ]);

        // ✅ MEJORA: Registrar en log de auditoría (si existe la tabla)
        try {
          await connection.execute(
            `INSERT INTO audit_logs 
              (action, entity_type, entity_id, user_id, details, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
              "CATEGORY_CREATE",
              "CATEGORY",
              insertResult.insertId,
              userId,
              JSON.stringify({
                name: validatedData.name,
                parentId: validatedData.parentId,
              }),
            ],
          );
        } catch (auditError) {
          logger.warn("No se pudo registrar en audit_logs", auditError.message);
        }

        return insertResult;
      });

      logger.info("Categoría creada", {
        categoryId: result.insertId,
        name: validatedData.name,
        userId,
      });

      return {
        id: result.insertId,
        name: validatedData.name,
        description: validatedData.description,
        parent_id: validatedData.parentId || null,
        color: validatedData.color || null,
        icon: validatedData.icon || null,
        status: validatedData.status || this.STATUS.ACTIVE,
        sort_order: validatedData.sortOrder || validatedData.sort_order || 0,
        created_by: userId,
        created_at: new Date(),
        updated_at: new Date(),
      };
    } catch (error) {
      logger.error("Error creando categoría", {
        error: error.message,
        categoryData,
        userId,
        stack: error.stack,
      });

      // ✅ MEJORA: Manejo específico de errores MySQL
      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("Ya existe una categoría con ese nombre");
      }

      throw error;
    }
  }

  /**
   * ✅ MEJORA: Encontrar categoría por ID con información enriquecida
   * @param {number} id - ID de la categoría
   * @param {boolean} includeStats - Incluir estadísticas
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  static async findById(id, includeStats = false) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error("ID de categoría inválido");
    }

    try {
      const sql = `
        SELECT 
          c.*,
          pc.name as parent_name,
          u.name as created_by_name,
          u.email as created_by_email,
          (
            SELECT COUNT(*) 
            FROM categories c2 
            WHERE c2.parent_id = c.id 
            AND c2.deleted_at IS NULL
          ) as subcategory_count,
          (
            SELECT COUNT(*) 
            FROM products p 
            WHERE p.category_id = c.id 
            AND p.deleted_at IS NULL
          ) as product_count
        FROM categories c 
        LEFT JOIN categories pc ON c.parent_id = pc.id AND pc.deleted_at IS NULL
        LEFT JOIN users u ON c.created_by = u.id AND u.deleted_at IS NULL
        WHERE c.id = ? AND c.deleted_at IS NULL
      `;

      const [category] = await query(sql, [id]);

      if (!category) {
        return null;
      }

      // ✅ MEJORA: Formatear respuesta
      const formattedCategory = this.formatCategoryResponse(category);

      // ✅ MEJORA: Incluir estadísticas si se solicita
      if (includeStats) {
        const stats = await this.getCategoryStats(id);
        formattedCategory.stats = stats;
      }

      // ✅ MEJORA: Incluir subcategorías si existen
      if (category.subcategory_count > 0) {
        const subcategories = await this.getSubcategories(id);
        formattedCategory.subcategories = subcategories;
      }

      return formattedCategory;
    } catch (error) {
      logger.error("Error buscando categoría por ID", {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Encontrar categoría por nombre
   * @param {string} name - Nombre de la categoría
   * @param {boolean} includeProducts - Incluir productos
   * @returns {Promise<Object|null>} Categoría encontrada
   */
  static async findByName(name, includeProducts = false) {
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      throw new Error("Nombre de categoría inválido");
    }

    try {
      const sql = `
        SELECT 
          c.*,
          pc.name as parent_name,
          u.name as created_by_name
        FROM categories c 
        LEFT JOIN categories pc ON c.parent_id = pc.id AND pc.deleted_at IS NULL
        LEFT JOIN users u ON c.created_by = u.id AND u.deleted_at IS NULL
        WHERE c.name = ? AND c.deleted_at IS NULL
      `;

      const [category] = await query(sql, [name.trim()]);

      if (!category) {
        return null;
      }

      // ✅ MEJORA: Incluir productos si se solicita
      if (includeProducts) {
        try {
          const Product = require("./Product");
          const products = await Product.findAll({
            categoryId: category.id,
            limit: 10,
          });
          category.recent_products = products;
        } catch (productError) {
          logger.warn("No se pudieron cargar productos para categoría", {
            categoryId: category.id,
            error: productError.message,
          });
        }
      }

      return this.formatCategoryResponse(category);
    } catch (error) {
      logger.error("Error buscando categoría por nombre", {
        name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Actualizar categoría con validación completa
   * @param {number} id - ID de la categoría
   * @param {Object} categoryData - Datos a actualizar
   * @param {number} userId - ID del usuario que actualiza
   * @returns {Promise<boolean>} True si se actualizó correctamente
   */
  static async update(id, categoryData, userId) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error("ID de categoría inválido");
    }

    if (!userId) {
      throw new Error("Se requiere userId para actualizar categoría");
    }

    let connection = null;

    try {
      // ✅ MEJORA: Verificar que la categoría existe
      const existingCategory = await this.findById(id);
      if (!existingCategory) {
        throw new Error("Categoría no encontrada");
      }

      // ✅ MEJORA: Normalizar datos de entrada
      const normalizedData = this.normalizeCategoryData(categoryData);

      // ✅ MEJORA: Filtrar solo campos permitidos
      const filteredData = {};
      this.ALLOWED_FIELDS.forEach((field) => {
        if (normalizedData[field] !== undefined) {
          filteredData[field] = normalizedData[field];
        }
      });

      // ✅ MEJORA: Validar datos de actualización
      const validation = validator.schemas.category.validate(filteredData, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (validation.error) {
        const errors = validation.error.details
          .map((detail) => detail.message)
          .join(", ");
        throw new Error(`Validación fallida: ${errors}`);
      }

      const validatedData = validation.value;

      // ✅ MEJORA: Prevenir que una categoría sea su propio padre
      if (
        validatedData.parentId === parseInt(id) ||
        validatedData.parent_id === parseInt(id)
      ) {
        throw new Error("Una categoría no puede ser su propio padre");
      }

      connection = await beginTransaction();

      const updates = [];
      const values = [];

      // ✅ MEJORA: Campos actualizables con validación adicional
      if (
        validatedData.name !== undefined &&
        validatedData.name !== existingCategory.name
      ) {
        // Verificar que el nuevo nombre no exista
        const existingWithName = await this.findByName(validatedData.name);
        if (existingWithName && existingWithName.id !== parseInt(id)) {
          throw new Error("Ya existe una categoría con ese nombre");
        }
        updates.push("name = ?");
        values.push(validatedData.name);
      }

      if (validatedData.description !== undefined) {
        updates.push("description = ?");
        values.push(validatedData.description || null);
      }

      if (
        validatedData.parentId !== undefined ||
        validatedData.parent_id !== undefined
      ) {
        const parentId = validatedData.parentId || validatedData.parent_id;

        if (parentId === null) {
          updates.push("parent_id = NULL");
        } else {
          // Verificar que la categoría padre existe
          const parentCategory = await this.findById(parentId);
          if (!parentCategory) {
            throw new Error("Categoría padre no encontrada");
          }

          // Prevenir loops
          if (await this.wouldCreateHierarchyLoop(id, parentId)) {
            throw new Error(
              "No se puede crear un loop en la jerarquía de categorías",
            );
          }

          updates.push("parent_id = ?");
          values.push(parentId);
        }
      }

      if (validatedData.color !== undefined) {
        updates.push("color = ?");
        values.push(validatedData.color || null);
      }

      if (validatedData.icon !== undefined) {
        updates.push("icon = ?");
        values.push(validatedData.icon || null);
      }

      if (validatedData.status !== undefined) {
        updates.push("status = ?");
        values.push(validatedData.status);
      }

      if (
        validatedData.sortOrder !== undefined ||
        validatedData.sort_order !== undefined
      ) {
        updates.push("sort_order = ?");
        values.push(validatedData.sortOrder || validatedData.sort_order);
      }

      // ✅ MEJORA: Siempre actualizar timestamp y usuario
      updates.push("updated_at = NOW()");
      updates.push("updated_by = ?");
      values.push(userId);

      values.push(id);

      if (updates.length <= 2) {
        // Solo updated_at y updated_by
        throw new Error("No hay campos válidos para actualizar");
      }

      const sql = `UPDATE categories SET ${updates.join(", ")} WHERE id = ? AND deleted_at IS NULL`;
      const [result] = await connection.execute(sql, values);

      if (result.affectedRows === 0) {
        throw new Error("Categoría no encontrada o ya eliminada");
      }

      // ✅ MEJORA: Registrar cambios en log de auditoría
      const changes = {};
      const fields = [
        "name",
        "description",
        "parent_id",
        "color",
        "icon",
        "status",
        "sort_order",
      ];

      fields.forEach((field) => {
        const dataField = field === "parent_id" ? "parentId" : field;
        if (
          validatedData[dataField] !== undefined &&
          validatedData[dataField] !== existingCategory[field]
        ) {
          changes[field] = {
            from: existingCategory[field],
            to: validatedData[dataField],
          };
        }
      });

      if (Object.keys(changes).length > 0) {
        try {
          await connection.execute(
            `INSERT INTO audit_logs 
              (action, entity_type, entity_id, user_id, details, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
              "CATEGORY_UPDATE",
              "CATEGORY",
              id,
              userId,
              JSON.stringify(changes),
            ],
          );
        } catch (auditError) {
          logger.warn("No se pudo registrar en audit_logs", auditError.message);
        }
      }

      await commitTransaction(connection);

      logger.info("Categoría actualizada", {
        categoryId: id,
        userId,
        changes: Object.keys(changes),
      });

      return true;
    } catch (error) {
      if (connection) {
        await rollbackTransaction(connection);
      }

      logger.error("Error actualizando categoría", {
        id,
        error: error.message,
        userId,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * ✅ MEJORA: Eliminar categoría (soft delete) con validaciones robustas
   * @param {number} id - ID de la categoría
   * @param {number} userId - ID del usuario que elimina
   * @param {boolean} force - Forzar eliminación (incluye productos)
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async delete(id, userId, force = false) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error("ID de categoría inválido");
    }

    if (!userId) {
      throw new Error("Se requiere userId para eliminar categoría");
    }

    let connection = null;

    try {
      // ✅ MEJORA: Verificar que la categoría existe
      const category = await this.findById(id);
      if (!category) {
        throw new Error("Categoría no encontrada");
      }

      // ✅ MEJORA: Verificar si tiene productos
      const hasProducts = await this.hasProducts(id);
      if (!force && hasProducts) {
        throw new Error(
          "No se puede eliminar una categoría con productos. Use force=true para forzar la eliminación.",
        );
      }

      // ✅ MEJORA: Verificar si tiene subcategorías
      const hasSubcategories = await this.hasSubcategories(id);
      if (!force && hasSubcategories) {
        throw new Error(
          "No se puede eliminar una categoría con subcategorías. Use force=true para forzar la eliminación.",
        );
      }

      connection = await beginTransaction();

      // ✅ MEJORA: Si es force delete, eliminar realmente
      if (force) {
        // Primero mover o eliminar productos si existen
        if (hasProducts) {
          // Opción 1: Mover productos a categoría por defecto (id: 1) o null
          // Opción 2: Eliminar productos (riesgoso)
          // Por ahora, simplemente lanzamos error o manejamos según política
          const deleteProductsSql =
            "UPDATE products SET deleted_at = NOW(), deleted_by = ? WHERE category_id = ?";
          await connection.execute(deleteProductsSql, [userId, id]);
        }

        // Eliminar subcategorías si existen
        if (hasSubcategories) {
          const deleteSubcategoriesSql =
            "UPDATE categories SET deleted_at = NOW(), deleted_by = ? WHERE parent_id = ?";
          await connection.execute(deleteSubcategoriesSql, [userId, id]);
        }

        const deleteSql = "DELETE FROM categories WHERE id = ?";
        await connection.execute(deleteSql, [id]);
      } else {
        // Soft delete
        const sql =
          "UPDATE categories SET deleted_at = NOW(), deleted_by = ? WHERE id = ?";
        await connection.execute(sql, [userId, id]);
      }

      // ✅ MEJORA: Registrar eliminación en log
      try {
        await connection.execute(
          `INSERT INTO audit_logs 
            (action, entity_type, entity_id, user_id, details, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            force ? "CATEGORY_FORCE_DELETE" : "CATEGORY_DELETE",
            "CATEGORY",
            id,
            userId,
            JSON.stringify({
              name: category.name,
              productCount: category.product_count || 0,
              subcategoryCount: category.subcategory_count || 0,
            }),
          ],
        );
      } catch (auditError) {
        logger.warn("No se pudo registrar en audit_logs", auditError.message);
      }

      await commitTransaction(connection);

      logger.info("Categoría eliminada", {
        categoryId: id,
        userId,
        force,
        categoryName: category.name,
      });

      return true;
    } catch (error) {
      if (connection) {
        await rollbackTransaction(connection);
      }

      logger.error("Error eliminando categoría", {
        id,
        error: error.message,
        userId,
        force,
        stack: error.stack,
      });

      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener todas las categorías con filtros avanzados
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Array>} Lista de categorías
   */
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          c.*,
          pc.name as parent_name,
          u.name as created_by_name,
          COUNT(p.id) as product_count,
          COALESCE(SUM(p.current_stock * p.cost), 0) as inventory_value
        FROM categories c 
        LEFT JOIN categories pc ON c.parent_id = pc.id AND pc.deleted_at IS NULL
        LEFT JOIN users u ON c.created_by = u.id AND u.deleted_at IS NULL
        LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
      `;

      const params = [];

      // ✅ MEJORA: Filtros avanzados
      if (filters.parentId !== undefined) {
        if (filters.parentId === null) {
          sql += " AND c.parent_id IS NULL";
        } else {
          sql += " AND c.parent_id = ?";
          params.push(filters.parentId);
        }
      }

      if (filters.status) {
        sql += " AND c.status = ?";
        params.push(filters.status);
      }

      if (filters.search) {
        sql += " AND (c.name LIKE ? OR c.description LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      sql += " GROUP BY c.id, pc.name, u.name";

      // ✅ MEJORA: Ordenamiento dinámico seguro
      let sortField = filters.sortBy || "c.sort_order";
      const sortOrder = (filters.sortOrder || "ASC").toUpperCase();

      // Validar campo de ordenamiento contra lista blanca
      const validSortFields = [
        "name",
        "product_count",
        "inventory_value",
        "created_at",
        "sort_order",
      ];
      const cleanSortField = sortField.replace("c.", "");
      if (!validSortFields.includes(cleanSortField)) {
        sortField = "c.sort_order";
      }

      if (!["ASC", "DESC"].includes(sortOrder)) {
        sortOrder = "ASC";
      }

      sql += ` ORDER BY ${sortField} ${sortOrder}`;

      // ✅ MEJORA: Paginación segura
      const limit = Math.min(Math.max(parseInt(filters.limit) || 50, 1), 500);
      const offset = Math.max(parseInt(filters.offset) || 0, 0);
      sql += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const categories = await query(sql, params);

      // ✅ MEJORA: Formatear datos
      return categories.map((category) =>
        this.formatCategoryResponse(category),
      );
    } catch (error) {
      logger.error("Error obteniendo todas las categorías", {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Contar categorías con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<number>} Total de categorías
   */
  static async count(filters = {}) {
    try {
      let sql =
        "SELECT COUNT(*) as total FROM categories WHERE deleted_at IS NULL";
      const params = [];

      if (filters.parentId !== undefined) {
        if (filters.parentId === null) {
          sql += " AND parent_id IS NULL";
        } else {
          sql += " AND parent_id = ?";
          params.push(filters.parentId);
        }
      }

      if (filters.status) {
        sql += " AND status = ?";
        params.push(filters.status);
      }

      if (filters.search) {
        sql += " AND (name LIKE ? OR description LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      const [result] = await query(sql, params);
      return result.total;
    } catch (error) {
      logger.error("Error contando categorías", {
        filters,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener subcategorías
   * @param {number} parentId - ID de la categoría padre
   * @param {boolean} includeStats - Incluir estadísticas
   * @returns {Promise<Array>} Lista de subcategorías
   */
  static async getSubcategories(parentId, includeStats = false) {
    if (!parentId || isNaN(parseInt(parentId))) {
      throw new Error("ID de categoría padre inválido");
    }

    try {
      let sql = `
        SELECT 
          c.*,
          COUNT(p.id) as product_count
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
        WHERE c.parent_id = ? AND c.deleted_at IS NULL
        GROUP BY c.id
        ORDER BY c.sort_order ASC, c.name ASC
      `;

      const subcategories = await query(sql, [parentId]);

      // ✅ MEJORA: Incluir estadísticas si se solicita
      if (includeStats) {
        for (const subcategory of subcategories) {
          const stats = await this.getCategoryStats(subcategory.id);
          subcategory.stats = stats;
        }
      }

      return subcategories.map((cat) => this.formatCategoryResponse(cat));
    } catch (error) {
      logger.error("Error obteniendo subcategorías", {
        parentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener jerarquía completa de categorías
   * @returns {Promise<Array>} Árbol de categorías
   */
  static async getCategoryTree() {
    try {
      // Obtener categorías raíz (sin padre)
      const rootCategories = await this.findAll({ parentId: null, limit: 100 });

      // Función recursiva para construir el árbol
      const buildTree = async (category) => {
        const subcategories = await this.getSubcategories(category.id);

        if (subcategories.length > 0) {
          category.children = [];
          for (const subcategory of subcategories) {
            const childTree = await buildTree(subcategory);
            category.children.push(childTree);
          }
        }

        return category;
      };

      const tree = [];
      for (const rootCategory of rootCategories) {
        const categoryTree = await buildTree(rootCategory);
        tree.push(categoryTree);
      }

      return tree;
    } catch (error) {
      logger.error("Error obteniendo árbol de categorías", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener estadísticas de categoría
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<Object>} Estadísticas
   */
  static async getCategoryStats(categoryId) {
    if (!categoryId || isNaN(parseInt(categoryId))) {
      throw new Error("ID de categoría inválido");
    }

    try {
      const sql = `
        SELECT 
          COUNT(p.id) as product_count,
          COALESCE(SUM(p.current_stock), 0) as total_stock,
          COALESCE(SUM(p.current_stock * p.cost), 0) as inventory_value,
          COALESCE(AVG(p.price), 0) as avg_price,
          COALESCE(MIN(p.price), 0) as min_price,
          COALESCE(MAX(p.price), 0) as max_price,
          COUNT(CASE WHEN p.current_stock <= p.min_stock AND p.min_stock > 0 THEN 1 END) as low_stock_count,
          COUNT(CASE WHEN p.current_stock = 0 THEN 1 END) as out_of_stock_count
        FROM products p 
        WHERE p.category_id = ? AND p.deleted_at IS NULL
      `;

      const [stats] = await query(sql, [categoryId]);

      return {
        product_count: stats.product_count || 0,
        total_stock: stats.total_stock || 0,
        inventory_value: stats.inventory_value || 0,
        inventory_value_formatted: this.formatCurrency(
          stats.inventory_value || 0,
        ),
        avg_price: stats.avg_price || 0,
        avg_price_formatted: this.formatCurrency(stats.avg_price || 0),
        min_price: stats.min_price || 0,
        min_price_formatted: this.formatCurrency(stats.min_price || 0),
        max_price: stats.max_price || 0,
        max_price_formatted: this.formatCurrency(stats.max_price || 0),
        low_stock_count: stats.low_stock_count || 0,
        out_of_stock_count: stats.out_of_stock_count || 0,
        stock_health_percentage:
          stats.total_stock > 0
            ? Math.round(
                ((stats.total_stock - stats.out_of_stock_count) /
                  stats.total_stock) *
                  100,
              )
            : 100,
      };
    } catch (error) {
      logger.error("Error obteniendo estadísticas de categoría", {
        categoryId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Verificar si la categoría tiene productos
   * @param {number} id - ID de la categoría
   * @returns {Promise<boolean>} True si tiene productos
   */
  static async hasProducts(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error("ID de categoría inválido");
    }

    try {
      const sql =
        "SELECT COUNT(*) as count FROM products WHERE category_id = ? AND deleted_at IS NULL";
      const [result] = await query(sql, [id]);
      return result.count > 0;
    } catch (error) {
      logger.error("Error verificando si categoría tiene productos", {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Verificar si tiene subcategorías
   * @param {number} id - ID de la categoría
   * @returns {Promise<boolean>} True si tiene subcategorías
   */
  static async hasSubcategories(id) {
    if (!id || isNaN(parseInt(id))) {
      throw new Error("ID de categoría inválido");
    }

    try {
      const sql =
        "SELECT COUNT(*) as count FROM categories WHERE parent_id = ? AND deleted_at IS NULL";
      const [result] = await query(sql, [id]);
      return result.count > 0;
    } catch (error) {
      logger.error("Error verificando si categoría tiene subcategorías", {
        id,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Verificar si crearía un loop en la jerarquía
   * @param {number} categoryId - ID de la categoría
   * @param {number} newParentId - ID del nuevo padre
   * @returns {Promise<boolean>} True si crearía un loop
   */
  static async wouldCreateHierarchyLoop(categoryId, newParentId) {
    if (
      !categoryId ||
      !newParentId ||
      isNaN(parseInt(categoryId)) ||
      isNaN(parseInt(newParentId))
    ) {
      throw new Error("IDs de categoría inválidos");
    }

    if (parseInt(categoryId) === parseInt(newParentId)) {
      return true;
    }

    try {
      // Obtener todos los ancestros de la nueva categoría padre
      const getAncestors = async (catId, ancestors = new Set()) => {
        const sql =
          "SELECT id, parent_id FROM categories WHERE id = ? AND deleted_at IS NULL";
        const [category] = await query(sql, [catId]);

        if (!category) {
          return ancestors;
        }

        ancestors.add(category.id);

        if (category.parent_id) {
          return await getAncestors(category.parent_id, ancestors);
        }

        return ancestors;
      };

      const ancestors = await getAncestors(newParentId);

      // Si la categoría actual está entre los ancestros del nuevo padre, sería un loop
      return ancestors.has(parseInt(categoryId));
    } catch (error) {
      logger.error("Error verificando loop en jerarquía", {
        categoryId,
        newParentId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Mover productos a otra categoría
   * @param {number} fromCategoryId - Categoría origen
   * @param {number} toCategoryId - Categoría destino
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Resultado de la operación
   */
  static async moveProducts(fromCategoryId, toCategoryId, userId) {
    if (
      !fromCategoryId ||
      !toCategoryId ||
      !userId ||
      isNaN(parseInt(fromCategoryId)) ||
      isNaN(parseInt(toCategoryId))
    ) {
      throw new Error("Parámetros inválidos");
    }

    let connection = null;

    try {
      // Verificar que ambas categorías existen
      const fromCategory = await this.findById(fromCategoryId);
      const toCategory = await this.findById(toCategoryId);

      if (!fromCategory || !toCategory) {
        throw new Error("Una o ambas categorías no existen");
      }

      if (fromCategoryId === toCategoryId) {
        throw new Error("No se pueden mover productos a la misma categoría");
      }

      connection = await beginTransaction();

      // Mover productos
      const updateSql = `
        UPDATE products 
        SET category_id = ?, 
            updated_at = NOW(),
            updated_by = ?
        WHERE category_id = ? AND deleted_at IS NULL
      `;

      const [result] = await connection.execute(updateSql, [
        toCategoryId,
        userId,
        fromCategoryId,
      ]);

      // Registrar la operación
      try {
        await connection.execute(
          `INSERT INTO audit_logs 
            (action, entity_type, entity_id, user_id, details, created_at) 
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [
            "CATEGORY_MOVE_PRODUCTS",
            "CATEGORY",
            fromCategoryId,
            userId,
            JSON.stringify({
              fromCategoryId,
              toCategoryId,
              productsMoved: result.affectedRows,
              fromCategoryName: fromCategory.name,
              toCategoryName: toCategory.name,
            }),
          ],
        );
      } catch (auditError) {
        logger.warn("No se pudo registrar en audit_logs", auditError.message);
      }

      await commitTransaction(connection);

      logger.info("Productos movidos entre categorías", {
        fromCategoryId,
        toCategoryId,
        productsMoved: result.affectedRows,
        userId,
      });

      return {
        success: true,
        productsMoved: result.affectedRows,
        fromCategory: fromCategory.name,
        toCategory: toCategory.name,
      };
    } catch (error) {
      if (connection) {
        await rollbackTransaction(connection);
      }

      logger.error("Error moviendo productos entre categorías", {
        fromCategoryId,
        toCategoryId,
        error: error.message,
        userId,
      });

      throw error;
    }
  }

  /**
   * ✅ MEJORA: Obtener categorías más populares (con más productos)
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} Categorías populares
   */
  static async getTopCategories(limit = 10) {
    const safeLimit = Math.min(Math.max(parseInt(limit) || 10, 1), 100);

    try {
      const sql = `
        SELECT 
          c.id,
          c.name,
          c.color,
          c.icon,
          COUNT(p.id) as product_count,
          COALESCE(SUM(p.current_stock), 0) as total_stock,
          COALESCE(SUM(p.current_stock * p.cost), 0) as inventory_value
        FROM categories c 
        LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL AND c.status = 'active'
        GROUP BY c.id, c.name, c.color, c.icon
        ORDER BY product_count DESC, inventory_value DESC
        LIMIT ?
      `;

      const categories = await query(sql, [safeLimit]);

      return categories.map((category) => ({
        ...category,
        inventory_value_formatted: this.formatCurrency(
          category.inventory_value,
        ),
        has_products: category.product_count > 0,
      }));
    } catch (error) {
      logger.error("Error obteniendo categorías populares", {
        limit,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Buscar categorías por término
   * @param {string} term - Término de búsqueda
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Array>} Categorías encontradas
   */
  static async search(term, filters = {}) {
    if (!term || typeof term !== "string" || term.trim().length < 2) {
      throw new Error("Término de búsqueda inválido");
    }

    try {
      let sql = `
        SELECT 
          c.*,
          pc.name as parent_name,
          COUNT(p.id) as product_count
        FROM categories c 
        LEFT JOIN categories pc ON c.parent_id = pc.id AND pc.deleted_at IS NULL
        LEFT JOIN products p ON c.id = p.category_id AND p.deleted_at IS NULL
        WHERE c.deleted_at IS NULL
        AND (c.name LIKE ? OR c.description LIKE ?)
      `;

      const searchTerm = `%${term.trim()}%`;
      const params = [searchTerm, searchTerm];

      if (filters.status) {
        sql += " AND c.status = ?";
        params.push(filters.status);
      }

      sql += " GROUP BY c.id, pc.name";
      sql += " ORDER BY c.name ASC";

      if (filters.limit) {
        const safeLimit = Math.min(
          Math.max(parseInt(filters.limit) || 50, 1),
          200,
        );
        sql += " LIMIT ?";
        params.push(safeLimit);
      }

      const categories = await query(sql, params);

      return categories.map((category) =>
        this.formatCategoryResponse(category),
      );
    } catch (error) {
      logger.error("Error buscando categorías", {
        term,
        error: error.message,
      });
      throw error;
    }
  }

  // ============ MÉTODOS HELPER ============

  /**
   * ✅ MEJORA: Normalizar datos de categoría
   * @param {Object} data - Datos a normalizar
   * @returns {Object} Datos normalizados
   */
  static normalizeCategoryData(data) {
    if (!data || typeof data !== "object") {
      return {};
    }

    const normalized = { ...data };

    // Normalizar nombres de campos
    if (
      normalized.parent_id !== undefined &&
      normalized.parentId === undefined
    ) {
      normalized.parentId = normalized.parent_id;
    }

    if (
      normalized.sort_order !== undefined &&
      normalized.sortOrder === undefined
    ) {
      normalized.sortOrder = normalized.sort_order;
    }

    // Normalizar strings
    if (normalized.name) {
      normalized.name = normalized.name.trim();
    }

    if (normalized.description) {
      normalized.description = normalized.description.trim();
    }

    if (normalized.color) {
      normalized.color = normalized.color.trim();
    }

    if (normalized.icon) {
      normalized.icon = normalized.icon.trim();
    }

    return normalized;
  }

  /**
   * ✅ MEJORA: Formatear respuesta de categoría
   * @param {Object} category - Categoría sin formato
   * @returns {Object} Categoría formateada
   */
  static formatCategoryResponse(category) {
    if (!category) return null;

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      parent_name: category.parent_name,
      color: category.color,
      icon: category.icon,
      status: category.status,
      status_display: this.getStatusDisplay(category.status),
      sort_order: category.sort_order,
      created_by: category.created_by,
      created_by_name: category.created_by_name,
      created_by_email: category.created_by_email,
      created_at: category.created_at,
      updated_at: category.updated_at,
      product_count: category.product_count || 0,
      inventory_value: category.inventory_value || 0,
      inventory_value_formatted: this.formatCurrency(
        category.inventory_value || 0,
      ),
      subcategory_count: category.subcategory_count || 0,
      has_products: (category.product_count || 0) > 0,
      has_subcategories: (category.subcategory_count || 0) > 0,
    };
  }

  /**
   * ✅ MEJORA: Obtener texto descriptivo del estado
   * @param {string} status - Estado de la categoría
   * @returns {string} Texto descriptivo
   */
  static getStatusDisplay(status) {
    const statusMap = {
      active: "Activa",
      inactive: "Inactiva",
      archived: "Archivada",
    };

    return statusMap[status] || status;
  }

  /**
   * ✅ MEJORA: Formatear moneda
   * @param {number} amount - Cantidad a formatear
   * @returns {string} Cantidad formateada
   */
  static formatCurrency(amount) {
    const numAmount = parseFloat(amount) || 0;
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }

  /**
   * ✅ MEJORA: Verificar si una categoría es válida
   * @param {number} categoryId - ID de la categoría
   * @returns {Promise<boolean>} True si es válida
   */
  static async isValidCategory(categoryId) {
    try {
      if (!categoryId || isNaN(parseInt(categoryId))) {
        return false;
      }

      const category = await this.findById(categoryId);
      return category !== null && category.status === this.STATUS.ACTIVE;
    } catch (error) {
      logger.warn("Error verificando validez de categoría", {
        categoryId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * ✅ MEJORA: Obtener categorías activas
   * @returns {Promise<Array>} Categorías activas
   */
  static async getActiveCategories() {
    try {
      return await this.findAll({
        status: this.STATUS.ACTIVE,
        limit: 1000,
      });
    } catch (error) {
      logger.error("Error obteniendo categorías activas", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * ✅ MEJORA: Sincronizar orden de categorías
   * @param {Array} categoriesOrder - Array de IDs en orden
   * @param {number} userId - ID del usuario
   * @returns {Promise<boolean>} True si se sincronizó correctamente
   */
  static async syncOrder(categoriesOrder, userId) {
    if (!Array.isArray(categoriesOrder) || !userId) {
      throw new Error("Parámetros inválidos para sincronizar orden");
    }

    let connection = null;

    try {
      connection = await beginTransaction();

      // Actualizar orden de cada categoría
      for (let i = 0; i < categoriesOrder.length; i++) {
        const categoryId = categoriesOrder[i];

        if (!categoryId || isNaN(parseInt(categoryId))) {
          continue;
        }

        const updateSql = `
          UPDATE categories 
          SET sort_order = ?, updated_at = NOW(), updated_by = ?
          WHERE id = ? AND deleted_at IS NULL
        `;

        await connection.execute(updateSql, [i + 1, userId, categoryId]);
      }

      await commitTransaction(connection);

      logger.info("Orden de categorías sincronizado", {
        categoriesCount: categoriesOrder.length,
        userId,
      });

      return true;
    } catch (error) {
      if (connection) {
        await rollbackTransaction(connection);
      }

      logger.error("Error sincronizando orden de categorías", {
        error: error.message,
        userId,
      });

      throw error;
    }
  }
}

module.exports = Category;
