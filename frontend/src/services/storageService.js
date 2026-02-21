/**
 * Servicio de Almacenamiento Local para Inventory QR System
 * Proporciona métodos para interactuar de forma segura con localStorage y sessionStorage.
 */

class StorageService {
    constructor() {
        this.prefix = 'inv_qr_'; // Prefijo para todas las claves
    }

    /**
     * Genera la clave con el prefijo.
     * @param {string} key - Clave original.
     * @returns {string} - Clave con prefijo.
     * @private
     */
    _getKeyWithPrefix(key) {
        return `${this.prefix}${key}`;
    }

    // ============================
    // LOCAL STORAGE METHODS
    // ============================

    /**
     * Guarda un valor en localStorage.
     * @param {string} key - Clave.
     * @param {any} value - Valor a guardar (será convertido a JSON si es objeto).
     */
    setLocal(key, value) {
        try {
            const prefixedKey = this._getKeyWithPrefix(key);
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            localStorage.setItem(prefixedKey, serializedValue);
        } catch (error) {
            console.error(`Error al guardar en localStorage (${key}):`, error);
        }
    }

    /**
     * Obtiene un valor de localStorage.
     * @param {string} key - Clave.
     * @param {boolean} parseJson - Si debe intentar parsear como JSON.
     * @returns {any} - Valor almacenado.
     */
    getLocal(key, parseJson = true) {
        try {
            const prefixedKey = this._getKeyWithPrefix(key);
            const value = localStorage.getItem(prefixedKey);
            
            if (value === null) return null;
            
            if (parseJson) {
                try {
                    return JSON.parse(value);
                } catch {
                    return value; // Si no es JSON válido, devolver el string
                }
            }
            return value;
        } catch (error) {
            console.error(`Error al obtener de localStorage (${key}):`, error);
            return null;
        }
    }

    /**
     * Elimina un valor de localStorage.
     * @param {string} key - Clave.
     */
    removeLocal(key) {
        try {
            const prefixedKey = this._getKeyWithPrefix(key);
            localStorage.removeItem(prefixedKey);
        } catch (error) {
            console.error(`Error al eliminar de localStorage (${key}):`, error);
        }
    }

    /**
     * Limpia todas las claves de la aplicación en localStorage.
     */
    clearLocal() {
        try {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error al limpiar localStorage:', error);
        }
    }

    // ============================
    // SESSION STORAGE METHODS
    // ============================

    /**
     * Guarda un valor en sessionStorage.
     * @param {string} key - Clave.
     * @param {any} value - Valor a guardar.
     */
    setSession(key, value) {
        try {
            const prefixedKey = this._getKeyWithPrefix(key);
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
            sessionStorage.setItem(prefixedKey, serializedValue);
        } catch (error) {
            console.error(`Error al guardar en sessionStorage (${key}):`, error);
        }
    }

    /**
     * Obtiene un valor de sessionStorage.
     * @param {string} key - Clave.
     * @param {boolean} parseJson - Si debe intentar parsear como JSON.
     * @returns {any} - Valor almacenado.
     */
    getSession(key, parseJson = true) {
        try {
            const prefixedKey = this._getKeyWithPrefix(key);
            const value = sessionStorage.getItem(prefixedKey);
            
            if (value === null) return null;
            
            if (parseJson) {
                try {
                    return JSON.parse(value);
                } catch {
                    return value;
                }
            }
            return value;
        } catch (error) {
            console.error(`Error al obtener de sessionStorage (${key}):`, error);
            return null;
        }
    }

    /**
     * Elimina un valor de sessionStorage.
     * @param {string} key - Clave.
     */
    removeSession(key) {
        try {
            const prefixedKey = this._getKeyWithPrefix(key);
            sessionStorage.removeItem(prefixedKey);
        } catch (error) {
            console.error(`Error al eliminar de sessionStorage (${key}):`, error);
        }
    }

    /**
     * Limpia todas las claves de la aplicación en sessionStorage.
     */
    clearSession() {
        try {
            Object.keys(sessionStorage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    sessionStorage.removeItem(key);
                }
            });
        } catch (error) {
            console.error('Error al limpiar sessionStorage:', error);
        }
    }

    // ============================
    // UTILITY METHODS
    // ============================

    /**
     * Limpia ambos almacenamientos (local y session) para la aplicación.
     */
    clearAll() {
        this.clearLocal();
        this.clearSession();
    }

    /**
     * Obtiene el tamaño aproximado de localStorage en bytes.
     * @returns {number} - Tamaño en bytes.
     */
    getLocalStorageSize() {
        let total = 0;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                total += (localStorage.getItem(key)?.length || 0) * 2; // Aproximación en bytes (UTF-16)
            }
        });
        return total;
    }

    /**
     * Verifica si localStorage está disponible.
     * @returns {boolean} - `true` si está disponible.
     */
    isLocalStorageAvailable() {
        try {
            const testKey = `${this.prefix}test`;
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }
}

export default new StorageService();