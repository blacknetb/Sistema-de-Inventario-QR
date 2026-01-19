import { STORAGE_KEYS } from './constants';

/**
 * Clase para manejar el almacenamiento local
 */
class LocalStorage {
  /**
   * Obtiene un valor del almacenamiento local
   * @param {string} key - Clave del valor
   * @param {any} defaultValue - Valor por defecto
   * @returns {any} Valor almacenado o el valor por defecto
   */
  static get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error al obtener ${key} del almacenamiento local:`, error);
      return defaultValue;
    }
  }
  
  /**
   * Guarda un valor en el almacenamiento local
   * @param {string} key - Clave del valor
   * @param {any} value - Valor a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  static set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Error al guardar ${key} en el almacenamiento local:`, error);
      return false;
    }
  }
  
  /**
   * Elimina un valor del almacenamiento local
   * @param {string} key - Clave del valor a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error al eliminar ${key} del almacenamiento local:`, error);
      return false;
    }
  }
  
  /**
   * Limpia todo el almacenamiento local
   * @returns {boolean} True si se limpió correctamente
   */
  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error al limpiar el almacenamiento local:', error);
      return false;
    }
  }
  
  /**
   * Obtiene los datos del inventario
   * @returns {Array} Datos del inventario
   */
  static getInventoryData() {
    return this.get(STORAGE_KEYS.INVENTORY_DATA, []);
  }
  
  /**
   * Guarda los datos del inventario
   * @param {Array} data - Datos del inventario
   * @returns {boolean} True si se guardó correctamente
   */
  static saveInventoryData(data) {
    return this.set(STORAGE_KEYS.INVENTORY_DATA, data);
  }
  
  /**
   * Obtiene las preferencias del usuario
   * @returns {object} Preferencias del usuario
   */
  static getUserPreferences() {
    const defaultPreferences = {
      theme: 'light',
      language: 'es',
      pageSize: 10,
      currency: 'USD',
      notifications: true,
      autoSave: true
    };
    
    return this.get(STORAGE_KEYS.USER_PREFERENCES, defaultPreferences);
  }
  
  /**
   * Guarda las preferencias del usuario
   * @param {object} preferences - Preferencias del usuario
   * @returns {boolean} True si se guardó correctamente
   */
  static saveUserPreferences(preferences) {
    const current = this.getUserPreferences();
    return this.set(STORAGE_KEYS.USER_PREFERENCES, { ...current, ...preferences });
  }
  
  /**
   * Obtiene las búsquedas recientes
   * @param {number} limit - Límite de resultados
   * @returns {Array} Búsquedas recientes
   */
  static getRecentSearches(limit = 10) {
    const searches = this.get(STORAGE_KEYS.RECENT_SEARCHES, []);
    return searches.slice(0, limit);
  }
  
  /**
   * Agrega una búsqueda a las recientes
   * @param {string} searchTerm - Término de búsqueda
   * @param {number} maxSearches - Máximo de búsquedas a guardar
   * @returns {boolean} True si se guardó correctamente
   */
  static addRecentSearch(searchTerm, maxSearches = 20) {
    if (!searchTerm || searchTerm.trim() === '') return false;
    
    const searches = this.get(STORAGE_KEYS.RECENT_SEARCHES, []);
    const filtered = searches.filter(s => s !== searchTerm);
    filtered.unshift(searchTerm);
    
    if (filtered.length > maxSearches) {
      filtered.pop();
    }
    
    return this.set(STORAGE_KEYS.RECENT_SEARCHES, filtered);
  }
  
  /**
   * Limpia las búsquedas recientes
   * @returns {boolean} True si se limpió correctamente
   */
  static clearRecentSearches() {
    return this.remove(STORAGE_KEYS.RECENT_SEARCHES);
  }
  
  /**
   * Obtiene los items del carrito
   * @returns {Array} Items del carrito
   */
  static getCartItems() {
    return this.get(STORAGE_KEYS.CART_ITEMS, []);
  }
  
  /**
   * Guarda los items del carrito
   * @param {Array} items - Items del carrito
   * @returns {boolean} True si se guardó correctamente
   */
  static saveCartItems(items) {
    return this.set(STORAGE_KEYS.CART_ITEMS, items);
  }
  
  /**
   * Agrega un item al carrito
   * @param {object} item - Item a agregar
   * @returns {boolean} True si se agregó correctamente
   */
  static addToCart(item) {
    const cart = this.getCartItems();
    
    // Verificar si el item ya está en el carrito
    const existingIndex = cart.findIndex(cartItem => cartItem.id === item.id);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad si ya existe
      cart[existingIndex].quantity += item.quantity || 1;
    } else {
      // Agregar nuevo item
      cart.push({
        ...item,
        quantity: item.quantity || 1,
        addedAt: new Date().toISOString()
      });
    }
    
    return this.saveCartItems(cart);
  }
  
  /**
   * Elimina un item del carrito
   * @param {string|number} itemId - ID del item a eliminar
   * @returns {boolean} True si se eliminó correctamente
   */
  static removeFromCart(itemId) {
    const cart = this.getCartItems();
    const filtered = cart.filter(item => item.id !== itemId);
    return this.saveCartItems(filtered);
  }
  
  /**
   * Actualiza la cantidad de un item en el carrito
   * @param {string|number} itemId - ID del item
   * @param {number} quantity - Nueva cantidad
   * @returns {boolean} True si se actualizó correctamente
   */
  static updateCartItemQuantity(itemId, quantity) {
    if (quantity <= 0) {
      return this.removeFromCart(itemId);
    }
    
    const cart = this.getCartItems();
    const itemIndex = cart.findIndex(item => item.id === itemId);
    
    if (itemIndex >= 0) {
      cart[itemIndex].quantity = quantity;
      return this.saveCartItems(cart);
    }
    
    return false;
  }
  
  /**
   * Limpia el carrito
   * @returns {boolean} True si se limpió correctamente
   */
  static clearCart() {
    return this.remove(STORAGE_KEYS.CART_ITEMS);
  }
  
  /**
   * Obtiene el total del carrito
   * @returns {number} Total del carrito
   */
  static getCartTotal() {
    const cart = this.getCartItems();
    return cart.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  }
  
  /**
   * Obtiene la cantidad total de items en el carrito
   * @returns {number} Cantidad total de items
   */
  static getCartItemCount() {
    const cart = this.getCartItems();
    return cart.reduce((count, item) => count + item.quantity, 0);
  }
}

export default LocalStorage;