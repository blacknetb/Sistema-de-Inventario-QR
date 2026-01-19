import { useState, useCallback } from 'react';

/**
 * Hook para validación de formularios del inventario
 * @param {Object} validationRules - Reglas de validación
 * @returns {Object} Funciones y estado de validación
 */
const useFormValidation = (validationRules = {}) => {
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValid, setIsValid] = useState(false);

  // Reglas de validación por defecto para items de inventario
  const defaultRules = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_.,áéíóúÁÉÍÓÚñÑ]+$/,
      message: 'El nombre debe tener entre 2 y 100 caracteres y solo puede contener letras, números y espacios'
    },
    category: {
      required: true,
      message: 'La categoría es requerida'
    },
    quantity: {
      required: true,
      min: 0,
      pattern: /^\d+$/,
      message: 'La cantidad debe ser un número entero no negativo'
    },
    price: {
      required: true,
      min: 0.01,
      pattern: /^\d+(\.\d{1,2})?$/,
      message: 'El precio debe ser un número positivo con máximo 2 decimales'
    },
    cost: {
      min: 0,
      pattern: /^\d+(\.\d{1,2})?$/,
      message: 'El costo debe ser un número no negativo con máximo 2 decimales'
    },
    sku: {
      pattern: /^[A-Z0-9\-_]+$/,
      message: 'El SKU solo puede contener letras mayúsculas, números, guiones y guiones bajos'
    },
    barcode: {
      pattern: /^[0-9]{8,13}$/,
      message: 'El código de barras debe tener entre 8 y 13 dígitos'
    },
    minStock: {
      min: 0,
      pattern: /^\d+$/,
      message: 'El stock mínimo debe ser un número entero no negativo'
    },
    maxStock: {
      min: 0,
      pattern: /^\d+$/,
      message: 'El stock máximo debe ser un número entero no negativo'
    }
  };

  const rules = { ...defaultRules, ...validationRules };

  // Validar un campo individual
  const validateField = useCallback((name, value) => {
    const rule = rules[name];
    if (!rule) return null;

    const errors = [];

    // Validar campo requerido
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push('Este campo es requerido');
      return errors;
    }

    // Si el campo no es requerido y está vacío, no validar más
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return null;
    }

    // Validar longitud mínima
    if (rule.minLength && String(value).length < rule.minLength) {
      errors.push(`Debe tener al menos ${rule.minLength} caracteres`);
    }

    // Validar longitud máxima
    if (rule.maxLength && String(value).length > rule.maxLength) {
      errors.push(`No puede tener más de ${rule.maxLength} caracteres`);
    }

    // Validar valor mínimo
    if (rule.min !== undefined && Number(value) < rule.min) {
      errors.push(`El valor mínimo es ${rule.min}`);
    }

    // Validar valor máximo
    if (rule.max !== undefined && Number(value) > rule.max) {
      errors.push(`El valor máximo es ${rule.max}`);
    }

    // Validar patrón
    if (rule.pattern && !rule.pattern.test(String(value))) {
      errors.push(rule.message || 'Formato inválido');
    }

    // Validar coincidencia
    if (rule.equalsTo && value !== rule.equalsTo.value) {
      errors.push(rule.equalsTo.message || 'Los valores no coinciden');
    }

    // Validación personalizada
    if (rule.custom && typeof rule.custom === 'function') {
      const customError = rule.custom(value);
      if (customError) {
        errors.push(customError);
      }
    }

    return errors.length > 0 ? errors : null;
  }, [rules]);

  // Validar múltiples campos
  const validateFields = useCallback((fields) => {
    const newErrors = {};
    let hasErrors = false;

    Object.keys(fields).forEach(fieldName => {
      const fieldErrors = validateField(fieldName, fields[fieldName]);
      if (fieldErrors) {
        newErrors[fieldName] = fieldErrors;
        hasErrors = true;
      }
    });

    // Validaciones cruzadas
    if (fields.minStock !== undefined && fields.maxStock !== undefined) {
      const minStock = parseInt(fields.minStock);
      const maxStock = parseInt(fields.maxStock);
      
      if (!isNaN(minStock) && !isNaN(maxStock) && minStock > maxStock) {
        newErrors.minStock = newErrors.minStock || [];
        newErrors.minStock.push('El stock mínimo no puede ser mayor al máximo');
        newErrors.maxStock = newErrors.maxStock || [];
        newErrors.maxStock.push('El stock máximo no puede ser menor al mínimo');
        hasErrors = true;
      }
    }

    if (fields.cost !== undefined && fields.price !== undefined) {
      const cost = parseFloat(fields.cost);
      const price = parseFloat(fields.price);
      
      if (!isNaN(cost) && !isNaN(price) && cost > price) {
        newErrors.cost = newErrors.cost || [];
        newErrors.cost.push('El costo no puede ser mayor al precio de venta');
        hasErrors = true;
      }
    }

    setErrors(newErrors);
    setIsValid(!hasErrors);
    
    return {
      isValid: !hasErrors,
      errors: newErrors
    };
  }, [validateField]);

  // Validar formulario completo
  const validateForm = useCallback((formData) => {
    return validateFields(formData);
  }, [validateFields]);

  // Marcar campo como tocado
  const markAsTouched = useCallback((fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  // Marcar múltiples campos como tocados
  const markMultipleAsTouched = useCallback((fieldNames) => {
    const newTouched = { ...touched };
    fieldNames.forEach(fieldName => {
      newTouched[fieldName] = true;
    });
    setTouched(newTouched);
  }, [touched]);

  // Resetear validación
  const resetValidation = useCallback(() => {
    setErrors({});
    setTouched({});
    setIsValid(false);
  }, []);

  // Obtener mensaje de error para un campo
  const getFieldError = useCallback((fieldName) => {
    if (!errors[fieldName] || !touched[fieldName]) {
      return null;
    }
    
    return errors[fieldName][0] || 'Error desconocido';
  }, [errors, touched]);

  // Verificar si un campo tiene error
  const hasError = useCallback((fieldName) => {
    return !!errors[fieldName] && !!touched[fieldName];
  }, [errors, touched]);

  // Validar item completo del inventario
  const validateInventoryItem = useCallback((item) => {
    const requiredFields = ['name', 'category', 'quantity', 'price'];
    const validationResult = validateFields(item);
    
    // Verificar campos requeridos
    const missingFields = requiredFields.filter(field => 
      !item[field] && item[field] !== 0
    );
    
    if (missingFields.length > 0) {
      const newErrors = { ...validationResult.errors };
      missingFields.forEach(field => {
        newErrors[field] = ['Este campo es requerido'];
      });
      
      setErrors(newErrors);
      setIsValid(false);
      
      return {
        isValid: false,
        errors: newErrors,
        missingFields
      };
    }
    
    return validationResult;
  }, [validateFields]);

  // Validar importación masiva
  const validateBulkImport = useCallback((items) => {
    const results = {
      validItems: [],
      invalidItems: [],
      errors: []
    };
    
    items.forEach((item, index) => {
      const validation = validateInventoryItem(item);
      
      if (validation.isValid) {
        results.validItems.push({
          ...item,
          _importIndex: index
        });
      } else {
        results.invalidItems.push({
          ...item,
          _importIndex: index,
          errors: validation.errors
        });
        
        Object.entries(validation.errors).forEach(([field, fieldErrors]) => {
          results.errors.push({
            itemIndex: index,
            field,
            errors: fieldErrors,
            itemName: item.name || `Item ${index + 1}`
          });
        });
      }
    });
    
    return results;
  }, [validateInventoryItem]);

  // Generar resumen de validación
  const getValidationSummary = useCallback(() => {
    const errorCount = Object.keys(errors).reduce((count, field) => 
      count + (errors[field] ? errors[field].length : 0), 0
    );
    
    const touchedCount = Object.keys(touched).length;
    
    return {
      errorCount,
      touchedCount,
      fieldCount: Object.keys(rules).length,
      isValid,
      hasErrors: errorCount > 0
    };
  }, [errors, touched, isValid, rules]);

  // Crear esquema de validación dinámico
  const createValidationSchema = useCallback((customRules) => {
    return { ...rules, ...customRules };
  }, [rules]);

  return {
    // Estado
    errors,
    touched,
    isValid,
    
    // Setters
    setErrors,
    setTouched,
    setIsValid,
    
    // Funciones de validación
    validateField,
    validateFields,
    validateForm,
    validateInventoryItem,
    validateBulkImport,
    
    // Funciones de interacción
    markAsTouched,
    markMultipleAsTouched,
    resetValidation,
    
    // Utilidades
    getFieldError,
    hasError,
    getValidationSummary,
    createValidationSchema,
    
    // Información
    rules,
    defaultRules
  };
};

export default useFormValidation;