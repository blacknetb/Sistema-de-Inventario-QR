import { useState, useEffect, useCallback } from 'react';
import usePagination from './usePagination';

export const useProducts = (initialFilters = {}) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const pagination = usePagination({
    data: products,
    itemsPerPage: 10
  });

  // Cargar productos iniciales
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Simular llamada API
      await new Promise(resolve => setTimeout(resolve, 800));

      // Datos de ejemplo
      const mockProducts = [
        {
          id: 1,
          name: 'Laptop HP Pavilion',
          sku: 'LAP-001',
          category: 'Electrónica',
          description: 'Laptop HP Pavilion con procesador i5, 8GB RAM, 512GB SSD',
          price: 850,
          cost: 700,
          stock: 15,
          minStock: 5,
          optimalStock: 20,
          location: 'Aisle A, Shelf 3',
          supplier: 'HP Inc.',
          qrCode: null,
          createdAt: '2024-01-15',
          updatedAt: '2024-02-20'
        },
        {
          id: 2,
          name: 'Mouse Inalámbrico Logitech',
          sku: 'MOU-002',
          category: 'Accesorios',
          description: 'Mouse inalámbrico Logitech M185',
          price: 25,
          cost: 15,
          stock: 8,
          minStock: 10,
          optimalStock: 25,
          location: 'Aisle B, Shelf 1',
          supplier: 'Logitech',
          qrCode: null,
          createdAt: '2024-01-20',
          updatedAt: '2024-02-18'
        },
        {
          id: 3,
          name: 'Monitor Samsung 24"',
          sku: 'MON-003',
          category: 'Electrónica',
          description: 'Monitor Samsung de 24 pulgadas Full HD',
          price: 280,
          cost: 220,
          stock: 3,
          minStock: 5,
          optimalStock: 15,
          location: 'Aisle A, Shelf 5',
          supplier: 'Samsung',
          qrCode: null,
          createdAt: '2024-01-25',
          updatedAt: '2024-02-15'
        },
        {
          id: 4,
          name: 'Teclado Mecánico Redragon',
          sku: 'TEC-004',
          category: 'Accesorios',
          description: 'Teclado mecánico RGB switches rojos',
          price: 65,
          cost: 45,
          stock: 12,
          minStock: 8,
          optimalStock: 20,
          location: 'Aisle B, Shelf 2',
          supplier: 'Redragon',
          qrCode: null,
          createdAt: '2024-02-01',
          updatedAt: '2024-02-10'
        },
        {
          id: 5,
          name: 'Silla Gamer Corsair',
          sku: 'SIL-005',
          category: 'Muebles',
          description: 'Silla gamer ergonómica con soporte lumbar',
          price: 320,
          cost: 250,
          stock: 2,
          minStock: 3,
          optimalStock: 8,
          location: 'Aisle C, Shelf 1',
          supplier: 'Corsair',
          qrCode: null,
          createdAt: '2024-02-05',
          updatedAt: '2024-02-12'
        }
      ];

      // Aplicar filtros
      let filteredProducts = [...mockProducts];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.name.toLowerCase().includes(searchLower) || 
          p.sku.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower)
        );
      }

      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => 
          p.category === filters.category
        );
      }

      if (filters.supplier) {
        filteredProducts = filteredProducts.filter(p => 
          p.supplier === filters.supplier
        );
      }

      if (filters.minPrice) {
        filteredProducts = filteredProducts.filter(p => 
          p.price >= parseFloat(filters.minPrice)
        );
      }

      if (filters.maxPrice) {
        filteredProducts = filteredProducts.filter(p => 
          p.price <= parseFloat(filters.maxPrice)
        );
      }

      if (filters.stockStatus) {
        filteredProducts = filteredProducts.filter(p => {
          if (filters.stockStatus === 'low') return p.stock <= p.minStock;
          if (filters.stockStatus === 'optimal') return p.stock <= p.optimalStock && p.stock > p.minStock;
          if (filters.stockStatus === 'high') return p.stock > p.optimalStock;
          return true;
        });
      }

      if (filters.location) {
        filteredProducts = filteredProducts.filter(p => 
          p.location.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      setProducts(filteredProducts);
      return filteredProducts;
    } catch (err) {
      setError('Error al cargar productos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const getProduct = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      const product = products.find(p => p.id === id);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      setSelectedProduct(product);
      return { success: true, product };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [products]);

  const addProduct = useCallback(async (productData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      // Validaciones
      if (!productData.name || !productData.sku || !productData.price || !productData.stock) {
        throw new Error('Nombre, SKU, precio y stock son requeridos');
      }

      // Verificar SKU duplicado
      const exists = products.some(p => p.sku === productData.sku);
      if (exists) {
        throw new Error('Ya existe un producto con ese SKU');
      }

      const newProduct = {
        id: Date.now(),
        ...productData,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
        qrCode: null
      };

      setProducts(prev => [...prev, newProduct]);
      return { success: true, product: newProduct };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [products]);

  const updateProduct = useCallback(async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      let updatedProduct = null;

      setProducts(prev => prev.map(p => {
        if (p.id === id) {
          updatedProduct = {
            ...p,
            ...updatedData,
            updatedAt: new Date().toISOString().split('T')[0]
          };
          return updatedProduct;
        }
        return p;
      }));

      if (!updatedProduct) {
        throw new Error('Producto no encontrado');
      }

      return { success: true, product: updatedProduct };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 500));

      const productToDelete = products.find(p => p.id === id);
      if (!productToDelete) {
        throw new Error('Producto no encontrado');
      }

      setProducts(prev => prev.filter(p => p.id !== id));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [products]);

  const updateStock = useCallback(async (id, quantity, type = 'add') => {
    try {
      setLoading(true);
      setError(null);

      await new Promise(resolve => setTimeout(resolve, 300));

      let updatedProduct = null;

      setProducts(prev => prev.map(p => {
        if (p.id === id) {
          const newStock = type === 'add' 
            ? p.stock + quantity 
            : p.stock - quantity;
          
          if (newStock < 0) {
            throw new Error('Stock no puede ser negativo');
          }

          updatedProduct = {
            ...p,
            stock: newStock,
            updatedAt: new Date().toISOString().split('T')[0]
          };
          return updatedProduct;
        }
        return p;
      }));

      return { success: true, product: updatedProduct };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (searchTerm) => {
    try {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 300));

      if (!searchTerm) {
        return products;
      }

      const searchLower = searchTerm.toLowerCase();
      const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchLower) ||
        p.sku.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower) ||
        p.category.toLowerCase().includes(searchLower)
      );

      return filtered;
    } catch (err) {
      setError('Error al buscar productos');
      return [];
    } finally {
      setLoading(false);
    }
  }, [products]);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const selectProduct = useCallback((product) => {
    setSelectedProduct(product);
  }, []);

  const clearSelectedProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const getLowStockProducts = useCallback(() => {
    return products.filter(p => p.stock <= p.minStock);
  }, [products]);

  const getProductsByCategory = useCallback((category) => {
    return products.filter(p => p.category === category);
  }, [products]);

  const getProductStats = useCallback(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock <= p.minStock).length;

    const categories = {};
    products.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });

    return {
      totalProducts,
      totalStock,
      totalValue,
      lowStockCount,
      categories,
      averagePrice: totalProducts ? totalValue / totalProducts : 0
    };
  }, [products]);

  return {
    products,
    loading,
    error,
    filters,
    selectedProduct,
    pagination,
    loadProducts,
    getProduct,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    searchProducts,
    updateFilters,
    clearFilters,
    selectProduct,
    clearSelectedProduct,
    getLowStockProducts,
    getProductsByCategory,
    getProductStats
  };
};

export default useProducts;