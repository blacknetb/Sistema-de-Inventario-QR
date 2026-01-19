import React from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductFilter = ({ filters, onFilterChange, onResetFilters }) => {
  const categories = [
    'Todos', 'Electrónica', 'Accesorios', 'Oficina', 
    'Almacenamiento', 'Redes', 'Mobiliario', 'Herramientas', 'Consumibles'
  ];

  const suppliers = [
    'Todos', 'Dell Technologies', 'Logitech Inc', 'Samsung Electronics',
    'Razer Inc', 'HP Inc', 'Apple', 'Microsoft', 'Anker', 'Western Digital'
  ];

  const statuses = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'active', label: 'Activo', color: '#2ecc71' },
    { value: 'inactive', label: 'Inactivo', color: '#95a5a6' },
    { value: 'draft', label: 'Borrador', color: '#3498db' }
  ];

  const stockStatuses = [
    { value: 'all', label: 'Todos los stocks' },
    { value: 'in-stock', label: 'En stock', color: '#2ecc71' },
    { value: 'low-stock', label: 'Bajo stock', color: '#f39c12' },
    { value: 'out-of-stock', label: 'Agotado', color: '#e74c3c' }
  ];

  const priceRanges = [
    { label: 'Todos los precios', min: 0, max: 10000 },
    { label: 'Económico ($0 - $100)', min: 0, max: 100 },
    { label: 'Medio ($100 - $500)', min: 100, max: 500 },
    { label: 'Premium ($500 - $2000)', min: 500, max: 2000 },
    { label: 'Lujo (+$2000)', min: 2000, max: 10000 }
  ];

  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  const handlePriceRangeSelect = (range) => {
    onFilterChange({
      ...filters,
      priceRange: [range.min, range.max]
    });
  };

  const handleStockRangeSelect = (range) => {
    onFilterChange({
      ...filters,
      stockRange: [range.min, range.max]
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="product-filter">
      <div className="filter-header">
        <h3>Filtros</h3>
        <button className="reset-btn" onClick={onResetFilters}>
          🔄 Limpiar
        </button>
      </div>

      <div className="filter-section">
        <h4>Búsqueda</h4>
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      <div className="filter-section">
        <h4>Categoría</h4>
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${filters.category === category.toLowerCase() || (category === 'Todos' && filters.category === 'all') ? 'active' : ''}`}
              onClick={() => handleFilterChange('category', category === 'Todos' ? 'all' : category.toLowerCase())}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Estado del Producto</h4>
        <div className="status-filters">
          {statuses.map(status => (
            <button
              key={status.value}
              className={`status-btn ${filters.status === status.value ? 'active' : ''}`}
              onClick={() => handleFilterChange('status', status.value)}
              style={status.color ? { '--status-color': status.color } : {}}
            >
              <span className="status-dot"></span>
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Estado del Stock</h4>
        <div className="stock-status-filters">
          {stockStatuses.map(status => (
            <button
              key={status.value}
              className={`stock-status-btn ${filters.stockStatus === status.value ? 'active' : ''}`}
              onClick={() => handleFilterChange('stockStatus', status.value)}
              style={status.color ? { '--status-color': status.color } : {}}
            >
              <span className="status-dot"></span>
              {status.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <h4>Proveedor</h4>
        <select
          className="supplier-select"
          value={filters.supplier}
          onChange={(e) => handleFilterChange('supplier', e.target.value)}
        >
          {suppliers.map(supplier => (
            <option key={supplier} value={supplier === 'Todos' ? 'all' : supplier}>
              {supplier}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <h4>Rango de Precio</h4>
        <div className="price-range">
          <div className="range-values">
            <span>{formatCurrency(filters.priceRange[0])}</span>
            <span>{formatCurrency(filters.priceRange[1])}</span>
          </div>
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={filters.priceRange[0]}
            onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
            className="range-slider"
          />
          <input
            type="range"
            min="0"
            max="10000"
            step="100"
            value={filters.priceRange[1]}
            onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
            className="range-slider"
          />
          <div className="range-options">
            {priceRanges.map((range, index) => (
              <button
                key={index}
                className="range-option"
                onClick={() => handlePriceRangeSelect(range)}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4>Rango de Stock</h4>
        <div className="stock-range">
          <div className="range-values">
            <span>{filters.stockRange[0]} unidades</span>
            <span>{filters.stockRange[1]} unidades</span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={filters.stockRange[0]}
            onChange={(e) => handleFilterChange('stockRange', [parseInt(e.target.value), filters.stockRange[1]])}
            className="range-slider"
          />
          <input
            type="range"
            min="0"
            max="1000"
            step="10"
            value={filters.stockRange[1]}
            onChange={(e) => handleFilterChange('stockRange', [filters.stockRange[0], parseInt(e.target.value)])}
            className="range-slider"
          />
          <div className="range-options">
            <button className="range-option" onClick={() => handleStockRangeSelect({ min: 0, max: 10 })}>
              Muy bajo (0-10)
            </button>
            <button className="range-option" onClick={() => handleStockRangeSelect({ min: 10, max: 50 })}>
              Bajo (10-50)
            </button>
            <button className="range-option" onClick={() => handleStockRangeSelect({ min: 50, max: 200 })}>
              Medio (50-200)
            </button>
            <button className="range-option" onClick={() => handleStockRangeSelect({ min: 200, max: 1000 })}>
              Alto (200+)
            </button>
          </div>
        </div>
      </div>

      <div className="filter-section">
        <h4>Rango de Fechas</h4>
        <div className="date-range">
          <div className="date-input-group">
            <label>Desde:</label>
            <input
              type="date"
              value={filters.dateRange[0]}
              onChange={(e) => handleFilterChange('dateRange', [e.target.value, filters.dateRange[1]])}
              className="date-input"
            />
          </div>
          <div className="date-input-group">
            <label>Hasta:</label>
            <input
              type="date"
              value={filters.dateRange[1]}
              onChange={(e) => handleFilterChange('dateRange', [filters.dateRange[0], e.target.value])}
              className="date-input"
            />
          </div>
        </div>
      </div>

      <div className="filter-stats">
        <div className="stat-item">
          <span className="stat-label">Filtros activos:</span>
          <span className="stat-value">
            {Object.entries(filters).filter(([key, value]) => {
              if (key === 'priceRange') return value[0] > 0 || value[1] < 10000;
              if (key === 'stockRange') return value[0] > 0 || value[1] < 1000;
              if (key === 'dateRange') return value[0] || value[1];
              return value && value !== 'all';
            }).length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;