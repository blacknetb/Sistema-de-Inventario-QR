/**
 * helpers.js - Funciones auxiliares generales para Inventory QR System (Frontend)
 * Proporciona utilidades comunes para toda la aplicación del frontend.
 */

// ========================================
// MANIPULACIÓN DE ARRAYS
// ========================================

/**
 * Agrupa un array de objetos por una clave
 * @param {Array} array - Array a agrupar
 * @param {string} key - Clave por la que agrupar
 * @returns {Object} - Objeto agrupado
 */
export function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

/**
 * Ordena un array de objetos por una clave
 * @param {Array} array - Array a ordenar
 * @param {string} key - Clave por la que ordenar
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array} - Array ordenado
 */
export function sortBy(array, key, order = 'asc') {
    return [...array].sort((a, b) => {
        const valueA = a[key];
        const valueB = b[key];

        if (valueA < valueB) return order === 'asc' ? -1 : 1;
        if (valueA > valueB) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Filtra un array de objetos por un término de búsqueda
 * @param {Array} array - Array a filtrar
 * @param {string} searchTerm - Término de búsqueda
 * @param {Array} keys - Claves en las que buscar
 * @returns {Array} - Array filtrado
 */
export function filterBySearch(array, searchTerm, keys = ['name']) {
    if (!searchTerm) return array;

    const term = searchTerm.toLowerCase();
    return array.filter(item =>
        keys.some(key =>
            item[key]?.toString().toLowerCase().includes(term)
        )
    );
}

/**
 * Pagina un array
 * @param {Array} array - Array a paginar
 * @param {number} page - Número de página
 * @param {number} limit - Elementos por página
 * @returns {Object} - Objeto con datos paginados
 */
export function paginate(array, page = 1, limit = 20) {
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
        data: array.slice(start, end),
        total: array.length,
        page,
        limit,
        totalPages: Math.ceil(array.length / limit)
    };
}

/**
 * Elimina duplicados de un array de objetos por una clave
 * @param {Array} array - Array a procesar
 * @param {string} key - Clave para identificar duplicados
 * @returns {Array} - Array sin duplicados
 */
export function uniqueBy(array, key) {
    const seen = new Set();
    return array.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
}

// ========================================
// MANIPULACIÓN DE OBJETOS
// ========================================

/**
 * Elimina propiedades vacías de un objeto (null, undefined, '', [])
 * @param {Object} obj - Objeto a limpiar
 * @returns {Object} - Objeto sin propiedades vacías
 */
export function removeEmpty(obj) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, value]) =>
            value !== null &&
            value !== undefined &&
            value !== '' &&
            !(Array.isArray(value) && value.length === 0)
        )
    );
}

/**
 * Crea un objeto de consulta para API eliminando valores vacíos
 * @param {Object} params - Parámetros de consulta
 * @returns {Object} - Parámetros limpios
 */
export function buildQueryParams(params) {
    return removeEmpty(params);
}

/**
 * Convierte un objeto a FormData
 * @param {Object} obj - Objeto a convertir
 * @returns {FormData} - FormData generado
 */
export function objectToFormData(obj) {
    const formData = new FormData();

    Object.entries(obj).forEach(([key, value]) => {
        if (value instanceof File) {
            formData.append(key, value);
        } else if (Array.isArray(value)) {
            value.forEach(item => formData.append(`${key}[]`, item));
        } else if (value !== null && value !== undefined) {
            formData.append(key, value.toString());
        }
    });

    return formData;
}

/**
 * Realiza una copia profunda de un objeto
 * @param {Object} obj - Objeto a copiar
 * @returns {Object} - Copia del objeto
 */
export function deepClone(obj) {
    try {
        return JSON.parse(JSON.stringify(obj));
    } catch (error) {
        console.error('Error cloning object:', error);
        return obj;
    }
}

// ========================================
// MANIPULACIÓN DE STRINGS
// ========================================

/**
 * Genera un ID único
 * @param {string} prefix - Prefijo para el ID
 * @returns {string} - ID único
 */
export function generateId(prefix = '') {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 9);
    return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
}

/**
 * Extrae iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} - Iniciales
 */
