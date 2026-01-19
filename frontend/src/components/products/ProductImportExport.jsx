import React, { useState, useRef } from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductImportExport = ({ onImport, onExport }) => {
  const [importStep, setImportStep] = useState('select');
  const [importFile, setImportFile] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importMapping, setImportMapping] = useState({});
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportOptions, setExportOptions] = useState({
    includeImages: true,
    includeVariants: true,
    includeHistory: false,
    dateRange: 'all'
  });
  
  const fileInputRef = useRef(null);

  const supportedFormats = [
    { id: 'csv', name: 'CSV (Excel)', icon: '📄', description: 'Archivo CSV compatible con Excel y Google Sheets' },
    { id: 'excel', name: 'Excel', icon: '📊', description: 'Archivo Excel (.xlsx) con formatos' },
    { id: 'json', name: 'JSON', icon: '📋', description: 'Datos estructurados en formato JSON' },
    { id: 'xml', name: 'XML', icon: '📝', description: 'Formato XML para sistemas empresariales' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      setImportStep('map');
      
      // Simular análisis del archivo
      setTimeout(() => {
        const defaultMapping = {
          sku: 'SKU',
          name: 'Product Name',
          category: 'Category',
          price: 'Price',
          stock: 'Stock'
        };
        setImportMapping(defaultMapping);
      }, 1000);
    }
  };

  const handleImportStart = () => {
    setImportStep('importing');
    setImportProgress(0);
    
    // Simular progreso de importación
    const interval = setInterval(() => {
      setImportProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setImportStep('complete'), 500);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleExport = () => {
    console.log(`Exporting in ${exportFormat} format with options:`, exportOptions);
    if (onExport) {
      onExport({ format: exportFormat, options: exportOptions });
    }
    
    // Simular exportación
    setTimeout(() => {
      alert(`Exportación completada. Archivo generado en formato ${exportFormat.toUpperCase()}`);
    }, 1500);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.json'))) {
      setImportFile(file);
      setImportStep('map');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="product-import-export">
      <div className="import-export-header">
        <h3>Importar / Exportar</h3>
        <div className="header-actions">
          <button className="help-btn" title="Ayuda">
            ❓
          </button>
        </div>
      </div>

      <div className="import-export-content">
        {/* Sección de Importación */}
        <div className="import-section">
          <h4>Importar Productos</h4>
          
          {importStep === 'select' && (
            <div className="import-step">
              <div 
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="drop-icon">📁</div>
                <div className="drop-text">
                  <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                  <p className="formats-info">Formatos soportados: CSV, Excel, JSON</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.json"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
              </div>
              
              <div className="format-examples">
                <h5>Ejemplos de formato:</h5>
                <div className="example-cards">
                  <div className="example-card">
                    <div className="example-icon">📄</div>
                    <div className="example-content">
                      <strong>CSV Simple</strong>
                      <small>SKU,Nombre,Precio,Stock</small>
                    </div>
                  </div>
                  <div className="example-card">
                    <div className="example-icon">📊</div>
                    <div className="example-content">
                      <strong>Excel Completo</strong>
                      <small>Con categorías y variantes</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {importStep === 'map' && (
            <div className="import-step">
              <div className="file-info">
                <div className="file-icon">📁</div>
                <div className="file-details">
                  <strong>{importFile?.name}</strong>
                  <small>{(importFile?.size / 1024).toFixed(2)} KB</small>
                </div>
              </div>
              
              <div className="mapping-section">
                <h5>Mapeo de Campos</h5>
                <p>Asigna las columnas de tu archivo a los campos del sistema:</p>
                
                <div className="mapping-table">
                  <div className="mapping-row">
                    <span className="field-label">Campo del Sistema</span>
                    <span className="field-label">Columna en Archivo</span>
                  </div>
                  
                  {Object.entries(importMapping).map(([field, column]) => (
                    <div key={field} className="mapping-row">
                      <span className="system-field">{field}</span>
                      <select 
                        value={column}
                        onChange={(e) => setImportMapping(prev => ({
                          ...prev,
                          [field]: e.target.value
                        }))}
                        className="column-select"
                      >
                        <option value="SKU">SKU</option>
                        <option value="Product Name">Nombre</option>
                        <option value="Category">Categoría</option>
                        <option value="Price">Precio</option>
                        <option value="Stock">Stock</option>
                        <option value="Description">Descripción</option>
                        <option value="Brand">Marca</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="import-actions">
                <button className="btn-secondary" onClick={() => setImportStep('select')}>
                  ← Volver
                </button>
                <button className="btn-primary" onClick={handleImportStart}>
                  Iniciar Importación
                </button>
              </div>
            </div>
          )}

          {importStep === 'importing' && (
            <div className="import-step">
              <div className="import-progress">
                <div className="progress-icon">🔄</div>
                <h5>Importando Productos</h5>
                <p>Por favor espera mientras procesamos tu archivo...</p>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
                <div className="progress-text">{importProgress}% completado</div>
                
                <div className="progress-details">
                  <div className="detail-item">
                    <span className="detail-label">Productos procesados:</span>
                    <span className="detail-value">{Math.floor(importProgress / 10) * 5}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Tiempo estimado:</span>
                    <span className="detail-value">{Math.max(0, 10 - importProgress / 10).toFixed(1)}s</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {importStep === 'complete' && (
            <div className="import-step">
              <div className="import-complete">
                <div className="complete-icon">✅</div>
                <h5>¡Importación Completada!</h5>
                <p>Se han importado exitosamente 50 productos.</p>
                
                <div className="import-results">
                  <div className="result-card success">
                    <span className="result-count">45</span>
                    <span className="result-label">Importados</span>
                  </div>
                  <div className="result-card warning">
                    <span className="result-count">3</span>
                    <span className="result-label">Actualizados</span>
                  </div>
                  <div className="result-card error">
                    <span className="result-count">2</span>
                    <span className="result-label">Errores</span>
                  </div>
                </div>
                
                <div className="complete-actions">
                  <button className="btn-secondary" onClick={() => setImportStep('select')}>
                    Importar más
                  </button>
                  <button className="btn-primary" onClick={() => console.log('View imported products')}>
                    Ver Productos
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sección de Exportación */}
        <div className="export-section">
          <h4>Exportar Productos</h4>
          
          <div className="export-options">
            <div className="format-selector">
              <h5>Formato de Exportación</h5>
              <div className="format-cards">
                {supportedFormats.map(format => (
                  <div 
                    key={format.id}
                    className={`format-card ${exportFormat === format.id ? 'active' : ''}`}
                    onClick={() => setExportFormat(format.id)}
                  >
                    <div className="format-icon">{format.icon}</div>
                    <div className="format-info">
                      <strong>{format.name}</strong>
                      <small>{format.description}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="options-selector">
              <h5>Opciones de Exportación</h5>
              <div className="option-checkboxes">
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeImages}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeImages: e.target.checked
                    }))}
                  />
                  <span>Incluir imágenes (URLs)</span>
                </label>
                
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeVariants}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeVariants: e.target.checked
                    }))}
                  />
                  <span>Incluir variantes de producto</span>
                </label>
                
                <label className="option-checkbox">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeHistory}
                    onChange={(e) => setExportOptions(prev => ({
                      ...prev,
                      includeHistory: e.target.checked
                    }))}
                  />
                  <span>Incluir historial de cambios</span>
                </label>
              </div>

              <div className="date-range-selector">
                <label>Rango de fechas:</label>
                <select
                  value={exportOptions.dateRange}
                  onChange={(e) => setExportOptions(prev => ({
                    ...prev,
                    dateRange: e.target.value
                  }))}
                >
                  <option value="all">Todos los productos</option>
                  <option value="last30">Últimos 30 días</option>
                  <option value="last90">Últimos 90 días</option>
                  <option value="thisYear">Este año</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
            </div>

            <div className="export-stats">
              <div className="stat-item">
                <span className="stat-label">Productos a exportar:</span>
                <span className="stat-value">152</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tamaño estimado:</span>
                <span className="stat-value">~2.4 MB</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Tiempo estimado:</span>
                <span className="stat-value">3-5 segundos</span>
              </div>
            </div>
          </div>

          <button className="export-btn" onClick={handleExport}>
            <span className="btn-icon">📤</span>
            Exportar Productos
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductImportExport;