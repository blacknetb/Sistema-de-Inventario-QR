import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const DataTable = ({
    columns,
    data,
    loading = false,
    error = null,
    onRowClick,
    selectable = false,
    onSelectionChange,
    sortable = true,
    onSort,
    pagination = true,
    pageSize = 10,
    pageSizeOptions = [5, 10, 25, 50],
    onPageSizeChange,
    searchable = true,
    onSearch,
    filterable = false,
    onFilter,
    actions = [],
    striped = true,
    hoverable = true,
    bordered = false,
    compact = false,
    className = '',
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
    rowClassName = '',
    emptyState = null,
    ...props
}) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({});

    // Filtrar y ordenar datos
    const processedData = useMemo(() => {
        let result = [...data];

        // Aplicar búsqueda
        if (searchQuery && onSearch) {
            result = onSearch(result, searchQuery);
        } else if (searchQuery) {
            result = result.filter(row =>
                columns.some(col =>
                    row[col.key]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
                )
            );
        }

        // Aplicar filtros
        if (filterable && filters && Object.keys(filters).length > 0) {
            result = result.filter(row => {
                return Object.entries(filters).every(([key, value]) => {
                    if (!value || value === '') return true;
                    return row[key]?.toString().toLowerCase().includes(value.toLowerCase());
                });
            });
        }

        // Aplicar ordenación
        if (sortable && sortConfig.key) {
            result.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [data, searchQuery, filters, sortConfig, columns, onSearch, filterable, sortable]);

    // Paginación
    const totalPages = Math.ceil(processedData.length / pageSize);
    const paginatedData = pagination
        ? processedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : processedData;

    // Selección
    const allSelected = selectedRows.length > 0 && selectedRows.length === paginatedData.length;
    const isIndeterminate = selectedRows.length > 0 && selectedRows.length < paginatedData.length;

    const handleSelectAll = (checked) => {
        if (checked) {
            const newSelected = paginatedData.map(row => row.id);
            setSelectedRows(newSelected);
            if (onSelectionChange) {
                onSelectionChange(newSelected);
            }
        } else {
            setSelectedRows([]);
            if (onSelectionChange) {
                onSelectionChange([]);
            }
        }
    };

    const handleSelectRow = (id, checked) => {
        let newSelected;
        if (checked) {
            newSelected = [...selectedRows, id];
        } else {
            newSelected = selectedRows.filter(rowId => rowId !== id);
        }
        
        setSelectedRows(newSelected);
        if (onSelectionChange) {
            onSelectionChange(newSelected);
        }
    };

    const handleSort = (key) => {
        if (!sortable) return;
        
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        
        const newSortConfig = { key, direction };
        setSortConfig(newSortConfig);
        
        if (onSort) {
            onSort(newSortConfig);
        }
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleFilter = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setCurrentPage(1);
        
        if (onFilter) {
            onFilter(newFilters);
        }
    };

    const clearFilters = () => {
        setFilters({});
        setSearchQuery('');
        setCurrentPage(1);
    };

    // Resetear página cuando cambian los datos
    useEffect(() => {
        setCurrentPage(1);
    }, [data, searchQuery, filters]);

    if (loading) {
        return (
            <div className="datatable-loading">
                <div className="datatable-spinner"></div>
                <p>Cargando datos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="datatable-error">
                <i className="fas fa-exclamation-circle"></i>
                <h4>Error al cargar los datos</h4>
                <p>{error}</p>
                <button 
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className={`datatable ${className}`}>
            {/* Toolbar */}
            <div className="datatable-toolbar">
                <div className="datatable-toolbar-left">
                    {searchable && (
                        <div className="datatable-search">
                            <i className="fas fa-search"></i>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                            {searchQuery && (
                                <button
                                    className="datatable-search-clear"
                                    onClick={() => handleSearch('')}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    )}

                    {filterable && (
                        <div className="datatable-filters">
                            {columns.filter(col => col.filterable).map(col => (
                                <div key={col.key} className="datatable-filter">
                                    <input
                                        type="text"
                                        placeholder={`Filtrar por ${col.title}...`}
                                        value={filters[col.key] || ''}
                                        onChange={(e) => handleFilter(col.key, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {(searchQuery || Object.keys(filters).length > 0) && (
                        <button
                            className="datatable-clear-filters"
                            onClick={clearFilters}
                        >
                            <i className="fas fa-times"></i>
                            Limpiar filtros
                        </button>
                    )}
                </div>

                <div className="datatable-toolbar-right">
                    <div className="datatable-info">
                        Mostrando {paginatedData.length} de {processedData.length} registros
                    </div>

                    {pagination && pageSizeOptions && onPageSizeChange && (
                        <div className="datatable-page-size">
                            <select
                                value={pageSize}
                                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            >
                                {pageSizeOptions.map(size => (
                                    <option key={size} value={size}>
                                        {size} por página
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="datatable-container">
                <table className={`datatable-table 
                    ${striped ? 'datatable-striped' : ''}
                    ${hoverable ? 'datatable-hoverable' : ''}
                    ${bordered ? 'datatable-bordered' : ''}
                    ${compact ? 'datatable-compact' : ''}`}
                >
                    <thead className={`datatable-header ${headerClassName}`}>
                        <tr>
                            {selectable && (
                                <th className="datatable-column-select">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={input => {
                                            if (input) {
                                                input.indeterminate = isIndeterminate;
                                            }
                                        }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
                                </th>
                            )}

                            {columns.map(column => (
                                <th 
                                    key={column.key}
                                    className={`datatable-column ${column.className || ''} ${sortable ? 'sortable' : ''}`}
                                    style={{ width: column.width }}
                                    onClick={() => handleSort(column.key)}
                                >
                                    <div className="datatable-column-header">
                                        <span className="datatable-column-title">
                                            {column.title}
                                        </span>
                                        
                                        {sortable && (
                                            <span className="datatable-sort-icons">
                                                <i className={`fas fa-sort-up ${sortConfig.key === column.key && sortConfig.direction === 'asc' ? 'active' : ''}`}></i>
                                                <i className={`fas fa-sort-down ${sortConfig.key === column.key && sortConfig.direction === 'desc' ? 'active' : ''}`}></i>
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}

                            {actions.length > 0 && (
                                <th className="datatable-column-actions">
                                    Acciones
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className={`datatable-body ${bodyClassName}`}>
                        {paginatedData.length > 0 ? (
                            paginatedData.map((row, rowIndex) => (
                                <tr
                                    key={row.id || rowIndex}
                                    className={`datatable-row ${rowClassName} ${onRowClick ? 'clickable' : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                >
                                    {selectable && (
                                        <td className="datatable-cell-select">
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(row.id)}
                                                onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                    )}

                                    {columns.map(column => (
                                        <td 
                                            key={column.key}
                                            className={`datatable-cell ${column.cellClassName || ''}`}
                                        >
                                            {column.render 
                                                ? column.render(row[column.key], row)
                                                : row[column.key]
                                            }
                                        </td>
                                    ))}

                                    {actions.length > 0 && (
                                        <td className="datatable-cell-actions">
                                            <div className="datatable-actions">
                                                {actions.map((action, index) => (
                                                    <button
                                                        key={index}
                                                        className={`datatable-action ${action.variant || ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            action.onClick(row);
                                                        }}
                                                        title={action.title}
                                                    >
                                                        {action.icon && <i className={action.icon}></i>}
                                                        {action.label && !action.icon && action.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td 
                                    colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)}
                                    className="datatable-empty"
                                >
                                    {emptyState || (
                                        <div className="datatable-empty-state">
                                            <i className="fas fa-inbox"></i>
                                            <h4>No hay datos disponibles</h4>
                                            <p>No se encontraron registros que coincidan con los criterios</p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer y paginación */}
            <div className={`datatable-footer ${footerClassName}`}>
                {selectable && selectedRows.length > 0 && (
                    <div className="datatable-selection-info">
                        <span>
                            {selectedRows.length} {selectedRows.length === 1 ? 'registro seleccionado' : 'registros seleccionados'}
                        </span>
                        <button
                            className="datatable-clear-selection"
                            onClick={() => {
                                setSelectedRows([]);
                                if (onSelectionChange) onSelectionChange([]);
                            }}
                        >
                            Limpiar selección
                        </button>
                    </div>
                )}

                {pagination && totalPages > 1 && (
                    <div className="datatable-pagination">
                        <button
                            className="datatable-pagination-button"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <i className="fas fa-chevron-left"></i>
                        </button>

                        <div className="datatable-pagination-pages">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (currentPage <= 3) {
                                    page = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={page}
                                        className={`datatable-pagination-page ${currentPage === page ? 'active' : ''}`}
                                        onClick={() => handlePageChange(page)}
                                    >
                                        {page}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            className="datatable-pagination-button"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                )}

                <div className="datatable-footer-info">
                    Página {currentPage} de {totalPages}
                </div>
            </div>
        </div>
    );
};

DataTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        width: PropTypes.string,
        className: PropTypes.string,
        cellClassName: PropTypes.string,
        render: PropTypes.func,
        filterable: PropTypes.bool,
        sortable: PropTypes.bool
    })).isRequired,
    data: PropTypes.array.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.string,
    onRowClick: PropTypes.func,
    selectable: PropTypes.bool,
    onSelectionChange: PropTypes.func,
    sortable: PropTypes.bool,
    onSort: PropTypes.func,
    pagination: PropTypes.bool,
    pageSize: PropTypes.number,
    pageSizeOptions: PropTypes.arrayOf(PropTypes.number),
    onPageSizeChange: PropTypes.func,
    searchable: PropTypes.bool,
    onSearch: PropTypes.func,
    filterable: PropTypes.bool,
    onFilter: PropTypes.func,
    actions: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string,
        icon: PropTypes.string,
        variant: PropTypes.string,
        onClick: PropTypes.func.isRequired,
        title: PropTypes.string
    })),
    striped: PropTypes.bool,
    hoverable: PropTypes.bool,
    bordered: PropTypes.bool,
    compact: PropTypes.bool,
    className: PropTypes.string,
    headerClassName: PropTypes.string,
    bodyClassName: PropTypes.string,
    footerClassName: PropTypes.string,
    rowClassName: PropTypes.string,
    emptyState: PropTypes.node
};

export default DataTable;