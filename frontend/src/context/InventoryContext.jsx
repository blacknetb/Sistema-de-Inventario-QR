import React, { createContext, useContext, useReducer } from 'react';
import inventoryReducer from './inventoryReducer';
import { inventoryConstants } from './inventoryConstants';
import { sampleInventory, updateItemStatus } from './inventoryUtils';

// Crear contexto
const InventoryContext = createContext();

// Hook personalizado para usar el contexto
export const useInventoryContext = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventoryContext debe ser usado dentro de un InventoryProvider');
  }
  return context;
};

// Proveedor del contexto con estado inicial extendido
const InventoryContextProvider = ({ children }) => {
  // Estado inicial extendido
  const initialState = {
    items: [],
    filteredItems: [],
    loading: false,
    error: null,
    filter: inventoryConstants.FILTER_OPTIONS.ALL,
    sort: inventoryConstants.SORT_OPTIONS.DATE_DESC,
    searchTerm: '',
    
    // Estadísticas
    stats: {
      totalItems: 0,
      totalValue: 0,
      totalCost: 0,
      totalProfit: 0,
      profitMargin: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      reorderCount: 0,
      categorySummary: {}
    },
    
    // Historial
    activityLog: [],
    
    // Configuración
    settings: {
      currency: 'USD',
      lowStockThreshold: 5,
      enableNotifications: true,
      autoUpdateStatus: true,
      theme: 'light',
      language: 'es',
      dateFormat: 'DD/MM/YYYY'
    }
  };

  const [state, dispatch] = useReducer(inventoryReducer, initialState);

  // Acciones
  const fetchItems = async () => {
    dispatch({ type: inventoryConstants.FETCH_ITEMS_REQUEST });
    
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Usar datos de ejemplo
      const items = sampleInventory.map(item => ({
        ...item,
        lastUpdated: new Date(item.lastUpdated),
        created: new Date(item.created)
      }));
      
      dispatch({
        type: inventoryConstants.FETCH_ITEMS_SUCCESS,
        payload: items
      });
    } catch (error) {
      dispatch({
        type: inventoryConstants.FETCH_ITEMS_FAILURE,
        payload: error.message
      });
    }
  };

  const addItem = async (itemData) => {
    dispatch({ type: inventoryConstants.ADD_ITEM_REQUEST });
    
    try {
      // Validación básica
      if (!itemData.name || !itemData.category) {
        throw new Error('Nombre y categoría son requeridos');
      }
      
      const newItem = {
        ...itemData,
        id: Date.now(),
        sku: itemData.sku || `SKU-${Date.now()}`,
        status: itemData.status || 'Disponible',
        lastUpdated: new Date(),
        created: new Date(),
        cost: itemData.cost || 0,
        minStock: itemData.minStock || 5,
        maxStock: itemData.maxStock || 50,
        supplier: itemData.supplier || 'Proveedor General',
        location: itemData.location || 'Almacén Principal'
      };
      
      // Actualizar estado según cantidad
      const itemWithStatus = updateItemStatus(newItem);
      
      dispatch({
        type: inventoryConstants.ADD_ITEM_SUCCESS,
        payload: itemWithStatus
      });
      
      return { success: true, item: itemWithStatus };
    } catch (error) {
      dispatch({
        type: inventoryConstants.ADD_ITEM_FAILURE,
        payload: error.message
      });
      
      return { success: false, error: error.message };
    }
  };

  const updateItem = async (itemData) => {
    dispatch({ type: inventoryConstants.UPDATE_ITEM_REQUEST });
    
    try {
      // Validación básica
      if (!itemData.id) {
        throw new Error('ID del item es requerido');
      }
      
      const updatedItem = {
        ...itemData,
        lastUpdated: new Date()
      };
      
      // Actualizar estado según cantidad si está habilitado
      if (state.settings.autoUpdateStatus) {
        const itemWithStatus = updateItemStatus(updatedItem);
        Object.assign(updatedItem, itemWithStatus);
      }
      
      dispatch({
        type: inventoryConstants.UPDATE_ITEM_SUCCESS,
        payload: updatedItem
      });
      
      return { success: true, item: updatedItem };
    } catch (error) {
      dispatch({
        type: inventoryConstants.UPDATE_ITEM_FAILURE,
        payload: error.message
      });
      
      return { success: false, error: error.message };
    }
  };

  const deleteItem = async (itemId) => {
    dispatch({ type: inventoryConstants.DELETE_ITEM_REQUEST });
    
    try {
      if (!itemId) {
        throw new Error('ID del item es requerido');
      }
      
      dispatch({
        type: inventoryConstants.DELETE_ITEM_SUCCESS,
        payload: itemId
      });
      
      return { success: true };
    } catch (error) {
      dispatch({
        type: inventoryConstants.DELETE_ITEM_FAILURE,
        payload: error.message
      });
      
      return { success: false, error: error.message };
    }
  };

  const setFilter = (filter) => {
    dispatch({
      type: inventoryConstants.SET_FILTER,
      payload: filter
    });
  };

  const setSort = (sortOption) => {
    dispatch({
      type: inventoryConstants.SET_SORT,
      payload: sortOption
    });
  };

  const setSearchTerm = (searchTerm) => {
    dispatch({
      type: inventoryConstants.SET_SEARCH_TERM,
      payload: searchTerm
    });
  };

  const updateSettings = (settings) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: settings
    });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const resetInventory = () => {
    dispatch({ type: 'RESET_INVENTORY' });
  };

  const importItems = async (items) => {
    dispatch({ type: inventoryConstants.FETCH_ITEMS_REQUEST });
    
    try {
      // Procesar items importados
      const processedItems = items.map((item, index) => ({
        ...item,
        id: Date.now() + index,
        status: item.status || 'Disponible',
        lastUpdated: new Date(),
        created: new Date(),
        sku: item.sku || `IMP-${Date.now()}-${index}`,
        cost: item.cost || 0,
        minStock: item.minStock || 5,
        maxStock: item.maxStock || 50
      }));
      
      dispatch({
        type: inventoryConstants.FETCH_ITEMS_SUCCESS,
        payload: processedItems
      });
      
      return { success: true, count: processedItems.length };
    } catch (error) {
      dispatch({
        type: inventoryConstants.FETCH_ITEMS_FAILURE,
        payload: error.message
      });
      
      return { success: false, error: error.message };
    }
  };

  const exportItems = (format = 'json') => {
    try {
      let data;
      let filename;
      
      switch(format) {
        case 'json':
          data = JSON.stringify(state.items, null, 2);
          filename = `inventario_${new Date().toISOString().split('T')[0]}.json`;
          break;
          
        case 'csv':
          const headers = ['ID', 'Nombre', 'Categoría', 'Cantidad', 'Precio', 'Estado', 'SKU', 'Última Actualización'];
          const csvRows = [
            headers.join(','),
            ...state.items.map(item => [
              item.id,
              `"${item.name}"`,
              item.category,
              item.quantity,
              item.price,
              item.status,
              item.sku || '',
              new Date(item.lastUpdated).toLocaleDateString()
            ].join(','))
          ];
          data = csvRows.join('\n');
          filename = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        default:
          throw new Error('Formato no soportado');
      }
      
      // Crear blob y descargar
      const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const adjustStock = (itemId, adjustment, reason = 'Ajuste manual') => {
    try {
      const item = state.items.find(i => i.id === itemId);
      
      if (!item) {
        throw new Error('Item no encontrado');
      }
      
      const newQuantity = item.quantity + adjustment;
      
      if (newQuantity < 0) {
        throw new Error('La cantidad resultante no puede ser negativa');
      }
      
      const updatedItem = {
        ...item,
        quantity: newQuantity,
        lastUpdated: new Date()
      };
      
      // Actualizar estado según nueva cantidad
      const itemWithStatus = updateItemStatus(updatedItem);
      
      dispatch({
        type: inventoryConstants.UPDATE_ITEM_SUCCESS,
        payload: itemWithStatus
      });
      
      return { 
        success: true, 
        item: itemWithStatus,
        adjustment,
        reason 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Valor del contexto
  const contextValue = {
    // Estado
    state,
    
    // Acciones
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
    setFilter,
    setSort,
    setSearchTerm,
    updateSettings,
    clearError,
    resetInventory,
    importItems,
    exportItems,
    adjustStock,
    
    // Métodos de conveniencia
    getItemById: (id) => state.items.find(item => item.id === id),
    getItemsByCategory: (category) => state.items.filter(item => item.category === category),
    getLowStockItems: () => state.items.filter(item => item.status === 'Bajo Stock'),
    getOutOfStockItems: () => state.items.filter(item => item.status === 'Agotado'),
    
    // Estadísticas actualizadas
    getStatistics: () => {
      const totalValue = state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const totalCost = state.items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
      const totalProfit = totalValue - totalCost;
      const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
      
      return {
        totalItems: state.items.length,
        totalValue,
        totalCost,
        totalProfit,
        profitMargin,
        lowStockCount: state.items.filter(item => item.status === 'Bajo Stock').length,
        outOfStockCount: state.items.filter(item => item.status === 'Agotado').length,
        reorderCount: state.items.filter(item => item.quantity <= item.minStock && item.quantity > 0).length
      };
    }
  };

  return (
    <InventoryContext.Provider value={contextValue}>
      {children}
    </InventoryContext.Provider>
  );
};

export { InventoryContext, InventoryContextProvider };