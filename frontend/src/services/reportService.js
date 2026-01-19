import { get, post } from './api';
import { inventoryService } from './index';
import { utils } from './index';

const reportService = {
  // Generar reporte de inventario
  generateInventoryReport: async (filters = {}) => {
    try {
      // Simular generación de reporte
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Obtener datos del inventario
      const { data: items } = await inventoryService.getAllItems(filters);
      
      // Calcular estadísticas para el reporte
      const stats = {
        totalItems: items.length,
        totalValue: items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        lowStockCount: items.filter(item => item.status === 'Bajo Stock').length,
        outOfStockCount: items.filter(item => item.status === 'Agotado').length,
        byCategory: {}
      };
      
      // Agrupar por categoría
      items.forEach(item => {
        if (!stats.byCategory[item.category]) {
          stats.byCategory[item.category] = {
            count: 0,
            value: 0,
            items: []
          };
        }
        stats.byCategory[item.category].count++;
        stats.byCategory[item.category].value += item.price * item.quantity;
        stats.byCategory[item.category].items.push(item);
      });
      
      // Generar resumen ejecutivo
      const executiveSummary = {
        generatedAt: new Date().toLocaleString(),
        filtersApplied: Object.keys(filters).length > 0 ? filters : 'Ninguno',
        keyFindings: [
          `Total de productos: ${stats.totalItems}`,
          `Valor total del inventario: $${stats.totalValue.toFixed(2)}`,
          `Productos con bajo stock: ${stats.lowStockCount}`,
          `Productos agotados: ${stats.outOfStockCount}`
        ]
      };
      
      return {
        success: true,
        data: {
          items,
          stats,
          executiveSummary,
          generatedAt: new Date().toISOString(),
          reportId: `REP-${Date.now()}`
        },
        message: 'Reporte generado exitosamente'
      };
    } catch (error) {
      console.error('Error generando reporte:', error);
      throw error;
    }
  },

  // Generar reporte de movimientos
  generateMovementReport: async (startDate, endDate) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Datos de ejemplo para movimientos
      const mockMovements = [
        {
          id: 1,
          itemId: 101,
          itemName: 'Laptop Dell XPS 13',
          type: 'Entrada',
          quantity: 5,
          previousQuantity: 10,
          newQuantity: 15,
          date: '2024-01-15T10:30:00Z',
          userId: 1,
          userName: 'Admin',
          notes: 'Compra proveedor'
        },
        {
          id: 2,
          itemId: 102,
          itemName: 'Mouse Inalámbrico',
          type: 'Salida',
          quantity: 2,
          previousQuantity: 42,
          newQuantity: 40,
          date: '2024-01-16T14:20:00Z',
          userId: 2,
          userName: 'Juan Pérez',
          notes: 'Venta a cliente'
        },
        {
          id: 3,
          itemId: 103,
          itemName: 'Monitor 24" Samsung',
          type: 'Ajuste',
          quantity: -1,
          previousQuantity: 9,
          newQuantity: 8,
          date: '2024-01-16T16:45:00Z',
          userId: 1,
          userName: 'Admin',
          notes: 'Daño en almacén'
        },
        {
          id: 4,
          itemId: 101,
          itemName: 'Laptop Dell XPS 13',
          type: 'Salida',
          quantity: 3,
          previousQuantity: 15,
          newQuantity: 12,
          date: '2024-01-17T09:15:00Z',
          userId: 3,
          userName: 'María García',
          notes: 'Asignación a empleados'
        }
      ];
      
      // Filtrar por fecha si se proporciona
      let movements = mockMovements;
      if (startDate && endDate) {
        movements = mockMovements.filter(movement => {
          const movementDate = new Date(movement.date);
          return movementDate >= new Date(startDate) && movementDate <= new Date(endDate);
        });
      }
      
      // Calcular estadísticas de movimientos
      const stats = {
        totalMovements: movements.length,
        totalEntries: movements.filter(m => m.type === 'Entrada').length,
        totalExits: movements.filter(m => m.type === 'Salida').length,
        totalAdjustments: movements.filter(m => m.type === 'Ajuste').length,
        totalQuantityChange: movements.reduce((sum, m) => sum + m.quantity, 0)
      };
      
      return {
        success: true,
        data: {
          movements,
          stats,
          period: startDate && endDate 
            ? `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`
            : 'Todos los periodos',
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error generando reporte de movimientos:', error);
      throw error;
    }
  },

  // Generar reporte de bajo stock
  generateLowStockReport: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Obtener items del inventario
      const { data: items } = await inventoryService.getAllItems();
      
      // Filtrar items con bajo stock o agotados
      const lowStockItems = items.filter(item => 
        item.status === 'Bajo Stock' || item.status === 'Agotado'
      );
      
      // Ordenar por cantidad (de menor a mayor)
      lowStockItems.sort((a, b) => a.quantity - b.quantity);
      
      // Calcular sugerencias de reorden
      const reorderSuggestions = lowStockItems.map(item => ({
        id: item.id,
        name: item.name,
        currentQuantity: item.quantity,
        minimumStock: item.minimumStock || 5,
        suggestedReorder: Math.max(10, (item.minimumStock || 5) * 2 - item.quantity),
        urgency: item.quantity === 0 ? 'Crítica' : item.quantity <= 3 ? 'Alta' : 'Media',
        estimatedCost: (item.minimumStock || 5) * 2 * item.price
      }));
      
      return {
        success: true,
        data: {
          items: lowStockItems,
          reorderSuggestions,
          totalItemsNeedingReorder: lowStockItems.length,
          totalEstimatedCost: reorderSuggestions.reduce((sum, item) => sum + item.estimatedCost, 0),
          generatedAt: new Date().toISOString(),
          reportId: `LOW-STOCK-${Date.now()}`
        },
        message: 'Reporte de bajo stock generado'
      };
    } catch (error) {
      console.error('Error generando reporte de bajo stock:', error);
      throw error;
    }
  },

  // Exportar reporte a diferentes formatos
  exportReport: (reportData, format = 'pdf') => {
    return new Promise((resolve, reject) => {
      try {
        setTimeout(() => {
          // Simular exportación
          const exportResult = {
            success: true,
            format,
            fileName: `reporte_inventario_${Date.now()}.${format}`,
            data: reportData,
            downloadUrl: `data:application/${format};base64,${btoa(JSON.stringify(reportData))}`,
            message: `Reporte exportado en formato ${format.toUpperCase()}`
          };
          
          resolve(exportResult);
        }, 800);
      } catch (error) {
        reject(new Error(`Error exportando reporte: ${error.message}`));
      }
    });
  }
};

export default reportService;