export const inventoryConstants = {
  // Tipos de acción
  FETCH_ITEMS_REQUEST: 'FETCH_ITEMS_REQUEST',
  FETCH_ITEMS_SUCCESS: 'FETCH_ITEMS_SUCCESS',
  FETCH_ITEMS_FAILURE: 'FETCH_ITEMS_FAILURE',
  
  ADD_ITEM_REQUEST: 'ADD_ITEM_REQUEST',
  ADD_ITEM_SUCCESS: 'ADD_ITEM_SUCCESS',
  ADD_ITEM_FAILURE: 'ADD_ITEM_FAILURE',
  
  UPDATE_ITEM_REQUEST: 'UPDATE_ITEM_REQUEST',
  UPDATE_ITEM_SUCCESS: 'UPDATE_ITEM_SUCCESS',
  UPDATE_ITEM_FAILURE: 'UPDATE_ITEM_FAILURE',
  
  DELETE_ITEM_REQUEST: 'DELETE_ITEM_REQUEST',
  DELETE_ITEM_SUCCESS: 'DELETE_ITEM_SUCCESS',
  DELETE_ITEM_FAILURE: 'DELETE_ITEM_FAILURE',
  
  SET_FILTER: 'SET_FILTER',
  SET_SORT: 'SET_SORT',
  SET_SEARCH_TERM: 'SET_SEARCH_TERM',
  
  // Estados de items
  ITEM_STATUS: {
    AVAILABLE: 'Disponible',
    LOW_STOCK: 'Bajo Stock',
    OUT_OF_STOCK: 'Agotado'
  },
  
  // Categorías
  CATEGORIES: [
    'Electrónica',
    'Accesorios',
    'Oficina',
    'Almacenamiento',
    'Redes',
    'Muebles',
    'Herramientas',
    'Software',
    'Otros'
  ],
  
  // Filtros
  FILTER_OPTIONS: {
    ALL: 'all',
    AVAILABLE: 'available',
    LOW_STOCK: 'low_stock',
    OUT_OF_STOCK: 'out_of_stock'
  },
  
  // Ordenamiento
  SORT_OPTIONS: {
    NAME_ASC: 'name_asc',
    NAME_DESC: 'name_desc',
    PRICE_ASC: 'price_asc',
    PRICE_DESC: 'price_desc',
    QUANTITY_ASC: 'quantity_asc',
    QUANTITY_DESC: 'quantity_desc',
    DATE_ASC: 'date_asc',
    DATE_DESC: 'date_desc'
  }
};