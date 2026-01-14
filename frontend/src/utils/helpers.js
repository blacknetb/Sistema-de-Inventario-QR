import {
  VALIDATION,
  STORAGE_KEYS,
  CURRENCY_CONFIG,
  DATE_FORMATS,
} from "./constants";
import { format, parseISO, isValid, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

// ==================== VALIDACIÓN MEJORADA ====================

/**
 * ✅ VALIDACIÓN DE EMAIL
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== "string") {
    return false;
  }

  const trimmedEmail = email.trim();
  return VALIDATION.PATTERNS.EMAIL.test(trimmedEmail);
};

/**
 * ✅ VALIDACIÓN DE CONTRASEÑA
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== "string") {
    return false;
  }

  return password.length >= VALIDATION.LIMITS.PASSWORD.min && 
         password.length <= VALIDATION.LIMITS.PASSWORD.max;
};

/**
 * ✅ VALIDACIÓN DE SKU
 */
export const validateSKU = (sku) => {
  if (!sku || typeof sku !== "string") {
    return false;
  }

  const trimmedSKU = sku.trim();
  return VALIDATION.PATTERNS.SKU.test(trimmedSKU);
};

// ==================== FORMATEO MEJORADO ====================

/**
 * ✅ FORMATEO DE MONEDA
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    currency = CURRENCY_CONFIG.DEFAULT,
    decimals,
    fallback = "$0.00",
  } = options;

  if (amount === null || amount === undefined || amount === "") {
    return fallback;
  }

  try {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return fallback;
    return CURRENCY_CONFIG.format(numAmount, currency, { decimals });
  } catch (error) {
    console.error("Error formateando moneda:", error);
    return fallback;
  }
};

/**
 * ✅ FORMATEO DE NÚMERO
 */
export const formatNumber = (number, options = {}) => {
  const { decimals = 0, fallback = "0" } = options;

  if (number === null || number === undefined || number === "") {
    return fallback;
  }

  try {
    const num = typeof number === "string" ? parseFloat(number) : number;
    if (isNaN(num)) return fallback;
    return new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  } catch (error) {
    console.error("Error formateando número:", error);
    return fallback;
  }
};

// ==================== MANEJO DE TEXTO ====================

/**
 * ✅ TRUNCAR TEXTO CON MANTENIMIENTO DE PALABRAS
 */
export const truncateText = (text, maxLength = 100, ellipsis = "...") => {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + ellipsis;
  }

  return truncated.trim() + ellipsis;
};

/**
 * ✅ CAPITALIZAR PRIMERA LETRA
 */
export const capitalizeFirst = (text) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * ✅ OBTENER INICIALES DE NOMBRE
 */
export const getInitials = (name, maxLength = 2) => {
  if (!name || typeof name !== "string") {
    return "";
  }

  const words = name.split(" ").filter((word) => word.length > 0);
  if (words.length === 0) return "";

  const initials = words
    .slice(0, maxLength)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return initials;
};

// ==================== MANEJO DE FECHAS ====================

/**
 * ✅ FORMATEAR FECHA
 */
export const formatDate = (
  date,
  formatString = DATE_FORMATS.DISPLAY.DATETIME,
  options = {}
) => {
  const { fallback = "", locale = es } = options;

  if (!date) {
    return fallback;
  }

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return fallback;
    return format(dateObj, formatString, { locale });
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return fallback;
  }
};

/**
 * ✅ FORMATEAR FECHA RELATIVA
 */
export const formatRelativeDate = (date, options = {}) => {
  const { fallback = "", addSuffix = true, locale = es } = options;

  if (!date) {
    return fallback;
  }

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return fallback;
    return formatDistanceToNow(dateObj, {
      locale,
      addSuffix,
      ...options,
    });
  } catch (error) {
    console.error("Error formateando fecha relativa:", error);
    return fallback;
  }
};

// ==================== MANEJO DE ARCHIVOS ====================

/**
 * ✅ FORMATEAR TAMAÑO DE ARCHIVO
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * ✅ OBTENER EXTENSIÓN DE ARCHIVO
 */
