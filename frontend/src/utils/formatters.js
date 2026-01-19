import { INVENTORY_CONSTANTS } from './constants';

/**
 * Formatea un número como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} Cantidad formateada como moneda
 */
export const formatCurrency = (amount, options = {}) => {
  const {
    locale = INVENTORY_CONSTANTS.CURRENCY.LOCALE,
    currency = INVENTORY_CONSTANTS.CURRENCY.CODE,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `${INVENTORY_CONSTANTS.CURRENCY.SYMBOL}0.00`;
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
};

/**
 * Formatea un número con separadores de miles
 * @param {number} number - Número a formatear
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Número formateado
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) {
    return '0';
  }
  
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(number);
};

/**
 * Formatea una fecha
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato a usar
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, format = 'display') => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return 'Fecha inválida';
  }
  
  const formats = {
    display: {
      dateStyle: 'medium',
      timeStyle: dateObj.getHours() + dateObj.getMinutes() + dateObj.getSeconds() > 0 ? 'short' : undefined
    },
    short: {
      dateStyle: 'short'
    },
    long: {
      dateStyle: 'long'
    },
    time: {
      timeStyle: 'short'
    },
    datetime: {
      dateStyle: 'medium',
      timeStyle: 'short'
    },
    iso: dateObj.toISOString().split('T')[0]
  };
  
  if (format === 'iso') return formats.iso;
  
  const options = formats[format] || formats.display;
  
  return new Intl.DateTimeFormat('es-MX', options).format(dateObj);
};

/**
 * Formatea un porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  
  return new Intl.NumberFormat('es-MX', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100);
};

/**
 * Formatea el peso de un producto
 * @param {number} weight - Peso en gramos
 * @param {string} unit - Unidad deseada
 * @returns {string} Peso formateado
 */
export const formatWeight = (weight, unit = 'auto') => {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return '0 g';
  }
  
  if (unit === 'auto') {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} kg`;
    } else if (weight >= 1) {
      return `${weight.toFixed(0)} g`;
    } else {
      return `${weight.toFixed(2)} g`;
    }
  }
  
  const conversions = {
    kg: weight / 1000,
    g: weight,
    mg: weight * 1000
  };
  
  return `${conversions[unit]?.toFixed(2) || weight.toFixed(2)} ${unit}`;
};

/**
 * Formatea las dimensiones de un producto
 * @param {object} dimensions - Dimensiones {length, width, height}
 * @param {string} unit - Unidad de medida
 * @returns {string} Dimensiones formateadas
 */
export const formatDimensions = (dimensions, unit = 'cm') => {
  if (!dimensions) return '';
  
  const { length, width, height } = dimensions;
  return `${length} × ${width} × ${height} ${unit}`;
};

/**
 * Formatea el nombre de archivo para exportación
 * @param {string} prefix - Prefijo del archivo
 * @param {string} format - Formato del archivo
 * @returns {string} Nombre de archivo formateado
 */
export const formatFilename = (prefix = 'inventario', format = 'csv') => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  
  return `${prefix}_${dateStr}_${timeStr}.${format}`;
};

/**
 * Formatea el tiempo transcurrido
 * @param {Date|string} date - Fecha a comparar
 * @returns {string} Tiempo transcurrido formateado
 */
export const formatTimeAgo = (date) => {
  if (!date) return '';
  
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 30) {
    return formatDate(dateObj, 'short');
  } else if (diffDay > 0) {
    return `${diffDay} día${diffDay > 1 ? 's' : ''} atrás`;
  } else if (diffHour > 0) {
    return `${diffHour} hora${diffHour > 1 ? 's' : ''} atrás`;
  } else if (diffMin > 0) {
    return `${diffMin} minuto${diffMin > 1 ? 's' : ''} atrás`;
  } else {
    return 'Hace unos segundos';
  }
};

/**
 * Formatea un código de barras para visualización
 * @param {string} barcode - Código de barras
 * @returns {string} Código de barras formateado
 */
export const formatBarcode = (barcode) => {
  if (!barcode) return '';
  
  // Formato para códigos EAN-13
  if (barcode.length === 13) {
    return `${barcode.substring(0, 1)} ${barcode.substring(1, 7)} ${barcode.substring(7)}`;
  }
  
  // Formato para códigos UPC-A
  if (barcode.length === 12) {
    return `${barcode.substring(0, 1)} ${barcode.substring(1, 6)} ${barcode.substring(6, 11)} ${barcode.substring(11)}`;
  }
  
  return barcode;
};