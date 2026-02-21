/**
 * formatters.js - Utilidades de formateo para Inventory QR System
 * Proporciona funciones para formatear moneda, números, textos, etc.
 */

// ========================================
// FORMATEO DE MONEDA
// ========================================

/**
 * Formatea un número como moneda
 * @param {number} value - Valor a formatear
 * @param {string} currency - Código de moneda (MXN, USD, EUR)
 * @param {string} locale - Locale para el formateo
 * @returns {string} - Valor formateado como moneda
 */
export function formatCurrency(value, currency = 'MXN', locale = 'es-MX') {
    if (value === null || value === undefined || isNaN(value)) return '$0.00';
    
    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value);
    } catch (error) {
        console.error('Error formateando moneda:', error);
        return `$${value.toFixed(2)}`;
    }
}

/**
 * Formatea un número como moneda sin decimales
 * @param {number} value - Valor a formatear
 * @param {string} currency - Código de moneda
 * @returns {string} - Valor formateado sin decimales
 */
export function formatCurrencyNoDecimals(value, currency = 'MXN') {
    if (value === null || value === undefined || isNaN(value)) return '$0';
    
    try {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    } catch (error) {
        console.error('Error formateando moneda sin decimales:', error);
        return `$${Math.round(value)}`;
    }
}

// ========================================
// FORMATEO DE NÚMEROS
// ========================================

/**
 * Formatea un número con separadores de miles
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Número de decimales
 * @returns {string} - Número formateado
 */
export function formatNumber(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    
    try {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value);
    } catch (error) {
        console.error('Error formateando número:', error);
        return value.toFixed(decimals);
    }
}

/**
 * Formatea un número como porcentaje
 * @param {number} value - Valor a formatear (0.15 = 15%)
 * @param {number} decimals - Número de decimales
 * @returns {string} - Porcentaje formateado
 */
