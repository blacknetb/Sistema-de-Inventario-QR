/**
 * SalesChart.js
 * Gráfico de tendencias de ventas
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\SalesChart.js
 */

import React, { useState, useRef, useEffect } from 'react';
import './SalesChart.css';

const SalesChart = ({ data, loading }) => {
    const [timeRange, setTimeRange] = useState('week');
    const [hoveredPoint, setHoveredPoint] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState('sales');
    const chartRef = useRef(null);
    const tooltipRef = useRef(null);

    // Datos de ejemplo
    const sampleData = {
        week: [
            { day: 'Lun', sales: 12000, orders: 45, avgTicket: 266.67 },
            { day: 'Mar', sales: 18000, orders: 60, avgTicket: 300.00 },
            { day: 'Mié', sales: 15000, orders: 50, avgTicket: 300.00 },
            { day: 'Jue', sales: 22000, orders: 70, avgTicket: 314.29 },
            { day: 'Vie', sales: 25000, orders: 75, avgTicket: 333.33 },
            { day: 'Sáb', sales: 30000, orders: 85, avgTicket: 352.94 },
            { day: 'Dom', sales: 28000, orders: 80, avgTicket: 350.00 }
        ],
        month: Array.from({ length: 30 }, (_, i) => ({
            day: `Día ${i + 1}`,
            sales: Math.floor(Math.random() * 30000) + 10000,
            orders: Math.floor(Math.random() * 100) + 30,
            avgTicket: Math.floor(Math.random() * 200) + 200
        })),
        year: [
            { month: 'Ene', sales: 320000, orders: 1200 },
            { month: 'Feb', sales: 280000, orders: 1100 },
            { month: 'Mar', sales: 350000, orders: 1300 },
            { month: 'Abr', sales: 380000, orders: 1400 },
            { month: 'May', sales: 420000, orders: 1500 },
            { month: 'Jun', sales: 450000, orders: 1600 },
            { month: 'Jul', sales: 480000, orders: 1700 },
            { month: 'Ago', sales: 520000, orders: 1800 },
            { month: 'Sep', sales: 550000, orders: 1900 },
            { month: 'Oct', sales: 580000, orders: 2000 },
            { month: 'Nov', sales: 620000, orders: 2100 },
            { month: 'Dic', sales: 680000, orders: 2200 }
        ]
    };

    // Usar datos proporcionados o datos de ejemplo
    const chartData = data && data.length > 0 ? data : sampleData[timeRange];

    // Calcular estadísticas
    const calculateStats = () => {
        if (!chartData || chartData.length === 0) return {};
        
        const values = chartData.map(d => d[selectedMetric]);
        const total = values.reduce((a, b) => a + b, 0);
        const average = total / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const lastValue = values[values.length - 1];
        const firstValue = values[0];
        const growth = ((lastValue - firstValue) / firstValue) * 100;

        return { total, average, max, min, growth };
    };

    const stats = calculateStats();

    // Renderizar gráfico de líneas
    const renderLineChart = () => {
        const width = 600;
        const height = 250;
        const padding = { top: 20, right: 30, bottom: 40, left: 60 };
        
        const innerWidth = width - padding.left - padding.right;
        const innerHeight = height - padding.top - padding.bottom;

        const values = chartData.map(d => d[selectedMetric]);
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);

        // Escala X
        const xScale = (index) => 
            padding.left + (index * innerWidth) / (chartData.length - 1);

        // Escala Y
        const yScale = (value) => 
            padding.top + innerHeight - ((value - minValue) / (maxValue - minValue)) * innerHeight;

        // Puntos del gráfico
        const points = values.map((value, index) => ({
            x: xScale(index),
            y: yScale(value),
            value,
            label: chartData[index].day || chartData[index].month
        }));

        // Crear línea SVG
        const linePath = points.map((point, i) => 
            `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
        ).join(' ');

        // Manejar hover en puntos
        const handlePointHover = (point, event) => {
            setHoveredPoint(point);
            
            if (tooltipRef.current && chartRef.current) {
                const chartRect = chartRef.current.getBoundingClientRect();
                tooltipRef.current.style.left = `${event.clientX - chartRect.left + 10}px`;
                tooltipRef.current.style.top = `${event.clientY - chartRect.top - 50}px`;
            }
        };

        return (
            <div className="line-chart-container" ref={chartRef}>
                <svg width={width} height={height} className="line-chart-svg">
                    {/* Eje X */}
                    <line 
                        x1={padding.left}
                        y1={padding.top + innerHeight}
                        x2={padding.left + innerWidth}
                        y2={padding.top + innerHeight}
                        stroke="#e2e8f0"
                        strokeWidth="2"
                    />
                    
                    {/* Eje Y */}
                    <line 
                        x1={padding.left}
                        y1={padding.top}
                        x2={padding.left}
                        y2={padding.top + innerHeight}
                        stroke="#e2e8f0"
                        strokeWidth="2"
                    />
                    
                    {/* Línea del gráfico */}
                    <path 
                        d={linePath}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="3"
                        className="chart-line"
                    />
                    
                    {/* Área bajo la línea */}
                    <path 
                        d={`${linePath} L ${points[points.length - 1].x} ${padding.top + innerHeight} L ${points[0].x} ${padding.top + innerHeight} Z`}
                        fill="url(#areaGradient)"
                        fillOpacity="0.2"
                    />
                    
                    {/* Gradiente para el área */}
                    <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>
                    
                    {/* Puntos del gráfico */}
                    {points.map((point, index) => (
                        <circle
                            key={index}
                            cx={point.x}
                            cy={point.y}
                            r="4"
                            fill="#3B82F6"
                            className="chart-point"
                            onMouseEnter={(e) => handlePointHover(point, e)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    ))}
                    
                    {/* Etiquetas del eje X */}
                    {chartData.map((item, index) => (
                        <text
                            key={index}
                            x={xScale(index)}
                            y={height - 10}
                            textAnchor="middle"
                            fontSize="10"
                            fill="#64748b"
                            className="axis-label"
                        >
                            {item.day || item.month}
                        </text>
                    ))}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div ref={tooltipRef} className="chart-tooltip">
                        <div className="tooltip-header">
                            <strong>{hoveredPoint.label}</strong>
                        </div>
                        <div className="tooltip-content">
                            <span className="metric-label">
                                {selectedMetric === 'sales' ? 'Ventas:' : 
                                 selectedMetric === 'orders' ? 'Pedidos:' : 'Ticket Promedio:'}
                            </span>
                            <span className="metric-value">
                                {selectedMetric === 'sales' ? `$${hoveredPoint.value.toLocaleString()}` : 
                                 selectedMetric === 'orders' ? hoveredPoint.value : 
                                 `$${hoveredPoint.value.toFixed(2)}`}
                            </span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Renderizar métricas
    const renderMetrics = () => (
        <div className="sales-metrics">
            <div className="metric-card total">
                <div className="metric-icon">💰</div>
                <div className="metric-content">
                    <span className="metric-label">Total</span>
                    <span className="metric-value">
                        {selectedMetric === 'sales' ? `$${stats.total?.toLocaleString()}` : 
                         selectedMetric === 'orders' ? stats.total?.toLocaleString() : 
                         `$${stats.average?.toFixed(2)}`}
                    </span>
                </div>
            </div>
            
            <div className="metric-card average">
                <div className="metric-icon">📊</div>
                <div className="metric-content">
                    <span className="metric-label">Promedio</span>
                    <span className="metric-value">
                        {selectedMetric === 'sales' ? `$${stats.average?.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 
                         selectedMetric === 'orders' ? stats.average?.toFixed(0) : 
                         `$${stats.average?.toFixed(2)}`}
                    </span>
                </div>
            </div>
            
            <div className="metric-card growth">
                <div className="metric-icon">
                    {stats.growth >= 0 ? '📈' : '📉'}
                </div>
                <div className="metric-content">
                    <span className="metric-label">Crecimiento</span>
                    <span className={`metric-value ${stats.growth >= 0 ? 'positive' : 'negative'}`}>
                        {stats.growth?.toFixed(1)}%
                    </span>
                </div>
            </div>
            
            <div className="metric-card peak">
                <div className="metric-icon">🏆</div>
                <div className="metric-content">
                    <span className="metric-label">Pico</span>
                    <span className="metric-value">
                        {selectedMetric === 'sales' ? `$${stats.max?.toLocaleString()}` : 
                         selectedMetric === 'orders' ? stats.max : 
                         `$${stats.max?.toFixed(2)}`}
                    </span>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="chart-loading">
                <div className="loading-spinner"></div>
                <p>Cargando gráfico de ventas...</p>
            </div>
        );
    }

    return (
        <div className="sales-chart">
            <div className="chart-header">
                <div className="header-left">
                    <h3 className="chart-title">
                        Tendencias de Ventas
                        <span className="chart-subtitle">
                            Análisis de rendimiento
                        </span>
                    </h3>
                </div>
                
                <div className="header-right">
                    <div className="metric-selector">
                        <button 
                            className={`metric-btn ${selectedMetric === 'sales' ? 'active' : ''}`}
                            onClick={() => setSelectedMetric('sales')}
                        >
                            💰 Ventas
                        </button>
                        <button 
                            className={`metric-btn ${selectedMetric === 'orders' ? 'active' : ''}`}
                            onClick={() => setSelectedMetric('orders')}
                        >
                            📦 Pedidos
                        </button>
                        <button 
                            className={`metric-btn ${selectedMetric === 'avgTicket' ? 'active' : ''}`}
                            onClick={() => setSelectedMetric('avgTicket')}
                        >
                            🎫 Ticket Promedio
                        </button>
                    </div>
                    
                    <div className="range-selector">
                        <button 
                            className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
                            onClick={() => setTimeRange('week')}
                        >
                            Semana
                        </button>
                        <button 
                            className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
                            onClick={() => setTimeRange('month')}
                        >
                            Mes
                        </button>
                        <button 
                            className={`range-btn ${timeRange === 'year' ? 'active' : ''}`}
                            onClick={() => setTimeRange('year')}
                        >
                            Año
                        </button>
                    </div>
                </div>
            </div>

            <div className="chart-content">
                {renderLineChart()}
                {renderMetrics()}
            </div>

            <div className="chart-footer">
                <div className="footer-stats">
                    <div className="stat-item">
                        <span className="stat-label">Período actual:</span>
                        <span className="stat-value">
                            {timeRange === 'week' ? 'Esta semana' : 
                             timeRange === 'month' ? 'Este mes' : 'Este año'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Tendencia:</span>
                        <span className={`stat-value ${stats.growth >= 0 ? 'positive' : 'negative'}`}>
                            {stats.growth >= 0 ? 'Alcista ↗' : 'Bajista ↘'}
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Proyección:</span>
                        <span className="stat-value">
                            {stats.growth >= 0 ? 'Positiva' : 'Cautelosa'}
                        </span>
                    </div>
                </div>
                
                <div className="footer-actions">
                    <button className="action-btn compare">
                        📊 Comparar períodos
                    </button>
                    <button className="action-btn forecast">
                        🔮 Pronóstico
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SalesChart;