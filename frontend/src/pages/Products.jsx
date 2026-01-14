import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Plus, Package, Star,
  Edit2, Trash2, Eye, ShoppingCart,
  TrendingUp, TrendingDown, Grid, List,
  DollarSign, Download, RefreshCw, Check,
  AlertCircle, StarHalf, MoreVertical,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ✅ MEJORA: Configuración centralizada
const API_CONFIG = {
  BASE_URL: globalThis.APP_CONFIG?.apiUrl || 'http://localhost:3000/api',
  getAuthHeader: () => ({
    'Authorization': `Bearer ${localStorage.getItem('token') || sessionStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  })
};

// ✅ MEJORA: Custom Hook para gestión de productos optimizado
const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [cache, setCache] = useState({});

  const fetchProducts = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const cacheKey = JSON.stringify(params);
      // ✅ MEJORA: Cache inteligente con validación
      if (cache[cacheKey] && !params.forceRefresh) {
        const { data, timestamp } = cache[cacheKey];
        if (Date.now() - timestamp < 30000) {
          setProducts(data.products || []);
          setPagination(data.pagination || pagination);
          setLoading(false);
          return;
        }
      }

      const queryParams = new URLSearchParams({
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...(params.filters || {})
      }).toString();

      const response = await fetch(`${API_CONFIG.BASE_URL}/products?${queryParams}`, {
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // ✅ MEJORA: Validar estructura de datos
      const validatedProducts = Array.isArray(data.products) ? data.products :
        Array.isArray(data) ? data : [];

      setProducts(validatedProducts);

      if (data.pagination) {
        setPagination(data.pagination);
      }

      // ✅ MEJORA: Actualizar cache con manejo de errores
      try {
        setCache(prev => ({
          ...prev,
          [cacheKey]: {
            data: { products: validatedProducts, pagination: data.pagination },
            timestamp: Date.now()
          }
        }));
      } catch (cacheError) {
        console.warn('Error updating cache:', cacheError);
      }

    } catch (err) {
      setError(err.message);
      toast.error(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  }, [cache, pagination]);

  const createProduct = useCallback(async (productData) => {
    try {
      // ✅ MEJORA: Validar datos antes de enviar
      if (!productData || typeof productData !== 'object') {
        throw new Error('Datos del producto inválidos');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/products`, {
        method: 'POST',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify(productData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear producto');
      }

      const newProduct = await response.json();

      // ✅ MEJORA: Actualizar estado optimista
      setProducts(prev => [newProduct, ...prev]);

      // ✅ MEJORA: Invalidar cache
      setCache({});

      toast.success('Producto creado correctamente');
      return newProduct;
    } catch (err) {
      console.error('Error creating product:', err);
      toast.error(err.message || 'Error al crear producto');
      throw err;
    }
  }, []);

  const updateProduct = useCallback(async (id, updates) => {
    try {
      if (!id || !updates || typeof updates !== 'object') {
        throw new Error('Datos inválidos para actualizar');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
        method: 'PUT',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar producto');
      }

      const updatedProduct = await response.json();

      // ✅ MEJORA: Actualizar estado optimista
      setProducts(prev => prev.map(p => p.id === id ? updatedProduct : p));

      // ✅ MEJORA: Invalidar cache
      setCache({});

      toast.success('Producto actualizado correctamente');
      return updatedProduct;
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error(err.message || 'Error al actualizar producto');
      throw err;
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    try {
      if (!id) {
        throw new Error('ID de producto inválido');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/${id}`, {
        method: 'DELETE',
        headers: API_CONFIG.getAuthHeader()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar producto');
      }

      // ✅ MEJORA: Actualizar estado optimista
      setProducts(prev => prev.filter(p => p.id !== id));
      setSelectedProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });

      // ✅ MEJORA: Invalidar cache
      setCache({});

      toast.success('Producto eliminado correctamente');
      return true;
    } catch (err) {
      console.error('Error deleting product:', err);
      toast.error(err.message || 'Error al eliminar producto');
      return false;
    }
  }, []);

  const deleteMultiple = useCallback(async (ids) => {
    try {
      if (!ids || !ids.size) {
        throw new Error('No hay productos seleccionados');
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/batch`, {
        method: 'DELETE',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify({ ids: Array.from(ids) })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar productos');
      }

      // ✅ MEJORA: Actualizar estado optimista
      setProducts(prev => prev.filter(p => !ids.has(p.id)));
      setSelectedProducts(new Set());

      // ✅ MEJORA: Invalidar cache
      setCache({});

      toast.success(`${ids.size} productos eliminados correctamente`);
      return true;
    } catch (err) {
      console.error('Error deleting multiple products:', err);
      toast.error(err.message || 'Error al eliminar productos');
      return false;
    }
  }, []);

  const toggleProductSelection = useCallback((id) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedProducts(new Set(products.map(p => p.id)));
  }, [products]);

  const clearSelection = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    selectedProducts,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    deleteMultiple,
    toggleProductSelection,
    selectAll,
    clearSelection
  };
};

