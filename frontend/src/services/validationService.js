/**
 * Servicio de Validación para Inventory QR System
 * Proporciona funciones reutilizables para validar datos de entrada.
 */

class ValidationService {
    /**
     * Valida una dirección de correo electrónico.
     * @param {string} email - Correo electrónico a validar.
     * @returns {boolean} - `true` si es válido, `false` en caso contrario.
     */
    isValidEmail(email) {
        if (!email || typeof email !== 'string') return false;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Valida una contraseña según criterios de seguridad.
     * @param {string} password - Contraseña a validar.
     * @param {Object} options - Opciones de validación.
     * @returns {Object} - Resultado de la validación { isValid: boolean, errors: string[] }.
     */
    validatePassword(password, options = {}) {
        const {
            minLength = 8,
            requireUppercase = true,
            requireLowercase = true,
            requireNumbers = true,
            requireSpecialChars = true
        } = options;

        const errors = [];

        if (!password || password.length < minLength) {
            errors.push(`La contraseña debe tener al menos ${minLength} caracteres.`);
        }
        if (requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Debe incluir al menos una letra mayúscula.');
        }
        if (requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Debe incluir al menos una letra minúscula.');
        }
        if (requireNumbers && !/\d/.test(password)) {
            errors.push('Debe incluir al menos un número.');
        }
        if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('Debe incluir al menos un carácter especial.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Valida que dos contraseñas coincidan.
     * @param {string} password - Contraseña.
     * @param {string} confirmPassword - Confirmación de contraseña.
     * @returns {boolean} - `true` si coinciden, `false` en caso contrario.
     */
    doPasswordsMatch(password, confirmPassword) {
        return password === confirmPassword;
    }

    /**
     * Valida un número de teléfono (formato mexicano por defecto).
     * @param {string} phone - Número de teléfono.
     * @param {string} country - Código de país (mx, us, etc.).
     * @returns {boolean} - `true` si es válido.
     */
    isValidPhone(phone, country = 'mx') {
        if (!phone || typeof phone !== 'string') return false;
        
        const patterns = {
            mx: /^(\+?52)?\s?\(?\d{2,3}\)?\s?\d{3,4}\s?\d{4}$/, // Ej. 5512345678
            us: /^(\+?1)?\s?\(?\d{3}\)?\s?\d{3}[-.\s]?\d{4}$/   // Ej. 123-456-7890
        };
        
        const pattern = patterns[country] || patterns.mx;
        return pattern.test(phone.replace(/\s/g, ''));
    }

    /**
     * Valida que un campo no esté vacío.
     * @param {any} value - Valor a validar.
     * @returns {boolean} - `true` si no está vacío.
     */
    isRequired(value) {
        if (value === null || value === undefined) return false;
        if (typeof value === 'string') return value.trim().length > 0;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        return true;
    }

    /**
     * Valida que un valor sea un número.
     * @param {any} value - Valor a validar.
     * @returns {boolean} - `true` si es un número.
     */
    isNumber(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }

    /**
     * Valida que un número esté dentro de un rango.
     * @param {number} value - Número a validar.
     * @param {number} min - Valor mínimo.
     * @param {number} max - Valor máximo.
     * @returns {boolean} - `true` si está en el rango.
     */
    isInRange(value, min, max) {
        if (!this.isNumber(value)) return false;
        const num = parseFloat(value);
        return num >= min && num <= max;
    }

    /**
     * Valida un código de barras (EAN-13 por defecto).
     * @param {string} barcode - Código de barras.
     * @returns {boolean} - `true` si es válido.
     */
    isValidBarcode(barcode) {
        if (!barcode || typeof barcode !== 'string') return false;
        
        // Validación simple para EAN-13
        const ean13Regex = /^\d{13}$/;
        if (!ean13Regex.test(barcode)) return false;

        // Validación del dígito de control (checksum) para EAN-13
        const digits = barcode.split('').map(Number);
        const checksum = digits.pop();
        let sum = 0;
        
        for (let i = 0; i < digits.length; i++) {
            sum += digits[i] * (i % 2 === 0 ? 1 : 3);
        }
        
        const calculatedChecksum = (10 - (sum % 10)) % 10;
        return calculatedChecksum === checksum;
    }

    /**
     * Valida un RFC mexicano.
     * @param {string} rfc - RFC a validar.
     * @returns {boolean} - `true` si es válido.
     */
    isValidRFC(rfc) {
        if (!rfc || typeof rfc !== 'string') return false;
        
        // RFC para persona moral: 12 caracteres, persona física: 13
        const rfcRegex = /^[A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
        return rfcRegex.test(rfc.toUpperCase());
    }

    /**
     * Valida una URL.
     * @param {string} url - URL a validar.
     * @returns {boolean} - `true` si es válida.
     */
    isValidURL(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Valida la longitud de una cadena.
     * @param {string} value - Cadena a validar.
     * @param {number} minLength - Longitud mínima.
     * @param {number} maxLength - Longitud máxima.
     * @returns {boolean} - `true` si la longitud está en el rango.
     */
    hasValidLength(value, minLength = 0, maxLength = Infinity) {
        if (typeof value !== 'string') return false;
        const length = value.length;
        return length >= minLength && length <= maxLength;
    }

    /**
     * Valida un objeto contra un esquema de validación.
     * @param {Object} data - Objeto a validar.
     * @param {Object} schema - Esquema de validación (ej. { name: { required: true, minLength: 3 } }).
     * @returns {Object} - Resultado de la validación { isValid: boolean, errors: Object }.
     */
    validateSchema(data, schema) {
        const errors = {};

        for (const [field, rules] of Object.entries(schema)) {
            const value = data[field];

            // Validar requerido
            if (rules.required && !this.isRequired(value)) {
                errors[field] = errors[field] || [];
                errors[field].push('Este campo es requerido.');
                continue; // Si es requerido y no está, no validar más
            }

            // Si el valor es opcional y está vacío, continuar
            if (!rules.required && (value === undefined || value === null || value === '')) {
                continue;
            }

            // Validar tipo
            if (rules.type === 'string' && typeof value !== 'string') {
                errors[field] = errors[field] || [];
                errors[field].push('Debe ser una cadena de texto.');
            }
            if (rules.type === 'number' && !this.isNumber(value)) {
                errors[field] = errors[field] || [];
                errors[field].push('Debe ser un número.');
            }
            if (rules.type === 'email' && !this.isValidEmail(value)) {
                errors[field] = errors[field] || [];
                errors[field].push('Debe ser un correo electrónico válido.');
            }

            // Validar longitud mínima/máxima para strings
            if (typeof value === 'string') {
                if (rules.minLength !== undefined && value.length < rules.minLength) {
                    errors[field] = errors[field] || [];
                    errors[field].push(`Debe tener al menos ${rules.minLength} caracteres.`);
                }
                if (rules.maxLength !== undefined && value.length > rules.maxLength) {
                    errors[field] = errors[field] || [];
                    errors[field].push(`Debe tener como máximo ${rules.maxLength} caracteres.`);
                }
            }

            // Validar rango para números
            if (this.isNumber(value)) {
                const num = parseFloat(value);
                if (rules.min !== undefined && num < rules.min) {
                    errors[field] = errors[field] || [];
                    errors[field].push(`Debe ser mayor o igual a ${rules.min}.`);
                }
                if (rules.max !== undefined && num > rules.max) {
                    errors[field] = errors[field] || [];
                    errors[field].push(`Debe ser menor o igual a ${rules.max}.`);
                }
            }

            // Validar patrón regex
            if (rules.pattern && !rules.pattern.test(value)) {
                errors[field] = errors[field] || [];
                errors[field].push(rules.patternMessage || 'Formato inválido.');
            }
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

export default new ValidationService();