/**
 * InventoryTable.js
 * Componente de tabla para el inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryTable.js
 */

import React from 'react';

const InventoryTable = ({
    data,
    selectedItems,
    sortConfig,
    onSort,
    onSelectItem,
    onEdit,
    onDelete,
    onViewDetails,
    getStockStatus,
    calculateTotalValue,
    calculateDaysOfInventory
}) => {
    // Columnas de la tabla
    const columns = [
        { key: 'select', label: '', width: '50px', sortable: false },
        { key: 'sku', label: 'SKU', width: '120px', sortable: true },
        { key: 'name', label: 'Nombre', width: '200px', sortable: true },
        { key: 'category', label: 'Categoría', width: '120px', sortable: true },
        { key: 'currentStock', label: 'Stock', width: '100px', sortable: true },
        { key: 'unitPrice', label: 'Precio Unit.', width: '120px', sortable: true },
        { key: 'totalValue', label: 'Valor Total', width: '140px', sortable: false },
        { key: 'status', label: 'Estado', width: '120px', sortable: true },
        { key: 'warehouse', label: 'Almacén', width: '150px', sortable: true },
        { key: 'lastUpdated', label: 'Última Actualización', width: '150px', sortable: true },
        { key: 'actions', label: 'Acciones', width: '150px', sortable: false }
    ];

    // Obtener ícono de ordenamiento
    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return '↕️';
        return sortConfig.direction === 'asc' ? '↑' : '↓';
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Obtener color del estado
    const getStatusColor = (status) => {
        const colors = {
            active: '#10b981',
            inactive: '#6b7280',
            low_stock: '#f59e0b',
            out_of_stock: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    // Obtener etiqueta del estado
    const getStatusLabel = (status) => {
        const labels = {
            active: 'Activo',
            inactive: 'Inactivo',
            low_stock: 'Stock Bajo',
            out_of_stock: 'Sin Stock'
        };
        return labels[status] || status;
    };

    // Obtener clase del estado de stock
    const getStockStatusClass = (item) => {
        const status = getStockStatus(item);
        const classes = {
            out_of_stock: 'status-out',
            critical: 'status-critical',
            low: 'status-low',
            warning: 'status-warning',
            good: 'status-good'
        };
        return classes[status] || '';
    };

    return (
        <div className="inventory-table-container">
            <div className="table-wrapper">
                <table className="inventory-table">
                    <thead>
                        <tr>
                            {columns.map(column => (
                                <th 
                                    key={column.key}
                                    style={{ width: column.width }}
                                    className={column.sortable ? 'sortable' : ''}
                                    onClick={() => column.sortable && onSort(column.key)}
                                >
                                    <div className="column-header">
                                        <span className="column-label">{column.label}</span>
                                        {column.sortable && (
                                            <span className="sort-icon">
                                                {getSortIcon(column.key)}
                                            </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map(item => {
                            const isSelected = selectedItems.includes(item.id);
                            const stockStatus = getStockStatus(item);
                            const totalValue = calculateTotalValue(item);
                            const daysOfInventory = calculateDaysOfInventory(item);

                            return (
                                <tr 
                                    key={item.id}
                                    className={`table-row ${isSelected ? 'selected' : ''} ${stockStatus}`}
                                    onClick={() => onSelectItem(item.id)}
                                >
                                    {/* Columna de selección */}
                                    <td className="select-cell">
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={() => onSelectItem(item.id)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    </td>

                                    {/* SKU */}
                                    <td className="sku-cell">
                                        <div className="sku-wrapper">
                                            <span className="sku-value">{item.sku}</span>
                                            <span className="barcode">{item.barcode}</span>
                                        </div>
                                    </td>

                                    {/* Nombre */}
                                    <td className="name-cell">
                                        <div className="product-info">
                                            <div className="product-name">{item.name}</div>
                                            <div className="product-description">
                                                {item.description.substring(0, 60)}...
                                            </div>
                                        </div>
                                    </td>

                                    {/* Categoría */}
                                    <td className="category-cell">
                                        <span className="category-badge">{item.category}</span>
                                    </td>

                                    {/* Stock */}
                                    <td className="stock-cell">
                                        <div className="stock-info">
                                            <div className={`stock-value ${getStockStatusClass(item)}`}>
                                                {item.currentStock} {item.unit}
                                            </div>
                                            <div className="stock-range">
                                                Min: {item.minStock} | Max: {item.maxStock}
                                            </div>
                                            <div className="stock-days">
                                                {daysOfInventory} días de inventario
                                            </div>
                                        </div>
                                    </td>

                                    {/* Precio Unitario */}
                                    <td className="price-cell">
                                        <div className="price-info">
                                            <div className="unit-price">
                                                ${item.unitPrice.toFixed(2)}
                                            </div>
                                            <div className="cost-price">
                                                Costo: ${item.costPrice.toFixed(2)}
                                            </div>
                                            <div className="profit-margin">
                                                Margen: {((item.unitPrice - item.costPrice) / item.costPrice * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </td>

                                    {/* Valor Total */}
                                    <td className="value-cell">
                                        <div className="value-info">
                                            <div className="total-value">
                                                ${totalValue.toLocaleString()}
                                            </div>
                                            <div className="value-percentage">
                                                {((item.currentStock / item.maxStock) * 100).toFixed(1)}% capacidad
                                            </div>
                                        </div>
                                    </td>

                                    {/* Estado */}
                                    <td className="status-cell">
                                        <div 
                                            className="status-badge"
                                            style={{ backgroundColor: getStatusColor(item.status) }}
                                        >
                                            {getStatusLabel(item.status)}
                                        </div>
                                    </td>

                                    {/* Almacén */}
                                    <td className="warehouse-cell">
                                        <div className="warehouse-info">
                                            <div className="warehouse-name">{item.warehouse}</div>
                                            <div className="location">
                                                📍 {item.location}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Última Actualización */}
                                    <td className="date-cell">
                                        <div className="date-info">
                                            <div className="last-updated">
                                                {formatDate(item.lastUpdated)}
                                            </div>
                                            <div className="created-at">
                                                Creado: {formatDate(item.createdAt)}
                                            </div>
                                        </div>
                                    </td>

                                    {/* Acciones */}
                                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                                        <div className="action-buttons">
                                            <button 
                                                className="action-btn view"
                                                onClick={() => onViewDetails(item)}
                                                title="Ver detalles"
                                            >
                                                👁️
                                            </button>
                                            <button 
                                                className="action-btn edit"
                                                onClick={() => onEdit(item)}
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                className="action-btn delete"
                                                onClick={() => onDelete(item)}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </button>
                                            <button 
                                                className="action-btn adjust"
                                                onClick={() => console.log('Ajustar stock:', item)}
                                                title="Ajustar stock"
                                            >
                                                📊
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Resumen de la tabla */}
            <div className="table-summary">
                <div className="summary-item">
                    <span className="summary-label">Productos mostrados:</span>
                    <span className="summary-value">{data.length}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Seleccionados:</span>
                    <span className="summary-value">{selectedItems.length}</span>
                </div>
                <div className="summary-item">
                    <span className="summary-label">Valor total:</span>
                    <span className="summary-value">
                        ${data.reduce((sum, item) => sum + calculateTotalValue(item), 0).toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default InventoryTable;