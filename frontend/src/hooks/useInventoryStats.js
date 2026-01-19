import { useMemo, useCallback } from 'react';

/**
 * Hook para calcular estadísticas del inventario
 * @param {Array} items - Items del inventario
 * @returns {Object} Estadísticas calculadas
 */
const useInventoryStats = (items = []) => {
  // Calcular estadísticas básicas
  const basicStats = useMemo(() => {
    if (items.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        totalCost: 0,
        totalProfit: 0,
        averagePrice: 0,
        averageCost: 0,
        averageProfit: 0
      };
    }

    const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCost = items.reduce((sum, item) => sum + ((item.cost || item.price * 0.7) * item.quantity), 0);
    const totalProfit = totalValue - totalCost;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      totalItems: items.length,
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalQuantity,
      averagePrice: parseFloat((totalValue / totalQuantity).toFixed(2)),
      averageCost: parseFloat((totalCost / totalQuantity).toFixed(2)),
      averageProfit: parseFloat((totalProfit / totalQuantity).toFixed(2)),
      profitMargin: totalCost > 0 ? parseFloat(((totalProfit / totalCost) * 100).toFixed(2)) : 0
    };
  }, [items]);

  // Calcular estadísticas por categoría
  const categoryStats = useMemo(() => {
    const stats = {};
    
    items.forEach(item => {
      const category = item.category || 'Sin Categoría';
      
      if (!stats[category]) {
        stats[category] = {
          count: 0,
          quantity: 0,
          value: 0,
          cost: 0,
          profit: 0,
          items: []
        };
      }
      
      const itemValue = item.price * item.quantity;
      const itemCost = (item.cost || item.price * 0.7) * item.quantity;
      const itemProfit = itemValue - itemCost;
      
      stats[category].count += 1;
      stats[category].quantity += item.quantity;
      stats[category].value += itemValue;
      stats[category].cost += itemCost;
      stats[category].profit += itemProfit;
      stats[category].items.push(item);
    });

    // Convertir a array y calcular porcentajes
    return Object.entries(stats).map(([category, data]) => ({
      category,
      ...data,
      value: parseFloat(data.value.toFixed(2)),
      cost: parseFloat(data.cost.toFixed(2)),
      profit: parseFloat(data.profit.toFixed(2)),
      percentageOfTotal: parseFloat(((data.value / basicStats.totalValue) * 100).toFixed(2)),
      averagePrice: parseFloat((data.value / data.quantity).toFixed(2))
    })).sort((a, b) => b.value - a.value);
  }, [items, basicStats.totalValue]);

  // Calcular estadísticas por estado
  const statusStats = useMemo(() => {
    const statuses = {
      'Disponible': { count: 0, quantity: 0, value: 0 },
      'Bajo Stock': { count: 0, quantity: 0, value: 0 },
      'Agotado': { count: 0, quantity: 0, value: 0 }
    };

    items.forEach(item => {
      const status = item.status || 'Disponible';
      if (statuses[status]) {
        statuses[status].count += 1;
        statuses[status].quantity += item.quantity;
        statuses[status].value += item.price * item.quantity;
      }
    });

    return Object.entries(statuses).map(([status, data]) => ({
      status,
      ...data,
      value: parseFloat(data.value.toFixed(2)),
      percentage: parseFloat(((data.count / items.length) * 100).toFixed(1))
    }));
  }, [items]);

  // Calcular items que necesitan atención
  const attentionStats = useMemo(() => {
    const lowStock = items.filter(item => 
      item.status === 'Bajo Stock' || 
      (item.quantity > 0 && item.quantity <= (item.minStock || 5))
    );

    const outOfStock = items.filter(item => 
      item.status === 'Agotado' || item.quantity === 0
    );

    const needsReorder = items.filter(item => 
      item.quantity <= (item.minStock || 5) && item.quantity > 0
    );

    const expiredItems = items.filter(item => 
      item.expiryDate && new Date(item.expiryDate) < new Date()
    );

    return {
      lowStock: {
        count: lowStock.length,
        value: parseFloat(lowStock.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2))
      },
      outOfStock: {
        count: outOfStock.length,
        value: parseFloat(outOfStock.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2))
      },
      needsReorder: {
        count: needsReorder.length,
        items: needsReorder
      },
      expiredItems: {
        count: expiredItems.length,
        items: expiredItems
      },
      totalAttention: lowStock.length + outOfStock.length + needsReorder.length + expiredItems.length
    };
  }, [items]);

  // Calcular tendencias (si hay datos históricos)
  const calculateTrends = useCallback((historicalData = []) => {
    if (historicalData.length < 2) {
      return {
        valueTrend: 0,
        quantityTrend: 0,
        itemsTrend: 0
      };
    }

    const current = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];

    const valueTrend = previous.totalValue > 0 
      ? ((current.totalValue - previous.totalValue) / previous.totalValue) * 100 
      : 0;
    
    const quantityTrend = previous.totalQuantity > 0 
      ? ((current.totalQuantity - previous.totalQuantity) / previous.totalQuantity) * 100 
      : 0;
    
    const itemsTrend = previous.totalItems > 0 
      ? ((current.totalItems - previous.totalItems) / previous.totalItems) * 100 
      : 0;

    return {
      valueTrend: parseFloat(valueTrend.toFixed(2)),
      quantityTrend: parseFloat(quantityTrend.toFixed(2)),
      itemsTrend: parseFloat(itemsTrend.toFixed(2)),
      isIncreasing: {
        value: valueTrend > 0,
        quantity: quantityTrend > 0,
        items: itemsTrend > 0
      }
    };
  }, []);

  // Calcular valor ABC Analysis
  const calculateABCAnalysis = useCallback(() => {
    if (items.length === 0) return { A: [], B: [], C: [] };

    // Ordenar items por valor (precio * cantidad)
    const sortedItems = [...items].sort((a, b) => 
      (b.price * b.quantity) - (a.price * a.quantity)
    );

    const totalValue = basicStats.totalValue;
    let cumulativeValue = 0;
    
    const A = [];
    const B = [];
    const C = [];

    sortedItems.forEach(item => {
      const itemValue = item.price * item.quantity;
      cumulativeValue += itemValue;
      const percentage = (cumulativeValue / totalValue) * 100;

      if (percentage <= 80) {
        A.push(item);
      } else if (percentage <= 95) {
        B.push(item);
      } else {
        C.push(item);
      }
    });

    return {
      A: {
        items: A,
        count: A.length,
        value: parseFloat(A.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)),
        percentage: parseFloat(((A.reduce((sum, item) => sum + (item.price * item.quantity), 0) / totalValue) * 100).toFixed(2))
      },
      B: {
        items: B,
        count: B.length,
        value: parseFloat(B.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)),
        percentage: parseFloat(((B.reduce((sum, item) => sum + (item.price * item.quantity), 0) / totalValue) * 100).toFixed(2))
      },
      C: {
        items: C,
        count: C.length,
        value: parseFloat(C.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)),
        percentage: parseFloat(((C.reduce((sum, item) => sum + (item.price * item.quantity), 0) / totalValue) * 100).toFixed(2))
      }
    };
  }, [items, basicStats.totalValue]);

  // Calcular rotación de inventario por categoría
  const calculateTurnoverByCategory = useCallback((salesData = []) => {
    const turnover = {};

    categoryStats.forEach(category => {
      const categorySales = salesData.filter(sale => 
        sale.category === category.category
      );
      
      const totalSales = categorySales.reduce((sum, sale) => sum + sale.quantity, 0);
      const averageInventory = category.quantity / 2; // Simplificación
      const turnoverRate = averageInventory > 0 ? totalSales / averageInventory : 0;

      turnover[category.category] = {
        category: category.category,
        totalSales,
        averageInventory: parseFloat(averageInventory.toFixed(2)),
        turnoverRate: parseFloat(turnoverRate.toFixed(2)),
        daysToSell: turnoverRate > 0 ? parseFloat((365 / turnoverRate).toFixed(1)) : 0
      };
    });

    return turnover;
  }, [categoryStats]);

  // Generar reporte de estadísticas
  const generateStatsReport = useCallback((options = {}) => {
    const {
      includeDetails = true,
      includeCharts = false,
      format = 'object'
    } = options;

    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        ...basicStats,
        categories: categoryStats.length,
        lowStockItems: attentionStats.lowStock.count,
        outOfStockItems: attentionStats.outOfStock.count
      },
      categories: categoryStats,
      statuses: statusStats,
      attentionItems: attentionStats
    };

    if (includeDetails) {
      report.details = {
        topCategories: categoryStats.slice(0, 5),
        topItems: [...items]
          .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
          .slice(0, 10)
          .map(item => ({
            name: item.name,
            value: parseFloat((item.price * item.quantity).toFixed(2)),
            quantity: item.quantity,
            status: item.status
          }))
      };
    }

    if (format === 'json') {
      return JSON.stringify(report, null, 2);
    }

    return report;
  }, [basicStats, categoryStats, statusStats, attentionStats, items]);

  // Calcular pronóstico de necesidades
  const forecastNeeds = useCallback((days = 30, salesHistory = []) => {
    const forecast = {};
    
    items.forEach(item => {
      const itemSales = salesHistory.filter(sale => sale.itemId === item.id);
      const avgDailySales = itemSales.length > 0 
        ? itemSales.reduce((sum, sale) => sum + sale.quantity, 0) / itemSales.length
        : item.quantity / 90; // Estimación si no hay historial
      
      const daysOfStock = item.quantity / avgDailySales;
      const needsReorder = daysOfStock < days;
      const reorderQuantity = needsReorder 
        ? Math.max(item.minStock || 10, avgDailySales * days - item.quantity)
        : 0;

      forecast[item.id] = {
        itemName: item.name,
        currentStock: item.quantity,
        avgDailySales: parseFloat(avgDailySales.toFixed(2)),
        daysOfStock: parseFloat(daysOfStock.toFixed(1)),
        needsReorder,
        reorderQuantity: Math.ceil(reorderQuantity),
        reorderDate: needsReorder ? new Date(Date.now() + (daysOfStock * 24 * 60 * 60 * 1000)).toISOString() : null
      };
    });

    return forecast;
  }, [items]);

  return {
    // Estadísticas básicas
    basicStats,
    
    // Estadísticas por categoría
    categoryStats,
    
    // Estadísticas por estado
    statusStats,
    
    // Items que necesitan atención
    attentionStats,
    
    // Funciones de análisis
    calculateTrends,
    calculateABCAnalysis,
    calculateTurnoverByCategory,
    forecastNeeds,
    
    // Reportes
    generateStatsReport,
    
    // Métodos de conveniencia
    getTopCategories: (limit = 5) => categoryStats.slice(0, limit),
    getTopItems: (limit = 10) => 
      [...items]
        .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
        .slice(0, limit),
    
    getLowStockItems: () => 
      items.filter(item => item.status === 'Bajo Stock' || item.quantity <= (item.minStock || 5)),
    
    getOutOfStockItems: () => 
      items.filter(item => item.status === 'Agotado' || item.quantity === 0),
    
    // Información útil
    hasData: items.length > 0,
    isEmpty: items.length === 0
  };
};

export default useInventoryStats;