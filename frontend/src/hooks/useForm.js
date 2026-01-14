import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * ✅ HOOK DE FORMULARIOS MEJORADO - VERSIÓN CORREGIDA
 * Correcciones aplicadas:
 * 1. Eliminada función recursiva deepClone que causaba stack overflow
 * 2. Implementado deepClone iterativo seguro
 * 3. Optimizado manejo de campos anidados
 * 4. Compatibilidad con backend de inventario
 */

// ✅ Tipos de inputs soportados
const INPUT_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  PASSWORD: 'password',
  NUMBER: 'number',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  FILE: 'file',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  DATE: 'date',
  TIME: 'time',
  DATETIME_LOCAL: 'datetime-local',
  COLOR: 'color',
  RANGE: 'range',
  URL: 'url',
  TEL: 'tel',
  SEARCH: 'search'
};

// ✅ Configuración por defecto optimizada
const DEFAULT_OPTIONS = {
  validateOnChange: true,
  validateOnBlur: true,
  validateOnSubmit: true,
  allowNestedFields: true,
  debounceValidation: 300,
  showAllErrorsOnSubmit: true,
  trimValues: true,
  autoTrimOnBlur: true
};

/**
 * ✅ MEJORA CORREGIDA: Deep clone iterativo (evita stack overflow)
 */
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  
  const stack = [{ original: obj, copy: Array.isArray(obj) ? [] : {} }];
  const visited = new Map();
  visited.set(obj, stack[0].copy);
  
  while (stack.length > 0) {
    const { original, copy } = stack.pop();
    
    for (const key in original) {
      if (Object.prototype.hasOwnProperty.call(original, key)) {
        const value = original[key];
        
        if (value === null || typeof value !== 'object') {
          copy[key] = value;
        } else if (visited.has(value)) {
          copy[key] = visited.get(value);
        } else {
          const newCopy = Array.isArray(value) ? [] : {};
          copy[key] = newCopy;
          visited.set(value, newCopy);
          stack.push({ original: value, copy: newCopy });
        }
      }
    }
  }
  
  return visited.get(obj);
};

/**
 * ✅ Hook principal para formularios - VERSIÓN CORREGIDA
 */
export const useForm = (initialState = {}, validators = {}, options = {}) => {
  // ✅ MEJORA: Merge de opciones
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  const {
    validateOnChange,
    validateOnBlur,
    validateOnSubmit,
    allowNestedFields,
    debounceValidation,
    trimValues,
    autoTrimOnBlur
  } = finalOptions;

  // ✅ Estado mejorado
  const [values, setValues] = useState(() => deepClone(initialState));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  
  // ✅ Refs optimizados
  const initialStateRef = useRef(deepClone(initialState));
  const validationTimeoutRef = useRef(null);
  const mountedRef = useRef(true);
  const validatorsRef = useRef(validators);

  /**
   * ✅ MEJORA CORREGIDA: Utilerías para campos anidados iterativas
   */
  const getNestedValue = useCallback((obj, path) => {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }
    
    return current;
  }, []);

  const setNestedValue = useCallback((obj, path, value) => {
    const keys = path.split('.');
    const newObj = deepClone(obj);
    let current = newObj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || current[key] === null) {
        current[key] = {};
      } else if (typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return newObj;
  }, []);

  const deleteNestedField = useCallback((obj, path) => {
    const keys = path.split('.');
    const newObj = deepClone(obj);
    let current = newObj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (current[key] === undefined || typeof current[key] !== 'object') {
        return newObj;
      }
      current = current[key];
    }
    
    delete current[keys[keys.length - 1]];
    return newObj;
  }, []);

  /**
   * ✅ Trimming de valores
   */
  const trimValue = useCallback((value, shouldTrim = trimValues) => {
    if (!shouldTrim || value === null || value === undefined) return value;
    if (typeof value === 'string') return value.trim();
    return value;
  }, [trimValues]);

  /**
   * ✅ Validación de campo individual
   */
  const validateField = useCallback(async (name, value, allValues = values) => {
    const validator = validatorsRef.current[name];
    
    if (!validator) return null;
    
    try {
      const result = await Promise.resolve(validator(value, allValues));
      return result || null;
    } catch (error) {
      return error.message || 'Error de validación';
    }
  }, [values]);

  /**
   * ✅ Validación con debounce
   */
  const validateFieldDebounced = useCallback((name, value, allValues) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    
    return new Promise((resolve) => {
      validationTimeoutRef.current = setTimeout(async () => {
        if (mountedRef.current) {
          const error = await validateField(name, value, allValues);
          resolve(error);
        }
      }, debounceValidation);
    });
  }, [debounceValidation, validateField]);

  /**
   * ✅ MEJORA CORREGIDA: Manejo de cambio en inputs optimizado
   */
  const handleChange = useCallback((e) => {
    const { name, value, type, checked, files, multiple } = e.target;
    
    let newValue;
    
    switch (type) {
      case INPUT_TYPES.CHECKBOX:
        newValue = checked;
        break;
      case INPUT_TYPES.FILE:
        newValue = multiple ? Array.from(files) : files[0];
        break;
      case INPUT_TYPES.NUMBER:
        newValue = value === '' ? '' : Number(value);
        if (isNaN(newValue)) newValue = '';
        break;
      case INPUT_TYPES.RANGE:
        newValue = Number(value);
        break;
      default:
        newValue = trimValue(value);
    }
    
    setValues(prev => {
      let newValues;
      if (allowNestedFields && name.includes('.')) {
        newValues = setNestedValue(prev, name, newValue);
      } else {
        newValues = { ...prev, [name]: newValue };
      }
      
      // ✅ Validación inmediata si está configurada
      if (validateOnChange && validatorsRef.current[name]) {
        validateFieldDebounced(name, newValue, newValues)
          .then(error => {
            if (mountedRef.current) {
              setErrors(errorsPrev => ({
                ...errorsPrev,
                [name]: error
              }));
            }
          });
      }
      
      return newValues;
    });

    // ✅ Limpiar error cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [
    allowNestedFields, errors, setNestedValue, trimValue, 
    validateFieldDebounced, validateOnChange
  ]);

  /**
   * ✅ Manejo de blur optimizado
   */
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    // ✅ Auto-trim en blur
    if (autoTrimOnBlur) {
      const currentValue = allowNestedFields && name.includes('.') 
        ? getNestedValue(values, name)
        : values[name];
      
      if (typeof currentValue === 'string') {
        const trimmedValue = currentValue.trim();
        if (trimmedValue !== currentValue) {
          setValues(prev => {
            if (allowNestedFields && name.includes('.')) {
              return setNestedValue(prev, name, trimmedValue);
            }
            return { ...prev, [name]: trimmedValue };
          });
        }
      }
    }

    // ✅ Validación al perder foco
    if (validateOnBlur) {
      const value = allowNestedFields && name.includes('.') 
        ? getNestedValue(values, name)
        : values[name];
      
      setIsValidating(true);
      validateField(name, value, values)
        .then(error => {
          if (mountedRef.current) {
            setErrors(prev => ({
              ...prev,
              [name]: error
            }));
            setIsValidating(false);
          }
        })
        .catch(() => {
          if (mountedRef.current) {
            setIsValidating(false);
          }
        });
    }
  }, [
    allowNestedFields, autoTrimOnBlur, getNestedValue, 
    setNestedValue, validateField, validateOnBlur, values
  ]);

  /**
   * ✅ Validación de todo el formulario
   */
  const validateAll = useCallback(async (valuesToValidate = values) => {
    setIsValidating(true);
    
    try {
      const validationErrors = {};
      const fieldNames = Object.keys(validatorsRef.current);
      
      for (const name of fieldNames) {
        const value = allowNestedFields && name.includes('.')
          ? getNestedValue(valuesToValidate, name)
          : valuesToValidate[name];
        
        const error = await validateField(name, value, valuesToValidate);
        if (error) {
          validationErrors[name] = error;
        }
      }
      
      setErrors(validationErrors);
      
      return {
        isValid: Object.keys(validationErrors).length === 0,
        errors: validationErrors
      };
    } finally {
      setIsValidating(false);
    }
  }, [allowNestedFields, getNestedValue, validateField, values]);

  /**
   * ✅ Manejo de submit avanzado
   */
  const handleSubmit = useCallback((onSubmit) => {
    return async (e) => {
      if (e) e.preventDefault();
      
      setIsSubmitting(true);
      setSubmitCount(prev => prev + 1);
      
      // ✅ Marcar todos los campos como tocados
      const allFields = Object.keys(values);
      const allTouched = {};
      allFields.forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);
      
      let validationResult = { isValid: true, errors: {} };
      
      // ✅ Validar antes de submit
      if (validateOnSubmit) {
        validationResult = await validateAll();
      }
      
      if (validationResult.isValid) {
        try {
          const result = await onSubmit(values, { 
            resetForm: () => resetForm(),
            setErrors: (newErrors) => setErrors(newErrors)
          });
          return result;
        } catch (error) {
          // ✅ Manejo de errores del servidor
          const serverErrors = error.response?.data?.errors || {};
          if (Object.keys(serverErrors).length > 0) {
            setErrors(serverErrors);
            
            // Scroll al primer error
            const firstError = Object.keys(serverErrors)[0];
            scrollToField(firstError);
          }
          throw error;
        } finally {
          setIsSubmitting(false);
        }
      } else {
        setIsSubmitting(false);
        
        // ✅ Scroll al primer error
        const firstError = Object.keys(validationResult.errors)[0];
        if (firstError) {
          scrollToField(firstError);
        }
      }
    };
  }, [validateAll, validateOnSubmit, values]);

  /**
   * ✅ Scroll a campo con error
   */
  const scrollToField = useCallback((fieldName) => {
    const element = document.querySelector(`[name="${fieldName}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      element.focus();
    }
  }, []);

  /**
   * ✅ Resetear formulario
   */
  const resetForm = useCallback((options = {}) => {
    const { 
      newInitialState,
      clearErrors = true,
      clearTouched = true 
    } = options;
    
    const stateToReset = newInitialState || initialStateRef.current;
    setValues(deepClone(stateToReset));
    if (clearErrors) setErrors({});
    if (clearTouched) setTouched({});
    setIsSubmitting(false);
  }, []);

  /**
   * ✅ Actualizar valores específicos
   */
  const setFieldValue = useCallback((name, value, options = {}) => {
    const { shouldValidate = false } = options;
    
    setValues(prev => {
      let newValues;
      if (allowNestedFields && name.includes('.')) {
        newValues = setNestedValue(prev, name, value);
      } else {
        newValues = { ...prev, [name]: value };
      }
      
      if (shouldValidate && validatorsRef.current[name]) {
        validateFieldDebounced(name, value, newValues)
          .then(error => {
            if (mountedRef.current) {
              setErrors(errorsPrev => ({
                ...errorsPrev,
                [name]: error
              }));
            }
          });
      }
      
      return newValues;
    });
  }, [allowNestedFields, setNestedValue, validateFieldDebounced]);

  /**
   * ✅ Actualizar múltiples valores
   */
  const setValuesBatch = useCallback((newValues, options = {}) => {
    const { shouldValidate = false } = options;
    
    setValues(prev => {
      let updated = { ...prev };
      
      for (const [key, value] of Object.entries(newValues)) {
        if (allowNestedFields && key.includes('.')) {
          updated = setNestedValue(updated, key, value);
        } else {
          updated[key] = value;
        }
      }
      
      if (shouldValidate) {
        for (const key of Object.keys(newValues)) {
          if (validatorsRef.current[key]) {
            const value = allowNestedFields && key.includes('.')
              ? getNestedValue(updated, key)
              : updated[key];
            
            validateFieldDebounced(key, value, updated)
              .then(error => {
                if (mountedRef.current) {
                  setErrors(errorsPrev => ({
                    ...errorsPrev,
                    [key]: error
                  }));
                }
              });
          }
        }
      }
      
      return updated;
    });
  }, [allowNestedFields, getNestedValue, setNestedValue, validateFieldDebounced]);

  /**
   * ✅ Propiedades para inputs
   */
  const getInputProps = useCallback(
  (name, inputOptions = {}) => {
    // Obtener valor (soporta campos anidados)
    const value =
      allowNestedFields && name.includes(".")
        ? getNestedValue(values, name) ?? ""
        : values[name] ?? "";

    // Obtener error
    const error = errors[name] || "";

    return {
      name,
      value,
      onChange: handleChange,
      onBlur: handleBlur,
      "aria-invalid": Boolean(error),
      "aria-describedby": error ? `${name}-error` : undefined,
      ...inputOptions,
    };
  },
  [allowNestedFields, errors, getNestedValue, handleBlur, handleChange, values]
);

  /**
   * ✅ Propiedades para campos completos
   */
  const getFieldProps = useCallback((name, fieldOptions = {}) => {
    const inputProps = getInputProps(name, fieldOptions);
    const error = errors[name] || '';
    const isTouched = touched[name] || false;
    const isValid = !error && isTouched;
    
    return {
      ...inputProps,
      error,
      touched: isTouched,
      valid: isValid,
      errorId: error ? `${name}-error` : undefined,
      helperText: fieldOptions.helperText,
      label: fieldOptions.label || name
    };
  }, [errors, getInputProps, touched]);

  /**
   * ✅ Agregar campo dinámicamente
   */
  const addField = useCallback((name, initialValue = '', options = {}) => {
    const { 
      validate = false,
      validator = null 
    } = options;
    
    if (validator) {
      validatorsRef.current[name] = validator;
    }
    
    setFieldValue(name, initialValue, { shouldValidate: validate });
  }, [setFieldValue]);

  /**
   * ✅ Eliminar campo
   */
  const removeField = useCallback((name, options = {}) => {
    const { 
      removeValidator = true,
      clearError = true,
      clearTouched = true 
    } = options;
    
    setValues(prev => {
      if (allowNestedFields && name.includes('.')) {
        return deleteNestedField(prev, name);
      }
      
      const newValues = { ...prev };
      delete newValues[name];
      return newValues;
    });
    
    if (removeValidator) {
      delete validatorsRef.current[name];
    }
    
    if (clearError) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    if (clearTouched) {
      setTouched(prev => {
        const newTouched = { ...prev };
        delete newTouched[name];
        return newTouched;
      });
    }
  }, [allowNestedFields, deleteNestedField]);

  /**
   * ✅ Verificar cambios en formulario
   */
  const hasChanges = useCallback(() => {
    return JSON.stringify(values) !== JSON.stringify(initialStateRef.current);
  }, [values]);

  /**
   * ✅ Obtener valores modificados
   */
  const getChangedValues = useCallback(() => {
    const changed = {};
    const initial = initialStateRef.current;
    
    const compare = (current, initial, path = '') => {
      const allKeys = new Set([...Object.keys(current), ...Object.keys(initial)]);
      
      for (const key of allKeys) {
        const fullPath = path ? `${path}.${key}` : key;
        const currentValue = current[key];
        const initialValue = initial[key];
        
        if (typeof currentValue === 'object' && currentValue !== null && 
            typeof initialValue === 'object' && initialValue !== null) {
          compare(currentValue, initialValue, fullPath);
        } else if (JSON.stringify(currentValue) !== JSON.stringify(initialValue)) {
          if (allowNestedFields) {
            changed[fullPath] = currentValue;
          } else {
            changed[key] = currentValue;
          }
        }
      }
    };
    
    compare(values, initial);
    return changed;
  }, [allowNestedFields, values]);

  // ✅ Cleanup
  useEffect(() => {
    mountedRef.current = true;
    validatorsRef.current = validators;
    
    return () => {
      mountedRef.current = false;
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [validators]);

  // ✅ Actualizar valores iniciales si cambian
  useEffect(() => {
    if (JSON.stringify(initialState) !== JSON.stringify(initialStateRef.current)) {
      initialStateRef.current = deepClone(initialState);
    }
  }, [initialState]);

  return {
    // Estado
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isValidating,
    
    // Acciones
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    
    // Utilidades
    setFieldValue,
    setValuesBatch,
    validateField,
    validateAll,
    getInputProps,
    getFieldProps,
    addField,
    removeField,
    hasChanges,
    getChangedValues,
    
    // Información
    isValid: Object.keys(errors).length === 0,
    isDirty: Object.keys(touched).length > 0,
    changedValues: getChangedValues(),
    fieldCount: Object.keys(values).length
  };
};