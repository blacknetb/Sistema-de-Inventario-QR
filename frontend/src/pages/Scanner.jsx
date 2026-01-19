import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useInventory } from '../context/InventoryContext';
import '../assets/styles/pages/pages.css';

const Scanner = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { products, loading, scanProduct } = useInventory();
  
  const [scanning, setScanning] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [selectedCamera, setSelectedCamera] = useState('environment');
  const [scanMode, setScanMode] = useState('product'); // 'product', 'inventory', 'custom'
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scannerRef = useRef(null);

  // Cargar historial desde localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('scanHistory');
    if (savedHistory) {
      try {
        setScanHistory(JSON.parse(savedHistory).slice(0, 10));
      } catch (error) {
        console.error('Error loading scan history:', error);
      }
    }
  }, []);

  // Guardar historial en localStorage
  useEffect(() => {
    if (scanHistory.length > 0) {
      localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    }
  }, [scanHistory]);

  // Inicializar escáner
  const initializeScanner = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('La cámara no es compatible con este navegador');
      }

      const constraints = {
        video: {
          facingMode: selectedCamera,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        setScanning(true);
      }

      // Iniciar detección de códigos
      startCodeDetection();
      
      showNotification('success', 'Cámara activada', 'Escáner listo para usar');
    } catch (error) {
      console.error('Error al acceder a la cámara:', error);
      showNotification('error', 'Error de cámara', error.message);
      setCameraActive(false);
      setScanning(false);
    }
  };

  // Detener escáner
  const stopScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (scannerRef.current) {
      clearInterval(scannerRef.current);
      scannerRef.current = null;
    }
    
    setCameraActive(false);
    setScanning(false);
  };

  // Iniciar detección de códigos
  const startCodeDetection = () => {
    scannerRef.current = setInterval(() => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        detectQRCode();
      }
    }, 100); // Revisar cada 100ms
  };

  // Detectar código QR
  const detectQRCode = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (video.videoWidth && video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code) {
        handleScannedCode(code.data);
      }
    }
  };

  // Procesar código escaneado
  const handleScannedCode = async (data) => {
    if (processing || scannedData === data) return;
    
    setProcessing(true);
    setScannedData(data);
    
    // Agregar sonido de escaneo
    playScanSound();
    
    // Agregar al historial
    const scanEntry = {
      id: Date.now(),
      data,
      timestamp: new Date().toISOString(),
      mode: scanMode,
      success: false
    };
    
    setScanHistory(prev => [scanEntry, ...prev.slice(0, 9)]);
    
    try {
      // Procesar según el modo
      let result;
      switch (scanMode) {
        case 'product':
          result = await processProductScan(data);
          break;
        case 'inventory':
          result = await processInventoryScan(data);
          break;
        case 'custom':
          result = { data, type: 'custom', message: 'Código personalizado escaneado' };
          break;
        default:
          result = { data, type: 'unknown', message: 'Código escaneado' };
      }
      
      scanEntry.success = true;
      scanEntry.result = result;
      
      setScanResult(result);
      setShowResultModal(true);
      
      showNotification('success', 'Escaneo exitoso', `Código: ${data.substring(0, 30)}...`);
      
      // Detener escáner momentáneamente
      stopScanner();
      setTimeout(() => {
        if (scanning) {
          initializeScanner();
        }
      }, 2000);
      
    } catch (error) {
      scanEntry.error = error.message;
      showNotification('error', 'Error al procesar', error.message);
    } finally {
      setProcessing(false);
    }
  };

  // Procesar escaneo de producto
  const processProductScan = async (data) => {
    try {
      // Intentar analizar como JSON
      let productInfo;
      try {
        productInfo = JSON.parse(data);
      } catch {
        // Si no es JSON, buscar por SKU o ID
        productInfo = { sku: data };
      }

      // Buscar producto
      const product = products.find(p => 
        p.id === productInfo.id || 
        p.sku === productInfo.sku ||
        p.barcode === data
      );

      if (!product) {
        throw new Error('Producto no encontrado');
      }

      return {
        type: 'product',
        product,
        message: `Producto encontrado: ${product.name}`,
        actions: [
          { label: 'Ver detalles', action: () => navigate(`/products/${product.id}`) },
          { label: 'Ajustar inventario', action: () => navigate(`/inventory?product=${product.id}`) }
        ]
      };
    } catch (error) {
      throw new Error('No se pudo procesar el producto: ' + error.message);
    }
  };

  // Procesar escaneo de inventario
  const processInventoryScan = async (data) => {
    try {
      // Buscar producto para ajuste de inventario
      const product = products.find(p => 
        p.id === data || 
        p.sku === data ||
        p.barcode === data
      );

      if (!product) {
        throw new Error('Producto no encontrado en inventario');
      }

      // Aquí se implementaría la lógica de ajuste de inventario
      const adjustment = {
        productId: product.id,
        productName: product.name,
        currentQuantity: product.quantity,
        adjustment: 0,
        type: 'scan',
        timestamp: new Date().toISOString()
      };

      return {
        type: 'inventory',
        product,
        adjustment,
        message: `Inventario escaneado: ${product.name}`,
        actions: [
          { label: 'Agregar stock', action: () => handleInventoryAdjustment(product.id, 1) },
          { label: 'Reducir stock', action: () => handleInventoryAdjustment(product.id, -1) },
          { label: 'Ver historial', action: () => navigate(`/products/${product.id}?tab=inventory`) }
        ]
      };
    } catch (error) {
      throw new Error('Error en escaneo de inventario: ' + error.message);
    }
  };

  // Ajustar inventario
  const handleInventoryAdjustment = async (productId, adjustment) => {
    try {
      await scanProduct(productId, adjustment);
      showNotification('success', 'Inventario actualizado', 'El stock ha sido ajustado');
      setShowResultModal(false);
    } catch (error) {
      showNotification('error', 'Error', 'No se pudo ajustar el inventario');
    }
  };

  // Reproducir sonido de escaneo
  const playScanSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.warn('No se pudo reproducir sonido:', error);
    }
  };

  // Manejar entrada manual
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualInput.trim()) {
      handleScannedCode(manualInput.trim());
      setManualInput('');
      setShowManualInput(false);
    }
  };

  // Limpiar historial
  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('scanHistory');
    showNotification('info', 'Historial limpiado', 'El historial de escaneos ha sido eliminado');
  };

  // Copiar al portapapeles
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification('success', 'Copiado', 'Texto copiado al portapapeles');
    }).catch(err => {
      showNotification('error', 'Error', 'No se pudo copiar al portapapeles');
    });
  };

  // Alternar cámara
  const toggleCamera = () => {
    stopScanner();
    setSelectedCamera(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => {
      if (scanning) {
        initializeScanner();
      }
    }, 100);
  };

  // Efecto de limpieza
  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  // Simulación de jsQR para desarrollo
  const jsQR = (data, width, height) => {
    // En un entorno real, usarías la biblioteca jsQR
    // Esta es una simulación para desarrollo
    if (window.GLOBAL_CONFIG?.app?.debug) {
      const mockCodes = [
        '{"id": "1", "sku": "PROD001", "name": "Laptop Dell XPS 13"}',
        'PROD002',
        'INV-2024-001',
        'custom-scan-data'
      ];
      
      // Simular detección aleatoria en desarrollo
      if (Math.random() < 0.01) { // 1% de probabilidad
        const randomCode = mockCodes[Math.floor(Math.random() * mockCodes.length)];
        return { data: randomCode };
      }
    }
    return null;
  };

  return (
    <div className="scanner-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1 className="page-title">Escáner QR</h1>
          <p className="page-subtitle">
            Escanea códigos QR de productos para gestionar tu inventario
          </p>
        </div>
        
        <div className="header-right">
          <button 
            className={`scan-button ${scanning ? 'stop' : 'start'}`}
            onClick={() => {
              if (scanning) {
                stopScanner();
              } else {
                initializeScanner();
              }
            }}
            disabled={processing}
          >
            {scanning ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="6" y="6" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Detener escaneo
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 7V5C3 3.89543 3.89543 3 5 3H7M17 3H19C20.1046 3 21 3.89543 21 5V7M21 17V19C21 20.1046 20.1046 21 19 21H17M7 21H5C3.89543 21 3 20.1046 3 19V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Iniciar escaneo
              </>
            )}
          </button>
          
          <button 
            className="manual-input-button"
            onClick={() => setShowManualInput(!showManualInput)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Entrada manual
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div className="scanner-container">
        {/* Panel izquierdo: Vista de cámara */}
        <div className="camera-panel">
          <div className="camera-container">
            {cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="camera-feed"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="scanner-canvas" />
                
                {/* Overlay de escaneo */}
                <div className="scanner-overlay">
                  <div className="scan-frame">
                    <div className="frame-corner top-left"></div>
                    <div className="frame-corner top-right"></div>
                    <div className="frame-corner bottom-left"></div>
                    <div className="frame-corner bottom-right"></div>
                    <div className="scan-line"></div>
                  </div>
                  <div className="scan-instructions">
                    <p>Enfoca el código QR dentro del marco</p>
                    <p className="scan-hint">El escaneo es automático</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="camera-placeholder">
                <div className="placeholder-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3>Cámara inactiva</h3>
                <p>Haz clic en "Iniciar escaneo" para activar la cámara</p>
                <button 
                  className="primary-button"
                  onClick={initializeScanner}
                  disabled={processing}
                >
                  Activar cámara
                </button>
              </div>
            )}
          </div>

          {/* Controles de cámara */}
          <div className="camera-controls">
            <div className="control-group">
              <label>Modo de escaneo:</label>
              <div className="mode-selector">
                <button
                  className={`mode-button ${scanMode === 'product' ? 'active' : ''}`}
                  onClick={() => setScanMode('product')}
                >
                  <span className="mode-icon">📦</span>
                  <span>Productos</span>
                </button>
                <button
                  className={`mode-button ${scanMode === 'inventory' ? 'active' : ''}`}
                  onClick={() => setScanMode('inventory')}
                >
                  <span className="mode-icon">📋</span>
                  <span>Inventario</span>
                </button>
                <button
                  className={`mode-button ${scanMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setScanMode('custom')}
                >
                  <span className="mode-icon">🔲</span>
                  <span>Personalizado</span>
                </button>
              </div>
            </div>

            <div className="control-buttons">
              <button
                className="control-button"
                onClick={toggleCamera}
                disabled={!cameraActive}
                title="Cambiar cámara"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 17C14.2091 17 16 15.2091 16 13C16 10.7909 14.2091 9 12 9C9.79086 9 8 10.7909 8 13C8 15.2091 9.79086 17 12 17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {selectedCamera === 'environment' ? 'Frontal' : 'Trasera'}
              </button>
              
              <button
                className="control-button"
                onClick={() => {
                  if (scannedData) {
                    copyToClipboard(scannedData);
                  }
                }}
                disabled={!scannedData}
                title="Copiar último escaneo"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 15H4C2.89543 15 2 14.1046 2 13V4C2 2.89543 2.89543 2 4 2H13C14.1046 2 15 2.89543 15 4V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copiar
              </button>
              
              <button
                className="control-button danger"
                onClick={clearHistory}
                disabled={scanHistory.length === 0}
                title="Limpiar historial"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 3 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 3 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Limpiar
              </button>
            </div>
          </div>

          {/* Entrada manual */}
          {showManualInput && (
            <div className="manual-input-container">
              <form onSubmit={handleManualSubmit}>
                <div className="input-group">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Ingresa código manualmente..."
                    className="manual-input"
                    autoFocus
                  />
                  <button type="submit" className="submit-button" disabled={!manualInput.trim()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
                <div className="input-hint">
                  Presiona Enter o haz clic en la flecha para escanear
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Panel derecho: Historial y resultados */}
        <div className="results-panel">
          <div className="results-header">
            <h3>Historial de escaneos</h3>
            <span className="history-count">{scanHistory.length} registros</span>
          </div>
          
          <div className="history-list">
            {scanHistory.length > 0 ? (
              scanHistory.map((scan, index) => (
                <div key={scan.id} className={`history-item ${scan.success ? 'success' : 'error'}`}>
                  <div className="history-item-header">
                    <div className="history-icon">
                      {scan.success ? '✅' : '❌'}
                    </div>
                    <div className="history-info">
                      <div className="history-mode">
                        Modo: {scan.mode === 'product' ? 'Producto' : scan.mode === 'inventory' ? 'Inventario' : 'Personalizado'}
                      </div>
                      <div className="history-time">
                        {new Date(scan.timestamp).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </div>
                    </div>
                    <button
                      className="history-action"
                      onClick={() => copyToClipboard(scan.data)}
                      title="Copiar código"
                    >
                      📋
                    </button>
                  </div>
                  
                  <div className="history-data">
                    <div className="data-preview" title={scan.data}>
                      {scan.data.length > 50 ? scan.data.substring(0, 50) + '...' : scan.data}
                    </div>
                    
                    {scan.error && (
                      <div className="history-error">{scan.error}</div>
                    )}
                    
                    {scan.result && (
                      <div className="history-result">
                        <div className="result-type">{scan.result.type}</div>
                        <div className="result-message">{scan.result.message}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-history">
                <div className="empty-icon">📋</div>
                <p>No hay escaneos recientes</p>
                <p className="empty-hint">Los escaneos aparecerán aquí</p>
              </div>
            )}
          </div>
          
          {/* Estadísticas rápidas */}
          <div className="quick-stats">
            <div className="stat-item">
              <div className="stat-value">{scanHistory.filter(s => s.success).length}</div>
              <div className="stat-label">Exitosos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">{scanHistory.filter(s => !s.success).length}</div>
              <div className="stat-label">Fallidos</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">
                {scanHistory.length > 0 
                  ? Math.round((scanHistory.filter(s => s.success).length / scanHistory.length) * 100)
                  : 0
                }%
              </div>
              <div className="stat-label">Tasa éxito</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de resultados */}
      {showResultModal && scanResult && (
        <div className="modal-overlay">
          <div className="modal result-modal">
            <div className="modal-header">
              <h3>Resultado del escaneo</h3>
              <button className="modal-close" onClick={() => setShowResultModal(false)}>
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="result-header">
                <div className="result-icon">
                  {scanResult.type === 'product' ? '📦' : 
                   scanResult.type === 'inventory' ? '📋' : '🔲'}
                </div>
                <div className="result-title">
                  <h4>{scanResult.message}</h4>
                  <div className="result-subtitle">
                    Tipo: {scanResult.type} • {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
              
              <div className="result-details">
                {scanResult.product && (
                  <div className="product-info">
                    <div className="product-row">
                      <span className="label">Producto:</span>
                      <span className="value">{scanResult.product.name}</span>
                    </div>
                    <div className="product-row">
                      <span className="label">SKU:</span>
                      <span className="value">{scanResult.product.sku || 'N/A'}</span>
                    </div>
                    <div className="product-row">
                      <span className="label">Cantidad:</span>
                      <span className={`value ${scanResult.product.quantity <= scanResult.product.minStock ? 'warning' : ''}`}>
                        {scanResult.product.quantity} unidades
                      </span>
                    </div>
                    <div className="product-row">
                      <span className="label">Precio:</span>
                      <span className="value">${scanResult.product.price.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                
                <div className="scan-data">
                  <div className="data-label">Datos escaneados:</div>
                  <div className="data-content">
                    <pre>{JSON.stringify(scannedData, null, 2)}</pre>
                  </div>
                  <button
                    className="copy-data-button"
                    onClick={() => copyToClipboard(scannedData)}
                  >
                    📋 Copiar datos
                  </button>
                </div>
              </div>
              
              {scanResult.actions && scanResult.actions.length > 0 && (
                <div className="result-actions">
                  <h4>Acciones disponibles</h4>
                  <div className="action-buttons">
                    {scanResult.actions.map((action, index) => (
                      <button
                        key={index}
                        className="action-button"
                        onClick={() => {
                          action.action();
                          setShowResultModal(false);
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setShowResultModal(false)}>
                Cerrar
              </button>
              <button className="primary-button" onClick={() => {
                setShowResultModal(false);
                if (!scanning) {
                  initializeScanner();
                }
              }}>
                Continuar escaneo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {processing && (
        <div className="processing-overlay">
          <div className="processing-spinner"></div>
          <p>Procesando escaneo...</p>
        </div>
      )}

      {/* Instrucciones */}
      <div className="instructions">
        <h4>📋 Instrucciones de uso</h4>
        <ul>
          <li>Asegúrate de tener buena iluminación</li>
          <li>Enfoca el código QR dentro del marco azul</li>
          <li>Mantén el dispositivo estable durante el escaneo</li>
          <li>Usa la entrada manual si la cámara no funciona</li>
          <li>Revisa el historial para ver escaneos anteriores</li>
        </ul>
      </div>
    </div>
  );
};

export default Scanner;