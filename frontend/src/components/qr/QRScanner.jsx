import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './qr.css';

const QRScanner = ({ onScanComplete, onClose }) => {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [cameraId, setCameraId] = useState(null);
  const [availableCameras, setAvailableCameras] = useState([]);
  
  const scannerRef = useRef(null);
  const scanner = useRef(null);

  useEffect(() => {
    // Solicitar permisos de cámara y listar cámaras disponibles
    const getCameras = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        
        if (videoDevices.length > 0) {
          setCameraId(videoDevices[0].deviceId);
        }
      } catch (error) {
        console.error('Error getting cameras:', error);
        setScanError('No se pudo acceder a las cámaras');
      }
    };

    getCameras();
    
    return () => {
      if (scanner.current) {
        scanner.current.clear();
      }
    };
  }, []);

  const startScanner = () => {
    if (!cameraId) {
      setScanError('No hay cámaras disponibles');
      return;
    }

    if (scanner.current) {
      scanner.current.clear();
    }

    setScanResult(null);
    setScanError(null);
    setIsScanning(true);

    try {
      scanner.current = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: []
        },
        false
      );

      scanner.current.render(
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        (error) => {
          // Ignorar errores de escaneo frecuentes
          if (error !== 'QR code parse error, error = NotFoundException') {
            console.log('Scan error:', error);
          }
        }
      );
    } catch (error) {
      console.error('Scanner error:', error);
      setScanError('Error al iniciar el escáner');
      setIsScanning(false);
    }
  };

  const stopScanner = () => {
    if (scanner.current) {
      scanner.current.clear();
      scanner.current = null;
    }
    setIsScanning(false);
  };

  const handleScanSuccess = (decodedText) => {
    try {
      const parsedData = JSON.parse(decodedText);
      
      // Validar datos básicos
      if (!parsedData.itemId || !parsedData.itemName) {
        throw new Error('QR inválido: datos incompletos');
      }

      const newScanResult = {
        ...parsedData,
        scanTime: new Date().toLocaleTimeString(),
        scanDate: new Date().toLocaleDateString(),
        id: Date.now()
      };

      setScanResult(newScanResult);
      setScannedItems(prev => [newScanResult, ...prev]);
      
      if (onScanComplete) {
        onScanComplete(newScanResult);
      }

      // Detener escaneo temporalmente
      stopScanner();
      
      // Sonido de éxito
      playSuccessSound();

    } catch (error) {
      console.error('Error parsing QR data:', error);
      setScanError(`Error al leer código QR: ${error.message}`);
    }
  };

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.log('Audio context not supported');
    }
  };

  const handleCameraChange = (e) => {
    setCameraId(e.target.value);
    if (isScanning) {
      stopScanner();
      setTimeout(startScanner, 500);
    }
  };

  const handleRescan = () => {
    setScanResult(null);
    setScanError(null);
    startScanner();
  };

  const clearScannedItems = () => {
    if (window.confirm('¿Estás seguro de querer borrar todos los elementos escaneados?')) {
      setScannedItems([]);
    }
  };

  const exportScannedData = () => {
    if (scannedItems.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const csvContent = [
      ['ID', 'Nombre', 'Categoría', 'Cantidad', 'Precio', 'Ubicación', 'Fecha', 'Hora'],
      ...scannedItems.map(item => [
        item.itemId,
        `"${item.itemName}"`,
        item.category,
        item.quantity,
        item.price,
        item.location,
        item.scanDate,
        item.scanTime
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_escaneado_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="qr-scanner-container">
      <div className="scanner-header">
        <h2>Escáner de Códigos QR</h2>
        {onClose && (
          <button className="btn-close-scanner" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="scanner-content">
        <div className="scanner-controls">
          <div className="camera-selector">
            <label>Cámara:</label>
            <select 
              className="form-control"
              value={cameraId || ''}
              onChange={handleCameraChange}
              disabled={isScanning}
            >
              <option value="">Seleccionar cámara</option>
              {availableCameras.map(camera => (
                <option key={camera.deviceId} value={camera.deviceId}>
                  {camera.label || `Cámara ${availableCameras.indexOf(camera) + 1}`}
                </option>
              ))}
            </select>
          </div>

          <div className="scanner-actions">
            {!isScanning ? (
              <button 
                className="btn-start-scan"
                onClick={startScanner}
                disabled={!cameraId}
              >
                Iniciar Escaneo
              </button>
            ) : (
              <button 
                className="btn-stop-scan"
                onClick={stopScanner}
              >
                Detener Escaneo
              </button>
            )}
            
            <button 
              className="btn-export-scan"
              onClick={exportScannedData}
              disabled={scannedItems.length === 0}
            >
              Exportar Datos
            </button>
          </div>
        </div>

        <div className="scanner-view">
          <div id="qr-reader" className="qr-reader"></div>
          
          {!isScanning && !scanResult && (
            <div className="scanner-placeholder">
              <div className="placeholder-icon">📷</div>
              <h3>Listo para Escanear</h3>
              <p>Selecciona una cámara y haz clic en "Iniciar Escaneo"</p>
              <div className="scanner-guide">
                <p><strong>Consejos:</strong></p>
                <ul>
                  <li>Asegúrate de tener buena iluminación</li>
                  <li>Mantén el código QR estable frente a la cámara</li>
                  <li>Acerca la cámara si el código es pequeño</li>
                </ul>
              </div>
            </div>
          )}

          {scanError && (
            <div className="scan-error">
              <div className="error-icon">⚠️</div>
              <p>{scanError}</p>
              <button className="btn-retry" onClick={handleRescan}>
                Reintentar
              </button>
            </div>
          )}

          {scanResult && (
            <div className="scan-result">
              <div className="result-header">
                <h3>✅ Código QR Escaneado con Éxito</h3>
                <button className="btn-rescan" onClick={handleRescan}>
                  Escanear Otro
                </button>
              </div>
              
              <div className="result-details">
                <QRItemCard 
                  itemData={scanResult}
                  showScanInfo={true}
                />
              </div>
            </div>
          )}
        </div>

        {scannedItems.length > 0 && (
          <div className="scanned-items-section">
            <div className="scanned-header">
              <h3>Elementos Escaneados ({scannedItems.length})</h3>
              <button 
                className="btn-clear-scanned"
                onClick={clearScannedItems}
              >
                Limpiar Lista
              </button>
            </div>
            
            <div className="scanned-items-list">
              {scannedItems.map((item, index) => (
                <div key={item.id} className="scanned-item">
                  <span className="item-number">{index + 1}</span>
                  <span className="item-name">{item.itemName}</span>
                  <span className="item-time">{item.scanTime}</span>
                  <span className="item-status">✅</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;