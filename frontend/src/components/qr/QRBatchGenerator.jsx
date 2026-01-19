import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import QRItemCard from './QRItemCard';
import QRPrintSheet from './QRPrintSheet';
import { generateQRData, downloadQRCode, downloadAllQRCodes } from './QRUtils';
import './qr.css';

const QRBatchGenerator = ({ inventoryItems = [] }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [generatedBatch, setGeneratedBatch] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [template, setTemplate] = useState('standard');
  const [qrSize, setQrSize] = useState(200);
  
  // Cargar selección guardada
  useEffect(() => {
    const savedSelection = localStorage.getItem('qrBatchSelection');
    if (savedSelection) {
      try {
        setSelectedItems(JSON.parse(savedSelection));
      } catch (e) {
        console.error('Error loading batch selection:', e);
      }
    }
  }, []);
  
  // Guardar selección
  useEffect(() => {
    if (selectedItems.length > 0) {
      localStorage.setItem('qrBatchSelection', JSON.stringify(selectedItems));
    }
  }, [selectedItems]);

  const toggleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const selectAllItems = () => {
    const allIds = inventoryItems.map(item => item.id);
    setSelectedItems(allIds);
  };

  const clearSelection = () => {
    setSelectedItems([]);
    localStorage.removeItem('qrBatchSelection');
  };

  const generateBatch = async () => {
    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos un producto');
      return;
    }

    setIsGenerating(true);
    
    try {
      const batchResults = [];
      
      for (const itemId of selectedItems) {
        const item = inventoryItems.find(item => item.id == itemId);
        if (item) {
          const qrData = generateQRData({
            itemId: item.id,
            itemName: item.name,
            category: item.category,
            quantity: item.quantity,
            price: item.price,
            location: 'Almacén Principal'
          });

          const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: qrSize,
            margin: 2,
            color: {
              dark: '#2c3e50',
              light: '#ffffff'
            }
          });

          batchResults.push({
            id: `${item.id}-${Date.now()}`,
            data: qrData,
            qrCode,
            timestamp: new Date().toISOString(),
            template
          });
        }
      }

      setGeneratedBatch(batchResults);
      
      // Guardar en historial
      const existingHistory = JSON.parse(localStorage.getItem('qrBatchHistory') || '[]');
      const newHistory = [...batchResults, ...existingHistory].slice(0, 100);
      localStorage.setItem('qrBatchHistory', JSON.stringify(newHistory));
      
    } catch (error) {
      console.error('Error generating batch:', error);
      alert('Error al generar los códigos QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAll = () => {
    if (generatedBatch.length === 0) {
      alert('No hay códigos QR para descargar');
      return;
    }
    
    downloadAllQRCodes(generatedBatch);
  };

  const handlePrint = () => {
    setShowPrintView(true);
  };

  const handleTemplateChange = (e) => {
    setTemplate(e.target.value);
  };

  const handleSizeChange = (e) => {
    setQrSize(parseInt(e.target.value));
  };

  const getFilteredItems = (category) => {
    if (category === 'all') return inventoryItems;
    return inventoryItems.filter(item => item.category === category);
  };

  const categories = [...new Set(inventoryItems.map(item => item.category))];

  return (
    <div className="qr-batch-container">
      <div className="batch-header">
        <h1>Generador de QR en Lote</h1>
        <p>Genera múltiples códigos QR para tu inventario</p>
      </div>

      <div className="batch-content">
        <div className="batch-selection-section">
          <div className="selection-header">
            <h3>Seleccionar Productos ({selectedItems.length} seleccionados)</h3>
            <div className="selection-actions">
              <button className="btn-select-all" onClick={selectAllItems}>
                Seleccionar Todos
              </button>
              <button 
                className="btn-clear-selection" 
                onClick={clearSelection}
                disabled={selectedItems.length === 0}
              >
                Limpiar Selección
              </button>
            </div>
          </div>

          <div className="category-filters">
            <button 
              className={`category-filter ${!categories.includes('all') ? 'active' : ''}`}
              onClick={() => {}}
            >
              Todos
            </button>
            {categories.map(category => (
              <button 
                key={category}
                className="category-filter"
                onClick={() => {}}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="items-grid">
            {inventoryItems.map(item => (
              <div 
                key={item.id} 
                className={`item-select-card ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                onClick={() => toggleItemSelection(item.id)}
              >
                <div className="item-checkbox">
                  <input 
                    type="checkbox" 
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                  />
                </div>
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <div className="item-details">
                    <span className="detail-item">
                      <strong>ID:</strong> {item.id}
                    </span>
                    <span className="detail-item">
                      <strong>Categoría:</strong> {item.category}
                    </span>
                    <span className="detail-item">
                      <strong>Stock:</strong> {item.quantity}
                    </span>
                  </div>
                </div>
                <div className="item-status">
                  <span className={`status-badge ${item.status === 'Disponible' ? 'available' : item.status === 'Bajo Stock' ? 'low' : 'out'}`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="batch-controls-section">
          <div className="controls-card">
            <h3>Configuración del Lote</h3>
            
            <div className="control-group">
              <label>Tamaño del QR</label>
              <div className="size-controls">
                <input 
                  type="range" 
                  min="100" 
                  max="400" 
                  step="50"
                  value={qrSize}
                  onChange={handleSizeChange}
                  className="size-slider"
                />
                <span className="size-value">{qrSize}px</span>
              </div>
            </div>

            <div className="control-group">
              <label>Plantilla</label>
              <select 
                className="form-control"
                value={template}
                onChange={handleTemplateChange}
              >
                <option value="standard">Estándar (con texto)</option>
                <option value="compact">Compacta (solo QR)</option>
                <option value="detailed">Detallada (toda la info)</option>
                <option value="label">Etiqueta adhesiva</option>
              </select>
            </div>

            <div className="control-group">
              <label>Cantidad por hoja</label>
              <div className="quantity-buttons">
                {[1, 2, 4, 6, 8].map(num => (
                  <button 
                    key={num}
                    className={`qty-btn ${generatedBatch.length > 0 && generatedBatch.length <= num ? 'active' : ''}`}
                    onClick={() => {}}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="batch-actions">
              <button 
                className="btn-generate-batch"
                onClick={generateBatch}
                disabled={isGenerating || selectedItems.length === 0}
              >
                {isGenerating ? (
                  <>
                    <span className="spinner"></span>
                    Generando {selectedItems.length} QR...
                  </>
                ) : `Generar ${selectedItems.length} Códigos QR`}
              </button>

              {generatedBatch.length > 0 && (
                <>
                  <button className="btn-download-batch" onClick={handleDownloadAll}>
                    Descargar Todos ({generatedBatch.length})
                  </button>
                  <button className="btn-print-batch" onClick={handlePrint}>
                    Vista de Impresión
                  </button>
                </>
              )}
            </div>

            {generatedBatch.length > 0 && (
              <div className="batch-summary">
                <h4>Resumen del Lote</h4>
                <div className="summary-stats">
                  <div className="stat">
                    <span className="stat-label">Códigos generados:</span>
                    <span className="stat-value">{generatedBatch.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Tamaño:</span>
                    <span className="stat-value">{qrSize}px</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Plantilla:</span>
                    <span className="stat-value">{template}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {generatedBatch.length > 0 && (
            <div className="batch-preview">
              <h3>Vista Previa del Lote</h3>
              <div className="preview-grid">
                {generatedBatch.slice(0, 4).map(item => (
                  <div key={item.id} className="preview-item">
                    <img src={item.qrCode} alt="QR Code" className="preview-qr" />
                    <p className="preview-name">{item.data.itemName.substring(0, 15)}...</p>
                  </div>
                ))}
                {generatedBatch.length > 4 && (
                  <div className="preview-more">
                    +{generatedBatch.length - 4} más
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPrintView && generatedBatch.length > 0 && (
        <QRPrintSheet 
          qrItems={generatedBatch}
          onClose={() => setShowPrintView(false)}
          title={`Lote de ${generatedBatch.length} Códigos QR`}
          template={template}
          itemsPerPage={template === 'compact' ? 8 : 4}
        />
      )}
    </div>
  );
};

export default QRBatchGenerator;