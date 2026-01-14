import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { qrService } from '../../services/qrService';
import Card from '../common/Card';
import Button from '../common/Button';
import { useNotification } from '../../context/NotificationContext';
import { 
  FiCamera, 
  FiSearch, 
  FiX, 
  FiCheck, 
  FiAlertCircle, 
  FiRotateCw, 
  FiCameraOff, 
  FiInfo,
  FiLock,
  FiShield,
  FiAlertTriangle,
  FiRefreshCw
} from 'react-icons/fi';
import './assets/styles/index.css';

const useScanHistory = (maxItems = 10) => {
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('qr_scans');
      return saved ? JSON.parse(saved).slice(0, maxItems) : [];
    } catch {
      return [];
    }
  });

  const addToHistory = useCallback((scanData) => {
    const newItem = {
      ...scanData,
      scanned_at: new Date().toISOString(),
      id: Date.now(),
    };
    
    const newHistory = [newItem, ...history.slice(0, maxItems - 1)];
    setHistory(newHistory);
    
    try {
      localStorage.setItem('qr_scans', JSON.stringify(newHistory));
    } catch {
      console.warn('No se pudo guardar en localStorage');
    }
  }, [history, maxItems]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('qr_scans');
  }, []);

  return { history, addToHistory, clearHistory };
};

