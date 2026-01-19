/**
 * Utilidades para el sistema de reportes de inventario
 */

// Formatear moneda
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Formatear fecha
export const formatDate = (dateString, format = 'medium') => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  const options = {
    short: { month: 'short', day: 'numeric' },
    medium: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
    time: { hour: '2-digit', minute: '2-digit' }
  };
  
  return date.toLocaleDateString('es-ES', options[format] || options.medium);
};

// Formatear número con separadores
export const formatNumber = (number) => {
  return new Intl.NumberFormat('es-ES').format(number || 0);
};

// Calcular métricas de inventario
export const calculateInventoryMetrics = (inventoryData) => {
  if (!inventoryData || inventoryData.length === 0) {
    return {
      totalItems: 0,
      totalValue: 0,
      averageValue: 0,
      lowStockItems: 0,
      outOfStock: 0,
      categoriesCount: 0,
      averageStock: 0,
      turnoverRate: 0
    };
  }

  const metrics = {
    totalItems: inventoryData.length,
    totalValue: 0,
    averageValue: 0,
    lowStockItems: 0,
    outOfStock: 0,
    categories: new Set(),
    categoryValue: {},
    averageStock: 0,
    turnoverRate: 0,
    totalStock: 0
  };

  inventoryData.forEach(item => {
    // Valor total
    const itemValue = (item.price || 0) * (item.quantity || 0);
    metrics.totalValue += itemValue;
    
    // Stock
    metrics.totalStock += item.quantity || 0;
    
    // Categorías
    if (item.category) {
      metrics.categories.add(item.category);
      
      if (!metrics.categoryValue[item.category]) {
        metrics.categoryValue[item.category] = 0;
      }
      metrics.categoryValue[item.category] += itemValue;
    }
    
    // Niveles de stock
    if (item.quantity === 0) {
      metrics.outOfStock++;
    } else if (item.quantity <= 5) {
      metrics.lowStockItems++;
    }
  });

  // Cálculos derivados
  metrics.averageValue = metrics.totalValue / metrics.totalItems;
  metrics.averageStock = metrics.totalStock / metrics.totalItems;
  metrics.categoriesCount = metrics.categories.size;
  
  // Calcular rotación de inventario (simplificado)
  // En un sistema real, esto usaría datos de ventas históricas
  metrics.turnoverRate = metrics.totalValue > 0 ? 
    (metrics.totalStock / (metrics.totalValue / 30)) : 0;

  return metrics;
};

// Calcular métricas de ventas
export const calculateSalesMetrics = (salesData, timePeriod = 'month') => {
  if (!salesData || salesData.length === 0) {
    return {
      totalSales: 0,
      totalRevenue: 0,
      averageSale: 0,
      totalItems: 0,
      uniqueCustomers: 0,
      repeatCustomers: 0,
      conversionRate: 0,
      totalVisitors: 0
    };
  }

  const metrics = {
    totalSales: salesData.length,
    totalRevenue: 0,
    totalItems: 0,
    uniqueCustomers: new Set(),
    customerSales: {},
    dailySales: {},
    categorySales: {},
    paymentMethodStats: {},
    bestDay: null,
    peakHour: null
  };

  salesData.forEach(sale => {
    // Ingresos totales
    metrics.totalRevenue += sale.total || 0;
    
    // Items vendidos
    if (sale.items) {
      sale.items.forEach(item => {
        metrics.totalItems += item.quantity || 1;
        
        // Ventas por categoría
        if (item.category) {
          if (!metrics.categorySales[item.category]) {
            metrics.categorySales[item.category] = 0;
          }
          metrics.categorySales[item.category] += (item.price || 0) * (item.quantity || 1);
        }
      });
    }
    
    // Clientes
    if (sale.customerId) {
      metrics.uniqueCustomers.add(sale.customerId);
      
      if (!metrics.customerSales[sale.customerId]) {
        metrics.customerSales[sale.customerId] = 0;
      }
      metrics.customerSales[sale.customerId]++;
    }
    
    // Ventas diarias
    const saleDate = sale.date ? sale.date.split('T')[0] : new Date().toISOString().split('T')[0];
    if (!metrics.dailySales[saleDate]) {
      metrics.dailySales[saleDate] = 0;
    }
    metrics.dailySales[saleDate] += sale.total || 0;
    
    // Método de pago
    if (sale.paymentMethod) {
      if (!metrics.paymentMethodStats[sale.paymentMethod]) {
        metrics.paymentMethodStats[sale.paymentMethod] = 0;
      }
      metrics.paymentMethodStats[sale.paymentMethod]++;
    }
    
    // Hora pico
    if (sale.time) {
      const hour = parseInt(sale.time.split(':')[0]);
      // Implementar lógica para encontrar hora pico
    }
  });

  // Cálculos derivados
  metrics.averageSale = metrics.totalRevenue / metrics.totalSales;
  metrics.uniqueCustomers = metrics.uniqueCustomers.size;
  metrics.repeatCustomers = Object.values(metrics.customerSales).filter(count => count > 1).length;
  
  // Convertir objetos a arrays para gráficos
  metrics.dailySalesArray = Object.entries(metrics.dailySales)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));
  
  metrics.categorySalesArray = Object.entries(metrics.categorySales)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);
  
  // Encontrar mejor día
  if (metrics.dailySalesArray.length > 0) {
    metrics.bestDay = metrics.dailySalesArray.reduce((best, current) => 
      current.total > best.total ? current : best
    );
  }
  
  // Encontrar método de pago más usado
  if (Object.keys(metrics.paymentMethodStats).length > 0) {
    metrics.topPaymentMethod = Object.entries(metrics.paymentMethodStats)
      .sort((a, b) => b[1] - a[1])[0][0];
  }
  
  // Tasa de conversión (simulada)
  metrics.totalVisitors = metrics.totalSales * 10; // Simulación: 10 visitas por venta
  metrics.conversionRate = metrics.totalVisitors > 0 ? 
    metrics.totalSales / metrics.totalVisitors : 0;

  return metrics;
};

// Calcular métricas de stock
export const calculateStockMetrics = (inventoryData, alertThreshold = 5) => {
  const baseMetrics = calculateInventoryMetrics(inventoryData);
  
  const stockMetrics = {
    ...baseMetrics,
    alertThreshold: alertThreshold,
    stockValue: baseMetrics.totalValue,
    daysInStock: {},
    stockTurnover: {},
    reorderSuggestions: []
  };

  // Calcular días en stock (simplificado)
  inventoryData.forEach(item => {
    if (item.quantity > 0 && item.averageDailySales) {
      stockMetrics.daysInStock[item.id] = item.quantity / item.averageDailySales;
    }
  });

  // Calcular promedio de días en stock
  const daysValues = Object.values(stockMetrics.daysInStock);
  stockMetrics.averageDaysInStock = daysValues.length > 0 ? 
    daysValues.reduce((sum, days) => sum + days, 0) / daysValues.length : 0;

  // Sugerencias de reorden
  inventoryData.forEach(item => {
    if (item.quantity <= alertThreshold) {
      const suggestedOrder = Math.max(
        Math.ceil((item.averageMonthlySales || 10) * 2 - item.quantity),
        10
      );
      
      stockMetrics.reorderSuggestions.push({
        productId: item.id,
        productName: item.name,
        currentStock: item.quantity,
        suggestedOrder: suggestedOrder,
        estimatedCost: suggestedOrder * item.price,
        urgency: item.quantity === 0 ? 'Alta' : 'Media'
      });
    }
  });

  // Ordenar sugerencias por urgencia
  stockMetrics.reorderSuggestions.sort((a, b) => {
    if (a.urgency === b.urgency) {
      return b.estimatedCost - a.estimatedCost;
    }
    return a.urgency === 'Alta' ? -1 : 1;
  });

  return stockMetrics;
};

// Calcular métricas financieras
export const calculateFinancialMetrics = (financialData, timePeriod = 'month') => {
  // En un sistema real, esto vendría de una base de datos
  // Por ahora, simularemos datos
  
  const metrics = {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    grossMargin: 0,
    profitMargin: 0,
    revenueGrowth: 0,
    expenseGrowth: 0,
    cashflow: 0,
    roi: 0,
    currentRatio: 0,
    inventoryTurnover: 0,
    daysReceivable: 0
  };

  // Simular datos basados en el período
  const multiplier = {
    week: 1,
    month: 4,
    quarter: 13,
    year: 52
  }[timePeriod] || 4;

  // Valores base semanales
  const weeklyRevenue = 10000;
  const weeklyExpenses = 7000;
  const weeklyProfit = weeklyRevenue - weeklyExpenses;

  // Calcular métricas
  metrics.totalRevenue = weeklyRevenue * multiplier;
  metrics.totalExpenses = weeklyExpenses * multiplier;
  metrics.netProfit = weeklyProfit * multiplier;
  metrics.grossMargin = 0.35; // 35%
  metrics.profitMargin = metrics.netProfit / metrics.totalRevenue;
  metrics.cashflow = metrics.netProfit * 0.8; // 80% del profit como cashflow
  metrics.roi = 0.25; // 25% ROI
  metrics.currentRatio = 1.8; // Razón corriente saludable
  metrics.inventoryTurnover = 4.5; // Rotación de inventario
  metrics.daysReceivable = 28; // Días en cuentas por cobrar

  // Crecimiento (simulado)
  metrics.revenueGrowth = 0.1; // 10%
  metrics.expenseGrowth = 0.08; // 8%

  return metrics;
};

// Calcular métricas por categoría
export const calculateCategoryMetrics = (inventoryData) => {
  const baseMetrics = calculateInventoryMetrics(inventoryData);
  
  const categoryMetrics = {
    ...baseMetrics,
    categoryData: {},
    topCategory: null,
    lowestCategory: null
  };

  // Agrupar por categoría
  inventoryData.forEach(item => {
    const category = item.category || 'Sin categoría';
    
    if (!categoryMetrics.categoryData[category]) {
      categoryMetrics.categoryData[category] = {
        itemCount: 0,
        totalStock: 0,
        totalValue: 0,
        averageValue: 0,
        stockValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0
      };
    }
    
    const catData = categoryMetrics.categoryData[category];
    const itemValue = (item.price || 0) * (item.quantity || 0);
    
    catData.itemCount++;
    catData.totalStock += item.quantity || 0;
    catData.totalValue += itemValue;
    catData.stockValue += itemValue;
    
    if (item.quantity === 0) {
      catData.outOfStockItems++;
    } else if (item.quantity <= 5) {
      catData.lowStockItems++;
    }
  });

  // Calcular promedios y encontrar extremos
  let maxValue = -Infinity;
  let minValue = Infinity;
  
  Object.entries(categoryMetrics.categoryData).forEach(([category, data]) => {
    data.averageValue = data.totalValue / data.itemCount;
    data.stockValue = data.totalValue;
    
    if (data.totalValue > maxValue) {
      maxValue = data.totalValue;
      categoryMetrics.topCategory = { name: category, ...data };
    }
    
    if (data.totalValue < minValue) {
      minValue = data.totalValue;
      categoryMetrics.lowestCategory = { name: category, ...data };
    }
  });

  return categoryMetrics;
};

// Calcular métricas de tendencias
export const calculateTrendMetrics = (trendData, analysisType) => {
  const data = trendData[analysisType] || [];
  
  if (data.length === 0) {
    return {
      averageValue: 0,
      maxValue: 0,
      minValue: 0,
      standardDeviation: 0,
      coefficientOfVariation: 0,
      accuracy: 0,
      rSquared: 0,
      turningPoints: [],
      lastTurningPoint: null,
      volatility: 0
    };
  }

  const values = data.map(item => item.value);
  
  // Estadísticas básicas
  const sum = values.reduce((a, b) => a + b, 0);
  const average = sum / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  
  // Desviación estándar
  const squareDiffs = values.map(value => Math.pow(value - average, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(avgSquareDiff);
  
  // Coeficiente de variación
  const cv = stdDev / average;
  
  // Puntos de inflexión
  const turningPoints = [];
  for (let i = 1; i < values.length - 1; i++) {
    if ((values[i] > values[i-1] && values[i] > values[i+1]) ||
        (values[i] < values[i-1] && values[i] < values[i+1])) {
      turningPoints.push({
        index: i,
        date: data[i].date,
        value: values[i]
      });
    }
  }
  
  // Calcular R² (simplificado)
  // En un sistema real, esto sería una regresión lineal
  let ssRes = 0;
  let ssTot = 0;
  
  values.forEach(value => {
    ssRes += Math.pow(value - average, 2);
  });
  
  // Para simplificar, asumimos un buen ajuste
  const rSquared = 1 - (ssRes / (values.length * Math.pow(stdDev, 2)));
  
  const metrics = {
    averageValue: average,
    maxValue: max,
    minValue: min,
    standardDeviation: stdDev,
    coefficientOfVariation: cv,
    accuracy: Math.min(0.95, rSquared), // Precisión basada en R²
    rSquared: rSquared,
    turningPoints: turningPoints,
    lastTurningPoint: turningPoints.length > 0 ? 
      turningPoints[turningPoints.length - 1].date : null,
    volatility: cv // Volatilidad como coeficiente de variación
  };

  return metrics;
};

// Generar datos para exportación
export const generateExportData = (reportType, data, filters, stats, options = {}) => {
  const exportData = {
    metadata: {
      reportType: reportType,
      generatedAt: new Date().toISOString(),
      filters: filters,
      options: options
    },
    summary: {
      totalRecords: data.length,
      ...stats
    },
    data: options.includeData ? data : []
  };

  return exportData;
};

// Filtrar datos según los filtros
export const filterData = (data, filters) => {
  if (!data || data.length === 0) return [];
  
  return data.filter(item => {
    // Filtrar por categoría
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.includes(item.category)) {
        return false;
      }
    }
    
    // Filtrar por stock
    if (filters.minStock !== undefined && item.quantity < filters.minStock) {
      return false;
    }
    
    if (filters.maxStock !== undefined && item.quantity > filters.maxStock) {
      return false;
    }
    
    // Filtrar por fecha (si el item tiene fecha)
    if (filters.startDate && item.date) {
      const itemDate = new Date(item.date);
      const startDate = new Date(filters.startDate);
      if (itemDate < startDate) return false;
    }
    
    if (filters.endDate && item.date) {
      const itemDate = new Date(item.date);
      const endDate = new Date(filters.endDate);
      if (itemDate > endDate) return false;
    }
    
    return true;
  });
};

// Ordenar datos
export const sortData = (data, sortBy, sortOrder = 'asc') => {
  if (!data || data.length === 0) return data;
  
  return [...data].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Convertir a números si es posible
    if (typeof aValue === 'string' && !isNaN(parseFloat(aValue))) {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
};

// Generar estadísticas de reporte
export const generateReportStats = async (inventoryData, salesData, filters) => {
  // Filtrar datos
  const filteredInventory = filterData(inventoryData, filters);
  
  // Calcular métricas básicas
  const inventoryMetrics = calculateInventoryMetrics(filteredInventory);
  const salesMetrics = calculateSalesMetrics(salesData);
  
  return {
    totalItems: inventoryMetrics.totalItems,
    totalValue: inventoryMetrics.totalValue,
    lowStockItems: inventoryMetrics.lowStockItems,
    outOfStockItems: inventoryMetrics.outOfStock,
    categoriesCount: inventoryMetrics.categoriesCount,
    topCategories: Object.entries(inventoryMetrics.categoryValue || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, value]) => ({ category, value })),
    
    // Métricas de ventas
    totalSales: salesMetrics.totalSales,
    totalRevenue: salesMetrics.totalRevenue,
    averageSale: salesMetrics.averageSale,
    
    // Información de filtros
    appliedFilters: Object.keys(filters).filter(key => {
      const value = filters[key];
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value !== '' && value !== 'last30days';
      if (typeof value === 'number') return value !== 0 && value !== 1000;
      return false;
    }).length
  };
};

// Obtener datos del reporte
export const getReportData = (reportType, inventoryData, salesData, filters) => {
  let data = [];
  
  switch (reportType) {
    case 'inventory':
    case 'stock':
    case 'category':
      data = filterData(inventoryData, filters);
      data = sortData(data, filters.sortBy, filters.sortOrder);
      break;
      
    case 'sales':
      data = filterData(salesData, filters);
      data = sortData(data, filters.sortBy, filters.sortOrder);
      break;
      
    case 'financial':
    case 'trends':
      // Para reportes financieros y de tendencias, usar datos procesados
      data = [];
      break;
      
    default:
      data = filterData(inventoryData, filters);
      data = sortData(data, filters.sortBy, filters.sortOrder);
  }
  
  return data;
};

// Validar datos del reporte
export const validateReportData = (data, reportType) => {
  const errors = [];
  
  if (!data || data.length === 0) {
    errors.push('No hay datos disponibles para el reporte');
    return { isValid: false, errors };
  }
  
  // Validaciones específicas por tipo de reporte
  switch (reportType) {
    case 'inventory':
      if (!data.some(item => item.price && item.quantity)) {
        errors.push('Los datos de inventario deben incluir precio y cantidad');
      }
      break;
      
    case 'sales':
      if (!data.some(item => item.total && item.date)) {
        errors.push('Los datos de ventas deben incluir total y fecha');
      }
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors.length > 0 ? errors : null
  };
};