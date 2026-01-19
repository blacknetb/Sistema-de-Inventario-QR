import { INVENTORY_CONSTANTS } from './constants';

/**
 * Clase para cálculos relacionados con el inventario
 */
class InventoryCalculations {
  /**
   * Calcula el valor total del inventario
   * @param {Array} products - Lista de productos
   * @returns {number} Valor total
   */
  static calculateTotalValue(products) {
    if (!products || !Array.isArray(products)) return 0;
    
    return products.reduce((total, product) => {
      return total + (product.price * product.quantity);
    }, 0);
  }
  
  /**
   * Calcula el costo total del inventario
   * @param {Array} products - Lista de productos
   * @returns {number} Costo total
   */
  static calculateTotalCost(products) {
    if (!products || !Array.isArray(products)) return 0;
    
    return products.reduce((total, product) => {
      return total + ((product.cost || 0) * product.quantity);
    }, 0);
  }
  
  /**
   * Calcula el margen de ganancia estimado
   * @param {Array} products - Lista de productos
   * @returns {number} Margen de ganancia
   */
  static calculateEstimatedProfit(products) {
    const totalValue = this.calculateTotalValue(products);
    const totalCost = this.calculateTotalCost(products);
    return totalValue - totalCost;
  }
  
  /**
   * Calcula el margen de ganancia porcentual
   * @param {Array} products - Lista de productos
   * @returns {number} Margen porcentual
   */
  static calculateProfitMargin(products) {
    const totalValue = this.calculateTotalValue(products);
    const totalCost = this.calculateTotalCost(products);
    
    if (totalCost === 0) return 0;
    
    return ((totalValue - totalCost) / totalCost) * 100;
  }
  
  /**
   * Calcula el valor promedio por producto
   * @param {Array} products - Lista de productos
   * @returns {number} Valor promedio
   */
  static calculateAverageValue(products) {
    if (!products || products.length === 0) return 0;
    
    const totalValue = this.calculateTotalValue(products);
    const totalItems = products.reduce((sum, product) => sum + product.quantity, 0);
    
    if (totalItems === 0) return 0;
    
    return totalValue / totalItems;
  }
  
  /**
   * Calcula el porcentaje de productos por categoría
   * @param {Array} products - Lista de productos
   * @returns {Array} Porcentajes por categoría
   */
  static calculateCategoryDistribution(products) {
    if (!products || products.length === 0) return [];
    
    const categoryMap = {};
    
    // Contar productos por categoría
    products.forEach(product => {
      const category = product.category || 'Sin categoría';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    
    // Convertir a array y calcular porcentajes
    return Object.entries(categoryMap)
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / products.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Calcula el porcentaje de productos por estado
   * @param {Array} products - Lista de productos
   * @returns {Array} Porcentajes por estado
   */
  static calculateStatusDistribution(products) {
    if (!products || products.length === 0) return [];
    
    const statusMap = {};
    
    // Contar productos por estado
    products.forEach(product => {
      const status = product.status || 'Desconocido';
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    
    // Convertir a array y calcular porcentajes
    return Object.entries(statusMap)
      .map(([status, count]) => ({
        status,
        count,
        percentage: (count / products.length) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }
  
  /**
   * Calcula los productos que necesitan reposición
   * @param {Array} products - Lista de productos
   * @param {number} threshold - Umbral para stock bajo
   * @returns {Array} Productos que necesitan reposición
   */
  static calculateReplenishmentNeeds(products, threshold = INVENTORY_CONSTANTS.ALERT_THRESHOLDS.LOW_STOCK) {
    if (!products || products.length === 0) return [];
    
    return products
      .filter(product => product.quantity <= threshold)
      .map(product => ({
        ...product,
        needed: product.minStock ? Math.max(0, product.minStock - product.quantity) : threshold - product.quantity,
        priority: product.quantity === 0 ? 'alta' : product.quantity <= 3 ? 'media' : 'baja'
      }))
      .sort((a, b) => a.quantity - b.quantity);
  }
  
  /**
   * Calcula el valor del inventario por categoría
   * @param {Array} products - Lista de productos
   * @returns {Array} Valor por categoría
   */
  static calculateValueByCategory(products) {
    if (!products || products.length === 0) return [];
    
    const categoryValueMap = {};
    
    products.forEach(product => {
      const category = product.category || 'Sin categoría';
      const value = product.price * product.quantity;
      categoryValueMap[category] = (categoryValueMap[category] || 0) + value;
    });
    
    return Object.entries(categoryValueMap)
      .map(([category, value]) => ({
        category,
        value,
        percentage: (value / this.calculateTotalValue(products)) * 100
      }))
      .sort((a, b) => b.value - a.value);
  }
  
  /**
   * Calcula la rotación de inventario (simplificado)
   * @param {Array} products - Lista de productos
   * @param {Array} sales - Datos de ventas
   * @returns {number} Índice de rotación
   */
  static calculateInventoryTurnover(products, sales = []) {
    const averageInventory = this.calculateTotalCost(products) / 2;
    
    if (averageInventory === 0) return 0;
    
    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    
    return totalSales / averageInventory;
  }
  
  /**
   * Calcula el índice de disponibilidad del inventario
   * @param {Array} products - Lista de productos
   * @returns {number} Índice de disponibilidad (0-100)
   */
  static calculateAvailabilityIndex(products) {
    if (!products || products.length === 0) return 100;
    
    const availableProducts = products.filter(p => p.quantity > 0).length;
    return (availableProducts / products.length) * 100;
  }
  
  /**
   * Calcula el valor del inventario por ubicación
   * @param {Array} products - Lista de productos
   * @returns {Array} Valor por ubicación
   */
  static calculateValueByLocation(products) {
    if (!products || products.length === 0) return [];
    
    const locationValueMap = {};
    
    products.forEach(product => {
      const location = product.location || 'Sin ubicación';
      const value = product.price * product.quantity;
      locationValueMap[location] = (locationValueMap[location] || 0) + value;
    });
    
    return Object.entries(locationValueMap)
      .map(([location, value]) => ({
        location,
        value,
        itemCount: products.filter(p => p.location === location).length
      }))
      .sort((a, b) => b.value - a.value);
  }
  
  /**
   * Calcula la proyección de stock basado en ventas históricas
   * @param {Object} product - Producto a analizar
   * @param {Array} salesHistory - Historial de ventas
   * @param {number} days - Días a proyectar
   * @returns {Object} Proyección de stock
   */
  static calculateStockProjection(product, salesHistory, days = 30) {
    if (!product || !salesHistory) return null;
    
    const productSales = salesHistory.filter(sale => sale.productId === product.id);
    
    if (productSales.length === 0) {
      return {
        currentStock: product.quantity,
        dailyAverage: 0,
        daysRemaining: Infinity,
        projectedStock: product.quantity,
        status: 'Sin datos de ventas'
      };
    }
    
    // Calcular promedio diario de ventas
    const totalSold = productSales.reduce((sum, sale) => sum + sale.quantity, 0);
    const daysOfHistory = Math.max(1, productSales.length);
    const dailyAverage = totalSold / daysOfHistory;
    
    // Calcular días restantes de stock
    const daysRemaining = dailyAverage > 0 ? Math.floor(product.quantity / dailyAverage) : Infinity;
    
    // Proyectar stock futuro
    const projectedStock = Math.max(0, product.quantity - (dailyAverage * days));
    
    // Determinar estado
    let status = 'Estable';
    if (daysRemaining < 7) status = 'Urgente';
    else if (daysRemaining < 30) status = 'Atención';
    
    return {
      currentStock: product.quantity,
      dailyAverage,
      daysRemaining: dailyAverage > 0 ? daysRemaining : Infinity,
      projectedStock,
      status,
      recommendation: dailyAverage > 0 && daysRemaining < 30
        ? `Reabastecer en ${Math.ceil(dailyAverage * 30 - product.quantity)} unidades`
        : 'Stock suficiente'
    };
  }
  
  /**
   * Calcula el índice ABC de análisis de inventario
   * @param {Array} products - Lista de productos
   * @returns {Object} Clasificación ABC
   */
  static calculateABCAnalysis(products) {
    if (!products || products.length === 0) return { A: [], B: [], C: [] };
    
    // Calcular valor individual de cada producto
    const productsWithValue = products
      .map(product => ({
        ...product,
        value: product.price * product.quantity
      }))
      .sort((a, b) => b.value - a.value);
    
    // Calcular valor acumulado y porcentaje
    let cumulativeValue = 0;
    const totalValue = this.calculateTotalValue(products);
    
    const analyzedProducts = productsWithValue.map(product => {
      cumulativeValue += product.value;
      return {
        ...product,
        cumulativeValue,
        percentage: (cumulativeValue / totalValue) * 100
      };
    });
    
    // Clasificar en categorías A, B, C
    const classification = {
      A: [], // 80% del valor (primeros productos)
      B: [], // 15% del valor
      C: []  // 5% del valor
    };
    
    analyzedProducts.forEach(product => {
      if (product.percentage <= 80) {
        classification.A.push(product);
      } else if (product.percentage <= 95) {
        classification.B.push(product);
      } else {
        classification.C.push(product);
      }
    });
    
    return classification;
  }
}

export default InventoryCalculations;