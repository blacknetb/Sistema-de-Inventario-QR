import axios from "axios";
import notificationService from "./notificationService";

// ✅ Configuración de API
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || "http://localhost:3000/api",
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT) || 30000,
  MAX_RETRIES: parseInt(process.env.REACT_APP_API_MAX_RETRIES) || 3,
  RETRY_DELAY: parseInt(process.env.REACT_APP_API_RETRY_DELAY) || 1000,
  CACHE_ENABLED: process.env.REACT_APP_CACHE_ENABLED === "true",
  OFFLINE_MODE: process.env.REACT_APP_OFFLINE_MODE === "true",
};

// ✅ Keys de localStorage
const STORAGE_KEYS = {
  TOKEN: "inventory_qr_token",
  REFRESH_TOKEN: "inventory_qr_refresh_token",
  USER: "inventory_qr_user",
  TOKEN_EXPIRY: "inventory_qr_token_expiry",
  API_CACHE: "inventory_qr_api_cache",
};

// ✅ Cache en memoria
const memoryCache = new Map();
const CACHE_TTL = {
  SHORT: 60 * 1000,
  MEDIUM: 5 * 60 * 1000,
  LONG: 30 * 60 * 1000,
};

// ✅ Gestión de requests pendientes
const CancelToken = axios.CancelToken;
const pendingRequests = new Map();

/**
 * Cancela todas las requests pendientes
 */
export const cancelAllRequests = (reason = "Operación cancelada") => {
  pendingRequests.forEach((cancel, url) => {
    cancel(reason);
    console.log(`Request cancelado: ${url}`);
  });
  pendingRequests.clear();
};

/**
 * Cancela un request específico
 */
export const cancelRequest = (url) => {
  if (pendingRequests.has(url)) {
    pendingRequests.get(url)("Request específico cancelado");
    pendingRequests.delete(url);
    return true;
  }
  return false;
};

// ✅ Instancia de Axios
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Client": "inventory-qr-frontend",
  },
  withCredentials: true,
});

// ✅ Interceptor de request
api.interceptors.request.use(
  (config) => {
    config.metadata = {
      startTime: Date.now(),
      url: config.url,
      method: config.method,
    };

    // Cancelar request anterior si existe
    if (pendingRequests.has(config.url)) {
      pendingRequests.get(config.url)("Request anterior cancelado");
      pendingRequests.delete(config.url);
    }

    const source = CancelToken.source();
    config.cancelToken = source.token;
    pendingRequests.set(config.url, source.cancel);

    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Cache para GET
    if (API_CONFIG.CACHE_ENABLED && config.method?.toLowerCase() === "get") {
      const cacheKey = `${config.method}_${config.url}_${JSON.stringify(config.params || {})}`;
      const cached = getFromCache(cacheKey);

      if (cached && !config.headers["x-no-cache"]) {
        const cacheError = new Error("Cache hit");
        cacheError.isCacheHit = true;
        cacheError.cachedData = cached.data;
        cacheError.cacheTimestamp = cached.timestamp;
        throw cacheError;
      }
    }

    return config;
  },
  (error) => {
    console.error("Error en interceptor de request:", error);
    return Promise.reject(error);
  }
);

