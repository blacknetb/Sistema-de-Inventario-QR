import { get, post, put, del } from './api';
import { mockInventoryItems } from './mockData';
import { localStorageService } from './index';

// Usar datos mockeados si no hay API disponible
const USE_MOCK_DATA = !process.env.REACT_APP_API_URL;

const inventoryService = {
  // Obtener todos los items del inventario
  getAllItems: async (params = {}) => {
    try {
      if (USE_MOCK_DATA) {
        // Simular delay de API
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Obtener datos del localStorage o usar mock data
        let items = localStorageService.get('inventory_items') || mockInventoryItems;
        
        // Aplicar filtros si existen
        if (params.category) {
          items = items.filter(item => item.category === params.category);
        }
        if (params.status) {
          items = items.filter(item => item.status === params.status);
        }
        if (params.search) {
          const searchLower = params.search.toLowerCase();
          items = items.filter(item => 
            item.name.toLowerCase().includes(searchLower) ||
            item.description?.toLowerCase().includes(searchLower) ||
            item.sku?.toLowerCase().includes(searchLower)
          );
        }
        
        // Aplicar ordenamiento
        if (params.sortBy) {
          items.sort((a, b) => {
            if (params.sortOrder === 'desc') {
              return b[params.sortBy] > a[params.sortBy] ? 1 : -1;
            }
            return a[params.sortBy] > b[params.sortBy] ? 1 : -1;
          });
        }
        
        return { data: items, success: true };
      }
      
      const response = await get('/inventory', { params });
      return response.data;
    } catch (error) {
      console.error('Error obteniendo items del inventario:', error);
      throw error;
    }
  },

  // Obtener un item por ID
  getItemById: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const items = localStorageService.get('inventory_items') || mockInventoryItems;
        const item = items.find(item => item.id === parseInt(id));
        
        if (!item) {
          throw new Error('Item no encontrado');
        }
        
        return { data: item, success: true };
      }
      
      const response = await get(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error obteniendo item ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo item
  createItem: async (itemData) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const items = localStorageService.get('inventory_items') || mockInventoryItems;
        const newItem = {
          ...itemData,
          id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const updatedItems = [...items, newItem];
        localStorageService.set('inventory_items', updatedItems);
        
        return { 
          data: newItem, 
          success: true, 
          message: 'Item creado exitosamente' 
        };
      }
      
      const response = await post('/inventory', itemData);
      return response.data;
    } catch (error) {
      console.error('Error creando item:', error);
      throw error;
    }
  },

  // Actualizar un item existente
  updateItem: async (id, itemData) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let items = localStorageService.get('inventory_items') || mockInventoryItems;
        const itemIndex = items.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
          throw new Error('Item no encontrado');
        }
        
        const updatedItem = {
          ...items[itemIndex],
          ...itemData,
          id: parseInt(id),
          updatedAt: new Date().toISOString()
        };
        
        items[itemIndex] = updatedItem;
        localStorageService.set('inventory_items', items);
        
        return { 
          data: updatedItem, 
          success: true, 
          message: 'Item actualizado exitosamente' 
        };
      }
      
      const response = await put(`/inventory/${id}`, itemData);
      return response.data;
    } catch (error) {
      console.error(`Error actualizando item ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un item
  deleteItem: async (id) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        let items = localStorageService.get('inventory_items') || mockInventoryItems;
        const filteredItems = items.filter(item => item.id !== parseInt(id));
        
        if (filteredItems.length === items.length) {
          throw new Error('Item no encontrado');
        }
        
        localStorageService.set('inventory_items', filteredItems);
        
        return { 
          success: true, 
          message: 'Item eliminado exitosamente' 
        };
      }
      
      const response = await del(`/inventory/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error eliminando item ${id}:`, error);
      throw error;
    }
  },

  // Actualizar stock de un item
  updateStock: async (id, quantityChange, operation = 'add') => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        let items = localStorageService.get('inventory_items') || mockInventoryItems;
        const itemIndex = items.findIndex(item => item.id === parseInt(id));
        
        if (itemIndex === -1) {
          throw new Error('Item no encontrado');
        }
        
        let newQuantity = items[itemIndex].quantity;
        
        if (operation === 'add') {
          newQuantity += quantityChange;
        } else if (operation === 'subtract') {
          newQuantity -= quantityChange;
          if (newQuantity < 0) newQuantity = 0;
        } else if (operation === 'set') {
          newQuantity = quantityChange;
        }
        
        // Actualizar estado basado en la cantidad
        let newStatus = 'Disponible';
        if (newQuantity === 0) {
          newStatus = 'Agotado';
        } else if (newQuantity <= items[itemIndex].minimumStock) {
          newStatus = 'Bajo Stock';
        }
        
        const updatedItem = {
          ...items[itemIndex],
          quantity: newQuantity,
          status: newStatus,
          updatedAt: new Date().toISOString()
        };
        
        items[itemIndex] = updatedItem;
        localStorageService.set('inventory_items', items);
        
        return { 
          data: updatedItem, 
          success: true, 
          message: 'Stock actualizado exitosamente' 
        };
      }
      
      const response = await patch(`/inventory/${id}/stock`, {
        quantityChange,
        operation
      });
      return response.data;
    } catch (error) {
      console.error(`Error actualizando stock del item ${id}:`, error);
      throw error;
    }
  },

  // Obtener estadísticas del inventario
  getInventoryStats: async () => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const items = localStorageService.get('inventory_items') || mockInventoryItems;
        
        const totalItems = items.length;
        const totalValue = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStockItems = items.filter(item => item.status === 'Bajo Stock').length;
        const outOfStockItems = items.filter(item => item.status === 'Agotado').length;
        
        // Calcular por categoría
        const categories = {};
        items.forEach(item => {
          if (!categories[item.category]) {
            categories[item.category] = {
              count: 0,
              value: 0
            };
          }
          categories[item.category].count++;
          categories[item.category].value += item.price * item.quantity;
        });
        
        return {
          data: {
            totalItems,
            totalValue: parseFloat(totalValue.toFixed(2)),
            lowStockItems,
            outOfStockItems,
            categories,
            lastUpdated: new Date().toISOString()
          },
          success: true
        };
      }
      
      const response = await get('/inventory/stats');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      throw error;
    }
  },

  // Buscar items
  searchItems: async (searchTerm) => {
    try {
      if (USE_MOCK_DATA) {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const items = localStorageService.get('inventory_items') || mockInventoryItems;
        const searchLower = searchTerm.toLowerCase();
        
        const results = items.filter(item => 
          item.name.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.category.toLowerCase().includes(searchLower)
        );
        
        return { data: results, success: true };
      }
      
      const response = await get('/inventory/search', { params: { q: searchTerm } });
      return response.data;
    } catch (error) {
      console.error('Error buscando items:', error);
      throw error;
    }
  }
};

export default inventoryService;