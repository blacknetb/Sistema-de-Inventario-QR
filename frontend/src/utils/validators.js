/**
 * validators.js - Funciones de validación para Inventory QR System
 * Proporciona validadores reutilizables para formularios y datos
 */

import { VALIDATION_RULES } from './constants';

// ========================================
// VALIDACIONES DE TEXTO
// ========================================

/**
 * Valida que un campo no esté vacío
 * @param {string} value - Valor a validar
 * @param {string} fieldName - Nombre del campo (para mensaje)
 * @returns {Object} - Resultado de la validación
 */
export function required(value, fieldName = 'Este campo') {
    if (value === null || value === undefined || value === '') {
        return {
            isValid: false,
            message: `${fieldName} es requerido`
        };
    }
    
    if (typeof value === 'string' && value.trim() === '') {
        return {
            isValid: false,
            message: `${fieldName} es requerido`
        };
    }
    
    if (Array.isArray(value) && value.length === 0) {
        return {
            isValid: false,
            message: `${fieldName} es requerido`
        };
    }
    
    return { isValid: true };
}

/**
 * Valida la longitud mínima de un texto
 * @param {string} value - Valor a validar
 * @param {number} min - Longitud mínima
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
export function minLength(value, min = VALIDATION_RULES.NAME_MIN_LENGTH, fieldName = 'Este campo') {
    if (!value) return { isValid: true };
    
    if (value.length < min) {
        return {
            isValid: false,
            message: `${fieldName} debe tener al menos ${min} caracteres`
        };
    }
    
    return { isValid: true };
}

/**
 * Valida la longitud máxima de un texto
 * @param {string} value - Valor a validar
 * @param {number} max - Longitud máxima
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
export function maxLength(value, max = VALIDATION_RULES.NAME_MAX_LENGTH, fieldName = 'Este campo') {
    if (!value) return { isValid: true };
    
    if (value.length > max) {
        return {
            isValid: false,
            message: `${fieldName} debe tener máximo ${max} caracteres`
        };
    }
    
    return { isValid: true };
}

/**
 * Valida que un texto tenga una longitud exacta
 * @param {string} value - Valor a validar
 * @param {number} length - Longitud exacta
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
export function exactLength(value, length, fieldName = 'Este campo') {
    if (!value) return { isValid: true };
    
    if (value.length !== length) {
        return {
            isValid: false,
            message: `${fieldName} debe tener exactamente ${length} caracteres`
        };
    }
    
    return { isValid: true };
}

// ========================================
// VALIDACIONES DE EMAIL
// ========================================

/**
 * Valida un formato de email
 * @param {string} email - Email a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidEmail(email) {
    if (!email) return { isValid: true };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email)) {
        return {
            isValid: false,
            message: 'El correo electrónico no es válido'
        };
    }
    
    return { isValid: true };
}

// ========================================
// VALIDACIONES DE CONTRASEÑA
// ========================================

/**
 * Valida una contraseña según criterios de seguridad
 * @param {string} password - Contraseña a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidPassword(password) {
    if (!password) return { isValid: true };
    
    const errors = [];
    
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
        errors.push(`Mínimo ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} caracteres`);
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Al menos una mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Al menos una minúscula');
    }
    
    if (!/\d/.test(password)) {
        errors.push('Al menos un número');
    }
    
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Al menos un carácter especial');
    }
    
    if (errors.length > 0) {
        return {
            isValid: false,
            message: `La contraseña debe tener: ${errors.join(', ')}`
        };
    }
    
    return { isValid: true };
}

/**
 * Valida que dos contraseñas coincidan
 * @param {string} password - Contraseña
 * @param {string} confirmPassword - Confirmación
 * @returns {Object} - Resultado de la validación
 */
export function passwordsMatch(password, confirmPassword) {
    if (password !== confirmPassword) {
        return {
            isValid: false,
            message: 'Las contraseñas no coinciden'
        };
    }
    
    return { isValid: true };
}

// ========================================
// VALIDACIONES NUMÉRICAS
// ========================================

/**
 * Valida que un valor sea un número
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
export function isNumber(value, fieldName = 'Este campo') {
    if (value === null || value === undefined || value === '') return { isValid: true };
    
    if (isNaN(parseFloat(value)) || !isFinite(value)) {
        return {
            isValid: false,
            message: `${fieldName} debe ser un número válido`
        };
    }
    
    return { isValid: true };
}

/**
 * Valida que un número sea positivo
 * @param {number} value - Valor a validar
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
export function isPositive(value, fieldName = 'Este campo') {
    if (value === null || value === undefined || value === '') return { isValid: true };
    
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return {
            isValid: false,
            message: `${fieldName} debe ser un número válido`
        };
    }
    
    if (num < 0) {
        return {
            isValid: false,
            message: `${fieldName} debe ser un número positivo`
        };
    }
    
    return { isValid: true };
}

/**
 * Valida que un número esté dentro de un rango
 * @param {number} value - Valor a validar
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} - Resultado de la validación
 */
export function isInRange(value, min, max, fieldName = 'Este campo') {
    if (value === null || value === undefined || value === '') return { isValid: true };
    
    const num = parseFloat(value);
    
    if (isNaN(num)) {
        return {
            isValid: false,
            message: `${fieldName} debe ser un número válido`
        };
    }
    
    if (num < min || num > max) {
        return {
            isValid: false,
            message: `${fieldName} debe estar entre ${min} y ${max}`
        };
    }
    
    return { isValid: true };
}

