import { INVENTORY_CONSTANTS, API_ENDPOINTS, MESSAGES } from './constants';
import { generateId, delay, deepClone } from './helpers';
import LocalStorage from './storage';

/**
 * Clase para simular llamadas a API
 */
class InventoryAPI {
  constructor() {
    this.baseUrl = 'http://localhost:3000/api';
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    // Datos iniciales de ejemplo
    this.initialProducts = [
      {
        id: generateId(),
        sku: 'ELE-000001',
        name: 'Laptop Dell XPS 13',
        category: 'Electrónica',
        description: 'Laptop ultraportátil con procesador Intel i7',
        quantity: 15,
        price: 1299.99,
        cost: 1000.00,
        status: 'Disponible',
        unit: 'Unidad',
        supplier: 'Dell Technologies',
        location: 'Almacén A',
        barcode: '123456789012',
        weight: 1200,
        dimensions: { length: 30, width: 20, height: 1.5 },
        minStock: 5,
        maxStock: 50,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date('2024-01-15').toISOString()
      },
      {
        id: generateId(),
        sku: 'ACC-000002',
        name: 'Mouse Inalámbrico Logitech',
        category: 'Accesorios',
        description: 'Mouse ergonómico inalámbrico',
        quantity: 42,
        price: 29.99,
        cost: 15.00,
        status: 'Disponible',
        unit: 'Unidad',
        supplier: 'Logitech',
        location: 'Almacén B',
        barcode: '987654321098',
        weight: 150,
        dimensions: { length: 10, width: 6, height: 3 },
        minStock: 10,
        maxStock: 100,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date('2024-01-20').toISOString()
      },
      {
        id: generateId(),
        sku: 'ELE-000003',
        name: 'Monitor 24" Samsung',
        category: 'Electrónica',
        description: 'Monitor Full HD para oficina',
        quantity: 8,
        price: 199.99,
        cost: 150.00,
        status: 'Bajo Stock',
        unit: 'Unidad',
        supplier: 'Samsung',
        location: 'Almacén A',
        barcode: '456789012345',
        weight: 3500,
        dimensions: { length: 55, width: 35, height: 5 },
        minStock: 5,
        maxStock: 30,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date('2024-02-01').toISOString()
      },
      {
        id: generateId(),
        sku: 'ACC-000004',
        name: 'Teclado Mecánico RGB',
        category: 'Accesorios',
        description: 'Teclado mecánico con retroiluminación RGB',
        quantity: 0,
        price: 89.99,
        cost: 50.00,
        status: 'Agotado',
        unit: 'Unidad',
        supplier: 'Razer',
        location: 'Almacén B',
        barcode: '567890123456',
        weight: 800,
        dimensions: { length: 45, width: 15, height: 3 },
        minStock: 5,
        maxStock: 40,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date('2024-02-10').toISOString()
      },
      {
        id: generateId(),
        sku: 'OFF-000005',
        name: 'Impresora HP LaserJet',
        category: 'Oficina',
        description: 'Impresora láser multifunción',
        quantity: 5,
        price: 349.99,
        cost: 250.00,
        status: 'Disponible',
        unit: 'Unidad',
        supplier: 'HP Inc.',
        location: 'Almacén C',
        barcode: '678901234567',
        weight: 8000,
        dimensions: { length: 40, width: 35, height: 25 },
        minStock: 3,
        maxStock: 20,
        lastUpdated: new Date().toISOString(),
        createdAt: new Date('2024-02-15').toISOString()
      }
    ];
    
    // Inicializar datos si no existen
    this.initializeData();
  }
  
  /**
   * Inicializa los datos en localStorage
   */
  initializeData() {
    const existingData = LocalStorage.getInventoryData();
    if (!existingData || existingData.length === 0) {
      LocalStorage.saveInventoryData(this.initialProducts);
    }
  }
  
  /**
   * Simula una llamada a la API con retraso
   * @param {string} endpoint - Endpoint de la API
   * @param {object} options - Opciones de la solicitud
   * @returns {Promise} Promesa con la respuesta
   */
  async request(endpoint, options = {}) {
    const { method = 'GET', data = null, delayMs = 500 } = options;
    
    // Simular retraso de red
    await delay(delayMs);
    
    try {
      let result;
      
      switch (endpoint) {
        case API_ENDPOINTS.PRODUCTS:
          result = await this.handleProductsRequest(method, data);
          break;
          
        case API_ENDPOINTS.CATEGORIES:
          result = await this.handleCategoriesRequest(method, data);
          break;
          
        case API_ENDPOINTS.INVENTORY:
          result = await this.handleInventoryRequest(method, data);
          break;
          
        case API_ENDPOINTS.REPORTS:
          result = await this.handleReportsRequest(method, data);
          break;
          
        default:
          throw new Error(`Endpoint no válido: ${endpoint}`);
      }
      
      return {
        success: true,
        data: result,
        message: 'Operación exitosa'
      };
    } catch (error) {
      console.error('Error en la solicitud a la API:', error);
      return {
        success: false,
        error: error.message,
        message: MESSAGES.ERROR.NETWORK_ERROR
      };
    }
  }
  
  /**
   * Maneja las solicitudes de productos
   */
  async handleProductsRequest(method, data) {
    const products = LocalStorage.getInventoryData();
    
    switch (method.toUpperCase()) {
      case 'GET':
        return products;
        
      case 'POST':
        const newProduct = {
          ...data,
          id: generateId(),
          sku: `SKU-${Date.now().toString().slice(-6)}`,
          status: this.determineStatus(data.quantity),
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        const updatedProducts = [...products, newProduct];
        LocalStorage.saveInventoryData(updatedProducts);
        return newProduct;
        
      case 'PUT':
        const updatedProduct = {
          ...data,
          lastUpdated: new Date().toISOString(),
          status: this.determineStatus(data.quantity)
        };
        
        const index = products.findIndex(p => p.id === data.id);
        if (index === -1) {
          throw new Error(MESSAGES.ERROR.PRODUCT_NOT_FOUND);
        }
        
        products[index] = updatedProduct;
        LocalStorage.saveInventoryData(products);
        return updatedProduct;
        
      case 'DELETE':
        const filteredProducts = products.filter(p => p.id !== data.id);
        LocalStorage.saveInventoryData(filteredProducts);
        return { deleted: true, id: data.id };
        
      default:
        throw new Error(`Método no soportado: ${method}`);
    }
  }
  
  /**
   * Maneja las solicitudes de categorías
   */
  async handleCategoriesRequest(method, data) {
    const products = LocalStorage.getInventoryData();
    const categories = [...new Set(products.map(p => p.category))];
    
    if (method.toUpperCase() === 'GET') {
      return categories;
    }
    
    throw new Error(`Método no soportado para categorías: ${method}`);
  }
  
  /**
   * Maneja las solicitudes de inventario
   */
  async handleInventoryRequest(method, data) {
    const products = LocalStorage.getInventoryData();
    
    switch (method.toUpperCase()) {
      case 'GET':
        // Estadísticas del inventario
        const stats = this.calculateInventoryStats(products);
        return stats;
        
      case 'PUT':
        // Actualizar stock
        const { productId, quantity, action } = data;
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
          throw new Error(MESSAGES.ERROR.PRODUCT_NOT_FOUND);
        }
        
        const product = products[productIndex];
        let newQuantity = product.quantity;
        
        if (action === 'add') {
          newQuantity += quantity;
        } else if (action === 'remove') {
          newQuantity -= quantity;
          if (newQuantity < 0) newQuantity = 0;
        } else if (action === 'set') {
          newQuantity = quantity;
        }
        
        products[productIndex] = {
          ...product,
          quantity: newQuantity,
          status: this.determineStatus(newQuantity),
          lastUpdated: new Date().toISOString()
        };
        
        LocalStorage.saveInventoryData(products);
        return products[productIndex];
        
      default:
        throw new Error(`Método no soportado para inventario: ${method}`);
    }
  }
  
  /**
   * Maneja las solicitudes de reportes
   */
  async handleReportsRequest(method, data) {
    const products = LocalStorage.getInventoryData();
    
    if (method.toUpperCase() === 'GET') {
      const { type, startDate, endDate } = data || {};
      
      switch (type) {
        case 'low-stock':
          return products.filter(p => p.status === 'Bajo Stock');
          
        case 'out-of-stock':
          return products.filter(p => p.status === 'Agotado');
          
        case 'high-value':
          return products.filter(p => p.price * p.quantity > 1000);
          
        case 'sales':
          // Simular datos de ventas
          return this.generateSalesReport(startDate, endDate);
          
        default:
          return products;
      }
    }
    
    throw new Error(`Método no soportado para reportes: ${method}`);
  }
  
  /**
   * Determina el estado basado en la cantidad
   */
  determineStatus(quantity) {
    if (quantity <= 0) return 'Agotado';
    if (quantity <= 10) return 'Bajo Stock';
    return 'Disponible';
  }
  
