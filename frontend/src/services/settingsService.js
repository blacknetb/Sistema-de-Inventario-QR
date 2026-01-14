import { get, post, put, del, requestWithRetry, clearCache, downloadFile } from "./api";
import notificationService from "./notificationService";

// ✅ MEJORA: Sistema de cache para configuraciones
const createSettingsCache = () => {
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

    set: (key, data, ttl = 30 * 60 * 1000) => {
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

const settingsCache = createSettingsCache();

// ✅ MEJORA: Validación de configuraciones
const validateSetting = (key, value, settingType) => {
  const errors = [];
  const warnings = [];

  if (!key || key.trim().length === 0) {
    errors.push("La clave de configuración es requerida");
  }

  if (key.length > 100) {
    warnings.push("La clave de configuración es muy larga");
  }

  // Validaciones por tipo
  switch (settingType) {
    case "boolean":
      if (typeof value !== "boolean") {
        errors.push("El valor debe ser booleano (true/false)");
      }
      break;

    case "number":
      if (typeof value !== "number" || isNaN(value)) {
        errors.push("El valor debe ser un número válido");
      }
      break;

    case "string":
      if (typeof value !== "string") {
        errors.push("El valor debe ser una cadena de texto");
      }
      break;

    case "json":
      try {
        JSON.parse(value);
      } catch (e) {
        errors.push("El valor debe ser un JSON válido");
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        errors.push("El valor debe ser un array");
      }
      break;

    case "object":
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        errors.push("El valor debe ser un objeto");
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * ✅ SERVICIO DE CONFIGURACIONES COMPLETO
 */
export const settingsService = {
  /**
   * Obtener todas las configuraciones
   */
  getAll: async (useCache = true) => {
    try {
      const cacheKey = "settings_all";

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/settings");

      if (useCache && response.success) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener configuración por clave
   */
  get: async (key, defaultValue = null, useCache = true) => {
    try {
      const cacheKey = `setting_${key}`;

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get(`/settings/${key}`);

      if (useCache && response.success) {
        settingsCache.set(cacheKey, response);
      } else if (!response.success && defaultValue !== null) {
        // Retornar valor por defecto si no existe
        return {
          success: true,
          data: defaultValue,
          defaultValue: true,
        };
      }

      return response;
    } catch (error) {
      // Si no existe la configuración, retornar valor por defecto
      if (defaultValue !== null) {
        return {
          success: true,
          data: defaultValue,
          defaultValue: true,
          error: error.message,
        };
      }
      throw error;
    }
  },

  /**
   * Guardar configuración
   */
  set: async (key, value, settingType = "auto", description = "") => {
    try {
      // Determinar tipo automáticamente si no se especifica
      if (settingType === "auto") {
        if (typeof value === "boolean") settingType = "boolean";
        else if (typeof value === "number") settingType = "number";
        else if (Array.isArray(value)) settingType = "array";
        else if (typeof value === "object" && value !== null)
          settingType = "object";
        else if (typeof value === "string") {
          try {
            JSON.parse(value);
            settingType = "json";
          } catch {
            settingType = "string";
          }
        } else {
          settingType = "string";
        }
      }

      // Validar configuración
      const validation = validateSetting(key, value, settingType);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(", "));
      }

      // Mostrar warnings
      if (validation.warnings.length > 0) {
        validation.warnings.forEach((warning) => {
          notificationService.warning(warning);
        });
      }

      const settingData = {
        key,
        value: typeof value === "object" ? JSON.stringify(value) : value,
        type: settingType,
        description,
      };

      const response = await post("/settings", settingData);

      if (response.success) {
        // Actualizar cache
        settingsCache.delete(`setting_${key}`);
        settingsCache.clear();

        notificationService.success("Configuración guardada exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Actualizar configuración
   */
  update: async (key, value, description = null) => {
    try {
      const response = await put(`/settings/${key}`, {
        value: typeof value === "object" ? JSON.stringify(value) : value,
        description,
      });

      if (response.success) {
        // Actualizar cache
        settingsCache.delete(`setting_${key}`);
        settingsCache.clear();

        notificationService.success("Configuración actualizada exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Eliminar configuración
   */
  delete: async (key, confirm = true) => {
    try {
      if (confirm) {
        const confirmed = await notificationService.confirm(
          `¿Estás seguro de eliminar la configuración "${key}"?`
        );

        if (!confirmed) {
          return { success: false, message: "Operación cancelada" };
        }
      }

      const response = await del(`/settings/${key}`);

      if (response.success) {
        // Actualizar cache
        settingsCache.delete(`setting_${key}`);
        settingsCache.clear();

        notificationService.success("Configuración eliminada exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener configuraciones por categoría
   */
  getByCategory: async (category, useCache = true) => {
    try {
      const cacheKey = `settings_category_${category}`;

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/settings", { category });

      if (useCache && response.success) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener configuración de la aplicación
   */
  getAppSettings: async (useCache = true) => {
    try {
      const cacheKey = "settings_app";

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/settings/app");

      if (useCache && response.success) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      // Si no hay endpoint, construir desde configuraciones generales
      const allSettings = await this.getAll(useCache);

      if (allSettings.success && allSettings.data) {
        const appSettings = {
          site_name: "Inventory QR System",
          site_description: "Sistema de gestión de inventario con códigos QR",
          currency: "USD",
          timezone: "America/New_York",
          date_format: "YYYY-MM-DD",
          items_per_page: 20,
          enable_notifications: true,
          enable_audit_log: true,
          maintenance_mode: false,
        };

        // Sobrescribir con configuraciones del servidor
        allSettings.data.forEach((setting) => {
          if (appSettings.hasOwnProperty(setting.key)) {
            appSettings[setting.key] = setting.value;
          }
        });

        const response = {
          success: true,
          data: appSettings,
          calculated: true,
        };

        if (useCache) {
          settingsCache.set(cacheKey, response);
        }

        return response;
      }

      return allSettings;
    }
  },

  /**
   * Obtener configuración de inventario
   */
  getInventorySettings: async (useCache = true) => {
    try {
      const cacheKey = "settings_inventory";

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/settings/inventory");

      if (useCache && response.success) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      // Si no hay endpoint, retornar configuración por defecto
      const defaultSettings = {
        low_stock_threshold: 10,
        critical_stock_threshold: 5,
        enable_stock_alerts: true,
        enable_negative_stock: false,
        default_unit: "units",
        enable_batch_tracking: false,
        enable_expiry_tracking: false,
        auto_adjust_inventory: true,
        require_movement_reason: true,
        enable_location_tracking: true,
      };

      const response = {
        success: true,
        data: defaultSettings,
        defaultValue: true,
      };

      if (useCache) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    }
  },

  /**
   * Obtener configuración de QR
   */
  getQRSettings: async (useCache = true) => {
    try {
      const cacheKey = "settings_qr";

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/settings/qr");

      if (useCache && response.success) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      // Configuración por defecto para QR
      const defaultSettings = {
        qr_size: 300,
        qr_margin: 1,
        qr_error_correction: "M",
        qr_color: "#000000",
        qr_background: "#FFFFFF",
        qr_logo_enabled: true,
        qr_logo_size: 60,
        qr_text_enabled: true,
        qr_text_position: "bottom",
        qr_format: "png",
        qr_quality: 0.8,
        enable_qr_batch_generation: true,
        max_qr_batch_size: 100,
      };

      const response = {
        success: true,
        data: defaultSettings,
        defaultValue: true,
      };

      if (useCache) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    }
  },

  /**
   * Obtener configuración de notificaciones
   */
  getNotificationSettings: async (useCache = true) => {
    try {
      const cacheKey = "settings_notifications";

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const response = await get("/settings/notifications");

      if (useCache && response.success) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    } catch (error) {
      const defaultSettings = {
        enable_email_notifications: true,
        enable_push_notifications: false,
        enable_sms_notifications: false,
        low_stock_notifications: true,
        critical_stock_notifications: true,
        movement_notifications: true,
        user_activity_notifications: false,
        report_notifications: true,
        notification_sound: true,
        notification_duration: 5000,
      };

      const response = {
        success: true,
        data: defaultSettings,
        defaultValue: true,
      };

      if (useCache) {
        settingsCache.set(cacheKey, response);
      }

      return response;
    }
  },

  /**
   * Guardar múltiples configuraciones
   */
  saveMultiple: async (settings, category = null) => {
    try {
      if (!settings || typeof settings !== "object") {
        throw new Error("Configuraciones no válidas");
      }

      const settingsArray = Object.entries(settings).map(([key, value]) => ({
        key,
        value: typeof value === "object" ? JSON.stringify(value) : value,
        category,
      }));

      notificationService.loading("Guardando configuraciones...");

      try {
        const response = await post("/settings/batch", { settings: settingsArray });

        if (response.success) {
          // Limpiar cache completamente
          settingsCache.clear();
          clearCache("settings");

          notificationService.success("Configuraciones guardadas exitosamente");
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
   * Importar configuraciones desde archivo
   */
  importSettings: async (file, options = {}) => {
    try {
      // Validar archivo
      if (!file) {
        throw new Error("No se seleccionó archivo");
      }

      const validTypes = ["application/json", "text/plain"];
      if (!validTypes.includes(file.type)) {
        throw new Error("Tipo de archivo no permitido. Use JSON");
      }

      notificationService.loading("Importando configuraciones...");

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("options", JSON.stringify(options));

        const response = await post("/settings/import", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.success) {
          // Limpiar cache
          settingsCache.clear();
          clearCache("settings");

          notificationService.success(
            `Configuraciones importadas exitosamente: ${response.data?.imported || 0} registros`
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
   * Exportar configuraciones
   */
  exportSettings: async (format = "json", filter = {}) => {
    try {
      const date = new Date().toISOString().split("T")[0];
      const filename = `configuraciones_${date}.${format}`;

      await downloadFile("/settings/export", filename, {
        params: { format, ...filter },
      });

      return {
        success: true,
        message: "Configuraciones exportadas exitosamente",
        filename,
        format,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Restaurar configuraciones por defecto
   */
  restoreDefaults: async (category = null, confirm = true) => {
    try {
      if (confirm) {
        const message = category
          ? `¿Estás seguro de restaurar las configuraciones de "${category}" a los valores por defecto?`
          : "¿Estás seguro de restaurar TODAS las configuraciones a los valores por defecto?";

        const confirmed = await notificationService.confirm(message);

        if (!confirmed) {
          return { success: false, message: "Operación cancelada" };
        }
      }

      const response = await post("/settings/restore-defaults", { category });

      if (response.success) {
        // Limpiar cache
        settingsCache.clear();
        clearCache("settings");

        notificationService.success("Configuraciones restauradas exitosamente");
      }

      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtener historial de cambios en configuraciones
   */
  getChangeHistory: async (key = null, limit = 50) => {
    try {
      const cacheKey = `settings_history_${key || "all"}_${limit}`;
      const cached = settingsCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      const params = { limit };
      if (key) params.key = key;

      const response = await get("/settings/history", params);

      if (response.success) {
        settingsCache.set(cacheKey, response, 5 * 60 * 1000);
      }

      return response;
    } catch (error) {
      // Si no hay endpoint, retornar historial vacío
      const response = {
        success: true,
        data: [],
        key,
        limit,
        calculated: true,
      };

      settingsCache.set(cacheKey, response, 5 * 60 * 1000);
      return response;
    }
  },

  /**
   * ✅ MEJORA: Obtener configuración con caché inteligente
   */
  getWithCache: async (key, defaultValue = null, options = {}) => {
    const {
      useCache = true,
      cacheTTL = 30 * 60 * 1000,
      fallbackToDefault = true,
    } = options;

    const cacheKey = `setting_${key}`;

    try {
      // Evitar requests duplicados
      if (settingsCache.hasPending(cacheKey)) {
        return await settingsCache.getPending(cacheKey);
      }

      if (useCache) {
        const cached = settingsCache.get(cacheKey);
        if (cached) {
          return cached;
        }
      }

      const promise = (async () => {
        try {
          const response = await get(`/settings/${key}`);

          if (response.success) {
            if (useCache) {
              settingsCache.set(cacheKey, response, cacheTTL);
            }
          } else if (fallbackToDefault && defaultValue !== null) {
            return {
              success: true,
              data: defaultValue,
              defaultValue: true,
              fromCache: false,
            };
          }

          return response;
        } finally {
          settingsCache.deletePending(cacheKey);
        }
      })();

      settingsCache.setPending(cacheKey, promise);
      return await promise;
    } catch (error) {
      settingsCache.deletePending(cacheKey);

      if (fallbackToDefault && defaultValue !== null) {
        return {
          success: true,
          data: defaultValue,
          defaultValue: true,
          error: error.message,
          fromCache: false,
        };
      }
      throw error;
    }
  },

  /**
   * ✅ MEJORA: Configuraciones en tiempo real (para WebSocket/SSE)
   */
  subscribeToChanges: (callback, keys = []) => {
    if (typeof window === "undefined") {
      console.warn("subscribeToChanges solo disponible en navegador");
      return () => {};
    }

    let eventSource = null;

    try {
      const params = new URLSearchParams();
      if (keys.length > 0) {
        params.append("keys", keys.join(","));
      }

      eventSource = new EventSource(`/settings/stream?${params.toString()}`);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          callback(data);

          // Actualizar cache
          if (data.key) {
            settingsCache.delete(`setting_${data.key}`);
          } else {
            settingsCache.clear();
          }
        } catch (e) {
          console.error("Error procesando actualización de settings:", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error("Error en conexión SSE de settings:", error);
        if (eventSource) {
          eventSource.close();
        }
      };

      // Retornar función para desuscribirse
      return () => {
        if (eventSource) {
          eventSource.close();
        }
      };
    } catch (error) {
      console.error("Error suscribiéndose a cambios de settings:", error);
      return () => {};
    }
  },

  /**
   * ✅ MEJORA: Configuración de tema (claro/oscuro)
   */
  getThemeSettings: async () => {
    try {
      const cacheKey = "settings_theme";
      const cached = settingsCache.get(cacheKey);

      if (cached) {
        return cached;
      }

      // Primero intentar obtener del servidor
      try {
        const response = await this.get("theme_config", null, true);

        if (response.success && response.data) {
          const themeData = response.data;
          settingsCache.set(cacheKey, response);
          return response;
        }
      } catch (error) {
        console.log("Usando configuración de tema local");
      }

      // Configuración por defecto
      const defaultTheme = {
        mode: "light", // light, dark, auto
        primaryColor: "#3498db",
        secondaryColor: "#2ecc71",
        dangerColor: "#e74c3c",
        warningColor: "#f1c40f",
        successColor: "#27ae60",
        backgroundColor: "#f8f9fa",
        textColor: "#333333",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        borderRadius: "0.375rem",
        shadowIntensity: "medium",
        animations: true,
        reduceMotion: false,
      };

      // Verificar preferencias del sistema
      if (typeof window !== "undefined" && window.matchMedia) {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;

        if (defaultTheme.mode === "auto") {
          defaultTheme.mode = prefersDark ? "dark" : "light";
        }
        defaultTheme.reduceMotion = prefersReducedMotion;
      }

      const response = {
        success: true,
        data: defaultTheme,
        defaultValue: true,
      };

      settingsCache.set(cacheKey, response);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * ✅ MEJORA: Aplicar configuración de tema
   */
  applyThemeSettings: async (themeSettings) => {
    try {
      if (typeof window === "undefined") {
        throw new Error("Solo disponible en navegador");
      }

      // Guardar en servidor
      const response = await this.set("theme_config", themeSettings, "object");

      // Aplicar localmente
      this.applyThemeLocally(themeSettings);

      return response;
    } catch (error) {
      // Si falla el servidor, aplicar localmente
      console.warn("Aplicando tema localmente:", error);
      this.applyThemeLocally(themeSettings);

      // Guardar en localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("theme_config", JSON.stringify(themeSettings));
      }

      return {
        success: true,
        appliedLocally: true,
        data: themeSettings,
      };
    }
  },

  /**
   * ✅ MEJORA: Aplicar tema localmente
   */
  applyThemeLocally: (themeSettings) => {
    if (typeof window === "undefined" || !themeSettings) return;

    const root = document.documentElement;

    // Aplicar variables CSS
    if (themeSettings.primaryColor) {
      root.style.setProperty("--primary-color", themeSettings.primaryColor);
    }
    if (themeSettings.secondaryColor) {
      root.style.setProperty("--secondary-color", themeSettings.secondaryColor);
    }
    if (themeSettings.backgroundColor) {
      root.style.setProperty("--background-color", themeSettings.backgroundColor);
    }
    if (themeSettings.textColor) {
      root.style.setProperty("--text-color", themeSettings.textColor);
    }
    if (themeSettings.fontFamily) {
      root.style.setProperty("--font-family", themeSettings.fontFamily);
    }
    if (themeSettings.borderRadius) {
      root.style.setProperty("--border-radius", themeSettings.borderRadius);
    }

    // Aplicar modo claro/oscuro
    if (themeSettings.mode === "dark") {
      root.classList.add("dark-mode");
      root.classList.remove("light-mode");
    } else if (themeSettings.mode === "light") {
      root.classList.add("light-mode");
      root.classList.remove("dark-mode");
    } else {
      // Auto - basado en preferencias del sistema
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark-mode");
        root.classList.remove("light-mode");
      } else {
        root.classList.add("light-mode");
        root.classList.remove("dark-mode");
      }
    }

    // Aplicar reducción de movimiento
    if (themeSettings.reduceMotion || themeSettings.animations === false) {
      root.classList.add("reduced-motion");
    } else {
      root.classList.remove("reduced-motion");
    }

    // Guardar en localStorage para persistencia
    localStorage.setItem("current_theme", JSON.stringify(themeSettings));
  },

  /**
   * ✅ MEJORA: Inicializar tema al cargar
   */
  initializeTheme: async () => {
    try {
      if (typeof window === "undefined") return;

      // Cargar tema guardado
      let themeSettings = null;

      // Primero de localStorage
      const savedTheme = localStorage.getItem("current_theme");
      if (savedTheme) {
        try {
          themeSettings = JSON.parse(savedTheme);
        } catch (e) {
          console.warn("Error parsing saved theme:", e);
        }
      }

      // Si no hay tema guardado, cargar del servidor
      if (!themeSettings) {
        const themeResponse = await this.getThemeSettings();
        if (themeResponse.success) {
          themeSettings = themeResponse.data;
        }
      }

      // Aplicar tema
      if (themeSettings) {
        this.applyThemeLocally(themeSettings);
      }
    } catch (error) {
      console.error("Error inicializando tema:", error);
    }
  },

  /**
   * Validar configuración
   */
  validateSetting: (key, value, settingType) => {
    return validateSetting(key, value, settingType);
  },

  /**
   * Limpiar cache
   */
  clearCache: () => {
    settingsCache.clear();
    clearCache("settings");
  },
};

export default settingsService;