export const getFileExtension = (filename) => {
  if (!filename || typeof filename !== "string") {
    return "";
  }

  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};

// ==================== MANEJO DE ARRAYS Y OBJETOS ====================

/**
 * ✅ AGRUPAR ARRAY POR CLAVE
 */
export const groupBy = (array, key) => {
  if (!Array.isArray(array) || !key) {
    return {};
  }

  return array.reduce((groups, item) => {
    const groupKey = item[key];
    if (groupKey !== undefined) {
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }
    return groups;
  }, {});
};

/**
 * ✅ ORDENAR ARRAY POR CLAVE
 */
export const sortBy = (array, key, order = "asc") => {
  if (!Array.isArray(array) || !key) {
    return array || [];
  }

  return [...array].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    if (aValue === undefined || bValue === undefined) {
      return 0;
    }

    if (typeof aValue === "string" && typeof bValue === "string") {
      return order === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return order === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });
};

// ==================== MANEJO DE LOCAL STORAGE ====================

/**
 * ✅ OBTENER DATO DE LOCAL STORAGE
 */
export const getFromStorage = (key, defaultValue = null) => {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error leyendo de localStorage key "${key}":`, error);
    return defaultValue;
  }
};

/**
 * ✅ GUARDAR DATO EN LOCAL STORAGE
 */
export const setToStorage = (key, value) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error escribiendo en localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * ✅ ELIMINAR DATO DE LOCAL STORAGE
 */
export const removeFromStorage = (key) => {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error eliminando de localStorage key "${key}":`, error);
    return false;
  }
};

/**
 * ✅ OBTENER TOKEN DE AUTENTICACIÓN
 */
export const getAuthToken = () => {
  return getFromStorage(STORAGE_KEYS.AUTH.ACCESS_TOKEN);
};

/**
 * ✅ GUARDAR TOKEN DE AUTENTICACIÓN
 */
export const setAuthToken = (token) => {
  return setToStorage(STORAGE_KEYS.AUTH.ACCESS_TOKEN, token);
};

// ==================== UTILIDADES DE RENDIMIENTO ====================

/**
 * ✅ DEBOUNCE OPTIMIZADO
 */
export const debounce = (func, wait, immediate = false) => {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) {
        func.apply(this, args);
      }
    };

    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);

    if (callNow) {
      func.apply(this, args);
    }
  };
};

/**
 * ✅ THROTTLE OPTIMIZADO
 */
export const throttle = (func, limit) => {
  let inThrottle;
  let lastResult;

  return function (...args) {
    if (!inThrottle) {
      inThrottle = true;
      lastResult = func.apply(this, args);

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }

    return lastResult;
  };
};

// ==================== MANEJO DE ERRORES ====================

/**
 * ✅ PARSEAR JSON DE FORMA SEGURA
 */
export const safeParseJSON = (jsonString, defaultValue = null) => {
  if (!jsonString || typeof jsonString !== "string") {
    return defaultValue;
  }

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parseando JSON:", error);
    return defaultValue;
  }
};

/**
 * ✅ STRINGIFY JSON DE FORMA SEGURA
 */
export const safeStringifyJSON = (obj, defaultValue = "{}") => {
  if (obj === undefined || obj === null) {
    return defaultValue;
  }

  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error("Error stringify JSON:", error);
    return defaultValue;
  }
};

// ✅ EXPORTACIÓN POR DEFECTO
export default {
  // Validación
  validateEmail,
  validatePassword,
  validateSKU,

  // Formateo
  formatCurrency,
  formatNumber,

  // Texto
  truncateText,
  capitalizeFirst,
  getInitials,

  // Fechas
  formatDate,
  formatRelativeDate,

  // Archivos
  formatFileSize,
  getFileExtension,

  // Arrays y objetos
  groupBy,
  sortBy,

  // Storage
  getFromStorage,
  setToStorage,
  removeFromStorage,
  getAuthToken,
  setAuthToken,

  // Rendimiento
  debounce,
  throttle,

  // Errores
  safeParseJSON,
  safeStringifyJSON,
};