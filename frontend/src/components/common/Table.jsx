/**
 * Table.js
 * Componente de tabla reutilizable con paginación, ordenamiento y filtros
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\common\Table.js
 */

import React, { useState, useMemo, useEffect } from 'react';
import '../../assets/styles/common/tables.css';

const Table = ({
    data = [],
    columns = [],
    pageSize = 10,
    showPagination = true,
    showSearch = true,
    showFilters = true,
    showSorting = true,
    onRowClick,
    onSelectionChange,
    onEdit,
    onDelete,
    loading = false,
    emptyMessage = 'No hay datos disponibles',
    className = '',
    rowKey = 'id',
    selectable = false,
    actions = [],
    ...props
}) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [filters, setFilters] = useState({});
    const [columnFilters, setColumnFilters] = useState({});

    // Calcular datos filtrados y ordenados
    const processedData = useMemo(() => {
        let filteredData = [...data];

        // Aplicar búsqueda global
        if (searchTerm) {
            filteredData = filteredData.filter(row =>
                columns.some(col => {
                    if (!col.searchable && col.searchable !== undefined) return false;
                    const value = row[col.dataKey];
                    return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
                })
            );
        }

        // Aplicar filtros por columna
        Object.keys(columnFilters).forEach(key => {
            const filterValue = columnFilters[key];
            if (filterValue) {
                filteredData = filteredData.filter(row => {
                    const cellValue = row[key];
                    if (typeof cellValue === 'string') {
                        return cellValue.toLowerCase().includes(filterValue.toLowerCase());
                    }
                    if (typeof cellValue === 'number') {
                        return cellValue.toString().includes(filterValue);
                    }
                    return true;
                });
            }
        });

        // Aplicar ordenamiento
        if (sortConfig.key) {
            filteredData.sort((a, b) => {
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

        return filteredData;
    }, [data, columns, searchTerm, sortConfig, columnFilters]);

    // Calcular paginación
    const totalPages = Math.ceil(processedData.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedData = processedData.slice(startIndex, startIndex + pageSize);

    // Manejar ordenamiento
    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // Manejar selección de filas
    const handleSelectRow = (rowId) => {
        const newSelected = new Set(selectedRows);
        if (newSelected.has(rowId)) {
            newSelected.delete(rowId);
        } else {
            newSelected.add(rowId);
        }
        setSelectedRows(newSelected);
        
        if (onSelectionChange) {
            onSelectionChange(Array.from(newSelected));
        }
    };

    // Manejar selección de todas las filas
    const handleSelectAll = () => {
        if (selectedRows.size === paginatedData.length) {
            setSelectedRows(new Set());
            if (onSelectionChange) {
                onSelectionChange([]);
            }
        } else {
            const allIds = paginatedData.map(row => row[rowKey]);
            setSelectedRows(new Set(allIds));
            if (onSelectionChange) {
                onSelectionChange(allIds);
            }
        }
    };

    // Manejar cambio de página
    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Manejar cambio de filtro de columna
    const handleColumnFilter = (columnKey, value) => {
        setColumnFilters(prev => ({
            ...prev,
            [columnKey]: value
        }));
        setCurrentPage(1);
    };

    // Resetear filtros
    const resetFilters = () => {
        setSearchTerm('');
        setColumnFilters({});
        setCurrentPage(1);
    };

    // Renderizar cabecera de tabla
    const renderTableHeader = () => (
        <thead>
            <tr>
                {selectable && (
                    <th className="select-column">
                        <input
                            type="checkbox"
                            checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                            onChange={handleSelectAll}
                            disabled={loading || paginatedData.length === 0}
                        />
                    </th>
                )}
                
                {columns.map(column => (
                    <th
                        key={column.dataKey}
                        className={`${column.className || ''} ${sortConfig.key === column.dataKey ? `sorted-${sortConfig.direction}` : ''}`}
                        style={{ width: column.width }}
                    >
                        <div className="column-header">
                            <span className="column-title">{column.title}</span>
                            
                            {showSorting && column.sortable !== false && (
                                <button
                                    className="sort-btn"
                                    onClick={() => handleSort(column.dataKey)}
                                    aria-label={`Ordenar por ${column.title}`}
                                >
                                    {sortConfig.key === column.dataKey ? 
                                        (sortConfig.direction === 'asc' ? '↑' : '↓') : 
                                        '↕'}
                                </button>
                            )}
                        </div>

                        {showFilters && column.filterable !== false && (
                            <div className="column-filter">
                                <input
                                    type="text"
                                    placeholder={`Filtrar ${column.title.toLowerCase()}...`}
                                    value={columnFilters[column.dataKey] || ''}
                                    onChange={(e) => handleColumnFilter(column.dataKey, e.target.value)}
                                    className="filter-input"
                                />
                            </div>
                        )}
                    </th>
                ))}
                
                {(actions.length > 0 || onEdit || onDelete) && (
                    <th className="actions-column">Acciones</th>
                )}
            </tr>
        </thead>
    );

    // Renderizar celda de tabla
    const renderTableCell = (row, column) => {
        const value = row[column.dataKey];
        
        if (column.render) {
            return column.render(value, row);
        }
        
        if (column.format) {
            return column.format(value);
        }
        
        return value || '-';
    };

    // Renderizar acciones de fila
    const renderRowActions = (row) => {
        const rowActions = [...actions];
        
        if (onEdit) {
            rowActions.push({
                label: 'Editar',
                icon: '✏️',
                onClick: () => onEdit(row),
                className: 'action-edit'
            });
        }
        
        if (onDelete) {
            rowActions.push({
                label: 'Eliminar',
                icon: '🗑️',
                onClick: () => onDelete(row),
                className: 'action-delete'
            });
        }

        return (
            <div className="row-actions">
                {rowActions.map((action, index) => (
                    <button
                        key={index}
                        className={`action-btn ${action.className || ''}`}
                        onClick={action.onClick}
                        title={action.label}
                        disabled={action.disabled}
                    >
                        {action.icon && <span className="action-icon">{action.icon}</span>}
                        {!action.iconOnly && <span className="action-label">{action.label}</span>}
                    </button>
                ))}
            </div>
        );
    };

    // Renderizar filas de tabla
    const renderTableBody = () => {
        if (loading) {
            return (
                <tbody>
                    <tr>
                        <td colSpan={columns.length + (selectable ? 1 : 0) + ((actions.length > 0 || onEdit || onDelete) ? 1 : 0)}>
                            <div className="loading-indicator">
                                <div className="spinner"></div>
                                <span>Cargando datos...</span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            );
        }

        if (paginatedData.length === 0) {
            return (
                <tbody>
                    <tr>
                        <td colSpan={columns.length + (selectable ? 1 : 0) + ((actions.length > 0 || onEdit || onDelete) ? 1 : 0)}>
                            <div className="empty-state">
                                <div className="empty-icon">📄</div>
                                <p className="empty-message">{emptyMessage}</p>
                            </div>
                        </td>
                    </tr>
                </tbody>
            );
        }

        return (
            <tbody>
                {paginatedData.map((row) => (
                    <tr
                        key={row[rowKey]}
                        className={`table-row ${selectedRows.has(row[rowKey]) ? 'selected' : ''} ${onRowClick ? 'clickable' : ''}`}
                        onClick={() => onRowClick && onRowClick(row)}
                    >
                        {selectable && (
                            <td className="select-cell">
                                <input
                                    type="checkbox"
                                    checked={selectedRows.has(row[rowKey])}
                                    onChange={() => handleSelectRow(row[rowKey])}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </td>
                        )}
                        
                        {columns.map(column => (
                            <td
                                key={`${row[rowKey]}-${column.dataKey}`}
                                className={column.className || ''}
                                style={column.cellStyle}
                            >
                                {renderTableCell(row, column)}
                            </td>
                        ))}
                        
                        {(actions.length > 0 || onEdit || onDelete) && (
                            <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                {renderRowActions(row)}
                            </td>
                        )}
                    </tr>
                ))}
            </tbody>
        );
    };

    // Renderizar paginación
    const renderPagination = () => {
        if (!showPagination || totalPages <= 1) return null;

        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="table-pagination">
                <div className="pagination-info">
                    Mostrando {startIndex + 1} - {Math.min(startIndex + pageSize, processedData.length)} de {processedData.length} registros
                </div>
                
                <div className="pagination-controls">
                    <button
                        className="pagination-btn first"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                    >
                        « Primera
                    </button>
                    
                    <button
                        className="pagination-btn prev"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        ← Anterior
                    </button>
                    
                    {pageNumbers.map(number => (
                        <button
                            key={number}
                            className={`pagination-page ${currentPage === number ? 'active' : ''}`}
                            onClick={() => goToPage(number)}
                        >
                            {number}
                        </button>
                    ))}
                    
                    <button
                        className="pagination-btn next"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Siguiente →
                    </button>
                    
                    <button
                        className="pagination-btn last"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                    >
                        Última »
                    </button>
                </div>
                
                <div className="pagination-size">
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setCurrentPage(1);
                            props.onPageSizeChange && props.onPageSizeChange(Number(e.target.value));
                        }}
                        className="page-size-select"
                    >
                        {[5, 10, 20, 50, 100].map(size => (
                            <option key={size} value={size}>
                                {size} por página
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        );
    };

    return (
        <div className={`table-container ${className}`}>
            {/* Controles de tabla */}
            <div className="table-controls">
                {showSearch && (
                    <div className="table-search">
                        <input
                            type="text"
                            placeholder="Buscar en todos los campos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        {searchTerm && (
                            <button
                                className="clear-search"
                                onClick={() => setSearchTerm('')}
                                aria-label="Limpiar búsqueda"
                            >
                                ×
                            </button>
                        )}
                    </div>
                )}

                <div className="table-actions">
                    {showFilters && (
                        <button
                            className="btn btn-secondary"
                            onClick={resetFilters}
                            disabled={!searchTerm && Object.keys(columnFilters).length === 0}
                        >
                            🗑️ Limpiar filtros
                        </button>
                    )}

                    {selectedRows.size > 0 && (
                        <div className="selection-info">
                            <span className="selected-count">{selectedRows.size} seleccionados</span>
                            <button
                                className="btn btn-danger"
                                onClick={() => {
                                    setSelectedRows(new Set());
                                    onSelectionChange && onSelectionChange([]);
                                }}
                            >
                                Deseleccionar todos
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabla */}
            <div className="table-wrapper">
                <table className="data-table">
                    {renderTableHeader()}
                    {renderTableBody()}
                </table>
            </div>

            {/* Paginación */}
            {renderPagination()}

            {/* Información de resumen */}
            <div className="table-summary">
                <div className="summary-item">
                    <span className="summary-label">Total registros:</span>
                    <span className="summary-value">{data.length}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Mostrando:</span>
                    <span className="summary-value">{processedData.length}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Página:</span>
                    <span className="summary-value">{currentPage} de {totalPages}</span>
                </div>
            </div>
        </div>
    );
};

// Tabla con exportación
export const ExportableTable = ({ onExport, ...props }) => {
    return (
        <div className="exportable-table">
            <div className="export-buttons">
                <button className="btn btn-success" onClick={() => onExport && onExport('csv')}>
                    📥 Exportar CSV
                </button>
                <button className="btn btn-primary" onClick={() => onExport && onExport('excel')}>
                    📊 Exportar Excel
                </button>
                <button className="btn btn-warning" onClick={() => onExport && onExport('pdf')}>
                    📄 Exportar PDF
                </button>
            </div>
            <Table {...props} />
        </div>
    );
};

// Tabla con vista de tarjetas
export const CardTable = ({ cardRenderer, ...props }) => {
    const [viewMode, setViewMode] = useState('table');

    return (
        <div className="card-table-container">
            <div className="view-toggle">
                <button
                    className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                    onClick={() => setViewMode('table')}
                >
                    📋 Tabla
                </button>
                <button
                    className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
                    onClick={() => setViewMode('cards')}
                >
                    🃏 Tarjetas
                </button>
            </div>

            {viewMode === 'table' ? (
                <Table {...props} />
            ) : (
                <div className="cards-view">
                    {props.data.map(item => cardRenderer(item))}
                </div>
            )}
        </div>
    );
};

export default Table;