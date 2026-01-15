/**
 * InventoryCard.js
 * Componente de tarjeta para productos del inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryCard.js
 */

import React from 'react';

const InventoryCard = ({
    item,
    isSelected,
    isExpanded,
    onSelect,
    onExpand,
    onEdit,
    onDelete,
    onViewDetails,
    stockStatus,
    totalValue,
    daysOfInventory
}) => {
    // Obtener color según estado de stock
    const getStockColor = () => {
        const colors = {
            out_of_stock: '#EF4444',
            critical: '#DC2626',
            low: '#F59E0B',
            warning: '#FBBF24',
            good: '#10B981'
        };
        return colors[stockStatus] || '#6B7280';
    };

    // Obtener etiqueta de estado
    const getStockLabel = () => {
        const labels = {
            out_of_stock: 'Sin Stock',
            critical: 'Crítico',
            low: 'Bajo',
            warning: 'Alerta',
            good: 'Normal'
        };
        return labels[stockStatus] || 'Desconocido';
    };

    // Obtener ícono según categoría
    const getCategoryIcon = (category) => {
        const icons = {
            'Electrónicos': '💻',
            'Ropa': '👕',
            'Alimentos': '🍎',
            'Hogar': '🏠',
            'Deportes': '⚽',
            'Juguetes': '🧸'
        };
        return icons[category] || '📦';
    };

    // Calcular porcentaje de stock
    const getStockPercentage = () => {
        return (item.currentStock / item.maxStock) * 100;
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <div 
            className={`inventory-card ${isSelected ? 'selected' : ''} ${stockStatus}`}
            onClick={onSelect}
        >
            {/* Encabezado de la tarjeta */}
            <div className="card-header">
                <div className="header-left">
                    <div className="category-icon">
                        {getCategoryIcon(item.category)}
                    </div>
                    <div className="product-info">
                        <h3 className="product-name">{item.name}</h3>
                        <div className="product-meta">
                            <span className="sku">{item.sku}</span>
                            <span className="separator">•</span>
                            <span className="barcode">{item.barcode}</span>
                        </div>
                    </div>
                </div>

                <div className="header-right">
                    <input
                        type="checkbox"
                        className="select-checkbox"
                        checked={isSelected}
                        onChange={onSelect}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button 
                        className="expand-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            onExpand();
                        }}
                    >
                        {isExpanded ? '▲' : '▼'}
                    </button>
                </div>
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="card-body">
                <div className="stock-section">
                    <div className="stock-header">
                        <span className="stock-label">Stock Actual</span>
                        <span 
                            className="stock-status"
                            style={{ color: getStockColor() }}
                        >
                            {getStockLabel()}
                        </span>
                    </div>
                    
                    <div className="stock-progress">
                        <div className="progress-bar">
                            <div 
                                className="progress-fill"
                                style={{ 
                                    width: `${Math.min(getStockPercentage(), 100)}%`,
                                    backgroundColor: getStockColor()
                                }}
                            ></div>
                        </div>
                        <div className="stock-numbers">
                            <span className="current-stock">
                                {item.currentStock} {item.unit}
                            </span>
                            <span className="stock-range">
                                ({item.minStock} - {item.maxStock})
                            </span>
                        </div>
                    </div>

                    <div className="stock-details">
                        <div className="detail-item">
                            <span className="detail-label">Días inventario:</span>
                            <span className="detail-value">{daysOfInventory}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Punto reorden:</span>
                            <span className="detail-value">{item.reorderPoint}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">Stock seguridad:</span>
                            <span className="detail-value">{item.safetyStock}</span>
                        </div>
                    </div>
                </div>

                <div className="info-section">
                    <div className="info-row">
                        <div className="info-item">
                            <span className="info-label">Categoría:</span>
                            <span className="info-value">{item.category}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Proveedor:</span>
                            <span className="info-value">{item.supplier}</span>
                        </div>
                    </div>

                    <div className="info-row">
                        <div className="info-item">
                            <span className="info-label">Almacén:</span>
                            <span className="info-value">{item.warehouse}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Ubicación:</span>
                            <span className="info-value">{item.location}</span>
                        </div>
                    </div>

                    <div className="info-row">
                        <div className="info-item">
                            <span className="info-label">Precio:</span>
                            <span className="info-value">${item.unitPrice.toFixed(2)}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Costo:</span>
                            <span className="info-value">${item.costPrice.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="value-section">
                    <div className="value-card">
                        <div className="value-label">Valor Total</div>
                        <div className="value-amount">${totalValue.toLocaleString()}</div>
                        <div className="value-percentage">
                            {getStockPercentage().toFixed(1)}% capacidad
                        </div>
                    </div>

                    <div className="dates-card">
                        <div className="date-item">
                            <span className="date-label">Actualizado:</span>
                            <span className="date-value">{formatDate(item.lastUpdated)}</span>
                        </div>
                        <div className="date-item">
                            <span className="date-label">Creado:</span>
                            <span className="date-value">{formatDate(item.createdAt)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detalles expandidos */}
            {isExpanded && (
                <div className="card-expanded">
                    <div className="expanded-section">
                        <h4>Información Detallada</h4>
                        <div className="details-grid">
                            <div className="detail-group">
                                <h5>Especificaciones</h5>
                                <div className="detail-item">
                                    <span>Peso:</span>
                                    <span>{item.weight} kg</span>
                                </div>
                                <div className="detail-item">
                                    <span>Dimensiones:</span>
                                    <span>{item.dimensions}</span>
                                </div>
                                <div className="detail-item">
                                    <span>Unidad:</span>
                                    <span>{item.unit}</span>
                                </div>
                            </div>

                            <div className="detail-group">
                                <h5>Financiero</h5>
                                <div className="detail-item">
                                    <span>IVA:</span>
                                    <span>{(item.taxRate * 100).toFixed(0)}%</span>
                                </div>
                                <div className="detail-item">
                                    <span>Margen:</span>
                                    <span>{((item.unitPrice - item.costPrice) / item.costPrice * 100).toFixed(1)}%</span>
                                </div>
                                <div className="detail-item">
                                    <span>Valor costo:</span>
                                    <span>${(item.currentStock * item.costPrice).toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="detail-group">
                                <h5>Información Adicional</h5>
                                <p className="notes">{item.notes}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pie de la tarjeta */}
            <div className="card-footer">
                <div className="footer-actions">
                    <button 
                        className="action-btn primary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onViewDetails();
                        }}
                    >
                        👁️ Ver Detalles
                    </button>
                    <button 
                        className="action-btn secondary"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                    >
                        ✏️ Editar
                    </button>
                    <button 
                        className="action-btn danger"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                    >
                        🗑️ Eliminar
                    </button>
                    <button 
                        className="action-btn warning"
                        onClick={(e) => {
                            e.stopPropagation();
                            console.log('Ajustar stock:', item);
                        }}
                    >
                        📊 Ajustar Stock
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryCard;