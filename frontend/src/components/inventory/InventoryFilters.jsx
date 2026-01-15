/**
 * InventoryFilters.js
 * Componente de filtros para el inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryFilters.js
 */

import React, { useState } from 'react';

const InventoryFilters = ({ filters, onFilterChange, onReset, data }) => {
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // Obtener opciones únicas de los datos
    const getUniqueOptions = (key) => {
        return ['all', ...new Set(data.map(item => item[key]))];
    };

    // Opciones de filtro
    const filterOptions = {
        categories: getUniqueOptions('category'),
        statuses: ['all', 'active', 'inactive', 'low_stock', 'out_of_stock'],
        suppliers: getUniqueOptions('supplier'),
        warehouses: getUniqueOptions('warehouse')
    };

    // Manejar cambio de filtro
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: value });
    };

    // Manejar cambio de rango de stock
    const handleStockRangeChange = (e) => {
        const { name, value } = e.target;
        onFilterChange({ [name]: parseInt(value) });
    };

    // Manejar filtros avanzados
    const toggleAdvancedFilters = () => {
        setIsAdvancedOpen(!isAdvancedOpen);
    };

    // Calcular estadísticas para mostrar
    const calculateStats = () => {
        const totalValue = data.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
        const lowStockItems = data.filter(item => item.currentStock < item.minStock).length;
        const outOfStockItems = data.filter(item => item.currentStock === 0).length;
        const totalItems = data.length;

        return {
            totalValue: totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            lowStockItems,
            outOfStockItems,
            totalItems,
            averageStock: Math.round(data.reduce((sum, item) => sum + item.currentStock, 0) / totalItems)
        };
    };

    const stats = calculateStats();

    return (
        <div className="inventory-filters">
            <div className="filters-header">
                <h3 className="filters-title">
                    Filtros
                    <span className="filters-subtitle">
                        Filtrar productos del inventario
                    </span>
                </h3>

                <div className="filter-stats">
                    <div className="stat-item">
                        <span className="stat-label">Valor total:</span>
                        <span className="stat-value">{stats.totalValue}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Productos:</span>
                        <span className="stat-value">{stats.totalItems}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Stock bajo:</span>
                        <span className="stat-value warning">{stats.lowStockItems}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Sin stock:</span>
                        <span className="stat-value danger">{stats.outOfStockItems}</span>
                    </div>
                </div>
            </div>

            {/* Filtros básicos */}
            <div className="basic-filters">
                <div className="filter-group search-group">
                    <div className="search-container">
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleInputChange}
                            placeholder="Buscar por nombre, SKU, descripción..."
                            className="search-input"
                        />
                        <button className="search-btn">
                            🔍
                        </button>
                    </div>
                </div>

                <div className="filter-group row">
                    <div className="filter-item">
                        <label htmlFor="category" className="filter-label">Categoría</label>
                        <select
                            id="category"
                            name="category"
                            value={filters.category}
                            onChange={handleInputChange}
                            className="filter-select"
                        >
                            {filterOptions.categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'Todas las categorías' : cat}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="status" className="filter-label">Estado</label>
                        <select
                            id="status"
                            name="status"
                            value={filters.status}
                            onChange={handleInputChange}
                            className="filter-select"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                            <option value="low_stock">Stock bajo</option>
                            <option value="out_of_stock">Sin stock</option>
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="supplier" className="filter-label">Proveedor</label>
                        <select
                            id="supplier"
                            name="supplier"
                            value={filters.supplier}
                            onChange={handleInputChange}
                            className="filter-select"
                        >
                            {filterOptions.suppliers.map(sup => (
                                <option key={sup} value={sup}>
                                    {sup === 'all' ? 'Todos los proveedores' : sup}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-item">
                        <label htmlFor="warehouse" className="filter-label">Almacén</label>
                        <select
                            id="warehouse"
                            name="warehouse"
                            value={filters.warehouse}
                            onChange={handleInputChange}
                            className="filter-select"
                        >
                            {filterOptions.warehouses.map(wh => (
                                <option key={wh} value={wh}>
                                    {wh === 'all' ? 'Todos los almacenes' : wh}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Filtros avanzados */}
            <div className="advanced-filters">
                <button 
                    className="advanced-toggle"
                    onClick={toggleAdvancedFilters}
                >
                    <span className="toggle-icon">
                        {isAdvancedOpen ? '▲' : '▼'}
                    </span>
                    <span className="toggle-text">
                        {isAdvancedOpen ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
                    </span>
                </button>

                {isAdvancedOpen && (
                    <div className="advanced-content">
                        <div className="filter-group">
                            <h4 className="filter-subtitle">Rango de Stock</h4>
                            <div className="range-filter">
                                <div className="range-inputs">
                                    <div className="range-input">
                                        <label htmlFor="minStock" className="range-label">Mínimo</label>
                                        <input
                                            type="number"
                                            id="minStock"
                                            name="minStock"
                                            value={filters.minStock}
                                            onChange={handleStockRangeChange}
                                            min="0"
                                            max="10000"
                                            className="range-number"
                                        />
                                    </div>
                                    
                                    <div className="range-separator">-</div>
                                    
                                    <div className="range-input">
                                        <label htmlFor="maxStock" className="range-label">Máximo</label>
                                        <input
                                            type="number"
                                            id="maxStock"
                                            name="maxStock"
                                            value={filters.maxStock}
                                            onChange={handleStockRangeChange}
                                            min="0"
                                            max="10000"
                                            className="range-number"
                                        />
                                    </div>
                                </div>
                                
                                <div className="range-slider">
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={filters.minStock}
                                        onChange={(e) => onFilterChange({ minStock: parseInt(e.target.value) })}
                                        className="range-min"
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1000"
                                        value={filters.maxStock}
                                        onChange={(e) => onFilterChange({ maxStock: parseInt(e.target.value) })}
                                        className="range-max"
                                    />
                                </div>
                                
                                <div className="range-values">
                                    <span className="range-min-value">Min: {filters.minStock}</span>
                                    <span className="range-max-value">Max: {filters.maxStock}</span>
                                </div>
                            </div>
                        </div>

                        <div className="filter-group">
                            <h4 className="filter-subtitle">Filtros Adicionales</h4>
                            <div className="additional-filters">
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="onlyLowStock"
                                        name="onlyLowStock"
                                        className="filter-checkbox"
                                    />
                                    <label htmlFor="onlyLowStock" className="checkbox-label">
                                        Solo productos con stock bajo
                                    </label>
                                </div>
                                
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="outOfStock"
                                        name="outOfStock"
                                        className="filter-checkbox"
                                    />
                                    <label htmlFor="outOfStock" className="checkbox-label">
                                        Incluir productos sin stock
                                    </label>
                                </div>
                                
                                <div className="checkbox-group">
                                    <input
                                        type="checkbox"
                                        id="reorderNeeded"
                                        name="reorderNeeded"
                                        className="filter-checkbox"
                                    />
                                    <label htmlFor="reorderNeeded" className="checkbox-label">
                                        Necesitan reorden
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="filter-group">
                            <h4 className="filter-subtitle">Ordenar Por</h4>
                            <div className="sort-options">
                                <select className="sort-select">
                                    <option value="name_asc">Nombre (A-Z)</option>
                                    <option value="name_desc">Nombre (Z-A)</option>
                                    <option value="stock_asc">Stock (menor a mayor)</option>
                                    <option value="stock_desc">Stock (mayor a menor)</option>
                                    <option value="price_asc">Precio (menor a mayor)</option>
                                    <option value="price_desc">Precio (mayor a menor)</option>
                                    <option value="value_asc">Valor (menor a mayor)</option>
                                    <option value="value_desc">Valor (mayor a menor)</option>
                                    <option value="updated_desc">Recientemente actualizados</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Acciones de filtros */}
            <div className="filter-actions">
                <div className="actions-left">
                    <button 
                        className="action-btn save-filters"
                        onClick={() => console.log('Guardar filtros')}
                    >
                        💾 Guardar filtros
                    </button>
                    <button 
                        className="action-btn load-filters"
                        onClick={() => console.log('Cargar filtros guardados')}
                    >
                        📂 Cargar filtros
                    </button>
                </div>
                
                <div className="actions-right">
                    <button 
                        className="action-btn reset"
                        onClick={onReset}
                    >
                        🗑️ Limpiar filtros
                    </button>
                    <button 
                        className="action-btn apply"
                        onClick={() => console.log('Aplicar filtros')}
                    >
                        ✅ Aplicar filtros
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryFilters;