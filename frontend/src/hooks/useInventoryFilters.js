import { useState, useMemo, useCallback } from 'react';

/**
 * Hook para filtrar y ordenar items del inventario
 * @param {Array} items - Array de items del inventario
 * @returns {Object} Funciones y estado para filtrado
 */
const useInventoryFilters = (items = []) => {
  // Estado de filtros
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    minQuantity: '',
    maxQuantity: '',
    supplier: 'all',
    location: 'all'
  });

  // Estado de ordenamiento
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');

  // Estado de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener valores únicos para selects de filtro
  const filterOptions = useMemo(() => {
    const categories = ['all', ...new Set(items.map(item => item.category).filter(Boolean))];
    const statuses = ['all', ...new Set(items.map(item => item.status).filter(Boolean))];
    const suppliers = ['all', ...new Set(items.map(item => item.supplier).filter(Boolean))];
    const locations = ['all', ...new Set(items.map(item => item.location).filter(Boolean))];

    return {
      categories,
      statuses,
      suppliers,
      locations,
      priceRange: {
        min: Math.min(...items.map(item => item.price).filter(price => price > 0)),
        max: Math.max(...items.map(item => item.price))
      },
      quantityRange: {
        min: Math.min(...items.map(item => item.quantity)),
        max: Math.max(...items.map(item => item.quantity))
      }
    };
  }, [items]);

  // Aplicar filtros
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Filtro por categoría
      if (filters.category !== 'all' && item.category !== filters.category) {
        return false;
      }

      // Filtro por estado
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // Filtro por precio
      if (filters.minPrice && item.price < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && item.price > parseFloat(filters.maxPrice)) {
        return false;
      }

      // Filtro por cantidad
      if (filters.minQuantity && item.quantity < parseInt(filters.minQuantity)) {
        return false;
      }
      if (filters.maxQuantity && item.quantity > parseInt(filters.maxQuantity)) {
        return false;
      }

      // Filtro por proveedor
      if (filters.supplier !== 'all' && item.supplier !== filters.supplier) {
        return false;
      }

      // Filtro por ubicación
      if (filters.location !== 'all' && item.location !== filters.location) {
        return false;
      }

      // Búsqueda global
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const searchFields = ['name', 'description', 'sku', 'barcode', 'category'];
        
        const matches = searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(term);
        });
        
        if (!matches) return false;
      }

      return true;
    });
  }, [items, filters, searchTerm]);

  // Aplicar ordenamiento
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let valueA, valueB;

      switch(sortBy) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'category':
          valueA = a.category.toLowerCase();
          valueB = b.category.toLowerCase();
          break;
        case 'price':
          valueA = a.price;
          valueB = b.price;
          break;
        case 'quantity':
          valueA = a.quantity;
          valueB = b.quantity;
          break;
        case 'value':
          valueA = a.price * a.quantity;
          valueB = b.price * b.quantity;
          break;
        case 'lastUpdated':
          valueA = new Date(a.lastUpdated);
          valueB = new Date(b.lastUpdated);
          break;
        case 'status':
          // Ordenar por prioridad de estado
          const statusOrder = { 'Agotado': 0, 'Bajo Stock': 1, 'Disponible': 2 };
          valueA = statusOrder[a.status] || 3;
          valueB = statusOrder[b.status] || 3;
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });
  }, [filteredItems, sortBy, sortDirection]);

  // Actualizar filtro individual
  const updateFilter = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  }, []);

  // Actualizar múltiples filtros
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Resetear todos los filtros
  const resetFilters = useCallback(() => {
    setFilters({
      category: 'all',
      status: 'all',
      minPrice: '',
      maxPrice: '',
      minQuantity: '',
      maxQuantity: '',
      supplier: 'all',
      location: 'all'
    });
    setSearchTerm('');
  }, []);

  // Cambiar ordenamiento
  const handleSort = useCallback((field) => {
    if (sortBy === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  }, [sortBy]);

  // Obtener estadísticas de filtro actual
  const filterStats = useMemo(() => {
    const totalItems = items.length;
    const filteredCount = filteredItems.length;
    
    const categories = {};
    const statuses = {};
    
    filteredItems.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
      statuses[item.status] = (statuses[item.status] || 0) + 1;
    });

    const totalValue = filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const averagePrice = filteredCount > 0 
      ? filteredItems.reduce((sum, item) => sum + item.price, 0) / filteredCount 
      : 0;

    return {
      totalItems,
      filteredCount,
      categories,
      statuses,
      totalValue,
      averagePrice: parseFloat(averagePrice.toFixed(2)),
      filterPercentage: totalItems > 0 ? ((filteredCount / totalItems) * 100).toFixed(1) : 0
    };
  }, [items, filteredItems]);

  // Filtrar por rango de fechas
  const filterByDateRange = useCallback((startDate, endDate) => {
    if (!startDate || !endDate) return items;
    
    return items.filter(item => {
      const itemDate = new Date(item.lastUpdated || item.createdAt);
      return itemDate >= new Date(startDate) && itemDate <= new Date(endDate);
    });
  }, [items]);

  // Filtrar items que necesitan atención
  const getItemsNeedingAttention = useCallback((threshold = 5) => {
    return items.filter(item => 
      item.quantity === 0 || 
      item.quantity <= threshold || 
      item.status === 'Bajo Stock' || 
      item.status === 'Agotado'
    );
  }, [items]);

  // Agrupar items por categoría
  const groupByCategory = useCallback(() => {
    const groups = {};
    
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = {
          items: [],
          totalQuantity: 0,
          totalValue: 0
        };
      }
      
      groups[item.category].items.push(item);
      groups[item.category].totalQuantity += item.quantity;
      groups[item.category].totalValue += item.price * item.quantity;
    });

    return groups;
  }, [filteredItems]);

  // Exportar configuración de filtros
  const exportFilterConfig = useCallback(() => {
    return {
      filters,
      sortBy,
      sortDirection,
      searchTerm,
      appliedAt: new Date().toISOString(),
      itemCount: filteredItems.length
    };
  }, [filters, sortBy, sortDirection, searchTerm, filteredItems.length]);

  // Importar configuración de filtros
  const importFilterConfig = useCallback((config) => {
    if (config.filters) setFilters(config.filters);
    if (config.sortBy) setSortBy(config.sortBy);
    if (config.sortDirection) setSortDirection(config.sortDirection);
    if (config.searchTerm) setSearchTerm(config.searchTerm);
    
    return { success: true };
  }, []);

  return {
    // Estado
    filters,
    sortBy,
    sortDirection,
    searchTerm,
    
    // Setters
    setFilters,
    setSortBy,
    setSortDirection,
    setSearchTerm,
    updateFilter,
    updateFilters,
    resetFilters,
    handleSort,
    
    // Items procesados
    filteredItems,
    sortedItems,
    
    // Opciones de filtro
    filterOptions,
    
    // Estadísticas
    filterStats,
    
    // Funciones avanzadas
    filterByDateRange,
    getItemsNeedingAttention,
    groupByCategory,
    
    // Import/Export de configuración
    exportFilterConfig,
    importFilterConfig,
    
    // Información útil
    isFiltered: filteredItems.length !== items.length,
    hasFilters: Object.values(filters).some(value => 
      value !== 'all' && value !== ''
    ) || searchTerm !== ''
  };
};

export default useInventoryFilters;