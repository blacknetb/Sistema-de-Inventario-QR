/**
 * Sistema de validación centralizado usando Yup
 * Esquemas para todos los formularios de la aplicación
 */

import * as yup from 'yup';

// ==================== MÉTODOS PERSONALIZADOS YUP ====================

// ✅ MÉTODO PARA VALIDAR FORMATO DE SKU
yup.addMethod(yup.string, 'skuFormat', function(message = 'Formato de SKU inválido') {
  return this.test('sku-format', message, function(value) {
    if (!value) return true;
    const skuRegex = /^[A-Z0-9-]{3,50}$/;
    return skuRegex.test(value.trim());
  });
});

// ✅ MÉTODO PARA VALIDAR STOCK MÁXIMO > MÍNIMO
yup.addMethod(yup.number, 'maxStockGreaterThanMin', function(message = 'El stock máximo debe ser mayor al stock mínimo') {
  return this.test('max-greater-than-min', message, function(value) {
    const { min_stock } = this.parent;
    if (value === undefined || min_stock === undefined) return true;
    return value > min_stock;
  });
});

// ==================== ESQUEMAS DE VALIDACIÓN ====================

/**
 * ✅ ESQUEMA DE AUTENTICACIÓN
 */
export const authSchema = {
  login: yup.object().shape({
    email: yup
      .string()
      .trim()
      .email('Ingrese un email válido')
      .required('El email es requerido')
      .max(255, 'El email no puede exceder 255 caracteres'),
    
    password: yup
      .string()
      .required('La contraseña es requerida')
      .min(6, 'La contraseña debe tener al menos 6 caracteres')
      .max(128, 'La contraseña no puede exceder 128 caracteres')
  }),
  
  register: yup.object().shape({
    name: yup
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255, 'El nombre no puede exceder 255 caracteres')
      .required('El nombre es requerido'),
    
    email: yup
      .string()
      .trim()
      .email('Ingrese un email válido')
      .required('El email es requerido')
      .max(255, 'El email no puede exceder 255 caracteres'),
    
    password: yup
      .string()
      .required('La contraseña es requerida')
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(128, 'La contraseña no puede exceder 128 caracteres'),
    
    confirmPassword: yup
      .string()
      .required('Confirme la contraseña')
      .oneOf([yup.ref('password'), null], 'Las contraseñas deben coincidir')
  }),
};

/**
 * ✅ ESQUEMA DE PRODUCTO
 */
export const productSchema = {
  full: yup.object().shape({
    name: yup
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255, 'El nombre no puede exceder 255 caracteres')
      .required('El nombre es requerido'),
    
    description: yup
      .string()
      .trim()
      .max(2000, 'La descripción no puede exceder 2000 caracteres')
      .nullable(),
    
    sku: yup
      .string()
      .trim()
      .required('El SKU es requerido')
      .min(3, 'El SKU debe tener al menos 3 caracteres')
      .max(50, 'El SKU no puede exceder 50 caracteres')
      .skuFormat(),
    
    category_id: yup
      .number()
      .typeError('Seleccione una categoría válida')
      .positive('Seleccione una categoría válida')
      .integer('Seleccione una categoría válida')
      .required('La categoría es requerida'),
    
    price: yup
      .number()
      .typeError('Ingrese un precio válido')
      .min(0, 'El precio debe ser mayor o igual a 0')
      .max(9999999.99, 'El precio no puede exceder 9,999,999.99')
      .required('El precio es requerido'),
    
    cost: yup
      .number()
      .typeError('Ingrese un costo válido')
      .min(0, 'El costo debe ser mayor o igual a 0')
      .max(9999999.99, 'El costo no puede exceder 9,999,999.99')
      .required('El costo es requerido'),
    
    min_stock: yup
      .number()
      .typeError('Ingrese un stock mínimo válido')
      .min(0, 'El stock mínimo debe ser mayor o igual a 0')
      .max(999999, 'El stock mínimo no puede exceder 999,999')
      .integer('El stock mínimo debe ser un número entero')
      .required('El stock mínimo es requerido'),
    
    max_stock: yup
      .number()
      .typeError('Ingrese un stock máximo válido')
      .min(1, 'El stock máximo debe ser mayor a 0')
      .max(999999, 'El stock máximo no puede exceder 999,999')
      .integer('El stock máximo debe ser un número entero')
      .required('El stock máximo es requerido')
      .maxStockGreaterThanMin(),
    
    unit: yup
      .string()
      .trim()
      .max(50, 'La unidad no puede exceder 50 caracteres')
      .required('La unidad es requerida'),
    
    status: yup
      .string()
      .oneOf(['active', 'inactive', 'discontinued', 'archived'], 'Estado inválido')
      .required('El estado es requerido'),
  }),
  
  quick: yup.object().shape({
    name: yup
      .string()
      .trim()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(255, 'El nombre no puede exceder 255 caracteres')
      .required('El nombre es requerido'),
    
    sku: yup
      .string()
      .trim()
      .required('El SKU es requerido')
      .min(3, 'El SKU debe tener al menos 3 caracteres')
      .max(50, 'El SKU no puede exceder 50 caracteres')
      .skuFormat(),
    
    category_id: yup
      .number()
      .typeError('Seleccione una categoría válida')
      .positive('Seleccione una categoría válida')
      .required('La categoría es requerida'),
    
    price: yup
      .number()
      .typeError('Ingrese un precio válido')
      .min(0, 'El precio debe ser mayor o igual a 0')
      .max(9999999.99, 'El precio no puede exceder 9,999,999.99')
      .required('El precio es requerido')
  })
};

