/**
 * InventoryReports.js
 * Componente de reportes del inventario
 * Ubicación: E:\portafolio de desarrollo web\app web\proyectos basicos\inventarios basicos\frontend\src\components\inventory\InventoryReports.js
 */

import React, { useState, useEffect } from 'react';

const InventoryReports = ({ data, selectedItems }) => {
    const [reportType, setReportType] = useState('stock_status');
    const [dateRange, setDateRange] = useState('month');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showReport, setShowReport] = useState(false);

    // Tipos de reportes disponibles
    const reportTypes = [
        { 
            id: 'stock_status', 
            label: 'Estado de Stock', 
            icon: '📊',
            description: 'Reporte detallado del estado actual del inventario'
        },
        { 
            id: 'movement', 
            label: 'Movimiento de Inventario', 
            icon: '🔄',
            description: 'Entradas, salidas y ajustes del período'
        },
        { 
            id: 'valuation', 
            label: 'Valuación', 
            icon: '💰',
            description: 'Valoración del inventario por categoría'
        },
        { 
            id: 'aging', 
            label: 'Antigüedad', 
            icon: '📅',
            description: 'Productos por tiempo en inventario'
        },
        { 
            id: 'performance', 
            label: 'Rendimiento', 
            icon: '📈',
            description: 'Métricas de rendimiento del inventario'
        },
        { 
            id: 'custom', 
            label: 'Personalizado', 
            icon: '⚙️',
            description: 'Crear reporte personalizado'
        }
    ];

    // Rangos de fecha
    const dateRanges = [
        { id: 'today', label: 'Hoy' },
        { id: 'week', label: 'Esta semana' },
        { id: 'month', label: 'Este mes' },
        { id: 'quarter', label: 'Este trimestre' },
        { id: 'year', label: 'Este año' },
        { id: 'custom', label: 'Personalizado' }
    ];

    // Generar datos de reporte
    useEffect(() => {
        if (showReport) {
            generateReportData();
        }
    }, [reportType, dateRange, showReport, data]);

    const generateReportData = () => {
        setLoading(true);
        
        // Simular generación de reporte
        setTimeout(() => {
            let generatedData = null;
            
            switch (reportType) {
                case 'stock_status':
                    generatedData = generateStockStatusReport();
                    break;
                case 'valuation':
                    generatedData = generateValuationReport();
                    break;
                case 'performance':
                    generatedData = generatePerformanceReport();
                    break;
                default:
                    generatedData = generateDefaultReport();
            }
            
            setReportData(generatedData);
            setLoading(false);
        }, 1000);
    };

    // Generar reporte de estado de stock
    const generateStockStatusReport = () => {
        const categories = [...new Set(data.map(item => item.category))];
        const statusSummary = {
            totalProducts: data.length,
            totalValue: data.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0),
            lowStock: data.filter(item => item.currentStock < item.minStock).length,
            outOfStock: data.filter(item => item.currentStock === 0).length,
            overStock: data.filter(item => item.currentStock > item.maxStock * 0.8).length
        };

        const categoryStats = categories.map(category => {
            const categoryItems = data.filter(item => item.category === category);
            return {
                category,
                count: categoryItems.length,
                value: categoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0),
                lowStock: categoryItems.filter(item => item.currentStock < item.minStock).length,
                outOfStock: categoryItems.filter(item => item.currentStock === 0).length
            };
        });

        return {
            type: 'stock_status',
            title: 'Reporte de Estado de Stock',
            dateRange,
            generatedAt: new Date().toISOString(),
            summary: statusSummary,
            categories: categoryStats,
            charts: generateCharts(categoryStats)
        };
    };

    // Generar reporte de valuación
    const generateValuationReport = () => {
        const categories = [...new Set(data.map(item => item.category))];
        const warehouses = [...new Set(data.map(item => item.warehouse))];
        
        const categoryValuation = categories.map(category => {
            const categoryItems = data.filter(item => item.category === category);
            const totalValue = categoryItems.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
            const totalCost = categoryItems.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0);
            
            return {
                category,
                totalValue,
                totalCost,
                profit: totalValue - totalCost,
                profitMargin: totalValue > 0 ? ((totalValue - totalCost) / totalValue) * 100 : 0,
                items: categoryItems.length
            };
        });

        const warehouseValuation = warehouses.map(warehouse => {
            const warehouseItems = data.filter(item => item.warehouse === warehouse);
            const totalValue = warehouseItems.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0);
            
            return {
                warehouse,
                totalValue,
                items: warehouseItems.length,
                percentage: (totalValue / data.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0)) * 100
            };
        });

        return {
            type: 'valuation',
            title: 'Reporte de Valuación de Inventario',
            dateRange,
            generatedAt: new Date().toISOString(),
            totalValue: data.reduce((sum, item) => sum + (item.currentStock * item.unitPrice), 0),
            totalCost: data.reduce((sum, item) => sum + (item.currentStock * item.costPrice), 0),
            totalProfit: data.reduce((sum, item) => sum + (item.currentStock * (item.unitPrice - item.costPrice)), 0),
            categoryValuation,
            warehouseValuation
        };
    };

    // Generar reporte de rendimiento
    const generatePerformanceReport = () => {
        // Métricas de rendimiento
        const performanceMetrics = {
            stockAccuracy: 95.8, // Precisión del inventario
            turnoverRate: 4.2,   // Rotación anual
            fillRate: 98.5,      // Tasa de cumplimiento
            carryingCost: 22.3,  // Costo de mantenimiento (%)
            obsolescence: 2.1,   // % de obsolescencia
            shrinkage: "1.5%"      // Merma (%)
        };
    

        // Tendencias
        const trends = {
            valueTrend: 12.5,
            efficiencyTrend: 8.7,
            accuracyTrend: 3.2,
            costTrend: -1.5
        };

        // KPIs
        const kpis = [
            { metric: 'Precisión de Inventario', value: '95.8%', target: '98%', status: 'warning' },
            { metric: 'Rotación Anual', value: '4.2x', target: '4.5x', status: 'good' },
            { metric: 'Costo de Mantenimiento', value: '22.3%', target: '20%', status: 'warning' },
            { metric: 'Tasa de Cumplimiento', value: '98.5%', target: '97%', status: 'excellent' }
        ];

        return {
            type: 'performance',
            title: 'Reporte de Rendimiento del Inventario',
            dateRange,
            generatedAt: new Date().toISOString(),
            metrics: performanceMetrics,
            trends,
            kpis,
            recommendations: [
                'Optimizar niveles de stock para reducir costos de mantenimiento',
                'Implementar conteos cíclicos para mejorar precisión',
                'Revisar productos con baja rotación'
            ]
        };
    };

    // Generar gráficos para reportes
    const generateCharts = (categoryStats) => {
        return {
            pieChart: categoryStats.map(cat => ({
                category: cat.category,
                value: cat.value,
                percentage: (cat.value / categoryStats.reduce((sum, c) => sum + c.value, 0)) * 100
            })),
            barChart: categoryStats.map(cat => ({
                category: cat.category,
                count: cat.count,
                lowStock: cat.lowStock,
                outOfStock: cat.outOfStock
            }))
        };
    };

    // Generar reporte por defecto
    const generateDefaultReport = () => {
        return {
            type: reportType,
            title: `Reporte ${reportTypes.find(r => r.id === reportType)?.label}`,
            dateRange,
            generatedAt: new Date().toISOString(),
            message: 'Reporte generado exitosamente',
            dataCount: data.length,
            selectedCount: selectedItems.length
        };
    };

    // Manejar generación de reporte
    const handleGenerateReport = () => {
        setShowReport(true);
        setReportData(null);
    };

    // Manejar exportación de reporte
    const handleExportReport = (format) => {
        console.log(`Exportando reporte ${reportType} en formato ${format}`);
        alert(`Exportando reporte en formato ${format.toUpperCase()}`);
    };

    // Manejar envío de reporte
    const handleSendReport = () => {
        console.log('Enviando reporte por email');
        alert('Reporte enviado exitosamente');
    };

    // Formatear fecha
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Renderizar vista previa del reporte
    const renderReportPreview = () => {
        if (!reportData || loading) return null;

        switch (reportData.type) {
            case 'stock_status':
                return renderStockStatusReport();
            case 'valuation':
                return renderValuationReport();
            case 'performance':
                return renderPerformanceReport();
            default:
                return renderDefaultReport();
        }
    };

    // Renderizar reporte de estado de stock
    const renderStockStatusReport = () => (
        <div className="report-preview stock-status">
            <div className="report-header">
                <h3>{reportData.title}</h3>
                <div className="report-meta">
                    <span>Período: {dateRanges.find(r => r.id === dateRange)?.label}</span>
                    <span>Generado: {formatDate(reportData.generatedAt)}</span>
                </div>
            </div>

            <div className="report-summary">
                <div className="summary-grid">
                    <div className="summary-card">
                        <div className="summary-icon">📦</div>
                        <div className="summary-content">
                            <span className="summary-label">Productos Totales</span>
                            <span className="summary-value">{reportData.summary.totalProducts}</span>
                        </div>
                    </div>
                    
                    <div className="summary-card">
                        <div className="summary-icon">💰</div>
                        <div className="summary-content">
                            <span className="summary-label">Valor Total</span>
                            <span className="summary-value">
                                ${reportData.summary.totalValue.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    
                    <div className="summary-card warning">
                        <div className="summary-icon">⚠️</div>
                        <div className="summary-content">
                            <span className="summary-label">Stock Bajo</span>
                            <span className="summary-value">{reportData.summary.lowStock}</span>
                        </div>
                    </div>
                    
                    <div className="summary-card danger">
                        <div className="summary-icon">❌</div>
                        <div className="summary-content">
                            <span className="summary-label">Sin Stock</span>
                            <span className="summary-value">{reportData.summary.outOfStock}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="report-details">
                <h4>Distribución por Categoría</h4>
                <div className="details-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th>Productos</th>
                                <th>Valor</th>
                                <th>Stock Bajo</th>
                                <th>Sin Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.categories.map(cat => (
                                <tr key={cat.category}>
                                    <td>{cat.category}</td>
                                    <td>{cat.count}</td>
                                    <td>${cat.value.toLocaleString()}</td>
                                    <td className={cat.lowStock > 0 ? 'warning' : ''}>{cat.lowStock}</td>
                                    <td className={cat.outOfStock > 0 ? 'danger' : ''}>{cat.outOfStock}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    // Renderizar reporte de valuación
    const renderValuationReport = () => (
        <div className="report-preview valuation">
            <div className="report-header">
                <h3>{reportData.title}</h3>
                <div className="report-meta">
                    <span>Período: {dateRanges.find(r => r.id === dateRange)?.label}</span>
                    <span>Generado: {formatDate(reportData.generatedAt)}</span>
                </div>
            </div>

            <div className="valuation-summary">
                <div className="valuation-grid">
                    <div className="valuation-card total">
                        <div className="valuation-icon">💰</div>
                        <div className="valuation-content">
                            <span className="valuation-label">Valor Total</span>
                            <span className="valuation-value">
                                ${reportData.totalValue.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    
                    <div className="valuation-card cost">
                        <div className="valuation-icon">💵</div>
                        <div className="valuation-content">
                            <span className="valuation-label">Costo Total</span>
                            <span className="valuation-value">
                                ${reportData.totalCost.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    
                    <div className="valuation-card profit">
                        <div className="valuation-icon">📈</div>
                        <div className="valuation-content">
                            <span className="valuation-label">Utilidad Total</span>
                            <span className="valuation-value">
                                ${reportData.totalProfit.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    
                    <div className="valuation-card margin">
                        <div className="valuation-icon">🎯</div>
                        <div className="valuation-content">
                            <span className="valuation-label">Margen Promedio</span>
                            <span className="valuation-value">
                                {((reportData.totalProfit / reportData.totalCost) * 100).toFixed(1)}%
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="valuation-details">
                <div className="details-section">
                    <h4>Valuación por Categoría</h4>
                    <div className="details-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Categoría</th>
                                    <th>Productos</th>
                                    <th>Valor</th>
                                    <th>Costo</th>
                                    <th>Utilidad</th>
                                    <th>Margen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reportData.categoryValuation.map(cat => (
                                    <tr key={cat.category}>
                                        <td>{cat.category}</td>
                                        <td>{cat.items}</td>
                                        <td>${cat.totalValue.toLocaleString()}</td>
                                        <td>${cat.totalCost.toLocaleString()}</td>
                                        <td>${cat.profit.toLocaleString()}</td>
                                        <td className={cat.profitMargin >= 20 ? 'good' : 'warning'}>
                                            {cat.profitMargin.toFixed(1)}%
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );

    // Renderizar reporte de rendimiento
    const renderPerformanceReport = () => (
        <div className="report-preview performance">
            <div className="report-header">
                <h3>{reportData.title}</h3>
                <div className="report-meta">
                    <span>Período: {dateRanges.find(r => r.id === dateRange)?.label}</span>
                    <span>Generado: {formatDate(reportData.generatedAt)}</span>
                </div>
            </div>

            <div className="performance-metrics">
                <h4>Métricas Clave de Rendimiento</h4>
                <div className="metrics-grid">
                    {reportData.kpis.map(kpi => (
                        <div key={kpi.metric} className={`kpi-card ${kpi.status}`}>
                            <div className="kpi-header">
                                <span className="kpi-metric">{kpi.metric}</span>
                                <span className="kpi-target">Objetivo: {kpi.target}</span>
                            </div>
                            <div className="kpi-body">
                                <span className="kpi-value">{kpi.value}</span>
                                <div className="kpi-progress">
                                    <div className="progress-bar">
                                        <div 
                                            className="progress-fill"
                                            style={{ 
                                                width: kpi.status === 'excellent' ? '100%' : 
                                                       kpi.status === 'good' ? '85%' : '70%'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="progress-status">
                                        {kpi.status === 'excellent' ? 'Excelente' : 
                                         kpi.status === 'good' ? 'Bueno' : 'Necesita mejorar'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {reportData.recommendations && (
                <div className="recommendations-section">
                    <h4>Recomendaciones</h4>
                    <div className="recommendations-list">
                        {reportData.recommendations.map((rec, index) => (
                            <div key={index} className="recommendation-item">
                                <span className="rec-icon">💡</span>
                                <span className="rec-text">{rec}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // Renderizar reporte por defecto
    const renderDefaultReport = () => (
        <div className="report-preview default">
            <div className="report-header">
                <h3>{reportData.title}</h3>
                <div className="report-meta">
                    <span>Período: {dateRanges.find(r => r.id === dateRange)?.label}</span>
                    <span>Generado: {formatDate(reportData.generatedAt)}</span>
                </div>
            </div>
            
            <div className="report-content">
                <p>{reportData.message}</p>
                <div className="report-stats">
                    <div className="stat-item">
                        <span className="stat-label">Productos analizados:</span>
                        <span className="stat-value">{reportData.dataCount}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Productos seleccionados:</span>
                        <span className="stat-value">{reportData.selectedCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="inventory-reports">
            <div className="reports-header">
                <h3 className="reports-title">
                    Reportes de Inventario
                    <span className="reports-subtitle">
                        Genera y analiza reportes detallados
                    </span>
                </h3>
                
                <div className="reports-controls">
                    <button 
                        className="generate-btn"
                        onClick={handleGenerateReport}
                        disabled={loading}
                    >
                        {loading ? '🔄 Generando...' : '📊 Generar Reporte'}
                    </button>
                </div>
            </div>

            <div className="reports-configuration">
                <div className="config-section">
                    <h4>Tipo de Reporte</h4>
                    <div className="report-types">
                        {reportTypes.map(type => (
                            <button
                                key={type.id}
                                className={`type-btn ${reportType === type.id ? 'active' : ''}`}
                                onClick={() => setReportType(type.id)}
                                title={type.description}
                            >
                                <span className="type-icon">{type.icon}</span>
                                <span className="type-label">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="config-section">
                    <h4>Período del Reporte</h4>
                    <div className="date-range-selector">
                        {dateRanges.map(range => (
                            <button
                                key={range.id}
                                className={`range-btn ${dateRange === range.id ? 'active' : ''}`}
                                onClick={() => setDateRange(range.id)}
                            >
                                {range.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="config-section">
                    <h4>Opciones Adicionales</h4>
                    <div className="additional-options">
                        <label className="option-checkbox">
                            <input type="checkbox" defaultChecked />
                            <span>Incluir gráficos</span>
                        </label>
                        <label className="option-checkbox">
                            <input type="checkbox" defaultChecked />
                            <span>Incluir recomendaciones</span>
                        </label>
                        <label className="option-checkbox">
                            <input type="checkbox" />
                            <span>Comparar con período anterior</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Vista previa del reporte */}
            {showReport && (
                <div className="report-preview-container">
                    <div className="preview-header">
                        <h4>Vista Previa del Reporte</h4>
                        <div className="preview-actions">
                            <button 
                                className="action-btn export"
                                onClick={() => handleExportReport('pdf')}
                                disabled={!reportData || loading}
                            >
                                📥 Exportar PDF
                            </button>
                            <button 
                                className="action-btn export"
                                onClick={() => handleExportReport('excel')}
                                disabled={!reportData || loading}
                            >
                                📊 Exportar Excel
                            </button>
                            <button 
                                className="action-btn send"
                                onClick={handleSendReport}
                                disabled={!reportData || loading}
                            >
                                📧 Enviar por Email
                            </button>
                            <button 
                                className="action-btn close"
                                onClick={() => setShowReport(false)}
                            >
                                ✕ Cerrar
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="report-loading">
                            <div className="loading-spinner"></div>
                            <p>Generando reporte...</p>
                        </div>
                    ) : (
                        renderReportPreview()
                    )}
                </div>
            )}

            <div className="reports-footer">
                <div className="footer-info">
                    <span className="info-text">
                        <strong>Tip:</strong> Los reportes se generan en tiempo real con los datos actuales
                    </span>
                </div>
                
                <div className="footer-actions">
                    <button className="footer-btn schedule">
                        🗓️ Programar reporte
                    </button>
                    <button className="footer-btn templates">
                        📋 Ver plantillas
                    </button>
                    <button className="footer-btn help">
                        ❓ Ayuda con reportes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryReports;