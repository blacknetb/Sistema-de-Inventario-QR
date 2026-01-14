import { get, post, put, del, requestWithRetry, clearCache, downloadFile } from "./api";
import notificationService from "./notificationService";
import authService from "./authService";

// ✅ MEJORA: Sistema de cache para usuarios
const createUserCache = () => {
  const cache = new Map();
  const roleCache = new Map(); // Cache por roles
  const permissionsCache = new Map(); // Cache de permisos

  return {
    get: (key) => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data;
      }
      cache.delete(key);
      return null;
    },

    set: (key, data, ttl = 10 * 60 * 1000) => {
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
        roleCache.clear();
        permissionsCache.clear();
      }
    },

    clearByUserId: (userId) => {
      for (const key of cache.keys()) {
        if (
          key.includes(`user_${userId}`) ||
          key.includes("users_")
        ) {
          cache.delete(key);
        }
      }
      roleCache.clear();
      permissionsCache.clear();
    },
  };
};

const userCache = createUserCache();

// ✅ MEJORA: Validación de datos de usuario
const validateUserData = (userData, isUpdate = false) => {
  const errors = [];
  const warnings = [];

  if (!isUpdate || userData.name !== undefined) {
    if (!userData.name || userData.name.trim().length < 2) {
      errors.push("El nombre debe tener al menos 2 caracteres");
    } else if (userData.name.length > 100) {
      warnings.push("El nombre es muy largo (máximo 100 caracteres)");
    }
  }

  if (!isUpdate || userData.email !== undefined) {
    if (!userData.email || userData.email.trim().length === 0) {
      errors.push("El email es obligatorio");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        errors.push("Email no válido");
      }
    }
  }

  // Solo validar contraseña en creación o cambio
  if (userData.password !== undefined && !isUpdate) {
    if (userData.password.length < 6) {
      errors.push("La contraseña debe tener al menos 6 caracteres");
    } else if (userData.password.length > 100) {
      warnings.push("La contraseña es muy larga");
    }
  }

  if (userData.role !== undefined) {
    const validRoles = ["admin", "manager", "operator", "viewer"];
    if (!validRoles.includes(userData.role.toLowerCase())) {
      errors.push(`Rol no válido. Use: ${validRoles.join(", ")}`);
    }
  }

  // Validar teléfono si se proporciona
  if (userData.phone && userData.phone.length > 20) {
    warnings.push("El teléfono es muy largo");
  }

  // Validar departamento si se proporciona
  if (userData.department && userData.department.length > 100) {
    warnings.push("El departamento es muy largo");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * ✅ SERVICIO DE USUARIOS COMPLETO
 */
export const userService = {
  /**
   * Obtener todos los usuarios
   */
  getAll: async (params = {}, useCache = true) => {
    try {
      const cacheKey = `users_all_${JSON.stringify(params)}`;

      if (useCache) {
        const cached = userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/users", params);

      if (useCache && response.success) {
        userCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener usuario por ID
   */
  getById: async (id, useCache = true) => {
    try {
      const cacheKey = `user_${id}`;

      if (useCache) {
        const cached = userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(`/users/${id}`);

      if (useCache && response.success) {
        userCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crear usuario
   */
  create: async (userData) => {
    try {
      // Validar datos
      const validation = validateUserData(userData, false);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Mostrar warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const response = await post("/users", userData);

      if (response.success) {
        // Limpiar cache
        userCache.clear();
        clearCache("users");

        notificationService.success("Usuario creado exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar usuario
   */
  update: async (id, userData) => {
    try {
      // Validar datos
      const validation = validateUserData(userData, true);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Mostrar warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const response = await put(`/users/${id}`, userData);

      if (response.success) {
        // Limpiar cache
        userCache.delete(`user_${id}`);
        userCache.clear();

        // Si es el usuario actual, actualizar en auth
        const currentUser = authService.getCurrentUser();
        if (currentUser && currentUser.id === id) {
          authService.getProfile(true);
        }

        notificationService.success("Usuario actualizado exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar usuario
   */
  delete: async (id, confirm = true) => {
    try {
      // No permitir eliminar al propio usuario
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id === id) {
        throw new Error("No puedes eliminar tu propia cuenta");
      }

      // Confirmación opcional
      if (confirm) {
        const confirmed = await notificationService.confirm(
          "¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer."
        );

        if (!confirmed) {
          return { success: false, message: "Operación cancelada" };
        }
      }

      const response = await del(`/users/${id}`);

      if (response.success) {
        // Limpiar cache
        userCache.delete(`user_${id}`);
        userCache.clear();
        clearCache("users");

        notificationService.success("Usuario eliminado exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener usuarios por rol
   */
  getByRole: async (role, params = {}, useCache = true) => {
    try {
      const cacheKey = `users_role_${role}_${JSON.stringify(params)}`;

      if (useCache) {
        const cached = userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/users", { ...params, role });

      if (useCache && response.success) {
        userCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Buscar usuarios
   */
  search: async (term, params = {}, useCache = false) => {
    if (!term || term.trim().length === 0) {
      return await this.getAll(params, useCache);
    }

    const cacheKey = `users_search_${term}_${JSON.stringify(params)}`;

    try {
      if (useCache) {
        const cached = userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/users", { ...params, search: term });

      if (useCache && response.success) {
        userCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Activar/desactivar usuario
   */
  toggleActive: async (id, active) => {
    try {
      const response = await put(`/users/${id}/status`, { active });

      if (response.success) {
        // Limpiar cache
        userCache.delete(`user_${id}`);
        userCache.clear();

        const status = active ? "activado" : "desactivado";
        notificationService.success(`Usuario ${status} exitosamente`);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Resetear contraseña de usuario
   */
  resetPassword: async (id, newPassword, confirmPassword) => {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error("La nueva contraseña debe tener al menos 6 caracteres");
      }

      if (newPassword !== confirmPassword) {
        throw new Error("Las contraseñas no coinciden");
      }

      const response = await put(`/users/${id}/reset-password`, {
        new_password: newPassword,
      });

      if (response.success) {
        notificationService.success("Contraseña restablecida exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener estadísticas de usuarios
   */
  getStats: async (useCache = true) => {
    try {
      const cacheKey = "users_stats";

      if (useCache) {
        const cached = userCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      // Intentar endpoint específico
      try {
        const response = await get("/users/stats");

        if (useCache && response.success) {
          userCache.set(cacheKey, response, 5 * 60 * 1000);
        }

        return response;
      } catch (error) {
        // Si no hay endpoint, calcular desde lista de usuarios
        const allUsers = await this.getAll({}, true);

        if (allUsers.success && allUsers.data && Array.isArray(allUsers.data)) {
          const users = allUsers.data;

          const stats = {
            total: users.length,
            byRole: {},
            active: 0,
            inactive: 0,
            last30Days: 0,
            byDepartment: {},
          };

          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

          users.forEach((user) => {
            // Por rol
            const role = user.role || "unknown";
            stats.byRole[role] = (stats.byRole[role] || 0) + 1;

            // Por estado
            if (user.active === false) {
              stats.inactive++;
            } else {
              stats.active++;
            }

            // Por departamento
            if (user.department) {
              stats.byDepartment[user.department] =
                (stats.byDepartment[user.department] || 0) + 1;
            }

            // Últimos 30 días
            if (user.created_at) {
              const createdDate = new Date(user.created_at);
              if (createdDate >= thirtyDaysAgo) {
                stats.last30Days++;
              }
            }
          });

          const response = {
            success: true,
            data: stats,
            calculated: true,
          };

          if (useCache) {
            userCache.set(cacheKey, response, 5 * 60 * 1000);
          }

          return response;
        }

        return allUsers;
      }
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener actividades recientes del usuario
   */
  getRecentActivity: async (userId, limit = 10) => {
    try {
      const cacheKey = `user_${userId}_activity_${limit}`;
      const cached = userCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await get(`/users/${userId}/activity`, { limit });

      if (response.success) {
        userCache.set(cacheKey, response, 2 * 60 * 1000);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verificar permisos de usuario
   */
  checkPermissions: async (userId, permissions = []) => {
    try {
      const cacheKey = `user_${userId}_permissions_${permissions.sort().join("_")}`;
      const cached = userCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const response = await post(`/users/${userId}/check-permissions`, {
        permissions,
      });

      if (response.success) {
        userCache.set(cacheKey, response, 15 * 60 * 1000);
      }

      return response;
    } catch (error) {
      // Si el endpoint no existe, verificar por rol
      const userResponse = await this.getById(userId, true);
      if (userResponse.success && userResponse.data) {
        const user = userResponse.data;

        // Permisos basados en rol (simplificado)
        const rolePermissions = {
          admin: [
            "users.create",
            "users.update",
            "users.delete",
            "products.create",
            "products.update",
            "products.delete",
            "categories.manage",
            "inventory.manage",
            "reports.view",
            "settings.manage",
          ],
          manager: [
            "products.create",
            "products.update",
            "inventory.manage",
            "reports.view",
            "categories.view",
          ],
          operator: [
            "products.view",
            "inventory.update",
            "qr.scan",
            "inventory.history.view",
          ],
          viewer: [
            "products.view",
            "inventory.view",
            "categories.view",
            "reports.view",
          ],
        };

        const userPermissions = rolePermissions[user.role] || [];
        const hasPermissions = permissions.every((permission) =>
          userPermissions.includes(permission)
        );

        const result = {
          success: true,
          data: {
            hasAllPermissions: hasPermissions,
            missingPermissions: permissions.filter(
              (permission) => !userPermissions.includes(permission)
            ),
            userPermissions,
          },
          calculated: true,
        };

        userCache.set(cacheKey, result, 15 * 60 * 1000);
        return result;
      }

      throw error;
    }
  },

  /**
   * Asignar roles a usuario
   */
  assignRole: async (userId, role) => {
    try {
      const validRoles = ["admin", "manager", "operator", "viewer"];
      if (!validRoles.includes(role.toLowerCase())) {
        throw new Error(`Rol no válido. Use: ${validRoles.join(", ")}`);
      }

      // No permitir cambiar el rol del propio usuario
      const currentUser = authService.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        throw new Error("No puedes cambiar tu propio rol");
      }

      const response = await put(`/users/${userId}/role`, { role });

      if (response.success) {
        // Limpiar cache
        userCache.delete(`user_${userId}`);
        userCache.clear();
        clearCache("users");

        notificationService.success(`Rol asignado exitosamente: ${role}`);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener perfil de usuario actual
   */
  getCurrentProfile: async (forceRefresh = false) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error("No autenticado");
      }

      return await this.getById(currentUser.id, !forceRefresh);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar perfil de usuario actual
   */
  updateCurrentProfile: async (userData) => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) {
        throw new Error("No autenticado");
      }

      return await this.update(currentUser.id, userData);
    } catch (error) {
      throw error;
    }
  },

  /**
   * Cambiar avatar de usuario
   */
  updateAvatar: async (userId, file) => {
    try {
      // Validar archivo
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        throw new Error(
          "Tipo de archivo no permitido. Solo imágenes JPEG, PNG o GIF"
        );
      }

      // Tamaño máximo: 5MB
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error(
          `La imagen es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`
        );
      }

      const formData = new FormData();
      formData.append("avatar", file);

      notificationService.loading("Subiendo avatar...");

      try {
        const response = await post(`/users/${userId}/avatar`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.success) {
          // Limpiar cache
          userCache.delete(`user_${userId}`);
          userCache.clear();

          // Si es el usuario actual, actualizar en auth
          const currentUser = authService.getCurrentUser();
          if (currentUser && currentUser.id === userId) {
            authService.getProfile(true);
          }

          notificationService.success("Avatar actualizado exitosamente");
        }

        return response;
      } finally {
        notificationService.dismissLoading();
      }
    } catch (error) {
      notificationService.dismissLoading();
      throw error;
    }
  },

  /**
   * Validar usuario
   */
  validateUser: (userData) => {
    return validateUserData(userData, false);
  },

  /**
   * ✅ MEJORA: Verificar si el email está disponible
   */
  checkEmailAvailability: async (email, excludeUserId = null) => {
    try {
      if (!email || email.trim().length === 0) {
        throw new Error("Email requerido");
      }

      const params = { email };
      if (excludeUserId) {
        params.exclude_id = excludeUserId;
      }

      const response = await get("/users/check-email", params);

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * ✅ MEJORA: Exportar lista de usuarios
   */
  exportUsers: async (format = "csv", params = {}) => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const filename = `usuarios_${date}.${format}`;

      await downloadFile("/users/export", filename, {
        params: { format, ...params },
      });

      return {
        success: true,
        message: "Usuarios exportados exitosamente",
        filename,
        format,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * ✅ MEJORA: Importar usuarios desde archivo
   */
  importUsers: async (file, options = {}) => {
    try {
      // Validar archivo
      if (!file) {
        throw new Error("No se seleccionó archivo");
      }

      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/json",
      ];

      if (!validTypes.includes(file.type)) {
        throw new Error(
          "Tipo de archivo no permitido. Use CSV, Excel o JSON"
        );
      }

      notificationService.loading("Importando usuarios...");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("options", JSON.stringify(options));

        const response = await post("/users/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.success) {
          // Limpiar cache
          userCache.clear();
          clearCache("users");

          notificationService.success(
            `Usuarios importados exitosamente: ${response.data?.imported || 0} registros`
          );
        }

        return response;
      } finally {
        notificationService.dismissLoading();
      }
    } catch (error) {
      notificationService.dismissLoading();
      throw error;
    }
  },

  /**
   * Limpiar cache
   */
  clearCache: () => {
    userCache.clear();
    clearCache("users");
  },
};

export default userService;