// ✅ Interceptor de response
api.interceptors.response.use(
  (response) => {
    const { config, data, status } = response;
    const duration = Date.now() - config.metadata.startTime;

    pendingRequests.delete(config.url);

    if (process.env.NODE_ENV === "development") {
      console.log(
        `✅ ${config.method?.toUpperCase()} ${config.url} - ${status} (${duration}ms)`
      );
    }

    // Guardar en cache si es GET
    if (
      API_CONFIG.CACHE_ENABLED &&
      config.method?.toLowerCase() === "get" &&
      status === 200 &&
      !config.headers["x-no-cache"]
    ) {
      const cacheKey = `${config.method}_${config.url}_${JSON.stringify(config.params || {})}`;
      const cacheTTL = getCacheTTL(config.url);
      saveToCache(cacheKey, data, cacheTTL);
    }

    // Manejar formato de respuesta
    if (data && typeof data === "object") {
      if (data.success === false) {
        const error = new Error(data.message || "Error del servidor");
        error.response = response;
        error.status = status;
        return Promise.reject(error);
      }

      if (!data.hasOwnProperty("success") && !data.hasOwnProperty("data")) {
        return {
          ...response,
          data: {
            success: true,
            data: data,
            message: "Operación exitosa",
          },
        };
      }
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Manejar cache hit
    if (error.isCacheHit) {
      return Promise.resolve({
        data: {
          success: true,
          data: error.cachedData,
          message: "Datos desde cache",
          fromCache: true,
          cacheTimestamp: error.cacheTimestamp,
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: originalRequest,
      });
    }

    // Manejar cancelación
    if (axios.isCancel(error)) {
      console.log("Request cancelado:", error.message);
      return Promise.reject(new Error("Request cancelado"));
    }

    // Limpiar request pendiente
    if (originalRequest?.url) {
      pendingRequests.delete(originalRequest.url);
    }

    // Verificar conexión a internet
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const offlineError = new Error("Sin conexión a internet");
      offlineError.isOffline = true;
      offlineError.code = "NETWORK_ERROR";
      notificationService.error("Verifica tu conexión a internet");
      return Promise.reject(offlineError);
    }

    // Manejar timeout
    if (error.code === "ECONNABORTED") {
      const timeoutError = new Error("La petición tardó demasiado");
      timeoutError.isTimeout = true;
      timeoutError.code = "TIMEOUT";
      notificationService.error(
        "El servidor está tardando en responder. Intenta nuevamente."
      );
      return Promise.reject(timeoutError);
    }

    // Manejar errores de red
    if (!error.response) {
      const networkError = new Error("Error de conexión con el servidor");
      networkError.isNetworkError = true;
      networkError.code = "NETWORK_ERROR";
      notificationService.error(
        "No se pudo conectar con el servidor. Verifica tu conexión."
      );
      return Promise.reject(networkError);
    }

    const { status, data } = error.response;
    let errorMessage = data?.message || "Error desconocido";

    // Manejo específico por código de error
    switch (status) {
      case 400:
        errorMessage = data.message || "Solicitud incorrecta";
        if (data.errors) {
          errorMessage +=
            ": " +
            data.errors
              .map((err) => `${err.field || ""}: ${err.message}`)
              .join(", ");
        }
        notificationService.error(errorMessage);
        break;

      case 401:
        if (!originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
            if (!refreshToken) {
              throw new Error("No hay refresh token disponible");
            }

            const refreshResponse = await axios.post(
              `${API_CONFIG.BASE_URL}/auth/refresh`,
              { refresh_token: refreshToken },
              { timeout: 10000 }
            );

            if (
              refreshResponse.data.success &&
              refreshResponse.data.data.token
            ) {
              const { token, refresh_token: newRefreshToken } =
                refreshResponse.data.data;

              localStorage.setItem(STORAGE_KEYS.TOKEN, token);
              if (newRefreshToken) {
                localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
              }

              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            }
          } catch (refreshError) {
            console.error("Error al refrescar token:", refreshError);
          }
        }

        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER);

        if (
          typeof window !== "undefined" &&
          !window.location.pathname.includes("/login")
        ) {
          notificationService.error(
            "Sesión expirada. Por favor, inicia sesión nuevamente."
          );
          setTimeout(() => {
            window.location.href = "/login";
          }, 1500);
        }
        break;

      case 403:
        errorMessage = data.message || "Acceso denegado";
        notificationService.error(errorMessage);
        break;

      case 404:
        errorMessage = data.message || "Recurso no encontrado";
        notificationService.warning(errorMessage);
        break;

      case 409:
        errorMessage = data.message || "Conflicto de datos";
        notificationService.error(errorMessage);
        break;

      case 422:
        errorMessage = "Error de validación";
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err) => {
            notificationService.error(`${err.field || ""}: ${err.message}`);
          });
        } else {
          notificationService.error(errorMessage);
        }
        break;

      case 429:
        errorMessage =
          data.message ||
          "Demasiadas peticiones. Por favor, espera un momento.";
        notificationService.warning(errorMessage);
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage =
          data.message || "Error del servidor. Por favor, intenta más tarde.";
        notificationService.error(errorMessage);
        break;

      default:
        notificationService.error(`Error ${status}: ${errorMessage}`);
    }

    const structuredError = new Error(errorMessage);
    structuredError.status = status;
    structuredError.data = data;
    structuredError.response = error.response;
    structuredError.isAxiosError = true;

    return Promise.reject(structuredError);
  }
);