/**
 * Valida un precio
 * @param {number} price - Precio a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidPrice(price) {
    return isInRange(
        price, 
        VALIDATION_RULES.PRICE_MIN, 
        VALIDATION_RULES.PRICE_MAX, 
        'El precio'
    );
}

/**
 * Valida una cantidad de stock
 * @param {number} stock - Stock a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidStock(stock) {
    return isInRange(
        stock, 
        VALIDATION_RULES.STOCK_MIN, 
        VALIDATION_RULES.STOCK_MAX, 
        'El stock'
    );
}

// ========================================
// VALIDACIONES DE TELÉFONO
// ========================================

/**
 * Valida un número de teléfono mexicano
 * @param {string} phone - Teléfono a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidPhone(phone) {
    if (!phone) return { isValid: true };
    
    // Eliminar caracteres no numéricos
    const cleaned = phone.replace(/\D/g, '');
    
    // Validar longitud (10 dígitos para México)
    if (cleaned.length !== 10 && cleaned.length !== 12) {
        return {
            isValid: false,
            message: 'El teléfono debe tener 10 dígitos'
        };
    }
    
    return { isValid: true };
}

// ========================================
// VALIDACIONES DE RFC
// ========================================

/**
 * Valida un RFC mexicano
 * @param {string} rfc - RFC a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidRFC(rfc) {
    if (!rfc) return { isValid: true };
    
    const cleaned = rfc.replace(/\s/g, '').toUpperCase();
    
    // RFC persona moral: 12 caracteres, persona física: 13
    const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    
    if (!rfcRegex.test(cleaned)) {
        return {
            isValid: false,
            message: 'El RFC no tiene un formato válido'
        };
    }
    
    // Validar longitud
    if (cleaned.length !== 12 && cleaned.length !== 13) {
        return {
            isValid: false,
            message: 'El RFC debe tener 12 o 13 caracteres'
        };
    }
    
    return { isValid: true };
}

// ========================================
// VALIDACIONES DE CÓDIGOS
// ========================================

/**
 * Valida un código de barras EAN-13
 * @param {string} barcode - Código de barras
 * @returns {Object} - Resultado de la validación
 */
export function isValidBarcode(barcode) {
    if (!barcode) return { isValid: true };
    
    const cleaned = barcode.replace(/\D/g, '');
    
    if (cleaned.length !== 13) {
        return {
            isValid: false,
            message: 'El código de barras debe tener 13 dígitos'
        };
    }
    
    // Validar dígito de control
    const digits = cleaned.split('').map(Number);
    const checksum = digits.pop();
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
        sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    
    const calculatedChecksum = (10 - (sum % 10)) % 10;
    
    if (calculatedChecksum !== checksum) {
        return {
            isValid: false,
            message: 'El código de barras no es válido'
        };
    }
    
    return { isValid: true };
}

/**
 * Valida un SKU
 * @param {string} sku - SKU a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidSKU(sku) {
    if (!sku) return { isValid: true };
    
    const maxLength = VALIDATION_RULES.SKU_MAX_LENGTH;
    
    if (sku.length > maxLength) {
        return {
            isValid: false,
            message: `El SKU debe tener máximo ${maxLength} caracteres`
        };
    }
    
    // Solo letras, números y guiones
    const skuRegex = /^[A-Za-z0-9-]+$/;
    
    if (!skuRegex.test(sku)) {
        return {
            isValid: false,
            message: 'El SKU solo puede contener letras, números y guiones'
        };
    }
    
    return { isValid: true };
}

// ========================================
// VALIDACIONES DE FECHAS
// ========================================

/**
 * Valida que una fecha sea válida
 * @param {string|Date} date - Fecha a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidDate(date) {
    if (!date) return { isValid: true };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
        return {
            isValid: false,
            message: 'La fecha no es válida'
        };
    }
    
    return { isValid: true };
}

/**
 * Valida que una fecha sea posterior a hoy
 * @param {string|Date} date - Fecha a validar
 * @returns {Object} - Resultado de la validación
 */
export function isFutureDate(date) {
    if (!date) return { isValid: true };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateObj < today) {
        return {
            isValid: false,
            message: 'La fecha debe ser posterior a hoy'
        };
    }
    
    return { isValid: true };
}

/**
 * Valida que una fecha de vencimiento sea válida
 * @param {string|Date} expiryDate - Fecha de vencimiento
 * @returns {Object} - Resultado de la validación
 */
export function isValidExpiryDate(expiryDate) {
    if (!expiryDate) return { isValid: true };
    
    const dateObj = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    const today = new Date();
    
    if (dateObj <= today) {
        return {
            isValid: false,
            message: 'La fecha de vencimiento debe ser futura'
        };
    }
    
    return { isValid: true };
}

// ========================================
// VALIDACIONES DE URL
// ========================================

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {Object} - Resultado de la validación
 */
export function isValidURL(url) {
    if (!url) return { isValid: true };
    
    try {
        new URL(url);
        return { isValid: true };
    } catch {
        return {
            isValid: false,
            message: 'La URL no es válida'
        };
    }
}

// ========================================
// VALIDACIONES COMBINADAS
// ========================================

/**
 * Valida un objeto completo contra un esquema
 * @param {Object} data - Objeto a validar
 * @param {Object} schema - Esquema de validación
 * @returns {Object} - Resultado con errores por campo
 */
export function validateSchema(data, schema) {
    const errors = {};
    
    Object.keys(schema).forEach(field => {
        const validations = schema[field];
        const value = data[field];
        
        validations.forEach(validation => {
            const result = validation(value);
            if (!result.isValid) {
                if (!errors[field]) {
                    errors[field] = [];
                }
                errors[field].push(result.message);
            }
        });
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}