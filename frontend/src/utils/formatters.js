import { format, isValid, parseISO, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  CURRENCY_CONFIG, 
  DATE_FORMATS,
  INVENTORY_STATUS,
  MOVEMENT_TYPES,
  COLORS
} from './constants';

// ==================== FUNCIONES DE MEMOIZACIÓN ====================

/**
 * ✅ MEMOIZE SIMPLE PARA OPTIMIZAR RENDIMIENTO
 */
const memoize = (func) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

// ==================== FORMATTERS BASE ====================

/**
 * ✅ FORMATEADOR DE FECHA CON CACHÉ
 */
export const formatDate = memoize((date, formatString = DATE_FORMATS.DISPLAY.DATETIME, options = {}) => {
  if (!date) return options.fallback || '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return options.fallback || '';
    return format(dateObj, formatString, { locale: es });
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return options.fallback || '';
  }
});

/**
 * ✅ FORMATEADOR DE FECHA RELATIVA CON CACHÉ
 */
export const formatRelativeDate = memoize((date, options = {}) => {
  if (!date) return options.fallback || '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return options.fallback || '';
    return formatDistanceToNow(dateObj, { 
      locale: es, 
      addSuffix: true,
      ...options 
    });
  } catch (error) {
    console.error('Error formateando fecha relativa:', error);
    return options.fallback || '';
  }
});

/**
 * ✅ FORMATEADOR DE MONEDA CON CACHÉ
 */
export const formatCurrency = memoize((amount, options = {}) => {
  if (amount === null || amount === undefined || amount === '') {
    return options.fallback || '$0.00';
  }
  
  try {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return options.fallback || '$0.00';
    
    return CURRENCY_CONFIG.format(numAmount, options.currency || 'MXN', options);
  } catch (error) {
    console.error('Error formateando moneda:', error);
    return options.fallback || '$0.00';
  }
});

/**
 * ✅ FORMATEADOR DE NÚMERO CON CACHÉ
 */
export const formatNumber = memoize((number, options = {}) => {
  const { decimals = 0, fallback = '0' } = options;
  
  if (number === null || number === undefined || number === '') {
    return fallback;
  }
  
  try {
    const num = typeof number === 'string' ? parseFloat(number) : number;
    if (isNaN(num)) return fallback;
    
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(num);
  } catch (error) {
    console.error('Error formateando número:', error);
    return fallback;
  }
});

/**
 * ✅ FORMATEADOR DE PORCENTAJE CON CACHÉ
 */
export const formatPercentage = memoize((value, options = {}) => {
  const { decimals = 1, fallback = '0%' } = options;
  
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return fallback;
    
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(numValue);
    
    return `${formatted}%`;
  } catch (error) {
    console.error('Error formateando porcentaje:', error);
    return fallback;
  }
});

// ==================== FUNCIONES AUXILIARES ====================

/**
 * ✅ TRUNCAR TEXTO CON MANTENIMIENTO DE PALABRAS
 */
const truncateText = (text, maxLength = 100, ellipsis = '...') => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace).trim() + ellipsis;
  }
  
  return truncated.trim() + ellipsis;
};

/**
 * ✅ OBTENER INICIALES DE NOMBRE
 */
const getInitials = (name, maxLength = 2) => {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  const words = name
    .split(' ')
    .filter(word => word.length > 0);
  
  if (words.length === 0) {
    return '';
  }
  
  const initials = words
    .slice(0, maxLength)
    .map(word => word[0])
    .join('')
    .toUpperCase();
  
  return initials;
};

// ==================== FORMATTERS DE PRODUCTOS ====================

/**
 * ✅ FORMATEAR PRODUCTO COMPLETO
 */
