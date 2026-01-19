import { get, post, put, del } from './api';
import { localStorageService } from './index';

const categoryService = {
  // Obtener todas las categorías
  getAllCategories: async () => {
    try {
      // Simular llamada a API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Obtener categorías del localStorage o usar default
      let categories = localStorageService.get('categories') || [
        { id: 1, name: 'Electrónica', description: 'Dispositivos electrónicos', itemCount: 3, color: '#3498db' },
        { id: 2, name: 'Accesorios', description: 'Accesorios para computadora', itemCount: 2, color: '#2ecc71' },
        { id: 3, name: 'Oficina', description: 'Equipos de oficina', itemCount: 1, color: '#9b59b6' },
        { id: 4, name: 'Almacenamiento', description: 'Dispositivos de almacenamiento', itemCount: 1, color: '#e74c3c' },
        { id: 5, name: 'Redes', description: 'Equipos de red', itemCount: 1, color: '#f39c12' },
        { id: 6, name: 'Muebles', description: 'Mobiliario de oficina', itemCount: 0, color: '#1abc9c' },
        { id: 7, name: 'Herramientas', description: 'Herramientas varias', itemCount: 0, color: '#34495e' }
      ];
      
      // Actualizar contador de items
      const items = localStorageService.get('inventory_items') || [];
      categories.forEach(category => {
        category.itemCount = items.filter(item => item.category === category.name).length;
      });
      
      localStorageService.set('categories', categories);
      
      return {
        success: true,
        data: categories,
        message: 'Categorías obtenidas exitosamente'
      };
    } catch (error) {
      console.error('Error obteniendo categorías:', error);
      throw error;
    }
  },

  // Obtener una categoría por ID
  getCategoryById: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const categories = localStorageService.get('categories') || [];
      const category = categories.find(cat => cat.id === parseInt(id));
      
      if (!category) {
        throw new Error('Categoría no encontrada');
      }
      
      return {
        success: true,
        data: category,
        message: 'Categoría obtenida exitosamente'
      };
    } catch (error) {
      console.error(`Error obteniendo categoría ${id}:`, error);
      throw error;
    }
  },

  // Crear una nueva categoría
  createCategory: async (categoryData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const categories = localStorageService.get('categories') || [];
      
      // Validar que no exista una categoría con el mismo nombre
      const existingCategory = categories.find(cat => 
        cat.name.toLowerCase() === categoryData.name.toLowerCase()
      );
      
      if (existingCategory) {
        throw new Error('Ya existe una categoría con este nombre');
      }
      
      const newCategory = {
        ...categoryData,
        id: categories.length > 0 ? Math.max(...categories.map(c => c.id)) + 1 : 1,
        itemCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedCategories = [...categories, newCategory];
      localStorageService.set('categories', updatedCategories);
      
      return {
        success: true,
        data: newCategory,
        message: 'Categoría creada exitosamente'
      };
    } catch (error) {
      console.error('Error creando categoría:', error);
      throw error;
    }
  },

  // Actualizar una categoría
  updateCategory: async (id, categoryData) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let categories = localStorageService.get('categories') || [];
      const categoryIndex = categories.findIndex(cat => cat.id === parseInt(id));
      
      if (categoryIndex === -1) {
        throw new Error('Categoría no encontrada');
      }
      
      // Validar que no exista otra categoría con el mismo nombre
      const duplicateCategory = categories.find((cat, index) => 
        index !== categoryIndex && 
        cat.name.toLowerCase() === categoryData.name.toLowerCase()
      );
      
      if (duplicateCategory) {
        throw new Error('Ya existe otra categoría con este nombre');
      }
      
      const updatedCategory = {
        ...categories[categoryIndex],
        ...categoryData,
        id: parseInt(id),
        updatedAt: new Date().toISOString()
      };
      
      categories[categoryIndex] = updatedCategory;
      localStorageService.set('categories', categories);
      
      return {
        success: true,
        data: updatedCategory,
        message: 'Categoría actualizada exitosamente'
      };
    } catch (error) {
      console.error(`Error actualizando categoría ${id}:`, error);
      throw error;
    }
  },

  // Eliminar una categoría
  deleteCategory: async (id) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let categories = localStorageService.get('categories') || [];
      const filteredCategories = categories.filter(cat => cat.id !== parseInt(id));
      
      if (filteredCategories.length === categories.length) {
        throw new Error('Categoría no encontrada');
      }
      
      // Verificar si hay items usando esta categoría
      const items = localStorageService.get('inventory_items') || [];
      const itemsWithCategory = items.filter(item => {
        const category = categories.find(cat => cat.id === parseInt(id));
        return category && item.category === category.name;
      });
      
      if (itemsWithCategory.length > 0) {
        throw new Error(`No se puede eliminar. Hay ${itemsWithCategory.length} items usando esta categoría.`);
      }
      
      localStorageService.set('categories', filteredCategories);
      
      return {
        success: true,
        message: 'Categoría eliminada exitosamente'
      };
    } catch (error) {
      console.error(`Error eliminando categoría ${id}:`, error);
      throw error;
    }
  },

  // Obtener estadísticas por categoría
  getCategoryStats: async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const categories = localStorageService.get('categories') || [];
      const items = localStorageService.get('inventory_items') || [];
      
      const stats = categories.map(category => {
        const categoryItems = items.filter(item => item.category === category.name);
        const totalValue = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const lowStockCount = categoryItems.filter(item => item.status === 'Bajo Stock').length;
        const outOfStockCount = categoryItems.filter(item => item.status === 'Agotado').length;
        
        return {
          ...category,
          totalItems: categoryItems.length,
          totalValue: parseFloat(totalValue.toFixed(2)),
          lowStockCount,
          outOfStockCount,
          averagePrice: categoryItems.length > 0 
            ? parseFloat((totalValue / categoryItems.reduce((sum, item) => sum + item.quantity, 0)).toFixed(2))
            : 0
        };
      });
      
      return {
        success: true,
        data: stats,
        message: 'Estadísticas por categoría obtenidas'
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de categorías:', error);
      throw error;
    }
  },

  // Obtener sugerencias de colores para categorías
  getColorSuggestions: () => {
    return [
      '#3498db', // Azul
      '#2ecc71', // Verde
      '#e74c3c', // Rojo
      '#f39c12', // Naranja
      '#9b59b6', // Morado
      '#1abc9c', // Turquesa
      '#34495e', // Azul oscuro
      '#e67e22', // Naranja oscuro
      '#27ae60', // Verde oscuro
      '#8e44ad', // Morado oscuro
      '#d35400', // Calabaza
      '#16a085', // Verde esmeralda
      '#c0392b', // Rojo oscuro
      '#2980b9', // Azul marino
      '#f1c40f'  // Amarillo
    ];
  }
};

export default categoryService;