// ✅ MEJORA: Custom Hook para filtros avanzados optimizado
const useProductFilters = () => {
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    priceRange: { min: 0, max: 100000 },
    stockRange: { min: 0, max: 1000 },
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableBrands, setAvailableBrands] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      status: 'all',
      priceRange: { min: 0, max: 100000 },
      stockRange: { min: 0, max: 1000 },
      sortBy: 'name',
      sortOrder: 'asc'
    });
  }, []);

  const fetchFilterOptions = useCallback(async () => {
    try {
      setLoadingOptions(true);

      const [categoriesRes, brandsRes] = await Promise.all([
        fetch(`${API_CONFIG.BASE_URL}/products/categories`, {
          headers: API_CONFIG.getAuthHeader()
        }),
        fetch(`${API_CONFIG.BASE_URL}/products/brands`, {
          headers: API_CONFIG.getAuthHeader()
        })
      ]);

      if (categoriesRes.ok) {
        const categories = await categoriesRes.json();
        setAvailableCategories(Array.isArray(categories) ? categories : []);
      }

      if (brandsRes.ok) {
        const brands = await brandsRes.json();
        setAvailableBrands(Array.isArray(brands) ? brands : []);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
      toast.error('Error al cargar opciones de filtro');
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  const applyFilters = useCallback((productsToFilter) => {
    if (!Array.isArray(productsToFilter)) return [];

    return productsToFilter
      .filter(product => {
        // ✅ MEJORA: Validar producto antes de filtrar
        if (!product || typeof product !== 'object') return false;

        // Filtro de búsqueda
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          const matchesSearch =
            (product.name?.toLowerCase().includes(searchLower)) ||
            (product.description?.toLowerCase().includes(searchLower)) ||
            (product.sku?.toLowerCase().includes(searchLower)) ||
            (product.category?.toLowerCase().includes(searchLower));

          if (!matchesSearch) return false;
        }

        // Filtro por categoría
        if (filters.category !== 'all' && product.category !== filters.category) {
          return false;
        }

        // Filtro por estado
        if (filters.status !== 'all' && product.status !== filters.status) {
          return false;
        }

        // Filtro por precio
        const price = Number(product.price) || 0;
        if (price < filters.priceRange.min || price > filters.priceRange.max) {
          return false;
        }

        // Filtro por stock
        const stock = Number(product.stock) || 0;
        if (stock < filters.stockRange.min || stock > filters.stockRange.max) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const order = filters.sortOrder === 'asc' ? 1 : -1;

        switch (filters.sortBy) {
          case 'name':
            return order * (a.name || '').localeCompare(b.name || '');
          case 'price':
            return order * ((Number(a.price) || 0) - (Number(b.price) || 0));
          case 'stock':
            return order * ((Number(a.stock) || 0) - (Number(b.stock) || 0));
          case 'rating':
            return order * ((Number(a.rating) || 0) - (Number(b.rating) || 0));
          case 'sales':
            return order * ((Number(a.sales) || 0) - (Number(b.sales) || 0));
          default:
            return 0;
        }
      });
  }, [filters]);

  return {
    filters,
    availableCategories,
    availableBrands,
    loadingOptions,
    updateFilter,
    resetFilters,
    fetchFilterOptions,
    applyFilters
  };
};

// ✅ MEJORA: Componente de Product Card optimizado con memo
const ProductCard = React.memo(({
  product,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onView
}) => {
  const formatCurrency = useCallback((amount) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(numAmount);
  }, []);

  const getStockStatus = useCallback(() => {
    if (!product) return 'unknown';

    const stock = Number(product.stock) || 0;
    const minStock = Number(product.minStock) || 0;
    const maxStock = Number(product.maxStock) || 0;

    if (stock <= 0) return 'critical';
    if (stock <= minStock * 0.3) return 'critical';
    if (stock <= minStock * 0.5) return 'warning';
    if (stock >= maxStock * 0.8) return 'high';
    return 'normal';
  }, [product]);

  const renderStars = useCallback((rating) => {
    const safeRating = Math.min(Math.max(Number(rating) || 0, 0), 5);
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} className="w-3 h-3 text-yellow-400 fill-current" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-3 h-3 text-yellow-400 fill-current" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-3 h-3 text-gray-300" />);
    }

    return stars;
  }, []);

  const statusConfig = {
    critical: { color: 'bg-red-100 text-red-800', label: 'Crítico' },
    warning: { color: 'bg-yellow-100 text-yellow-800', label: 'Bajo' },
    normal: { color: 'bg-green-100 text-green-800', label: 'Normal' },
    high: { color: 'bg-blue-100 text-blue-800', label: 'Alto' },
    unknown: { color: 'bg-gray-100 text-gray-800', label: 'Desconocido' }
  };

  const status = getStockStatus();
  const { color, label } = statusConfig[status] || statusConfig.unknown;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-300 ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
        }`}
      role="article"
      aria-label={`Producto: ${product.name}`}
    >
      {/* Cabecera con checkbox */}
      <div className="p-3 border-b border-gray-100 flex items-center justify-between">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(product.id)}
            className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-1"
            aria-label={`Seleccionar ${product.name}`}
          />
          <span className="ml-2 text-xs text-gray-600">Seleccionar</span>
        </label>

        <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
          {label}
        </span>
      </div>

      {/* Imagen */}
      <div className="relative h-48 overflow-hidden bg-linear-to-br from-gray-100 to-gray-200">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`absolute inset-0 flex items-center justify-center ${product.image ? 'hidden' : ''}`}>
          <Package className="w-12 h-12 text-gray-400" />
        </div>
        <div className="absolute top-2 right-2">
          <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-sm">
            {renderStars(product.rating)}
            <span className="ml-1 text-xs font-medium">{Number(product.rating) || 0}</span>
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="p-4">
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 mb-1" title={product.name}>
            {product.name}
          </h3>
          <p className="text-xs text-gray-600 line-clamp-2 mb-2 min-h-[2.5rem]" title={product.description}>
            {product.description || 'Sin descripción'}
          </p>
        </div>

        <div className="space-y-3">
          {/* Precio y stock */}
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(product.price)}
              </div>
              <div className="text-xs text-gray-500">
                Stock: {product.stock || 0}
              </div>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
              {product.category || 'Sin categoría'}
            </span>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Margen</div>
              <div className="font-medium text-green-600">
                {(() => {
                  const price = Number(product.price) || 0;
                  const cost = Number(product.cost) || 0;
                  if (cost === 0) return '0%';
                  return `${(((price - cost) / cost) * 100).toFixed(1)}%`;
                })()}
              </div>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <div className="text-gray-500">Ventas</div>
              <div className="font-medium text-purple-600">{product.sales || 0}</div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex space-x-2 pt-2">
            <button
              onClick={() => onView(product.id)}
              className="flex-1 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              aria-label={`Ver detalles de ${product.name}`}
            >
              <Eye className="w-3 h-3 mr-1" />
              Ver
            </button>
            <button
              onClick={() => onEdit(product.id)}
              className="p-2 text-green-600 hover:text-green-800 border border-green-300 rounded-lg hover:bg-green-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
              aria-label={`Editar ${product.name}`}
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(product.id)}
              className="p-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg hover:bg-red-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
              aria-label={`Eliminar ${product.name}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

