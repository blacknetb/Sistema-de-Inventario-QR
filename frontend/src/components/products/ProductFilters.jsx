import React, { useState } from 'react';
import '../../assets/styles/products.css';

/**
 * Componente ProductFilters - Filtros para búsqueda de productos
 * Permite filtrar por múltiples criterios
 */
const ProductFilters = ({ onFilterChange, categories, suppliers }) => {
    const [filters, setFilters] = useState({
        search: '',
        category: '',
        supplier: '',
        minPrice: '',
        maxPrice: '',
        minStock: '',
        maxStock: '',
        status: '',
        sortBy: 'name',
        sortOrder: 'asc'
    });

    const [showAdvanced, setShowAdvanced] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const newFilters = { ...filters, [name]: value };
        setFilters(newFilters);
        if (onFilterChange) {
            onFilterChange(newFilters);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (onFilterChange) {
            onFilterChange(filters);
        }
    };

    const handleReset = () => {
        const resetFilters = {
            search: '',
            category: '',
            supplier: '',
            minPrice: '',
            maxPrice: '',
            minStock: '',
            maxStock: '',
            status: '',
            sortBy: 'name',
            sortOrder: 'asc'
        };
        setFilters(resetFilters);
        if (onFilterChange) {
            onFilterChange(resetFilters);
        }
    };

    return (
        <div className="product-filters">
            <form onSubmit={handleSubmit} className="filters-form">
                <div className="filters-basic">
                    <div className="search-box">
                        <i className="search-icon">🔍</i>
                        <input
                            type="text"
                            name="search"
                            value={filters.search}
                            onChange={handleChange}
                            className="search-input"
                            placeholder="Buscar productos por nombre, SKU o descripción..."
                        />
                    </div>
                    
                    <div className="basic-filters">
                        <select
                            name="category"
                            value={filters.category}
                            onChange={handleChange}
                            className="filter-select"
                        >
                            <option value="">Todas las categorías</option>
                            {categories && categories.map((category, index) => (
                                <option key={index} value={category}>{category}</option>
                            ))}
                        </select>
                        
                        <select
                            name="status"
                            value={filters.status}
                            onChange={handleChange}
                            className="filter-select"
                        >
                            <option value="">Todos los estados</option>
                            <option value="available">Disponible</option>
                            <option value="low-stock">Stock Bajo</option>
                            <option value="out-of-stock">Agotado</option>
                        </select>
                        
                        <button 
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? 'Filtros Simples' : 'Filtros Avanzados'}
                        </button>
                    </div>
                </div>
                
                {showAdvanced && (
                    <div className="filters-advanced">
                        <div className="advanced-grid">
                            <div className="filter-group">
                                <label className="filter-label">Proveedor</label>
                                <select
                                    name="supplier"
                                    value={filters.supplier}
                                    onChange={handleChange}
                                    className="filter-select"
                                >
                                    <option value="">Todos los proveedores</option>
                                    {suppliers && suppliers.map((supplier, index) => (
                                        <option key={index} value={supplier}>{supplier}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="filter-group">
                                <label className="filter-label">Precio Mínimo</label>
                                <div className="input-with-prefix">
                                    <span className="input-prefix">$</span>
                                    <input
                                        type="number"
                                        name="minPrice"
                                        value={filters.minPrice}
                                        onChange={handleChange}
                                        className="filter-input"
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            <div className="filter-group">
                                <label className="filter-label">Precio Máximo</label>
                                <div className="input-with-prefix">
                                    <span className="input-prefix">$</span>
                                    <input
                                        type="number"
                                        name="maxPrice"
                                        value={filters.maxPrice}
                                        onChange={handleChange}
                                        className="filter-input"
                                        placeholder="10000"
                                        min="0"
                                        step="0.01"
                                    />
                                </div>
                            </div>
                            
                            <div className="filter-group">
                                <label className="filter-label">Stock Mínimo</label>
                                <input
                                    type="number"
                                    name="minStock"
                                    value={filters.minStock}
                                    onChange={handleChange}
                                    className="filter-input"
                                    placeholder="0"
                                    min="0"
                                />
                            </div>
                            
                            <div className="filter-group">
                                <label className="filter-label">Stock Máximo</label>
                                <input
                                    type="number"
                                    name="maxStock"
                                    value={filters.maxStock}
                                    onChange={handleChange}
                                    className="filter-input"
                                    placeholder="1000"
                                    min="0"
                                />
                            </div>
                            
                            <div className="filter-group">
                                <label className="filter-label">Ordenar por</label>
                                <select
                                    name="sortBy"
                                    value={filters.sortBy}
                                    onChange={handleChange}
                                    className="filter-select"
                                >
                                    <option value="name">Nombre</option>
                                    <option value="price">Precio</option>
                                    <option value="stock">Stock</option>
                                    <option value="lastUpdated">Última actualización</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="filter-actions">
                            <button type="button" className="btn btn-secondary" onClick={handleReset}>
                                Limpiar Filtros
                            </button>
                            <button type="submit" className="btn btn-primary">
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                )}
            </form>
            
            <div className="active-filters">
                {filters.search && (
                    <span className="active-filter">
                        Búsqueda: "{filters.search}"
                        <button 
                            className="remove-filter"
                            onClick={() => handleChange({ target: { name: 'search', value: '' } })}
                        >
                            ×
                        </button>
                    </span>
                )}
                {filters.category && (
                    <span className="active-filter">
                        Categoría: {filters.category}
                        <button 
                            className="remove-filter"
                            onClick={() => handleChange({ target: { name: 'category', value: '' } })}
                        >
                            ×
                        </button>
                    </span>
                )}
                {filters.status && (
                    <span className="active-filter">
                        Estado: {filters.status === 'available' ? 'Disponible' : 
                                filters.status === 'low-stock' ? 'Stock Bajo' : 'Agotado'}
                        <button 
                            className="remove-filter"
                            onClick={() => handleChange({ target: { name: 'status', value: '' } })}
                        >
                            ×
                        </button>
                    </span>
                )}
                {filters.minPrice && (
                    <span className="active-filter">
                        Precio desde: ${filters.minPrice}
                        <button 
                            className="remove-filter"
                            onClick={() => handleChange({ target: { name: 'minPrice', value: '' } })}
                        >
                            ×
                        </button>
                    </span>
                )}
                {filters.maxPrice && (
                    <span className="active-filter">
                        Precio hasta: ${filters.maxPrice}
                        <button 
                            className="remove-filter"
                            onClick={() => handleChange({ target: { name: 'maxPrice', value: '' } })}
                        >
                            ×
                        </button>
                    </span>
                )}
            </div>
        </div>
    );
};

export default ProductFilters;