import React, { useState } from 'react';
import { formatCurrency, formatDate, generateExportData } from './ReportUtils';
import '../../assets/styles/Reports/reports.css';

const ExportReport = ({ reportType, data, filters, stats, onClose }) => {
  const [exportFormat, setExportFormat] = useState('pdf');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeData, setIncludeData] = useState(true);
  const [includeSummary, setIncludeSummary] = useState(true);
  const [fileName, setFileName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const reportTypes = {
    inventory: 'Reporte de Inventario',
    sales: 'Reporte de Ventas',
    stock: 'Reporte de Stock',
    financial: 'Reporte Financiero',
    category: 'Reporte por Categorías',
    trends: 'Análisis de Tendencias'
  };

  const formats = [
    { id: 'pdf', name: 'PDF Document', icon: '📄' },
    { id: 'excel', name: 'Excel Spreadsheet', icon: '📊' },
    { id: 'csv', name: 'CSV File', icon: '📋' },
    { id: 'json', name: 'JSON Data', icon: '🔣' },
    { id: 'html', name: 'HTML Report', icon: '🌐' }
  ];

  const generateFileName = () => {
    const date = new Date().toISOString().split('T')[0];
    const typeName = reportTypes[reportType]?.toLowerCase().replace(/ /g, '-') || 'report';
    return `${typeName}-${date}`;
  };

  React.useEffect(() => {
    if (!fileName) {
      setFileName(generateFileName());
    }
  }, [fileName]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      // Simular progreso de exportación
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Generar datos de exportación
      const exportData = generateExportData(
        reportType,
        data,
        filters,
        stats,
        {
          includeCharts,
          includeData,
          includeSummary,
          format: exportFormat
        }
      );

      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));

      clearInterval(progressInterval);
      setExportProgress(100);

      // Crear y descargar el archivo
      await downloadExportFile(exportData, exportFormat, fileName);

      // Esperar un momento antes de cerrar
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);

    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error al exportar el reporte. Por favor, intente nuevamente.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const downloadExportFile = async (exportData, format, filename) => {
    switch (format) {
      case 'pdf':
        await exportToPDF(exportData, filename);
        break;
      case 'excel':
        await exportToExcel(exportData, filename);
        break;
      case 'csv':
        await exportToCSV(exportData, filename);
        break;
      case 'json':
        await exportToJSON(exportData, filename);
        break;
      case 'html':
        await exportToHTML(exportData, filename);
        break;
      default:
        await exportToPDF(exportData, filename);
    }
  };

  const exportToPDF = async (data, filename) => {
    // En un entorno real, usarías una librería como jsPDF o pdfmake
    alert(`Exportando a PDF: ${filename}.pdf\n\nEn un entorno real, esta función generaría un archivo PDF con todos los datos del reporte.`);
    
    // Simulación de descarga
    const link = document.createElement('a');
    link.href = 'data:application/pdf;base64,';
    link.download = `${filename}.pdf`;
    link.click();
  };

  const exportToExcel = async (data, filename) => {
    // Crear contenido CSV (simulación básica de Excel)
    let csvContent = '';
    
    if (includeSummary) {
      csvContent += 'RESUMEN DEL REPORTE\n\n';
      csvContent += `Tipo: ${reportTypes[reportType]}\n`;
      csvContent += `Fecha de generación: ${new Date().toLocaleString()}\n`;
      csvContent += `Total de registros: ${data.length}\n\n`;
    }
    
    if (includeData && data.length > 0) {
      // Encabezados
      const headers = Object.keys(data[0]);
      csvContent += headers.join(',') + '\n';
      
      // Datos
      data.forEach(item => {
        const row = headers.map(header => {
          const value = item[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        });
        csvContent += row.join(',') + '\n';
      });
    }
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToCSV = async (data, filename) => {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }
    
    // Encabezados
    const headers = Object.keys(data[0]);
    let csvContent = headers.join(',') + '\n';
    
    // Datos
    data.forEach(item => {
      const row = headers.map(header => {
        const value = item[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value;
      });
      csvContent += row.join(',') + '\n';
    });
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = async (data, filename) => {
    const jsonData = {
      reportType: reportType,
      reportName: reportTypes[reportType],
      generatedAt: new Date().toISOString(),
      filters: filters,
      stats: stats,
      data: includeData ? data : [],
      summary: includeSummary ? {
        totalRecords: data.length,
        generatedBy: 'Sistema de Inventario',
        version: '1.0.0'
      } : null
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToHTML = async (data, filename) => {
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${reportTypes[reportType]}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
          }
          .report-header {
            border-bottom: 2px solid #3498db;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .report-title {
            color: #2c3e50;
            margin-bottom: 10px;
          }
          .report-meta {
            color: #7f8c8d;
            font-size: 0.9rem;
          }
          .report-summary {
            background-color: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          .data-table th {
            background-color: #3498db;
            color: white;
            padding: 12px;
            text-align: left;
          }
          .data-table td {
            padding: 10px;
            border-bottom: 1px solid #ddd;
          }
          .data-table tr:hover {
            background-color: #f5f5f5;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 0.9rem;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <h1 class="report-title">${reportTypes[reportType]}</h1>
          <div class="report-meta">
            Generado: ${new Date().toLocaleString('es-ES')}<br>
            Total de registros: ${data.length}<br>
            Sistema: Inventario Básico v1.0.0
          </div>
        </div>
        
        ${includeSummary ? `
        <div class="report-summary">
          <h2>Resumen Ejecutivo</h2>
          <p>Reporte generado con los siguientes filtros:</p>
          <ul>
            <li>Tipo de reporte: ${reportTypes[reportType]}</li>
            <li>Fecha de generación: ${new Date().toLocaleDateString('es-ES')}</li>
            <li>Total de registros: ${data.length}</li>
            ${stats.totalValue ? `<li>Valor total: ${formatCurrency(stats.totalValue)}</li>` : ''}
            ${stats.totalItems ? `<li>Productos totales: ${stats.totalItems}</li>` : ''}
          </ul>
        </div>
        ` : ''}
        
        ${includeData && data.length > 0 ? `
        <div class="report-data">
          <h2>Datos del Reporte</h2>
          <table class="data-table">
            <thead>
              <tr>
                ${Object.keys(data[0]).map(key => `<th>${key}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.slice(0, 100).map(item => `
                <tr>
                  ${Object.values(item).map(value => `<td>${value}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          ${data.length > 100 ? `<p><em>Mostrando 100 de ${data.length} registros. Descarga completa para ver todos los datos.</em></p>` : ''}
        </div>
        ` : '<p>No se incluyeron datos en la exportación.</p>'}
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} Sistema de Inventario Básico. Todos los derechos reservados.</p>
          <p>Este reporte fue generado automáticamente por el sistema.</p>
        </div>
        
        <div class="no-print">
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.html`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="export-report-modal">
      <div className="export-modal-header">
        <h2>Exportar Reporte</h2>
        <button className="btn-close-export" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="export-modal-content">
        <div className="export-settings">
          <div className="setting-group">
            <h3>Configuración de Exportación</h3>
            
            <div className="format-selector">
              <label>Formato de Archivo:</label>
              <div className="format-options">
                {formats.map(format => (
                  <div 
                    key={format.id}
                    className={`format-option ${exportFormat === format.id ? 'selected' : ''}`}
                    onClick={() => setExportFormat(format.id)}
                  >
                    <span className="format-icon">{format.icon}</span>
                    <span className="format-name">{format.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-selector">
              <label>Contenido a Incluir:</label>
              <div className="content-options">
                <label className="content-option">
                  <input
                    type="checkbox"
                    checked={includeSummary}
                    onChange={(e) => setIncludeSummary(e.target.checked)}
                  />
                  <span className="option-label">Resumen Ejecutivo</span>
                  <span className="option-desc">Incluye información general del reporte</span>
                </label>
                
                <label className="content-option">
                  <input
                    type="checkbox"
                    checked={includeData}
                    onChange={(e) => setIncludeData(e.target.checked)}
                  />
                  <span className="option-label">Datos Completos</span>
                  <span className="option-desc">Incluye todos los registros del reporte</span>
                </label>
                
                <label className="content-option">
                  <input
                    type="checkbox"
                    checked={includeCharts}
                    onChange={(e) => setIncludeCharts(e.target.checked)}
                    disabled={exportFormat !== 'pdf' && exportFormat !== 'html'}
                  />
                  <span className="option-label">Gráficos y Visualizaciones</span>
                  <span className="option-desc">
                    {exportFormat === 'pdf' || exportFormat === 'html' ? 
                      'Incluye gráficos del reporte' : 
                      'Solo disponible para PDF y HTML'}
                  </span>
                </label>
              </div>
            </div>

            <div className="filename-setting">
              <label>Nombre del Archivo:</label>
              <div className="filename-input">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="Nombre del archivo"
                />
                <span className="file-extension">.{exportFormat}</span>
              </div>
            </div>
          </div>

          <div className="export-preview">
            <h3>Vista Previa</h3>
            <div className="preview-card">
              <div className="preview-header">
                <span className="preview-icon">
                  {formats.find(f => f.id === exportFormat)?.icon || '📄'}
                </span>
                <span className="preview-filename">{fileName}.{exportFormat}</span>
              </div>
              
              <div className="preview-content">
                <div className="preview-section">
                  <h4>Reporte: {reportTypes[reportType]}</h4>
                  <p>Formato: {formats.find(f => f.id === exportFormat)?.name}</p>
                  <p>Contenido incluido:</p>
                  <ul>
                    {includeSummary && <li>✓ Resumen ejecutivo</li>}
                    {includeData && <li>✓ Datos completos ({data.length} registros)</li>}
                    {includeCharts && (exportFormat === 'pdf' || exportFormat === 'html') && <li>✓ Gráficos</li>}
                  </ul>
                </div>
                
                <div className="preview-info">
                  <p><strong>Tamaño estimado:</strong> {estimateFileSize()} KB</p>
                  <p><strong>Fecha de generación:</strong> {new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isExporting && (
          <div className="export-progress">
            <h3>Exportando Reporte...</h3>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${exportProgress}%` }}
              ></div>
            </div>
            <p className="progress-text">{exportProgress}% completado</p>
            <p className="progress-desc">
              Generando archivo {exportFormat.toUpperCase()}...
            </p>
          </div>
        )}
      </div>

      <div className="export-modal-footer">
        <div className="footer-info">
          <p><strong>Nota:</strong> La exportación puede tomar unos momentos dependiendo del tamaño de los datos.</p>
        </div>
        
        <div className="footer-actions">
          <button 
            className="btn-cancel-export"
            onClick={onClose}
            disabled={isExporting}
          >
            Cancelar
          </button>
          
          <button 
            className="btn-start-export"
            onClick={handleExport}
            disabled={isExporting || !fileName.trim()}
          >
            {isExporting ? (
              <>
                <span className="spinner"></span>
                Exportando...
              </>
            ) : (
              'Iniciar Exportación'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  function estimateFileSize() {
    let size = 0;
    
    if (includeSummary) size += 5; // 5KB para resumen
    if (includeData) size += data.length * 0.1; // 0.1KB por registro
    
    if (includeCharts && (exportFormat === 'pdf' || exportFormat === 'html')) {
      size += 50; // 50KB para gráficos
    }
    
    return Math.max(10, Math.ceil(size)); // Mínimo 10KB
  }
};

export default ExportReport;