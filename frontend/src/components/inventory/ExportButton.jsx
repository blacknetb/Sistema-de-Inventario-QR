import React, { useState } from 'react';
import '../../assets/styles/inventory/Inventory.css';

const ExportButton = () => {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    
    // Simular proceso de exportación
    setTimeout(() => {
      setExporting(false);
      alert('Exportación completada con éxito!');
    }, 1500);
  };

  const exportOptions = [
    { format: 'CSV', icon: '📄', description: 'Formato Excel/Google Sheets' },
    { format: 'Excel', icon: '📊', description: 'Archivo Excel (.xlsx)' },
    { format: 'PDF', icon: '📑', description: 'Documento PDF' },
    { format: 'JSON', icon: '📋', description: 'Datos estructurados' }
  ];

  return (
    <div className="export-button-container">
      <button 
        className={`export-main-btn ${exporting ? 'exporting' : ''}`}
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? (
          <>
            <span className="export-spinner"></span>
            Exportando...
          </>
        ) : (
          <>
            <span className="export-icon">📤</span>
            Exportar Datos
          </>
        )}
      </button>
      
      {!exporting && (
        <div className="export-options">
          <span className="options-label">Formatos disponibles:</span>
          <div className="options-grid">
            {exportOptions.map((option, index) => (
              <div key={index} className="export-option">
                <span className="option-icon">{option.icon}</span>
                <div className="option-info">
                  <span className="option-format">{option.format}</span>
                  <span className="option-description">{option.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportButton;