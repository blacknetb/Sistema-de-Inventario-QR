import React, { useState, useMemo, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { clsx } from 'clsx';
import '../../../assets/styles/variables.css';
import '../../../assets/styles/global.css';
import '../../../assets/styles/base.css';
import '../../../assets/styles/animations.css';

/**
 * ✅ COMPONENTE TABLE COMPLETAMENTE REESCRITO Y OPTIMIZADO
 */

// ✅ COMPONENTE DE PAGINACIÓN INTEGRADO
const Pagination = ({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange,
  disabled = false,
  className = ''
}) => {
  if (!onPageChange || totalPages <= 1) return null;
  
  const handlePrev = () => {
    if (currentPage > 1 && !disabled) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages && !disabled) {
      onPageChange(currentPage + 1);
    }
  };
  
  return (
    <div className={clsx("table-pagination", className)}>
      <button
        onClick={handlePrev}
        disabled={disabled || currentPage === 1}
        className="table-pagination-button table-pagination-prev"
        aria-label="Página anterior"
        type="button"
      >
        ←
      </button>
      
      <span className="table-pagination-info">
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>
      
      <button
        onClick={handleNext}
        disabled={disabled || currentPage === totalPages}
        className="table-pagination-button table-pagination-next"
        aria-label="Página siguiente"
        type="button"
      >
        →
      </button>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

// ✅ COMPONENTE PRINCIPAL TABLE
const Table = React.memo(({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = '',
  onRowClick,
  actions,
  pagination,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  sortable = false,
  onSort,
  initialSort = null,
  striped = true,
  compact = false,
  stickyHeader = false,
  responsive = true,
  scrollable = true,
  maxHeight,
  expandable = false,
  expandedRowRender,
  expandedRowIds = [],
  onExpand,
  searchable = false,
  onSearch,
  searchPlaceholder = 'Buscar...',
  bulkActions,
  idKey = 'id',
  rowKey = 'id',
  ...props
}) => {
  // ✅ ESTADOS
  const [sortConfig, setSortConfig] = useState(initialSort);
  const [searchTerm, setSearchTerm] = useState('');
  const [internalSelectedRows, setInternalSelectedRows] = useState(() => 
    Array.isArray(selectedRows) ? selectedRows : []
  );
  
  // ✅ VALIDACIÓN DE COLUMNAS
  const validatedColumns = useMemo(() => {
    if (!Array.isArray(columns)) {
      console.warn('Table: columns debe ser un array');
      return [];
    }
    
    return columns.filter(col => 
      col && 
      typeof col === 'object' && 
      col.accessor && 
      col.header !== undefined
    );
  }, [columns]);
  
  // ✅ VALIDACIÓN DE DATOS
  const validatedData = useMemo(() => {
    if (!Array.isArray(data)) {
      console.warn('Table: data debe ser un array');
      return [];
    }
    
    return data.filter(item => 
      item && 
      typeof item === 'object' && 
      item[idKey] !== undefined
    );
  }, [data, idKey]);
  
  // ✅ SINCRONIZAR SELECTED ROWS
  useEffect(() => {
    if (Array.isArray(selectedRows)) {
      setInternalSelectedRows(selectedRows);
    }
  }, [selectedRows]);
  
  // ✅ FILTRADO DE DATOS
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return validatedData;
    
    const term = searchTerm.toLowerCase().trim();
    
    return validatedData.filter(row => {
      return validatedColumns.some(column => {
        const cellValue = row[column.accessor];
        if (cellValue == null) return false;
        
        return String(cellValue).toLowerCase().includes(term);
      });
    });
  }, [validatedData, validatedColumns, searchTerm]);
  
  // ✅ PAGINACIÓN DE DATOS
  const paginatedData = useMemo(() => {
    if (!pagination || !pagination.pageSize) return filteredData;
    
    const { currentPage = 1, pageSize = 10 } = pagination;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination]);
  
  // ✅ CÁLCULO DE SELECT ALL
  const isAllSelected = useMemo(() => {
    if (!selectable || paginatedData.length === 0) return false;
    
    return paginatedData.every(row => 
      internalSelectedRows.includes(row[idKey])
    );
  }, [selectable, paginatedData, internalSelectedRows, idKey]);
  
  // ✅ HANDLERS
  const handleSelectAll = useCallback(() => {
    if (!selectable || !onSelectionChange || paginatedData.length === 0) return;
    
    const allIds = paginatedData.map(row => row[idKey]);
    
    if (isAllSelected) {
      const newSelected = internalSelectedRows.filter(id => 
        !allIds.includes(id)
      );
      onSelectionChange(newSelected);
    } else {
      const newSelected = [...new Set([...internalSelectedRows, ...allIds])];
      onSelectionChange(newSelected);
    }
  }, [selectable, onSelectionChange, paginatedData, isAllSelected, internalSelectedRows, idKey]);
  
  const handleSelectRow = useCallback((rowId) => {
    if (!selectable || !onSelectionChange) return;
    
    const newSelected = internalSelectedRows.includes(rowId)
      ? internalSelectedRows.filter(id => id !== rowId)
      : [...internalSelectedRows, rowId];
    
    onSelectionChange(newSelected);
  }, [selectable, onSelectionChange, internalSelectedRows]);
  
  const handleSort = useCallback((columnAccessor) => {
    if (!sortable || !onSort || !columnAccessor) return;
    
    let direction = 'asc';
    if (sortConfig?.column === columnAccessor) {
      direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
    }
    
    const newSortConfig = { column: columnAccessor, direction };
    setSortConfig(newSortConfig);
    onSort(newSortConfig);
  }, [sortable, onSort, sortConfig]);
  
  const handleSearch = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (onSearch) {
      onSearch(value);
    }
  }, [onSearch]);
  
  const handleExpand = useCallback((rowId) => {
    if (!expandable || !onExpand) return;
    
    onExpand(rowId);
  }, [expandable, onExpand]);
  
  // ✅ RENDERIZADO DE SKELETON
  const renderSkeleton = useCallback(() => {
    const rows = 5;
    const cols = validatedColumns.length + 
                 (selectable ? 1 : 0) + 
                 (actions ? 1 : 0) + 
                 (expandable ? 1 : 0);
    
    return (
      <div className="table-skeleton-wrapper">
        <table className="table-skeleton">
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={`skeleton-th-${i}`}>
                  <div className="skeleton-header"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={`skeleton-row-${rowIndex}`}>
                {Array.from({ length: cols }).map((_, colIndex) => (
                  <td key={`skeleton-cell-${rowIndex}-${colIndex}`}>
                    <div className="skeleton-cell"></div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }, [validatedColumns.length, selectable, actions, expandable]);
  
  // ✅ RENDERIZADO DE EMPTY STATE
  const renderEmptyState = useCallback(() => {
    return (
      <div className="table-empty-state">
        <div className="table-empty-icon">📊</div>
        <h3 className="table-empty-title">{emptyMessage}</h3>
        {searchTerm && (
          <p className="table-empty-subtitle">
            No se encontraron resultados para "{searchTerm}"
          </p>
        )}
      </div>
    );
  }, [emptyMessage, searchTerm]);
  
  // ✅ RENDERIZADO DE BÚSQUEDA
  const renderSearchBar = useCallback(() => {
    if (!searchable) return null;
    
    return (
      <div className="table-search-container">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder={searchPlaceholder}
          className="table-search-input"
          aria-label="Buscar en la tabla"
        />
      </div>
    );
  }, [searchable, searchTerm, handleSearch, searchPlaceholder]);
  
  // ✅ RENDERIZADO DE BULK ACTIONS
  const renderBulkActions = useCallback(() => {
    if (!bulkActions || internalSelectedRows.length === 0) return null;
    
    return (
      <div className="table-bulk-actions">
        <span className="table-bulk-count">
          {internalSelectedRows.length} seleccionado(s)
        </span>
        <div className="table-bulk-buttons">
          {bulkActions(internalSelectedRows)}
        </div>
      </div>
    );
  }, [bulkActions, internalSelectedRows]);
  
  // ✅ RENDERIZADO DE CABECERA
  const renderHeader = useCallback(() => {
    return (
      <thead className={clsx('table-header', stickyHeader && 'table-sticky-header')}>
        <tr>
          {selectable && (
            <th className="table-header-checkbox">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={handleSelectAll}
                aria-label="Seleccionar todos"
              />
            </th>
          )}
          
          {validatedColumns.map((column, index) => (
            <th
              key={`header-${column.accessor}-${index}`}
              className={clsx(
                'table-header-cell',
                column.headerClassName,
                headerClassName,
                sortable && 'table-header-sortable'
              )}
              onClick={() => sortable && handleSort(column.accessor)}
            >
              <div className="table-header-content">
                {column.header}
                {sortable && sortConfig?.column === column.accessor && (
                  <span className="table-sort-indicator">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
          ))}
          
          {actions && <th className="table-header-actions">Acciones</th>}
          {expandable && <th className="table-header-expand"></th>}
        </tr>
      </thead>
    );
  }, [selectable, validatedColumns, headerClassName, sortable, sortConfig, 
      handleSort, actions, expandable, isAllSelected, handleSelectAll, stickyHeader]);
  
  // ✅ RENDERIZADO DE FILA
  const renderRow = useCallback((row, rowIndex) => {
    const rowId = row[idKey];
    const isSelected = internalSelectedRows.includes(rowId);
    const isExpanded = expandable && expandedRowIds.includes(rowId);
    const rowKeyValue = row[rowKey] || rowId || `row-${rowIndex}`;
    
    return (
      <React.Fragment key={rowKeyValue}>
        <tr
          onClick={() => onRowClick && onRowClick(row)}
          className={clsx(
            'table-row',
            onRowClick && 'table-row-clickable',
            striped && rowIndex % 2 === 0 && 'table-row-striped',
            isSelected && 'table-row-selected',
            rowClassName
          )}
          data-row-id={rowId}
        >
          {selectable && (
            <td className="table-cell-checkbox">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleSelectRow(rowId)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Seleccionar fila ${rowIndex + 1}`}
              />
            </td>
          )}
          
          {validatedColumns.map((column, colIndex) => (
            <td
              key={`cell-${rowId}-${column.accessor}-${colIndex}`}
              className={clsx('table-cell', column.cellClassName, cellClassName)}
            >
              {column.cell ? column.cell(row) : row[column.accessor]}
            </td>
          ))}
          
          {actions && (
            <td className="table-cell-actions">
              {actions(row)}
            </td>
          )}
          
          {expandable && (
            <td className="table-cell-expand">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleExpand(rowId);
                }}
                className="table-expand-button"
                aria-label={isExpanded ? 'Contraer' : 'Expandir'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            </td>
          )}
        </tr>
        
        {expandable && isExpanded && expandedRowRender && (
          <tr className="table-expanded-row">
            <td colSpan={validatedColumns.length + (selectable ? 1 : 0) + (actions ? 1 : 0) + (expandable ? 1 : 0)}>
              {expandedRowRender(row)}
            </td>
          </tr>
        )}
      </React.Fragment>
    );
  }, [selectable, validatedColumns, expandable, expandedRowIds, expandedRowRender,
      onRowClick, striped, rowClassName, cellClassName, actions, internalSelectedRows,
      idKey, rowKey, handleSelectRow, handleExpand]);
  
  // ✅ RENDERIZADO PRINCIPAL
  const renderTable = useCallback(() => {
    const tableContent = (
      <div
        className={clsx('table-wrapper', scrollable && 'table-scrollable')}
        style={maxHeight ? { maxHeight } : undefined}
      >
        <table className="table-main">
          {renderHeader()}
          <tbody>
            {paginatedData.map((row, index) => renderRow(row, index))}
          </tbody>
        </table>
      </div>
    );
    
    if (responsive) {
      return <div className="table-responsive">{tableContent}</div>;
    }
    
    return tableContent;
  }, [scrollable, maxHeight, renderHeader, paginatedData, renderRow, responsive]);
  
  // ✅ COMPONENTE PRINCIPAL
  if (loading) {
    return renderSkeleton();
  }
  
  if (validatedData.length === 0) {
    return renderEmptyState();
  }
  
  const displayData = pagination ? paginatedData : filteredData;
  
  if (displayData.length === 0 && searchTerm) {
    return renderEmptyState();
  }
  
  return (
    <div className={clsx('table-container', className)} {...props}>
      {(searchable || bulkActions) && (
        <div className="table-controls">
          {renderSearchBar()}
          {renderBulkActions()}
        </div>
      )}
      
      {renderTable()}
      
      {pagination && (
        <div className="table-footer">
          <div className="table-summary">
            Mostrando {displayData.length} de {filteredData.length} registros
          </div>
          <Pagination
            currentPage={pagination.currentPage || 1}
            totalPages={Math.ceil(filteredData.length / (pagination.pageSize || 10))}
            onPageChange={pagination.onPageChange}
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
});

// ✅ PROPTYPES COMPLETOS
Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      accessor: PropTypes.string.isRequired,
      header: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      cell: PropTypes.func,
      headerClassName: PropTypes.string,
      cellClassName: PropTypes.string
    })
  ).isRequired,
  data: PropTypes.arrayOf(PropTypes.object),
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  className: PropTypes.string,
  headerClassName: PropTypes.string,
  rowClassName: PropTypes.string,
  cellClassName: PropTypes.string,
  onRowClick: PropTypes.func,
  actions: PropTypes.func,
  pagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    pageSize: PropTypes.number,
    onPageChange: PropTypes.func
  }),
  selectable: PropTypes.bool,
  selectedRows: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  onSelectionChange: PropTypes.func,
  sortable: PropTypes.bool,
  onSort: PropTypes.func,
  initialSort: PropTypes.shape({
    column: PropTypes.string,
    direction: PropTypes.oneOf(['asc', 'desc'])
  }),
  striped: PropTypes.bool,
  compact: PropTypes.bool,
  stickyHeader: PropTypes.bool,
  responsive: PropTypes.bool,
  scrollable: PropTypes.bool,
  maxHeight: PropTypes.string,
  expandable: PropTypes.bool,
  expandedRowRender: PropTypes.func,
  expandedRowIds: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  ),
  onExpand: PropTypes.func,
  searchable: PropTypes.bool,
  onSearch: PropTypes.func,
  searchPlaceholder: PropTypes.string,
  bulkActions: PropTypes.func,
  idKey: PropTypes.string,
  rowKey: PropTypes.string
};

// ✅ VALORES POR DEFECTO
Table.defaultProps = {
  columns: [],
  data: [],
  loading: false,
  emptyMessage: 'No hay datos disponibles',
  selectable: false,
  selectedRows: [],
  sortable: false,
  striped: true,
  compact: false,
  stickyHeader: false,
  responsive: true,
  scrollable: true,
  expandable: false,
  expandedRowIds: [],
  searchable: false,
  searchPlaceholder: 'Buscar...',
  idKey: 'id',
  rowKey: 'id'
};

// ✅ HELPER FUNCTIONS
Table.createColumn = (accessor, header, options = {}) => ({
  accessor,
  header,
  cell: options.cell,
  headerClassName: options.headerClassName || '',
  cellClassName: options.cellClassName || ''
});

Table.createActions = (actions = []) => {
  const ActionsComponent = ({ row }) => (
    <div className="table-actions">
      {actions.map((action, index) => (
        <button
          key={`action-${index}`}
          onClick={(e) => {
            e.stopPropagation();
            action.onClick(row);
          }}
          className={`table-action table-action-${action.variant || 'default'}`}
          disabled={action.disabled?.(row)}
          title={action.title}
          type="button"
        >
          {action.icon && <span className="table-action-icon">{action.icon}</span>}
          {action.label && <span className="table-action-label">{action.label}</span>}
        </button>
      ))}
    </div>
  );
  
  ActionsComponent.displayName = 'TableActions';
  return ActionsComponent;
};

Table.useSelection = (initialSelected = []) => {
  const [selectedRows, setSelectedRows] = useState(
    Array.isArray(initialSelected) ? initialSelected : []
  );
  
  const toggleRow = useCallback((rowId) => {
    setSelectedRows(prev => 
      prev.includes(rowId) 
        ? prev.filter(id => id !== rowId)
        : [...prev, rowId]
    );
  }, []);
  
  const selectAll = useCallback((rowIds) => {
    setSelectedRows(rowIds);
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedRows([]);
  }, []);
  
  return {
    selectedRows,
    toggleRow,
    selectAll,
    clearSelection,
    setSelectedRows
  };
};

Table.displayName = 'Table';

export default Table;