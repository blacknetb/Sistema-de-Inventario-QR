import { INVENTORY_CONSTANTS, MESSAGES } from './constants';

/**
 * Genera un ID único para productos
 * @returns {string} ID único
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Genera un código SKU para productos
 * @param {string} category - Categoría del producto
 * @param {number} id - ID numérico
 * @returns {string} SKU generado
 */
export const generateSKU = (category, id) => {
  const categoryCode = category.substring(0, 3).toUpperCase();
  const paddedId = id.toString().padStart(6, '0');
  return `${categoryCode}-${paddedId}`;
};

/**
 * Obtiene el color correspondiente al estado del producto
 * @param {string} status - Estado del producto
 * @returns {string} Color en formato HEX
 */
export const getStatusColor = (status) => {
  return INVENTORY_CONSTANTS.STATUS_COLORS[status] || '#95a5a6';
};

/**
 * Obtiene la clase CSS para el estado del producto
 * @param {string} status - Estado del producto
 * @returns {string} Nombre de la clase CSS
 */
export const getStatusClass = (status) => {
  const statusMap = {
    'Disponible': 'status-available',
    'Bajo Stock': 'status-low',
    'Agotado': 'status-out',
    'Descontinuado': 'status-discontinued'
  };
  return statusMap[status] || '';
};

/**
 * Determina el estado del producto basado en la cantidad
 * @param {number} quantity - Cantidad disponible
 * @param {number} lowStockThreshold - Umbral para stock bajo
 * @returns {string} Estado del producto
 */
export const determineProductStatus = (quantity, lowStockThreshold = 10) => {
  if (quantity <= 0) {
    return INVENTORY_CONSTANTS.PRODUCT_STATUS.OUT_OF_STOCK;
  } else if (quantity <= lowStockThreshold) {
    return INVENTORY_CONSTANTS.PRODUCT_STATUS.LOW_STOCK;
  } else {
    return INVENTORY_CONSTANTS.PRODUCT_STATUS.AVAILABLE;
  }
};

/**
 * Capitaliza la primera letra de cada palabra
 * @param {string} text - Texto a capitalizar
 * @returns {string} Texto capitalizado
 */
export const capitalize = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Trunca un texto si es muy largo
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Verifica si un valor está vacío
 * @param {any} value - Valor a verificar
 * @returns {boolean} True si está vacío
 */
export const isEmpty = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  if (typeof value === 'object' && Object.keys(value).length === 0) return true;
  return false;
};

/**
 * Clona profundamente un objeto
 * @param {object} obj - Objeto a clonar
 * @returns {object} Objeto clonado
 */
export const deepClone = (obj) => {
  return JSON.parse(JSON.stringify(obj));
};

/**
 * Elimina propiedades nulas o indefinidas de un objeto
 * @param {object} obj - Objeto a limpiar
 * @returns {object} Objeto limpio
 */
export const cleanObject = (obj) => {
  const cleaned = { ...obj };
  Object.keys(cleaned).forEach(key => {
    if (cleaned[key] === null || cleaned[key] === undefined || cleaned[key] === '') {
      delete cleaned[key];
    }
  });
  return cleaned;
};

/**
 * Obtiene el mensaje de error correspondiente
 * @param {string} errorCode - Código de error
 * @returns {string} Mensaje de error
 */
export const getErrorMessage = (errorCode) => {
  const errorMessages = {
    ...MESSAGES.ERROR,
    'auth/invalid-email': 'El correo electrónico no es válido',
    'auth/user-not-found': 'Usuario no encontrado',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    'network-error': 'Error de red. Verifica tu conexión'
  };
  
  return errorMessages[errorCode] || MESSAGES.ERROR.NETWORK_ERROR;
};

/**
 * Retrasa la ejecución de una función
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise} Promesa que se resuelve después del retraso
 */
export const delay = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Verifica si el dispositivo es móvil
 * @returns {boolean} True si es dispositivo móvil
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Genera un hash simple para strings
 * @param {string} str - String a hashear
 * @returns {string} Hash generado
 */
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
};