import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/reports.css';

const ReportGenerator = ({ 
  reportType = 'inventory', 
  onGenerateReport,
  dateRange = { start: '', end: '' }
}) => {
  const [reportData, setReportData] = useState({
    type: reportType,
    format: 'pdf',
    dateRange: dateRange,
    filters: {},
    includeCharts: true,
    emailReport: false,
    email: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const reportTypes = [
    { id: 'inventory', label: 'Inventario Actual', icon: '📦', description: 'Reporte completo del inventario actual' },
    { id: 'sales', label: 'Ventas', icon: '💰', description: 'Reporte de ventas por período' },
    { id: 'purchases', label: 'Compras', icon: '🛒', description: 'Reporte de compras y proveedores' },
    { id: 'movements', label: 'Movimientos', icon: '📊', description: 'Movimientos de inventario' },
    { id: 'expired', label: 'Productos Vencidos', icon: '⚠️', description: 'Productos próximos a vencer' },
    { id: 'low-stock', label: 'Stock Bajo', icon: '📉', description: 'Productos con stock mínimo' }
  ];

  const formats = [
    { id: 'pdf', label: 'PDF', icon: '📄' },
    { id: 'excel', label: 'Excel', icon: '📊' },
    { id: 'csv', label: 'CSV', icon: '📋' },
    { id: 'print', label: 'Imprimir', icon: '🖨️' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReportData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDateChange = (field, value) => {
    setReportData(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: value
      }
    }));
  };

  const handleGenerateReport = async () => {
    if (!reportData.type) {
      setError('Por favor seleccione un tipo de reporte');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Simular llamada al backend
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onGenerateReport) {
        await onGenerateReport(reportData);
      }
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Error al generar el reporte: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Lógica para exportar el reporte
    console.log('Exportando reporte:', reportData);
  };

  const handlePreview = () => {
    // Lógica para previsualizar el reporte
    console.log('Previsualizando reporte:', reportData);
  };

  return (
    <div className="report-generator">
      <div className="report-header">
        <h2 className="report-title">Generador de Reportes</h2>
        <p className="report-subtitle">Genere reportes personalizados del sistema de inventarios</p>
      </div>

      {error && (
        <div className="report-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="report-success">
          <span className="success-icon">✅</span>
          <span>Reporte generado exitosamente</span>
        </div>
      )}

      <div className="report-configuration">
        <div className="config-section">
          <h3 className="section-title">
            <span className="section-icon">📋</span>
            Tipo de Reporte
          </h3>
          <div className="report-types-grid">
            {reportTypes.map(type => (
              <button
                key={type.id}
                className={`report-type-card ${reportData.type === type.id ? 'active' : ''}`}
                onClick={() => setReportData(prev => ({ ...prev, type: type.id }))}
              >
                <span className="type-icon">{type.icon}</span>
                <span className="type-label">{type.label}</span>
                <span className="type-description">{type.description}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="config-section">
          <h3 className="section-title">
            <span className="section-icon">📅</span>
            Rango de Fechas
          </h3>
          <div className="date-range-selector">
            <div className="date-input-group">
              <label className="date-label">Fecha Inicio:</label>
              <input
                type="date"
                className="date-input"
                value={reportData.dateRange.start}
                onChange={(e) => handleDateChange('start', e.target.value)}
              />
            </div>
            <div className="date-input-group">
              <label className="date-label">Fecha Fin:</label>
              <input
                type="date"
                className="date-input"
                value={reportData.dateRange.end}
                onChange={(e) => handleDateChange('end', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="config-section">
          <h3 className="section-title">
            <span className="section-icon">⚙️</span>
            Configuración
          </h3>
          <div className="format-selector">
            <label className="format-label">Formato de Salida:</label>
            <div className="format-options">
              {formats.map(format => (
                <button
                  key={format.id}
                  className={`format-option ${reportData.format === format.id ? 'selected' : ''}`}
                  onClick={() => setReportData(prev => ({ ...prev, format: format.id }))}
                >
                  <span className="format-icon">{format.icon}</span>
                  <span className="format-name">{format.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="additional-options">
            <label className="option-checkbox">
              <input
                type="checkbox"
                name="includeCharts"
                checked={reportData.includeCharts}
                onChange={handleInputChange}
              />
              <span className="checkbox-label">Incluir gráficos</span>
            </label>

            <label className="option-checkbox">
              <input
                type="checkbox"
                name="emailReport"
                checked={reportData.emailReport}
                onChange={handleInputChange}
              />
              <span className="checkbox-label">Enviar por correo</span>
            </label>

            {reportData.emailReport && (
              <div className="email-input-group">
                <label className="email-label">Correo electrónico:</label>
                <input
                  type="email"
                  className="email-input"
                  name="email"
                  value={reportData.email}
                  onChange={handleInputChange}
                  placeholder="correo@ejemplo.com"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="report-actions">
        <button
          className="action-btn generate-btn"
          onClick={handleGenerateReport}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Generando...
            </>
          ) : (
            <>
              <span className="btn-icon">📊</span>
              Generar Reporte
            </>
          )}
        </button>

        <button
          className="action-btn preview-btn"
          onClick={handlePreview}
          disabled={loading}
        >
          <span className="btn-icon">👁️</span>
          Previsualizar
        </button>

        <button
          className="action-btn export-btn"
          onClick={handleExport}
          disabled={loading || !success}
        >
          <span className="btn-icon">📥</span>
          Exportar
        </button>
      </div>
    </div>
  );
};

ReportGenerator.propTypes = {
  reportType: PropTypes.string,
  onGenerateReport: PropTypes.func.isRequired,
  dateRange: PropTypes.shape({
    start: PropTypes.string,
    end: PropTypes.string
  })
};

export default ReportGenerator;