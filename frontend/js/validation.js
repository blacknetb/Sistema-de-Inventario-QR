/**
 * Sistema de validación de formularios
 */
class ValidationManager {
    constructor() {
        this.rules = new Map();
        this.messages = new Map();
        this.validators = new Map();
        
        this.init();
    }
    
    init() {
        // Registrar validadores por defecto
        this.registerDefaultValidators();
        
        // Registrar mensajes por defecto
        this.registerDefaultMessages();
    }
    
    /**
     * Registrar validadores por defecto
     */
    registerDefaultValidators() {
        // Requerido
        this.registerValidator('required', (value, params) => {
            if (value === null || value === undefined || value === '') {
                return false;
            }
            
            if (typeof value === 'string' && value.trim() === '') {
                return false;
            }
            
            return true;
        });
        
        // Email
        this.registerValidator('email', (value) => {
            return utils.validateEmail(value);
        });
        
        // Teléfono
        this.registerValidator('phone', (value) => {
            return utils.validatePhone(value);
        });
        
        // Mínimo de caracteres
        this.registerValidator('minLength', (value, params) => {
            if (!value) return true;
            return value.length >= params;
        });
        
        // Máximo de caracteres
        this.registerValidator('maxLength', (value, params) => {
            if (!value) return true;
            return value.length <= params;
        });
        
        // Longitud exacta
        this.registerValidator('exactLength', (value, params) => {
            if (!value) return true;
            return value.length === params;
        });
        
        // Mínimo valor numérico
        this.registerValidator('min', (value, params) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= params;
        });
        
        // Máximo valor numérico
        this.registerValidator('max', (value, params) => {
            const num = parseFloat(value);
            return !isNaN(num) && num <= params;
        });
        
        // Entre valores
        this.registerValidator('between', (value, params) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= params[0] && num <= params[1];
        });
        
        // Número entero
        this.registerValidator('integer', (value) => {
            return /^\d+$/.test(value);
        });
        
        // Número decimal
        this.registerValidator('decimal', (value) => {
            return /^\d+(\.\d+)?$/.test(value);
        });
        
        // URL
        this.registerValidator('url', (value) => {
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        });
        
        // Fecha
        this.registerValidator('date', (value) => {
            const date = new Date(value);
            return !isNaN(date.getTime());
        });
        
        // Fecha futura
        this.registerValidator('futureDate', (value) => {
            const date = new Date(value);
            const now = new Date();
            return !isNaN(date.getTime()) && date > now;
        });
        
        // Fecha pasada
        this.registerValidator('pastDate', (value) => {
            const date = new Date(value);
            const now = new Date();
            return !isNaN(date.getTime()) && date < now;
        });
        
        // Expresión regular
        this.registerValidator('pattern', (value, params) => {
            const regex = new RegExp(params);
            return regex.test(value);
        });
        
        // Igual a otro campo
        this.registerValidator('sameAs', (value, params, formData) => {
            const otherValue = formData[params];
            return value === otherValue;
        });
        
        // Diferente a otro campo
        this.registerValidator('differentFrom', (value, params, formData) => {
            const otherValue = formData[params];
            return value !== otherValue;
        });
        
        // Contraseña fuerte
        this.registerValidator('strongPassword', (value) => {
            const validation = utils.validatePassword(value);
            return validation.valid;
        });
        
        // Código de producto
        this.registerValidator('productCode', (value) => {
            return APP_CONFIG.VALIDATION.CODE_REGEX.test(value);
        });
        
        // Stock positivo
        this.registerValidator('positiveStock', (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0;
        });
        
        // Precio positivo
        this.registerValidator('positivePrice', (value) => {
            const num = parseFloat(value);
            return !isNaN(num) && num >= 0;
        });
    }
    
    /**
     * Registrar mensajes por defecto
     */
    registerDefaultMessages() {
        this.registerMessage('required', 'Este campo es requerido');
        this.registerMessage('email', 'Ingrese un email válido');
        this.registerMessage('phone', 'Ingrese un teléfono válido');
        this.registerMessage('minLength', 'Debe tener al menos {0} caracteres');
        this.registerMessage('maxLength', 'No debe exceder los {0} caracteres');
        this.registerMessage('exactLength', 'Debe tener exactamente {0} caracteres');
        this.registerMessage('min', 'El valor mínimo es {0}');
        this.registerMessage('max', 'El valor máximo es {0}');
        this.registerMessage('between', 'Debe estar entre {0} y {1}');
        this.registerMessage('integer', 'Debe ser un número entero');
        this.registerMessage('decimal', 'Debe ser un número decimal');
        this.registerMessage('url', 'Ingrese una URL válida');
        this.registerMessage('date', 'Ingrese una fecha válida');
        this.registerMessage('futureDate', 'La fecha debe ser futura');
        this.registerMessage('pastDate', 'La fecha debe ser pasada');
        this.registerMessage('pattern', 'El formato no es válido');
        this.registerMessage('sameAs', 'Los valores no coinciden');
        this.registerMessage('differentFrom', 'Los valores deben ser diferentes');
        this.registerMessage('strongPassword', 'La contraseña no cumple con los requisitos de seguridad');
        this.registerMessage('productCode', 'El código no tiene un formato válido');
        this.registerMessage('positiveStock', 'El stock no puede ser negativo');
        this.registerMessage('positivePrice', 'El precio no puede ser negativo');
    }
    
    /**
     * Registrar un validador personalizado
     */
    registerValidator(name, validatorFn) {
        this.validators.set(name, validatorFn);
    }
    
    /**
     * Registrar un mensaje personalizado
     */
    registerMessage(rule, message) {
        this.messages.set(rule, message);
    }
    
    /**
     * Validar un campo individual
     */
    validateField(field, formData = {}) {
        const value = this.getValue(field);
        const rules = this.getRules(field);
        const errors = [];
        
        for (const [ruleName, ruleParams] of Object.entries(rules)) {
            const validator = this.validators.get(ruleName);
            
            if (validator) {
                const isValid = validator(value, ruleParams, formData);
                
                if (!isValid) {
                    const message = this.getMessage(ruleName, ruleParams, field);
                    errors.push({
                        rule: ruleName,
                        message: message,
                        params: ruleParams
                    });
                }
            }
        }
        
        return {
            valid: errors.length === 0,
            errors: errors,
            value: value
        };
    }
    
    /**
     * Validar un formulario completo
     */
    validateForm(formElement, options = {}) {
        const formData = this.getFormData(formElement);
        const fields = this.getFormFields(formElement);
        const results = {
            valid: true,
            errors: {},
            data: formData
        };
        
        // Validar cada campo
        fields.forEach(field => {
            const fieldResult = this.validateField(field, formData);
            
            if (!fieldResult.valid) {
                results.valid = false;
                results.errors[field.name] = fieldResult.errors;
                
                // Mostrar errores en el campo si está habilitado
                if (options.showErrors !== false) {
                    this.showFieldErrors(field, fieldResult.errors);
                }
            } else {
                // Limpiar errores si el campo es válido
                if (options.showErrors !== false) {
                    this.clearFieldErrors(field);
                }
            }
        });
        
        // Validación personalizada del formulario
        if (options.customValidation) {
            const customResult = options.customValidation(formData, results);
            
            if (customResult && !customResult.valid) {
                results.valid = false;
                
                if (customResult.errors) {
                    Object.assign(results.errors, customResult.errors);
                }
                
                if (options.showErrors !== false && customResult.fieldErrors) {
                    Object.entries(customResult.fieldErrors).forEach(([fieldName, errors]) => {
                        const field = fields.find(f => f.name === fieldName);
                        if (field) {
                            this.showFieldErrors(field, errors);
                        }
                    });
                }
            }
        }
        
        return results;
    }
    
    /**
     * Obtener valor de un campo
     */
    getValue(field) {
        if (field.type === 'checkbox') {
            return field.checked ? field.value || true : false;
        }
        
        if (field.type === 'radio') {
            const checked = document.querySelector(`input[name="${field.name}"]:checked`);
            return checked ? checked.value : '';
        }
        
        if (field.type === 'select-multiple') {
            return Array.from(field.selectedOptions).map(option => option.value);
        }
        
        return field.value || '';
    }
    
    /**
     * Obtener reglas de validación de un campo
     */
    getRules(field) {
        const rules = {};
        
        // Obtener de data attributes
        const dataRules = field.dataset.validate;
        if (dataRules) {
            try {
                Object.assign(rules, JSON.parse(dataRules));
            } catch (error) {
                console.error('Error parsing validation rules:', error);
            }
        }
        
        // Obtener de atributos individuales
        if (field.required) {
            rules.required = true;
        }
        
        if (field.minLength) {
            rules.minLength = parseInt(field.minLength);
        }
        
        if (field.maxLength) {
            rules.maxLength = parseInt(field.maxLength);
        }
        
        if (field.min) {
            rules.min = parseFloat(field.min);
        }
        
        if (field.max) {
            rules.max = parseFloat(field.max);
        }
        
        if (field.type === 'email') {
            rules.email = true;
        }
        
        if (field.pattern) {
            rules.pattern = field.pattern;
        }
        
        return rules;
    }
    
    /**
     * Obtener mensaje de error
     */
    getMessage(rule, params, field) {
        let message = this.messages.get(rule) || 'Error de validación';
        
        // Reemplazar parámetros en el mensaje
        if (Array.isArray(params)) {
            params.forEach((param, index) => {
                message = message.replace(`{${index}}`, param);
            });
        } else if (params !== true) {
            message = message.replace('{0}', params);
        }
        
        // Mensaje personalizado del campo
        const customMessage = field.dataset[`${rule}Message`];
        if (customMessage) {
            message = customMessage;
        }
        
        return message;
    }
    
    /**
     * Obtener datos del formulario
     */
    getFormData(formElement) {
        const formData = new FormData(formElement);
        const data = {};
        
        for (const [name, value] of formData.entries()) {
            if (data[name]) {
                if (Array.isArray(data[name])) {
                    data[name].push(value);
                } else {
                    data[name] = [data[name], value];
                }
            } else {
                data[name] = value;
            }
        }
        
        return data;
    }
    
    /**
     * Obtener campos del formulario
     */
    getFormFields(formElement) {
        const fields = [];
        const elements = formElement.elements;
        
        for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            
            // Solo campos que tienen nombre y no están deshabilitados
            if (element.name && !element.disabled) {
                // Solo un campo por nombre (evitar duplicados en radios/checkboxes)
                if (!fields.some(f => f.name === element.name && f.type !== 'radio' && f.type !== 'checkbox')) {
                    fields.push(element);
                }
            }
        }
        
        return fields;
    }
    
    /**
     * Mostrar errores en un campo
     */
    showFieldErrors(field, errors) {
        // Limpiar errores anteriores
        this.clearFieldErrors(field);
        
        // Agregar clase de error al campo
        field.classList.add('error');
        
        // Mostrar mensajes de error
        const errorContainer = this.getErrorContainer(field);
        
        errors.forEach(error => {
            const errorEl = document.createElement('div');
            errorEl.className = 'form-error show';
            errorEl.textContent = error.message;
            errorContainer.appendChild(errorEl);
        });
    }
    
    /**
     * Limpiar errores de un campo
     */
    clearFieldErrors(field) {
        field.classList.remove('error');
        
        const errorContainer = this.getErrorContainer(field);
        const errors = errorContainer.querySelectorAll('.form-error');
        errors.forEach(error => error.remove());
    }
    
    /**
     * Obtener contenedor de errores para un campo
     */
    getErrorContainer(field) {
        // Buscar contenedor existente
        let container = field.parentNode.querySelector('.error-container');
        
        // Crear si no existe
        if (!container) {
            container = document.createElement('div');
            container.className = 'error-container';
            field.parentNode.appendChild(container);
        }
        
        return container;
    }
    
    /**
     * Configurar validación en tiempo real para un formulario
     */
    setupLiveValidation(formElement, options = {}) {
        const fields = this.getFormFields(formElement);
        const formData = {};
        
        // Configurar eventos para cada campo
        fields.forEach(field => {
            const eventType = this.getChangeEvent(field.type);
            
            field.addEventListener(eventType, () => {
                // Actualizar datos del formulario
                formData[field.name] = this.getValue(field);
                
                // Validar campo
                const result = this.validateField(field, formData);
                
                if (result.valid) {
                    this.clearFieldErrors(field);
                } else {
                    this.showFieldErrors(field, result.errors);
                }
                
                // Ejecutar callback si se proporciona
                if (options.onFieldChange) {
                    options.onFieldChange(field, result);
                }
            });
            
            // Validación al perder el foco
            if (options.validateOnBlur) {
                field.addEventListener('blur', () => {
                    formData[field.name] = this.getValue(field);
                    const result = this.validateField(field, formData);
                    
                    if (!result.valid) {
                        this.showFieldErrors(field, result.errors);
                    }
                });
            }
        });
        
        // Validación al enviar el formulario
        formElement.addEventListener('submit', (e) => {
            const result = this.validateForm(formElement, {
                showErrors: true,
                customValidation: options.customValidation
            });
            
            if (!result.valid) {
                e.preventDefault();
                e.stopPropagation();
                
                // Ejecutar callback si se proporciona
                if (options.onSubmitInvalid) {
                    options.onSubmitInvalid(result);
                }
            } else if (options.onSubmitValid) {
                // Ejecutar callback para validación exitosa
                const shouldSubmit = options.onSubmitValid(result);
                if (shouldSubmit === false) {
                    e.preventDefault();
                }
            }
        });
    }
    
    /**
     * Obtener evento de cambio apropiado para el tipo de campo
     */
    getChangeEvent(fieldType) {
        switch (fieldType) {
            case 'checkbox':
            case 'radio':
                return 'change';
            case 'select-one':
            case 'select-multiple':
                return 'change';
            default:
                return 'input';
        }
    }
    
    /**
     * Validar un objeto completo con un esquema
     */
    validateWithSchema(data, schema) {
        const results = {
            valid: true,
            errors: {},
            data: data
        };
        
        for (const [fieldName, fieldRules] of Object.entries(schema)) {
            const value = data[fieldName];
            const fieldErrors = [];
            
            for (const [ruleName, ruleParams] of Object.entries(fieldRules)) {
                const validator = this.validators.get(ruleName);
                
                if (validator) {
                    const isValid = validator(value, ruleParams, data);
                    
                    if (!isValid) {
                        const message = this.getMessage(ruleName, ruleParams);
                        fieldErrors.push({
                            rule: ruleName,
                            message: message,
                            params: ruleParams
                        });
                    }
                }
            }
            
            if (fieldErrors.length > 0) {
                results.valid = false;
                results.errors[fieldName] = fieldErrors;
            }
        }
        
        return results;
    }
    
    /**
     * Crear un esquema de validación
     */
    createSchema(fieldRules) {
        return fieldRules;
    }
    
    /**
     * Sanitizar entrada de usuario
     */
    sanitize(input, type = 'text') {
        if (input === null || input === undefined) {
            return '';
        }
        
        let sanitized = String(input);
        
        switch (type) {
            case 'html':
                // Remover etiquetas HTML
                sanitized = sanitized.replace(/<[^>]*>/g, '');
                break;
                
            case 'email':
                // Convertir a minúsculas y trim
                sanitized = sanitized.toLowerCase().trim();
                break;
                
            case 'number':
                // Remover todo excepto números y punto decimal
                sanitized = sanitized.replace(/[^\d.]/g, '');
                // Mantener solo el primer punto decimal
                const parts = sanitized.split('.');
                if (parts.length > 2) {
                    sanitized = parts[0] + '.' + parts.slice(1).join('');
                }
                break;
                
            case 'integer':
                // Remover todo excepto números
                sanitized = sanitized.replace(/\D/g, '');
                break;
                
            case 'phone':
                // Remover todo excepto números, +, -, espacios y paréntesis
                sanitized = sanitized.replace(/[^\d+\-\s()]/g, '');
                break;
                
            case 'url':
                // Asegurar que comience con http:// o https://
                if (!sanitized.startsWith('http://') && !sanitized.startsWith('https://')) {
                    sanitized = 'https://' + sanitized;
                }
                break;
                
            default:
                // Trim y escape de caracteres especiales
                sanitized = sanitized.trim();
        }
        
        return sanitized;
    }
    
    /**
     * Sanitizar objeto completo
     */
    sanitizeObject(obj, schema) {
        const sanitized = {};
        
        for (const [key, value] of Object.entries(obj)) {
            const fieldType = schema[key]?.type || 'text';
            sanitized[key] = this.sanitize(value, fieldType);
        }
        
        return sanitized;
    }
    
    /**
     * Crear validador personalizado
     */
    createCustomValidator(name, validatorFn, message = 'Error de validación') {
        this.registerValidator(name, validatorFn);
        this.registerMessage(name, message);
    }
}

// Crear instancia global del gestor de validación
const validationManager = new ValidationManager();

// Funciones de utilidad globales
window.validateField = function(field, formData) {
    return validationManager.validateField(field, formData);
};

window.validateForm = function(formElement, options) {
    return validationManager.validateForm(formElement, options);
};

window.setupFormValidation = function(formElement, options) {
    return validationManager.setupLiveValidation(formElement, options);
};

// Exportar para uso global
if (typeof module !== 'undefined' && module.exports) {
    module.exports = validationManager;
} else {
    window.validationManager = validationManager;
}