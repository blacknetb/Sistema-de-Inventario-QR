import { INVENTORY_CONSTANTS } from './constants';

/**
 * Clase para filtrar productos del inventario
 */
class InventoryFilters {
  /**
   * Filtra productos por múltiples criterios
   * @param {Array} products - Lista de productos
   * @param {Object} filters - Criterios de filtrado
   * @returns {Array} Productos filtrados
   */
  static filterProducts(products, filters = {}) {
    if (!products || !Array.isArray(products)) return [];
    
    let filtered = [...products];
    
    // Aplicar filtros en orden
    
    // 1. Filtro por texto
    if (filters.search) {
      filtered = this.filterBySearch(filtered, filters.search);
    }
    
    // 2. Filtro por categoría
    if (filters.category && filters.category !== 'all') {
      filtered = this.filterByCategory(filtered, filters.category);
    }
    
    // 3. Filtro por estado
    if (filters.status && filters.status !== 'all') {
      filtered = this.filterByStatus(filtered, filters.status);
    }
    
    // 4. Filtro por rango de precio
    if (filters.priceRange) {
      filtered = this.filterByPriceRange(filtered, filters.priceRange);
    }
    
    // 5. Filtro por rango de cantidad
    if (filters.quantityRange) {
      filtered = this.filterByQuantityRange(filtered, filters.quantityRange);
    }
    
    // 6. Filtro por proveedor
    if (filters.supplier && filters.supplier !== 'all') {
      filtered = this.filterBySupplier(filtered, filters.supplier);
    }
    
    // 7. Filtro por ubicación
    if (filters.location && filters.location !== 'all') {
      filtered = this.filterByLocation(filtered, filters.location);
    }
    
    // 8. Filtro por fecha
    if (filters.dateRange) {
      filtered = this.filterByDateRange(filtered, filters.dateRange);
    }
    
    return filtered;
  }
  
  /**
   * Filtra productos por término de búsqueda
   */
  static filterBySearch(products, searchTerm) {
    if (!searchTerm) return products;
    
    const term = searchTerm.toLowerCase().trim();
    
    return products.filter(product => {
      return (
        product.name.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.sku?.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.supplier?.toLowerCase().includes(term) ||
        product.barcode?.includes(term)
      );
    });
  }
  
  /**
   * Filtra productos por categoría
   */
  static filterByCategory(products, category) {
    return products.filter(product => product.category === category);
  }
  
  /**
   * Filtra productos por estado
   */
  static filterByStatus(products, status) {
    return products.filter(product => product.status === status);
  }
  
  /**
   * Filtra productos por rango de precio
   */
  static filterByPriceRange(products, priceRange) {
    const { min, max } = priceRange;
    
    return products.filter(product => {
      const price = product.price || 0;
      const meetsMin = min === undefined || price >= min;
      const meetsMax = max === undefined || price <= max;
      return meetsMin && meetsMax;
    });
  }
  
  /**
   * Filtra productos por rango de cantidad
   */
  static filterByQuantityRange(products, quantityRange) {
    const { min, max } = quantityRange;
    
    return products.filter(product => {
      const quantity = product.quantity || 0;
      const meetsMin = min === undefined || quantity >= min;
      const meetsMax = max === undefined || quantity <= max;
      return meetsMin && meetsMax;
    });
  }
  
  /**
   * Filtra productos por proveedor
   */
  static filterBySupplier(products, supplier) {
    return products.filter(product => product.supplier === supplier);
  }
  
  /**
   * Filtra productos por ubicación
   */
  static filterByLocation(products, location) {
    return products.filter(product => product.location === location);
  }
  
  /**
   * Filtra productos por rango de fecha
   */
  static filterByDateRange(products, dateRange) {
    const { startDate, endDate, field = 'createdAt' } = dateRange;
    
    return products.filter(product => {
      const productDate = new Date(product[field]);
      const meetsStart = !startDate || productDate >= new Date(startDate);
      const meetsEnd = !endDate || productDate <= new Date(endDate);
      return meetsStart && meetsEnd;
    });
  }
  
