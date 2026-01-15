/**
 * TopProducts.js
 * Componente de productos más vendidos
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\TopProducts.js
 */

import React, { useState } from 'react';
import './TopProducts.css';

const TopProducts = ({ products, loading }) => {
    const [sortBy, setSortBy] = useState('revenue');
    const [timeRange, setTimeRange] = useState('month');
    const [expandedProduct, setExpandedProduct] = useState(null);

    // Datos de ejemplo
    const sampleProducts = [
        {
            id: 1,
            name: 'iPhone 14 Pro Max',
            sku: 'IPH14PM-256',
            category: 'Electrónicos',
            sales: 156,
            revenue: 234000,
            profit: 46800,
            stock: 45,
            rating: 4.8,
            trend: 'up',
            growth: 12.5
        },
        {
            id: 2,
            name: 'MacBook Pro M2',
            sku: 'MBP-M2-512',
            category: 'Electrónicos',
            sales: 98,
            revenue: 147000,
            profit: 29400,
            stock: 32,
            rating: 4.9,
            trend: 'up',
            growth: 18.2
        },
        {
            id: 3,
            name: 'Monitor 27" 4K',
            sku: 'MON27-4K',
            category: 'Electrónicos',
            sales: 87,
            revenue: 39150,
            profit: 7830,
            stock: 28,
            rating: 4.7,
            trend: 'stable',
            growth: 3.4
        },
        {
            id: 4,
            name: 'Teclado Mecánico RGB',
            sku: 'KB-MECH-RGB',
            category: 'Accesorios',
            sales: 145,
            revenue: 17400,
            profit: 3480,
            stock: 56,
            rating: 4.5,
            trend: 'up',
            growth: 8.7
        },
        {
            id: 5,
            name: 'Mouse Inalámbrico',
            sku: 'MS-WIRELESS',
            category: 'Accesorios',
            sales: 203,
            revenue: 12180,
            profit: 2436,
            stock: 89,
            rating: 4.4,
            trend: 'down',
            growth: -2.3
        }
    ];

    const productData = products && products.length > 0 ? products : sampleProducts;

    // Ordenar productos
    const sortedProducts = [...productData].sort((a, b) => {
        if (sortBy === 'revenue') return b.revenue - a.revenue;
        if (sortBy === 'sales') return b.sales - a.sales;
        if (sortBy === 'profit') return b.profit - a.profit;
        if (sortBy === 'rating') return b.rating - a.rating;
        return 0;
    });

    // Calcular estadísticas
    const stats = {
        totalRevenue: sortedProducts.reduce((sum, p) => sum + p.revenue, 0),
        totalSales: sortedProducts.reduce((sum, p) => sum + p.sales, 0),
        avgRating: (sortedProducts.reduce((sum, p) => sum + p.rating, 0) / sortedProducts.length).toFixed(1),
        topCategory: sortedProducts.reduce((acc, p) => {
            acc[p.category] = (acc[p.category] || 0) + p.revenue;
            return acc;
        }, {})
    };

    const topCategory = Object.entries(stats.topCategory).sort((a, b) => b[1] - a[1])[0];

    if (loading) {
        return (
            <div className="top-products-loading">
                <div className="loading-spinner"></div>
                <p>Cargando productos más vendidos...</p>
            </div>
        );
    }

    return (
        <div className="top-products">
            <div className="top-products-header">
                <div className="header-left">
                    <h3 className="top-products-title">
                        Productos Más Vendidos
                        <span className="top-products-subtitle">
                            {timeRange === 'week' ? 'Esta semana' : 
                             timeRange === 'month' ? 'Este mes' : 
                             'Este año'}
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
                            <option value="revenue">Ingresos</option>
                            <option value="sales">Ventas</option>
                            <option value="profit">Utilidad</option>
                            <option value="rating">Rating</option>
                        </select>
                    </div>
                    
                    <div className="time-controls">
                        <button 
                            className={`time-btn ${timeRange === 'week' ? 'active' : ''}`}
                            onClick={() => setTimeRange('week')}
                        >
                            Semana
                        </button>
                        <button 
                            className={`time-btn ${timeRange === 'month' ? 'active' : ''}`}
                            onClick={() => setTimeRange('month')}
                        >
                            Mes
                        </button>
                        <button 
                            className={`time-btn ${timeRange === 'year' ? 'active' : ''}`}
                            onClick={() => setTimeRange('year')}
                        >
                            Año
                        </button>
                    </div>
                </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="top-products-stats">
                <div className="stat-card">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <span className="stat-label">Ingresos Totales</span>
                        <span className="stat-value">
                            ${stats.totalRevenue.toLocaleString()}
                        </span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <span className="stat-label">Ventas Totales</span>
                        <span className="stat-value">
                            {stats.totalSales.toLocaleString()}
                        </span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                        <span className="stat-label">Rating Promedio</span>
                        <span className="stat-value">{stats.avgRating}/5</span>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                        <span className="stat-label">Categoría Top</span>
                        <span className="stat-value">
                            {topCategory?.[0] || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Lista de productos */}
            <div className="products-list">
                {sortedProducts.map((product, index) => (
                    <div 
                        key={product.id}
                        className={`product-item ${expandedProduct === product.id ? 'expanded' : ''}`}
                        onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                    >
                        <div className="product-main">
                            <div className="product-rank">
                                <span className="rank-number">#{index + 1}</span>
                                {index < 3 && <span className="rank-badge">🏆</span>}
                            </div>
                            
                            <div className="product-info">
                                <div className="product-header">
                                    <h4 className="product-name">{product.name}</h4>
                                    <span className="product-sku">{product.sku}</span>
                                </div>
                                
                                <div className="product-meta">
                                    <span className="meta-item">
                                        <span className="meta-label">Categoría:</span>
                                        <span className="meta-value">{product.category}</span>
                                    </span>
                                    <span className="meta-item">
                                        <span className="meta-label">Rating:</span>
                                        <span className="meta-value">
                                            {product.rating}/5 ⭐
                                        </span>
                                    </span>
                                    <span className="meta-item">
                                        <span className="meta-label">Stock:</span>
                                        <span className={`meta-value ${product.stock < 20 ? 'low' : 'good'}`}>
                                            {product.stock} unidades
                                        </span>
                                    </span>
                                </div>
                            </div>
                            
                            <div className="product-stats">
                                <div className="stat-item revenue">
                                    <span className="stat-label">Ingresos</span>
                                    <span className="stat-value">
                                        ${product.revenue.toLocaleString()}
                                    </span>
                                </div>
                                
                                <div className="stat-item sales">
                                    <span className="stat-label">Ventas</span>
                                    <span className="stat-value">{product.sales}</span>
                                </div>
                                
                                <div className="stat-item trend">
                                    <span className="stat-label">Tendencia</span>
                                    <span className={`stat-value ${product.trend}`}>
                                        {product.trend === 'up' ? '↗' : 
                                         product.trend === 'down' ? '↘' : '→'}
                                        {Math.abs(product.growth)}%
                                    </span>
                                </div>
                            </div>
                            
                            <div className="product-actions">
                                <button 
                                    className="action-btn view"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Ver producto:', product);
                                    }}
                                >
                                    👁️
                                </button>
                                <button 
                                    className="action-btn chart"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        console.log('Ver gráfico:', product);
                                    }}
                                >
                                    📈
                                </button>
                            </div>
                        </div>

                        {/* Detalles expandidos */}
                        {expandedProduct === product.id && (
                            <div className="product-details">
                                <div className="details-grid">
                                    <div className="detail-section">
                                        <h5>Rendimiento Financiero</h5>
                                        <div className="detail-item">
                                            <span className="detail-label">Ingresos:</span>
                                            <span className="detail-value">
                                                ${product.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Utilidad:</span>
                                            <span className="detail-value">
                                                ${product.profit.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Margen:</span>
                                            <span className="detail-value">
                                                {((product.profit / product.revenue) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-section">
                                        <h5>Métricas de Ventas</h5>
                                        <div className="detail-item">
                                            <span className="detail-label">Ventas totales:</span>
                                            <span className="detail-value">{product.sales}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Promedio diario:</span>
                                            <span className="detail-value">
                                                {(product.sales / 30).toFixed(1)}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Crecimiento:</span>
                                            <span className={`detail-value ${product.growth >= 0 ? 'positive' : 'negative'}`}>
                                                {product.growth >= 0 ? '+' : ''}{product.growth}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="detail-section">
                                        <h5>Inventario</h5>
                                        <div className="detail-item">
                                            <span className="detail-label">Stock actual:</span>
                                            <span className="detail-value">{product.stock}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Días de inventario:</span>
                                            <span className="detail-value">
                                                {(product.stock / (product.sales / 30)).toFixed(0)} días
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="detail-label">Estado:</span>
                                            <span className={`detail-value ${product.stock > 50 ? 'good' : product.stock > 20 ? 'warning' : 'critical'}`}>
                                                {product.stock > 50 ? 'Óptimo' : 
                                                 product.stock > 20 ? 'Aceptable' : 'Crítico'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="details-actions">
                                    <button className="action-btn primary">
                                        📊 Ver análisis detallado
                                    </button>
                                    <button className="action-btn secondary">
                                        📈 Pronóstico de demanda
                                    </button>
                                    <button className="action-btn tertiary">
                                        📋 Optimizar inventario
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="top-products-footer">
                <div className="footer-info">
                    <span className="info-text">
                        Mostrando {sortedProducts.length} de {productData.length} productos
                    </span>
                </div>
                
                <div className="footer-actions">
                    <button className="footer-btn view-all">
                        📋 Ver todos los productos
                    </button>
                    <button className="footer-btn export">
                        📥 Exportar reporte
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopProducts;