import React, { useState } from 'react';
import '../../assets/styles/Reports/reports.css';

const ReportFilters = ({ filters, onFilterChange, onReset, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const dateRanges = [
    { id: 'today', label: 'Hoy' },
    { id: 'yesterday', label: 'Ayer' },
    { id: 'last7days', label: 'Últimos 7 días' },
    { id: 'last30days', label: 'Últimos 30 días' },
    { id: 'last90days', label: 'Últimos 90 días' },
    { id: 'thisMonth', label: 'Este mes' },
    { id: 'lastMonth', label: 'Mes anterior' },
    { id: 'thisQuarter', label: 'Este trimestre' },
    { id: 'lastQuarter', label: 'Trimestre anterior' },
    { id: 'thisYear', label: 'Este año' },
    { id: 'custom', label: 'Personalizado' }
  ];

  const categories = [
    'Electrónica',
    'Accesorios',
    'Oficina',
    'Almacenamiento',
    'Redes',
    'Muebles',
    'Herramientas',
    'Software'
  ];

  const sortOptions = [
    { id: 'name', label: 'Nombre' },
    { id: 'category', label: 'Categoría' },
    { id: 'quantity', label: 'Cantidad' },
    { id: 'price', label: 'Precio' },
    { id: 'totalValue', label: 'Valor Total' },
    { id: 'lastUpdated', label: 'Última Actualización' }
  ];

  const handleDateRangeChange = (rangeId) => {
    onFilterChange({ dateRange: rangeId });
    
    if (rangeId !== 'custom') {
      const dates = calculateDateRange(rangeId);
      onFilterChange({
        startDate: dates.startDate,
        endDate: dates.endDate
      });
    }
  };

  const calculateDateRange = (rangeId) => {
    const today = new Date();
    const startDate = new Date();
    
    switch (rangeId) {
      case 'today':
        startDate.setDate(today.getDate());
        break;
      case 'yesterday':
        startDate.setDate(today.getDate() - 1);
        break;
      case 'last7days':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'last30days':
        startDate.setDate(today.getDate() - 30);
        break;
      case 'last90days':
        startDate.setDate(today.getDate() - 90);
        break;
      case 'thisMonth':
        startDate.setDate(1);
        break;
      case 'lastMonth':
        startDate.setMonth(today.getMonth() - 1, 1);
        break;
      case 'thisQuarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        break;
      case 'lastQuarter':
        const lastQuarter = Math.floor(today.getMonth() / 3) - 1;
        startDate.setMonth(lastQuarter * 3, 1);
        break;
      case 'thisYear':
        startDate.setMonth(0, 1);
        break;
      default:
        return {
          startDate: '',
          endDate: today.toISOString().split('T')[0]
        };
    }
    
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0]
    };
  };

  const handleCategoryToggle = (category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    onFilterChange({ categories: newCategories });
  };

  const handleSelectAllCategories = () => {
    onFilterChange({ categories: [...categories] });
  };

  const handleClearCategories = () => {
    onFilterChange({ categories: [] });
  };

  const handleStockRangeChange = (min, max) => {
    onFilterChange({
      minStock: parseInt(min) || 0,
      maxStock: parseInt(max) || 1000
    });
  };

  const handleSortChange = (field, order) => {
    onFilterChange({
      sortBy: field,
      sortOrder: order
    });
  };

  return (
    <div className={`report-filters ${isExpanded ? 'expanded' : ''}`}>
      <div className="filters-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="header-left">
          <h3>
            <span className="filter-icon">⚙️</span>
            Filtros de Reporte
          </h3>
          <span className="filter-count">
            {filters.categories.length > 0 && `Categorías: ${filters.categories.length} `}
            {filters.dateRange !== 'last30days' && `Período: ${dateRanges.find(r => r.id === filters.dateRange)?.label}`}
          </span>
        </div>
        <div className="header-right">
          <button 
            className="btn-toggle-filters"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="filters-content">
          <div className="filters-grid">
            <div className="filter-group">
              <h4>📅 Período de Tiempo</h4>
              <div className="date-range-selector">
                <div className="range-buttons">
                  {dateRanges.map(range => (
                    <button
                      key={range.id}
                      className={`range-btn ${filters.dateRange === range.id ? 'active' : ''}`}
                      onClick={() => handleDateRangeChange(range.id)}
                      disabled={isLoading}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
                
                {filters.dateRange === 'custom' && (
                  <div className="custom-dates">
                    <div className="date-input">
                      <label>Desde:</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => onFilterChange({ startDate: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="date-input">
                      <label>Hasta:</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => onFilterChange({ endDate: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="filter-group">
              <h4>🏷️ Categorías</h4>
              <div className="category-selector">
                <div className="category-actions">
                  <button 
                    className="btn-category-action"
                    onClick={handleSelectAllCategories}
                    disabled={isLoading}
                  >
                    Seleccionar Todas
                  </button>
                  <button 
                    className="btn-category-action"
                    onClick={handleClearCategories}
                    disabled={isLoading}
                  >
                    Limpiar Todas
                  </button>
                </div>
                
                <div className="category-checkboxes">
                  {categories.map(category => (
                    <label key={category} className="category-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        disabled={isLoading}
                      />
                      <span className="checkbox-label">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="filter-group">
              <h4>📊 Rango de Stock</h4>
              <div className="stock-range-selector">
                <div className="range-inputs">
                  <div className="range-input">
                    <label>Mínimo:</label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={filters.minStock}
                      onChange={(e) => handleStockRangeChange(e.target.value, filters.maxStock)}
                      disabled={isLoading}
                    />
                  </div>
                  <div className="range-input">
                    <label>Máximo:</label>
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={filters.maxStock}
                      onChange={(e) => handleStockRangeChange(filters.minStock, e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="range-slider">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minStock}
                    onChange={(e) => handleStockRangeChange(e.target.value, filters.maxStock)}
                    disabled={isLoading}
                    className="slider-min"
                  />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.maxStock}
                    onChange={(e) => handleStockRangeChange(filters.minStock, e.target.value)}
                    disabled={isLoading}
                    className="slider-max"
                  />
                </div>
              </div>
            </div>

            <div className="filter-group">
              <h4>🔠 Ordenamiento</h4>
              <div className="sort-selector">
                <div className="sort-field">
                  <label>Ordenar por:</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleSortChange(e.target.value, filters.sortOrder)}
                    disabled={isLoading}
                  >
                    {sortOptions.map(option => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="sort-order">
                  <label>Dirección:</label>
                  <div className="order-buttons">
                    <button
                      className={`order-btn ${filters.sortOrder === 'asc' ? 'active' : ''}`}
                      onClick={() => handleSortChange(filters.sortBy, 'asc')}
                      disabled={isLoading}
                    >
                      Ascendente (A-Z)
                    </button>
                    <button
                      className={`order-btn ${filters.sortOrder === 'desc' ? 'active' : ''}`}
                      onClick={() => handleSortChange(filters.sortBy, 'desc')}
                      disabled={isLoading}
                    >
                      Descendente (Z-A)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="filters-actions">
            <button 
              className="btn-apply-filters"
              onClick={() => setIsExpanded(false)}
              disabled={isLoading}
            >
              Aplicar Filtros
            </button>
            
            <button 
              className="btn-reset-filters"
              onClick={onReset}
              disabled={isLoading}
            >
              Restablecer Todo
            </button>
            
            <button 
              className="btn-save-filters"
              onClick={() => alert('Función de guardar filtros en desarrollo')}
              disabled={isLoading}
            >
              Guardar Preset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportFilters;