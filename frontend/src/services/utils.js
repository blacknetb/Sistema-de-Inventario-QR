import { constants } from './index';

const utils = {
  // Formatear número como moneda
  formatCurrency: (amount, currency = constants.CURRENCY.SYMBOL) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `${currency}0.00`;
    }
    
    const formatted = new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: constants.CURRENCY.DECIMAL_PLACES,
      maximumFractionDigits: constants.CURRENCY.DECIMAL_PLACES
    }).format(amount);
    
    return `${currency}${formatted}`;
  },

  // Formatear fecha
  formatDate: (date, format = 'display') => {
    if (!date) return 'N/A';
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    const seconds = dateObj.getSeconds().toString().padStart(2, '0');
    
    switch (format) {
      case 'api':
        return `${year}-${month}-${day}`;
      case 'api-with-time':
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`;
      case 'display-with-time':
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      case 'time-ago':
        return utils.getTimeAgo(dateObj);
      default:
        return `${day}/${month}/${year}`;
    }
  },

  // Obtener tiempo transcurrido (hace X tiempo)
  getTimeAgo: (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffSec < 60) {
      return 'hace unos segundos';
    } else if (diffMin < 60) {
      return `hace ${diffMin} minuto${diffMin > 1 ? 's' : ''}`;
    } else if (diffHour < 24) {
      return `hace ${diffHour} hora${diffHour > 1 ? 's' : ''}`;
    } else if (diffDay < 7) {
      return `hace ${diffDay} día${diffDay > 1 ? 's' : ''}`;
    } else {
      return utils.formatDate(date, 'display');
    }
  },

  // Generar ID único
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  },

  // Generar SKU automático
  generateSKU: (category, name) => {
    const categoryCode = category.substring(0, 3).toUpperCase();
    const nameCode = name.substring(0, 3).toUpperCase().replace(/\s/g, '');
    const randomNum = Math.floor(100 + Math.random() * 900);
    
    return `${categoryCode}-${nameCode}-${randomNum}`;
  },

  // Calcular valor total del inventario
  calculateTotalValue: (items) => {
    if (!Array.isArray(items)) return 0;
    
    return items.reduce((total, item) => {
      const quantity = item.quantity || 0;
      const price = item.price || 0;
      return total + (quantity * price);
    }, 0);
  },

  // Filtrar y ordenar items
  filterAndSortItems: (items, filters = {}, sortConfig = {}) => {
    let filtered = [...items];
    
    // Aplicar filtros
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }
    
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }
    
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(item => item.price >= filters.minPrice);
    }
    
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(item => item.price <= filters.maxPrice);
    }
    
    if (filters.minQuantity !== undefined) {
      filtered = filtered.filter(item => item.quantity >= filters.minQuantity);
    }
    
    if (filters.maxQuantity !== undefined) {
      filtered = filtered.filter(item => item.quantity <= filters.maxQuantity);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        (item.sku && item.sku.toLowerCase().includes(searchLower))
      );
    }
    
    // Aplicar ordenamiento
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (sortConfig.direction === 'desc') {
          return aValue < bValue ? 1 : -1;
        }
        return aValue > bValue ? 1 : -1;
      });
    }
    
    return filtered;
  },

  // Paginar array de datos
  paginate: (array, page = 1, pageSize = constants.PAGINATION.DEFAULT_PAGE_SIZE) => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      data: array.slice(startIndex, endIndex),
      page,
      pageSize,
      totalItems: array.length,
      totalPages: Math.ceil(array.length / pageSize),
      hasNextPage: endIndex < array.length,
      hasPrevPage: startIndex > 0
    };
  },

  // Convertir a mayúsculas la primera letra
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Truncar texto
  truncate: (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  },

  // Obtener color según estado
  getStatusColor: (status) => {
    return constants.STATUS_COLORS[status] || '#95a5a6';
  },

  // Obtener color para categoría
  getCategoryColor: (categoryName, categories = []) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : utils.getRandomColor();
  },

  // Generar color aleatorio
  getRandomColor: () => {
    const colors = constants.CATEGORY_COLORS;
    return colors[Math.floor(Math.random() * colors.length)];
  },

  // Calcular porcentaje
  calculatePercentage: (value, total) => {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  // Validar email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validar teléfono
  isValidPhone: (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  },

  // Escapar HTML
  escapeHTML: (text) => {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  // Escapar XML
  escapeXML: (text) => {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  },

  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Copiar al portapapeles
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      // Fallback para navegadores antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
      } catch {
        document.body.removeChild(textArea);
        return false;
      }
    }
  },

  // Descargar archivo
  downloadFile: (content, fileName, contentType) => {
    const a = document.createElement('a');
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  },

  // Leer archivo como texto
  readFileAsText: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => resolve(event.target.result);
      reader.onerror = (error) => reject(error);
      reader.readAsText(file);
    });
  },

  // Generar código de barras (simulado)
  generateBarcode: (sku) => {
    // Esta es una implementación simulada
    // En producción, usaría una librería como JsBarcode
    return `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(sku)}&code=Code128&dpi=96`;
  },

  // Generar QR (simulado)
  generateQR: (data) => {
    // Esta es una implementación simulada
    // En producción, usaría una librería como qrcode
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
  },

  // Calcular edad de un item en días
  getItemAge: (createdDate) => {
    const created = new Date(createdDate);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // Determinar si un item necesita reorden
  needsReorder: (item) => {
    const minStock = item.minimumStock || 5;
    return item.quantity <= minStock;
  },

  // Calcular cantidad sugerida para reorden
  calculateReorderQuantity: (item) => {
    const minStock = item.minimumStock || 5;
    const suggested = Math.max(10, minStock * 3);
    return suggested - item.quantity;
  }
};

export default utils;