const QRScanner = () => {
  const { success, error } = useNotification();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  const scannerRef = useRef(null);
  const scanHistory = useScanHistory();

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
    setValidationStatus(null);
  }, []);

  const startScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        stopScanner();
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        if (err.name === 'NotAllowedError') {
          setCameraError('Permiso de cámara denegado');
        } else {
          setCameraError('Error accediendo a la cámara');
        }
        return;
      }

      setScanning(true);
      setScanResult(null);
      setCameraError(null);
      setValidationStatus('starting');

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        formatsToSupport: ['QR_CODE'],
      };

      const scanner = new Html5QrcodeScanner('qr-reader', config, false);
      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          setValidationStatus('processing');
          await handleScanResult(decodedText);
          scanner.clear().catch(() => {});
          setScanning(false);
          setValidationStatus(null);
        },
        (errorMessage) => {
          if (!errorMessage.includes('NotFoundException')) {
            console.warn('Scan error:', errorMessage);
          }
        }
      );

    } catch (err) {
      console.error('Error starting scanner:', err);
      setCameraError('Error iniciando el escáner');
      setScanning(false);
      setValidationStatus(null);
    }
  }, [stopScanner]);

  const handleScanResult = async (code) => {
    if (!code?.trim()) return;

    try {
      setLoading(true);
      setValidationStatus('validating');
      
      const response = await qrService.validateQR(code);
      
      if (response.success && response.data) {
        const result = response.data;
        setScanResult(result);
        setValidationStatus('valid');
        
        scanHistory.addToHistory({
          code: code,
          product: result.product,
          validated: true,
        });
        
        success('Código QR validado exitosamente');
      } else {
        setValidationStatus('invalid');
        error(response.message || 'Código QR inválido');
      }
    } catch (err) {
      console.error('Error scanning QR:', err);
      setValidationStatus('error');
      error('Error validando código QR');
    } finally {
      setLoading(false);
      setTimeout(() => setValidationStatus(null), 3000);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) {
      error('Ingresa un código QR');
      return;
    }
    
    await handleScanResult(manualCode.trim());
    setManualCode('');
  };

  const clearResult = () => {
    setScanResult(null);
    setValidationStatus(null);
  };

  const rescan = () => {
    clearResult();
    startScanner();
  };

  return (
    <div className="qr-scanner-container">
      <Card title="Escáner de Códigos QR">
        <div className="qr-scanner-content">
          <div className="qr-scanner-controls">
            <div className="qr-scanner-buttons">
              <Button
                variant={scanning ? 'danger' : 'primary'}
                onClick={scanning ? stopScanner : startScanner}
                startIcon={scanning ? <FiCameraOff /> : <FiCamera />}
                disabled={loading}
                className={scanning ? 'btn-stop-scan' : 'btn-start-scan'}
              >
                {scanning ? 'Detener' : 'Escanear'}
              </Button>
              
              {scanResult && (
                <Button
                  variant="outline"
                  onClick={rescan}
                  startIcon={<FiRefreshCw />}
                  className="btn-rescan"
                >
                  Nuevo Escaneo
                </Button>
              )}
            </div>
            
            <div className="qr-scanner-status">
              {validationStatus === 'starting' ? (
                <span className="status-starting">Iniciando...</span>
              ) : validationStatus === 'processing' ? (
                <span className="status-processing">Procesando...</span>
              ) : validationStatus === 'valid' ? (
                <span className="status-valid">✓ Válido</span>
              ) : validationStatus === 'invalid' ? (
                <span className="status-invalid">✗ Inválido</span>
              ) : scanning ? (
                <span className="status-scanning">Escaneando...</span>
              ) : cameraError ? (
                <span className="status-error">{cameraError}</span>
              ) : (
                <span className="status-ready">Listo para escanear</span>
              )}
            </div>
          </div>

          <div className="qr-scanner-area">
            <div id="qr-reader" className="qr-scanner-reader">
              {!scanning && !cameraError && !validationStatus && (
                <div className="qr-scanner-placeholder">
                  <FiLock className="qr-scanner-placeholder-icon" />
                  <p className="qr-scanner-placeholder-title">Escáner de QR</p>
                  <p className="qr-scanner-placeholder-description">
                    Escanea un código QR del sistema de inventario.
                  </p>
                </div>
              )}
              
              {cameraError && (
                <div className="qr-scanner-error">
                  <FiAlertCircle className="qr-scanner-error-icon" />
                  <p className="qr-scanner-error-message">{cameraError}</p>
                </div>
              )}
              
              {validationStatus === 'processing' && (
                <div className="qr-scanner-processing">
                  <div className="qr-scanner-spinner"></div>
                  <p className="qr-scanner-processing-text">Validando...</p>
                </div>
              )}
            </div>
            
            {scanning && (
              <div className="qr-scanner-hint">
                <FiInfo />
                Enfoca el código QR
              </div>
            )}
          </div>

          <div className="qr-scanner-manual">
            <div className="qr-scanner-manual-header">
              <FiShield className="qr-scanner-manual-icon" />
              <span>Ingreso manual</span>
            </div>
            <form onSubmit={handleManualSubmit} className="qr-scanner-form">
              <input
                type="text"
                className="qr-scanner-input"
                placeholder="Pega el código QR aquí..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                variant="outline"
                startIcon={<FiSearch />}
                loading={loading}
                disabled={!manualCode.trim()}
                className="btn-validate-manual"
              >
                Validar
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {scanHistory.history.length > 0 && !scanResult && (
        <Card title="Escaneos Recientes">
          <div className="qr-history">
            {scanHistory.history.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="qr-history-item"
                onClick={() => {
                  setManualCode(item.code);
                  handleScanResult(item.code);
                }}
              >
                <div className="qr-history-item-content">
                  <div className={`qr-history-status ${item.validated ? 'qr-history-status-valid' : 'qr-history-status-invalid'}`}></div>
                  <div className="qr-history-info">
                    <div className="qr-history-product">
                      {item.product?.name || 'Producto'}
                    </div>
                    <div className="qr-history-time">
                      {new Date(item.scanned_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <FiSearch className="qr-history-search-icon" />
              </div>
            ))}
            <div className="qr-history-clear">
              <Button
                variant="outline"
                size="small"
                onClick={scanHistory.clearHistory}
                className="btn-clear-history"
              >
                Limpiar Historial
              </Button>
            </div>
          </div>
        </Card>
      )}

      {scanResult && (
        <Card title="Información del Producto">
          <div className="qr-result">
            <div className="qr-result-success">
              <div className="qr-result-success-content">
                <FiShield className="qr-result-success-icon" />
                <div>
                  <h4>✓ QR Validado</h4>
                  <div className="qr-result-success-time">
                    Validado: {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="qr-result-details">
              <h3 className="qr-result-title">
                {scanResult.product?.name}
              </h3>
              
              <div className="qr-result-info">
                <div className="qr-result-info-item">
                  <div className="qr-result-label">SKU</div>
                  <div className="qr-result-sku">
                    {scanResult.product?.sku}
                  </div>
                </div>
                
                {scanResult.product?.description && (
                  <div className="qr-result-info-item">
                    <div className="qr-result-label">Descripción</div>
                    <div className="qr-result-description">
                      {scanResult.product.description}
                    </div>
                  </div>
                )}
                
                <div className="qr-result-grid">
                  {scanResult.product?.category_name && (
                    <div className="qr-result-info-item">
                      <div className="qr-result-label">Categoría</div>
                      <div className="qr-result-value">{scanResult.product.category_name}</div>
                    </div>
                  )}
                  
                  {scanResult.inventory?.current_stock !== undefined && (
                    <div className="qr-result-info-item">
                      <div className="qr-result-label">Stock</div>
                      <div className="qr-result-stock">
                        {scanResult.inventory.current_stock} {scanResult.inventory.unit}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="qr-result-actions">
              <div className="qr-result-buttons">
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/products/${scanResult.product?.id}`;
                  }}
                  className="btn-view-product"
                >
                  Ver Producto
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.href = `/inventory?product=${scanResult.product?.id}`;
                  }}
                  className="btn-view-inventory"
                >
                  Inventario
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default QRScanner;