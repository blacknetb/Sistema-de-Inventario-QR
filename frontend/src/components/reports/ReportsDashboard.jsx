import React, { useState, useEffect } from 'react';
import InventoryReport from './InventoryReport';
import SalesReport from './SalesReport';
import StockReport from './StockReport';
import FinancialReport from './FinancialReport';
import CategoryReport from './CategoryReport';
import TrendAnalysis from './TrendAnalysis';
import ReportFilters from './ReportFilters';
import ExportReport from './ExportReport';
import { generateReportStats, getReportData } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const ReportsDashboard = ({ inventoryData = [], salesData = [] }) => {
  const [activeReport, setActiveReport] = useState('inventory');
  const [filters, setFilters] = useState({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
    categories: [],
    minStock: 0,
    maxStock: 1000,
    sortBy: 'name',
    sortOrder: 'asc'
  });
  
  const [reportStats, setReportStats] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [exportMode, setExportMode] = useState(false);
  
  const reportTypes = [
    { id: 'inventory', name: 'Inventario', icon: '📦', description: 'Reporte completo de inventario' },
    { id: 'sales', name: 'Ventas', icon: '💰', description: 'Análisis de ventas' },
    { id: 'stock', name: 'Stock', icon: '📊', description: 'Niveles de stock' },
    { id: 'financial', name: 'Financiero', icon: '💵', description: 'Reporte financiero' },
    { id: 'category', name: 'Categorías', icon: '🏷️', description: 'Análisis por categoría' },
    { id: 'trends', name: 'Tendencias', icon: '📈', description: 'Análisis de tendencias' }
  ];

  useEffect(() => {
    loadReportStats();
  }, [inventoryData, salesData, filters]);

  const loadReportStats = async () => {
    setIsLoading(true);
    
    try {
      const stats = await generateReportStats(inventoryData, salesData, filters);
      setReportStats(stats);
    } catch (error) {
      console.error('Error loading report stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'last30days',
      startDate: '',
      endDate: '',
      categories: [],
      minStock: 0,
      maxStock: 1000,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const handleExport = () => {
    setExportMode(true);
  };

  const renderReport = () => {
    const reportData = getReportData(activeReport, inventoryData, salesData, filters);
    
    switch (activeReport) {
      case 'inventory':
        return <InventoryReport data={reportData} filters={filters} stats={reportStats} />;
      case 'sales':
        return <SalesReport data={reportData} filters={filters} stats={reportStats} />;
      case 'stock':
        return <StockReport data={reportData} filters={filters} stats={reportStats} />;
      case 'financial':
        return <FinancialReport data={reportData} filters={filters} stats={reportStats} />;
      case 'category':
        return <CategoryReport data={reportData} filters={filters} stats={reportStats} />;
      case 'trends':
        return <TrendAnalysis data={reportData} filters={filters} stats={reportStats} />;
      default:
        return <InventoryReport data={reportData} filters={filters} stats={reportStats} />;
    }
  };

  const getReportIcon = (reportId) => {
    const report = reportTypes.find(r => r.id === reportId);
    return report ? report.icon : '📋';
  };

  return (
    <div className="reports-dashboard">
      <div className="reports-header">
        <div className="header-left">
          <h1>Sistema de Reportes</h1>
          <p className="subtitle">Análisis completo de inventario y ventas</p>
        </div>
        
        <div className="header-right">
          <div className="report-meta">
            <div className="meta-item">
              <span className="meta-label">Productos:</span>
              <span className="meta-value">{inventoryData.length}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Ventas:</span>
              <span className="meta-value">{salesData.length}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Actualizado:</span>
              <span className="meta-value">Ahora</span>
            </div>
          </div>
          
          <button 
            className="btn-export-dashboard"
            onClick={handleExport}
            disabled={isLoading}
          >
            <span className="export-icon">📤</span>
            Exportar Reporte
          </button>
        </div>
      </div>

      <div className="reports-content">
        <div className="reports-sidebar">
          <div className="sidebar-section">
            <h3>Tipo de Reporte</h3>
            <div className="report-types">
              {reportTypes.map(report => (
                <button
                  key={report.id}
                  className={`report-type-btn ${activeReport === report.id ? 'active' : ''}`}
                  onClick={() => setActiveReport(report.id)}
                  disabled={isLoading}
                >
                  <span className="report-icon">{report.icon}</span>
                  <div className="report-info">
                    <span className="report-name">{report.name}</span>
                    <span className="report-desc">{report.description}</span>
                  </div>
                  {activeReport === report.id && (
                    <span className="active-indicator">▶</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Resumen Rápido</h3>
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="stat-icon">📦</span>
                <div className="stat-details">
                  <span className="stat-value">{reportStats.totalItems || 0}</span>
                  <span className="stat-label">Productos</span>
                </div>
              </div>
              
              <div className="quick-stat">
                <span className="stat-icon">💰</span>
                <div className="stat-details">
                  <span className="stat-value">${reportStats.totalValue ? reportStats.totalValue.toLocaleString('es-ES', { minimumFractionDigits: 2 }) : '0.00'}</span>
                  <span className="stat-label">Valor Total</span>
                </div>
              </div>
              
              <div className="quick-stat">
                <span className="stat-icon">⚠️</span>
                <div className="stat-details">
                  <span className="stat-value">{reportStats.lowStockItems || 0}</span>
                  <span className="stat-label">Bajo Stock</span>
                </div>
              </div>
              
              <div className="quick-stat">
                <span className="stat-icon">📈</span>
                <div className="stat-details">
                  <span className="stat-value">{reportStats.topCategories ? reportStats.topCategories.length : 0}</span>
                  <span className="stat-label">Categorías</span>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Acciones Rápidas</h3>
            <div className="quick-actions">
              <button className="action-btn" onClick={handleResetFilters}>
                <span className="action-icon">🔄</span>
                Restablecer Filtros
              </button>
              <button className="action-btn" onClick={() => window.print()}>
                <span className="action-icon">🖨️</span>
                Imprimir Reporte
              </button>
              <button className="action-btn" onClick={() => alert('Función en desarrollo')}>
                <span className="action-icon">💾</span>
                Guardar Plantilla
              </button>
              <button className="action-btn" onClick={() => alert('Función en desarrollo')}>
                <span className="action-icon">🔔</span>
                Configurar Alertas
              </button>
            </div>
          </div>
        </div>

        <div className="reports-main">
          <div className="report-controls">
            <ReportFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleResetFilters}
              isLoading={isLoading}
            />
            
            <div className="report-actions">
              <div className="report-info">
                <span className="current-report">
                  <span className="report-icon-large">{getReportIcon(activeReport)}</span>
                  {reportTypes.find(r => r.id === activeReport)?.name || 'Reporte'}
                </span>
                <span className="report-count">
                  {reportData?.length || 0} registros
                </span>
              </div>
              
              <div className="action-buttons">
                <button 
                  className="btn-refresh"
                  onClick={loadReportStats}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="spinner"></span>
                      Cargando...
                    </>
                  ) : (
                    <>
                      <span className="refresh-icon">🔄</span>
                      Actualizar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="report-content">
            {isLoading ? (
              <div className="loading-report">
                <div className="loading-spinner"></div>
                <p>Generando reporte...</p>
              </div>
            ) : (
              renderReport()
            )}
          </div>
        </div>
      </div>

      {exportMode && (
        <ExportReport
          reportType={activeReport}
          data={getReportData(activeReport, inventoryData, salesData, filters)}
          filters={filters}
          stats={reportStats}
          onClose={() => setExportMode(false)}
        />
      )}
    </div>
  );
};

export default ReportsDashboard;