import { INVENTORY_CONSTANTS } from './constants';
import { generateId } from './helpers';
import DateUtils from './dateUtils';

/**
 * Generador de datos mock para el sistema de inventario
 */
class MockDataGenerator {
  /**
   * Genera productos de ejemplo
   * @param {number} count - Cantidad de productos a generar
   * @returns {Array} Array de productos mock
   */
  static generateProducts(count = 20) {
    const categories = INVENTORY_CONSTANTS.CATEGORIES.slice(0, 8);
    const suppliers = [
      'Dell Technologies',
      'HP Inc.',
      'Lenovo',
      'Apple',
      'Samsung',
      'Logitech',
      'Microsoft',
      'Cisco',
      'Intel',
      'NVIDIA'
    ];
    
    const locations = ['Almacén A', 'Almacén B', 'Almacén C', 'Bodega Central', 'Sucursal Norte'];
    
    const products = [];
    
    for (let i = 0; i < count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const quantity = Math.floor(Math.random() * 100);
      const price = parseFloat((Math.random() * 1000 + 10).toFixed(2));
      const cost = parseFloat((price * (0.6 + Math.random() * 0.3)).toFixed(2));
      
      let status;
      if (quantity === 0) {
        status = 'Agotado';
      } else if (quantity <= 10) {
        status = 'Bajo Stock';
      } else {
        status = 'Disponible';
      }
      
      const product = {
        id: generateId(),
        sku: `${category.substring(0, 3).toUpperCase()}-${(1000 + i).toString().padStart(6, '0')}`,
        name: this.generateProductName(category, i),
        category,
        description: this.generateDescription(category),
        quantity,
        price,
        cost,
        status,
        unit: 'Unidad',
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        barcode: this.generateBarcode(),
        weight: Math.floor(Math.random() * 5000) + 100,
        dimensions: {
          length: Math.floor(Math.random() * 50) + 10,
          width: Math.floor(Math.random() * 30) + 5,
          height: Math.floor(Math.random() * 20) + 2
        },
        minStock: Math.floor(Math.random() * 10) + 5,
        maxStock: Math.floor(Math.random() * 100) + 50,
        lastUpdated: DateUtils.addDays(new Date(), -Math.floor(Math.random() * 30)).toISOString(),
        createdAt: DateUtils.addDays(new Date(), -Math.floor(Math.random() * 365)).toISOString()
      };
      
      products.push(product);
    }
    
    return products;
  }
  
  /**
   * Genera un nombre de producto
   */
  static generateProductName(category, index) {
    const prefixes = {
      'Electrónica': ['Laptop', 'Tablet', 'Smartphone', 'Monitor', 'Televisor', 'Router', 'Impresora'],
      'Accesorios': ['Mouse', 'Teclado', 'Audífonos', 'Cargador', 'Fundas', 'Soporte'],
      'Oficina': ['Escritorio', 'Silla', 'Archivador', 'Estante', 'Pizarra'],
      'Almacenamiento': ['Disco Duro', 'USB', 'SSD', 'Tarjeta SD', 'NAS'],
      'Redes': ['Switch', 'Router', 'Access Point', 'Cable Ethernet', 'Modem'],
      'Muebles': ['Mesa', 'Sillón', 'Estante', 'Repisa', 'Armario'],
      'Herramientas': ['Taladro', 'Destornillador', 'Martillo', 'Sierra', 'Pinzas'],
      'Software': ['Sistema Operativo', 'Suite Office', 'Antivirus', 'Editor', 'Gestor']
    };
    
    const suffixes = ['Pro', 'Plus', 'Elite', 'Basic', 'Standard', 'Advanced', 'Ultra', 'Max'];
    const brands = ['Dell', 'HP', 'Lenovo', 'Apple', 'Samsung', 'Logitech', 'Microsoft', 'Cisco'];
    
    const prefixList = prefixes[category] || ['Producto'];
    const prefix = prefixList[Math.floor(Math.random() * prefixList.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    const brand = brands[Math.floor(Math.random() * brands.length)];
    
    return `${brand} ${prefix} ${suffix} ${index + 1}`;
  }
  
  /**
   * Genera una descripción
   */
  static generateDescription(category) {
    const descriptions = {
      'Electrónica': 'Producto electrónico de última generación con características avanzadas y diseño moderno.',
      'Accesorios': 'Accesorio de alta calidad compatible con múltiples dispositivos y marcas.',
      'Oficina': 'Artículo de oficina diseñado para mejorar la productividad y comodidad en el trabajo.',
      'Almacenamiento': 'Dispositivo de almacenamiento de alta capacidad y velocidad para guardar tus datos importantes.',
      'Redes': 'Equipo de networking con características avanzadas para una conectividad óptima.',
      'Muebles': 'Mueble ergonómico y durable diseñado para espacios de trabajo y hogar.',
      'Herramientas': 'Herramienta profesional de alta resistencia y precisión para todo tipo de trabajos.',
      'Software': 'Software completo con todas las funcionalidades necesarias para optimizar tus procesos.'
    };
    
    return descriptions[category] || 'Producto de alta calidad para diversas aplicaciones.';
  }
  
  /**
   * Genera un código de barras
   */
  static generateBarcode() {
    let barcode = '';
    for (let i = 0; i < 12; i++) {
      barcode += Math.floor(Math.random() * 10);
    }
    return barcode;
  }
  
  /**
   * Genera datos de ventas
   * @param {number} count - Cantidad de ventas a generar
   * @param {Array} productIds - IDs de productos disponibles
   * @returns {Array} Array de ventas mock
   */
  static generateSales(count = 50, productIds = []) {
    const sales = [];
    const paymentMethods = ['Efectivo', 'Tarjeta', 'Transferencia', 'Cheque'];
    const statuses = ['Completado', 'Pendiente', 'Cancelado'];
    
    for (let i = 0; i < count; i++) {
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const price = parseFloat((Math.random() * 500 + 10).toFixed(2));
      const date = DateUtils.addDays(new Date(), -Math.floor(Math.random() * 90));
      
      const sale = {
        id: generateId(),
        productId,
        productName: `Producto ${productId.substring(0, 8)}`,
        quantity,
        price,
        total: price * quantity,
        customerName: this.generateCustomerName(),
        customerEmail: this.generateEmail(),
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        saleDate: date.toISOString(),
        invoiceNumber: `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${(1000 + i).toString().padStart(4, '0')}`
      };
      
      sales.push(sale);
    }
    
    return sales;
  }
  
  /**
   * Genera un nombre de cliente
   */
  static generateCustomerName() {
    const firstNames = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Laura', 'Pedro', 'Sofía', 'José', 'Elena'];
    const lastNames = ['García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González', 'Pérez', 'Sánchez', 'Ramírez', 'Cruz'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    return `${firstName} ${lastName}`;
  }
  
  /**
   * Genera un email
   */
  static generateEmail() {
    const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'empresa.com'];
    const name = this.generateCustomerName().toLowerCase().replace(/\s/g, '.');
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    return `${name}@${domain}`;
  }
  
  /**
   * Genera actividad reciente
   * @param {number} count - Cantidad de actividades a generar
   * @returns {Array} Array de actividades mock
   */
  static generateRecentActivity(count = 15) {
    const activities = [];
    const actions = [
      { type: 'add', text: 'Producto agregado', icon: '🆕' },
      { type: 'update', text: 'Stock actualizado', icon: '📝' },
      { type: 'sale', text: 'Venta realizada', icon: '💰' },
      { type: 'warning', text: 'Stock bajo detectado', icon: '⚠️' },
      { type: 'delete', text: 'Producto eliminado', icon: '🗑️' },
      { type: 'report', text: 'Reporte generado', icon: '📊' },
      { type: 'user', text: 'Usuario registrado', icon: '👤' }
    ];
    
    const products = this.generateProducts(10);
    
    for (let i = 0; i < count; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)];
      const product = products[Math.floor(Math.random() * products.length)];
      const hoursAgo = Math.floor(Math.random() * 48);
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      
      const activity = {
        id: generateId(),
        type: action.type,
        icon: action.icon,
        title: action.text,
        description: `${action.text}: ${product.name}`,
        user: this.generateCustomerName(),
        timestamp: timestamp.toISOString(),
        productId: product.id,
        productName: product.name,
        details: this.generateActivityDetails(action.type, product)
      };
      
      activities.push(activity);
    }
    
    // Ordenar por fecha (más reciente primero)
    return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }
  
  /**
   * Genera detalles de actividad
   */
  static generateActivityDetails(type, product) {
    switch (type) {
      case 'add':
        return `Se agregó "${product.name}" con ${product.quantity} unidades a $${product.price} cada una`;
      case 'update':
        const newQuantity = Math.floor(Math.random() * 100);
        return `Stock de "${product.name}" actualizado de ${product.quantity} a ${newQuantity} unidades`;
      case 'sale':
        const sold = Math.floor(Math.random() * 5) + 1;
        return `Vendidas ${sold} unidades de "${product.name}" por $${(product.price * sold).toFixed(2)}`;
      case 'warning':
        return `Stock bajo: "${product.name}" tiene solo ${product.quantity} unidades`;
      default:
        return `Actividad registrada para "${product.name}"`;
    }
  }
  
  /**
   * Genera datos para gráficos
   * @param {string} type - Tipo de gráfico
   * @param {Object} options - Opciones de generación
   * @returns {Array} Datos para gráficos
   */
  static generateChartData(type = 'sales', options = {}) {
    const { days = 30, categories = INVENTORY_CONSTANTS.CATEGORIES.slice(0, 5) } = options;
    
    switch (type) {
      case 'sales':
        return this.generateSalesData(days);
        
      case 'inventory':
        return this.generateInventoryData(categories);
        
      case 'categories':
        return this.generateCategoryData(categories);
        
      case 'status':
        return this.generateStatusData();
        
      default:
        return this.generateSalesData(days);
    }
  }
  
  /**
   * Genera datos de ventas
   */
  static generateSalesData(days) {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 1000) + 200,
        orders: Math.floor(Math.random() * 20) + 5,
        revenue: Math.floor(Math.random() * 5000) + 1000
      });
    }
    
    return data;
  }
  
  /**
   * Genera datos de inventario por categoría
   */
  static generateInventoryData(categories) {
    return categories.map(category => {
      const value = Math.floor(Math.random() * 10000) + 1000;
      const items = Math.floor(Math.random() * 50) + 10;
      
      return {
        category,
        value,
        items,
        percentage: 0 // Se calculará después
      };
    });
  }
  
  /**
   * Genera datos por categoría
   */
  static generateCategoryData(categories) {
    const total = categories.length * 100;
    
    return categories.map((category, index) => {
      const value = Math.floor(Math.random() * 70) + 30;
      const percentage = (value / total) * 100;
      
      return {
        category,
        value,
        percentage: parseFloat(percentage.toFixed(2))
      };
    });
  }
  
  /**
   * Genera datos por estado
   */
  static generateStatusData() {
    return [
      { status: 'Disponible', count: Math.floor(Math.random() * 50) + 30, color: '#2ecc71' },
      { status: 'Bajo Stock', count: Math.floor(Math.random() * 15) + 5, color: '#f39c12' },
      { status: 'Agotado', count: Math.floor(Math.random() * 10) + 1, color: '#e74c3c' }
    ];
  }
}

export default MockDataGenerator;