export function formatPercentage(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) return '0%';
    
    try {
        return new Intl.NumberFormat('es-MX', {
            style: 'percent',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(value / 100);
    } catch (error) {
        console.error('Error formateando porcentaje:', error);
        return `${value.toFixed(decimals)}%`;
    }
}

/**
 * Formatea un número como cantidad de productos
 * @param {number} value - Cantidad
 * @returns {string} - Cantidad formateada
 */
export function formatQuantity(value) {
    if (value === null || value === undefined || isNaN(value)) return '0';
    
    return formatNumber(value, 0);
}

// ========================================
// FORMATEO DE TEXTOS
// ========================================

/**
 * Capitaliza la primera letra de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto capitalizado
 */
export function capitalize(text) {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Capitaliza cada palabra de un texto
 * @param {string} text - Texto a capitalizar
 * @returns {string} - Texto con cada palabra capitalizada
 */
export function capitalizeWords(text) {
    if (!text || typeof text !== 'string') return '';
    return text.split(' ').map(word => capitalize(word)).join(' ');
}

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @param {string} suffix - Sufijo a añadir
 * @returns {string} - Texto truncado
 */
export function truncateText(text, maxLength = 50, suffix = '...') {
    if (!text || typeof text !== 'string') return '';
    if (text.length <= maxLength) return text;
    
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Convierte un texto a slug (URL amigable)
 * @param {string} text - Texto a convertir
 * @returns {string} - Slug generado
 */
export function slugify(text) {
    if (!text || typeof text !== 'string') return '';
    
    return text
        .toLowerCase()
        .replace(/[áäâàã]/g, 'a')
        .replace(/[éëêè]/g, 'e')
        .replace(/[íïîì]/g, 'i')
        .replace(/[óöôòõ]/g, 'o')
        .replace(/[úüûù]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

/**
 * Formatea un teléfono mexicano
 * @param {string} phone - Número de teléfono
 * @returns {string} - Teléfono formateado
 */
export function formatPhone(phone) {
    if (!phone || typeof phone !== 'string') return '';
    
    // Eliminar caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Formato para 10 dígitos: 55 1234 5678
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`;
    }
    
    // Formato para 12 dígitos (con lada internacional): +52 55 1234 5678
    if (cleaned.length === 12) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
    }
    
    return phone;
}

/**
 * Formatea un RFC mexicano
 * @param {string} rfc - RFC a formatear
 * @returns {string} - RFC formateado
 */
export function formatRFC(rfc) {
    if (!rfc || typeof rfc !== 'string') return '';
    
    const cleaned = rfc.replace(/\s/g, '').toUpperCase();
    
    // RFC persona moral: 12 caracteres
    if (cleaned.length === 12) {
        return `${cleaned.slice(0, 3)}${cleaned.slice(3, 6)}${cleaned.slice(6, 9)}${cleaned.slice(9)}`;
    }
    
    // RFC persona física: 13 caracteres
    if (cleaned.length === 13) {
        return `${cleaned.slice(0, 4)}${cleaned.slice(4, 6)}${cleaned.slice(6, 9)}${cleaned.slice(9)}`;
    }
    
    return cleaned;
}

// ========================================
// FORMATEO DE CÓDIGOS
// ========================================

/**
 * Formatea un código de barras
 * @param {string} barcode - Código de barras
 * @returns {string} - Código formateado
 */
export function formatBarcode(barcode) {
    if (!barcode || typeof barcode !== 'string') return '';
    
    // EAN-13: agrupar en 1-6-6
    if (barcode.length === 13) {
        return `${barcode.slice(0, 1)} ${barcode.slice(1, 7)} ${barcode.slice(7)}`;
    }
    
    return barcode;
}

/**
 * Formatea un SKU
 * @param {string} sku - SKU a formatear
 * @returns {string} - SKU formateado
 */
export function formatSKU(sku) {
    if (!sku || typeof sku !== 'string') return '';
    
    return sku.toUpperCase().replace(/\s/g, '-');
}

// ========================================
// FORMATEO DE UNIDADES
// ========================================

/**
 * Formatea un peso en kilogramos
 * @param {number} weight - Peso en kg
 * @returns {string} - Peso formateado
 */
export function formatWeight(weight) {
    if (weight === null || weight === undefined || isNaN(weight)) return '0 kg';
    
    if (weight < 1) {
        return `${(weight * 1000).toFixed(0)} g`;
    }
    
    return `${formatNumber(weight, 2)} kg`;
}

/**
 * Formatea dimensiones (largo x ancho x alto)
 * @param {Object} dimensions - Objeto con largo, ancho, alto
 * @returns {string} - Dimensiones formateadas
 */
export function formatDimensions(dimensions) {
    if (!dimensions) return '';
    
    const { length, width, height } = dimensions;
    
    if (!length && !width && !height) return '';
    
    return `${length || 0} x ${width || 0} x ${height || 0} cm`;
}

// ========================================
// FORMATEO DE ESTADOS
// ========================================

/**
 * Formatea un estado con clase CSS
 * @param {string} status - Estado
 * @param {Object} statusMap - Mapa de estados a etiquetas
 * @returns {Object} - Objeto con label y className
 */
export function formatStatus(status, statusMap = {}) {
    const defaultStatusMap = {
        active: { label: 'Activo', className: 'status-active' },
        inactive: { label: 'Inactivo', className: 'status-inactive' },
        pending: { label: 'Pendiente', className: 'status-pending' },
        blocked: { label: 'Bloqueado', className: 'status-blocked' },
        deleted: { label: 'Eliminado', className: 'status-deleted' }
    };
    
    const map = { ...defaultStatusMap, ...statusMap };
    
    return map[status] || { label: status, className: '' };
}

/**
 * Formatea un tipo de movimiento de inventario
 * @param {string} type - Tipo de movimiento
 * @returns {Object} - Objeto con label e icono
 */
export function formatMovementType(type) {
    const types = {
        purchase: { label: 'Compra', icon: 'shopping-cart', color: 'success' },
        sale: { label: 'Venta', icon: 'cash-register', color: 'info' },
        adjustment: { label: 'Ajuste', icon: 'balance-scale', color: 'warning' },
        return: { label: 'Devolución', icon: 'undo', color: 'primary' },
        transfer: { label: 'Transferencia', icon: 'exchange-alt', color: 'secondary' },
        damage: { label: 'Daño', icon: 'exclamation-triangle', color: 'error' },
        expiry: { label: 'Caducidad', icon: 'calendar-times', color: 'error' }
    };
    
    return types[type] || { label: type, icon: 'circle', color: 'default' };
}

// ========================================
// FORMATEO DE BYTES
// ========================================

/**
 * Formatea bytes a unidades legibles (KB, MB, GB)
 * @param {number} bytes - Cantidad de bytes
 * @param {number} decimals - Número de decimales
 * @returns {string} - Tamaño formateado
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    if (!bytes || isNaN(bytes)) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// ========================================
// FORMATEO DE TIEMPO
// ========================================

/**
 * Formatea segundos a formato mm:ss o hh:mm:ss
 * @param {number} seconds - Segundos totales
 * @returns {string} - Tiempo formateado
 */
export function formatDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds < 0) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}