/**
 * InventoryChart.js
 * Gráfico de distribución de inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\InventoryChart.js
 */

import React, { useState } from 'react';
import './InventoryChart.css';

const InventoryChart = ({ data, loading }) => {
    const [chartType, setChartType] = useState('pie');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Datos de ejemplo si no hay datos
    const chartData = data && data.length > 0 ? data : [
        { category: 'Electrónicos', count: 320, color: '#3B82F6' },
        { category: 'Ropa', count: 450, color: '#10B981' },
        { category: 'Alimentos', count: 280, color: '#F59E0B' },
        { category: 'Hogar', count: 195, color: '#8B5CF6' },
        { category: 'Deportes', count: 120, color: '#EF4444' },
        { category: 'Juguetes', count: 85, color: '#06B6D4' }
    ];

    // Calcular total
    const total = chartData.reduce((sum, item) => sum + item.count, 0);

    // Calcular porcentajes
    const dataWithPercentages = chartData.map(item => ({
        ...item,
        percentage: ((item.count / total) * 100).toFixed(1)
    }));

    // Manejar clic en categoría
    const handleCategoryClick = (category) => {
        setSelectedCategory(category === selectedCategory ? null : category);
    };

    // Renderizar gráfico circular
    const renderPieChart = () => {
        let cumulativePercent = 0;

        return (
            <div className="pie-chart">
                <svg viewBox="0 0 100 100" className="pie-svg">
                    {dataWithPercentages.map((item, index) => {
                        const percent = (item.count / total) * 100;
                        const startPercent = cumulativePercent;
                        cumulativePercent += percent;

                        const startAngle = (startPercent / 100) * 360;
                        const endAngle = (cumulativePercent / 100) * 360;

                        // Coordenadas para arco SVG
                        const x1 = 50 + 40 * Math.cos((startAngle - 90) * (Math.PI / 180));
                        const y1 = 50 + 40 * Math.sin((startAngle - 90) * (Math.PI / 180));
                        const x2 = 50 + 40 * Math.cos((endAngle - 90) * (Math.PI / 180));
                        const y2 = 50 + 40 * Math.sin((endAngle - 90) * (Math.PI / 180));

                        const largeArcFlag = percent > 50 ? 1 : 0;

                        const pathData = [
                            `M 50 50`,
                            `L ${x1} ${y1}`,
                            `A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                            `L 50 50`
                        ].join(' ');

                        return (
                            <path
                                key={index}
                                d={pathData}
                                fill={item.color}
                                className={`pie-slice ${selectedCategory === item.category ? 'selected' : ''}`}
                                onClick={() => handleCategoryClick(item.category)}
                                onMouseEnter={() => handleCategoryClick(item.category)}
                                onMouseLeave={() => selectedCategory === item.category && handleCategoryClick(null)}
                            >
                                <title>{item.category}: {item.count} productos ({item.percentage}%)</title>
                            </path>
                        );
                    })}
                    
                    {/* Centro del gráfico */}
                    <circle cx="50" cy="50" r="20" fill="white" />
                    <text x="50" y="50" textAnchor="middle" dy=".3em" className="pie-center-text">
                        Total
                    </text>
                    <text x="50" y="60" textAnchor="middle" dy=".3em" className="pie-center-value">
                        {total}
                    </text>
                </svg>
            </div>
        );
    };

    // Renderizar gráfico de barras
    const renderBarChart = () => {
        const maxCount = Math.max(...chartData.map(item => item.count));
        
        return (
            <div className="bar-chart">
                {chartData.map((item, index) => {
                    const height = (item.count / maxCount) * 100;
                    
                    return (
                        <div 
                            key={index}
                            className="bar-container"
                            onClick={() => handleCategoryClick(item.category)}
                            onMouseEnter={() => handleCategoryClick(item.category)}
                            onMouseLeave={() => selectedCategory === item.category && handleCategoryClick(null)}
                        >
                            <div 
                                className={`bar ${selectedCategory === item.category ? 'selected' : ''}`}
                                style={{
                                    height: `${height}%`,
                                    backgroundColor: item.color,
                                    width: '100%'
                                }}
                            >
                                <div className="bar-value">{item.count}</div>
                            </div>
                            <div className="bar-label">{item.category}</div>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Renderizar leyenda
    const renderLegend = () => (
        <div className="chart-legend">
            {dataWithPercentages.map((item, index) => (
                <div 
                    key={index}
                    className={`legend-item ${selectedCategory === item.category ? 'selected' : ''}`}
                    onClick={() => handleCategoryClick(item.category)}
                >
                    <div 
                        className="legend-color"
                        style={{ backgroundColor: item.color }}
                    ></div>
                    <div className="legend-info">
                        <span className="legend-category">{item.category}</span>
                        <span className="legend-stats">
                            {item.count} productos ({item.percentage}%)
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );

    if (loading) {
        return (
            <div className="chart-loading">
                <div className="loading-spinner"></div>
                <p>Cargando gráfico...</p>
            </div>
        );
    }

    return (
        <div className="inventory-chart">
            <div className="chart-header">
                <h3 className="chart-title">
                    Distribución de Inventario
                    <span className="chart-subtitle">
                        {total} productos en total
                    </span>
                </h3>
                
                <div className="chart-controls">
                    <button 
                        className={`chart-type-btn ${chartType === 'pie' ? 'active' : ''}`}
                        onClick={() => setChartType('pie')}
                    >
                        🥧 Circular
                    </button>
                    <button 
                        className={`chart-type-btn ${chartType === 'bar' ? 'active' : ''}`}
                        onClick={() => setChartType('bar')}
                    >
                        📊 Barras
                    </button>
                </div>
            </div>

            <div className="chart-content">
                <div className="chart-visualization">
                    {chartType === 'pie' ? renderPieChart() : renderBarChart()}
                </div>

                {renderLegend()}
            </div>

            {/* Información detallada de categoría seleccionada */}
            {selectedCategory && (
                <div className="category-detail">
                    <div className="detail-header">
                        <h4>{selectedCategory}</h4>
                        <button 
                            className="close-detail"
                            onClick={() => setSelectedCategory(null)}
                        >
                            ×
                        </button>
                    </div>
                    
                    <div className="detail-content">
                        {(() => {
                            const categoryData = chartData.find(item => item.category === selectedCategory);
                            if (!categoryData) return null;
                            
                            return (
                                <>
                                    <div className="detail-stat">
                                        <span className="stat-label">Productos:</span>
                                        <span className="stat-value">{categoryData.count}</span>
                                    </div>
                                    <div className="detail-stat">
                                        <span className="stat-label">Porcentaje:</span>
                                        <span className="stat-value">{((categoryData.count / total) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="detail-stat">
                                        <span className="stat-label">Valor estimado:</span>
                                        <span className="stat-value">
                                            ${(categoryData.count * 150).toLocaleString()}
                                        </span>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

            <div className="chart-footer">
                <div className="footer-info">
                    <span className="info-label">Actualizado:</span>
                    <span className="info-value">{new Date().toLocaleTimeString()}</span>
                </div>
                <button className="footer-action">
                    📥 Exportar datos
                </button>
            </div>
        </div>
    );
};

export default InventoryChart;