  /**
   * Obtiene todas las categorías únicas de los productos
   */
  static getUniqueCategories(products) {
    if (!products) return [];
    const categories = [...new Set(products.map(p => p.category))];
    return categories.sort();
  }
  
  /**
   * Obtiene todos los estados únicos de los productos
   */
  static getUniqueStatuses(products) {
    if (!products) return [];
    const statuses = [...new Set(products.map(p => p.status))];
    return statuses.sort();
  }
  
  /**
   * Obtiene todos los proveedores únicos
   */
  static getUniqueSuppliers(products) {
    if (!products) return [];
    const suppliers = [...new Set(products.map(p => p.supplier).filter(Boolean))];
    return suppliers.sort();
  }
  
  /**
   * Obtiene todas las ubicaciones únicas
   */
  static getUniqueLocations(products) {
    if (!products) return [];
    const locations = [...new Set(products.map(p => p.location).filter(Boolean))];
    return locations.sort();
  }
  
  /**
   * Ordena productos por campo específico
   */
  static sortProducts(products, sortConfig) {
    const { field = 'name', direction = 'asc' } = sortConfig;
    
    return [...products].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];
      
      // Manejar valores nulos/undefined
      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';
      
      // Convertir a minúsculas si son strings
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Comparar
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  /**
   * Pagina los productos
   */
  static paginateProducts(products, pagination) {
    const { page = 1, pageSize = INVENTORY_CONSTANTS.PAGINATION.DEFAULT_PAGE_SIZE } = pagination;
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      items: products.slice(startIndex, endIndex),
      total: products.length,
      page,
      pageSize,
      totalPages: Math.ceil(products.length / pageSize),
      hasNext: endIndex < products.length,
      hasPrev: startIndex > 0
    };
  }
  
  /**
   * Obtiene productos con stock bajo
   */
  static getLowStockProducts(products, threshold = INVENTORY_CONSTANTS.ALERT_THRESHOLDS.LOW_STOCK) {
    return products.filter(product => 
      product.quantity > 0 && product.quantity <= threshold
    );
  }
  
  /**
   * Obtiene productos agotados
   */
  static getOutOfStockProducts(products) {
    return products.filter(product => product.quantity === 0);
  }
  
  /**
   * Obtiene productos de alto valor
   */
  static getHighValueProducts(products, threshold = INVENTORY_CONSTANTS.ALERT_THRESHOLDS.HIGH_VALUE) {
    return products.filter(product => product.price >= threshold);
  }
  
  /**
   * Agrupa productos por categoría
   */
  static groupByCategory(products) {
    if (!products) return {};
    
    const grouped = {};
    
    products.forEach(product => {
      const category = product.category || 'Sin categoría';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(product);
    });
    
    return grouped;
  }
  
  /**
   * Agrupa productos por estado
   */
  static groupByStatus(products) {
    if (!products) return {};
    
    const grouped = {};
    
    products.forEach(product => {
      const status = product.status || 'Desconocido';
      if (!grouped[status]) {
        grouped[status] = [];
      }
      grouped[status].push(product);
    });
    
    return grouped;
  }
  
  /**
   * Obtiene productos que coinciden con múltiples criterios
   */
  static getProductsByMultipleCriteria(products, criteria) {
    return products.filter(product => {
      return Object.entries(criteria).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(product[key]);
        }
        return product[key] === value;
      });
    });
  }
  
  /**
   * Busca productos similares
   */
  static findSimilarProducts(product, allProducts, limit = 5) {
    if (!product || !allProducts) return [];
    
    // Calcular similitud basada en categoría y precio
    const productsWithScore = allProducts
      .filter(p => p.id !== product.id)
      .map(p => {
        let score = 0;
        
        // Misma categoría
        if (p.category === product.category) score += 3;
        
        // Precio similar (±20%)
        const priceDiff = Math.abs(p.price - product.price);
        const priceThreshold = product.price * 0.2;
        if (priceDiff <= priceThreshold) score += 2;
        
        // Mismo proveedor
        if (p.supplier === product.supplier) score += 1;
        
        return { ...p, similarityScore: score };
      })
      .filter(p => p.similarityScore > 0)
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, limit);
    
    return productsWithScore;
  }
}

export default InventoryFilters;