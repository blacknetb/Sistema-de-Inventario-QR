import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import QRCodeDisplay from './QRCodeDisplay';
import QRItemCard from './QRItemCard';
import QRPrintSheet from './QRPrintSheet';
import { generateQRData, validateQRData, downloadQRCode } from './QRUtils';
import './qr.css';

const QRGenerator = ({ inventoryItems = [] }) => {
  const [formData, setFormData] = useState({
    itemId: '',
    itemName: '',
    category: '',
    quantity: 1,
    price: 0,
    location: 'Almacén Principal'
  });
  
  const [generatedQR, setGeneratedQR] = useState(null);
  const [qrHistory, setQrHistory] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPrintSheet, setShowPrintSheet] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [batchMode, setBatchMode] = useState(false);
  
  const qrCanvasRef = useRef(null);

  // Cargar historial desde localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('qrHistory');
    if (savedHistory) {
      try {
        setQrHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading QR history:', e);
      }
    }
  }, []);

  // Guardar historial en localStorage
  useEffect(() => {
    if (qrHistory.length > 0) {
      localStorage.setItem('qrHistory', JSON.stringify(qrHistory));
    }
  }, [qrHistory]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' || name === 'price' ? parseFloat(value) || 0 : value
    }));
  };

  const handleItemSelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const selectedItem = inventoryItems.find(item => item.id == selectedId);
      if (selectedItem) {
        setFormData({
          itemId: selectedItem.id,
          itemName: selectedItem.name,
          category: selectedItem.category,
          quantity: selectedItem.quantity,
          price: selectedItem.price,
          location: 'Almacén Principal'
        });
      }
    } else {
      setFormData({
        itemId: '',
        itemName: '',
        category: '',
        quantity: 1,
        price: 0,
        location: 'Almacén Principal'
      });
    }
  };

  const generateQRCode = async () => {
    if (!formData.itemName.trim()) {
      alert('Por favor ingresa un nombre para el producto');
      return;
    }

    setIsGenerating(true);
    
    try {
      const qrData = generateQRData(formData);
      const validation = validateQRData(qrData);
      
      if (!validation.isValid) {
        alert(`Error: ${validation.error}`);
        return;
      }

      // Generar código QR
      const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: '#2c3e50',
          light: '#ffffff'
        }
      });

      const newQR = {
        id: Date.now(),
        data: qrData,
        qrCode: qrCodeDataUrl,
        timestamp: new Date().toISOString(),
        type: 'single'
      };

      setGeneratedQR(newQR);
      setQrHistory(prev => [newQR, ...prev.slice(0, 49)]); // Mantener últimos 50

    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Error al generar el código QR');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBatchSelect = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  const generateBatchQRCodes = async () => {
    if (selectedItems.length === 0) {
      alert('Por favor selecciona al menos un producto');
      return;
    }

    setIsGenerating(true);
    
    try {
      const batchQRs = [];
      
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

          const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 300,
            margin: 2,
            color: {
              dark: '#2c3e50',
              light: '#ffffff'
            }
          });

          batchQRs.push({
            id: `${item.id}-${Date.now()}`,
            data: qrData,
            qrCode: qrCodeDataUrl,
            timestamp: new Date().toISOString(),
            type: 'batch'
          });
        }
      }

      setQrHistory(prev => [...batchQRs, ...prev]);
      setShowPrintSheet(true);
      
    } catch (error) {
      console.error('Error generating batch QR codes:', error);
      alert('Error al generar códigos QR en lote');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (generatedQR) {
      downloadQRCode(generatedQR.qrCode, `${formData.itemName}-qr.png`);
    }
  };

  const handlePrint = () => {
    setShowPrintSheet(true);
  };

  const clearQR = () => {
    setGeneratedQR(null);
  };

  const clearHistory = () => {
    if (window.confirm('¿Estás seguro de querer borrar todo el historial de QR?')) {
      setQrHistory([]);
      localStorage.removeItem('qrHistory');
    }
  };

  return (
    <div className="qr-generator-container">
      <div className="qr-generator-header">
        <h1>Generador de Códigos QR</h1>
        <p>Genera códigos QR para productos de inventario</p>
      </div>

      <div className="qr-generator-content">
        <div className="qr-controls-section">
          <div className="mode-toggle">
            <button 
              className={`mode-btn ${!batchMode ? 'active' : ''}`}
              onClick={() => setBatchMode(false)}
            >
              Generación Individual
            </button>
            <button 
              className={`mode-btn ${batchMode ? 'active' : ''}`}
              onClick={() => setBatchMode(true)}
            >
              Generación por Lote
            </button>
          </div>

          {!batchMode ? (
            <div className="qr-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Seleccionar Producto Existente</label>
                  <select 
                    className="form-control"
                    onChange={handleItemSelect}
                    value={formData.itemId}
                  >
                    <option value="">-- Seleccionar producto --</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} (ID: {item.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre del Producto *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    placeholder="Ej: Laptop Dell XPS 13"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Categoría</label>
                  <select
                    className="form-control"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Seleccionar categoría</option>
                    <option value="Electrónica">Electrónica</option>
                    <option value="Accesorios">Accesorios</option>
                    <option value="Oficina">Oficina</option>
                    <option value="Almacenamiento">Almacenamiento</option>
                    <option value="Redes">Redes</option>
                    <option value="Muebles">Muebles</option>
                    <option value="Herramientas">Herramientas</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cantidad</label>
                  <input
                    type="number"
                    className="form-control"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Precio ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div className="form-group">
                  <label>Ubicación</label>
                  <select
                    className="form-control"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                  >
                    <option value="Almacén Principal">Almacén Principal</option>
                    <option value="Almacén Secundario">Almacén Secundario</option>
                    <option value="Sala de Exhibición">Sala de Exhibición</option>
                    <option value="Bodega">Bodega</option>
                    <option value="Oficina">Oficina</option>
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  className="btn-generate"
                  onClick={generateQRCode}
                  disabled={isGenerating || !formData.itemName.trim()}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner"></span>
                      Generando...
                    </>
                  ) : 'Generar Código QR'}
                </button>
                
                {generatedQR && (
                  <>
                    <button className="btn-download" onClick={handleDownload}>
                      Descargar QR
                    </button>
                    <button className="btn-print" onClick={handlePrint}>
                      Imprimir
                    </button>
                    <button className="btn-clear" onClick={clearQR}>
                      Limpiar
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="batch-generator">
              <h3>Seleccionar Productos para Generar QR en Lote</h3>
              <div className="batch-items-grid">
                {inventoryItems.map(item => (
                  <div 
                    key={item.id} 
                    className={`batch-item-card ${selectedItems.includes(item.id) ? 'selected' : ''}`}
                    onClick={() => handleBatchSelect(item.id)}
                  >
                    <div className="batch-item-checkbox">
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleBatchSelect(item.id)}
                      />
                    </div>
                    <div className="batch-item-info">
                      <h4>{item.name}</h4>
                      <p><strong>Categoría:</strong> {item.category}</p>
                      <p><strong>Cantidad:</strong> {item.quantity}</p>
                      <p><strong>Precio:</strong> ${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="batch-actions">
                <button 
                  className="btn-generate-batch"
                  onClick={generateBatchQRCodes}
                  disabled={isGenerating || selectedItems.length === 0}
                >
                  {isGenerating ? (
                    <>
                      <span className="spinner"></span>
                      Generando {selectedItems.length} códigos QR...
                    </>
                  ) : `Generar ${selectedItems.length} Códigos QR`}
                </button>
                
                <button 
                  className="btn-clear-selection"
                  onClick={() => setSelectedItems([])}
                  disabled={selectedItems.length === 0}
                >
                  Limpiar Selección
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="qr-display-section">
          {!batchMode && generatedQR ? (
            <QRCodeDisplay 
              qrData={generatedQR.data}
              qrCode={generatedQR.qrCode}
              itemData={formData}
              onDownload={handleDownload}
              onPrint={handlePrint}
            />
          ) : !batchMode ? (
            <div className="qr-placeholder">
              <div className="placeholder-icon">📱</div>
              <h3>QR Code Preview</h3>
              <p>Complete el formulario y haga clic en "Generar Código QR" para ver el resultado</p>
              <div className="qr-simulation">
                <div className="qr-pattern">
                  <div className="qr-corner top-left"></div>
                  <div className="qr-corner top-right"></div>
                  <div className="qr-corner bottom-left"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="batch-preview">
              <h3>Vista Previa de Lote</h3>
              <p>Productos seleccionados: {selectedItems.length}</p>
              {selectedItems.length > 0 && (
                <div className="selected-items-preview">
                  {selectedItems.slice(0, 3).map(itemId => {
                    const item = inventoryItems.find(item => item.id == itemId);
                    return item ? (
                      <div key={item.id} className="preview-item">
                        <span className="item-badge">{item.name.substring(0, 15)}...</span>
                      </div>
                    ) : null;
                  })}
                  {selectedItems.length > 3 && (
                    <div className="preview-more">+{selectedItems.length - 3} más</div>
                  )}
                </div>
              )}
              <div className="batch-info">
                <p><strong>Instrucciones:</strong></p>
                <ul>
                  <li>Selecciona los productos de la lista</li>
                  <li>Cada producto generará un código QR único</li>
                  <li>Puedes imprimir todos los códigos en una hoja</li>
                  <li>Los códigos se guardarán en el historial</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="qr-history-section">
        <div className="history-header">
          <h3>Historial de Códigos QR Generados</h3>
          <button 
            className="btn-clear-history"
            onClick={clearHistory}
            disabled={qrHistory.length === 0}
          >
            Limpiar Historial
          </button>
        </div>
        
        {qrHistory.length > 0 ? (
          <div className="history-grid">
            {qrHistory.map(qr => (
              <QRItemCard 
                key={qr.id}
                qrItem={qr}
                onDownload={() => downloadQRCode(qr.qrCode, `${qr.data.itemName}-qr.png`)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-history">
            <p>No hay códigos QR en el historial</p>
          </div>
        )}
      </div>

      {showPrintSheet && generatedQR && (
        <QRPrintSheet 
          qrItems={batchMode ? qrHistory.filter(qr => qr.type === 'batch') : [generatedQR]}
          onClose={() => setShowPrintSheet(false)}
          title={batchMode ? "Códigos QR en Lote" : `QR: ${formData.itemName}`}
        />
      )}
    </div>
  );
};

export default QRGenerator;