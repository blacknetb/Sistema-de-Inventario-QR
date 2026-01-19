import { INVENTORY_CONSTANTS, MESSAGES } from './constants';

/**
 * Valida un campo requerido
 * @param {any} value - Valor a validar
 * @param {string} fieldName - Nombre del campo (opcional)
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateRequired = (value, fieldName = 'Campo') => {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} es requerido`;
  }
  if (Array.isArray(value) && value.length === 0) {
    return `${fieldName} debe tener al menos un elemento`;
  }
  return null;
};

/**
 * Valida un campo numérico
 * @param {any} value - Valor a validar
 * @param {object} options - Opciones de validación
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, integer = false, positive = false } = options;
  
  if (value === null || value === undefined || value === '') {
    return null; // No validar si está vacío (usar validateRequired para campos obligatorios)
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return MESSAGES.ERROR.INVALID_NUMBER;
  }
  
  if (integer && !Number.isInteger(num)) {
    return 'Debe ser un número entero';
  }
  
  if (positive && num < 0) {
    return 'Debe ser un número positivo';
  }
  
  if (min !== undefined && num < min) {
    return `El valor mínimo es ${min}`;
  }
  
  if (max !== undefined && num > max) {
    return `El valor máximo es ${max}`;
  }
  
  return null;
};

/**
 * Valida un precio
 * @param {any} value - Valor a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validatePrice = (value) => {
  const numberError = validateNumber(value, { min: 0 });
  if (numberError) return numberError;
  
  if (Number(value) <= 0) {
    return MESSAGES.ERROR.INVALID_PRICE;
  }
  
  return null;
};

/**
 * Valida una cantidad
 * @param {any} value - Valor a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateQuantity = (value) => {
  const numberError = validateNumber(value, { min: 0, integer: true });
  if (numberError) return numberError;
  
  if (!Number.isInteger(Number(value))) {
    return MESSAGES.ERROR.INVALID_QUANTITY;
  }
  
  return null;
};

/**
 * Valida un correo electrónico
 * @param {string} email - Email a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateEmail = (email) => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Ingresa un correo electrónico válido';
  }
  
  return null;
};

/**
 * Valida un teléfono
 * @param {string} phone - Teléfono a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validatePhone = (phone) => {
  if (!phone) return null;
  
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
  if (!phoneRegex.test(phone.replace(/\s/g, ''))) {
    return 'Ingresa un número de teléfono válido';
  }
  
  return null;
};

/**
 * Valida una URL
 * @param {string} url - URL a validar
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateURL = (url) => {
  if (!url) return null;
  
  try {
    new URL(url);
    return null;
  } catch {
    return 'Ingresa una URL válida';
  }
};

/**
 * Valida una fecha
 * @param {string} date - Fecha a validar
 * @param {object} options - Opciones de validación
 * @returns {string|null} Mensaje de error o null si es válido
 */
export const validateDate = (date, options = {}) => {
  if (!date) return null;
  
  const { minDate, maxDate, futureOnly = false, pastOnly = false } = options;
  const inputDate = new Date(date);
  const today = new Date();
  
  if (isNaN(inputDate.getTime())) {
    return 'Fecha inválida';
  }
  
  if (futureOnly && inputDate <= today) {
    return 'La fecha debe ser futura';
  }
  
  if (pastOnly && inputDate >= today) {
    return 'La fecha debe ser pasada';
  }
  
  if (minDate && inputDate < new Date(minDate)) {
    return `La fecha no puede ser anterior a ${new Date(minDate).toLocaleDateString()}`;
  }
  
  if (maxDate && inputDate > new Date(maxDate)) {
    return `La fecha no puede ser posterior a ${new Date(maxDate).toLocaleDateString()}`;
  }
  
  return null;
};

/**
 * Valida un formulario completo de producto
 * @param {object} formData - Datos del formulario
 * @returns {object} Objeto con errores
 */
export const validateProductForm = (formData) => {
  const errors = {};
  
  // Validar nombre
  const nameError = validateRequired(formData.name, 'Nombre del producto');
  if (nameError) errors.name = nameError;
  
  // Validar categoría
  const categoryError = validateRequired(formData.category, 'Categoría');
  if (categoryError) errors.category = categoryError;
  
  // Validar cantidad
  const quantityError = validateQuantity(formData.quantity);
  if (quantityError) errors.quantity = quantityError;
  
  // Validar precio
  const priceError = validatePrice(formData.price);
  if (priceError) errors.price = priceError;
  
  // Validar descripción (si existe)
  if (formData.description && formData.description.length > 1000) {
    errors.description = 'La descripción no puede exceder los 1000 caracteres';
  }
  
  return errors;
};

/**
 * Valida si hay errores en un objeto de errores
 * @param {object} errors - Objeto de errores
 * @returns {boolean} True si hay errores
 */
export const hasErrors = (errors) => {
  return Object.values(errors).some(error => error !== null && error !== undefined && error !== '');
};

/**
 * Limpia los errores de un formulario
 * @param {object} errors - Objeto de errores
 * @returns {object} Objeto de errores limpio
 */
export const cleanErrors = (errors) => {
  const cleaned = {};
  Object.keys(errors).forEach(key => {
    if (errors[key]) {
      cleaned[key] = errors[key];
    }
  });
  return cleaned;
};