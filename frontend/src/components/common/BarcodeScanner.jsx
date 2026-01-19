import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import '../../assets/styles/Common/common.css';

const BarcodeScanner = ({
    onScan,
    onError,
    continuous = false,
    videoConstraints = {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
    },
    scanDelay = 500,
    className = '',
    showScanner = true,
    showResult = true,
    showHistory = true,
    maxHistory = 10
}) => {
    const [isScanning, setIsScanning] = useState(false);
    const [scannedCodes, setScannedCodes] = useState([]);
    const [lastScan, setLastScan] = useState(null);
    const [error, setError] = useState(null);
    const [cameraDevices, setCameraDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState(null);
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Obtener dispositivos de cámara
    useEffect(() => {
        const getCameraDevices = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                setCameraDevices(videoDevices);
                
                if (videoDevices.length > 0 && !selectedDevice) {
                    setSelectedDevice(videoDevices[0].deviceId);
                }
            } catch (err) {
                console.error('Error getting camera devices:', err);
                setError('No se pudieron obtener los dispositivos de cámara');
            }
        };

        getCameraDevices();
    }, []);

    // Iniciar escáner
    const startScanner = async () => {
        try {
            setError(null);
            
            const constraints = {
                video: {
                    ...videoConstraints,
                    deviceId: selectedDevice ? { exact: selectedDevice } : undefined
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
            
            setIsScanning(true);
            
            // Iniciar intervalo de escaneo
            if (continuous) {
                scanIntervalRef.current = setInterval(scanFrame, scanDelay);
            }
        } catch (err) {
            console.error('Error starting scanner:', err);
            setError('No se pudo acceder a la cámara. Verifica los permisos.');
            if (onError) onError(err);
        }
    };

    // Detener escáner
    const stopScanner = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        
        setIsScanning(false);
    };

    // Escanear frame
    const scanFrame = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Configurar canvas con las dimensiones del video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Dibujar frame del video en el canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Obtener datos de la imagen
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

        // Aquí iría la lógica real de detección de códigos de barras
        // Por ahora, simulamos la detección
        simulateBarcodeDetection(imageData);
    };

    // Simular detección de código de barras (para demostración)
    const simulateBarcodeDetection = (imageData) => {
        // En un proyecto real, usarías una librería como QuaggaJS o jsQR
        // Esta es una simulación para demostración
        
        const mockBarcodes = [
            '123456789012',
            '987654321098',
            '456789123456',
            '789012345678'
        ];
        
        // 10% de chance de detectar un código (simulación)
        if (Math.random() < 0.1) {
            const randomBarcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
            handleBarcodeDetected(randomBarcode);
        }
    };

    // Manejar código detectado
    const handleBarcodeDetected = (barcode) => {
        const timestamp = new Date();
        const scanData = {
            code: barcode,
            timestamp: timestamp.toISOString(),
            time: timestamp.toLocaleTimeString(),
            date: timestamp.toLocaleDateString()
        };

        setLastScan(scanData);
        
        // Agregar al historial
        setScannedCodes(prev => {
            const newHistory = [scanData, ...prev];
            if (newHistory.length > maxHistory) {
                newHistory.pop();
            }
            return newHistory;
        });

        // Llamar callback
        if (onScan) {
            onScan(scanData);
        }

        // Si no es continuo, detener después de escanear
        if (!continuous) {
            stopScanner();
        }
    };

    // Escanear manualmente
    const handleManualScan = () => {
        if (!isScanning) {
            startScanner();
        } else {
            scanFrame();
        }
    };

    // Limpiar historial
    const clearHistory = () => {
        setScannedCodes([]);
        setLastScan(null);
    };

    // Copiar código al portapapeles
    const copyToClipboard = async (code) => {
        try {
            await navigator.clipboard.writeText(code);
            alert('Código copiado al portapapeles');
        } catch (err) {
            alert('Error al copiar el código');
        }
    };

    // Buscar producto por código
    const searchProduct = (code) => {
        // Aquí iría la lógica para buscar el producto en la base de datos
        window.location.href = `/products?search=${code}`;
    };

    return (
        <div className={`barcode-scanner ${className}`}>
            <div className="scanner-header">
                <h3>📷 Escáner de Códigos de Barras</h3>
                <div className="scanner-controls">
                    {!isScanning ? (
                        <button
                            className="btn btn-primary"
                            onClick={startScanner}
                            disabled={cameraDevices.length === 0}
                        >
                            <i className="fas fa-camera"></i>
                            Iniciar Escáner
                        </button>
                    ) : (
                        <button
                            className="btn btn-danger"
                            onClick={stopScanner}
                        >
                            <i className="fas fa-stop"></i>
                            Detener Escáner
                        </button>
                    )}
                    
                    <button
                        className="btn btn-outline"
                        onClick={handleManualScan}
                        disabled={!isScanning}
                    >
                        <i className="fas fa-search"></i>
                        Escanear Manualmente
                    </button>
                </div>
            </div>

            {/* Selector de cámara */}
            {cameraDevices.length > 0 && (
                <div className="camera-selector">
                    <label>Seleccionar cámara:</label>
                    <select
                        value={selectedDevice || ''}
                        onChange={(e) => setSelectedDevice(e.target.value)}
                        disabled={isScanning}
                    >
                        {cameraDevices.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                                {device.label || `Cámara ${device.deviceId.slice(0, 8)}`}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Mensaje de error */}
            {error && (
                <div className="scanner-error alert alert-danger">
                    <i className="fas fa-exclamation-circle"></i>
                    {error}
                </div>
            )}

            {/* Contenido principal */}
            <div className="scanner-content">
                {/* Video del escáner */}
                {showScanner && (
                    <div className="scanner-video-container">
                        <div className={`scanner-video ${isScanning ? 'active' : 'inactive'}`}>
                            {isScanning ? (
                                <>
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="scanner-video-element"
                                    />
                                    <div className="scanner-overlay">
                                        <div className="scanner-frame"></div>
                                        <div className="scanner-instructions">
                                            <i className="fas fa-arrows-alt-h"></i>
                                            <p>Mueve el código de barras dentro del marco</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="scanner-placeholder">
                                    <i className="fas fa-camera"></i>
                                    <p>Haz clic en "Iniciar Escáner" para comenzar</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="scanner-status">
                            <div className={`status-indicator ${isScanning ? 'scanning' : 'idle'}`}>
                                <span className="status-dot"></span>
                                <span className="status-text">
                                    {isScanning ? 'Escaneando...' : 'En espera'}
                                </span>
                            </div>
                            
                            <div className="scanner-stats">
                                <span className="stat-item">
                                    <i className="fas fa-history"></i>
                                    Escaneados: {scannedCodes.length}
                                </span>
                                <span className="stat-item">
                                    <i className="fas fa-bolt"></i>
                                    Modo: {continuous ? 'Continuo' : 'Manual'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Último escaneo */}
                {showResult && lastScan && (
                    <div className="scan-result">
                        <h4>Último Escaneo:</h4>
                        <div className="result-card">
                            <div className="result-code">
                                <span className="code-label">Código:</span>
                                <span className="code-value">{lastScan.code}</span>
                            </div>
                            
                            <div className="result-info">
                                <div className="info-item">
                                    <i className="fas fa-clock"></i>
                                    <span>{lastScan.time}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-calendar"></i>
                                    <span>{lastScan.date}</span>
                                </div>
                            </div>
                            
                            <div className="result-actions">
                                <button
                                    className="btn btn-sm btn-outline"
                                    onClick={() => copyToClipboard(lastScan.code)}
                                >
                                    <i className="fas fa-copy"></i>
                                    Copiar
                                </button>
                                
                                <button
                                    className="btn btn-sm btn-primary"
                                    onClick={() => searchProduct(lastScan.code)}
                                >
                                    <i className="fas fa-search"></i>
                                    Buscar Producto
                                </button>
                                
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={() => {
                                        // Agregar a inventario
                                        alert(`Producto ${lastScan.code} agregado al inventario`);
                                    }}
                                >
                                    <i className="fas fa-plus"></i>
                                    Agregar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Historial de escaneos */}
                {showHistory && scannedCodes.length > 0 && (
                    <div className="scan-history">
                        <div className="history-header">
                            <h4>Historial de Escaneos</h4>
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={clearHistory}
                            >
                                <i className="fas fa-trash"></i>
                                Limpiar
                            </button>
                        </div>
                        
                        <div className="history-list">
                            {scannedCodes.map((scan, index) => (
                                <div key={index} className="history-item">
                                    <div className="item-code">
                                        <span className="code-badge">{index + 1}</span>
                                        <span className="code-value">{scan.code}</span>
                                    </div>
                                    
                                    <div className="item-time">
                                        <i className="fas fa-clock"></i>
                                        {scan.time}
                                    </div>
                                    
                                    <div className="item-actions">
                                        <button
                                            className="btn-action"
                                            onClick={() => copyToClipboard(scan.code)}
                                            title="Copiar código"
                                        >
                                            <i className="fas fa-copy"></i>
                                        </button>
                                        
                                        <button
                                            className="btn-action"
                                            onClick={() => searchProduct(scan.code)}
                                            title="Buscar producto"
                                        >
                                            <i className="fas fa-search"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Información y ayuda */}
            <div className="scanner-info">
                <div className="info-section">
                    <h5>📋 Instrucciones:</h5>
                    <ul>
                        <li>Asegúrate de tener buena iluminación</li>
                        <li>Mantén el código de barras estable dentro del marco</li>
                        <li>Acerca la cámara lo suficiente para que el código sea legible</li>
                        <li>Evita reflejos y sombras sobre el código</li>
                    </ul>
                </div>
                
                <div className="info-section">
                    <h5>⚙️ Configuración:</h5>
                    <div className="settings-grid">
                        <div className="setting-item">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={continuous}
                                    onChange={(e) => {
                                        // Actualizar continuous
                                        if (isScanning) {
                                            stopScanner();
                                        }
                                    }}
                                />
                                Escaneo continuo
                            </label>
                        </div>
                        
                        <div className="setting-item">
                            <label>Retardo entre escaneos:</label>
                            <input
                                type="range"
                                min="100"
                                max="2000"
                                step="100"
                                value={scanDelay}
                                onChange={(e) => {
                                    // Actualizar scanDelay
                                    if (isScanning && scanIntervalRef.current) {
                                        clearInterval(scanIntervalRef.current);
                                        scanIntervalRef.current = setInterval(scanFrame, e.target.value);
                                    }
                                }}
                                disabled={!isScanning}
                            />
                            <span>{scanDelay}ms</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Canvas oculto para procesamiento */}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

BarcodeScanner.propTypes = {
    onScan: PropTypes.func.isRequired,
    onError: PropTypes.func,
    continuous: PropTypes.bool,
    videoConstraints: PropTypes.object,
    scanDelay: PropTypes.number,
    className: PropTypes.string,
    showScanner: PropTypes.bool,
    showResult: PropTypes.bool,
    showHistory: PropTypes.bool,
    maxHistory: PropTypes.number
};

export default BarcodeScanner;