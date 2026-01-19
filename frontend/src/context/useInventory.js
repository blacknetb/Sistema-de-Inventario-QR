import { useContext } from 'react';
import { InventoryContext } from './InventoryContext';

/**
 * Hook personalizado para acceder al contexto del inventario
 * @returns {Object} Contexto completo del inventario
 */
export const useInventory = () => {
  const context = useContext(InventoryContext);
  
  if (!context) {
    throw new Error('useInventory debe ser usado dentro de un InventoryProvider');
  }
  
  return context;
};

/**
 * Hook para obtener items con filtros aplicados
 * @param {Object} options - Opciones de filtrado
 * @returns {Object} Items filtrados y funciones de filtrado
 */
export const useFilteredInventory = (options = {}) => {
  const { state, setFilter, setSort, setSearchTerm } = useInventory();
  
  const applyCustomFilter = (items, customFilter) => {
    if (!customFilter) return items;
    
    return items.filter(customFilter);
  };
  
  const filteredItems = options.customFilter 
    ? applyCustomFilter(state.filteredItems, options.customFilter)
    : state.filteredItems;
  
  return {
    items: filteredItems,
    allItems: state.items,
    loading: state.loading,
    error: state.error,
    filter: state.filter,
    sort: state.sort,
    searchTerm: state.searchTerm,
    setFilter,
    setSort,
    setSearchTerm
  };
};

/**
 * Hook para estadísticas del inventario
 * @returns {Object} Estadísticas calculadas
 */
export const useInventoryStats = () => {
  const { state } = useInventory();
  
  const calculateStats = () => {
    const totalValue = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCost = state.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
    const totalProfit = totalValue - totalCost;
    const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
    
    const lowStockItems = state.items.filter(item => item.status === 'Bajo Stock');
    const outOfStockItems = state.items.filter(item => item.status === 'Agotado');
    const reorderItems = state.items.filter(item => item.quantity <= item.minStock && item.quantity > 0);
    
    // Resumen por categoría
    const categorySummary = {};
    state.items.forEach(item => {
      if (!categorySummary[item.category]) {
        categorySummary[item.category] = {
          count: 0,
          totalValue: 0,
          totalItems: 0
        };
      }
      categorySummary[item.category].count++;
      categorySummary[item.category].totalValue += item.price * item.quantity;
      categorySummary[item.category].totalItems += item.quantity;
    });
    
    // Items más valiosos
    const mostValuableItems = [...state.items]
      .sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity))
      .slice(0, 5);
    
    // Items que necesitan reorden
    const needsReorder = [...state.items]
      .filter(item => item.quantity <= item.minStock)
      .sort((a, b) => a.quantity - b.quantity);
    
    return {
      // Básicos
      totalItems: state.items.length,
      totalValue,
      totalCost,
      totalProfit,
      profitMargin: profitMargin.toFixed(2),
      
      // Stock
      lowStockCount: lowStockItems.length,
      outOfStockCount: outOfStockItems.length,
      reorderCount: reorderItems.length,
      
      // Promedios
      averagePrice: state.items.length > 0 
        ? (totalValue / state.items.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2)
        : 0,
      averageQuantity: state.items.length > 0
        ? (state.items.reduce((sum, item) => sum + item.quantity, 0) / state.items.length).toFixed(1)
        : 0,
      
      // Detallados
      categorySummary,
      mostValuableItems,
      needsReorder,
      lowStockItems,
      outOfStockItems
    };
  };
  
  return calculateStats();
};

/**
 * Hook para operaciones CRUD del inventario
 * @returns {Object} Funciones para operaciones CRUD
 */
export const useInventoryCRUD = () => {
  const { addItem, updateItem, deleteItem, adjustStock } = useInventory();
  
  // Versión mejorada de addItem con validación extendida
  const addItemWithValidation = async (itemData) => {
    const validationErrors = {};
    
    // Validaciones
    if (!itemData.name || itemData.name.trim().length < 2) {
      validationErrors.name = 'El nombre debe tener al menos 2 caracteres';
    }
    
    if (!itemData.category) {
      validationErrors.category = 'La categoría es obligatoria';
    }
    
    if (itemData.quantity === undefined || itemData.quantity < 0) {
      validationErrors.quantity = 'La cantidad no puede ser negativa';
    }
    
    if (!itemData.price || itemData.price <= 0) {
      validationErrors.price = 'El precio debe ser mayor a 0';
    }
    
    if (itemData.cost && itemData.cost < 0) {
      validationErrors.cost = 'El costo no puede ser negativo';
    }
    
    if (itemData.minStock && itemData.maxStock && itemData.minStock > itemData.maxStock) {
      validationErrors.minStock = 'Stock mínimo no puede ser mayor al máximo';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      return {
        success: false,
        errors: validationErrors,
        message: 'Errores de validación'
      };
    }
    
    return await addItem(itemData);
  };
  
  // Versión mejorada de updateItem
  const updateItemWithValidation = async (itemData) => {
    const validationErrors = {};
    
    if (!itemData.id) {
      validationErrors.id = 'ID del item es requerido';
    }
    
    if (itemData.quantity !== undefined && itemData.quantity < 0) {
      validationErrors.quantity = 'La cantidad no puede ser negativa';
    }
    
    if (itemData.price !== undefined && itemData.price <= 0) {
      validationErrors.price = 'El precio debe ser mayor a 0';
    }
    
    if (Object.keys(validationErrors).length > 0) {
      return {
        success: false,
        errors: validationErrors,
        message: 'Errores de validación'
      };
    }
    
    return await updateItem(itemData);
  };
  
  // Incrementar stock
  const incrementStock = async (itemId, amount = 1, reason = 'Incremento manual') => {
    return await adjustStock(itemId, Math.abs(amount), reason);
  };
  
  // Decrementar stock
  const decrementStock = async (itemId, amount = 1, reason = 'Decremento manual') => {
    return await adjustStock(itemId, -Math.abs(amount), reason);
  };
  
  // Restablecer stock
  const setStock = async (itemId, quantity, reason = 'Ajuste manual') => {
    const { state } = useInventory();
    const item = state.items.find(i => i.id === itemId);
    
    if (!item) {
      return { success: false, error: 'Item no encontrado' };
    }
    
    const adjustment = quantity - item.quantity;
    return await adjustStock(itemId, adjustment, reason);
  };
  
  return {
    addItem: addItemWithValidation,
    updateItem: updateItemWithValidation,
    deleteItem,
    incrementStock,
    decrementStock,
    setStock,
    adjustStock
  };
};

/**
 * Hook para configuración del inventario
 * @returns {Object} Configuración y funciones para actualizarla
 */
export const useInventorySettings = () => {
  const { state, updateSettings } = useInventory();
  
  const updateCurrency = (currency) => {
    updateSettings({ currency });
  };
  
  const updateLowStockThreshold = (threshold) => {
    if (threshold >= 0) {
      updateSettings({ lowStockThreshold: threshold });
    }
  };
  
  const toggleNotifications = () => {
    updateSettings({ enableNotifications: !state.settings.enableNotifications });
  };
  
  const toggleAutoUpdateStatus = () => {
    updateSettings({ autoUpdateStatus: !state.settings.autoUpdateStatus });
  };
  
  const updateTheme = (theme) => {
    if (['light', 'dark', 'auto'].includes(theme)) {
      updateSettings({ theme });
    }
  };
  
  const updateLanguage = (language) => {
    if (['es', 'en'].includes(language)) {
      updateSettings({ language });
    }
  };
  
  return {
    settings: state.settings,
    updateSettings,
    updateCurrency,
    updateLowStockThreshold,
    toggleNotifications,
    toggleAutoUpdateStatus,
    updateTheme,
    updateLanguage
  };
};

/**
 * Hook para importar/exportar datos
 * @returns {Object} Funciones para importar y exportar
 */
export const useInventoryImportExport = () => {
  const { importItems, exportItems, state } = useInventory();
  
  const importFromJSON = async (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      
      if (!Array.isArray(data)) {
        throw new Error('El formato JSON debe ser un array de items');
      }
      
      return await importItems(data);
    } catch (error) {
      return {
        success: false,
        error: `Error al parsear JSON: ${error.message}`
      };
    }
  };
  
  const importFromCSV = async (csvString) => {
    try {
      const lines = csvString.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const items = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const item = {};
        
        headers.forEach((header, index) => {
          if (values[index]) {
            // Convertir valores numéricos
            if (['quantity', 'price', 'cost', 'minStock', 'maxStock'].includes(header)) {
              item[header] = parseFloat(values[index]) || 0;
            } else {
              item[header] = values[index];
            }
          }
        });
        
        return item;
      }).filter(item => item.name); // Filtrar items sin nombre
      
      return await importItems(items);
    } catch (error) {
      return {
        success: false,
        error: `Error al parsear CSV: ${error.message}`
      };
    }
  };
  
  const exportToJSON = () => {
    return exportItems('json');
  };
  
  const exportToCSV = () => {
    return exportItems('csv');
  };
  
  const generateReport = (type = 'summary') => {
    const now = new Date();
    const report = {
      generatedAt: now.toISOString(),
      type,
      summary: {
        totalItems: state.items.length,
        totalValue: state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        lowStockCount: state.items.filter(item => item.status === 'Bajo Stock').length,
        outOfStockCount: state.items.filter(item => item.status === 'Agotado').length
      }
    };
    
    if (type === 'detailed') {
      report.items = state.items;
      report.categories = {};
      
      state.items.forEach(item => {
        if (!report.categories[item.category]) {
          report.categories[item.category] = {
            count: 0,
            totalValue: 0
          };
        }
        report.categories[item.category].count++;
        report.categories[item.category].totalValue += item.price * item.quantity;
      });
    }
    
    return report;
  };
  
  return {
    importFromJSON,
    importFromCSV,
    exportToJSON,
    exportToCSV,
    generateReport,
    itemsCount: state.items.length
  };
};

export default useInventory;