/**
 * ✅ ESQUEMA DE MOVIMIENTO DE INVENTARIO
 */
export const inventoryMovementSchema = yup.object().shape({
  product_id: yup
    .number()
    .typeError('Seleccione un producto válido')
    .positive('Seleccione un producto válido')
    .integer('Seleccione un producto válido')
    .required('El producto es requerido'),
  
  quantity: yup
    .number()
    .typeError('Ingrese una cantidad válida')
    .min(1, 'La cantidad debe ser mayor a 0')
    .max(999999, 'La cantidad no puede exceder 999,999')
    .integer('La cantidad debe ser un número entero')
    .required('La cantidad es requerida'),
  
  movement_type: yup
    .string()
    .oneOf(['entry', 'exit', 'adjustment', 'transfer', 'count'], 'Tipo de movimiento inválido')
    .required('El tipo de movimiento es requerido'),
  
  reason: yup
    .string()
    .trim()
    .min(3, 'El motivo debe tener al menos 3 caracteres')
    .max(500, 'El motivo no puede exceder 500 caracteres')
    .required('El motivo es requerido')
});

// ==================== FUNCIONES DE VALIDACIÓN ====================

/**
 * ✅ VALIDAR FORMULARIO
 */
export const validateForm = async (schema, data, options = {}) => {
  try {
    const validatedData = await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      ...options
    });
    
    return {
      success: true,
      data: validatedData,
      errors: null
    };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      const errors = error.inner.reduce((acc, err) => {
        const path = err.path || 'general';
        if (!acc[path]) {
          acc[path] = err.message;
        }
        return acc;
      }, {});
      
      return {
        success: false,
        data: null,
        errors
      };
    }
    
    return {
      success: false,
      data: null,
      errors: { general: 'Error de validación' }
    };
  }
};

/**
 * ✅ OBTENER ERROR DE CAMPO
 */
export const getFieldError = (errors, fieldName) => {
  if (!errors || !fieldName) {
    return '';
  }
  
  if (errors[fieldName]) {
    return errors[fieldName];
  }
  
  return '';
};

/**
 * ✅ VALIDAR ARCHIVO
 */
export const validateFile = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
  } = options;
  
  if (!file) {
    return {
      valid: false,
      error: 'No se proporcionó archivo'
    };
  }
  
  // Validar tamaño
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `El archivo excede el tamaño máximo de ${maxSize / (1024 * 1024)}MB`
    };
  }
  
  // Validar tipo MIME
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido'
    };
  }
  
  return {
    valid: true,
    error: null
  };
};

// ✅ EXPORTACIÓN POR DEFECTO
export default {
  // Esquemas
  authSchema,
  productSchema,
  inventoryMovementSchema,
  
  // Funciones de validación
  validateForm,
  getFieldError,
  validateFile
};