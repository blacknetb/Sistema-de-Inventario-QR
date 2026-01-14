import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';
import '../assets/styles/context.css';

const InventoryContext = createContext({});

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory debe usarse dentro de InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [state, setState] = useState({
    products: [],
    categories: [],
    suppliers: [],
    locations: [],
    loading: false,
    error: null,
    filters: {
      category: '',
      location: '',
      status: '',
      search: ''
    },
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0
    },
    stats: {
      totalItems: 0,
      lowStock: 0,
      outOfStock: 0,
      totalValue: 0,
      recentActivity: []
    }
  });

  const cacheRef = useRef({
    products: new Map(),
    categories: new Map(),
    lastUpdated: null
  });

  useEffect(() => {
    let isMounted = true;
    
    const loadInitialData = async () => {
      if (!isMounted) return;
      
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const [productsData, categoriesData, statsData] = await Promise.allSettled([
          api.get('/api/products'),
          api.get('/api/categories'),
          api.get('/api/inventory/stats')
        ]);

        const products = productsData.status === 'fulfilled' ? productsData.value.data : [];
        const categories = categoriesData.status === 'fulfilled' ? categoriesData.value.data : [];
        const stats = statsData.status === 'fulfilled' ? statsData.value.data : {};

        const newCache = {
          products: new Map(),
          categories: new Map(),
          lastUpdated: new Date()
        };
        
        products.forEach(product => {
          newCache.products.set(`product_${product.id}`, product);
        });
        
        categories.forEach(category => {
          newCache.categories.set(`category_${category.id}`, category);
        });
        
        cacheRef.current = newCache;

        if (isMounted) {
          setState(prev => ({
            ...prev,
            products,
            categories,
            stats: {
              ...prev.stats,
              ...stats
            },
            loading: false,
            pagination: {
              ...prev.pagination,
              total: products.length
            }
          }));
        }

      } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        
        if (isMounted) {
          setState(prev => ({
            ...prev,
            loading: false,
            error: error.response?.data?.message || error.message || 'Error cargando inventario'
          }));
        }
      }
    };
    
    loadInitialData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const getProductById = useCallback(async (id) => {
    const cacheKey = `product_${id}`;
    
    if (cacheRef.current.products.has(cacheKey)) {
      return cacheRef.current.products.get(cacheKey);
    }

    try {
      const response = await api.get(`/api/products/${id}`);
      const product = response.data;
      
      const newProductsCache = new Map(cacheRef.current.products);
      newProductsCache.set(cacheKey, product);
      cacheRef.current.products = newProductsCache;
      
      return product;
    } catch (error) {
      console.error(`❌ Error obteniendo producto ${id}:`, error);
      throw error;
    }
  }, []);

  const addProduct = useCallback(async (productData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.post('/api/products', productData);
      const newProduct = response.data;
      
      const newProductsCache = new Map(cacheRef.current.products);
      newProductsCache.set(`product_${newProduct.id}`, newProduct);
      cacheRef.current.products = newProductsCache;
      
      setState(prev => ({
        ...prev,
        products: [newProduct, ...prev.products],
        stats: {
          ...prev.stats,
          totalItems: prev.stats.totalItems + 1
        },
        loading: false
      }));
      
      return newProduct;
    } catch (error) {
      console.error('❌ Error agregando producto:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error agregando producto'
      }));
      throw error;
    }
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.put(`/api/products/${id}`, productData);
      const updatedProduct = response.data;
      
      const newProductsCache = new Map(cacheRef.current.products);
      newProductsCache.set(`product_${id}`, updatedProduct);
      cacheRef.current.products = newProductsCache;
      
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.id === id ? updatedProduct : p
        ),
        loading: false
      }));
      
      return updatedProduct;
    } catch (error) {
      console.error(`❌ Error actualizando producto ${id}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error actualizando producto'
      }));
      throw error;
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      await api.delete(`/api/products/${id}`);
      
      const newProductsCache = new Map(cacheRef.current.products);
      newProductsCache.delete(`product_${id}`);
      cacheRef.current.products = newProductsCache;
      
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        stats: {
          ...prev.stats,
          totalItems: Math.max(0, prev.stats.totalItems - 1)
        },
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error(`❌ Error eliminando producto ${id}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error eliminando producto'
      }));
      throw error;
    }
  }, []);

  const updateStock = useCallback(async (productId, quantity, operation = 'add', reason = '') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.post('/api/inventory/update-stock', {
        productId,
        quantity,
        operation,
        reason
      });
      
      const updatedProduct = response.data;
      
      const newProductsCache = new Map(cacheRef.current.products);
      newProductsCache.set(`product_${productId}`, updatedProduct);
      cacheRef.current.products = newProductsCache;
      
      setState(prev => ({
        ...prev,
        products: prev.products.map(p => 
          p.id === productId ? updatedProduct : p
        ),
        loading: false
      }));
      
      await updateInventoryStats();
      
      return updatedProduct;
    } catch (error) {
      console.error(`❌ Error actualizando stock de ${productId}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error actualizando stock'
      }));
      throw error;
    }
  }, []);

  const updateInventoryStats = useCallback(async () => {
    try {
      const response = await api.get('/api/inventory/stats');
      const stats = response.data;
      
      setState(prev => ({
        ...prev,
        stats: {
          ...prev.stats,
          ...stats
        }
      }));
    } catch (error) {
      console.error('❌ Error actualizando estadísticas:', error);
    }
  }, []);

  const filterProducts = useCallback((filters) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...filters },
      loading: true
    }));
    
    const timer = setTimeout(() => {
      setState(prev => ({
        ...prev,
        loading: false
      }));
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const searchProducts = useCallback(async (searchTerm) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.get('/api/products/search', {
        params: { q: searchTerm }
      });
      
      setState(prev => ({
        ...prev,
        products: response.data,
        loading: false,
        filters: {
          ...prev.filters,
          search: searchTerm
        }
      }));
    } catch (error) {
      console.error('❌ Error buscando productos:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error buscando productos'
      }));
    }
  }, []);

  const generateReport = useCallback(async (type = 'stock', format = 'pdf') => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.get(`/api/reports/${type}`, {
        params: { format },
        responseType: 'blob'
      });
      
      const url = globalThis.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_inventario_${type}_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setState(prev => ({ ...prev, loading: false }));
      
      return true;
    } catch (error) {
      console.error('❌ Error generando reporte:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error generando reporte'
      }));
      throw error;
    }
  }, []);

  const syncInventory = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await api.get('/api/inventory/sync');
      const { products, stats, lastSync } = response.data;
      
      const newCache = {
        products: new Map(),
        categories: new Map(cacheRef.current.categories),
        lastUpdated: new Date()
      };
      
      products.forEach(product => {
        newCache.products.set(`product_${product.id}`, product);
      });
      
      cacheRef.current = newCache;
      
      setState(prev => ({
        ...prev,
        products,
        stats: {
          ...prev.stats,
          ...stats
        },
        loading: false
      }));
      
      return { success: true, lastSync };
    } catch (error) {
      console.error('❌ Error sincronizando inventario:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.response?.data?.message || 'Error sincronizando con el servidor'
      }));
      return { success: false, error: error.message };
    }
  }, []);

  const value = useMemo(() => ({
    inventory: state,
    cache: cacheRef.current,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    filterProducts,
    searchProducts,
    generateReport,
    syncInventory,
    updateInventoryStats,
    loading: state.loading,
    error: state.error
  }), [
    state,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    filterProducts,
    searchProducts,
    generateReport,
    syncInventory,
    updateInventoryStats
  ]);

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

InventoryProvider.propTypes = {
  children: PropTypes.node.isRequired
};

InventoryProvider.displayName = 'InventoryProvider';

export default InventoryContext;