import React, { useState } from 'react';
import '../../assets/styles/products.css';

/**
 * Componente ProductDetail - Vista detallada de un producto
 * Muestra información completa y estadísticas del producto
 */
const ProductDetail = ({ product, onClose, onEdit, onDelete, onAddStock }) => {
    const [activeTab, setActiveTab] = useState('details');
    const [stockToAdd, setStockToAdd] = useState('');

    if (!product) {
        return (
            <div className="product-detail empty">
                <div className="empty-state">
                    <i className="empty-icon">🔍</i>
                    <h3>Producto no encontrado</h3>
                    <p>El producto que buscas no existe o ha sido eliminado.</p>
                    <button className="btn btn-primary" onClick={onClose}>
                        Volver a productos
                    </button>
                </div>
            </div>
        );
    }

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateProfit = () => {
        if (!product.cost) return null;
        const profit = product.price - product.cost;
        const margin = (profit / product.cost) * 100;
        return { profit, margin };
    };

    const profitData = calculateProfit();

    const handleAddStock = () => {
        const quantity = parseInt(stockToAdd);
        if (!isNaN(quantity) && quantity > 0 && onAddStock) {
            onAddStock(product, quantity);
            setStockToAdd('');
        }
    };

    const tabs = [
        { id: 'details', label: 'Detalles', icon: '📋' },
        { id: 'movements', label: 'Movimientos', icon: '📊' },
        { id: 'history', label: 'Historial', icon: '📅' },
        { id: 'stats', label: 'Estadísticas', icon: '📈' }
    ];

    return (
        <div className="product-detail">
            <div className="detail-header">
                <div className="header-left">
                    <button className="back-btn" onClick={onClose}>
                        ← Volver
                    </button>
                    <h1 className="product-title">{product.name}</h1>
                    <div className="product-subtitle">
                        <span className="product-sku">{product.sku}</span>
                        <span className="product-category">{product.category}</span>
                        {product.status === 'available' && (
                            <span className="status-badge available">Disponible</span>
                        )}
                        {product.status === 'low-stock' && (
                            <span className="status-badge low-stock">Stock Bajo</span>
                        )}
                        {product.status === 'out-of-stock' && (
                            <span className="status-badge out-of-stock">Agotado</span>
                        )}
                    </div>
                </div>
                
                <div className="header-right">
                    <div className="action-buttons">
                        <button 
                            className="btn btn-secondary"
                            onClick={() => onEdit && onEdit(product)}
                        >
                            <i className="btn-icon">✏️</i>
                            <span>Editar</span>
                        </button>
                        <button 
                            className="btn btn-danger"
                            onClick={() => onDelete && onDelete(product)}
                        >
                            <i className="btn-icon">🗑️</i>
                            <span>Eliminar</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="detail-content">
                <div className="detail-sidebar">
                    <div className="product-image-large">
                        {product.image ? (
                            <img src={product.image} alt={product.name} className="detail-img" />
                        ) : (
                            <div className="image-placeholder-large">
                                <i className="placeholder-icon">📦</i>
                                <span>Sin imagen</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="quick-stats">
                        <div className="stat-card">
                            <div className="stat-icon">💰</div>
                            <div className="stat-info">
                                <div className="stat-label">Precio</div>
                                <div className="stat-value">{formatPrice(product.price)}</div>
                            </div>
                        </div>
                        
                        <div className="stat-card">
                            <div className="stat-icon">📦</div>
                            <div className="stat-info">
                                <div className="stat-label">Stock Actual</div>
                                <div className="stat-value">{product.stock} unidades</div>
                                <div className="stat-sub">
                                    Mínimo: {product.minStock || 0}
                                </div>
                            </div>
                        </div>
                        
                        {profitData && (
                            <div className="stat-card">
                                <div className="stat-icon">📈</div>
                                <div className="stat-info">
                                    <div className="stat-label">Margen</div>
                                    <div className="stat-value success">
                                        {profitData.margin.toFixed(1)}%
                                    </div>
                                    <div className="stat-sub">
                                        Ganancia: {formatPrice(profitData.profit)}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div className="stat-card">
                            <div className="stat-icon">🏭</div>
                            <div className="stat-info">
                                <div className="stat-label">Proveedor</div>
                                <div className="stat-value">{product.supplier}</div>
                                <div className="stat-sub">
                                    Última compra: {formatDate(product.lastUpdated)}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="stock-management">
                        <h3 className="section-title">Gestión de Stock</h3>
                        <div className="stock-form">
                            <div className="form-group">
                                <label className="form-label">Agregar Stock</label>
                                <div className="input-with-action">
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={stockToAdd}
                                        onChange={(e) => setStockToAdd(e.target.value)}
                                        placeholder="Cantidad"
                                        min="1"
                                    />
                                    <button 
                                        className="btn btn-primary"
                                        onClick={handleAddStock}
                                        disabled={!stockToAdd || parseInt(stockToAdd) <= 0}
                                    >
                                        Agregar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="detail-main">
                    <div className="detail-tabs">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <i className="tab-icon">{tab.icon}</i>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                    
                    <div className="tab-content">
                        {activeTab === 'details' && (
                            <div className="details-tab">
                                <div className="section">
                                    <h3 className="section-title">Descripción</h3>
                                    <p className="section-content">
                                        {product.description || 'No hay descripción disponible para este producto.'}
                                    </p>
                                </div>
                                
                                <div className="section">
                                    <h3 className="section-title">Información General</h3>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <span className="info-label">SKU:</span>
                                            <span className="info-value">{product.sku}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Categoría:</span>
                                            <span className="info-value">{product.category}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Proveedor:</span>
                                            <span className="info-value">{product.supplier}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Estado:</span>
                                            <span className="info-value">
                                                {product.status === 'available' && 'Disponible'}
                                                {product.status === 'low-stock' && 'Stock Bajo'}
                                                {product.status === 'out-of-stock' && 'Agotado'}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Precio:</span>
                                            <span className="info-value">{formatPrice(product.price)}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Costo:</span>
                                            <span className="info-value">
                                                {product.cost ? formatPrice(product.cost) : 'No especificado'}
                                            </span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Stock:</span>
                                            <span className="info-value">{product.stock} unidades</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Stock Mínimo:</span>
                                            <span className="info-value">{product.minStock || 0} unidades</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="info-label">Última Actualización:</span>
                                            <span className="info-value">{formatDate(product.lastUpdated)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {profitData && (
                                    <div className="section">
                                        <h3 className="section-title">Análisis Financiero</h3>
                                        <div className="financial-grid">
                                            <div className="financial-item">
                                                <div className="financial-label">Precio de Venta</div>
                                                <div className="financial-value">{formatPrice(product.price)}</div>
                                            </div>
                                            <div className="financial-item">
                                                <div className="financial-label">Costo Unitario</div>
                                                <div className="financial-value">{formatPrice(product.cost)}</div>
                                            </div>
                                            <div className="financial-item">
                                                <div className="financial-label">Ganancia por Unidad</div>
                                                <div className="financial-value success">
                                                    {formatPrice(profitData.profit)}
                                                </div>
                                            </div>
                                            <div className="financial-item">
                                                <div className="financial-label">Margen de Ganancia</div>
                                                <div className="financial-value success">
                                                    {profitData.margin.toFixed(1)}%
                                                </div>
                                            </div>
                                            <div className="financial-item">
                                                <div className="financial-label">Valor Total en Stock</div>
                                                <div className="financial-value">
                                                    {formatPrice(product.price * product.stock)}
                                                </div>
                                            </div>
                                            <div className="financial-item">
                                                <div className="financial-label">Ganancia Total Potencial</div>
                                                <div className="financial-value success">
                                                    {formatPrice(profitData.profit * product.stock)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {activeTab === 'movements' && (
                            <div className="movements-tab">
                                <div className="empty-state">
                                    <i className="empty-icon">📊</i>
                                    <h3>Movimientos del Producto</h3>
                                    <p>Aquí se mostrarán los movimientos de entrada y salida del producto.</p>
                                    <div className="mock-data">
                                        <div className="mock-row">
                                            <span className="mock-date">15 Ene 2024</span>
                                            <span className="mock-type entrada">Entrada</span>
                                            <span className="mock-quantity">+50 unidades</span>
                                            <span className="mock-reason">Compra a proveedor</span>
                                        </div>
                                        <div className="mock-row">
                                            <span className="mock-date">14 Ene 2024</span>
                                            <span className="mock-type salida">Salida</span>
                                            <span className="mock-quantity">-5 unidades</span>
                                            <span className="mock-reason">Venta #ORD-001</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'history' && (
                            <div className="history-tab">
                                <div className="empty-state">
                                    <i className="empty-icon">📅</i>
                                    <h3>Historial del Producto</h3>
                                    <p>Aquí se mostrará el historial completo de modificaciones del producto.</p>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'stats' && (
                            <div className="stats-tab">
                                <div className="empty-state">
                                    <i className="empty-icon">📈</i>
                                    <h3>Estadísticas</h3>
                                    <p>Aquí se mostrarán las estadísticas de ventas y rendimiento del producto.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;