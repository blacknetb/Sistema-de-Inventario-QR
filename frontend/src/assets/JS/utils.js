// ============================================
// UTILIDADES - FUNCIONES DE AYUDA
// ============================================

/**
 * Gestión de almacenamiento local con manejo de errores
 */
const Storage = {
    /**
     * Almacena un valor en localStorage
     * @param {string} key - Clave para almacenar
     * @param {any} value - Valor a almacenar
     * @param {number} ttl - Tiempo de vida en milisegundos (opcional)
     * @returns {boolean} - True si se almacenó correctamente
     */
    set: function(key, value, ttl = null) {
        try {
            const prefixedKey = AppConfig.STORAGE_CONFIG.PREFIX + key;
            const item = {
                value: value,
                timestamp: Date.now(),
                ttl: ttl
            };
            localStorage.setItem(prefixedKey, JSON.stringify(item));
            return true;
        } catch (error) {
            console.warn('⚠️ Error al guardar en localStorage:', error);
            return false;
        }
    },
    
    /**
     * Obtiene un valor de localStorage
     * @param {string} key - Clave a obtener
     * @returns {any|null} - Valor almacenado o null
     */
    get: function(key) {
        try {
            const prefixedKey = AppConfig.STORAGE_CONFIG.PREFIX + key;
            const item = localStorage.getItem(prefixedKey);
            
            if (!item) return null;
            
            const parsed = JSON.parse(item);
            
            // Verificar si el elemento ha expirado
            if (parsed.ttl && Date.now() - parsed.timestamp > parsed.ttl) {
                this.remove(key);
                return null;
            }
            
            return parsed.value;
        } catch (error) {
            console.warn('⚠️ Error al obtener de localStorage:', error);
            return null;
        }
    },
    
    /**
     * Elimina un valor de localStorage
     * @param {string} key - Clave a eliminar
     * @returns {boolean} - True si se eliminó correctamente
     */
    remove: function(key) {
        try {
            const prefixedKey = AppConfig.STORAGE_CONFIG.PREFIX + key;
            localStorage.removeItem(prefixedKey);
            return true;
        } catch (error) {
            console.warn('⚠️ Error al eliminar de localStorage:', error);
            return false;
        }
    },
    
    /**
     * Limpia todo el almacenamiento de la aplicación
     * @returns {boolean} - True si se limpió correctamente
     */
    clear: function() {
        try {
            const prefix = AppConfig.STORAGE_CONFIG.PREFIX;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key);
                }
            }
            return true;
        } catch (error) {
            console.warn('⚠️ Error al limpiar localStorage:', error);
            return false;
        }
    },
    
    /**
     * Verifica si una clave existe en localStorage
     * @param {string} key - Clave a verificar
     * @returns {boolean} - True si la clave existe
     */
    has: function(key) {
        return this.get(key) !== null;
    }
};

/**
 * Utilidades para fechas
 */
const DateUtils = {
    /**
     * Formatea una fecha
     * @param {Date|string|number} date - Fecha a formatear
     * @param {string} format - Formato deseado
     * @returns {string} - Fecha formateada
     */
    format: function(date, format = 'dd/MM/yyyy HH:mm') {
        const d = date instanceof Date ? date : new Date(date);
        
        if (isNaN(d.getTime())) {
            return 'Fecha inválida';
        }
        
        const pad = (n) => n.toString().padStart(2, '0');
        
        const replacements = {
            'yyyy': d.getFullYear(),
            'MM': pad(d.getMonth() + 1),
            'dd': pad(d.getDate()),
            'HH': pad(d.getHours()),
            'hh': pad(d.getHours() % 12 || 12),
            'mm': pad(d.getMinutes()),
            'ss': pad(d.getSeconds()),
            'a': d.getHours() < 12 ? 'AM' : 'PM',
            'EEE': ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()],
            'EEEE': ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][d.getDay()],
            'MMM': ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][d.getMonth()],
            'MMMM': ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][d.getMonth()]
        };
        
        return format.replace(/yyyy|MMM|MMMM|EEE|EEEE|dd|HH|hh|mm|ss|a/g, match => replacements[match]);
    },
    
    /**
     * Obtiene la diferencia de tiempo relativa
     * @param {Date|string|number} date - Fecha a comparar
     * @returns {string} - Diferencia en texto humano
     */
    timeAgo: function(date) {
        const now = new Date();
        const d = date instanceof Date ? date : new Date(date);
        const diffMs = now - d;
        
        if (isNaN(diffMs)) return 'Fecha inválida';
        
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);
        
        if (diffYear > 0) return `hace ${diffYear} ${diffYear === 1 ? 'año' : 'años'}`;
        if (diffMonth > 0) return `hace ${diffMonth} ${diffMonth === 1 ? 'mes' : 'meses'}`;
        if (diffWeek > 0) return `hace ${diffWeek} ${diffWeek === 1 ? 'semana' : 'semanas'}`;
        if (diffDay > 0) return `hace ${diffDay} ${diffDay === 1 ? 'día' : 'días'}`;
        if (diffHour > 0) return `hace ${diffHour} ${diffHour === 1 ? 'hora' : 'horas'}`;
        if (diffMin > 0) return `hace ${diffMin} ${diffMin === 1 ? 'minuto' : 'minutos'}`;
        return 'hace unos segundos';
    },
    
    /**
     * Valida si una fecha es válida
     * @param {Date|string|number} date - Fecha a validar
     * @returns {boolean} - True si la fecha es válida
     */
    isValid: function(date) {
        const d = date instanceof Date ? date : new Date(date);
        return !isNaN(d.getTime());
    },
    
    /**
     * Agrega días a una fecha
     * @param {Date} date - Fecha base
     * @param {number} days - Días a agregar
     * @returns {Date} - Nueva fecha
     */
    addDays: function(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },
    
    /**
     * Obtiene el primer día del mes
     * @param {Date} date - Fecha base
     * @returns {Date} - Primer día del mes
     */
    startOfMonth: function(date) {
        return new Date(date.getFullYear(), date.getMonth(), 1);
    },
    
    /**
     * Obtiene el último día del mes
     * @param {Date} date - Fecha base
     * @returns {Date} - Último día del mes
     */
    endOfMonth: function(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0);
    }
};

/**
 * Utilidades para formato de números
 */
const NumberUtils = {
    /**
     * Formatea un número como moneda
     * @param {number} amount - Cantidad a formatear
     * @param {string} currency - Código de moneda (default: 'USD')
     * @param {string} locale - Locale (default: 'es-ES')
     * @returns {string} - Cantidad formateada
     */
    formatCurrency: function(amount, currency = 'USD', locale = 'es-ES') {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    },
    
    /**
     * Formatea un número con separadores de miles
     * @param {number} number - Número a formatear
     * @param {number} decimals - Decimales (default: 0)
     * @param {string} locale - Locale (default: 'es-ES')
     * @returns {string} - Número formateado
     */
    formatNumber: function(number, decimals = 0, locale = 'es-ES') {
        return new Intl.NumberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    },
    
    /**
     * Formatea un porcentaje
     * @param {number} percentage - Porcentaje a formatear
     * @param {number} decimals - Decimales (default: 1)
     * @returns {string} - Porcentaje formateado
     */
    formatPercentage: function(percentage, decimals = 1) {
        return `${percentage.toFixed(decimals)}%`;
    },
    
    /**
     * Redondea un número a decimales específicos
     * @param {number} number - Número a redondear
     * @param {number} decimals - Decimales (default: 2)
     * @returns {number} - Número redondeado
     */
    round: function(number, decimals = 2) {
        const factor = Math.pow(10, decimals);
        return Math.round(number * factor) / factor;
    },
    
    /**
     * Calcula el porcentaje de un valor
     * @param {number} value - Valor
     * @param {number} total - Total
     * @returns {number} - Porcentaje
     */
    calculatePercentage: function(value, total) {
        if (total === 0) return 0;
        return (value / total) * 100;
    }
};

/**
 * Utilidades para validación
 */
const Validation = {
    /**
     * Valida un email
     * @param {string} email - Email a validar
     * @returns {boolean} - True si el email es válido
     */
    isValidEmail: function(email) {
        return AppConfig.VALIDATION_CONFIG.EMAIL_REGEX.test(email);
    },
    
    /**
     * Valida un teléfono
     * @param {string} phone - Teléfono a validar
     * @returns {boolean} - True si el teléfono es válido
     */
    isValidPhone: function(phone) {
        return AppConfig.VALIDATION_CONFIG.PHONE_REGEX.test(phone);
    },
    
    /**
     * Valida una URL
     * @param {string} url - URL a validar
     * @returns {boolean} - True si la URL es válida
     */
    isValidURL: function(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },
    
    /**
     * Valida una contraseña
     * @param {string} password - Contraseña a validar
     * @returns {Object} - Resultado de validación
     */
    validatePassword: function(password) {
        const config = AppConfig.VALIDATION_CONFIG.PASSWORD;
        const errors = [];
        
        if (password.length < config.MIN_LENGTH) {
            errors.push(`La contraseña debe tener al menos ${config.MIN_LENGTH} caracteres`);
        }
        
        if (config.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra mayúscula');
        }
        
        if (config.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
            errors.push('La contraseña debe contener al menos una letra minúscula');
        }
        
        if (config.REQUIRE_NUMBER && !/\d/.test(password)) {
            errors.push('La contraseña debe contener al menos un número');
        }
        
        if (config.REQUIRE_SPECIAL && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
            errors.push('La contraseña debe contener al menos un carácter especial');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Valida un código de producto
     * @param {string} code - Código a validar
     * @returns {Object} - Resultado de validación
     */
    validateProductCode: function(code) {
        const config = AppConfig.VALIDATION_CONFIG.PRODUCT;
        const errors = [];
        
        if (code.length < config.CODE_MIN_LENGTH) {
            errors.push(`El código debe tener al menos ${config.CODE_MIN_LENGTH} caracteres`);
        }
        
        if (code.length > config.CODE_MAX_LENGTH) {
            errors.push(`El código no puede tener más de ${config.CODE_MAX_LENGTH} caracteres`);
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Valida un formulario
     * @param {HTMLFormElement} form - Formulario a validar
     * @returns {Object} - Resultado de validación
     */
    validateForm: function(form) {
        const elements = form.elements;
        const errors = [];
        
        for (let element of elements) {
            if (element.required && !element.value.trim()) {
                errors.push({
                    field: element.name,
                    message: `${element.labels?.[0]?.textContent || 'Este campo'} es requerido`
                });
            }
            
            if (element.type === 'email' && element.value && !this.isValidEmail(element.value)) {
                errors.push({
                    field: element.name,
                    message: 'Por favor, introduce un email válido'
                });
            }
            
            if (element.type === 'number') {
                const min = parseFloat(element.min);
                const max = parseFloat(element.max);
                const value = parseFloat(element.value);
                
                if (!isNaN(min) && value < min) {
                    errors.push({
                        field: element.name,
                        message: `El valor mínimo es ${min}`
                    });
                }
                
                if (!isNaN(max) && value > max) {
                    errors.push({
                        field: element.name,
                        message: `El valor máximo es ${max}`
                    });
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
};

/**
 * Utilidades para manejo de archivos
 */
const FileUtils = {
    /**
     * Lee un archivo como texto
     * @param {File} file - Archivo a leer
     * @returns {Promise<string>} - Contenido del archivo
     */
    readAsText: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsText(file);
        });
    },
    
    /**
     * Lee un archivo como Data URL
     * @param {File} file - Archivo a leer
     * @returns {Promise<string>} - Data URL
     */
    readAsDataURL: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e.target.error);
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Valida un archivo
     * @param {File} file - Archivo a validar
     * @param {string} type - Tipo de archivo ('image', 'document', 'excel', 'csv')
     * @returns {Object} - Resultado de validación
     */
    validateFile: function(file, type = 'image') {
        const config = AppConfig.UPLOAD_CONFIG;
        const errors = [];
        
        // Validar tamaño
        if (file.size > config.MAX_FILE_SIZE) {
            const maxSizeMB = config.MAX_FILE_SIZE / (1024 * 1024);
            errors.push(`El archivo es demasiado grande. Máximo ${maxSizeMB}MB`);
        }
        
        // Validar tipo
        let allowedTypes = [];
        switch (type) {
            case 'image':
                allowedTypes = config.ALLOWED_TYPES.IMAGES;
                break;
            case 'document':
                allowedTypes = config.ALLOWED_TYPES.DOCUMENTS;
                break;
            case 'excel':
                allowedTypes = config.ALLOWED_TYPES.EXCEL;
                break;
            case 'csv':
                allowedTypes = config.ALLOWED_TYPES.CSV;
                break;
        }
        
        if (!allowedTypes.includes(file.type)) {
            errors.push('Tipo de archivo no permitido');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    /**
     * Descarga un archivo
     * @param {string} content - Contenido del archivo
     * @param {string} filename - Nombre del archivo
     * @param {string} type - Tipo MIME
     */
    download: function(content, filename, type = 'text/plain') {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    
    /**
     * Genera un nombre de archivo único
     * @param {string} prefix - Prefijo del archivo
     * @param {string} extension - Extensión del archivo
     * @returns {string} - Nombre único
     */
    generateUniqueFilename: function(prefix = 'file', extension = 'txt') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `${prefix}_${timestamp}_${random}.${extension}`;
    }
};

/**
 * Utilidades para manejo de cadenas
 */
const StringUtils = {
    /**
     * Capitaliza la primera letra de una cadena
     * @param {string} str - Cadena a capitalizar
     * @returns {string} - Cadena capitalizada
     */
    capitalize: function(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    },
    
    /**
     * Trunca una cadena a una longitud máxima
     * @param {string} str - Cadena a truncar
     * @param {number} maxLength - Longitud máxima
     * @param {string} suffix - Sufijo a agregar (default: '...')
     * @returns {string} - Cadena truncada
     */
    truncate: function(str, maxLength = 100, suffix = '...') {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    },
    
    /**
     * Convierte una cadena a slug
     * @param {string} str - Cadena a convertir
     * @returns {string} - Slug
     */
    slugify: function(str) {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    },
    
    /**
     * Genera un UUID v4
     * @returns {string} - UUID
     */
    generateUUID: function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * Formatea un código de producto
     * @param {string|number} id - ID del producto
     * @param {string} prefix - Prefijo (default: 'PROD')
     * @returns {string} - Código formateado
     */
    formatProductCode: function(id, prefix = 'PROD') {
        return `${prefix}-${id.toString().padStart(6, '0')}`;
    },
    
    /**
     * Limpia y normaliza un texto
     * @param {string} text - Texto a limpiar
     * @returns {string} - Texto limpio
     */
    cleanText: function(text) {
        return text
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/[^\w\s.,!?@#$%^&*()-]/gi, '');
    }
};

/**
 * Utilidades para arrays
 */
const ArrayUtils = {
    /**
     * Ordena un array de objetos por una propiedad
     * @param {Array} array - Array a ordenar
     * @param {string} property - Propiedad por la que ordenar
     * @param {boolean} ascending - Orden ascendente (default: true)
     * @returns {Array} - Array ordenado
     */
    sortBy: function(array, property, ascending = true) {
        return [...array].sort((a, b) => {
            let aValue = a[property];
            let bValue = b[property];
            
            // Manejar valores nulos
            if (aValue == null) aValue = ascending ? 1 : -1;
            if (bValue == null) bValue = ascending ? -1 : 1;
            
            // Comparar
            if (aValue < bValue) return ascending ? -1 : 1;
            if (aValue > bValue) return ascending ? 1 : -1;
            return 0;
        });
    },
    
    /**
     * Filtra elementos únicos en un array
     * @param {Array} array - Array a filtrar
     * @param {string} property - Propiedad para la unicidad (opcional)
     * @returns {Array} - Array con elementos únicos
     */
    unique: function(array, property = null) {
        if (property) {
            const seen = new Set();
            return array.filter(item => {
                const key = item[property];
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        }
        return [...new Set(array)];
    },
    
    /**
     * Agrupa elementos de un array por una propiedad
     * @param {Array} array - Array a agrupar
     * @param {string} property - Propiedad por la que agrupar
     * @returns {Object} - Objeto con grupos
     */
    groupBy: function(array, property) {
        return array.reduce((groups, item) => {
            const key = item[property];
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
        }, {});
    },
    
    /**
     * Pagina un array
     * @param {Array} array - Array a paginar
     * @param {number} page - Página actual
     * @param {number} limit - Elementos por página
     * @returns {Object} - Resultado paginado
     */
    paginate: function(array, page = 1, limit = 20) {
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const totalPages = Math.ceil(array.length / limit);
        
        return {
            data: array.slice(startIndex, endIndex),
            pagination: {
                page: page,
                limit: limit,
                total: array.length,
                totalPages: totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    },
    
    /**
     * Busca en un array de objetos
     * @param {Array} array - Array en el que buscar
     * @param {string} query - Consulta de búsqueda
     * @param {Array} properties - Propiedades en las que buscar
     * @returns {Array} - Resultados de búsqueda
     */
    search: function(array, query, properties) {
        if (!query) return array;
        
        const lowerQuery = query.toLowerCase();
        return array.filter(item => {
            return properties.some(property => {
                const value = item[property];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(lowerQuery);
                }
                if (typeof value === 'number') {
                    return value.toString().includes(lowerQuery);
                }
                return false;
            });
        });
    }
};

/**
 * Utilidades para manipulación del DOM
 */
const DOMUtils = {
    /**
     * Crea un elemento HTML
     * @param {string} tag - Etiqueta HTML
     * @param {Object} options - Opciones del elemento
     * @returns {HTMLElement} - Elemento creado
     */
    createElement: function(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.text) {
            element.textContent = options.text;
        }
        
        if (options.html) {
            element.innerHTML = options.html;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        if (options.dataset) {
            Object.entries(options.dataset).forEach(([key, value]) => {
                element.dataset[key] = value;
            });
        }
        
        if (options.events) {
            Object.entries(options.events).forEach(([event, handler]) => {
                element.addEventListener(event, handler);
            });
        }
        
        return element;
    },
    
    /**
     * Muestra un elemento
     * @param {HTMLElement} element - Elemento a mostrar
     * @param {string} display - Valor de display (default: 'block')
     */
    show: function(element, display = 'block') {
        if (element) {
            element.style.display = display;
        }
    },
    
    /**
     * Oculta un elemento
     * @param {HTMLElement} element - Elemento a ocultar
     */
    hide: function(element) {
        if (element) {
            element.style.display = 'none';
        }
    },
    
    /**
     * Alterna la visibilidad de un elemento
     * @param {HTMLElement} element - Elemento a alternar
     * @param {string} display - Valor de display (default: 'block')
     */
    toggle: function(element, display = 'block') {
        if (element) {
            if (element.style.display === 'none') {
                this.show(element, display);
            } else {
                this.hide(element);
            }
        }
    },
    
    /**
     * Agrega clases a un elemento
     * @param {HTMLElement} element - Elemento
     * @param {...string} classNames - Nombres de clases
     */
    addClass: function(element, ...classNames) {
        if (element) {
            element.classList.add(...classNames);
        }
    },
    
    /**
     * Elimina clases de un elemento
     * @param {HTMLElement} element - Elemento
     * @param {...string} classNames - Nombres de clases
     */
    removeClass: function(element, ...classNames) {
        if (element) {
            element.classList.remove(...classNames);
        }
    },
    
    /**
     * Verifica si un elemento tiene una clase
     * @param {HTMLElement} element - Elemento
     * @param {string} className - Nombre de la clase
     * @returns {boolean} - True si tiene la clase
     */
    hasClass: function(element, className) {
        return element && element.classList.contains(className);
    },
    
    /**
     * Obtiene o establece atributos de datos
     * @param {HTMLElement} element - Elemento
     * @param {string} key - Clave del dato
     * @param {any} value - Valor (opcional)
     * @returns {any} - Valor del dato
     */
    data: function(element, key, value) {
        if (value === undefined) {
            return element?.dataset[key];
        }
        if (element) {
            element.dataset[key] = value;
        }
    }
};

/**
 * Utilidades para manejo de errores
 */
const ErrorUtils = {
    /**
     * Maneja un error de forma centralizada
     * @param {Error} error - Error a manejar
     * @param {string} context - Contexto del error
     */
    handle: function(error, context = 'Error desconocido') {
        console.error(`❌ ${context}:`, error);
        
        // Mostrar notificación al usuario
        if (window.showNotification) {
            window.showNotification('error', error.message || context);
        }
        
        // En desarrollo, mostrar detalles completos
        if (AppConfig.ENVIRONMENT.DEBUG) {
            console.error('📄 Stack trace:', error.stack);
            console.error('📍 Contexto:', context);
        }
    },
    
    /**
     * Crea un error personalizado
     * @param {string} message - Mensaje del error
     * @param {string} code - Código del error
     * @param {any} data - Datos adicionales
     * @returns {Error} - Error personalizado
     */
    create: function(message, code = 'UNKNOWN_ERROR', data = null) {
        const error = new Error(message);
        error.code = code;
        error.data = data;
        error.timestamp = new Date().toISOString();
        return error;
    }
};

/**
 * Utilidades para manejo de conexión
 */
const ConnectionUtils = {
    /**
     * Verifica la conexión a internet
     * @returns {boolean} - True si hay conexión
     */
    isOnline: function() {
        return navigator.onLine;
    },
    
    /**
     * Verifica la conectividad con el servidor
     * @returns {Promise<boolean>} - True si hay conectividad
     */
    checkServer: async function() {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${AppConfig.API_CONFIG.BASE_URL}/health`, {
                method: 'GET',
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response.ok;
        } catch (error) {
            return false;
        }
    },
    
    /**
     * Obtiene el estado de la conexión
     * @returns {Promise<Object>} - Estado de conexión
     */
    getStatus: async function() {
        const online = this.isOnline();
        const serverReachable = online ? await this.checkServer() : false;
        
        return {
            online: online,
            serverReachable: serverReachable,
            status: online ? (serverReachable ? 'online' : 'server_down') : 'offline',
            timestamp: new Date().toISOString()
        };
    }
};

/**
 * Exportar todas las utilidades
 */
window.Utils = {
    Storage,
    DateUtils,
    NumberUtils,
    Validation,
    FileUtils,
    StringUtils,
    ArrayUtils,
    DOMUtils,
    ErrorUtils,
    ConnectionUtils
};

// Log de carga
if (AppConfig.ENVIRONMENT.DEBUG) {
    console.log('✅ Utilidades cargadas correctamente');
}