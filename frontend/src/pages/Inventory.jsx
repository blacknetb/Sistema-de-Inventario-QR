import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Plus, Package, AlertTriangle,
  ArrowUpDown, Download, Upload, RefreshCw,
  Edit2, Trash2, Eye, X, Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';
import InventoryModal from '../components/inventory/InventoryModal';
import DeleteConfirmation from '../components/common/DeleteConfirmation';
import Pagination from '../components/common/Pagination';
import { useFetch } from '../hooks/useFetch';
import { useDebouncedCallback } from '../hooks/useDebounce';
import { api } from '../services/api';

const STOCK_STATUS = {
  NORMAL: 'normal',
  WARNING: 'warning',
  CRITICAL: 'critical',
  OUT_OF_STOCK: 'out_of_stock'
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados', color: 'gray' },
  { value: STOCK_STATUS.NORMAL, label: 'Stock normal', color: 'green' },
  { value: STOCK_STATUS.WARNING, label: 'Stock bajo', color: 'yellow' },
  { value: STOCK_STATUS.CRITICAL, label: 'Stock crítico', color: 'red' },
  { value: STOCK_STATUS.OUT_OF_STOCK, label: 'Sin stock', color: 'gray' }
];

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    minStock: '',
    maxStock: '',
    location: 'all'
  });
  const [sortConfig, setSortConfig] = useState({
    field: 'name',
    direction: 'asc'
  });
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const searchInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const {
    data: inventoryData = { items: [], total: 0, pages: 1 },
    loading,
    error,
    refresh: refreshInventory
  } = useFetch(
    async (params) => {
      try {
        const requestParams = {
          page: params.page || 1,
          limit: params.limit || 10,
          search: params.search || '',
          ...params.filters,
          sortBy: params.sortBy || 'name',
          sortOrder: params.sortOrder || 'asc'
        };

        Object.keys(requestParams).forEach(key => {
          if (requestParams[key] === '' || requestParams[key] === 'all') {
            delete requestParams[key];
          }
        });

        const response = await api.get('/api/inventory', {
          params: requestParams
        });

        return response.data?.data || response.data || { items: [], total: 0, pages: 1 };
      } catch (err) {
        console.error('Inventory fetch error:', err);
        throw err;
      }
    },
    {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      filters,
      sortBy: sortConfig.field,
      sortOrder: sortConfig.direction
    },
    {
      initialData: { items: [], total: 0, pages: 1 },
      cacheTime: 60000,
      retryCount: 2,
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Error al cargar inventario');
      }
    }
  );

  const {
    data: stats = {},
    loading: statsLoading,
    refresh: refreshStats
  } = useFetch(
    async () => {
      try {
        const response = await api.get('/api/inventory/stats');
        return response.data?.data || response.data || {};
      } catch (err) {
        console.error('Stats fetch error:', err);
        return {};
      }
    },
    {},
    {
      pollingInterval: 60000,
      onError: () => {
        console.warn('Error cargando estadísticas');
      }
    }
  );

  const inventoryItems = useMemo(() => {
    return inventoryData?.items || [];
  }, [inventoryData]);

  const categories = useMemo(() => {
    if (!inventoryItems.length) return ['Todos'];
    const uniqueCategories = ['Todos', ...new Set(inventoryItems
      .map(item => item.category)
      .filter(Boolean)
    )];
    return Array.from(new Set(uniqueCategories));
  }, [inventoryItems]);

  const calculatedStats = useMemo(() => {
    return {
      totalItems: inventoryData?.total || 0,
      totalValue: inventoryItems.reduce((sum, item) => {
        const stock = Number(item.stock) || 0;
        const unitValue = Number(item.unitValue) || 0;
        return sum + (stock * unitValue);
      }, 0),
      lowStock: inventoryItems.filter(item => item.stockStatus === STOCK_STATUS.WARNING).length,
      criticalStock: inventoryItems.filter(item => item.stockStatus === STOCK_STATUS.CRITICAL).length,
      outOfStock: inventoryItems.filter(item => item.stockStatus === STOCK_STATUS.OUT_OF_STOCK).length
    };
  }, [inventoryItems, inventoryData]);

  const debouncedSearch = useDebouncedCallback(
    (value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    },
    500,
    { leading: false, trailing: true }
  );

  const handleSort = useCallback((field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: 'all',
      status: 'all',
      minStock: '',
      maxStock: '',
      location: 'all'
    });
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    setCurrentPage(1);
  }, []);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedItems(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      return newSelection;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedItems.size === inventoryItems.length) {
      setSelectedItems(new Set());
    } else {
      const allIds = new Set(inventoryItems.map(item => item.id));
      setSelectedItems(allIds);
    }
  }, [inventoryItems, selectedItems.size]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refreshInventory(), refreshStats()]);
      toast.success('Inventario actualizado');
    } catch (error) {
      console.error('Refresh error:', error);
    }
  }, [refreshInventory, refreshStats]);

  const handleAddItem = useCallback(async (itemData) => {
    try {
      const formattedData = {
        name: itemData.name,
        description: itemData.description || '',
        sku: itemData.sku || `SKU-${Date.now()}`,
        category: itemData.category || 'General',
        stock: Number(itemData.stock) || 0,
        minStock: Number(itemData.minStock) || 10,
        maxStock: Number(itemData.maxStock) || 100,
        unit: itemData.unit || 'pz',
        unitValue: Number(itemData.unitValue) || 0,
        location: itemData.location || 'Almacén A',
        imageUrl: itemData.imageUrl || '',
        barcode: itemData.barcode || '',
        supplier: itemData.supplier || ''
      };

      const response = await api.post('/api/inventory', formattedData);
      await refreshInventory();
      setShowAddModal(false);
      toast.success('Producto agregado exitosamente');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al agregar producto';
      toast.error(message);
      throw new Error(message);
    }
  }, [refreshInventory]);

  const handleEditItem = useCallback(async (itemData) => {
    try {
      if (!itemData.id) {
        toast.error('ID de producto no proporcionado');
        return;
      }

      const formattedData = {
        name: itemData.name,
        description: itemData.description || '',
        sku: itemData.sku,
        category: itemData.category,
        stock: Number(itemData.stock) || 0,
        minStock: Number(itemData.minStock) || 10,
        maxStock: Number(itemData.maxStock) || 100,
        unit: itemData.unit || 'pz',
        unitValue: Number(itemData.unitValue) || 0,
        location: itemData.location || 'Almacén A',
        imageUrl: itemData.imageUrl || '',
        barcode: itemData.barcode || '',
        supplier: itemData.supplier || ''
      };

      const response = await api.put(`/api/inventory/${itemData.id}`, formattedData);
      await refreshInventory();
      setShowEditModal(false);
      setItemToEdit(null);
      toast.success('Producto actualizado exitosamente');
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || 'Error al actualizar producto';
      toast.error(message);
      throw new Error(message);
    }
  }, [refreshInventory]);

  const handleDeleteItem = useCallback(async () => {
    if (!itemToDelete?.id) {
      toast.error('Producto no seleccionado');
      return;
    }

    try {
      await api.delete(`/api/inventory/${itemToDelete.id}`);
      await refreshInventory();
      setShowDeleteModal(false);
      setItemToDelete(null);
      toast.success('Producto eliminado exitosamente');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar producto';
      toast.error(message);
    }
  }, [itemToDelete, refreshInventory]);

  const handleDeleteMultiple = useCallback(async () => {
    if (selectedItems.size === 0) {
      toast.error('No hay productos seleccionados');
      return;
    }

    try {
      await api.delete('/api/inventory/batch', {
        data: { ids: Array.from(selectedItems) }
      });
      await refreshInventory();
      setSelectedItems(new Set());
      toast.success(`${selectedItems.size} productos eliminados exitosamente`);
    } catch (error) {
      const message = error.response?.data?.message || 'Error al eliminar productos seleccionados';
      toast.error(message);
    }
  }, [selectedItems, refreshInventory]);

  const handleExport = useCallback(async () => {
    try {
      const response = await api.get('/api/inventory/export', {
        params: { format: 'csv' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventario_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Inventario exportado exitosamente');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al exportar inventario');
    }
  }, []);

  const handleImport = useCallback(async (file) => {
    if (!file) {
      toast.error('No se seleccionó ningún archivo');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/api/inventory/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await refreshInventory();
      toast.success('Inventario importado exitosamente');
    } catch (error) {
      const message = error.response?.data?.message || 'Error al importar inventario';
      toast.error(message);
    }
  }, [refreshInventory]);

  const handleFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImport(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleImport]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const formatCurrency = useCallback((amount) => {
    const numAmount = Number(amount) || 0;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  }, []);

  const getStatusColor = useCallback((status) => {
    switch (status) {
      case STOCK_STATUS.NORMAL:
        return 'bg-green-100 text-green-800 border-green-200';
      case STOCK_STATUS.WARNING:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case STOCK_STATUS.CRITICAL:
        return 'bg-red-100 text-red-800 border-red-200';
      case STOCK_STATUS.OUT_OF_STOCK:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  const getStatusIcon = useCallback((status) => {
    switch (status) {
      case STOCK_STATUS.NORMAL:
        return <Package className="w-4 h-4" />;
      case STOCK_STATUS.WARNING:
      case STOCK_STATUS.CRITICAL:
        return <AlertTriangle className="w-4 h-4" />;
      case STOCK_STATUS.OUT_OF_STOCK:
        return <X className="w-4 h-4" />;
      default:
        return null;
    }
  }, []);

  const getStatusText = useCallback((status) => {
    switch (status) {
      case STOCK_STATUS.NORMAL:
        return 'Normal';
      case STOCK_STATUS.WARNING:
        return 'Bajo';
      case STOCK_STATUS.CRITICAL:
        return 'Crítico';
      case STOCK_STATUS.OUT_OF_STOCK:
        return 'Sin stock';
      default:
        return 'Desconocido';
    }
  }, []);

  const calculateStockPercentage = useCallback((current, min, max) => {
    const currentNum = Number(current) || 0;
    const maxNum = Number(max) || 100;

    if (maxNum <= 0) return 0;

    const percentage = (currentNum / maxNum) * 100;
    return Math.min(100, Math.max(0, percentage));
  }, []);

  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  if (loading && !inventoryData?.items?.length) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          </div>
        </div>
        <LoadingSpinner message="Cargando inventario..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          </div>
        </div>
        <ErrorMessage
          title="Error al cargar el inventario"
          message={error.message || 'No se pudieron cargar los datos del inventario'}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-2">
            Valor total: {formatCurrency(calculatedStats.totalValue)}
            {!statsLoading && stats.totalValue && (
              <span className="ml-2 text-sm text-green-600">
                ({((calculatedStats.totalValue - (stats.totalValue || 0)) / (stats.totalValue || 1) * 100).toFixed(1)}% cambio)
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {selectedItems.size > 0 && (
            <button
              onClick={handleDeleteMultiple}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar ({selectedItems.size})
            </button>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </button>

          <button
            onClick={handleFileSelect}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </button>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
      >
        {statsLoading ? (
          ["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4", "skeleton-5"].map((key) => (
            <div
              key={key}
              className="bg-gray-200 animate-pulse rounded-lg h-32"
            ></div>
          ))
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-600">
                  {calculatedStats.totalItems > 0 ? `+${calculatedStats.totalItems}` : '0'}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {calculatedStats.totalItems}
              </h3>
              <p className="text-gray-600 text-sm">Productos en inventario</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-600">Normal</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {calculatedStats.totalItems - calculatedStats.lowStock - calculatedStats.criticalStock - calculatedStats.outOfStock}
              </h3>
              <p className="text-gray-600 text-sm">Productos con stock normal</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-yellow-600">Bajo</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {calculatedStats.lowStock}
              </h3>
              <p className="text-gray-600 text-sm">Productos con stock bajo</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <span className="text-sm font-medium text-red-600">Crítico</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {calculatedStats.criticalStock}
              </h3>
              <p className="text-gray-600 text-sm">Productos con stock crítico</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <X className="w-6 h-6 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">Sin stock</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-1">
                {calculatedStats.outOfStock}
              </h3>
              <p className="text-gray-600 text-sm">Productos sin stock</p>
            </div>
          </>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Filtrar inventario</h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <Filter className="w-4 h-4 mr-1" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>

          <div className="relative w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar producto, SKU o categoría..."
              defaultValue={searchTerm}
              onChange={(e) => debouncedSearch(e.target.value)}
              className="w-full md:w-64 lg:w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
            />
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
                <div>
                  <label
                    htmlFor="category"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Categoría
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={filters.category}
                    onChange={(e) => applyFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             outline-none transition-colors"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category === "Todos" ? "all" : category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="stockStatus"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Estado del stock
                  </label>
                  <select
                    id="stockStatus"
                    name="stockStatus"
                    value={filters.status}
                    onChange={(e) => applyFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             outline-none transition-colors"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="minStock"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Stock mínimo
                  </label>
                  <input
                    id="minStock"
                    name="minStock"
                    type="number"
                    min="0"
                    value={filters.minStock}
                    onChange={(e) =>
                      applyFilters({ ...filters, minStock: e.target.value })
                    }
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             outline-none transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maxStock"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Stock máximo
                  </label>
                  <input
                    id="maxStock"
                    name="maxStock"
                    type="number"
                    min="0"
                    value={filters.maxStock}
                    onChange={(e) =>
                      applyFilters({ ...filters, maxStock: e.target.value })
                    }
                    placeholder="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg 
             focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
             outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-sm text-gray-500">
                  Mostrando {inventoryItems.length} de {inventoryData?.total || 0} productos
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={clearFilters}
                    className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Limpiar filtros
                  </button>
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === inventoryItems.length && inventoryItems.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Producto
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('stock')}
                    className="flex items-center hover:text-gray-700 transition-colors"
                  >
                    Stock
                    <ArrowUpDown className="w-4 h-4 ml-1" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
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
              {inventoryItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '')
                        ? 'No se encontraron productos con los filtros aplicados'
                        : 'No hay productos en el inventario'}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || Object.values(filters).some(f => f !== 'all' && f !== '')
                        ? 'Intenta ajustar los filtros de búsqueda'
                        : 'Comienza agregando tu primer producto'}
                    </p>
                  </td>
                </tr>
              ) : (
                inventoryItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 transition-colors duration-150 ${selectedItems.has(item.id) ? 'bg-blue-50' : ''
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="shrink-0 h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-10 w-10 object-cover rounded-lg"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<Package className="h-6 w-6 text-gray-400" />';
                              }}
                            />
                          ) : (
                            <Package className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {item.description}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 font-mono">{item.sku}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {item.category || 'General'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-gray-900">
                          {item.stock || 0} {item.unit || 'pz'}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${calculateStockPercentage(item.stock, item.minStock, item.maxStock)}%`
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: {item.minStock || 10} | Max: {item.maxStock || 100}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{item.location || 'Almacén A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(item.unitValue || 0)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Total: {formatCurrency((item.stock || 0) * (item.unitValue || 0))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(item.stockStatus)}`}>
                          {getStatusIcon(item.stockStatus)}
                          <span className="ml-1">{getStatusText(item.stockStatus)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            console.log('Ver detalles:', item.id);
                          }}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToEdit(item);
                            setShowEditModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {inventoryData?.pages > 1 && (
          <div className="px-6 py-4 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, inventoryData.total)}
                </span> de{' '}
                <span className="font-medium">{inventoryData.total}</span> productos
              </div>

              <div className="flex items-center gap-4">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>

                <Pagination
                  currentPage={currentPage}
                  totalPages={inventoryData.pages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAddModal && (
          <InventoryModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddItem}
            title="Agregar Nuevo Producto"
            submitText="Agregar Producto"
            categories={categories.filter(c => c !== 'Todos')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEditModal && itemToEdit && (
          <InventoryModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setItemToEdit(null);
            }}
            onSubmit={handleEditItem}
            title="Editar Producto"
            submitText="Guardar Cambios"
            initialData={itemToEdit}
            categories={categories.filter(c => c !== 'Todos')}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDeleteModal && itemToDelete && (
          <DeleteConfirmation
            isOpen={showDeleteModal}
            onClose={() => {
              setShowDeleteModal(false);
              setItemToDelete(null);
            }}
            onConfirm={handleDeleteItem}
            title="Eliminar Producto"
            message={`¿Estás seguro de que quieres eliminar el producto "${itemToDelete.name}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

Inventory.displayName = 'Inventory';

export { Inventory };
export default Inventory;