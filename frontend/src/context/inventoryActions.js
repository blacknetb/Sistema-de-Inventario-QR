import { inventoryConstants } from './inventoryConstants';
import { sampleInventory, validateItem, updateItemStatus, generateNextSKU } from './inventoryUtils';

// Simulación de API
const simulateAPIRequest = (data, delay = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simular error aleatorio (10% de probabilidad)
      if (Math.random() < 0.1) {
        reject(new Error('Error de conexión con el servidor'));
      } else {
        resolve(data);
      }
    }, delay);
  });
};

// Acción para obtener items
export const fetchItems = () => {
  return async (dispatch) => {
    dispatch({ type: inventoryConstants.FETCH_ITEMS_REQUEST });
    
    try {
      // En una app real, aquí harías una llamada a la API
      const items = await simulateAPIRequest(sampleInventory, 1000);
      
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
};

// Acción para agregar item
export const addItem = (itemData) => {
  return async (dispatch) => {
    dispatch({ type: inventoryConstants.ADD_ITEM_REQUEST });
    
    try {
      // Validar item
      const validationErrors = validateItem(itemData);
      if (Object.keys(validationErrors).length > 0) {
        throw new Error(JSON.stringify(validationErrors));
      }
      
      // Preparar nuevo item
      const newItem = {
        ...itemData,
        id: Date.now(), // ID temporal, en backend sería generado por la BD
        sku: itemData.sku || generateNextSKU(itemData.category),
        status: itemData.status || 'Disponible',
        lastUpdated: new Date().toISOString(),
        created: new Date().toISOString(),
        cost: itemData.cost || 0,
        minStock: itemData.minStock || 5,
        maxStock: itemData.maxStock || 50,
        supplier: itemData.supplier || 'Proveedor General',
        location: itemData.location || 'Almacén Principal'
      };
      
      // Actualizar estado según cantidad
      const itemWithStatus = updateItemStatus(newItem);
      
      // Simular llamada a API
      const savedItem = await simulateAPIRequest(itemWithStatus);
      
      dispatch({
        type: inventoryConstants.ADD_ITEM_SUCCESS,
        payload: savedItem
      });
      
      return { success: true, item: savedItem };
    } catch (error) {
      dispatch({
        type: inventoryConstants.ADD_ITEM_FAILURE,
        payload: error.message
      });
      
      return { success: false, error: error.message };
    }
  };
};

// Acción para actualizar item
export const updateItem = (itemData) => {
  return async (dispatch, getState) => {
    dispatch({ type: inventoryConstants.UPDATE_ITEM_REQUEST });
    
    try {
      // Validar item
      const validationErrors = validateItem(itemData);
      if (Object.keys(validationErrors).length > 0) {
        throw new Error(JSON.stringify(validationErrors));
      }
      
      // Preparar item actualizado
      const updatedItem = {
        ...itemData,
        lastUpdated: new Date().toISOString()
      };
      
      // Actualizar estado según cantidad si está habilitado
      const state = getState();
      if (state.settings.autoUpdateStatus) {
        const itemWithStatus = updateItemStatus(updatedItem);
        Object.assign(updatedItem, itemWithStatus);
      }
      
      // Simular llamada a API
      const savedItem = await simulateAPIRequest(updatedItem);
      
      dispatch({
        type: inventoryConstants.UPDATE_ITEM_SUCCESS,
        payload: savedItem
      });
      
      return { success: true, item: savedItem };
    } catch (error) {
      dispatch({
        type: inventoryConstants.UPDATE_ITEM_FAILURE,
        payload: error.message
      });
      
      return { success: false, error: error.message };
    }
  };
};

// Acción para eliminar item
export const deleteItem = (itemId) => {
  return async (dispatch) => {
    dispatch({ type: inventoryConstants.DELETE_ITEM_REQUEST });
    
    try {
      // Simular llamada a API
      await simulateAPIRequest(itemId);
      
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
};

// Acción para filtrar items
export const setFilter = (filter) => {
  return {
    type: inventoryConstants.SET_FILTER,
    payload: filter
  };
};

// Acción para ordenar items
export const setSort = (sortOption) => {
  return {
    type: inventoryConstants.SET_SORT,
    payload: sortOption
  };
};

// Acción para buscar items
export const setSearchTerm = (searchTerm) => {
  return {
    type: inventoryConstants.SET_SEARCH_TERM,
    payload: searchTerm
  };
};

// Acción para actualizar configuración
export const updateSettings = (settings) => {
  return {
    type: 'UPDATE_SETTINGS',
    payload: settings
  };
};

// Acción para limpiar error
export const clearError = () => {
  return {
    type: 'CLEAR_ERROR'
  };
};

// Acción para resetear inventario
export const resetInventory = () => {
  return {
    type: 'RESET_INVENTORY'
  };
};

// Acción para importar items
export const importItems = (items) => {
  return async (dispatch) => {
    dispatch({ type: inventoryConstants.FETCH_ITEMS_REQUEST });
    
    try {
      // Validar y procesar cada item
      const processedItems = items.map((item, index) => {
        const validationErrors = validateItem(item);
        if (Object.keys(validationErrors).length > 0) {
          throw new Error(`Item ${index + 1}: ${JSON.stringify(validationErrors)}`);
        }
        
        return {
          ...item,
          id: Date.now() + index,
          status: item.status || 'Disponible',
          lastUpdated: new Date().toISOString(),
          created: item.created || new Date().toISOString(),
          sku: item.sku || generateNextSKU(item.category),
          cost: item.cost || 0,
          minStock: item.minStock || 5,
          maxStock: item.maxStock || 50
        };
      });
      
      // Simular llamada a API
      const importedItems = await simulateAPIRequest(processedItems, 1500);
      
      dispatch({
        type: inventoryConstants.FETCH_ITEMS_SUCCESS,
        payload: importedItems
      });
      
      return { success: true, count: importedItems.length };
    } catch (error) {
      dispatch({
        type: inventoryConstants.FETCH_ITEMS_FAILURE,
        payload: error.message
      });
      
      return { success: false, error: error.message };
    }
  };
};

// Acción para exportar items
export const exportItems = (format = 'json') => {
  return async (_, getState) => {
    try {
      const state = getState();
      const items = state.items;
      
      let exportedData;
      let filename;
      
      switch(format) {
        case 'json':
          exportedData = JSON.stringify(items, null, 2);
          filename = `inventario_${new Date().toISOString().split('T')[0]}.json`;
          break;
          
        case 'csv':
          const headers = ['ID', 'Nombre', 'Categoría', 'Cantidad', 'Precio', 'Estado', 'SKU', 'Proveedor'];
          const csvRows = [
            headers.join(','),
            ...items.map(item => [
              item.id,
              `"${item.name}"`,
              item.category,
              item.quantity,
              item.price,
              item.status,
              item.sku || '',
              `"${item.supplier || ''}"`
            ].join(','))
          ];
          exportedData = csvRows.join('\n');
          filename = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
          break;
          
        default:
          throw new Error('Formato no soportado');
      }
      
      // Crear blob y descargar
      const blob = new Blob([exportedData], { type: format === 'json' ? 'application/json' : 'text/csv' });
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
};

// Acción para ajustar stock
export const adjustStock = (itemId, adjustment, reason = 'Ajuste manual') => {
  return async (dispatch, getState) => {
    try {
      const state = getState();
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
        lastUpdated: new Date().toISOString()
      };
      
      // Actualizar estado según nueva cantidad
      const itemWithStatus = updateItemStatus(updatedItem);
      
      dispatch({
        type: inventoryConstants.UPDATE_ITEM_SUCCESS,
        payload: itemWithStatus
      });
      
      // Registrar en actividad
      const activity = {
        id: Date.now(),
        action: 'STOCK_ADJUSTED',
        timestamp: new Date().toISOString(),
        item: { id: itemId, name: item.name },
        details: { 
          adjustment, 
          reason, 
          oldQuantity: item.quantity, 
          newQuantity 
        },
        user: 'system'
      };
      
      return { 
        success: true, 
        item: itemWithStatus,
        activity
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
};

// Exportar todas las acciones
export const inventoryActions = {
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
  adjustStock
};