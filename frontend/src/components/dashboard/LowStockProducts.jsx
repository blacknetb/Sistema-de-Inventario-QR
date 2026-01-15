/**
 * LowStockProducts.js
 * Componente de productos con stock bajo
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\LowStockProducts.js
 */

import React, { useState } from 'react';
import './LowStockProducts.css';

const LowStockProducts = ({ products, loading }) => {
    const [sortBy, setSortBy] = useState('stock');
    const [filterCategory, setFilterCategory] = useState('all');
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Productos de ejemplo
    const sampleProducts = [
        {
            id: 1,
            name: 'iPhone 14 Pro Max',
            sku: 'IPH14PM-256',
            currentStock: 5,
            minStock: 20,
            maxStock: 100,
            category: 'Electrónicos',
            supplier: 'Apple Inc.',
            lastOrder: '2024-01-10',
            reorderQuantity: 50,
            unitPrice: 1299,
            urgency: 'high'
        },
        {
            id: 2,
            name: 'Monitor 27" 4K',
            sku: 'MON27-4K',
            currentStock: 8,
            minStock: 15,
            maxStock: 50,
            category: 'Electrónicos',
            supplier: 'Dell Technologies',
            lastOrder: '2024-01-12',
            reorderQuantity: 25,
            unitPrice: 450,
            urgency: 'high'
        },
        {
            id: 3,
            name: 'Teclado Mecánico RGB',
            sku: 'KB-MECH-RGB',
            currentStock: 12,
            minStock: 25,
            maxStock: 100,
            category: 'Accesorios',
            supplier: 'Logitech',
            lastOrder: '2024-01-05',
            reorderQuantity: 50,
            unitPrice: 120,
            urgency: 'medium'
        },
        {
            id: 4,
            name: 'Mouse Inalámbrico',
            sku: 'MS-WIRELESS',
            currentStock: 15,
            minStock: 30,
            maxStock: 150,
            category: 'Accesorios',
            supplier: 'Microsoft',
            lastOrder: '2024-01-08',
            reorderQuantity: 75,
            unitPrice: 60,
            urgency: 'medium'
        },
        {
            id: 5,
            name: 'Laptop Stand Aluminio',
            sku: 'LAP-STAND-ALU',
            currentStock: 3,
            minStock: 10,
            maxStock: 40,
            category: 'Accesorios',
            supplier: 'Amazon Basics',
            lastOrder: '2024-01-03',
            reorderQuantity: 20,
            unitPrice: 35,
            urgency: 'high'
        },
        {
            id: 6,
            name: 'Cable USB-C 2m',
            sku: 'CAB-USBC-2M',
            currentStock: 25,
            minStock: 50,
            maxStock: 200,
            category: 'Cables',
            supplier: 'Anker',
            lastOrder: '2024-01-01',
            reorderQuantity: 100,
            unitPrice: 15,
            urgency: 'low'
        }
    ];

    // Usar datos proporcionados o de ejemplo
    const productData = products && products.length > 0 ? products : sampleProducts;

    // Obtener categorías únicas
    const categories = ['all', ...new Set(productData.map(p => p.category))];

    // Filtrar y ordenar productos
    const filteredProducts = productData
        .filter(p => filterCategory === 'all' || p.category === filterCategory)
        .sort((a, b) => {
            switch (sortBy) {
                case 'stock':
                    return a.currentStock - b.currentStock;
                case 'urgency':
                    const urgencyOrder = { high: 1, medium: 2, low: 3 };
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'name':
                    return a.name.localeCompare(b.name);
                default:
                    return 0;
            }
        });

    // Calcular estadísticas
    const calculateStats = () => {
        const totalValue = filteredProducts.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
        const averageStock = filteredProducts.reduce((sum, p) => sum + p.currentStock, 0) / filteredProducts.length;
        const criticalProducts = filteredProducts.filter(p => p.urgency === 'high').length;
        const reorderValue = filteredProducts.reduce((sum, p) => {
            const needed = Math.max(0, p.minStock - p.currentStock);
            return sum + (needed * p.unitPrice);
        }, 0);

        return {
            totalValue: totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' }),
            averageStock: averageStock.toFixed(1),
            criticalProducts,
            reorderValue: reorderValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
        };
    };

    const stats = calculateStats();

    // Obtener nivel de urgencia
    const getUrgencyLevel = (product) => {
        const percentage = (product.currentStock / product.minStock) * 100;
        if (percentage <= 25) return { level: 'critical', label: 'Crítico', color: '#EF4444' };
        if (percentage <= 50) return { level: 'high', label: 'Alto', color: '#F59E0B' };
        if (percentage <= 75) return { level: 'medium', label: 'Medio', color: '#3B82F6' };
        return { level: 'low', label: 'Bajo', color: '#10B981' };
    };

    // Calcular progreso de stock
    const getStockProgress = (product) => {
        const progress = (product.currentStock / product.maxStock) * 100;
        return Math.min(progress, 100);
    };

    // Manejar reorden
    const handleReorder = (product) => {
        console.log('Reordenar producto:', product);
        alert(`Generando orden de compra para ${product.name} - Cantidad: ${product.reorderQuantity}`);
    };

    // Manejar ver detalles
    const handleViewDetails = (product) => {
        setSelectedProduct(product);
    };

    if (loading) {
        return (
            <div className="low-stock-loading">
                <div className="loading-spinner"></div>
                <p>Cargando productos con stock bajo...</p>
            </div>
        );
    }

    return (
        <div className="low-stock-products">
            <div className="low-stock-header">
                <div className="header-left">
                    <h3 className="low-stock-title">
                        Productos con Stock Bajo
                        <span className="low-stock-subtitle">
                            {filteredProducts.length} productos requieren atención
                        </span>
                    </h3>
                </div>
                
                <div className="header-right">
                    <div className="sort-controls">
                        <span className="sort-label">Ordenar por:</span>
                        <select 
                            className="sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                        >
                            <option value="stock">Stock (menor a mayor)</option>
                            <option value="urgency">Urgencia</option>
                            <option value="category">Categoría</option>
                            <option value="name">Nombre</option>
                        </select>
                    </div>
                    
                    <div className="filter-controls">
                        <span className="filter-label">Categoría:</span>
                        <select 
                            className="filter-select"
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'Todas' : cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="low-stock-stats">
                <div className="stat-card critical">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-content">
                        <span className="stat-label">Críticos</span>
                        <span className="stat-value">{stats.criticalProducts}</span>
                    </div>
                </div>
                
                <div className="stat-card value">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <span className="stat-label">Valor total</span>
                        <span className="stat-value">{stats.totalValue}</span>
                    </div>
                </div>
                
                <div className="stat-card average">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <span className="stat-label">Stock promedio</span>
                        <span className="stat-value">{stats.averageStock}</span>
                    </div>
                </div>
                
                <div className="stat-card reorder">
                    <div className="stat-icon">🛒</div>
                    <div className="stat-content">
                        <span className="stat-label">Valor reorden</span>
                        <span className="stat-value">{stats.reorderValue}</span>
                    </div>
                </div>
            </div>

            {/* Lista de productos */}
            <div className="products-list">
                {filteredProducts.length === 0 ? (
                    <div className="no-products">
                        <div className="no-products-icon">✅</div>
                        <p className="no-products-message">
                            ¡Excelente! No hay productos con stock bajo.
                        </p>
                    </div>
                ) : (
                    filteredProducts.map((product) => {
                        const urgency = getUrgencyLevel(product);
                        const progress = getStockProgress(product);
                        
                        return (
                            <div 
                                key={product.id}
                                className={`product-item ${urgency.level}`}
                                onClick={() => handleViewDetails(product)}
                            >
                                <div className="product-main">
                                    <div className="product-info">
                                        <div className="product-header">
                                            <h4 className="product-name">{product.name}</h4>
                                            <span className="product-sku">{product.sku}</span>
                                        </div>
                                        
                                        <div className="product-details">
                                            <span className="detail-item">
                                                <span className="detail-label">Categoría:</span>
                                                <span className="detail-value">{product.category}</span>
                                            </span>
                                            <span className="detail-item">
                                                <span className="detail-label">Proveedor:</span>
                                                <span className="detail-value">{product.supplier}</span>
                                            </span>
                                            <span className="detail-item">
                                                <span className="detail-label">Último pedido:</span>
                                                <span className="detail-value">
                                                    {new Date(product.lastOrder).toLocaleDateString()}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="product-stock">
                                        <div className="stock-info">
                                            <div className="stock-numbers">
                                                <span className="current-stock">{product.currentStock}</span>
                                                <span className="stock-separator">/</span>
                                                <span className="min-stock">{product.minStock}</span>
                                                <span className="stock-label">mínimo</span>
                                            </div>
                                            
                                            <div className="stock-bar">
                                                <div 
                                                    className="stock-progress"
                                                    style={{ 
                                                        width: `${progress}%`,
                                                        backgroundColor: urgency.color
                                                    }}
                                                ></div>
                                            </div>
                                            
                                            <div className="stock-meta">
                                                <span className="stock-urgency" style={{ color: urgency.color }}>
                                                    {urgency.label}
                                                </span>
                                                <span className="stock-price">
                                                    ${product.unitPrice}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="stock-actions">
                                            <button 
                                                className="action-btn reorder"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleReorder(product);
                                                }}
                                            >
                                                🛒 Reordenar ({product.reorderQuantity})
                                            </button>
                                            <button 
                                                className="action-btn details"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleViewDetails(product);
                                                }}
                                            >
                                                👁️ Detalles
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Panel de detalles */}
            {selectedProduct && (
                <div className="product-detail-panel">
                    <div className="detail-panel-header">
                        <h4>Detalles del Producto</h4>
                        <button 
                            className="close-panel"
                            onClick={() => setSelectedProduct(null)}
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="detail-panel-content">
                        <div className="detail-section">
                            <h5>Información General</h5>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Nombre:</span>
                                    <span className="detail-value">{selectedProduct.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">SKU:</span>
                                    <span className="detail-value">{selectedProduct.sku}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Categoría:</span>
                                    <span className="detail-value">{selectedProduct.category}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Proveedor:</span>
                                    <span className="detail-value">{selectedProduct.supplier}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="detail-section">
                            <h5>Información de Stock</h5>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Stock actual:</span>
                                    <span className="detail-value">{selectedProduct.currentStock}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Stock mínimo:</span>
                                    <span className="detail-value">{selectedProduct.minStock}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Stock máximo:</span>
                                    <span className="detail-value">{selectedProduct.maxStock}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Cantidad reorden:</span>
                                    <span className="detail-value">{selectedProduct.reorderQuantity}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="detail-section">
                            <h5>Información Financiera</h5>
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Precio unitario:</span>
                                    <span className="detail-value">${selectedProduct.unitPrice}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Valor en stock:</span>
                                    <span className="detail-value">
                                        ${(selectedProduct.currentStock * selectedProduct.unitPrice).toLocaleString()}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Valor faltante:</span>
                                    <span className="detail-value">
                                        ${(Math.max(0, selectedProduct.minStock - selectedProduct.currentStock) * selectedProduct.unitPrice).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="detail-panel-actions">
                        <button className="panel-btn primary">
                            📋 Generar orden de compra
                        </button>
                        <button className="panel-btn secondary">
                            📊 Ver historial
                        </button>
                        <button className="panel-btn tertiary">
                            📈 Análisis de demanda
                        </button>
                    </div>
                </div>
            )}

            <div className="low-stock-footer">
                <div className="footer-info">
                    <span className="info-text">
                        <strong>Recomendación:</strong> Mantener al menos {filteredProducts.length} órdenes de compra pendientes.
                    </span>
                </div>
                
                <div className="footer-actions">
                    <button className="footer-btn generate-orders">
                        📋 Generar todas las órdenes
                    </button>
                    <button className="footer-btn export-report">
                        📥 Exportar reporte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LowStockProducts;