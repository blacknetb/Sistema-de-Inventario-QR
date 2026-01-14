import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FiFilter,
  FiSearch,
  FiX,
  FiChevronDown,
  FiSliders,
  FiRefreshCw
} from 'react-icons/fi';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import PropTypes from 'prop-types';

// ✅ CORRECCIÓN: Implementación del hook useDebounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ProductFilter = ({
  filters = {},
  categories = [],
  onFilterChange,
  onSearch,
  onReset,
  loading = false,
  className = ''
}) => {
  // ✅ CORRECCIÓN: Definir handleFilterChange primero
  const handleFilterChange = useCallback((newFilters) => {
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  }, [onFilterChange]);

  // ✅ MEJORA: Estado interno con tipos específicos
  const [internalFilters, setInternalFilters] = useState({
    search: filters.search || '',
    category_id: filters.category_id || '',
    status: filters.status || '',
    stock: filters.stock || '',
    price_min: filters.price_min || '',
    price_max: filters.price_max || '',
    sort_by: filters.sort_by || 'name',
    sort_order: filters.sort_order || 'asc',
    limit: filters.limit || 10,
    showAdvanced: false
  });

  // ✅ MEJORA: Búsqueda con debounce para mejor rendimiento
  const debouncedSearch = useDebounce(internalFilters.search, 500);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      handleFilterChange({ search: debouncedSearch });
    }
  }, [debouncedSearch, filters.search, handleFilterChange]);

  // ✅ MEJORA: Sincronizar filtros externos
  useEffect(() => {
    setInternalFilters(prev => ({
      ...prev,
      ...filters,
      showAdvanced: prev.showAdvanced
    }));
  }, [filters]);

  // ✅ MEJORA: Manejo de cambios optimizado
  const handleInputChange = (field, value) => {
    setInternalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // ✅ MEJORA: Submit con validación
  const handleSubmit = (e) => {
    e?.preventDefault();

    // Validar rango de precios
    if (internalFilters.price_min && internalFilters.price_max) {
      const min = parseFloat(internalFilters.price_min);
      const max = parseFloat(internalFilters.price_max);

      if (min > max) {
        // Intercambiar valores si el mínimo es mayor al máximo
        setInternalFilters(prev => ({
          ...prev,
          price_min: internalFilters.price_max,
          price_max: internalFilters.price_min
        }));

        handleFilterChange({
          ...internalFilters,
          price_min: internalFilters.price_max,
          price_max: internalFilters.price_min
        });
        return;
      }
    }

    handleFilterChange(internalFilters);
    if (onSearch) onSearch();
  };

  // ✅ MEJORA: Reset completo
  const handleReset = () => {
    const resetFilters = {
      search: '',
      category_id: '',
      status: '',
      stock: '',
      price_min: '',
      price_max: '',
      sort_by: 'name',
      sort_order: 'asc',
      limit: 10
    };

    setInternalFilters({
      ...resetFilters,
      showAdvanced: internalFilters.showAdvanced
    });

    if (onReset) onReset();
    handleFilterChange(resetFilters);
  };

  // ✅ MEJORA: Opciones de filtro con useMemo
  const filterOptions = useMemo(() => ({
    stock: [
      { value: '', label: 'Todos los niveles de stock' },
      { value: 'low', label: 'Stock bajo (< mínimo)' },
      { value: 'out', label: 'Sin stock (= 0)' },
      { value: 'normal', label: 'Stock normal' },
      { value: 'over', label: 'Exceso de stock (> máximo)' }
    ],
    status: [
      { value: '', label: 'Todos los estados' },
      { value: 'active', label: 'Activo' },
      { value: 'inactive', label: 'Inactivo' },
      { value: 'discontinued', label: 'Descontinuado' }
    ],
    sortBy: [
      { value: 'name', label: 'Nombre' },
      { value: 'sku', label: 'SKU' },
      { value: 'price', label: 'Precio' },
      { value: 'current_stock', label: 'Stock actual' },
      { value: 'created_at', label: 'Fecha de creación' },
      { value: 'updated_at', label: 'Fecha de actualización' }
    ],
    sortOrder: [
      { value: 'asc', label: 'Ascendente' },
      { value: 'desc', label: 'Descendente' }
    ],
    limit: [
      { value: 10, label: '10 resultados' },
      { value: 25, label: '25 resultados' },
      { value: 50, label: '50 resultados' },
      { value: 100, label: '100 resultados' },
      { value: 0, label: 'Todos los resultados' }
    ]
  }), []);

  // ✅ MEJORA: Opciones de categorías formateadas
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Todas las categorías' },
    ...categories.map(category => ({
      value: category.id,
      label: category.name
    }))
  ], [categories]);

  // ✅ MEJORA: Toggle para filtros avanzados
  const toggleAdvancedFilters = () => {
    setInternalFilters(prev => ({
      ...prev,
      showAdvanced: !prev.showAdvanced
    }));
  };

  // ✅ MEJORA: Limpiar filtro específico
  const clearFilter = (field) => {
    handleInputChange(field, '');
    handleFilterChange({
      ...internalFilters,
      [field]: ''
    });
  };

  // ✅ MEJORA: Contador de filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.entries(internalFilters).filter(([key, value]) => {
      if (key === 'sort_by' || key === 'sort_order' || key === 'limit' || key === 'showAdvanced') {
        return false;
      }
      return value !== '' && value !== null && value !== undefined;
    }).length;
  }, [internalFilters]);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 ${className}`}>
      <form onSubmit={handleSubmit}>
        {/* Filtros básicos */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <div>
            <Input
              label="Buscar productos"
              placeholder="Nombre, SKU, descripción..."
              value={internalFilters.search}
              onChange={(e) => handleInputChange('search', e.target.value)}
              startIcon={<FiSearch />}
              clearable
              onClear={() => clearFilter('search')}
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Categoría */}
          <div>
            <Select
              label="Categoría"
              options={categoryOptions}
              value={internalFilters.category_id}
              onChange={(value) => handleInputChange('category_id', value)}
              clearable
              onClear={() => clearFilter('category_id')}
              disabled={loading}
            />
          </div>

          {/* Estado */}
          <div>
            <Select
              label="Estado"
              options={filterOptions.status}
              value={internalFilters.status}
              onChange={(value) => handleInputChange('status', value)}
              clearable
              onClear={() => clearFilter('status')}
              disabled={loading}
            />
          </div>

          {/* Stock */}
          <div>
            <Select
              label="Nivel de stock"
              options={filterOptions.stock}
              value={internalFilters.stock}
              onChange={(value) => handleInputChange('stock', value)}
              clearable
              onClear={() => clearFilter('stock')}
              disabled={loading}
            />
          </div>
        </div>

        {/* Filtros avanzados (toggle) */}
        {internalFilters.showAdvanced && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Rango de precios */}
              <div className="space-y-2">
                <label htmlFor="price_min" className="form-label">Rango de precios</label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="price_min"
                    type="number"
                    placeholder="Mín"
                    value={internalFilters.price_min}
                    onChange={(e) => handleInputChange('price_min', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={loading}
                    className="flex-1"
                  />
                  <span className="text-gray-500">-</span>
                  <Input
                    id="price_max"
                    type="number"
                    placeholder="Máx"
                    value={internalFilters.price_max}
                    onChange={(e) => handleInputChange('price_max', e.target.value)}
                    min="0"
                    step="0.01"
                    disabled={loading}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Ordenamiento */}
              <div className="space-y-2">
                <label htmlFor="sort_by" className="form-label">Ordenar por</label>
                <div className="flex space-x-2">
                  <Select
                    id="sort_by"
                    options={filterOptions.sortBy}
                    value={internalFilters.sort_by}
                    onChange={(value) => handleInputChange('sort_by', value)}
                    disabled={loading}
                    className="flex-1"
                  />
                  <Select
                    id="sort_order"
                    options={filterOptions.sortOrder}
                    value={internalFilters.sort_order}
                    onChange={(value) => handleInputChange('sort_order', value)}
                    disabled={loading}
                    className="w-32"
                  />
                </div>
              </div>

              {/* Resultados por página */}
              <div>
                <Select
                  label="Mostrar"
                  options={filterOptions.limit}
                  value={internalFilters.limit}
                  onChange={(value) => handleInputChange('limit', parseInt(value))}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Controles */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200 gap-4">
          {/* Contador de filtros */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center text-sm text-gray-600">
              <FiSliders className="mr-2" />
              {activeFiltersCount > 0 ? (
                <span className="font-medium">
                  {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro' : 'filtros'} activo{activeFiltersCount === 1 ? '' : 's'}
                </span>
              ) : (
                <span>Sin filtros activos</span>
              )}
            </div>

            {/* Toggle filtros avanzados */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleAdvancedFilters}
              className="flex items-center"
            >
              {internalFilters.showAdvanced ? 'Ocultar' : 'Mostrar'} avanzado
              <FiChevronDown className={`ml-1 transition-transform ${internalFilters.showAdvanced ? 'rotate-180' : ''
                }`} />
            </Button>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              startIcon={<FiX />}
              disabled={loading || activeFiltersCount === 0}
            >
              Limpiar filtros
            </Button>

            <Button
              type="submit"
              variant="primary"
              startIcon={<FiFilter />}
              loading={loading}
              disabled={loading}
              className="min-w-[140px]"
            >
              Aplicar filtros
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

// ✅ CORRECCIÓN: Componente de búsqueda rápida como componente separado
const QuickSearch = ({
  searchTerm = '',
  onSearchChange,
  onSearch,
  placeholder = 'Buscar productos...',
  className = '',
  disabled = false,
}) => {
  const [value, setValue] = useState(searchTerm);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch();
    }
  };

  const handleClear = () => {
    setValue('');
    if (onSearchChange) onSearchChange('');
  };

  useEffect(() => {
    setValue(searchTerm);
  }, [searchTerm]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <FiSearch
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
        <input
          type="text"
          className="form-input pl-10 pr-10 w-full"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (onSearchChange) onSearchChange(e.target.value);
          }}
          onKeyPress={handleKeyPress}
          disabled={disabled}
          aria-label="Buscar"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            disabled={disabled}
            aria-label="Limpiar búsqueda"
          >
            <FiX aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

// ✅ CORRECCIÓN: PropTypes
ProductFilter.propTypes = {
  filters: PropTypes.object,
  categories: PropTypes.array,
  onFilterChange: PropTypes.func,
  onSearch: PropTypes.func,
  onReset: PropTypes.func,
  loading: PropTypes.bool,
  className: PropTypes.string
};

QuickSearch.propTypes = {
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

// ✅ MEJORA: Propiedades por defecto
ProductFilter.defaultProps = {
  filters: {},
  categories: [],
  onFilterChange: () => { },
  onSearch: () => { },
  onReset: () => { },
  loading: false,
  className: ''
};

QuickSearch.defaultProps = {
  searchTerm: '',
  placeholder: "Buscar productos...",
  className: "",
  disabled: false
};

// ✅ CORRECCIÓN: Exportar ambos componentes
export default ProductFilter;
export { QuickSearch };