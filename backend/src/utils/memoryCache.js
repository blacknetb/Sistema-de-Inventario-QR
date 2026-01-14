/**
 * ✅ IMPLEMENTACIÓN SIMPLE DE CACHÉ EN MEMORIA
 * Para usar cuando node-cache no está disponible
 */

class MemoryCache {
  constructor() {
    this.cache = {};
    this.timeouts = {};
  }

  /**
   * Obtener valor del caché
   */
  get(key) {
    const item = this.cache[key];

    // Verificar si expiró
    if (item && item.expiresAt && Date.now() > item.expiresAt) {
      delete this.cache[key];
      if (this.timeouts[key]) {
        clearTimeout(this.timeouts[key]);
        delete this.timeouts[key];
      }
      return null;
    }

    return item ? item.value : null;
  }

  /**
   * Establecer valor en caché
   */
  set(key, value, ttl = 0) {
    // Limpiar timeout anterior si existe
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
    }

    const item = {
      value,
      createdAt: Date.now(),
      expiresAt: ttl > 0 ? Date.now() + ttl * 1000 : null,
    };

    this.cache[key] = item;

    // Configurar limpieza automática si hay TTL
    if (ttl > 0) {
      this.timeouts[key] = setTimeout(() => {
        delete this.cache[key];
        delete this.timeouts[key];
      }, ttl * 1000);
    }

    return true;
  }

  /**
   * Eliminar valor del caché
   */
  del(key) {
    delete this.cache[key];
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
      delete this.timeouts[key];
    }
    return true;
  }

  /**
   * Limpiar todo el caché
   */
  flush() {
    this.cache = {};
    Object.values(this.timeouts).forEach((timeout) => clearTimeout(timeout));
    this.timeouts = {};
    return true;
  }

  /**
   * Verificar si una clave existe
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Obtener todas las claves
   */
  keys() {
    return Object.keys(this.cache);
  }

  /**
   * Obtener estadísticas
   */
  stats() {
    return {
      size: Object.keys(this.cache).length,
      hits: 0, // Implementar contadores si es necesario
      misses: 0,
    };
  }
}

// Instancia singleton
let instance = null;

/**
 * Obtener instancia del caché
 */
function getCache() {
  if (!instance) {
    instance = new MemoryCache();
  }
  return instance;
}

module.exports = {
  MemoryCache,
  getCache,
};
