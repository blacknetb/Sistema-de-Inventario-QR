import { inventoryConstants } from './inventoryConstants';

// Estado inicial
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
    autoUpdateStatus: true
  }
};

// Funciones auxiliares del reducer
const updateStatistics = (items) => {
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalCost = items.reduce((sum, item) => sum + (item.cost * item.quantity), 0);
  const totalProfit = totalValue - totalCost;
  const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
  
  const lowStockCount = items.filter(item => 
    item.status === inventoryConstants.ITEM_STATUS.LOW_STOCK
  ).length;
  
  const outOfStockCount = items.filter(item => 
    item.status === inventoryConstants.ITEM_STATUS.OUT_OF_STOCK
  ).length;
  
  const reorderCount = items.filter(item => 
    item.quantity <= item.minStock && item.quantity > 0
  ).length;
  
  const categorySummary = {};
  items.forEach(item => {
    if (!categorySummary[item.category]) {
      categorySummary[item.category] = {
        count: 0,
        totalValue: 0,
        items: []
      };
    }
    categorySummary[item.category].count++;
    categorySummary[item.category].totalValue += item.price * item.quantity;
    categorySummary[item.category].items.push(item);
  });
  
  return {
    totalItems: items.length,
    totalValue,
    totalCost,
    totalProfit,
    profitMargin,
    lowStockCount,
    outOfStockCount,
    reorderCount,
    categorySummary
  };
};

const addActivityLog = (state, action, item = null) => {
  const activities = [...state.activityLog];
  
  const activity = {
    id: Date.now(),
    action,
    timestamp: new Date().toISOString(),
    item: item ? { id: item.id, name: item.name } : null,
    user: 'system' // En una app real, esto vendría del contexto de autenticación
  };
  
  // Mantener solo las últimas 50 actividades
  activities.unshift(activity);
  if (activities.length > 50) {
    activities.pop();
  }
  
  return activities;
};

const applyFiltersAndSort = (items, filter, sort, searchTerm) => {
  let filtered = [...items];
  
  // Aplicar filtro
  if (filter !== inventoryConstants.FILTER_OPTIONS.ALL) {
    filtered = filtered.filter(item => {
      switch(filter) {
        case inventoryConstants.FILTER_OPTIONS.AVAILABLE:
          return item.status === inventoryConstants.ITEM_STATUS.AVAILABLE;
        case inventoryConstants.FILTER_OPTIONS.LOW_STOCK:
          return item.status === inventoryConstants.ITEM_STATUS.LOW_STOCK;
        case inventoryConstants.FILTER_OPTIONS.OUT_OF_STOCK:
          return item.status === inventoryConstants.ITEM_STATUS.OUT_OF_STOCK;
        default:
          return true;
      }
    });
  }
  
  // Aplicar búsqueda
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      item.category.toLowerCase().includes(term) ||
      (item.sku && item.sku.toLowerCase().includes(term)) ||
      (item.barcode && item.barcode.includes(term))
    );
  }
  
  // Aplicar ordenamiento
  switch(sort) {
    case inventoryConstants.SORT_OPTIONS.NAME_ASC:
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    
    case inventoryConstants.SORT_OPTIONS.NAME_DESC:
      filtered.sort((a, b) => b.name.localeCompare(a.name));
      break;
    
    case inventoryConstants.SORT_OPTIONS.PRICE_ASC:
      filtered.sort((a, b) => a.price - b.price);
      break;
    
    case inventoryConstants.SORT_OPTIONS.PRICE_DESC:
      filtered.sort((a, b) => b.price - a.price);
      break;
    
    case inventoryConstants.SORT_OPTIONS.QUANTITY_ASC:
      filtered.sort((a, b) => a.quantity - b.quantity);
      break;
    
    case inventoryConstants.SORT_OPTIONS.QUANTITY_DESC:
      filtered.sort((a, b) => b.quantity - a.quantity);
      break;
    
    case inventoryConstants.SORT_OPTIONS.DATE_ASC:
      filtered.sort((a, b) => new Date(a.lastUpdated) - new Date(b.lastUpdated));
      break;
    
    case inventoryConstants.SORT_OPTIONS.DATE_DESC:
      filtered.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
      break;
    
    default:
      break;
  }
  
  return filtered;
};

// Reducer principal
const inventoryReducer = (state = initialState, action) => {
  switch (action.type) {
    // Solicitud de items
    case inventoryConstants.FETCH_ITEMS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    // Éxito al obtener items
    case inventoryConstants.FETCH_ITEMS_SUCCESS:
      const fetchedItems = action.payload;
      const updatedStats = updateStatistics(fetchedItems);
      const filteredItems = applyFiltersAndSort(
        fetchedItems,
        state.filter,
        state.sort,
        state.searchTerm
      );
      
      return {
        ...state,
        items: fetchedItems,
        filteredItems,
        loading: false,
        stats: updatedStats,
        activityLog: addActivityLog(state, 'ITEMS_FETCHED')
      };
    
    // Error al obtener items
    case inventoryConstants.FETCH_ITEMS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        activityLog: addActivityLog(state, 'FETCH_ERROR')
      };
    
    // Solicitud de agregar item
    case inventoryConstants.ADD_ITEM_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    // Éxito al agregar item
    case inventoryConstants.ADD_ITEM_SUCCESS:
      const newItem = action.payload;
      const updatedItems = [...state.items, newItem];
      const newStats = updateStatistics(updatedItems);
      const newFilteredItems = applyFiltersAndSort(
        updatedItems,
        state.filter,
        state.sort,
        state.searchTerm
      );
      
      return {
        ...state,
        items: updatedItems,
        filteredItems: newFilteredItems,
        loading: false,
        stats: newStats,
        activityLog: addActivityLog(state, 'ITEM_ADDED', newItem)
      };
    
    // Error al agregar item
    case inventoryConstants.ADD_ITEM_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        activityLog: addActivityLog(state, 'ADD_ERROR')
      };
    
    // Solicitud de actualizar item
    case inventoryConstants.UPDATE_ITEM_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    // Éxito al actualizar item
    case inventoryConstants.UPDATE_ITEM_SUCCESS:
      const updatedItem = action.payload;
      const itemsAfterUpdate = state.items.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      );
      const statsAfterUpdate = updateStatistics(itemsAfterUpdate);
      const filteredAfterUpdate = applyFiltersAndSort(
        itemsAfterUpdate,
        state.filter,
        state.sort,
        state.searchTerm
      );
      
      return {
        ...state,
        items: itemsAfterUpdate,
        filteredItems: filteredAfterUpdate,
        loading: false,
        stats: statsAfterUpdate,
        activityLog: addActivityLog(state, 'ITEM_UPDATED', updatedItem)
      };
    
    // Error al actualizar item
    case inventoryConstants.UPDATE_ITEM_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        activityLog: addActivityLog(state, 'UPDATE_ERROR')
      };
    
    // Solicitud de eliminar item
    case inventoryConstants.DELETE_ITEM_REQUEST:
      return {
        ...state,
        loading: true,
        error: null
      };
    
    // Éxito al eliminar item
    case inventoryConstants.DELETE_ITEM_SUCCESS:
      const itemId = action.payload;
      const itemsAfterDelete = state.items.filter(item => item.id !== itemId);
      const statsAfterDelete = updateStatistics(itemsAfterDelete);
      const filteredAfterDelete = applyFiltersAndSort(
        itemsAfterDelete,
        state.filter,
        state.sort,
        state.searchTerm
      );
      
      return {
        ...state,
        items: itemsAfterDelete,
        filteredItems: filteredAfterDelete,
        loading: false,
        stats: statsAfterDelete,
        activityLog: addActivityLog(state, 'ITEM_DELETED', { id: itemId })
      };
    
    // Error al eliminar item
    case inventoryConstants.DELETE_ITEM_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
        activityLog: addActivityLog(state, 'DELETE_ERROR')
      };
    
    // Establecer filtro
    case inventoryConstants.SET_FILTER:
      const newFilter = action.payload;
      const itemsWithNewFilter = applyFiltersAndSort(
        state.items,
        newFilter,
        state.sort,
        state.searchTerm
      );
      
      return {
        ...state,
        filter: newFilter,
        filteredItems: itemsWithNewFilter
      };
    
    // Establecer ordenamiento
    case inventoryConstants.SET_SORT:
      const newSort = action.payload;
      const itemsWithNewSort = applyFiltersAndSort(
        state.items,
        state.filter,
        newSort,
        state.searchTerm
      );
      
      return {
        ...state,
        sort: newSort,
        filteredItems: itemsWithNewSort
      };
    
    // Establecer término de búsqueda
    case inventoryConstants.SET_SEARCH_TERM:
      const newSearchTerm = action.payload;
      const itemsWithSearch = applyFiltersAndSort(
        state.items,
        state.filter,
        state.sort,
        newSearchTerm
      );
      
      return {
        ...state,
        searchTerm: newSearchTerm,
        filteredItems: itemsWithSearch
      };
    
    // Actualizar configuración
    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };
    
    // Limpiar errores
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    // Resetear estado
    case 'RESET_INVENTORY':
      return {
        ...initialState,
        activityLog: addActivityLog(state, 'INVENTORY_RESET')
      };
    
    default:
      return state;
  }
};

export default inventoryReducer;