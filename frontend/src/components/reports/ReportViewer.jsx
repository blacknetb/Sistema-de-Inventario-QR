import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/reports.css';

const ReportViewer = ({ reportData, onClose, onExport, onPrint }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [viewMode, setViewMode] = useState('preview'); // 'preview', 'charts', 'data'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos de ejemplo para el reporte
  const sampleReportData = {
    id: '1',
    name: 'Reporte de Inventario Mensual',
    type: 'inventory',
    createdAt: new Date().toISOString(),
    period: 'Enero 2024',
    totalProducts: 150,
    totalValue: 125000,
    categories: 12,
    lowStockItems: 8,
    expiredItems: 3,
    details: {
      summary: {
        totalItems: 150,
        totalValue: '$125,000',
        averagePrice: '$833.33',
        itemsAdded: 25,
        itemsSold: 42,
        itemsDamaged: 2
      },
      categories: [
        { name: 'Electrónica', count: 45, value: 45000 },
        { name: 'Ropa', count: 38, value: 19000 },
        { name: 'Alimentos', count: 25, value: 7500 },
        { name: 'Hogar', count: 20, value: 15000 },
        { name: 'Oficina', count: 22, value: 38500 }
      ],
      topProducts: [
        { name: 'Laptop HP', sku: 'LP-HP-001', stock: 15, price: 1200 },
        { name: 'Smartphone Samsung', sku: 'SP-SSG-002', stock: 22, price: 800 },
        { name: 'Monitor 24"', sku: 'MN-24-003', stock: 8, price: 350 },
        { name: 'Teclado Mecánico', sku: 'TK-MEC-004', stock: 35, price: 120 },
        { name: 'Mouse Inalámbrico', sku: 'MS-INAL-005', stock: 42, price: 45 }
      ],
      lowStock: [
        { name: 'Cable HDMI', sku: 'CB-HDMI-006', stock: 2, minStock: 10 },
        { name: 'Adaptador USB-C', sku: 'AD-USB-007', stock: 3, minStock: 15 },
        { name: 'Batería Externa', sku: 'BT-EXT-008', stock: 1, minStock: 8 }
      ]
    }
  };

  // Usar datos proporcionados o datos de ejemplo
  const report = reportData || sampleReportData;

  useEffect(() => {
    // Simular carga de datos
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  const handleNextPage = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getReportTypeLabel = (type) => {
    const types = {
      inventory: 'Inventario',
      sales: 'Ventas',
      purchases: 'Compras',
      movements: 'Movimientos',
      expired: 'Productos Vencidos',
      'low-stock': 'Stock Bajo'
    };
    return types[type] || type;
  };

  const renderPreviewContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <p>Cargando reporte...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <span className="error-icon-large">⚠️</span>
          <h3>Error al cargar el reporte</h3>
          <p>{error}</p>
          <button className="retry-btn" onClick={() => window.location.reload()}>
            Reintentar
          </button>
        </div>
      );
    }

    return (
      <div className="report-preview-content" style={{ zoom: `${zoomLevel}%` }}>
        {/* Encabezado del reporte */}
        <div className="report-header-preview">
          <div className="report-title-section">
            <h1 className="report-main-title">{report.name}</h1>
            <div className="report-subtitle">
              <span className="report-type-badge">{getReportTypeLabel(report.type)}</span>
              <span className="report-date">Generado el {formatDate(report.createdAt)}</span>
            </div>
          </div>
          
          <div className="company-info">
            <h2 className="company-name">Inventarios Basicos S.A.</h2>
            <p className="company-address">Av. Principal 123, Ciudad, País</p>
            <p className="company-contact">Tel: (123) 456-7890 | Email: info@inventarios.com</p>
          </div>
        </div>

        {/* Resumen ejecutivo */}
        <div className="executive-summary">
          <h2 className="section-title">Resumen Ejecutivo</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <div className="summary-icon">📦</div>
              <div className="summary-content">
                <h3 className="summary-title">Productos Totales</h3>
                <p className="summary-value">{report.totalProducts || 150}</p>
                <p className="summary-change">+5% vs mes anterior</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <h3 className="summary-title">Valor Total</h3>
                <p className="summary-value">{report.totalValue ? `$${report.totalValue.toLocaleString()}` : '$125,000'}</p>
                <p className="summary-change">+12% vs mes anterior</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🏷️</div>
              <div className="summary-content">
                <h3 className="summary-title">Categorías</h3>
                <p className="summary-value">{report.categories || 12}</p>
                <p className="summary-change">Activas</p>
              </div>
            </div>
            <div className="summary-card warning">
              <div className="summary-icon">⚠️</div>
              <div className="summary-content">
                <h3 className="summary-title">Stock Bajo</h3>
                <p className="summary-value">{report.lowStockItems || 8}</p>
                <p className="summary-change">Requieren atención</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de categorías */}
        <div className="categories-section">
          <h2 className="section-title">Distribución por Categoría</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Valor Total</th>
                  <th>% del Total</th>
                  <th>Valor Promedio</th>
                </tr>
              </thead>
              <tbody>
                {report.details?.categories?.map((cat, index) => (
                  <tr key={index}>
                    <td>{cat.name}</td>
                    <td>{cat.count}</td>
                    <td>${cat.value.toLocaleString()}</td>
                    <td>{((cat.value / (report.totalValue || 125000)) * 100).toFixed(1)}%</td>
                    <td>${(cat.value / cat.count).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Productos más vendidos */}
        <div className="top-products-section">
          <h2 className="section-title">Productos Principales</h2>
          <div className="products-grid">
            {report.details?.topProducts?.map((product, index) => (
              <div key={index} className="product-card">
                <div className="product-rank">{index + 1}</div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-sku">SKU: {product.sku}</p>
                </div>
                <div className="product-stats">
                  <div className="stat">
                    <span className="stat-label">Stock:</span>
                    <span className="stat-value">{product.stock}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Precio:</span>
                    <span className="stat-value">${product.price}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Valor:</span>
                    <span className="stat-value">${(product.stock * product.price).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock bajo */}
        <div className="low-stock-section">
          <h2 className="section-title warning">Productos con Stock Bajo</h2>
          <div className="table-container">
            <table className="data-table warning">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>SKU</th>
                  <th>Stock Actual</th>
                  <th>Stock Mínimo</th>
                  <th>Diferencia</th>
                  <th>Acción Requerida</th>
                </tr>
              </thead>
              <tbody>
                {report.details?.lowStock?.map((item, index) => {
                  const difference = item.minStock - item.stock;
                  return (
                    <tr key={index}>
                      <td>{item.name}</td>
                      <td>{item.sku}</td>
                      <td className="critical">{item.stock}</td>
                      <td>{item.minStock}</td>
                      <td className={difference > 0 ? 'negative' : ''}>
                        {difference > 0 ? `-${difference}` : difference}
                      </td>
                      <td>
                        <span className="action-badge urgent">REABASTECER</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie de página */}
        <div className="report-footer">
          <div className="footer-info">
            <p className="footer-text">
              Reporte generado por el Sistema de Inventarios Básicos
            </p>
            <p className="footer-text">
              Página {currentPage} de 1 • Documento confidencial
            </p>
          </div>
          <div className="footer-signature">
            <div className="signature-line"></div>
            <p className="signature-text">Firma del Responsable</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="report-viewer-modal">
      <div className="viewer-header">
        <div className="viewer-title">
          <h2>{report.name}</h2>
          <p className="viewer-subtitle">
            {getReportTypeLabel(report.type)} • {formatDate(report.createdAt)}
          </p>
        </div>
        <button className="close-viewer-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="viewer-toolbar">
        <div className="toolbar-left">
          <div className="view-mode-selector">
            <button
              className={`view-mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
              onClick={() => setViewMode('preview')}
            >
              <span className="mode-icon">👁️</span>
              Vista Previa
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'charts' ? 'active' : ''}`}
              onClick={() => setViewMode('charts')}
            >
              <span className="mode-icon">📊</span>
              Gráficos
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'data' ? 'active' : ''}`}
              onClick={() => setViewMode('data')}
            >
              <span className="mode-icon">📋</span>
              Datos
            </button>
          </div>
        </div>

        <div className="toolbar-center">
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={handleZoomOut} title="Alejar">
              ➖
            </button>
            <span className="zoom-level">{zoomLevel}%</span>
            <button className="zoom-btn" onClick={handleZoomIn} title="Acercar">
              ➕
            </button>
            <button className="zoom-reset-btn" onClick={handleZoomReset}>
              Reiniciar
            </button>
          </div>

          <div className="page-controls">
            <button 
              className="page-btn" 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              ◀
            </button>
            <span className="page-info">
              Página <input 
                type="number" 
                className="page-input" 
                value={currentPage} 
                min="1"
                max="10"
                onChange={(e) => setCurrentPage(parseInt(e.target.value) || 1)}
              /> de 1
            </span>
            <button 
              className="page-btn" 
              onClick={handleNextPage}
              disabled={currentPage === 1}
            >
              ▶
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn print-btn" onClick={onPrint}>
            <span className="btn-icon">🖨️</span>
            Imprimir
          </button>
          <button className="toolbar-btn export-btn" onClick={onExport}>
            <span className="btn-icon">📥</span>
            Exportar
          </button>
          <button className="toolbar-btn share-btn">
            <span className="btn-icon">↗️</span>
            Compartir
          </button>
        </div>
      </div>

      <div className="viewer-content">
        {viewMode === 'preview' && renderPreviewContent()}
        {viewMode === 'charts' && (
          <div className="charts-view">
            <div className="charts-container">
              <div className="chart-placeholder">
                <h3>Gráfico de Distribución</h3>
                <p>Gráfico interactivo de categorías</p>
              </div>
              <div className="chart-placeholder">
                <h3>Tendencias de Stock</h3>
                <p>Evolución mensual del inventario</p>
              </div>
              <div className="chart-placeholder">
                <h3>Análisis de Ventas</h3>
                <p>Comparativo por categorías</p>
              </div>
            </div>
          </div>
        )}
        {viewMode === 'data' && (
          <div className="data-view">
            <div className="data-table-raw">
              <h3>Datos en Bruto</h3>
              <pre className="raw-data">
                {JSON.stringify(report.details, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>

      <div className="viewer-footer">
        <div className="footer-actions">
          <button className="footer-btn" onClick={onClose}>
            Cerrar
          </button>
          <button className="footer-btn primary" onClick={onExport}>
            Descargar Copia
          </button>
        </div>
        <div className="footer-status">
          <span className="status-indicator"></span>
          <span>Reporte listo para {viewMode === 'preview' ? 'visualización' : viewMode === 'charts' ? 'análisis' : 'exportación'}</span>
        </div>
      </div>
    </div>
  );
};

ReportViewer.propTypes = {
  reportData: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func,
  onPrint: PropTypes.func
};

export default ReportViewer;