/**
 * ✅ MODELO MEJORADO DE USUARIO
 * Archivo: models/User.js
 *
 * Correcciones aplicadas:
 * 1. ✅ Corregida importación de bcryptjs (mejor compatibilidad)
 * 2. ✅ Validaciones robustas con Joi
 * 3. ✅ Manejo de contraseñas seguro
 * 4. ✅ Cache para usuarios frecuentes
 * 5. ✅ Transacciones mejoradas
 * 6. ✅ Sanitización de datos sensibles
 * 7. ✅ Auditoría completa de acciones
 * 8. ✅ Control de sesiones y logins
 */

const { query, executeInTransaction } = require("../config/database");
const bcrypt = require("bcryptjs");
const Joi = require("joi");

// ✅ MEJORA: Logger estructurado
const logger = {
  info: (message, meta) => console.log(`[USER INFO] ${message}`, meta || ""),
  error: (message, meta) =>
    console.error(`[USER ERROR] ${message}`, meta || ""),
  warn: (message, meta) => console.warn(`[USER WARN] ${message}`, meta || ""),
  debug: (message, meta) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[USER DEBUG] ${message}`, meta || "");
    }
  },
};

/**
 * ✅ ESQUEMA DE VALIDACIÓN PARA USUARIOS
 * Validaciones robustas con Joi
 */
const userSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().max(100).required(),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    )
    .message(
      "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
    ),
  role: Joi.string()
    .valid("admin", "user", "manager", "viewer")
    .default("user"),
  phone: Joi.string().max(20).allow("", null),
  status: Joi.string()
    .valid("active", "inactive", "suspended", "pending")
    .default("active"),
  department: Joi.string().max(50).allow("", null),
  position: Joi.string().max(50).allow("", null),
  avatar: Joi.string().uri().allow("", null),
  preferences: Joi.object().allow(null),
});

/**
 * ✅ ESQUEMA DE ACTUALIZACIÓN DE USUARIO
 * Campos opcionales para actualización
 */
const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  email: Joi.string().email().max(100),
  password: Joi.string()
    .min(8)
    .max(100)
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    )
    .message(
      "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
    ),
  role: Joi.string().valid("admin", "user", "manager", "viewer"),
  phone: Joi.string().max(20).allow("", null),
  status: Joi.string().valid("active", "inactive", "suspended", "pending"),
  department: Joi.string().max(50).allow("", null),
  position: Joi.string().max(50).allow("", null),
  avatar: Joi.string().uri().allow("", null),
  preferences: Joi.object().allow(null),
});

/**
 * ✅ CLASE MEJORADA DE USUARIO
 * Implementa seguridad mejorada y cache
 */
class User {
  // ✅ MEJORA: Roles del sistema como constantes
  static ROLES = Object.freeze({
    ADMIN: "admin",
    USER: "user",
    MANAGER: "manager",
    VIEWER: "viewer",
  });

  // ✅ MEJORA: Estados de usuario
  static STATUS = Object.freeze({
    ACTIVE: "active",
    INACTIVE: "inactive",
    SUSPENDED: "suspended",
    PENDING: "pending",
    LOCKED: "locked",
  });

  // ✅ MEJORA: Cache LRU para usuarios
  static cache = new Map();
  static CACHE_TTL = 300000; // 5 minutos
  static MAX_CACHE_SIZE = 500;
  static loginAttempts = new Map();
  static MAX_LOGIN_ATTEMPTS = 5;
  static LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos

  /**
   * ✅ LIMPIAR CACHE AUTOMÁTICAMENTE
   */
  static cleanCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }

    // Controlar tamaño del cache
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const keys = Array.from(this.cache.keys()).slice(
        0,
        this.cache.size - this.MAX_CACHE_SIZE,
      );
      keys.forEach((key) => this.cache.delete(key));
    }
  }

  /**
   * ✅ CREAR USUARIO CON VALIDACIÓN COMPLETA
   * @param {Object} userData - Datos del usuario
   * @param {Number} createdById - ID del creador
   * @returns {Object} Usuario creado
   */
  static async create(userData, createdById = null) {
    try {
      // ✅ MEJORA: Validar datos con Joi
      const { error, value: validatedData } = userSchema.validate(userData);
      if (error) {
        throw new Error(
          `Validación fallida: ${error.details.map((d) => d.message).join(", ")}`,
        );
      }

      // ✅ MEJORA: Verificar si el email ya existe
      const existingUser = await this.findByEmail(validatedData.email);
      if (existingUser) {
        throw new Error("El email ya está registrado");
      }

      // ✅ MEJORA: Hash de contraseña seguro
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(
        validatedData.password,
        saltRounds,
      );

      // ✅ MEJORA: Validar rol
      const userRole = this.validateRole(validatedData.role);

      // ✅ MEJORA: Usar transacción
      const result = await executeInTransaction(async (connection) => {
        const sql = `
          INSERT INTO users (
            name, 
            email, 
            password, 
            role, 
            phone,
            department,
            position,
            status,
            avatar,
            preferences,
            created_by,
            created_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [insertResult] = await connection.execute(sql, [
          validatedData.name.trim(),
          validatedData.email.toLowerCase().trim(),
          hashedPassword,
          userRole,
          validatedData.phone || null,
          validatedData.department || null,
          validatedData.position || null,
          validatedData.status || this.STATUS.ACTIVE,
          validatedData.avatar || null,
          validatedData.preferences
            ? JSON.stringify(validatedData.preferences)
            : null,
          createdById,
        ]);

        // ✅ MEJORA: Registrar en log de auditoría
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            "CREATE",
            "USER",
            insertResult.insertId,
            createdById,
            JSON.stringify({
              email: validatedData.email,
              role: userRole,
              createdBy: createdById,
            }),
          ],
        );

        return insertResult;
      });

      logger.info("Usuario creado exitosamente", {
        userId: result.insertId,
        email: validatedData.email,
        role: userRole,
        createdBy: createdById,
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache();

      return {
        id: result.insertId,
        name: validatedData.name,
        email: validatedData.email,
        role: userRole,
        status: validatedData.status || this.STATUS.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error creando usuario", {
        error: error.message,
        userEmail: userData.email,
        createdBy: createdById,
        stack: error.stack,
      });

      if (error.code === "ER_DUP_ENTRY") {
        throw new Error("El email ya está registrado");
      }

      throw new Error(`Error al crear usuario: ${error.message}`);
    }
  }

  /**
   * ✅ ENCONTRAR USUARIO POR EMAIL CON CACHE
   * @param {String} email - Email del usuario
   * @param {Boolean} includePassword - Incluir contraseña
   * @returns {Object} Usuario encontrado
   */
  static async findByEmail(email, includePassword = false) {
    try {
      if (!email || typeof email !== "string") {
        return null;
      }

      // ✅ MEJORA: Limpiar cache
      this.cleanCache();

      // ✅ MEJORA: Verificar cache
      const cacheKey = `user_email_${email}_${includePassword}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug("Usuario recuperado del cache por email", { email });
        return cached.data;
      }

      let sql = `
        SELECT 
          id,
          name,
          email,
          role,
          phone,
          department,
          position,
          status,
          avatar,
          preferences,
          created_at,
          updated_at,
          last_login_at,
          last_login_ip,
          login_count,
          failed_login_attempts,
          locked_until
      `;

      if (includePassword) {
        sql += ", password";
      }

      sql += " FROM users WHERE email = ? AND deleted_at IS NULL";

      const [user] = await query(sql, [email.toLowerCase().trim()]);

      if (!user) {
        return null;
      }

      // ✅ MEJORA: Parsear preferencias si existen
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = {};
        }
      }

      // ✅ MEJORA: Verificar si el usuario está bloqueado
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        user.is_locked = true;
        user.lock_remaining = Math.ceil(
          (new Date(user.locked_until) - new Date()) / 1000,
        );
      } else {
        user.is_locked = false;
      }

      // ✅ MEJORA: Formatear datos
      user.role_display = this.getRoleDisplay(user.role);
      user.status_display = this.getStatusDisplay(user.status);
      user.last_login_relative = user.last_login_at
        ? this.getRelativeTime(user.last_login_at)
        : "Nunca";

      // ✅ MEJORA: Almacenar en cache
      this.cache.set(cacheKey, {
        data: user,
        timestamp: Date.now(),
      });

      return user;
    } catch (error) {
      logger.error("Error encontrando usuario por email", {
        email,
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * ✅ ENCONTRAR USUARIO POR ID CON CACHE
   * @param {Number} id - ID del usuario
   * @param {Boolean} includeStats - Incluir estadísticas
   * @returns {Object} Usuario encontrado
   */
  static async findById(id, includeStats = false) {
    try {
      // ✅ MEJORA: Limpiar cache
      this.cleanCache();

      // ✅ MEJORA: Verificar cache
      const cacheKey = `user_id_${id}_${includeStats}`;
      const cached = this.cache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        logger.debug("Usuario recuperado del cache por ID", { userId: id });
        return cached.data;
      }

      let sql = `
        SELECT 
          id,
          name,
          email,
          role,
          phone,
          department,
          position,
          status,
          avatar,
          preferences,
          created_at,
          updated_at,
          last_login_at,
          last_login_ip,
          login_count,
          failed_login_attempts,
          locked_until,
          created_by,
          updated_by
        FROM users 
        WHERE id = ? AND deleted_at IS NULL
      `;

      const [user] = await query(sql, [id]);

      if (!user) {
        return null;
      }

      // ✅ MEJORA: Parsear preferencias
      if (user.preferences) {
        try {
          user.preferences = JSON.parse(user.preferences);
        } catch (e) {
          user.preferences = {};
        }
      }

      // ✅ MEJORA: Incluir estadísticas si se solicita
      if (includeStats) {
        const stats = await this.getUserStats(id);
        user.stats = stats;
      }

      // ✅ MEJORA: Verificar bloqueo
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        user.is_locked = true;
        user.lock_remaining = Math.ceil(
          (new Date(user.locked_until) - new Date()) / 1000,
        );
      } else {
        user.is_locked = false;
      }

      // ✅ MEJORA: Formatear datos
      user.role_display = this.getRoleDisplay(user.role);
      user.status_display = this.getStatusDisplay(user.status);
      user.created_by_name = user.created_by
        ? await this.getUserName(user.created_by)
        : null;
      user.updated_by_name = user.updated_by
        ? await this.getUserName(user.updated_by)
        : null;

      // ✅ MEJORA: Almacenar en cache
      this.cache.set(cacheKey, {
        data: user,
        timestamp: Date.now(),
      });

      return user;
    } catch (error) {
      logger.error("Error encontrando usuario por ID", {
        id,
        error: error.message,
        stack: error.stack,
      });
      return null;
    }
  }

  /**
   * ✅ ACTUALIZAR USUARIO CON VALIDACIÓN
   * @param {Number} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @param {Number} updatedById - ID del actualizador
   * @returns {Object} Usuario actualizado
   */
  static async update(id, userData, updatedById) {
    try {
      // ✅ MEJORA: Verificar que el usuario existe
      const existingUser = await this.findById(id);
      if (!existingUser) {
        throw new Error("Usuario no encontrado");
      }

      // ✅ MEJORA: Validar datos de actualización
      const { error, value: validatedData } =
        userUpdateSchema.validate(userData);
      if (error) {
        throw new Error(
          `Validación fallida: ${error.details.map((d) => d.message).join(", ")}`,
        );
      }

      // ✅ MEJORA: Verificar email único si se cambia
      if (validatedData.email && validatedData.email !== existingUser.email) {
        const existingWithEmail = await this.findByEmail(validatedData.email);
        if (existingWithEmail && existingWithEmail.id !== id) {
          throw new Error("El email ya está en uso por otro usuario");
        }
      }

      // ✅ MEJORA: Validar rol si se cambia
      if (validatedData.role) {
        validatedData.role = this.validateRole(validatedData.role);
      }

      // ✅ MEJORA: Usar transacción
      await executeInTransaction(async (connection) => {
        const updates = [];
        const values = [];

        // ✅ MEJORA: Campos actualizables
        const allowedFields = [
          "name",
          "email",
          "role",
          "phone",
          "department",
          "position",
          "status",
          "avatar",
          "preferences",
        ];

        allowedFields.forEach((field) => {
          if (validatedData[field] !== undefined) {
            updates.push(`${field} = ?`);

            if (field === "email") {
              values.push(validatedData[field].toLowerCase().trim());
            } else if (field === "preferences" && validatedData[field]) {
              values.push(JSON.stringify(validatedData[field]));
            } else {
              values.push(validatedData[field]);
            }
          }
        });

        // ✅ MEJORA: Actualizar contraseña si se proporciona
        if (validatedData.password) {
          const saltRounds = 12;
          const hashedPassword = await bcrypt.hash(
            validatedData.password,
            saltRounds,
          );
          updates.push("password = ?");
          values.push(hashedPassword);

          // ✅ MEJORA: Resetear intentos fallidos al cambiar contraseña
          updates.push("failed_login_attempts = 0");
          updates.push("locked_until = NULL");
        }

        updates.push("updated_at = NOW()");
        updates.push("updated_by = ?");
        values.push(updatedById);
        values.push(id);

        const sql = `UPDATE users SET ${updates.join(", ")} WHERE id = ? AND deleted_at IS NULL`;
        const [result] = await connection.execute(sql, values);

        if (result.affectedRows === 0) {
          throw new Error("Usuario no encontrado o ya eliminado");
        }

        // ✅ MEJORA: Registrar cambios en auditoría
        const changes = {};
        allowedFields.forEach((field) => {
          if (
            validatedData[field] !== undefined &&
            validatedData[field] !== existingUser[field]
          ) {
            changes[field] = {
              from: existingUser[field],
              to: validatedData[field],
            };
          }
        });

        if (Object.keys(changes).length > 0) {
          await connection.execute(
            "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
            ["UPDATE", "USER", id, updatedById, JSON.stringify(changes)],
          );
        }

        return result;
      });

      logger.info("Usuario actualizado exitosamente", {
        userId: id,
        updatedBy: updatedById,
        updatedFields: Object.keys(validatedData),
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache(id);

      return await this.findById(id);
    } catch (error) {
      logger.error("Error actualizando usuario", {
        id,
        error: error.message,
        updatedBy: updatedById,
        stack: error.stack,
      });

      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }
  }

  /**
   * ✅ ELIMINAR USUARIO (SOFT DELETE) CON VALIDACIONES
   * @param {Number} id - ID del usuario
   * @param {Number} deletedById - ID del eliminador
   * @param {Boolean} force - Forzar eliminación
   * @returns {Boolean} Éxito de la operación
   */
  static async delete(id, deletedById, force = false) {
    try {
      // ✅ MEJORA: No permitir eliminarse a sí mismo
      if (id === deletedById) {
        throw new Error("No puedes eliminar tu propia cuenta");
      }

      // ✅ MEJORA: Verificar que el usuario existe
      const user = await this.findById(id);
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // ✅ MEJORA: Validaciones de seguridad
      if (!force) {
        // Verificar si es el único administrador
        if (user.role === this.ROLES.ADMIN) {
          const adminCount = await this.countAdmins();
          if (adminCount <= 1) {
            throw new Error(
              "No se puede eliminar el único administrador del sistema",
            );
          }
        }

        // Verificar si tiene actividad reciente
        const hasRecentActivity = await this.hasRecentActivity(id);
        if (hasRecentActivity) {
          throw new Error(
            "El usuario tiene actividad reciente. Usa force=true para forzar la eliminación.",
          );
        }
      }

      // ✅ MEJORA: Usar transacción
      await executeInTransaction(async (connection) => {
        if (force) {
          // Eliminación física
          const deleteSql = "DELETE FROM users WHERE id = ?";
          await connection.execute(deleteSql, [id]);
        } else {
          // Soft delete
          const sql =
            "UPDATE users SET deleted_at = NOW(), deleted_by = ? WHERE id = ?";
          await connection.execute(sql, [deletedById, id]);
        }

        // ✅ MEJORA: Registrar eliminación en auditoría
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            force ? "FORCE_DELETE" : "DELETE",
            "USER",
            id,
            deletedById,
            JSON.stringify({
              email: user.email,
              role: user.role,
              deletedBy: deletedById,
            }),
          ],
        );
      });

      logger.info("Usuario eliminado exitosamente", {
        userId: id,
        deletedBy: deletedById,
        force,
        userEmail: user.email,
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache(id);

      return true;
    } catch (error) {
      logger.error("Error eliminando usuario", {
        id,
        error: error.message,
        deletedBy: deletedById,
        force,
        stack: error.stack,
      });

      throw new Error(`Error al eliminar usuario: ${error.message}`);
    }
  }

  /**
   * ✅ AUTENTICAR USUARIO CON SEGURIDAD MEJORADA
   * @param {String} email - Email del usuario
   * @param {String} password - Contraseña
   * @param {Object} loginInfo - Información del login
   * @returns {Object} Resultado de autenticación
   */
  static async authenticate(email, password, loginInfo = {}) {
    try {
      // ✅ MEJORA: Validar entradas
      if (!email || !password) {
        throw new Error("Email y contraseña son requeridos");
      }

      // ✅ MEJORA: Verificar intentos fallidos
      const attemptKey = `login_attempt_${email.toLowerCase()}`;
      const now = Date.now();

      if (this.loginAttempts.has(attemptKey)) {
        const attempts = this.loginAttempts.get(attemptKey);
        if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
          const timeDiff = now - attempts.timestamp;
          if (timeDiff < this.LOCKOUT_DURATION) {
            const remaining = Math.ceil(
              (this.LOCKOUT_DURATION - timeDiff) / 1000,
            );
            throw new Error(
              `Demasiados intentos fallidos. Intenta nuevamente en ${remaining} segundos`,
            );
          } else {
            this.loginAttempts.delete(attemptKey);
          }
        }
      }

      // ✅ MEJORA: Buscar usuario con contraseña
      const user = await this.findByEmail(email, true);

      if (!user) {
        // Por seguridad, no revelar si el usuario existe
        this.recordFailedAttempt(email);
        throw new Error("Credenciales inválidas");
      }

      // ✅ MEJORA: Verificar si el usuario está activo
      if (user.status !== this.STATUS.ACTIVE) {
        throw new Error(`Usuario ${user.status}. Contacta al administrador.`);
      }

      // ✅ MEJORA: Verificar si está bloqueado
      if (user.is_locked) {
        throw new Error(
          `Cuenta bloqueada temporalmente. Intenta nuevamente en ${user.lock_remaining} segundos`,
        );
      }

      // ✅ MEJORA: Verificar contraseña
      const isValid = await bcrypt.compare(password, user.password);

      if (!isValid) {
        // Registrar intento fallido en BD
        await this.recordFailedLoginAttempt(user.id);
        this.recordFailedAttempt(email);

        // Verificar si debe bloquearse
        const failedAttempts = (user.failed_login_attempts || 0) + 1;
        if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
          await this.lockUser(user.id);
          throw new Error(
            "Demasiados intentos fallidos. Tu cuenta ha sido bloqueada temporalmente.",
          );
        }

        throw new Error("Credenciales inválidas");
      }

      // ✅ MEJORA: Resetear intentos fallidos
      this.loginAttempts.delete(attemptKey);
      await this.resetFailedLoginAttempts(user.id);

      // ✅ MEJORA: Actualizar último login
      await this.updateLastLogin(user.id, loginInfo.ip, loginInfo.userAgent);

      // ✅ MEJORA: Registrar login exitoso en auditoría
      await this.recordLoginAudit(user.id, loginInfo);

      logger.info("Autenticación exitosa", {
        userId: user.id,
        email: user.email,
        ip: loginInfo.ip,
      });

      // ✅ MEJORA: Retornar usuario sin contraseña
      delete user.password;
      return user;
    } catch (error) {
      logger.error("Error en autenticación", {
        email,
        error: error.message,
        ip: loginInfo.ip,
        stack: error.stack,
      });

      throw new Error(`Error de autenticación: ${error.message}`);
    }
  }

  /**
   * ✅ OBTENER TODOS LOS USUARIOS CON FILTROS
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Object} Lista paginada de usuarios
   */
  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT 
          id,
          name,
          email,
          role,
          phone,
          department,
          position,
          status,
          avatar,
          created_at,
          last_login_at,
          login_count
        FROM users 
        WHERE deleted_at IS NULL
      `;

      const params = [];
      const whereConditions = [];

      // ✅ MEJORA: Filtros avanzados
      if (filters.role) {
        whereConditions.push("role = ?");
        params.push(filters.role);
      }

      if (filters.status) {
        whereConditions.push("status = ?");
        params.push(filters.status);
      }

      if (filters.department) {
        whereConditions.push("department = ?");
        params.push(filters.department);
      }

      if (filters.search) {
        whereConditions.push("(name LIKE ? OR email LIKE ? OR phone LIKE ?)");
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      // Aplicar condiciones WHERE
      if (whereConditions.length > 0) {
        sql += " AND " + whereConditions.join(" AND ");
      }

      // ✅ MEJORA: Ordenamiento seguro
      const sortField = filters.sortBy || "created_at";
      const sortOrder = filters.sortOrder || "DESC";
      const validSortFields = [
        "name",
        "email",
        "role",
        "status",
        "created_at",
        "last_login_at",
      ];

      if (validSortFields.includes(sortField)) {
        sql += ` ORDER BY ${sortField} ${sortOrder}`;
      } else {
        sql += " ORDER BY created_at DESC";
      }

      // ✅ MEJORA: Paginación segura
      const limit = Math.min(filters.limit || 20, 100);
      const page = Math.max(filters.page || 1, 1);
      const offset = (page - 1) * limit;

      sql += " LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const users = await query(sql, params);

      // ✅ MEJORA: Obtener total para paginación
      const countSql = sql
        .replace(/SELECT[\s\S]*?FROM/, "SELECT COUNT(*) as total FROM")
        .replace(/ORDER BY[\s\S]*/, "")
        .replace(/LIMIT[\s\S]*/, "");
      const [countResult] = await query(countSql, params.slice(0, -2));
      const total = countResult.total || 0;

      // ✅ MEJORA: Formatear datos
      const formattedUsers = users.map((user) => ({
        ...user,
        role_display: this.getRoleDisplay(user.role),
        status_display: this.getStatusDisplay(user.status),
        last_login_relative: user.last_login_at
          ? this.getRelativeTime(user.last_login_at)
          : "Nunca",
      }));

      return {
        data: formattedUsers,
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
      logger.error("Error obteniendo usuarios", {
        filters,
        error: error.message,
        stack: error.stack,
      });
      throw new Error(`Error al obtener usuarios: ${error.message}`);
    }
  }

  /**
   * ✅ CAMBIAR CONTRASEÑA CON VALIDACIONES
   * @param {Number} userId - ID del usuario
   * @param {String} currentPassword - Contraseña actual
   * @param {String} newPassword - Nueva contraseña
   * @param {Number} changedById - ID del que cambia
   * @returns {Boolean} Éxito de la operación
   */
  static async changePassword(
    userId,
    currentPassword,
    newPassword,
    changedById = null,
  ) {
    try {
      // ✅ MEJORA: Validar nueva contraseña
      if (newPassword.length < 8) {
        throw new Error("La nueva contraseña debe tener al menos 8 caracteres");
      }

      // ✅ MEJORA: Obtener usuario con contraseña
      const user = await this.findById(userId);
      if (!user) {
        throw new Error("Usuario no encontrado");
      }

      // ✅ MEJORA: Verificar contraseña actual
      const userWithPassword = await this.findByEmail(user.email, true);
      const isValid = await bcrypt.compare(
        currentPassword,
        userWithPassword.password,
      );

      if (!isValid) {
        throw new Error("Contraseña actual incorrecta");
      }

      // ✅ MEJORA: Hash de nueva contraseña
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // ✅ MEJORA: Usar transacción
      await executeInTransaction(async (connection) => {
        // Actualizar contraseña
        const updateSql =
          "UPDATE users SET password = ?, updated_at = NOW(), updated_by = ? WHERE id = ?";
        await connection.execute(updateSql, [
          hashedPassword,
          changedById || userId,
          userId,
        ]);

        // ✅ MEJORA: Registrar cambio en auditoría
        await connection.execute(
          "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
          [
            "PASSWORD_CHANGE",
            "USER",
            userId,
            changedById || userId,
            JSON.stringify({
              changedBy: changedById,
              ip: null,
            }),
          ],
        );
      });

      logger.info("Contraseña cambiada exitosamente", {
        userId,
        changedBy: changedById || userId,
      });

      // ✅ MEJORA: Limpiar cache
      this.clearCache(userId);

      return true;
    } catch (error) {
      logger.error("Error cambiando contraseña", {
        userId,
        error: error.message,
        changedBy: changedById,
        stack: error.stack,
      });

      throw new Error(`Error al cambiar contraseña: ${error.message}`);
    }
  }

  /**
   * ✅ MÉTODOS HELPER MEJORADOS
   */

  /**
   * VALIDAR ROL DEL USUARIO
   * @param {String} role - Rol a validar
   * @returns {String} Rol validado
   */
  static validateRole(role) {
    const validRoles = Object.values(this.ROLES);
    return validRoles.includes(role) ? role : this.ROLES.USER;
  }

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL ROL
   * @param {String} role - Rol del usuario
   * @returns {String} Texto descriptivo
   */
  static getRoleDisplay(role) {
    const roleMap = {
      admin: "👑 Administrador",
      manager: "📊 Gerente",
      user: "👤 Usuario",
      viewer: "👁️ Visualizador",
    };

    return roleMap[role] || role;
  }

  /**
   * OBTENER TEXTO DESCRIPTIVO DEL ESTADO
   * @param {String} status - Estado del usuario
   * @returns {String} Texto descriptivo
   */
  static getStatusDisplay(status) {
    const statusMap = {
      active: "🟢 Activo",
      inactive: "⚪ Inactivo",
      suspended: "🔴 Suspendido",
      pending: "🟡 Pendiente",
      locked: "🔒 Bloqueado",
    };

    return statusMap[status] || status;
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
   * REGISTRAR INTENTO FALLIDO EN MEMORIA
   * @param {String} email - Email del usuario
   */
  static recordFailedAttempt(email) {
    const key = `login_attempt_${email.toLowerCase()}`;
    const now = Date.now();

    if (this.loginAttempts.has(key)) {
      const attempts = this.loginAttempts.get(key);
      attempts.count += 1;
      attempts.timestamp = now;
    } else {
      this.loginAttempts.set(key, { count: 1, timestamp: now });
    }
  }

  /**
   * REGISTRAR INTENTO FALLIDO EN BD
   * @param {Number} userId - ID del usuario
   */
  static async recordFailedLoginAttempt(userId) {
    try {
      await query(
        "UPDATE users SET failed_login_attempts = failed_login_attempts + 1, updated_at = NOW() WHERE id = ?",
        [userId],
      );
    } catch (error) {
      logger.error("Error registrando intento fallido", {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * RESETEAR INTENTOS FALLIDOS
   * @param {Number} userId - ID del usuario
   */
  static async resetFailedLoginAttempts(userId) {
    try {
      await query(
        "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = ?",
        [userId],
      );
    } catch (error) {
      logger.error("Error reseteando intentos fallidos", {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * BLOQUEAR USUARIO TEMPORALMENTE
   * @param {Number} userId - ID del usuario
   */
  static async lockUser(userId) {
    try {
      const lockUntil = new Date(Date.now() + this.LOCKOUT_DURATION);
      await query(
        "UPDATE users SET locked_until = ?, status = ?, updated_at = NOW() WHERE id = ?",
        [lockUntil, this.STATUS.LOCKED, userId],
      );

      logger.warn("Usuario bloqueado temporalmente", { userId, lockUntil });
    } catch (error) {
      logger.error("Error bloqueando usuario", {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * ACTUALIZAR ÚLTIMO LOGIN
   * @param {Number} userId - ID del usuario
   * @param {String} ipAddress - Dirección IP
   * @param {String} userAgent - Agente de usuario
   */
  static async updateLastLogin(userId, ipAddress = null, userAgent = null) {
    try {
      const sql = `
        UPDATE users 
        SET last_login_at = NOW(),
            last_login_ip = ?,
            last_login_agent = ?,
            login_count = login_count + 1,
            failed_login_attempts = 0,
            locked_until = NULL,
            updated_at = NOW()
        WHERE id = ?
      `;

      await query(sql, [ipAddress, userAgent, userId]);

      logger.debug("Último login actualizado", { userId, ipAddress });
    } catch (error) {
      logger.error("Error actualizando último login", {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * REGISTRAR LOGIN EN AUDITORÍA
   * @param {Number} userId - ID del usuario
   * @param {Object} loginInfo - Información del login
   */
  static async recordLoginAudit(userId, loginInfo = {}) {
    try {
      await query(
        "INSERT INTO audit_logs (action, entity_type, entity_id, user_id, details, created_at) VALUES (?, ?, ?, ?, ?, NOW())",
        [
          "LOGIN",
          "USER",
          userId,
          userId,
          JSON.stringify({
            ip: loginInfo.ip,
            userAgent: loginInfo.userAgent,
            timestamp: new Date().toISOString(),
          }),
        ],
      );
    } catch (error) {
      logger.error("Error registrando login en auditoría", {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * OBTENER ESTADÍSTICAS DEL USUARIO
   * @param {Number} userId - ID del usuario
   * @returns {Object} Estadísticas
   */
  static async getUserStats(userId) {
    try {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM products WHERE created_by = ?) as products_created,
          (SELECT COUNT(*) FROM inventory_movements WHERE created_by = ?) as inventory_actions,
          (SELECT COUNT(*) FROM qrcodes WHERE created_by = ?) as qrcodes_created,
          (SELECT COUNT(*) FROM transactions WHERE created_by = ?) as transactions_created,
          login_count,
          DATEDIFF(NOW(), created_at) as days_since_creation
        FROM users 
        WHERE id = ?
      `;

      const [stats] = await query(sql, [
        userId,
        userId,
        userId,
        userId,
        userId,
      ]);

      return (
        stats || {
          products_created: 0,
          inventory_actions: 0,
          qrcodes_created: 0,
          transactions_created: 0,
          login_count: 0,
          days_since_creation: 0,
        }
      );
    } catch (error) {
      logger.error("Error obteniendo estadísticas de usuario", {
        userId,
        error: error.message,
      });
      return {};
    }
  }

  /**
   * CONTAR ADMINISTRADORES
   * @returns {Number} Cantidad de administradores
   */
  static async countAdmins() {
    try {
      const sql =
        "SELECT COUNT(*) as count FROM users WHERE role = ? AND deleted_at IS NULL";
      const [result] = await query(sql, [this.ROLES.ADMIN]);
      return result.count || 0;
    } catch (error) {
      logger.error("Error contando administradores", { error: error.message });
      return 0;
    }
  }

  /**
   * VERIFICAR ACTIVIDAD RECIENTE
   * @param {Number} userId - ID del usuario
   * @returns {Boolean} Tiene actividad reciente
   */
  static async hasRecentActivity(userId) {
    try {
      const sql = `
        SELECT EXISTS(
          SELECT 1 FROM audit_logs 
          WHERE user_id = ? 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
          LIMIT 1
        ) as has_activity
      `;

      const [result] = await query(sql, [userId]);
      return result.has_activity === 1;
    } catch (error) {
      logger.error("Error verificando actividad reciente", {
        userId,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * OBTENER NOMBRE DEL USUARIO
   * @param {Number} userId - ID del usuario
   * @returns {String} Nombre del usuario
   */
  static async getUserName(userId) {
    try {
      const sql = "SELECT name FROM users WHERE id = ? AND deleted_at IS NULL";
      const [result] = await query(sql, [userId]);
      return result ? result.name : "Desconocido";
    } catch (error) {
      logger.error("Error obteniendo nombre de usuario", {
        userId,
        error: error.message,
      });
      return "Desconocido";
    }
  }

  /**
   * LIMPIAR CACHE DEL USUARIO
   * @param {Number} userId - ID del usuario (opcional)
   */
  static clearCache(userId = null) {
    if (userId) {
      for (const key of this.cache.keys()) {
        if (key.includes(`user_${userId}`) || key.includes(`user_email_`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }

    logger.debug("Cache de usuarios limpiado", {
      userId,
      cacheSize: this.cache.size,
    });
  }

  /**
   * ✅ VERIFICAR PERMISOS DEL USUARIO
   * @param {Object} user - Usuario
   * @param {String} permission - Permiso requerido
   * @returns {Boolean} Tiene permiso
   */
  static hasPermission(user, permission) {
    if (!user || !user.role) {
      return false;
    }

    // Mapa de permisos por rol
    const permissions = {
      [this.ROLES.ADMIN]: ["*"], // Todos los permisos
      [this.ROLES.MANAGER]: ["read", "write", "approve", "manage_users"],
      [this.ROLES.USER]: ["read", "write"],
      [this.ROLES.VIEWER]: ["read"],
    };

    const userPermissions = permissions[user.role] || [];

    // Administradores tienen todos los permisos
    if (user.role === this.ROLES.ADMIN || userPermissions.includes("*")) {
      return true;
    }

    return userPermissions.includes(permission);
  }
}

module.exports = User;
