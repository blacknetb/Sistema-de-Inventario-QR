import React from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/CATEGORIES/categories.css';

const CategoryFilters = ({
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder
}) => {
    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('todos');
        setSortBy('nombre');
        setSortOrder('asc');
    };

    const hasActiveFilters = searchTerm || statusFilter !== 'todos' || sortBy !== 'nombre' || sortOrder !== 'asc';

    return (
        <div className="category-filters">
            <div className="filters-header">
                <h3>Filtros y Ordenación</h3>
                {hasActiveFilters && (
                    <button 
                        onClick={handleClearFilters}
                        className="btn-clear-filters"
                    >
                        <i className="fas fa-times"></i>
                        Limpiar Filtros
                    </button>
                )}
            </div>

            <div className="filters-grid">
                <div className="filter-group">
                    <label htmlFor="search">Buscar</label>
                    <div className="search-box">
                        <i className="fas fa-search"></i>
                        <input
                            type="text"
                            id="search"
                            placeholder="Buscar por nombre, código o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                                title="Limpiar búsqueda"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                </div>

                <div className="filter-group">
                    <label htmlFor="status">Estado</label>
                    <select
                        id="status"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="activo">Solo activas</option>
                        <option value="inactivo">Solo inactivas</option>
                    </select>
                </div>

                <div className="filter-group">
                    <label htmlFor="sortBy">Ordenar por</label>
                    <div className="sort-controls">
                        <select
                            id="sortBy"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="nombre">Nombre</option>
                            <option value="codigo">Código</option>
                            <option value="productos">Cantidad de productos</option>
                            <option value="valor">Valor total</option>
                            <option value="fecha">Fecha de creación</option>
                        </select>
                        
                        <button
                            className={`sort-order-btn ${sortOrder}`}
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            title={sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'}
                        >
                            <i className={`fas fa-sort-${sortOrder === 'asc' ? 'alpha-down' : 'alpha-up'}`}></i>
                        </button>
                    </div>
                </div>

                <div className="filter-group">
                    <label>Vista</label>
                    <div className="view-options">
                        <button className="view-option active" title="Vista de cuadrícula">
                            <i className="fas fa-th-large"></i>
                        </button>
                        <button className="view-option" title="Vista de lista">
                            <i className="fas fa-list"></i>
                        </button>
                    </div>
                </div>
            </div>

            {hasActiveFilters && (
                <div className="active-filters">
                    <strong>Filtros activos:</strong>
                    {searchTerm && (
                        <span className="filter-tag">
                            Búsqueda: "{searchTerm}"
                            <button onClick={() => setSearchTerm('')}>×</button>
                        </span>
                    )}
                    {statusFilter !== 'todos' && (
                        <span className="filter-tag">
                            Estado: {statusFilter === 'activo' ? 'Activas' : 'Inactivas'}
                            <button onClick={() => setStatusFilter('todos')}>×</button>
                        </span>
                    )}
                    {sortBy !== 'nombre' && (
                        <span className="filter-tag">
                            Ordenado por: {
                                sortBy === 'codigo' ? 'Código' :
                                sortBy === 'productos' ? 'Productos' :
                                sortBy === 'valor' ? 'Valor' : 'Fecha'
                            }
                            <button onClick={() => setSortBy('nombre')}>×</button>
                        </span>
                    )}
                    {sortOrder !== 'asc' && (
                        <span className="filter-tag">
                            Orden: Descendente
                            <button onClick={() => setSortOrder('asc')}>×</button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

CategoryFilters.propTypes = {
    searchTerm: PropTypes.string.isRequired,
    setSearchTerm: PropTypes.func.isRequired,
    statusFilter: PropTypes.string.isRequired,
    setStatusFilter: PropTypes.func.isRequired,
    sortBy: PropTypes.string.isRequired,
    setSortBy: PropTypes.func.isRequired,
    sortOrder: PropTypes.string.isRequired,
    setSortOrder: PropTypes.func.isRequired
};

export default CategoryFilters;