/**
 * ✅ MODELO DE PROVEEDOR (SUPPLIER) MEJORADO
 *
 * Este modelo maneja las operaciones CRUD para proveedores del sistema de inventario.
 * Correcciones aplicadas:
 * 1. Validación de datos robusta
 * 2. Manejo de transacciones mejorado
 * 3. Optimización de consultas
 * 4. Manejo de errores consistente
 * 5. Métodos de utilidad para búsquedas avanzadas
 */

const { query, executeInTransaction } = require("../config/database");
const logger = require("../utils/logger");

/**
 * ✅ Clase Supplier - Modelo de Proveedores
 * Proporciona métodos para todas las operaciones relacionadas con proveedores
 */
class Supplier {
  /**
   * ✅ Crear un nuevo proveedor
   * @param {Object} supplierData - Datos del proveedor
   * @returns {Promise<Object>} Proveedor creado
   */
  static async create(supplierData) {
    try {
      // ✅ MEJORA: Validación de datos de entrada
      const validationErrors = this.validateSupplierData(supplierData);
      if (validationErrors.length > 0) {
        throw new Error(
          `Datos de proveedor inválidos: ${validationErrors.join(", ")}`,
        );
      }

      // ✅ MEJORA: Normalizar datos antes de insertar
      const normalizedData = this.normalizeSupplierData(supplierData);

      const sql = `
        INSERT INTO suppliers (
          name, 
          company_name, 
          contact_person, 
          email, 
          phone, 
          alternate_phone, 
          tax_id, 
          address, 
          city, 
          state, 
          country, 
          postal_code, 
          website, 
          payment_terms, 
          credit_limit, 
          rating, 
          status, 
          notes, 
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        normalizedData.name,
        normalizedData.company_name || null,
        normalizedData.contact_person || null,
        normalizedData.email || null,
        normalizedData.phone || null,
        normalizedData.alternate_phone || null,
        normalizedData.tax_id || null,
        normalizedData.address || null,
        normalizedData.city || null,
        normalizedData.state || null,
        normalizedData.country || null,
        normalizedData.postal_code || null,
        normalizedData.website || null,
        normalizedData.payment_terms || null,
        normalizedData.credit_limit || 0,
        normalizedData.rating || 0,
        normalizedData.status || "active",
        normalizedData.notes || null,
        normalizedData.created_by || null,
      ];

      // ✅ MEJORA: Usar transacción para consistencia
      const result = await executeInTransaction(async (connection) => {
        const [insertResult] = await connection.execute(sql, params);

        // Obtener el proveedor recién creado
        const newSupplier = await this.findById(
          insertResult.insertId,
          connection,
        );

        logger.info("Proveedor creado exitosamente", {
          supplierId: insertResult.insertId,
          name: normalizedData.name,
        });

        return newSupplier;
      });

      return result;
    } catch (error) {
      logger.error("Error creando proveedor:", {
        error: error.message,
        data: supplierData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Actualizar un proveedor existente
   * @param {number} id - ID del proveedor
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>} Proveedor actualizado
   */
  static async update(id, updateData) {
    try {
      // ✅ MEJORA: Verificar que el proveedor existe
      const existingSupplier = await this.findById(id);
      if (!existingSupplier) {
        throw new Error(`Proveedor con ID ${id} no encontrado`);
      }

      // ✅ MEJORA: Validar datos de actualización
      const validationErrors = this.validateUpdateData(updateData);
      if (validationErrors.length > 0) {
        throw new Error(
          `Datos de actualización inválidos: ${validationErrors.join(", ")}`,
        );
      }

      // ✅ MEJORA: Preparar campos y valores para actualización
      const { fields, values } = this.prepareUpdateFields(updateData);

      if (fields.length === 0) {
        throw new Error("No se proporcionaron campos para actualizar");
      }

      const sql = `
        UPDATE suppliers 
        SET ${fields.map((field) => `${field} = ?`).join(", ")}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      const params = [...values, id];

      const result = await executeInTransaction(async (connection) => {
        const [updateResult] = await connection.execute(sql, params);

        if (updateResult.affectedRows === 0) {
          throw new Error(`No se pudo actualizar el proveedor con ID ${id}`);
        }

        // Obtener el proveedor actualizado
        const updatedSupplier = await this.findById(id, connection);

        logger.info("Proveedor actualizado exitosamente", {
          supplierId: id,
          updatedFields: fields,
        });

        return updatedSupplier;
      });

      return result;
    } catch (error) {
      logger.error("Error actualizando proveedor:", {
        supplierId: id,
        error: error.message,
        updateData: updateData,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Eliminar un proveedor (soft delete)
   * @param {number} id - ID del proveedor
   * @param {number} deletedBy - ID del usuario que elimina
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  static async delete(id, deletedBy = null) {
    try {
      // ✅ MEJORA: Verificar que el proveedor existe
      const existingSupplier = await this.findById(id);
      if (!existingSupplier) {
        throw new Error(`Proveedor con ID ${id} no encontrado`);
      }

      // ✅ MEJORA: Verificar que no tenga productos asociados
      const hasProducts = await this.hasAssociatedProducts(id);
      if (hasProducts) {
        throw new Error(
          `No se puede eliminar el proveedor porque tiene productos asociados`,
        );
      }

      const sql = `
        UPDATE suppliers 
        SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP, deleted_by = ?
        WHERE id = ?
      `;

      const result = await executeInTransaction(async (connection) => {
        const [deleteResult] = await connection.execute(sql, [deletedBy, id]);

        if (deleteResult.affectedRows === 0) {
          throw new Error(`No se pudo eliminar el proveedor con ID ${id}`);
        }

        logger.info("Proveedor eliminado exitosamente (soft delete)", {
          supplierId: id,
          deletedBy: deletedBy,
        });

        return true;
      });

      return result;
    } catch (error) {
      logger.error("Error eliminando proveedor:", {
        supplierId: id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Buscar proveedor por ID
   * @param {number} id - ID del proveedor
   * @param {Object} connection - Conexión opcional (para transacciones)
   * @returns {Promise<Object|null>} Proveedor encontrado o null
   */
  static async findById(id, connection = null) {
    try {
      const sql = `
        SELECT 
          s.*,
          u_created.username as created_by_name,
          u_updated.username as updated_by_name,
          u_deleted.username as deleted_by_name,
          COUNT(DISTINCT p.id) as products_count,
          SUM(CASE WHEN p.status = 'active' THEN 1 ELSE 0 END) as active_products_count
        FROM suppliers s
        LEFT JOIN users u_created ON s.created_by = u_created.id
        LEFT JOIN users u_updated ON s.updated_by = u_updated.id
        LEFT JOIN users u_deleted ON s.deleted_by = u_deleted.id
        LEFT JOIN products p ON s.id = p.supplier_id
        WHERE s.id = ? AND s.status != 'deleted'
        GROUP BY s.id
      `;

      const executeQuery = connection
        ? connection.execute.bind(connection)
        : query;
      const result = await executeQuery(sql, [id]);

      return result.length > 0 ? this.formatSupplier(result[0]) : null;
    } catch (error) {
      logger.error("Error buscando proveedor por ID:", {
        supplierId: id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Buscar todos los proveedores con paginación y filtros
   * @param {Object} options - Opciones de búsqueda
   * @returns {Promise<Object>} Proveedores y metadatos de paginación
   */
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = "",
        status = "active",
        sortBy = "created_at",
        sortOrder = "DESC",
        includeDeleted = false,
      } = options;

      // ✅ MEJORA: Validar parámetros de paginación
      const validatedOptions = this.validatePaginationOptions({
        page,
        limit,
        sortBy,
        sortOrder,
      });

      // ✅ MEJORA: Construir consulta dinámica con filtros
      const { whereClause, params } = this.buildWhereClause({
        search,
        status,
        includeDeleted,
      });

      // Consulta para datos
      const dataSql = `
        SELECT 
          s.*,
          u_created.username as created_by_name,
          COUNT(DISTINCT p.id) as products_count
        FROM suppliers s
        LEFT JOIN users u_created ON s.created_by = u_created.id
        LEFT JOIN products p ON s.id = p.supplier_id
        ${whereClause}
        GROUP BY s.id
        ORDER BY ${validatedOptions.sortBy} ${validatedOptions.sortOrder}
        LIMIT ? OFFSET ?
      `;

      const offset = (validatedOptions.page - 1) * validatedOptions.limit;
      const dataParams = [...params, validatedOptions.limit, offset];

      // Consulta para conteo total
      const countSql = `
        SELECT COUNT(DISTINCT s.id) as total
        FROM suppliers s
        ${whereClause}
      `;

      // ✅ MEJORA: Ejecutar consultas en paralelo para mejor performance
      const [suppliersData, countResult] = await Promise.all([
        query(dataSql, dataParams),
        query(countSql, params),
      ]);

      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / validatedOptions.limit);

      // ✅ MEJORA: Formatear resultados
      const formattedSuppliers = suppliersData.map((supplier) =>
        this.formatSupplier(supplier),
      );

      return {
        suppliers: formattedSuppliers,
        pagination: {
          page: validatedOptions.page,
          limit: validatedOptions.limit,
          total,
          totalPages,
          hasNextPage: validatedOptions.page < totalPages,
          hasPrevPage: validatedOptions.page > 1,
        },
        filters: {
          search,
          status,
          sortBy: validatedOptions.sortBy,
          sortOrder: validatedOptions.sortOrder,
        },
      };
    } catch (error) {
      logger.error("Error buscando todos los proveedores:", {
        options: options,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Buscar proveedores por nombre o compañía (autocomplete)
   * @param {string} query - Término de búsqueda
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>} Proveedores encontrados
   */
  static async search(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const searchTerm = `%${query.trim()}%`;
      const sql = `
        SELECT id, name, company_name, email, phone, rating, status
        FROM suppliers
        WHERE (name LIKE ? OR company_name LIKE ? OR email LIKE ? OR phone LIKE ?)
          AND status = 'active'
        ORDER BY 
          CASE 
            WHEN name LIKE ? THEN 1
            WHEN company_name LIKE ? THEN 2
            WHEN email LIKE ? THEN 3
            ELSE 4
          END,
          rating DESC
        LIMIT ?
      `;

      const params = [
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        limit,
      ];

      const results = await query(sql, params);
      return results.map((supplier) => ({
        id: supplier.id,
        label: supplier.company_name
          ? `${supplier.name} (${supplier.company_name})`
          : supplier.name,
        value: supplier.id,
        email: supplier.email,
        phone: supplier.phone,
        rating: supplier.rating,
      }));
    } catch (error) {
      logger.error("Error buscando proveedores:", {
        query: query,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Obtener estadísticas de proveedores
   * @returns {Promise<Object>} Estadísticas agregadas
   */
  static async getStatistics() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_suppliers,
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_suppliers,
          SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_suppliers,
          SUM(CASE WHEN status = 'deleted' THEN 1 ELSE 0 END) as deleted_suppliers,
          AVG(rating) as average_rating,
          MIN(created_at) as first_supplier_date,
          MAX(created_at) as last_supplier_date,
          COUNT(DISTINCT country) as countries_count
        FROM suppliers
      `;

      const [stats] = await query(sql);

      // ✅ MEJORA: Estadísticas adicionales
      const topSuppliersSql = `
        SELECT s.id, s.name, COUNT(p.id) as products_count
        FROM suppliers s
        LEFT JOIN products p ON s.id = p.supplier_id
        WHERE s.status = 'active'
        GROUP BY s.id
        ORDER BY products_count DESC
        LIMIT 5
      `;

      const [topSuppliers] = await query(topSuppliersSql);

      return {
        totals: {
          all: stats.total_suppliers || 0,
          active: stats.active_suppliers || 0,
          inactive: stats.inactive_suppliers || 0,
          deleted: stats.deleted_suppliers || 0,
        },
        ratings: {
          average: parseFloat(stats.average_rating || 0).toFixed(1),
          distribution: await this.getRatingDistribution(),
        },
        timeline: {
          first: stats.first_supplier_date,
          last: stats.last_supplier_date,
          countries: stats.countries_count || 0,
        },
        topSuppliers: topSuppliers.map((s) => ({
          id: s.id,
          name: s.name,
          productsCount: s.products_count || 0,
        })),
      };
    } catch (error) {
      logger.error("Error obteniendo estadísticas de proveedores:", {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Verificar si un proveedor tiene productos asociados
   * @param {number} supplierId - ID del proveedor
   * @returns {Promise<boolean>} True si tiene productos asociados
   */
  static async hasAssociatedProducts(supplierId) {
    try {
      const sql = `
        SELECT COUNT(*) as count
        FROM products
        WHERE supplier_id = ? AND status != 'deleted'
        LIMIT 1
      `;

      const [result] = await query(sql, [supplierId]);
      return result.count > 0;
    } catch (error) {
      logger.error("Error verificando productos asociados:", {
        supplierId: supplierId,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * ✅ Restaurar un proveedor eliminado
   * @param {number} id - ID del proveedor
   * @returns {Promise<Object>} Proveedor restaurado
   */
  static async restore(id) {
    try {
      const sql = `
        UPDATE suppliers 
        SET status = 'active', deleted_at = NULL, deleted_by = NULL
        WHERE id = ? AND status = 'deleted'
      `;

      const result = await executeInTransaction(async (connection) => {
        const [updateResult] = await connection.execute(sql, [id]);

        if (updateResult.affectedRows === 0) {
          throw new Error(`No se pudo restaurar el proveedor con ID ${id}`);
        }

        const restoredSupplier = await this.findById(id, connection);

        logger.info("Proveedor restaurado exitosamente", {
          supplierId: id,
        });

        return restoredSupplier;
      });

      return result;
    } catch (error) {
      logger.error("Error restaurando proveedor:", {
        supplierId: id,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  // ============================================
  // ✅ MÉTODOS DE UTILIDAD PRIVADOS
  // ============================================

  /**
   * ✅ Validar datos del proveedor
   * @param {Object} data - Datos a validar
   * @returns {Array} Errores de validación
   */
  static validateSupplierData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("El email no es válido");
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push("El teléfono no es válido");
    }

    if (
      data.credit_limit &&
      (isNaN(data.credit_limit) || data.credit_limit < 0)
    ) {
      errors.push("El límite de crédito debe ser un número positivo");
    }

    if (data.rating && (data.rating < 0 || data.rating > 5)) {
      errors.push("La calificación debe estar entre 0 y 5");
    }

    return errors;
  }

  /**
   * ✅ Validar datos de actualización
   * @param {Object} data - Datos a validar
   * @returns {Array} Errores de validación
   */
  static validateUpdateData(data) {
    const errors = [];

    if (data.name && data.name.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    }

    if (data.email && !this.isValidEmail(data.email)) {
      errors.push("El email no es válido");
    }

    if (data.phone && !this.isValidPhone(data.phone)) {
      errors.push("El teléfono no es válido");
    }

    if (
      data.credit_limit !== undefined &&
      (isNaN(data.credit_limit) || data.credit_limit < 0)
    ) {
      errors.push("El límite de crédito debe ser un número positivo");
    }

    if (data.rating !== undefined && (data.rating < 0 || data.rating > 5)) {
      errors.push("La calificación debe estar entre 0 y 5");
    }

    return errors;
  }

  /**
   * ✅ Normalizar datos del proveedor
   * @param {Object} data - Datos a normalizar
   * @returns {Object} Datos normalizados
   */
  static normalizeSupplierData(data) {
    return {
      ...data,
      name: data.name ? data.name.trim() : "",
      company_name: data.company_name ? data.company_name.trim() : null,
      contact_person: data.contact_person ? data.contact_person.trim() : null,
      email: data.email ? data.email.trim().toLowerCase() : null,
      phone: data.phone ? this.normalizePhone(data.phone) : null,
      alternate_phone: data.alternate_phone
        ? this.normalizePhone(data.alternate_phone)
        : null,
      tax_id: data.tax_id ? data.tax_id.trim().toUpperCase() : null,
      address: data.address ? data.address.trim() : null,
      city: data.city ? data.city.trim() : null,
      state: data.state ? data.state.trim() : null,
      country: data.country ? data.country.trim() : null,
      postal_code: data.postal_code ? data.postal_code.trim() : null,
      website: data.website ? this.normalizeWebsite(data.website) : null,
      payment_terms: data.payment_terms ? data.payment_terms.trim() : null,
      credit_limit: data.credit_limit ? parseFloat(data.credit_limit) : 0,
      rating: data.rating ? parseFloat(data.rating) : 0,
      status: data.status || "active",
      notes: data.notes ? data.notes.trim() : null,
    };
  }

  /**
   * ✅ Preparar campos para actualización
   * @param {Object} data - Datos de actualización
   * @returns {Object} Campos y valores preparados
   */
  static prepareUpdateFields(data) {
    const allowedFields = [
      "name",
      "company_name",
      "contact_person",
      "email",
      "phone",
      "alternate_phone",
      "tax_id",
      "address",
      "city",
      "state",
      "country",
      "postal_code",
      "website",
      "payment_terms",
      "credit_limit",
      "rating",
      "status",
      "notes",
      "updated_by",
    ];

    const fields = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key) && data[key] !== undefined) {
        fields.push(key);

        // ✅ MEJORA: Normalizar valores según el campo
        let value = data[key];

        switch (key) {
          case "email":
            value = value.trim().toLowerCase();
            break;
          case "phone":
          case "alternate_phone":
            value = this.normalizePhone(value);
            break;
          case "credit_limit":
          case "rating":
            value = parseFloat(value);
            break;
          case "name":
          case "company_name":
          case "contact_person":
          case "tax_id":
          case "address":
          case "city":
          case "state":
          case "country":
          case "postal_code":
          case "payment_terms":
          case "notes":
            value = value ? value.trim() : null;
            break;
          case "website":
            value = this.normalizeWebsite(value);
            break;
        }

        values.push(value);
      }
    });

    return { fields, values };
  }

  /**
   * ✅ Construir cláusula WHERE dinámica
   * @param {Object} filters - Filtros a aplicar
   * @returns {Object} Cláusula WHERE y parámetros
   */
  static buildWhereClause(filters) {
    const conditions = [];
    const params = [];

    // Filtro por estado
    if (!filters.includeDeleted) {
      conditions.push("s.status != ?");
      params.push("deleted");
    } else if (filters.status && filters.status !== "all") {
      conditions.push("s.status = ?");
      params.push(filters.status);
    }

    // Filtro de búsqueda
    if (filters.search) {
      conditions.push(`
        (s.name LIKE ? OR 
         s.company_name LIKE ? OR 
         s.email LIKE ? OR 
         s.phone LIKE ? OR 
         s.contact_person LIKE ? OR 
         s.tax_id LIKE ?)
      `);
      const searchTerm = `%${filters.search}%`;
      params.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      );
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    return { whereClause, params };
  }

  /**
   * ✅ Validar opciones de paginación
   * @param {Object} options - Opciones a validar
   * @returns {Object} Opciones validadas
   */
  static validatePaginationOptions(options) {
    const allowedSortFields = [
      "id",
      "name",
      "company_name",
      "email",
      "phone",
      "rating",
      "created_at",
      "updated_at",
    ];

    const validated = {
      page: Math.max(1, parseInt(options.page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(options.limit) || 20)),
      sortBy: allowedSortFields.includes(options.sortBy)
        ? options.sortBy
        : "created_at",
      sortOrder: options.sortOrder === "ASC" ? "ASC" : "DESC",
    };

    return validated;
  }

  /**
   * ✅ Formatear proveedor para respuesta
   * @param {Object} supplier - Proveedor de la base de datos
   * @returns {Object} Proveedor formateado
   */
  static formatSupplier(supplier) {
    return {
      id: supplier.id,
      name: supplier.name,
      company_name: supplier.company_name,
      contact_person: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      alternate_phone: supplier.alternate_phone,
      tax_id: supplier.tax_id,
      address: supplier.address,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      postal_code: supplier.postal_code,
      website: supplier.website,
      payment_terms: supplier.payment_terms,
      credit_limit: parseFloat(supplier.credit_limit || 0),
      rating: parseFloat(supplier.rating || 0),
      status: supplier.status,
      notes: supplier.notes,
      products_count: parseInt(supplier.products_count || 0),
      active_products_count: parseInt(supplier.active_products_count || 0),
      created_by: supplier.created_by,
      created_by_name: supplier.created_by_name,
      updated_by: supplier.updated_by,
      updated_by_name: supplier.updated_by_name,
      deleted_by: supplier.deleted_by,
      deleted_by_name: supplier.deleted_by_name,
      created_at: supplier.created_at,
      updated_at: supplier.updated_at,
      deleted_at: supplier.deleted_at,
    };
  }

  /**
   * ✅ Obtener distribución de calificaciones
   * @returns {Promise<Array>} Distribución de calificaciones
   */
  static async getRatingDistribution() {
    const sql = `
      SELECT 
        rating,
        COUNT(*) as count
      FROM suppliers
      WHERE status = 'active'
      GROUP BY rating
      ORDER BY rating
    `;

    const results = await query(sql);

    // Crear distribución completa de 0 a 5
    const distribution = Array(6)
      .fill(0)
      .map((_, index) => ({
        rating: index,
        count: 0,
      }));

    results.forEach((item) => {
      const rating = Math.round(item.rating);
      if (rating >= 0 && rating <= 5) {
        distribution[rating].count = item.count;
      }
    });

    return distribution;
  }

  /**
   * ✅ Validar email
   * @param {string} email - Email a validar
   * @returns {boolean} True si es válido
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * ✅ Validar teléfono
   * @param {string} phone - Teléfono a validar
   * @returns {boolean} True si es válido
   */
  static isValidPhone(phone) {
    const phoneRegex = /^[\d\s\+\-\(\)]{8,20}$/;
    return phoneRegex.test(phone);
  }

  /**
   * ✅ Normalizar teléfono
   * @param {string} phone - Teléfono a normalizar
   * @returns {string} Teléfono normalizado
   */
  static normalizePhone(phone) {
    return phone.replace(/[^\d+]/g, "").trim();
  }

  /**
   * ✅ Normalizar website
   * @param {string} website - Website a normalizar
   * @returns {string} Website normalizado
   */
  static normalizeWebsite(website) {
    let normalized = website.trim().toLowerCase();
    if (
      !normalized.startsWith("http://") &&
      !normalized.startsWith("https://")
    ) {
      normalized = "https://" + normalized;
    }
    return normalized;
  }
}

module.exports = Supplier;