export function getInitials(name) {
    if (!name) return '';

    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/**
 * Convierte un string a color hexadecimal consistente
 * @param {string} str - String de entrada
 * @returns {string} - Color hexadecimal
 */
export function stringToColor(str) {
    if (!str) return '#6B7280';

    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }

    return color;
}

// ========================================
// MANEJO DE ERRORES
// ========================================

/**
 * Extrae un mensaje de error de una respuesta de API
 * @param {Error} error - Error de la API
 * @returns {string} - Mensaje de error legible
 */
export function getErrorMessage(error) {
    if (error.response?.data?.message) {
        return error.response.data.message;
    }

    if (error.response?.data?.error) {
        return error.response.data.error;
    }

    if (error.message) {
        return error.message;
    }

    return 'Ha ocurrido un error inesperado';
}

/**
 * Obtiene el código de estado de un error
 * @param {Error} error - Error de la API
 * @returns {number|null} - Código de estado
 */
export function getErrorStatus(error) {
    return error.response?.status || null;
}

// ========================================
// DEBOUNCE Y THROTTLE
// ========================================

/**
 * Función debounce para limitar ejecuciones
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Tiempo de espera en ms
 * @returns {Function} - Función con debounce
 */
export function debounce(func, wait = 300) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Función throttle para limitar ejecuciones
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Límite de tiempo en ms
 * @returns {Function} - Función con throttle
 */
export function throttle(func, limit = 300) {
    let inThrottle;

    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// ALMACENAMIENTO LOCAL
// ========================================

/**
 * Guarda datos en localStorage con expiración
 * @param {string} key - Clave
 * @param {any} value - Valor
 * @param {number} ttl - Tiempo de vida en ms
 */
export function setWithExpiry(key, value, ttl) {
    const now = new Date();

    const item = {
        value: value,
        expiry: now.getTime() + ttl
    };

    localStorage.setItem(key, JSON.stringify(item));
}

/**
 * Obtiene datos de localStorage con verificación de expiración
 * @param {string} key - Clave
 * @returns {any|null} - Valor o null si expiró
 */
export function getWithExpiry(key) {
    const itemStr = localStorage.getItem(key);

    if (!itemStr) return null;

    try {
        const item = JSON.parse(itemStr);
        const now = new Date();

        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }

        return item.value;
    } catch {
        return null;
    }
}

// ========================================
// COLORES Y ESTILOS
// ========================================

/**
 * Obtiene el color para un valor de stock
 * @param {number} stock - Cantidad de stock
 * @param {number} lowStockThreshold - Umbral de stock bajo
 * @returns {string} - Clase CSS o color
 */
export function getStockColor(stock, lowStockThreshold = 10) {
    if (stock <= 0) return 'error';
    if (stock < lowStockThreshold) return 'warning';
    return 'success';
}

/**
 * Obtiene una clase CSS para un estado
 * @param {string} status - Estado
 * @returns {string} - Clase CSS
 */
export function getStatusClass(status) {
    const classes = {
        active: 'status-active',
        inactive: 'status-inactive',
        pending: 'status-pending',
        blocked: 'status-blocked',
        success: 'status-success',
        warning: 'status-warning',
        error: 'status-error',
        info: 'status-info'
    };

    return classes[status] || '';
}

// ========================================
// UTILIDADES DE RED
// ========================================

/**
 * Verifica si el navegador está en línea
 * @returns {boolean} - True si está en línea
 */
export function isOnline() {
    return navigator.onLine;
}

/**
 * Obtiene la URL base de la API desde las variables de entorno del frontend
 * @returns {string} - URL base
 */
export function getApiBaseUrl() {
    return process.env.REACT_APP_FRONTEND_URL || 'http://localhost:8080';
}

/**
 * Construye una URL completa para la API
 * @param {string} path - Ruta relativa
 * @returns {string} - URL completa
 */
export function buildApiUrl(path) {
    const base = getApiBaseUrl();
    const prefix = process.env.REACT_APP_API_PREFIX || '/api/v1';
    // Asegura que no haya dobles barras
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${prefix}${cleanPath}`;
}