// ✅ MEJORA: Componente de Filtros Avanzados optimizado
const AdvancedFilters = React.memo(({
  filters,
  availableCategories,
  onFilterChange,
  onReset,
  loading
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm p-5 mb-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-3">
        <h3 className="text-lg font-semibold text-gray-900">
          Filtros de productos
        </h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            aria-expanded={showAdvanced}
            aria-controls="advanced-filters"
          >
            <Filter className="w-4 h-4 mr-1" />
            {showAdvanced ? 'Filtros básicos' : 'Filtros avanzados'}
          </button>
          <button
            onClick={onReset}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 rounded"
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Filtros básicos */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU, descripción..."
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
            aria-label="Buscar productos"
          />
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            id="advanced-filters"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría
                </label>
                <select
                  id="category-filter"
                  value={filters.category}
                  onChange={(e) => onFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                  disabled={loading}
                >
                  <option value="all">Todas las categorías</option>
                  {availableCategories.map((category, index) => (
                    <option key={`category-${category}`} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="status-filter"
                  value={filters.status}
                  onChange={(e) => onFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                >
                  <option value="all">Todos los estados</option>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="draft">Borrador</option>
                </select>
              </div>

              <div>
                <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <div className="flex space-x-2">
                  <select
                    id="sort-filter"
                    value={filters.sortBy}
                    onChange={(e) => onFilterChange('sortBy', e.target.value)}
                    className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                  >
                    <option value="name">Nombre</option>
                    <option value="price">Precio</option>
                    <option value="stock">Stock</option>
                    <option value="rating">Calificación</option>
                    <option value="sales">Ventas</option>
                  </select>
                  <button
                    onClick={() => onFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                    aria-label={`Orden ${filters.sortOrder === 'asc' ? 'descendente' : 'ascendente'}`}
                  >
                    {filters.sortOrder === 'asc' ? '↑' : '↓'}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango de precio: ${filters.priceRange.min} - ${filters.priceRange.max}
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={filters.priceRange.min}
                      onChange={(e) => onFilterChange('priceRange', {
                        ...filters.priceRange,
                        min: Math.max(0, Number.parseInt(e.target.value) || 0)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="Mínimo"
                      aria-label="Precio mínimo"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={filters.priceRange.max}
                      onChange={(e) => onFilterChange('priceRange', {
                        ...filters.priceRange,
                        max: Math.max(0, Number.parseInt(e.target.value) || 0)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="Máximo"
                      aria-label="Precio máximo"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rango de stock: {filters.stockRange.min} - {filters.stockRange.max}
                </label>
                <div className="flex space-x-3">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={filters.stockRange.min}
                      onChange={(e) => onFilterChange('stockRange', {
                        ...filters.stockRange,
                        min: Math.max(0, Number.parseInt(e.target.value) || 0)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="Mínimo"
                      aria-label="Stock mínimo"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      min="0"
                      value={filters.stockRange.max}
                      onChange={(e) => onFilterChange('stockRange', {
                        ...filters.stockRange,
                        max: Math.max(0, Number.parseInt(e.target.value) || 0)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
                      placeholder="Máximo"
                      aria-label="Stock máximo"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!showAdvanced && (
        <div className="flex flex-wrap gap-2">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange('category', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
            disabled={loading}
          >
            <option value="all">Todas categorías</option>
            {availableCategories.slice(0, 5).map((category, index) => (
              <option key={`category-basic-${category}`} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-200"
          >
            <option value="name">Ordenar por</option>
            <option value="price">Precio</option>
            <option value="stock">Stock</option>
            <option value="rating">Calificación</option>
          </select>
        </div>
      )}
    </motion.div>
  );
});

AdvancedFilters.displayName = 'AdvancedFilters';

// ✅ MEJORA: Componente de Batch Actions optimizado
const BatchActions = React.memo(({
  selectedCount,
  onSelectAll,
  onClearSelection,
  onDeleteMultiple,
  onExport
}) => {
  const [showActions, setShowActions] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 md:p-5 mb-6"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="mb-3 md:mb-0">
          <div className="flex items-center mb-2">
            <div className="p-1.5 bg-blue-600 rounded-lg mr-3">
              <Check className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-blue-900">
              {selectedCount} producto{selectedCount > 1 ? 's' : ''} seleccionado{selectedCount > 1 ? 's' : ''}
            </span>
          </div>
          <div className="text-sm text-blue-700">
            <button
              onClick={onSelectAll}
              className="hover:text-blue-900 mr-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            >
              Seleccionar todos
            </button>
            <button
              onClick={onClearSelection}
              className="hover:text-blue-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
            >
              Limpiar selección
            </button>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowActions(!showActions)}
            className="px-4 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-expanded={showActions}
            aria-haspopup="true"
          >
            <MoreVertical className="w-4 h-4 mr-2" />
            Acciones
          </button>

          <AnimatePresence>
            {showActions && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10"
                role="menu"
              >
                <button
                  onClick={() => {
                    onExport();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 flex items-center focus:outline-none focus:bg-gray-100"
                  role="menuitem"
                >
                  <Download className="w-4 h-4 mr-2 text-gray-500" />
                  Exportar seleccionados
                </button>
                <button
                  onClick={() => {
                    onDeleteMultiple();
                    setShowActions(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center focus:outline-none focus:bg-red-50"
                  role="menuitem"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar seleccionados
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
});

BatchActions.displayName = 'BatchActions';

// ✅ MEJORA: Componente de Metric Card para estadísticas
const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend
}) => {
  const colorConfig = {
    blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', valueColor: 'text-blue-600' },
    green: { bg: 'bg-green-50', iconBg: 'bg-green-100', iconColor: 'text-green-600', valueColor: 'text-green-600' },
    purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconColor: 'text-purple-600', valueColor: 'text-purple-600' },
    orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', valueColor: 'text-orange-600' }
  };

  const { bg, iconBg, iconColor, valueColor } = colorConfig[color] || colorConfig.blue;

  return (
    <div className={`${bg} rounded-xl p-5 transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 ${iconBg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {trend > 0 ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <h3 className={`text-2xl font-bold ${valueColor} mb-1`}>{value}</h3>
      <p className="text-gray-600 text-sm">{title}</p>
      {subtitle && (
        <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
      )}
    </div>
  );
};

// ✅ Componente principal optimizado
const Products = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('grid');
  const [refreshing, setRefreshing] = useState(false);

  const {
    products,
    loading,
    error,
    pagination,
    selectedProducts,
    fetchProducts,
    deleteProduct,
    deleteMultiple,
    toggleProductSelection,
    selectAll,
    clearSelection
  } = useProducts();

  const {
    filters,
    availableCategories,
    updateFilter,
    resetFilters,
    fetchFilterOptions,
    applyFilters,
    loadingOptions
  } = useProductFilters();

  // ✅ MEJORA: Cargar datos iniciales con manejo de errores
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchProducts(),
          fetchFilterOptions()
        ]);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadData();
  }, [fetchProducts, fetchFilterOptions]);

  // ✅ MEJORA: Filtrar productos con memo
  const filteredProducts = useMemo(() => {
    return applyFilters(products);
  }, [products, applyFilters]);

  // ✅ MEJORA: Manejar eliminación con confirmación
  const handleDelete = useCallback(async (id) => {
    if (!globalThis.confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await deleteProduct(id);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }, [deleteProduct]);

  // ✅ MEJORA: Manejar eliminación múltiple con confirmación
  const handleDeleteMultiple = useCallback(async () => {
    if (selectedProducts.size === 0) {
      toast.error('No hay productos seleccionados');
      return;
    }

    if (!globalThis.confirm(`¿Estás seguro de eliminar ${selectedProducts.size} productos? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteMultiple(selectedProducts);
    } catch (error) {
      console.error('Error deleting multiple products:', error);
    }
  }, [selectedProducts, deleteMultiple]);

  // ✅ MEJORA: Exportar productos optimizado
  const handleExport = useCallback(async () => {
    try {
      setRefreshing(true);
      const ids = selectedProducts.size > 0 ? Array.from(selectedProducts) : products.map(p => p.id);

      if (ids.length === 0) {
        toast.error('No hay productos para exportar');
        return;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/products/export`, {
        method: 'POST',
        headers: API_CONFIG.getAuthHeader(),
        body: JSON.stringify({
          ids,
          format: 'csv',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error('Error al exportar productos');
      }

      const blob = await response.blob();
      const url = globalThis.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `productos_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      setTimeout(() => {
        globalThis.URL.revokeObjectURL(url);
        a.remove();
      }, 100);

      toast.success('Exportación completada');
    } catch (error) {
      console.error('Error exporting products:', error);
      toast.error('Error al exportar productos');
    } finally {
      setRefreshing(false);
    }
  }, [selectedProducts, products]);

  // ✅ MEJORA: Estadísticas calculadas con memo
  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, p) => {
      const price = Number(p.price) || 0;
      const stock = Number(p.stock) || 0;
      return sum + (price * stock);
    }, 0);

    const totalSold = products.reduce((sum, p) => sum + (Number(p.sales) || 0), 0);
    const avgRating = products.length > 0
      ? products.reduce((sum, p) => sum + (Number(p.rating) || 0), 0) / products.length
      : 0;
    const lowStock = products.filter(p => {
      const stock = Number(p.stock) || 0;
      const minStock = Number(p.minStock) || 0;
      return stock <= minStock;
    }).length;

    return {
      totalValue,
      totalSold,
      avgRating: Number(avgRating.toFixed(1)),
      lowStock,
      totalProducts: products.length
    };
  }, [products]);

  // ✅ MEJORA: Función para refrescar datos
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchProducts({ forceRefresh: true }),
        fetchFilterOptions()
      ]);
      toast.success('Datos actualizados');
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchProducts, fetchFilterOptions]);

  // ✅ MEJORA: Render loading mejorado
  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <Package className="w-8 h-8 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Cargando productos</h3>
          <p className="text-gray-600">Estamos preparando tu catálogo...</p>
        </div>
      </div>
    );
  }

  // ✅ CORRECCIÓN: Separar el contenido condicional del return principal
  const renderContent = () => {
    if (filteredProducts.length === 0) {
      const hasFilters = filters.search || filters.category !== 'all' || filters.status !== 'all';

      return (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="bg-white rounded-xl shadow-sm p-8 md:p-12 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="p-4 bg-gray-100 rounded-full inline-flex mb-6">
              <Package className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {hasFilters
                ? 'No se encontraron productos'
                : 'No hay productos disponibles'}
            </h3>
            <p className="text-gray-600 mb-8">
              {filters.search
                ? 'No hay productos que coincidan con tu búsqueda. Intenta con otros términos.'
                : 'Comienza agregando tu primer producto a tu catálogo.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {hasFilters ? (
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Limpiar filtros
                </button>
              ) : (
                <button
                  onClick={() => navigate('/products/new')}
                  className="px-6 py-2.5 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-colors duration-200 font-medium"
                >
                  Agregar primer producto
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              >
                Actualizar lista
              </button>
            </div>
          </div>
        </motion.div>
      );
    }

    if (viewMode === "grid") {
      return (
        <motion.div
          key="grid"
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              isSelected={selectedProducts.has(product.id)}
              onSelect={toggleProductSelection}
              onEdit={() => navigate(`/products/${product.id}/edit`)}
              onDelete={() => handleDelete(product.id)}
              onView={() => navigate(`/products/${product.id}`)}
            />
          ))}
        </motion.div>
      );
    } else {
      return (
        <motion.div
          key="list"
          layout
          className="bg-white rounded-xl shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={
                        selectedProducts.size === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onChange={
                        selectedProducts.size === filteredProducts.length
                          ? clearSelection
                          : selectAll
                      }
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-1"
                      aria-label={
                        selectedProducts.size === filteredProducts.length
                          ? "Deseleccionar todos"
                          : "Seleccionar todos"
                      }
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Precio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stock = Number(product.stock) || 0;
                  const minStock = Number(product.minStock) || 0;
                  const stockStatus =
                    stock <= minStock * 0.5
                      ? "critical"
                      : stock <= minStock
                        ? "warning"
                        : "normal";

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-offset-1"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {product.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {product.category || "Sin categoría"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Intl.NumberFormat("es-MX", {
                            style: "currency",
                            currency: "MXN",
                          }).format(product.price || 0)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          let statusClass = "text-gray-900";

                          if (stockStatus === "critical") {
                            statusClass = "text-red-600";
                          } else if (stockStatus === "warning") {
                            statusClass = "text-yellow-600";
                          }

                          return (
                            <div className={`text-sm font-medium ${statusClass}`}>
                              {stock}
                            </div>
                          );
                        })()}
                      </td>


                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="ml-1 text-sm text-gray-600">
                            {product.rating || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {product.sales || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${(() => {
                            if (product.status === "active") return "bg-green-100 text-green-800";
                            if (product.status === "inactive") return "bg-gray-100 text-gray-800";
                            return "bg-yellow-100 text-yellow-800";
                          })()
                            }`}
                        >
                          {(() => {
                            if (product.status === "active") return "Activo";
                            if (product.status === "inactive") return "Inactivo";
                            return "Borrador";
                          })()}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link
                            to={`/products/${product.id}`}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200 p-1 rounded hover:bg-blue-50"
                            title="Ver detalles"
                            aria-label={`Ver detalles de ${product.name}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() =>
                              navigate(`/products/${product.id}/edit`)
                            }
                            className="text-green-600 hover:text-green-900 transition-colors duration-200 p-1 rounded hover:bg-green-50"
                            title="Editar"
                            aria-label={`Editar ${product.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded hover:bg-red-50"
                            title="Eliminar"
                            aria-label={`Eliminar ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
        {/* ✅ MEJORA: Header con acciones y estadísticas */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-linear-to-r from-blue-600 to-indigo-600 rounded-xl">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Productos</h1>
                <p className="text-gray-600 mt-1">
                  Gestiona tu catálogo de productos ({products.length} total)
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                aria-label="Vista de cuadrícula"
                title="Vista de cuadrícula"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${viewMode === 'list'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                aria-label="Vista de lista"
                title="Vista de lista"
              >
                <List className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 flex items-center font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>

            <button
              onClick={() => navigate('/products/new')}
              className="px-4 py-2.5 bg-linear-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 transition-all duration-200 flex items-center font-medium shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Producto
            </button>
          </div>
        </div>

        {/* ✅ MEJORA: Estadísticas con animaciones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatsCard
            title="Total productos"
            value={stats.totalProducts}
            subtitle="En catálogo"
            icon={Package}
            color="blue"
            trend={5.2}
          />
          <StatsCard
            title="Valor inventario"
            value={new Intl.NumberFormat('es-MX', {
              style: 'currency',
              currency: 'MXN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(stats.totalValue)}
            subtitle="Valor total"
            icon={DollarSign}
            color="green"
            trend={12.5}
          />
          <StatsCard
            title="Ventas totales"
            value={stats.totalSold}
            subtitle="Unidades vendidas"
            icon={ShoppingCart}
            color="purple"
            trend={8.3}
          />
          <StatsCard
            title="Stock bajo"
            value={stats.lowStock}
            subtitle="Necesitan atención"
            icon={AlertCircle}
            color="orange"
            trend={-2.1}
          />
        </motion.div>

        {/* ✅ MEJORA: Filtros con indicador de carga */}
        <AdvancedFilters
          filters={filters}
          availableCategories={availableCategories}
          onFilterChange={updateFilter}
          onReset={resetFilters}
          loading={loadingOptions}
        />

        {/* ✅ MEJORA: Acciones por lotes */}
        <BatchActions
          selectedCount={selectedProducts.size}
          onSelectAll={selectAll}
          onClearSelection={clearSelection}
          onDeleteMultiple={handleDeleteMultiple}
          onExport={handleExport}
        />

        {/* ✅ MEJORA: Estado de error */}
        {error && !loading && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"
          >
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error al cargar productos</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => globalThis.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Reintentar
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Volver al inicio
              </button>
            </div>
          </motion.div>
        )}

        {/* ✅ MEJORA: Lista de productos con estados vacíos */}
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>

        {/* ✅ MEJORA: Paginación mejorada */}
        {filteredProducts.length > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 py-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Mostrando <span className="font-medium">{filteredProducts.length}</span> de{' '}
              <span className="font-medium">{products.length}</span> productos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchProducts({ page: Math.max(1, pagination.page - 1) })}
                disabled={pagination.page === 1 || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Anterior
              </button>
              <div className="flex items-center space-x-1">
                <span className="px-3 py-2 text-sm text-gray-600">
                  Página <span className="font-medium">{pagination.page}</span> de{' '}
                  <span className="font-medium">{pagination.totalPages || 1}</span>
                </span>
              </div>
              <button
                onClick={() => fetchProducts({ page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages || loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;