  /**
   * Calcula estadísticas del inventario
   */
  calculateInventoryStats(products) {
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalCost = products.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
    const lowStockCount = products.filter(p => p.status === 'Bajo Stock').length;
    const outOfStockCount = products.filter(p => p.status === 'Agotado').length;
    const categoriesCount = [...new Set(products.map(p => p.category))].length;
    
    return {
      totalProducts,
      totalValue,
      totalCost,
      estimatedProfit: totalValue - totalCost,
      lowStockCount,
      outOfStockCount,
      categoriesCount,
      averagePrice: totalProducts > 0 ? totalValue / products.reduce((sum, p) => sum + p.quantity, 0) : 0,
      lastUpdated: new Date().toISOString()
    };
  }
  
  /**
   * Genera un reporte de ventas simulado
   */
  generateSalesReport(startDate, endDate) {
    const report = {
      period: { startDate, endDate },
      totalSales: 12500.75,
      totalItemsSold: 145,
      topProducts: [
        { name: 'Laptop Dell XPS 13', sales: 12, revenue: 15599.88 },
        { name: 'Mouse Inalámbrico', sales: 45, revenue: 1349.55 },
        { name: 'Monitor 24" Samsung', sales: 8, revenue: 1599.92 }
      ],
      dailySales: this.generateDailySalesData(30),
      categoriesRevenue: {
        'Electrónica': 8500.50,
        'Accesorios': 2500.25,
        'Oficina': 1500.00
      }
    };
    
    return report;
  }
  
  /**
   * Genera datos de ventas diarias
   */
  generateDailySalesData(days) {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 500) + 100,
        items: Math.floor(Math.random() * 20) + 5
      });
    }
    
    return data;
  }
  
  /**
   * Métodos de conveniencia
   */
  
  async getProducts() {
    return this.request(API_ENDPOINTS.PRODUCTS, { method: 'GET' });
  }
  
  async getProduct(id) {
    const products = LocalStorage.getInventoryData();
    const product = products.find(p => p.id === id);
    
    if (!product) {
      return {
        success: false,
        error: MESSAGES.ERROR.PRODUCT_NOT_FOUND,
        message: MESSAGES.ERROR.PRODUCT_NOT_FOUND
      };
    }
    
    return {
      success: true,
      data: product,
      message: 'Producto encontrado'
    };
  }
  
  async createProduct(productData) {
    return this.request(API_ENDPOINTS.PRODUCTS, {
      method: 'POST',
      data: productData
    });
  }
  
  async updateProduct(id, productData) {
    return this.request(API_ENDPOINTS.PRODUCTS, {
      method: 'PUT',
      data: { ...productData, id }
    });
  }
  
  async deleteProduct(id) {
    return this.request(API_ENDPOINTS.PRODUCTS, {
      method: 'DELETE',
      data: { id }
    });
  }
  
  async getCategories() {
    return this.request(API_ENDPOINTS.CATEGORIES, { method: 'GET' });
  }
  
  async getInventoryStats() {
    return this.request(API_ENDPOINTS.INVENTORY, { method: 'GET' });
  }
  
  async updateStock(productId, quantity, action = 'set') {
    return this.request(API_ENDPOINTS.INVENTORY, {
      method: 'PUT',
      data: { productId, quantity, action }
    });
  }
  
  async getReport(type, params = {}) {
    return this.request(API_ENDPOINTS.REPORTS, {
      method: 'GET',
      data: { type, ...params }
    });
  }
  
  async searchProducts(query, filters = {}) {
    await delay(300); // Simular búsqueda
    
    const products = LocalStorage.getInventoryData();
    let results = [...products];
    
    // Buscar por texto
    if (query) {
      const searchTerm = query.toLowerCase();
      results = results.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description?.toLowerCase().includes(searchTerm) ||
        product.sku.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }
    
    // Aplicar filtros
    if (filters.category) {
      results = results.filter(p => p.category === filters.category);
    }
    
    if (filters.status) {
      results = results.filter(p => p.status === filters.status);
    }
    
    if (filters.minPrice !== undefined) {
      results = results.filter(p => p.price >= filters.minPrice);
    }
    
    if (filters.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice);
    }
    
    if (filters.minQuantity !== undefined) {
      results = results.filter(p => p.quantity >= filters.minQuantity);
    }
    
    if (filters.maxQuantity !== undefined) {
      results = results.filter(p => p.quantity <= filters.maxQuantity);
    }
    
    // Ordenar resultados
    const sortField = filters.sortBy || 'name';
    const sortOrder = filters.sortOrder || 'asc';
    
    results.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return {
      success: true,
      data: {
        results,
        total: results.length,
        query,
        filters
      },
      message: `Encontrados ${results.length} productos`
    };
  }
}

export default InventoryAPI;