// ✅ Funciones de cache
function getFromCache(key) {
  if (!API_CONFIG.CACHE_ENABLED) return null;

  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    return cached;
  }
  memoryCache.delete(key);

  try {
    const stored = localStorage.getItem(STORAGE_KEYS.API_CACHE);
    if (stored) {
      const cache = JSON.parse(stored);
      const cached = cache[key];
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        memoryCache.set(key, cached);
        return cached;
      }
    }
  } catch (e) {
    console.warn("Error reading cache from localStorage:", e);
  }

  return null;
}

function saveToCache(key, data, ttl) {
  if (!API_CONFIG.CACHE_ENABLED) return;

  const cacheEntry = {
    data,
    timestamp: Date.now(),
    ttl,
  };

  memoryCache.set(key, cacheEntry);

  setTimeout(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_CACHE);
      const cache = stored ? JSON.parse(stored) : {};
      cache[key] = cacheEntry;
      localStorage.setItem(STORAGE_KEYS.API_CACHE, JSON.stringify(cache));
    } catch (e) {
      console.warn("Error saving cache to localStorage:", e);
    }
  }, 0);
}

function getCacheTTL(url) {
  if (!url) return CACHE_TTL.MEDIUM;

  if (url.includes("/products") || url.includes("/categories")) {
    return CACHE_TTL.MEDIUM;
  } else if (url.includes("/inventory/stock") || url.includes("/dashboard")) {
    return CACHE_TTL.SHORT;
  } else if (url.includes("/auth/profile") || url.includes("/users/me")) {
    return CACHE_TTL.LONG;
  }
  return CACHE_TTL.MEDIUM;
}

// ✅ Métodos HTTP básicos
export const get = async (url, params = {}, config = {}) => {
  const response = await api.get(url, { params, ...config });
  return response.data;
};

export const post = async (url, data = {}, config = {}) => {
  const response = await api.post(url, data, config);
  return response.data;
};

export const put = async (url, data = {}, config = {}) => {
  const response = await api.put(url, data, config);
  return response.data;
};

export const patch = async (url, data = {}, config = {}) => {
  const response = await api.patch(url, data, config);
  return response.data;
};

export const del = async (url, config = {}) => {
  const response = await api.delete(url, config);
  return response.data;
};

// ✅ Métodos especializados
export const uploadFile = async (
  url,
  file,
  onUploadProgress = null,
  config = {}
) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress,
    timeout: 60000,
    ...config,
  });

  return response.data;
};

export const downloadFile = async (url, filename, config = {}) => {
  try {
    const response = await api.get(url, {
      responseType: "blob",
      ...config,
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true, filename };
  } catch (error) {
    console.error(`❌ Error al descargar ${filename}:`, error.message);
    throw new Error(`No se pudo descargar el archivo: ${filename}`);
  }
};

// ✅ Request con retry automático
export const requestWithRetry = async (
  requestFn,
  maxRetries = API_CONFIG.MAX_RETRIES,
  baseDelay = API_CONFIG.RETRY_DELAY
) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      if (
        error.status === 400 ||
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404
      ) {
        throw error;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = delay * 0.1 * (Math.random() * 2 - 1);
        const totalDelay = delay + jitter;

        console.log(
          `Reintentando en ${totalDelay}ms (intento ${attempt + 1}/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, totalDelay));
      }
    }
  }

  throw lastError;
};

export const checkConnectivity = async ({
  endpoint = "/health",
  timeout = 5000,
  retries = 3,
  backoff = 500,
} = {}) => {
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const response = await api.get(endpoint, { timeout });
      return response.status === 200;
    } catch (error) {
      attempt++;

      if (error.code === "ECONNABORTED") {
        console.warn(`⏱ Timeout en intento ${attempt}`);
      } else {
        console.error(`❌ Error en intento ${attempt}:`, error.message);
      }

      if (attempt <= retries) {
        const delay = backoff * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw new Error(
          "No se pudo verificar la conectividad después de varios intentos"
        );
      }
    }
  }

  return false;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const clearCache = (pattern = null) => {
  if (pattern) {
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    }
  } else {
    memoryCache.clear();
  }

  if (!pattern) {
    localStorage.removeItem(STORAGE_KEYS.API_CACHE);
  }
};

// ✅ Exportar configuración
export const API_CONFIGURATION = API_CONFIG;
export const STORAGE_CONFIGURATION = STORAGE_KEYS;

export default api;