export const formatProduct = (product, options = {}) => {
  if (!product || typeof product !== 'object') {
    console.warn('Producto inválido para formatear:', product);
    return product;
  }
  
  try {
    const currentStock = product.current_stock || 0;
    const minStock = product.min_stock || 0;
    const maxStock = product.max_stock || 100;
    
    // Calcular estado de stock
    const stockStatus = INVENTORY_STATUS.calculate(currentStock, minStock, maxStock);
    const stockInfo = {
      status: stockStatus,
      label: INVENTORY_STATUS.getLabel(stockStatus),
      color: INVENTORY_STATUS.getColor(stockStatus),
      icon: INVENTORY_STATUS.getIcon(stockStatus)
    };
    
    // Calcular porcentaje de stock
    const stockPercentage = minStock > 0 && maxStock > 0 
      ? Math.min(100, Math.max(0, ((currentStock - minStock) / (maxStock - minStock)) * 100))
      : 0;
    
    return {
      ...product,
      
      // Información formateada
      formatted_price: formatCurrency(product.price || 0),
      formatted_cost: formatCurrency(product.cost || 0),
      formatted_current_stock: formatNumber(currentStock, { decimals: 0 }),
      formatted_min_stock: formatNumber(minStock, { decimals: 0 }),
      formatted_max_stock: formatNumber(maxStock, { decimals: 0 }),
      
      // Fechas formateadas
      formatted_created_at: formatDate(product.created_at, DATE_FORMATS.DISPLAY.DATETIME, options),
      formatted_updated_at: formatDate(product.updated_at, DATE_FORMATS.DISPLAY.DATETIME, options),
      relative_created_at: formatRelativeDate(product.created_at, options),
      relative_updated_at: formatRelativeDate(product.updated_at, options),
      
      // Información de stock
      stock_percentage: stockPercentage,
      stock_status: stockStatus,
      stock_status_label: stockInfo.label,
      stock_status_color: stockInfo.color,
      stock_status_icon: stockInfo.icon,
      
      // Banderas de estado
      is_low_stock: currentStock <= minStock && currentStock > 0,
      is_out_of_stock: currentStock <= 0,
      is_over_stock: currentStock >= maxStock,
      
      // Información calculada
      total_value: (product.price || 0) * (currentStock || 0),
      formatted_total_value: formatCurrency((product.price || 0) * (currentStock || 0)),
      
      // Texto truncado para UI
      short_description: truncateText(product.description || '', 150),
      short_name: truncateText(product.name || '', 50),
    };
  } catch (error) {
    console.error('Error formateando producto:', error, product);
    return product;
  }
};

// ==================== FORMATTERS DE MOVIMIENTOS DE INVENTARIO ====================

/**
 * ✅ FORMATEAR MOVIMIENTO DE INVENTARIO
 */
export const formatInventoryMovement = (movement, options = {}) => {
  if (!movement || typeof movement !== 'object') {
    console.warn('Movimiento inválido para formatear:', movement);
    return movement;
  }
  
  try {
    const movementInfo = {
      label: MOVEMENT_TYPES.getLabel(movement.movement_type),
      color: MOVEMENT_TYPES.getColor(movement.movement_type)
    };
    
    return {
      ...movement,
      
      // Información formateada
      formatted_quantity: formatNumber(movement.quantity || 0, { decimals: 0 }),
      formatted_unit_price: formatCurrency(movement.unit_price || 0),
      formatted_total_value: formatCurrency((movement.quantity || 0) * (movement.unit_price || 0)),
      
      // Fechas formateadas
      formatted_created_at: formatDate(movement.created_at, DATE_FORMATS.DISPLAY.DATETIME, options),
      relative_time: formatRelativeDate(movement.created_at, options),
      
      // Información de movimiento
      movement_label: movementInfo.label,
      movement_color: movementInfo.color,
      movement_icon: movement.movement_type === 'entry' ? 'arrow-down' : 'arrow-up',
      
      // Banderas de tipo
      is_entry: movement.movement_type === MOVEMENT_TYPES.ENTRY,
      is_exit: movement.movement_type === MOVEMENT_TYPES.EXIT,
      
      // Información para UI
      sign: movement.movement_type === 'entry' ? '+' : '-',
      signed_quantity: `${movement.movement_type === 'entry' ? '+' : '-'}${formatNumber(movement.quantity || 0, { decimals: 0 })}`,
    };
  } catch (error) {
    console.error('Error formateando movimiento de inventario:', error, movement);
    return movement;
  }
};

// ==================== UTILIDADES ====================

/**
 * ✅ FORMATEAR TELÉFONO
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }
  
  if (cleaned.length > 10) {
    const countryCode = cleaned.substring(0, cleaned.length - 10);
    const number = cleaned.substring(cleaned.length - 10);
    return `+${countryCode} (${number.substring(0, 3)}) ${number.substring(3, 6)}-${number.substring(6)}`;
  }
  
  return phone;
};

/**
 * ✅ FORMATEAR MÚLTIPLES ITEMS
 */
export const formatMultiple = (items, formatter, options = {}) => {
  if (!Array.isArray(items)) {
    console.warn('Items inválidos para formatear:', items);
    return [];
  }
  
  return items.map(item => {
    try {
      return formatter(item, options);
    } catch (error) {
      console.error('Error formateando item:', error, item);
      return item;
    }
  });
};

// ✅ EXPORTACIÓN POR DEFECTO
export default {
  // Formateadores base
  formatDate,
  formatRelativeDate,
  formatCurrency,
  formatNumber,
  formatPercentage,
  
  // Formateadores de entidades
  formatProduct,
  formatInventoryMovement,
  
  // Utilidades
  formatPhoneNumber,
  formatMultiple
};