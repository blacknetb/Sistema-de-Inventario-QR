import React, { useState } from 'react';
import styles from './ReportFilters.module.css';

const ReportFilters = ({ filters, onFilterChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleDateRangeChange = (type, value) => {
    setDateRange(prev => ({ ...prev, [type]: value }));
  };

  const handleApplyDateRange = () => {
    if (dateRange.start && dateRange.end) {
      onFilterChange({ customDateRange: dateRange });
    }
  };

  const handleReset = () => {
    const defaultFilters = {
      dateRange: 'month',
      category: 'all',
      supplier: 'all',
      stockLevel: 'all'
    };
    setLocalFilters(defaultFilters);
    setDateRange({ start: '', end: '' });
    onFilterChange(defaultFilters);
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersHeader}>
        <h3>Filtros</h3>
        <button 
          className={styles.resetButton}
          onClick={handleReset}
        >
          Restablecer
        </button>
      </div>

      <div className={styles.filtersGrid}>
        <div className={styles.filterGroup}>
          <label>Período</label>
          <select
            value={localFilters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Último año</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {localFilters.dateRange === 'custom' && (
          <div className={styles.dateRangePicker}>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => handleDateRangeChange('start', e.target.value)}
              className={styles.dateInput}
            />
            <span>a</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => handleDateRangeChange('end', e.target.value)}
              className={styles.dateInput}
            />
            <button 
              className={styles.applyButton}
              onClick={handleApplyDateRange}
            >
              Aplicar
            </button>
          </div>
        )}

        <div className={styles.filterGroup}>
          <label>Categoría</label>
          <select
            value={localFilters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Todas las categorías</option>
            <option value="electronics">Electrónicos</option>
            <option value="clothing">Ropa</option>
            <option value="home">Hogar</option>
            <option value="sports">Deportes</option>
            <option value="books">Libros</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Proveedor</label>
          <select
            value={localFilters.supplier}
            onChange={(e) => handleFilterChange('supplier', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Todos los proveedores</option>
            <option value="abc">Distribuidora ABC</option>
            <option value="xyz">Proveedores XYZ</option>
            <option value="global">Importaciones Global</option>
            <option value="central">Mayorista Central</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Nivel de Stock</label>
          <select
            value={localFilters.stockLevel}
            onChange={(e) => handleFilterChange('stockLevel', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Todos los niveles</option>
            <option value="optimal">Óptimo</option>
            <option value="low">Bajo</option>
            <option value="critical">Crítico</option>
            <option value="out">Sin stock</option>
          </select>
        </div>
      </div>

      <button 
        className={styles.advancedToggle}
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▼' : '▶'} Filtros avanzados
      </button>

      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.filterGroup}>
            <label>Precio mínimo</label>
            <input
              type="number"
              placeholder="0"
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Precio máximo</label>
            <input
              type="number"
              placeholder="1000000"
              className={styles.filterInput}
            />
          </div>

          <div className={styles.filterGroup}>
            <label>Ordenar por</label>
            <select className={styles.filterSelect}>
              <option value="name">Nombre</option>
              <option value="price">Precio</option>
              <option value="stock">Stock</option>
              <option value="date">Fecha</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label>Dirección</label>
            <select className={styles.filterSelect}>
              <option value="asc">Ascendente</option>
              <option value="desc">Descendente</option>
            </select>
          </div>
        </div>
      )}

      <div className={styles.activeFilters}>
        <span className={styles.activeFiltersLabel}>Filtros activos:</span>
        {localFilters.dateRange !== 'month' && (
          <span className={styles.filterTag}>
            Período: {localFilters.dateRange}
            <button className={styles.removeTag}>×</button>
          </span>
        )}
        {localFilters.category !== 'all' && (
          <span className={styles.filterTag}>
            Categoría: {localFilters.category}
            <button className={styles.removeTag}>×</button>
          </span>
        )}
        {localFilters.supplier !== 'all' && (
          <span className={styles.filterTag}>
            Proveedor: {localFilters.supplier}
            <button className={styles.removeTag}>×</button>
          </span>
        )}
        {localFilters.stockLevel !== 'all' && (
          <span className={styles.filterTag}>
            Stock: {localFilters.stockLevel}
            <button className={styles.removeTag}>×</button>
          </span>
        )}
      </div>
    </div>
  );
};

export default ReportFilters;