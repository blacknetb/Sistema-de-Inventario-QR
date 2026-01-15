import React, { useState, useEffect, useRef } from 'react';
import '../../assets/styles/qr.css';

/**
 * Componente QRScanner - Escáner de códigos QR
 * Permite escanear códigos QR usando la cámara del dispositivo
 */
const QRScanner = ({ onScan, onClose, mode = 'camera' }) => {
    const [isScanning, setIsScanning] = useState(false);
    const [hasPermission, setHasPermission] = useState(null);
    const [scannedData, setScannedData] = useState(null);
    const [scanError, setScanError] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [cameraDevices, setCameraDevices] = useState([]);
    const [selectedCamera, setSelectedCamera] = useState('');
    const [isFlashOn, setIsFlashOn] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Datos de ejemplo para simulación
    const mockQRData = [
        { id: 1, sku: 'LP-DELL-XPS13', name: 'Laptop Dell XPS 13', stock: 25 },
        { id: 2, sku: 'PH-APPLE-IP15', name: 'iPhone 15 Pro', stock: 42 },
        { id: 3, sku: 'CH-ERGON-001', name: 'Silla Ergonómica', stock: 3 }
    ];

    useEffect(() => {
        if (mode === 'camera') {
            requestCameraPermission();
        }
        
        // Cargar historial de escaneos del localStorage
        const savedHistory = localStorage.getItem('qrScanHistory');
        if (savedHistory) {
            try {
                setScanHistory(JSON.parse(savedHistory));
            } catch (err) {
                console.error('Error al cargar historial:', err);
            }
        }
        
        return () => {
            stopScanning();
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [mode]);

    const requestCameraPermission = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameraDevices(videoDevices);
            
            if (videoDevices.length > 0) {
                setSelectedCamera(videoDevices[0].deviceId);
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment',
                    deviceId: selectedCamera ? { exact: selectedCamera } : undefined
                }
            });
            
            setHasPermission(true);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error('Error al acceder a la cámara:', err);
            setHasPermission(false);
            setScanError('No se pudo acceder a la cámara. Verifica los permisos.');
        }
    };

    const startScanning = () => {
        if (mode === 'camera' && !hasPermission) {
            requestCameraPermission();
            return;
        }
        
        setIsScanning(true);
        setScannedData(null);
        setScanError('');
        
        if (mode === 'camera') {
            // En una aplicación real, aquí se usaría una librería QR como jsQR
            // Por ahora, simulamos el escaneo
            simulateScanning();
        }
    };

    const stopScanning = () => {
        setIsScanning(false);
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const simulateScanning = () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
        }
        
        scanIntervalRef.current = setInterval(() => {
            // Simular detección aleatoria de QR
            if (Math.random() > 0.7) {
                const randomProduct = mockQRData[Math.floor(Math.random() * mockQRData.length)];
                handleScanComplete(randomProduct);
            }
        }, 1000);
    };

    const handleScanComplete = (data) => {
        if (!data) return;
        
        stopScanning();
        setScannedData(data);
        
        const scanRecord = {
            id: Date.now(),
            data: data,
            timestamp: new Date().toISOString(),
            type: 'scan'
        };
        
        const newHistory = [scanRecord, ...scanHistory.slice(0, 9)];
        setScanHistory(newHistory);
        
        // Guardar en localStorage
        try {
            localStorage.setItem('qrScanHistory', JSON.stringify(newHistory));
        } catch (err) {
            console.error('Error al guardar historial:', err);
        }
        
        if (onScan) {
            onScan(data);
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            setScanError('Por favor, selecciona un archivo de imagen válido');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            // Aquí se procesaría la imagen para extraer el QR
            // Por ahora, simulamos la extracción
            const randomProduct = mockQRData[Math.floor(Math.random() * mockQRData.length)];
            handleScanComplete(randomProduct);
        };
        reader.readAsDataURL(file);
    };

    const handleManualEntry = () => {
        const sku = prompt('Ingresa el SKU del producto:');
        if (!sku) return;
        
        // Buscar producto por SKU
        const product = mockQRData.find(p => p.sku === sku);
        if (product) {
            handleScanComplete(product);
        } else {
            // Si no existe, crear un registro temporal
            const tempProduct = {
                id: `temp-${Date.now()}`,
                sku: sku,
                name: 'Producto no encontrado',
                stock: 0,
                isTemporary: true
            };
            handleScanComplete(tempProduct);
        }
    };

    const handleCameraSwitch = async () => {
        if (!cameraDevices.length) return;
        
        const currentIndex = cameraDevices.findIndex(device => device.deviceId === selectedCamera);
        const nextIndex = (currentIndex + 1) % cameraDevices.length;
        const nextCamera = cameraDevices[nextIndex].deviceId;
        
        setSelectedCamera(nextCamera);
        stopScanning();
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: { exact: nextCamera }
                }
            });
            
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            
            if (isScanning) {
                startScanning();
            }
        } catch (err) {
            console.error('Error al cambiar cámara:', err);
            setScanError('No se pudo cambiar a la otra cámara');
        }
    };

    const toggleFlash = () => {
        if (!streamRef.current) return;
        
        const tracks = streamRef.current.getVideoTracks();
        if (tracks.length > 0) {
            const track = tracks[0];
            const capabilities = track.getCapabilities();
            
            if (capabilities.torch) {
                track.applyConstraints({
                    advanced: [{ torch: !isFlashOn }]
                }).then(() => {
                    setIsFlashOn(!isFlashOn);
                }).catch(err => {
                    console.error('Error al controlar el flash:', err);
                });
            }
        }
    };

    const clearHistory = () => {
        setScanHistory([]);
        localStorage.removeItem('qrScanHistory');
    };

    return (
        <div className="qr-scanner-container">
            <div className="scanner-header">
                <h2 className="scanner-title">
                    <i className="scanner-icon">📱</i>
                    Escáner de Códigos QR
                </h2>
                <p className="scanner-subtitle">
                    Escanea códigos QR para registrar movimientos de inventario
                </p>
            </div>

            <div className="scanner-content">
                <div className="scanner-left">
                    <div className="scanner-view">
                        {mode === 'camera' ? (
                            <>
                                <div className="camera-container">
                                    <video
                                        ref={videoRef}
                                        className="camera-video"
                                        autoPlay
                                        playsInline
                                        muted
                                    />
                                    
                                    {isScanning && (
                                        <div className="scan-overlay">
                                            <div className="scan-frame">
                                                <div className="scan-corner top-left"></div>
                                                <div className="scan-corner top-right"></div>
                                                <div className="scan-corner bottom-left"></div>
                                                <div className="scan-corner bottom-right"></div>
                                                <div className="scan-line"></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="camera-controls">
                                    <button
                                        className={`camera-btn ${isScanning ? 'active' : ''}`}
                                        onClick={isScanning ? stopScanning : startScanning}
                                    >
                                        <i className="btn-icon">
                                            {isScanning ? '⏸️' : '▶️'}
                                        </i>
                                        <span>{isScanning ? 'Detener' : 'Escanear'}</span>
                                    </button>
                                    
                                    {cameraDevices.length > 1 && (
                                        <button
                                            className="camera-btn"
                                            onClick={handleCameraSwitch}
                                            disabled={!isScanning}
                                        >
                                            <i className="btn-icon">🔄</i>
                                            <span>Cambiar Cámara</span>
                                        </button>
                                    )}
                                    
                                    <button
                                        className="camera-btn"
                                        onClick={toggleFlash}
                                        disabled={!isScanning}
                                    >
                                        <i className="btn-icon">
                                            {isFlashOn ? '💡' : '🔦'}
                                        </i>
                                        <span>{isFlashOn ? 'Apagar Flash' : 'Encender Flash'}</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="file-upload-area">
                                <div className="upload-box">
                                    <i className="upload-icon">📁</i>
                                    <p className="upload-text">
                                        Arrastra una imagen con código QR o haz clic para seleccionar
                                    </p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="file-input"
                                    />
                                    <button className="btn btn-primary">
                                        Seleccionar Archivo
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        {scanError && (
                            <div className="alert alert-error">
                                <i className="alert-icon">⚠️</i>
                                <span>{scanError}</span>
                            </div>
                        )}
                        
                        {hasPermission === false && (
                            <div className="permission-error">
                                <i className="error-icon">📵</i>
                                <h3>Permiso de cámara denegado</h3>
                                <p>
                                    Por favor, permite el acceso a la cámara en la configuración 
                                    de tu navegador para usar el escáner.
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={requestCameraPermission}
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="manual-entry-section">
                        <h3 className="section-title">Entrada Manual</h3>
                        <div className="manual-entry">
                            <input
                                type="text"
                                className="manual-input"
                                placeholder="Ingresa SKU o código de barras"
                            />
                            <button
                                className="btn btn-secondary"
                                onClick={handleManualEntry}
                            >
                                <i className="btn-icon">⌨️</i>
                                Buscar
                            </button>
                        </div>
                    </div>
                </div>

                <div className="scanner-right">
                    <div className="scan-results">
                        <h3 className="results-title">
                            <i className="results-icon">📋</i>
                            Resultados del Escaneo
                        </h3>
                        
                        {scannedData ? (
                            <div className="scan-result-card">
                                <div className="result-header">
                                    <span className="result-status success">
                                        <i className="status-icon">✅</i>
                                        Escaneo exitoso
                                    </span>
                                    <span className="result-time">
                                        {new Date().toLocaleTimeString()}
                                    </span>
                                </div>
                                
                                <div className="result-content">
                                    <h4 className="product-name">{scannedData.name}</h4>
                                    
                                    <div className="product-details">
                                        <div className="detail-item">
                                            <span className="detail-label">SKU:</span>
                                            <span className="detail-value">{scannedData.sku}</span>
                                        </div>
                                        
                                        <div className="detail-item">
                                            <span className="detail-label">Stock:</span>
                                            <span className={`detail-value ${scannedData.stock <= 5 ? 'warning' : ''}`}>
                                                {scannedData.stock} unidades
                                            </span>
                                        </div>
                                        
                                        {scannedData.price && (
                                            <div className="detail-item">
                                                <span className="detail-label">Precio:</span>
                                                <span className="detail-value">
                                                    ${parseFloat(scannedData.price).toFixed(2)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {scannedData.category && (
                                            <div className="detail-item">
                                                <span className="detail-label">Categoría:</span>
                                                <span className="detail-value">{scannedData.category}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="result-actions">
                                        <button className="btn btn-primary">
                                            <i className="btn-icon">📊</i>
                                            Ver Inventario
                                        </button>
                                        <button className="btn btn-secondary">
                                            <i className="btn-icon">✏️</i>
                                            Editar Producto
                                        </button>
                                        <button className="btn btn-success">
                                            <i className="btn-icon">📦</i>
                                            Registrar Movimiento
                                        </button>
                                    </div>
                                </div>
                                
                                {scannedData.isTemporary && (
                                    <div className="result-warning">
                                        <i className="warning-icon">⚠️</i>
                                        <span>Producto no encontrado en la base de datos</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="no-results">
                                <i className="no-results-icon">🔍</i>
                                <p>Escanea un código QR para ver los resultados</p>
                            </div>
                        )}
                    </div>

                    <div className="scan-history">
                        <div className="history-header">
                            <h3 className="history-title">
                                <i className="history-icon">📜</i>
                                Historial de Escaneos
                            </h3>
                            {scanHistory.length > 0 && (
                                <button
                                    className="btn btn-text"
                                    onClick={clearHistory}
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                        
                        {scanHistory.length === 0 ? (
                            <div className="empty-history">
                                <p>No hay escaneos recientes</p>
                            </div>
                        ) : (
                            <div className="history-list">
                                {scanHistory.map((record) => (
                                    <div key={record.id} className="history-item">
                                        <div className="history-item-header">
                                            <span className="history-time">
                                                {new Date(record.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className="history-type">QR Scan</span>
                                        </div>
                                        <div className="history-item-content">
                                            <strong>{record.data.name}</strong>
                                            <span className="history-sku">{record.data.sku}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="scanner-footer">
                <div className="scan-stats">
                    <div className="stat-item">
                        <span className="stat-label">Escaneos hoy:</span>
                        <span className="stat-value">{scanHistory.length}</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Último escaneo:</span>
                        <span className="stat-value">
                            {scanHistory.length > 0 
                                ? new Date(scanHistory[0].timestamp).toLocaleTimeString()
                                : 'N/A'
                            }
                        </span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-label">Modo:</span>
                        <span className="stat-value">{mode === 'camera' ? 'Cámara' : 'Archivo'}</span>
                    </div>
                </div>
                
                <div className="scanner-actions">
                    <button
                        className="btn btn-secondary"
                        onClick={() => mode === 'camera' ? startScanning() : {}}
                        disabled={isScanning}
                    >
                        <i className="btn-icon">🔁</i>
                        Nuevo Escaneo
                    </button>
                    
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (scannedData && onScan) {
                                onScan(scannedData);
                            }
                        }}
                        disabled={!scannedData}
                    >
                        <i className="btn-icon">✅</i>
                        Confirmar
                    </button>
                    
                    {onClose && (
                        <button
                            className="btn btn-danger"
                            onClick={onClose}
                        >
                            <i className="btn-icon">✕</i>
                            Cerrar
                        </button>
                    )}
                </div>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default QRScanner;