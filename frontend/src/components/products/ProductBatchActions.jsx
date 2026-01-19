import React, { useState } from 'react';
import '../../assets/styles/Products/products.CSS';

const ProductBatchActions = ({ selectedCount, onBatchDelete, onBatchUpdateStatus }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleBatchAction = (action) => {
    switch (action) {
      case 'delete':
        onBatchDelete();
        break;
      case 'activate':
        onBatchUpdateStatus('active');
        break;
      case 'deactivate':
        onBatchUpdateStatus('inactive');
        break;
      case 'draft':
        onBatchUpdateStatus('draft');
        break;
      default:
        break;
    }
    setShowMenu(false);
    setShowStatusMenu(false);
  };

  const exportFormats = [
    { format: 'CSV', icon: '📄', description: 'Formato Excel/Google Sheets' },
    { format: 'Excel', icon: '📊', description: 'Archivo Excel (.xlsx)' },
    { format: 'PDF', icon: '📑', description: 'Documento PDF' },
    { format: 'JSON', icon: '📋', description: 'Datos estructurados' }
  ];

  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="batch-actions">
      <div className="batch-header">
        <div className="selected-count">
          <span className="count-badge">{selectedCount}</span>
          <span className="count-text">
            producto{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="action-buttons">
        <div className="action-group">
          <button
            className="action-btn danger-btn"
            onClick={() => handleBatchAction('delete')}
            title="Eliminar seleccionados"
          >
            <span className="btn-icon">🗑️</span>
            <span className="btn-text">Eliminar</span>
          </button>
        </div>

        <div className="action-group">
          <div className="dropdown-wrapper">
            <button
              className="action-btn status-btn"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              title="Cambiar estado"
            >
              <span className="btn-icon">🔄</span>
              <span className="btn-text">Cambiar Estado</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showStatusMenu && (
              <div className="dropdown-menu">
                <button 
                  className="dropdown-item success"
                  onClick={() => handleBatchAction('activate')}
                >
                  <span className="item-icon">✅</span>
                  <span className="item-text">Activar</span>
                </button>
                <button 
                  className="dropdown-item warning"
                  onClick={() => handleBatchAction('deactivate')}
                >
                  <span className="item-icon">⏸️</span>
                  <span className="item-text">Desactivar</span>
                </button>
                <button 
                  className="dropdown-item info"
                  onClick={() => handleBatchAction('draft')}
                >
                  <span className="item-icon">📝</span>
                  <span className="item-text">Marcar como borrador</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="action-group">
          <div className="dropdown-wrapper">
            <button
              className="action-btn export-btn"
              onClick={() => setShowExportMenu(!showExportMenu)}
              title="Exportar seleccionados"
            >
              <span className="btn-icon">📤</span>
              <span className="btn-text">Exportar</span>
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {showExportMenu && (
              <div className="dropdown-menu export-menu">
                <div className="export-header">
                  <span>Exportar como:</span>
                </div>
                {exportFormats.map((format, index) => (
                  <button 
                    key={index}
                    className="dropdown-item"
                    onClick={() => {
                      console.log(`Exporting ${selectedCount} products as ${format.format}`);
                      setShowExportMenu(false);
                    }}
                  >
                    <span className="item-icon">{format.icon}</span>
                    <div className="export-info">
                      <span className="export-format">{format.format}</span>
                      <span className="export-description">{format.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="action-group">
          <button
            className="action-btn tag-btn"
            onClick={() => console.log('Tag selected products')}
            title="Etiquetar seleccionados"
          >
            <span className="btn-icon">🏷️</span>
            <span className="btn-text">Etiquetar</span>
          </button>
        </div>

        <div className="action-group">
          <button
            className="action-btn price-btn"
            onClick={() => console.log('Update prices')}
            title="Actualizar precios"
          >
            <span className="btn-icon">💰</span>
            <span className="btn-text">Actualizar Precios</span>
          </button>
        </div>

        <div className="action-group">
          <button
            className="action-btn stock-btn"
            onClick={() => console.log('Update stock')}
            title="Actualizar stock"
          >
            <span className="btn-icon">📦</span>
            <span className="btn-text">Actualizar Stock</span>
          </button>
        </div>
      </div>

      {showStatusMenu && (
        <div className="dropdown-overlay" onClick={() => setShowStatusMenu(false)}></div>
      )}
      
      {showExportMenu && (
        <div className="dropdown-overlay" onClick={() => setShowExportMenu(false)}></div>
      )}
    </div>
  );
};

export default ProductBatchActions;