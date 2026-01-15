import { useState, useEffect, useCallback } from 'react';
import categoryService from '../services/categoryService';

/**
 * Hook personalizado para manejar operaciones de categorías
 */
const useCategories = (initialParams = {}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1
  });
  const [params, setParams] = useState(initialParams);

  /**
   * Carga las categorías con los parámetros actuales
   */
  const loadCategories = useCallback(async (signal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await categoryService.getAll(
        {
          page: pagination.page,
          limit: pagination.limit,
          ...params
        },
        signal
      );

      if (response.success) {
        setCategories(response.data || []);
        setPagination(prev => ({
          ...prev,
          totalItems: response.pagination?.total || response.data?.length || 0,
          totalPages: response.pagination?.pages || 1
        }));
      } else {
        setError(response.message);
        setCategories([]);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Error al cargar las categorías');
        setCategories([]);
      }
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [pagination.page, pagination.limit, params]);

  /**
   * Carga inicial y cuando cambian los parámetros
   */
  useEffect(() => {
    const abortController = new AbortController();
    loadCategories(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadCategories]);

  /**
   * Cambia la página actual
   */
  const setPage = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({ ...prev, page: newPage }));
    }
  }, [pagination.totalPages]);

  /**
   * Cambia el límite de elementos por página
   */
  const setLimit = useCallback((newLimit) => {
    setPagination(prev => ({
      ...prev,
      limit: parseInt(newLimit, 10),
      page: 1
    }));
  }, []);

  /**
   * Actualiza los parámetros de filtrado
   */
  const updateParams = useCallback((newParams) => {
    setParams(prev => ({ ...prev, ...newParams }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Crea una nueva categoría
   */
  const createCategory = useCallback(async (categoryData) => {
    setLoading(true);
    try {
      const response = await categoryService.create(categoryData);
      if (response.success) {
        await loadCategories();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  /**
   * Actualiza una categoría existente
   */
  const updateCategory = useCallback(async (id, categoryData) => {
    setLoading(true);
    try {
      const response = await categoryService.update(id, categoryData);
      if (response.success) {
        await loadCategories();
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  /**
   * Elimina una categoría
   */
  const deleteCategory = useCallback(async (id) => {
    setLoading(true);
    try {
      const response = await categoryService.delete(id);
      if (response.success) {
        await loadCategories();
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [loadCategories]);

  /**
   * Obtiene una categoría por ID
   */
  const getCategoryById = useCallback(async (id) => {
    try {
      const response = await categoryService.getById(id);
      if (response.success) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Exporta categorías a CSV
   */
  const exportToCSV = useCallback(async () => {
    try {
      const response = await categoryService.exportToCSV(params);
      if (response.success) {
        categoryService.downloadCSV(response.data, response.filename);
        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [params]);

  return {
    // Estado
    categories,
    loading,
    error,
    pagination,
    
    // Acciones
    loadCategories,
    setPage,
    setLimit,
    updateParams,
    createCategory,
    updateCategory,
    deleteCategory,
    getCategoryById,
    exportToCSV,
    
    // Métodos de conveniencia
    refetch: () => loadCategories(),
    hasNextPage: pagination.page < pagination.totalPages,
    hasPrevPage: pagination.page > 1,
    totalItems: pagination.totalItems,
    isEmpty: categories.length === 0 && !loading
  };
};

export default useCategories;