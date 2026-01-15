import { useState, useCallback } from 'react';

/**
 * Hook personalizado para manejar formularios
 */
const useForm = (initialState = {}, validations = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Marcar como tocado
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [errors]);

  /**
   * Maneja el evento blur de los campos
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    // Solo validar si hay una validación definida
    if (validations[name]) {
      const error = validations[name](formData[name], formData);
      setErrors(prev => ({
        ...prev,
        [name]: error || ''
      }));
    }
    
    // Marcar como tocado
    setTouched(prev => ({ ...prev, [name]: true }));
  }, [formData, validations]);

  /**
   * Valida todo el formulario
   */
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    Object.keys(validations).forEach(fieldName => {
      const validation = validations[fieldName];
      if (validation) {
        const error = validation(formData[fieldName], formData);
        if (error) {
          newErrors[fieldName] = error;
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, validations]);

  /**
   * Maneja el envío del formulario
   */
  const handleSubmit = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Validar antes de enviar
      if (!validateForm()) {
        throw new Error('Por favor, corrige los errores en el formulario');
      }
      
      await onSubmit(formData);
      return { success: true };
    } catch (error) {
      setErrors(prev => ({
        ...prev,
        submit: error.message || 'Error al procesar el formulario'
      }));
      return { success: false, error: error.message };
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm]);

  /**
   * Resetea el formulario
   */
  const resetForm = useCallback((newState = initialState) => {
    setFormData(newState);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialState]);

  /**
   * Actualiza valores del formulario manualmente
   */
  const setFieldValue = useCallback((name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  /**
   * Valida un campo específico
   */
  const validateField = useCallback((fieldName) => {
    if (validations[fieldName]) {
      const error = validations[fieldName](formData[fieldName], formData);
      setErrors(prev => ({
        ...prev,
        [fieldName]: error || ''
      }));
      return !error;
    }
    return true;
  }, [formData, validations]);

  /**
   * Obtiene si un campo es válido
   */
  const getFieldValidity = useCallback((fieldName) => {
    const hasError = !!errors[fieldName];
    const wasTouched = !!touched[fieldName];
    
    return {
      isValid: !hasError,
      isInvalid: hasError,
      wasTouched,
      error: errors[fieldName]
    };
  }, [errors, touched]);

  return {
    // Estado
    values: formData,
    errors,
    touched,
    isSubmitting,
    isValid: Object.keys(errors).length === 0,
    
    // Acciones
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setFieldValue,
    validateField,
    getFieldValidity,
    
    // Helpers
    register: (fieldName, options = {}) => ({
      name: fieldName,
      value: formData[fieldName] || '',
      onChange: handleChange,
      onBlur: handleBlur,
      'aria-invalid': !!errors[fieldName],
      'aria-describedby': errors[fieldName] ? `${fieldName}-error` : undefined,
      ...options
    }),
    
    // Métodos de conveniencia
    hasErrors: Object.keys(errors).length > 0,
    isFieldTouched: (fieldName) => !!touched[fieldName],
    isFieldValid: (fieldName) => !errors[fieldName]
  };
};

export default useForm;

/**
 * Funciones de validación comunes
 */
export const validators = {
  required: (message = 'Este campo es requerido') => 
    (value) => !value ? message : '',
  
  minLength: (min, message = `Debe tener al menos ${min} caracteres`) => 
    (value) => value && value.length < min ? message : '',
  
  maxLength: (max, message = `No puede exceder ${max} caracteres`) => 
    (value) => value && value.length > max ? message : '',
  
  email: (message = 'Email inválido') => 
    (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return value && !emailRegex.test(value) ? message : '';
    },
  
  numeric: (message = 'Debe ser un número') => 
    (value) => value && isNaN(Number(value)) ? message : '',
  
  min: (min, message = `Debe ser mayor o igual a ${min}`) => 
    (value) => value && Number(value) < min ? message : '',
  
  max: (max, message = `Debe ser menor o igual a ${max}`) => 
    (value) => value && Number(value) > max ? message : '',
  
  pattern: (regex, message = 'Formato inválido') => 
    (value) => value && !regex.test(value) ? message : '',
  
  custom: (validator, message) => 
    (value, formData) => {
      const result = validator(value, formData);
      return result ? (message || result) : '';
    }
};

/**
 * Combina múltiples validadores
 */
export const combineValidators = (...validators) => 
  (value, formData) => {
    for (const validator of validators) {
      const error = validator(value, formData);
      if (error) return error;
    }
    return '';
  };