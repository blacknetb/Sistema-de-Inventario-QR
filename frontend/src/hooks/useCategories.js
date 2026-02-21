import { useState, useEffect, useCallback } from 'react';

export const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Cargar categorías iniciales
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Datos de ejemplo
      const mockCategories = [
        { id: 1, name: 'Electrónica', productCount: 15, description: 'Productos electrónicos y gadgets' },
        { id: 2, name: 'Accesorios', productCount: 23, description: 'Accesorios para computadoras' },
        { id: 3, name: 'Muebles', productCount: 8, description: 'Muebles de oficina' },
        { id: 4, name: 'Oficina', productCount: 12, description: 'Suministros de oficina' },
        { id: 5, name: 'Computadoras', productCount: 7, description: 'Computadoras y laptops' },
        { id: 6, name: 'Impresoras', productCount: 5, description: 'Impresoras y multifuncionales' },
        { id: 7, name: 'Redes', productCount: 9, description: 'Equipos de red y conectividad' },
        { id: 8, name: 'Software', productCount: 4, description: 'Software y licencias' }
      ];

      setCategories(mockCategories);
      return mockCategories;
    } catch (error) {
      setError('Error al cargar categorías');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategory = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      const category = categories.find(c => c.id === id);
      if (!category) {
        throw new Error('Categoría no encontrada');
      }

      return { success: true, category };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const addCategory = useCallback(async (categoryData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Validaciones
      if (!categoryData.name) {
        throw new Error('El nombre de la categoría es requerido');
      }

      // Verificar duplicados
      const exists = categories.some(c => 
        c.name.toLowerCase() === categoryData.name.toLowerCase()
      );

      if (exists) {
        throw new Error('Ya existe una categoría con ese nombre');
      }

      const newCategory = {
        id: Date.now(),
        name: categoryData.name,
        description: categoryData.description || '',
        productCount: 0,
        createdAt: new Date().toISOString()
      };

      setCategories(prev => [...prev, newCategory]);
      return { success: true, category: newCategory };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const updateCategory = useCallback(async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedCategory = null;

      setCategories(prev => prev.map(c => {
        if (c.id === id) {
          updatedCategory = { ...c, ...updatedData };
          return updatedCategory;
        }
        return c;
      }));

      if (!updatedCategory) {
        throw new Error('Categoría no encontrada');
      }

      return { success: true, category: updatedCategory };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCategory = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      const categoryToDelete = categories.find(c => c.id === id);

      if (!categoryToDelete) {
        throw new Error('Categoría no encontrada');
      }

      if (categoryToDelete.productCount > 0) {
        throw new Error('No se puede eliminar una categoría con productos asociados');
      }

      setCategories(prev => prev.filter(c => c.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const getCategoriesWithProductCount = useCallback(async () => {
    try {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 300));

      // Aquí podrías hacer una llamada real a la API
      // Por ahora, retornamos las categorías con el contador actual
      return categories;
    } catch (err) {
      setError('Error al obtener categorías con contador');
      return [];
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const searchCategories = useCallback(async (searchTerm) => {
    try {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 300));

      if (!searchTerm) {
        return categories;
      }

      const filtered = categories.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return filtered;
    } catch (err) {
      setError('Error al buscar categorías');
      return [];
    } finally {
      setLoading(false);
    }
  }, [categories]);

  const selectCategory = useCallback((category) => {
    setSelectedCategory(category);
  }, []);

  const clearSelectedCategory = useCallback(() => {
    setSelectedCategory(null);
  }, []);

  const getCategoryStats = useCallback(() => {
    const totalCategories = categories.length;
    const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
    const averageProductsPerCategory = totalCategories ? totalProducts / totalCategories : 0;

    return {
      totalCategories,
      totalProducts,
      averageProductsPerCategory,
      mostPopulated: categories.reduce((max, c) => 
        (c.productCount > (max?.productCount || 0)) ? c : max, null
      )
    };
  }, [categories]);

  return {
    categories,
    loading,
    error,
    selectedCategory,
    loadCategories,
    getCategory,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoriesWithProductCount,
    searchCategories,
    selectCategory,
    clearSelectedCategory,
    getCategoryStats
  };
};

export default useCategories;