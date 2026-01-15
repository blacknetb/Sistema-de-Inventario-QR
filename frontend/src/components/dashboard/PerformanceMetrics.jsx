/**
 * PerformanceMetrics.js
 * Componente de métricas de rendimiento
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\dashboard\PerformanceMetrics.js
 */

import React, { useState, useEffect } from 'react';
import './PerformanceMetrics.css';

const PerformanceMetrics = ({ metrics, loading }) => {
    const [timeRange, setTimeRange] = useState('month');
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [trendData, setTrendData] = useState([]);

    // Datos de ejemplo
    const sampleMetrics = {
        salesGrowth: 12.5,
        profitMargin: 25.8,
        inventoryTurnover: 4.2,
        customerSatisfaction: 4.5,
        orderFulfillmentRate: 96.7,
        stockAccuracy: 98.2,
        supplierPerformance: 4.3,
        employeeProductivity: 87.5
    };

    const metricData = metrics && Object.keys(metrics).length > 0 ? metrics : sampleMetrics;

    // Definir métricas con detalles
    const metricsList = [
        {
            key: 'salesGrowth',
            title: 'Crecimiento de Ventas',
            value: metricData.salesGrowth || 0,
            unit: '%',
            target: 15,
            trend: metricData.salesGrowth > 10 ? 'up' : metricData.salesGrowth < 0 ? 'down' : 'stable',
            description: 'Incremento porcentual en ventas vs período anterior',
            icon: '📈',
            color: '#3B82F6'
        },
        {
            key: 'profitMargin',
            title: 'Margen de Utilidad',
            value: metricData.profitMargin || 0,
            unit: '%',
            target: 20,
            trend: metricData.profitMargin > 20 ? 'up' : metricData.profitMargin < 15 ? 'down' : 'stable',
            description: 'Porcentaje de utilidad sobre ventas totales',
            icon: '💰',
            color: '#10B981'
        },
        {
            key: 'inventoryTurnover',
            title: 'Rotación de Inventario',
            value: metricData.inventoryTurnover || 0,
            unit: 'x',
            target: 4,
            trend: metricData.inventoryTurnover > 4 ? 'up' : metricData.inventoryTurnover < 3 ? 'down' : 'stable',
            description: 'Veces que el inventario se vende en un período',
            icon: '🔄',
            color: '#F59E0B'
        },
        {
            key: 'customerSatisfaction',
            title: 'Satisfacción del Cliente',
            value: metricData.customerSatisfaction || 0,
            unit: '/5',
            target: 4.5,
            trend: metricData.customerSatisfaction > 4.5 ? 'up' : metricData.customerSatisfaction < 4 ? 'down' : 'stable',
            description: 'Calificación promedio de satisfacción',
            icon: '⭐',
            color: '#8B5CF6'
        },
        {
            key: 'orderFulfillmentRate',
            title: 'Tasa de Cumplimiento',
            value: metricData.orderFulfillmentRate || 0,
            unit: '%',
            target: 95,
            trend: metricData.orderFulfillmentRate > 95 ? 'up' : metricData.orderFulfillmentRate < 90 ? 'down' : 'stable',
            description: 'Órdenes completadas sin errores',
            icon: '✅',
            color: '#14B8A6'
        },
        {
            key: 'stockAccuracy',
            title: 'Precisión de Inventario',
            value: metricData.stockAccuracy || 0,
            unit: '%',
            target: 98,
            trend: metricData.stockAccuracy > 98 ? 'up' : metricData.stockAccuracy < 95 ? 'down' : 'stable',
            description: 'Concordancia entre sistema y físico',
            icon: '🎯',
            color: '#06B6D4'
        }
    ];

    // Datos de tendencia
    useEffect(() => {
        const generateTrendData = () => {
            const trends = [];
            for (let i = 0; i < 12; i++) {
                trends.push({
                    month: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][i],
                    value: Math.random() * 20 + 80
                });
            }
            setTrendData(trends);
        };
        
        generateTrendData();
    }, [timeRange]);

    // Calcular estado de la métrica
    const getMetricStatus = (metric) => {
        const percentage = (metric.value / metric.target) * 100;
        if (percentage >= 110) return 'excellent';
        if (percentage >= 90) return 'good';
        if (percentage >= 70) return 'warning';
        return 'critical';
    };

    // Obtener color del estado
    const getStatusColor = (status) => {
        const colors = {
            excellent: '#10B981',
            good: '#3B82F6',
            warning: '#F59E0B',
            critical: '#EF4444'
        };
        return colors[status] || '#6B7280';
    };

    // Obtener ícono de tendencia
    const getTrendIcon = (trend) => {
        const icons = {
            up: '↗',
            down: '↘',
            stable: '→'
        };
        return icons[trend] || '→';
    };

    // Calcular KPI general
    const calculateOverallKPI = () => {
        const weights = {
            salesGrowth: 0.25,
            profitMargin: 0.25,
            inventoryTurnover: 0.15,
            customerSatisfaction: 0.15,
            orderFulfillmentRate: 0.10,
            stockAccuracy: 0.10
        };

        let total = 0;
        let weightedSum = 0;

        metricsList.forEach(metric => {
            const percentage = (metric.value / metric.target) * 100;
            const score = Math.min(percentage, 100);
            weightedSum += score * (weights[metric.key] || 0);
            total += weights[metric.key] || 0;
        });

        return total > 0 ? (weightedSum / total) : 0;
    };

    const overallKPI = calculateOverallKPI();

    if (loading) {
        return (
            <div className="metrics-loading">
                <div className="loading-spinner"></div>
                <p>Cargando métricas...</p>
            </div>
        );
    }

    return (
        <div className="performance-metrics">
            <div className="metrics-header">
                <div className="header-left">
                    <h3 className="metrics-title">
                        Métricas de Rendimiento
                        <span className="metrics-subtitle">
                            KPIs clave del negocio
                        </span>
                    </h3>
                </div>
                
                <div className="header-right">
                    <div className="kpi-overall">
                        <div className="kpi-score">
                            <span className="kpi-value">{overallKPI.toFixed(1)}</span>
                            <span className="kpi-label">KPI General</span>
                        </div>
                        <div className="kpi-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ 
                                        width: `${overallKPI}%`,
                                        backgroundColor: overallKPI >= 90 ? '#10B981' : 
                                                       overallKPI >= 70 ? '#3B82F6' : 
                                                       overallKPI >= 50 ? '#F59E0B' : '#EF4444'
                                    }}
                                ></div>
                            </div>
                            <span className="progress-text">
                                {overallKPI >= 90 ? 'Excelente' : 
                                 overallKPI >= 70 ? 'Bueno' : 
                                 overallKPI >= 50 ? 'Aceptable' : 'Necesita mejorar'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid de métricas */}
            <div className="metrics-grid">
                {metricsList.map(metric => {
                    const status = getMetricStatus(metric);
                    const statusColor = getStatusColor(status);
                    
                    return (
                        <div 
                            key={metric.key}
                            className={`metric-card ${status}`}
                            onClick={() => setSelectedMetric(selectedMetric === metric.key ? null : metric.key)}
                        >
                            <div className="card-header">
                                <div 
                                    className="metric-icon"
                                    style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
                                >
                                    {metric.icon}
                                </div>
                                
                                <div className="metric-trend">
                                    <span className={`trend-indicator ${metric.trend}`}>
                                        {getTrendIcon(metric.trend)}
                                    </span>
                                </div>
                            </div>
                            
                            <div className="card-body">
                                <h4 className="metric-title">{metric.title}</h4>
                                <div className="metric-value-wrapper">
                                    <span className="metric-value">
                                        {metric.value.toFixed(1)}
                                        <span className="metric-unit">{metric.unit}</span>
                                    </span>
                                    <span className="metric-target">
                                        Objetivo: {metric.target}{metric.unit}
                                    </span>
                                </div>
                                
                                <div className="metric-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: `${Math.min((metric.value / metric.target) * 100, 100)}%`,
                                                backgroundColor: statusColor
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-percentage">
                                        {((metric.value / metric.target) * 100).toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            
                            <div className="card-footer">
                                <span className="metric-status" style={{ color: statusColor }}>
                                    {status === 'excellent' ? 'Excelente' :
                                     status === 'good' ? 'Bueno' :
                                     status === 'warning' ? 'Aceptable' : 'Crítico'}
                                </span>
                                <span className="metric-description">
                                    {metric.description}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Gráfico de tendencia */}
            <div className="trend-chart">
                <div className="chart-header">
                    <h4 className="chart-title">Tendencia del KPI General</h4>
                    <select 
                        className="trend-select"
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                    >
                        <option value="month">Últimos 12 meses</option>
                        <option value="quarter">Últimos 4 trimestres</option>
                        <option value="year">Últimos 5 años</option>
                    </select>
                </div>
                
                <div className="chart-content">
                    <div className="trend-line">
                        {trendData.map((point, index) => {
                            const height = (point.value / 100) * 60;
                            const isPeak = point.value === Math.max(...trendData.map(p => p.value));
                            
                            return (
                                <div 
                                    key={index}
                                    className="trend-point"
                                    style={{ height: `${height}%` }}
                                >
                                    <div 
                                        className={`point-value ${isPeak ? 'peak' : ''}`}
                                        style={{ 
                                            backgroundColor: point.value >= 90 ? '#10B981' : 
                                                          point.value >= 70 ? '#3B82F6' : 
                                                          point.value >= 50 ? '#F59E0B' : '#EF4444'
                                        }}
                                    >
                                        {point.value.toFixed(0)}
                                    </div>
                                    <div className="point-label">{point.month}</div>
                                </div>
                            );
                        })}
                    </div>
                    
                    <div className="trend-info">
                        <div className="info-item">
                            <span className="info-label">Punto más alto:</span>
                            <span className="info-value">
                                {Math.max(...trendData.map(p => p.value)).toFixed(1)}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Punto más bajo:</span>
                            <span className="info-value">
                                {Math.min(...trendData.map(p => p.value)).toFixed(1)}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Promedio:</span>
                            <span className="info-value">
                                {(trendData.reduce((a, b) => a + b.value, 0) / trendData.length).toFixed(1)}
                            </span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Tendencia:</span>
                            <span className="info-value positive">
                                {((trendData[trendData.length - 1].value - trendData[0].value) / trendData[0].value * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recomendaciones */}
            <div className="recommendations">
                <h4 className="recommendations-title">
                    <span className="recommendations-icon">💡</span>
                    Recomendaciones Basadas en KPIs
                </h4>
                
                <div className="recommendations-list">
                    {metricsList
                        .filter(metric => getMetricStatus(metric) === 'critical' || getMetricStatus(metric) === 'warning')
                        .map(metric => (
                            <div key={metric.key} className="recommendation-item">
                                <div className="recommendation-header">
                                    <span className="recommendation-metric">{metric.title}</span>
                                    <span className="recommendation-priority">
                                        {getMetricStatus(metric) === 'critical' ? 'Alta' : 'Media'}
                                    </span>
                                </div>
                                <p className="recommendation-text">
                                    {metric.value < metric.target 
                                        ? `El valor actual (${metric.value}${metric.unit}) está por debajo del objetivo (${metric.target}${metric.unit}). Considera implementar medidas para mejorarlo.`
                                        : `El valor actual (${metric.value}${metric.unit}) está cerca del objetivo (${metric.target}${metric.unit}). Mantén el buen trabajo.`}
                                </p>
                                <button className="recommendation-action">
                                    Ver plan de acción →
                                </button>
                            </div>
                        ))}
                    
                    {metricsList.filter(m => getMetricStatus(m) === 'critical' || getMetricStatus(m) === 'warning').length === 0 && (
                        <div className="all-good">
                            <span className="all-good-icon">🎉</span>
                            <p className="all-good-text">
                                ¡Excelente! Todas las métricas están en niveles óptimos.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="metrics-footer">
                <div className="footer-info">
                    <span className="info-text">
                        <strong>Nota:</strong> KPIs actualizados en tiempo real
                    </span>
                </div>
                
                <div className="footer-actions">
                    <button className="footer-btn compare">
                        📊 Comparar con competencia
                    </button>
                    <button className="footer-btn report">
                        📥 Descargar reporte KPI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PerformanceMetrics;