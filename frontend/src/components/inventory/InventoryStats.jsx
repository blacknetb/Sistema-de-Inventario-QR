/**
 * InventoryStats.js
 * Componente de estadísticas del inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryStats.js
 */

import React, { useState, useEffect } from 'react';

const InventoryStats = ({ data, loading }) => {
    const [timeRange, setTimeRange] = useState('month');
    const [selectedMetric, setSelectedMetric] = useState('overview');

    // Calcular estadísticas principales
    const calculateMainStats = () => {
        const totalValue = data.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
        const totalCost = data.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);
        const totalProfit = totalValue - totalCost;
        const totalItems = data.length;
        
        const lowStockItems = data.filter(item => 
            item.currentStock > 0 && item.currentStock < item.minStock
        ).length;
        
        const outOfStockItems = data.filter(item => item.currentStock === 0).length;
        const activeItems = data.filter(item => item.status === 'active').length;
        const averageStock = Math.round(data.reduce((sum, item) => sum + item.currentStock, 0) / totalItems);

        return {
            totalValue,
            totalCost,
            totalProfit,
            totalItems,
            lowStockItems,
            outOfStockItems,
            activeItems,
            averageStock,
            profitMargin: totalValue > 0 ? (totalProfit / totalValue) * 100 : 0
        };
    };

    // Calcular estadísticas por categoría
    const calculateCategoryStats = () => {
        const categories = {};
        
        data.forEach(item => {
            if (!categories[item.category]) {
                categories[item.category] = {
                    count: 0,
                    value: 0,
                    items: []
                };
            }
            
            categories[item.category].count++;
            categories[item.category].value += item.currentStock * item.unitPrice;
            categories[item.category].items.push(item);
        });

        return Object.entries(categories)
            .map(([name, stats]) => ({
                name,
                count: stats.count,
                value: stats.value,
                percentage: (stats.count / data.length) * 100
            }))
            .sort((a, b) => b.value - a.value);
    };

    // Calcular tendencias
    const calculateTrends = () => {
        // En una implementación real, esto vendría del backend
        return {
            valueTrend: 12.5, // % de crecimiento
            stockTrend: 8.2,  // % de crecimiento
            profitTrend: 15.3, // % de crecimiento
            efficiencyTrend: 5.7 // % de mejora
        };
    };

    // Calcular métricas de eficiencia
    const calculateEfficiencyMetrics = () => {
        const stockAccuracy = 95.8; // Porcentaje de precisión del inventario
        const turnoverRate = 4.2;   // Rotación anual del inventario
        const fillRate = 98.5;      // Tasa de cumplimiento de pedidos
        const carryingCost = 22.3;  // Costo de mantenimiento (% del valor)

        return { stockAccuracy, turnoverRate, fillRate, carryingCost };
    };

    const mainStats = calculateMainStats();
    const categoryStats = calculateCategoryStats();
    const trends = calculateTrends();
    const efficiency = calculateEfficiencyMetrics();

    // Estadísticas principales
    const mainStatsCards = [
        {
            id: 'totalValue',
            title: 'Valor Total',
            value: `$${mainStats.totalValue.toLocaleString()}`,
            icon: '💰',
            color: 'blue',
            trend: trends.valueTrend,
            description: 'Valor del inventario actual'
        },
        {
            id: 'totalItems',
            title: 'Productos Totales',
            value: mainStats.totalItems.toLocaleString(),
            icon: '📦',
            color: 'green',
            trend: 3.2,
            description: 'Items en inventario'
        },
        {
            id: 'activeItems',
            title: 'Productos Activos',
            value: mainStats.activeItems.toLocaleString(),
            icon: '✅',
            color: 'teal',
            trend: 2.1,
            description: 'Items disponibles'
        },
        {
            id: 'averageStock',
            title: 'Stock Promedio',
            value: mainStats.averageStock,
            icon: '📊',
            color: 'purple',
            trend: trends.stockTrend,
            description: 'Promedio por producto'
        },
        {
            id: 'lowStock',
            title: 'Stock Bajo',
            value: mainStats.lowStockItems,
            icon: '⚠️',
            color: 'orange',
            trend: -1.5,
            description: 'Necesitan atención'
        },
        {
            id: 'outOfStock',
            title: 'Sin Stock',
            value: mainStats.outOfStockItems,
            icon: '❌',
            color: 'red',
            trend: 0.8,
            description: 'Urgente reabastecer'
        },
        {
            id: 'profitMargin',
            title: 'Margen de Utilidad',
            value: `${mainStats.profitMargin.toFixed(1)}%`,
            icon: '📈',
            color: 'emerald',
            trend: trends.profitTrend,
            description: 'Rentabilidad del inventario'
        },
        {
            id: 'turnoverRate',
            title: 'Rotación',
            value: efficiency.turnoverRate,
            icon: '🔄',
            color: 'indigo',
            trend: trends.efficiencyTrend,
            description: 'Veces por año'
        }
    ];

    // Renderizar tarjeta de estadística
    const renderStatCard = (stat) => {
        const isPositive = stat.trend >= 0;
        
        return (
            <div key={stat.id} className={`stat-card ${stat.color}`}>
                <div className="card-header">
                    <div className="stat-icon">
                        {stat.icon}
                    </div>
                    <div className="stat-trend">
                        <span className={`trend-value ${isPositive ? 'positive' : 'negative'}`}>
                            {isPositive ? '+' : ''}{stat.trend}%
                        </span>
                    </div>
                </div>
                
                <div className="card-body">
                    <h3 className="stat-title">{stat.title}</h3>
                    <p className="stat-value">{stat.value}</p>
                    <p className="stat-description">{stat.description}</p>
                </div>
                
                <div className="card-footer">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ 
                                width: `${Math.min(Math.abs(stat.trend) * 5, 100)}%`,
                                backgroundColor: isPositive ? '#10B981' : '#EF4444'
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        );
    };

    // Renderizar gráfico de categorías
    const renderCategoryChart = () => {
        const totalValue = categoryStats.reduce((sum, cat) => sum + cat.value, 0);
        
        return (
            <div className="category-chart">
                <div className="chart-header">
                    <h4>Distribución por Categoría</h4>
                    <span className="chart-subtitle">Valor total: ${totalValue.toLocaleString()}</span>
                </div>
                
                <div className="chart-bars">
                    {categoryStats.map((category, index) => {
                        const percentage = (category.value / totalValue) * 100;
                        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
                        const color = colors[index % colors.length];
                        
                        return (
                            <div key={category.name} className="category-bar">
                                <div className="bar-info">
                                    <span className="category-name">{category.name}</span>
                                    <span className="category-value">${category.value.toLocaleString()}</span>
                                </div>
                                
                                <div className="bar-container">
                                    <div 
                                        className="bar-fill"
                                        style={{ 
                                            width: `${percentage}%`,
                                            backgroundColor: color
                                        }}
                                    ></div>
                                </div>
                                
                                <div className="bar-footer">
                                    <span className="category-count">{category.count} productos</span>
                                    <span className="category-percentage">{percentage.toFixed(1)}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Renderizar métricas de eficiencia
    const renderEfficiencyMetrics = () => {
        const efficiencyMetrics = [
            {
                id: 'stockAccuracy',
                title: 'Precisión de Inventario',
                value: `${efficiency.stockAccuracy}%`,
                icon: '🎯',
                color: '#3B82F6',
                target: 98,
                status: efficiency.stockAccuracy >= 98 ? 'excellent' : efficiency.stockAccuracy >= 95 ? 'good' : 'warning'
            },
            {
                id: 'fillRate',
                title: 'Tasa de Cumplimiento',
                value: `${efficiency.fillRate}%`,
                icon: '✅',
                color: '#10B981',
                target: 97,
                status: efficiency.fillRate >= 97 ? 'excellent' : efficiency.fillRate >= 94 ? 'good' : 'warning'
            },
            {
                id: 'carryingCost',
                title: 'Costo de Mantenimiento',
                value: `${efficiency.carryingCost}%`,
                icon: '💰',
                color: '#F59E0B',
                target: 20,
                status: efficiency.carryingCost <= 20 ? 'excellent' : efficiency.carryingCost <= 25 ? 'good' : 'warning'
            }
        ];

        return (
            <div className="efficiency-metrics">
                <div className="metrics-header">
                    <h4>Métricas de Eficiencia</h4>
                    <select 
                        className="time-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="week">Esta semana</option>
                        <option value="month">Este mes</option>
                        <option value="quarter">Este trimestre</option>
                        <option value="year">Este año</option>
                    </select>
                </div>
                
                <div className="metrics-grid">
                    {efficiencyMetrics.map(metric => (
                        <div key={metric.id} className={`efficiency-card ${metric.status}`}>
                            <div className="metric-header">
                                <div 
                                    className="metric-icon"
                                    style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                                >
                                    {metric.icon}
                                </div>
                                <span className="metric-target">Objetivo: {metric.target}%</span>
                            </div>
                            
                            <div className="metric-body">
                                <h5 className="metric-title">{metric.title}</h5>
                                <p className="metric-value">{metric.value}</p>
                            </div>
                            
                            <div className="metric-footer">
                                <div className="metric-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${(parseFloat(metric.value) / metric.target) * 100}%`,
                                                backgroundColor: metric.color
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-text">
                                        {metric.status === 'excellent' ? 'Excelente' : 
                                         metric.status === 'good' ? 'Bueno' : 'Necesita mejorar'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="stats-loading">
                <div className="loading-spinner"></div>
                <p>Cargando estadísticas...</p>
            </div>
        );
    }

    return (
        <div className="inventory-stats">
            <div className="stats-header">
                <h3 className="stats-title">
                    Estadísticas del Inventario
                    <span className="stats-subtitle">
                        Resumen completo del estado del inventario
                    </span>
                </h3>
                
                <div className="stats-controls">
                    <div className="metric-selector">
                        <button 
                            className={`metric-btn ${selectedMetric === 'overview' ? 'active' : ''}`}
                            onClick={() => setSelectedMetric('overview')}
                        >
                            📊 Resumen
                        </button>
                        <button 
                            className={`metric-btn ${selectedMetric === 'categories' ? 'active' : ''}`}
                            onClick={() => setSelectedMetric('categories')}
                        >
                            📂 Categorías
                        </button>
                        <button 
                            className={`metric-btn ${selectedMetric === 'efficiency' ? 'active' : ''}`}
                            onClick={() => setSelectedMetric('efficiency')}
                        >
                            ⚡ Eficiencia
                        </button>
                    </div>
                </div>
            </div>

            {selectedMetric === 'overview' && (
                <>
                    <div className="main-stats-grid">
                        {mainStatsCards.map(renderStatCard)}
                    </div>
                    
                    <div className="quick-insights">
                        <h4 className="insights-title">💡 Información Rápida</h4>
                        <div className="insights-grid">
                            <div className="insight-card">
                                <div className="insight-icon">💰</div>
                                <div className="insight-content">
                                    <p className="insight-text">
                                        El valor total del inventario es <strong>${mainStats.totalValue.toLocaleString()}</strong>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="insight-card">
                                <div className="insight-icon">⚠️</div>
                                <div className="insight-content">
                                    <p className="insight-text">
                                        <strong>{mainStats.lowStockItems} productos</strong> tienen stock bajo y necesitan atención
                                    </p>
                                </div>
                            </div>
                            
                            <div className="insight-card">
                                <div className="insight-icon">📈</div>
                                <div className="insight-content">
                                    <p className="insight-text">
                                        El margen de utilidad es del <strong>{mainStats.profitMargin.toFixed(1)}%</strong>
                                    </p>
                                </div>
                            </div>
                            
                            <div className="insight-card">
                                <div className="insight-icon">🔄</div>
                                <div className="insight-content">
                                    <p className="insight-text">
                                        La rotación del inventario es de <strong>{efficiency.turnoverRate}</strong> veces por año
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {selectedMetric === 'categories' && renderCategoryChart()}
            
            {selectedMetric === 'efficiency' && renderEfficiencyMetrics()}

            <div className="stats-footer">
                <div className="footer-info">
                    <div className="info-item">
                        <span className="info-label">Última actualización:</span>
                        <span className="info-value">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Próxima auditoría:</span>
                        <span className="info-value">15 días</span>
                    </div>
                </div>
                
                <div className="footer-actions">
                    <button className="footer-btn">
                        📥 Exportar reporte
                    </button>
                    <button className="footer-btn">
                        📊 Ver análisis completo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryStats;